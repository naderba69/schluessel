# تنزيلات النماذج

## صوت Piper (S0.9 / D28) — ✅ مُثبَّت في المستودع (قرار المالك 2026-10-10)
- **الملف:** `tools/piper-voices/de_DE-thorsten-medium.onnx` (+ `.onnx.json`) — **ملتزم في git**، لا تنزيل مطلوب إطلاقاً.
- **البصمة المثبّتة (D28 — هوية الصوت الدائمة):** `sha256 = 7e64762d8e5118bb578f2eea6207e1a35a8e0c30595010b666f983fc87bb7819` · الحجم `63,201,294` بايت.
- الرخصة: **CC0** (Thorsten-Voice — من MODEL_CARD).
- التثبيت المحلي للأدوات: `pip install piper-tts soundfile numpy`.
- الروابط الاحتياطية (لا حاجة لها عادةً):
  - https://huggingface.co/Thorsten-Voice/Piper/resolve/main/de_DE-thorsten-medium.onnx
  - https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx

## صوت المرأة Piper (D98/D100) — ⏳ ينتظر رفع المالك (Termux)
- **الملفات:** `tools/piper-voices/de_DE-kerstin-low.onnx` + `.onnx.json` + `de_DE-kerstin-low.MODEL_CARD`.
- **القيم الرسمية** (فهرس `rhasspy/piper → src/python_run/piper/voices.json` — يطابق ملف thorsten الملتزم بالبايت):
  - onnx: **63,104,526 بايت** · md5 `1d5e5788cfddb04cbb34418f2841931e` (≈63MB — **لا** ~16.8MB كما ورد خطأً في D98)
  - onnx.json: 5,952 بايت · md5 `952af66f912007b6ec6b065b94072447`
  - MODEL_CARD: 272 بايت · md5 `69ec1bc99fc7e19c9ddcdf712920a6c7`
- **الطريقة:** `PAT='github_pat_XXXX' bash termux-upload-voice-kerstin.sh` في Termux (يتحقق من الحجم + md5 ويتوقف عند أي اختلاف) — huggingface.co محجوب من الـsandbox.
- **بعد الوصول:** `python3 tools/gen-audio.py voice-for lena` يجب أن يُرجع `de_DE-kerstin-low` و`fallback: false` · الترخيص يُقرأ من MODEL_CARD ويُسجَّل (needs-verify حتى ذلك الحين).
- المصدر الاحتياطي: https://huggingface.co/rhasspy/piper-voices/tree/main/de/de_DE/kerstin/low

## نموذج Vosk الألماني الصغير (S0.10 — اختبار D16 فقط)
```bash
mkdir -p tools/models && cd tools/models
curl -L -o vosk-small-de.zip https://alphacephei.com/vosk/models/vosk-model-small-de-0.15.zip
unzip vosk-small-de.zip
```
- التثبيت: `pip install vosk`.
- الرخصة: Apache 2.0 (Vosk models). — **غير ملتزم** (كبير + للاختبار فقط) — نتيجة D16 موثقة سلفاً في `docs/dos/d16-asr-report.json`.
