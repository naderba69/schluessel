#!/usr/bin/env python3
# tools/gen-audio.py — توليد الصوت محلياً بـPiper (D20: لا API، لا اشتراك) + قياسات حقيقية
# يستعمل: python3 tools/gen-audio.py all            → كل ملفات المحتوى + المانيفست + محفّزات ASR
#          python3 tools/gen-audio.py one "نص" out.opus → مقطع واحد (لاختبار استقرار الصوت)
#          python3 tools/gen-audio.py voice-for lena     → أي صوت سيُستخدم فعلاً (D100: kerstin أو fallback صريح)
#          python3 tools/gen-audio.py one-as lena "نص" out.opus → مقطع حوار بصوت الشخصية + الصوت الفعلي
#          python3 tools/gen-audio.py one-voice de_DE-kerstin-low "نص" out.opus → صوت صريح (dialogue-splitter — D103)
import hashlib
import json
import re
import sys
import unicodedata
import wave
from pathlib import Path

import numpy as np
import soundfile as sf
from piper import PiperVoice, SynthesisConfig
from piper.config import PiperConfig

ROOT = Path(__file__).resolve().parent.parent
VOICE_ONNX = ROOT / "tools/piper-voices/de_DE-thorsten-medium.onnx"
VOICE_ID = "de_DE-thorsten-medium"          # مثبت — استقرار الأصوات عبر الجلسات
VOICE_LICENSE = "CC0 (Thorsten-Voice)"      # موثقة من MODEL_CARD
VOICE_ONNX_FEMALE = ROOT / "tools/piper-voices/de_DE-kerstin-low.onnx"   # D98/D103: kerstin — مُثبَّت في git
VOICE_ID_FEMALE = "de_DE-kerstin-low"
VOICE_LICENSE_FEMALE = "CC0 (dataset rhasspy/dataset-voice-kerstin)"     # موثقة من MODEL_CARD (D103)
# D103: الأصوات المثبَّتة حصراً — أي صوت آخر مرفوض (لا تذبذب)
VOICES = {VOICE_ID: VOICE_ONNX, VOICE_ID_FEMALE: VOICE_ONNX_FEMALE}
MANIFEST = ROOT / "content/manifests/audio-manifest.a1-u1.json"
TARGET_RMS_DB = -17.0                       # داخل نافذة G1 [-20..-14]
PAD_MS = 100                                # صمت 100ms قبل/بعد (مواصفات الصوت)
OUT_SR = 24000                              # Opus standard rate (22.05k غير مسموح للترميز)
PRON_LEXICON = ROOT / "tools/pronunciation-lexicon.json"   # D121: أخطاء espeak المقيسة ← الفونيمات الصحيحة
_IPA_EDGE = " .,!?;:…—–\"„“”()-"            # حدود الكلمة في سلسلة الفونيمات (espeak لا يُخرج غيرها بين الكلمات)


def character_voices() -> dict:
    """D103: مصدر الحقيقة الوحيد لصوت كل شخصية = characterVoices في المانيفست (القانون 11: المانيفست قبل التوليد)."""
    if MANIFEST.exists():
        return json.loads(MANIFEST.read_text(encoding="utf-8")).get("characterVoices", {})
    return {}


def voice_available(voice_id: str) -> bool:
    onnx = VOICES.get(voice_id)
    return onnx is not None and onnx.exists() and onnx.with_suffix(".onnx.json").exists()


def voice_for(character: str | None) -> dict:
    """D98/D100/D103: صوت الشخصية الثابت من المانيفست — بصدق.
    إن غاب ملف الصوت المطلوب: الصوت الرئيسي مع fallback=True معلن (والمدقِّق يرفض المسار لاحقاً
    لأن صوته ≠ characterVoices — e-audio-character-voice) — فلا ادعاء صوت بلا ملفه أبداً."""
    wanted = character_voices().get(character or "", VOICE_ID)
    if wanted not in VOICES:
        raise SystemExit(f"صوت غير مثبَّت في المانيفست للشخصية {character}: {wanted}")
    if voice_available(wanted):
        return {"speaker": wanted, "onnx": str(VOICES[wanted]), "fallback": False}
    return {"speaker": VOICE_ID, "onnx": str(VOICE_ONNX), "fallback": True}


_VOICE_CACHE: dict[str, PiperVoice] = {}


def load_voice(onnx: Path) -> PiperVoice:
    key = str(onnx)
    if key not in _VOICE_CACHE:
        _VOICE_CACHE[key] = PiperVoice.load(key)
    return _VOICE_CACHE[key]


_PHONEMIZER_CACHE: dict[str, PiperVoice] = {}


def load_phonemizer(onnx: Path) -> PiperVoice:
    """D158: الصوت للنطق وحده — الإعدادات (espeak_voice · phoneme_id_map) بلا جلسة ONNX.
    قياس: تهيئة جلسة ONNX للنموذج تأخذ ≈3 ثوانٍ لكل عملية Python، وphonemize/الفحص/المعجم لا يستعملها —
    فكانت اختبارات المعجم (5 ثوانٍ مهلة) تسقط بالمهلة كلما كبر المعجم. للتوليد الفعلي load_voice كما هي."""
    key = str(onnx)
    if key not in _PHONEMIZER_CACHE:
        cfg = json.loads(Path(f"{key}.json").read_text(encoding="utf-8"))
        _PHONEMIZER_CACHE[key] = PiperVoice(session=None, config=PiperConfig.from_dict(cfg))  # type: ignore[arg-type]
    return _PHONEMIZER_CACHE[key]


def fit_phonemes(phonemes: list[str], id_map: dict) -> tuple[list[str], int]:
    """D103: ملاءمة فونيمات espeak لخريطة الصوت — بلا فقد صامت.
    espeak الحالي يُخرج ç مفككة (c + U+0327)؛ خريطة kerstin (صيغة 0.2.0 · 130 رمزاً) تعرف «ç» المركبة فقط،
    فكان Piper يُسقط العلامة ويقول [c] انفجارياً بدل [ç] الاحتكاكي («nicht» → nict) — 555 موضعاً مقيساً.
    القاعدة: علامة مركِّبة غائبة ← تُركَّب مع ما قبلها (NFC) إن كان المركَّب في الخريطة؛ والأنفية U+0303
    (Restaurant) ← ŋ (النطق الألماني الدارج [ʁɛstoˈʁaŋ]). الخريطة الكاملة (thorsten) لا يتغير فيها شيء."""
    out: list[str] = []
    fixed = 0
    for ph in phonemes:
        if ph in id_map or not out or not unicodedata.combining(ph):
            out.append(ph)
            continue
        composed = unicodedata.normalize("NFC", out[-1] + ph)
        if len(composed) == 1 and composed in id_map:
            out[-1] = composed
            fixed += 1
        elif ph == "\u0303" and "ŋ" in id_map:
            out.append("ŋ")
            fixed += 1
        else:
            out.append(ph)  # يبقى غائباً — يكشفه فحص التغطية (phonemize.py --coverage) لا يُخفى
    return out, fixed


_LEXICON: list[dict] | None = None


def pronunciation_lexicon() -> list[dict]:
    """D121: معجم النطق — كلمات يخطئ espeak-ng نطقها، مقيسة مقابل مرجع حر (ipa-dict · Wiktionary · MIT).
    يُحمَّل مرة لكل عملية؛ الملف الغائب = معجم فارغ."""
    global _LEXICON
    if _LEXICON is None:
        _LEXICON = json.loads(PRON_LEXICON.read_text(encoding="utf-8"))["entries"] if PRON_LEXICON.exists() else []
    return _LEXICON


def lexicon_forms(entry: dict) -> list[dict]:
    """D122: صيغ espeak للكلمة الواحدة — نبر أولي معزولة (fˈɔɾ) وثانوي في الجملة (fˌɔɾ) — لكل صيغة تصحيحها.
    تُطبَّع NFD لأن espeak الخام يُخرج العلامات مفككة (ç = c + U+0327): الملف يُكتب مقروءاً والمطابقة دقيقة."""
    return [{"espeak": unicodedata.normalize("NFD", f["espeak"]), "ipa": unicodedata.normalize("NFD", f["ipa"])} for f in entry["forms"]]


def apply_lexicon(phonemes: list[str], entries: list[dict] | None = None) -> tuple[list[str], int]:
    """D121/D122: فونيمات espeak الخاطئة لكلمة كاملة ← الصحيحة (Kurs: kˈuːɾs ← kˈʊɐs) — لكل صيغة من صيغ الكلمة.
    حد الكلمة = بداية/نهاية/مسافة/ترقيم — فلا مطابقة داخل كلمة أخرى (Kurse وUrlaub لا تُمسّان).
    عناصر Piper رموز مفردة (مقيس: كل عنصر وكل مفتاح في خريطتي الصوتين بطول 1)، فإعادة التقطيع بـlist() دقيقة.
    بلا مطابقة تعود القائمة نفسها دون مساس — لا يتغير أي مقطع لا يحوي كلمة من المعجم."""
    entries = pronunciation_lexicon() if entries is None else entries
    joined = "".join(phonemes)
    edge = re.escape(_IPA_EDGE)
    fixed = 0
    for e in entries:
        for f in lexicon_forms(e):
            joined, n = re.subn(rf"(?<![^{edge}]){re.escape(f['espeak'])}(?![^{edge}])", f["ipa"], joined)
            fixed += n
    return (list(joined), fixed) if fixed else (phonemes, 0)


def lexicon_hits(phonemes: list[str], entries: list[dict] | None = None) -> list[str]:
    """D122: كلمات المعجم التي يمسّها هذا المقطع فعلاً (بالمطابقة نفسها التي يصحّح بها apply_lexicon) —
    منها يُحسب أي المسارات المنشورة تغيّر صوتها بإضافة مدخل، فلا يُعتمد على بحث نصي يخطئ الحالة (Vor/vor)."""
    entries = pronunciation_lexicon() if entries is None else entries
    return [e["word"] for e in entries if apply_lexicon(phonemes, [e])[1] > 0]


def synth_phonemes(voice: PiperVoice, text: str, phonemize=None) -> list[list[str]]:
    """الفونيمات التي تصل النموذج فعلاً: espeak (عبر Piper) → apply_lexicon → fit_phonemes.
    المعجم قبل الملاءمة (D122): خرج espeak الخام واحد للصوتين، أما الملاءمة فتختلف بخريطة كل صوت
    (thorsten يُبقي ç مفككة وkerstin يركّبها) — فلو طُبّق المعجم بعدها لما طابقت صيغةٌ واحدة الصوتين معاً
    في كل كلمة فيها ç (vierzig · Nachricht). والتصحيح نفسه يمرّ بالملاءمة فيصل كل صوت بما تعرفه خريطته.
    مصدر واحد للصوت (tts) وللـIPA المقيس (phonemize.py) — فلا يختلف ما يُقاس عما يُنطق أبداً."""
    id_map = voice.config.phoneme_id_map
    raw = (phonemize or PiperVoice.phonemize)(voice, text)
    return [fit_phonemes(apply_lexicon(sent)[0], id_map)[0] for sent in raw]


def tts(text: str, out_wav: Path, onnx: Path = VOICE_ONNX, length_scale: float | None = None) -> None:
    """مسار Piper نفسه الذي يسلكه سطر الأوامر (synthesize لكل جملة · تطبيع الذروة · صمت 0 بين الجمل)
    + طبقتا fit_phonemes ومعجم النطق (D121) قبل التحويل إلى معرّفات. length_scale > 1 = نطق أبطأ (مواد A1)."""
    voice = load_voice(onnx)
    original = PiperVoice.phonemize
    voice.phonemize = lambda t: synth_phonemes(voice, t, original)  # type: ignore[method-assign]
    try:
        with wave.open(str(out_wav), "wb") as wav:
            params_set = False
            for chunk in voice.synthesize(text, SynthesisConfig(length_scale=length_scale)):
                if not params_set:
                    wav.setframerate(chunk.sample_rate)
                    wav.setsampwidth(chunk.sample_width)
                    wav.setnchannels(chunk.sample_channels)
                    params_set = True
                wav.writeframes(chunk.audio_int16_bytes)
    finally:
        del voice.phonemize  # يعود السلوك الأصلي للكائن المخبَّأ


def normalize(data: np.ndarray, sr: int) -> np.ndarray:
    pad = np.zeros(int(sr * PAD_MS / 1000), dtype=np.float32)
    data = np.concatenate([pad, data, pad]).astype(np.float32)
    rms = float(np.sqrt(np.mean(np.square(data)) + 1e-12))
    gain = (10 ** (TARGET_RMS_DB / 20.0)) / rms
    return np.clip(data * gain, -1.0, 1.0)


def resample_linear(data: np.ndarray, sr: int, new_sr: int) -> np.ndarray:
    n_out = int(len(data) * new_sr / sr)
    x_old = np.linspace(0.0, 1.0, num=len(data), endpoint=False)
    x_new = np.linspace(0.0, 1.0, num=n_out, endpoint=False)
    return np.interp(x_new, x_old, data).astype(np.float32)


def make_clip(text: str, out_opus: Path, onnx: Path = VOICE_ONNX, length_scale: float | None = None) -> dict:
    """Piper wav → تطبيع RMS → 100ms صمت → Opus 24k → قياسات حقيقية من الملف النهائي.
    (kerstin-low يُخرج 16kHz — resample_linear يحوّل أي معدل إلى 24k بلا فرق في المسار)"""
    tmp = out_opus.with_suffix(".tmp.wav")
    out_opus.parent.mkdir(parents=True, exist_ok=True)  # المجلد قبل Piper — لا ينشئ المجلدات بنفسه
    tts(text, tmp, onnx, length_scale)
    data, sr = sf.read(tmp, dtype="float32")
    data = normalize(data, sr)
    data24 = resample_linear(data, sr, OUT_SR)
    out_opus.parent.mkdir(parents=True, exist_ok=True)
    sf.write(out_opus, data24, OUT_SR, format="OGG", subtype="OPUS")
    tmp.unlink()
    measured, msr = sf.read(out_opus, dtype="float32")
    rms = float(np.sqrt(np.mean(np.square(measured)) + 1e-12))
    import hashlib as _h
    sha = _h.sha256(out_opus.read_bytes()).hexdigest()
    pcm_sha = _h.sha256(np.asarray(measured, dtype=np.float32).tobytes()).hexdigest()
    return {
        "durationMs": round(len(measured) / msr * 1000),
        "sizeBytes": out_opus.stat().st_size,
        "hash": f"sha256:{sha}",
        "pcmSha256": pcm_sha,
        "rmsDb": round(20 * np.log10(rms + 1e-12), 2),
    }


def build_all() -> None:
    content = ROOT / "content"

    word_tracks = [
        ("word-hallo", "Hallo.", "hallo", ["a1-u1-d1"]),
        ("word-heissen", "heißen.", "heissen", ["a1-u1-d1"]),
        ("word-guten-tag", "Guten Tag.", "guten-tag", ["a1-u1-d1"]),
        ("word-guten-morgen", "Guten Morgen.", "guten-morgen", ["a1-u1-d1"]),
        ("word-guten-abend", "Guten Abend.", "guten-abend", ["a1-u1-d1"]),
        ("word-tschuess", "Tschüss.", "tschuess", ["a1-u1-d1"]),
        ("word-auf-wiedersehen", "Auf Wiedersehen.", "auf-wiedersehen", ["a1-u1-d1"]),
        ("word-wie-gehts", "Wie geht's?", "wie-gehts", ["a1-u1-d1"]),
        ("word-danke", "Danke.", "danke", ["a1-u1-d1"]),
        ("word-bitte", "Bitte.", "bitte", ["a1-u1-d1"]),
        ("word-kommen", "kommen.", "kommen", ["a1-u1-d1"]),
        ("word-wohnen", "wohnen.", "wohnen", ["a1-u1-d1"]),
        ("word-deutsch", "Deutsch.", "deutsch", ["a1-u1-d1"]),
        ("word-tunesien", "Tunesien.", "tunesien", ["a1-u1-d1"]),
        ("word-deutschland", "Deutschland.", "deutschland", ["a1-u1-d1"]),
        ("word-wohnung", "die Wohnung.", "wohnung", []),
        # ═══ a1-u1-d2 — Länder & Sprachen (D45) ═══
        ("word-frankreich", "Frankreich.", "frankreich", ["a1-u1-d2"]),
        ("word-spanien", "Spanien.", "spanien", ["a1-u1-d2"]),
        ("word-italien", "Italien.", "italien", ["a1-u1-d2"]),
        ("word-tuerkei", "die Türkei.", "tuerkei", ["a1-u1-d2"]),
        ("word-marokko", "Marokko.", "marokko", ["a1-u1-d2"]),
        ("word-aegypten", "Ägypten.", "aegypten", ["a1-u1-d2"]),
        ("word-schweiz", "die Schweiz.", "schweiz", ["a1-u1-d2"]),
        ("word-englisch", "Englisch.", "englisch", ["a1-u1-d2"]),
        ("word-franzoesisch", "Französisch.", "franzoesisch", ["a1-u1-d2"]),
        ("word-arabisch", "Arabisch.", "arabisch", ["a1-u1-d2"]),
        ("word-sprache", "die Sprache.", "sprache", ["a1-u1-d2"]),
        ("word-land", "das Land.", "land", ["a1-u1-d2"]),
        # ═══ a1-u1-d3 — Schreiben & Alphabet (D45) ═══
        ("word-buchstabe", "der Buchstabe.", "buchstabe", ["a1-u1-d3"]),
        ("word-name", "der Name.", "name", ["a1-u1-d3"]),
        ("word-vorname", "der Vorname.", "vorname", ["a1-u1-d3"]),
        ("word-familienname", "der Familienname.", "familienname", ["a1-u1-d3"]),
        ("word-adresse", "die Adresse.", "adresse", ["a1-u1-d3"]),
        ("word-telefonnummer", "die Telefonnummer.", "telefonnummer", ["a1-u1-d3"]),
        ("word-buchstabieren", "buchstabieren.", "buchstabieren", ["a1-u1-d3"]),
        ("word-langsam", "langsam.", "langsam", ["a1-u1-d3"]),
        ("word-wiederholen", "wiederholen.", "wiederholen", ["a1-u1-d3"]),
        ("word-genau", "genau.", "genau", ["a1-u1-d3"]),
        ("word-achso", "Ach so.", "achso", ["a1-u1-d3"]),
        ("word-alphabet", "das Alphabet.", "alphabet", ["a1-u1-d3"]),
        # ═══ a1-u1-d4 — Zahlen/Alter/Telefon (D46) ═══
        ("word-zahl", "die Zahl.", "zahl", ["a1-u1-d4"]),
        ("word-nummer", "die Nummer.", "nummer", ["a1-u1-d4"]),
        ("word-telefon", "das Telefon.", "telefon", ["a1-u1-d4"]),
        ("word-handy", "das Handy.", "handy", ["a1-u1-d4"]),
        ("word-alt", "alt.", "alt", ["a1-u1-d4"]),
        ("word-jahr", "das Jahr.", "jahr", ["a1-u1-d4"]),
        ("word-geburtstag", "der Geburtstag.", "geburtstag", ["a1-u1-d4"]),
        ("word-schreiben", "schreiben.", "schreiben", ["a1-u1-d4"]),
        ("word-monat", "der Monat.", "monat", ["a1-u1-d4"]),
        ("word-woche", "die Woche.", "woche", ["a1-u1-d4"]),
        ("word-tag", "der Tag.", "tag", ["a1-u1-d4"]),
        ("word-strasse", "die Straße.", "strasse", ["a1-u1-d4"]),
        # ═══ a1-u1-d5 — wer/woher + Kennenlernen (D46) ═══
        ("word-frage", "die Frage.", "frage", ["a1-u1-d5"]),
        ("word-antwort", "die Antwort.", "antwort", ["a1-u1-d5"]),
        ("word-kennen", "kennen.", "kennen", ["a1-u1-d5"]),
        ("word-freund", "der Freund.", "freund", ["a1-u1-d5"]),
        ("word-freundin", "die Freundin.", "freundin", ["a1-u1-d5"]),
        ("word-leute", "die Leute.", "leute", ["a1-u1-d5"]),
        ("word-zusammen", "zusammen.", "zusammen", ["a1-u1-d5"]),
        # ═══ a1-u1-d6 — Integration (D47) ═══
        ("word-alles-klar", "Alles klar.", "alles-klar", ["a1-u1-d6"]),
        ("word-bis-morgen", "Bis morgen.", "bis-morgen", ["a1-u1-d6"]),
        # ═══ a1-u2-d1 — Länder & wo/woher (D47) ═══
        ("word-oesterreich", "Österreich.", "oesterreich", ["a1-u2-d1"]),
        ("word-niederlande", "die Niederlande.", "niederlande", ["a1-u2-d1"]),
        ("word-griechenland", "Griechenland.", "griechenland", ["a1-u2-d1"]),
        ("word-polen", "Polen.", "polen", ["a1-u2-d1"]),
        ("word-russland", "Russland.", "russland", ["a1-u2-d1"]),
        ("word-portugal", "Portugal.", "portugal", ["a1-u2-d1"]),
        ("word-europa", "Europa.", "europa", ["a1-u2-d1"]),
        ("word-welt", "die Welt.", "welt", ["a1-u2-d1"]),
        ("word-wo", "wo.", "wo", ["a1-u2-d1"]),
        ("word-woher", "woher.", "woher", ["a1-u1-d5", "a1-u2-d1"]),
        ("word-leben", "leben.", "leben", ["a1-u2-d2"]),
        ("word-stadt", "die Stadt.", "stadt", ["a1-u2-d2"]),
        ("word-haus", "das Haus.", "haus", ["a1-u2-d2"]),
        ("word-muttersprache", "die Muttersprache.", "muttersprache", ["a1-u2-d2"]),
        ("word-fremdsprache", "die Fremdsprache.", "fremdsprache", ["a1-u2-d2"]),
        ("word-zeitung", "die Zeitung.", "zeitung", ["a1-u2-d3"]),
        ("word-rechnung", "die Rechnung.", "rechnung", ["a1-u2-d3"]),
        ("word-maedchen", "das Mädchen.", "maedchen", ["a1-u2-d3"]),
        ("word-broetchen", "das Brötchen.", "broetchen", ["a1-u2-d3"]),
        ("word-kellner", "der Kellner.", "kellner", ["a1-u2-d3"]),
        ("word-lehrer", "der Lehrer.", "lehrer", ["a1-u2-d3"]),
        ("word-freiheit", "die Freiheit.", "freiheit", ["a1-u2-d3"]),
        ("word-moeglichkeit", "die Möglichkeit.", "moeglichkeit", ["a1-u2-d3"]),
        ("word-gesundheit", "die Gesundheit.", "gesundheit", ["a1-u2-d3"]),
        ("word-freundschaft", "die Freundschaft.", "freundschaft", ["a1-u2-d3"]),
        ("word-schmetterling", "der Schmetterling.", "schmetterling", ["a1-u2-d3"]),
        ("word-zentrum", "das Zentrum.", "zentrum", ["a1-u2-d3"]),
        ("word-gross", "groß.", "gross", ["a1-u2-d4"]),
        ("word-heiss", "heiß.", "heiss", ["a1-u2-d4"]),
        ("word-fuss", "der Fuß.", "fuss", ["a1-u2-d4"]),
        ("word-suess", "süß.", "suess", ["a1-u2-d4"]),
        ("word-tasse", "die Tasse.", "tasse", ["a1-u2-d4"]),
        ("word-essen", "essen.", "essen", ["a1-u2-d4"]),
        ("word-kaffee", "der Kaffee.", "kaffee", ["a1-u2-d4"]),
        ("word-boot", "das Boot.", "boot", ["a1-u2-d4"]),
        ("word-gehen", "gehen.", "gehen", ["a1-u2-d4"]),
        ("word-kaese", "der Käse.", "kaese", ["a1-u2-d4"]),
        ("word-schule", "die Schule.", "schule", ["a1-u2-d4"]),
        ("word-vorstellen", "vorstellen.", "vorstellen", ["a1-u2-d5"]),
        ("word-kennenlernen", "kennenlernen.", "kennenlernen", ["a1-u2-d5"]),
        ("word-freuen", "freuen.", "freuen", ["a1-u2-d5"]),
        ("word-gern", "gern.", "gern", ["a1-u2-d5"]),
        ("word-nett", "nett.", "nett", ["a1-u2-d5"]),
        ("word-gespraech", "das Gespräch.", "gespraech", ["a1-u2-d5"]),
        ("word-auch", "auch.", "auch", ["a1-u2-d5"]),
        ("word-oder", "oder.", "oder", ["a1-u2-d5"]),
        ("word-natuerlich", "natürlich.", "natuerlich", ["a1-u2-d5"]),
        ("word-hobby", "das Hobby.", "hobby", ["a1-u2-d5"]),
        ("word-lesen", "lesen.", "lesen", ["a1-u2-d5"]),
        ("word-musik", "die Musik.", "musik", ["a1-u2-d5"]),
        ("word-okay", "Okay.", "okay", ["a1-u2-d6"]),
        ("word-super", "Super.", "super", ["a1-u2-d6"]),
        ("word-zwanzig", "zwanzig.", "zwanzig", ["a1-u3-d1"]),
        ("word-dreissig", "dreißig.", "dreissig", ["a1-u3-d1"]),
        ("word-vierzig", "vierzig.", "vierzig", ["a1-u3-d1"]),
        ("word-fuenfzig", "fünfzig.", "fuenfzig", ["a1-u3-d1"]),
        ("word-sechzig", "sechzig.", "sechzig", ["a1-u3-d1"]),
        ("word-siebzig", "siebzig.", "siebzig", ["a1-u3-d1"]),
        ("word-achtzig", "achtzig.", "achtzig", ["a1-u3-d1"]),
        ("word-neunzig", "neunzig.", "neunzig", ["a1-u3-d1"]),
        ("word-hundert", "hundert.", "hundert", ["a1-u3-d1"]),
        ("word-zaehlen", "zählen.", "zaehlen", ["a1-u3-d1"]),
        ("word-ziffer", "die Ziffer.", "ziffer", ["a1-u3-d1"]),
        ("word-mal", "mal.", "mal", ["a1-u3-d1"]),
        ("word-tausend", "tausend.", "tausend", ["a1-u3-d2"]),
        ("word-euro", "der Euro.", "euro", ["a1-u3-d2"]),
        ("word-preis", "der Preis.", "preis", ["a1-u3-d2"]),
        ("word-kosten", "kosten.", "kosten", ["a1-u3-d2"]),
        ("word-billig", "billig.", "billig", ["a1-u3-d2"]),
        ("word-teuer", "teuer.", "teuer", ["a1-u3-d2"]),
        ("word-geld", "das Geld.", "geld", ["a1-u3-d2"]),
        ("word-bezahlen", "bezahlen.", "bezahlen", ["a1-u3-d2"]),
        ("word-karte", "die Karte.", "karte", ["a1-u3-d2"]),
        ("word-kaufen", "kaufen.", "kaufen", ["a1-u3-d2"]),
        ("word-nur", "nur.", "nur", ["a1-u3-d2"]),
        ("word-viel", "viel.", "viel", ["a1-u3-d2"]),
        ("word-uhr", "die Uhr.", "uhr", ["a1-u3-d3"]),
        ("word-zeit", "die Zeit.", "zeit", ["a1-u3-d3"]),
        ("word-stunde", "die Stunde.", "stunde", ["a1-u3-d3"]),
        ("word-minute", "die Minute.", "minute", ["a1-u3-d3"]),
        ("word-halb", "halb.", "halb", ["a1-u3-d3"]),
        ("word-viertel", "das Viertel.", "viertel", ["a1-u3-d3"]),
        ("word-frueh", "früh.", "frueh", ["a1-u3-d3"]),
        ("word-spaet", "spät.", "spaet", ["a1-u3-d3"]),
        ("word-morgen", "der Morgen.", "morgen", ["a1-u3-d3"]),
        ("word-abend", "der Abend.", "abend", ["a1-u3-d3"]),
        ("word-nacht", "die Nacht.", "nacht", ["a1-u3-d3"]),
        ("word-mittag", "der Mittag.", "mittag", ["a1-u3-d3"]),
        ("word-januar", "der Januar.", "januar", ["a1-u3-d4"]),
        ("word-februar", "der Februar.", "februar", ["a1-u3-d4"]),
        ("word-maerz", "der März.", "maerz", ["a1-u3-d4"]),
        ("word-april", "der April.", "april", ["a1-u3-d4"]),
        ("word-mai", "der Mai.", "mai", ["a1-u3-d4"]),
        ("word-juni", "der Juni.", "juni", ["a1-u3-d4"]),
        ("word-termin", "der Termin.", "termin", ["a1-u3-d4"]),
        ("word-treffen", "treffen.", "treffen", ["a1-u3-d4"]),
        ("word-verabredung", "die Verabredung.", "verabredung", ["a1-u3-d4"]),
        ("word-montag", "der Montag.", "montag", ["a1-u3-d4"]),
        ("word-sonntag", "der Sonntag.", "sonntag", ["a1-u3-d4"]),
        ("word-am", "am.", "am", ["a1-u3-d4"]),
        ("word-hoeren", "hören.", "hoeren", ["a1-u3-d5"]),
        ("word-verstehen", "verstehen.", "verstehen", ["a1-u3-d5"]),
        ("word-schnell", "schnell.", "schnell", ["a1-u3-d5"]),
        ("word-laut", "laut.", "laut", ["a1-u3-d5"]),
        ("word-leise", "leise.", "leise", ["a1-u3-d5"]),
        ("word-stimme", "die Stimme.", "stimme", ["a1-u3-d5"]),
        ("word-ohr", "das Ohr.", "ohr", ["a1-u3-d5"]),
        ("word-nachricht", "die Nachricht.", "nachricht", ["a1-u3-d5"]),
        ("word-anruf", "der Anruf.", "anruf", ["a1-u3-d5"]),
        ("word-antworten", "antworten.", "antworten", ["a1-u3-d5"]),
        ("word-noch", "noch.", "noch", ["a1-u3-d5"]),
        ("word-mit", "mit.", "mit", ["a1-u3-d5"]),
        ("word-toll", "Toll.", "toll", ["a1-u3-d6"]),
        ("word-klar", "Klar.", "klar", ["a1-u3-d6"]),
        ("word-mutter", "die Mutter.", "mutter", ["a1-u4-d1"]),
        ("word-vater", "der Vater.", "vater", ["a1-u4-d1"]),
        ("word-sohn", "der Sohn.", "sohn", ["a1-u4-d1"]),
        ("word-tochter", "die Tochter.", "tochter", ["a1-u4-d1"]),
        ("word-bruder", "der Bruder.", "bruder", ["a1-u4-d1"]),
        ("word-schwester", "die Schwester.", "schwester", ["a1-u4-d1"]),
        ("word-eltern", "die Eltern.", "eltern", ["a1-u4-d1"]),
        ("word-kind", "das Kind.", "kind", ["a1-u4-d1"]),
        ("word-grossvater", "der Großvater.", "grossvater", ["a1-u4-d1"]),
        ("word-grossmutter", "die Großmutter.", "grossmutter", ["a1-u4-d1"]),
        ("word-frau", "die Frau.", "frau", ["a1-u4-d1"]),
        ("word-mann", "der Mann.", "mann", ["a1-u4-d1"]),
        ("word-familie", "die Familie.", "familie", ["a1-u4-d2"]),
        ("word-tante", "die Tante.", "tante", ["a1-u4-d2"]),
        ("word-onkel", "der Onkel.", "onkel", ["a1-u4-d2"]),
        ("word-hund", "der Hund.", "hund", ["a1-u4-d2"]),
        ("word-katze", "die Katze.", "katze", ["a1-u4-d2"]),
        ("word-schluessel", "der Schlüssel.", "schluessel", ["a1-u4-d2"]),
        ("word-tasche", "die Tasche.", "tasche", ["a1-u4-d2"]),
        ("word-auto", "das Auto.", "auto", ["a1-u4-d2"]),
        ("word-gehoeren", "gehören.", "gehoeren", ["a1-u4-d2"]),
        ("word-mein", "mein.", "mein", ["a1-u4-d2"]),
        ("word-dein", "dein.", "dein", ["a1-u4-d2"]),
        ("word-sein", "sein.", "sein", ["a1-u4-d2"]),
        ("word-jung", "jung.", "jung", ["a1-u4-d3"]),
        ("word-klein", "klein.", "klein", ["a1-u4-d3"]),
        ("word-schoen", "schön.", "schoen", ["a1-u4-d3"]),
        ("word-freundlich", "freundlich.", "freundlich", ["a1-u4-d3"]),
        ("word-lustig", "lustig.", "lustig", ["a1-u4-d3"]),
        ("word-schlau", "schlau.", "schlau", ["a1-u4-d3"]),
        ("word-haar", "das Haar.", "haar", ["a1-u4-d3"]),
        ("word-gesicht", "das Gesicht.", "gesicht", ["a1-u4-d3"]),
        ("word-foto", "das Foto.", "foto", ["a1-u4-d3"]),
        ("word-bild", "das Bild.", "bild", ["a1-u4-d3"]),
        ("word-beschreiben", "beschreiben.", "beschreiben", ["a1-u4-d3"]),
        ("word-wen", "wen.", "wen", ["a1-u4-d3"]),
        ("word-sehen", "sehen.", "sehen", ["a1-u4-d4"]),
        ("word-zeigen", "zeigen.", "zeigen", ["a1-u4-d4"]),
        ("word-sitzen", "sitzen.", "sitzen", ["a1-u4-d4"]),
        ("word-stehen", "stehen.", "stehen", ["a1-u4-d4"]),
        ("word-laecheln", "lächeln.", "laecheln", ["a1-u4-d4"]),
        ("word-links", "links.", "links", ["a1-u4-d4"]),
        ("word-rechts", "rechts.", "rechts", ["a1-u4-d4"]),
        ("word-neben", "neben.", "neben", ["a1-u4-d4"]),
        ("word-zwischen", "zwischen.", "zwischen", ["a1-u4-d4"]),
        ("word-gemeinsam", "gemeinsam.", "gemeinsam", ["a1-u4-d4"]),
        ("word-tragen", "tragen.", "tragen", ["a1-u4-d4"]),
        ("word-brille", "die Brille.", "brille", ["a1-u4-d4"]),
        ("word-geschwister", "die Geschwister.", "geschwister", ["a1-u4-d5"]),
        ("word-zwilling", "der Zwilling.", "zwilling", ["a1-u4-d5"]),
        ("word-verheiratet", "verheiratet.", "verheiratet", ["a1-u4-d5"]),
        ("word-beruf", "der Beruf.", "beruf", ["a1-u4-d5"]),
        ("word-arbeiten", "arbeiten.", "arbeiten", ["a1-u4-d5"]),
        ("word-studieren", "studieren.", "studieren", ["a1-u4-d5"]),
        ("word-arbeit", "die Arbeit.", "arbeit", ["a1-u4-d5"]),
        ("word-aufnehmen", "aufnehmen.", "aufnehmen", ["a1-u4-d5"]),
        ("word-kurz", "kurz.", "kurz", ["a1-u2-d4", "a1-u4-d5"]),
        ("word-erzaehlen", "erzählen.", "erzaehlen", ["a1-u4-d5"]),
        ("word-stolz", "stolz.", "stolz", ["a1-u4-d5"]),
        ("word-heimat", "die Heimat.", "heimat", ["a1-u4-d5"]),
        ("word-wunderbar", "Wunderbar.", "wunderbar", ["a1-u4-d6"]),
        ("word-prima", "Prima.", "prima", ["a1-u4-d6"]),
        ("word-brot", "das Brot.", "brot", ["a1-u5-d1"]),
        ("word-wurst", "die Wurst.", "wurst", ["a1-u5-d1"]),
        ("word-fleisch", "das Fleisch.", "fleisch", ["a1-u5-d1"]),
        ("word-fisch", "der Fisch.", "fisch", ["a1-u5-d1"]),
        ("word-salat", "der Salat.", "salat", ["a1-u5-d1"]),
        ("word-suppe", "die Suppe.", "suppe", ["a1-u5-d1"]),
        ("word-ei", "das Ei.", "ei", ["a1-u5-d1"]),
        ("word-reis", "der Reis.", "reis", ["a1-u5-d1"]),
        ("word-nudeln", "die Nudeln.", "nudeln", ["a1-u5-d1"]),
        ("word-obst", "das Obst.", "obst", ["a1-u5-d1"]),
        ("word-gemuese", "das Gemüse.", "gemuese", ["a1-u5-d1"]),
        ("word-hunger", "der Hunger.", "hunger", ["a1-u5-d1"]),
        ("word-wasser", "das Wasser.", "wasser", ["a1-u5-d2"]),
        ("word-milch", "die Milch.", "milch", ["a1-u5-d2"]),
        ("word-saft", "der Saft.", "saft", ["a1-u5-d2"]),
        ("word-bier", "das Bier.", "bier", ["a1-u5-d2"]),
        ("word-wein", "der Wein.", "wein", ["a1-u5-d2"]),
        ("word-tee", "der Tee.", "tee", ["a1-u5-d2"]),
        ("word-trinken", "trinken.", "trinken", ["a1-u5-d2"]),
        ("word-speisekarte", "die Speisekarte.", "speisekarte", ["a1-u5-d2"]),
        ("word-bestellen", "bestellen.", "bestellen", ["a1-u5-d2"]),
        ("word-glas", "das Glas.", "glas", ["a1-u5-d2"]),
        ("word-flasche", "die Flasche.", "flasche", ["a1-u5-d2"]),
        ("word-zahlen", "zahlen.", "zahlen", ["a1-u5-d2"]),
        ("word-fruehstueck", "das Frühstück.", "fruehstueck", ["a1-u5-d3"]),
        ("word-mittagessen", "das Mittagessen.", "mittagessen", ["a1-u5-d3"]),
        ("word-abendessen", "das Abendessen.", "abendessen", ["a1-u5-d3"]),
        ("word-butter", "die Butter.", "butter", ["a1-u5-d3"]),
        ("word-marmelade", "die Marmelade.", "marmelade", ["a1-u5-d3"]),
        ("word-kuchen", "der Kuchen.", "kuchen", ["a1-u5-d3"]),
        ("word-eis", "das Eis.", "eis", ["a1-u5-d3"]),
        ("word-appetit", "der Appetit.", "appetit", ["a1-u5-d3"]),
        ("word-schmecken", "schmecken.", "schmecken", ["a1-u5-d3"]),
        ("word-satt", "satt.", "satt", ["a1-u5-d3"]),
        ("word-kartoffel", "die Kartoffel.", "kartoffel", ["a1-u5-d3"]),
        ("word-tomate", "die Tomate.", "tomate", ["a1-u5-d3"]),
        ("word-scharf", "scharf.", "scharf", ["a1-u5-d4"]),
        ("word-salzig", "salzig.", "salzig", ["a1-u5-d4"]),
        ("word-frisch", "frisch.", "frisch", ["a1-u5-d4"]),
        ("word-portion", "die Portion.", "portion", ["a1-u5-d4"]),
        ("word-teller", "der Teller.", "teller", ["a1-u5-d4"]),
        ("word-loeffel", "der Löffel.", "loeffel", ["a1-u5-d4"]),
        ("word-gabel", "die Gabel.", "gabel", ["a1-u5-d4"]),
        ("word-messer", "das Messer.", "messer", ["a1-u5-d4"]),
        ("word-gast", "der Gast.", "gast", ["a1-u5-d4"]),
        ("word-bestellung", "die Bestellung.", "bestellung", ["a1-u5-d4"]),
        ("word-trinkgeld", "das Trinkgeld.", "trinkgeld", ["a1-u5-d4"]),
        ("word-getraenk", "das Getränk.", "getraenk", ["a1-u5-d4"]),
        ("word-durst", "der Durst.", "durst", ["a1-u5-d5"]),
        ("word-salz", "das Salz.", "salz", ["a1-u5-d5"]),
        ("word-pfeffer", "der Pfeffer.", "pfeffer", ["a1-u5-d5"]),
        ("word-zucker", "der Zucker.", "zucker", ["a1-u5-d5"]),
        ("word-sahne", "die Sahne.", "sahne", ["a1-u5-d5"]),
        ("word-limonade", "die Limonade.", "limonade", ["a1-u5-d5"]),
        ("word-haehnchen", "das Hähnchen.", "haehnchen", ["a1-u5-d5"]),
        ("word-nachtisch", "der Nachtisch.", "nachtisch", ["a1-u5-d5"]),
        ("word-vorspeise", "die Vorspeise.", "vorspeise", ["a1-u5-d5"]),
        ("word-kasse", "die Kasse.", "kasse", ["a1-u5-d5"]),
        ("word-reservieren", "reservieren.", "reservieren", ["a1-u5-d5"]),
        ("word-probieren", "probieren.", "probieren", ["a1-u5-d5"]),
        ("word-kochen", "kochen.", "kochen", ["a1-u5-d5"]),
        ("word-backen", "backen.", "backen", ["a1-u5-d5"]),
        ("word-kueche", "die Küche.", "kueche", ["a1-u5-d5"]),
        ("word-gesund", "gesund.", "gesund", ["a1-u5-d5"]),
        ("word-mahlzeit", "die Mahlzeit.", "mahlzeit", ["a1-u5-d5"]),
        ("word-tisch", "der Tisch.", "tisch", ["a1-u6-d1"]),
        ("word-stuhl", "der Stuhl.", "stuhl", ["a1-u6-d1"]),
        ("word-sofa", "das Sofa.", "sofa", ["a1-u6-d1"]),
        ("word-bett", "das Bett.", "bett", ["a1-u6-d1"]),
        ("word-schrank", "der Schrank.", "schrank", ["a1-u6-d1"]),
        ("word-lampe", "die Lampe.", "lampe", ["a1-u6-d1"]),
        ("word-teppich", "der Teppich.", "teppich", ["a1-u6-d1"]),
        ("word-sessel", "der Sessel.", "sessel", ["a1-u6-d1"]),
        ("word-regal", "das Regal.", "regal", ["a1-u6-d1"]),
        ("word-spiegel", "der Spiegel.", "spiegel", ["a1-u6-d1"]),
        ("word-vorhang", "der Vorhang.", "vorhang", ["a1-u6-d1"]),
        ("word-kissen", "das Kissen.", "kissen", ["a1-u6-d1"]),
        ("word-zimmer", "das Zimmer.", "zimmer", ["a1-u6-d2"]),
        ("word-schlafzimmer", "das Schlafzimmer.", "schlafzimmer", ["a1-u6-d2"]),
        ("word-wohnzimmer", "das Wohnzimmer.", "wohnzimmer", ["a1-u6-d2"]),
        ("word-badezimmer", "das Badezimmer.", "badezimmer", ["a1-u6-d2"]),
        ("word-flur", "der Flur.", "flur", ["a1-u6-d2"]),
        ("word-balkon", "der Balkon.", "balkon", ["a1-u6-d2"]),
        ("word-treppe", "die Treppe.", "treppe", ["a1-u6-d2"]),
        ("word-keller", "der Keller.", "keller", ["a1-u6-d2"]),
        ("word-garten", "der Garten.", "garten", ["a1-u6-d2"]),
        ("word-hell", "hell.", "hell", ["a1-u6-d2"]),
        ("word-ruhig", "ruhig.", "ruhig", ["a1-u6-d2"]),
        ("word-gemuetlich", "gemütlich.", "gemuetlich", ["a1-u6-d2"]),
        ("word-fenster", "das Fenster.", "fenster", ["a1-u6-d3"]),
        ("word-tuer", "die Tür.", "tuer", ["a1-u6-d3"]),
        ("word-wand", "die Wand.", "wand", ["a1-u6-d3"]),
        ("word-boden", "der Boden.", "boden", ["a1-u6-d3"]),
        ("word-decke", "die Decke.", "decke", ["a1-u6-d3"]),
        ("word-heizung", "die Heizung.", "heizung", ["a1-u6-d3"]),
        ("word-kuehlschrank", "der Kühlschrank.", "kuehlschrank", ["a1-u6-d3"]),
        ("word-waschmaschine", "die Waschmaschine.", "waschmaschine", ["a1-u6-d3"]),
        ("word-fernseher", "der Fernseher.", "fernseher", ["a1-u6-d3"]),
        ("word-computer", "der Computer.", "computer", ["a1-u6-d3"]),
        ("word-schreibtisch", "der Schreibtisch.", "schreibtisch", ["a1-u6-d3"]),
        ("word-dach", "das Dach.", "dach", ["a1-u6-d3"]),
        ("word-ecke", "die Ecke.", "ecke", ["a1-u6-d4"]),
        ("word-mitte", "die Mitte.", "mitte", ["a1-u6-d4"]),
        ("word-oben", "oben.", "oben", ["a1-u6-d4"]),
        ("word-unten", "unten.", "unten", ["a1-u6-d4"]),
        ("word-ueber", "über.", "ueber", ["a1-u6-d4"]),
        ("word-unter", "unter.", "unter", ["a1-u6-d4"]),
        ("word-hinter", "hinter.", "hinter", ["a1-u6-d4"]),
        ("word-auf", "auf.", "auf", ["a1-u6-d4"]),
        ("word-stellen", "stellen.", "stellen", ["a1-u6-d4"]),
        ("word-legen", "legen.", "legen", ["a1-u6-d4"]),
        ("word-haengen", "hängen.", "haengen", ["a1-u6-d4"]),
        ("word-wohin", "wohin.", "wohin", ["a1-u6-d4"]),
        ("word-moebel", "die Möbel.", "moebel", ["a1-u6-d5"]),
        ("word-einrichtung", "die Einrichtung.", "einrichtung", ["a1-u6-d5"]),
        ("word-geraet", "das Gerät.", "geraet", ["a1-u6-d5"]),
        ("word-schublade", "die Schublade.", "schublade", ["a1-u6-d5"]),
        ("word-rahmen", "der Rahmen.", "rahmen", ["a1-u6-d5"]),
        ("word-handtuch", "das Handtuch.", "handtuch", ["a1-u6-d5"]),
        ("word-seife", "die Seife.", "seife", ["a1-u6-d5"]),
        ("word-dusche", "die Dusche.", "dusche", ["a1-u6-d5"]),
        ("word-toilette", "die Toilette.", "toilette", ["a1-u6-d5"]),
        ("word-pflanze", "die Pflanze.", "pflanze", ["a1-u6-d5"]),
        ("word-vase", "die Vase.", "vase", ["a1-u6-d5"]),
        ("word-hof", "der Hof.", "hof", ["a1-u6-d5"]),
        ("word-etage", "die Etage.", "etage", ["a1-u6-d5"]),
        ("word-stockwerk", "das Stockwerk.", "stockwerk", ["a1-u6-d5"]),
        ("word-miete", "die Miete.", "miete", ["a1-u6-d5"]),
        ("word-nachbar", "der Nachbar.", "nachbar", ["a1-u6-d5"]),
        ("word-dunkel", "dunkel.", "dunkel", ["a1-u6-d5"]),
        ("word-aufwachen", "aufwachen.", "aufwachen", ["a1-u7-d1"]),
        ("word-schlafen", "schlafen.", "schlafen", ["a1-u7-d1"]),
        ("word-duschen", "duschen.", "duschen", ["a1-u7-d1"]),
        ("word-anziehen", "anziehen.", "anziehen", ["a1-u7-d1"]),
        ("word-muede", "müde.", "muede", ["a1-u7-d1"]),
        ("word-pause", "die Pause.", "pause", ["a1-u7-d1"]),
        ("word-wecker", "der Wecker.", "wecker", ["a1-u7-d1"]),
        ("word-alltag", "der Alltag.", "alltag", ["a1-u7-d1"]),
        ("word-baden", "baden.", "baden", ["a1-u7-d1"]),
        ("word-anfangen", "anfangen.", "anfangen", ["a1-u7-d1"]),
        ("word-wecken", "wecken.", "wecken", ["a1-u7-d1"]),
        ("word-weg", "der Weg.", "weg", ["a1-u7-d1"]),
        ("word-fussball", "der Fußball.", "fussball", ["a1-u7-d2"]),
        ("word-schwimmen", "schwimmen.", "schwimmen", ["a1-u7-d2"]),
        ("word-tanzen", "tanzen.", "tanzen", ["a1-u7-d2"]),
        ("word-reisen", "reisen.", "reisen", ["a1-u7-d2"]),
        ("word-zeichnen", "zeichnen.", "zeichnen", ["a1-u7-d2"]),
        ("word-spazieren", "spazieren.", "spazieren", ["a1-u7-d2"]),
        ("word-kino", "das Kino.", "kino", ["a1-u7-d2"]),
        ("word-spiel", "das Spiel.", "spiel", ["a1-u7-d2"]),
        ("word-spielen", "spielen.", "spielen", ["a1-u7-d2"]),
        ("word-lieber", "lieber.", "lieber", ["a1-u7-d2"]),
        ("word-spass", "der Spaß.", "spass", ["a1-u7-d2"]),
        ("word-langweilig", "langweilig.", "langweilig", ["a1-u7-d2"]),
        ("word-machen", "machen.", "machen", ["a1-u7-d3"]),
        ("word-suchen", "suchen.", "suchen", ["a1-u7-d3"]),
        ("word-putzen", "putzen.", "putzen", ["a1-u7-d3"]),
        ("word-oeffnen", "öffnen.", "oeffnen", ["a1-u7-d3"]),
        ("word-schliessen", "schließen.", "schliessen", ["a1-u7-d3"]),
        ("word-brauchen", "brauchen.", "brauchen", ["a1-u7-d3"]),
        ("word-rufen", "rufen.", "rufen", ["a1-u7-d3"]),
        ("word-besuchen", "besuchen.", "besuchen", ["a1-u7-d3"]),
        ("word-benutzen", "benutzen.", "benutzen", ["a1-u7-d3"]),
        ("word-telefonieren", "telefonieren.", "telefonieren", ["a1-u7-d3"]),
        ("word-schicken", "schicken.", "schicken", ["a1-u7-d3"]),
        ("word-warten", "warten.", "warten", ["a1-u7-d3"]),
        ("word-fahren", "fahren.", "fahren", ["a1-u7-d4"]),
        ("word-waschen", "waschen.", "waschen", ["a1-u7-d4"]),
        ("word-geben", "geben.", "geben", ["a1-u7-d4"]),
        ("word-nehmen", "nehmen.", "nehmen", ["a1-u7-d4"]),
        ("word-sprechen", "sprechen.", "sprechen", ["a1-u1-d2", "a1-u7-d4"]),
        ("word-laufen", "laufen.", "laufen", ["a1-u7-d4"]),
        ("word-ankommen", "ankommen.", "ankommen", ["a1-u7-d4"]),
        ("word-fahrkarte", "die Fahrkarte.", "fahrkarte", ["a1-u7-d4"]),
        ("word-bahnhof", "der Bahnhof.", "bahnhof", ["a1-u7-d4"]),
        ("word-zug", "der Zug.", "zug", ["a1-u7-d4"]),
        ("word-bus", "der Bus.", "bus", ["a1-u7-d4"]),
        ("word-fahrrad", "das Fahrrad.", "fahrrad", ["a1-u7-d4"]),
        ("word-aufstehen", "aufstehen.", "aufstehen", ["a1-u7-d5"]),
        ("word-anrufen", "anrufen.", "anrufen", ["a1-u7-d5"]),
        ("word-fernsehen", "fernsehen.", "fernsehen", ["a1-u7-d5"]),
        ("word-einkaufen", "einkaufen.", "einkaufen", ["a1-u7-d5"]),
        ("word-aufraeumen", "aufräumen.", "aufraeumen", ["a1-u7-d5"]),
        ("word-fruehstuecken", "frühstücken.", "fruehstuecken", ["a1-u7-d5"]),
        ("word-abwaschen", "abwaschen.", "abwaschen", ["a1-u7-d5"]),
        ("word-haushalt", "der Haushalt.", "haushalt", ["a1-u7-d5"]),
        ("word-waesche", "die Wäsche.", "waesche", ["a1-u7-d5"]),
        ("word-muell", "der Müll.", "muell", ["a1-u7-d5"]),
        ("word-buch", "das Buch.", "buch", ["a1-u7-d5"]),
        ("word-besuch", "der Besuch.", "besuch", ["a1-u7-d5"]),
        ("word-urlaub", "der Urlaub.", "urlaub", ["a1-u7-d5"]),
        ("word-koffer", "der Koffer.", "koffer", ["a1-u7-d5"]),
        ("word-reise", "die Reise.", "reise", ["a1-u7-d5"]),
        ("word-huebsch", "hübsch.", "huebsch", ["a1-u7-d5"]),
        ("word-feiern", "feiern.", "feiern", ["a1-u7-d5"]),
        ("word-hose", "die Hose.", "hose", ["a1-u8-d1"]),
        ("word-hemd", "das Hemd.", "hemd", ["a1-u8-d1"]),
        ("word-schuh", "der Schuh.", "schuh", ["a1-u8-d1"]),
        ("word-jacke", "die Jacke.", "jacke", ["a1-u8-d1"]),
        ("word-mantel", "der Mantel.", "mantel", ["a1-u8-d1"]),
        ("word-kleid", "das Kleid.", "kleid", ["a1-u8-d1"]),
        ("word-rock", "der Rock.", "rock", ["a1-u8-d1"]),
        ("word-socke", "die Socke.", "socke", ["a1-u8-d1"]),
        ("word-hut", "der Hut.", "hut", ["a1-u8-d1"]),
        ("word-pullover", "der Pullover.", "pullover", ["a1-u8-d1"]),
        ("word-groesse", "die Größe.", "groesse", ["a1-u8-d1"]),
        ("word-farbe", "die Farbe.", "farbe", ["a1-u8-d1"]),
        ("word-cent", "der Cent.", "cent", ["a1-u8-d2"]),
        ("word-rabatt", "der Rabatt.", "rabatt", ["a1-u8-d2"]),
        ("word-angebot", "das Angebot.", "angebot", ["a1-u8-d2"]),
        ("word-guenstig", "günstig.", "guenstig", ["a1-u8-d2"]),
        ("word-wechselgeld", "das Wechselgeld.", "wechselgeld", ["a1-u8-d2"]),
        ("word-verkaufen", "verkaufen.", "verkaufen", ["a1-u8-d2"]),
        ("word-verkaeufer", "der Verkäufer.", "verkaeufer", ["a1-u8-d2"]),
        ("word-kunde", "der Kunde.", "kunde", ["a1-u8-d2"]),
        ("word-supermarkt", "der Supermarkt.", "supermarkt", ["a1-u8-d2"]),
        ("word-geschaeft", "das Geschäft.", "geschaeft", ["a1-u8-d2"]),
        ("word-markt", "der Markt.", "markt", ["a1-u8-d2"]),
        ("word-anprobieren", "anprobieren.", "anprobieren", ["a1-u8-d2"]),
        ("word-passen", "passen.", "passen", ["a1-u8-d3"]),
        ("word-stueck", "das Stück.", "stueck", ["a1-u8-d3"]),
        ("word-korb", "der Korb.", "korb", ["a1-u8-d3"]),
        ("word-wagen", "der Wagen.", "wagen", ["a1-u8-d3"]),
        ("word-kleidung", "die Kleidung.", "kleidung", ["a1-u8-d3"]),
        ("word-kreditkarte", "die Kreditkarte.", "kreditkarte", ["a1-u8-d3"]),
        ("word-regenschirm", "der Regenschirm.", "regenschirm", ["a1-u8-d3"]),
        ("word-rucksack", "der Rucksack.", "rucksack", ["a1-u8-d3"]),
        ("word-guertel", "der Gürtel.", "guertel", ["a1-u8-d3"]),
        ("word-abteilung", "die Abteilung.", "abteilung", ["a1-u8-d3"]),
        ("word-finden", "finden.", "finden", ["a1-u8-d3"]),
        ("word-moeglich", "möglich.", "moeglich", ["a1-u8-d3"]),
        ("word-nach", "nach.", "nach", ["a1-u8-d4"]),
        ("word-aus", "aus.", "aus", ["a1-u8-d4"]),
        ("word-zu", "zu.", "zu", ["a1-u8-d4"]),
        ("word-taxi", "das Taxi.", "taxi", ["a1-u8-d4"]),
        ("word-fliegen", "fliegen.", "fliegen", ["a1-u8-d4"]),
        ("word-flug", "der Flug.", "flug", ["a1-u8-d4"]),
        ("word-flughafen", "der Flughafen.", "flughafen", ["a1-u8-d4"]),
        ("word-parken", "parken.", "parken", ["a1-u8-d4"]),
        ("word-rad", "das Rad.", "rad", ["a1-u8-d4"]),
        ("word-bahn", "die Bahn.", "bahn", ["a1-u8-d4"]),
        ("word-abholen", "abholen.", "abholen", ["a1-u8-d4"]),
        ("word-gepaeck", "das Gepäck.", "gepaeck", ["a1-u8-d4"]),
        ("word-von", "von.", "von", ["a1-u8-d5"]),
        ("word-seit", "seit.", "seit", ["a1-u8-d5"]),
        ("word-bei", "bei.", "bei", ["a1-u8-d5"]),
        ("word-verhandeln", "verhandeln.", "verhandeln", ["a1-u8-d5"]),
        ("word-quittung", "die Quittung.", "quittung", ["a1-u8-d5"]),
        ("word-umtausch", "der Umtausch.", "umtausch", ["a1-u8-d5"]),
        ("word-schmuck", "der Schmuck.", "schmuck", ["a1-u8-d5"]),
        ("word-ring", "der Ring.", "ring", ["a1-u8-d5"]),
        ("word-kette", "die Kette.", "kette", ["a1-u8-d5"]),
        ("word-stiefel", "der Stiefel.", "stiefel", ["a1-u8-d5"]),
        ("word-mode", "die Mode.", "mode", ["a1-u8-d5"]),
        ("word-tuete", "die Tüte.", "tuete", ["a1-u8-d5"]),
        ("word-geschenk", "das Geschenk.", "geschenk", ["a1-u8-d5"]),
        ("word-sparen", "sparen.", "sparen", ["a1-u8-d5"]),
        ("word-sonnenbrille", "die Sonnenbrille.", "sonnenbrille", ["a1-u8-d5"]),
        ("word-baeckerei", "die Bäckerei.", "baeckerei", ["a1-u8-d5"]),
        ("word-schalter", "der Schalter.", "schalter", ["a1-u8-d5"]),
    ("word-kirche", "die Kirche.", "kirche", ["a1-u9-d1"]),
    ("word-krankenhaus", "das Krankenhaus.", "krankenhaus", ["a1-u9-d1"]),
    ("word-apotheke", "die Apotheke.", "apotheke", ["a1-u9-d1"]),
    ("word-universitaet", "die Universität.", "universitaet", ["a1-u9-d1"]),
    ("word-bank", "die Bank.", "bank", ["a1-u9-d1"]),
    ("word-post", "die Post.", "post", ["a1-u9-d1"]),
    ("word-park", "der Park.", "park", ["a1-u9-d1"]),
    ("word-museum", "das Museum.", "museum", ["a1-u9-d1"]),
    ("word-platz", "der Platz.", "platz", ["a1-u9-d1"]),
    ("word-nord", "der Norden.", "nord", ["a1-u9-d1"]),
    ("word-sued", "der Süden.", "sued", ["a1-u9-d1"]),
    ("word-ost", "der Osten.", "ost", ["a1-u9-d1"]),
    ("word-west", "der Westen.", "west", ["a1-u9-d1"]),
    ("word-gegenueber", "gegenüber.", "gegenueber", ["a1-u9-d1"]),
    ("word-hier", "hier.", "hier", ["a1-u2-d1", "a1-u9-d1"]),
    ("word-dort", "dort.", "dort", ["a1-u2-d1", "a1-u9-d1"]),
    ("word-geradeaus", "geradeaus.", "geradeaus", ["a1-u9-d1"]),
    ("word-zurueck", "zurück.", "zurueck", ["a1-u9-d1"]),
    ("word-haltestelle", "die Haltestelle.", "haltestelle", ["a1-u9-d2"]),
    ("word-hauptbahnhof", "der Hauptbahnhof.", "hauptbahnhof", ["a1-u9-d2"]),
    ("word-bahnsteig", "der Bahnsteig.", "bahnsteig", ["a1-u9-d2"]),
    ("word-abfahrt", "die Abfahrt.", "abfahrt", ["a1-u9-d2"]),
    ("word-ankunft", "die Ankunft.", "ankunft", ["a1-u9-d2"]),
    ("word-verkehr", "der Verkehr.", "verkehr", ["a1-u9-d2"]),
    ("word-linie", "die Linie.", "linie", ["a1-u9-d2"]),
    ("word-kreuzung", "die Kreuzung.", "kreuzung", ["a1-u9-d2"]),
    ("word-richtung", "die Richtung.", "richtung", ["a1-u9-d2"]),
    ("word-umsteigen", "umsteigen.", "umsteigen", ["a1-u9-d2"]),
    ("word-einsteigen", "einsteigen.", "einsteigen", ["a1-u9-d2"]),
    ("word-aussteigen", "aussteigen.", "aussteigen", ["a1-u9-d2"]),
    ("word-weit", "weit.", "weit", ["a1-u9-d2"]),
    ("word-nah", "nah.", "nah", ["a1-u9-d2"]),
    ("word-ueberall", "überall.", "ueberall", ["a1-u9-d2"]),
    ("word-vorbei", "vorbei.", "vorbei", ["a1-u9-d2"]),
    ("word-hin", "hin.", "hin", ["a1-u9-d2"]),
    ("word-entschuldigung", "die Entschuldigung.", "entschuldigung", ["a1-u9-d3"]),
    ("word-stadtplan", "der Stadtplan.", "stadtplan", ["a1-u9-d3"]),
    ("word-auskunft", "die Auskunft.", "auskunft", ["a1-u9-d3"]),
    ("word-eingang", "der Eingang.", "eingang", ["a1-u9-d3"]),
    ("word-ausgang", "der Ausgang.", "ausgang", ["a1-u9-d3"]),
    ("word-problem", "das Problem.", "problem", ["a1-u9-d3"]),
    ("word-helfen", "helfen.", "helfen", ["a1-u9-d3"]),
    ("word-abbiegen", "abbiegen.", "abbiegen", ["a1-u9-d3"]),
    ("word-zuerst", "zuerst.", "zuerst", ["a1-u9-d3"]),
    ("word-danach", "danach.", "danach", ["a1-u9-d3"]),
    ("word-sofort", "sofort.", "sofort", ["a1-u9-d3"]),
    ("word-gerne", "gerne.", "gerne", ["a1-u9-d3"]),
    ("word-an", "an.", "an", ["a1-u9-d4"]),
    ("word-in", "in.", "in", ["a1-u9-d4"]),
    ("word-vor", "vor.", "vor", ["a1-u9-d4"]),
    ("word-gegen", "gegen.", "gegen", ["a1-u9-d4"]),
    ("word-bruecke", "die Brücke.", "bruecke", ["a1-u9-d4"]),
    ("word-tunnel", "der Tunnel.", "tunnel", ["a1-u9-d4"]),
    ("word-ufer", "das Ufer.", "ufer", ["a1-u9-d4"]),
    ("word-seite", "die Seite.", "seite", ["a1-u9-d4"]),
    ("word-parkplatz", "der Parkplatz.", "parkplatz", ["a1-u9-d4"]),
    ("word-aufzug", "der Aufzug.", "aufzug", ["a1-u9-d4"]),
    ("word-naehe", "die Nähe.", "naehe", ["a1-u9-d4"]),
    ("word-meter", "der Meter.", "meter", ["a1-u9-d4"]),
    ("word-bald", "bald.", "bald", ["a1-u9-d5"]),
    ("word-puenktlich", "pünktlich.", "puenktlich", ["a1-u9-d5"]),
    ("word-stau", "der Stau.", "stau", ["a1-u9-d5"]),
    ("word-grund", "der Grund.", "grund", ["a1-u9-d5"]),
    ("word-verbindung", "die Verbindung.", "verbindung", ["a1-u9-d5"]),
    ("word-fahrplan", "der Fahrplan.", "fahrplan", ["a1-u9-d5"]),
    ("word-wetter", "das Wetter.", "wetter", ["a1-u10-d1"]),
    ("word-sonne", "die Sonne.", "sonne", ["a1-u3-d4", "a1-u10-d1"]),
    ("word-regen", "der Regen.", "regen", ["a1-u10-d1"]),
    ("word-schnee", "der Schnee.", "schnee", ["a1-u10-d1"]),
    ("word-wind", "der Wind.", "wind", ["a1-u10-d1"]),
    ("word-wolke", "die Wolke.", "wolke", ["a1-u10-d1"]),
    ("word-himmel", "der Himmel.", "himmel", ["a1-u10-d1"]),
    ("word-grad", "der Grad.", "grad", ["a1-u10-d1"]),
    ("word-warm", "warm.", "warm", ["a1-u10-d1"]),
    ("word-kalt", "kalt.", "kalt", ["a1-u10-d1"]),
    ("word-nass", "nass.", "nass", ["a1-u10-d1"]),
    ("word-sonnig", "sonnig.", "sonnig", ["a1-u10-d1"]),
    ("word-kalender", "der Kalender.", "kalender", ["a1-u10-d2"]),
    ("word-datum", "das Datum.", "datum", ["a1-u10-d2"]),
    ("word-dienstag", "der Dienstag.", "dienstag", ["a1-u10-d2"]),
    ("word-mittwoch", "der Mittwoch.", "mittwoch", ["a1-u10-d2"]),
    ("word-donnerstag", "der Donnerstag.", "donnerstag", ["a1-u10-d2"]),
    ("word-freitag", "der Freitag.", "freitag", ["a1-u10-d2"]),
    ("word-samstag", "der Samstag.", "samstag", ["a1-u10-d2"]),
    ("word-einladung", "die Einladung.", "einladung", ["a1-u10-d2"]),
    ("word-absage", "die Absage.", "absage", ["a1-u10-d2"]),
    ("word-frei", "frei.", "frei", ["a1-u10-d2"]),
    ("word-besetzt", "besetzt.", "besetzt", ["a1-u10-d2"]),
    ("word-wochenende", "das Wochenende.", "wochenende", ["a1-u10-d2"]),
    ("word-gestern", "gestern.", "gestern", ["a1-u10-d3"]),
    ("word-vorgestern", "vorgestern.", "vorgestern", ["a1-u10-d3"]),
    ("word-letzt", "letzt.", "letzt", ["a1-u10-d3"]),
    ("word-bringen", "bringen.", "bringen", ["a1-u10-d3"]),
    ("word-holen", "holen.", "holen", ["a1-u10-d3"]),
    ("word-lernen", "lernen.", "lernen", ["a1-u10-d3"]),
    ("word-sagen", "sagen.", "sagen", ["a1-u10-d3"]),
    ("word-fragen", "fragen.", "fragen", ["a1-u10-d3"]),
    ("word-denken", "denken.", "denken", ["a1-u10-d3"]),
    ("word-brief", "der Brief.", "brief", ["a1-u10-d3"]),
    ("word-paket", "das Paket.", "paket", ["a1-u10-d3"]),
    ("word-spaziergang", "der Spaziergang.", "spaziergang", ["a1-u10-d3"]),
    ("word-neulich", "neulich.", "neulich", ["a1-u10-d4"]),
    ("word-damals", "damals.", "damals", ["a1-u10-d4"]),
    ("word-vorher", "vorher.", "vorher", ["a1-u10-d4"]),
    ("word-nachher", "nachher.", "nachher", ["a1-u10-d4"]),
    ("word-endlich", "endlich.", "endlich", ["a1-u10-d4"]),
    ("word-ploetzlich", "plötzlich.", "ploetzlich", ["a1-u10-d4"]),
    ("word-vereinbaren", "vereinbaren.", "vereinbaren", ["a1-u10-d4"]),
    ("word-aufschreiben", "aufschreiben.", "aufschreiben", ["a1-u10-d4"]),
    ("word-erinnerung", "die Erinnerung.", "erinnerung", ["a1-u10-d4"]),
    ("word-notiz", "die Notiz.", "notiz", ["a1-u10-d4"]),
    ("word-richtig", "richtig.", "richtig", ["a1-u10-d4"]),
    ("word-falsch", "falsch.", "falsch", ["a1-u10-d4"]),
    ("word-weil", "weil.", "weil", ["a1-u10-d5"]),
    ("word-warum", "warum.", "warum", ["a1-u10-d5"]),
    ("word-deshalb", "deshalb.", "deshalb", ["a1-u10-d5"]),
    ("word-darum", "darum.", "darum", ["a1-u10-d5"]),
    ("word-wichtig", "wichtig.", "wichtig", ["a1-u10-d5"]),
    ("word-dringend", "dringend.", "dringend", ["a1-u10-d5"]),
    ("word-krank", "krank.", "krank", ["a1-u10-d5"]),
    ("word-unwohl", "unwohl.", "unwohl", ["a1-u10-d5"]),
    ("word-ruhe", "die Ruhe.", "ruhe", ["a1-u10-d5"]),
    ("word-stress", "der Stress.", "stress", ["a1-u10-d5"]),
    ("word-notfall", "der Notfall.", "notfall", ["a1-u10-d5"]),
    ("word-ausruhen", "ausruhen.", "ausruhen", ["a1-u10-d5"]),
    ("word-kopf", "der Kopf.", "kopf", ["a1-u11-d1"]),
    ("word-hand", "die Hand.", "hand", ["a1-u11-d1"]),
    ("word-arm", "der Arm.", "arm", ["a1-u11-d1"]),
    ("word-bein", "das Bein.", "bein", ["a1-u11-d1"]),
    ("word-ruecken", "der Rücken.", "ruecken", ["a1-u11-d1"]),
    ("word-bauch", "der Bauch.", "bauch", ["a1-u11-d1"]),
    ("word-hals", "der Hals.", "hals", ["a1-u11-d1"]),
    ("word-auge", "das Auge.", "auge", ["a1-u11-d1"]),
    ("word-nase", "die Nase.", "nase", ["a1-u11-d1"]),
    ("word-mund", "der Mund.", "mund", ["a1-u11-d1"]),
    ("word-zahn", "der Zahn.", "zahn", ["a1-u11-d1"]),
    ("word-finger", "der Finger.", "finger", ["a1-u11-d1"]),
    ("word-arzt", "der Arzt.", "arzt", ["a1-u11-d2"]),
    ("word-aerztin", "die Ärztin.", "aerztin", ["a1-u11-d2"]),
    ("word-schmerz", "der Schmerz.", "schmerz", ["a1-u11-d2"]),
    ("word-kopfschmerz", "der Kopfschmerz.", "kopfschmerz", ["a1-u11-d2"]),
    ("word-fieber", "das Fieber.", "fieber", ["a1-u11-d2"]),
    ("word-erkaeltung", "die Erkältung.", "erkaeltung", ["a1-u11-d2"]),
    ("word-grippe", "die Grippe.", "grippe", ["a1-u11-d2"]),
    ("word-schwindel", "der Schwindel.", "schwindel", ["a1-u11-d2"]),
    ("word-medikament", "das Medikament.", "medikament", ["a1-u11-d2"]),
    ("word-tablette", "die Tablette.", "tablette", ["a1-u11-d2"]),
    ("word-rezept", "das Rezept.", "rezept", ["a1-u11-d2"]),
    ("word-untersuchen", "untersuchen.", "untersuchen", ["a1-u11-d2"]),
    ("word-bleiben", "bleiben.", "bleiben", ["a1-u11-d3"]),
    ("word-liegen", "liegen.", "liegen", ["a1-u11-d3"]),
    ("word-wieder", "wieder.", "wieder", ["a1-u11-d3"]),
    ("word-schwach", "schwach.", "schwach", ["a1-u11-d3"]),
    ("word-besser", "besser.", "besser", ["a1-u11-d3"]),
    ("word-fit", "fit.", "fit", ["a1-u11-d3"]),
    ("word-husten", "husten.", "husten", ["a1-u11-d3"]),
    ("word-niesen", "niesen.", "niesen", ["a1-u11-d3"]),
    ("word-jucken", "jucken.", "jucken", ["a1-u11-d3"]),
    ("word-brennen", "brennen.", "brennen", ["a1-u11-d3"]),
    ("word-verschwinden", "verschwinden.", "verschwinden", ["a1-u11-d3"]),
    ("word-dauern", "dauern.", "dauern", ["a1-u11-d3"]),
    ("word-fuehlen", "sich fühlen.", "fuehlen", ["a1-u11-d4"]),
    ("word-verbinden", "verbinden.", "verbinden", ["a1-u11-d4"]),
    ("word-wunde", "die Wunde.", "wunde", ["a1-u11-d4"]),
    ("word-blut", "das Blut.", "blut", ["a1-u11-d4"]),
    ("word-bluten", "bluten.", "bluten", ["a1-u11-d4"]),
    ("word-spritze", "die Spritze.", "spritze", ["a1-u11-d4"]),
    ("word-impfung", "die Impfung.", "impfung", ["a1-u11-d4"]),
    ("word-schlucken", "schlucken.", "schlucken", ["a1-u11-d4"]),
    ("word-rauchen", "rauchen.", "rauchen", ["a1-u11-d4"]),
    ("word-erlauben", "erlauben.", "erlauben", ["a1-u11-d4"]),
    ("word-thermometer", "das Thermometer.", "thermometer", ["a1-u11-d4"]),
    ("word-pflaster", "das Pflaster.", "pflaster", ["a1-u11-d4"]),
    ("word-patient", "der Patient.", "patient", ["a1-u11-d5"]),
    ("word-hausarzt", "der Hausarzt.", "hausarzt", ["a1-u11-d5"]),
    ("word-spezialist", "der Spezialist.", "spezialist", ["a1-u11-d5"]),
    ("word-notaufnahme", "die Notaufnahme.", "notaufnahme", ["a1-u11-d5"]),
    ("word-krankenwagen", "der Krankenwagen.", "krankenwagen", ["a1-u11-d5"]),
    ("word-unfall", "der Unfall.", "unfall", ["a1-u11-d5"]),
    ("word-schnupfen", "der Schnupfen.", "schnupfen", ["a1-u11-d5"]),
    ("word-zahnschmerz", "der Zahnschmerz.", "zahnschmerz", ["a1-u11-d5"]),
    ("word-bauchschmerz", "der Bauchschmerz.", "bauchschmerz", ["a1-u11-d5"]),
    ("word-schmerzen", "schmerzen.", "schmerzen", ["a1-u11-d5"]),
    ("word-tropfen", "die Tropfen.", "tropfen", ["a1-u11-d5"]),
    ("word-salbe", "die Salbe.", "salbe", ["a1-u11-d5"]),
    ("word-ziel", "das Ziel.", "ziel", ["a1-u12-d1"]),
    ("word-hotel", "das Hotel.", "hotel", ["a1-u12-d1"]),
    ("word-reservierung", "die Reservierung.", "reservierung", ["a1-u12-d1"]),
    ("word-fahrt", "die Fahrt.", "fahrt", ["a1-u12-d1"]),
    ("word-abfahren", "abfahren.", "abfahren", ["a1-u12-d1"]),
    ("word-besichtigen", "besichtigen.", "besichtigen", ["a1-u12-d1"]),
    ("word-sehenswuerdigkeit", "die Sehenswürdigkeit.", "sehenswuerdigkeit", ["a1-u12-d1"]),
    ("word-ausland", "das Ausland.", "ausland", ["a1-u12-d1"]),
    ("word-pass", "der Pass.", "pass", ["a1-u12-d1"]),
    ("word-visum", "das Visum.", "visum", ["a1-u12-d1"]),
    ("word-ausflug", "der Ausflug.", "ausflug", ["a1-u12-d1"]),
    ("word-tourist", "der Tourist.", "tourist", ["a1-u12-d1"]),
    ("word-gleis", "das Gleis.", "gleis", ["a1-u12-d2"]),
    ("word-rezeption", "die Rezeption.", "rezeption", ["a1-u12-d2"]),
    ("word-doppelzimmer", "das Doppelzimmer.", "doppelzimmer", ["a1-u12-d2"]),
    ("word-einzelzimmer", "das Einzelzimmer.", "einzelzimmer", ["a1-u12-d2"]),
    ("word-aussicht", "die Aussicht.", "aussicht", ["a1-u12-d2"]),
    ("word-bad", "das Bad.", "bad", ["a1-u12-d2"]),
    ("word-buchen", "buchen.", "buchen", ["a1-u12-d2"]),
    ("word-empfang", "der Empfang.", "empfang", ["a1-u12-d2"]),
    ("word-halle", "die Halle.", "halle", ["a1-u12-d2"]),
    ("word-verspaetung", "die Verspätung.", "verspaetung", ["a1-u12-d2"]),
    ("word-verpassen", "verpassen.", "verpassen", ["a1-u12-d2"]),
    ("word-zurueckgeben", "zurückgeben.", "zurueckgeben", ["a1-u12-d2"]),
    ("word-losfahren", "losfahren.", "losfahren", ["a1-u12-d3"]),
    ("word-zurueckkommen", "zurückkommen.", "zurueckkommen", ["a1-u12-d3"]),
    ("word-mitbringen", "mitbringen.", "mitbringen", ["a1-u12-d3"]),
    ("word-ansehen", "ansehen.", "ansehen", ["a1-u12-d3"]),
    ("word-mitnehmen", "mitnehmen.", "mitnehmen", ["a1-u12-d3"]),
    ("word-ausgeben", "ausgeben.", "ausgeben", ["a1-u12-d3"]),
    ("word-einpacken", "einpacken.", "einpacken", ["a1-u12-d3"]),
    ("word-auspacken", "auspacken.", "auspacken", ["a1-u12-d3"]),
    ("word-anmelden", "anmelden.", "anmelden", ["a1-u12-d3"]),
    ("word-aufpassen", "aufpassen.", "aufpassen", ["a1-u12-d3"]),
    ("word-mieten", "mieten.", "mieten", ["a1-u12-d3"]),
    ("word-planen", "planen.", "planen", ["a1-u12-d3"]),
    ("word-denn", "denn.", "denn", ["a1-u12-d4"]),
    ("word-sondern", "sondern.", "sondern", ["a1-u12-d4"]),
    ("word-deswegen", "deswegen.", "deswegen", ["a1-u12-d4"]),
    ("word-leider", "leider.", "leider", ["a1-u12-d4"]),
    ("word-vielleicht", "vielleicht.", "vielleicht", ["a1-u12-d4"]),
    ("word-dann", "dann.", "dann", ["a1-u12-d4"]),
    ("word-zuletzt", "zuletzt.", "zuletzt", ["a1-u12-d4"]),
    ("word-beispiel", "das Beispiel.", "beispiel", ["a1-u12-d4"]),
    ("word-meinung", "die Meinung.", "meinung", ["a1-u12-d4"]),
    ("word-vorschlag", "der Vorschlag.", "vorschlag", ["a1-u12-d4"]),
    ("word-idee", "die Idee.", "idee", ["a1-u12-d4"]),
    ("word-plan", "der Plan.", "plan", ["a1-u12-d4"]),
    ("word-landschaft", "die Landschaft.", "landschaft", ["a1-u12-d5"]),
    ("word-natur", "die Natur.", "natur", ["a1-u12-d5"]),
    ("word-see", "der See.", "see", ["a1-u12-d5"]),
    ("word-berg", "der Berg.", "berg", ["a1-u12-d5"]),
    ("word-meer", "das Meer.", "meer", ["a1-u12-d5"]),
    ("word-strand", "der Strand.", "strand", ["a1-u12-d5"]),
    ("word-insel", "die Insel.", "insel", ["a1-u12-d5"]),
    ("word-fluss", "der Fluss.", "fluss", ["a1-u12-d5"]),
    ("word-wald", "der Wald.", "wald", ["a1-u12-d5"]),
    ("word-andenken", "das Andenken.", "andenken", ["a1-u12-d5"]),
    ("word-fotografieren", "fotografieren.", "fotografieren", ["a1-u12-d5"]),
    ("word-postkarte", "die Postkarte.", "postkarte", ["a1-u12-d5"]),
    # A2 — الوحدة 1 «العودة والماضي» (D101)
    ("word-licht", "das Licht.", "licht", ["a2-u1-d1"]),
    ("word-vergessen", "vergessen.", "vergessen", ["a2-u1-d1"]),
    ("word-lachen", "lachen.", "lachen", ["a2-u1-d1"]),
    ("word-schon", "schon.", "schon", ["a2-u1-d1"]),
    ("word-ausgehen", "ausgehen.", "ausgehen", ["a2-u1-d1"]),
    ("word-beeilen", "sich beeilen.", "beeilen", ["a2-u1-d1"]),
    ("word-fallen", "fallen.", "fallen", ["a2-u1-d1"]),
    ("word-gerade", "gerade.", "gerade", ["a2-u1-d1"]),
    ("word-anmachen", "anmachen.", "anmachen", ["a2-u1-d1"]),
    ("word-verlieren", "verlieren.", "verlieren", ["a2-u1-d1"]),
    ("word-passieren", "passieren.", "passieren", ["a2-u1-d1"]),
    ("word-ausmachen", "ausmachen.", "ausmachen", ["a2-u1-d1"]),
    ("word-beginnen", "beginnen.", "beginnen", ["a2-u1-d1"]),
    # A2 — الوحدة 1 «العودة والماضي» (D312 · d2)
    ("word-werden", "werden.", "werden", ["a2-u1-d2"]),
    ("word-weggehen", "weggehen.", "weggehen", ["a2-u1-d2"]),
    ("word-erreichen", "erreichen.", "erreichen", ["a2-u1-d2"]),
    ("word-vorbereiten", "vorbereiten.", "vorbereiten", ["a2-u1-d2"]),
    ("word-verschieben", "verschieben.", "verschieben", ["a2-u1-d2"]),
    ("word-liefern", "liefern.", "liefern", ["a2-u1-d2"]),
    ("word-wegwerfen", "wegwerfen.", "wegwerfen", ["a2-u1-d2"]),
    ("word-sonst", "sonst.", "sonst", ["a2-u1-d2"]),
    ("word-unterwegs", "unterwegs.", "unterwegs", ["a2-u1-d2"]),
    ("word-feierabend", "der Feierabend.", "feierabend", ["a2-u1-d2"]),
    ("word-erfahrung", "die Erfahrung.", "erfahrung", ["a2-u1-d2"]),
    ("word-fleissig", "fleißig.", "fleissig", ["a2-u1-d2"]),
    ("word-faul", "faul.", "faul", ["a2-u1-d2"]),
    # A2 — الوحدة 1 «العودة والماضي» (D313 · d3)
    ("word-zelt", "das Zelt.", "zelt", ["a2-u1-d3"]),
    ("word-jugendherberge", "die Jugendherberge.", "jugendherberge", ["a2-u1-d3"]),
    ("word-unterhalten", "sich unterhalten.", "unterhalten", ["a2-u1-d3"]),
    ("word-unterkunft", "die Unterkunft.", "unterkunft", ["a2-u1-d3"]),
    ("word-aufregend", "aufregend.", "aufregend", ["a2-u1-d3"]),
    ("word-aergern", "sich ärgern.", "aergern", ["a2-u1-d3"]),
    ("word-beschweren", "sich beschweren.", "beschweren", ["a2-u1-d3"]),
    ("word-bedanken", "sich bedanken.", "bedanken", ["a2-u1-d3"]),
    ("word-bequem", "bequem.", "bequem", ["a2-u1-d3"]),
    ("word-praktisch", "praktisch.", "praktisch", ["a2-u1-d3"]),
    ("word-sogar", "sogar.", "sogar", ["a2-u1-d3"]),
    ("word-ausserdem", "außerdem.", "ausserdem", ["a2-u1-d3"]),
    ("word-reiten", "reiten.", "reiten", ["a2-u1-d3"]),
    # A2 — الوحدة 1 «العودة والماضي» (D314 · d4)
    ("word-ferien", "die Ferien.", "ferien", ["a2-u1-d4"]),
    ("word-streiten", "sich streiten.", "streiten", ["a2-u1-d4"]),
    ("word-erinnern", "sich erinnern.", "erinnern", ["a2-u1-d4"]),
    ("word-hoffen", "hoffen.", "hoffen", ["a2-u1-d4"]),
    ("word-wunsch", "der Wunsch.", "wunsch", ["a2-u1-d4"]),
    ("word-traum", "der Traum.", "traum", ["a2-u1-d4"]),
    ("word-traeumen", "träumen.", "traeumen", ["a2-u1-d4"]),
    ("word-angst", "die Angst.", "angst", ["a2-u1-d4"]),
    ("word-weinen", "weinen.", "weinen", ["a2-u1-d4"]),
    ("word-traurig", "traurig.", "traurig", ["a2-u1-d4"]),
    ("word-heft", "das Heft.", "heft", ["a2-u1-d4"]),
    ("word-sehr", "sehr.", "sehr", ["a2-u1-d4"]),
    ("word-wirklich", "wirklich.", "wirklich", ["a2-u1-d4"]),
    # A2 — الوحدة 1 «العودة والماضي» (D315 · d5)
    ("word-verreisen", "verreisen.", "verreisen", ["a2-u1-d5"]),
    ("word-verletzen", "sich verletzen.", "verletzen", ["a2-u1-d5"]),
    ("word-meinen", "meinen.", "meinen", ["a2-u1-d5"]),
    ("word-singen", "singen.", "singen", ["a2-u1-d5"]),
    ("word-schneiden", "schneiden.", "schneiden", ["a2-u1-d5"]),
    ("word-verlieben", "sich verlieben.", "verlieben", ["a2-u1-d5"]),
    ("word-merken", "sich merken.", "merken", ["a2-u1-d5"]),
    ("word-feier", "die Feier.", "feier", ["a2-u1-d5"]),
    ("word-witz", "der Witz.", "witz", ["a2-u1-d5"]),
    ("word-geschichte", "die Geschichte.", "geschichte", ["a2-u1-d5"]),
    ("word-erst", "erst.", "erst", ["a2-u1-d5"]),
    ("word-fast", "fast.", "fast", ["a2-u1-d5"]),
    ("word-ganz", "ganz.", "ganz", ["a2-u1-d5"]),
    # A2 — الوحدة 1 «العودة والماضي» (D316 · d6 توليف)
    ("word-stift", "der Stift.", "stift", ["a2-u1-d6"]),
    ("word-zeugnis", "das Zeugnis.", "zeugnis", ["a2-u1-d6"]),
    # A2 — الوحدة 2 «العمل والمهنة» (D318 · d1)
    ("word-ausbildung", "die Ausbildung.", "ausbildung", ["a2-u2-d1"]),
    ("word-bewerben", "sich bewerben.", "bewerben", ["a2-u2-d1"]),
    ("word-bewerbung", "die Bewerbung.", "bewerbung", ["a2-u2-d1"]),
    ("word-buero", "das Büro.", "buero", ["a2-u2-d1"]),
    ("word-gehalt", "das Gehalt.", "gehalt", ["a2-u2-d1"]),
    ("word-kuendigen", "kündigen.", "kuendigen", ["a2-u2-d1"]),
    ("word-mitarbeiter", "der Mitarbeiter.", "mitarbeiter", ["a2-u2-d1"]),
    ("word-projekt", "das Projekt.", "projekt", ["a2-u2-d1"]),
    ("word-teilnehmen", "teilnehmen.", "teilnehmen", ["a2-u2-d1"]),
    ("word-organisieren", "organisieren.", "organisieren", ["a2-u2-d1"]),
    ("word-werkstatt", "die Werkstatt.", "werkstatt", ["a2-u2-d1"]),
    ("word-bis", "bis.", "bis", ["a2-u2-d1"]),
    ("word-pro", "pro.", "pro", ["a2-u2-d1"]),
    # A2 — الوحدة 2 «العمل والمهنة» (D319 · d2)
    ("word-waehlen", "wählen.", "waehlen", ["a2-u2-d2"]),
    ("word-luegen", "lügen.", "luegen", ["a2-u2-d2"]),
    ("word-erlaubnis", "die Erlaubnis.", "erlaubnis", ["a2-u2-d2"]),
    ("word-verbieten", "verbieten.", "verbieten", ["a2-u2-d2"]),
    ("word-team", "das Team.", "team", ["a2-u2-d2"]),
    ("word-wettbewerb", "der Wettbewerb.", "wettbewerb", ["a2-u2-d2"]),
    ("word-sicher", "sicher.", "sicher", ["a2-u2-d2"]),
    ("word-froh", "froh.", "froh", ["a2-u2-d2"]),
    ("word-einverstanden", "einverstanden.", "einverstanden", ["a2-u2-d2"]),
    ("word-vergleichen", "vergleichen.", "vergleichen", ["a2-u2-d2"]),
    ("word-raten", "raten.", "raten", ["a2-u2-d2"]),
    ("word-luege", "die Lüge.", "luege", ["a2-u2-d2"]),
    ("word-wahr", "wahr.", "wahr", ["a2-u2-d2"]),
    # A2 — الوحدة 2 «العمل والمهنة» (D320 · d3)
    ("word-interview", "das Interview.", "interview", ["a2-u2-d3"]),
    ("word-anzug", "der Anzug.", "anzug", ["a2-u2-d3"]),
    ("word-vertrag", "der Vertrag.", "vertrag", ["a2-u2-d3"]),
    ("word-bescheid", "der Bescheid.", "bescheid", ["a2-u2-d3"]),
    ("word-kenntnisse", "die Kenntnisse.", "kenntnisse", ["a2-u2-d3"]),
    ("word-beantworten", "beantworten.", "beantworten", ["a2-u2-d3"]),
    ("word-nennen", "nennen.", "nennen", ["a2-u2-d3"]),
    ("word-begruenden", "begründen.", "begruenden", ["a2-u2-d3"]),
    ("word-informieren", "sich informieren.", "informieren", ["a2-u2-d3"]),
    ("word-sammeln", "sammeln.", "sammeln", ["a2-u2-d3"]),
    ("word-stattfinden", "stattfinden.", "stattfinden", ["a2-u2-d3"]),
    ("word-nervoes", "nervös.", "nervoes", ["a2-u2-d3"]),
    ("word-sympathisch", "sympathisch.", "sympathisch", ["a2-u2-d3"]),
    # A2 — الوحدة 2 «العمل والمهنة» (D321 · d4)
    ("word-schriftlich", "schriftlich.", "schriftlich", ["a2-u2-d4"]),
    ("word-bestaetigen", "bestätigen.", "bestaetigen", ["a2-u2-d4"]),
    ("word-wuenschen", "wünschen.", "wuenschen", ["a2-u2-d4"]),
    ("word-leidtun", "leidtun.", "leidtun", ["a2-u2-d4"]),
    ("word-hoffentlich", "hoffentlich.", "hoffentlich", ["a2-u2-d4"]),
    ("word-notwendig", "notwendig.", "notwendig", ["a2-u2-d4"]),
    ("word-mailbox", "die Mailbox.", "mailbox", ["a2-u2-d4"]),
    ("word-passwort", "das Passwort.", "passwort", ["a2-u2-d4"]),
    ("word-speichern", "speichern.", "speichern", ["a2-u2-d4"]),
    ("word-tipp", "der Tipp.", "tipp", ["a2-u2-d4"]),
    ("word-klappen", "klappen.", "klappen", ["a2-u2-d4"]),
    ("word-schaffen", "schaffen.", "schaffen", ["a2-u2-d4"]),
    ("word-versuchen", "versuchen.", "versuchen", ["a2-u2-d4"]),
    # A2 — الوحدة 2 «العمل والمهنة» (D322 · d5)
    ("word-krankheit", "die Krankheit.", "krankheit", ["a2-u2-d5"]),
    ("word-gefaehrlich", "gefährlich.", "gefaehrlich", ["a2-u2-d5"]),
    ("word-vorsichtig", "vorsichtig.", "vorsichtig", ["a2-u2-d5"]),
    ("word-streng", "streng.", "streng", ["a2-u2-d5"]),
    ("word-fuehrerschein", "der Führerschein.", "fuehrerschein", ["a2-u2-d5"]),
    ("word-erkaeltet-sein", "erkältet sein.", "erkaeltet-sein", ["a2-u2-d5"]),    ("word-zettel", "der Zettel.", "zettel", ["a2-u2-d5"]),
    ("word-aufmachen", "aufmachen.", "aufmachen", ["a2-u2-d5"]),
    ("word-zumachen", "zumachen.", "zumachen", ["a2-u2-d5"]),
    ("word-beenden", "beenden.", "beenden", ["a2-u2-d5"]),
    ("word-schimpfen", "schimpfen.", "schimpfen", ["a2-u2-d5"]),
    ("word-sauber", "sauber.", "sauber", ["a2-u2-d5"]),
    ("word-deutlich", "deutlich.", "deutlich", ["a2-u2-d5"]),
    # A2 — الوحدة 2 «العمل والمهنة» (D324 · d6)
    ("word-berichten", "berichten.", "berichten", ["a2-u2-d6"]),
    ("word-beraten", "beraten.", "beraten", ["a2-u2-d6"]),
    ("word-neu", "neu.", "neu", ["a1-u1-d1"]),
    ("word-wie-viel", "wie viel.", "wie-viel", ["a1-u1-d1"]),
    ("word-heute", "heute.", "heute", ["a1-u1-d2"]),
    ("word-jetzt", "jetzt.", "jetzt", ["a1-u1-d2"]),
    ("word-schwer", "schwer.", "schwer", ["a1-u1-d2"]),
    ("word-anmeldung", "die Anmeldung.", "anmeldung", ["a1-u1-d3"]),
    ("word-partner", "der Partner.", "partner", ["a1-u1-d3"]),
    ("word-partnerin", "die Partnerin.", "partnerin", ["a1-u1-d3"]),
    ("word-herr", "der Herr.", "herr", ["a1-u1-d3"]),
    ("word-alter", "das Alter.", "alter", ["a1-u1-d4"]),
    ("word-kurs", "der Kurs.", "kurs", ["a1-u1-d4"]),
    ("word-klasse", "die Klasse.", "klasse", ["a1-u1-d4"]),
    ("word-ende", "das Ende.", "ende", ["a1-u1-d5"]),
    ("word-wissen", "wissen.", "wissen", ["a1-u1-d5"]),
    ("word-wort", "das Wort.", "wort", ["a1-u1-d5"]),
    ("word-oft", "oft.", "oft", ["a1-u1-d5"]),
    ("word-ein-bisschen", "ein bisschen.", "ein-bisschen", ["a1-u1-d5"]),
    ("word-schueler", "der Schüler.", "schueler", ["a1-u1-d5"]),
    ("word-schuelerin", "die Schülerin.", "schuelerin", ["a1-u1-d5"]),
    ("word-student", "der Student.", "student", ["a1-u1-d5"]),
    ("word-studentin", "die Studentin.", "studentin", ["a1-u1-d5"]),
    ("word-international", "international.", "international", ["a1-u2-d1"]),
    ("word-mensch", "der Mensch.", "mensch", ["a1-u2-d2"]),
    ("word-ort", "der Ort.", "ort", ["a1-u2-d2"]),
    ("word-das-leben", "das Leben.", "das-leben", ["a1-u2-d2"]),
    ("word-text", "der Text.", "text", ["a1-u2-d3"]),
    ("word-fehler", "der Fehler.", "fehler", ["a1-u2-d3"]),
    ("word-bedeuten", "bedeuten.", "bedeuten", ["a1-u2-d3"]),
    ("word-lehrerin", "die Lehrerin.", "lehrerin", ["a1-u2-d3"]),
    ("word-lang", "lang.", "lang", ["a1-u2-d4"]),
    ("word-lange", "lange.", "lange", ["a1-u2-d4"]),
    ("word-schlecht", "schlecht.", "schlecht", ["a1-u2-d5"]),
    ("word-also", "also.", "also", ["a1-u2-d5"]),
    ("word-gruppe", "die Gruppe.", "gruppe", ["a1-u2-d5"]),
    ("word-oma", "die Oma.", "oma", ["a1-u3-d1"]),
    ("word-das-essen", "das Essen.", "das-essen", ["a1-u3-d1"]),
    ("word-dank", "der Dank.", "dank", ["a1-u3-d2"]),
    ("word-leicht", "leicht.", "leicht", ["a1-u3-d2"]),
    ("word-restaurant", "das Restaurant.", "restaurant", ["a1-u3-d2"]),
    ("word-naechste", "nächste.", "naechste", ["a1-u3-d3"]),
    ("word-geschlossen", "geschlossen.", "geschlossen", ["a1-u3-d3"]),
    ("word-geoeffnet", "geöffnet.", "geoeffnet", ["a1-u3-d3"]),
    ("word-fertig", "fertig.", "fertig", ["a1-u3-d4"]),
    ("word-regnen", "regnen.", "regnen", ["a1-u3-d4"]),
    ("word-scheinen", "scheinen.", "scheinen", ["a1-u3-d4"]),
    ("word-einmal", "einmal.", "einmal", ["a1-u3-d5"]),
    ("word-spaeter", "später.", "spaeter", ["a1-u3-d5"]),
    ("word-aufgabe", "die Aufgabe.", "aufgabe", ["a1-u3-d5"]),
    ("word-grosseltern", "die Großeltern.", "grosseltern", ["a1-u4-d1"]),
    ("word-junge", "der Junge.", "junge", ["a1-u4-d1"]),
    ("word-opa", "der Opa.", "opa", ["a1-u4-d1"]),
    ("word-lieben", "lieben.", "lieben", ["a1-u4-d2"]),
    ("word-beide", "beide.", "beide", ["a1-u4-d3"]),
    ("word-loesung", "die Lösung.", "loesung", ["a1-u4-d3"]),
    ("word-bekannt", "bekannt.", "bekannt", ["a1-u4-d4"]),
    ("word-bekannte", "die Bekannte.", "bekannte", ["a1-u4-d4"]),
    ("word-tot", "tot.", "tot", ["a1-u4-d4"]),
    ("word-glueck", "das Glück.", "glueck", ["a1-u4-d5"]),
    ("word-gluecklich", "glücklich.", "gluecklich", ["a1-u4-d5"]),
    ("word-ihr", "ihr.", "ihr", ["a1-u4-d5"]),
    ("word-lebensmittel", "die Lebensmittel.", "lebensmittel", ["a1-u5-d1"]),
    ("word-apfel", "der Apfel.", "apfel", ["a1-u5-d1"]),
    ("word-moegen", "mögen.", "moegen", ["a1-u5-d1"]),
    ("word-bar", "bar.", "bar", ["a1-u5-d2"]),
    ("word-bekommen", "bekommen.", "bekommen", ["a1-u5-d2"]),
    ("word-die-bitte", "die Bitte.", "die-bitte", ["a1-u5-d2"]),
    ("word-was-fuer-ein", "was für ein.", "was-fuer-ein", ["a1-u5-d3"]),
    ("word-nichts", "nichts.", "nichts", ["a1-u5-d4"]),
    ("word-wenig", "wenig.", "wenig", ["a1-u5-d4"]),
    ("word-breit", "breit.", "breit", ["a1-u6-d1"]),
    ("word-hoch", "hoch.", "hoch", ["a1-u6-d2"]),
    ("word-allein", "allein.", "allein", ["a1-u6-d2"]),
    ("word-raum", "der Raum.", "raum", ["a1-u6-d2"]),
    ("word-jeder", "jeder.", "jeder", ["a1-u6-d3"]),
    ("word-an-sein", "an sein.", "an-sein", ["a1-u6-d3"]),
    ("word-aus-sein", "aus sein.", "aus-sein", ["a1-u6-d3"]),
    ("word-da", "da.", "da", ["a1-u6-d4"]),
    ("word-daneben", "daneben.", "daneben", ["a1-u6-d4"]),
    ("word-weg-sein", "weg sein.", "weg-sein", ["a1-u6-d4"]),
    ("word-darauf", "darauf.", "darauf", ["a1-u6-d5"]),
    ("word-firma", "die Firma.", "firma", ["a1-u7-d1"]),
    ("word-immer", "immer.", "immer", ["a1-u7-d1"]),
    ("word-meisten", "die meisten.", "meisten", ["a1-u7-d1"]),
    ("word-film", "der Film.", "film", ["a1-u7-d2"]),
    ("word-mehr", "mehr.", "mehr", ["a1-u7-d2"]),
    ("word-wandern", "wandern.", "wandern", ["a1-u7-d2"]),
    ("word-hausaufgabe", "die Hausaufgabe.", "hausaufgabe", ["a1-u7-d3"]),
    ("word-nie", "nie.", "nie", ["a1-u7-d3"]),
    ("word-einfach", "einfach.", "einfach", ["a1-u7-d3"]),
    ("word-gleich", "gleich.", "gleich", ["a1-u7-d4"]),
    ("word-ab", "ab.", "ab", ["a1-u7-d4"]),
    ("word-achtung", "Achtung.", "achtung", ["a1-u7-d4"]),
    ("word-dieser", "dieser.", "dieser", ["a1-u8-d1"]),
    ("word-gefallen", "gefallen.", "gefallen", ["a1-u8-d1"]),
    ("word-beste", "beste.", "beste", ["a1-u8-d2"]),
    ("word-circa", "circa.", "circa", ["a1-u8-d2"]),
    ("word-kriegen", "kriegen.", "kriegen", ["a1-u8-d3"]),
    ("word-bitten", "bitten.", "bitten", ["a1-u9-d3"]),
    ("word-erklaeren", "erklären.", "erklaeren", ["a1-u9-d3"]),
    ("word-hilfe", "die Hilfe.", "hilfe", ["a1-u9-d3"]),
    ("word-auf-sein", "auf sein.", "auf-sein", ["a1-u9-d4"]),
    ("word-zu-sein", "zu sein.", "zu-sein", ["a1-u9-d4"]),
    ("word-andere", "andere.", "andere", ["a1-u9-d5"]),
    ("word-weiter", "weiter.", "weiter", ["a1-u9-d5"]),
    ("word-halten", "halten.", "halten", ["a1-u9-d5"]),
    ("word-polizei", "die Polizei.", "polizei", ["a1-u9-d5"]),
    ("word-stelle", "die Stelle.", "stelle", ["a1-u9-d5"]),
    ("word-lieb", "lieb.", "lieb", ["a1-u10-d2"]),
    ("word-moment", "der Moment.", "moment", ["a1-u10-d2"]),
    ("word-enden", "enden.", "enden", ["a1-u10-d2"]),
    ("word-frueher", "früher.", "frueher", ["a1-u10-d3"]),
    ("word-gewinnen", "gewinnen.", "gewinnen", ["a1-u10-d3"]),
    ("word-anfang", "der Anfang.", "anfang", ["a1-u10-d4"]),
    ("word-verein", "der Verein.", "verein", ["a1-u10-d4"]),
    ("word-normal", "normal.", "normal", ["a1-u10-d5"]),
    ("word-job", "der Job.", "job", ["a1-u10-d5"]),
    ("word-verdienen", "verdienen.", "verdienen", ["a1-u10-d5"]),
    ("word-teil", "der Teil.", "teil", ["a1-u11-d1"]),
    ("word-tun", "tun.", "tun", ["a1-u11-d1"]),
    ("word-weh-tun", "weh tun.", "weh-tun", ["a1-u11-d1"]),
    ("word-fehlen", "fehlen.", "fehlen", ["a1-u11-d2"]),
    ("word-ergebnis", "das Ergebnis.", "ergebnis", ["a1-u11-d5"]),
    ("word-blick", "der Blick.", "blick", ["a1-u12-d2"]),
    ("word-internet", "das Internet.", "internet", ["a1-u12-d2"]),
    ("word-information", "die Information.", "information", ["a1-u12-d2"]),
    ("word-zum-beispiel", "zum Beispiel.", "zum-beispiel", ["a1-u12-d4"]),
    ("word-satz", "der Satz.", "satz", ["a1-u12-d4"]),
    ("word-glauben", "glauben.", "glauben", ["a1-u12-d4"]),
    ("word-thema", "das Thema.", "thema", ["a1-u12-d5"]),
    ("word-gut", "gut.", "gut", ["a1-u1-d1"]),
    ("word-winter", "der Winter.", "winter", ["a1-u10-d1"]),
    ("word-sommer", "der Sommer.", "sommer", ["a1-u10-d1"]),
    ("word-fruehling", "der Frühling.", "fruehling", ["a1-u10-d1"]),
    ("word-herbst", "der Herbst.", "herbst", ["a1-u10-d1"]),
    ("word-blau", "blau.", "blau", ["a1-u8-d6"]),
    ("word-rot", "rot.", "rot", ["a1-u8-d6"]),
    ("word-gruen", "grün.", "gruen", ["a1-u8-d6"]),
    ("word-gelb", "gelb.", "gelb", ["a1-u8-d6"]),
    ("word-schwarz", "schwarz.", "schwarz", ["a1-u8-d6"]),
    ("word-weiss", "weiß.", "weiss", ["a1-u8-d6"]),
    ("word-braun", "braun.", "braun", ["a1-u8-d6"]),
    ("word-baby", "das Baby.", "baby", ["a1-u13-d1"]),
    ("word-jugendliche", "der Jugendliche.", "jugendliche", ["a1-u13-d1"]),
    ("word-erwachsene", "der Erwachsene.", "erwachsene", ["a1-u13-d1"]),
    ("word-verwandte", "der Verwandte.", "verwandte", ["a1-u13-d1"]),
    ("word-ehefrau", "die Ehefrau.", "ehefrau", ["a1-u13-d1"]),
    ("word-ehemann", "der Ehemann.", "ehemann", ["a1-u13-d1"]),
    ("word-kindergarten", "der Kindergarten.", "kindergarten", ["a1-u13-d1"]),
    ("word-heiraten", "heiraten.", "heiraten", ["a1-u13-d1"]),
    ("word-hochzeit", "die Hochzeit.", "hochzeit", ["a1-u13-d1"]),
    ("word-gestorben", "gestorben.", "gestorben", ["a1-u13-d1"]),
    ("word-party", "die Party.", "party", ["a1-u13-d1"]),
    ("word-feiertag", "der Feiertag.", "feiertag", ["a1-u13-d1"]),
    ("word-einladen", "einladen.", "einladen", ["a1-u13-d1"]),
    ("word-glueckwunsch", "der Glückwunsch.", "glueckwunsch", ["a1-u13-d1"]),
    ("word-gratulieren", "gratulieren.", "gratulieren", ["a1-u13-d1"]),
    ("word-zufrieden", "zufrieden.", "zufrieden", ["a1-u13-d1"]),
    ("word-freizeit", "die Freizeit.", "freizeit", ["a1-u13-d2"]),
    ("word-sport", "der Sport.", "sport", ["a1-u13-d2"]),
    ("word-mitmachen", "mitmachen.", "mitmachen", ["a1-u13-d2"]),
    ("word-mitkommen", "mitkommen.", "mitkommen", ["a1-u13-d2"]),
    ("word-rad-fahren", "Rad fahren.", "rad-fahren", ["a1-u13-d2"]),
    ("word-schwimmbad", "das Schwimmbad.", "schwimmbad", ["a1-u13-d2"]),
    ("word-cd", "die CD.", "cd", ["a1-u13-d2"]),
    ("word-disco", "die Disco.", "disco", ["a1-u13-d2"]),
    ("word-eintritt", "der Eintritt.", "eintritt", ["a1-u13-d2"]),
    ("word-lied", "das Lied.", "lied", ["a1-u13-d2"]),
    ("word-schluss", "der Schluss.", "schluss", ["a1-u13-d2"]),
    ("word-aufhoeren", "aufhören.", "aufhoeren", ["a1-u13-d2"]),
    ("word-lieblingslied", "das Lieblingslied.", "lieblingslied", ["a1-u13-d2"]),
    ("word-zurzeit", "zurzeit.", "zurzeit", ["a1-u13-d2"]),
    ("word-eilig", "eilig.", "eilig", ["a1-u13-d2"]),
    ("word-banane", "die Banane.", "banane", ["a1-u13-d3"]),
    ("word-birne", "die Birne.", "birne", ["a1-u13-d3"]),
    ("word-schinken", "der Schinken.", "schinken", ["a1-u13-d3"]),
    ("word-oel", "das Öl.", "oel", ["a1-u13-d3"]),
    ("word-pommes-frites", "die Pommes frites.", "pommes-frites", ["a1-u13-d3"]),
    ("word-bitter", "bitter.", "bitter", ["a1-u13-d3"]),
    ("word-riechen", "riechen.", "riechen", ["a1-u13-d3"]),
    ("word-laden", "der Laden.", "laden", ["a1-u13-d3"]),
    ("word-kiosk", "der Kiosk.", "kiosk", ["a1-u13-d3"]),
    ("word-herd", "der Herd.", "herd", ["a1-u13-d3"]),
    ("word-boese", "böse.", "boese", ["a1-u13-d3"]),
    ("word-kaputt", "kaputt.", "kaputt", ["a1-u13-d3"]),
    ("word-fremd", "fremd.", "fremd", ["a1-u13-d3"]),
    ("word-aussehen", "aussehen.", "aussehen", ["a1-u13-d3"]),
    ("word-cafe", "das Café.", "cafe", ["a1-u13-d4"]),
    ("word-lokal", "das Lokal.", "lokal", ["a1-u13-d4"]),
    ("word-empfehlen", "empfehlen.", "empfehlen", ["a1-u13-d4"]),
    ("word-anbieten", "anbieten.", "anbieten", ["a1-u13-d4"]),
    ("word-grillen", "grillen.", "grillen", ["a1-u13-d4"]),
    ("word-draussen", "draußen.", "draussen", ["a1-u13-d4"]),
    ("word-blume", "die Blume.", "blume", ["a1-u13-d4"]),
    ("word-baum", "der Baum.", "baum", ["a1-u13-d4"]),
    ("word-zigarette", "die Zigarette.", "zigarette", ["a1-u13-d4"]),
    ("word-feuer", "das Feuer.", "feuer", ["a1-u13-d4"]),
    ("word-danken", "danken.", "danken", ["a1-u13-d4"]),
    ("word-entschuldigen", "entschuldigen.", "entschuldigen", ["a1-u13-d4"]),
    ("word-willkommen", "willkommen.", "willkommen", ["a1-u13-d4"]),
    ("word-herzlich", "herzlich.", "herzlich", ["a1-u13-d4"]),
    ("word-arbeitsplatz", "der Arbeitsplatz.", "arbeitsplatz", ["a1-u13-d5"]),
    ("word-chef", "der Chef.", "chef", ["a1-u13-d5"]),
    ("word-kollege", "der Kollege.", "kollege", ["a1-u13-d5"]),
    ("word-arbeitslos", "arbeitslos.", "arbeitslos", ["a1-u13-d5"]),
    ("word-selbststaendig", "selbstständig.", "selbststaendig", ["a1-u13-d5"]),
    ("word-praktikum", "das Praktikum.", "praktikum", ["a1-u13-d5"]),
    ("word-hausfrau", "die Hausfrau.", "hausfrau", ["a1-u13-d5"]),
    ("word-hausmann", "der Hausmann.", "hausmann", ["a1-u13-d5"]),
    ("word-studium", "das Studium.", "studium", ["a1-u13-d5"]),
    ("word-maschine", "die Maschine.", "maschine", ["a1-u13-d5"]),
    ("word-unterricht", "der Unterricht.", "unterricht", ["a1-u13-d5"]),
    ("word-kugelschreiber", "der Kugelschreiber.", "kugelschreiber", ["a1-u13-d5"]),
    ("word-bleistift", "der Bleistift.", "bleistift", ["a1-u13-d5"]),
    ("word-papier", "das Papier.", "papier", ["a1-u13-d5"]),
    ("word-anklicken", "anklicken.", "anklicken", ["a1-u13-d5"]),
    ("word-drucken", "drucken.", "drucken", ["a1-u13-d5"]),
    ("word-drucker", "der Drucker.", "drucker", ["a1-u13-d5"]),
    ("word-formular", "das Formular.", "formular", ["a1-u14-d1"]),
    ("word-ausfuellen", "ausfüllen.", "ausfuellen", ["a1-u14-d1"]),
    ("word-familienstand", "der Familienstand.", "familienstand", ["a1-u14-d1"]),
    ("word-ledig", "ledig.", "ledig", ["a1-u14-d1"]),
    ("word-geboren", "geboren.", "geboren", ["a1-u14-d1"]),
    ("word-geburtsjahr", "das Geburtsjahr.", "geburtsjahr", ["a1-u14-d1"]),
    ("word-geburtsort", "der Geburtsort.", "geburtsort", ["a1-u14-d1"]),
    ("word-maennlich", "männlich.", "maennlich", ["a1-u14-d1"]),
    ("word-weiblich", "weiblich.", "weiblich", ["a1-u14-d1"]),
    ("word-unterschrift", "die Unterschrift.", "unterschrift", ["a1-u14-d1"]),
    ("word-unterschreiben", "unterschreiben.", "unterschreiben", ["a1-u14-d1"]),
    ("word-ausweis", "der Ausweis.", "ausweis", ["a1-u14-d1"]),
    ("word-papiere", "die Papiere.", "papiere", ["a1-u14-d1"]),
    ("word-gueltig", "gültig.", "gueltig", ["a1-u14-d1"]),
    ("word-auslaender", "der Ausländer.", "auslaender", ["a1-u14-d1"]),
    ("word-auslaendisch", "ausländisch.", "auslaendisch", ["a1-u14-d1"]),
    ("word-beamte", "der Beamte.", "beamte", ["a1-u14-d2"]),
    ("word-konto", "das Konto.", "konto", ["a1-u14-d2"]),
    ("word-ueberweisen", "überweisen.", "ueberweisen", ["a1-u14-d2"]),
    ("word-postleitzahl", "die Postleitzahl.", "postleitzahl", ["a1-u14-d2"]),
    ("word-absender", "der Absender.", "absender", ["a1-u14-d2"]),
    ("word-empfaenger", "der Empfänger.", "empfaenger", ["a1-u14-d2"]),
    ("word-briefmarke", "die Briefmarke.", "briefmarke", ["a1-u14-d2"]),
    ("word-gewicht", "das Gewicht.", "gewicht", ["a1-u14-d2"]),
    ("word-anrede", "die Anrede.", "anrede", ["a1-u14-d2"]),
    ("word-dame", "die Dame.", "dame", ["a1-u14-d2"]),
    ("word-doktor", "der Doktor.", "doktor", ["a1-u14-d2"]),
    ("word-gruss", "der Gruß.", "gruss", ["a1-u14-d2"]),
    ("word-e-mail", "die E-Mail.", "e-mail", ["a1-u14-d2"]),
    ("word-fax", "das Fax.", "fax", ["a1-u14-d2"]),
    ("word-vorwahl", "die Vorwahl.", "vorwahl", ["a1-u14-d2"]),
    ("word-wiederhoeren", "das Wiederhören.", "wiederhoeren", ["a1-u14-d2"]),
    ("word-anrufbeantworter", "der Anrufbeantworter.", "anrufbeantworter", ["a1-u14-d2"]),
    ("word-s-bahn", "die S-Bahn.", "s-bahn", ["a1-u14-d3"]),
    ("word-strassenbahn", "die Straßenbahn.", "strassenbahn", ["a1-u14-d3"]),
    ("word-autobahn", "die Autobahn.", "autobahn", ["a1-u14-d3"]),
    ("word-lkw", "der Lkw.", "lkw", ["a1-u14-d3"]),
    ("word-fahrer", "der Fahrer.", "fahrer", ["a1-u14-d3"]),
    ("word-ticket", "das Ticket.", "ticket", ["a1-u14-d3"]),
    ("word-durchsage", "die Durchsage.", "durchsage", ["a1-u14-d3"]),
    ("word-flugzeug", "das Flugzeug.", "flugzeug", ["a1-u14-d3"]),
    ("word-abfliegen", "abfliegen.", "abfliegen", ["a1-u14-d3"]),
    ("word-abflug", "der Abflug.", "abflug", ["a1-u14-d3"]),
    ("word-automat", "der Automat.", "automat", ["a1-u14-d3"]),
    ("word-druecken", "drücken.", "druecken", ["a1-u14-d3"]),
    ("word-anzeige", "die Anzeige.", "anzeige", ["a1-u14-d3"]),
    ("word-ansage", "die Ansage.", "ansage", ["a1-u14-d3"]),
    ("word-anschluss", "der Anschluss.", "anschluss", ["a1-u14-d3"]),
    ("word-reisebuero", "das Reisebüro.", "reisebuero", ["a1-u14-d4"]),
    ("word-reisefuehrer", "der Reiseführer.", "reisefuehrer", ["a1-u14-d4"]),
    ("word-prospekt", "der Prospekt.", "prospekt", ["a1-u14-d4"]),
    ("word-fuehrung", "die Führung.", "fuehrung", ["a1-u14-d4"]),
    ("word-uebernachten", "übernachten.", "uebernachten", ["a1-u14-d4"]),
    ("word-halbpension", "die Halbpension.", "halbpension", ["a1-u14-d4"]),
    ("word-apartment", "das Apartment.", "apartment", ["a1-u14-d4"]),
    ("word-kulturell", "kulturell.", "kulturell", ["a1-u14-d4"]),
    ("word-zoll", "der Zoll.", "zoll", ["a1-u14-d4"]),
    ("word-dorf", "das Dorf.", "dorf", ["a1-u14-d4"]),
    ("word-hinten", "hinten.", "hinten", ["a1-u14-d4"]),
    ("word-schild", "das Schild.", "schild", ["a1-u14-d4"]),
    ("word-verboten", "verboten.", "verboten", ["a1-u14-d4"]),
    ("word-vorsicht", "die Vorsicht.", "vorsicht", ["a1-u14-d4"]),
    ("word-praxis", "die Praxis.", "praxis", ["a1-u14-d4"]),
    ("word-automatisch", "automatisch.", "automatisch", ["a1-u14-d4"]),
    ("word-umziehen", "umziehen.", "umziehen", ["a1-u14-d5"]),
    ("word-ausziehen", "ausziehen.", "ausziehen", ["a1-u14-d5"]),
    ("word-vermieten", "vermieten.", "vermieten", ["a1-u14-d5"]),
    ("word-vermieter", "der Vermieter.", "vermieter", ["a1-u14-d5"]),
    ("word-stock", "der Stock.", "stock", ["a1-u14-d5"]),
    ("word-reparieren", "reparieren.", "reparieren", ["a1-u14-d5"]),
    ("word-reparatur", "die Reparatur.", "reparatur", ["a1-u14-d5"]),
    ("word-ordnung", "die Ordnung.", "ordnung", ["a1-u14-d5"]),
    ("word-kuemmern", "sich kümmern.", "kuemmern", ["a1-u14-d5"]),
    ("word-pruefung", "die Prüfung.", "pruefung", ["a1-u14-d5"]),
    ("word-test", "der Test.", "test", ["a1-u14-d5"]),
    ("word-aussage", "die Aussage.", "aussage", ["a1-u14-d5"]),
    ("word-ankreuzen", "ankreuzen.", "ankreuzen", ["a1-u14-d5"]),
    ("word-bogen", "der Bogen.", "bogen", ["a1-u14-d5"]),
    ("word-abgeben", "abgeben.", "abgeben", ["a1-u14-d5"]),
    ("word-duerfen", "dürfen.", "duerfen", ["a1-u11-d5"]),
    ("word-sollen", "sollen.", "sollen", ["a1-u11-d5"]),
    ("word-interessieren", "sich interessieren.", "interessieren", ["a2-u3-d1"]),
    ("word-setzen", "sich setzen.", "setzen", ["a2-u3-d1"]),
    ("word-joggen", "joggen.", "joggen", ["a2-u3-d1"]),
    ("word-trainieren", "trainieren.", "trainieren", ["a2-u3-d1"]),
    ("word-ueben", "üben.", "ueben", ["a2-u3-d1"]),
    ("word-koerper", "der Körper.", "koerper", ["a2-u3-d1"]),
    ("word-magen", "der Magen.", "magen", ["a2-u3-d1"]),
    ("word-aktiv", "aktiv.", "aktiv", ["a2-u3-d1"]),
    ("word-stark", "stark.", "stark", ["a2-u3-d1"]),
    ("word-wach", "wach.", "wach", ["a2-u3-d1"]),
    ("word-dick", "dick.", "dick", ["a2-u3-d1"]),
    ("word-duenn", "dünn.", "duenn", ["a2-u3-d1"]),
    ("word-schaedlich", "schädlich.", "schaedlich", ["a2-u3-d1"]),
    ("word-taeglich", "täglich.", "taeglich", ["a2-u3-d2"]),
    ("word-morgens", "morgens.", "morgens", ["a2-u3-d2"]),
    ("word-vormittags", "vormittags.", "vormittags", ["a2-u3-d2"]),
    ("word-mittags", "mittags.", "mittags", ["a2-u3-d2"]),
    ("word-nachmittags", "nachmittags.", "nachmittags", ["a2-u3-d2"]),
    ("word-abends", "abends.", "abends", ["a2-u3-d2"]),
    ("word-nachts", "nachts.", "nachts", ["a2-u3-d2"]),
    ("word-manchmal", "manchmal.", "manchmal", ["a2-u3-d2"]),
    ("word-trocken", "trocken.", "trocken", ["a2-u3-d2"]),
    ("word-schmutzig", "schmutzig.", "schmutzig", ["a2-u3-d2"]),
    ("word-creme", "die Creme.", "creme", ["a2-u3-d2"]),
    ("word-parfuem", "das Parfüm.", "parfuem", ["a2-u3-d2"]),
    ("word-kosmetik", "die Kosmetik.", "kosmetik", ["a2-u3-d2"]),
    ("word-sprechstunde", "die Sprechstunde.", "sprechstunde", ["a2-u3-d3"]),
    ("word-krankenschwester", "die Krankenschwester.", "krankenschwester", ["a2-u3-d3"]),
    ("word-schwanger", "schwanger.", "schwanger", ["a2-u3-d3"]),
    ("word-nuetzlich", "nützlich.", "nuetzlich", ["a2-u3-d3"]),
    ("word-zitrone", "die Zitrone.", "zitrone", ["a2-u3-d3"]),
    ("word-suessigkeiten", "die Süßigkeiten.", "suessigkeiten", ["a2-u3-d3"]),
    ("word-fett", "fett.", "fett", ["a2-u3-d3"]),
    ("word-sauer", "sauer.", "sauer", ["a2-u3-d3"]),
    ("word-eintragen", "sich eintragen.", "eintragen", ["a2-u3-d3"]),
    ("word-schere", "die Schere.", "schere", ["a2-u3-d3"]),
    ("word-orange", "die Orange.", "orange", ["a2-u3-d3"]),
    ("word-sportlich", "sportlich.", "sportlich", ["a2-u3-d3"]),
    ("word-schokolade", "die Schokolade.", "schokolade", ["a2-u3-d3"]),
    ("word-erstens", "erstens.", "erstens", ["a2-u3-d4"]),
    ("word-zweitens", "zweitens.", "zweitens", ["a2-u3-d4"]),
    ("word-drittens", "drittens.", "drittens", ["a2-u3-d4"]),
    ("word-viertens", "viertens.", "viertens", ["a2-u3-d4"]),
    ("word-markieren", "markieren.", "markieren", ["a2-u3-d4"]),
    ("word-notieren", "notieren.", "notieren", ["a2-u3-d4"]),
    ("word-kontrollieren", "kontrollieren.", "kontrollieren", ["a2-u3-d4"]),
    ("word-diskutieren", "diskutieren.", "diskutieren", ["a2-u3-d4"]),
    ("word-genug", "genug.", "genug", ["a2-u3-d4"]),
    ("word-unbedingt", "unbedingt.", "unbedingt", ["a2-u3-d4"]),
    ("word-egal", "egal.", "egal", ["a2-u3-d4"]),
    ("word-mittel", "das Mittel.", "mittel", ["a2-u3-d4"]),
    ("word-menge", "die Menge.", "menge", ["a2-u3-d4"]),
    ("word-hinlegen", "sich hinlegen.", "hinlegen", ["a2-u3-d5"]),
    ("word-unterschied", "der Unterschied.", "unterschied", ["a2-u3-d5"]),
    ("word-verschieden", "verschieden.", "verschieden", ["a2-u3-d5"]),
    ("word-gegenteil", "das Gegenteil.", "gegenteil", ["a2-u3-d5"]),
    ("word-eigentlich", "eigentlich.", "eigentlich", ["a2-u3-d5"]),
    ("word-aendern", "ändern.", "aendern", ["a2-u3-d5"]),
    ("word-stressig", "stressig.", "stressig", ["a2-u3-d5"]),
    ("word-schlimm", "schlimm.", "schlimm", ["a2-u3-d5"]),
    ("word-schwierig", "schwierig.", "schwierig", ["a2-u3-d5"]),
    ("word-stoeren", "stören.", "stoeren", ["a2-u3-d5"]),
    ("word-pruefen", "prüfen.", "pruefen", ["a2-u3-d5"]),
    ("word-wahrscheinlich", "wahrscheinlich.", "wahrscheinlich", ["a2-u3-d5"]),
    ("word-braten", "braten.", "braten", ["a2-u3-d5"]),
    ("word-modern", "modern.", "modern", ["a2-u3-d6"]),
    ("word-einig", "einig.", "einig", ["a2-u3-d6"]),
    ]
    char_tracks = [
        # D31/D35: اسم المنتج Schlüssel — «رحلة يوسف» لا يُنطق للمستخدم أبداً
        # D122: «Mueller» كان يُقرأ [muːˈɛlɜ] (mu-EL-ler) — الاسم Müller [ˈmʏlɐ] (المعرّف ASCII يبقى mueller)
        ("mueller-announce-01", "Hallo! Ich bin Müller. Willkommen bei Schlüssel.", "mueller", []),
    ]

    tracks = []
    for tid, text, word_id, lessons in word_tracks:
        rel = f"words/audio/de-DE/{tid}.opus"
        m = make_clip(text, content / rel)
        assert m["durationMs"] <= 1500, f"{tid} أطول من 1.5s"
        tracks.append({
            "id": tid, "file": rel, "role": "word", "characterId": None, "isGuest": False,
            "voiceParams": {"speaker": VOICE_ID, "speedWpm": 110},
            "textDe": text, "priority": "P2", "lessonRefs": lessons, **m,
        })
    for tid, text, char, lessons in char_tracks:
        rel = f"audio/characters/{tid}.opus"
        # الإعلانات بالصوت الرئيسي دائماً (FEMALE_ROLES لا تضم announcement — e-audio-voice-role)
        m = make_clip(text, content / rel)
        tracks.append({
            "id": tid, "file": rel, "role": "announcement", "characterId": char, "isGuest": False,
            "voiceParams": {"speaker": VOICE_ID, "speedWpm": 130},
            "textDe": text, "priority": "P0", "lessonRefs": lessons, **m,
        })

    # D103: مسارات السكربتات (حوار/إعلان/كلمات — dialogue-splitter) تُحفظ كما هي: إعادة بناء الكلمات لا تمحوها
    previous = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    rebuilt = {t["id"] for t in tracks}
    tracks += [t for t in previous.get("tracks", []) if t["file"].startswith("audio/scripts/") and t["id"] not in rebuilt]
    manifest = {
        "schemaVersion": "1.0.0",
        "id": "audio-manifest-a1-u1",
        "generator": "piper-tts-local",
        "voiceLicense": previous.get("voiceLicense", VOICE_LICENSE),
        "tracks": tracks,
        # D103: أصوات الشخصيات بيانات في المانيفست (مصدر الحقيقة) — لا تُشتق من الكود
        "characterVoices": previous.get("characterVoices") or {
            c: VOICE_ID for c in ("yusuf", "mueller", "lena", "ayse", "frau-berg", "thomas", "frau-schmidt", "dr-weber")
        },
    }
    # characterId: null غير صالح في zod (optional = غياب الحقل) — نحذفه من مسارات الكلمات
    for t in manifest["tracks"]:
        if t["characterId"] is None:
            del t["characterId"]

    out = content / "manifests/audio-manifest.a1-u1.json"
    out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"OK manifest ← {out} ({len(tracks)} مسارات)")

    # ——— محفّزات ASR (D16): أزواج متناهية + تدهور يحاكي صعوبات اللهجة ———
    stim = ROOT / "tools/asr-stimuli"
    stim.mkdir(parents=True, exist_ok=True)
    pairs = [("baer", "Bär"), ("bett", "Bett"), ("tier", "Tier"), ("tuer", "Tür"), ("kirche", "Kirche"), ("kirsche", "Kirsche")]
    for sid, word in pairs:
        tmp = stim / f"{sid}.tmp.wav"
        tts(word, tmp)
        data, sr = sf.read(tmp, dtype="float32")
        sf.write(stim / f"{sid}.wav", normalize(data, sr), sr, format="WAV", subtype="PCM_16")
        tmp.unlink()
    # تدهور: تسريع 1.15× + ضجيج 15dB SNR (بديل محاكاة التشكيل الصوتي العربي)
    rng = np.random.default_rng(42)
    for sid, word in [("wohnung", "Wohnung"), ("guten-tag", "Guten Tag"), ("heissen", "heißen")]:
        tmp = stim / f"deg-{sid}.tmp.wav"
        tts(word, tmp)
        data, sr = sf.read(tmp, dtype="float32")
        data = normalize(data, sr)
        data = resample_linear(data, int(sr / 1.15), sr)  # تسريع 1.15×
        noise = rng.standard_normal(len(data)).astype(np.float32)
        sig_pow, noi_pow = np.mean(np.square(data)), np.mean(np.square(noise))
        noise *= float(np.sqrt(sig_pow / (noi_pow * 10 ** 1.5)))  # SNR 15dB
        sf.write(stim / f"deg-{sid}.wav", np.clip(data + noise, -1, 1), sr, format="WAV", subtype="PCM_16")
        tmp.unlink()
    print(f"OK محفّزات ASR ← {stim}/ (6 نظيفة + 3 مُدهورة)")


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "one":
        text, out = sys.argv[2], Path(sys.argv[3])
        print(json.dumps(make_clip(text, out), ensure_ascii=False))
    elif len(sys.argv) >= 2 and sys.argv[1] == "voice-for":
        # D100: أي صوت سيُستخدم فعلاً لهذه الشخصية؟ (kerstin أو fallback صريح)
        print(json.dumps(voice_for(sys.argv[2] if len(sys.argv) >= 3 else None), ensure_ascii=False))
    elif len(sys.argv) >= 2 and sys.argv[1] == "one-as":
        # D100: مقطع حوار بصوت الشخصية — يُرجع الصوت المُستخدَم فعلاً ليُسجَّل في المانيفست كما هو
        character, text, out = sys.argv[2], sys.argv[3], Path(sys.argv[4])
        v = voice_for(character)
        print(json.dumps({**make_clip(text, out, Path(v["onnx"])), "speaker": v["speaker"], "fallback": v["fallback"]}, ensure_ascii=False))
    elif len(sys.argv) >= 2 and sys.argv[1] == "one-voice":
        # D103: صوت صريح مطلوب بالاسم — لا fallback صامت: صوت مجهول أو ملف غائب = خروج بخطأ
        voice, text, out = sys.argv[2], sys.argv[3], Path(sys.argv[4])
        ls = float(sys.argv[sys.argv.index("--length-scale") + 1]) if "--length-scale" in sys.argv else None
        if voice not in VOICES:
            sys.exit(f"صوت غير مثبَّت: {voice} (المسموح: {', '.join(VOICES)})")
        if not voice_available(voice):
            sys.exit(f"ملف الصوت غائب: {VOICES[voice]}")
        print(json.dumps({**make_clip(text, out, VOICES[voice], ls), "speaker": voice}, ensure_ascii=False))
    elif len(sys.argv) >= 2 and sys.argv[1] == "one-wav":
        # خام Piper فقط (لا تحويل) — لاختبار حتمية المحرك نفسه
        text, out = sys.argv[2], Path(sys.argv[3])
        tts(text, out)
        print(json.dumps({"fileSha256": hashlib.sha256(out.read_bytes()).hexdigest()}))
    elif len(sys.argv) >= 2 and sys.argv[1] != "all":
        # D157 (N-098): أمرٌ مجهول (مثل --lexicon-hits الخاص بـphonemize.py) كان يسقط في build_all فيعيد توليد
        # كل المقاطع المنشورة (850 ملفاً بصوت Piper العشوائي) — الآن رفضٌ صريح؛ إعادة البناء الكاملة بـ«all» أو بلا وسائط.
        sys.stderr.write(f"gen-audio.py: أمر مجهول «{sys.argv[1]}» — الأوامر: all · one · one-as · one-voice · one-wav · voice-for\n")
        sys.exit(2)
    else:
        build_all()
