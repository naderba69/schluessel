## الإضافات — الدفعة 55 (2026-10-12) — تقارير التقدم (D99)
- **طبقة التقارير**: أسبوعي + شهري (معايرة F160) + سطر الخريطة — فوق progress-engine.
- **265/265 أخضر** + البوابة كاملة ✓. التالي: A2 (بعد ملف kerstin).

## الإضافات — الدفعة 54 (2026-10-12) — بنية صوت المرأة (D98)
- **PINNED_VOICES + VOICE_ID_FEMALE + أدوار الحوار** + قاعدتا validator + gen-audio موجّه (fallback آمن).
- **صوت kerstin (MIT)**: يُنزَّل مالكياً عبر Termux ويعمل فوراً. الأمر التالي: تنزيل المالك ثم A2 يُغلق.

# PROGRESS.md — سجل الإنجاز (مختصر — التفاصيل في STATE.md)

## 2026-10-09 — المعلم 0 مُغلَق ✅ (الدفعة 5 + S0.12)
- S0.9 ✅: Piper محلي فعلي (CC0) + 5 ملفات Opus بقياسات حقيقية + G1 يفحص الملفات (وجود/طول/RMS/بصمة/ثبات الصوت) + اختبار الاستقرار بالتوقيع الطيفي (اكتشاف مقيس: VITS عشوائي — لا حتمية بايتية).
- S0.10 ✅: اختبار D16 كامل (243 محاولة Vosk محلي) → **قرار: البديل مُفعَّل** (FA 0% / FR 44.4% / 169ms) — asr-gate.ts مقفل + اختبار يعيد الحساب باستقلالية.
- S0.12 ✅: `docs/reports/m0-report.md` + تحديث DoD/DECISIONS (D16 نتيجة + D28) + zip تسليم.
- الحصيلة: **64/64 أخضر + tsc + G1 (10 ملفات/0 أخطاء) + build**.

## 2026-10-09 — المعلم 0، الدفعة 4
- S0.7 ✅ + S0.11 ✅: أول تشغيل بلا تموضع + الوحدة صفر 4+8 JIT + أول درس — 49 اختباراً.

## 2026-10-09 — المعلم 0، الدفعة 3
- S0.6 جزئي ✅ + S0.8 ✅ (PWA + قفل المسار + GenderBadge) — 39.

## 2026-10-09 — المعلم 0، الدفعة 2
- S0.4 ✅ (G1) + S0.5 ✅ (Dexie/backup) — 31.

## 2026-10-09 — المعلم 0، الدفعة 1
- S0.1–S0.3 ✅ (repo/zod/D18) — 15.

## القادم
المعلم 1: خطة + DoD ثم جلسة 120 دقيقة كاملة على A1 حقيقي (Netzwerk neu K1 وفق D15).

## دفعة M1-أ (2026-10-10) — بداية الإنتاج
- إعادة تسمية المنتج: «مفتاح — Schlüssel» في manifest/شاشة الترحيب/index.html (D32) — «رحلة يوسف» داخلي فقط (D31).
- محرك الحصة E01 (src/lib/lesson-engine.ts): 120 دقيقة متصلة، 4 محطات 15/40/50/15، قفل اتجاه، حارس F121 (محاولة قبل كشف).
- محرك المدرب E02 (src/lib/coach-engine.ts): 12 نوع مهمة = الأفكار الـ12 + الحراس (30–180ث، ≤20د/يوم، الأحد راحة، لا جديد خارج الحصة).
- محرك اليوم E06 (src/lib/day-engine.ts): خطة اليوم (أخطاء ذهبية ← مستحقات ← جديد) + حارس «لا جلسة بلا استرجاع».
- الاختبارات: 76/76 أخضر (كانت 64) + tsc + validator (10 ملفات/0 أخطاء) + build.
- برومت الاستمرارية الاحترافي أُنشئ (يُحدَّث مع كل دفعة — أمر المالك).

## دفعة M1-ب (2026-10-10) — E03 + E04 + الجولة الإلزامية + الدقائق الثلاث
- محرك المراجعة E03 (`src/lib/review-engine.ts`): ربط SRS بمحطة الاسترجاع — تحويل SrsCardState ↔ ts-fsrs v5 (بلا فقد) + جدولة §2.5 (نسيت/صعب/جيد/سهل ← FSRS بمعاملات D6 الافتراضية) + طابور المحطة (جولة الأخطاء أولاً ← المستحقات ← مهارة اليوم؛ الجديد والمتأخر مستبعدان) + حراس: «لا جلسة بلا استرجاع أولاً» + مسار «محاولة ← كشف ← تقييم».
- محرك الأخطاء E04 (`src/lib/errors-engine.ts`): الدفتر الذهبي + التصنيف الثلاثي (§4: نظامي/هفوة/متحجر — آلي + زر يدوي) + المعالجة حسب النوع (نظامي: بطاقة SRS + 3 تمارين · هفوة «الخطأ العابر»: لا بطاقة + تمرين واحد · متحجر: Contrast Drills + مولر + متابعة أسبوعية) + الجولة الإلزامية (حارس لا يُتخطى) + قاعدة الدقائق الثلاث (F038: لا إعادة عرض قبل 3 دقائق).
- توفيق موثّق (D36): «كل خطأ → بطاقة» = قيد دفتر + جولة لكل خطأ، وبطاقة SRS للنظامي فقط (الدستور §4 أرقى).
- الاختبارات: 30 اختباراً جديداً (review-engine 14 + errors-engine 16) — **106/106** مع استعادة كاملة؛ في هذه البيئة 103/106 (3 صوتية — نموذج الصوت خارج نطاق الشبكة، لا خلل كود) + tsc + validator (10/0) + build.

## إضافة D37 (2026-10-10) — الصوت مُثبَّت في المستودع (قرار المالك)
- المالك رفع `de_DE-thorsten-medium.onnx` (+ .onnx.json) إلى main عبر سكربت `termux-upload-voice.sh` (blob عادي بلا LFS) — البصمة المثبّتة `7e64762d…bb7819` (63,201,294 بايت).
- النتيجة: **106/106 كلها خضراء فعلياً** (اختبارات voice-stability الخمس كلها تعمل — توليد حقيقي ومقارنة طيفية) + tsc + validator + build — بلا أي خطوة تنزيل مستقبلية.
- وصفة الاستعادة في برومت الاستمرارية v1.4 صارت: npm + pip فقط (الصوت في git).

## دفعة M1-ج (2026-10-10) — E05 + E07 + E08 + واجهة الحصة الكاملة (D38)
- محرك الصوت التفاعلي E05 (`src/lib/audio-engine.ts`): سرعات F044 (0.75×/1×/1.25×) + السلم السمعي F041 + دورة shadowing F005 + **حارس D16 مقفل** (لا حكم آلي على التسجيل — «لأذنك أنت» + التسجيلات محلية فقط).
- محرك النسخ المسموع E07 (`src/lib/dictation-engine.ts`): تدفق (استمع ← اكتب ← اكشف ← قارن) + مقارنة ثلاثية correct/minor/retry + تصحيح F077 اللطيف (يشرح لماذا — حارس feedbackIsGentle).
- محرك الدفء E08 (`src/lib/warmth-engine.ts`): تقرير مسائي سطر واحد F011 + معاينة الغد F012 + رسائل مولر المتنوعة + **حارس D23** (BLAME_WORDS — صفر سلاسل/صفر توبيخ في كل نص، مسح شامل يقفله).
- واجهة الحصة (`src/components/LessonSession.tsx`): 4 محطات 15/40/50/15 + 3 استراحات + قفل اتجاه (E01) + شاشة §2.5 + F121 + أدوات E05/E07/E08 — مربوطة في App بزر «ابدأ الحصة».
- **اكتملت محركات M1 الثمانية (E01–E08).** الاختبارات: 30 اختباراً جديداً (7+6+6+11) — **136/136 أخضر** + tsc + validator (10/0) + build.

## دفعة M1-د (2026-10-10) — اكتمال المعلم 1: محتوى A1 حقيقي + الحصة تعمل (D39)
- محتوى a1-u1-d1 كامل (Netzwerk A1 K1 — D15): 15 كلمة (12 جديدة بأعلام الخطر وجُمل مألفة) + 3 مصائد ذهبية + حزمة SRS كاملة.
- الصوت: 12 مقطعاً جديداً بالنموذج المثبّت (17 مساراً — قياسات حقيقية) + إصلاح تسريب «Reise Yusuf» من إعلان مولر وبطاقة الوحدة صفر (D31 → «Schlüssel»).
- `src/lib/lesson-runner.ts`: الدرس → شاشات المحطات الأربع (كلمة مفقودة = خطأ فوري · دفء فارغ = مرفوض F121).
- `src/components/LessonContent.tsx` + App: **الحصة الحقيقية تعمل** (استرجاع بطاقة-ببطاقة · جديد بمحاولة-قبل-كشف · تدريب بمحطاته · خلاصة بمصائدها وتقرير E08) + بطاقة الوحدة صفر JIT عند أول استخدام فعلي (§9).
- الاختبارات: 12 اختباراً جديداً — **148/148 أخضر** + tsc + validator (22 ملفاً/0 أخطاء) + build.

## دفعة M2-أ (2026-10-10) — محركات المهارات الأربع E09–E12 (D40)
- **E09 الاستماع المتقدم:** أزواج D16 + ضجيج تدريجي (ترقية ≥ 80%) + أخبار بطيئة (0.7→1.0) والنص أخيراً.
- **E10 النطق:** بطاقات r/ch/ü بمخارج D18 حرفياً + دورة قبل/بعد التسجيل — بلا درجات نطق (D16).
- **E11 القراءة:** قفل المفردات G1 على كل نص + ترجمة بالنقر بعد المحاولة + إضاءة متزامنة.
- **E12 الكتابة:** تصحيح يشرح «لماذا» إلزامياً + مصائد الدرس + جملة اليوم + يوميات — صفر لوم.
- الاختبارات: 23 اختباراً جديداً — **171/171 أخضر** + tsc + validator + build.

## دفعة M2-ب (2026-10-10) — محركات E13–E16 — **M2 مكتملة** (D41)
- **E13 القواعد:** اكتشاف موجّه بقفلين حقيقيين (لا كشف قبل المثال أو المحاولة) + حبّات الجملة + مقارنة عربية إلزامية.
- **E14 الشبكة:** إثراء كل كلمات الـ16 بعائلات وكولوكيشنات حقيقية + قصر ذهني + validator: لا كلمة بلا روابط.
- **E15 المهام:** المقهى/القطار/الصيدلية — كل مهمة بهدف تواصلي معلن (Ellis) + معايير نجاح معلنة.
- **E16 الثقافة:** 4 حقائق بمصادرها (لا حقيقة بلا مصدر) + أغنية ملكية عامة فقط + حدود صدق معلنة (needsWebVerify).
- الشفافية: مهلة صريحة 120 ثانية لاختبارات توليد الصوت (العتبات العلمية لم تُمسّ) + تذبذب VITS الموثّق يُعالَج بإعادة التشغيل.
- الاختبارات: 21 اختباراً جديداً — **192/192 أخضر** + tsc + validator + build.

## دفعة واجهات M2 (2026-10-10) — مختبر المهارات E09–E16 على الشاشة (D42)
- `src/components/SkillsLab.tsx`: ثماني محطات بشاشات حقيقية — القفل قبل المحاولة مطبّق واجهياً (ترجمة القراءة + كشف القاعدة) + الهدف أولاً في المهام + المصدر معلناً في الثقافة + «لا درجات» في النطق.
- App: زر «مختبر المهارات» بجانب الحصة.
- الاختبارات: 9 اختبارات UI — **201/201 أخضر** + tsc + validator + build.

## دفعة M3 (2026-10-10) — المحركات الستة E17–E22 (D43)
- **E17 البوابات:** كل 6 أسابيع + 4 مهارات + حدود صدق Goethe معلنة (needsWebVerify + عتبة داخلية معلنة).
- **E18 التقدم:** أشرطة من بيانات حقيقية فقط (رفض العدم) + منحنى نسيان Ebbinghaus + تقدير شهري صادق.
- **E19 التكيّف:** تجميد يحفظ الجداول كما هي + عودة موزّعة (spaced) + 5 أسباب + صفر لوم.
- **E20 الترفيه:** Wordle/قصة/لغز من مفرداتك المدروسة فقط + بلا مؤقت وبلا ضغط.
- **E21 البيانات:** تصدير JSON/CSV + بصمة sha256 + استعادة round-trip مطابقة — التلاعب = رفض فوري.
- **E22 الوصولية:** RTL + ليلي + تكبير + تركيز + تباين WCAG — كل أزواج الألوان الستة تجتاز AA.
- الاختبارات: 27 اختباراً جديداً — **228/228 أخضر** + tsc + validator + build.

## دفعة واجهات M3 (2026-10-10) — لوحة النظام E17–E22 على الشاشة (D44)
- `src/components/SystemLab.tsx`: ست شاشات (بوابة بتحذير الصيغة ظاهراً · تقدم بلا أرقام مزيّفة · تكيّف يحفظ الجدول · ألعاب بلا ضغط · نسخ احتياطي بزر التجربة المزوّرة · إعدادات بجدول تدقيق AA) + زر فتحها في App.
- الاختبارات: 8 اختبارات UI — **236/236 أخضر** + tsc + validator + build.

## حملة المحتوى — الدفعة 1 (2026-10-10) — الوحدة 1: d2 + d3 (D45)
- **d2** (بلاد + sein — 12 كلمة) + **d3** (تهجئة وكتابة — 12 كلمة) بمصائدهما الستة (كلها تُحيل خريطة 10‑ي) + خلط d3 (§3).
- الصوت: 24 مقطعاً جديداً — المانifest 41 مساراً · الكلمات 40 · الدروس 3 · `lesson-packs.ts` سجل كامل (ALL_LESSONS/ALL_WORDS) + مسار App منه.
- الاختبارات: 6 اختبارات محتوى — **242/242 أخضر** + tsc + validator (48/0) + build.
- **المحفوظ للحملة:** d4 (أرقام 1–20 + كتابة الاسم) · d5 (wer/woher + خلط — 7 كلمات) · d6 (توليف + معركة الوحدة) — ثم الوحدات 2–12.

## حملة المحتوى — الدفعة 2 (2026-10-10) — الوحدة 1: d4 + d5 (D46)
- **d4** (أرقام/عمر/هاتف — 12 كلمة: Zahlen + das Handy بجنسه المستعار + 15 Jahre alt) + **d5** (wer/woher + تعريف في 4 جمل — 7 كلمات: Frage/Antwort/kennen/Freund/Freundin/Leute/zusammen).
- مصائد d4/d5 الستة (جنس المستعار · الملكية والجنس · alt أخيراً · wer vs was · kennen vs wissen · Leute جمع) + خلط §3.
- الصوت: 19 مقطعاً — المانيفست **60 مساراً** · الكلمات **59** · الدروس **5**.
- النتيجة: **242/242 أخضر** + tsc + validator (69/0) + build — **الوحدة 1 تكتمل بـd6 (توليف + معركة) في الدفعة القادمة**.

## حملة المحتوى — الدفعة 3 (2026-10-10) — إتمام الوحدة 1 (d6) + بداية الوحدة 2 (u2-d1) (D47)
- **d6** (توليف — جسيمان: alles-klar/bis-morgen): العبر الثلاث (قوالب زمان · von/aus · woher) + **معركة أسطورة الوحدة 1 (70/30)** بعتبة **0.75** + تفريغ أخطاء (3 مصائد) + خلط §3.
- **u2-d1** (الوحدةة 2 — 12 كلمة): Länder جديدة (Österreich/Niederlande/Griechenland/Polen/Russland/Portugal + Europa/Welt) + wo/woher/hier/dort — مصائد: wo مكان/woher منشأ · Niederlande جمع · aus+Dativ.
- الصوت: 14 مقطعاً — المانيفست **74 مساراً** · الكلمات **73** · الدروس **7** (d1–d6 + u2-d1).
- النتيجة: **243/243 أخضر** + tsc + validator (85/0) + build — **الوحدةة 1 مكتملة** ✅. التالي: u2-d2..u2-d6 ثم الوحدات 3–12.

## حملة المحتوى — الدفعة 4 (2026-10-10) — الوحدة 2: u2-d2 + u2-d3 (D48)
- **u2-d2** (اللغات والسكن — 12 كلمة): إعادة تدريب مقصودة لـ6 كلمات (sprache/deutsch/englisch/arabisch/wohnen/langsam) + 6 جديدة (leben/stadt/haus/muttersprache/fremdsprache/wohnung) — مصائد: sprechen بلا von · العنوان in+Dativ · جنس المركّب.
- **u2-d3** (شفرة الجنس الاشتقاقية — أول ظهور — 12 كلمة): Zeitung/Rechnung (-ung=die) · Mädchen/Brötchen (-chen=das) · Kellner/Lehrer (-er=der) · Freiheit/Gesundheit (-heit) · Möglichkeit (-keit) · Freundschaft (-schaft) · Schmetterling (-ling) · Zentrum (-um) — مصائد: das Mädchen · die Lehrerin · die vier Endungen.
- الصوت: 17 مقطعاً — المانيفست **91 مساراً** · الكلمات **90** · الدروس **9** (d1–d6 + u2-d1..d3).
- النتيجة: **243/243 أخضر** + tsc + validator (104/0) + build. **الوحدتان 1 و2: 9 من 12 يوماً مؤلفة.** التالي: u2-d4 (Vokalquantität + ß/ss) ثم u2-d5 (محادثة) وu2-d6 (معركة الوحدة 2).

## حملة المحتوى — الدفعة 5 (2026-10-10) — إتمام الوحدة 2: u2-d4 + u2-d5 + u2-d6 (D49)
- **u2-d4** (الكتابة — 12 كلمة): ß بعد الحركة الطويلة (groß/heiß/Fuß/süß) وss بعد القصيرة (Tasse/essen) + الطول المكتوب (Kaffee ee · Boot oo · Käse ä · gehen h) + strasse (معاد استخدامها).
- **u2-d5** (حوار التعارف — 12 كلمة): vorstellen/kennenlernen/freuen/gern/nett/Gespräch/auch/oder/natürlich/Hobby/lesen/Musik — 6 تبادلات كاملة + مصائد الأفعال الانعكاسية والمنفصلة وgern.
- **u2-d6** (توليف + معركة الوحدة 2 — okay/super): حوار 6 تبادلات + تفريغ أخطاء الأسبوع (wo/woher · sprechen · das Mädchen) بعتبة 0.75.
- الصوت: 25 مقطعاً — المانيفست **116 مساراً** · الكلمات **115** · الدروس **12** (الوحدتان 1+2 كاملتان).
- النتيجة: **243/243 أخضر** + tsc + validator (132/0) + build ✓ (تحذير حجم حزمة >500KB — مقبول). التالي: **الوحدة 3 (الأرقام والوقت — 60 كلمة)**.

## حملة المحتوى — الدفعة 6 (2026-10-10) — الوحدة 3: u3-d1 + u3-d2 (D50)
- **u3-d1** (العد حتى 100 — 12 كلمة): zwanzig..neunzig + hundert + zählen/Ziffer/mal — مصائد: fünfundzwanzig مركّبة · sechzig/siebzig مختصرين · dreißig بالـß.
- **u3-d2** (حتى 1000 + الأسعار — 12 كلمة): tausend/Euro/Preis/kosten/billig/teuer/Geld/bezahlen/Karte/kaufen/nur/viel — مصائد: Wie viel kostet das? · bezahlen بلا für · der Euro.
- الصوت: 24 مقطعاً — المانيفست **140 مساراً** · الكلمات **139** · الدروس **14** (الوحدتان 1+2 كاملتان + الوحدة 3: يومان).
- النتيجة: **243/243 أخضر** + tsc + validator (157/0 — صفر تحذيرات) + build ✓. **استُبدلت بذرة a1-u3-d2 القديمة بالمحتوى الحقيقي.** التالي: u3-d3 (Uhrzeit: halb/viertel) ثم u3-d4..u3-d6.

## حملة المحتوى — الدفعة 7 (2026-10-10) — الوحدة 3: u3-d3 + u3-d4 (D51)
- **u3-d3** (كم الساعة — 12 كلمة): Uhr/Zeit/Stunde/Minute + halb/viertel + أوقات اليوم — مصائد: halb drei=2:30 · بلا um للتوقيت · Morgen/morgen.
- **u3-d4** (المواعيد — 12 كلمة): الشهور الستة الأولى + Termin/treffen/Verabredung/Montag/Sonntag/am — مصائد: um/am/im · الشهور der كلها · sich treffen.
- الصوت: 24 مقطعاً — المانيفست **164 مساراً** · الكلمات **163** · الدروس **16** (الوحدتان 1+2 + الوحدة 3: 4 أيام).
- النتيجة: **243/243 أخضر** + tsc + validator (183/0/0) + build ✓. التالي: u3-d5 (Hören: Zahlen/Uhrzeit) وu3-d6 (معركة الوحدة 3).

## حملة المحتوى — الدفعة 8 (2026-10-10) — إتمام الوحدة 3: u3-d5 + u3-d6 (D52)
- **u3-d5** (فهم المنطوق — 12 كلمة): hören/verstehen/schnell/laut/leise/Stimme/Ohr/Nachricht/Anruf/antworten/noch/mit — مصائد: ver- ملتصقة · antworten يجرّ · mit يجرّ. + «Noch einmal, bitte!» لإصلاح الاستماع.
- **u3-d6** (توليف + معركة الوحدة 3 — toll/klar): أرقام وأوقات ومواعيد منطوقة بعتبة 0.75 + تفريغ أخطاء الأسبوع.
- الصوت: 14 مقطعاً — المانيفست **178 مساراً** · الكلمات **177** · الدروس **18** (**الوحدات 1–3 كاملة**).
- النتيجة: **243/243 أخضر** + tsc + validator (199/0/0) + build ✓. التالي: **الوحدة 4** (خريطة §6) بنفس سلسلة الإنتاج.

## حملة المحتوى — الدفعة 9 (2026-10-10) — الوحدة 4: u4-d1 + u4-d2 (D53)
- **u4-d1** (الأسرة — 12 كلمة): أفراد الأسرة الستة + Eltern (جمع فقط) + Kind/Kinder + Großeltern — مصائد: ein Eltern · Großmutter مركّبة · Kinder شاذ.
- **u4-d2** (الملكية — 12 كلمة): Familie/Tante/Onkel/Hund/Katze/Schlüssel/Tasche/Auto + gehören/mein/dein/sein — مصائد: meine Frau (حسب المُملوك) · gehören يجرّ · بلا أداة مع الملكية.
- الصوت: 24 مقطعاً — المانيفست **202 مسارات** · الكلمات **201** · الدروس **20** (الوحدات 1–3 + الوحدة 4: يومان).
- النتيجة: **243/243 أخضر** + tsc + validator (225/0/0) + build ✓. (استعادة بيئية: numpy/piper/npm — D53). التالي: u4-d3 (أول Akkusativ) وu4-d4..u4-d6.

## حملة المحتوى — الدفعة 10 (2026-10-10) — الوحدة 4: u4-d3 + u4-d4 (D54)
- **u4-d3** (أول Akkusativ — 12 كلمة): وصف الأشخاص + Foto/Bild/beschreiben/wen — مصائد: einen (der فقط تتغير) · wer/wen · meinen.
- **u4-d4** (الصورة الأسرية — 12 كلمة): sehen/zeigen/sitzen/stehen/lächeln + links/rechts/neben/zwischen + tragen/Brille — مصائد: tragen · الفعل ثانياً · meinen+Akk.
- الصوت: 24 مقطعاً — المانيفست **226 مساراً** · الكلمات **225** · الدروس **22** (الوحدات 1–3 + الوحدة 4: 4 أيام).
- النتيجة: **243/243 أخضر** + tsc + validator (251/0/0) + build ✓. التالي: u4-d5 (خلط + تسجيل) وu4-d6 (معركة الوحدة 4).

## حملة المحتوى — الدفعة 11 (2026-10-10) — إتمام الوحدة 4: u4-d5 + u4-d6 (D55)
- **u4-d5** (التسجيل القصير — 12 كلمة): Geschwister (جمع فقط) + Zwilling/verheiratet/Beruf/arbeiten/studieren + aufnehmen (منفصل)/kurz/erzählen/stolz/Heimat — مصائد: mein Geschwister ✗ · nehme ... auf · الجمع بلا تغيير عند المفعول.
- **u4-d6** (توليف + معركة الوحدة 4 — wunderbar/prima): أسرة + ملكية + مفعول بعتبة 0.75 + تفريغ أخطاء الأسبوع.
- الصوت: 14 مقطعاً — المانيفست **240 مساراً** · الكلمات **239** · الدروس **24** (**الوحدات 1–4 كاملة**).
- النتيجة: **243/243 أخضر** + tsc + validator (267/0/0) + build ✓. التالي: **الوحدةة 5 (الطعام والشراب — 65 كلمة)**.

## حملة المحتوى — الدفعة 12 (2026-10-10) — الوحدة 5: u5-d1 + u5-d2 (D56)
- **u5-d1** (الأطعمة — 12 كلمة): Brot/Wurst/Fleisch/Fisch/Salat/Suppe/Ei/Reis/Nudeln/Obst/Gemüse/Hunger — مصائد: Ich habe Hunger · Nudeln جمع فقط · Eier شاذ.
- **u5-d2** (المشروبات والمقهى — 12 كلمة): Wasser/Milch/Saft/Bier/Wein/Tee/trinken/Speisekarte/bestellen/Glas/Flasche/zahlen — مصائد: Einen Tee, bitte (مفعول الطلب) · جنس السوائل · Speisekarte مركّبة.
- الصوت: 24 مقطعاً — المانيفست **264 مساراً** · الكلمات **263** · الدروس **26** (الوحدات 1–4 + الوحدة 5: يومان).
- النتيجة: **243/243 أخضر** + tsc + validator (293/0/0) + build ✓. التالي: u5-d3 (möchte/wollen) وu5-d4 (kein/nicht) وu5-d5 (مهمة المقهى) وu5-d6 (المعركة).

## حملة المحتوى — الدفعة 13 (2026-10-10) — u5-d3 + u5-d4 (D57)
- **u5-d3** (Mahlzeiten + möchte/wollen — 12 كلمة): Frühstück/Mittagessen/Abendessen/Butter/Marmelade/Kuchen/Eis/Appetit/schmecken/satt/Kartoffel/Tomate — مصائد: möchte بلا zu · bin satt ↔ habe Hunger · Eis↔Ei.
- **u5-d4** (Tisch + kein/nicht — 12 كلمة): scharf/salzig/frisch/Portion/Teller/Löffel/Gabel/Messer/Gast/Bestellung/Trinkgeld/Getränk — مصائد: kein للنفي الاسم · nicht للفعل/الصفة · نهاية kein الثلاث.
- الصوت: 24 مقطعاً — المانيفست **288 مساراً** · الكلمات **287** · الدروس **28** (الوحدات 1–4 + الوحدة 5: 4 أيام).
- النتيجة: **243/243 أخضر** + tsc + validator (319/0/0) + build ✓. (D57) التالي: u5-d5 (17 كلمة + مهمة المقهى) وu5-d6 (المعركة).

## حملة المحتوى — الدفعة 14 (2026-10-10) — إتمام الوحدة 5 (D58)
- **u5-d5** (17 كلمة — كلمات 49–65): Durst/Salz/Pfeffer/Zucker/Sahne/Limonade/Hähnchen/Nachtisch/Vorspeise/Kasse/reservieren/probieren/kochen/backen/Küche/gesund/Mahlzeit — مصائد: habe Durst ↔ bin satt · -chen = das · تمييز kein↔nicht + **مهمة «طلب في مقهى»**.
- **u5-d6** (المعركة — بلا كلمات): توليف + معركة 0.75 · 3 بطاقات تحذير ختامية.
- الصوت: 17 مقطعاً — المانيفست **305 مسارات** · الكلمات **304** · الدروس **30** — **الوحدات 1–5 مكتملة (30 يوماً)**.
- النتيجة: **243/243 أخضر** + tsc + validator (338/0/0) + build ✓. (D58) التالي: الوحدة 6 (السكن والمفروشات — 65 كلمة).

## حملة المحتوى — الدفعة 15 (2026-10-10) — بداية الوحدة 6 (D59)
- **u6-d1** (Möbel — 12 كلمة): Tisch/Stuhl/Sofa/Bett/Schrank/Lampe/Teppich/Sessel/Regal/Spiegel/Vorhang/Kissen — مصائد: der Schrank · عائلة Umlaut (Stühle) · das Bett/Kissen.
- **u6-d2** (Zimmer — 12 كلمة): Zimmer + مركّباتها + Flur/Balkon/Treppe/Keller/Garten/hell/ruhig/gemütlich — مصائد: مركّبات Zimmer=das · Gärten · gemütlich.
- الصوت: 24 مقطعاً — المانيفست **329 مساراً** · الكلمات **328** · الدروس **32** (الوحدات 1–5 + الوحدة 6: يومان).
- النتيجة: **243/243 أخضر** + tsc + validator (364/0/0) + build ✓. (D59) التالي: u6-d3 (es gibt) وu6-d4 (Wo/Wohin) وu6-d5 (da + وصف شقة) وu6-d6 (المعركة).

## حملة المحتوى — الدفعة 16 (2026-10-10) — u6-d3 + u6-d4 (D60)
- **u6-d3** (es gibt — 12 كلمة): Fenster/Tür/Wand/Boden/Decke/Heizung/Kühlschrank/Waschmaschine/Fernseher/Computer/Schreibtisch/Dach — مصائد: es gibt+Akk · جنس الآلات · مركّبات der/die.
- **u6-d4** (Wo/Wohin — 12 كلمة): Ecke/Mitte/oben/unten/über/unter/hinter/auf/stellen/legen/hängen/wohin — مصائد: Wo=Dativ ↔ Wohin=Akk · الثلاثة stellen/legen/hängen · Wo↔wohin.
- الصوت: 24 مقطعاً — المانيفست **353 مساراً** · الكلمات **352** · الدروس **34** (الوحدات 1–5 + الوحدة 6: 4 أيام).
- النتيجة: **243/243 أخضر** + tsc + validator (390/0/0) + build ✓. (D60) التالي: u6-d5 (da + وصف شقة — 17 كلمة) وu6-d6 (المعركة).

## حملة المحتوى — الدفعة 17 (2026-10-10) — إتمام الوحدة 6 (D61)
- **u6-d5** (17 كلمة + da + وصف شقة): Möbel/Einrichtung/Gerät/Schublade/Rahmen/Handtuch/Seife/Dusche/Toilette/Pflanze/Vase/Hof/Etage/Stockwerk/Miete/Nachbar/dunkel — مصائد: Möbel جمع فقط · Nachbarn (n-Deklination) · da-Türchen.
- **u6-d6** (المعركة — بلا كلمات): توليف + معركة 0.75.
- موازنة بطاقات SRS: +comprehension لـ191 كلمة (41/20/6 → 34/35/5 · التحذير انطفأ).
- الصوت: 17 مقطعاً — المانيفست **370 مساراً** · الكلمات **369** · الدروس **36** — **الوحدات 1–6 مكتملة (36 يوماً)**.
- النتيجة: **243/243 أخضر** + tsc + validator (409/0/0) + build ✓. (D61) التالي: الوحدة 7 (اليوميات والهواء — 65 كلمة).

## حملة المحتوى — الدفعة 18 (2026-10-10) — بداية الوحدة 7 (D62)
- **u7-d1** (Tagesablauf — 12 كلمة): aufwachen/schlafen/duschen/anziehen/müde/Pause/Wecker/Alltag/baden/anfangen/wecken/Weg — مصائد: فعل منفصل · bin müde · aufwachen↔wecken.
- **u7-d2** (Hobbys — 12 كلمة): Fußball/schwimmen/tanzen/reisen/zeichnen/spazieren/Kino/Spiel/spielen/lieber/Spaß/langweilig — مصائد: lieber بلا mehr · رياضة بلا أداة · macht Spaß.
- الصوت: 24 مقطعاً — المانيفست **394 مساراً** · الكلمات **393** · الدروس **38** (الوحدات 1–6 + الوحدة 7: يومان).
- النتيجة: **243/243 أخضر** + tsc + validator (435/0/0) + build ✓. (D62) التالي: u7-d3 (Präsens منتظم) وu7-d4 (شاذ fährt/isst) وu7-d5 (Trennbare) وu7-d6 (المعركة).

## حملة المحتوى — الدفعة 19 (2026-10-10) — u7-d3 + u7-d4 (D63)
- **u7-d3** (12 فعلاً منتظماً): machen/suchen/putzen/öffnen/schließen/brauchen/rufen/besuchen/benutzen/telefonieren/schicken/warten — مصائد: du -st/er -t · -ieren بلا ge- · warten auf.
- **u7-d4** (شاذ + سفر — 12 كلمة): fahren/waschen/geben/nehmen/sprechen/laufen/ankommen/Fahrkarte/Bahnhof/Zug/Bus/Fahrrad — مصائد: fährt (a→ä) · isst↔ist · nimmt/spricht/gibt.
- الصوت: 24 مقطعاً — المانيفست **418 مساراً** · الكلمات **417** · الدروس **40** (الوحدات 1–6 + الوحدة 7: 4 أيام).
- النتيجة: **243/243 أخضر** + tsc + validator (461/0/0) + build ✓. (D63) التالي: u7-d5 (Trennbare + خلط — 17 كلمة) وu7-d6 (المعركة).

## حملة المحتوى — الدفعة 20 (2026-10-10) — إتمام الوحدة 7 (D64)
- **u7-d5** (17 كلمة + Trennbare): aufstehen/anrufen/fernsehen/einkaufen/aufräumen/frühstücken/abwaschen/Haushalt/Wäsche/Müll/Buch/Besuch/Urlaub/Koffer/Reise/hübsch/feiern — مصائد: البادئة في النهاية · möchte+Infinitiv مركّب · فعل↔اسم.
- **u7-d6** (المعركة — بلا كلمات): توليف + معركة 0.75.
- الصوت: 17 مقطعاً — المانيفست **435 مساراً** · الكلمات **434** · الدروس **42** — **الوحدات 1–7 مكتملة (42 يوماً)**.
- النتيجة: **243/243 أخضر** + tsc + validator (480/0/0) + build ✓. (D64) التالي: الوحدة 8 (التسوق والأسعار — 65 كلمة).

## حملة المحتوى — الدفعة 21 (2026-10-10) — بداية الوحدة 8 (D65)
- **u8-d1** (Kleidung — 12 كلمة): Hose/Hemd/Schuhe/Jacke/Mantel/Kleid/Rock/Socke/Hut/Pullover/Größe/Farbe — مصائد: das Hemd · umlaut الملابس · die+e.
- **u8-d2** (Preise — 12 كلمة): Cent/Rabatt/Angebot/günstig/Wechselgeld/verkaufen/Verkäufer/Kunde/Supermarkt/Geschäft/Markt/anprobieren — مصائد: Was kostet das? · Kunden (-n) · ver- تقلب المعنى.
- الصوت: 24 مقطعاً — المانيفست **459 مساراً** · الكلمات **458** · الدروس **44** (الوحدات 1–7 + الوحدة 8: يومان).
- النتيجة: **243/243 أخضر** + tsc + validator (506/0/0) + build ✓. (D65) التالي: u8-d3 (können/müssen) وu8-d4 (الداتيف الثابت) وu8-d5 (von/seit/bei + مهمة المتجر) وu8-d6 (المعركة).

## حملة المحتوى — الدفعة 22 (2026-10-10) — u8-d3 + u8-d4 (D66)
- **u8-d3** (können/müssen — 12 كلمة): passen/Stück/Korb/Wagen/Kleidung/Kreditkarte/Regenschirm/Rucksack/Gürtel/Abteilung/finden/möglich — مصائد: مصدر في النهاية · Kleidung جامد · Stück عدّاد.
- **u8-d4** (الداتيف الثابت — 12 كلمة): nach/aus/zu/Taxi/fliegen/Flug/Flughafen/parken/Rad/Bahn/abholen/Gepäck — مصائد: mit+Dativ · nach↔zu · aus للمنشأ.
- الصوت: 24 مقطعاً — المانيفست **483 مساراً** · الكلمات **482** · الدروس **46** (الوحدات 1–7 + الوحدة 8: 4 أيام).
- النتيجة: **243/243 أخضر** + tsc + validator (532/0/0) + build ✓. (D66) التالي: u8-d5 (von/seit/bei + مهمة المتجر — 17 كلمة) وu8-d6 (المعركة).

## حملة المحتوى — الدفعة 23 (2026-10-10) — إتمام الوحدة 8 (D67)
- **u8-d5** (17 كلمة + von/seit/bei + مهمة المتجر): von/seit/bei/verhandeln/Quittung/Umtausch/Schmuck/Ring/Kette/Stiefel/Mode/Tüte/Geschenk/sparen/Sonnenbrille/Bäckerei/Schalter — مصائد: von↔aus · seit+Dativ · beim/zum/vom.
- **u8-d6** (المعركة — بلا كلمات): توليف + معركة 0.75.
- الصوت: 17 مقطعاً — المانيفست **500 مساراً** · الكلمات **499** · الدروس **48** — **الوحدات 1–8 مكتملة (48 يوماً)**.
- النتيجة: **243/243 أخضر** + tsc + validator (551/0/0) + build ✓. (D67) التالي: الوحدة 9 (المدينة والاتجاهات — 65 كلمة).

## حملة المحتوى — الدفعة 24 (2026-10-12) — u9-d1 أماكن المدينة (D68)
- **u9-d1** (18 كلمة): Kirche/Krankenhaus/Apotheke/Universität/Bank/Post/Park/Museum/Platz + Norden/Süden/Osten/Westen + gegenüber **+Dativ** + hier/dort + geradeaus/zurück. المهمة: السؤال عن الأماكن ووصف الطريق (Wo ist …? / im Norden ↔ nach Norden).
- الصوت: 18 مقطعاً جديداً (word-krankenhaus أُعيد بتقصير) — **516 مساراً** · الكلمات **515** · الدروس **49**.
- النتيجة: **243/243 أخضر** + tsc + validator (568/0/0) + build ✓. (D68) — دروس المخططات المدوّنة في D68 مرجع دائم.

## حملة المحتوى — الدفعة 25 (2026-10-12) — u9-d2 المواصلات (D69)
- **u9-d2** (17 كلمة): Haltestelle/Hauptbahnhof/Bahnsteig/Abfahrt/Ankunft/Verkehr/Linie/Kreuzung/Richtung + **umsteigen/einsteigen/aussteigen** (منفصلة) + weit/nah/überall/vorbei/hin. مراجعة: fahrkarte/fahrrad/minute. مصائد: المنفصلة · in+Akk↔in+Dativ · wo↔wohin.
- **532 كلمة · 50 درساً · 533 مساراً** · **243/243 أخضر** + tsc + validator (586/0/0) + build ✓. (D69) التالي: u9-d3.

## حملة المحتوى — الدفعة 26 (2026-10-12) — u9-d3 Imperativ Sie (D70)
- **u9-d3** (12 كلمة): Entschuldigung/Stadtplan/Auskunft/Eingang/Ausgang/Problem + helfen (Dativ!) + abbiegen (منفصل) + zuerst/danach/sofort/gerne. القاعدة: **Imperativ Sie** (Biegen Sie links ab!) — أمر بأدب.
- **544 كلمة · 51 درساً · 545 مساراً** · **243/243 أخضر** + tsc + validator (599/0/0) + build ✓. (D70) التالي: u9-d4 (Wechselpräpositionen).

## حملة المحتوى — الدفعة 27 (2026-10-12) — u9-d4 Wechselpräpositionen (D71)
- **u9-d4** (12 كلمة): an/in/vor/gegen + Brücke/Tunnel/Ufer/Seite/Parkplatz/Aufzug/Nähe/Meter. القاعدة: **Wo?→Dativ ↔ Wohin?→Akk** (an der Wand ↔ an die Wand) · gegen Akk دائماً.
- **556 كلمة · 52 درساً · 557 مساراً** · **243/243 أخضر** + tsc + validator (612/0/0) + build ✓. (D71) التالي: u9-d5 (Satzklammer + TEKAMOLO).

## حملة المحتوى — الدفعة 28 (2026-10-12) — u9-d5 Satzklammer+TEKAMOLO (D72)
- **u9-d5** (6 كلمات — ميزان الوحدة): bald/pünktlich/Stau/Grund/Verbindung/Fahrplan. القواعد: **Satzklammer** (Morgen **fahre ich**! · fährt um 8 **ab**) + **TEKAMOLO** (Zeit→Art→Ort).
- **562 كلمة · 53 درساً · 563 مساراً** · **243/243 أخضر** + tsc + validator (619/0/0) + build ✓. (D72) التالي: **u9-d6 (المعركة — إتمام الوحدة 9)**.

## حملة المحتوى — الدفعة 29 (2026-10-12) — u9-d6 المعركة · **الوحدة 9 مكتملة** (D73)
- **u9-d6** (توليف — 0 كلمات): معركة 0.75 + خلاصات الوحدة (gegenüber+Dativ · Imperativ+Satzklammer · TEKAMOLO). مراجعة: gegenueber/umsteigen.
- **الوحدات 1–9 مكتملة**: **562 كلمة · 54 يوماً · 563 مساراً** · **243/243 أخضر** + tsc + validator (620/0/0) + build ✓. (D73) التالي: **الوحدة 10 (الصحة)**.

## حملة المحتوى — الدفعة 30 (2026-10-12) — u10-d1 الطقس (D74)
- **u10-d1** (12 كلمة Wetter): Wetter/Sonne/Regen/Schnee/Wind/Wolke/Himmel/Grad + warm/kalt/nass/sonnig. القاعدة: **Es الفاعل الصوري** (Es regnet · Es ist kalt).
- **تصحيح مسار**: الوحدة 10 = **المواعيد والطقس** (60 كلمة) — الصحة هي الوحدة 11.
- **574 كلمة · 55 درساً · 575 مساراً** · **243/243 أخضر** + tsc + validator (633/0/0) + build ✓. (D74) التالي: u10-d2 (Termine/Monate).

## حملة المحتوى — الدفعة 31 (2026-10-12) — u10-d2 المواعيد (D75)
- **u10-d2** (12 كلمة): Kalender/Datum + أيام (Dienstag…Samstag) + Einladung/Absage/frei/besetzt/Wochenende. القواعد: **am+Tag** · **der zwölfte Mai** · القلنسوة.
- **586 كلمة · 56 درساً · 587 مساراً** · **243/243 أخضر** + tsc + validator (646/0/0) + build ✓. (D75) التالي: u10-d3 (**Perfekt haben — أول الماضي!**).

## حملة المحتوى — الدفعة 32 (2026-10-12) — u10-d3 الماضي Perfekt (D76)
- **u10-d3** (12 كلمة): gestern/vorgestern/letzt + bringen/holen/lernen/sagen/fragen/denken (haben-Perfekt) + Brief/Paket/Spaziergang. القاعدة: **habe … geschrieben** (التصريف آخر الجملة).
- **598 كلمة · 57 درساً · 599 مساراً** · **243/243 أخضر** + tsc + validator (659/0/0) + build ✓. (D76) التالي: u10-d4 (Perfekt + Zeitangaben).

## حملة المحتوى — الدفعة 33 (2026-10-12) — u10-d4 الماضي بالزمن (D77)
- **u10-d4** (12 كلمة): neulich/damals/vorher/nachher/endlich/plötzlich + vereinbaren/aufschreiben (auf-geschrieben!) + Erinnerung/Notiz/richtig/falsch.
- **610 كلمة · 58 درساً · 611 مساراً** · **243/243 أخضر** + tsc + validator (672/0/0) + build ✓. (D77) التالي: u10-d5 (**أول weil — تفسير السبب**).

## حملة المحتوى — الدفعة 34 (2026-10-12) — u10-d5 جملة weil (D78)
- **u10-d5** (12 كلمة): weil/warum/deshalb/darum + wichtig/dringend/krank/unwohl/Ruhe/Stress/Notfall/ausruhen. القاعدة: **weil → الفعل آخر الجملة** · القلب عند البدء بجملة السبب.
- **622 كلمة · 59 درساً · 623 مساراً** · **243/243 أخضر** + tsc + validator (685/0/0) + build ✓. (D78) التالي: **u10-d6 (المعركة — إتمام الوحدة 10)**.

## حملة المحتوى — الدفعة 35 (2026-10-12) — u10-d6 المعركة · **الوحدة 10 مكتملة** (D79)
- **u10-d6** (توليف — 0 كلمات): معركة 0.75 + خلاصات (Es · am+Tag · Perfekt · weil). مراجعة: weil/gestern.
- **الوحدات 1–10 مكتملة**: **622 كلمة · 60 يوماً · 623 مساراً** · **243/243 أخضر** + tsc + validator (686/0/0) + build ✓. (D79) التالي: **الوحدة 11 (الصحة والجسم)**.

## حملة المحتوى — الدفعة 36 (2026-10-12) — u11-d1 الجسم (D80)
- **u11-d1** (12 كلمة): Kopf/Hand/Arm/Bein/Rücken/Bauch/Hals/Auge/Nase/Mund/Zahn/Finger. مصائد: الأجناس العشوائية · جمع الوملاوت · **tut weh**.
- **634 كلمة · 61 درساً · 635 مساراً** · **243/243 أخضر** + tsc + validator (699/0/0) + build ✓. (D80) التالي: u11-d2 (الألم والوصف).

## حملة المحتوى — الدفعة 37 (2026-10-12) — u11-d2 وصف الألم (D81)
- **u11-d2** (12 كلمة): Arzt/Ärztin/Schmerz/Kopfschmerzen/Fieber/Erkältung/Grippe/Schwindel/Medikament/Tablette/Rezept/untersuchen. مصائد: جمع الألم · seit+Dativ · لاحقة -in.
- **646 كلمة · 62 درساً · 647 مساراً** · **243/243 أخضر** + tsc + validator (712/0/0) + build ✓. (D81) التالي: u11-d3 (**Perfekt مع sein — ذهبت/كنت**).

## حملة المحتوى — الدفعة 38 (2026-10-12) — u11-d3 الماضي مع sein (D82)
- **u11-d3** (12 كلمة): bleiben/liegen/wieder/schwach/besser/fit/husten/niesen/jucken/brennen/verschwinden/dauern. مصائد: bin-vs-haben · war المباشر · Es juckt.
- **658 كلمة · 63 درساً · 659 مساراً** · **243/243 أخضر** + tsc + validator (725/0/0) + build ✓. (D82) التالي: u11-d4 (اختيار haben↔sein).

## حملة المحتوى — الدفعة 39 (2026-10-12) — u11-d4 اختيار haben↔sein (D83)
- **u11-d4** (12 كلمة): sich fühlen/verbinden/Wunde/Blut/bluten/Spritze/Impfung/schlucken/rauchen/erlauben/Thermometer/Pflaster. مصائد: قاعدة القرار · sich · أمر بالنفي.
- **670 كلمة · 64 درساً · 671 مساراً** · **243/243 أخضر** + tsc + validator (738/0/0) + build ✓. (D83) التالي: u11-d5 (مهمة: عند الطبيب — helfen/tut weh + muss/darf).

## حملة المحتوى — الدفعة 40 (2026-10-12) — u11-d5 مهمة: عند الطبيب (D84)
- **u11-d5** (12 كلمة): Patient/Hausarzt/Spezialist/Notaufnahme/Krankenwagen/Unfall/Schnupfen/Zahnschmerzen/Bauchschmerzen/schmerzen/Tropfen/Salbe. مصائد: الفعل آخر · helfen+Dativ · جنس المركّب.
- **682 كلمة · 65 درساً · 683 مساراً** · **243/243 أخضر** + tsc + validator (751/0/0) + build ✓. (D84) التالي: u11-d6 (معركة الوحدة 11).

## حملة المحتوى — الدفعة 41 (2026-10-12) — u11-d6 معركة الوحدة 11 (D85)
- **u11-d6** (0 كلمات): توليف كل مصائد الصحة (tut weh ↔ Schmerzen · habe↔bin/war · العيادة). **الوحدة 11 مكتملة ✅**.
- **682 كلمة · 66 درساً · 683 مساراً** · **243/243 أخضر** + tsc + validator (752/0/0) + build ✓. (D85) التالي: u12-d1 (الوحدة 12: السفر والتخطيط).

## حملة المحتوى — الدفعة 42 (2026-10-12) — u12-d1 الوجهة (D86)
- **u12-d1** (12 كلمة): Ziel/Hotel/Reservierung/Fahrt/abfahren/besichtigen/Sehenswürdigkeit/Ausland/Pass/Visum/Ausflug/Tourist. مصائد: الفعل المنفصل · ins↔im · جمع الوثائق.
- **694 كلمة · 67 درساً · 695 مساراً** · **243/243 أخضر** + tsc + validator (765/0/0) + build ✓. (D86) التالي: u12-d2 (Bahnhof/Hotel — أسئلة القطار والفندق).

## حملة المحتوى — الدفعة 43 (2026-10-12) — u12-d2 المحطة والفندق (D87)
- **u12-d2** (12 كلمة): Gleis/Rezeption/Doppelzimmer/Einzelzimmer/Aussicht/Bad/buchen/Empfang/Halle/Verspätung/verpassen/zurückgeben. مصائد: hat Verspätung · أمر بالفعل المنفصل · von welchem.
- **706 كلمة · 68 درساً · 707 مساراً** · **243/243 أخضر** + tsc + validator (778/0/0) + build ✓. (D87) التالي: u12-d3 (Perfekt + Trennbare معاً).

## حملة المحتوى — الدفعة 44 (2026-10-12) — u12-d3 الماضي + المنفصلة (D88)
- **u12-d3** (12 كلمة): losfahren/zurückkommen/mitbringen/ansehen/mitnehmen/ausgeben/einpacken/auspacken/anmelden/aufpassen/mieten/planen. مصائد: ge-المنتصف · ist↔hat · sich anmelden.
- **718 كلمة · 69 درساً · 719 مساراً** · **243/243 أخضر** + tsc + validator (791/0/0) + build ✓. (D88) التالي: u12-d4 (Konnektoren — und/aber/oder/denn).

## حملة المحتوى — الدفعة 45 (2026-10-12) — u12-d4 الروابط (D89)
- **u12-d4** (12 كلمة): denn/sondern/deswegen/leider/vielleicht/dann/zuletzt/Beispiel/Meinung/Vorschlag/Idee/Plan. مصائد: denn≠weil · sondern بعد النفي · Meiner Meinung nach.
- **730 كلمة · 70 درساً · 731 مساراً** · **243/243 أخضر** + tsc + validator (804/0/0) + build ✓. (D89) التالي: u12-d5 (توليف مصغر + سرد رحلة — 6 جمل).

## حملة المحتوى — الدفعة 46 (2026-10-12) — u12-d5 سرد الرحلة (D90)
- **u12-d5** (12 كلمة — الأخيرة في الخطة!): Landschaft/Natur/See/Berg/Meer/Strand/Insel/Fluss/Wald/Andenken/fotografieren/Postkarte. مصائد: -ieren بلا ge · جبل الوملاوت · der See↔die See.
- **742 كلمة · 71 درساً · 743 مساراً** · **243/243 أخضر** + tsc + validator (817/0/0) + build ✓. (D90) التالي: **u12-d6 المعركة الكبرى** (آخر درس في خطة A1!).

## حملة المحتوى — الدفعة 47 (2026-10-12) — u12-d6 المعركة الكبرى (D91) 🏁
- **u12-d6** (0 كلمات): معركة A1 النهائية (القلنسوة · bin/hat/war/hatte · الست مصائد). warmup hallo/danke/bitte.
- **🏁 خطة A1 مكتملة بالكامل: 742 كلمة · 72 يوماً · 743 مساراً** · **243/243 أخضر** + tsc + validator (818/0/0) + build ✓. (D91)

## حملة المحتوى — الدفعة 48 (2026-10-12) — أسبوع التثبيت والامتحان (D92)
- **الوحدة 13** (6 دروس تثبيت · 0 كلمات): مراجعة تراكمية للوحدات الـ12 + d6 فيه **Modelltest (4 مهارات)**. تمديد schema unit→13.
- **742 كلمة · 78 يوماً · 743 مساراً** · **243/243 أخضر** + tsc + validator (824/0/0) + build ✓. (D92) الأسبوع الاحتياطي (1) غير محتاج محتوى.

## الإضافات — الدفعة 49 (2026-10-12) — بطاقات الثقافة Landeskunde (D93)
- **12 بطاقة ثقافة** (نوع محتوى جديد + مخطط + مدقِّق + تصدير للتطبيق + اختبار). الخطة §2: بطاقة أسبوعية كل جمعة.
- **244/244 أخضر** + tsc + validator (836/0/0) + build ✓. (D93) التالي من قائمة «الكل»: Kurztest + Monatsprüfung.

## الإضافات — الدفعة 50 (2026-10-12) — الاختبارات الدورية (D94)
- **9 اختبارات** (6 Kurztest كل أسبوعين + 3 Monatsprüfung شهرية) — نوع محتوى جديد + مدقِّق + تصدير + اختبار.
- **245/245 أخضر** + tsc + validator (845/0/0) + build ✓. (D94) التالي: Modelltest كامل (4 أقسام).

## الإضافات — الدفعة 51 (2026-10-12) — الامتحان التجريبي الكامل (D95)
- **a1-modelltest-1** (36 عنصراً · 4 مهارات · نوع محتوى جديد + مدقِّق + تصدير + اختبار). حدود صدق: needs-web-verify من goethe.de.
- **246/246 أخضر** + tsc + validator (846/0/0) + build ✓. (D95) التالي: الصور التوضيحية (الترميز المزدوج).

## الإضافات — الدفعة 52 (2026-10-12) — الصور التوضيحية الدفعة 1 (D96)
- **10 صور** (هوية بصرية واحدة · alt · ربط بالدروس) — بقي hand+koffer (حد 10/دورة).
- **247/247 أخضر** + tsc + validator (846/0/0) + build ✓. (D96) التالي: صور أكثر + نصوص القراءة.

## الإضافات — الدفعة 53 (2026-10-12) — نصوص القراءة + إكمال الصور (D97)
- **12 نص قراءة** (نوع جديد + مدقِّق + تصدير + اختبار) + **الصور 12/12**.
- **248/248 أخضر** + tsc + validator (858/0/0) + build ✓. (D97) التالي: صوت امرأة.
- **D98 — صوت امرأة**: البنية جاهزة بالكامل، الملف يُنزَّل مالكياً ويعمل فوراً.
