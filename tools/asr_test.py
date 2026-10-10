#!/usr/bin/env python3
# tools/asr_test.py — اختبار النطق المحلي (D16 — القانون 11): هل يكفي ASR المحلي كبوابة نطق؟
# البروتوكول: 3 أزواج متناهية × (نطق صحيح + نطق الزوج الخاطئ) + 3 محفّزات مُدهورة (صعوبات اللهجة)
#            × 3 جلسات (ضجيج جلسي) × 3 محاولات. العتبات: قبول مردود زيفاً ≤2% | رفض مقبول زيفاً ≤5% | زمن ≤800ms
import json
import time
import wave
from pathlib import Path

from vosk import KaldiRecognizer, Model, SetLogLevel

ROOT = Path(__file__).resolve().parent.parent
STIM = ROOT / "tools/asr-stimuli"
MODEL_DIR = ROOT / "tools/models/vosk-model-small-de-0.15"
REPORT = ROOT / "docs/dos/d16-asr-report.json"

PAIRS = {"baer": "Bär", "bett": "Bett", "tier": "Tier", "tuer": "Tür", "kirche": "Kirche", "kirsche": "Kirsche"}
PARTNER = {"baer": "bett", "bett": "baer", "tier": "tuer", "tuer": "tier", "kirche": "kirsche", "kirsche": "kirche"}
DEGRADED = {"deg-wohnung": "Wohnung", "deg-guten-tag": "Guten Tag", "deg-heissen": "heißen"}
UMLAUT = {"ä": "a", "ö": "o", "ü": "u", "ß": "ss", "á": "a", "é": "e", "í": "i"}


def norm(s: str) -> str:
    for k, v in UMLAUT.items():
        s = s.replace(k, v)
    return "".join(c for c in s.lower() if c.isalnum())


def edit1(a: str, b: str) -> bool:
    """هل يطابق a سلسلة b بفارق حرف واحد على الأكثر؟ (بوابة متسامحة كبوابة الهجنة)"""
    if abs(len(a) - len(b)) > 1:
        return False
    i = j = diffs = 0
    while i < len(a) and j < len(b):
        if a[i] == b[j]:
            i += 1
            j += 1
        else:
            diffs += 1
            if diffs > 1:
                return False
            if len(a) > len(b):
                i += 1
            elif len(a) < len(b):
                j += 1
            else:
                i += 1
                j += 1
    return diffs + (len(a) - i) + (len(b) - j) <= 1


def recognize(model: Model, wav_path: Path) -> tuple[str, float]:
    with wave.open(str(wav_path), "rb") as wf:
        rec = KaldiRecognizer(model, wf.getframerate())
        rec.SetWords(False)
        t0 = time.perf_counter()
        while True:
            data = wf.readframes(4000)
            if not data:
                break
            rec.AcceptWaveform(data)
        text = json.loads(rec.FinalResult()).get("text", "")
    return text, (time.perf_counter() - t0)


def words_norm(s: str) -> list[str]:
    return [norm(w) for w in s.split() if w.strip()]


def seq_in(target: str, transcript: str) -> bool:
    """مطابقة سلسلة كلمات الهدف داخل نص التفريغ (للجمل مثل «Guten Tag»)."""
    t, w = words_norm(target), words_norm(transcript)
    if not t:
        return False
    return any(w[i:i + len(t)] == t for i in range(len(w) - len(t) + 1))


def matches_strict(target: str, transcript: str) -> bool:
    """البوابة الحقيقية: مطابقة تطبيعية صارمة (لا تساهل يبتلع الأزواج المتناهية)."""
    return seq_in(target, transcript)


def matches_lenient(target: str, transcript: str) -> bool:
    """مطابقة متسامحة بفارق حرف — تُسجَّل للمقارنة فقط ولا تقبل البوابة بها."""
    t = words_norm(target)
    words = words_norm(transcript)
    joined_t = "".join(t)
    return any(norm(w) == joined_t or edit1(norm(w), joined_t) for w in words) or seq_in(target, transcript)


def main() -> None:
    SetLogLevel(-1)
    model = Model(str(MODEL_DIR))
    sessions, attempts = 3, 3
    trials = []
    for session in range(sessions):
        for stim_id, word in PAIRS.items():
            for spoken_label, spoken_file, expected_accept in [
                ("correct", stim_id, True),
                ("wrong-pair", stim_id, False),  # ملف الكلمة يُنطق لكن البوابة مطلوبة لشقيقتها
            ]:
                target = word if expected_accept else PAIRS[PARTNER[stim_id]]
                for attempt in range(attempts):
                    text, lat = recognize(model, STIM / f"{spoken_file}.wav")
                    accepted = matches_strict(target, text)
                    trials.append({
                        "session": session, "attempt": attempt, "stimulus": f"{stim_id}:{spoken_label}",
                        "target": target, "transcript": text, "accepted": accepted,
                        "acceptedLenient": matches_lenient(target, text),
                        "expectedAccept": expected_accept, "latencyMs": round(lat * 1000),
                    })
        for stim_id, word in DEGRADED.items():
            for attempt in range(attempts):
                text, lat = recognize(model, STIM / f"{stim_id}.wav")
                accepted = matches_strict(word, text)
                trials.append({
                    "session": session, "attempt": attempt, "stimulus": f"{stim_id}:degraded",
                    "target": word, "transcript": text, "accepted": accepted,
                    "acceptedLenient": matches_lenient(word, text),
                    "expectedAccept": True, "latencyMs": round(lat * 1000),
                })

    wrong = [t for t in trials if not t["expectedAccept"]]
    correct = [t for t in trials if t["expectedAccept"]]
    fa = sum(1 for t in wrong if t["accepted"]) / max(len(wrong), 1)
    fr = sum(1 for t in correct if not t["accepted"]) / max(len(correct), 1)
    lat_mean = sum(t["latencyMs"] for t in trials) / max(len(trials), 1)

    ok = fa <= 0.02 and fr <= 0.05 and lat_mean <= 800
    decision = {
        "mode": "hybrid-gate" if ok else "fallback-listening-ladder",
        "hybrid": ok,
        "reason": (
            "اجتياز العتبات الثلاث — بوابة هجنة: ASR يقبل، والرفض يراجعه مولر (لا رفض نهائي آلي)"
            if ok else
            "فشل عتبة أو أكثر — البديل مُفعَّل: السلم السمعي الكامل بلا بوابة ASR (D16)"
        ),
    }
    report = {
        "protocol": "D16: 3 أزواج متناهية × (صحيح/زوج خاطئ) + 3 مُدهورة × 3 جلسات × 3 محاولات",
        "model": "vosk-model-small-de-0.15 (محلي، مجاني)",
        "thresholds": {"falseAcceptMax": 0.02, "falseRejectMax": 0.05, "meanLatencyMsMax": 800},
        "aggregates": {
            "falseAcceptRate": round(fa, 4), "falseRejectRate": round(fr, 4),
            "meanLatencyMs": round(lat_mean, 1), "wrongTrials": len(wrong), "correctTrials": len(correct),
        },
        "decision": decision,
        "trials": trials,
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"FA={fa:.2%} FR={fr:.2%} latency={lat_mean:.0f}ms → {decision['mode']}")
    print(f"REPORT ← {REPORT}")


if __name__ == "__main__":
    main()
