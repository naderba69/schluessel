#!/usr/bin/env python3
"""D565 (تتمة 3): الصيغ الخاطئة يجب ألا يعرفها الحارس جذرياً — geriten/gestriten مرفوضة (جذر gerit/gestrit معروف).
u1-d3: خطأ haben/sein (كلمات مدروسة) بلا إعلان · u1-d4: خطأ إملائي getstritten (d=1) · u2-d5: توحيد الإعلان."""
from __future__ import annotations
import json
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


def replace_in(obj, old: str, new: str, n: list[int], skip_why: bool = True) -> None:
    if isinstance(obj, dict):
        for k, v in obj.items():
            if skip_why and k == "why":
                continue
            if isinstance(v, str) and old in v:
                obj[k] = v.replace(old, new)
                n[0] += 1
            else:
                replace_in(v, old, new, n, skip_why)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            if isinstance(v, str) and old in v:
                obj[i] = v.replace(old, new)
                n[0] += 1
            else:
                replace_in(v, old, new, n, skip_why)


def do(lid: str, pairs: list[tuple[str, str]]) -> None:
    p = LESSONS / f"{lid}.json"
    L = load(p)
    for old, new in pairs:
        n = [0]
        replace_in(L, old, new, n)
        if n[0] == 0:
            errors.append(f"{lid}: لم يُعثر على «{old[:60]}»")
    save(p, L)


# u1-d3: خطأ haben/sein بدل الصيغة غير القابلة للإعلان
do("a2-u1-d3", [
    ("~~Ich habe am Strand geriten.~~", "~~Ich habe am Strand geritten.~~"),
])

# u1-d4: خطأ إملائي getstritten (d=1 من gestritten، وجذراهما مختلفان)
do("a2-u1-d4", [
    ("~~Gestern haben wir uns gestriten.~~", "~~Gestern haben wir uns getstritten.~~"),
    ("~~Wir haben uns gestreitet.~~", "~~Wir haben uns getstritten.~~"),
    ("gestritten أم ~~gestreitet~~؟", "gestritten أم ~~getstritten~~؟"),
    ("streiten قوي (streitet · stritt · gestritten — لا -t) وانعكاسي (sich)",
     "streiten قوي (streitet · stritt · gestritten) وانعكاسي (sich) — لا تكتبها بـ-t!"),
])

# u2-d5: الإعلان الحالي (geaufgemacht) — وحّد الشطب عليه
do("a2-u2-d5", [("~~geaufmacht~~ أم aufgemacht؟", "~~geaufgemacht~~ أم aufgemacht؟")])

# الخطة: تنظيف الإعلانات
plan = load(PLAN)
by_id = {e["lessonId"]: e for e in plan["lessons"]}
by_id["a2-u1-d3"]["misspellings"] = []
by_id["a2-u1-d4"]["misspellings"] = [{"wrong": "getstritten", "right": "gestritten"}]
save(PLAN, plan)

if errors:
    print("فشل:", *errors, sep="\n  ")
    sys.exit(1)
print("D565-3 اكتمل")
