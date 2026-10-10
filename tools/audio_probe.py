#!/usr/bin/env python3
# tools/audio_probe.py — قياس فعلي لملف صوتي (يستعمله validator واختبارات G1)
# usage: python3 tools/audio_probe.py <file> → {"durationSec": .., "rmsDb": .., "pcmSha256": ..}
import hashlib
import json
import sys

import numpy as np
import soundfile as sf

data, sr = sf.read(sys.argv[1], dtype="float32")
rms = float(np.sqrt(np.mean(np.square(data)) + 1e-12))
pcm_sha = hashlib.sha256(np.asarray(data, dtype=np.float32).tobytes()).hexdigest()
print(json.dumps({
    "durationSec": len(data) / sr,
    "rmsDb": round(20 * np.log10(rms + 1e-12), 2),
    "pcmSha256": pcm_sha,
}))
