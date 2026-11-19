#!/usr/bin/env python3
"""D566: مولّد حوارات الدروس (التوصية 2 من المراجعة الشاملة) — يكتب content/audio-scripts/<id>.json
من جداول التأليف في tools/dev/dialogues/<level>.py. لا صوت هنا — التقسيم بـdialogue-splitter.
Usage: python3 tools/dev/dialogue-author.py [a2|b1|b2|a1]
"""
from __future__ import annotations
import importlib.util
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "content/audio-scripts"

LENGTH_SCALE = {"A1": 1.32, "A2": 1.32, "B1": 1.1, "B2": 1.1, "a1": 1.32, "a2": 1.32, "b1": 1.1, "b2": 1.1}


def slugify(s: str) -> str:
    s = s.lower()
    s = (s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss"))
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def write_level(level: str) -> int:
    spec = importlib.util.spec_from_file_location(f"dialogues_{level}", ROOT / "tools/dev/dialogues" / f"{level}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    n = 0
    for lid, ent in mod.DATA.items():
        sc_id = f"{lid}-{ent['slug']}"
        lines = []
        for i, (speaker, text, direction) in enumerate(ent["lines"], start=1):
            lines.append({"id": f"{lid.replace(chr(45), '')}-l{i}", "speaker": speaker, "text": text, "direction": direction})
        script = {
            "schemaVersion": "1.0.0",
            "id": sc_id,
            "kind": "dialogue",
            "level": ent["level"].upper(),
            "title": {"de": ent["title_de"], "ar": ent["title_ar"]},
            "usedIn": [lid],
            "lengthScale": LENGTH_SCALE[ent["level"]],
            "lines": lines,
        }
        p = OUT / f"{sc_id}.json"
        p.write_text(json.dumps(script, ensure_ascii=False, indent=2) + "\n")
        n += 1
    return n


if __name__ == "__main__":
    levels = sys.argv[1:] or ["a2", "b1", "b2", "a1"]
    total = 0
    for lv in levels:
        c = write_level(lv)
        print(f"{lv}: {c} حواراً")
        total += c
    print(f"الإجمالي: {total}")
