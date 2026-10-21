#!/usr/bin/env python3
"""tools/dev/content-index.py — فهرس الدروس الخفيف للقائمة (N-050 · D242).

القائمة ومسار التقدّم يحتاجان id/level/unit/day/zielAr فقط — لا الدروس الكاملة (2.9MB).
يُولَّد content/manifests/lesson-index.json من ملفات الدروس (المصدر الوحيد: content/lessons/*/*.json).

الاستعمال:  python3 tools/dev/content-index.py --check   (رمز خروج 1 إن اختلف المولَّد — تستعمله البوابة والاختبار)
            python3 tools/dev/content-index.py --write   (يكتب الفهرس)
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LESSONS = ROOT / "content/lessons"
OUT = ROOT / "content/manifests/lesson-index.json"
LEVEL_ORDER = {"A1": 0, "A2": 1, "B1": 2, "B2": 3}


def build() -> list[dict]:
    rows = []
    for f in sorted(LESSONS.glob("*/*.json")):
        l = json.loads(f.read_text(encoding="utf-8"))
        # wordIds: ترتيب أول تدريس (FIRST_TAUGHT) يُحسب من الفهرس وحده — دون تحميل الدروس
        rows.append({"id": l["id"], "level": l["level"], "unit": l["unit"], "day": l["day"], "zielAr": l["ziel"]["ar"], "wordIds": l["praesentation"]["wordIds"]})
    rows.sort(key=lambda r: (LEVEL_ORDER[r["level"]], r["unit"], r["day"]))
    return rows


def main() -> int:
    want = json.dumps(build(), ensure_ascii=False, indent=2) + "\n"
    if "--write" in sys.argv:
        OUT.write_text(want, encoding="utf-8")
        print(f"content-index: كُتب {OUT.relative_to(ROOT)} ({len(build())} درساً)")
        return 0
    if "--check" in sys.argv:
        if not OUT.exists():
            print("content-index: الفهرس غائب — شغّل --write")
            return 1
        if OUT.read_text(encoding="utf-8") != want:
            print("content-index: الفهرس غير محدَّث — شغّل --write")
            return 1
        print(f"content-index: محدَّث ({len(build())} درساً)")
        return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    sys.exit(main())
