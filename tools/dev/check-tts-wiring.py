# check-tts-wiring.py — N-014 (D230): ‏tts()‎ يجب أن يمرّر التنغيم عبر ‏synth_phonemes‎ ثم يعيد السلوك الأصلي.
# حتمي: الصوت مزيّف (mock) ولا يُقاس أي صوت — المُختبَر التوصيل وحده (VITS غير الحتمي خارج الصورة).
import importlib.util
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent.parent
spec = importlib.util.spec_from_file_location("genaudio", ROOT / "tools/gen-audio.py")
genaudio = importlib.util.module_from_spec(spec)
spec.loader.exec_module(genaudio)

calls: dict = {}


class FakeVoice:
    """صوت مزيّف: synthesize يستدعي phonemize كما يفعل Piper الحقيقي ثم يبث مقطعاً صامتاً."""

    config = None

    def synthesize(self, text, config=None):
        phonemes = self.phonemize(text)  # noqa: F841 — المهم الاستدعاء لا القيمة
        calls["phonemize_arg"] = text

        class Chunk:
            sample_rate = 22050
            sample_width = 2
            sample_channels = 1
            audio_int16_bytes = b"\0" * 100

        yield Chunk()


fake = FakeVoice()
real_original = genaudio.PiperVoice.phonemize


def spy(voice, text, phonemize=None):
    calls["synth"] = (voice is fake, text, phonemize is real_original)
    return [["h", "a"]]  # فونيمات وهمية — لا تصل نموذجاً أبداً


with (
    patch.object(genaudio, "load_voice", return_value=fake),
    patch.object(genaudio, "synth_phonemes", side_effect=spy),
):
    with tempfile.TemporaryDirectory() as td:
        genaudio.tts("Hallo.", Path(td) / "x.wav")

assert calls.get("synth") == (True, "Hallo.", True), f"tts لم يمرّر عبر synth_phonemes: {calls}"
assert not hasattr(fake, "phonemize"), "tts لم يُعد السلوك الأصلي (finally)"
print("tts-wiring OK: phonemize عبر synth_phonemes + استعادة في finally")
