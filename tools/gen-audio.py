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
        ("word-wohnung", "Wohnung.", "wohnung", []),
        # ═══ a1-u1-d2 — Länder & Sprachen (D45) ═══
        ("word-frankreich", "Frankreich.", "frankreich", ["a1-u1-d2"]),
        ("word-spanien", "Spanien.", "spanien", ["a1-u1-d2"]),
        ("word-italien", "Italien.", "italien", ["a1-u1-d2"]),
        ("word-tuerkei", "Türkei.", "tuerkei", ["a1-u1-d2"]),
        ("word-marokko", "Marokko.", "marokko", ["a1-u1-d2"]),
        ("word-aegypten", "Ägypten.", "aegypten", ["a1-u1-d2"]),
        ("word-schweiz", "Schweiz.", "schweiz", ["a1-u1-d2"]),
        ("word-englisch", "Englisch.", "englisch", ["a1-u1-d2"]),
        ("word-franzoesisch", "Französisch.", "franzoesisch", ["a1-u1-d2"]),
        ("word-arabisch", "Arabisch.", "arabisch", ["a1-u1-d2"]),
        ("word-sprache", "Sprache.", "sprache", ["a1-u1-d2"]),
        ("word-land", "Land.", "land", ["a1-u1-d2"]),
        # ═══ a1-u1-d3 — Schreiben & Alphabet (D45) ═══
        ("word-buchstabe", "Buchstabe.", "buchstabe", ["a1-u1-d3"]),
        ("word-name", "Name.", "name", ["a1-u1-d3"]),
        ("word-vorname", "Vorname.", "vorname", ["a1-u1-d3"]),
        ("word-familienname", "Familienname.", "familienname", ["a1-u1-d3"]),
        ("word-adresse", "Adresse.", "adresse", ["a1-u1-d3"]),
        ("word-telefonnummer", "Telefonnummer.", "telefonnummer", ["a1-u1-d3"]),
        ("word-buchstabieren", "buchstabieren.", "buchstabieren", ["a1-u1-d3"]),
        ("word-langsam", "langsam.", "langsam", ["a1-u1-d3"]),
        ("word-wiederholen", "wiederholen.", "wiederholen", ["a1-u1-d3"]),
        ("word-genau", "genau.", "genau", ["a1-u1-d3"]),
        ("word-achso", "Ach so.", "achso", ["a1-u1-d3"]),
        ("word-alphabet", "Alphabet.", "alphabet", ["a1-u1-d3"]),
        # ═══ a1-u1-d4 — Zahlen/Alter/Telefon (D46) ═══
        ("word-zahl", "Zahl.", "zahl", ["a1-u1-d4"]),
        ("word-nummer", "Nummer.", "nummer", ["a1-u1-d4"]),
        ("word-telefon", "Telefon.", "telefon", ["a1-u1-d4"]),
        ("word-handy", "Handy.", "handy", ["a1-u1-d4"]),
        ("word-alt", "alt.", "alt", ["a1-u1-d4"]),
        ("word-jahr", "Jahr.", "jahr", ["a1-u1-d4"]),
        ("word-geburtstag", "Geburtstag.", "geburtstag", ["a1-u1-d4"]),
        ("word-schreiben", "schreiben.", "schreiben", ["a1-u1-d4"]),
        ("word-monat", "Monat.", "monat", ["a1-u1-d4"]),
        ("word-woche", "Woche.", "woche", ["a1-u1-d4"]),
        ("word-tag", "Tag.", "tag", ["a1-u1-d4"]),
        ("word-strasse", "Straße.", "strasse", ["a1-u1-d4"]),
        # ═══ a1-u1-d5 — wer/woher + Kennenlernen (D46) ═══
        ("word-frage", "Frage.", "frage", ["a1-u1-d5"]),
        ("word-antwort", "Antwort.", "antwort", ["a1-u1-d5"]),
        ("word-kennen", "kennen.", "kennen", ["a1-u1-d5"]),
        ("word-freund", "Freund.", "freund", ["a1-u1-d5"]),
        ("word-freundin", "Freundin.", "freundin", ["a1-u1-d5"]),
        ("word-leute", "Leute.", "leute", ["a1-u1-d5"]),
        ("word-zusammen", "zusammen.", "zusammen", ["a1-u1-d5"]),
        # ═══ a1-u1-d6 — Integration (D47) ═══
        ("word-alles-klar", "Alles klar.", "alles-klar", ["a1-u1-d6"]),
        ("word-bis-morgen", "Bis morgen.", "bis-morgen", ["a1-u1-d6"]),
        # ═══ a1-u2-d1 — Länder & wo/woher (D47) ═══
        ("word-oesterreich", "Österreich.", "oesterreich", ["a1-u2-d1"]),
        ("word-niederlande", "Niederlande.", "niederlande", ["a1-u2-d1"]),
        ("word-griechenland", "Griechenland.", "griechenland", ["a1-u2-d1"]),
        ("word-polen", "Polen.", "polen", ["a1-u2-d1"]),
        ("word-russland", "Russland.", "russland", ["a1-u2-d1"]),
        ("word-portugal", "Portugal.", "portugal", ["a1-u2-d1"]),
        ("word-europa", "Europa.", "europa", ["a1-u2-d1"]),
        ("word-welt", "Welt.", "welt", ["a1-u2-d1"]),
        ("word-wo", "wo.", "wo", ["a1-u2-d1"]),
        ("word-woher", "woher.", "woher", ["a1-u1-d5", "a1-u2-d1"]),
        ("word-leben", "leben.", "leben", ["a1-u2-d2"]),
        ("word-stadt", "Stadt.", "stadt", ["a1-u2-d2"]),
        ("word-haus", "Haus.", "haus", ["a1-u2-d2"]),
        ("word-muttersprache", "Muttersprache.", "muttersprache", ["a1-u2-d2"]),
        ("word-fremdsprache", "Fremdsprache.", "fremdsprache", ["a1-u2-d2"]),
        ("word-zeitung", "Zeitung.", "zeitung", ["a1-u2-d3"]),
        ("word-rechnung", "Rechnung.", "rechnung", ["a1-u2-d3"]),
        ("word-maedchen", "Mädchen.", "maedchen", ["a1-u2-d3"]),
        ("word-broetchen", "Brötchen.", "broetchen", ["a1-u2-d3"]),
        ("word-kellner", "Kellner.", "kellner", ["a1-u2-d3"]),
        ("word-lehrer", "Lehrer.", "lehrer", ["a1-u2-d3"]),
        ("word-freiheit", "Freiheit.", "freiheit", ["a1-u2-d3"]),
        ("word-moeglichkeit", "Möglichkeit.", "moeglichkeit", ["a1-u2-d3"]),
        ("word-gesundheit", "Gesundheit.", "gesundheit", ["a1-u2-d3"]),
        ("word-freundschaft", "Freundschaft.", "freundschaft", ["a1-u2-d3"]),
        ("word-schmetterling", "Schmetterling.", "schmetterling", ["a1-u2-d3"]),
        ("word-zentrum", "Zentrum.", "zentrum", ["a1-u2-d3"]),
        ("word-gross", "groß.", "gross", ["a1-u2-d4"]),
        ("word-heiss", "heiß.", "heiss", ["a1-u2-d4"]),
        ("word-fuss", "Fuß.", "fuss", ["a1-u2-d4"]),
        ("word-suess", "süß.", "suess", ["a1-u2-d4"]),
        ("word-tasse", "Tasse.", "tasse", ["a1-u2-d4"]),
        ("word-essen", "essen.", "essen", ["a1-u2-d4"]),
        ("word-kaffee", "Kaffee.", "kaffee", ["a1-u2-d4"]),
        ("word-boot", "Boot.", "boot", ["a1-u2-d4"]),
        ("word-gehen", "gehen.", "gehen", ["a1-u2-d4"]),
        ("word-kaese", "Käse.", "kaese", ["a1-u2-d4"]),
        ("word-schule", "Schule.", "schule", ["a1-u2-d4"]),
        ("word-vorstellen", "vorstellen.", "vorstellen", ["a1-u2-d5"]),
        ("word-kennenlernen", "kennenlernen.", "kennenlernen", ["a1-u2-d5"]),
        ("word-freuen", "freuen.", "freuen", ["a1-u2-d5"]),
        ("word-gern", "gern.", "gern", ["a1-u2-d5"]),
        ("word-nett", "nett.", "nett", ["a1-u2-d5"]),
        ("word-gespraech", "Gespräch.", "gespraech", ["a1-u2-d5"]),
        ("word-auch", "auch.", "auch", ["a1-u2-d5"]),
        ("word-oder", "oder.", "oder", ["a1-u2-d5"]),
        ("word-natuerlich", "natürlich.", "natuerlich", ["a1-u2-d5"]),
        ("word-hobby", "Hobby.", "hobby", ["a1-u2-d5"]),
        ("word-lesen", "lesen.", "lesen", ["a1-u2-d5"]),
        ("word-musik", "Musik.", "musik", ["a1-u2-d5"]),
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
        ("word-ziffer", "Ziffer.", "ziffer", ["a1-u3-d1"]),
        ("word-mal", "mal.", "mal", ["a1-u3-d1"]),
        ("word-tausend", "tausend.", "tausend", ["a1-u3-d2"]),
        ("word-euro", "Euro.", "euro", ["a1-u3-d2"]),
        ("word-preis", "Preis.", "preis", ["a1-u3-d2"]),
        ("word-kosten", "kosten.", "kosten", ["a1-u3-d2"]),
        ("word-billig", "billig.", "billig", ["a1-u3-d2"]),
        ("word-teuer", "teuer.", "teuer", ["a1-u3-d2"]),
        ("word-geld", "Geld.", "geld", ["a1-u3-d2"]),
        ("word-bezahlen", "bezahlen.", "bezahlen", ["a1-u3-d2"]),
        ("word-karte", "Karte.", "karte", ["a1-u3-d2"]),
        ("word-kaufen", "kaufen.", "kaufen", ["a1-u3-d2"]),
        ("word-nur", "nur.", "nur", ["a1-u3-d2"]),
        ("word-viel", "viel.", "viel", ["a1-u3-d2"]),
        ("word-uhr", "Uhr.", "uhr", ["a1-u3-d3"]),
        ("word-zeit", "Zeit.", "zeit", ["a1-u3-d3"]),
        ("word-stunde", "Stunde.", "stunde", ["a1-u3-d3"]),
        ("word-minute", "Minute.", "minute", ["a1-u3-d3"]),
        ("word-halb", "halb.", "halb", ["a1-u3-d3"]),
        ("word-viertel", "Viertel.", "viertel", ["a1-u3-d3"]),
        ("word-frueh", "früh.", "frueh", ["a1-u3-d3"]),
        ("word-spaet", "spät.", "spaet", ["a1-u3-d3"]),
        ("word-morgen", "Morgen.", "morgen", ["a1-u3-d3"]),
        ("word-abend", "Abend.", "abend", ["a1-u3-d3"]),
        ("word-nacht", "Nacht.", "nacht", ["a1-u3-d3"]),
        ("word-mittag", "Mittag.", "mittag", ["a1-u3-d3"]),
        ("word-januar", "Januar.", "januar", ["a1-u3-d4"]),
        ("word-februar", "Februar.", "februar", ["a1-u3-d4"]),
        ("word-maerz", "März.", "maerz", ["a1-u3-d4"]),
        ("word-april", "April.", "april", ["a1-u3-d4"]),
        ("word-mai", "Mai.", "mai", ["a1-u3-d4"]),
        ("word-juni", "Juni.", "juni", ["a1-u3-d4"]),
        ("word-termin", "Termin.", "termin", ["a1-u3-d4"]),
        ("word-treffen", "treffen.", "treffen", ["a1-u3-d4"]),
        ("word-verabredung", "Verabredung.", "verabredung", ["a1-u3-d4"]),
        ("word-montag", "Montag.", "montag", ["a1-u3-d4"]),
        ("word-sonntag", "Sonntag.", "sonntag", ["a1-u3-d4"]),
        ("word-am", "am.", "am", ["a1-u3-d4"]),
        ("word-hoeren", "hören.", "hoeren", ["a1-u3-d5"]),
        ("word-verstehen", "verstehen.", "verstehen", ["a1-u3-d5"]),
        ("word-schnell", "schnell.", "schnell", ["a1-u3-d5"]),
        ("word-laut", "laut.", "laut", ["a1-u3-d5"]),
        ("word-leise", "leise.", "leise", ["a1-u3-d5"]),
        ("word-stimme", "Stimme.", "stimme", ["a1-u3-d5"]),
        ("word-ohr", "Ohr.", "ohr", ["a1-u3-d5"]),
        ("word-nachricht", "Nachricht.", "nachricht", ["a1-u3-d5"]),
        ("word-anruf", "Anruf.", "anruf", ["a1-u3-d5"]),
        ("word-antworten", "antworten.", "antworten", ["a1-u3-d5"]),
        ("word-noch", "noch.", "noch", ["a1-u3-d5"]),
        ("word-mit", "mit.", "mit", ["a1-u3-d5"]),
        ("word-toll", "Toll.", "toll", ["a1-u3-d6"]),
        ("word-klar", "Klar.", "klar", ["a1-u3-d6"]),
        ("word-mutter", "Mutter.", "mutter", ["a1-u4-d1"]),
        ("word-vater", "Vater.", "vater", ["a1-u4-d1"]),
        ("word-sohn", "Sohn.", "sohn", ["a1-u4-d1"]),
        ("word-tochter", "Tochter.", "tochter", ["a1-u4-d1"]),
        ("word-bruder", "Bruder.", "bruder", ["a1-u4-d1"]),
        ("word-schwester", "Schwester.", "schwester", ["a1-u4-d1"]),
        ("word-eltern", "Eltern.", "eltern", ["a1-u4-d1"]),
        ("word-kind", "Kind.", "kind", ["a1-u4-d1"]),
        ("word-grossvater", "Großvater.", "grossvater", ["a1-u4-d1"]),
        ("word-grossmutter", "Großmutter.", "grossmutter", ["a1-u4-d1"]),
        ("word-frau", "Frau.", "frau", ["a1-u4-d1"]),
        ("word-mann", "Mann.", "mann", ["a1-u4-d1"]),
        ("word-familie", "Familie.", "familie", ["a1-u4-d2"]),
        ("word-tante", "Tante.", "tante", ["a1-u4-d2"]),
        ("word-onkel", "Onkel.", "onkel", ["a1-u4-d2"]),
        ("word-hund", "Hund.", "hund", ["a1-u4-d2"]),
        ("word-katze", "Katze.", "katze", ["a1-u4-d2"]),
        ("word-schluessel", "Schlüssel.", "schluessel", ["a1-u4-d2"]),
        ("word-tasche", "Tasche.", "tasche", ["a1-u4-d2"]),
        ("word-auto", "Auto.", "auto", ["a1-u4-d2"]),
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
        ("word-haar", "Haar.", "haar", ["a1-u4-d3"]),
        ("word-gesicht", "Gesicht.", "gesicht", ["a1-u4-d3"]),
        ("word-foto", "Foto.", "foto", ["a1-u4-d3"]),
        ("word-bild", "Bild.", "bild", ["a1-u4-d3"]),
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
        ("word-brille", "Brille.", "brille", ["a1-u4-d4"]),
        ("word-geschwister", "Geschwister.", "geschwister", ["a1-u4-d5"]),
        ("word-zwilling", "Zwilling.", "zwilling", ["a1-u4-d5"]),
        ("word-verheiratet", "verheiratet.", "verheiratet", ["a1-u4-d5"]),
        ("word-beruf", "Beruf.", "beruf", ["a1-u4-d5"]),
        ("word-arbeiten", "arbeiten.", "arbeiten", ["a1-u4-d5"]),
        ("word-studieren", "studieren.", "studieren", ["a1-u4-d5"]),
        ("word-arbeit", "Arbeit.", "arbeit", ["a1-u4-d5"]),
        ("word-aufnehmen", "aufnehmen.", "aufnehmen", ["a1-u4-d5"]),
        ("word-kurz", "kurz.", "kurz", ["a1-u4-d5"]),
        ("word-erzaehlen", "erzählen.", "erzaehlen", ["a1-u4-d5"]),
        ("word-stolz", "stolz.", "stolz", ["a1-u4-d5"]),
        ("word-heimat", "Heimat.", "heimat", ["a1-u4-d5"]),
        ("word-wunderbar", "Wunderbar.", "wunderbar", ["a1-u4-d6"]),
        ("word-prima", "Prima.", "prima", ["a1-u4-d6"]),
        ("word-brot", "Brot.", "brot", ["a1-u5-d1"]),
        ("word-wurst", "Wurst.", "wurst", ["a1-u5-d1"]),
        ("word-fleisch", "Fleisch.", "fleisch", ["a1-u5-d1"]),
        ("word-fisch", "Fisch.", "fisch", ["a1-u5-d1"]),
        ("word-salat", "Salat.", "salat", ["a1-u5-d1"]),
        ("word-suppe", "Suppe.", "suppe", ["a1-u5-d1"]),
        ("word-ei", "Ei.", "ei", ["a1-u5-d1"]),
        ("word-reis", "Reis.", "reis", ["a1-u5-d1"]),
        ("word-nudeln", "Nudeln.", "nudeln", ["a1-u5-d1"]),
        ("word-obst", "Obst.", "obst", ["a1-u5-d1"]),
        ("word-gemuese", "Gemüse.", "gemuese", ["a1-u5-d1"]),
        ("word-hunger", "Hunger.", "hunger", ["a1-u5-d1"]),
        ("word-wasser", "Wasser.", "wasser", ["a1-u5-d2"]),
        ("word-milch", "Milch.", "milch", ["a1-u5-d2"]),
        ("word-saft", "Saft.", "saft", ["a1-u5-d2"]),
        ("word-bier", "Bier.", "bier", ["a1-u5-d2"]),
        ("word-wein", "Wein.", "wein", ["a1-u5-d2"]),
        ("word-tee", "Tee.", "tee", ["a1-u5-d2"]),
        ("word-trinken", "trinken.", "trinken", ["a1-u5-d2"]),
        ("word-speisekarte", "Speisekarte.", "speisekarte", ["a1-u5-d2"]),
        ("word-bestellen", "bestellen.", "bestellen", ["a1-u5-d2"]),
        ("word-glas", "Glas.", "glas", ["a1-u5-d2"]),
        ("word-flasche", "Flasche.", "flasche", ["a1-u5-d2"]),
        ("word-zahlen", "zahlen.", "zahlen", ["a1-u5-d2"]),
        ("word-fruehstueck", "Frühstück.", "fruehstueck", ["a1-u5-d3"]),
        ("word-mittagessen", "Mittagessen.", "mittagessen", ["a1-u5-d3"]),
        ("word-abendessen", "Abendessen.", "abendessen", ["a1-u5-d3"]),
        ("word-butter", "Butter.", "butter", ["a1-u5-d3"]),
        ("word-marmelade", "Marmelade.", "marmelade", ["a1-u5-d3"]),
        ("word-kuchen", "Kuchen.", "kuchen", ["a1-u5-d3"]),
        ("word-eis", "Eis.", "eis", ["a1-u5-d3"]),
        ("word-appetit", "Appetit.", "appetit", ["a1-u5-d3"]),
        ("word-schmecken", "schmecken.", "schmecken", ["a1-u5-d3"]),
        ("word-satt", "satt.", "satt", ["a1-u5-d3"]),
        ("word-kartoffel", "Kartoffel.", "kartoffel", ["a1-u5-d3"]),
        ("word-tomate", "Tomate.", "tomate", ["a1-u5-d3"]),
        ("word-scharf", "scharf.", "scharf", ["a1-u5-d4"]),
        ("word-salzig", "salzig.", "salzig", ["a1-u5-d4"]),
        ("word-frisch", "frisch.", "frisch", ["a1-u5-d4"]),
        ("word-portion", "Portion.", "portion", ["a1-u5-d4"]),
        ("word-teller", "Teller.", "teller", ["a1-u5-d4"]),
        ("word-laeffel", "Löffel.", "laeffel", ["a1-u5-d4"]),
        ("word-gabel", "Gabel.", "gabel", ["a1-u5-d4"]),
        ("word-messer", "Messer.", "messer", ["a1-u5-d4"]),
        ("word-gast", "Gast.", "gast", ["a1-u5-d4"]),
        ("word-bestellung", "Bestellung.", "bestellung", ["a1-u5-d4"]),
        ("word-trinkgeld", "Trinkgeld.", "trinkgeld", ["a1-u5-d4"]),
        ("word-getraenk", "Getränk.", "getraenk", ["a1-u5-d4"]),
        ("word-durst", "Durst.", "durst", ["a1-u5-d5"]),
        ("word-salz", "Salz.", "salz", ["a1-u5-d5"]),
        ("word-pfeffer", "Pfeffer.", "pfeffer", ["a1-u5-d5"]),
        ("word-zucker", "Zucker.", "zucker", ["a1-u5-d5"]),
        ("word-sahne", "Sahne.", "sahne", ["a1-u5-d5"]),
        ("word-limonade", "Limonade.", "limonade", ["a1-u5-d5"]),
        ("word-haehnchen", "Hähnchen.", "haehnchen", ["a1-u5-d5"]),
        ("word-nachtisch", "Nachtisch.", "nachtisch", ["a1-u5-d5"]),
        ("word-vorspeise", "Vorspeise.", "vorspeise", ["a1-u5-d5"]),
        ("word-kasse", "Kasse.", "kasse", ["a1-u5-d5"]),
        ("word-reservieren", "reservieren.", "reservieren", ["a1-u5-d5"]),
        ("word-probieren", "probieren.", "probieren", ["a1-u5-d5"]),
        ("word-kochen", "kochen.", "kochen", ["a1-u5-d5"]),
        ("word-backen", "backen.", "backen", ["a1-u5-d5"]),
        ("word-kueche", "Küche.", "kueche", ["a1-u5-d5"]),
        ("word-gesund", "gesund.", "gesund", ["a1-u5-d5"]),
        ("word-mahlzeit", "Mahlzeit.", "mahlzeit", ["a1-u5-d5"]),
        ("word-tisch", "Tisch.", "tisch", ["a1-u6-d1"]),
        ("word-stuhl", "Stuhl.", "stuhl", ["a1-u6-d1"]),
        ("word-sofa", "Sofa.", "sofa", ["a1-u6-d1"]),
        ("word-bett", "Bett.", "bett", ["a1-u6-d1"]),
        ("word-schrank", "Schrank.", "schrank", ["a1-u6-d1"]),
        ("word-lampe", "Lampe.", "lampe", ["a1-u6-d1"]),
        ("word-teppich", "Teppich.", "teppich", ["a1-u6-d1"]),
        ("word-sessel", "Sessel.", "sessel", ["a1-u6-d1"]),
        ("word-regal", "Regal.", "regal", ["a1-u6-d1"]),
        ("word-spiegel", "Spiegel.", "spiegel", ["a1-u6-d1"]),
        ("word-vorhang", "Vorhang.", "vorhang", ["a1-u6-d1"]),
        ("word-kissen", "Kissen.", "kissen", ["a1-u6-d1"]),
        ("word-zimmer", "Zimmer.", "zimmer", ["a1-u6-d2"]),
        ("word-schlafzimmer", "Schlafzimmer.", "schlafzimmer", ["a1-u6-d2"]),
        ("word-wohnzimmer", "Wohnzimmer.", "wohnzimmer", ["a1-u6-d2"]),
        ("word-badezimmer", "Badezimmer.", "badezimmer", ["a1-u6-d2"]),
        ("word-flur", "Flur.", "flur", ["a1-u6-d2"]),
        ("word-balkon", "Balkon.", "balkon", ["a1-u6-d2"]),
        ("word-treppe", "Treppe.", "treppe", ["a1-u6-d2"]),
        ("word-keller", "Keller.", "keller", ["a1-u6-d2"]),
        ("word-garten", "Garten.", "garten", ["a1-u6-d2"]),
        ("word-hell", "hell.", "hell", ["a1-u6-d2"]),
        ("word-ruhig", "ruhig.", "ruhig", ["a1-u6-d2"]),
        ("word-gemuetlich", "gemütlich.", "gemuetlich", ["a1-u6-d2"]),
        ("word-fenster", "Fenster.", "fenster", ["a1-u6-d3"]),
        ("word-tuer", "Tür.", "tuer", ["a1-u6-d3"]),
        ("word-wand", "Wand.", "wand", ["a1-u6-d3"]),
        ("word-boden", "Boden.", "boden", ["a1-u6-d3"]),
        ("word-decke", "Decke.", "decke", ["a1-u6-d3"]),
        ("word-heizung", "Heizung.", "heizung", ["a1-u6-d3"]),
        ("word-kuehlschrank", "Kühlschrank.", "kuehlschrank", ["a1-u6-d3"]),
        ("word-waschmaschine", "Waschmaschine.", "waschmaschine", ["a1-u6-d3"]),
        ("word-fernseher", "Fernseher.", "fernseher", ["a1-u6-d3"]),
        ("word-computer", "Computer.", "computer", ["a1-u6-d3"]),
        ("word-schreibtisch", "Schreibtisch.", "schreibtisch", ["a1-u6-d3"]),
        ("word-dach", "Dach.", "dach", ["a1-u6-d3"]),
        ("word-ecke", "Ecke.", "ecke", ["a1-u6-d4"]),
        ("word-mitte", "Mitte.", "mitte", ["a1-u6-d4"]),
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
        ("word-moebel", "Möbel.", "moebel", ["a1-u6-d5"]),
        ("word-einrichtung", "Einrichtung.", "einrichtung", ["a1-u6-d5"]),
        ("word-geraet", "Gerät.", "geraet", ["a1-u6-d5"]),
        ("word-schublade", "Schublade.", "schublade", ["a1-u6-d5"]),
        ("word-rahmen", "Rahmen.", "rahmen", ["a1-u6-d5"]),
        ("word-handtuch", "Handtuch.", "handtuch", ["a1-u6-d5"]),
        ("word-seife", "Seife.", "seife", ["a1-u6-d5"]),
        ("word-dusche", "Dusche.", "dusche", ["a1-u6-d5"]),
        ("word-toilette", "Toilette.", "toilette", ["a1-u6-d5"]),
        ("word-pflanze", "Pflanze.", "pflanze", ["a1-u6-d5"]),
        ("word-vase", "Vase.", "vase", ["a1-u6-d5"]),
        ("word-hof", "Hof.", "hof", ["a1-u6-d5"]),
        ("word-etage", "Etage.", "etage", ["a1-u6-d5"]),
        ("word-stockwerk", "Stockwerk.", "stockwerk", ["a1-u6-d5"]),
        ("word-miete", "Miete.", "miete", ["a1-u6-d5"]),
        ("word-nachbar", "Nachbar.", "nachbar", ["a1-u6-d5"]),
        ("word-dunkel", "dunkel.", "dunkel", ["a1-u6-d5"]),
        ("word-aufwachen", "aufwachen.", "aufwachen", ["a1-u7-d1"]),
        ("word-schlafen", "schlafen.", "schlafen", ["a1-u7-d1"]),
        ("word-duschen", "duschen.", "duschen", ["a1-u7-d1"]),
        ("word-anziehen", "anziehen.", "anziehen", ["a1-u7-d1"]),
        ("word-muede", "müde.", "muede", ["a1-u7-d1"]),
        ("word-pause", "Pause.", "pause", ["a1-u7-d1"]),
        ("word-wecker", "Wecker.", "wecker", ["a1-u7-d1"]),
        ("word-alltag", "Alltag.", "alltag", ["a1-u7-d1"]),
        ("word-baden", "baden.", "baden", ["a1-u7-d1"]),
        ("word-anfangen", "anfangen.", "anfangen", ["a1-u7-d1"]),
        ("word-wecken", "wecken.", "wecken", ["a1-u7-d1"]),
        ("word-weg", "Weg.", "weg", ["a1-u7-d1"]),
        ("word-fussball", "Fußball.", "fussball", ["a1-u7-d2"]),
        ("word-schwimmen", "schwimmen.", "schwimmen", ["a1-u7-d2"]),
        ("word-tanzen", "tanzen.", "tanzen", ["a1-u7-d2"]),
        ("word-reisen", "reisen.", "reisen", ["a1-u7-d2"]),
        ("word-zeichnen", "zeichnen.", "zeichnen", ["a1-u7-d2"]),
        ("word-spazieren", "spazieren.", "spazieren", ["a1-u7-d2"]),
        ("word-kino", "Kino.", "kino", ["a1-u7-d2"]),
        ("word-spiel", "Spiel.", "spiel", ["a1-u7-d2"]),
        ("word-spielen", "spielen.", "spielen", ["a1-u7-d2"]),
        ("word-lieber", "lieber.", "lieber", ["a1-u7-d2"]),
        ("word-spass", "Spaß.", "spass", ["a1-u7-d2"]),
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
        ("word-fahrkarte", "Fahrkarte.", "fahrkarte", ["a1-u7-d4"]),
        ("word-bahnhof", "Bahnhof.", "bahnhof", ["a1-u7-d4"]),
        ("word-zug", "Zug.", "zug", ["a1-u7-d4"]),
        ("word-bus", "Bus.", "bus", ["a1-u7-d4"]),
        ("word-fahrrad", "Fahrrad.", "fahrrad", ["a1-u7-d4"]),
        ("word-aufstehen", "aufstehen.", "aufstehen", ["a1-u7-d5"]),
        ("word-anrufen", "anrufen.", "anrufen", ["a1-u7-d5"]),
        ("word-fernsehen", "fernsehen.", "fernsehen", ["a1-u7-d5"]),
        ("word-einkaufen", "einkaufen.", "einkaufen", ["a1-u7-d5"]),
        ("word-aufraeumen", "aufräumen.", "aufraeumen", ["a1-u7-d5"]),
        ("word-fruehstuecken", "frühstücken.", "fruehstuecken", ["a1-u7-d5"]),
        ("word-abwaschen", "abwaschen.", "abwaschen", ["a1-u7-d5"]),
        ("word-haushalt", "Haushalt.", "haushalt", ["a1-u7-d5"]),
        ("word-waesche", "Wäsche.", "waesche", ["a1-u7-d5"]),
        ("word-muell", "Müll.", "muell", ["a1-u7-d5"]),
        ("word-buch", "Buch.", "buch", ["a1-u7-d5"]),
        ("word-besuch", "Besuch.", "besuch", ["a1-u7-d5"]),
        ("word-urlaub", "Urlaub.", "urlaub", ["a1-u7-d5"]),
        ("word-koffer", "Koffer.", "koffer", ["a1-u7-d5"]),
        ("word-reise", "Reise.", "reise", ["a1-u7-d5"]),
        ("word-huebsch", "hübsch.", "huebsch", ["a1-u7-d5"]),
        ("word-feiern", "feiern.", "feiern", ["a1-u7-d5"]),
        ("word-hose", "Hose.", "hose", ["a1-u8-d1"]),
        ("word-hemd", "Hemd.", "hemd", ["a1-u8-d1"]),
        ("word-schuh", "Schuh.", "schuh", ["a1-u8-d1"]),
        ("word-jacke", "Jacke.", "jacke", ["a1-u8-d1"]),
        ("word-mantel", "Mantel.", "mantel", ["a1-u8-d1"]),
        ("word-kleid", "Kleid.", "kleid", ["a1-u8-d1"]),
        ("word-rock", "Rock.", "rock", ["a1-u8-d1"]),
        ("word-socke", "Socke.", "socke", ["a1-u8-d1"]),
        ("word-hut", "Hut.", "hut", ["a1-u8-d1"]),
        ("word-pullover", "Pullover.", "pullover", ["a1-u8-d1"]),
        ("word-groesse", "Größe.", "groesse", ["a1-u8-d1"]),
        ("word-farbe", "Farbe.", "farbe", ["a1-u8-d1"]),
        ("word-cent", "Cent.", "cent", ["a1-u8-d2"]),
        ("word-rabatt", "Rabatt.", "rabatt", ["a1-u8-d2"]),
        ("word-angebot", "Angebot.", "angebot", ["a1-u8-d2"]),
        ("word-guenstig", "günstig.", "guenstig", ["a1-u8-d2"]),
        ("word-wechselgeld", "Wechselgeld.", "wechselgeld", ["a1-u8-d2"]),
        ("word-verkaufen", "verkaufen.", "verkaufen", ["a1-u8-d2"]),
        ("word-verkaeufer", "Verkäufer.", "verkaeufer", ["a1-u8-d2"]),
        ("word-kunde", "Kunde.", "kunde", ["a1-u8-d2"]),
        ("word-supermarkt", "Supermarkt.", "supermarkt", ["a1-u8-d2"]),
        ("word-geschaeft", "Geschäft.", "geschaeft", ["a1-u8-d2"]),
        ("word-markt", "Markt.", "markt", ["a1-u8-d2"]),
        ("word-anprobieren", "anprobieren.", "anprobieren", ["a1-u8-d2"]),
        ("word-passen", "passen.", "passen", ["a1-u8-d3"]),
        ("word-stueck", "Stück.", "stueck", ["a1-u8-d3"]),
        ("word-korb", "Korb.", "korb", ["a1-u8-d3"]),
        ("word-wagen", "Wagen.", "wagen", ["a1-u8-d3"]),
        ("word-kleidung", "Kleidung.", "kleidung", ["a1-u8-d3"]),
        ("word-kreditkarte", "Kreditkarte.", "kreditkarte", ["a1-u8-d3"]),
        ("word-regenschirm", "Regenschirm.", "regenschirm", ["a1-u8-d3"]),
        ("word-rucksack", "Rucksack.", "rucksack", ["a1-u8-d3"]),
        ("word-guertel", "Gürtel.", "guertel", ["a1-u8-d3"]),
        ("word-abteilung", "Abteilung.", "abteilung", ["a1-u8-d3"]),
        ("word-finden", "finden.", "finden", ["a1-u8-d3"]),
        ("word-moeglich", "möglich.", "moeglich", ["a1-u8-d3"]),
        ("word-nach", "nach.", "nach", ["a1-u8-d4"]),
        ("word-aus", "aus.", "aus", ["a1-u8-d4"]),
        ("word-zu", "zu.", "zu", ["a1-u8-d4"]),
        ("word-taxi", "Taxi.", "taxi", ["a1-u8-d4"]),
        ("word-fliegen", "fliegen.", "fliegen", ["a1-u8-d4"]),
        ("word-flug", "Flug.", "flug", ["a1-u8-d4"]),
        ("word-flughafen", "Flughafen.", "flughafen", ["a1-u8-d4"]),
        ("word-parken", "parken.", "parken", ["a1-u8-d4"]),
        ("word-rad", "Rad.", "rad", ["a1-u8-d4"]),
        ("word-bahn", "Bahn.", "bahn", ["a1-u8-d4"]),
        ("word-abholen", "abholen.", "abholen", ["a1-u8-d4"]),
        ("word-gepaeck", "Gepäck.", "gepaeck", ["a1-u8-d4"]),
        ("word-von", "von.", "von", ["a1-u8-d5"]),
        ("word-seit", "seit.", "seit", ["a1-u8-d5"]),
        ("word-bei", "bei.", "bei", ["a1-u8-d5"]),
        ("word-verhandeln", "verhandeln.", "verhandeln", ["a1-u8-d5"]),
        ("word-quittung", "Quittung.", "quittung", ["a1-u8-d5"]),
        ("word-umtausch", "Umtausch.", "umtausch", ["a1-u8-d5"]),
        ("word-schmuck", "Schmuck.", "schmuck", ["a1-u8-d5"]),
        ("word-ring", "Ring.", "ring", ["a1-u8-d5"]),
        ("word-kette", "Kette.", "kette", ["a1-u8-d5"]),
        ("word-stiefel", "Stiefel.", "stiefel", ["a1-u8-d5"]),
        ("word-mode", "Mode.", "mode", ["a1-u8-d5"]),
        ("word-tuete", "Tüte.", "tuete", ["a1-u8-d5"]),
        ("word-geschenk", "Geschenk.", "geschenk", ["a1-u8-d5"]),
        ("word-sparen", "sparen.", "sparen", ["a1-u8-d5"]),
        ("word-sonnenbrille", "Sonnenbrille.", "sonnenbrille", ["a1-u8-d5"]),
        ("word-baeckerei", "Bäckerei.", "baeckerei", ["a1-u8-d5"]),
        ("word-schalter", "Schalter", "schalter", ["a1-u8-d5"]),
    ("word-kirche", "die Kirche.", "kirche", ["a1-u9-d1"]),
    ("word-krankenhaus", "Krankenhaus.", "krankenhaus", ["a1-u9-d1"]),
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
    ("word-entschuldigung", "Entschuldigung.", "entschuldigung", ["a1-u9-d3"]),
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
    ("word-sonne", "die Sonne.", "sonne", ["a1-u10-d1"]),
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
    ("word-erkaltung", "die Erkältung.", "erkaltung", ["a1-u11-d2"]),
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
    else:
        build_all()
