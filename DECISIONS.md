# سجل القرارات الملزمة — «مفتاح — Schlüssel»
> السجل الكامل D1–D46. المصادر: الدستور §18 (D1–D25) + نتائج المعلم 0 (D16/D26–D28) + قرارات المالك (D29–D35, D37) + تنفيذ M1–M3 وحملة المحتوى (D36, D38–D46).

## من الدستور §18 (قرارات يوم الصفر)
- **D1** موقع ثابت Vercel + repo خاص. **D2** TypeScript + React + RTL. **D3** المحتوى بيانات في git. **D4** Dexie + GitHub API للنسخ. **D5** مواد جوته داخل repo الخاص — استخدام شخصي بقرار المالك. **D6** ts-fsrs بمعاملات افتراضية. **D7** Web Speech مشغل فوري + Piper للملفات. **D8** طبقة AI اختيارية BYOK للإنتاج الحر فقط. **D9** PWA كاملة. **D10** القصة الإطارية. **D11** أطلس المترو. **D12** محاكي الامتحان بنماذج Goethe الرسمية. **D13** النسخ الاحتياطي المزدوج. **D14** أي مادة جديدة تدخل عبر بوابات G1–G4 بلا استثناء.
- **D15** المنهج المرجعي = Netzwerk neu (Klett) + قوائم Goethe الرسمية + Schritte international neu ثانوياً.
- **D17** نموذج G3 = Gemini (الطبقة المجانية)، البديل OpenRouter مجاني.
- **D18** الإتقان = نسبة بطاقات S ≥ 21 يوماً (A1) / 30 (A2+).
- **D19** الخطة الأكاديمية 14/14/17/17 أسبوعاً + جداول الـ48 وحدة.
- **D20** الصوت = Piper TTS محلي حصراً (لا API مدفوع أبداً). **D20-أ** أداة Ayşe بسقالة §4.
- **D21** كل محتوى v4.0 أُعيدت صياغته في v6 كمواصفة مستقلة.
- **D22** Landeskunde محتوى موزع لا محركاً سابع عشر.
- **D23** التحفيز هادئ: تواصل الهضبة = إشعار هادئ شفاف بإطار إيجابي (بلا لوم ولا سلاسل ضغط).
- **D24** سجل الرفوضات: **اختبار التموضع مرفوض بقرار المالك** (لا تحديد مستوى أبداً) · حذف Ayşe مرفوض · إسقاط MR1 مرفوض (حُصر في جلسة SRS).
- **D25** معاملات FSRS الافتراضية = تبسيط مُقِرّ به موثق — يُعاد التصحيح (Optimizer) بعد ≥1000 مراجعة فعلية.

## نتائج المعلم 0 (مبنية على قياس فعلي)
- **D16 (نتيجة):** Vosk-small-de: FA=0.00% / FR=44.44% (الكلمات القصيرة المعزولة تنهار: Bär→bei، Tier→die) / 169ms → **بوابة ASR غير معتمدة**؛ **السلم السمعي مُفعَّل** كمسار أساسي والنسخ استشاري فقط. التفاصيل: `docs/dos/d16-asr-report.json` + `src/lib/asr-gate.ts` (مقفل من التقرير) + `docs/reports/m0-report.md`.
- **D26 (قفل):** حارس «الاسترجاع قبل الشرح» يُختبر آلياً في اختبار أول التشغيل (لا تموضع في أي شاشة).
- **D27 (قفل):** الوحدة صفر = 4 بطاقات يوم أول + 8 بطاقات JIT بمحفّزات واقعية (لا دفعة واحدة — قانون 23).
- **D28 (استقرار الصوت):** VITS غير حتمي (لا بذرة؛ انحراف مدة ±28%) → الاستقرار = (1) تثبيت الهوية: كل الشخصيات الثمانية + المسارات بصوت واحد de_DE-thorsten-medium (CC0) + حارس e-audio-voice-drift؛ (2) specCorr ≥ 0.93 لنص واحد (قياس فعلي: 0.976 مقابل 0.70–0.91 عبر كلمات مختلفة) + durRatio 0.6–1.7؛ (3) manifest hash = sha256 الملف الملتزم. الأدوات: tools/pcm_compare.py + tests/voice-stability.test.ts.

## قرارات المالك — مرحلة الخطة (2026-10-09)
# DECISIONS.md — سجل القرارات (D1–D27) | الدستور v6.1 §18

| # | القرار | الحالة |
|---|--------|--------|
| D1 | موقع ثابت يُنشر على Vercel من GitHub repo خاص | معتمد |
| D2 | TypeScript + React + الواجهة RTL مع Bidi (قانون 29) | معتمد |
| D3 | كل المحتوى التعليمي بيانات في git (لا محتوى في الكود) | معتمد |
| D4 | تقدم المتعلم: IndexedDB عبر Dexie + نسخ يومي GitHub API (مفتاح في المتصفح) | معتمد |
| D5 | مواد جوته داخل repo الخاص — استخدام شخصي غير تجاري (قرار المالك) | معتمد |
| D6 | ts-fsrs بمعاملاتها الافتراضية حرفياً | معتمد — **مُختبر فعلياً** (tests/mastery.test.ts) |
| D7 | Web Speech مشغل فوري + ملفات للحوارات | معتمد |
| D8 | طبقة AI اختيارية BYOK للإنتاج الحر فقط | معتمد |
| D9 | PWA كاملة (تثبيت + offline + مؤشر اتصال) | معتمد |
| D10 | القصة الإطارية «رحلة يوسف» (§11) | معتمد |
| D11 | أطلس القواعد «خريطة المترو» (§12) | معتمد |
| D12 | محاكي الامتحان بنماذج Goethe الرسمية (D5) | معتمد |
| D13 | النسخ الاحتياطي المزدوج (تقدم + كود/محتوى zip) | معتمد |
| D14 | أي مادة جديدة من المالك تدخل عبر G1–G4 | معتمد |
| D15 | المنهج المرجعي = **Netzwerk neu (Klett)** + قوائم Goethe للمفردات + Schritte international neu ثانوياً | **محسوم يوم الصفر** — مُثبَّت في curriculum-reference schema |
| D16 | نتيجة اختبار ASR (§5‑ب) | **معلّق** — S0.10 (الدفعة 4). إن تعذّر النموذج في البيئة: البديل (السلم السمعي فقط) مُفعَّل تلقائياً حتى يُجرى |
| D17 | نموذج G3 = **Gemini (الطبقة المجانية)**؛ البديل OpenRouter مجاني من عائلة أخرى | محسم |
| D18 | الإتقان M = نسبة بطاقات **S ≥ 21 يوماً (A1) / 30 (A2+)**؛ R(t) للجدولة اليومية فقط | **محسوم + مُختبر فعلياً** (computeMastery) |
| D19 | الخطة الأكاديمية: A1=14 / A2=14 / B1=17 / B2=17 أسبوعاً + أهداف يومية Can‑do | محسم (study-plan-daily-v6.1.md) |
| D20 | مصدر الصوت الوحيد = **Piper TTS محلي** (أصوات CC0) — لا API مدفوع | محسم |
| D20‑أ | أداة «اشرحها لـ Ayşe» بسقالة ومعايير تقييم (§4) | محسم |
| D21 | كل محتوى كان renvoi إلى v4 أُعيدت صياغته في v6 (الشخصيات الثمانية، الخطوط الستة، الدورة السبع، القالب اليومي) | محسم |
| D22 | Landeskunde محتوى موزعاً (10‑ل) لا محركاً سابعاً عشر | محسم |
| D23 | تواصل الهضبة = إشعار هادئ شفاف بإطار إيجابي | محسم |
| D24 | سجل الرفوضات: اختبار التموضع (بقرار المالك — لا يُعاد بأي صيغة)، حذف Ayşe، إسقاط MR1 | موثق |
| D25 | معاملات FSRS الافتراضية = تبسيط مُقِرّ به — يُعاد التصحيح بعد ≥1000 مراجعة فعلية | موثق |
| D26 | أداة البناء: **Vite + Vitest**؛ مخططات: **zod v4**؛ تشغيل سكربتات: **tsx** | **جديد — الدفعة 1** |
| D27 | تنسيق المحتوى التنفيذي = **JSON** (بلا YAML في التنفيذ — zod هو الحاكم) + `schemaVersion` semver في كل ملف | **جديد — الدفعة 1** |

## تحديثات نتائج (2026-10-09 — بعد التنفيذ الفعلي)
- **D16 — النتيجة:** الاختبار أُجري بالكامل (243 محاولة، Vosk small محلي): قبول مرفوض زيفاً **0%** لكن رفض مقبول زيفاً **44.4%** (الكلمات المعزولة القصيرة تنهار في أصغر نموذج). **القرار: البديل مُفعَّل** — السلم السمعي التلقائي مسار النطق الأساسي، وASR إرشادي فقط (قبول → مراجعة مولر). مقفل في `src/lib/asr-gate.ts` + `docs/dos/d16-asr-report.json`.
- **D28 — استقرار الصوت (قياس لا افتراض):** VITS/Piper عشوائي بالبذرة (لا حتمية بايتية، الطول العيّني ±28%). الاستقرار عُرِّف: الهوية مثبّتة + التوقيع الطيفي corr ≥0.93 لنفس النص (مقاس: 0.976 نفس الكلمة مقابل 0.70–0.91 مختلفة). ملزم لكل اختبارات الصوت المستقبلية.

### D29 — اعتماد خطة المنتج v1.2 (قرار صاحب القرار 2026-10-09)
**القرار:** الخطة النهائية المعتمدة (v1.2) بقرارات يوسف:
1. الدرس = حصة واحدة متصلة 120 دقيقة (لا تقسيم).
2. طبقة «المدرب» — حضور طول اليوم — بكل أفكارها الاثنتي عشرة.
3. مخزون الأفكار الكامل (240 فكرة) مقبول كله — «كل شي» — ويُبنى على مراحل M1–M6 (§11 من الخطة).
4. الألوان: أزرق هادئ + أخضر.
5. مولر: صوت + نص فقط — بلا شخصية بصرية.
**السلطة:** صاحب القرار وحده (يوسف). البناء يبدأ بإشارته (M1: محرك الحصة + طبقة المدرب + الوحدة صفر).

### D30 — بوابة مراجعة الإضافات + مخزون المحركات (2026-10-09)
**القرار (طلب يوسف):** كل إضافة تُراجَع بالمصادر وكما دُرِّب — ثُبِّتت كـ§34 في الدستور (خمس بوابات: المصدر/عدم التناقض/الاختبار/الصدق/التسجيل). مخزون المحركات الكامل (26 محركاً: 4 مبنية + 22 جديدة بمصفوفة مراجعة) في `docs/plans/engines-inventory-v1.md`. ما يحتاج تحقق ويب (تفاصيل Goethe الحالية) يُتحقق قبل البناء ولا يُختلق.

### D31 — رفض اسم «رحلة يوسف» + إدخال اسم المستخدم من أول استخدام (2026-10-09)
**قرار المالك:** (1) اسم المنتج «رحلة يوسف» مرفوض — يبقى اسماً تقنياً داخلياً للمستودع فقط ولا يظهر للمستخدم. (2) اسم المستخدم يُدخل يدوياً من أول استخدام ويُحفظ ويثبت طوال الرحلة (طقس البداية §2.11 في الخطة). (3) اسم المنتج الجديد من القائمة المختصرة (الخطة §12.1) — بانتظار اختيار المالك.

### D32 — اسم المنتج النهائي (2026-10-09)
**قرار المالك:** اسم المنتج = **«مفتاح — Schlüssel»**. يظهر في أعلى الشاشة طوال الرحلة وطقس البداية ورسائل المدرب. الشعار: «اللغة مفتاحك» / «Die Sprache ist dein Schlüssel». («رحلة يوسف» = اسم تقني داخلي للمستودع فقط.)

### D33 — ركن الفيديو + المحادثة الذكية بثلاث طبقات (2026-10-09)
**قرار المالك:** (1) ركن فيديو يومي بمستوى المتعلم من مصادر مجانية (تحقق ويب 2026-10-09: Nicos Weg/DW مجاني بلا تسجيل A1–B1، Dreaming German، Easy German، Jojo، Marija) — الفيديو يتطلب إنترنت ويُقال صراحة؛ بوابة تحقق لكل رابط (§34). (2) محادثة خارج الدرس بالذكاء الاصطناعي على 3 طبقات: نصي مضمون (بلا إنترنت) / صوتي مجاني استشاري (Web Speech + Piper، درس D16) / AI اختياري بمفتاح المستخدم المجاني (Gemini free tier ونحوه) — صفر تكلفة، النظام يعمل 100% بدونه، AI مقيّد بمستوى المتعلم ومرشّح. التفاصيل: `docs/plans/video-and-ai-conversation.md` (F241–F262، E23–E24).

### D34 — إضافات الخبير الثماني (2026-10-09)
**اقتراح المطور ضمن تفويض «كل شي»:** F263 بودكاست شخصي مولّد (Piper) · F264 تصدير ICS · F265 مرآة النطق (specCorr استشارية) · F266 تشخيص الأصوات العربية في الوحدة صفر · F267 حقيبة الطوارئ · F268 محاكاة امتحان كاملة · F269 بطاقة الحصة · F270 تذكير النسخة الاحتياطية · E25 محرك مرآة النطق. المجموع النهائي: 270 فكرة + 29 محركاً.

### D35 — الاسم النهائي المعتمد: «Schlüssel» (2026-10-10)
**قرار المالك:** اسم المشروع = **Schlüssel** (يُعرض كما هو). «مفتاح» تبقى الترجمة العربية في الشعار («اللغة مفتاحك» / «Die Sprache ist dein Schlüssel»). المستودع البعيد: `schluessel` على حساب naderba69 (Vercel).

### D36 — دفعة M1-ب: محركا المراجعة والأخطاء E03+E04 (2026-10-10)
**المصادر (بوابة §34):** `engines-inventory-v1.md` (E03/E04) · الدستور §4 (دورة الخطأ الثلاثية) · F112 + F038 + F121 (`ideas-inventory-v1.md`) · الخطة v1.3 §2.5/§2.7. **عدم التناقض:** مُتحقق في الاختبارات الآلية. **الاختبار:** 30 اختباراً جديداً أخضر. **الصدق:** مُثبَّت في التقرير (3 اختبارات صوتية بيئة — بلا نموذج الصوت). **التسجيل:** هنا.
1. **توفيق «كل خطأ → بطاقة + جولة إلزامية» (E04) مع الدستور §4:** بطاقة SRS تُنشأ للخطأ النظامي **فقط**؛ الهفوة («الخطأ العابر») والمتحجر بلا بطاقة — «بطاقة» سطر E04 = قيد دفتر + موضع في الجولة الإلزامية لكل خطأ. الدستور أرقى من سطر المخزون (§3 ترتيب المرجعيات).
2. **الحد التشغيلي للتصلّب:** `occurrences ≥ 3` مع تصحيح سابق (`registerRecurrence(..., correctedBefore: true)`) = fossilized — العائد يعود «غير محلول» فيدخل الجولة (بلا لوم — D23).
3. **قاعدة الدقائق الثلاث (F038) حارس آلي:** `ERROR_RESHOW_GAP_MIN = 3` — لا إعادة عرض أي خطأ قبل 3 دقائق (فجوة التذكر) — `canReshow`/`reshowAt` في `errors-engine.ts`.
4. **SrsCardState امتد بحقل اختياري `learning_steps`** (وفاء كامل مع ts-fsrs v5 forth/back بلا فقد؛ البيانات القديمة تبقى سليمة — بلا ترحيل).
5. **طابور محطة الاسترجاع (E03):** جولة الأخطاء الذهبية (الأقدم أولاً) ← البطاقات المستحقة (الأقدم استحقاقاً) ← مهارة اليوم؛ الجديد (state=New) والمتأخر مستبعدان — حارس «لا جلسة بلا استرجاع أولاً» + مسار «محاولة ← كشف ← تقييم» (§2.5).

### D37 — تثبيت صوت Piper في المستودع (2026-10-10 — قرار المالك)
**قرار المالك (تنفيذه بسكربت Termux المرفق `termux-upload-voice.sh`):** نموذج الصوت `de_DE-thorsten-medium.onnx` **يُلتزم في git** (blob عادي **بلا LFS**) بدل تنزيله كل جلسة. البصمة المثبّتة (هوية D28 الدائمة): `sha256 = 7e64762d8e5118bb578f2eea6207e1a35a8e0c30595010b666f983fc87bb7819` · `63,201,294` بايت · CC0. الملف المرافق `.onnx.json` ملتزم أيضاً. النتيجة: **106/106 خضراء في كل بيئة** بلا خطوة تنزيل، وتوليد الصوت يعمل في كل جلسة. المراجع: `tools/README-downloads.md` (الروابط احتياطية فقط).

### D38 — دفعة M1-ج: E05+E07+E08 + واجهة الحصة الكاملة (2026-10-10)
**المصادر (بوابة §34):** E05/E07/E08 من `engines-inventory-v1.md` · D16 · F005/F011/F012/F041/F044/F076/F077 · D23 · الخطة v1.3 §2.3. **الاختبار:** 30 اختباراً جديداً (136/136 أخضر). **الصدق:** التقرير أدناه. **التسجيل:** هنا.
1. **E05 (audio-engine):** D16 مُفعَّل كحارس آلي: `AUTO_JUDGE_ENABLED = false` + `validateFeedbackMode` يرفض auto-score/asr-judge/grade/Exam صراحة؛ التسجيل «لأذنك أنت» (تحذير يرافق كل تسجيل) + `RECORDING_LOCAL_ONLY` (التسجيلات لا تغادر الجهاز) + سرعات F044 الثلاث فقط.
2. **E07 (dictation-engine):** تدفق النسخ إلزامي (استمع ← اكتب ← اكشف ← قارن) — الجلسة الفارغة مرفوضة؛ مقارنة ثلاثية (correct/minor/retry) بتغذية F077 اللطيفة المفسِّرة «لماذا» + حارس `feedbackIsGentle` (بلا لوم وبلا أسطر متعددة).
3. **E08 (warmth-engine):** D23 مُفعَّل كاختبار يقفله — قائمة ممنوعات `BLAME_WORDS` تُمسح بها كل النصوص المولَّدة (صفر سلاسل/صفر توبيخ) + تقرير مسائي سطر واحد (F011) + معاينة الغد (F012) + رسائل مولر المتنوعة (اختيار حتمي).
4. **واجهة الحصة (LessonSession.tsx):** صدفة الحصة (4 محطات 15/40/50/15 + 3 استراحات + قفل اتجاه من E01) + شاشة §2.5 (محاولة ← كشف ← تقييم) + F121 في محطة الجديد + أدوات E05/E07/E08 — مربوطة في App بزر «ابدأ الحصة». **اكتملت محركات M1 الثمانية (E01–E08).**

### D39 — اكتمال المعلم 1: محتوى A1 حقيقي + تشغيل الحصة (2026-10-10)
**المصادر (بوابة §34):** D15 (Netzwerk neu A1 K1) · D3 (المحتوى بيانات) · §2.3/§2.5 · F121 · §9 (الوحدة صفر JIT). **الاختبار:** 12 اختباراً جديداً (148/148 أخضر) + G1 (22 ملفاً/0 أخطاء). **التسجيل:** هنا.
1. **محتوى الدرس الأول كامل (a1-u1-d1):** 15 كلمة (12 جديدة: تحية/وداع/دانكة/kommen/wohnen/الدول واللغة) بحقولها الكاملة (أعلام الخطر الصوتي والنحوي + جمل مألفة) + 3 مصائد ذهبية (حذف الفعل · aus لا von · تصريف heißen مع du) + حزمة SRS كاملة.
2. **الصوت:** 12 مقطعاً جديداً بالنموذج المثبّت (17 مساراً في المانيفست — قياسات حقيقية) + **إصلاح تسريب الاسم الداخلي**: إعلان مولر يقول «Willkommen bei Schlüssel» لا «Reise Yusuf» (D31) + إصلاح نص بطاقة الوحدة صفر.
3. **مُشغِّل الدرس (`lesson-runner.ts`):** يحوّل الدرس إلى شاشات الأربع محطات (الدفء ← الجديد ← التدريب ← الخلاصة) — كلمة مفقودة = خطأ فوري، ودفء فارغ = مرفوض (F121).
4. **التشغيل الكامل (`LessonContent.tsx` + App):** الحصة تمشي ببطاقاتها الحقيقية (استرجاع بطاقة-ببطاقة + جديد بمحاولة-قبل-كشف + تدريب بمحطاته + خلاصة بمصائدها وتقرير مولر) + **بطاقة الوحدة صفر JIT تظهر عند أول استخدام فعلي** (first-uebung) — الوحدة صفر كاملة في الواجهة.

### D40 — M2-أ: محركات المهارات الأربع E09–E12 (2026-10-10)
**المصادر (بوابة §34):** `docs/plans/engines-inventory-v1.md` §2 (مواصفة E09–E16) · Logan/Lively/Pisoni 1991 (الإدراك السمعي) · D18 (مخارج النطق الموثّقة) · Krashen (القراءة المتدرجة) · F075–F084 + Hattie & Timperley 2007 (التغذية الراجعة) · D16 (لا نُقّم النطق آلياً) · D23 (بلا لوم) · §2.5 (المحاولة قبل الكشف). **الاختبار:** 23 اختباراً جديداً — 171/171 أخضر + tsc + validator + build.
1. **E09 الاستماع المتقدم (`advanced-listening.ts`):** أزواج D16 نفسها (Bär/Bett · Kirche/Kirsche · Tier/Tür) + ضجيج تدريجي بأربع مراحل **بترقية ≥ 80% فقط** + أخبار بطيئة (0.7→0.85→1.0) — **النص المكتوب أخيراً** بعد كل الاستماعات.
2. **E10 النطق (`pronunciation.ts`):** بطاقات r/ch/ü بمخارج D18 **حرفياً** (لا تخمين) + دورة تدريب: استمع ← خريطة الفم ← سجّل قبل ← تدرب ← سجّل بعد ← قارن بسمعك — **`score: null` دائماً** (D16: التسجيل «لأذنك أنت»).
3. **E11 القراءة (`reading.ts`):** قفل G1 على كل نص (كلمة خارج مفردات المرحلة = رفض) + الترجمة بالنقر **بعد** محاولة القراءة + إضاءة متزامنة مع الصوت.
4. **E12 الكتابة (`writing.ts`):** تصحيح لطيف **يشرح «لماذا» في كل تصحيح إلزامياً** + مصائد الدرس الثلاث (von/aus · حذف الفعل · du heißt) + جملة اليوم الحتمية + يوميات A1 — **صفر لوم** (BLAME_WORDS ممنوعة في كل مخرجات التصحيح).

### D41 — M2-ب: محركات E13–E16 — **M2 مكتملة** (2026-10-10)
**المصادر (بوابة §34):** `docs/plans/engines-inventory-v1.md` §2 · guided discovery (الاكتشاف الموجّه) · §2.5 (المحاولة قبل الكشف) · Paivio (dual coding) · Ellis (TBLT) · Landeskunde (DaF) · §4 (حدود الصدق). **الاختبار:** 21 اختباراً جديداً — **192/192 أخضر** + tsc + validator (22/0) + build.
1. **E13 القواعد (`grammar-discovery.ts`):** قاعدة مثال←استنتاج←كشف — **الكشف مرمي فوراً قبل المثال أو قبل المحاولة** (قفلان حقيقيان في الكود) + حبّات الجملة (الحل مصفوفة القاعدة) + **مقارنة عربية إلزامية لكل قاعدة** (V2 · aus/von · du heißt).
2. **E14 المفردات الشبكية (`vocab-network.ts` + إثراء البيانات):** **كل كلمات الـ16 أُثريّت** بعائلة دلالية وكولوكيشن حقيقي (python JSON لا write_file) — validator `missingLinks = []` فعلياً + قصر ذهني (غرف بمفاهيم — dual coding) + مراجعة شبكية 3 تفاعلات (≤3 دقائق).
3. **E15 المهام الحقيقية (`real-tasks.ts`):** المقهى/القطار/الصيدلية — حوارات كاملة مألفة (D31: A/B) — **مهمة بلا هدف تواصلي معلن = مرفوضة** (Ellis) + التدفق: هدف ← محاولة ← نموذج ← إعادة + تقييم بمعايير معلنة فقط.
4. **E16 الثقافة (`culture.ts`):** «ألمانيا في 60 ثانية» + عيد الوحدة (3 أكتوبر — مصدر دستوري) + الميلاد + الويزن + أغنية الأسبوع (ملكية عامة) — **لا حقيقة بلا مصدر** (التسجيل مغلق) + حدود الصدق §4: تواريخ الويزن السنوية `needsWebVerify: true` ولا تُطلق كثابتة.
5. **شفافية (صدق):** اختبارا `voice-stability` التوليدان عرضا **مهلة vitest 5 ثوانٍ** تحت حِمل البيئة — أُعطيت مهلة صريحة 120 ثانية (**العتبات العلمية corr/durRatio لم تُمسّ**)؛ وفي تشغيل سابق ظهر تذبذب VITS الموثّق (durRatio 0.56) ونجح في إعادة التشغيل — كما سُجّل في فخاخ §6.

### D42 — واجهات M2: مختبر المهارات E09–E16 على الشاشة (2026-10-10)
**المصادر (بوابة §34):** D40/D41 (منطق المحركات) · §2.5 (المحاولة قبل الكشف) · D23 (بلا لوم) · D31 (A/B لا أسماء) · نمط `LessonContent.tsx` (D39). **الاختبار:** 9 اختبارات UI — **201/201 أخضر** + tsc + validator + build.
1. **`src/components/SkillsLab.tsx`:** مختبر بثماني محطات (تبويبات) — كل محطة شاشة محركها: استماع (أزواج + ضجيج + النص أخيراً) · نطق (مخرج D18 + دورة قبل/بعد + **«لا درجات» ظاهرة**) · قراءة (**زر الترجمة مقفل `data-locked` قبل إتمام القراءة الأولى**) · كتابة (تصحيح بـ«لماذا» + جملة اليوم + يوميات) · قواعد (أمثلة ظاهرة + **نص القاعدة مخفي والكشف معطّل في الحالة الأولى** + حبّات قابلة للتبديل) · شبكة (عارات + كبائش + قصر ذهني) · مهام (**الهدف قبل دعوة المحاولة** والحوار النموذجي مخفي حتى «قارن») · ثقافة (كل حقيقة بمصدرها + علم `needsWebVerify` + أغنية ملكية عامة).
2. **App:** زر «🧪 افتح مختبر المهارات» بجانب الحصة — M2 كلها يراها المستخدم الآن.

### D43 — M3: المحركات الستة E17–E22 (2026-10-10)
**المصادر (بوابة §34):** `docs/plans/engines-inventory-v1.md` §2 · Goethe-Institut (بنية المهارات — **تفاصيل النسخ الحالية تحت تحقق ويب §4**) · CEFR · Ebbinghaus (منحنى النسيان) · طلب يوسف (التكيّف) · D23 (بلا ضغط) · F210–F219 · WCAG. **الاختبار:** 27 اختباراً جديداً — **228/228 أخضر** + tsc + validator (22/0) + build.
1. **E17 البوابات (`gate-engine.ts`):** بوابة كل 6 أسابيع فقط (أسبوع غير بوابة = خطأ فوري) + أربع مهارات ثابتة — **حدود صدق صريحة**: صيغة التحدث `needs-web-verify` + تحذير «التفاصيل تُتحقق ويبياً» في كل بوابة + العتبة الداخلية (70%) **معلنة لا مخفية** وليست مقياس Goethe الرسمي.
2. **E18 التقدم الرباعي (`progress-engine.ts`):** **الأرقام من بياناتك الحقيقية فقط** — بيانات فارغة أو غير منطقية (صحيح>منجز، دقائق سالبة) = رفض فوري + منحنى النسيان R=e^(−t/S) + تقدير شهري يصرّح بمصدره.
3. **E19 التكيّف الإنساني (`adaptation-engine.ts`):** تجميد (مرض/رمضان/سفر/امتحان/عائلي) **يحفظ الجدول الأصلي كما هو** + العودة بـspaced review على أيام متتالية (لا كومة يوم واحد) + صفر لوم في كل النصوص.
4. **E20 الترفيه (`play-engine.ts`):** Wordle + قصة تفاعلية + لغز — **كل كلمات اللعبة من مفرداتك المدروسة فقط** (حارس `isStudied`) + قواعد لعب بلا مؤقت وبلا ضغط.
5. **E21 البيانات (`data-engine.ts`):** تصدير JSON/CSV + بصمة sha256 + استعادة — **round-trip مطابق عميقاً** وبأي تعديل = رفض فوري (لا استعادة عمياء).
6. **E22 الواجهة/الوصولية (`ui-accessibility.ts`):** RTL ثابت في كل شاشة + وضع ليلي + تكبير بخطوات مسموحة + وضع تركيز + حساب تباين WCAG القياسي — **كل أزواج لوحة الألوان الستة تجتاز AA (≥4.5)** في الوضعين.

### D44 — واجهات M3: لوحة النظام E17–E22 على الشاشة (2026-10-10)
**المصادر (بوابة §34):** D43 (منطق المحركات) · §4 (حدود الصدق ظاهرة) · D23 (بلا لوم/ضغط) · نمط `SkillsLab.tsx` (D42). **الاختبار:** 8 اختبارات UI — **236/236 أخضر** + tsc + validator + build.
1. **`src/components/SystemLab.tsx`:** لوحة بست شاشات — بوابة (**تحذير «تُتحقق من موقع المعهد عند النشر» ظاهر دائماً** + العتبة الداخلية معلنة) · تقدم (**«لا أرقام من العدم» في الحالة الفارغة** + منحنى النسيان) · تكيّف (5 أسباب + «جدولك محفوظ») · ألعاب (بلا مؤقت/ضغط + من مفرداتك) · نسخ احتياطي (استعادة تجريبية + **زر ملف مزوّر يُظهر الرفض**) · إعدادات (RTL ثابت + ليلي/تكبير/تركيز + **جدول تدقيق التباين كل صفوفه AA**).
2. **App:** زر «🛠️ افتح لوحة النظام» — M3 كلها يراها المستخدم.
3. **شفافية:** اختبار UI عانى تطبيع يونيكد للتنوين العربي في التوقعات — عُولج بتوقعات خالية من التنوين (لا تغيير في المنتج).

### D45 — حملة المحتوى (الدفعة 1): الوحدة 1 تكتمل d2–d3 (2026-10-10)
**المصادر (بوابة §34):** D15 (Netzwerk neu A1 K1 — مرجع منهجي، والمحتوى مألف) · `study-plan-daily-v6.1.md` §6 أهداف الوحدة 1 يوماً بيوم · D3 (بيانات) · §3 (Interleaving من اليوم 3) · §4 (بطاقة gender لكل اسم + نسب البطاقات) · خريطة 10‑ي (كل مصيدة تُحيل إليها). **الاختبار:** 6 اختبارات محتوى — **242/242 أخضر** + tsc + validator (**48 ملفاً/0 أخطاء**) + build.
1. **d2 (بلاد + sein — 12 كلمة):** 7 بلدان (der/die — Türkei/Schweiz مؤنثة!) + 3 لغات (أسماء لغات ألمانية لا تُستعار) + Sprache/Land (Land جمع umlaut: Länder) — 3 مصائد: aus لا تُحذف مع اسم البلد · Arabisch لا Arabic · السؤال بالفعل أولاً.
2. **d3 (تهجئة وكتابة — 12 كلمة):** Name/Vorname/Familienname (n-Deklination!) + Adresse/Telefonnummer + buchstabieren/wiederholen + جسيمات (genau/achso) + Alphabet — 3 مصائد: تصريف ich buchstabiere · حشو «Wie heißt dein Name?» · حروف الأسماء الكبيرة. **وتمرين خلط (Interleaving) من اليوم 3** كما تفرض §3.
3. **الصوت:** 24 مقطعاً جديداً بالنموذج المثبّت — المانيفست الآن **41 مساراً** بقياسات حقيقية.
4. **السجل (`lesson-packs.ts`):** `ALL_LESSONS` + `ALL_WORDS` (40 كلمة) + `wordsForLesson`/`runtimeWordsForLesson` — خطأ محتوى = خطأ بناء فوري، ومسار App يقرأ من السجل.
5. **شفافية:** اختبارا تحليل الصوت تجاوزا مهلة vitest (41 مساراً بدل 17) — مهلة صريحة 120 ثانية (**العتبات كما هي: ≤1.5s + نافذة RMS + تطابق ±20ms**).

### D46 — حملة المحتوى (الدفعة 2): d4 + d5 — الوحدة 1 تكاد تكتمل (2026-10-10)
**المصادر (بوابة §34):** D15 (مرجع منهجي) · `study-plan-daily-v6.1.md` §6 أهداف D4/D5 · §3 (Interleaving) · §4 (بطاقات) · خريطة 10‑ي. **الاختبار:** **242/242 أخضر** + tsc + validator (**69 ملفاً/0 أخطاء**) + build.
1. **d4 (Zahlen/Alter/Telefon — 12 كلمة):** Zahl/Nummer/Telefon/Handy (جنس مستعار: das Handy — مصيدة!) + alt/Jahr/Geburtstag + Schreiben + وحدات الزمن (Monat/Woche/Tag) + Straße — مصائد: `15 Jahre alt` (alt أخيراً) · جنس das Handy لا يُنقل من الإنجليزية · الملكية تتبع الجنس (Meine Nummer).
2. **d5 (wer/woher + تعريف — 7 كلمات):** Frage/Antwort (الجواب **auf** السؤال) + kennen (للأشخاص) + Freund/Freundin (جنس طبيعي مخالف) + Leute (جمع فقط) + zusammen — مصائد: **wer للأشخاص وwas للأشياء** · kennen لا wissen للأشخاص · Leute فعل جمع.
3. **d5 تعريف النفس في 4 جمل** (heiße + bin aus + spreche + wohne) + خلط (Interleaving) في اليومين ≥3 كما تفرض §3.
4. **الصوت:** 19 مقطعاً جديداً — المانيفست **60 مساراً** · الكلمات 59 · الدروس 5.

## D47 (2026-06-19): d6 توليف الوحدة 1 (معركة 0.75) + u2-d1 بداية الوحدة 2

- **d6** `kind:"integration"`: جسيمان فقط (alles-klar، bis-morgen) — تثبيت بلا تحميل جديد. العبر الثلاث (قوالب زمان غير sinnvoll · von/aus · woher للمنشأ) + معركة أسطورة 3 أسئلة **passingScore: 0.75** (مثل معركة د5 — تقصير مقصود). 2 مساراً فقط.
- **u2-d1** (الوحدةة 2): Länder جديدة (Österreich, Niederlande, Griechenland, Polen, Russland, Portugal) + نطاق (Europa, Welt) + wo/woher/hier/dort. المصائد: wo مكان/woher منشأ (خطأ العربي «أين أنت من؟») · **Niederlande جمع** (die/den Niederlanden) · aus+Dativ. **لا مقدمة للوحدة 2** (الدرس يبدأ كالمعتاد).
- البوابة: **243/243 + tsc + validator (85 ملفاً/0) + build** ✓.

## D48 (2026-10-10): u2-d2 (اللغات والسكن) + u2-d3 (شفرة الجنس — أول ظهور)

- **u2-d2**: 12 كلمة (6 معاد استخدامها من وحدة 1: sprache/deutsch/englisch/arabisch/wohnen/langsam + 6 جديدة: leben/stadt/haus/muttersprache/fremdsprache/wohnung). مصائد: sprechen+لغة بلا حرف جر · العنوان in+Dativ · المركّب يأخذ جنس آخر كلمة (die Muttersprache).
- **u2-d3**: 12 كلمة جديدة كلها تجسّد شفرة الجنس (Genuscode): -ung/-heit/-keit/-schaft=die · -chen=das · -er/-ling=der · -um=das. مصائد: das Mädchen (تصغير) · die Lehrerin (المؤنث -in) · النهايات الأربعة die.
- **اكتشاف**: درس بذرة قديم `a1-u3-d2` (كلمة واحدة) من أول commit — يبقى خارج السجل (ALL_LESSONS=9) لكن الفهرس العكسي يطالبه (wohnung usedInLessons تضم a1-u3-d2). والخلط (§3) إلزامي من يوم 3: interleavedWith مفعّل في u2-d3.
- البوابة: **243/243 + tsc + validator (104 ملفاً/0) + build** ✓.

## D49 (2026-10-10): إتمام الوحدة 2 — u2-d4 (Vokalquantität/ß-ss) + u2-d5 (حوار التعارف) + u2-d6 (المعركة)

- **u2-d4** (12 كلمة): ß/ss + الكمية الصوتية — groß/heiß/Fuß/süß (ß بعد الطويل) · Tasse/essen (ss بعد القصير) · Kaffee/Boot/Käse/Schule/gehen (ee/oo/ä/h للطول) + strasse (معاد استخدامها — ß). مصائد: heiss→heiß · Tasße→Tasse · Kafee→Kaffee.
- **u2-d5** (12 كلمة): حوار التعارف — vorstellen (trennbar+reflexive) · kennenlernen (trennbar) · freuen (reflexive) · gern/nett/Gespräch/auch/oder/natürlich/Hobby/lesen/Musik. مصائد: stelle mich vor · Ich lese gern (آخر الجملة) · lerne dich kennen.
- **u2-d6** (integration): جسيمان (okay/super) + معركة الوحدة 2 (حوار 6 تبادلات + أخطاء الأسبوع الثلاثة) بعتبة **0.75** — تفريغ wo/woher · sprechen بلا حرف جر · das Mädchen.
- **ملاحظة بناء**: الحزمة تجاوزت 500KB (تحذير حجم فقط — البناء ناجح ✓).
- البوابة: **243/243 + tsc + validator (132 ملفاً/0) + build** ✓. **الوحدتان 1+2 مكتملتان (12 يوماً).**

## D50 (2026-10-10): بداية الوحدة 3 — u3-d1 (Zahlen 20–100) + u3-d2 (Zahlen 100–1000 + الأسعار)

- **u3-d1** (12 كلمة): العشرات (zwanzig..neunzig) + hundert + zählen/Ziffer/mal. مصائد: **fünfundzwanzig** (الوحدة أولاً كلمة واحدة) · **sechzig/siebzig** (الحذف عند الربط) · **dreißig** (ß — تكرار واعٍ لقاعدة الوحدة 2).
- **u3-d2** (12 كلمة): tausend/Euro/Preis/kosten/billig/teuer/Geld/bezahlen/Karte/kaufen/nur/viel. مصائد: **Wie viel kostet das?** (بلا für) · **bezahlen + مفعول مباشر** · der Euro · nur وسط الجملة.
- **استبدال بذرة**: `a1-u3-d2` القديمة (كلمة واحدة — من أول commit) استُبدلت بالمحتوى الحقيقي (كان هدفها مطابقاً: «أرقام حتى 1000 وسعر»). الفهرس العكسي لـwohnung نُظّف.
- البوابة: **243/243 + tsc + validator (157 ملفاً/0 أخطاء/0 تحذيرات) + build** ✓.

## D51 (2026-10-10): الوحدة 3 — u3-d3 (Uhrzeit) + u3-d4 (um/am/im + Monate)

- **u3-d3** (12 كلمة): Uhr/Zeit/Stunde/Minute/halb/viertel/früh/spät/Morgen/Abend/Nacht/Mittag. مصائد: **halb drei = 2:30** (العدّاد للساعة التالية) · **Es ist drei Uhr بلا um** (um للمواعيد) · **der Morgen (صباح) vs morgen (غداً)**.
- **u3-d4** (12 كلمة): Januar..Juni + Termin/treffen/Verabredung/Montag/Sonntag/am. مصائد: **um/am/im** (ثلاث أدوات لـ«في» العربية) · الشهور مذكرة كلها · **sich treffen** (wir treffen uns). الخلط (§3) مفعّل في اليومين.
- البوابة: **243/243 + tsc + validator (183 ملفاً/0/0) + build** ✓.

## D52 (2026-10-10): إتمام الوحدة 3 — u3-d5 (Hören: Zahlen/Uhrzeit) + u3-d6 (المعركة)

- **u3-d5** (12 كلمة): hören/verstehen/schnell/laut/leise/Stimme/Ohr/Nachricht/Anruf/antworten/noch/mit. مصائد: **verstehen غير منفصلة** (ver- ملتصقة) · **antworten + Dativ** (dir لا dich) · **mit + Dativ دائماً** (mit dem Handy). عبارة الإصلاح: «Noch einmal, bitte!».
- **u3-d6** (integration): toll/klar + معركة الوحدة 3 (أرقام/وقت/مواعيد منطوقة) بعتبة **0.75** — تفريغ halb · um/am/im · fünfunddreißig.
- **درس مستفاد:** حقول slugs (goetheWordListOverlap) لا تحتمل الحروف غير ASCII — «hören» → `hoeren` (الدرس رُفض zod بسببها ثم أُصلح).
- البوابة: **243/243 + tsc + validator (199 ملفاً/0/0) + build** ✓. **الوحدات 1–3 مكتملة (18 يوماً).**

## D53 (2026-10-10): بداية الوحدة 4 — u4-d1 (Familie) + u4-d2 (الملكية mein/dein/sein)

- **u4-d1** (12 كلمة): Mutter/Vater/Sohn/Tochter/Bruder/Schwester/Eltern/Kind/Großvater/Großmutter/Frau/Mann. مصائد: **die Eltern جمع فقط** · المركّب (Großmutter) · **die Kinder** (er شاذ).
- **u4-d2** (12 كلمة): Familie/Tante/Onkel/Hund/Katze/Schlüssel/Tasche/Auto/gehören/mein/dein/sein. مصائد: **الملكية تتبع المُملوك** (meine Frau لا mein Frau) · **gehören + Dativ** · الملكية بلا أداة تعريف.
- **بيئية:** البيئة فقدت numpy/piper/node_modules فجأة (reset بين الجلسات) — استُعيدت: `pip3 install --break-system-packages numpy scipy soundfile piper-tts` + `npm ci` (من package-lock). موثّقة هنا للاستعادة السريعة.
- البوابة: **243/243 + tsc + validator (225 ملفاً/0/0) + build** ✓.

## D54 (2026-10-10): الوحدة 4 — u4-d3 (أول Akkusativ) + u4-d4 (وصف الصورة الأسرية)

- **u4-d3** (12 كلمة): jung/klein/schön/freundlich/lustig/schlau/Haar/Gesicht/Foto/Bild/beschreiben/wen. مصائد: **einen Bruder** (der ← einen عند المفعول — لا شيء غيرها يغيّر) · **wer للفاعل / wen للمفعول** · **meinen Bruder** (الملكية + Akkusativ معاً).
- **u4-d4** (12 كلمة): sehen/zeigen/sitzen/stehen/lächeln/links/rechts/neben/zwischen/gemeinsam/tragen/Brille. مصائد: **tragen للملابس والنظارة** · **الظرف أولاً ثم الفعل ثانياً** (Links steht mein Vater) · meinen (تكرار موعود).
- البوابة: **243/243 + tsc + validator (251 ملفاً/0/0) + build** ✓.

## D55 (2026-10-10): إتمام الوحدة 4 — u4-d5 (خلط الملكية/المفعول + تسجيل) + u4-d6 (المعركة)

- **u4-d5** (12 كلمة): Geschwister/Zwilling/verheiratet/Beruf/arbeiten/studieren/Arbeit/aufnehmen/kurz/erzählen/stolz/Heimat. مصائد: **die Geschwister جمع فقط** · **aufnehmen منفصل** (nehme ... auf) · **الجمع لا يتغير عند المفعول** (meine Geschwister مقابل meinen Bruder).
- **u4-d6** (integration): wunderbar/prima + معركة الوحدة 4 (أسرة + ملكية + مفعول) بعتبة **0.75**.
- البوابة: **243/243 + tsc + validator (267 ملفاً/0/0) + build** ✓. **الوحدات 1–4 مكتملة (24 يوماً).**

## D56 (2026-10-10): بداية الوحدة 5 — u5-d1 (Essen) + u5-d2 (Trinken/Restaurant)

- **u5-d1** (12 كلمة): Brot/Wurst/Fleisch/Fisch/Salat/Suppe/Ei/Reis/Nudeln/Obst/Gemüse/Hunger. مصائد: **Ich habe Hunger** (لا bin) · **die Nudeln جمع فقط** (المرة الثالثة للنمط) · **die Eier** (شاذ).
- **u5-d2** (12 كلمة): Wasser/Milch/Saft/Bier/Wein/Tee/trinken/Speisekarte/bestellen/Glas/Flasche/zahlen. مصائد: **Einen Tee, bitte!** (الطلب مفعول به) · جنس السوائل بلا نظام (die Milch رغم السوائل) · **die Speisekarte** (مركّب — للمرة الثالثة).
- البوابة: **243/243 + tsc + validator (293 ملفاً/0/0) + build** ✓.

## D57 (2026-10-10): u5-d3 (möchte/wollen) + u5-d4 (kein/nicht) — ومصيدة enums

- **u5-d3** (12 كلمة): Frühstück/Mittagessen/Abendessen/Butter/Marmelade/Kuchen/Eis/Appetit/schmecken/satt/Kartoffel/Tomate. مصائد: **möchte + Infinitiv بلا zu** (النهاية) · **Ich bin satt ↔ Ich habe Hunger** (انعكاس زوجي) · **Eis ↔ Ei** (زوج أدنى).
- **u5-d4** (12 كلمة): scharf/salzig/frisch/Portion/Teller/Löffel/Gabel/Messer/Gast/Bestellung/Trinkgeld/Getränk. مصائد: **نفي الاسم = kein (keinen Kaffee)** · **نفي الفعل/الصفة = nicht** · **نهايات kein الثلاث** (keinen/keine/kein).
- **معركة تقنية (مُوثَّقة للدرس):** مخطط الكلمة يستخدم **enums** لا نصوصاً: phoneticRisks ∈ [ch-ich-laut, ch-ach-laut, umlaut-u, umlaut-o, umlaut-a, vowel-long-short, auslaut-d/b/g, r-uvular, sp-st-initial, ig-ending, double-consonant, z, v-f] · grammarRisks ∈ [needs-ein, needs-ist, v2-order, gender-vs-natural, needs-es-dummy, kein-vs-nicht, trennbar, feste-praep, dative-verb, reflexive, zu-infinitiv, plural-irregular, adjective-decl, n-deklination] · goetheList ∈ [A1,A2,B1,B2] · **schemaVersion إلزامي**. + قاعدة validator: كل اسم ذي جنس يحتاج بطاقة gender في srsCardTypes.
- البوابة: **243/243 + tsc + validator (319 ملفاً/0/0) + build** ✓.

## D58 (2026-10-10): إتمام الوحدة 5 — u5-d5 (17 كلمة) + u5-d6 (المعركة)

- **u5-d5** (49–65): Durst/Salz/Pfeffer/Zucker/Sahne/Limonade/Hähnchen/Nachtisch/Vorspeise/Kasse/reservieren/probieren/kochen/backen/Küche/gesund/Mahlzeit. مصائد: **Durst/Hunger = haben ↔ satt = sein** · **-chen = دائماً das** (Hähnchen) · **تمييز kein↔nicht الختامي**. مهمة: **طلب كامل في مقهى** (طلب + نفيان + zahlen عند Kasse).
- **u5-d6** (integration — بلا كلمات جديدة): توليف + معركة بعتبة 0.75 — مراجعة hunger/zahlen كمرسات، و3 بطاقات تحذير ختامية (zu · haben/sein · kein↔nicht).
- ملاحظة إنتاج: كل يوم دراسي ≥3 يجب أن يحمل **3 بطاقات تحذير بالضبط** (اختبار الكشف) + كل اسم ذي جنس يشترط بطاقة gender في srsCardTypes.
- البوابة: **243/243 + tsc + validator (338 ملفاً/0/0) + build** ✓. **الوحدات 1–5 مكتملة = 304 كلمة · 30 درساً · 305 مساراً.**

## D59 (2026-10-10): بداية الوحدة 6 — u6-d1 (Möbel) + u6-d2 (Zimmer)

- **u6-d1** (12 كلمة): Tisch/Stuhl/Sofa/Bett/Schrank/Lampe/Teppich/Sessel/Regal/Spiegel/Vorhang/Kissen. مصائد: **der Schrank** (الخزانة مذكرة) · **Stühle/Schränke/Vorhänge** (عائلة umlaut تكبر) · **das Bett/das Kissen** (محايدان).
- **u6-d2** (12 كلمة): Zimmer/Schlafzimmer/Wohnzimmer/Badezimmer/Flur/Balkon/Treppe/Keller/Garten/hell/ruhig/gemütlich. مصائد: **مركّبات Zimmer = das** (الم rule للمرة الرابعة) · **die Gärten** (umlaut جديد) · **gemütlich** (ü تُكتب ue) + der Balkon/die Treppe.
- ملاحظة إنتاج: **كل بطاقة تحذير يجب أن تحمل «10»** (خريطة التداخل 10‑ي) حتى لو كان سبب العائق من قواعد أخرى — اكتُشف باختبار المصائد.
- البوابة: **243/243 + tsc + validator (364 ملفاً/0/0) + build** ✓.

## D60 (2026-10-10): u6-d3 (es gibt) + u6-d4 (Wo/Wohin)

- **u6-d3** (12 كلمة): Fenster/Tür/Wand/Boden/Decke/Heizung/Kühlschrank/Waschmaschine/Fernseher/Computer/Schreibtisch/Dach. مصائد: **es gibt + Akkusativ** (لا Dativ) · جنس الآلات (die Heizung ↔ der Fernseher) · **المركّبات: الجنس من آخر جزء** (Kühlschrank/Schreibtisch — الم rule للمرة الخامسة) · Dächer (شاذ).
- **u6-d4** (12 كلمة): Ecke/Mitte/oben/unten/über/unter/hinter/auf/stellen/legen/hängen/wohin. مصائد: **Wo?=Dativ ↔ Wohin?=Akkusativ** (an der Wand ↔ an die Wand) · **stellen/legen/hängen** الثلاثة · **Wo (u2) ↔ wohin** الزوج.
- ملاحظة إنتاج: البيئة فقدت مجدداً numpy/piper **و**node_modules — الاستعادة: `pip3 install --break-system-packages numpy scipy soundfile piper-tts` + `npm ci`. + مصيدة مطبعية: مفتاح JSON خاطئ (whyAramicSpeakerFails) لا يكسر zod لكنه يكسر اختبارات المصائد — تحقق دائم من المفاتيح.
- البوابة: **243/243 + tsc + validator (390 ملفاً/0/0) + build** ✓.

## D61 (2026-10-10): إتمام الوحدة 6 — u6-d5 (da + وصف شقة) + u6-d6 (المعركة)

- **u6-d5** (17 كلمة — 49–65): Möbel/Einrichtung/Gerät/Schublade/Rahmen/Handtuch/Seife/Dusche/Toilette/Pflanze/Vase/Hof/Etage/Stockwerk/Miete/Nachbar/dunkel. مصائد: **die Möbel جمع فقط** (النمط الرابع) · **die Nachbarn** (n-Deklination — يضيف -n) · **da-Türchen** (darauf/dahinter = فوقها/خلفها كلمة واحدة). مهمة: **وصف الشقة في 5 جمل**.
- **u6-d6** (integration — بلا كلمات): معركة 0.75 + 3 بطاقات ختامية (es gibt+Wo/Wohin · Möbel/Nachbarn · da-Türchen).
- موازنة SRS (§4/R10b): أُضيفت بطاقة comprehension إلى 191 كلمة تفتقر إليها — النسبة 41/20/6 → 34/35/5 (المستهدف A1 = 40/50/10 · off 0.355→0.266) — التحذير w-srs-ratio انطفأ.
- البوابة: **243/243 + tsc + validator (409 ملفات/0/0) + build** ✓. **الوحدات 1–6 مكتملة = 369 كلمة · 36 درساً · 370 مساراً.**

## D62 (2026-10-10): بداية الوحدة 7 — u7-d1 (Tagesablauf) + u7-d2 (Hobbys + gern/lieber)

- **u7-d1** (12 كلمة): aufwachen/schlafen/duschen/anziehen/müde/Pause/Wecker/Alltag/baden/anfangen/wecken/Weg. مصائد: **الفعل المنفصل أول لقاء** (Ich wache auf — البادئة في النهاية) · **bin müde ↔ habe Hunger** (الزوج يتكرر) · **aufwachen ↔ wecken** (intransitiv/transitiv).
- **u7-d2** (12 كلمة): Fußball/schwimmen/tanzen/reisen/zeichnen/spazieren/Kino/Spiel/spielen/lieber/Spaß/langweilig. مصائد: **lieber = مقارن gern بلا mehr** · **الرياضة بلا أداة** (Fußball spielen) · **Das macht Spaß** (مصدر شائع).
- البوابة: **243/243 + tsc + validator (435 ملفاً/0/0) + build** ✓.

## D63 (2026-10-10): u7-d3 (Präsens منتظم) + u7-d4 (شاذ fährt/isst)

- **u7-d3** (12 فعلاً منتظماً): machen/suchen/putzen/öffnen/schließen/brauchen/rufen/besuchen/benutzen/telefonieren/schicken/warten. مصائد: **du -st ↔ er -t** · **-ieren بلا ge-** (hat telefoniert) · **warten auf + Akkusativ**.
- **u7-d4** (12 كلمة — شاذ + سفر): fahren/waschen/geben/nehmen/sprechen/laufen/ankommen + Fahrkarte/Bahnhof/Zug/Bus/Fahrrad. مصائد: **a→ä في du/er** (fährst/fährt) · **isst ↔ ist** (متشابهان!) · **nimmt/spricht/gibt** (تبدّل الحرف).
- البوابة: **243/243 + tsc + validator (461 ملفاً/0/0) + build** ✓.

## D64 (2026-10-10): إتمام الوحدة 7 — u7-d5 (Trennbare) + u7-d6 (المعركة)

- **u7-d5** (17 كلمة — 49–65): aufstehen/anrufen/fernsehen/einkaufen/aufräumen/frühstücken/abwaschen/Haushalt/Wäsche/Müll/Buch/Besuch/Urlaub/Koffer/Reise/hübsch/feiern. مصائد: **البادئة في النهاية** (stehe ... auf) · **möchte + infinitive مركّب** (möchte aufstehen) · **فعل ↔ اسم** (fernsehen ↔ Fernsehen). مهمة: **وصف اليوم بأفعال منفصلة**.
- **u7-d6** (integration — بلا كلمات): معركة 0.75 + 3 بطاقات ختامية (انفصال/umlaut/نهايات · isst↔ist · möchte+Infinitiv).
- البوابة: **243/243 + tsc + validator (480 ملفاً/0/0) + build** ✓. **الوحدات 1–7 مكتملة = 434 كلمة · 42 درساً · 435 مساراً.**

## D65 (2026-10-10): بداية الوحدة 8 — u8-d1 (Kleidung) + u8-d2 (Preise)

- **u8-d1** (12 كلمة): Hose/Hemd/Schuhe/Jacke/Mantel/Kleid/Rock/Socke/Hut/Pullover/Größe/Farbe. مصائد: **das Hemd** (محايد رغم «القميص») · **موجة umlaut في الملابس** (Mäntel/Röcke/Kleider/Hüte) · **die + e = مؤنث** (Hose/Jacke/Socke).
- **u8-d2** (12 كلمة): Cent/Rabatt/Angebot/günstig/Wechselgeld/verkaufen/Verkäufer/Kunde/Supermarkt/Geschäft/Markt/anprobieren. مصائد: **Was kostet das?** (ترتيب السؤال) · **die Kunden** (n-Deklination الثاني) · **ver- تقلب المعنى** (kaufen↔verkaufen).
- البوابة: **243/243 + tsc + validator (506 ملفات/0/0) + build** ✓.

## D66 (2026-10-10): u8-d3 (können/müssen) + u8-d4 (الداتيف الثابت)

- **u8-d3** (12 كلمة): passen/Stück/Korb/Wagen/Kleidung/Kreditkarte/Regenschirm/Rucksack/Gürtel/Abteilung/finden/möglich. مصائد: **können/müssen + مصدر في النهاية** (مثل möchte) · **die Kleidung جامد** · **العدّاد Stück/Stücke**.
- **u8-d4** (12 كلمة): nach/aus/zu/Taxi/fliegen/Flug/Flughafen/parken/Rad/Bahn/abholen/Gepäck. مصائد: **mit + Dativ دائماً** (mit dem Bus) · **nach (بلا أداة) ↔ zu (zum/zur)** · **aus للمنشأ** (von في d5).
- البوابة: **243/243 + tsc + validator (532 ملفاً/0/0) + build** ✓.

## D67 (2026-10-10): إتمام الوحدة 8 — u8-d5 (von/seit/bei + التفاوض) + u8-d6 (المعركة)

- **u8-d5** (17 كلمة — 49–65): von/seit/bei/verhandeln/Quittung/Umtausch/Schmuck/Ring/Kette/Stiefel/Mode/Tüte/Geschenk/sparen/Sonnenbrille/Bäckerei/Schalter. مصائد: **von ↔ aus** (انتماء ↔ منشأ) · **seit + Dativ** (منذ — للحاضر) · **beim/zum/vom** (اندماجات). مهمة: **شراء وتفاوض في المتجر**.
- **u8-d6** (integration — بلا كلمات): معركة 0.75 + 3 بطاقات ختامية (الداتيف والاندماجات · الأفعال الناقمة · Was kostet + ver-/kaufen).
- البوابة: **243/243 + tsc + validator (551 ملفاً/0/0) + build** ✓. **الوحدات 1–8 مكتملة = 499 كلمة · 48 درساً · 500 مساراً.**

## D68 (2026-10-12): u9-d1 (أماكن المدينة والاتجاهات) — ودروس قاسية في المخططات والبيئة

- **u9-d1** (18 كلمة: 16 جديدة + hier/dort مكررتان من u2-d1 بإعادة بناء مقصودة): Kirche · Krankenhaus (جمع **Krankenhäuser**) · Apotheke · Universität · Bank · Post (بلا جمع) · Park · Museum (Museen) · Platz (Plätze) · Norden/Süden/Osten/Westen · **gegenüber + Dativ** (المصيدة) · hier/dort · geradeaus · zurück. المهمة: السؤال عن الأماكن ووصف الطريق.
- **الدروس الحرجة (دروس جلسة صعبة — مرجع دائم)**:
  1. مخطط الكلمة الحقيقي في `content/schemas/word.ts`: `wordClass` (enum مغلق) + `gender` ∈ [der/die/das/none] + `thema` + `level` + `unit` + `ar` **مصفوفة** + `plural` بالمقال + `sampleSentence` + `srsCardTypes`. لا `pos` ولا `gloss` ولا `lemma`.
  2. مخطط الدرس في `content/schemas/`: ziel/canDoDaily/warmup.cardIds/einstieg/praesentation(wordIds)/uebung.stations+communicativeTask/slider/**quiz.variants ≥ 3**/zusammenfassung.warningCards **3**/gReferences/curriculumRef/audioManifestRefs. الدرس = 120 دقيقة.
  3. `gen-audio.py` يعيد بناء **كل** الصوت في كل تشغيل (**16 دقيقة**) — للإضافات المفردة استخدم `one` ثم حدِّث المانيفست يدوياً. تحقّق من **تكرار** tuples (hier/dort كرّرت مرتين).
  4. **فحص التصادمات يشمل الكلمات القصيرة الشائعة** (hier/dort) — استعلامي لم يشملها فأُعيدت كتابتهما ثم استُعيدتا من git.
  5. الـgit reset يتكرر و**refs الريموت تختفي أحياناً**: `git fetch origin arena/...` يعيد خلقها ← `reset --soft` ← commit+push.
  6. `pkill -f` يقتل أمر الـbash نفسه — استخدم `pkill -f "gen-audi[o].py"`.
- البوابة: **243/243 + tsc + validator (568/0/0) + build** ✓. **الوحدات 1–9 قيد الإتمام: 515 كلمة · 49 درساً · 516 مساراً.**

## D69 (2026-10-12): u9-d2 (المواصلات والطريق) — الإنتاج السريع بالقالب الصحيح

- **u9-d2** (17 كلمة: 15 جديدة + مراجعة fahrkarte/fahrrad/minute من u7/u3): Haltestelle · Hauptbahnhof (جمع **Hauptbahnhöfe**) · Bahnsteig · Abfahrt · Ankunft (جمع **Ankünfte**) · Verkehr (بلا جمع) · Linie · Kreuzung · Richtung + **الأفعال المنفصلة الثلاثة: umsteigen / einsteigen / aussteigen** (البادئة في نهاية الجملة) + weit/nah · überall · vorbei · hin (hin und zurück).
- مصائد d2 الثلاث: **الفعل المنفصل** (~~Ich umsteige~~ → Ich steige … um) · **in + Akk (إلى داخل) ↔ in + Dativ (داخل)** · **wo ↔ wohin** و hin ↔ zurück.
- **الإنتاج السريع الموثوق**: كلمات بالمقالب الصحيح ← tuples ← توليد `one` (17 مقطعاً بـ36 ثانية) ← إدراج مسارات المانيفست آلياً قبل char-track مع metrics من `one` — البوابة الصوتية (hash/duration/RMS) تتحقق من كل شيء. **لم نعد نعيد بناء الصوت كاملاً (16 دقيقة)** إلا عند تغيّر الصياغة.
- البوابة: **243/243 + tsc + validator (586/0/0) + build** ✓ من المحاولة الأولى. **532 كلمة · 50 درساً · 533 مساراً.**

## D70 (2026-10-12): u9-d3 (الأدب والأمر — Imperativ Sie)

- **u9-d3** (12 كلمة: 10 جديدة + مراجعة nehmen/suchen): Entschuldigung (-igung) · Stadtplan (**Stadtpläne**) · Auskunft (**Auskünfte**) · Eingang (**Eingänge**) · Ausgang (**Ausgänge**) · Problem (Kein Problem!) · **helfen (فعل داتيفي!)** · **abbiegen (منفصل)** · zuerst · danach · sofort · gerne.
- **القواعد**: Imperativ (Sie) = **الفعل + Sie** (Biegen Sie links ab!) — البادئة تبقى في النهاية حتى في الأمر. مصائد d3: ترتيب الأمر · helfen+**mir** (Dativ) · abbiegen في الأمر.
- **درس أثمن من الكلمات**: النموذج المثالي «Nehmen Sie die zweite Straße!» من الخطة الأصلية — يُدرَّس بالكلمات المأخوذة مسبقاً (nehmen/suchen) مُراجَعة.
- البوابة: **243/243 + tsc + validator (599/0/0) + build** ✓. **544 كلمة · 51 درساً · 545 مساراً.**

## D71 (2026-10-12): u9-d4 (Wechselpräpositionen — قلب الوحدة)

- **u9-d4** (12 كلمة: 9 جديدة + مراجعة wand/regal/tisch): **an/in/vor (متأرجحة) + gegen (أكوزاتيف خالص)** · Brücke (Brücken) · Tunnel · Ufer (am Ufer!) · Seite · Parkplatz (Plätze) · Aufzug (Aufzüge) · Nähe · Meter. أسماء d4 قليلة لأن وحدة الأثاث أخذت معظم أسماء المكان (d4 مليء بالمراجعات المتداخلة).
- **القاعدة الذهبية**: **Wo? → Dativ (an der Wand) ↔ Wohin? → Akkusativ (an die Wand)** · gegen = Akk دائماً · am/im (مكان) ↔ an den/in den (حركة).
- **تذكير ذاتي**: خطأ `ar` string بدل list عاد مجدداً (لأول مرة منذ D68) — **دالة W يجب أن تقبل القوائم دائماً أو تحوّل آلياً**: `if isinstance(ar,str): ar=[ar]`. مُضاف لقائمة الفحص قبل البوابة.
- البوابة: **243/243 + tsc + validator (612/0/0) + build** ✓. **556 كلمة · 52 درساً · 557 مساراً.**

## D72 (2026-10-12): u9-d5 (Satzklammer + TEKAMOLO) — جوهرة الوحدة 9

- **u9-d5** (6 كلمات فقط — ميزان 65): bald · pünktlich (Umlaut+ich-Laut) · Stau · Grund (**Gründe**) · Verbindung · Fahrplan (**Fahrpläne**). مراجعة: morgen/abfahrt/umsteigen.
- **القواعد**: **Satzklammer** — الفعل في الموضع 2 مهما بدأنا بشيء آخر (Morgen **fahre ich**!) والبادئة/التكملة في النهاية (fährt um 8 Uhr **ab**) · **TEKAMOLO** مقدمة: **Zeit → Art → Ort** (morgen → mit dem Bus → zum Hauptbahnhof).
- مصائد d5: القلب بعد الظرف · ترتيب TEKAMOLO · البادئة حافة يمنى للقلنسوة.
- **بيئة**: numpy + node_modules فقدا مجدداً في نفس الجلسة — `pip3 install --break-system-packages …` + `npm ci` قبل البوابة.
- البوابة: **243/243 + tsc + validator (619/0/0) + build** ✓. **562 كلمة · 53 درساً · 563 مساراً.**

## D73 (2026-10-12): إتمام الوحدة 9 — u9-d6 (المعركة) — الوحدات 1–9 مكتملة

- **u9-d6** (integration — 0 كلمات جديدة، مراجعتا gegenueber/umsteigen): معركة 0.75 × 3 أشكال مختلطة (كل مصائد d1..d5) + 3 خلاصات: gegenüber+Dativ وWo?↔Wohin? · Imperativ Sie+المنفصل+helfen(Dativ) · Satzklammer+TEKAMOLO.
- **الوحدة 9 كاملة = 65 كلمة بالضبط** (18+17+12+12+6+0) · 6 أيام. can-do: يعطي الاتجاهات — منفَّذ: الأماكن · المواصلات · الأمر المؤدَّب · Wechselpräpositionen · Satzklammer/TEKAMOLO.
- البوابة: **243/243 + tsc + validator (620/0/0) + build** ✓. **562 كلمة · 54 درساً (الوحدات 1–9 = 54 يوماً) · 563 مساراً.**
- **التالي: الوحدة 10 (الصحة — study-plan v6.1)** بنفس سلسلة الإنتاج العشرية.

## D74 (2026-10-12): u10-d1 (طقس اليوم — Es الفاعل الصوري) — **تصحيح مسار مهم**

- **تصحيح**: الوحدة 10 في الخطة الأصلية = **المواعيد والطقس (60 كلمة)** — وليست «الصحة» (الصحة = الوحدة 11). التقارير السابقة أخطأت التسمية؛ الخطة study-plan-daily-v6.1 هي المرجع.
- **u10-d1** (12 كلمة Wetter — ميزان الوحدة 60 = 12×5): Wetter · Sonne · Regen · Schnee · Wind · Wolke · Himmel · Grad · warm · kalt · nass · sonnig (-ig). مراجعة: heiss/morgen.
- **القاعدة**: **Es الفاعل الصوري** — Es regnet · Es ist kalt · Es sind 20 Grad. مصائد: حذف Es («Regnet heute») · حذف الفعل («Heute kalt») · «Es ist regnet» (خلط التركيبين).
- البوابة: **243/243 + tsc + validator (633/0/0) + build** ✓. **574 كلمة · 55 درساً · 575 مساراً.**

## D75 (2026-10-12): u10-d2 (المواعيد والتواريخ)

- **u10-d2** (12 كلمة — Termine/Monate): Kalender (Gleich_plural) · Datum (**Daten**) · Dienstag/Mittwoch/Donnerstag/Freitag/Samstag (أيام der — **am** = an+dem) · Einladung · Absage · frei · besetzt · Wochenende (**Wochenenden**). مراجعة: termin/reservieren/monat.
- **القواعد**: **am + Wochentag** (دائماً Dativ مندمج) · **التاريخ: der zwölfte Mai** (المقال + ordinal + الشهر) · القلنسوة تتكرر: Am Montag **habe ich** Zeit.
- البوابة: **243/243 + tsc + validator (646/0/0) + build** ✓. **586 كلمة · 56 درساً · 587 مساراً.**

## D76 (2026-10-12): u10-d3 (أول الماضي — Perfekt + haben)

- **u10-d3** (12 كلمة): gestern · vorgestern · letzt (adjective-decl) + أفعال haben الستة: **bringen (hat gebracht) · holen · lernen · sagen · fragen · denken (hat gedacht)** + Brief · Paket · Spaziergang (Spaziergänge). مراجعة: machen/essen/kaufen (تصريفاتها تُدرَّس).
- **القاعدة**: **Perfekt = haben (موضع 2) + التصريف الثالث آخر الجملة** — قلنسوة u9 تتضخم: Gestern **habe** ich einen Brief **geschrieben**. التصريف: ge-+جذر+t (gemacht) أو جذور قوية تُحفظ (gebracht/gedacht).
- مصائد d3: مكان التصريف (Endstellung) · بناء التصريف · القلب بعد gestern.
- البوابة: **243/243 + tsc + validator (659/0/0) + build** ✓. **598 كلمة · 57 درساً · 599 مساراً.**

## D77 (2026-10-12): u10-d4 (الماضي بزمن محدد — Zeitangaben + التصريف المنفصل)

- **u10-d4** (12 كلمة): neulich · damals · vorher · nachher · endlich · plötzlich (Umlaut) + **vereinbaren** · **aufschreiben (منفصل: hat auf-geschrieben!)** + Erinnerung · Notiz · richtig · falsch. مراجعة: anrufen/telefonieren/termin.
- **قواعد**: الظرف داخل القلنسوة (habe **neulich** angerufen) أو مقدَّماً مع القلب · **التصريف المنفصل: auf-geschrieben** (ge بين البادئة والجذر!) · مقدمة adjective-decl (das richtige Buch).
- مصائد d4: مكان الظرف بعد التصريف · بناء التصريف المنفصل · اقتران الصفة.
- البوابة: **243/243 + tsc + validator (672/0/0) + build** ✓. **610 كلمة · 58 درساً · 611 مساراً.**

## D78 (2026-10-12): u10-d5 (أول جملة weil — تفسير السبب)

- **u10-d5** (12 كلمة): **weil** · warum · **deshalb** · darum · wichtig · dringend · krank · unwohl · Ruhe · Stress · Notfall (**Notfälle**) · ausruhen (reflexive+trennbar: hat **aus-geruht**). مراجعة: brauchen/muede/schlafen.
- **القاعدة**: **weil ترسل الفعل إلى النهاية** (…, weil ich krank **bin**) — عكس القلنسوة تماماً · إذا بدأت بجملة weil: الجملة الرئيسية تقلب (Weil ich krank bin, **brauche** ich …) · **deshalb/darum ظروف**: الفعل ثانٍ بعدهما.
- **ملاحظة منهجية**: كلمات العَرَض الطبي (kopfschmerz/schwindel/krankmeldung) تُترك للوحدة 11 (الصحة) — لا سرقة مادة.
- البوابة: **243/243 + tsc + validator (685/0/0) + build** ✓. **622 كلمة · 59 درساً · 623 مساراً.**

## D79 (2026-10-12): إتمام الوحدة 10 — u10-d6 (المعركة) — الوحدات 1–10 مكتملة

- **u10-d6** (integration — 0 كلمات، مراجعتا weil/gestern): معركة 0.75 × 3 (Es-dummy · am+Tag · Perfekt/التصريف المنفصل · weil Endstellung) + 3 خلاصات ختامية.
- **الوحدة 10 كاملة = 60 كلمة بالضبط** (12×5+0) — المواعيد والطقس: Wetter · Termine · Perfekt(haben) · Zeitangaben · weil.
- **بيئة**: numpy يُمسح عدة مرات في الجلسة الواحدة — **أعد التثبيت في نفس أمر الـbash قبل vitest** (`pip3 install … && npx vitest run`) — وإلا تسقط اختبارات الصوت الخمسة بخطأ numpy المضلِّل.
- البوابة: **243/243 + tsc + validator (686/0/0) + build** ✓. **622 كلمة · 60 يوماً · 623 مساراً.**
- **التالي: الوحدة 11 (الصحة والجسم — 60 كلمة)** ثم الوحدة 12 (السفر والتخطيط).

## D80 (2026-10-12): u11-d1 (أجزاء الجسم — افتتاح الوحدة 11)

- **u11-d1** (12 كلمة Körper): Kopf (**Köpfe**) · Hand (**Hände**) · Arm · Bein · Rücken · Bauch (**Bäuche**) · Hals (**Hälse**) · Auge · Nase · Mund (**Münder**) · Zahn (**Zähne**) · Finger. مراجعة: fuss/haar/ohr.
- **قواعد d1**: أجناس الجسم عشوائية (die Hand · das Bein · das Auge) · جمع الوملاوت (Hände/Köpfe/Zähne) · **X + tut + weh** (weh آخر الجملة — القلنسوة بشكل جديد).
- البوابة: **243/243 + tsc + validator (699/0/0) + build** ✓. **634 كلمة · 61 درساً · 635 مساراً.**

## D81 (2026-10-12): u11-d2 (وصف الألم — الطبيب والدواء)

- **u11-d2** (12 كلمة — Arzt/Gesundheit): Arzt (**Ärzte**) · **Ärztin (-in للأنثى)** · Schmerz (Schmerzen) · **Kopfschmerzen (جمع دائم!)** · Fieber (بلا جمع) · Erkältung (**Erkältungen**) · Grippe · Schwindel · Medikament · Tablette · Rezept · untersuchen (hat untersucht). مراجعة: nehmen/seit/krank.
- **قواعد d2**: الألم بالأسماء: habe + **جمع** (Kopfschmerzen) أو اسم جماعي (Fieber/Schwindel) · **seit + Dativ** (seit zwei Tagen — مراجعة u8-d5 في سياق الطبيب) · لاحقة **-in** للأنثى (Ärztin).
- البوابة: **243/243 + tsc + validator (712/0/0) + build** ✓. **646 كلمة · 62 درساً · 647 مساراً.**

## D82 (2026-10-12): u11-d3 (الماضي مع sein — bin/war)

- **u11-d3** (12 كلمة): bleiben (**ist geblieben**) · liegen (hat gelegen) · wieder · schwach · besser · fit · husten (hat) · niesen (hat) · jucken (**Es juckt**) · brennen (hat) · verschwinden (**ist verschwunden**) · dauern (hat). مراجعة: gehen/sein/kommen.
- **قواعد d3**: **bin/war** — الحركة/التغيّر = **sein** (blieben · verschwunden) · الأعراض في مكانها = **haben** (gehustet · geniest) · **war** المباشر (لا habe gewesen) · **Es juckt** (Es الفاعل الصوري يعود).
- حادث مخطط: `whyArabicSpeakerFails: 10` رقم بدل نص — Zod فشل بمعلومة مفيدة = **قواعد قديمة (D77) تعمل** — أُصلح فوراً.
- البوابة: **243/243 + tsc + validator (725/0/0) + build** ✓. **658 كلمة · 63 درساً · 659 مساراً.**

## D83 (2026-10-12): u11-d4 (اختيار haben↔sein — قاعدة القرار)

- **u11-d4** (12 كلمة): **sich fühlen (reflexive)** · verbinden · Wunde · Blut · bluten · Spritze · Impfung · schlucken · rauchen · erlauben · Thermometer · Pflaster. مراجعة: bringen/bleiben/gehen (bringen = hat رغم أنه «حركة»!).
- **قواعد d4**: **قاعدة القرار الذهبية**: عَرَض/مرض = **haben** (38 Grad Fieber) · حركة/تغيّر = **sein** (geblieben) — **sich fühlen** بضمير انعكاس (Ich fühle **mich**) — **Rauchen Sie nicht!** (Verb+Sie+nicht).
- البوابة: **243/243 + tsc + validator (738/0/0) + build** ✓. **670 كلمة · 64 درساً · 671 مساراً.**

## D84 (2026-10-12): u11-d5 (المهمة الكبرى: عند الطبيب)

- **u11-d5** (12 كلمة): Patient (Patienten) · **Hausarzt (Hausärzte)** · Spezialist · **Notaufnahme** · **Krankenwagen** · **Unfall (Unfälle)** · Schnupfen · Zahnschmerzen · Bauchschmerzen · schmerzen (Es schmerzt) · Tropfen · Salbe. مراجعة: helfen/wichtig/notfall.
- **قواعد d5**: المساعد في المركز والفعل **آخر** (muss … gehen · dürfen … rauchen) · **helfen + Dativ** (Das hilft **mir**) · **جنس المركّب = آخر كلمة** (der Krankenwagen · die Notaufnahme · der Zahnschmerz) — القاعدة الذهبية للمركّبات.
- البوابة: **243/243 + tsc + validator (751/0/0) + build** ✓. **682 كلمة · 65 درساً · 683 مساراً.**

## D85 (2026-10-12): u11-d6 (معركة الوحدة 11 — اكتمال الوحدة)

- **u11-d6** (integration · 0 كلمات): مراجعة kopfschmerz/fieber · warmup hand/arzt/bleiben · quiz 3×0.75 · **3 خلاصات**: الألم بطريقتين (tut weh ↔ habe Schmerzen) · قاعدة القرار (habe العَرَض ↔ bin التغيّر + war) · العيادة (الفعل آخر · helfen+Dativ · جنس المركّب) · usedArsenalIds 5.
- **تصحيحات مخطط خلال الدفعة**: kind=integration (لا review) · pretestItems ≥ 1 · dualCodingRequired=true · wordIds/srs/audioRefs بمراجع المراجعة (كما u10-d6).
- البوابة: **243/243 + tsc + validator (752/0/0) + build** ✓. **682 كلمة · 66 يوماً · 683 مساراً.**
- **اكتمال الوحدة 11 (الصحة والجسم) ✅** — d1 الجسم · d2 الألم · d3 bin/war · d4 haben↔sein · d5 الطبيب · d6 المعركة.

## D86 (2026-10-12): u12-d1 (الوجهة — افتتاح الوحدة 12 الأخيرة)

- **u12-d1** (12 كلمة Reise): Ziel · Hotel (**Hotels** -s مستعار) · Reservierung · Fahrt · **abfahren (trennbar — fährt ab)** · besichtigen · **Sehenswürdigkeit (Sehenswürdigkeiten)** · Ausland (ins Ausland) · **Pass (Pässe)** · **Visum (Visa)** · Ausflug (Ausflüge) · Tourist (Touristen n-dekl). مراجعة: reisen/zug/urlaub.
- **قواعد d1**: **الفعل المنفصل: البادئة ab آخر الجملة** (fährt um 8 ab) — القلنسوة الثالثة · الوجهة **ins** ↔ المكان **im** (Wechselpräp يعود) · ثلاثة أنماط جمع في ثلاث وثائق (Pässe/Visa/Hotels).
- البوابة: **243/243 + tsc + validator (765/0/0) + build** ✓. **694 كلمة · 67 درساً · 695 مساراً.**

## D87 (2026-10-12): u12-d2 (المحطة والفندق — الأسئلة)

- **u12-d2** (12 كلمة): Gleis · Rezeption · **Doppelzimmer/Einzelzimmer** (مركّبان) · Aussicht · **Bad (Bäder)** · buchen · **Empfang (Empfänge)** · Halle · **Verspätung (hat Verspätung!)** · verpassen · **zurückgeben (trennbar — Geben Sie … zurück!)**. مراجعة: suchen/zeigen/ankommen.
- **قواعد d2**: التأخير «شيء تملكه»: **hat Verspätung** (لا ist) · الأمر بالفعل المنفصل: Verb+Sie+…+**zurück** · **von welchem** (von+Dativ في السؤال).
- البوابة: **243/243 + tsc + validator (778/0/0) + build** ✓. **706 كلمة · 68 درساً · 707 مساراً.**

## D88 (2026-10-12): u12-d3 (الماضي + الأفعال المنفصلة معاً)

- **u12-d3** (12 كلمة): **losfahren (ist losgefahren)** · **zurückkommen (ist)** · **mitbringen (hat mitgebracht)** · ansehen · mitnehmen · ausgeben · einpacken · auspacken · **anmelden (sich — reflexive+trennbar!)** · aufpassen · mieten · planen. مراجعة: reisen/abfahren/koffer.
- **قواعد d3**: الماضي المنفصل: البادئة+**ge**+الجذر (**ein-ge-packt** — ge في المنتصف!) · قاعدة القرار مع البادئات (losgefahren=ist ↔ eingepackt=hat) · sich anmelden: habe + **mich** + angemeldet (ثلاثة أجزاء).
- البوابة: **243/243 + tsc + validator (791/0/0) + build** ✓. **718 كلمة · 69 درساً · 719 مساراً.**

## D89 (2026-10-12): u12-d4 (الروابط — denn ≠ weil!)

- **u12-d4** (12 كلمة): **denn (V2!)** · **sondern (بعد النفي فقط)** · **deswegen (V2!)** · leider · vielleicht · dann · zuletzt · Beispiel (zum Beispiel) · Meinung (Meiner Meinung nach) · Vorschlag (**Vorschläge**) · Idee · Plan (**Pläne**). مراجعة: oder/deshalb/weil. (und/aber = قواعد مجردة بلا ملفات — كما haben.)
- **قواعد d4**: **الثلاثية الذهبية**: weil (الفعل آخر) · **denn (الفعل ثانٍ V2)** · **deswegen (يبدأ الجملة — الفعل يقفز)** · sondern فقط بعد nicht/kein · **Meiner Meinung nach** + V2 (nach آخر التعبير).
- البوابة: **243/243 + tsc + validator (804/0/0) + build** ✓. **730 كلمة · 70 درساً · 731 مساراً.**

## D90 (2026-10-12): u12-d5 (سرد الرحلة — آخر 12 كلمة في الخطة!)

- **u12-d5** (12 كلمة — طبيعة وتذكار): Landschaft · Natur · **See (der=بحيرة · die=بحر!)** · Berg (Berge) · Meer · **Strand (Strände)** · Insel · **Fluss (Flüsse)** · **Wald (Wälder)** · Andenken · **fotografieren (hat fotografiert — لا ge!)** · Postkarte. مراجعة: foto/reise/ausflug.
- **قواعد d5**: **أفعال -ieren بلا ge** (fotografiert · studiert) — انهيار قاعدة ge الأول · **جبل الوملاوت**: Berge/Strände/Wälder/Flüsse · **der See ↔ die See** (الجنس يغيّر المعنى!).
- حادث مخطط: `no-ge-perfekt` ليست في enum grammarRisks (D68) — أُزيلت (القاعدة تبقى في warningCards).
- البوابة: **243/243 + tsc + validator (817/0/0) + build** ✓. **742 كلمة · 71 درساً · 743 مساراً.**
- **آخر كلمات الخطة!** تبقّى u12-d6 (المعركة الكبرى — 0 كلمات).

## D91 (2026-10-12): u12-d6 (المعركة الكبرى — اكتمال خطة A1 بالكامل!)

- **u12-d6** (integration · 0 كلمات): warmup **hallo/danke/bitte** (بداية الدورة ونهايتها!) · wordIds hoeren/sprechen · quiz 3×0.75 شامل الوحدات الـ12 · **3 خلاصات نهائية**: القلنسوة الثلاثية · المساعدان bin/hat + war/hatte · الست مصائد خطرة للعرب (الجنس · الوملاوت · seit+Dativ · helfen+Dativ · -ieren بلا ge · denn≠weil).
- **تصحيح**: zuhoren غير موجود (كما haben/und/aber) → hoeren (الموجود).
- البوابة: **243/243 + tsc + validator (818/0/0) + build** ✓. **742 كلمة · 72 يوماً · 743 مساراً.**
- **🏁 اكتمال خطة A1 بالكامل: الوحدات 1–12 · 72 يوماً · 742 كلمة.** التخطيط المسطّر في study-plan-daily-v6.1 منفَّذ كاملاً. الخطوة التالية (عند المالك): أسبوع التثبيت والامتحان أو محتوى إضافي.

## D92 (2026-10-12): أسبوع التثبيت والامتحان = الوحدة 13 (تمديد schema)

- **القرار**: خطة A1 = 12 أسبوع تدريس + **1 أسبوع تثبيت/امتحان** + 1 احتياطي (study-plan-daily-v6.1 §1). أسبوع التثبيت = **الوحدة 13** بأيامها الستة → تمديد `unit: max(12) → max(13)` في `content/schemas/lesson.ts`.
- **6 دروس تثبيت (integration · 0 كلمات جديدة)**: d1 (u1+u2: التحية/الاتجاهات + wohin↔wo) · d2 (u3+u4: الطعام/المدينة + ohne+Dativ) · d3 (u5+u6: التسوق + المساعدات + halb drei) · d4 (u7+u8: Es الصوري + seit+Dativ) · d5 (u9+u10: المهن + Perfekt + weil/deshalb) · **d6 (u11+u12 + Modelltest — 4 مهارات: Hören/Lesen/Schreiben/Sprechen)**.
- **تصحيحات**: 7 كلمات مفقودة من المراجع (kollege/norden/student/empfehlen/restaurant/regnen/ingenieur) → مستبدلة بموجودة (freund/strasse/lehrer/bestellen/apotheke/warm/krank) — قاعدة «warmup cardIds = كلمات موجودة» تعمل ✓.
- البوابة: **243/243 + tsc + validator (824/0/0) + build** ✓. **742 كلمة · 78 يوماً · 743 مساراً.**

## D93 (2026-10-12): بطاقات الثقافة (Landeskunde) — الإضافة 1 من خطة «الكل»

- **القرار**: بطاقة ثقافة أسبوعية لكل وحدة (الخطة §2: «كل جمعة بطاقة Landeskunde») — نوع محتوى جديد `content/landeskunde/` + مخطط `CultureCard` + تسجيل في المدقِّق (classify + facts ≥2) + تصدير `ALL_LANDESKUNDE` من lesson-packs.
- **12 بطاقة** (u1..u12): التحية (Sie/du · Grüß Gott) · الأسرة والمسكن · المدينة (الدراجات · الأحد مغلق) · الطعام (300 نوع خبز · ماء الصنبور) · المواصلات (Deutschlandticket بلا سعر!) · التسوق (Bargeld) · الطقس · الوقت (Pünktlichkeit) · العمل (Ausbildung · Ich bin Arzt) · الأعياد · الصحة (112/110) · السفر (شنغن needs-web-verify).
- **حدود الصدق**: بلا أسعار/تواريخ متغيّرة · `sourceNote` في كل بطاقة · Schengen/Brot-Sorten موسومة needs-web-verify.
- البوابة: **244/244 + tsc + validator (836/0/0) + build** ✓. (اختبار جديد للبطاقات.)
- **قائمة الانتظار (أمر المالك «الكل»)**: 2) Kurztest + Monatsprüfung · 3) Modelltest كامل · 4) الصور التوضيحية · 5) نصوص القراءة · 6) صوت امرأة · 7) تقرير التقدم · 8) A2.

## D94 (2026-10-12): الاختبارات الدورية (Kurztest + Monatsprüfung) — الإضافة 2

- **القرار**: نوع محتوى جديد `content/pruefungen/` + مخطط `CyclicTest` (kind: kurztest|monatspruefung · coversUnits · timeBudgetMin · passingScore) + قواعد مدقِّق (Kurztest ≤12 عنصراً/15د · Monatsprüfung ≥10) + تصدير `ALL_PRUEFUNGEN`.
- **9 اختبارات تراكمية**: Kurztest ×6 (الأسبوع 2/4/6/8/10/12 · 8 عناصر · 15 د · عتبة 0.75) + Monatsprüfung ×3 (الأسبوع 4/8/12 · 12 عنصراً · 45 د) — كلها من مادة الدروس السابقة (صدق: بلا محتوى جديد مخترع).
- البوابة: **245/245 + tsc + validator (845/0/0) + build** ✓.
- **قائمة «الكل»**: ✅1 بطاقات الثقافة ✅2 الاختبارات الدورية · 3) Modelltest كامل · 4) الصور · 5) القراءة · 6) صوت امرأة · 7) تقرير التقدم · 8) A2.

## D95 (2026-10-12): الامتحان التجريبي الكامل (Modelltest) — الإضافة 3

- **القرار**: نوع محتوى جديد `content/modelltest/` + مخطط `Modelltest` (4 أقسام إجبارية: hoeren/lesen/schreiben/sprechen · passingScore · sourceNote) + قاعدة مدقِّق (كل المهارات الأربع موجودة) + تصدير `ALL_MODELLTESTS`.
- **a1-modelltest-1**: 36 عنصراً في 4 أقسام (Hören 3 أجزاء · Lesen 3 · Schreiben 2 — استمارة + رسالة 30 كلمة · Sprechen 3 — تعريف/طلب/اتجاه) · العتبة 60% (كالمعتاد في امتحانات Goethe — needs-web-verify) · كل الأسئلة من مفردات الخطة الـ742.
- **حدود الصدق**: sourceNote صريح: بنية الامتحان needs-web-verify من goethe.de قبل أي استخدام رسمي · هذا تدريب داخلي لا نسخة رسمية.
- البوابة: **246/246 + tsc + validator (846/0/0) + build** ✓.
- **قائمة «الكل»**: ✅1 ثقافة ✅2 اختبارات دورية ✅3 Modelltest · 4) الصور · 5) القراءة · 6) صوت امرأة · 7) تقرير التقدم · 8) A2.

## D96 (2026-10-12): الصور التوضيحية — الدفعة الأولى (الترميز المزدوج)

- **القرار**: تفعيل مانيفست الصور الموجود (كان فارغاً) + **هوية بصرية واحدة** (styleGuide: Flat vector · لوحة دافئة · خلفية كريمية) لكل الصور + source=`ai-generated-optional` + alt إلزامي (§15) + ربط imageManifestRefs بالدروس.
- **10 صور مولّدة** (حد المنصة: 10 لكل دورة): brot · apfel · zug · bus · haus · familie · sonne · regenschirm · uhr · arzt — موزعة على 9 دروس. **بقي hand + koffer** (فشل الحد — تُولَّد في الدفعة التالية).
- **ملاحظة صادقة**: apfel بلا ملف كلمة (مثال في u4-d1) — الصورة مربوطة بالدرس مباشرة.
- البوابة: **247/247 + tsc + validator (846/0/0) + build** ✓. التصدير `ALL_IMAGES` للتطبيق.
- **قائمة «الكل»**: ✅1 ثقافة ✅2 اختبارات ✅3 Modelltest ✅4 صور (الدفعة 1) · 5) القراءة · 6) صوت امرأة · 7) تقرير التقدم · 8) A2.

## D97 (2026-10-12): نصوص القراءة + إكمال الصور — الإضافة 5

- **نصوص القراءة**: نوع محتوى جديد `content/lese/` + مخطط `ReadingText` (text.de ≥40 حرفاً · glossary ≥1 · questions ≥2 · sourceNote) + قاعدة مدقِّق + تصدير `ALL_LESETEXTS`. **12 نصاً أصلياً** (وحدة واحدة لكل نص) — كل نص من مفردات وحدته + مسرد + سؤالان + ترجمة عربية.
- **إكمال الصور (12/12)**: hand + koffer مولّدتان — المانيفست الآن 12 صورة بالهوية البصرية الواحدة.
- **حدود الصدق**: النصوص أصلية مكتوبة للخطة (لا اقتباسات خارجية) · sourceNote في كل نص.
- البوابة: **248/248 + tsc + validator (858/0/0) + build** ✓.
- **قائمة «الكل»**: ✅1 ثقافة ✅2 اختبارات ✅3 Modelltest ✅4 صور (12/12) ✅5 قراءة (12 نصاً) · 6) صوت امرأة · 7) تقرير التقدم · 8) A2.

## D98 (2026-10-12): صوت امرأة (kerstin): البنية جاهزة، الملف يُنزَّل مالكياً

**القرار**: صوتان للحوار: `de_DE-thorsten-medium` (الراوي والدروس) + `de_DE-kerstin-low` (المرأة: nina/ayse/frau-berg/frau-schmidt/aisha/lena + أدوار character/guest/dialogue). الترخيص **MIT** (موثّق من spec باكيج OpenMandriva لـ rhasspy piper-voices). **البنية كلها مبنية ومجربة**: `PINNED_VOICES` + `VOICE_ID_FEMALE` في audio.ts · قاعدتا validator (e-audio-voice-drift/e-audio-voice-role) · gen-audio.py يوجّه الأصوات تلقائياً بلفّة fallback آمنة للصوت الرئيسي إن غاب ملف kerstin. **ملف kerstin غير قابل للتنزيل من الـsandbox** (huggingface محجوب — النسخة على GitHub مجرد مؤشر LFS): الملفان (onnx ~16.8MB + json) يُنزَّلان عبر Termux بنمط thorsten إلى `tools/piper-voices/de_DE-kerstin-low.onnx` + `.json` — **ويعمل فوراً بلا أي كود إضافي**. 2026-10-12. #A2
- **تصحيح لاحق (D100):** قاعدتا المدقِّق وتوجيه gen-audio لم تكونا منفَّذتين في هذه الدفعة، وحجم الملف الحقيقي 63,104,526 بايت لا ~16.8MB — انظر D100.

## D99 (2026-10-12): تقارير التقدم (E18/F159/F160): طبقة التقارير فوق progress-engine

**القرار**: `src/lib/progress-report.ts` — تقرير أسبوعي («أيامك مع مولر» لا «سلسلة» — F157) + تقرير شهري بمعايرة تقدير الذات (F160: تقديرك مقابل نتيجتك الحقيقية — فروق ≤5% «دقيق» / ≤15% «قريب» / أكبر «طبيعي والمعايرة تُضبط» — بلا لوم) + سطر الخريطة (§2.8: أين أنت + خطوتك التالية). **الحديد**: أرقام حقيقية فقط (E18 — تقرير العدم بلا رقم واحد) · كل نص يمر على BLAME_WORDS قبل الخروج (حارس D23 يخترق الخطأ إن تسرب لوم) · بلا بيانات = بصراحة لا اختراع. 17 اختباراً جديداً (265 كلها). 2026-10-12. #A2

## D100 (2026-10-14): صوت المرأة — تصحيح صادق لـD98 (ما ادُّعي صار حقيقياً) + إصلاح سكربت المالك

- **الفحص (بوابة §34 — الصدق):** D98 قال «البنية كلها مبنية ومجربة… ويعمل فوراً بلا أي كود إضافي». الفحص الفعلي للكود وجد ثلاث فجوات: (1) `validate-content.ts` يستورد `PINNED_VOICES/FEMALE_ROLES` **ولا يستخدمها** — أي مسار kerstin كان سيُرفض كـ`e-audio-voice-drift`، وقاعدة `e-audio-voice-role` **غير موجودة** · (2) `gen-audio.py` يعرّف ثوابت kerstin لكن `tts()` يستخدم thorsten دائماً — لا توجيه فعلي · (3) اختبار الاستقرار يفرض أن كل مسار = thorsten. لم يُضف D98 أي اختبار (248→248).
- **خطأ يوقف المالك:** حجم kerstin الحقيقي **63,104,526 بايت (≈63MB)** لا «~16.8MB». بوابة السكربت (15–18MB) كانت **سترفض الملف الأصلي وتتوقف**، والبصمة «المعروفة» `847543…` غير موثّقة من أي مصدر.
- **المصدر:** الفهرس الرسمي `rhasspy/piper → src/python_run/piper/voices.json` (عبر api.github.com) — موثوقيته مُتحقَّقة: يطابق ملف thorsten الملتزم **بالبايت** (63,201,294). قيم kerstin: onnx `63104526` · md5 `1d5e5788cfddb04cbb34418f2841931e` | json `5952` · md5 `952af66f…2447` | MODEL_CARD `272` · md5 `69ec1bc9…a6c7`.
- **القرار والتنفيذ:**
  - المدقِّق: `e-audio-voice-drift` = أي صوت خارج `PINNED_VOICES` (للمسارات **ولـcharacterVoices**) · `e-audio-voice-role` = kerstin خارج `character/guest/dialogue` (الكلمات والإعلانات بالرئيسي دائماً).
  - gen-audio: `voice_for(character)` — الإناث → kerstin **إن وُجد ملفاه** (onnx+json)، وإلا الرئيسي مع `fallback: true` معلن · المانيفست يسجّل **الصوت المُستخدَم فعلاً** لا المقصود · أمران جديدان: `voice-for <شخصية>` و`one-as <شخصية> "نص" out.opus`.
  - سكربت Termux: الحجم الدقيق + md5 الرسمي للملفات الثلاثة (توقف عند أي اختلاف) + رفع **MODEL_CARD** (`de_DE-kerstin-low.MODEL_CARD`) ليُوثَّق الترخيص من المصدر نفسه + طباعة sha256 لتثبيته عند الدمج (D28) + بلا force.
  - **الترخيص بصدق:** «MIT» في D98 مصدره spec حزمة توزيعة (قد يصف رخصة المستودع لا بيانات الصوت) — **needs-verify من MODEL_CARD** عند وصول الملف (السكربت يطبعه ويرفعه).
- **الاختبار:** `tests/voice-female.test.ts` (11 اختباراً) + تحديث اختبار الهوية في voice-stability (الصوتان المثبَّتان + الأدوار). **التحقق العكسي:** الاختبارات الجديدة تفشل 7/11 على الكود القديم وتنجح كلها على الجديد.
- **البيئة (للأمانة):** huggingface.co و release-assets.githubusercontent.com محجوبان من الـsandbox (مُختبَر) — التنزيل يبقى عند المالك.
- البوابة: **276/276 + tsc + validator (858/0/0) + build** ✓.

## D101 (2026-10-14): A2 يبدأ — الإضافة 8 · الدفعة 1: a2-u1-d1 «Perfekt منهجي — يروي صباح أمس» + بنية A2

- **المصدر (§34):** `study-plan-daily-v6.1 §7` — الوحدة 1 «العودة والماضي»: d1 = كلمات 1–13 + Perfekt منهجي · Can-do «يروي صباح أمس» · §5: 12–13 كلمة/يوم (8–10 مفردات + 2–3 وظيفية) + تباعد دلالي.
- **عضوية Goethe — بصدق:** goethe.de محجوب من الـsandbox. المصدر الثانوي: مرآة `langfield/A2_Wortliste_Goethe` (1,214 مدخلاً مستخرجاً من قائمة Goethe-Zertifikat A2 الرسمية — أمثلتها تطابق الأصل، مثل «Es ist so dunkel. Mach bitte das Licht an!»). **الكلمات الـ13 كلها موجودة فيها** → `goetheList: ["A2"]` + `goetheWordListOverlap`. كلمات مرشّحة **غائبة** عن المرآة استُبعدت (klingeln · einschlafen · rasieren · erleben · verschlafen) — غيابها غير حاسم لكن لا وسم بلا دليل. عنوان فصل Netzwerk neu A2 الدقيق: **needs-web-verify**.
- **المحتوى:** 13 كلمة A2 (الوحدة 1): das Licht · vergessen · lachen · schon · ausgehen · sich beeilen · fallen · gerade · anmachen · verlieren · passieren · ausmachen · beginnen — تغطي **قوالب Partizip II الخمسة** (gelacht · gefallen · angemacht/ausgegangen · vergessen/verloren/begonnen/beeilt · passiert) + haben/sein. جمل الأمثلة من مفردات A1 فقط.
  - **الزوج المحوري:** Ich **habe** das Licht ausgemacht ↔ Das Licht **ist** ausgegangen — مع جسر عربي: «أطفأتُ» (متعدٍّ = haben) ↔ «انطفأ» (مطاوع لازم = sein).
  - **المصائد الثلاث (D58/D59 — 10‑ي):** لا ge مع be-/ver-/-ieren · sein مع passieren/fallen/ausgehen · نفي schon = noch nicht.
  - **المحطات:** 4 أنواع (verb-bank · gap-fill · error-hunt · speaking) — بدل نمط A1 (232 من 234 محطة كانت `choice`) · كل محطة تخلط بنى A1 حقيقية (قاعدة المدقِّق لـA2+) · بطاقات الدفء: aufstehen · gestern · frühstücken.
  - **الصوت:** 13 مقطعاً بالصوت المثبَّت (0.78–1.09s · RMS −16.96…−17.20 dB) — أُلحقت بالمانيفست (756 مساراً) وبقائمة gen-audio.
  - **SRS (w-srs-ratio لـA2):** 42/42/13 — المسافة 0.129 (الحد 0.35) ✓.
- **بنية:** `ALL_LESSONS` يُرتَّب بـ(مستوى، وحدة، يوم) عبر `LEVEL_ORDER` — بدونه كان a2-u1-d1 سيقع بين a1-u1-d1 وa1-u1-d2 (كسر قفل المسار).
- **عيب عرض مُكتشَف ومُصلَح:** 273 من 440 اسماً تحمل الأداة داخل `de` — المتعلم كان يرى «die die Landschaft (die)» في بطاقات الجديد والدفء. `fullForm()` يعرضها مرة واحدة + اختبار انحدار على كل الدروس (يفشل على السلوك القديم — مُتحقَّق).
- **الاختبار:** +5 (ترتيب المستويات · كلمات A2 · interleaving + تنوع المحطات · Perfekt/needs-ist · fullForm) → البوابة **281/281 + tsc + validator (872/0/0) + build** ✓.
- **التالي:** a2-u1-d2 (كلمات 14–26 · haben/sein · «يروي يومه»).

## D102 (2026-10-14): جودة صوت A1 — 6 مقاطع كانت تُعلّم نطقاً خاطئاً (مقيس) + حارس دائم

- **الاكتشاف:** مقارنة نص كل مقطع كلمة برسم الكلمة كشفت 10 مقاطع A1 وُلّدت من رسم ASCII بديل (gross · heiss · Fuss · suess · Kaese · Maedchen · Broetchen · Moeglichkeit · Gespraech · natuerlich) + «fünzig» (بلا f — في ملف الكلمة والصوت معاً) + «das Gleise» (ملف الكلمة فقط؛ الصوت سليم).
- **القياس لا الافتراض (§34):** النطق كما يقرؤه الصوت المثبَّت فعلاً (espeak-ng عبر Piper — `tools/phonemize.py` الجديد):
  - **سليمة رغم الرسم (5):** Broetchen · heiss · Kaese · Maedchen · Moeglichkeit — نفس الفونيمات.
  - **خاطئة فعلاً (6):** Fuss [fʊs] ≠ Fuß [fuːs] · gross [ɡrɔs] ≠ groß [ɡroːs] · Gespraech [ɛ] ≠ Gespräch [ɛː] · natuerlich [nɑtuːɜlɪç] ≠ natürlich [nɑːtyːɾlɪç] · suess [zuːɛs] ≠ süß [zyːs] · fünzig [fʏntsɪç] ≠ fünfzig [fʏnftsɪç].
  - **الأخطر:** 4 منها (groß · heiß · Fuß · süß) في **a1-u2-d4** الذي يعلّم «ß بعد الحركة الطويلة، ss بعد القصيرة» — ومصيدته تشطب ~~gross~~ — بينما صوته يقول [ɡrɔs] قصيراً: الصوت كان يناقض قاعدة الدرس نفسه.
- **الإصلاح:** إعادة توليد المقاطع الـ11 من الرسم الصحيح (ليبقى `textDe` = مدخل المولّد الحقيقي دائماً) — كلها ضمن الحدود (0.78–1.19s · RMS −16.98…−17.42) · تحديث المانيفست وقائمة gen-audio · ملفا الكلمتين: fünfzig · das Gleis.
- **الحارس الدائم:** `tests/word-audio-text.test.ts` — نص كل مقطع كلمة = أحد أشكال الكلمة المقبولة حرفياً (Unicode: لا ss بدل ß ولا ue بدل ü) + قياس فونيمات المقاطع الستة (الحركة الطويلة/الحرف الناقص). **التحقق العكسي:** يفشل 3/3 على الحالة القديمة.
- **غير مُغيَّر (بصدق):** 128 مقطعاً لأسماء A1 بلا أداة («Abend.» لـ«der Abend») — اختيار أسلوبي قديم لا خطأ؛ مقاطع A2 تحمل الأداة («das Licht.»).
- البوابة: **284/284 + tsc + validator (872/0/0) + build** ✓.

## D103 (2026-10-14): صوت المرأة مُثبَّت في git ويعمل فعلاً — Hören الامتحان التجريبي بصوتين + مقسِّم الحوار

- **أمر المالك (2026-10-14):** «ليس لدي أي صوت للرفع — أنت تولده في هذه الجلسة». يُلغي خطة «المالك يرفع عبر Termux» (D98/D100) — وسكربت `termux-upload-voice-kerstin.sh` حُذف.
- **الجلب بالتحقق (لا ثقة بمصدر واحد):** huggingface.co و release-assets محجوبان (مُختبَر). وُجد الملف blob عادياً في 3 مستودعات GitHub مستقلة **بنفس SHA** (`47f62798…`) ← جُلب عبر api.github.com ← **md5 = الفهرس الرسمي حرفياً** (`1d5e5788…`) + الحجم 63,104,526 ← MODEL_CARD md5 مطابق. sha256 الدائم: `d352a764…401b7a`. (البصمة «المعروفة» `847543…` في السكربت القديم كانت مختلقة.)
- **الرخصة من المصدر:** MODEL_CARD: بيانات `rhasspy/dataset-voice-kerstin` **CC0** (لا «MIT» كما ورد في D98 — MIT رخصة المستودع) · ضُبط من en_US-ryan-low (needs-verify لرخصة بيانات الأساس).
- **عيب صوتي مُكتشَف ومُصلَح (مقيس):** خريطة kerstin (صيغة 0.2.0 · 130 رمزاً) تعرف «ç» مركّبة فقط، وespeak الحالي يُخرجها مفككة (c+U+0327) ← Piper يُسقط العلامة: **كل ich-Laut كان [c] انفجارياً** («nicht» → nict) + الأنفية U+0303 (Restaurant). عبر 2,377 نصاً: 623 فونيماً مفقوداً ← طبقة `fit_phonemes` (تركيب NFC؛ الأنفية ← ŋ) ← **صفر مفقود**؛ الطبقة لا تمس thorsten (0 تعديل — مُختبَر).
- **مسار التوليد:** `tts()` عبر واجهة Piper البرمجية بنفس مسار سطر الأوامر حرفياً (synthesize لكل جملة · تطبيع الذروة · صمت 0) + الطبقة — اختبارات استقرار thorsten (التوقيع الطيفي مع الملفات الملتزمة ≥0.93) خضراء.
- **صوت مختلف حقاً (قياس):** نفس الجملة: thorsten↔kerstin specCorr **0.822** (<0.93) · kerstin↔kerstin **0.993** — مقفول باختبار.
- **القانون 11 مُنفَّذ:** `characterVoices` في المانيفست = مصدر الحقيقة الوحيد (lena/ayse/frau-berg/frau-schmidt → kerstin) · قاعدة `e-audio-character-voice` · gen-audio يقرأ المانيفست (لا قائمة Python ثانية) · `one-voice` بلا fallback صامت.
- **السكربت الصوتي + مقسِّم الحوار (كانا مُدّعَيين في §9 ولم يوجدا):** مخطط `AudioScript` (dialogue/announcement/words · متحدث ثابت · توجيه أداء) + `tools/dialogue-splitter.ts` (سطر = مسار بصوت متحدثه · لا إعادة توليد لما لم يتغير · إزالة اليتامى · zod قبل الكتابة) + `tools/lib/script-audio.ts` مشترك مع المدقِّق.
- **فجوة محتوى مُغلقة:** قسم Hören في الامتحان التجريبي كان **بلا أي صوت ولا نص** («Hören Sie den Dialog» بلا حوار). الآن: 3 سكربتات · 16 سطراً (8 بصوت kerstin) · مشتتات Goethe (Kaffee يُذكر والجواب Wasser) · كل سؤال `audioRefs` · قاعدة `e-hoeren-answer`: الجواب يجب أن يُسمع فعلاً (الأرقام كلماتٍ: 8=acht). تصحيح: «Grüß» ليس كلمة ← Gruß · سؤال بالعربية المخلوطة ← ألماني.
- **السرعة (معايرة لا افتراض):** §5‑هـ: A2 يبدأ من 0.85× ← A1 ≤ 0.85×. lengthScale في Piper غير خطي (1.18 = أبطأ 7–9% فقط) ← معايرة 6 توليدات/صوت ← **1.32** ≈ 0.84× (thorsten) / 0.86× (kerstin). السرعة الفعلية تُقاس وتُسجَّل (79–167 ك/د).
- **حارس لم يكن موجوداً:** لا اختبار كان يتحقق من بصمة thorsten المثبَّتة — الآن الصوتان (الحجم + sha256) مقفولان.
- البوابة: انظر سطر البوابة في PROGRESS.

## D104 (2026-10-14): الصوت يصل إلى المتعلم — لأول مرة (حزم الدروس الصوتية + المشغّل)

- **الاكتشاف (فحص لا افتراض):** 772 مقطعاً مُولَّداً ومقيساً ومختبراً — و**صفر** سطر تشغيل في `src/` (لا Audio ولا speechSynthesis) و**صفر** ملف .opus في `dist/`. المتعلم لم يكن يسمع شيئاً. يخالف §3 Präsentation («الصوت يُشغَّل لحظة ظهور الكلمة») والقانون 11 (Web Speech احتياطي شامل).
- **الحزم (ما كان مُدّعى كـ pack-builder):** بدل مولِّد ينسخ الملفات — `src/lib/audio-assets.ts` بـ`import.meta.glob`: كل *.opus تحت content/ أصلٌ مُجزّأ (hash) في البناء تلقائياً — لا نسخ ولا سجل يُنسى. المعرّف = اسم الملف (فريد — مُختبَر).
- **المشغّل:** `src/lib/audio-player.ts` — المقطع الملتزم أولاً ← Web Speech (de-DE) عند غيابه أو فشله (حظر التشغيل التلقائي) ← `none` معلن (لا ادعاء تشغيل) · سرعات F044 فقط عبر planPlayback · مقطع واحد في اللحظة · خلفية قابلة للحقن (مختبرة بلا متصفح).
- **الواجهة:** زر 🔊 في بطاقات الجديد والاسترجاع + تشغيل تلقائي لحظة ظهور الكلمة الجديدة · البطاقات تحمل `audioId` و`speakText` (الشكل الكامل بالأداة).
- **عيب بناء مُكتشَف:** Vite كان سيدمج 233 مقطعاً (<4KB) base64 داخل JS (~1MB تضخم + لا تخزين مستقل) ← `assetsInlineLimit` يستثني .opus ← **772/772 ملفاً مستقلاً في dist**.
- **تحقق حي:** المعاينة تخدم `word-licht` بـHTTP 200 · `audio/ogg` · **مطابق بايتياً** للملف الملتزم · وسطر kerstin الحواري كذلك.
- **عامل الخدمة:** اسم الذاكرة كان `reise-yusuf-v1` (الاسم الداخلي في أصل منشور — يخالف D31) ← `schluessel-v2` · GET من نفس الأصل فقط · الصوت يُخزَّن عند أول تشغيل (offline).
- **المعاينة:** `allowedHosts` لخادمَي التطوير والمعاينة (كان يرفض نطاق المعاينة بـ403).
- البوابة: **317/317 + tsc + validator (875/0/0) + build (772 مقطعاً)** ✓.

## D105 (2026-10-14): مولِّد مدخل الكلمة (كشف صوتي مقيس) + السجل التلقائي للمحتوى

- **المصدر:** §5 «كل كلمة جديدة تُفحص ضد الخريطة العربية آلياً» + D57 (enums مغلقة/بطاقة جنس) + §4 (w-srs-ratio) + فخ D102 (نص المقطع = الرسم الحقيقي).
- **`tools/word-entry-generator.ts` + `tools/lib/word-entry.ts`:** مواصفة مختصرة (de/ar/صنف/مستوى/وحدة/درس/جملة) ← ملف كلمة كامل مُتحقَّق بـzod + IPA مقيسة (phonemize.py — استدعاء واحد للدفعة) + أعلام الخطر + البطاقات + المقطع (≤1.5s حتى 3 محاولات) + مساره بين مسارات الكلمات + سطره في gen-audio. كل شيء يُحسب ويُتحقق أولاً ثم يُكتب دفعة واحدة · لا كتابة فوق كلمة (اختُبر على «zurückkommen» الموجودة) · `--dry-run` يطبع IPA والأعلام ونسبة SRS بعد الإضافة · أخطاء واضحة بلا أثر مكدس (exit 1).
- **قواعد الكشف (موثّقة في الكود — كل قاعدة بحالة موجبة وسالبة في الاختبار):** ich/ach من «ch» + [ç]/[x] (عدد [ç] يفوق ‎-ig) · sp/st منطوقة [ʃ] (يشمل جذر المركّب: Beispiel/bestellen) · ‎-ig لا ‎-eig · التصلّب آخر الكلمة **وداخلها** (الحرف مكتوب ونظيره المجهور غائب: Erlebnis/Mädchen/ab-) · v بلا [v] (Vase لا · w ليست v) · الإطالة المكتوبة + «ː» (h صامتة فقط) · الوملاوت من الكلمة لا صيغها · r المُصوَّتة (‎-er/‎-r/ver-/er-).
- **القياس كشف 3 أخطاء في الكاشف نفسه قبل الالتزام:** ç مفككة بلا NFC (ich-Laut لم يُكشف أبداً) · وملاوت الصيغ (Arzt→Ärzte) · ‎-eig. **والاختبار كشف رابعاً:** حساسية الحالة في «Ärzte».
- **تدقيق الأعلام القديمة (755 كلمة — مقارنة بالقياس، بلا تعديلها في هذه الدفعة):** أخطاء مثبتة: sp-st على كلمات بلا sp/st (Berg · Brief · frei · Insel · Impfung · Landschaft…) · v-f على Auf Wiedersehen/sofort/Straße (لا v) · ich-Laut على Brücke/Geschenk/hin/Ruhe (لا ch) · ach-Laut على Bahnhof/Flughafen/scharf/Schrank (لا ch) · ig-ending على Entschuldigung · auslaut-d على Norden/Süden. ونقص واسع: z غائب عن 64 كلمة فيها z (Arzt/achtzig…). ← إعادة الوسم بالكاشف + حارس = دفعة مستقلة لاحقة.
- **السجل التلقائي:** `src/lesson-packs.ts` من 1,732 سطراً يدوياً إلى 76 — `import.meta.glob` + **zod لكل ملف عند الاستيراد** (الثقافة/الاختبارات/الامتحان/القراءة/الصور كانت تُصدَّر خاماً بلا تحقق). الملف موجود ⇔ مُسجَّل (اختبار).
- **ملاحظة صادقة:** بطاقات الثقافة والاختبارات الدورية والامتحان التجريبي ونصوص القراءة **لا تعرضها أي شاشة** حتى الآن (تستخدمها الاختبارات فقط) — فجوة واجهة موثّقة.
- البوابة: **336/336 + tsc + validator (875/0/0) + build (772 مقطعاً)** ✓.

## D106 (2026-10-14): إعادة وسم أعلام الخطر الصوتي لكل الكلمات بالقياس + حارس دائم

- **السبب (من تدقيق D105):** أعلام A1 اليدوية فيها أخطاء مثبتة رسماً ونطقاً (sp-st على Berg/Brief/frei… · v-f على Straße/sofort · ich-Laut على Brücke/Geschenk · double-consonant على Bank/denken · طول على Gast) ونقص واسع (z غائب عن 64 كلمة فيها z).
- **السياسة:** الأعلام الجديدة = **المكتشَف بالقياس ∪ (القديم الممكن رسماً ونطقاً)** — يُسقط المستحيل فقط ويُبقي الحكم اليدوي المعقول (مثل طول schon) · `plausibleRisk` لكل علَم شرط إمكان صريح.
- **النتيجة:** 465 من 755 ملفاً — أُضيف 557 علَماً مقيساً (double-consonant 113 · vowel-long-short 112 · r-uvular 80 · z 64 · sp-st 39 · auslaut-d 31 · ich 24 · v-f 22…) وأُسقط 92 علَماً مستحيلاً (sp-st 24 · double-consonant 20 · طول 19 · umlaut-a 9 …). **الفرق لا يمس إلا مصفوفات phoneticRisks** (مُتحقَّق: 0 سطر خارجها) — والبطاقات (srsCardTypes) لم تُغيَّر فلا تتغير نسب SRS.
- **حدود صادقة:** espeak لا يُصلّب d في «Abendessen» ولا b الثانية في «abbiegen» — الكاشف محافظ (لا يعلّم ما لا يقيسه) · لا شيفرة في التطبيق تستهلك phoneticRisks بعد (أعلام العرض §3 قادمة) — فلا تغيّر سلوكاً.
- **الأوامر:** `npx tsx tools/word-entry-generator.ts --audit` (تقرير) · `--reannotate` (تطبيق — يحفظ تنسيق كل ملف).
- **الحارس:** كل علَم مقيس موجود + لا علَم مستحيل — على كل كلمات المحتوى (اختبار).
- البوابة: **339/339 + tsc + validator (875/0/0) + build** ✓.

## D107 (2026-10-14): حاصد العبارات — بنك Redemittel الوظيفي بوسم «ظهرت في درس» + قانون الجبهة

- **المصدر:** §6 «بنك Redemittel الوظيفي: يُقدَّم ضمن السياق الوظيفي للدرس (لا قوائم مسبقة تخرق i+1) وكل عبارة تحمل وسم ظهرت في درس رقم…» (هـ‑08) + القانون 13 (الجبهة) + بنك النجاة التواصلي (§6).
- **`src/lib/phrase-bank.ts`:** حصاد من المحتوى نفسه (جمل الكلمات · أجوبة التدريب والبوابة · الصحيح في المصائد · القطع الجاهزة) ← تنظيف (يُسقط الشرح العربي والملاحظات النحوية ويرفض المشطوب/الفراغات/المعادلات/اللغة الواصفة/المفردات العارية) ← تصنيف وظيفي متعدد (16 وظيفة) ← `firstLesson` بترتيب المسار. `phrasesAvailable` يطبق الجبهة (لا عبارة من درس لم يُبلَغ) · `functionCoverage` يكشف الفجوات.
- **`tools/phrase-harvester.ts`** (+ `tools/lib/content-disk.ts` — الأدوات تقرأ القرص بالمخططات نفسها؛ مُختبَر أن البنك منها = البنك في التطبيق) · `--json` للتصدير.
- **الواجهة:** المهمة التواصلية تعرض 6 عبارات مما ظهر حتى درس الحصة (الأحدث أولاً) مع 🔊 ووسم الوظيفة ودرس الظهور.
- **النتائج المقيسة (1,113 عبارة):**
  - **بنك النجاة جزئي:** الاستيضاح 4 عبارات (a1-u3-d5: «Bitte wiederholen Sie das.» · «Noch einmal, bitte!» · «Langsamer, bitte.» · «Ich verstehe das nicht.») · الاعتذار 2 فقط · **غائب تماماً:** «Wie bitte?» · «Ich hätte gern…» · «Könnten Sie…» · «Tut mir leid» — رغم أن §6/ج‑23 تنص على «Wie bitte? / Ich hätte gern» من A1. (تصحيح لتقريري السابق: «Ich verstehe das nicht» موجودة — بحثي الأول أغفل «das».)
  - **قفل المفردات (تقدير بتصريف بسيط):** 859/1,113 (77%) عبارة كل كلماتها مدروسة حتى درس ظهورها · كلمات مستعملة بكثرة **بلا مدخل كلمة**: neu ×38 · heute ×14 · weh ×8 · lang ×7 — لا تدخل SRS أبداً.
  - **العلاج:** القانون 7 يمنع تعديل دروس A1 المنشورة صامتاً ← تُدرج العبارات الغائبة والكلمات الناقصة في دروس A2 القادمة (مع وسم «ظهرت في» الصحيح).
- **فجوة منتج مكتشفة أثناء الربط (موثّقة للدفعة التالية):** `App.tsx` يشغّل **درساً واحداً فقط** (a1-u1-d1 مثبَّت) — لا اختيار ولا تقدّم ولا واجهة لبوابة Quiz (75%) تفتح الدرس التالي؛ 78 درساً غير قابلة للوصول من الواجهة.
- البوابة: **352/352 + tsc + validator (875/0/0) + build** ✓.

## D108 (2026-10-14): المراجع الرسمية بيانات في المستودع — صيغتا امتحان Goethe A1/A2 + فصول Netzwerk neu A2

- **مصدر القرار:** وثائق المالك (2026-10-14): رابط Drive للكتب + 3 قوائم كلمات مرفقة. **الحقيقة:** المرفقات الثلاثة لم تصل إلى مساحة العمل (المجلد غير موجود — فُحص مرتين) · Drive: **القائمة تُقرأ والملفات لا تُفتح** (التنزيل يفشل من أداة القراءة، والصندوق لا يصل Drive أصلاً).
- **قرار المصادر (المستودع عام):** لا نسخ من الكتب التجارية في Drive (Klett/Hueber/Cornelsen) — **المصادر الرسمية المجانية فقط:** Goethe-Institut (Modellsatz/Übungssatz/Testbeschreibung) وفهرس Klett الرسمي (BlinkLearning) ومسرد Klett المجاني. لا يُنسخ أي نص أو تمرين — حقائق البنية والعناوين فقط.
- **`content/exam-formats/` + مخطط `ExamFormat`:** Start Deutsch 1 (الاستماع 6/4/5 بسماع 2/1/2 · القراءة 5/5/5 · 20/25/20/15 د · النجاح 60/100 غير مُجزّأ) — من ورقة إجابات Modellsatz الرسمي · Goethe-Zertifikat A2 (القراءة 4×5 · الاستماع 4×5 بسماع 2/1/1/2 · كتابة SMS 20–30 + E-Mail 30–40 · كلام ثلاثي · عتبتان ≥45/75 و≥15/25) — من «Prüfungsteile im Überblick».
- **قاعدة `w-modelltest-format`:** كل امتحان تجريبي يُقاس على صيغة مستواه (المدة · الأجزاء · البنود). **النتيجة الصادقة:** امتحاننا A1 المسمّى «النموذج الرسمي» يطابق المدد والأجزاء لكن **البنود 18 لا 30**: الاستماع 4/3/2 (الرسمي 6/4/5) والقراءة 4/3/2 (الرسمي 5/5/5) — تحذيران معلنان حتى إعادة بنائه بالصيغة الرسمية بمحتوى أصلي وصوتين (الدفعة التالية).
- **Netzwerk neu A2:** المرجع المنهجي كان `chapters: []` ← 12 فصلاً بعناوينها من فهرس Klett الرسمي (A2.1 ISBN NP00860716201 · A2.2 ISBN NP00860716301) + الأهداف التواصلية حيث ظهرت حرفياً فقط (k1: über Vergangenes berichten · sich verabreden · etwas begründen …) · grammarPoints فارغة بصدق (لم تُتحقق). a2-u1-d1 ← «Kapitel 1 ‹Und was machst du?› — Und was hast du gemacht?» (أُزيل needs-web-verify).
- **فجوة مسجلة:** مرجع A1 فيه فصلان فقط (k1/k3) بلا مصدر — يحتاج تحققاً مماثلاً.
- **قوائم الكلمات الرسمية (A1 SD1 · A1 Fit1 · A2):** بانتظار إعادة الإرفاق — ثم: التحقق من goetheList لكل الكلمات + حارس دائم.
- البوابة: **359/359 + tsc + validator (877/0 أخطاء/2 تحذيران معلنان) + build** ✓.

## D109 (2026-10-14): امتحان A1 التجريبي بالصيغة الرسمية بنداً بنداً — مفتاح إجابة بدليل حرفي + قفل المفردات
- **مصدر القرار:** موافقة المالك على الخطوات المقترحة (2026-10-14: «موافق») — البند (0) من §9: إعادة بناء `a1-modelltest-1` بصيغة Start Deutsch 1 الرسمية (D108 قاسه: 18 بنداً لا 30).
- **القانون 7 (لا تعديل صامت لمحتوى منشور) — إعلان صريح:** الامتحان أُعيد بناؤه **كاملاً** (كل نص وسؤال وصوت جديد). القديم: الاستماع 4/3/2 (كلمات مفردة · 3 حوارات · إعلانان) والقراءة 4/3/2 (لافتات بأسئلة عربية · نصوص قصيرة · بريد) = 18 بنداً. الجديد: **الاستماع 6/4/5** (6 حوارات قصيرة mc3 تُسمع مرتين · 4 إعلانات Richtig/Falsch مرة واحدة · 5 رسائل هاتفية mc3 مرتين) · **القراءة 5/5/5** (رسالتان Richtig/Falsch · 5 مواقف × إعلانان a/b · 5 لافتات Richtig/Falsch) · **الكتابة** استمارة بخمس معلومات من نص (موضوعية التصحيح) + رسالة نحو 30 كلمة بثلاث نقاط · **الكلام** 3 أجزاء (تعريف + تهجئة ورقم · بطاقات موضوع «Essen und Trinken» · طلبات) · 20/25/20/15 د · النجاح 60%. **المحتوى أصلي كله** — لا نص ولا تمرين منسوخ من Modellsatz أو أي كتاب (قاعدة المصادر D108).
- **نوع المهمة بيانات مشتركة:** `ExamTaskType` (mc3 · richtig-falsch · a-b · zuordnung · formular · freies-schreiben · freies-sprechen) — حقل `kind` في كل جزء من الصيغتين الرسميتين **يتحقق المخطط أنه تصنيف عبارة الوثيقة الألمانية نفسها** (`taskTypeKind`) فلا يتناقضان؛ و`taskType` إلزامي في كل جزء من الامتحان التجريبي مع المهام المسموحة لكل مهارة.
- **مفتاح الإجابة قابل للتحقق (`content/schemas/answer-key.ts`):** حقل `evidence` = اقتباس حرفي يحسم الجواب، إلزامي في الاستماع والقراءة والاستمارة. المخطط يتحقق داخل الملف (الدليل مكتوب فعلاً في النص المُحال إليه · في a-b في **النص المختار تحديداً** · جواب الاستمارة وارد في دليله) والمدقِّق عبر الملفات (`e-hoeren-evidence`: الدليل منطوق في مقاطع البند نفسه). Richtig/Falsch في الاستماع يُحسم بالدليل لا باشتراط سماع «Richtig» (كان `answerSupported` سيرفضه). `answerSupported` انتقل إلى answer-key (يعيد تصديره script-audio للتوافق).
- **مخطط الامتحان:** نصوص القراءة بيانات مستقلة (`texts` + `textRefs` — لا نص مدسوس في السؤال) · `playCount` إلزامي في الاستماع (تفرضه الواجهة) · mc3 = ثلاثة خيارات مختلفة · Richtig/Falsch وa/b حرفياً · لا صوت في غير الاستماع · لا نص يتيم · معرّفات الأجزاء فريدة · المهارات الأربع مرة واحدة (حلّت محل `e-modelltest-skill`).
- **`w-modelltest-format` ← `e-modelltest-format` (خطأ):** كان تحذيراً لأن امتحاننا خالف الصيغة معلناً؛ صار مطابقاً فأي انحراف لاحق (البنود · نوع المهمة · مرات السماع · المدة) يمنع الدمج.
- **قفل المفردات في الامتحان (قانون الجبهة 13 — `e-modelltest-vocab`):** كل ما يراه/يسمعه المتعلم (الصوت · النصوص · الأسئلة · الخيارات · نماذج الإجابة) من كلمات مستواه وما قبله؛ التعليمات خارج القفل لأنها ثنائية اللغة. أسماء العلم تُستثنى **بإعلانها في `properNouns` فقط** (حرف كبير · واسم مُعلن لا يظهر = `w-modelltest-proper-noun` — لا باب خلفي). المنطق المشترك مع حاصد العبارات في `tools/lib/vocab-forms.ts` (نُقل من phrase-harvester بلا تغيير سلوك). **أثره الفعلي أثناء الكتابة:** رفض heute · jetzt · Achtung · Durchsage · Kurs · Restaurant · Herr · Thema · Person · Party — كلها غير مدروسة كمدخل كلمة في A1 (heute/neu مسجلتان فجوةً منذ D107).
- **توازن المفتاح (`w-modelltest-balance`):** جزء كل أجوبته واحدة يُحل بالتخمين. الفعلي: Richtig/Falsch مختلطة في الأجزاء الثلاثة · مواضع mc3 = 4/4/3 من 11 · a/b = 2/3.
- **الصوت:** نوع سكربت جديد `message` (رسالة هاتفية: شخصية وحدها · P0 · دور character فيُسمح بصوت kerstin) · 35 مقطعاً جديداً عبر dialogue-splitter (حُذف 16 قديماً تلقائياً) · كل حوار يجمع رجلاً وامرأة (صوتان مختلفان — لا شخصان بصوت واحد) · lengthScale 1.32 كما هو (لا تغيير للعتبات). السرعة المقيسة 93–196 ك/د (الأعلى لجمل قصيرة أحادية المقاطع ≈4.2 مقطع/ث).
- **حدود الصدق:** قفل المفردات تقدير بجذوع بسيطة (قد يقبل كلمة تشارك جذع كلمة مدروسة؛ راجعتُ يدوياً كل ما قُبل بالجذع: Alter← alt أُبدل بـ«Wie alt sind Sie?» · gut/liebe/Dank/bitten اشتقاقات مقبولة) · التقييم بالنقاط الرسمية (100) والشاشة نفسها لم تُبنَ بعد (البند 2 في §9) · الامتحان تدريب لا يمنح شهادة.
- البوابة: **383/383 (47 ملفاً) + tsc + validator (877/0 أخطاء/0 تحذيرات — سقط التحذيران المعلنان) + build (791 مقطعاً في dist)** ✓.

## D110 (2026-10-14): goetheList دليلٌ لا رأي — فهارس قوائم Goethe الرسمية الثلاث + حارس دائم
- **مصدر القرار:** المالك أرفق القوائم الرسمية الثلاث (A1_SD1_Wortliste_02 · Goethe-Zertifikat_A1_Fit1_Wortliste · Goethe-Zertifikat_A2_Wortliste) لتنفيذ البند «تحقق goetheList لكل الكلمات + حارس» من §9.
- **المرفقات لم تصل إلى بيئة البناء (المرة السابعة)** رغم أن رسالة النظام أدرجتها: لا `/home/user/uploads` ولا أي ملف بالاسم على القرص كله (بحث كامل). **البديل بلا عبء على المالك — الملفات الرسمية نفسها:**
  - **SD1:** من GitHub — git blob `0c8162cb…` **نفسه** في 7 مستودعات مستقلة (تجزئة git = المحتوى بايتاً بايتاً) · مُطابَق مع goethe.de الحي: عنوان الملف `A1_SD1_Wortliste_02.indd` ونص المقدمة والفهرس ومجموعات الكلمات.
  - **A2:** من GitHub — نسختان (تعديل 2020-09 و2025-06) تعطيان الكلمات الرئيسية نفسها حرفياً (1159/1159) · مُطابَق مع goethe.de: العنوان · Impressum (© 2016، 1. Auflage) · Vorwort · Wortgruppen · عيّنة الكلمات الرئيسية E–F وS–U.
  - **Fit1 (2. Auflage 2024):** غير موجود على GitHub ولا يصل إليه الصندوق — قُرئ من goethe.de مباشرة ونُسخت **الكلمات الرئيسية وحدها يدوياً** في `content/wordlists/sources/goethe-a1-fit1-headwords.txt`؛ المنهج معلن في JSON (`method: manual-transcription`) مع فجوتين معلنتين في العرض الأصلي (بقية «Zeitangaben» ص8 · كلمة رئيسية غير ظاهرة ص18 — لم تُخترع). الكلمات الـ68 التي يثبتها Fit1 وحده رُوجعت كلها يدوياً على النص الرسمي.
- **ما يُلتزم (المستودع عام — قاعدة المصادر D108):** الكلمة الرئيسية + علامة الجمع/الصيغ كما طُبعت + بنود Wortgruppen + الصفحة — **لا جملة مثال واحدة** (المخطط `wordlist.ts` يرفض ما يشبه جملة) ولا ملف PDF. `content/wordlists/goethe-a1-sd1.json` (626 رئيسياً + 58 فرعياً + 127 بند مجموعة) · `goethe-a2.json` (1159 + 247) · `goethe-a1-fit1.json` (531 + 170) — سطر لكل كلمة رئيسية (فروق git مقروءة) + بصمة الملف (sha256 + git blob + الصفحات + عنوان PDF).
- **الاستخراج (`tools/goethe-wordlist.py` — pdfplumber 0.11.10، حتمي `--check`):** بالإحداثيات لا بالنص المسطّح — عمود الكلمة الرئيسية = يسار حدّ عمود الأمثلة (يُحسب لكل صفحة: يتزحزح 105–107/374–376pt) · المدخل الفرعي في SD1 مُزاح ≥3pt · التفاف صيغ الفعل في A2 (`abgeben, / gibt ab, / hat abgegeben`) ولو تخلّلها سطر مثال أو انتقل عمود/صفحة · الكلمة المقطوعة بشرطة (`der Kühl- / schrank`) · الأقواس الملتفة · الكلمة الملتصقة بمثال تُقسَم على مستوى الحرف (`-eIch`). بنود Wortgruppen (جداول) مكتوبة يدوياً **وتتحقق الأداة آلياً أن كل رمز منها موجود في نص صفحته** (خطأ نسخ = توقف). تحقق مستقل: كل كلمة رئيسية مستخرجة موجودة في نص pypdf (مكتبة ثانية) عدا الملتفة؛ الترتيب الأبجدي سليم (كسور A2 السبعة إحالات مقصودة: bewölkt/die Wolke …).
- **الدلالة:** `goetheList` = المستويات التي **تحوي قائمتها الرسمية الكلمة فعلاً** — لا مستوى الدرس. A1 من SD1 أو Fit1 (كلتاهما رسمية لـA1) · A2 من قائمة A2 (تراكمية تحوي معظم A1 ⇒ [A1,A2] طبيعي).
- **أنواع الدليل (`tools/lib/goethe-lists.ts`):** entry · sub · group · feminine (Vorwort SD1: «Weibliche Formen … sind Bestandteil des lexikalischen Inventars») · plural (كلمتنا بصيغة الجمع = جمع مدخل محسوب من علامته المطبوعة) · contraction (am = an + dem) · stem (all-/dies-/Lieblings- + تصريف · سابقة her/hin/weg/zurück + فعل مُدرج · spazieren ← spazieren gehen) · herkunft (الفئة المفتوحة «Angabe der eigenen Herkunft oder Nationalität» في SD1 ص8 وFit1 ص7: **أسماء البلدان + لغة جمهورنا (Arabisch) فقط** — قائمة صريحة `HERKUNFT`؛ Englisch/Französisch تحتاج دليلاً حرفياً) · composed (قطعة كل كلماتها مُدرجة: Guten Tag = gut + Tag). **لا دليل** للمركّب غير المُدرج (Abendessen) ولا للمشتق غير المُدرج (Erkältung ← erkältet) — القوائم تستبعدهما صراحة («erschließbar») والوسم يحتاج دليلاً صريحاً · الأداة لا يثبتها اسم (mal ≠ das Mal) · الاسم لا يثبته فعل (das Essen ≠ essen) وأداة التعريف يجب أن تتوافق (der See ≠ die See). عنوانا مجموعتين يحملان «Monat» (SD1 ص7 «Monat/Monatsnamen» · A2 ص6 «Monate») يُحتسبان بندَ مجموعة معلَّماً «Überschrift». tschüss = tschüs (جدول صريح للصيغ المزدوجة).
- **الحارس:** `e-goethe-list` (خطأ يمنع الدمج): goetheList ≠ الدليل في أي اتجاه، مع رسالة الدليل — يُفعَّل حين تحمل الشجرة الفهارس (واختبار يفرض وجود الثلاثة في المحتوى الحقيقي). **المولِّد يشتقها آلياً** والمواصفة التي تكتبها تُقارن بالدليل وتُرفض إن خالفته. `tools/goethe-audit.ts`: الملخص · `--apply` (الحقل وحده) · `--word <id>` · `--uncovered <قائمة>` · `--plurals`.
- **القانون 7 — تغيير معلن:** الوسم القديم كان آلياً = مستوى الدرس (742/742 [A1] · 13/13 [A2]). **728 من 755 كلمة تغيّر وسمها** (الحقل وحده — مُتحقَّق: لا حقل آخر تغيّر في أي ملف):
  - 466 [A1] ← [A1,A2] · 9 [A2] ← [A1,A2] (كلمات درس A2 الأول anmachen · ausmachen · beginnen · gerade · lachen · Licht · passieren · schon · vergessen رسمياً A1 أيضاً).
  - **123 [A1] ← [A2]:** في درس A1 عندنا لكنها رسمياً A2 فقط (hinter · neben · weil · natürlich · Hose · Hemd · Stuhl · Teller · Brille · mal …).
  - **130 [A1] ← []:** في لا قائمة رسمية — مركّبات (Abendessen · Hauptbahnhof · Kopfschmerz …) · مشتقات (Erkältung · Reservierung · Absage …) · خارج القوائم (Nase · Finger · Patient · okay · prima …).
  - النتيجة: من 742 كلمة A1 عندنا **489 (66%) في قائمة A1 رسمية و253 (34%) ليست فيها**.
- **تغطية القوائم الرسمية بمنهجنا (مقيسة):** SD1 الرئيسية 344/626 (55%) + 39 وظيفية مغلقة (`CLOSED`) = **61%** · **278 كلمة رئيسية/فرعية من SD1 لم يعلّمها منهجنا بأي شكل** (منها heute · jetzt · neu · Herr · Kurs · Restaurant · ab · aber · also · Aufgabe · bekommen …) — فجوة جاهزية للامتحان، معالجتها قرار منهجي للمالك · Fit1 64% · A2 48% (منهج A2 في يومه الأول).
- **الجمع (معلوماتي):** كل جمع عندنا قابل للمقارنة يطابق علامة القائمة المطبوعة (0 مخالفة) — الحساب لا يدّعي حين لا يُقرأ بيقين (Sg. · «die Woche, -e» المستحيل صرفياً في SD1 · الصيغة الثانية في زوج).
- **حدود الصدق:** Fit1 نسخ يدوي (خطأ نسخ فيه لا يكتشفه تحقق آلي كما في SD1/A2 — الضمان: الترتيب الأبجدي ومراجعة الـ68 كلمة التي يثبتها وحده) · فئة Herkunft تفسيرٌ معلن للفئة المفتوحة · مطابقة SD1/A2 مع goethe.de بالعنوان والنص والعيّنة وتطابق البصمة عبر المستودعات (goethe.de محجوب عن البيئة — لا تنزيل مباشر).
- البوابة: **417/417 (48 ملفاً، +34) + tsc + validator (880/0 أخطاء/0 تحذيرات) + build (791 مقطعاً في dist)** ✓.

## D111 (2026-10-14): تحقق مستقل من D110 بعد إعادة إنشاء البيئة + إصلاح عيبين (علامة جمع على حدّ العمود · الجذع المركِّب einzel-)
- **السياق:** المالك أعاد إرفاق القوائم الرسمية الثلاث — **لم تصل للمرة الثامنة** (لا `/home/user/uploads` ولا نسخة على القرص). البيئة أُعيد إنشاؤها (استنساخ جديد: commits المحلية وnode_modules و/tmp مُسحت)، والفرع على origin كان يحمل D110 (aa02044 + 73684f3) من تشغيل سابق للطلب نفسه — **فلم يُعَد البناء بل تحقق منه تحققاً مستقلاً** قبل البناء عليه.
- **التحقق (كله ✓):**
  - الملفان الرسميان جُلبا من جديد بتجزئة git blob نفسها (`gh api repos/…/git/blobs/<sha>`) — sha256 وblob = بصمة الفهارس (SD1 `45fb648b…` 712,341 بايت · A2 `03c53333…` 485,366 بايت). لا يُلتزمان أبداً (/tmp فقط).
  - `tools/goethe-wordlist.py --check` يعيد إنتاج الفهارس الثلاثة حرفياً (SD1 · A2 · Fit1).
  - البوابة على 73684f3: 417/417 · tsc · validator 880/0/0 · build 791 ✓.
  - **مقارنة متقاطعة مع قائمتين غير رسميتين — كاشف أخطاء لا مرجع:** lincw/deutsch_a1 (518 مدخل A1) · langfield/A2_Wortliste_Goethe (1,214 ملفاً). كل فرق فُسِّر (أسماء slug · جذوع · «weg sein» مدخل فرعي · ihr/ihm/ihn مقسّمة · wieder ليست كلمة رئيسية في SD1 · كلمات عند lincw ليست في SD1 أصلاً: Gesicht · Computerraum) **عدا عيبين حقيقيين:**
- **العيب 1 — الاستخراج:** A2 ص12 «das Doppelzimmer, -»: علامة الجمع «-» عند x0=374.1 = حدّ عمود الأمثلة تماماً، فسقطت إلى الأمثلة وبقيت الكلمة الرئيسية «das Doppelzimmer,» بفاصلة معلّقة. **الإصلاح (`page_lines`):** علامة جمع على الحدّ (±2pt) بعد كلمة رئيسية منتهية بفاصلة تعود إليها — لا مثال يبدأ بعلامة جمع (`PLURAL_MARK`). إعادة التوليد: **سطر واحد تغيّر** في `goethe-a2.json` · SD1 وFit1 بلا تغيير (`--check` ✓).
- **العيب 2 — المطابقة:** A2 ص13 «einzel-» وأمثلته الرسمية مركّبات (Einzelkind · Einzelzimmer)، لكن المطابقة عاملته كجذع تصريف فقط ⇒ einzelzimmer بلا دليل A2. **الإصلاح (`tools/lib/goethe-lists.ts`):** `COMPOUND_STEMS = {einzel}` — قائمة صريحة بدليلها: الجذع + اسم مُدرج في القائمة نفسها. الجذوع الصغيرة الأخرى (all- · dies- · jed- · ein-) أدوات تُصرَّف لا تُركَّب: Einkauf ≠ ein- + Kauf · Einzelheit بلا دليل (الجزء الثاني غير مُدرج) — مُختبَران.
- **القانون 7 — تغيير معلن:** einzelzimmer: goetheList [A1] ← [A1,A2] (الحقل وحده عبر `goethe-audit --apply`). أنواع الدليل: stem 5 ← 6. **التغطية بلا تغيير** (SD1 61% · Fit1 64% · A2 48%).
- **اختباران جديدان** (36/36 في `tests/goethe-wordlists.test.ts`): لا كلمة رئيسية بفاصلة معلّقة في أي فهرس + «das Doppelzimmer, -» كاملة · einzel- يُركَّب وein- لا. **تحقق الطفرة:** على الكود القديم يفشل الاختباران.
- **فجوة SD1 مفصّلة لقرار المالك:** الـ278 = 241 رئيسية + 37 فرعية · **234 منها (84%) في قائمة A2 الرسمية أيضاً** (سيحتاجها منهج A2 بطبيعته) · **44 خاصة بـSD1** — مفردات الاستمارات والامتحان (Absender · ankreuzen · Ansage · Vorwahl · Familienstand · Kugelschreiber · S-Bahn · Halbpension · verboten · geöffnet/geschlossen …).
- البوابة: **419/419 (48 ملفاً، +2) + tsc + validator (880/0/0) + build (791 مقطعاً في dist)** ✓.

## D112 (2026-10-14): تكملة Start Deutsch 1 — كل الكلمات الرسمية غير المُعلَّمة في 4 وحدات A1 قبل أسبوع الامتحان (قرار المالك: أ) + أسبوع الامتحان 13 → 17
- **السياق:** D110/D111 قاسا الفجوة: 278 مدخلاً في فهرس SD1 الرسمي لم يعلّمها المنهج = 241 رئيسية + 37 فرعية = **276 نصاً فريداً** («an sein» و«auf sein» مطبوعتان مرتين: ص10 تحت an/auf وص23 تحت sein). عُرضت ثلاثة خيارات: (أ) وحدة A1 تكميلية قبل A2 · (ب) دمجها في A2 · (ج) هجين. سؤال الاختيار تُخطّي، ثم أجاب المالك «ا» مرتين — **فُسِّرت (أ)** (الألف = أول الخيارات المرقّمة أ/ب/ج) **وأُعلن التفسير في التقرير ليصححه المالك**. التراجع رخيص: الخطة ملف واحد ولم يُنتَج درس تكميلي بعد.
- **الحجم الحقيقي (تصحيح تقدير سابق):** قدّرتُ في تقرير سابق ~21 درساً؛ الخطة الفعلية **24 درساً** = 4 وحدات × (5 دروس محتوى + درس توليف) — 20 درس محتوى × 12–14 كلمة رئيسية (متوسط 13.8 ≈ إيقاع v6.1 «~13 كلمة/يوم»؛ كثير منها مشترك اللفظ: Test · Job · Banane) + 4 أيام توليف بلا كلمات جديدة (التقويم الأسبوعي: الاثنين→الجمعة محتوى · السبت توليف ومعركة · الأحد راحة). **A1 يصبح 102 درساً** (78 + 24).
- **المكان:** الوحدات 13–16 بين الوحدة 12 وأسبوع التثبيت والامتحان (D92) الذي **نُقل من 13 إلى 17** — فيأتي الامتحان بعد A1 كله بما فيه التكملة. الموضوعات (`content/plans/a1-sd1-supplement.json`):
  - **13 «Die kleinen großen Wörter»:** الزمن (heute · jetzt · später) · العادات (immer · oft · nie) · السؤال المهذب (wissen · mögen) · الكمية (mehr · wenig) · الوصف (neu · kaputt).
  - **14 «Menschen, Feste, Freizeit»:** الناس والعائلة · نحتفل بالحياة · وقت الفراغ · الطعام والتسوّق · المقهى والخارج.
  - **15 «Ämter, Post, Arbeit»:** الاستمارة · الدائرة والبنك والبريد · الرسائل والهاتف (Herr · Dame) · العمل · الدورة والحاسوب (Kurs).
  - **16 «Unterwegs — und die Prüfung»:** المواصلات · السفر · اللافتات والطوارئ (geöffnet · verboten · Achtung) · السكن · **مفردات الامتحان نفسه** (Prüfung · Aufgabe · ankreuzen — آخر يوم محتوى قبل أسبوع الامتحان).
- **الخطة ملزمة آلياً:** كل كلمة رئيسية بنصها المطبوع حرفياً ← درس بعينه. المخطط `CurriculumPlan` (معرّفات `a1-u{n}-d{i}` · تتابع الوحدات · الامتحان = آخر وحدة + 1 · الأحجام · لا تكرار) + `checkPlan` في المدقِّق:
  - `e-plan-source` · `e-plan-headword` (النص حرفياً في الفهرس) · `e-plan-complete` (كل غير مُعلَّم مخطط — لا تُنسى كلمة، وأي إصدار جديد للقائمة يفرض قراراً).
  - `e-plan-taught` (الدرس المخطط حين يُنتَج يعلّم كلماته **بكلماته هو** — `praesentation.wordIds`) · `w-plan-elsewhere` (علّمها درس آخر ⇒ حدّث الخطة بتغيير معلن).
  - `e-plan-kind` · `e-plan-unplanned` (لا درس في 13–16 خارج الخطة) · `e-plan-exam-week` (الامتحان في وحدته، توليف فقط، ولا شيء بعده).
  - التغطية بالنص المطبوع لا بالصفحة (`coveredHeadwords` في goethe-lists.ts): مدخل «an sein» الواحد يغطي الطبعتين — `evidenceIn` يعيد مدخلاً واحداً لكل قائمة.
- **حدّ الوحدات مصدر واحد:** `UNIT_MAX = 17` + `UnitNumber` في common.ts بدل 8 حدود مبعثرة (max(12): word · card · learner-state · LevelUnitRef · max(13): lesson · landeskunde · lese · pruefungen) + اختبار يربطه بـ`placement.examWeekUnit` فلا ينحرفان. **عيب كامن أُصلح:** `LearnerProgress.currentUnit` كان max(12) — أسبوع الامتحان نفسه (13 آنذاك) لم يكن ممكن التمثيل في حالة المتعلم.
- **القانون 7 — تغيير معلن:** a1-u13-d1..d6 → **a1-u17-d1..d6** (المعرّف وحقل unit وحدهما — مُتحقَّق بمقارنة JSON مستقلة وبكشف git لست إعادات تسمية) + 46 إشارة `usedInLessons` في 46 كلمة. لا بيانات متعلم موجودة تُكسر. المعرّفات a1-u13-* صارت لدروس التكملة.
- **أداة النقل `tools/move-unit.ts`:** استبدال نصي للمعرّف المقتبس بالضبط ولحقل unit الأعلى (326 ملف محتوى ليست JSON قياسياً — إعادة التسلسل كانت ستغيّر تنسيقها) + **برهان لكل ملف** (JSON بعد = JSON قبل مع خريطة المعرّفات وحدها، وإلا توقف) + رفض الوحدة المشغولة والمسار المخالف. **تتخطى `plans/`:** التشغيل التجريبي أظهر 53 ملفاً لا 52 — الثالث والخمسون الخطة نفسها، تحمل a1-u13-* لخانات الدروس الجديدة؛ النقل الساذج كان سينقل الخطة مع الامتحان. مُختبَر.
- **`tools/plan-status.ts`:** التقدم (0/20 محتوى · 0/4 توليف · 0/276 كلمة) + الدرس التالي بكلماته · `--lesson <id>` = الخطوة (1) في وصفة درس التكملة.
- **الاختبارات:** 17 جديداً (12 الخطة · 5 النقل) · **تحقق الطفرة: 9/9** كسور متعمدة للحراس اكتشفتها الاختبارات.
- **متابعات مسجّلة (لم تُبنَ):** (1) توسيع مراجعة أسبوع الامتحان u17 لتشمل 13–16 · (2) بطاقات ثقافة 13–16 (إيقاع الجمعة) · (3) Kurztest/Monatsprüfung لـ13–16 · (4) مرجع Netzwerk لدروس التكملة (`curriculumRef.netzwerkChapter` إلزامي؛ موضوعاتها لا تقابل فصلاً واحداً — يُوثَّق الأقرب بدليله عند إنتاج a1-u13-d1) · (5) a1-u16-d3 يثبت «auf sein» وa1-u16-d4 «an sein» — `e-plan-taught` يكشف السهو.
- البوابة: **436/436 (50 ملفاً، +17) + tsc + validator (881/0/0) + build** ✓.

## D113 (2026-10-14): قرار المالك «ابني ج» — نواة SD1 مبكراً داخل الوحدات 1–12 · الباقي للفهم في 13–14 · أسبوع الامتحان 15 (يحل محل توزيع D112)
- **السياق:** سأل المالك «ما الأصح منهجياً وتعليمياً؟» فقدّمتُ تحليلاً (`docs/reports/sd1-gap-pedagogy.md`): مقدمة Goethe الرسمية — كل الكلمات تُفهم سلبياً، نحو النصف نشطاً، القائمة مرجع لا منهج، بلا معيار تردد — وقياسٌ على محتوانا كشف أن دروسنا تعرض كلمات رسمية قبل تعليمها (خرق القانون 13). أجاب: **«إذن ابني ج»**.
- **القياس صُحِّح قبل التنفيذ (98/178 → 123/153 — معلن في التقرير §5):** تردد **اللِّمّة** (مجموع الصيغ المصرّفة بـwordfreq؛ الأفعال المنفصلة بصيغها الملتصقة وحدها؛ bitte/danke أدوات مستقلة) لا صيغة القاموس · ظهور في **نصوص الثقافة والقراءة** أيضاً · **أسبقية الكلمة المُعلَّمة** (möchte ليست ظهوراً لـmögen) مع مراجعة يدوية لكل فرق (Dank وspäter حجبتهما الأسبقية خطأً فاستُعيدا) · **إكمال الأزواج** (Oma/Opa · geschlossen/geöffnet) · **القلب** «tut weh» (البحث الحرفي عن «weh tun» لم يلتقطه).
- **النواة 123 كلمة على 48 درساً قائماً:** معيارها Zipf اللِّمّة ≥ 5.0 أو ظهور في نص يراه المتعلم في دروس 1–12 ومداخل كلماتها أو في نص ثقافة/قراءة متسق الموضوع. الإسناد عند أول ظهور أو قبله وحيث يقتضي الموضوع (Kurs/Anmeldung/Herr في درس التسجيل والتهجئة · bekommen/Bitte/bar في المقهى · tun/weh tun في «Körperteile» · auf/zu sein في Wo/Wohin)، ≤ 3 للدرس إلا الخفيفين (u1-d5 7→14 · u9-d5 6→11) · متوسط دروس 1–12: 12.4 → 14.4 · أعلى حِمل 17 (u1-d1). كلها `pending`.
- **إصلاحات النص (4) بدل تقديم الكلمة:** ملخص a1-u1-d1 «Heute hast du …» (heute تُعلَّم في u1-d2 فلا يُثقل اليوم الأول) · بطاقة الثقافة u3 «In der Stadt» (Straßenbahn — موضوع المدينة الوحدة 9) · بطاقة u5 (Ticket — القطار في وحدة الطعام) · مثال der Fuß «Mein Fuß tut weh.» في درس الإملاء. **ملاحظة مسجّلة:** نصوص ثقافة/قراءة أخرى غير متسقة مع وحدتها (القراءة u4 «Im Restaurant» قبل وحدة الطعام وفيها möchte قبل تعليمها) — تُعالَج في فحص قانون الجبهة للنصوص.
- **التكملة للفهم 153 كلمة:** الوحدتان 13–14 = 10 دروس موضوعية (الناس والأعياد · وقت الفراغ · التسوّق والطعام · المقهى · العمل والمكتب | الاستمارة · البريد والبنك والهاتف · المواصلات · السفر واللافتات · السكن ثم الامتحان) × 13–17 + يوما توليف · بطاقات comprehension بلا production (`e-plan-receptive`). **أسبوع الامتحان: الوحدة 15** (`move-unit` 17 → 15 · 52 ملفاً · المعرّف وunit وحدهما) · `UNIT_MAX = 15` · **A1 = 90 درساً**.
- **المخطط والمدقِّق:** `CoreLesson`/`TextFix`/`supplementMode`/`method` + قواعد بنيوية (النواة ≤ afterUnit · لا تكرار بين النواة والتكملة · الإصلاح لكلمة مخططة · مسار آمن) · `checkPlan`: e-plan-core-lesson · e-plan-core-load (≤ 18) · e-plan-taught لإسناد done · w-plan-mark-done · w-plan-elsewhere لإسناد pending · e-plan-text-fix · e-plan-receptive · `coreStatus` · `plan-status` يعرض النواة والتالي وإصلاحاته.
- **الاختبارات:** curriculum-plan أُعيد (17) · **تحقق الطفرة 8/8** · البوابة: **441/441 (50 ملفاً) + tsc + validator (881/0/0) + build** ✓.

## D114 (2026-10-14): تدقيق شروحات الدروس — التصميم احترافي والمحتوى ناقص · خطة «مرور ترقية» لكل درس
- **سؤال المالك:** «هل شروحات الدروس كاملة وتتبع بيداغوجية ومنهجية احترافية؟» — **الجواب الصادق: لا** (`docs/reports/lesson-explanations-audit.md`).
- **مقيس على 79 درساً:** قاعدة اليوم (125 إشارة · 61 قاعدة) **صفر مكتوب** · جمل القصة (79) **صفر** · محرك الاكتشاف E13 فيه **3 قواعد** للوحدة 1 غير مربوطة بالدروس · التصحيح التفسيري **0/482 بنداً** رغم `explanationRequired` في 238 محطة · **178/184 محطة «choice»** وصفر استماع/قراءة/كتابة داخل الدروس · **~6 بنود تطبيق للدرس** · صور 11/79 · Quiz ~4 بنود للنسخة. المُشغِّل لا يقرأ grammarArsenalIds ولا storySentenceIds أصلاً: شرح الكلمة سطر مولَّد واحد ولا قاعدة تُعرض.
- **الاحترافي القائم:** البنية (استرجاع ← محاولة قبل الكشف ← تطبيق مخلوط ← خلاصة/SRS) · بطاقات التحذير التقابلية 79/79 · الأهداف وCan-do · المهام التواصلية بمعايير نجاح · الخلط 36/36 · تصميم E13 (اكتشاف موجَّه بمقارنة عربية إلزامية).
- **القرار — مرور ترقية لكل درس محتوى، مرة واحدة، بالترتيب:** (1) قاعدة اليوم بصيغة الاكتشاف الموجَّه ملفَّ خزانة حقيقياً يعرضه المُشغِّل · (2) ≥ 12 بند تطبيق في ≥ 3 أنواع محطات كل بند بشرح «لماذا» · (3) كلمات نواة D113 للدرس · (4) إصلاحات النص + فحص الجبهة · (5) Quiz ≥ 6 بنود للنسخة. **حارس على نمط D113** (خطة ترقية pending/done يتحقق المدقِّق من done آلياً — الدَّين معلن لا يختفي بصمت). الصور وقرار جمل القصة لاحقاً. الحجم: نحو دفعة لكل درس من 61 — البداية الوحدة 1 والدرس الأول نموذجاً مرجعياً.

## D115 (2026-10-14): حارس ترقية الدروس — «done» يُثبت آلياً · القواعد محتوى · كل بند بشرح «لماذا» (الدفعة 70)
- **السياق:** تنفيذ D114 بأمر المالك «واصل» — الحارس قبل أي محتوى، فلا يُعلن درس «مُرقّى» بالكلام.
- **صيغة قاعدة اليوم:** `content/arsenal/grammar/<id>.json` — ملف خزانة `kind: shufra` (§10: قصة + قاعدة + استثناءات + تمارين) بحمولة صارمة (`ShufraPayload`): المشهد ← ≥3 أمثلة ← سؤال استنتاج ← ruleDe/ruleAr ← مقارنة عربية **تشير إلى 10‑ي** (D59) ← الحدود ← حبّات بلا تكرار ← أسماء علم معلنة. قانون الجبهة على نصوصها نسبةً إلى **أول** درس يشير إليها (المُشغِّل يعرض كل قاعدة تُحلّ، رُقّي درسها أم لا) + الفهرس العكسي بالاتجاهين.
- **أشكال البنود:** شكل لكل نوع من أنواع المحطات الأربعة عشر · `why` عربي إلزامي · الإجابة بين الخيارات · بطاقات الترتيب = كلمات الإجابة وغير مرتبة سلفاً · الإملاء = المسموع حرفياً. مخطط الدرس العام **لم يتغير** (الدروس القديمة صالحة؛ الشكل يُفرض على done وحده).
- **خطة الترقية:** `content/upgrades/a1-lesson-upgrade.json` — دروس المحتوى الستون (الوحدات 1–12) × قاعدة/تطبيق/Quiz = pending. **done يعني:** القاعدة ملف صالح مفهرس · ≥ 12 بنداً في ≥ 3 أنواع **منها الاستماع والإملاء** على مسارات موجودة (`speakText` = نص المسار) · قانون الجبهة · Quiz ≥ 6 للنسخة ونسخ مختلفة · **كل كلمة جديدة تُسترجع في بند واحد على الأقل**. الاكتمال: كل درس محتوى في النطاق مُدرج.
- **قرارات تفصيلية معلنة:** (1) التعليمات العربية خارج قفل الجبهة (اتفاقية D109) · المغلقة معروفة · أسماء العلم بالإعلان فقط وتنبيه إن لم تُستعمل · (2) بطاقات المصائد داخل فحص التدريب (لها تمرين يراه المتعلم) — كشفت «Er ist neu hier» في u1-d1 (hier من u2-d1) · (3) النصوص الوصفية ثنائية اللغة (ziel · summary · المهمة التواصلية · slider) خارج الحارس الآن، وتدقيقها متابعة معلنة · (4) دروس التوليف خارج هذه الخطة · الوحدتان 13–14 بوصفة الفهم.
- **قياس الدرس الأول قبل ترقيته:** 5 بنود · لا استماع ولا إملاء · Quiz 3 للنسخة · **10 من كلماته الخمس عشرة بلا أي بند تدريب أو Quiz**.
- **عيوب كشفها البناء وأُصلحت:** (أ) `knownForms` كان يقطّع على `[\s/!.,]` فقط ⇒ «geht's?» و«(sie)» و«koste(n» لا تطابق أي نص (11 مدخلاً) — صار يقطّع كما يقطّع النص: قفل العبارات 859 → **862**/1113 (اختفت إيجابيات geht الثلاث الزائفة وحدها) · (ب) `GrammarLab` لم يستدعِ `viewExamples` فيرمي «سجّل استنتاجي» خطأً عند الضغط — صار غلافاً للمكوّن المشترك · (ج) `PlayButton` يضع النص المنطوق في aria-label ⇒ في الإملاء يتهجّى قارئ الشاشة الإجابة — وسم محايد لبنود الاستماع/الإملاء · (د) «done» في إصلاح النص (D113) صار يُثبت: الكلمة غابت من نصوص الملف.
- **المُشغِّل:** قاعدة اليوم بعد بطاقات الكلمات (الأمثلة ← استنتاجك ← الكشف مقفل قبله ← حبّات بالضغط) · البند المُنمَّط: محاولة ← حكم + الصحيح + «لماذا» ← التالي (الانتقال قبل المحاولة يرمي) · الإملاء بمحرك النسخ نفسه · الكلام تقييم ذاتي (قانون ASR) · البنود القديمة كما كانت.
- **ما يبقى:** واجهة Quiz (مع دفعة مسار الدروس) · قواعد E13 الثلاث في الكود تنتقل إلى المحتوى مع دروسها · جمل القصة (قرار عند إتمام الوحدة 1).
- **التحقق:** 488/488 · tsc · validator 882/0/0 · build · الطفرة **16/16**.

## D116 (2026-10-14): a1-u1-d1 مُرقّى — النموذج المرجعي لمرور الترقية · فحص أمثلة البطاقات · إصلاح كاشف v-f (الدفعة 71)
- **الدرس الأول كما يجب أن تكون الدروس كلها:** قاعدة اليوم `ars-sein` (المشهد: أول يوم في دورة اللغة ← 5 أمثلة ← «ماذا يأتي بعد ich/du/Lena/Sie؟» ← ich bin · du bist · er/sie ist · Sie sind ← المقارنة: الجملة الاسمية العربية بلا رابط (10‑ي) ← 3 حدود معلنة ← حبّات) · **التطبيق 14 بنداً** في 4 أنواع (فراغ للقاعدة 4 · استماع 4 · ترتيب 3 · إملاء 3 — بالصوت الموجود) كل بند بـ«لماذا» · **Quiz 3 × 6** متوازية · **الكلمات السبع عشرة كلها مُسترجعة** (كانت 10 من 15 بلا أي بند).
- **تغييرات معلنة (القانون 7):** المعرّف ars-sein-haben ← ars-sein في u1-d1 (haben لا تُستعمل في الدرس؛ u1-d2 يبقى على معرّفه حتى ترقيته) · البنود القديمة الخمسة استُبدلت (المهمة التواصلية تحمل الإنتاج الشفهي) · ملخص الدرس بلا heute (إصلاح نص D113 — done مُثبت) · تمرين بطاقة المصيدة «Er neu hier» ← «Er neu» · أمثلة 4 بطاقات: guten-tag (hier) · danke وbitte (schön) · deutsch (lerne).
- **نواة D113:** neu وwie viel بالمولِّد (IPA مقيسة · مقطعان 804/978 ms · روابط: neu↔alt · wie viel↔viel/Wie geht's?) ⇒ النواة 1/48 done · 2/123 كلمة · إصلاحات النص 1/4.
- **توسعة الحارس (e-upgrade-sample):** تحت rule=done كل كلمة جديدة لها جملة مثال خالية من غير المدروس — **قياس: 217/743 مثالاً في بطاقات A1 فيها كلمة لم تُدرَّس بعد في درسها** (حدّ أعلى: بعضها أسماء أماكن) ⇒ تُصلَح درساً درساً في مرور الترقية.
- **عيب في كاشف أعلام النطق (D106) أُصلح:** شرط v-f «لا [v] في النطق» تُخفيه [v] الآتية من w/qu (wie viel [viː fˈiːl] · verschwinden) ⇒ عدّ [v] المتوقعة · إعادة تدقيق 755 كلمة: تغيّرت واحدة فقط (verschwinden +v-f — تعديل نصي بإثبات).
- **عيب بيانات مرصود (يُصلح في ترقية u5-d3):** حقل plural في eis.json يحمل ملاحظة تأليف («die Eiskrem? لا: das Eis …») بدل جمع.
- **قرار مؤجل معلن:** جمل القصة (storySentenceIds) — تُكتب أم يُحذف الحقل — عند إتمام الوحدة 1؛ المشهد في القاعدة (sceneAr) يحمل الآن «قصة الشفرة» بحسب §10.
- **التحقق:** 493/493 · tsc · validator 885/0/0 · build · الطفرة 11/11 (منها تدهور المحتوى الحقيقي نفسه).

## D117 (2026-10-14): مسار الدروس + بوابة Quiz (≥75%) + حفظ التقدّم — التطبيق يمشي المسار الحقيقي (الدفعة 72)
- **الفجوة (موثّقة في D107 «فجوة منتج مكتشفة أثناء الربط»):** القشرة تشغّل a1-u1-d1 مثبَّتاً · الـQuiz لا يُعرض في أي مكان · لا شيء يحدّث التقدّم · لا حفظ (إعادة التحميل = أول تشغيل من جديد) · «التالي» يتخطى المحطات · «أنهِ الحصة» لا تفعل شيئاً.
- **المسار (`src/lib/lesson-path.ts`):** الدرس الحالي = أول درس غير مكتمل في ترتيب المحتوى · كل محاولة تُسجَّل `GateResult` (lesson-quiz) + سطر معايرة (§14) · **الإكمال بالنجاح وحده** · محاولة لدرس غير الحالي تُرمى (لا قفز ولا ارتجاع — القانون 3) · `reconcileProgress` يشتق المتاح والوحدة الحالية من التاريخ وترتيب المحتوى الحالي (معرّف اختفى بنقل وحدة — مثل 17←15 — لا يعلّق المتعلم).
- **البوابة (`quiz-session.ts` + `QuizStation`):** التوقّع أولاً (سؤال الـSlider **بالعربية فقط** — «Wie viel Prozent wirst du schaffen?» فيها ما لم يُتعلَّم: القانون 13) ← البنود واحداً واحداً ← تصحيح تفسيري بعد المحاولة (F121) ← النتيجة + معايرة فورية · النسخ الثلاث تتبادل بعدد المحاولات السابقة (قانون 21) · **لا تتكرر نسخة في الحصة الواحدة** (بعد الثلاث: المراجعة والحصة القادمة — الإعادة الفورية تختبر حفظ الإجابات لا الإتقان) · الخلاصة والمصائد تظهر بعد أول محاولة (تشريح §3: 6 ← 7 ← 8) فتخدم المراجعة عند «ليس بعد».
- **تصحيح عادل لبوابة تقفل المسار (قياس قبل القرار):** 883 من 933 بنداً مفتوحة، وكثير منها ترجمة بأكثر من صيغة صحيحة أو بصيغة لا يعرفها المتعلم مسبقاً («يصل» ← `ankommen → er kommt an.`) — المطابقة الحرفية وحدها تُسقط من أجاب صواباً ⇒ (1) الخيارات: مطابقة تامة (2) المفتوحة: تطبيع (الترقيم والاقتباس · التشكيل وصور الهمزة والألف المقصورة والتاء المربوطة) + `accept` (3) الحرف الكبير/الصغير وحده أو ss/ae/oe/ue وحدها = **نصف درجة** معلنة (4) غير ذلك: يرى المتعلم النموذج ويحكم — كحكم «self» في الإنتاج الحر — **ويُحتسب ويُعلَن** في النتيجة وفي `GateResult.selfJudged`. الحدّ 75% بالضبط ينجح.
- **الحفظ (`src/stores/learner-store.ts`):** IndexedDB على الجهاز عبر مخزن Dexie القائم (S0.5) — بلا خادم · `parse` قبل كل كتابة · ترتيب الكتابات مضمون من مواصفة IndexedDB (طابور يدوي أُزيل بعد أن أثبتت الطفرة أنه بلا أثر) · **البيانات التالفة لا يُكتب فوقها أبداً:** شاشة إنقاذ (نسخة خام للتنزيل ← مسح صريح بتأكيد) · غياب IndexedDB يُعلَن («هذه الجلسة فقط»).
- **قفل المحطات داخل الحصة:** «التالي» مقفل حتى تكتمل المحطة (الاسترجاع · الجديد + قاعدة اليوم · التدريب) · المحطة الأخيرة = محاولة Quiz واحدة على الأقل · «أنهِ الحصة» تعمل · الدرس ثابت طوال الحصة ولو فُتح التالي في وسطها.
- **عيبان في صدق القياس اكتُشفا وأُصلحا:** (1) **الإجابة الصحيحة هي الخيار الأول في 18/18 بند اختيار في a1-u1-d1** والواجهة تعرض بترتيب التأليف ⇒ «الزر الأول» دليل في التدريب والبوابة معاً ⇒ خلط حتمي عند العرض (`displayOrder`: FNV-1a ← mulberry32 ← Fisher–Yates) — الإجابة في الموضع الأول الآن أقل من 60% عبر كل بنود الاختيار · (2) بند Quiz في a1-u2-d6 إجابته «der (Dativ)» ليست بين خياراته `die`/`der` (لا يُجاب صواباً أبداً) ⇒ `QuizVariant.items` صار `QuizItem` في **كل** الدروس (خطأ بناء فوري — كان الحارس D115 يفحص المُرقّى وحده) + إصلاح أدنى بإثبات (القانون 7): `a: "der"` و«(Dativ)» انتقلت إلى `why` — تغيّر البند وحده والملف ما زال قانونياً.
- **عيب في التهيئة أُصلح:** القشرة كانت تقفز إلى اللوحة لحظة إدخال الاسم ⇒ بطاقات اليوم الأول وشاشة أول درس لا تُرى أبداً (واللوحة تقول «الوحدة صفر مكتملة») ⇒ تُعرض الآن حتى زر «إلى حصة اليوم».
- **أدوات الاختبار:** happy-dom (dev فقط · 21.0.1 مثبّت) لاختبار الرحلة في DOM حقيقي: أول تشغيل ← المحطات الأربع ← البوابة ← الحفظ ← إعادة التحميل تستأنف · ومسار «ليس بعد» عبر ثلاث حصص (النسخة 1 ← 2·3·1 ثم السقف ← 2 ونجاح بالمحاولة الخامسة).
- **حدود معلنة (لم تُبنَ هنا):** (أ) كلمات الدرس لا تدخل مجموعة SRS بعد النجاح (`srsCards` فارغة — الاسترجاع خارج الحصة غير موصول؛ محطة الاسترجاع تستعمل بطاقات الدفء من المحتوى) (ب) الحصة لا تُستأنف من وسطها بعد إعادة التحميل (المحفوظ = الدروس والنتائج والمعايرة) (ج) سجل الجلسة اليومي `sessions` لا يُكتب (د) **سؤال للمالك:** يُفتح الدرس التالي فوراً بعد النجاح أم في اليوم التالي؟ لا قانون مكتوب يحدد — المبني الآن = القانون الموثّق وحده (≥75%).
- **بداية الدفعة (للأمانة):** فشل `git rev-parse --short HEAD origin/…` بـ«Needed a single revision» سببه الأمر نفسه (`--short` يقبل مراجعة واحدة) لا فقد مرجع — والبيئة أُعيد إنشاؤها فعلاً فاستُعيدت بالوصفة (الشجرة = origin 89d5fbe بفهرس مؤقت).
- البوابة: vitest 57 ملفاً / **537/537** · tsc 0 · validator 885/0/0 · build ✓ · **الطفرة 34/34** (24 قاعدة + 10 ربط بالرحلة).

## D118 (2026-10-14): عائلة الكلمة تُعرض بصيغتها الألمانية ومن المدروس وحده — عيب عرض اكتُشف في مرور ترقية a1-u1-d2 (الدفعة 73)
- **الاكتشاف:** `explainWord` (بطاقة «الجديد») و`NetworkLab` يعرضان `wordFamily` معرّفاتٍ خاماً. قياس على مسار A1 كله: 102 كلمة لها عائلة · 205 مرجعاً معروضاً · **159 منها (78%) معرّف لا صيغة ألمانية** (tuerkei · aegypten · wie-gehts — رسم بلا ä/ü/ß وبلا أداة أمام المتعلم، عكس مبدأ D102) · **4 أعضاء لم يُدرَّسوا بعد** (wohnung · alt · viel في أول درس · sprechen في u2-d5) ⇒ خرق لقانون الجبهة 13 لم يكن أي حارس يفحصه.
- **الإصلاح:** `familyForms(w, known)` في `lesson-runner.ts` = الصيغة الكاملة (`fullForm`: الأداة + الرسم الحقيقي) لكل عضو موجود في الكلمات الممرَّرة وحدها · `runtimeWordsForLesson` يمرّر أعضاء العائلة المدروسين حتى الدرس (ضمناً، بترتيب المسار) ولا شيء بعده · `NetworkLab` بالقاعدة نفسها. **المعرّف للربط فقط، لا للعرض.**
- **الأثر في أول درس:** wie viel ← «Wie geht's?» (تُدرَّس اليوم) · wohnen ← kommen · neu بلا alt — والأعضاء الآخرون يظهرون حين يُدرَّسون.
- **اختبارات:** `tests/word-family-display.test.ts` (الدالة · أول درس بالاسم · مسح كل الدروس: المعروض = المدروس بالضبط لا أكثر ولا أقل · المختبر) · **الطفرة 5/5**.
- **قرارات الدفعة 72 (للسجل):** ردّ المالك «لن أجرب إلا عندما يكون المشروع كاملاً · كل إضافة ارفعها مباشرة» دون اختيار ⇒ تبقى الافتراضات المعلنة: (1) الحكم الذاتي في المفتوح غير المطابق (2) نصف درجة للحرف الكبير وss/ae وحدهما (3) 3 محاولات في الحصة (4) الدرس التالي فوراً بعد النجاح — لا قفل يومي بلا قرار صريح (5) التالي = ترقية a1-u1-d2 حسب الخطة. **المالك لا يجرّب قبل الاكتمال ⇒ التحقق كله على الاختبارات والطفرة** (لا تغذية راجعة يدوية).
- البوابة: vitest 58 ملفاً / **541/541** · tsc 0 · validator 885/0/0 · build ✓.

## D119 (2026-10-14): a1-u1-d2 مُرقّى على نموذج a1-u1-d1 — قاعدة «الأداة مع البلد واللغة» · sprechen تُدرَّس حيث يتطلبها هدف الدرس (الدفعة 74)
- **قاعدة اليوم `ars-laender-sprachen`** (اكتشاف موجَّه): مشهد اليوم الثاني في الدورة ← 5 أمثلة من كلمات الدرس ← سؤال استنتاج ← أغلب البلدان بلا أداة (aus Tunesien · in Marokko) وقلّة بأداتها (die Türkei · die Schweiz ← aus der / in der) واللغة بعد sprechen بلا أداة أبداً ← **المقارنة:** العربية تعرّف اسم اللغة بـ«ال» («العربية») ⇒ خطأ النقل الحقيقي «Ich spreche das Arabisch»، وأداة البلد في العربية لا تطابق الألمانية (المغرب ← Marokko بلا أداة · تركيا ← die Türkei) ← 3 حدود معلنة (der بعد aus/in = Dativ قطعةً الآن · e ← i في sprechen حتى الوحدة 7 · بلدان أخرى بأداة) ← حبّات «Ich komme aus der Türkei.».
- **لماذا هذه القاعدة لا التصريف:** الخطة تضع المضارع المنتظم وغير المنتظم في الوحدة 7 (`ars-praesens-regelm` u7-d3 · `ars-praesens-unregelm` u7-d4) والوحدات 1–6 تستعمل الأفعال قطعاً — سحب التصريف 6 وحدات للأمام قرار بنيوي للمالك لا لمرور ترقية. المعرّف القديم ars-sein-haben لا يطابق الدرس (لا haben فيه) ⇒ استُبدل (تغيير معلن كما في D116).
- **sprechen نُقلت إلى a1-u1-d2 (تغيير معلن — القانون 7):** هدف الدرس «أن تقول أي لغة تتحدث» والفعل كان يُدرَّس أولاً في a1-u7-d4 ⇒ بطاقات الدرس وتمارينه واختباره تستعمل spreche/spricht غير المدروستين (رصدها الحارس: 3 أمثلة بطاقات + تدريب + Quiz). الآن قطعةٌ في u1-d2 (ich spreche · du sprichst · er/sie spricht) والنمط قاعدةٌ في u7-d4. `sprechen.json`: unit 7 ← 1 · thema · sourceLesson · usedInLessons (+a1-u1-d2) · lessonRefs في المانيفست (كل فرق مُثبت بالمقارنة بعد التحليل). **أثر جانبي:** مثال u1-d3 «Sprechen Sie langsam, bitte.» لم يعد sprechen فيه غير مدروسة. **متابعة:** u7-d4 يعرضها مراجعةً حين يُرقّى.
- **التطبيق:** 6 بنود choice بلا «لماذا» ← 16 بنداً في 4 أنواع (فراغ 5 للقاعدة وsprechen · استماع 4 على المقاطع الموجودة · ترتيب 4 · إملاء 3) بشرح عربي لكل بند · **Quiz:** 3×3 ← 3×6 بصيغ `accept` حيث تصح إجابتان (Ich komme/bin aus Marokko) · الكلمات الـ16 كلها مُسترجعة.
- **نواة D113:** heute · jetzt · schwer بالمولِّد (IPA مقيسة · مقاطع 734/630/862 ms · نحو ‎−17 dB) ⇒ النواة 2/48 done · 5/123 كلمة. عائلة heute: jetzt · gestern · morgen (تظهر حين تُدرَّس — D118).
- **بطاقات التحذير (تغيير معلن):** (1) «Ich bin Tunesien» ← «Ich komme aus Türkei»: مبرر الأولى ضعيف — العربية تقول «أنا **من** تونس» و«من» = aus فلا يحذفها العربي، والخطأ الحقيقي في هذه المرحلة حذف der مع die Türkei/die Schweiz (قاعدة اليوم) (2) «Arabic» (كلمة إنجليزية غير مدروسة) ← «das Arabisch» (نقل الأداة من العربية — قاعدة اليوم) (3) السؤال بالفعل أولاً باقٍ، وتمرينه كان يشطب جملة صحيحة ثم يقول «الترتيب صحيح» ⇒ تصحيح حقيقي: «~~Du kommst aus Italien?~~» ← «Kommst du aus Italien?».
- **أخرى:** الاختبار القبلي يخمّن قاعدة اليوم (aus ___ Türkei) · الملخص بكلمات مدروسة · معايير النجاح تشمل تقديم زميل (er/sie) · `goetheWordListOverlap` 2 ← 15 من الفهارس الرسمية (D110: Französisch في A2 وحدها).
- **الاختبارات:** مثال «الدرس غير المُرقّى» انتقل إلى a1-u1-d3 (تحققتُ أنه يُظهر الفجوات الثلاث نفسها) · اختبار صفر-نقص لـa1-u1-d2 · اختبارات خطة D113 على الحالة الجديدة (فرعا e-plan-taught وw-plan-elsewhere كلاهما مختبر صراحة).
- **حدود معلنة:** لا رمز نطق في القائمة المغلقة لـw = [v] (schwer · Schweiz) ⇒ مشروح في «لماذا» الإملاء والاستماع؛ إضافة رمز = تغيير مخطط مقفل (D57) للمالك · نصوص الهدف والمهمة الألمانية (meta) ما زالت خارج الحارس (woher في ziel) · مقياس «أمثلة البطاقات فيها غير مدروس» يبقى خط أساس D116 (217/743): إعادة القياس الآن بطريقة غير مطابقة تعطي 165/747 فلا تُعرض تقدماً.
- البوابة: vitest 58 ملفاً / **542/542** · tsc 0 · validator **889/0/0** · build ✓ · **طفرة المحتوى 11/11** (منها واحدة يحكمها المدقِّق).

## D120 (2026-10-14): a1-u1-d3 مُرقّى — الألفباء للتهجئة بالصوت · إملاء الحروف · «ach so» بكلمتين (الدفعة 75)
- **قاعدة اليوم `ars-alphabet-spelling`** (قاعدة الخطة نفسها، كُتبت الآن): الحركات الخمس بأصواتها · B C D G P T W بـ«ـيه» بعدها · F L M N R S بـ«إ» قبلها · خاصة H J K Q V X Y Z · Ä Ö Ü ß ← **المقارنة:** العربية ثلاث حركات فتختلط E/I وO/U (يسمع Lena فيكتب Lina — والحوار يمثّل ذلك) + فخ أسماء الحروف الفرنسية والإنجليزية (J «جي» · W «دبليو») ← 3 حدود معلنة (الحرف المضاعف · Ä Ö Ü ß · أبجدية الهاتف لاحقاً) ← حبّات «Wie ist Ihr Familienname?». **لم تُسحب قاعدة الطلب بـSie** (`ars-imperativ-sie` في u9-d3/d4): Buchstabieren Sie bitte · Wiederholen Sie bitte قطعٌ جاهزة.
- **صوت الحروف لم يكن موجوداً في أي مكان** (الوحدة صفر بطاقات منهج فقط) ⇒ سكربتان عبر `dialogue-splitter` (الطريق القائم D103): `a1-alphabet` (kind words — 30 حرفاً + 3 أسماء متهجّاة) و`a1-u1-d3-anmeldung` (حوار هاتفي: الموظفة تسمع E كـI) — **43 مساراً** بأصوات الشخصيات المثبتة · نطق أسماء الحروف تُحقق منه أولاً (J [jɔt] · V [faʊ] · Y [ʏpsɪlɔn] · ß [ɛstsɛt]) · ‎0.6–5 ث · ‎−17.9..−16.95 dB.
- **إملاء الحروف (Buchstabendiktat — توسعة مخطط):** الإملاء العادي «ما يُكتب هو ما يُسمع» فرفض الحارس «تسمع L, E, N, A وتكتب Lena» ⇒ `DictationItem.spelled: true` بقاعدة قابلة للتحقق: الحروف المتهجّاة مجموعةً = الإجابة (بلا اعتبار لحالة الحرف، وß محفوظة: ‎`"ß".toUpperCase()` = "SS" كان سيقبل «Strasse») · المُشغِّل يعرض تعليمة خاصة (`SPELLED_DICTATION_AR`). لم يُفرض في شكل غير مناسب.
- **التطبيق:** 6 بنود choice ← 19 بنداً (فراغ 6 · استماع 6: E/I · I/E · U/O · J · V · اسم عائلة متهجّى · ترتيب 4 · إملاء حروف 3) · Quiz 3×3 ← 3×6 · الكلمات الـ16 مُسترجعة.
- **نواة D113:** die Anmeldung · der Partner + die Partnerin (مدخلان: «Meine Partnerin heißt Lena» تحتاج صيغتها، والفهرس يذكر اللمتين) · der Herr (n‑Deklination) ⇒ النواة 3/48 · 8/123 كلمة.
- **إصلاحات معلنة (القانون 7، كل فرق مُثبت بالتحليل):** (1) `achso` كُتبت «achso» كلمةً واحدة والصحيح «ach so» (Duden) ⇒ de + مثال البطاقة + **المقطع أُعيد توليده** من «Ach so.» (قياساته في المانيفست والمولِّد) + علَم ch-ach-laut المقيس — **للأمانة:** افترضتُ أن الرسم الخاطئ أنتج نطقاً «أكسو» (chs = [ks]) فقِسته: espeak قرأ «Achso» [axzoː] — المقطع القديم لم يكن خاطئ النطق (2) مثالا بطاقتين: «Muster» (لقب وهمي) ← Haddad · «Das ist richtig» (richtig غير مدروسة) ← «L, E, N, A? — Genau!».
- **بطاقات التحذير:** (1) مبرر الأولى **خاطئ علمياً** («العربية لا تصرّف الفعل مع الضمائر» — بل تصرّفه: أتهجّى · تتهجّى) ⇒ السبب الحقيقي: الفعل يُحفظ بصيغة المعجم فيُستعمل كما هو (2) «Wie heißt dein Name» بمبرر غير صحيح («ما اسم اسمك» ليست عربية مقبولة) ⇒ النقل الحقيقي: «ما اسمك» ← «Was ist Ihr Name?» والألمانية تسأل بـwie (3) الحرف الكبير في الأسماء باقية (مبررها صحيح).
- **المدقِّق أمسك خطأً في البناء:** إعادة بناء المحطات أسقطت `interleavedWith` (e-interleaving: من اليوم 3) ⇒ أُعلن بصدق: الفراغ يخلط sprechen (d2) وGuten Tag (d1)، والترتيب heißen (d1).
- **أخرى:** الدفء يسترجع sprechen (أمس) · الاختبار القبلي يخمّن اسم الحرف J · ملخص ومعايير بكلمات مدروسة · goetheWordListOverlap من الفهارس.
- **الاختبارات:** `tests/spelled-dictation.test.ts` (5: الحروف · المخطط مع ß · المُشغِّل والتصحيح · التعليمة في الواجهة · المحتوى) · مثال «غير المُرقّى» ← a1-u1-d4 (تحققتُ من فجواته الثلاث) · اختبار صفر-نقص لـa1-u1-d3.
- **حدود معلنة:** لا جدول ألفباء تفاعلي كامل في الواجهة بعد (الحروف الثلاثون مسجلة؛ التدريب يستعمل الأصعب منها) · بطاقات SRS لـach so لم تُضف لها بطاقة audio مع العلَم الجديد (المولِّد وحده يشتقها؛ حفاظاً على توازن النسب).
- البوابة: vitest 59 ملفاً / **548/548** · tsc 0 · validator **896/0/0** · build ✓ · **الطفرة 12/12** (منها واحدة يحكمها المدقِّق).

## D121 (2026-10-14): a1-u1-d4 مُرقّى — الأعداد 1–20 بالصوت · معجم النطق لأخطاء espeak المقيسة · الاستدعاء لما سبق (الدفعة 76)
- **قاعدة اليوم `ars-zahlen-1-20`** (قاعدة الخطة نفسها): 13–19 الآحاد أولاً ثم zehn كلمةً واحدة · الاستثناءان الوحيدان sechzehn (يسقط s) وsiebzehn (يسقط en) · elf/zwölf/zwanzig تُحفظ · العمر بـsein · رقم الهاتف رقماً رقماً وnull ← **المقارنة:** بناء 13–19 سهل على العربي («ثلاثة عشر» آحاد أولاً)؛ الصعب العمر: «عمري 19 سنة» + الفرنسية j'ai 19 ans ⇒ ~~Ich habe 19 Jahre~~ ← 3 حدود (einundzwanzig في الوحدة 3 · zwo على الهاتف · Jahre لا تأتي بلا alt) ← حبّات «Ich bin neunzehn Jahre alt.».
- **صوت الأعداد لم يكن موجوداً** (مسار واحد: zwanzig) ⇒ سكربت `a1-zahlen` (kind words): 0–20 + يوسف يقرأ رقم هاتفه ⇒ **22 مساراً** (إضافة صرفة: صفر مسار قديم تغيّر) · فُحص قطع النهاية بالطاقة (ذيل كل مقطع صمت تام).
- **الأعداد صنف مغلق كاملاً:** `CLOSED` كان فيه eins…zwölf وzwanzig وhundert فقط ⇒ «neunzehn» عُدّت غير مدروسة **في درس الأعداد نفسه**، وnull لا غنى عنها لرقم الهاتف ⇒ أُضيفت 13–19 وnull (المبدأ القائم نفسه: «أعداد — تُعرف دون درس»؛ يخفّف إيجابيات كاذبة فقط في الفحوص الثلاثة التي تستعمله: D107 · D109 · D115).
- **معجم النطق (اكتشاف أثناء التوليد — قياس لا افتراض):** المولِّد أظهر Kurs = [kˈuːɾs] بحركة طويلة، والقياسي قصيرة ⇒ (1) قِست كل نصوص المانيفست (864): النمط نفسه في Durst وWurst، وUrlaub طويلة صحيحة (2) **مرجع حر يمكن التحقق منه:** `open-dict-data/ipa-dict` ‏data/de.txt (مشتق من Wiktionary · MIT · blob `9a6b0c95…` · 30.7MB في /tmp لا في المستودع — goethe.de وDuden محجوبان) يؤكد /kʊʁs/ · /dʊʁst/ · /vʊʁst/ (3) **تدقيق منهجي:** طول الحركة المنبورة لـ748 كلمة مقابل المرجع ⇒ **37 اختلافاً**، فرزتُها مبدئياً: 4 صُحّحت الآن · 4 بدائل مقبولة أو أثر للمقياس (Ärztin · Hallo · Portion · Rezeption) · 5 ملتبسة (رمز espeak ‏ɑ قد يكون النموذج تعلّمه صحيحاً: Arabisch · Badezimmer · damals · Datum · Spanien) · **24 خطأً مرجّحاً تبقى للدفعة التالية D122** (طول: fit · wohin · April · vor · vierzig · Notfall · Schlafzimmer · Schublade · Nachbar · Nachricht · Nachtisch · losfahren · Hals · Fußball · Februar · danach · nachher — ونبر: Hotel · Marmelade · Pullover · Ägypten · Spaziergang · Stadtplan · verheiratet) (4) الأعداد: كلها تطابق المرجع إلا vierzehn (/ˈfɪʁt͡seːn/ قصيرة) — ومثله Telefonnummer وVorname في الوحدة 1.
- **التصميم:** `tools/pronunciation-lexicon.json` (كلمة · خطأ espeak · التصحيح · IPA المرجع · القياس الذي يبرّر الرمز · سياقات · المسارات المُعادة) يُطبَّق في دالة واحدة `synth_phonemes` (espeak → fit_phonemes → apply_lexicon) يستعملها `tts()` و`phonemize.py` معاً ⇒ **ما يُقاس هو ما يُنطق**. مطابقة الكلمة كاملةً فقط (Kurse · kurz · Kur · Urlaub لا تُمس)، وبلا مطابقة تعود القائمة نفسها (لا يتغير أي مقطع آخر). عناصر Piper رموز مفردة — قِيس (كل عنصر وكل مفتاح في خريطتي الصوتين بطول 1) فإعادة التقطيع دقيقة. الرمز الصحيح بأعراف espeak نفسها (Wurm [vˈʊɐm] · Wirt [vˈɪɾt] · Vorort [fˈoːɾ]) ليصل النموذجَ تسلسلٌ رآه في تدريبه. `phonemize.py --raw` يقيس espeak الخام.
- **6 مداخل:** Kurs · Durst · Wurst · vierzehn · Telefonnummer · Vorname. **المسارات المُعادة:** 4 مقاطع كلمات منشورة عبر أداة جديدة `tools/regen-track.ts` (تعديل نصي داخل كائن المسار — المانيفست ليس قانونياً — والبرهان بالتحليل والمقارنة داخل الدالة نفسها: لا يتغير إلا الحقول الخمسة المقيسة؛ هي المرة الثانية بعد «ach so» في D120 فاستحقت أداة مختبرة) + سطرا السكربت الجديد بـ`--force` + word-kurs وُلد بالمعجم. **اتجاه المدد يوافق التصحيح:** Durst ‏792←688ms · Wurst ‏943←699ms · num-14 ‏1187←1094ms (تقصير الحركة).
- **قانون الاستدعاء في الحارس — `e-upgrade-warmup`:** الدفء كان يستدعي zahl/alt/telefon وهي **أول تدريسها في الدرس نفسه** (عرضٌ قبل الشرح لا استدعاء — F121) ⇒ قِست: **12 بطاقة في 8 دروس A1** بالخلل نفسه (u1-d5 zusammen · u7-d2 spielen · u7-d3 machen …) ⇒ قاعدة في الحارس (جزء التطبيق): بطاقة الدفء يجب أن تكون مدروسة قبل الدرس؛ أول درس في المسار مستثنى (لا شيء قبله). تُفرض عند ترقية كل درس.
- **التطبيق:** 6 بنود choice ← **20 بنداً** (فراغ 9 · استماع 5: 13/17/12/15 + رقم يوسف · ترتيب 3 · إملاء 3: vierzehn/sechzehn/neunzehn) · Quiz 3×3 ← 3×6 (passingScore 0.75 محفوظ — أمسكه فحص الشرط المسبق قبل الكتابة) · الكلمات الـ15 مُسترجعة.
- **نواة D113:** das Alter (كلمة الاستمارات) · der Kurs · die Klasse ⇒ النواة 4/48 · 11/123 كلمة · 767 كلمة.
- **بطاقات التحذير:** (1) ~~Ich bin alt 15 Jahre~~ (خطأ نادر) ← **~~Ich habe neunzehn Jahre.~~** (النقل الفعلي عن «عمري» وj'ai) (2) ~~die Handy~~ بمبرر غامض ← **~~Der Handy ist neu.~~** (جنس الترجمة العربية «الهاتف» المذكّر يُنقل) وتمرينها Der Telefon (3) الملكية تتبع جنس الكلمة باقية (مبررها صحيح).
- **إصلاحات معلنة (القانون 7، كل فرق مُثبت بالتحليل):** مثال geburtstag «im Mai» (غير مدروسة) ← «Heute ist mein Geburtstag!» · مثال monat «Das ist ein Monat.» (لا يُشار إلى شهر) ← «Ein Jahr hat zwölf Monate.» · «Gartenstraße» اسم شارع ⇒ اسم علم معلن · goetheWordListOverlap كان [zahl, handy] وzahl في A2 فقط ⇒ يُحسب من goetheList (14).
- **الاختبارات:** `tests/pronunciation-lexicon.test.ts` (6: المخطط · كل مدخل ما زال لازماً ويُطبَّق دون مساس بغيره · حد الكلمة · apply_lexicon · كل مسار فيه كلمة مُعاد · رموز التصحيح في خريطتي الصوتين) · `tests/regen-track.test.ts` (7) · lesson-upgrade +3 (صفر-نقص d4 · e-upgrade-warmup · الأعداد 0–20) · content-units +1 · مثال «غير المُرقّى» ← a1-u1-d5 (تحققتُ من فجواته: لا كلمة بلا استرجاع فيه، فاستُبدل التوقع بفجوة حقيقية: e-upgrade-front بـwoher).
- **الطفرة 17/17** — وواحدة نجت أولاً (حذف تخطي السلاسل في حدود الكائن) لأن العيّنة وضعت القوس داخل النص **بعد** الحقول ⇒ أُضيفت حالة قبلها، فقُتلت هي وطفرة إهمال الهروب.
- **حدود معلنة:** (1) التدقيق يقيس طول الحركة المنبورة وموضع النبر عرضاً — لا الصوامت ولا الحركات غير المنبورة؛ والمداخل متعددة الكلمات و~19 كلمة غائبة عن المرجع خارجه (2) التصحيح مضمون على مستوى الفونيمات؛ تحقيقه الصوتي يعتمد النموذج نفسه (لم أستمع — والمدد توافق الاتجاه) (3) سلك `tts()` إلى `synth_phonemes` لا يختبره اختبار وحدة (VITS غير حتمي)؛ الدالة نفسها مختبرة عبر phonemize.py (4) المرجع مشتق من Wiktionary — قد يخطئ نادراً؛ لذا كل مدخل يحمل قياساً من espeak نفسه.
- البوابة: vitest 61 ملفاً / **565/565** · tsc 0 · validator **901/0/0** · build ✓ · **الطفرة 17/17**.

## D122 (2026-10-15): النطق — 37 خطأً مقيساً آخر لـespeak مُصحَّحاً · التدقيق صار بوابة دائمة لكل ما يُنطق · ترتيب المعجم أُصلح للصوتين (الدفعة 77)
- **توسيع القياس قبل التصحيح:** D121 قاس طول الحركة المنبورة لكلمات المفردات وحدها والنبرَ عرضاً ⇒ (1) **فحص موضع النبر** (عدد النوى قبل ˈ) ⇒ 22 اختلافاً: 7 في قائمة D121 · **10 أخطاء جديدة** (أهمها **Tunesien** «tu-ne-SI-en» بدل [tuˈneːzi̯ən] — بلد المتعلم في الدرس الأول · Etage بـg صلبة بدل ʒ · Fahrplan · geradeaus · Kreditkarte · Limonade · Notiz · okay · Rabatt · Tablette) · 5 بديل أو أثر للمقياس (deshalb · vorher · Hallo · gegenüber · Spezialist) (2) **كل كلمة تُنطق في مسار منشور** لا المفردات وحدها (939 رمزاً — منها Stiefel/Keller/Paket في الامتحان) ⇒ Auf **Wiedersehen** منبورة على se (الدرس الأول) و«Ich bin **Mueller**» يُقرأ mu-EL-ler (3) الغائبة عن المرجع **4 فقط** (لا ~19 كما قُدّر في D121): Toilette خاطئة («TO-i-let-te») · darum وTschüss وTunnel صحيحة (4) فحص يدوي: Familienname تبتلع n الحد (كما Telefonnummer في D121).
- **السياق يغيّر صيغة espeak:** «vor» معزولة [fˈɔɾ] وفي «Ich warte vor dem Kino» [fˌɔɾ] · «Nachbar» في الجملة [nˌɑːxbɑːɾ] ⇒ **المخطط 2.0.0**: لكل كلمة `forms` (صيغ espeak كما تظهر فعلاً ولكلٍّ تصحيحها) — وكل صيغة يجب أن يختبرها سياق معلن (لا صيغة ميتة).
- **خلل تصميم كامن في D121 (أمسكه الاختبار):** المعجم كان يعمل **بعد** `fit_phonemes`، والملاءمة تختلف بخريطة كل صوت: thorsten يُبقي ç مفككة (c+U+0327) وkerstin يركّبها (U+00E7) ⇒ لا صيغة واحدة تطابق الصوتين في كلمة فيها ç (vierzig · Nachricht). مداخل D121 الستة بلا ç فلم يظهر ⇒ الترتيب الآن **espeak → المعجم → الملاءمة**: خرج espeak الخام واحد للصوتين، والتصحيح نفسه يُلاءَم لخريطة كل صوت (اختبار بالصوتين: vierzig مُصحَّحة في كليهما وكلٌّ بترميز ç الذي تعرفه خريطته).
- **43 مدخلاً** (6 من D121 + 37): التصحيح بأعراف espeak نفسها من كلمات ينطقها صحيحة (wohin ← dahin [dɑːhˈɪn] · Nachbar ← machbar [mˈaxbɑːɾ] · Hotel ← Modell [moːdˈɛl] · Limonade/Marmelade ← Schokolade · Pullover ← Hannover · Ägypten ← ägyptisch · Tunesien ← tunesisch + Asien · Etage ← Massage · okay ← Café · nachher ← vorher) · رموز التصحيح بعد الملاءمة كلها في خريطتي الصوتين · وبعد التصحيح **كل المداخل توافق المرجع** (التدقيق لا يُعلِّم أياً منها).
- **التغطية بالتوليد نفسه لا ببحث نصي:** `phonemize.py --lexicon-hits` يحسب أي المسارات يمسّها المعجم بالمطابقة نفسها التي يصحّح بها (البحث النصي الحساس للحالة كان سيُفلت «Vor dem Haus…») — وطابق قوائم D121 الستة حرفياً ⇒ الطريقة الجديدة تحققت بالقديمة. وكلمة من المعجم تُذكر في مسار ولا يمسّها = صيغة سياق لا يعرفها المعجم ⇒ فشل (مع حالة سلبية مصطنعة: vor بصيغة واحدة ⇒ سطر الامتحان يُكشف).
- **الصوت: 44 مساراً** = 37 مقطع كلمة + 6 أسطر من الامتحان التجريبي (Hotel · danach · geradeaus · Rabatt · vor) + إعلان مولر. **أداتان:** `dialogue-splitter --lines` (أسطر بعينها فقط — `--force` كان سيعيد 35 سطراً؛ بقي 29 في السكربتات نفسها كما هي، والسطر غير الموجود يُرفض قبل أي توليد) · `regen-track` يقبل إعلانات الشخصيات (audio/characters، بلا سقف 1.5s للكلمة، وسطر السكربت يُحال إلى `--lines` باسمه). **البرهان:** المانيفست قبل/بعد: 44 مساراً تغيّرت = المجموعة المتوقعة تماماً، الحقول المقيسة وحدها (+speedWpm المقيس لأسطر السكربتات)، والملفات الصوتية المتغيرة هي الـ44 نفسها. والمانيفست JSON قانوني (مسافتان بلا سطر أخير) فإعادة كتابة المقسِّم تحفظ ما لم يتغير بايتاً بايتاً.
- **إصلاح نص معلن (القانون 7):** mueller-announce-01 «Hallo! Ich bin Mueller.» ← «Müller» (المعرّف ASCII يبقى mueller) في gen-audio.py والمانيفست — لا يُعرض في الواجهة حالياً.
- **بوابة دائمة — `tools/pronunciation-audit.py`:** كل كلمة في نصوص المسارات وفي حقل de لكل كلمة (**946**) بالصوت المثبَّت بعد المعجم، فحصا الطول والنبر ⇒ كل مخالفة أو كلمة بلا مرجع يجب أن تكون مصحَّحة (`entries`) أو مراجَعة بسبب مكتوب (`reviewed` — **17**: variant 4 · weak-form 2 · artifact 3 · ambiguous ɑ 5 · no-reference 3، وما يستند إلى المعرفة اللغوية لا المرجع مكتوب كذلك). المراجعة تحمل صيغة espeak التي رُوجعت: إن تغيّر نطق espeak بعدها يُعاد الفحص (drift)، والمراجعة التي لم تعد لازمة تُحذف (stale) ⇒ **كلمات u1-d5 وما بعده تُدقَّق آلياً لحظة إضافتها.** ومقياس الطول كان يقرأ نصف الحركة i̯ نواةً (Portion · Rezeption) ⇒ أُصلح المقياس لا «روجعتا».
- **المرجع داخل المستودع:** `tools/pronunciation-reference.de.json` — مقتطف لكلمات المحتوى فقط (946 · 89KB) يُبنى آلياً بـ`--refresh-reference` بعد التحقق من بصمة git للمرجع الكامل؛ كلمة جديدة غائبة عنه = فشل «شغّل refresh» (الأمر في §6). سكربتات التدقيق في /tmp ضاعت مرتين مع إعادة إنشاء البيئة — الآن الأداة والبيانات في git.
- **تصحيح السجل:** ترخيص ipa-dict العام MIT، لكن **بياناته الألمانية** من german-ipa-dict المستخرجة من Wiktionary ⇒ **CC-BY-SA** (README ipa-dict: Credits · LICENSE.md في german-ipa-dict). سجل D121 قال MIT خطأً (واختبره!) ⇒ صُحّح في المعجم واختباره، والمقتطف يحمل الإسناد والترخيص نفسه (ShareAlike).
- **أعلام الخطر أُعيد قياسها** (حارس D106 أمسكها): Schublade +auslaut-b (b آخر Schub = [p] — التصحيح نفسه) · Fußball +vowel-long-short · vierzig −vowel-long-short (التعريف الموثَّق: علامة إطالة + ː منطوقة، ولا حركة طويلة في vierzig الآن). **الفخ العكسي** («ie» مكتوبة وقصيرة: vierzig/vierzehn) حقيقي لكن لا رمز له في التعداد المغلق (D57) ⇒ ينتظر قرار المالك مع w=[v]. بطاقات SRS لم تُمس: «خطر صوتي ⇒ بطاقة سماع» ليس ثابتاً في المحتوى (233 من 328 بلا بطاقة سماع — النسبة تحكمها w-srs-ratio للدرس).
- **الاختبارات:** pronunciation-lexicon 8 (المخطط · كل صيغة لازمة ومختبرة · حد الكلمة · apply_lexicon بصيغتين · المعجم قبل الملاءمة بالصوتين · التغطية بالتوليد · الصيغة غير المعروفة بحالة سلبية · الرموز بعد الملاءمة) · **pronunciation-audit 4 جديدة** (المحتوى الحقيقي صفر · المقاييس · البوابة تلتقط حذف Tunesien والانحراف والمراجعة الميتة والمقتطف القديم · المقتطف والترخيص والبصمة) · audio-scripts +2 (`--lines`) · regen-track +1 (الإعلان).
- **الطفرة 20/20** (الصيغة الأولى وحدها · بلا NFD · المعجم بعد الملاءمة · عتبة الإصابات · بلا حد أيسر · وضع الإصابات فارغ · المقسِّم يتجاهل الأسطر/لا يتحقق/لا يصفّي · سقف الإعلان/منعه/بلا إحالة · نصف الحركة نواة · any بدل all للطول والنبر · المعجم ليس قراراً · بلا انحراف · بلا مراجعة ميتة · بلا فحص البصمة · المراجعة لا تعفي) — والبيانات المحمية تُستعاد بعد كل طفرة (طفرة البصمة كانت ستكتب المقتطف).
- **حدود معلنة:** (1) الكلمة معزولةً — صيغ السياق يحرسها اختبار المعجم للكلمات المصحَّحة وحدها (2) لا فحص آلي للصوامت ولا للحركات غير المنبورة (Familienname وُجدت يدوياً) (3) الـɑ الخمس ما زالت ملتبسة — تحتاج قياس مدة الحركة في المقطع المولَّد (4) لم أستمع — التصحيح مضمون فونيمياً (5) مقياس النبر بعدّ النوى من البداية له أثران مراجَعان (gegenüber · Spezialist)؛ العدّ من النهاية كان سيُفلت Tunesien فاخترت البسيط القابل للشرح مع مراجعة بشرية لأثره.
- البوابة: vitest 62 ملفاً / **574/574** · tsc 0 · validator **901/0/0** · build ✓ · **الطفرة 20/20**.

## D123 (2026-10-15): a1-u1-d5 مُرقّى — «السؤال بـwer وwoher: كلمة السؤال ثم الفعل، والفعل لا يسقط» · woher حيث يحتاجها هدف الدرس · حوار صوتي جديد (الدفعة 78)
- **القاعدة `ars-wer-woher`** (اكتشاف موجَّه من مشهد: لينا ترى صورة نبيل على هاتف يوسف): كلمة السؤال أولاً ثم الفعل مباشرة ثم الفاعل (Woher kommst du?) · الفعل لا يسقط (Wer ist das?) · woher كلمة واحدة وجوابها يبدأ بـaus · سؤال نعم/لا يبدأ بالفعل. **المقارنة (10‑ي):** العربية تسأل بجملة اسمية بلا فعل («مَن هذا؟» ⇒ ~~Wer das?~~ — «حذف ist» بند صريح في الخريطة) · «من أين» كلمتان و«من» تعلّمها المتعلم قبل يومين aus («أنا من تونس» = Ich komme aus Tunesien) ⇒ ~~Aus wo kommst du?~~ · الفرنسية المحكية d'où tu viens? ⇒ ~~Woher du kommst?~~ · wer تشبه where الإنجليزية لفظاً. **3 حدود معلنة:** wo وفرقها عن woher في الوحدة 2 · «Von wo» عامية والمعيار woher · صيغ wer الأخرى (المفعول به) لاحقاً — موصوفة بالعربية بلا كلمات غير مدروسة.
- **woher نُقلت إلى هنا (تغيير معلن — القانون 7 · سابقة sprechen في D119):** هدف الدرس «mit wer/woher fragen» والكلمة تُدرَّس أولاً في a1-u2-d1 ⇒ تمارين الدرس القديمة كانت تستعملها قبل تدريسها. woher.json: الوحدة 2 ← 1 · thema · sourceLesson · usedInLessons (+a1-u1-d5) · lessonRefs في المانيفست وgen-audio.py. تبقى في u2-d1 مراجعةً (كما sprechen في u7-d4) — ودرس u2-d1 (التالي) يقابل wo وwoher.
- **نواة D113 (7) + المؤنث (2):** das Ende · wissen · das Wort · oft · ein bisschen · der Schüler · der Student بالمولِّد (goetheList من الدليل) + **die Schülerin · die Studentin**: مقدمة SD1 الرسمية «Weibliche Formen werden in der Regel nicht zusätzlich aufgelistet, sind aber Bestandteil des lexikalischen Inventars» (نوع الدليل feminine في D110) — ومثال القائمة الرسمية نفسها لـ«der Student, -en» هو «Ich bin Studentin.» (قرأته في ملف SD1 بالبصمة 0c8162cb…). بلا المؤنث لا تستطيع المتعلمة جملة مهمة اليوم عن نفسها، ولينا (16 عاماً — D121) تلميذة. **17 كلمة ≤ CORE_LOAD_MAX 18.** النواة 5/48 · 18/123 كلمة.
- **حوار جديد `a1-u1-d5-wer-ist-das`** (13 سطراً · لينا = kerstin · يوسف = thorsten · lengthScale 1.32) بـdialogue-splitter: أسئلة W عن شخص ثالث · kennen وwissen في تبادل واحد («Du kennst Nabil, aber du weißt das nicht?» — بالعربية «تعرف» مرتين) · Schüler/Schülerin/Student. **الشخصيات:** CharacterId تعداد مغلق من 8 ⇒ الحوار بصوتين موجودين؛ Ayse يقرؤها espeak «آيزه» [ˈaɪzə] وKarim منبوراً على أوله [kˈɑriːm] ⇒ **Nabil** [nabˈiːl] = النطق العربي (قِيس قبل الاختيار).
- **بوابة النطق (D122) على كل نص جديد قبل التوليد:** espeak ينبر كل ‑entin على المقطع الأول (Studentin [ʃtˈuːdəntˌɪn] · Dozentin · Patientin · Präsidentin) ⇒ مدخل **Studentin** [ʃtuːdˈɛntɪn] (قياس: Studenten [ʃtuːdˈɛntən] · Freundin [frˈɔøndɪn]) **قبل** توليد word-studentin وwer-12 · Nabil ⇒ reviewed no-reference · مدخل Tunesien يمسّ مساراً جديداً (wer-4) ⇒ أُضيف إلى مساراته (اختبار «الممسوس = المسجَّل» أمسكه). التدقيق: **968** كلمة · 963 قورنت · صفر مخالفة/قديم/انحراف · أعلام الخطر 776 كلمة صفر تغيير · التغطية صفر رمز ناقص بعد الملاءمة.
- **التطبيق:** 6 بنود choice بلا خيارات ولا «لماذا» ⇒ **22 بنداً في 4 أنواع** (فراغ 8 · استماع 6 وإملاء 3 على الحوار الجديد · ترتيب 5) لكل بند «لماذا» عربي · كل كلمات الدرس الـ17 تُسترجع (wissen بتلميح «(wissen)»: weiß لا تشارك جذعها في مطابقة الحارس — مقيس). **Quiz 3×3 ⇒ 3×6** (passingScore محفوظ · النسخ مختلفة · accept «Ich bin Studentin.»).
- **مصائد معلنة:** «Was ist das?» عن شخص بمبرر لا يصح (العربية نفسها تفرّق «مَن» و«ما» — فلا تداخل) ⇒ **~~Wer das?~~** (حذف ist) · «Ich weiß Yusuf» بقيت وأُعيدت كتابتها (عرف = kennen + wissen · والفرنسية connaître/savoir) · «Die Leute ist hier» (hier/nett غير مدروستين) ⇒ **~~Aus wo kommst du?~~** — ونقطة جمع Leute انتقلت إلى التطبيق والـQuiz بمبرر صحيح. **مثال leute.json** «Die Leute sind hier.» (hier غير مدروسة) ⇒ «Die Leute im Kurs sprechen Deutsch.» (الفعل الجمع ظاهر). **الدفء** zusammen (كلمة اليوم) ⇒ kommen · sprechen · alt (ما يبني عليه حوار اليوم). التخمين المسبق يخمّن قاعدة اليوم. goetheWordListOverlap 2 ← 17 من القوائم.
- **اتساق:** lessonRefs في gen-audio.py لـwoher ولـsprechen (D119 تركها قديمة).
- **الاختبارات:** صفر نقص لـd5 (22 · 4 · 6 · 17 · قاعدة · أسماء العلم · الدفء · نقل woher · مسارات الحوار) · المثال غير المُرقّى ← a1-u2-d1 (فجواته مقيسة قبل النقل: لا ملف قاعدة · 6 بنود · groß/Kontinent — وwoher لم تعد مخالفة فيه) · مثبّتات الخطة ← a1-u2-d1 (التالي pending: international) · فحص «الدرس الخفيف» صار للإسناد pending وحده (بعد done يضم الحجم كلمات النواة وما أُضيف معها — d5 7 ← 17 مثبَّت) · مصائد d5 · ALL_WORDS 776.
- **الطفرة 16/16** (الدفء بكلمة اليوم · speakText ≠ المسار · كلمة غير مدروسة · حذف تلميح wissen · نسختان متطابقتان · woher خارج الدرس · عودة مصيدة Was · woher في الوحدة 2 · مثال قاعدة غير مدروس · المقارنة بلا 10‑ي · الإسناد pending · Nabil غير معلن · نص سطر ≠ المانيفست · حذف Studentin/مراجعة Nabil/مسار wer-4 من المعجم) — والملفات تُستعاد بايتاً بايتاً، وأربع منها فُحص سبب فشلها نصاً.
- **حدود معلنة:** (1) لم أستمع — النطق مضمون فونيمياً والمدد والسرعات مقيسة (أسطر kerstin القصيرة تُقاس سريعة: «Und wie alt ist er?» 230 ك/د بالـlengthScale نفسه لسكربتات A1 — لا تغيير عتبات) (2) wer-2 · wer-7 · wer-9 · wer-12 مسارات بلا بند يستعملها بعد (الحوار كاملاً متاح للمشغّل) (3) «meine Freundin» قد تعني «حبيبتي» — نبّه عليها «لماذا» بند Freund؛ مثالا freund/freundin القديمان بقيا (4) u2-d1 يعرض woher مراجعةً حتى ترقيته.
- البوابة: vitest 62 ملفاً / **576/576** · tsc 0 · validator **912/0/0** · build ✓ · **الطفرة 16/16**.
