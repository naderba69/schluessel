#!/usr/bin/env python3
"""tools/dev/notes.py — سجل ملاحظات المالك (§10 من الموجّه الاحترافي) بأداة مُلتزَمة بدل سكربتات docsNNN.py المتطايرة (D186).

القواعد التي تفرضها (هي نفسها قواعد tests/owner-notes.test.ts):
  - سطر الملاحظة: «- **N-###** · [حالة] · Dx، Dy · نصّ — المطلوب: …» (مفتوحة/بانتظار المالك) أو «… — أُغلقت: …» (مغلقة ← Dxxx)
  - المعرّفات متتابعة ولا تُحذف · كل D مذكور موجود عنواناً في DECISIONS.md (اكتب القرار أولاً ثم الملاحظة)
  - سطر «**العدد:**» يُعاد حسابه بعد كل عملية

الاستعمال:
  python3 tools/dev/notes.py list [--status open|owner|closed]
  python3 tools/dev/notes.py add  --source D186 --cat "المحتوى · الحارس" --title "عنوان" --body "نصّ" --need "المطلوب…" [--owner]
  python3 tools/dev/notes.py close N-103 --by D185 --text "سبب الإغلاق…"
  python3 tools/dev/notes.py recount
  python3 tools/dev/notes.py check
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PROMPT = ROOT / "docs/PROFESSIONAL_CONTINUATION_PROMPT_AR.md"
DECISIONS = ROOT / "DECISIONS.md"
START, END = "<!-- owner-notes:start -->", "<!-- owner-notes:end -->"
LINE = re.compile(r"^- \*\*N-(\d{3})\*\* · \[(مفتوحة|بانتظار المالك|مغلقة ← (D\d+))\] · (D\d+(?:، D\d+)*) · (.+)$")
COUNT = re.compile(r"\*\*العدد:\*\* بانتظار المالك \d+ · مفتوحة \d+ · مغلقة \d+ · المجموع \d+")
STATUS_ARG = {"open": "مفتوحة", "owner": "بانتظار المالك", "closed": "مغلقة"}


def decision_ids() -> set[str]:
    md = DECISIONS.read_text(encoding="utf-8")
    head = md[: re.search(r"^#{2,3} D\d+\b", md, re.M).start()]
    return {m.group(1) for m in re.finditer(r"^#{2,3} (D\d+)\b", md, re.M)} | {m.group(1) for m in re.finditer(r"\*\*(D\d+)\b", head)}


class Ledger:
    def __init__(self) -> None:
        self.text = PROMPT.read_text(encoding="utf-8")
        self.i, self.j = self.text.index(START) + len(START), self.text.index(END)
        self.section = self.text[self.i: self.j]

    def lines(self) -> list[tuple[int, re.Match[str]]]:
        out = []
        for k, l in enumerate(self.section.split("\n")):
            if l.startswith("- **N-"):
                m = LINE.match(l)
                if not m:
                    raise SystemExit(f"سطر مشوّه: {l[:80]}")
                out.append((k, m))
        return out

    def problems(self) -> list[str]:
        errs: list[str] = []
        ids = decision_ids()
        ns = [int(m.group(1)) for _, m in self.lines()]
        if ns != list(range(1, len(ns) + 1)):
            errs.append("المعرّفات ليست متتابعة من N-001")
        for _, m in self.lines():
            refs = m.group(4).split("، ") + ([m.group(3)] if m.group(3) else [])
            for d in refs:
                if d not in ids:
                    errs.append(f"N-{m.group(1)}: {d} ليس عنواناً في DECISIONS.md")
            closed = bool(m.group(3))
            if closed and "— أُغلقت:" not in m.group(5):
                errs.append(f"N-{m.group(1)}: مغلقة بلا «— أُغلقت:»")
            if not closed and "— المطلوب:" not in m.group(5):
                errs.append(f"N-{m.group(1)}: غير مغلقة بلا «— المطلوب:»")
        if self.count_line() != COUNT.search(self.section).group(0):
            errs.append("سطر العدد لا يطابق — شغّل recount")
        return errs

    def count_line(self) -> str:
        ls = self.lines()
        own = sum(1 for _, m in ls if m.group(2) == "بانتظار المالك")
        op = sum(1 for _, m in ls if m.group(2) == "مفتوحة")
        cl = sum(1 for _, m in ls if m.group(3))
        return f"**العدد:** بانتظار المالك {own} · مفتوحة {op} · مغلقة {cl} · المجموع {len(ls)}"

    def recount(self) -> None:
        self.section = COUNT.sub(self.count_line(), self.section, count=1)

    def save(self) -> None:
        self.recount()
        errs = self.problems()
        if errs:
            raise SystemExit("لن أكتب — مخالفات:\n  " + "\n  ".join(errs))
        PROMPT.write_text(self.text[: self.i] + self.section + self.text[self.j:], encoding="utf-8")

    # --- العمليات ---
    def close(self, n: str, by: str, text: str) -> str:
        rows = self.section.split("\n")
        for k, m in self.lines():
            if f"N-{m.group(1)}" == n:
                if m.group(3):
                    raise SystemExit(f"{n} مغلقة أصلاً ← {m.group(3)}")
                rows[k] = f"- **{n}** · [مغلقة ← {by}] · {m.group(4)}، {by} · {m.group(5)} — أُغلقت: {text.strip()}"
                self.section = "\n".join(rows)
                return rows[k]
        raise SystemExit(f"{n} غير موجودة")

    def add(self, source: str, cat: str, title: str, body: str, need: str, owner: bool) -> str:
        ls = self.lines()
        n = len(ls) + 1
        status = "بانتظار المالك" if owner else "مفتوحة"
        line = f"- **N-{n:03d}** · [{status}] · {source} · ({cat}) **{title}** — {body.strip()} — المطلوب: {need.strip()}"
        rows = self.section.split("\n")
        rows.insert(ls[-1][0] + 1, line)
        self.section = "\n".join(rows)
        return line


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("list"); p.add_argument("--status", choices=STATUS_ARG)
    p = sub.add_parser("add")
    for a in ("--source", "--cat", "--title", "--body", "--need"):
        p.add_argument(a, required=True)
    p.add_argument("--owner", action="store_true", help="الحالة «بانتظار المالك» بدل «مفتوحة»")
    p = sub.add_parser("close"); p.add_argument("note"); p.add_argument("--by", required=True); p.add_argument("--text", required=True)
    sub.add_parser("recount"); sub.add_parser("check")
    a = ap.parse_args()
    led = Ledger()
    if a.cmd == "list":
        want = STATUS_ARG.get(a.status) if a.status else None
        for _, m in led.lines():
            st = "مغلقة" if m.group(3) else m.group(2)
            if want and st != want:
                continue
            print(f"N-{m.group(1)} [{m.group(2)}] {m.group(5)[:90]}")
        print(led.count_line())
        return 0
    if a.cmd == "check":
        errs = led.problems()
        print("\n".join(errs) if errs else "notes: سليم · " + led.count_line())
        return 1 if errs else 0
    if a.cmd == "close":
        print(led.close(a.note, a.by, a.text)[:160])
    elif a.cmd == "add":
        print(led.add(a.source, a.cat, a.title, a.body, a.need, a.owner)[:160])
    led.save()
    print(led.count_line())
    return 0


if __name__ == "__main__":
    sys.exit(main())
