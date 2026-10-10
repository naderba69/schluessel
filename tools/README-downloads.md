# تنزيلات النماذج

## صوت Piper (S0.9 / D28) — ✅ مُثبَّت في المستودع (قرار المالك 2026-10-10)
- **الملف:** `tools/piper-voices/de_DE-thorsten-medium.onnx` (+ `.onnx.json`) — **ملتزم في git**، لا تنزيل مطلوب إطلاقاً.
- **البصمة المثبّتة (D28 — هوية الصوت الدائمة):** `sha256 = 7e64762d8e5118bb578f2eea6207e1a35a8e0c30595010b666f983fc87bb7819` · الحجم `63,201,294` بايت.
- الرخصة: **CC0** (Thorsten-Voice — من MODEL_CARD).
- التثبيت المحلي للأدوات: `pip install piper-tts soundfile numpy`.
- الروابط الاحتياطية (لا حاجة لها عادةً):
  - https://huggingface.co/Thorsten-Voice/Piper/resolve/main/de_DE-thorsten-medium.onnx
  - https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx

## نموذج Vosk الألماني الصغير (S0.10 — اختبار D16 فقط)
```bash
mkdir -p tools/models && cd tools/models
curl -L -o vosk-small-de.zip https://alphacephei.com/vosk/models/vosk-model-small-de-0.15.zip
unzip vosk-small-de.zip
```
- التثبيت: `pip install vosk`.
- الرخصة: Apache 2.0 (Vosk models). — **غير ملتزم** (كبير + للاختبار فقط) — نتيجة D16 موثقة سلفاً في `docs/dos/d16-asr-report.json`.
