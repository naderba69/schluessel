#!/usr/bin/env python3
# tools/gen-audio.py — توليد الصوت محلياً بـPiper (D20: لا API، لا اشتراك) + قياسات حقيقية
# يستعمل: python3 tools/gen-audio.py all            → كل ملفات المحتوى + المانيفست + محفّزات ASR
#          python3 tools/gen-audio.py one "نص" out.opus → مقطع واحد (لاختبار استقرار الصوت)
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
VOICE_ONNX = ROOT / "tools/piper-voices/de_DE-thorsten-medium.onnx"
VOICE_ID = "de_DE-thorsten-medium"          # مثبت — استقرار الأصوات عبر الجلسات
VOICE_LICENSE = "CC0 (Thorsten-Voice)"      # موثقة من MODEL_CARD
TARGET_RMS_DB = -17.0                       # داخل نافذة G1 [-20..-14]
PAD_MS = 100                                # صمت 100ms قبل/بعد (مواصفات الصوت)
OUT_SR = 24000                              # Opus standard rate (22.05k غير مسموح للترميز)


def tts(text: str, out_wav: Path) -> None:
    subprocess.run(
        [sys.executable, "-m", "piper", "-m", str(VOICE_ONNX), "-f", str(out_wav)],
        input=text.encode("utf-8"), check=True, capture_output=True,
    )


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


def make_clip(text: str, out_opus: Path) -> dict:
    """Piper wav → تطبيع RMS → 100ms صمت → Opus 24k → قياسات حقيقية من الملف النهائي."""
    tmp = out_opus.with_suffix(".tmp.wav")
    out_opus.parent.mkdir(parents=True, exist_ok=True)  # المجلد قبل Piper — لا ينشئ المجلدات بنفسه
    tts(text, tmp)
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
        ("word-achso", "Achso.", "achso", ["a1-u1-d3"]),
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
        ("word-woher", "woher.", "woher", ["a1-u2-d1"]),
        ("word-hier", "hier.", "hier", ["a1-u2-d1"]),
        ("word-dort", "dort.", "dort", ["a1-u2-d1"]),
        ("word-leben", "leben.", "leben", ["a1-u2-d2"]),
        ("word-stadt", "Stadt.", "stadt", ["a1-u2-d2"]),
        ("word-haus", "Haus.", "haus", ["a1-u2-d2"]),
        ("word-muttersprache", "Muttersprache.", "muttersprache", ["a1-u2-d2"]),
        ("word-fremdsprache", "Fremdsprache.", "fremdsprache", ["a1-u2-d2"]),
        ("word-zeitung", "Zeitung.", "zeitung", ["a1-u2-d3"]),
        ("word-rechnung", "Rechnung.", "rechnung", ["a1-u2-d3"]),
        ("word-maedchen", "Maedchen.", "maedchen", ["a1-u2-d3"]),
        ("word-broetchen", "Broetchen.", "broetchen", ["a1-u2-d3"]),
        ("word-kellner", "Kellner.", "kellner", ["a1-u2-d3"]),
        ("word-lehrer", "Lehrer.", "lehrer", ["a1-u2-d3"]),
        ("word-freiheit", "Freiheit.", "freiheit", ["a1-u2-d3"]),
        ("word-moeglichkeit", "Moeglichkeit.", "moeglichkeit", ["a1-u2-d3"]),
        ("word-gesundheit", "Gesundheit.", "gesundheit", ["a1-u2-d3"]),
        ("word-freundschaft", "Freundschaft.", "freundschaft", ["a1-u2-d3"]),
        ("word-schmetterling", "Schmetterling.", "schmetterling", ["a1-u2-d3"]),
        ("word-zentrum", "Zentrum.", "zentrum", ["a1-u2-d3"]),
        ("word-gross", "gross.", "gross", ["a1-u2-d4"]),
        ("word-heiss", "heiss.", "heiss", ["a1-u2-d4"]),
        ("word-fuss", "Fuss.", "fuss", ["a1-u2-d4"]),
        ("word-suess", "suess.", "suess", ["a1-u2-d4"]),
        ("word-tasse", "Tasse.", "tasse", ["a1-u2-d4"]),
        ("word-essen", "essen.", "essen", ["a1-u2-d4"]),
        ("word-kaffee", "Kaffee.", "kaffee", ["a1-u2-d4"]),
        ("word-boot", "Boot.", "boot", ["a1-u2-d4"]),
        ("word-gehen", "gehen.", "gehen", ["a1-u2-d4"]),
        ("word-kaese", "Kaese.", "kaese", ["a1-u2-d4"]),
        ("word-schule", "Schule.", "schule", ["a1-u2-d4"]),
        ("word-vorstellen", "vorstellen.", "vorstellen", ["a1-u2-d5"]),
        ("word-kennenlernen", "kennenlernen.", "kennenlernen", ["a1-u2-d5"]),
        ("word-freuen", "freuen.", "freuen", ["a1-u2-d5"]),
        ("word-gern", "gern.", "gern", ["a1-u2-d5"]),
        ("word-nett", "nett.", "nett", ["a1-u2-d5"]),
        ("word-gespraech", "Gespraech.", "gespraech", ["a1-u2-d5"]),
        ("word-auch", "auch.", "auch", ["a1-u2-d5"]),
        ("word-oder", "oder.", "oder", ["a1-u2-d5"]),
        ("word-natuerlich", "natuerlich.", "natuerlich", ["a1-u2-d5"]),
        ("word-hobby", "Hobby.", "hobby", ["a1-u2-d5"]),
        ("word-lesen", "lesen.", "lesen", ["a1-u2-d5"]),
        ("word-musik", "Musik.", "musik", ["a1-u2-d5"]),
        ("word-okay", "Okay.", "okay", ["a1-u2-d6"]),
        ("word-super", "Super.", "super", ["a1-u2-d6"]),
        ("word-zwanzig", "zwanzig.", "zwanzig", ["a1-u3-d1"]),
        ("word-dreissig", "dreißig.", "dreissig", ["a1-u3-d1"]),
        ("word-vierzig", "vierzig.", "vierzig", ["a1-u3-d1"]),
        ("word-fuenfzig", "fünzig.", "fuenfzig", ["a1-u3-d1"]),
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
    ]
    char_tracks = [
        # D31/D35: اسم المنتج Schlüssel — «رحلة يوسف» لا يُنطق للمستخدم أبداً
        ("mueller-announce-01", "Hallo! Ich bin Mueller. Willkommen bei Schlüssel.", "mueller", []),
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
        m = make_clip(text, content / rel)
        tracks.append({
            "id": tid, "file": rel, "role": "announcement", "characterId": char, "isGuest": False,
            "voiceParams": {"speaker": VOICE_ID, "speedWpm": 130},
            "textDe": text, "priority": "P0", "lessonRefs": lessons, **m,
        })

    manifest = {
        "schemaVersion": "1.0.0",
        "id": "audio-manifest-a1-u1",
        "generator": "piper-tts-local",
        "voiceLicense": VOICE_LICENSE,
        "tracks": tracks,
        "characterVoices": {
            "yusuf": VOICE_ID, "mueller": VOICE_ID, "lena": VOICE_ID, "ayse": VOICE_ID,
            "frau-berg": VOICE_ID, "thomas": VOICE_ID, "frau-schmidt": VOICE_ID, "dr-weber": VOICE_ID,
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
    elif len(sys.argv) >= 2 and sys.argv[1] == "one-wav":
        # خام Piper فقط (لا تحويل) — لاختبار حتمية المحرك نفسه
        text, out = sys.argv[2], Path(sys.argv[3])
        tts(text, out)
        print(json.dumps({"fileSha256": hashlib.sha256(out.read_bytes()).hexdigest()}))
    else:
        build_all()
