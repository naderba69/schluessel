#!/usr/bin/env python3
"""tools/dev/docs-sync.py — DECISIONS.md مصدر وحيد للتوثيق (D186 · قرار المالك 2026-10-18 على السؤال 3).

يقرأ كتل القرارات المهيكلة (D186 فما بعد) ويولّد منها:
  CHANGELOG.md   — ترويسة بشرية لكل دفعة (سطر «للقارئ» يكتبه الكاتب بيده داخل القرار) + البوابة
  PROGRESS.md    — الخلاصة + «التالي»
  docs/PROFESSIONAL_CONTINUATION_PROMPT_AR.md — رؤوس الإصدارات + سطر «الإصدار الحالي»
  STATE.md       — سطر «أين نحن» الأول
بين علامتي  <!-- docs-sync:start -->  و  <!-- docs-sync:end -->  فقط. ما قبل D186 تاريخ مجمَّد يُترك كما كُتب (لا يُعاد كتابة التاريخ).

شكل الكتلة المهيكلة في DECISIONS.md (كل سطر منها إلزامي — الاختبار يفرضه):
  ## D186 (2026-10-18): العنوان
  - **الدفعة:** 141 · **الموجّه:** 3.43
  - **للقارئ:** نصّ حرّ مقروء — يصبح متن CHANGELOG.
  - … بنود حرّة …
  - **البوابة:** vitest … · tsc … · validator … · build …
  - **التالي:** …

الاستعمال:  python3 tools/dev/docs-sync.py --check   (رمز خروج 1 إن اختلف المولَّد عن الملفات — تستعمله البوابة والاختبار)
            python3 tools/dev/docs-sync.py --write   (يكتب الأقسام المولَّدة)
            python3 tools/dev/docs-sync.py --json    (القرارات المهيكلة كما فُهمت)
"""
from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DECISIONS = ROOT / "DECISIONS.md"
TARGETS = {
    "changelog": ROOT / "CHANGELOG.md",
    "progress": ROOT / "PROGRESS.md",
    "prompt": ROOT / "docs/PROFESSIONAL_CONTINUATION_PROMPT_AR.md",
    "state": ROOT / "STATE.md",
}
FIRST_STRUCTURED = 186  # ما قبله تاريخ مجمَّد
START, END = "<!-- docs-sync:start -->", "<!-- docs-sync:end -->"
HEADING = re.compile(r"^## D(\d+) \((\d{4}-\d{2}-\d{2})\): (.+?)\s*$", re.M)
FIELD = re.compile(r"^- \*\*(الدفعة|للقارئ|البوابة|التالي|الموجّه)\:\*\* ?(.*)$", re.M)
META = re.compile(r"^- \*\*الدفعة:\*\* (\d+) · \*\*الموجّه:\*\* (\d+\.\d+)\s*$", re.M)


@dataclass
class Decision:
    d: int
    date: str
    title: str
    batch: int
    version: str
    reader: str
    gate: str
    next: str

    @property
    def id(self) -> str:
        return f"D{self.d}"


def parse(md: str) -> tuple[list[Decision], list[str]]:
    heads = list(HEADING.finditer(md))
    out: list[Decision] = []
    errors: list[str] = []
    for i, h in enumerate(heads):
        d = int(h.group(1))
        if d < FIRST_STRUCTURED:
            continue
        body = md[h.end(): heads[i + 1].start() if i + 1 < len(heads) else len(md)]
        meta = META.search(body)
        fields = {m.group(1): m.group(2).strip() for m in FIELD.finditer(body)}
        missing = [k for k in ("للقارئ", "البوابة", "التالي") if not fields.get(k)]
        if not meta or missing:
            errors.append(f"D{d}: " + ("بلا سطر «**الدفعة:** N · **الموجّه:** X»" if not meta else "") + (" ناقص: " + "، ".join(missing) if missing else ""))
            continue
        out.append(Decision(d, h.group(2), h.group(3).strip(), int(meta.group(1)), meta.group(2), fields["للقارئ"], fields["البوابة"], fields["التالي"]))
    # الأحدث أولاً في الملف — نتحقق من التتابع
    out.sort(key=lambda x: x.d)
    for a, b in zip(out, out[1:]):
        if b.batch != a.batch + 1:
            errors.append(f"{b.id}: الدفعة {b.batch} لا تلي {a.batch} ({a.id})")
        if tuple(map(int, b.version.split("."))) <= tuple(map(int, a.version.split("."))):
            errors.append(f"{b.id}: الموجّه {b.version} لا يزيد على {a.version} ({a.id})")
    return out, errors


def render(target: str, ds: list[Decision]) -> str:
    newest = sorted(ds, key=lambda x: -x.d)
    if target == "changelog":
        parts = ["> يُولَّد هذا القسم من `DECISIONS.md` (D186+) بـ`tools/dev/docs-sync.py` — سطر «للقارئ» يكتبه الكاتب بيده في القرار؛ ما تحت القسم تاريخ مجمَّد كُتب يدوياً.", ""]
        for x in newest:
            parts += [f"## {x.date} — الدفعة {x.batch}: {x.id} — {x.title}", x.reader, f"- **البوابة:** {x.gate}", ""]
        return "\n".join(parts).rstrip("\n")
    if target == "progress":
        parts = []
        for x in newest:
            parts += [f"## الدفعة {x.batch} ({x.date}) — {x.id}: {x.title}", f"- **الخلاصة:** {x.reader}", f"- **التالي:** {x.next}", ""]
        return "\n".join(parts).rstrip("\n")
    if target == "prompt":
        return "\n".join(f"### الإصدار {x.version} — {x.date} — يُرفع مع الدفعة {x.batch} · **{x.id} — {x.title}** — {x.reader}" for x in newest)
    if target == "prompt-current":
        x = newest[0]
        return f"**الإصدار الحالي:** {x.version} ({x.date} — الدفعة {x.batch}: **{x.id} — {x.title}** — **التالي: {x.next}**) — يُولَّد من DECISIONS.md."
    if target == "state":
        x = newest[0]
        return f"**آخر قرار:** {x.id} ({x.date}) · الدفعة {x.batch} · الموجّه {x.version} · **{x.title}** · **التالي:** {x.next} · البوابة: {x.gate}"
    raise KeyError(target)


def splice(text: str, body: str, tag: str = "") -> str:
    s, e = START.replace("docs-sync", f"docs-sync{tag}"), END.replace("docs-sync", f"docs-sync{tag}")
    i, j = text.find(s), text.find(e)
    if i < 0 or j < 0 or j < i:
        raise SystemExit(f"العلامتان {s} … {e} غير موجودتين أو مقلوبتان")
    return text[: i + len(s)] + "\n" + body + "\n" + text[j:]


def build(ds: list[Decision]) -> dict[Path, str]:
    out: dict[Path, str] = {}
    for key, path in TARGETS.items():
        text = path.read_text(encoding="utf-8")
        new = splice(text, render(key, ds))
        if key == "prompt":
            new = splice(new, render("prompt-current", ds), tag=":current")
        out[path] = new
    return out


def main(argv: list[str]) -> int:
    ds, errors = parse(DECISIONS.read_text(encoding="utf-8"))
    if "--json" in argv:
        print(json.dumps({"decisions": [asdict(x) for x in ds], "errors": errors}, ensure_ascii=False, indent=1))
        return 1 if errors else 0
    if errors:
        print("DECISIONS.md — كتل غير مهيكلة:\n  " + "\n  ".join(errors))
        return 1
    if not ds:
        print(f"لا قرار مهيكلاً بعد D{FIRST_STRUCTURED}")
        return 1
    changes = {p: n for p, n in build(ds).items() if n != p.read_text(encoding="utf-8")}
    if "--write" in argv:
        for p, n in changes.items():
            p.write_text(n, encoding="utf-8")
        print(f"docs-sync: كُتب {len(changes)} ملفاً من {ds[-1].id} (الدفعة {ds[-1].batch} · الموجّه {ds[-1].version})" if changes else "docs-sync: لا تغيير")
        return 0
    if changes:
        print("docs-sync --check: الأقسام المولَّدة غير محدَّثة في: " + "، ".join(p.name for p in changes) + " — شغّل --write")
        return 1
    print(f"docs-sync: محدَّث ({len(ds)} قراراً مهيكلاً · آخرها {ds[-1].id} · الدفعة {ds[-1].batch} · الموجّه {ds[-1].version})")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
