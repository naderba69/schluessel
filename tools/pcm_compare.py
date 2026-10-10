#!/usr/bin/env python3
# tools/pcm_compare.py — مقارنة حضور صوتي بين ملفين (استقرار الصوت عبر الجلسات — D20)
# VITS/Piper عشوائي بالبذرة: لا حتمية بايتية ولا ارتباط أغلفة زمني (قياس فعلي 2026-10-09).
# المقياس الصادق: التوقيع الطيفي (متوسط الطاقة اللوغاريتمية عبر أطارات مسموعة) — مستقل عن الزمن.
# عتبة 0.93 مقيسة: نفس الكلمة مرتين = 0.976 | كلمات مختلفة = 0.70–0.91
# usage: python3 tools/pcm_compare.py <a> <b> → {"specCorr": .., "durRatio": .., "envCorr": ..}
import json
import sys

import numpy as np
import soundfile as sf


def load(path: str):
    data, sr = sf.read(path, dtype="float32")
    if data.ndim > 1:
        data = data.mean(axis=1)
    return data, sr


def spec_profile(data: np.ndarray, sr: int) -> np.ndarray:
    frame = int(sr * 0.03)
    hop = max(frame // 2, 1)
    specs = []
    for i in range(0, max(len(data) - frame, 1), hop):
        seg = data[i:i + frame]
        if len(seg) < frame:
            break
        if np.sqrt(np.mean(np.square(seg))) < 10 ** (-40 / 20):
            continue  # أطارات مسموعة فقط
        specs.append(np.abs(np.fft.rfft(seg * np.hanning(frame))) ** 2)
    if not specs:
        return np.zeros(129)
    return np.log10(np.mean(specs, axis=0) + 1e-12)


def envelope(data: np.ndarray, sr: int) -> np.ndarray:
    frame = max(int(sr * 0.025), 1)
    n = len(data) // frame
    return np.sqrt(np.mean(np.square(data[: n * frame].reshape(n, frame)), axis=1) + 1e-12)


da, sa = load(sys.argv[1])
db, sb = load(sys.argv[2])

spec_corr = float(np.corrcoef(spec_profile(da, sa), spec_profile(db, sb))[0, 1])

ea, eb = envelope(da, sa), envelope(db, sb)
n = max(len(ea), len(eb))
eai = np.interp(np.linspace(0, 1, n), np.linspace(0, 1, len(ea)), ea)
ebi = np.interp(np.linspace(0, 1, n), np.linspace(0, 1, len(eb)), eb)
env_corr = float(np.corrcoef(eai, ebi)[0, 1])

print(json.dumps({
    "specCorr": round(spec_corr, 4),
    "envCorr": round(env_corr, 4),
    "durRatio": round(len(da) / sa / (len(db) / sb), 4),
}))
