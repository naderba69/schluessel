#!/usr/bin/env python3
# tools/phonemize.py — النطق كما سيقرؤه الصوت المثبَّت فعلاً (espeak-ng عبر Piper) — D102
# الاستخدام: python3 tools/phonemize.py "Fuß." "groß."   → JSON: [{"text": "Fuß.", "ipa": "fˈuːs."}, ...]
# الغرض: قياس لا افتراض — كشف مقاطع وُلّدت من رسم خاطئ (Fuss بدل Fuß = [fʊs] قصير بدل [fuːs] طويل).
import json
import sys
from pathlib import Path

from piper import PiperVoice

ROOT = Path(__file__).resolve().parent.parent
VOICE_ONNX = ROOT / "tools" / "piper-voices" / "de_DE-thorsten-medium.onnx"


def main() -> None:
    voice = PiperVoice.load(str(VOICE_ONNX))
    out = [{"text": t, "ipa": "".join("".join(s) for s in voice.phonemize(t))} for t in sys.argv[1:]]
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
