#!/usr/bin/env python3
# tools/dev/speech-rate.py — سرعة الكلام المقيسة لكل مسار (قرار المالك 2026-10-18 على N-015/N-101: «سكربت يقارن الطول
# الزمني بعدد الكلمات ويحسب الكلمات/الدقيقة آلياً ويُعلِّم ما يتجاوز 200 كلمة/دقيقة لمراجعتي»)
# القياس: wpm = عدد الكلمات في textDe ÷ (durationMs ÷ 60000) — من المانيفست وحده (لا يحتاج الصوت ولا Piper).
# حدّ معلن: durationMs يشمل الصمت في الطرفين فالقيمة أدنى قليلاً من السرعة الحقيقية داخل الجملة؛ والجمل القصيرة جداً
# (كلمة أو كلمتان) تُقاس بغير دقة فتُستثنى من العلامة افتراضياً (--min-words 3).
# الاستعمال:
#   python3 tools/dev/speech-rate.py                      ← الأسطر فوق 200 كلمة/دقيقة (للمراجعة بالأذن)
#   python3 tools/dev/speech-rate.py --threshold 180      ← حدّ آخر
#   python3 tools/dev/speech-rate.py --all                ← الجدول كاملاً مرتّباً تنازلياً
#   python3 tools/dev/speech-rate.py --json               ← {"threshold","minWords","measured","flagged":[…],"byRole":{…}}
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
MANIFEST = ROOT / "content/manifests/audio-manifest.a1-u1.json"
# كلمة = حرفان فأكثر (تهجئة الحروف «L, E, N, A» ليست كلمات)
WORD_RE = re.compile(r"[A-Za-zÄÖÜäöüß]{2,}(?:[-'][A-Za-zÄÖÜäöüß]+)*")


def measure(manifest_path: Path = MANIFEST):
    m = json.loads(manifest_path.read_text(encoding="utf-8"))
    rows = []
    for t in m["tracks"]:
        text = t.get("textDe") or ""
        words = WORD_RE.findall(text)
        dur = t.get("durationMs") or 0
        if not words or dur <= 0:
            continue
        rows.append({
            "id": t["id"],
            "role": t.get("role"),
            "characterId": t.get("characterId"),
            "speaker": (t.get("voiceParams") or {}).get("speaker"),
            "targetWpm": (t.get("voiceParams") or {}).get("speedWpm"),
            "words": len(words),
            "durationMs": dur,
            "wpm": round(len(words) * 60000 / dur, 1),
            "lessonRefs": t.get("lessonRefs") or [],
            "textDe": text,
        })
    return rows


def main(argv):
    threshold = 200.0
    min_words = 3
    if "--threshold" in argv:
        threshold = float(argv[argv.index("--threshold") + 1])
    if "--min-words" in argv:
        min_words = int(argv[argv.index("--min-words") + 1])
    rows = measure()
    rows.sort(key=lambda r: -r["wpm"])
    flagged = [r for r in rows if r["wpm"] > threshold and r["words"] >= min_words]
    by_role = {}
    for r in rows:
        b = by_role.setdefault(r["role"] or "?", {"tracks": 0, "sumWpm": 0.0, "max": 0.0})
        b["tracks"] += 1
        b["sumWpm"] += r["wpm"]
        b["max"] = max(b["max"], r["wpm"])
    for b in by_role.values():
        b["meanWpm"] = round(b.pop("sumWpm") / b["tracks"], 1)
    if "--json" in argv:
        print(json.dumps({"threshold": threshold, "minWords": min_words, "measured": len(rows), "flagged": flagged, "byRole": by_role}, ensure_ascii=False, indent=1))
        return 0
    show = rows if "--all" in argv else flagged
    print(f"المقيس: {len(rows)} مساراً · الحدّ {threshold:g} كلمة/دقيقة (≥{min_words} كلمات) · المعلَّم: {len(flagged)}")
    for role, b in sorted(by_role.items()):
        print(f"  {role}: {b['tracks']} مساراً · متوسط {b['meanWpm']} · أقصى {b['max']}")
    print()
    for r in show:
        mark = "⚑" if r in flagged else " "
        print(f"{mark} {r['wpm']:6.1f}  {r['id']:<22} {r['speaker'] or '':<20} {r['words']:>2} كلمة / {r['durationMs']/1000:.2f} ث  {r['lessonRefs'][0] if r['lessonRefs'] else ''}  «{r['textDe']}»")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
