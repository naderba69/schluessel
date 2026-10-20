#!/usr/bin/env python3
# tools/audio_probe.py — قياس فعلي لملف صوتي (يستعمله validator واختبارات G1)
# usage: python3 tools/audio_probe.py <file>            → {"durationSec": .., "rmsDb": .., "pcmSha256": ..}
#        python3 tools/audio_probe.py <file> <file> …   → [{…}, {…}] بترتيب الملفات (D133: دفعة واحدة —
#        كان اختبار الاكتمال يشغّل عملية Python لكل مسار مرتين، فتجاوز مهلته حين بلغ المانيفست 1038 مساراً)
import hashlib
import json
import sys

import numpy as np
import soundfile as sf


def probe(path: str) -> dict:
    data, sr = sf.read(path, dtype="float32")
    rms = float(np.sqrt(np.mean(np.square(data)) + 1e-12))
    pcm_sha = hashlib.sha256(np.asarray(data, dtype=np.float32).tobytes()).hexdigest()
    return {
        "durationSec": len(data) / sr,
        "rmsDb": round(20 * np.log10(rms + 1e-12), 2),
        "pcmSha256": pcm_sha,
    }


if __name__ == "__main__":
    files = sys.argv[1:]
    if not files:
        sys.exit("usage: audio_probe.py <file> [<file> …]")
    print(json.dumps(probe(files[0]) if len(files) == 1 else [probe(f) for f in files]))
