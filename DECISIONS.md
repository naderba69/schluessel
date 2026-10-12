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
