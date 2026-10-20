#!/usr/bin/env python3
# tools/phonemize.py — النطق كما سيقرؤه الصوت المثبَّت فعلاً (espeak-ng عبر Piper) — D102 · D103
# الاستخدام:
#   python3 tools/phonemize.py "Fuß." "groß."            → [{"text": "Fuß.", "ipa": "fˈuːs."}, ...]  (thorsten)
#   python3 tools/phonemize.py --voice de_DE-kerstin-low "nicht"
#   python3 tools/phonemize.py --raw "Kurs."              → espeak الخام بلا معجم النطق (D121)
#   python3 tools/phonemize.py --lexicon-hits "Ich warte vor dem Kino."  → [{"text": …, "hits": ["vor"]}] (D122)
#   python3 tools/phonemize.py --coverage                 → تغطية كل نص ألماني في content/ لكل صوت مثبَّت
# الغرض: قياس لا افتراض — (1) كشف مقاطع وُلّدت من رسم خاطئ (Fuss = [fʊs]) · (2) كشف فونيمات لا تعرفها خريطة
# الصوت فيُسقطها Piper صامتاً (kerstin بلا U+0327 كان يقول «nict») — بعد طبقة fit_phonemes يجب أن يكون الغائب صفراً.
import importlib.util
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("gen_audio", ROOT / "tools" / "gen-audio.py")
ga = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ga)  # type: ignore[union-attr]


def content_texts() -> list[str]:
    """كل نص ألماني يُنطق أو قد يُنطق: الكلمات وجملها · أسطر السكربتات · نصوص المسارات · ملخصات الدروس."""
    texts: list[str] = []
    c = ROOT / "content"
    for f in sorted((c / "words").glob("*.json")):
        w = json.loads(f.read_text(encoding="utf-8"))
        texts.append(w["de"])
        if w.get("sampleSentence"):
            texts.append(w["sampleSentence"]["de"])
    for f in sorted((c / "audio-scripts").glob("*.json")):
        texts += [line["text"] for line in json.loads(f.read_text(encoding="utf-8"))["lines"]]
    manifest = json.loads((c / "manifests/audio-manifest.a1-u1.json").read_text(encoding="utf-8"))
    texts += [t["textDe"] for t in manifest["tracks"]]
    for f in sorted((c / "lessons").glob("*/*.json")):
        texts.append(json.loads(f.read_text(encoding="utf-8"))["zusammenfassung"]["summary"]["de"])
    return texts


def coverage() -> dict:
    texts = content_texts()
    report: dict = {"texts": len(texts), "voices": {}}
    for voice_id, onnx in ga.VOICES.items():
        voice = ga.load_phonemizer(onnx)
        id_map = voice.config.phoneme_id_map
        missing_raw: Counter = Counter()
        missing_fitted: Counter = Counter()
        fixed = 0
        for t in texts:
            for sent in voice.phonemize(t):
                missing_raw.update(p for p in sent if p not in id_map)
                # D121/D122: المعجم قبل الملاءمة كما في synth_phonemes — فرموز التصحيح تُفحص تغطيتها بعد ملاءمتها
                fitted, n = ga.fit_phonemes(ga.apply_lexicon(sent)[0], id_map)
                fixed += n
                missing_fitted.update(p for p in fitted if p not in id_map)
        report["voices"][voice_id] = {
            "symbols": len(id_map),
            "missingBeforeFit": {f"U+{ord(p):04X}": n for p, n in missing_raw.items()},
            "fixedByFit": fixed,
            "missingAfterFit": {f"U+{ord(p):04X}": n for p, n in missing_fitted.items()},
        }
    return report


def main() -> None:
    args = sys.argv[1:]
    if args[:1] == ["--coverage"]:
        print(json.dumps(coverage(), ensure_ascii=False))
        return
    raw = "--raw" in args  # D121: espeak الخام بلا معجم النطق — لقياس هل ما زال الخطأ قائماً
    hits = "--lexicon-hits" in args  # D122: أي كلمات المعجم يمسّها كل نص (من فونيمات espeak الخام نفسها)
    args = [a for a in args if a not in ("--raw", "--lexicon-hits")]
    voice_id = ga.VOICE_ID
    if args[:1] == ["--voice"]:
        voice_id, args = args[1], args[2:]
    voice = ga.load_phonemizer(ga.VOICES[voice_id])
    id_map = voice.config.phoneme_id_map
    out = []
    for t in args:
        if hits:  # على خرج espeak الخام — حيث يعمل المعجم فعلاً (synth_phonemes)
            out.append({"text": t, "hits": sorted({w for s in voice.phonemize(t) for w in ga.lexicon_hits(s)})})
            continue
        sents = [ga.fit_phonemes(s, id_map)[0] for s in voice.phonemize(t)] if raw else ga.synth_phonemes(voice, t)
        out.append({"text": t, "ipa": "".join("".join(s) for s in sents)})
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
