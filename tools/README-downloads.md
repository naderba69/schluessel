# تنزيلات النماذج (غير ملتزمة في git — كبيرة الحجم)

## صوت Piper (S0.9)
```bash
mkdir -p tools/piper-voices && cd tools/piper-voices
curl -L -o de_DE-thorsten-medium.onnx https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx
curl -L -o de_DE-thorsten-medium.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx.json
```
- الرخصة: **CC0** (Thorsten-Voice — من MODEL_CARD).
- التثبيت: `pip install piper-tts soundfile numpy`.

## نموذج Vosk الألماني الصغير (S0.10 — اختبار D16)
```bash
mkdir -p tools/models && cd tools/models
curl -L -o vosk-small-de.zip https://alphacephei.com/vosk/models/vosk-model-small-de-0.15.zip
unzip vosk-small-de.zip
```
- التثبيت: `pip install vosk`.
- الرخصة: Apache 2.0 (Vosk models).
