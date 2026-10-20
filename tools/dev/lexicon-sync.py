#!/usr/bin/env python3
"""lexicon-sync.py — مزامنة `regeneratedTracks` في tools/pronunciation-lexicon.json مع المانيفست (D197 · N-099)

كل مدخل معجم يجب أن يذكر كل مسار منشور يمسّ نصُّه كلمتَه (الاختبار tests/pronunciation-lexicon.test.ts يفرض المساواة).
قبل D197 كان هذا يدوياً بعد كل حوار جديد — ونسيانه يُسقط البوابة بعد التوليد لا قبله.

  python3 tools/dev/lexicon-sync.py --check   ← يطبع الناقص/الزائد ويخرج 1 إن وُجد شيء
  python3 tools/dev/lexicon-sync.py --write   ← يُلحق الناقص (لا يحذف شيئاً — الحذف قرار يدوي)

الإصابات تُحسب من فونيمات espeak الخام كما في gen-audio.lexicon_hits (المسار نفسه الذي يطبّق المعجم عند التوليد).
"""
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
_spec = importlib.util.spec_from_file_location("gen_audio", ROOT / "tools" / "gen-audio.py")
ga = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ga)  # type: ignore[union-attr]

LEXICON = ROOT / "tools" / "pronunciation-lexicon.json"


def track_hits() -> dict[str, set[str]]:
    """كلمة المعجم ← مجموعة معرّفات المسارات التي يمسّها نصها."""
    voice = ga.load_phonemizer(ga.VOICES[ga.VOICE_ID])
    by_text: dict[str, list[str]] = {}
    for mf in sorted((ROOT / "content" / "manifests").glob("audio-manifest*.json")):
        for t in json.loads(mf.read_text(encoding="utf-8"))["tracks"]:
            by_text.setdefault(t["textDe"], []).append(t["id"])
    out: dict[str, set[str]] = {}
    for text, ids in by_text.items():
        for s in voice.phonemize(text):
            for w in ga.lexicon_hits(s):
                out.setdefault(w, set()).update(ids)
    return out


def main() -> int:
    write = "--write" in sys.argv
    lex = json.loads(LEXICON.read_text(encoding="utf-8"))
    hits = track_hits()
    missing: list[tuple[str, list[str]]] = []
    extra: list[tuple[str, list[str]]] = []
    for e in lex["entries"]:
        have = set(e["regeneratedTracks"])
        want = hits.get(e["word"], set())
        if want - have:
            missing.append((e["word"], sorted(want - have)))
            if write:
                e["regeneratedTracks"].extend(sorted(want - have))
        if have - want:
            extra.append((e["word"], sorted(have - want)))
    if write and missing:
        LEXICON.write_text(json.dumps(lex, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for w, ids in missing:
        print(f"{'+' if write else '✗ ناقص'} {w}: {', '.join(ids)}")
    for w, ids in extra:
        print(f"⚠ زائد (مسار لا يمسّ الكلمة — يُحذف يدوياً إن صحّ): {w}: {', '.join(ids)}")
    n_m, n_x = sum(len(i) for _, i in missing), sum(len(i) for _, i in extra)
    if write:
        print(f"lexicon-sync: أُلحق {n_m} مساراً في {len(missing)} مدخلاً · زائد {n_x}")
        return 1 if n_x else 0
    print(f"lexicon-sync: {'متزامن' if not (n_m or n_x) else 'غير متزامن'} — ناقص {n_m} · زائد {n_x} · مدخلات {len(lex['entries'])}")
    return 1 if (n_m or n_x) else 0


if __name__ == "__main__":
    sys.exit(main())
