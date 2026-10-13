# STATE.md — أين نحن الآن (يُقرأ أولاً بعد أي انقطاع/تكثيف — القانون 32)

**المعلم 0 — مُغلَق ✅** · **M1–M3 ✅** · **الوحدات 1–11 ✅ + u12-d1 ✅ — D86** | **التالي: u12-d2 (Bahnhof/Hotel)**

## الخطوة التالية بالضبط
**حملة المحتوى (أمر المالك: «كل إضافة أرفعها مباشرة»):** u12-d1 ✅ (694 كلمة · 67 يوماً). **الوحدة 12 (السفر — الأخيرة)**: d2 Bahnhof/Hotel · d3 Perfekt+Trennbare · d4 Konnektoren · d5 سرد رحلة · d6 المعركة الكبرى.

## إغلاق المعلم 0 (كله مُختبَر فعلياً — 64/64 أخضر + tsc + G1 0 أخطاء + build)
- ✅ الدفعات 1–5 كاملة: مخططات/D18 · G1/Dexie · PWA/GenderBadge · أول تشغيل+الوحدة صفر · Piper+D16.
- **D16 (قرار ملزم):** البديل مُفعَّل — FA 0% لكن FR 44.4% > 5% → السلم السمعي مسار النطق، ASR إرشادي فقط (asr-gate.ts + d16-asr-report.json).
- **D28:** الاستقرار الصوتي = هوية مثبّتة + طيف corr ≥0.93 (VITS عشوائي بالبذرة — مقيس).
- التقرير الكامل: `docs/reports/m0-report.md` | التنزيلات: `tools/README-downloads.md`.

## البيئة (مُتحقق 2026-10-09 · مُحدَّث 2026-10-10 — بعد D37)
- Node 20.20 / zod 4.6.5 / ts-fsrs 5.4.2 / Dexie + fake-indexeddb / React + Vite / vitest (**106/106 كلها خضراء** — الصوت مُثبَّت في git).
- Python 3.13 + piper-tts + soundfile + numpy. **صوت Piper ملتزم في git** (D37 — بصمة `7e64762d…bb7819`). نموذج Vosk (اختبار D16 فقط) غير ملتزم (روابطه في tools/README-downloads.md).
- أوامر الحسم: `npm test && npm run typecheck && npm run validate:content && npm run build` — **كلها خضراء بلا استثناء**.
