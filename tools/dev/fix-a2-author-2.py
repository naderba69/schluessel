#!/usr/bin/env python3
"""D565 (تتمة): تطبيع الشطب المزدوج · إعلانات ناقصة · ضربة على «ge/ver/...» داخل النصوص العربية ·
إصلاحات مصاغة ذاتياً (zweite) · خيارات كويز · شطب الصيغ الخاطئة في أسئلة المصائد."""
from __future__ import annotations
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LESSONS = ROOT / "content/lessons/a2"
PLAN = ROOT / "content/upgrades/a2-lesson-upgrade.json"
errors: list[str] = []


def load(p: Path):
    return json.loads(p.read_text())


def save(p: Path, d) -> None:
    p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n")


def apply(obj, fn, skip_why: bool = True) -> None:
    if isinstance(obj, dict):
        for k, v in obj.items():
            if skip_why and k == "why":
                continue
            if isinstance(v, str):
                obj[k] = fn(v)
            else:
                apply(v, fn, skip_why)
    elif isinstance(o := obj, list):
        for i, v in enumerate(o):
            if isinstance(v, str):
                o[i] = fn(v)
            else:
                apply(v, fn, skip_why)


# ---------- 1) تطبيع الشطب المزدوج + إعلانات ناقصة ----------
for lid in ("a2-u1-d3", "a2-u2-d3", "a2-u2-d4", "a2-u2-d5"):
    p = LESSONS / f"{lid}.json"
    L = load(p)
    apply(L, lambda s: s.replace("~~~~", "~~"))
    save(p, L)

plan = load(PLAN)
by_id = {e["lessonId"]: e for e in plan["lessons"]}
by_id["a2-u1-d2"]["misspellings"].append({"wrong": "gewegegangen", "right": "weggegangen"})
by_id["a2-u1-d4"]["misspellings"].append({"wrong": "gestreitet", "right": "gestritten"})

# ---------- 2) شطب الصيغ الخاطئة في أسئلة تمرين المصائد («X أم Y؟») ----------
STRIKE = {
    "a2-u1-d4": ["gestreitet"],
    "a2-u2-d3": ["gebeantwortet"],
    "a2-u2-d4": ["geversucht"],
    "a2-u2-d5": ["geaufmacht"],
    "a2-u2-d6": ["geversucht"],
}
for lid, wrongs in STRIKE.items():
    p = LESSONS / f"{lid}.json"
    L = load(p)

    def strike_q(s: str, wrongs=wrongs) -> str:
        for w in wrongs:
            s = re.sub(r"(?<!~)\b" + w + r"\b(?!~)", "~~" + w + "~~", s)
        return s

    for wc in L.get("zusammenfassung", {}).get("warningCards", []) + L.get("warningCards", []):
        ex = wc.get("exercise")
        if isinstance(ex, dict):
            apply(ex, strike_q)
    save(p, L)

# ---------- 2.5) مرحلة أولى: صيغ «بـge» والمركّبات لا تمسّها المطابقة الحدودية ----------
PRE = [
    ("ge في المنتصف (weg-ge-gangen)", "البادئة في المنتصف (مثل angemacht)"),
    ("ضع ge في موضعها: weg___gegangen · ver___schoben",
     "ضع البادئة في موضعها: المنفصل في المنتصف · الملتصق في الأول"),
    ("(be-/ver-/er-)", "(بادئات ملتصقة)"),
    ("بـge", "البادئة"),
]
for p in sorted(LESSONS.glob("*.json")):
    L = load(p)
    for old, new in PRE:
        apply(L, lambda s, o=old, n=new: s.replace(o, n))
    save(p, L)

# ---------- 3) نصوص عربية: معدن ألماني ← عربي ----------
AR_MAP = {
    "ge": "البادئة",
    "ver": "البادئة الملتصقة",
    "be": "البادئة الملتصقة",
    "er": "البادئة الملتصقة",
    "ii": "الثاني",
    "perfekt": "الماضي التام",
    "partizip": "التصريف",
    "trennbar": "المنفصل",
    "reflexiv": "الانعكاسي",
    "system": "النظام",
    "verb": "الفعل",
}
AR_RE = re.compile(r"\b(" + "|".join(AR_MAP) + r")\b", re.I)
ARABIC = re.compile(r"[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]")


def fix_ar(s: str) -> str:
    if ARABIC.search(s):
        s = AR_RE.sub(lambda m: AR_MAP[m.group(1).lower()], s)
    return s


for p in sorted(LESSONS.glob("*.json")):
    L = load(p)
    save(p, L) if False else None
    apply(L, fix_ar)
    save(p, L)

# ---------- 4) إصلاحات مصاغة ذاتياً/متبقية (exact) ----------
EXACT = {
    "a2-u2-d1": [("— das zweite Wort kommt ans Ende, nie zu.", "— das Wort kommt ans Ende, nie zu.")],
    "a2-u2-d2": [
        ("— und das zweite Wort kommt ans Ende.", "— und das Wort kommt ans Ende."),
        ("· das zweite Wort am Ende ·", "· das Wort am Ende ·"),
    ],
    "a2-u2-d3": [("beantwortet (ohne ge-)", "beantwortet")],
    "a2-u2-d4": [
        ("versucht (ohne ge-)", "versucht"),
        ("Eine formelle E-Mail schreiben", "Eine E-Mail an den Chef schreiben"),
    ],
    "a2-u2-d6": [("beantwortet/versucht (ohne ge-).", "beantwortet/versucht.")],
}
for lid, pairs in EXACT.items():
    p = LESSONS / f"{lid}.json"
    L = load(p)
    for old, new in pairs:
        n = [0]

        def go(o, old=old, new=new, n=n):
            if isinstance(o, dict):
                for k, v in o.items():
                    if k == "why":
                        continue
                    if isinstance(v, str) and old in v:
                        o[k] = v.replace(old, new)
                        n[0] += 1
                    else:
                        go(v)
            elif isinstance(o, list):
                for i, v in enumerate(o):
                    if isinstance(v, str) and old in v:
                        o[i] = v.replace(old, new)
                        n[0] += 1
                    else:
                        go(v)

        go(L)
        if n[0] == 0 and old != new and old not in json.dumps(L, ensure_ascii=False) and new in json.dumps(L, ensure_ascii=False):
            pass  # مُصلَّح مسبقاً
        elif n[0] == 0 and old != new:
            errors.append(f"{lid}: لم يُعثر على «{old[:50]}»")
    save(p, L)

# ---------- 5) كويز u3-d1: خيارات مدروسة ----------
p = LESSONS / "a2-u3-d1.json"
L = load(p)
for v in L["quiz"]["variants"]:
    for it in v["items"]:
        if it.get("a") == "der Magen" and isinstance(it.get("choices"), list):
            it["choices"] = ["der Magen", "der Tisch", "der Stuhl"]
save(p, L)

# الخطة (misspellings الجديدة)
save(PLAN, plan)

if errors:
    print("فشل:", *errors, sep="\n  ")
    sys.exit(1)
print("D565-2 اكتمل: شطب مُطبَّع · إعلانان جديدان · معدن عربي نظيف · zweite مصلَّح · كويز")
