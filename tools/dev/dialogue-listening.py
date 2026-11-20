#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""D567 (قرار المالك 2026-11-20 — N-370): بنود استماع من أصوات الحوارات داخل الحصص.
لكل درس له حوار (kind=dialogue · usedIn يحوي الدرس) ومحطة استماع بلا بنود سطور الحوار:
تُضاف ثلاثة بنود «استمع: أي جملة سمعت؟» بمسارات الأسطر الحقيقية (a2u1d1-l1 …) —
الخيارات من نصوص الحوار نفسها (قانون الجبهة مضمون)، والإجابة هي السطر المسموع.

Usage: python3 tools/dev/dialogue-listening.py [--dry-run]
"""
from __future__ import annotations
import glob
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DRY = "--dry-run" in sys.argv

SPEAKER_AR = {
    "yusuf": "يوسف", "lena": "لينا", "ayse": "آيشة", "thomas": "توماس",
    "mueller": "مولر", "berg": "بيرغ", "schmidt": "شميت", "weber": "فيبر",
    "announcer": "المذيع",
}
Q = "استمع للحوار: أي جملة سمعت؟"


def main() -> int:
    scripts_by_lesson: dict[str, dict] = {}
    for f in sorted(glob.glob(str(ROOT / "content/audio-scripts/*.json"))):
        sc = json.load(open(f, encoding="utf-8"))
        if sc.get("kind") != "dialogue":
            continue
        for u in sc.get("usedIn", []):
            scripts_by_lesson.setdefault(u, sc)

    written = skipped = 0
    for f in sorted(glob.glob(str(ROOT / "content/lessons/*/*.json"))):
        lesson = json.load(open(f, encoding="utf-8"))
        lid = lesson["id"]
        sc = scripts_by_lesson.get(lid)
        if not sc:
            continue
        line_ids = {ln["id"] for ln in sc["lines"]}
        stations = lesson["uebung"]["stations"]
        listening = [st for st in stations if st["type"] == "listening"]
        if not listening:
            print(f"SKIP {lid}: بلا محطة استماع")
            skipped += 1
            continue
        st = listening[0]
        if any(str(it.get("audioId", "")) in line_ids for it in st["items"]):
            skipped += 1
            continue
        lines = sc["lines"]
        picks = [lines[0], lines[len(lines) // 2], lines[-1]]
        # unique by id
        seen: set[str] = set()
        uniq = []
        for ln in picks:
            if ln["id"] not in seen:
                seen.add(ln["id"])
                uniq.append(ln)
        picks = uniq
        new_items = []
        for k, ln in enumerate(picks):
            others = [x["text"] for x in lines if x["id"] != ln["id"] and x["text"] != ln["text"]]
            d1, d2 = others[k % len(others)], others[(k + 3) % len(others)]
            if d1 == d2:
                d2 = others[(k + 4) % len(others)]
            choices = [ln["text"], d1, d2]  # D146: الإجابة أول الخيارات (العرض يخلطها)
            sp = SPEAKER_AR.get(ln["speaker"], ln["speaker"])
            why = f"«{sp}» في الحوار: {ln.get('direction', 'جملة من الحوار')}"
            new_items.append({
                "audioId": ln["id"],
                "speakText": ln["text"],
                "q": Q,
                "choices": choices,
                "a": ln["text"],
                "why": why,
            })
        st["items"] = st["items"] + new_items
        if not DRY:
            with open(f, "w", encoding="utf-8") as fh:
                json.dump(lesson, fh, ensure_ascii=False, indent=2)
                fh.write("\n")
        written += 1
        print(f"{'DRY ' if DRY else ''}{lid}: +{len(new_items)} بنود استماع حوارية")
    print(f"written: {written} | skipped: {skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
