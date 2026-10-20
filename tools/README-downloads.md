# تنزيلات النماذج

## صوت Piper (S0.9 / D28) — ✅ مُثبَّت في المستودع (قرار المالك 2026-10-10)
- **الملف:** `tools/piper-voices/de_DE-thorsten-medium.onnx` (+ `.onnx.json`) — **ملتزم في git**، لا تنزيل مطلوب إطلاقاً.
- **البصمة المثبّتة (D28 — هوية الصوت الدائمة):** `sha256 = 7e64762d8e5118bb578f2eea6207e1a35a8e0c30595010b666f983fc87bb7819` · الحجم `63,201,294` بايت.
- الرخصة: **CC0** (Thorsten-Voice — من MODEL_CARD).
- التثبيت المحلي للأدوات: `pip install piper-tts soundfile numpy`.
- الروابط الاحتياطية (لا حاجة لها عادةً):
  - https://huggingface.co/Thorsten-Voice/Piper/resolve/main/de_DE-thorsten-medium.onnx
  - https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/medium/de_DE-thorsten-medium.onnx

## صوت المرأة Piper (D98/D103) — ✅ مُثبَّت في المستودع (أمر المالك 2026-10-14)
- **الملفات (ملتزمة في git — لا تنزيل مطلوب إطلاقاً):** `tools/piper-voices/de_DE-kerstin-low.onnx` + `.onnx.json` + `de_DE-kerstin-low.MODEL_CARD`.
- **البصمة المثبّتة (D28):** `sha256 = d352a7641892cebf2903859af94e9ba81a141110215fe3943bcda7f7da401b7a` · الحجم `63,104,526` بايت · md5 `1d5e5788cfddb04cbb34418f2841931e` = **الفهرس الرسمي** `rhasspy/piper → src/python_run/piper/voices.json` حرفياً.
- **سلسلة التحقق:** نسخة git blob متطابقة (SHA `47f62798…`) في 3 مستودعات مستقلة على GitHub ← md5 + الحجم = الفهرس الرسمي ← MODEL_CARD md5 مطابق أيضاً. ملف `.onnx.json` (4,158 بايت) = نسخة `rhasspy/piper-samples` الرسمية حرفياً (قيم json في الفهرس من مراجعة تنسيق أخرى — مُثبت بالمقارنة: ملف thorsten الملتزم يخالف الفهرس بالطريقة نفسها).
- **الرخصة (من MODEL_CARD نفسه):** بيانات `rhasspy/dataset-voice-kerstin` = **CC0** · ضُبط دقيقاً من صوت en_US-ryan-low (رخصة بيانات الأساس غير مذكورة في البطاقة — needs-verify) · مستودع piper-voices = MIT.
- **عيب مُعالَج:** خريطة فونيمات kerstin (صيغة 0.2.0) بلا U+0327 ← `fit_phonemes` في gen-audio تركّب ç (623 موضعاً مقيساً) — فحص: `python3 tools/phonemize.py --coverage`.

## نموذج Vosk الألماني الصغير (S0.10 — اختبار D16 فقط)
```bash
mkdir -p tools/models && cd tools/models
curl -L -o vosk-small-de.zip https://alphacephei.com/vosk/models/vosk-model-small-de-0.15.zip
unzip vosk-small-de.zip
```
- التثبيت: `pip install vosk`.
- الرخصة: Apache 2.0 (Vosk models). — **غير ملتزم** (كبير + للاختبار فقط) — نتيجة D16 موثقة سلفاً في `docs/dos/d16-asr-report.json`.
