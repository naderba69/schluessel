# CHANGELOG.md

<!-- docs-sync:start -->
> يُولَّد هذا القسم من `DECISIONS.md` (D186+) بـ`tools/dev/docs-sync.py` — سطر «للقارئ» يكتبه الكاتب بيده في القرار؛ ما تحت القسم تاريخ مجمَّد كُتب يدوياً.

## 2026-10-18 — الدفعة 142: D187 — البوابة الواحدة `npm run gate` بتقرير الأسطر الثلاثة · `content-diff` للمالك · خطّاف pre-push حقيقي (husky الميّت أُزيل)
الخطوة (ج) من قرار المالك: صار التحقق كله أمراً واحداً. `npm run gate` يشغّل البوابات الثماني (vitest · tsc · validate-content · build · docs-sync · notes · pronunciation-audit · سرعة الكلام الناعمة) ويجمع أرقامها بنفسه ويطبع تقرير الأسطر الثلاثة بالعربية — فلا رقم يُنقل باليد بعد اليوم، ولا «أخضر» يعتمد على انضباطي: خطّاف `pre-push` حقيقي يرفض أي دفع والبوابة حمراء، ويرفض الدفع إلى main أصلاً. واكتُشف أن خطّافَي `.husky` القديمين لم يعملا يوماً (لا husky مثبَّت ولا hooksPath) فأُزيلا. ومعهما `npm run content:diff` الذي يعرض للمالك، قبل تقييم كل درسين من مرور التوليف، كل جملة تغيّرت قبل/بعد وكل مسار صوتي أُعيد توليده — بلا قراءة JSON.
- **البوابة:** vitest 741/741 (68 ملفاً) · tsc 0 · validator 1131/0/0 · build ✓ · docs-sync ✓ · notes 0/54/66 · audit 0 · speech-rate 0 — كلها من `npm run gate` نفسه.

## 2026-10-18 — الدفعة 141: D186 — التوثيق من مصدر واحد — DECISIONS.md يولّد الباقي (`docs-sync.py`) · سجل الملاحظات بأداة مُلتزَمة (`notes.py`) · إيقاف ضبط الصوت سطراً سطراً
بعد مناقشة المالك على تقرير «القرارات التي أراها خاطئة» (عشرة بنود) قرّر: الأتمتة الآن ومقدَّمة على N-101، وبالترتيب: توحيد التوثيق أولاً ثم أداة الملاحظات ثم البوابة الآلية. هذه الدفعة تنفّذ الأولَين: صار DECISIONS.md المصدر الوحيد — كل قرار جديد يحمل سطراً بشرياً «للقارئ» وسطري البوابة والتالي، ومنها تُولَّد ترويسة CHANGELOG (بنصّ الكاتب لا بأرقام آلية) وPROGRESS وSTATE ورأس الموجّه؛ والتاريخ قبل D186 جُمِّد كما كُتب بتواريخه. وسجل §10 يُدار بـ`notes.py` (إضافة · إغلاق · عدّ · فحص) بدل سكربتات تُكتب وتُرمى. وبأمر المالك توقّف ضبط `lengthScale` سطراً سطراً لإرضاء رقم السرعة — العتبة 200 حارس ناعم والحكم للأذن قبل الإطلاق.
- **البوابة:** vitest 737/737 (68 ملفاً) · tsc 0 · validator 1131/0/0 · docs-sync --check ✓ · notes check ✓ · build ✓.
<!-- docs-sync:end -->

<!-- التاريخ المجمَّد (حتى الدفعة 140 / D185): كُتب يدوياً — لا يُعاد توليده ولا يُحرَّر -->

## 2026-10-18 — الدفعة 140: D185 — صيانة (د) 2/7: N-103 + N-112 + N-022 مغلقات · N-120 جديدة
- **الحارس:** الجذع المشتق القصير من الفعل وحده وبنهاية فعل (`stemKnown`) · صيغ الدروس اللاحقة تُرفض (`withLaterForms`/`laterWordLeak`) · tun ⇒ tue/tust · hattest/hattet/warst/wart مغلقة · `IMPLICIT_FORMS` (gut · jeder) · `e-upgrade-meta` للهدف/المهمة/الخلاصة.
- **محتوى:** meta 11 درساً (u1-d1..u3-d3) بالمدروس · u8-d2 fragt ⇒ kennt · u8-d4 fh-17 «Meine Oma wohnt dort.» (أُعيد توليده) · u6-d3 تلميح (jed-) · u11-d1 +tust/tue (71) · ars-perfekt «Hattest du auch Schwindel?».
- **اختبارات:** `tests/front-guard.test.ts` (10) · كتل u8-d2/u11-d1/u11-d3/u12-d6 · content-units · lesson-runner · 733/733.
- **وثائق:** الموجّه 3.42 · N-103/N-112/N-022 مغلقات ← D185 · +N-120 (gut بلا بطاقة) · التقرير أُعيد توليده.

## 2026-10-18 — الدفعة 139: D184 — صيانة (د) 1/7: N-102 + N-110 مغلقتان · حارس السرعة في المدقّق
- **أدوات:** `interleaveSupported` مشتركة (رمز كامل · صيغ مسجَّلة · جذع + نهاية مغلقة · المنفصل بجزئه · deumlaut · ‑nen/‑innen · speakText) · `e-upgrade-interleave` في checkUpgrade · `w-audio-speech-rate` (>200 · ≥3 كلمات) في validate-content.
- **اختبارات:** `tests/interleave.test.ts` جديد (78 درساً + ضوابط) · حلقات الكتل الـ35 في lesson-upgrade.test.ts على الدالة نفسها (−26 سطراً) · 723/723.
- **محتوى (interleavedWith فقط — بلا نص):** 94 استدعاءً معلناً خاطئاً أُزيل (70 في 21 درساً مُرقّى + 24 في 12 توليفاً) و124 أُضيف في 86 محطة من 39 درساً.
- **وثائق:** الموجّه 3.41 · N-102/N-110 مغلقتان ← D184 · التقرير أُعيد توليده.

## 2026-10-18 — الدفعة 138: D183 — N-119 (أ) منفَّذة (kg-17 + ki-6) · المراجعة الختامية الثانية · خطآن صريحان في u12-d6 · تقرير المالك ≤400 سطر
- **قصة (N-119 مغلقة):** kg-17 «Am Samstag fahre ich mit dem Zug in die Schweiz. Um sechs Uhr bin ich bei dir.» · ki-6 «Am Samstag bist du hier — dann fahren wir an einen See.» (إملاء — lengthScale 1.65 ⇒ 131 كلمة/دقيقة) · بندا u12-d3/u12-d5 حُدّثا · interleavedWith urlaub ⇒ samstag · مساران أُعيدا — المانيفست 2056.
- **مراجعة:** 60/60 · 48/48 · D108 عيّنة ببذرة 183 (u2-d2 · u2-d1 · u10-d3 · u1-d6 · u12-d6) · التواريخ متصلة 3–15 أبريل.
- **محتوى (خطأ صريح):** a1-u12-d6 «Ich muss zum Arzt gehen» ⇒ «… heute …» (مرتين) · «Ich bin zu Hause geblieben.» ⇒ «… gestern …».
- **تقرير:** `docs/reports/owner-review-2026-10-18.md` أُعيد تشكيله (217 سطراً) بـ`tools/dev/owner-review.py` (بذرة/تاريخ/مخرج) · اختبار dev-tools: lengthScale لكل سطر = 20.
- **وثائق:** الموجّه 3.40 · N-119 مغلقة ← D183 · N-096/N-113/N-022 محدَّثة · كتلة D180 فيها سطر التصحيح.

## 2026-10-18 — الدفعة 137: D182 — قرارات المالك الـ27 + صيانة: tools/dev في git (N-104) · سرعة الكلام مقيسة و19 سطراً أُبطئت (N-015) · شطب u10-d6 (N-111)
- **قرارات المالك** مسجَّلة نصاً في DECISIONS.md D182 · §10: 42 ملاحظة أُغلقت ← D182 · صفر «بانتظار المالك» · الباقي مفتوح بعمل مقرَّر وترتيب تنفيذ (د ← ب ← أ ← ج).
- **tools/dev/** جديد: `fetch-official.sh` (SD1/A2/ipa-dict بالـblob المثبَّت + sha256 → `.dev-cache/` خارج git) · `check-lesson.ts` · `speech-rate.py` · `owner-review.py` · README · `tests/dev-tools.test.ts` (+5 ⇒ 718 مع اختبار المقسِّم).
- **مخطط السكربت:** `lengthScale` اختياري لكل سطر (إبطاء فقط · ≤2.0) + `lineLengthScale()` · المقسِّم يعيد السطر وحده عند تغييره (+1 اختبار).
- **صوت:** 19 سطراً فوق 200 كلمة/دقيقة أُبطئت (1.5/1.8/2.0) وأُعيد توليدها — الأعلى الآن 200.0 · المانيفست 2056 (19 مساراً مُحدَّثة).
- **محتوى:** a1-u10-d6 مصيدة ~~aufgeschreiben~~ ⇒ ~~Ich habe aufschreiben~~.
- **وثائق:** الموجّه 3.39.

## 2026-10-18 — الدفعة 136: D181 — المراجعة الختامية للستين + تقرير الملاحظات والقرارات للمالك (بلا تعديل محتوى)
- **تقرير جديد** `docs/reports/owner-review-2026-10-18.md` (مولَّد من §10 + DECISIONS.md + `upgrade-status`/`plan-status`): حالة مقيسة · نتائج المراجعة · 11 ملاحظة بانتظار المالك مع توصية لكل واحدة · 7 قرارات مؤقتة للنقاش · 90 مفتوحة بالباب · 18 مغلقة · فهرس D47–D180 · ترتيب تنفيذ مقترح.
- **المراجعة:** 60/60 في `upgrade-status` · 48/48 و123/123 في `plan-status` (إصلاحات النص 2/4 — الباقيان من وحدتي الفهم) · D108 على الستين: 63 تطابقاً كلها كلمة/عبارة ثابتة قصيرة ⇒ لا إصلاح · N-103 صفر في الوحدة 12 · تواريخ N-096 متصلة 3–15 أبريل · N-119 الثغرة الوحيدة.
- **وثائق:** الموجّه 3.38 (§7: انتظار قرارات المالك — لا محتوى جديد) · حُدّثت N-096 · N-113 · N-119 بنتائج D181.
- **بلا تغيير:** المحتوى · الاختبارات (713) · الأدوات · المانيفست (2056) · الكلمات (884).

## 2026-10-18 — الدفعة 135: a1-u12-d5 مُرقّى — Das Thema: Natur (D180) · المرور مكتمل 60/60 · النواة مكتملة 48/48 · حوار ki-1..20 · N-119
- **النواة** (`word-entry-generator` — `specs180.json`): das Thema (die Themen · «Unser Thema heute ist die Natur.») — في SD1 وA2 (D110) · خطة SD1 u12-d5 done ⇒ **48/48 إسناداً · 123/123 كلمة** · 883 → 884 كلمة.
- **a1-u12-d5:** 6 بنود choice ⇒ 58 بنداً/4 أنواع (فراغ 22 · استماع 16 · ترتيب 10 · إملاء 10) · Quiz 3×4 ⇒ 3×6 · 3 مصائد بـ10‑ي (‑ieren بلا ge · الجمع بالأوملاوت · der See/die See/das Meer) · ثلاثة أخطاء معلنة (D128) · properNouns Yusuf/Lena/Tunis · ars-perfekt + ars-zeitangaben (لا ملف جديد).
- **مثال البطاقة:** meer «Das Meer ist blau.» (blau غير مدروسة) ⇒ «Das Meer ist groß.».
- **حوار** `a1-u12-d5-das-thema-natur` (ki-1..20 · الأربعاء 15 أبريل مساءً — موضوع الطبيعة وصور تونس) — المانيفست 2035 → 2056 · ki-6 أُعيد توليده وحده بعد حذف «in Deutschland» من فم لينا (N-100/N-119).
- **النطق:** المعجم 78 بلا جديد (Tunesien ki-3/4/13/14/17) · المرجع 1653 → 1666.
- **اختبارات:** كتلة D180 (+1 ⇒ 713) تثبّت done للستين من ملف الترقية · المثال غير المُرقّى ← a1-u12-d6 (توليف خارج المرور — N-004) بفجواته المقيسة · curriculum-plan: u12-d5 done (13) · 48 done · لا pending — اختبارات typo/التوليف/الشبح/الحمل تعيد u12-d5 إلى pending في النسخة وتحذف thema من السياق · content-units 884 · validator 1131/0/0.
- **وثائق:** الموجّه 3.37 · N-119 جديدة (حضور يوسف عيد لينا وهما في بلدين) · حُدّثت N-096 · N-099 · N-103 · N-110 · N-113.

## 2026-10-18 — الدفعة 134: a1-u12-d4 مُرقّى — Der Plan für Samstag (D179) · نواة zum Beispiel · der Satz · glauben (47/48) · denn/sondern/deswegen على القاعدتين القائمتين · حوار kh-1..20
- **النواة الثلاث** (`word-entry-generator` — `specs179.json`): zum Beispiel (chunk · «Ich mag Obst, zum Beispiel Äpfel.») · der Satz (die Sätze · «Der Satz ist zu lang.») · glauben (hat geglaubt · «Ich glaube, das ist eine gute Idee.») — الثلاث في SD1 وA2 (D110) · خطة SD1 u12-d4 done ⇒ 47/48 · 880 → 883 كلمة.
- **a1-u12-d4:** 6 بنود choice ⇒ 58 بنداً/4 أنواع (فراغ 22 · استماع 16 · ترتيب 10 · إملاء 10) · Quiz 3×4 ⇒ 3×6 · 3 مصائد بـ10‑ي (denn/weil/deswegen · aber/sondern · الظرف أولاً + Ich glaube,) · properNouns Yusuf/Lena/Rom/Italien · ars-weil-satz + ars-satzklammer (لا ملف جديد).
- **أمثلة البطاقات:** dann «Wir essen Kuchen, dann hören wir Musik.» (كان erst) · zuletzt «Zuletzt haben wir einen Film gesehen.» (كان Dom) · beispiel «Das ist nur ein Beispiel.» (كان Berlin).
- **حوار** `a1-u12-d4-der-plan-fuer-samstag` (kh-1..20 · الثلاثاء 14 أبريل مساءً — خطة عيد لينا) — المانيفست 2012 → 2035.
- **النطق:** المعجم 78 بلا جديد (regnet kh-7 · April kh-8) · المرجع 1638 → 1653.
- **اختبارات:** كتلة D179 (+1 ⇒ 712) · المثال غير المُرقّى ← a1-u12-d5 (الأخير) · curriculum-plan: u12-d4 done (15) · 47 done · pending الوحيد u12-d5 (das Thema) — اختبارات typo/التوليف/الشبح/الحمل على u12-d5 (الحمل بإسناد ثانٍ لا بنقل) · content-units 883 · validator 1129/0/0.
- **وثائق:** الموجّه 3.36 · حُدّثت N-096 · N-099 · N-103 · N-110 · N-113.

## 2026-10-18 — الدفعة 133: a1-u12-d3 مُرقّى — Der erste Schultag (D178) · ars-trennbar كُتبت أخيراً (Perfekt المنفصل — N-117 مغلقة) · حوار kg-1..20 · معجم النطق +losgefahren/geplant
- **ars-trennbar** (جديدة · shufra · أحمر · 10‑ي · usedInLessons [a1-u12-d3]) — الاسم الذي كان بلا ملف منذ D176 (N-117): ge بين الجزء والجذع (ein‑ge‑packt · aus‑ge‑packt · mit‑ge‑bracht · an‑ge‑sehen · aus‑ge‑geben · mit‑ge‑nommen · auf‑ge‑passt · an‑ge‑meldet) · sein للحركة (ist losgefahren · bin angekommen · ist zurückgekommen) · sich anmelden بالضمير · مقابل gemietet/geplant (ge في الأول) وbesichtigt/verpasst/reserviert (بلا ge) · الألمانية المعروضة كلمات كاملة (التفكيك بالعربية فقط).
- **a1-u12-d3:** 6 بنود choice ⇒ 56 بنداً/4 أنواع (فراغ 20 · استماع 16 · ترتيب 10 · إملاء 10) · Quiz 3×4 ⇒ 3×6 · 3 مصائد بـ10‑ي · properNouns Yusuf/Lena/Tunis · ars-trennbar + ars-perfekt · بلا كلمة جديدة.
- **أمثلة البطاقات:** ansehen بلا Dom («Wir haben die Fotos angesehen.») · losfahren «Der Bus ist um sieben Uhr losgefahren.» · ausgeben «Ich habe nur fünfzig Euro ausgegeben.» · anmelden «Ich habe mich für einen Kurs angemeldet.» · auspacken «Ich habe den Rucksack ausgepackt.».
- **حوار** `a1-u12-d3-der-erste-schultag` (kg-1..20 · الاثنين 13 أبريل مساءً — أول يوم مدرسة لكليهما) — المانيفست 1992 → 2012.
- **معجم النطق 76 → 78:** losgefahren (kg-2/3) · geplant (kg-12/13) · المرجع 1622 → 1638 · Kurs kg-14 · geregnet kg-13.
- **اختبارات:** كتلة D178 (+1 ⇒ 711) · المثال غير المُرقّى ← a1-u12-d4 · كتلتا D176/D177 تثبّتان أن ars-trennbar لا تشملهما · أطوال المعجم 78 · validator 1125/0/0.
- **وثائق:** الموجّه 3.35 · N-117 مغلقة ← D178 · حُدّثت N-096 · N-099 · N-103 · N-110 · N-113.

## 2026-10-18 — الدفعة 132: a1-u12-d2 مُرقّى — Am Bahnhof und im Hotel · Wieder in Berlin (D177) · نواة der Blick · das Internet · die Information · ars-trennbare + ars-modal-fix بدل ars-trennbar بلا ملف · N-118 تصحيح عدّ النواة
- **إضافة:** ثلاث كلمات نواة بالمولِّد (`specs177.json` — blick · internet · information؛ Internet/Information في قائمتي SD1 وA2) · حوار `a1-u12-d2-wieder-in-berlin` (kf-1..20 · مكالمة الأحد 12 أبريل — يوم العودة إلى برلين) · `usedInLessons` لـars-trennbare += a1-u12-d2 · خطة SD1 u12-d2 done.
- **تحسين المحتوى:** 67 بنداً/4 أنواع (فراغ 30 · استماع 15 · ترتيب 10 · إملاء 12) · Quiz 3×6 · 3 مصائد بـ10‑ي (~~Der Zug ist Verspätung~~/~~Ich bin den Zug verpasst~~ · ~~Zurückgeben Sie den Schlüssel!~~/~~muss … geben zurück~~ · ~~der Bad~~/~~Blick auf dem Park~~) · مثالا gleis (كان بـwelchem) وrezeption (كان بـErdgeschoss) مصحّحان · مقطع word-information أُعيد (1500 ⇒ 1407ms).
- **ما خرج:** مرجع `ars-trennbar` (بلا ملف) · 6 بنود choice بلا خيارات · welchem من الهدف والمهمة والمصائد · مفتاح «a» الغريب في المهمة القديمة.
- **تصحيح (N-118):** عدّ النواة في الوثائق كان يزيد واحداً منذ D168 — الصحيح الآن **46/48** (من الملف؛ اختبار curriculum-plan يثبّته).
- **اختبارات:** كتلة D177 (+1 — تثبّت العدد الكلي للمانيفست 1992؛ كتلة D176 صارت تثبّت ke-1..20 فقط) · المثال غير المُرقّى ← a1-u12-d3 بفجواته المقيسة · curriculum-plan (u12-d2 done 15 كلمة · 46 done · التالي pending a1-u12-d4 · اختبارات التوليف/الشبح/الحمل تنقل إسناد u12-d4) · 880 كلمة · 710/710 · validator 1123/0/0.
- **الوثائق:** +N-118 · حُدّثت N-096 · N-099 · N-103 · N-104 (الحادث الثالث) · N-110 · N-113 · N-117 · الموجّه 3.34.

## 2026-10-18 — الدفعة 131: a1-u12-d1 مُرقّى — Das Reiseziel · Mein letzter Tag in Tunis (D176) · مراجعة ars-trennbare + ars-wechselpraep بدل مرجعين بلا ملف · بلا نواة
- **إضافة:** حوار `a1-u12-d1-mein-letzter-tag-in-tunis` (ke-1..20 · مكالمة اليوم الثالث عشر والأخير بتونس — السبت 11 أبريل) · `usedInLessons` لـars-trennbare وars-wechselpraep += a1-u12-d1 · لا ملف قاعدة جديد ولا كلمة جديدة (877).
- **تحسين المحتوى:** 67 بنداً/4 أنواع (فراغ 30 · استماع 15 · ترتيب 10 · إملاء 12) · Quiz 3×6 · 3 مصائد بـ10‑ي (~~Der Zug fährt ab um acht Uhr~~ / ~~Ich reise im Ausland~~ / ~~die Pass · der Visum · die Visums~~) · الكلمات الاثنتا عشرة بأمثلة بلا أسماء شخصيات (Berlin معلنة في مثال ziel) · 18 إجابة Quiz من مادة اليوم.
- **ما خرج:** مرجعا `ars-trennbar` و`ars-wechselprae-dat` (بلا ملف) · 6 بنود choice بلا خيارات · berlin في التدريب القديم · الاختبار القبلي القديم.
- **اختبارات:** كتلة D176 (+1 — تثبّت العدد الكلي للمانيفست 1969؛ كتلة D175 صارت تثبّت kd-1..20 فقط) · المثال غير المُرقّى ← a1-u12-d2 بفجواته المقيسة · 709/709 · validator 1119/0/0.
- **الوثائق:** +N-117 (مفتوحة: اسم ars-trennbar — u12-d2/u12-d3) · حُدّثت N-096 · N-099 · N-103 · N-110 · N-113 · الموجّه 3.33.

## 2026-10-18 — الدفعة 130: a1-u11-d5 مُرقّى — Beim Hausarzt (D175) · ars-modal-fix جديدة (dürfen/sollen + الخمسة) · helfen+Dativ · جنس المركّب · نواة das Ergebnis
- **إضافة:** قاعدة `ars-modal-fix` (shufra · 10‑ي · usedInLessons u11-d5/u11-d6/u12-d2/u12-d6 — كانت بلا ملف) · كلمة `ergebnis` (نواة SD1 بالمولِّد — A1 · die Ergebnisse · «Das Ergebnis ist gut: nur eine Erkältung.») · حوار `a1-u11-d5-beim-hausarzt` (kd-1..20 مكالمة اليوم الثاني عشر) · مانيفست 1949 · المرجع 1582 · معجم النطق 76 (+wehgetan — kd-1 أُعيد؛ Fußball kd-9/10 · fit kd-20 · Spezialisten مراجَع artifact).
- **تحسين المحتوى:** 66 بنداً/4 أنواع (فراغ 30 · استماع 14 · ترتيب 10 · إملاء 12) · Quiz 3×6 · 3 مصائد بـ10‑ي (المنع بـmüssen/المصدر مصرّفاً/darf لكل فاعل ⇒ ~~Sie müssen nicht rauchen~~ (للمنع) / ~~Ich darf gehe in die Schule~~ / ~~Du darf nicht rauchen~~ · helfen بالأكوزاتيف ⇒ ~~Das hilft mich~~ / ~~hilft den Patient~~ · جنس المركّب من الكلمة الأولى أو الترجمة ⇒ ~~die Krankenwagen~~ / ~~der Notaufnahme~~ / ~~das Zahnschmerz~~) · 13 كلمة · خطة SD1: u11-d5 done.
- **ما خرج:** tischlampe من تمرين مصيدة الجنس · «Das hilft mir (Dativ)» إجابةً في الـQuiz · «Ich muss zum Arzt gehen» (مثال SD1) من الاختبار القبلي والـQuiz · bauchschmerz صار له بنود.
- **اختبارات:** كتلة D175 (+1 — تثبّت العدد الكلي للمانيفست 1949؛ كتلة D174 صارت تثبّت kc-1..20 فقط) · المثال غير المُرقّى ← a1-u12-d1 بفجواته المقيسة · curriculum-plan: u11-d5 done (13) والتالي pending a1-u12-d2 · content-units 877 كلمة · 708/708 · validator 1118/0/0.
- **الوثائق:** +N-116 (بانتظار المالك: dürfen وsollen معاً؟) · حُدّثت N-096 · N-099 · N-103 · N-110 · N-113 · الموجّه 3.32.

## 2026-10-18 — الدفعة 129: a1-u11-d4 مُرقّى — Wie fühlst du dich? (D174) · sich fühlen · haben/sein بأفعال اليوم · الأمر بـSie والقوس · مثال blut مصحّح
- **إضافة:** حوار `a1-u11-d4-wie-fuehlst-du-dich` (kc-1..20 مكالمة اليوم الحادي عشر) · مانيفست 1928 · المرجع 1572 · معجم النطق 75 (بلا جديد — Hals kc-4 · Kurs kc-9).
- **تحسين المحتوى:** 68 بنداً/4 أنواع (فراغ 30 · استماع 16 · ترتيب 10 · إملاء 12) · Quiz 3×6 · 3 مصائد بـ10‑ي (sich fühlen بلا منعكس/بالداتيف ⇒ ~~Ich fühle besser~~ / ~~Ich fühle mir gut~~ · sein بدل haben ⇒ ~~Der Finger ist geblutet~~ / ~~Ich bin eine Spritze bekommen~~ · الأمر بـSie والقوس ⇒ ~~Sie rauchen nicht!~~ / ~~Ich kann schlucken nicht gut~~) · 12 كلمة · القاعدتان القائمتان ars-perfekt + ars-satzklammer (لا ملف جديد — sich fühlen بلا ملف: N-115).
- **تصحيح بيانات:** مثال blut («Das Blut ist rot.» — rot بلا درس ⇒ «Das Blut kommt aus der Wunde.») · خطة الترقية u11-d4 done (properNouns Lena — Yusuf لا يظهر في نصوص الدرس · بلا misspellings).
- **اختبارات:** كتلة D174 (+1 — تثبّت العدد الكلي للمانيفست 1928؛ كتلة D173 صارت تثبّت kb-1..20 فقط) · المثال غير المُرقّى ← a1-u11-d5 بفجواته المقيسة · 707/707 · validator 1115/0/0.
- **الوثائق:** +N-115 (بانتظار المالك: ars-reflexiv؟) · حُدّثت N-096 · N-099 · N-103 · N-110 · N-113 · الموجّه 3.31.

## 2026-10-18 — الدفعة 128: a1-u11-d3 مُرقّى — الماضي مع sein — Ich bin im Bett geblieben (D173) · ars-perfekt (ملف واحد) · مثالان مصحّحان · معجم gehustet
- **إضافة:** `content/arsenal/grammar/ars-perfekt.json` (أربع وخمسون قاعدة يوم — كانت مُشاراً إليها من 13 درساً بلا ملف؛ تجمع sein-Perfekt وwar/hatte — قرار نطاق D173) · حوار `a1-u11-d3-ich-bin-im-bett-geblieben` (kb-1..20 مكالمة اليوم العاشر) · مانيفست **1908** (الدفعة 127 كتبت 1889 والصحيح كان 1888 — N-114) · المرجع 1557 · معجم النطق **75** (+gehustet: ʊ ⇒ uː · kb-4 أُعيد).
- **تحسين المحتوى:** 68 بنداً/4 أنواع (فراغ 30 · استماع 16 · ترتيب 10 · إملاء 12) · Quiz 3×6 · 3 مصائد بـ10‑ي (haben بدل sein ⇒ ~~Ich habe heute zu Hause geblieben~~ / ~~Der Schmerz hat verschwunden~~ · الحاضر بدل war/hatte ⇒ ~~Ich bin gestern krank~~ / ~~Ich habe gestern Fieber~~ · sein بدل haben ⇒ ~~Ich bin im Bett gelegen~~ / ~~Ich bin gehustet~~) · 12 كلمة — الخمس التي كانت بلا بند (bleiben · liegen · husten · niesen · verschwinden) صار لكلٍّ منها فراغ وإملاء مقطع · `ars-praeteritum` أُزيلت من grammarArsenalIds/usedArsenalIds.
- **تصحيح بيانات:** مثالان (husten «Ich habe die ganze Nacht gehustet.» ⇒ «Ich habe die Nacht viel gehustet.» (ganze بلا درس) · bleiben «Ich bin zu Hause geblieben.» ⊃ مثال SD1 «Ich bin zu Hause» ⇒ «Ich bin heute zu Hause geblieben.» — D108) · خطة الترقية u11-d3 done (properNouns Yusuf/Lena · بلا misspellings) · usedInLessons لـars-perfekt = الدروس الثلاثة عشر فعلاً (أمسك المدقِّق a2-u1-d1 الناقصة).
- **اختبارات:** كتلة D173 (+1 — تثبّت طول المانيفست لأول مرة: 1908) · المثال غير المُرقّى ← a1-u11-d4 بفجواته المقيسة · المعجم 75 في سبع كتل قديمة · 706/706 · validator 1114/0/0.
- **الوثائق:** أمر المالك المؤكَّد (2026-10-17): «واصل» + «جمع جميع ملاحظاتك وقراراتك لنناقشها في نهاية المشروع» — المعلّقات تبقى على افتراضاتها المعلنة · +N-114 (مغلقة) · حُدّثت N-096 · N-099 · N-103 · N-110 · N-112 · الموجّه 3.30.

## 2026-10-17 — الدفعة 127: a1-u11-d2 مُرقّى — عند الطبيب — Was fehlt dir? (D172) · ars-gesundheit · نواة fehlen · ثلاثة أمثلة مصحّحة
- **إضافة:** `content/arsenal/grammar/ars-gesundheit.json` (ثلاث وخمسون قاعدة يوم) · كلمة `fehlen` بمقطعها · حوار `a1-u11-d2-was-fehlt-dir` (ka-1..20 مكالمة اليوم التاسع) · مانيفست 1889 · المرجع 1529 · معجم النطق 74 (بلا جديد).
- **تحسين المحتوى:** 68 بنداً/4 أنواع (فراغ 30 · استماع 16 · ترتيب 10 · إملاء 12) · Quiz 3×6 · 3 مصائد بـ10‑ي (الألم جمعاً وبلا أداة ⇒ ~~Ich habe Kopfschmerz~~ · fehlen بالداتيف ⇒ ~~Was fehlst du?~~ / ~~Was fehlt dich?~~ · zum/zur وgibt mir ⇒ ~~zu der Arzt~~ / ~~gibt mich~~) · 13 كلمة · «dativ» الرمزية خرجت من التدريب.
- **تصحيح بيانات:** ثلاثة أمثلة (schmerz «Der Schmerz ist stark.» ⇒ «Der Schmerz kommt und geht.» · arzt «Ich muss zum Arzt.» ⊂ مثال SD1 ⇒ «Ich gehe heute zum Arzt.» · fieber «Ich habe Fieber.» ⊂ مثال قائمة A2 ⇒ «Ich habe seit gestern Fieber.») · خطة الترقية u11-d2 done (properNouns Yusuf/Lena · بلا misspellings) · خطة SD1 u11-d2 done · تسجيل ka على Hals/Tablette/holt/Kurs (N-099).
- **اختبارات:** كتلة D172 (+1) · المثال غير المُرقّى ← a1-u11-d3 بفجواته المقيسة · مثبّتات النواة ← a1-u11-d5 (das Ergebnis) · العدّ 876 · 705/705 · validator 1112/0/0.

## 2026-10-17 — الدفعة 126: a1-u11-d1 مُرقّى — الجسم — weh tun (D171) · ars-koerper · نواة der Teil/tun/weh tun · ثلاثة أمثلة مصحّحة
- **إضافة:** `content/arsenal/grammar/ars-koerper.json` (اثنتان وخمسون قاعدة يوم) · كلمات `teil` · `tun` · `weh-tun` بمقاطعها · حوار `a1-u11-d1-alles-tut-weh` (kw-1..20 مكالمة اليوم الثامن) · مانيفست 1867 · المرجع 1516 · معجم النطق 74 (بلا جديد).
- **تحسين المحتوى:** 69 بنداً/4 أنواع (فراغ 30 · استماع 17 · ترتيب 10 · إملاء 12) · Quiz 3×6 · 3 مصائد بـ10‑ي (الجنس بلا منطق ⇒ ~~die Bein~~ · الجمع بـ‑s ⇒ ~~die Hands~~ · weh tun ⇒ ~~Mein Kopf weh tut~~ / ~~Meine Beine tut weh~~ / ~~Mich tut~~) · 15 كلمة.
- **تصحيح بيانات:** ثلاثة أمثلة (kopf «Mein Kopf tut weh.» = مثال SD1 الرسمي ⇒ «Mir tut der Kopf weh.» · auge «Mein Auge ist rot.» ⇒ «Mach die Augen zu!» · weh-tun ⇒ «Meine Beine tun weh.») · خطة الترقية u11-d1 done (properNouns Yusuf/Lena · بلا misspellings) · خطة SD1 u11-d1 done · تسجيل kw على Hals/Fußball/okay/Kurs (N-099).
- **اختبارات:** كتلة D171 (+1) · المثال غير المُرقّى ← a1-u11-d2 · مثبّتات النواة ← a1-u11-d2 (وحِمل u9-d1 بـdas Internet من u12-d2) · العدّ 875 · 704/704 · validator 1109/0/0.

## 2026-10-17 — الدفعة 125: a1-u10-d5 مُرقّى — weil — الجملة التابعة (D170) · ars-weil-satz · نواة normal/der Job/verdienen · ثلاثة أمثلة مصحّحة · الوحدة 10 مكتملة
- **إضافة:** `content/arsenal/grammar/ars-weil-satz.json` (إحدى وخمسون قاعدة يوم) · كلمات `normal` · `job` · `verdienen` بمقاطعها · حوار `a1-u10-d5-warum-weil` (wk-1..20 مكالمة اليوم السابع) · مانيفست 1844 · المرجع 1504 · معجم النطق 74 (بلا جديد).
- **تحسين المحتوى:** 66 بنداً/4 أنواع (فراغ 30 · استماع 14 · ترتيب 10 · إملاء 12) · Quiz 3×6 · 3 مصائد بـ10‑ي (المصرَّف ثانياً بعد weil ⇒ ~~weil ich bin krank~~ · المصرَّف قبل التصريف الثالث/المصدر ⇒ ~~weil ich habe Fußball gespielt~~ · لا قلب بعد deshalb/جملة weil المتقدّمة ⇒ ~~deshalb ich brauche~~) · 15 كلمة.
- **تصحيح بيانات:** ثلاثة أمثلة (unwohl «Ich fühle mich unwohl.» ⇒ «Mir ist heute unwohl.» · dringend «Es ist dringend.» = مثال SD1 الرسمي ⇒ «Der Termin ist dringend.» · stress ⇒ «Ich habe viel Stress im Kurs.») · خطة الترقية u10-d5 done (properNouns Yusuf/Lena/Berlin/Deutschland/Tunesien · بلا misspellings) · خطة SD1 u10-d5 done · تسجيل wk على Notfall/Fußball/Kurs/Tunesien/okay (N-099).
- **اختبارات:** كتلة D170 (+1) · المثال غير المُرقّى ← a1-u11-d1 (u10-d6 توليف) · مثبّتات النواة ← a1-u11-d1 · العدّ 872 · 703/703 · validator 1104/0/0.

## 2026-10-17 — الدفعة 124: a1-u10-d4 مُرقّى — ظروف الزمن والمنفصلة وبلا ge‑ في Perfekt (D169) · ars-zeitangaben · نواة der Anfang/der Verein · سبعة أمثلة مصحّحة
- **إضافة:** `content/arsenal/grammar/ars-zeitangaben.json` (خمسون قاعدة يوم) · كلمات `anfang` · `verein` بمقطعيهما · حوار `a1-u10-d4-endlich-wochenende` (ew-1..20 مكالمة اليوم السادس) · مانيفست 1821 · المرجع 1498 · معجم النطق 74 (بلا جديد).
- **تحسين المحتوى:** 65 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد بتعليل صحيح (الظرف بعد التصريف ⇒ ~~Ich habe angerufen neulich.~~ · المنفصل مفكوكاً ⇒ ~~Ich habe gerufen an.~~ · ge‑ على be‑/ver‑/‑ieren ⇒ ~~getelefoniert~~) · 14 كلمة.
- **تصحيح بيانات:** سبعة أمثلة (neulich · aufschreiben · erinnerung · notiz · damals · richtig · falsch — N-109) · خطة الترقية u10-d4 done (properNouns Yusuf/Lena/Tunis/Berlin · misspellings getelefoniert/gebesucht/gevereinbart) · خطة SD1 u10-d4 done · تسجيل ew على Kurs/April/Fußball/nachher/Notiz/geregnet (N-099).
- **اختبارات:** كتلة D169 (+1) · المثال غير المُرقّى ← a1-u10-d5 · مثبّتات النواة ← a1-u10-d5 · العدّ 869 · 702/702 · validator 1099/0/0.

## 2026-10-17 — الدفعة 123: a1-u10-d3 مُرقّى — الماضي المركّب مع haben (D168) · ars-perfekt-haben · نواة früher/gewinnen · ستة أمثلة مصحّحة
- **إضافة:** `content/arsenal/grammar/ars-perfekt-haben.json` (تسع وأربعون قاعدة يوم) · كلمات `frueher` · `gewinnen` بمقطعيهما · حوار `a1-u10-d3-was-hast-du-gestern-gemacht` (wg-1..20 مكالمة اليوم الخامس) · مانيفست 1799 · المرجع 1476 · معجم النطق 74 (geregnet · geholt).
- **تحسين المحتوى:** 63 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد بتعليل صحيح (haben يسقط أو يُستبدل بالحاضر ⇒ ~~Gestern ich habe …~~ · التصريف قبل المفعول ⇒ ~~Ich habe gegessen Fisch.~~ · تعميم ge‑…‑t على القوي ⇒ ~~gegesst~~) · 14 كلمة.
- **تصحيح بيانات:** ستة أمثلة (gestern · vorgestern · letzt · fragen · paket · denken — N-108) · خطة الترقية u10-d3 done (properNouns Yusuf/Lena/Tunis/Mia/Berlin) · خطة SD1 u10-d3 done · تسجيل wg على Onkel/Fußball/regnet/Spaziergang (N-099).
- **اختبارات:** كتلة D168 (+1) · المثال غير المُرقّى ← a1-u10-d4 · مثبّتات النواة ← a1-u10-d4 · العدّ 867 · 701/701 · validator 1095/0/0.

## 2026-10-17 — الدفعة 122: a1-u10-d2 مُرقّى — المواعيد والتاريخ (D167) · ars-termin-datum · نواة lieb-/der Moment/enden · مُعرِّف العدد الترتيبي
- **إضافة:** `content/arsenal/grammar/ars-termin-datum.json` (ثمان وأربعون قاعدة يوم) · كلمات `lieb` · `moment` · `enden` بمقاطعها · حوار `a1-u10-d2-der-zweite-april` (za-1..20 مكالمة اليوم الرابع) · مانيفست 1777 · المرجع 1453 · `ORDINAL_NUMBER`/`ordinalKnown` في `tools/lib/vocab-forms.ts`.
- **تحسين المحتوى:** 61 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد بتعليل صحيح («يوم الثلاثاء» بلا حرف ⇒ ~~Dienstag habe ich Zeit.~~ · «الثاني من أبريل» ⇒ ~~der zweite von April~~ · النهاية الثابتة ⇒ ~~am zwölfte April~~) · 15 كلمة.
- **تصحيح بيانات:** مثالا datum/einladung · خطة الترقية u10-d2 done (properNouns Yusuf/Lena/Tunis/Mia) · خطة SD1 u10-d2 done · تسجيل za على April/Kurs/Onkel (N-099).
- **اختبارات:** كتلة D167 (+1) · كتلة الترتيبي (+4) · المثال غير المُرقّى ← a1-u10-d3 · مثبّتات النواة ← a1-u10-d3 · العدّ 865 · 700/700 · validator 1091/0/0.

## 2026-10-17 — الدفعة 121: a1-u10-d1 مُرقّى — الطقس بـes الشكلي (D166) · ars-wetter-es · أربعة أمثلة كلمات مصحّحة
- **إضافة:** `content/arsenal/grammar/ars-wetter-es.json` (سبع وأربعون قاعدة يوم) · حوار `a1-u10-d1-wie-ist-das-wetter` (wt-1..20 مكالمة صباحية) · مانيفست 1754 · المرجع 1435.
- **تحسين المحتوى:** 60 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد بتعليل صحيح («تمطر» بلا فاعل ⇒ ~~Heute regnet.~~ · الجملة الاسمية ⇒ ~~Es kalt.~~ · «الجو ممطر» ⇒ ~~Es ist regnet.~~) · 12 كلمة.
- **تصحيح بيانات:** أمثلة schnee/wind/himmel/kalt بلا schneit/Winter/stark/blau · خطة الترقية u10-d1 done (properNouns Yusuf/Lena/Berlin/Tunis) · تسجيل wt على regnet (N-099).
- **اختبارات:** كتلة D166 (+1) · المثال غير المُرقّى ← a1-u10-d2 · 695/695 · validator 1086/0/0.

## 2026-10-17 — الدفعة 120: a1-u9-d5 مُرقّى — قوس الجملة وترتيب الظروف (D165) · ars-satzklammer + ars-tekamolo · نواة خمس · الوحدة 9 مكتملة
- **إضافة:** `content/arsenal/grammar/ars-satzklammer.json` و`ars-tekamolo.json` (ست وأربعون قاعدة يوم) · `content/words/{andere,weiter,halten,polizei,stelle}.json` + مقاطعها (المولِّد D105) · حوار `a1-u9-d5-im-stau` (st-1..20 مكالمة من الحافلة) · مانيفست 1734 · المرجع 1429 · مدخل معجم nächsten (72).
- **تحسين المحتوى:** 58 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد بتعليل صحيح (الجملة الاسمية العربية ⇒ ~~Heute ich fahre~~ · الفعل المتصل ⇒ ~~kommt an um neun~~ · مرونة الظروف ⇒ ~~mit dem Bus heute~~) · 11 كلمة.
- **تصحيح بيانات:** مثال pünktlich بلا abfahren · خطة النواة u9-d5 done · gen-audio.py word_tracks +5 · تسجيل st على wohin/vor/danach/Fahrplan/Haltestelle (N-099) · كتلة D162 (مسارات Haltestelle + st-9).
- **اختبارات:** كتلة D165 (+1) · خطة النواة (u9-d5 done · المعلّق u10-d2 · اختبار الحِمل بـenden) · المثال غير المُرقّى ← a1-u10-d1 · 862 كلمة · 694/694 · validator 1084/0/0.

## 2026-10-17 — الدفعة 119: a1-u9-d4 مُرقّى — Wechselpräpositionen باسمها (D164) · ars-wechselpraep · نواة auf sein/zu sein
- **إضافة:** `content/arsenal/grammar/ars-wechselpraep.json` (أربع وأربعون قاعدة يوم — usedInLessons u9-d4 + u9-d6) · `content/words/{auf-sein,zu-sein}.json` + مقطعاهما (المولِّد D105) · حوار `a1-u9-d4-zu-hause-in-tunis` (tn-1..20 أول مكالمة من تونس) · مانيفست 1709 · المرجع 1417.
- **تحسين المحتوى:** 57 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد بتعليل صحيح (حرف واحد لا يتغيّر ما بعده ⇒ ~~in dem Tunnel gehen~~ · «ضد» يجرّ ⇒ ~~gegen der Wand~~ · الإضافة بلا أداة ⇒ ~~vor Kirche~~) · 14 كلمة · الدفء wand/tisch/wohin.
- **تصحيح بيانات:** أمثلة an/Brücke بلا Ampel/Fluss · Nähe بلا جمع · خطة النواة u9-d4 done · gen-audio.py word_tracks +2 · تسجيل tn على Kurs/wohin/vor/danach/geradeaus/okay/dunkel (N-099).
- **اختبارات:** كتلة D164 (+1) · خطة النواة (u9-d4 done · المعلّق u9-d5) · المثال غير المُرقّى ← a1-u9-d5 · 857 كلمة · 693/693 · validator 1076/0/0.

## 2026-10-17 — الدفعة 118: a1-u9-d3 مُرقّى — طلب المساعدة والأمر Sie (D163) · ars-imperativ-sie · نواة bitten/erklären/die Hilfe · معجم erklärt
- **إضافة:** `content/arsenal/grammar/ars-imperativ-sie.json` (ثلاث وأربعون قاعدة يوم — usedInLessons u9-d3 + u9-d4 + u9-d6) · `content/words/{bitten,erklaeren,hilfe}.json` + مقاطعها (المولِّد D105) · حوار `a1-u9-d3-weg-und-hilfe` (wf-1..20 تمرين أدوار عبر الشاشة) · مانيفست 1687 · مدخل معجم erklärt (71).
- **تحسين المحتوى:** 53 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد بتعليل صحيح (بلا ضمير بعد الأمر ⇒ ~~Biegen links ab~~ · «ساعدني» مفعول مباشر ⇒ ~~Helfen Sie mich~~ · «انعطف» كلمة واحدة ⇒ ~~Biegen Sie ab links~~) · 15 كلمة.
- **تصحيح بيانات:** مثالا zuerst/danach بلا dann/zweite · خطة النواة u9-d3 done · gen-audio.py word_tracks +3 · المرجع 1400 · تسجيل wf على Kurs/danach/Stadtplan/geradeaus/okay/Tunesien (N-099).
- **اختبارات:** كتلة D163 (+1) · خطة النواة (u9-d3 done · المعلّق u9-d4) · المثال غير المُرقّى ← a1-u9-d4 · 855 كلمة · 692/692 · validator 1072/0/0.

## 2026-10-17 — الدفعة 117: a1-u9-d2 مُرقّى — بالحافلة والقطار (D162) · معجم Bahnsteig/Haltestelle · استعادة البيئة (N-104)
- **إضافة:** `content/arsenal/grammar/ars-weg-verkehr.json` (اثنتان وأربعون قاعدة يوم — القاعدة المخططة: einsteigen/umsteigen/aussteigen · Wo/Wohin · Linie/Bahnsteig بلا أداة · Abfahrt/Ankunft um … Uhr · weit/nah · hin und zurück · vorbei · überall — usedInLessons u9-d2 + u9-d3 + u9-d6) · حوار `a1-u9-d2-mit-bus-und-bahn` (hb-1..20 مكالمةً) · مانيفست 1664 · مدخلا معجم Bahnsteig وHaltestelle (70).
- **تحسين المحتوى:** 52 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد بتعليل صحيح («أغيّر» فعل واحد ⇒ ~~Ich umsteige~~ · «أين تذهب؟» ⇒ ~~Wo fährst du?~~ · «الساعة الثامنة» ⇒ ~~ist acht Uhr~~) · بلا نواة.
- **تصحيح بيانات:** سبعة أمثلة كلمات (einsteigen · vorbei · umsteigen · Kreuzung · nah · Richtung · hin) بلا أمر Sie ولا in den/an der ولا ganz · bahnsteig +sp-st-initial · word-bahnsteig/word-haltestelle/mt1-h1-d6-l3 أُعيدت · تسجيل hb على vierzig/geradeaus/holt (N-099) · المرجع 1396.
- **اختبارات:** كتلة D162 (+1) · المثال غير المُرقّى ← a1-u9-d3 · 691/691 · validator 1067/0/0.
- **السجل:** N-104 جديدة (أدوات الفحص خارج git تضيع مع الانقطاع) · N-103 مُجرَّبة نموذجاً في check.ts.

## 2026-10-17 — الدفعة 116: a1-u9-d1 مُرقّى — أماكن المدينة والاتجاهات (D161) · وثغرة الحارس weit/wei (N-103)
- **إضافة:** `content/arsenal/grammar/ars-stadt-ort.json` (إحدى وأربعون قاعدة يوم — القاعدة المخططة: Wo ist …? + hier/dort · gegenüber + الداتيف · im/nach + الجهة · geradeaus · zurück — usedInLessons u9-d1 + u9-d6) · حوار `a1-u9-d1-wo-ist-dein-kurs` (20 سطراً sk-1..20 مكالمةً) · لا مدخل معجم جديد.
- **تحسين المحتوى:** 55 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد بتعليل صحيح («مقابل» لا تغيّر «الـ» ⇒ ~~gegenüber die Kirche~~ · «شمالاً» ⇒ ~~ist nach Norden~~/~~fahren im Norden~~ · «أعود غداً» ⇒ ~~komme zurück morgen~~) · استدعاء stadt/bahnhof/rechts.
- **تصحيح بيانات:** ثمانية أمثلة كلمات (Krankenhaus · Bank · Post · Platz · Norden · Süden · geradeaus · zurück) بلا Wechselpräpositionen ولا صيغة الأمر Sie · تسجيل sk على Kurs/geradeaus/Tunesien (N-099) · المرجع 1378.
- **اختبارات:** كتلة D161 (+1 — الاستدعاء كلمةً كاملة · نص الإملاء = نص المسار) · المثال غير المُرقّى ← a1-u9-d2 · 690/690 · validator 1065/0/0.
- **السجل:** N-103 جديدة (weit مرّت من الحارس عبر الجذع wei).

## 2026-10-17 — الدفعة 115: a1-u8-d5 مُرقّى — von/seit/bei (D160) · الوحدة 8 كلها مُرقّاة
- **إضافة:** `content/arsenal/grammar/ars-von-seit-bei.json` (أربعون قاعدة يوم — القاعدة المخططة: von للمصدر والمرسل والملكية ≠ aus · seit + الداتيف والفعل مضارع · bei «عند» · vom/beim — usedInLessons u8-d5 + u8-d6) · حوار `a1-u8-d5-eine-tuete-vom-markt` (20 سطراً vb-1..20 مكالمةً) · لا مدخل معجم جديد.
- **تحسين المحتوى:** 56 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد بتعليل صحيح («من» واحدة ⇒ ~~von Tunesien~~/~~aus dem Markt~~ · «منذ» لا تغيّر ⇒ ~~seit zwei Monate~~ · «عند» لا تغيّر «الـ» ⇒ ~~bei die Bäckerei~~) · استدعاء markt/verkaeufer/bezahlen.
- **تصحيح بيانات:** أمثلة von/seit/mode/umtausch (بلا ملكية داتيف ولا نص SD1 حرفي) · Mode «die Moden» · Stiefel/Schalter «بلا نهاية» · تسجيل vb على Tunesien/regnet (N-099) · المرجع 1376.
- **اختبارات:** كتلة D160 (+1) · المثال غير المُرقّى ← a1-u9-d1 · 689/689 · validator 1063/0/0.
- **السجل:** N-102 جديدة (فحص الاستدعاء بالبادئة) · N-101 تمدّدت (‑erei).

## 2026-10-17 — الدفعة 114: a1-u8-d4 مُرقّى — الداتيف الثابت (D159) · وتصحيح حوار u8-d3 (N-100)
- (سُجّلت في PROGRESS.md وDECISIONS.md؛ سقطت من هذا الملف سهواً وتُستدرك هنا.) **إضافة:** `ars-dativ-fix.json` (usedInLessons سبعة دروس) · حوار `a1-u8-d4-wie-kommst-du-zum-flughafen` (fh-1..20) · مدخل معجم holt (68). **تحسين:** 52 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد. **تصحيح:** km-16/17/19/20 بالمفرد (N-100 مغلقة) · parken «يركن». **السجل:** N-101 جديدة. 688/688 · 1061/0/0.

## 2026-10-17 — الدفعة 113: a1-u8-d3 مُرقّى — ما يجب وما يمكن (D158) · وتسريع النطق بلا ONNX
- **إضافة:** `content/arsenal/grammar/ars-koennen-muessen.json` (ثامن وثلاثون قاعدة يوم — القاعدة المخططة: الفعل الناقص ثانياً والمصدر آخراً بلا zu · ich = er بلا ‑t · kann/können · muss/müssen · nicht müssen = لا حاجة — usedInLessons u8-d3 + u8-d6) · `content/words/kriegen.json` (النواة) + مقطعه · حوار `a1-u8-d3-was-musst-du-kaufen` (20 سطراً km-1..20) · مدخل معجم Abteilung (نبر ‑teil‑؛ word-abteilung معاد توليده).
- **تحسين المحتوى:** 50 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح («أن» ⇒ ~~Ich muss zu bezahlen.~~ · الفعلان يتصرّفان معاً ⇒ ~~Ich muss kaufe einen Gürtel.~~ · «يجب» ثابتة ⇒ ~~Du muss bezahlen.~~) · استدعاء anprobieren/kaufen/bezahlen بدل passen/möglich (N-020 مغلقة).
- **تصحيح بيانات:** أمثلة korb/wagen بلا «voll» · kreditkarte بلا داتيف · Wagen/Gürtel «Gleich_plural» ⇒ «بلا نهاية» (بقي 22) · Stück/Kleidung ملاحظتان دقيقتان · تسجيل km على Tunesien/okay/Kreditkarte/regnet (N-099) · المرجع 1362.
- **أداة:** `tools/gen-audio.py` `load_phonemizer()` — النطق بلا جلسة ONNX (3.5 ث ⇒ 0.4 ث لكل عملية Python؛ اختبارات المعجم كانت تسقط بالمهلة) — تستعمله phonemize.py وpronunciation-audit.py والاختبارات.
- **الاختبارات:** +2 (درس u8-d3 الكامل · مصائده الثلاث) · المثال القديم ← a1-u8-d4 · الخطة: u8-d3 done والتالي a1-u9-d3 · ALL_WORDS 852 · 687/687.
- **الرفع:** `0fcd1af` (المحتوى والأدوات) ثم الوثائق.
- **الخطة والسجل:** 35/48 نواة · 91/123 كلمة · 38/60 ترقية · التالي a1-u8-d4. أُغلقت N-020؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-060/N-085/N-096/N-099.

## 2026-10-17 — الدفعة 112: a1-u8-d2 مُرقّى — الأسعار (D157) · وحادث build_all العرضي وحارسه
- **إضافة:** `content/arsenal/grammar/ars-preise.json` (سابع وثلاثون قاعدة يوم — القاعدة المخططة: الشيء فاعلٌ والفعل يتبعه kostet/kosten · السنتات بعد Euro بلا كلمة Cent وما دون اليورو بـCent · الحكم günstig/billig/zu teuer · Rabatt بالمبلغ · am besten) · حوار `a1-u8-d2-was-kosten-die-schuhe` (20 سطراً ws-1..20) · كلمتا النواة beste · circa بالمولِّد · مدخل معجم circa (c اللاتينية كافاً ⇒ [ts]) · مراجعة neunundachtzig (variant — المرجع غير متسق في نبر الأعداد المركّبة).
- **تحسين المحتوى:** 48 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح («الحذاء» مفردٌ للزوج ~~Was kostet die Schuhe?~~ · «كم» واحدة ~~Wie kostet das Hemd?~~ · علامة المفعول لا تظهر ~~den Kunde~~ — n-Deklination) · 12 مثال بطاقة رتيباً صار جملاً بالمدروس · بطاقات الاستدعاء من دروس سابقة (Preis · kosten · bezahlen) · هدف ومهمة وخلاصة بالمدروس.
- **تصحيح بيانات:** Cent «die Cent(s)» ⇒ «die Cent» بلا نهاية بعد العدد · Verkäufer «Gleich_plural» ⇒ «بلا نهاية» (بقي 24) · Kunde ‑n مع المفعول den Kunden · Supermarkt/Markt «ä + ‑e» · تسجيل ws-4/ws-5 على vierzig وws-6/ws-7 على Rabatt في المعجم.
- **أداة:** `tools/gen-audio.py` يرفض أي أمر مجهول (خروج 2) بدل السقوط في `build_all` — بعد أن أعاد نداءٌ خاطئ توليد 850 مقطعاً في الخلفية (أمسكته بوابة البصمات؛ استُعيدت الملفات من git).
- **الاختبارات:** +3 (درس u8-d2 الكامل · مصائده الثلاث · حارس gen-audio.py) · اختبار ملاحظات الجمع يفحص المثال داخل الملاحظة أيضاً · المثال القديم a1-u8-d3 مقيس · ALL_WORDS 851 · 685/685.
- **الرفع:** `242b882` (المحتوى) ثم الوثائق.
- **الخطة والسجل:** 34/48 نواة · 90/123 كلمة · 37/60 ترقية · التالي a1-u8-d3. أُضيفت N-098 (مغلقة) وN-099؛ حُدّثت N-010/N-011/N-013/N-015/N-020/N-021/N-022/N-050/N-060/N-069/N-085/N-096.

## 2026-10-17 — الدفعة 111: a1-u8-d1 مُرقّى — الملابس (D156) · والرفع على نقاط
- **إضافة:** `content/arsenal/grammar/ars-kleidung-genus.json` (سادس وثلاثون قاعدة يوم — القاعدة المخططة: الجنس يُحفظ ولا يُنقل من العربية · الزوج بالجمع · dies‑ بنهاية الأداة · gefallen كـ«يعجبني») · حوار `a1-u8-d1-was-ist-im-koffer` (20 سطراً kl-1..20) · كلمتا `dieser` · `gefallen` (نواة SD1) بالمولِّد — 22 مساراً جديداً (1541) · **اختبار عام يطابق ملاحظة الجمع بالجمع** (Umlaut يُدّعى ولا يقع · نهاية تُذكر ولا تقع).
- **تحسين المحتوى:** 48 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح (فردة الحذاء ~~Mein Schuh ist neu.~~ — صحيحة نحواً وتقول البطاقة ذلك · I like ~~Ich gefalle das Kleid.~~ · «هذا» بلا محايد ~~Dieser Kleid ist schön.~~) وثلاثة أعوان مسمّاة · أمثلة 14 بطاقة بلا رتابة ولا نص رسمي · مقارنة آلية بالملفين الرسميين (316 مقطعاً ⇒ صفر بعد تصحيحات التأليف).
- **تصحيح بيانات:** خمس عشرة ملاحظة جمع خاطئة علمياً (ستٌّ في دروس مُرقّاة) · ملاحظات جمع الملابس الاثنتا عشرة بالاصطلاح الجديد (Pullover خرج من «Gleich_plural» — بقي 25) · سطرا kl-4/kl-6 سُجّلا على مدخلي المعجم Tunesien وPullover.
- **الاختبارات:** +3 (ملاحظات الجمع · درس u8-d1 · مصائده ومشتِّتاته العشرون) · اختبارا ملاحظات الجمع والجمع الدائم يشملان u8-d1 · الخطة: u8-d1 done والتالي a1-u8-d2 · المثال غير المُرقّى ← a1-u8-d2.
- **الرفع:** على نقاط بأمر المالك — `0ea2f23` (الأمر) · `e81d325` (أخطاء الجمع) · ثم المحتوى · ثم الوثائق.
- **الخطة والسجل:** 33/48 نواة · 88/123 كلمة · 36/60 ترقية · التالي a1-u8-d2. أُضيفت N-094/N-095/N-096/N-097؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-060/N-069/N-085.

## 2026-10-17 — الدفعة 110: a1-u7-d5 مُرقّى — من يقوم بأعمال البيت؟ (D155)
- **إضافة:** `content/arsenal/grammar/ars-trennbare.json` (خامس وثلاثون قاعدة يوم — القاعدة المخططة: الجزء المنفصل في آخر الجملة والفعل ثانياً · السؤال والأمر · المصدر متصلاً بعد möchte · النبر علامة الانفصال · frühstücken/besuchen لا تنفصلان — ويشير إليها توليف u7-d6) · حوار `a1-u7-d5-wer-macht-den-haushalt` (20 سطراً hh-1..20) — 20 مساراً جديداً (1519) · **اختبار عام: معاني الكلمات وترجمات أمثلتها بالعربية وحدها**.
- **تحسين المحتوى:** 49 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح (الفعل العربي كلمةٌ واحدة ~~Ich aufstehe …~~ · المفعول يلي الفعل وtidy up ~~Ich räume auf mein Zimmer.~~ · «أشاهد التلفاز» ~~Ich sehe den Fernseher.~~ — صحيحة نحواً بمعنى «أرى الجهاز» وتقول البطاقة ذلك) وثلاثة أعوان مسمّاة (ومنها نفي الدارجة التونسية «ما … ش») · أمثلة 16 بطاقة بلا أسماء علم ولا نص رسمي · مقارنة آلية بالملفين الرسميين (323 مقطعاً ⇒ صفر بعد تصحيحات التأليف).
- **تصحيح بيانات:** معنى Haushalt (صيني وعبري ⇒ عربي) · ملاحظات جمع ثماني كلمات بالاصطلاح الجديد (ومنها Koffer «Gleich_plural») · سطرا hh-16/hh-19 سُجّلا على مدخل المعجم Tunesien.
- **الاختبارات:** +3 (درس u7-d5 · مصائده ومشتِّتاته العشرون · معاني الكلمات بالعربية وحدها) · اختبارا ملاحظات الجمع والجمع الدائم يشملان u7-d5 · المثال غير المُرقّى ← a1-u8-d1.
- **الخطة والسجل:** 32/48 نواة · 86/123 كلمة · 35/60 ترقية (الوحدات 1–7) · التالي a1-u8-d1. أُضيفت N-092 وN-093؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-060/N-069/N-085.

## 2026-10-17 — الدفعة 109: a1-u7-d4 مُرقّى — نأخذ القطار (D154)
- **إضافة:** `content/arsenal/grammar/ars-praesens-unregelm.json` (رابع وثلاثون قاعدة يوم — القاعدة المخططة: تغيّر حركة الجذع مع du وer/sie/es وحدهما · a ← ä · au ← äu · e ← i · e ← ie · nimmt · ihr fahrt بلا ä — ويشير إليها توليف u7-d6) · حوار `a1-u7-d4-wir-nehmen-den-zug` (20 سطراً zg-1..20) · كلمات `gleich` · `ab` · `achtung` (نواة SD1) بالمولِّد — 23 مساراً جديداً (1499) · مدخل معجم النطق `schläft` (espeak يقرؤها [ʃlˈɛft]) قبل التوليد.
- **تحسين المحتوى:** 48 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح (ثبات حركة المضارع العربي ~~Lena nehmt …~~ · «أركب القطار» ~~Ich fahre den Zug.~~ — صحيحة نحواً بمعنى «أقود» وتقول البطاقة ذلك · isst/ist والجملة الاسمية ~~Lena ist einen Apfel.~~) وثلاثة أعوان مسمّاة · صدق اللهجة (er fahrt جنوبية صحيحة — حدٌّ لا مصيدة ولا مشتِّت) · sprechen خرجت من «الجديد» (N-018) · أمثلة 14 بطاقة بلا أسماء علم ولا نص رسمي · مقارنة آلية بالملفين الرسميين (282 مقطعاً ⇒ صفر بعد تصحيحات التأليف).
- **تصحيح بيانات:** معنى fahren · ملاحظات جمع خمس كلمات بالاصطلاح الجديد · أسطر zg-9/zg-16 سُجّلت على مدخلي المعجم ruft وdunkel · وعدد مقاطع المقارنة في سجل D153 (272 لا 289).
- **الاختبارات:** +2 (درس u7-d4 · مصائده ومشتِّتاته العشرون) · اختبارا ملاحظات الجمع والجمع الدائم يشملان u7-d4 · الخطة: u7-d4 done والتالي a1-u8-d1 (اختبارات الخطأ الإملائي والتوليف والدرس الوهمي انتقلت إليه) · المثال غير المُرقّى ← a1-u7-d5 · تثبيت مسارات مدخلي dunkel وruft صار arrayContaining.
- **الخطة والسجل:** 32/48 نواة · 86/123 كلمة · 34/60 ترقية · التالي a1-u7-d5. أُضيفت N-090 وN-091؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-060/N-069.

## 2026-10-16 — الدفعة 108: a1-u7-d3 مُرقّى — يومي بعشرة أفعال (D153)
- **إضافة:** `content/arsenal/grammar/ars-praesens-regelm.json` (ثالث وثلاثون قاعدة يوم — القاعدة المخططة: جذعٌ ثابت + نهاية الفاعل · e بعد t/d وبعد ساكنٍ ثم n · لا s ثانية بعد s/ß/z · ‑ieren منتظمة · Sie بصيغة الجمع — ويشير إليها توليف u7-d6) · حوار `a1-u7-d3-hausaufgaben` (20 سطراً pr-1..20) · كلمات `hausaufgabe` · `nie` · `einfach` (نواة SD1) بالمولِّد — 23 مساراً جديداً (1476) · مدخل معجم النطق `ruft` (espeak يقرؤها [rˈʊft]) وأُعيد pr-15.
- **تحسين المحتوى:** 47 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح («تـ» واحدة لأنتَ ولهي ~~Lena machst …~~ · مفرد الاحترام في الكلام اليومي ~~Wartest Sie …?~~ · «أنتظرك» وj'attends ~~Ich warte dich.~~ — صحيحة نحواً بمعنى «أصونك» وتقول البطاقة ذلك) وثلاثة أعوان مسمّاة · warten auf قطعةٌ قبل بابها (N-089) · «Das macht Spaß!» استُرجعت (N-087) · أمثلة 15 بطاقة بلا أسماء علم ولا نص رسمي وبأشخاص مختلفين · مقارنة آلية بالملفين الرسميين (272 مقطعاً ⇒ صفر بعد تصحيحات التأليف — صُحّح في D154: كان «289»).
- **تصحيح بيانات:** معنى rufen («يتصل» = anrufen) · أسطر pr-11/pr-14/pr-18 سُجّلت على مداخل المعجم Tunesien وFußball وokay.
- **الاختبارات:** +2 (درس u7-d3 · مصائده ومشتِّتاته العشرون) · اختبارا ملاحظات الجمع والجمع الدائم يشملان u7-d3 · الخطة: u7-d3 done والتالي a1-u7-d4 (اختبارات الخطأ الإملائي والتوليف والدرس الوهمي انتقلت إليه) · المثال غير المُرقّى ← a1-u7-d4.
- **الخطة والسجل:** 31/48 نواة · 83/123 كلمة · 33/60 ترقية · التالي a1-u7-d4. أُضيفت N-088 وN-089؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-069/N-087.

## 2026-10-16 — الدفعة 107: a1-u7-d2 مُرقّى — هواياتي (D152)
- **إضافة:** `content/arsenal/grammar/ars-gern-lieber.json` (ثاني وثلاثون قاعدة يوم — القاعدة المخططة: gern ظرفٌ بعد فعل النشاط · lieber بلا mehr · nicht gern · الهواية بلا أداة · mehr قبل الاسم · Viel Spaß! والملل بـmir) · حوار `a1-u7-d2-ich-tanze-lieber` (20 سطراً fz-1..20) · كلمات `film` · `mehr` · `wandern` (نواة SD1) بالمولِّد — 23 مساراً جديداً (1453) · مدخل معجم النطق `Hobbys` (espeak يقرؤها [hˈɔbyːs]).
- **تحسين المحتوى:** 46 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح («أحبّ … أكثر» والإنجليزية والفرنسية معلنتان ~~Ich lese mehr gern.~~ · «أحبّ» فعلٌ ~~Ich gern Fußball.~~ · «أنا زهقان» ~~Ich bin langweilig.~~ — صحيحة نحواً بمعنى آخر وتقول البطاقة ذلك) وثلاثة أعوان مسمّاة · «Das macht Spaß!» مؤجّلة إلى درس machen · أمثلة 15 بطاقة بلا أسماء علم ولا نص رسمي · مقارنة آلية بالملفين الرسميين (312 مقطعاً ⇒ صفر بعد تصحيحات التأليف).
- **تصحيح بيانات:** معنى lieber («أفضل» = better) · ملاحظات spass/kino/fussball/spiel · أسطر fz-2/3/4 وfz-7 سُجّلت على مدخلي المعجم Fußball وKurs.
- **الاختبارات:** +2 (درس u7-d2 · مصائده ومشتِّتاته العشرون) · اختبارا ملاحظات الجمع والجمع الدائم يشملان u7-d2 · الخطة: u7-d2 done والتالي a1-u7-d3 (اختبارات الخطأ الإملائي والتوليف والدرس الوهمي انتقلت إليه) · المثال غير المُرقّى ← a1-u7-d3.
- **الخطة والسجل:** 30/48 نواة · 80/123 كلمة · 32/60 ترقية · التالي a1-u7-d3. أُضيفت N-086 وN-087؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-069.

## 2026-10-16 — الدفعة 106: a1-u7-d1 مُرقّى — صباحي (D151)
- **إضافة:** `content/arsenal/grammar/ars-tagesablauf.json` (حادي وثلاثون قاعدة يوم — القاعدة المخططة: أفعال اليوم قطعٌ · aufwachen/wecken · duschen/baden · متى؟ وكم مرة؟ · die meisten · gehen + المصدر بلا zu) · حوار `a1-u7-d1-wann-wachst-du-auf` (20 سطراً mo-1..20) · كلمات `firma` · `immer` · `meisten` (نواة SD1 — meist- بالكلمة die meisten) بالمولِّد — 23 مساراً جديداً (1430).
- **تحسين المحتوى:** 43 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح («معظم الناس» إضافة والإنجليزية most people معلنة ~~Meisten die Leute …~~ · «أستحمّ» للاثنين ~~Ich bade jeden Morgen.~~ — صحيحة نحواً بمعنى آخر وتقول البطاقة ذلك · «أذهب لأنام» باللام ~~Ich gehe zu schlafen.~~) وثلاثة أعوان مسمّاة · لا سحب لقاعدة الأفعال المنفصلة (قطعٌ اليوم) · أمثلة 15 بطاقة بلا أسماء علم ولا نص رسمي · مقارنة آلية بالملفين الرسميين (331 مقطعاً ⇒ صفر بعد تصحيحات التأليف).
- **تصحيح بيانات:** معنى baden وduschen · ملاحظات pause/alltag/weg · **«Gleich_plural» خرج من ملاحظات 11 كلمة في الدروس المُرقّاة** (ومنها Trinkgeld ← Trinkgelder) · سطر mo-17 سُجّل على مدخل المعجم Kurs.
- **إصلاح أداة:** `pluralsFor` (تدقيق Goethe — D110): الدخيلة المنتهية بـ‑a تُسقطها قبل ‑en («die Firma, -en» ← Firmen لا «Firmaen») + حالة اختبار.
- **الاختبارات:** +3 (درس u7-d1 · مصائده ومشتِّتاته الثمانية عشر · ملاحظات الجمع بلا مصطلح داخلي) · اختبار الجمع الدائم يشمل u7-d1 · الخطة: u7-d1 done والتالي a1-u7-d2 (اختبارات الخطأ الإملائي والتوليف والدرس الوهمي انتقلت إليه) · المثال غير المُرقّى ← a1-u7-d2.
- **الخطة والسجل:** 29/48 نواة · 77/123 كلمة · 31/60 ترقية · التالي a1-u7-d2. أُضيفت N-084 وN-085؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-060/N-069.

## 2026-10-16 — الدفعة 105: a1-u6-d5 مُرقّى — أصف شقتي وكلمات da (D150)
- **إضافة:** `content/arsenal/grammar/ars-da-komposita.json` (ثلاثون قاعدة يوم — القاعدة المخططة: da + حرف المكان كلمةٌ واحدة · dar- قبل الحركة · لا تتغيّر · الفعل بعدها يطابق فاعله) · حوار `a1-u6-d5-was-ist-dazwischen` (20 سطراً mw-1..20) · كلمة `darauf` (مرساة القاعدة) بالمولِّد — 21 مساراً جديداً (1407) · قاعدة في الحارس: صيغ da(r)+حرف المكان معروفةٌ من درس مرساتها (`DA_COMPOUND` في `tools/lib/vocab-forms.ts`).
- **تحسين المحتوى:** 43 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح («عليه» حرفٌ ثم ضمير ~~Ich lege die Kissen auf es.~~ · الفعل المتقدّم مفرداً ~~Darauf steht zwei Vasen.~~ · «الأثاث» مفرد اللفظ ~~Die Möbel ist alt.~~) وثلاثة أعوان مسمّاة · افتراض N-069 مطبَّق · أمثلة 17 بطاقة إلى جمل تُظهر الشقة وكلمات da بلا أسماء علم · مقارنة آلية بالملفين الرسميين (357 مقطعاً ⇒ صفر بعد تصحيحات التأليف).
- **تصحيح بيانات:** Möbel جمعاً عادةً (gender none · بلا بطاقة جنس — N-070) · ملاحظة mitte بلا عبارة SD1 الحرفية · ستة مداخل معجم (dunkel · Handtuch · Handtücher · dazwischen · Etagen · Nachbarn) وأُعيد توليد word-dunkel وword-handtuch · ستة أسطر سُجّلت على مداخل okay · Nachbar · Tunesien · Badezimmer · Toilette · Schublade.
- **الاختبارات:** +5 (قاعدة da في الحارس ×3 · درس u6-d5 · مصائده ومشتِّتاته العشرون) · اختبار الجمع الدائم يشمل u6-d5 وMöbel · مسارات Badezimmer في اختبار D147 «تحويها» · المثال غير المُرقّى ← a1-u7-d1.
- **الخطة والسجل:** 28/48 نواة · 74/123 كلمة · 30/60 ترقية (الوحدات 1–6) · التالي a1-u7-d1. أُغلقت N-070؛ أُضيفت N-082 وN-083؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-060/N-069.

## 2026-10-16 — الدفعة 104: a1-u6-d4 مُرقّى — أين؟ وإلى أين؟ (D149)
- **إضافة:** `content/arsenal/grammar/ars-wo-wohin.json` (تاسع وعشرون قاعدة يوم — القاعدة المخططة: Wo? + dem · der · im · am · Wohin? + den · die · das · stellen/legen/hängen بشكل الشيء) · حوار `a1-u6-d4-das-sofa-ist-da` (20 سطراً ww-1..20) · كلمات `da` · `daneben` · `weg-sein` (نواة SD1) بالمولِّد — 23 مساراً جديداً (1386).
- **تحسين المحتوى:** 44 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح (الجرّ العربي دائم ~~Ich stelle die Lampe in der Ecke.~~ · «وضع» فعلٌ واحد والإنجليزية put والفرنسية mettre معلنتان ~~Ich lege die Tasse auf den Tisch.~~ — صحيحة نحواً بمعنى آخر وتقول البطاقة ذلك · «أين تضع؟» و«وين» ~~Wo stellst du den Tisch?~~) وثلاثة أعوان مسمّاة · افتراض N-069 مطبَّق · أمثلة 12 بطاقة إلى جمل متنوعة بلا أسماء علم · مقارنة آلية بالملفين الرسميين (302 مقطعاً ⇒ صفر بعد تصحيحات التأليف).
- **تصحيح بيانات:** ملاحظتا جمع ecke/mitte بالاصطلاح الجديد · ترجمة مثال wohin («أين تضع …؟» ⇒ «إلى أين تضع …؟») · خرجت مصائد u6-d4 القديمة («stellen (تِلْ)» · ««أين» واحدة») ومصطلحا Dativ/Akkusativ من نصوص المتعلم · أسطر ww-2 · ww-3 · ww-11 سُجّلت على مداخل المعجم wohin · okay · Tunesien.
- **الاختبارات:** +2 (درس u6-d4 مع interleavedWith حقيقية ولا Akkusativ/Dativ/liegen/Möbel/vor في نصوص المتعلم · مصائده ومشتِّتاته العشرون) · اختبار الجمع الدائم يشمل u6-d4 · الخطة: u6-d4 done والتالي a1-u7-d1 (u6-d5 بلا إسناد) · المثال غير المُرقّى ← a1-u6-d5.
- **الخطة والسجل:** 28/48 نواة · 74/123 كلمة · 29/60 ترقية · التالي a1-u6-d5. أُضيفت N-081؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-060/N-069.

## 2026-10-16 — الدفعة 103: a1-u6-d3 مُرقّى — في الشقة وes gibt (D148)
- **إضافة:** `content/arsenal/grammar/ars-es-gibt.json` (ثامن وعشرون قاعدة يوم — القاعدة المخططة: es gibt + مفعول به · gibt لا تتغيّر · es لا تسقط · jed- وan/aus) · حوار `a1-u6-d3-einen-fernseher` (20 سطراً eg-1..20) · كلمات `jeder` · `an-sein` · `aus-sein` (نواة SD1) بالمولِّد — 23 مساراً جديداً (1363).
- **تحسين المحتوى:** 42 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح (الاسم بعد «يوجد» فاعلٌ مرفوع ~~Es gibt ein Tisch.~~ · لا ضمير شكلي ~~Gibt einen Balkon?~~ · «كلّ» لا تتغيّر والإنجليزية every معلنة ~~jeder Zimmer~~) وثلاثة أعوان مسمّاة (والفرنسية il y a معلنة) · لا Dativ بأداة ولا كلمات u6-d4/u6-d5 · افتراض N-069 مطبَّق · أمثلة 12 بطاقة إلى جمل تُظهر es gibt وبلا أسماء علم · مقارنة آلية بالملفين الرسميين (248 مقطعاً — 4 تطابقات صُحّحت ⇒ صفر).
- **تصحيح بيانات:** ملاحظتا جمع tuer («die + e → ‑n» — Tür بلا e) وdach («مثل Nacht→Nächte» — Nächte ‑e لا ‑er) والمركّبات الثلاثة · خرجت مصائد u6-d3 القديمة (ومنها «لا Dativ» لخطأ رفعٍ و«Kühle+Schrank») و«in der Küche» قبل u6-d4.
- **الاختبارات:** +2 (درس u6-d3 مع interleavedWith حقيقية ولا geben في أي نص للمتعلم · مصائده ومشتِّتاته الثماني عشرة) · اختبار الجمع الدائم يشمل u6-d3 · الخطة: u6-d3 done والتالي a1-u6-d4 · المثال غير المُرقّى ← a1-u6-d4.
- **الخطة والسجل:** 27/48 نواة · 71/123 كلمة · 28/60 ترقية · التالي a1-u6-d4. أُضيفت N-080؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-060/N-069.

## 2026-10-16 — الدفعة 102: a1-u6-d2 مُرقّى — الغرف وآخر جزء هو الأصل (D147)
- **إضافة:** `content/arsenal/grammar/ars-komposita-genus.json` (سابع وعشرون قاعدة يوم — القاعدة المخططة: المركّب كلمة واحدة بحرف كبير واحد · آخر جزء يقرر المعنى والأداة والجمع · النبر على الأول) · حوار `a1-u6-d2-ein-raum` (20 سطراً zi-1..20) · كلمات `hoch` · `allein` · `raum` (نواة SD1) بالمولِّد — 23 مساراً جديداً (1340) · مدخل معجم Badezimmer (56 مدخلاً).
- **تحسين المحتوى:** 40 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح (الأصل أولاً في الإضافة ~~die Familienname~~ · الإضافة كلمتان والإنجليزية living room معلنة ~~Wohn Zimmer~~ · الخبر العربي يطابق المبتدأ ~~Die Wohnung ist ruhige.~~) وعونان مسمّيان · لا Dativ بأداة ولا es gibt ولا كلمات الغرف اللاحقة · افتراض N-069 مطبَّق · أمثلة 11 بطاقة وبلا أسماء علم · مقارنة آلية بالملفين الرسميين (223 مقطعاً — إطار فراغ صُحّح ⇒ صفر).
- **تصحيح بيانات:** نطق Badezimmer (e الوصل وطول a المنبورة — word-badezimmer أُعيد توليده وخرجت الكلمة من reviewed) · zi-18 مسجّل على مدخل Schlafzimmer · ملاحظات جمع zimmer («مثل Fenster») وgarten («عائلة Gäste») والمركّبات الثلاثة · خرجت مصائد u6-d2 القديمة (ومنها ~~die Gärten~~ الصحيحة جمعاً وتسريب «slugs»).
- **الاختبارات:** +2 (درس u6-d2 مع مدخل المعجم وinterleavedWith حقيقية · مصائده ومشتِّتاته وصفة الخبر في الصواب) · اختبار الجمع الدائم يشمل u6-d2 · الخطة: u6-d2 done والتالي a1-u6-d3 · المثال غير المُرقّى ← a1-u6-d3.
- **الخطة والسجل:** 26/48 نواة · 68/123 كلمة · 27/60 ترقية · التالي a1-u6-d3. أُضيفت N-079؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-060/N-069.

## 2026-10-16 — الدفعة 101: a1-u6-d1 مُرقّى — الجمع يُحفظ مع الكلمة والأثاث (D146)
- **إضافة:** `content/arsenal/grammar/ars-plural-umlaut.json` (سادس وعشرون قاعدة يوم — القاعدة المخططة: خمسة أنماط للجمع ميولٌ لا قوانين · die للجمع · جمعٌ بعد كل عدد فوق الواحد) · حوار `a1-u6-d1-zwanzig-stuehle` (20 سطراً mb-1..20) · كلمة `breit` (نواة SD1) بالمولِّد — 21 مساراً جديداً (1317).
- **تحسين المحتوى:** 41 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح (المعدود بعد 11–99 مفرد منصوب وبعد المئة مفرد مجرور ~~zwanzig Stuhl~~ · ü بلا مقابل عربي ~~die Stuhle~~ · جنس «الخزانة» لا ينتقل ~~die Schrank~~) وعونان مسمّيان (جمع التكسير تغييرٌ داخلي · 3–10 جمعٌ) · لا Dativ بأداة ولا es gibt ولا Möbel/Zimmer · افتراض N-069 مطبَّق · أمثلة 11 بطاقة إلى جمل الدرس وبلا أسماء علم · مقارنة آلية بالملفين الرسميين SD1/A2 (221 مقطعاً — 3 تطابقات لأطر فراغات صُحّحت ⇒ صفر).
- **تصحيح بيانات:** ملاحظة جمع bett «قلب الحرف + n» ⇒ «جمع ‑en: das Bett ← die Betten» · خرجت مصائد u6-d1 القديمة (ومنها تعميم «‑en/‑er neuter» بلا أساس و~~die Kissen~~ الصحيحة جمعاً).
- **الاختبارات:** +3 (درس u6-d1 مع interleavedWith حقيقية · مصائده ومشتِّتاته · **اختبار عام: مفتاح الإجابة أول الخيارات في الدروس المُرقّاة — ثلاثة قديمة مستثناة بالاسم**) · اختبار الجمع الدائم يشمل u6-d1.
- **الخطة والسجل:** 25/48 نواة · 65/123 كلمة · 26/60 ترقية · التالي a1-u6-d2. أُضيفت N-077/N-078؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-060/N-069.
- **655/655 اختباراً** · validate-content 1008/0/0 · typecheck ✓ · build ✓ (JS 2.103 MB، gzip 504.32 kB — تجاوزت 500 kB؛ N-050) · الطفرة 42/42 (38/39 في الجولة الأولى).

## 2026-10-16 — الدفعة 100: a1-u5-d5 مُرقّى — الوحدة 5 مكتملة · التمييز بين kein وnicht ومهمة المقهى (D145)
- **إضافة:** `content/arsenal/grammar/ars-kein-nicht-2.json` (خامس وعشرون قاعدة يوم — قاعدة d5 الخاصة: ein أو لا شيء ⇒ kein · der/die/das ⇒ nicht في الآخر · mein/dein/sein ⇒ nicht قبلها · الرفض المهذب) · حوار `a1-u5-d5-heute-koche-ich` (20 سطراً ko-1..20) — 20 مساراً جديداً (1296).
- **تحسين المحتوى:** 40 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح («موش قهوة/موش قهوتي» ~~Das ist kein mein Kaffee.~~ · «لا أشربُ القهوةَ» والفرنسية pas ~~Ich trinke nicht den Kaffee.~~ · «لستُ عطشاناً» ~~Ich bin nicht Durst.~~) وعون مسمّى («لا» النافية للجنس للنكرة وحدها) · لا nehmen ولا Tisch ولا Dativ بأداة ولا أمر Sie · das Café باقية في u13-d4 (خطة D113) · افتراض N-069 مطبَّق · أمثلة 8 بطاقات إلى الجبهة وبلا أسماء علم · مقارنة آلية بالملفين الرسميين SD1/A2 (259 مقطعاً — 5 تطابقات صُحّحت ⇒ صفر).
- **تصحيح بنية:** d5 خرج من فهرس ars-kein-nicht وars-moechte-wollen (صار بقاعدته الخاصة) · خرجت مصائد u5-d5 القديمة الثلاث.
- **الأدوات والاختبارات:** +2 (درس u5-d5 · مصائده) · اختبار الجمع الدائم يشمل الوحدة 5 كلها · `\bTisch\b` (لا يطابق Nachtisch) · QA المؤقت يقارن التلميح العربي في الفراغ المملوء.
- **الخطة والسجل:** 24/48 نواة · 64/123 كلمة · 25/60 ترقية — **الوحدة 5 مكتملة** · التالي a1-u6-d1. أُضيفت N-076؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-060/N-069.
- **652/652 اختباراً** · validate-content 1005/0/0 · typecheck ✓ · build ✓ (JS 2.077 MB، gzip 498.12 kB؛ N-050) · الطفرة 28/28.

## 2026-10-16 — الدفعة 99: a1-u5-d4 مُرقّى — النفي بـkein وnicht (D144)
- **إضافة:** `content/arsenal/grammar/ars-kein-nicht.json` (رابع وعشرون قاعدة يوم: kein = ein بحرف k · nicht للصفة بعد ist وللفعل في آخر الجملة · nichts · wenig — usedInLessons d4/d5/d6) · حوار `a1-u5-d4-kein-glas-kein-loeffel` (20 سطراً kn-1..20) · كلمتا `nichts` و`wenig` (نواة SD1) بالمولِّد — 22 مساراً جديداً (1276).
- **تحسين المحتوى:** 40 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح («ليس عندي …» و«ما عنديش …» ~~Ich habe nicht Gabel.~~ · «ليس» نفيٌ وربطٌ معاً ~~Die Suppe nicht scharf.~~ · «لا» قبل الفعل ~~Ich nicht zahle heute.~~) وثلاثة أعوان مسمّاة (والفرنسية pas de) · لا تمييز مفصّل قبل اليوم 5 · لا Dativ بأداة ولا zum ولا es gibt · افتراض N-069 مطبَّق · أمثلة 8 بطاقات إلى الجبهة وبلا أسماء علم · مقارنة آلية بالملفين الرسميين SD1/A2 (265 مقطعاً — 5 تطابقات لشظايا الشروح صُحّحت ⇒ صفر).
- **تصحيح بيانات:** معرّف Löffel `laeffel` ← `loeffel` مع مساره (نقل الملف نفسه بلا إعادة توليد) وسجل gen-audio وإحالات الدرس · خرجت مصائد u5-d4 القديمة الثلاث (ومنها وصفٌ خاطئ للعربية «لا قبل الاسم»).
- **الاختبارات:** +3 (درس u5-d4 · مصائده · **حارس معرّفات عام: كل معرّف = slugify(de) إلا قائمة معلنة**).
- **الخطة والسجل:** 24/48 نواة · 64/123 كلمة · 24/60 ترقية · التالي a1-u5-d5. أُضيفت N-074/N-075؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-060/N-069.
- **650/650 اختباراً** · validate-content 1003/0/0 · typecheck ✓ · build ✓ (JS 2.051 MB، gzip 492.41 kB؛ N-050) · الطفرة 28/28.

## 2026-10-16 — الدفعة 98: a1-u5-d3 مُرقّى — الطلب المهذب بـmöchte وwollen (D143)
- **إضافة:** `content/arsenal/grammar/ars-moechte-wollen.json` (ثالث وعشرون قاعدة يوم: ich möchte · du möchtest · er/sie möchte + مفعول به أو مصدر في الآخر بلا zu · wollen الشاذ وحدّته للنادل · was für ein/eine/einen · الوجبات وzum قطعةً — usedInLessons d3/d5/d6) · حوار `a1-u5-d3-was-fuer-ein-eis` (20 سطراً me-1..20) · كلمة `was-fuer-ein` (نواة SD1 — قطعة chunk) بالمولِّد — 21 مساراً جديداً (1254).
- **تحسين المحتوى:** 40 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح («أريد» المحايدة و«نحبّ قهوة» ~~Ich will einen Kaffee.~~ · «يريد أن يأكلَ» و«يحبّ ياكل» ~~Er möchte isst einen Kuchen.~~ · القياس على Hunger haben ~~Ich habe satt.~~ والعربية عونٌ هنا) وثلاثة أعوان مسمّاة (والفرنسية je voudrais/je veux) · zu مصدرها الأقرب الإنجليزية to · لا kein/nicht ولا es gibt ولا Dativ بأداة · zum + الوجبات الثلاث قطعةً بقرار (N-073) · افتراض N-069 مطبَّق · أمثلة 4 بطاقات إلى الجبهة وبلا أسماء علم · مقارنة آلية بالملفين الرسميين SD1/A2 (286 مقطعاً — 13 تطابقاً لشظايا الشروح صُحّحت ⇒ صفر · ذكر لِمّة الدرس نفسها مستثنى معلن).
- **تصحيح بيانات:** N-019 — حقل جمع eis النصي حُذف (das Eis بلا جمع، يُعدّ بالحصة: ein Eis · zwei Eis) · schmecken «يذاق» ⇒ «يتذوّق» · خرجت مصائد u5-d3 القديمة الثلاث (zu بتعليل «أن» · «يتبادلان» · Eis/Ei).
- **النطق:** مدخلا معجم **Mittagessen** و**Abendessen** (همس آخر الجزء الأول في المركّب [ɡ]/[d] ← [k]/[t] — خطأ صامت خارج التدقيق الآلي) · `regen-track.ts` أعاد word-mittagessen وword-abendessen · me-14/me-20 مسجّلان على okay/Marmelade · `--reannotate` أضاف auslaut-g/auslaut-d المقيسة بعد التصحيح · المقتطف أُعيد: 1165/1155 وصفر مخالفة.
- **الاختبارات:** +2 (درس u5-d3 · مصائده) · فحص zum يملأ الفراغ قبل الفحص بعد طفرة أفلتت منه.
- **الخطة والسجل:** 23/48 نواة · 62/123 كلمة · 23/60 ترقية · التالي a1-u5-d4. أُغلقت N-019؛ أُضيفت N-072 وN-073؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-060/N-069.
- **647/647 اختباراً** · validate-content 999/0/0 · typecheck ✓ · build ✓ (JS 2.023 MB، gzip 486.04 kB؛ N-050) · الطفرة 32/32.

## 2026-10-16 — الدفعة 97: a1-u5-d2 مُرقّى — الطلب المهذب (D142)
- **إضافة:** `content/arsenal/grammar/ars-trinken.json` (ثاني وعشرون قاعدة يوم: المطلوب مفعول به · Ich bekomme … · الوعاء ثم المشروب بلا von والأداة للوعاء · Zahlen, bitte! · Ich zahle bar) · حوار `a1-u5-d2-einen-tee-bitte` (20 سطراً et-1..20) · كلمات `bar` و`bekommen` و`die-bitte` (نواة SD1 — معرّف صريح بجانب bitte) بالمولِّد — 23 مساراً جديداً (1233).
- **تحسين المحتوى:** 40 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح (التنوين على المشروب ~~einen Glas Saft~~ · «من» والفرنسية ~~eine Flasche von Wasser~~ · «نشربو الشربة» ~~Ich trinke eine Suppe.~~) وعونان مسمّيان · لا möchte ولا kein ولا Dativ بأداة · افتراض N-069 مطبَّق (لا كحول ليوسف ولا للينا ذات الستة عشر عاماً) · أمثلة 8 بطاقات إلى الجبهة (منها 3 نصوص رسمية حرفية) وبلا أسماء علم · مقارنة آلية بالملفين الرسميين SD1/A2 (256 مقطعاً — تطابقا القاعدة صُحّحا ⇒ صفر).
- **تصحيح بيانات:** milch بلا «die رغم كونها سائلاً!» (لا قاعدة سوائل محايدة) · معنى glas «الكأس (من زجاج) · الزجاج (المادة)» · خرجت مصائد u5-d2 القديمة الثلاث ومنها ~~Tee, bitte!~~ الصحيحة جواباً قصيراً.
- **النطق:** مدخل معجم **Speisekarte** (e الوصل [eː] ← [ə] — خطأ صامت خارج التدقيق الآلي) · `regen-track.ts` أعاد word-speisekarte · et-14/et-19 مسجّلان على Tunesien/okay · المقتطف 1156/1146 وصفر مخالفة.
- **الاختبارات:** +2 (درس u5-d2 · مصائده) · مقارنة «جملة Quiz داخل فراغ مملوء» مطبَّعة (حالة الحرف والترقيم) بعد طفرة أفلتت منها.
- **الخطة والسجل:** 22/48 نواة · 61/123 كلمة · 22/60 ترقية · التالي a1-u5-d3. أُضيفت N-071؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-050/N-060/N-069؛ لا إغلاق.
- **645/645 اختباراً** · validate-content 996/0/0 · typecheck ✓ · build ✓ (JS 1.992 MB، gzip 478.00 kB؛ N-050) · الطفرة 27/27.

## 2026-10-16 — الدفعة 96: a1-u5-d1 مُرقّى — الطعام بأداة أو بلا أداة (D141)
- **إضافة:** `content/arsenal/grammar/ars-essen.json` (حادي وعشرون قاعدة يوم: ما لا يُعدّ بلا أداة · الواحد المعدود ein/einen · الجمع بلا أداة · المحدد der/die/das · mögen) · حوار `a1-u5-d1-fisch-oder-fleisch` (18 سطراً ff-1..18) · كلمات `lebensmittel` (جمع — `pluralOnly`) و`apfel` و`moegen` (نواة SD1) بالمولِّد — 21 مساراً جديداً (1210).
- **تحسين المحتوى:** 38 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح («ال» العامة ~~Ich mag den Fisch.~~ · تنوين المادة ~~Ich esse ein Fleisch.~~ · «أنا جوعان» ~~Ich bin Hunger.~~) والفرنسية معلنة في الاتجاهين · لا kein ولا möchte ولا Dativ بأداة ولا كلمات الأيام 3–5 · أمثلة 8 بطاقات إلى الجبهة (منها «Ich habe Hunger!» الحرفي من SD1) وبلا أسماء علم · مقارنة آلية بالملفين الرسميين SD1/A2 (223 مقطعاً — 9 تطابقات وسطر حوار صُحّحت ⇒ صفر).
- **تصحيح بيانات:** Nudeln ليست جمعاً دائماً (die Nudel في قائمة A2) — المدخل «جمعاً عادةً» وخرجت مصيدة ~~ein Nudel~~ · die Leute (u1-d5) على اصطلاح الجمع الدائم بلا بطاقة جنس + اختبار عام للدروس المُرقّاة · mögen بلا praeteritum (كان «mochte» سيمرّر möchte في حارس الجبهة).
- **النطق:** ff-4 مسجّل على مدخل Wurst وff-13/ff-14 على Tunesien · المقتطف 1144/1134 وصفر مخالفة.
- **الخطة والسجل:** 21/48 نواة · 58/123 كلمة · 21/60 ترقية · التالي a1-u5-d2. أُضيفت N-068 · N-069 (بانتظار المالك) · N-070؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-045/N-050/N-060؛ لا إغلاق.
- **643/643 اختباراً** · validate-content 991/0/0 · typecheck ✓ · build ✓ (JS 1.964 MB، gzip 471.24 kB؛ N-050) · الطفرة 24/24.

## 2026-10-16 — الدفعة 95: a1-u4-d5 مُرقّى — خلط الملكية والمفعول (D140)
- **إضافة:** `content/arsenal/grammar/ars-familie-mix.json` (عشرون قاعدة يوم: الجذع من المالك mein/dein/sein/ihr والنهاية من المملوك ودوره) · حوار `a1-u4-d5-eine-nachricht-fuer-die-lehrerin` (17 سطراً na-1..17) · كلمات `glueck` و`gluecklich` (نواة SD1) و`ihr` (ملكيتها — افتراض N-063) بالمولِّد — 20 مساراً جديداً (1189).
- **إصلاح المولِّد:** `spokenForm` يُسقط الشرح بين القوسين («ihr (ملكيتها)») من النطق وأعلام الخطر ونص المقطع والمعرّف الآلي — اختبار +1.
- **تحسين المحتوى:** 37 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد جديدة بتعليل صحيح (~~ihre Mann~~ · الفرنسية sa mère · «فخور بـ») · لا Dativ ولا Genitiv ولا صفة منعوتة ولا kein · kurz خارج «الجديد» (N-018) · Geschwister بلا بطاقة جنس (الجمع الدائم) · أمثلة 7 بطاقات إلى الجبهة · مقارنة آلية بالملفين الرسميين SD1/A2 (239 مقطعاً — تطابق واحد صُحّح ⇒ صفر).
- **النطق:** na-1/na-2/na-3/na-5/na-6 مسجّلة على مداخل Nachricht · Tunesien · verheiratet · المقتطف 1135/1125 وصفر مخالفة.
- **الخطة والسجل:** 20/48 نواة · 55/123 كلمة · 20/60 ترقية (الوحدة 4 كلها) · التالي a1-u5-d1. أُضيفت N-067؛ حُدّثت N-010/N-011/N-013/N-015/N-021/N-022/N-045/N-050/N-060/N-063؛ لا إغلاق.
- **640/640 اختباراً** · validate-content 986/0/0 · typecheck ✓ · build ✓ (JS 1.937 MB، gzip 464.84 kB؛ N-050) · الطفرة 20/20.

## 2026-10-16 — الدفعة 94: a1-u4-d4 مُرقّى — Akkusativ + أسئلة (D139)
- **إضافة:** `content/arsenal/grammar/ars-akkusativ-2.json` (تاسع عشر قاعدة يوم: الجواب بضمير — er ← ihn للمذكر وحده · Wen?/Was? · stehen/sitzen بلا مفعول) · حوار `a1-u4-d4-siehst-du-ihn` (20 سطراً fo-1..20) · كلمات `bekannt` و`bekannte` (die Bekannte مؤنثاً) و`tot` (نواة SD1 — صوت + مانيفست + gen-audio) — 23 مساراً جديداً (1169).
- **تحسين المحتوى:** 40 بنداً/4 أنواع · Quiz 3×6 (بنود الضمير مفتوحة) · 3 مصائد جديدة بتعليل صحيح (ضمير الشيء بجنس الكلمة العربية · «بين … وبين» · حركة جذع المضارع) · لا Dativ بعد neben/zwischen ولا «auf dem Foto» ولا أمر «Zeig mir» · أمثلة 5 بطاقات إلى الجبهة · مقارنة آلية بالملفين الرسميين SD1/A2 (279 مقطعاً — صفر تطابق).
- **النطق:** fo-2/fo-4 مسجّلان على مدخلي okay · Tunesien · المقتطف 1124/1114 وصفر مخالفة.
- **الخطة والسجل:** 19/48 نواة · 53/123 كلمة · 19/60 ترقية · التالي a1-u4-d5. أُضيفت N-065 وN-066؛ حُدّثت N-010/N-011/N-015/N-021/N-022/N-045/N-050/N-060؛ لا إغلاق.
- **637/637 اختباراً** · validate-content 981/0/0 · typecheck ✓ · build ✓ (JS 1.910 MB، gzip 458.66 kB؛ N-050) · الطفرة 17/17.

## 2026-10-15 — الدفعة 93: a1-u4-d3 مُرقّى — أول Akkusativ (D138)
- **إضافة:** `content/arsenal/grammar/ars-akkusativ-1.json` (ثامن عشر قاعدة يوم) · حوار `a1-u4-d3-wen-beschreibe-ich` (18 سطراً) · كلمتا `beide` و`loesung` (نواة SD1 — صوت + مانيفست + gen-audio) — 20 مساراً جديداً (1146).
- **تحسين المحتوى:** 38 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد بتعليل نحوي صحيح («عندي أخٌ» مرفوع) · لا sehen ولا صفة منعوتة ولا Genitiv قبل وقتها · أمثلة 5 بطاقات إلى الجبهة · مقارنة آلية بالملفين الرسميين SD1/A2 (4 تطابقات صُحّحت).
- **النطق:** مسارات wb-2/wb-5/wb-10 مسجّلة على مداخل المعجم القائمة (okay · Tunesien · Onkel) · المقتطف 1107/1097 وصفر مخالفة.
- **الخطة والسجل:** 18/48 نواة · 50/123 كلمة · 18/60 ترقية · التالي a1-u4-d4. أُضيفت N-064؛ حُدّثت N-010/N-011/N-015/N-021/N-022/N-045/N-050؛ لا إغلاق.
- **635/635 اختباراً** · validate-content 976/0/0 · typecheck ✓ · build ✓ (JS 1.880 MB، gzip 451.87 kB؛ N-050) · الطفرة 15/15.

## 2026-10-15 — الدفعة 92: a1-u4-d2 مُرقّى — الملكية mein/dein/sein (D137)
- **إضافة:** `content/arsenal/grammar/ars-possessiv.json` (سابع عشر قاعدة يوم) · حوار `a1-u4-d2-ist-das-dein-hund` (17 سطراً) · كلمة `lieben` (نواة SD1 — صوت + مانيفست + gen-audio) · مدخلا نطق `Onkel` ([ŋ]) و`gehört` ([øː]) — 18 مساراً جديداً (1126) وإعادة توليد word-onkel وbe-11.
- **تحسين المحتوى:** 35 بنداً/4 أنواع · Quiz 3×6 · 3 مصائد بتعليل صحيح · تخمين قبلي لا يكشف جوابه · أمثلة 4 بطاقات إلى الجبهة · مقارنة آلية بالملفين الرسميين SD1/A2 (تطابق حرفي واحد صُحّح).
- **إصلاح الحارس:** `wordAppears` يتجاهل الشرح بين القوسين في حقل de (sein (ملكيته) · am (an + dem)) — كانت sein لا تُعدّ مسترجَعة أبداً.
- **الخطة والسجل:** 17/48 نواة · 48/123 كلمة · 17/60 ترقية · التالي a1-u4-d3. أُضيفت N-062 وN-063؛ حُدّثت N-002/N-010/N-011/N-013/N-015/N-021/N-022/N-050؛ لا إغلاق.
- **633/633 اختباراً** · validate-content 972/0/0 · typecheck ✓ · build ✓ (JS 1.853 MB، gzip 445.29 kB؛ N-050) · الطفرة 11/11.

## 2026-10-15 — الدفعة 91: a1-u4-d1 مُرقّى — أسماء الأسرة والجمع (D136)
- **إضافة:** `ars-familie` · النواة Goethe: Großeltern/Junge/Opa · حوار خيالي 20 سطراً + 3 أصوات كلمات · 39 بنداً/4 أنواع وQuiz 3×6.
- **تحسين:** أمثلة 12 بطاقة قديمة إلى مفردات مدروسة؛ مولّد `pluralOnly` يوقف `needs-ein` والجنس المفرد/بطاقة الجنس لـEltern/Großeltern مع إبقاء أداة الجمع.
- **الصوت والنطق:** السرعة/RMS قِيست؛ الأسرع للاستماع والإملاء ≤126.6 كلمة/دقيقة. IPA-dict refreshed (CC-BY-SA): 1089/1079، صفر مخالفة بلا قرار؛ لم أستمع إلى المقاطع.
- **الخطة والسجل:** 16/48 نواة · 47/123 كلمة · 16/60 ترقية · التالي a1-u4-d2. حُدّثت N-010/N-011/N-015/N-021/N-022/N-025/N-050؛ لا إضافة أو إغلاق.
- **630/630 اختباراً** · validate-content 969/0/0 · typecheck ✓ · build ✓ (JS 1.826 MB، gzip 438.37 kB؛ N-050).

## 2026-10-15 — الدفعة 90: a1-u3-d5 مُرقّى — الأرقام والوقت وطلب الإعادة (D135)
- **إضافة**: `ars-hoeren-zahlen` · حوار `a1-u3-d5-am-telefon` (14 سطراً) · مراجع `a1-u3-d5-zahlen-und-zeiten` (7 مقاطع) · الكلمات `einmal` و`spaeter` و`aufgabe` مع الأصوات والفهارس.
- **تحسين المحتوى**: 35 بنداً بأربعة أنواع · Quiz 3×6 · أمثلة الجبهة · 3 مصائد للجنس النحوي · أرقام تدريبية خيالية · فحص موجّه للهدف والمهمة والخلاصة. إصلاح kollocation Anruf لتستعمل `kommen` المدروسة.
- **النطق**: تحديث مقتطف ipa-dict · إعادة توليد h5-2 لأن معجم Nachricht يمسّه · قياس 21 مقطعاً، RMS −17.54 إلى −16.97 dB.
- **السجل**: تحديث N-010 وN-011 وN-015 وN-021 وN-022 وN-045 وN-050 وN-053 وN-061 (لا إضافة أو إغلاق).
- **628/628 أخضر** · validator 964/0/0 · tsc ✓ · build ✓ (تحذير الحزمة الكبيرة مسجل في N-050).

## 2026-10-15 — الدفعة 89: توثيق a1-u3-d4 المُرقّى — المواعيد والشهور والطقس (D134)
- **إضافة**: `ars-um-am-im` · حوار 15 سطراً +5 مراجع · النواة fertig/regnen/scheinen · نقل Sonne لتكون فاعل scheinen · 34 بنداً بأربعة أنواع · Quiz 3×6.
- **حالة المحتوى بعد الدفعة**: 800 كلمة · 1061 مساراً · 14/60 ترقية · التالي a1-u3-d5.

## 2026-10-15 — الدفعة 88: a1-u3-d3 مُرقّى — الساعة + القياس الصوتي دفعةً واحدة (D133)
- **إضافة**: `content/arsenal/grammar/ars-uhrzeit.json` (ثالث عشر قاعدة يوم — قاعدة الدرس المخططة نفسها) · سكربت `a1-u3-d3-um-halb-acht` (14 سطراً بصوتين) · سكربت `a1-uhrzeit` (7 أوقات بصوت mueller) · كلمات `naechste` · `geschlossen` · `geoeffnet` (صوت + مانيفست + gen-audio) — 24 مساراً جديداً (1038) · مدخل نطق `nächste`.
- **تعديل معلن**: `tools/audio_probe.py` يقيس دفعةً · اختبار اكتمال الصوت والمدقِّق يقيسان دفعةً واحدة (الملف المعطوب يُنسب إليه وحده) — الاختبار من 130s إلى 7s والمدقِّق من 3 دقائق إلى 7s · درس a1-u3-d3 (35 بنداً بأربعة أنواع · Quiz 3×6 · 3 مصائد بمبررات صحيحة) · 4 أمثلة كلمات · المقتطف 1067 كلمة.
- **اختبارات**: صفر نقص u3-d3 · مصائده · القياس الدفعي · نسبة الملف المعطوب · أمثلة غير المُرقّى ← a1-u3-d4 · مثبّتات النواة ← a1-u3-d4.
- **السجل**: أُضيفت N-061 · حُدّثت N-010 وN-015 وN-060.
- **624/624 أخضر** · validator 952/0/0 · build ✓ · الطفرة 10/10.

## 2026-10-15 — الدفعة 87: a1-u3-d2 مُرقّى — الأعداد حتى 1000 والأسعار + المئات في حارس الجبهة (D132)
- **إضافة**: `content/arsenal/grammar/ars-preis-1000.json` (ثاني عشر قاعدة يوم — قاعدة الدرس المخططة نفسها) · سكربت `a1-u3-d2-ein-handy` (14 سطراً بصوتين) · سكربت `a1-zahlen-bis-1000` (7 أعداد وأسعار بصوت mueller) · كلمات `dank` · `leicht` · `restaurant` (صوت + مانيفست + gen-audio) — 24 مساراً جديداً (1014) · 3 مراجعات نطق no-reference للمركّبات الطويلة.
- **تعديل معلن**: حارس الجبهة يعرف المئات حتى الألف من درس tausend (`HUNDREDS_NUMBER` · `numberWordKnown`) · حارس نطق الأعداد يشمل المئات وh في achthundert · درس a1-u3-d2 (35 بنداً بأربعة أنواع · Quiz 3×6 · 3 مصائد جديدة — خرجت «bezahlen für» بحكمها الخاطئ) · 8 أمثلة كلمات · المقتطف 1060 كلمة.
- **اختبارات**: الحارس D132 (3) · صفر نقص u3-d2 · مصائده · أمثلة غير المُرقّى ← a1-u3-d3 · مثبّتات النواة ← a1-u3-d3.
- **السجل**: أُضيفت N-058..N-060 · حُدّثت N-010 وN-057.
- **620/620 أخضر** · validator 946/0/0 · build ✓ · الطفرة 11/11.

## 2026-10-15 — الدفعة 86: a1-u3-d1 مُرقّى — الأعداد حتى 100 + العدد المركّب في حارس الجبهة (D131)
- **إضافة**: `content/arsenal/grammar/ars-zahlen-100.json` (حادي عشر قاعدة يوم — قاعدة الدرس المخططة نفسها) · سكربت `a1-u3-d1-oma-ist-achtzig` (13 سطراً بصوتين) · سكربت `a1-zahlen-bis-100` (9 أعداد بصوت mueller) · كلمتا `oma` · `das-essen` (صوت + مانيفست + gen-audio) — 24 مساراً جديداً (990) · مدخلا نطق `zweiundvierzig` · `siebenundzwanzig`.
- **تعديل معلن**: حارس الجبهة يعرف العدد المركّب 21–99 بعشراته المدروسة (`COMPOUND_NUMBER`) · تدقيق جموع Goethe لا يحمّل علامة الكلمة الأولى على ما في القوس المنفصل · درس a1-u3-d1 (35 بنداً بأربعة أنواع · Quiz 3×6 · 3 مصائد جديدة · 4 أخطاء معلنة · تخمين قبلي جديد) · 9 أمثلة كلمات · معنى «ضرب» لـmal · المقتطف 1044 كلمة.
- **اختبارات**: الحارس D131 (3) · صفر نقص u3-d1 · مصائده · جموع القوس المنفصل · نطق المركّبات في المسارات المنشورة · أمثلة غير المُرقّى ← a1-u3-d2 · مثبّتات النواة ← a1-u3-d2.
- **السجل**: أُضيفت N-056 وN-057 · حُدّثت N-010 وN-011 وN-015 وN-048.
- **615/615 أخضر** · validator 940/0/0 · build ✓ · الطفرة 11/11.

## 2026-10-15 — الدفعة 85: a1-u2-d5 مُرقّى — الفعل ثانياً مع الظروف + Ayşe تدخل القصة (D130)
- **إضافة**: `content/arsenal/grammar/ars-kennenlernen.json` (عاشر قاعدة يوم — قاعدة الدرس المخططة نفسها) · سكربت `a1-u2-d5-wir-sind-eine-gruppe` (16 سطراً بصوتين: yusuf + ayse) · كلمات `schlecht` · `also` · `gruppe` (صوت + مانيفست + gen-audio) — 19 مساراً جديداً (966) · مدخل نطق `Ayşe`.
- **تعديل معلن**: درس a1-u2-d5 (31 بنداً بأربعة أنواع · Quiz 3×6 · 3 مصائد بمبررات صحيحة · تخمين قبلي جديد · هدف ومهمة بالمدروس) · 7 أمثلة كلمات · v2-order لـgern/auch/natürlich · مقطِّع تدقيق النطق حروف لاتينية كاملة · المقتطف 1024 كلمة · سطرا النواة والترقية في STATE.
- **اختبارات**: صفر نقص u2-d5 · مصائده · مقطِّع التدقيق · حد الكلمة لـAyşe · أمثلة غير المُرقّى ← a1-u3-d1 · مثبّتات النواة ← a1-u3-d1.
- **السجل**: أُضيفت N-052..N-055 · حُدّثت N-010 وN-011 وN-015 وN-022.
- **608/608 أخضر** · validator 935/0/0 · build ✓ · الطفرة 8/8.

## 2026-10-15 — الدفعة 84: سجل الملاحظات في البرومت الاحترافي (D129)
- **تعديل معلن**: السجل كله (48 ملاحظة حرفاً) نُقل من `docs/OWNER_NOTES_AR.md` إلى §10 في `docs/PROFESSIONAL_CONTINUATION_PROMPT_AR.md` بين علامتين — والملف القديم مؤشر بلا ملاحظة · §8 البند 4 يشير إلى §10.
- **اختبارات**: الحارس يقرأ الباب من البرومت + اختبار المصدر الواحد (العلامتان مرة واحدة · لا ملاحظة خارج الباب ولا في الملف القديم).
- **السجل**: أُضيفت N-049..N-051 (مسح ما لم يُسجَّل).
- **605/605 أخضر** · validator 930/0/0 · build ✓.

## 2026-10-15 — الدفعة 83: a1-u2-d4 مُرقّى — طول الحركة (ß/ss) + رمز الحرف والفجوة والخطأ المعلن في حارس الجبهة + الشطب في المُشغِّل (D128)
- **إضافة**: `content/arsenal/grammar/ars-vokalquantitaet.json` (تاسع قاعدة يوم — قاعدة الدرس المخططة نفسها) · سكربت `a1-u2-d4-lang-oder-kurz` (15 سطراً بصوتين) · كلمتا `lang` · `lange` (صوت + مانيفست + gen-audio) — 17 مساراً جديداً (947) · `GRAPHEMES` و`stripGraphemeNotation` · `fillInWordGap` · `misspellings` في `LessonUpgradeEntry` مع `e-upgrade-misspelling`/`w-upgrade-misspelling` · `StruckText` (`src/components/StruckText.tsx` + `src/lib/struck-text.ts`).
- **تعديل معلن**: حارس الجبهة (`frontViolations`) يُسقط رمز الحرف من قائمة مغلقة ويملأ الفجوة داخل الكلمة بإجابتها ويقبل الخطأ المعلن داخل ~~ وحدها · المُشغِّل يرسم ~~الخطأ~~ شطباً (كان خاماً في 79 درساً) · درس a1-u2-d4 (29 بنداً بأربعة أنواع · Quiz 3×6 · 3 مصائد جديدة · الهدف والمهمة بالمدروس · strasse مراجعةٌ لا جديد) · kurz منقولة من a1-u4-d5 · أمثلة fuss وsuess وtasse وkaffee وboot وkaese وschule · إصلاح نص «weh tun» done · مقتطف المرجع 1012 كلمة.
- **اختبارات**: الحارس D128 (7) · صفر نقص u2-d4 · مصائده · الشطب في المُشغِّل (4) · أمثلة غير المُرقّى ← a1-u2-d5 · مثبّتات النواة ← a1-u2-d5.
- **السجل**: أُضيفت N-046..N-048 · حُدّثت N-001 وN-002 وN-010 وN-022 وN-045.
- **604/604 أخضر** · validator 930/0/0 · build ✓ · الطفرة 20/20.

## 2026-10-15 — الدفعة 82: a1-u2-d3 مُرقّى — شفرة الجنس + رمز اللاحقة في حارس الجبهة + حوار صوتي جديد (D127)
- **إضافة**: `content/arsenal/grammar/ars-genuscode.json` (ثامن قاعدة يوم — قاعدة الدرس المخططة نفسها) · سكربت `a1-u2-d3-drei-fehler` (11 سطراً بصوتين) · كلمات `text` · `fehler` · `bedeuten` · `lehrerin` (صوت + مانيفست + gen-audio) — 15 مساراً جديداً (930) · `MORPHEMES` و`stripMorphemeNotation` في `tools/lib/vocab-forms.ts`.
- **تعديل معلن**: حارس الجبهة (`frontViolations`) يُسقط رمز اللاحقة بشرطة أولها من قائمة مغلقة · درس a1-u2-d3 (25 بنداً بأربعة أنواع · Quiz 3×6 · 3 مصائد — خرجت بطاقة die Lehrer بمبررها الخاطئ · مشهد المهمة «in einem Text») · أمثلة zeitung وmaedchen وbroetchen وkellner وfreiheit وgesundheit وschmetterling · مقتطف المرجع 998 كلمة.
- **اختبارات**: رمز اللاحقة (2) · صفر نقص u2-d3 · مصائده · أمثلة غير المُرقّى ← a1-u2-d4 · مثبّتات النواة ← a1-u2-d4.
- **السجل**: أُضيفت N-044 وN-045 · حُدّثت N-010 وN-022.
- **591/591 أخضر** · validator 926/0/0 · build ✓ · الطفرة 11/11.

## 2026-10-15 — الدفعة 81: a1-u2-d2 مُرقّى — أداة النكرة ein/eine + حوار صوتي جديد (D126)
- **إضافة**: `content/arsenal/grammar/ars-ein-eine.json` (سابع قاعدة يوم) · سكربت `a1-u2-d2-ein-haus-eine-wohnung` (11 سطراً بصوتين) · كلمات النواة `mensch` · `ort` · `das-leben` (صوت + مانيفست + gen-audio) — 14 مساراً جديداً (915) · حقل `id` في مولِّد الكلمات للمتجانسين وحدهما.
- **تعديل معلن**: درس a1-u2-d2 (القاعدة `ars-sprachen-wohnen` ← `ars-ein-eine` · 25 بنداً بأربعة أنواع · Quiz 3×6 · 3 مصائد جديدة · كلمات الوحدة الأولى الست خارج الجديد) · أمثلة leben وstadt وfremdsprache وwohnung · فهرس langsam العكسي · مقتطف المرجع 990 كلمة.
- **اختبارات**: صفر نقص u2-d2 · مصائده · المولِّد (المتجانسان) · أمثلة غير المُرقّى ← a1-u2-d3 · مثبّتات النواة ← a1-u2-d3.
- **السجل**: أُغلقت N-018 · أُضيفت N-041..N-043 · حُدّثت N-010 وN-015.
- **587/587 أخضر** · validator 920/0/0 · build ✓ · الطفرة 11/11.

## 2026-10-15 — الدفعة 80: a1-u2-d1 مُرقّى — wo/woher + حوار صوتي جديد (D125)
- **إضافة**: `content/arsenal/grammar/ars-wo-woher.json` (سادس قاعدة يوم) · سكربت `a1-u2-d1-wo-wohnst-du` (10 أسطر بصوتين) · كلمة النواة `international` (صوت + مانيفست + gen-audio) — 11 مساراً جديداً (901).
- **تعديل معلن**: درس a1-u2-d1 (24 بنداً بأربعة أنواع · Quiz 3×6 · 3 مصائد جديدة · woher استدعاءٌ في الدفء) · مثالا europa وwelt · معجم النطق (مسارات Kurs/Tunesien/Studentin الجديدة) · مقتطف المرجع 977 كلمة.
- **اختبارات**: صفر نقص u2-d1 · مصائده · أمثلة غير المُرقّى ← a1-u2-d2 · حارس المحتوى الحقيقي يمسك التنبيهات أيضاً.
- **السجل**: أُغلقت N-016 · أُضيفت N-037..N-040 · حُدّثت N-010 وN-015.
- **584/584 أخضر** · validator 915/0/0 · build ✓ · الطفرة 10/10.

## 2026-10-15 — الدفعة 79: سجل ملاحظاتي للمالك حتى نهاية المشروع (D124)
- **إضافة**: `docs/OWNER_NOTES_AR.md` — 36 ملاحظة بمعرّفات ثابتة (4 بانتظار المالك · 26 مفتوحة · 6 مغلقة) + لقطة تقدم · يُحدَّث مع كل دفعة.
- **حارس**: `tests/owner-notes.test.ts` (6) — صيغة · تتابع بلا حذف · المصادر موجودة في DECISIONS.md · «المطلوب»/«أُغلقت» · سطر العدد.
- **البروتوكول**: §8 في البرومت يضم السجل · التقرير يذكر معرّفات المضاف والمغلق.
- **582/582 أخضر** · validator 912/0/0 · الطفرة 7/7.

## 2026-10-15 — الدفعة 78: a1-u1-d5 مُرقّى — wer/woher + حوار صوتي جديد (D123)
- **إضافة**: `content/arsenal/grammar/ars-wer-woher.json` (خامس قاعدة يوم) · سكربت `a1-u1-d5-wer-ist-das` (13 سطراً بصوتين) · كلمات النواة `ende` · `wissen` · `wort` · `oft` · `ein-bisschen` · `schueler` · `student` + `schuelerin` · `studentin` (+ 9 مقاطع · 890 مساراً · 776 كلمة).
- **معجم النطق**: مدخل Studentin (نبر ‑entin) · مراجعة Nabil · Tunesien يمسّ wer-4 — 44 مدخلاً + 18 مراجعة · التدقيق 968 كلمة صفر مخالفة.
- **تغيير معلن (القانون 7)**: woher من a1-u2-d1 إلى a1-u1-d5 · تطبيق d5 (6 ← 22 بنداً) وQuiz (3×3 ← 3×6) · مصيدتان استُبدلتا وواحدة أُعيدت كتابتها · مثال leute.json · الدفء · lessonRefs في gen-audio.py (woher · sprechen).
- **اختبارات**: صفر نقص d5 · مثال غير المُرقّى ومثبّتات الخطة ← a1-u2-d1 · «الدرس الخفيف» للإسناد pending.
- **576/576 أخضر** · validator 912/0/0 · الطفرة 16/16.

## 2026-10-15 — الدفعة 77: النطق — 37 خطأً مقيساً مُصحَّحاً + بوابة تدقيق دائمة (D122)
- **إضافة أداة**: `tools/pronunciation-audit.py` (كل كلمة منطوقة مقابل المرجع: الطول والنبر · flagged/stale/reviewedStale/reviewedDrift · `--refresh-reference` بتحقق بصمة git) + `tools/pronunciation-reference.de.json` (مقتطف CC-BY-SA بإسناده) · `phonemize.py --lexicon-hits` · `dialogue-splitter --lines` · `regen-track` لإعلانات الشخصيات.
- **تغيير مخطط**: `tools/pronunciation-lexicon.json` 2.0.0 — `forms` (صيغ السياق) · `referenceNote` · `reviewed` (17) · `reference.license` = CC-BY-SA (+licenseNote · attribution).
- **إصلاح**: المعجم قبل `fit_phonemes` (كان بعدها فلا يطابق الصوتين في كلمات ç) · مقياس الطول لا يعدّ نصف الحركة i̯ نواةً.
- **تغيير معلن (القانون 7)**: 37 مدخل نطق جديداً (43 مجموعاً) · 44 مساراً منشوراً أُعيد توليدها (القياسات وحدها تغيّرت — مُبرهن) · نص mueller-announce-01: Mueller ← Müller · phoneticRisks: schublade +auslaut-b · fussball +vowel-long-short · vierzig −vowel-long-short.
- **تصحيح سجل**: بيانات المرجع الألمانية CC-BY-SA (D121 قال MIT).
- **574/574 أخضر** · validator 901/0/0 · الطفرة 20/20.

## 2026-10-14 — الدفعة 76: a1-u1-d4 مُرقّى + الأعداد بالصوت + معجم النطق (D121)
- **إضافة**: `content/arsenal/grammar/ars-zahlen-1-20.json` (رابع قاعدة يوم) · سكربت `a1-zahlen` (22 مساراً: 0–20 + رقم يوسف) · كلمات النواة `alter` · `kurs` · `klasse` (+ 3 مقاطع · 868 مساراً · 767 كلمة).
- **إضافة أداة**: `tools/pronunciation-lexicon.json` + `apply_lexicon`/`synth_phonemes` في `tools/gen-audio.py` (مصدر واحد للصوت وللـIPA في `phonemize.py` · `--raw` لـespeak الخام) · `tools/regen-track.ts` (إعادة توليد مقطع كلمة منشور + تعديل قياساته نصياً ببرهان).
- **إضافة حارس**: `e-upgrade-warmup` — بطاقة الدفء مدروسة قبل الدرس (أول درس مستثنى).
- **تغيير معلن**: `CLOSED` يضم الأعداد 0–20 كاملة (13–19 وnull كانت ناقصة).
- **تغيير معلن (القانون 7)**: a1-u1-d4 — 20 بنداً بـ«لماذا» بدل 6 · Quiz 3×6 · الدفء من دروس سابقة · بطاقتا تحذير جديدتان · الملخص ومعايير المهمة · goetheWordListOverlap من goetheList · مثالا geburtstag وmonat · 4 مقاطع منشورة أُعيد توليدها بالمعجم (Durst · Wurst · Telefonnummer · Vorname — قياساتها فقط في المانيفست).
- الترقية 4/60 · نواة D113 4/48 (11/123 كلمة) · **565/565 أخضر** · validator 901/0/0 · الطفرة 17/17.

## 2026-10-14 — الدفعة 75: a1-u1-d3 مُرقّى + الألفباء بالصوت + إملاء الحروف (D120)
- **إضافة**: `content/arsenal/grammar/ars-alphabet-spelling.json` (ثالث قاعدة يوم) · سكربتا `a1-alphabet` و`a1-u1-d3-anmeldung` (43 مساراً: 30 حرفاً + 3 أسماء متهجّاة + حوار تسجيل) · كلمات النواة `anmeldung` · `partner` · `partnerin` · `herr` (843 مساراً · 764 كلمة).
- **إضافة مخطط**: `DictationItem.spelled` (إملاء الحروف بقاعدة قابلة للتحقق) + `spelledLetters` · تعليمة خاصة في المُشغِّل.
- **تغيير معلن (القانون 7)**: a1-u1-d3 — 19 بنداً بـ«لماذا» بدل 6 · Quiz 3×6 · بطاقتا تحذير بمبرر صحيح · الدفء والاختبار القبلي · `achso` ← «ach so» + مقطع جديد + علَم مقيس · مثالا familienname وgenau.
- الترقية 3/60 · نواة D113 3/48 (8/123 كلمة) · **548/548 أخضر** · validator 896/0/0 · الطفرة 12/12.

## 2026-10-14 — الدفعة 74: a1-u1-d2 مُرقّى (D119)
- **إضافة**: `content/arsenal/grammar/ars-laender-sprachen.json` (ثاني قاعدة يوم) · كلمات النواة `heute` · `jetzt` · `schwer` (+ 3 مقاطع · 796 مساراً · 760 كلمة).
- **تغيير معلن (القانون 7)**: a1-u1-d2 — 16 بند تطبيق بـ«لماذا» بدل 6 · Quiz 3×6 بدل 3×3 · ars-sein-haben ← ars-laender-sprachen · بطاقتا تحذير جديدتان + تمرين الثالثة · الاختبار القبلي · الملخص · goetheWordListOverlap.
- **تغيير معلن**: `sprechen` تُدرَّس في a1-u1-d2 (كانت a1-u7-d4) — unit/thema/sourceLesson/usedInLessons + lessonRefs.
- الترقية 2/60 · نواة D113 2/48 (5/123 كلمة) · **542/542 أخضر** · validator 889/0/0 · طفرة المحتوى 11/11.

## 2026-10-14 — الدفعة 73: عائلة الكلمة بصيغتها الألمانية ومن المدروس وحده (D118)
- **إصلاح**: بطاقة «الجديد» ومختبر المفردات الشبكية كانا يعرضان معرّفات العائلة خاماً (159/205: tuerkei · wie-gehts) و4 أعضاء لم يُدرَّسوا بعد (3 في أول درس) ⇒ `familyForms` (lesson-runner) + `runtimeWordsForLesson` يمرّر المدروس حتى الدرس وحده.
- **إضافة**: `tests/word-family-display.test.ts` (4 اختبارات).
- **541/541 أخضر** (+4) · validator 885/0/0 · الطفرة 5/5.

## 2026-10-14 — الدفعة 72: مسار الدروس + بوابة Quiz (≥75%) + حفظ التقدّم (D117)
- **إضافة**: `src/lib/lesson-path.ts` (الدرس الحالي · تسجيل المحاولة · الفتح بالنجاح وحده · المصالحة) · `src/lib/quiz-session.ts` + `src/components/QuizStation.tsx` (توقّع ← بنود ← نتيجة + معايرة · تبادل النسخ · تصحيح عادل + حكم ذاتي معلن) · `src/stores/learner-store.ts` (IndexedDB · parse قبل الكتابة · نسخة خام · ذاكرة معلنة).
- **تغيير**: `App.tsx` يشغّل الدرس الحالي ويحفظ كل تغيير (شاشة تحميل · شاشة إنقاذ للبيانات التالفة · المسار بعناوين الدروس) · `LessonSession` يقفل «التالي» حتى تكتمل المحطة و«أنهِ الحصة» تعمل · المحطات تُبلغ اكتمالها (`onDone`) · خلط ترتيب الخيارات عند العرض · أزرار ä ö ü ß تحت الحقول.
- **تغيير مخطط**: `QuizVariant.items` = `QuizItem` لكل الدروس + `accept` اختياري · `GateResult.selfJudged` اختياري (إضافي — البيانات المحفوظة تبقى صالحة).
- **إصلاح (القانون 7 — بإثبات)**: a1-u2-d6 بند Quiz إجابته «der (Dativ)» خارج خياراته ← `der` + `why`.
- **إصلاح**: التهيئة كانت تتخطى بطاقات اليوم الأول وشاشة أول درس.
- **أدوات**: happy-dom 21.0.1 (dev) لاختبار الرحلة في DOM حقيقي.
- **537/537 أخضر** (+44) · validator 885/0/0 · الطفرة 34/34.

## 2026-10-14 — الدفعة 71: a1-u1-d1 مُرقّى نموذجاً مرجعياً (D116)
- **إضافة**: `content/arsenal/grammar/ars-sein.json` (أول قاعدة يوم في المحتوى) · كلمتا النواة `neu` و`wie-viel` (+ مقطعان صوتيان · 793 مساراً · 757 كلمة).
- **تغيير معلن (القانون 7)**: a1-u1-d1 — 14 بند تطبيق بـ«لماذا» (فراغ · استماع · ترتيب · إملاء) بدل 5 · Quiz 3×6 بدل 3×3 · ars-sein-haben ← ars-sein · الملخص بلا heute · تمرين مصيدة بلا hier · أمثلة 4 بطاقات (guten-tag · danke · bitte · deutsch).
- **إضافة للحارس**: `e-upgrade-sample` — أمثلة بطاقات الدرس المُرقّى بلا كلمة غير مدروسة (قياس: 217/743 مثالاً في A1).
- **إصلاح**: كاشف v-f (w/qu كانت تُخفي v=[f]) — verschwinden +v-f.
- الترقية 1/60 · نواة D113 1/48 · **493/493 أخضر** · validator 885/0/0 · الطفرة 11/11.

## 2026-10-14 — الدفعة 70: حارس ترقية الدروس + قاعدة اليوم في المُشغِّل + تصحيح تفسيري (D115)
- **إضافة**: `GrammarRuleFile`/`ShufraPayload` (قاعدة اليوم بصيغة الاكتشاف) · أشكال بنود التدريب للأنواع الأربعة عشر بـ`why` عربي · `QuizItem` · `LessonUpgradePlan` + `content/upgrades/a1-lesson-upgrade.json` (60 درساً pending).
- **إضافة**: `tools/lib/lesson-upgrade.ts` (24 رمزاً e-upgrade/e-rule/w-… + 3 في المدقِّق: e-arsenal-path · e-arsenal-dup · e-upgrade-dup) · `tools/upgrade-status.ts` (أقل من ثانية: الملخص والتالي وما ينقص بالضبط).
- **إضافة**: `src/lib/practice-session.ts` + `RuleDiscoveryView` + بنود مُنمَّطة في محطة التدريب (محاولة ← حكم + «لماذا»).
- **إصلاح**: تقطيع `knownForms` (859 → 862 عبارة) · `GrammarLab` (viewExamples) · تسرّب الإجابة في aria-label · «done» في إصلاح النص يُثبت.
- **488/488 أخضر** · validator 882/0/0 · الطفرة 16/16.

## 2026-10-14 — الدفعة 69: الخيار (ج) — النواة مبكراً والباقي للفهم + تدقيق الشروحات (D113 · D114)
- **تغيير معلن (القانون 7)**: خطة `a1-sd1-supplement` أُعيد توزيعها (D113): نواة 123 على 48 درساً قائماً (pending) + 4 إصلاحات نص + 153 للفهم في الوحدتين 13–14 · أسبوع الامتحان a1-u17-* → **a1-u15-*** · `UNIT_MAX = 15`.
- **إضافة**: `CoreLesson`/`TextFix`/`supplementMode` · 7 قواعد جديدة (e-plan-core-lesson · e-plan-core-load · w-plan-mark-done · e-plan-text-fix · e-plan-receptive …) · `coreStatus` · plan-status للنواة.
- **تقرير**: `docs/reports/lesson-explanations-audit.md` — قاعدة اليوم 0/61 · تصحيح تفسيري 0/482 · 6 بنود للدرس (D114).
- **441/441 أخضر** · validator 881/0/0 · الطفرة 8/8.

## 2026-10-14 — تحليل: فجوة SD1 منهجياً (توثيق فقط)
- **إضافة**: `docs/reports/sd1-gap-pedagogy.md` — مقدمة Goethe الرسمية + قياس التردد والظهور + توصية (ج) بانتظار المالك · **اكتشاف عيب**: 50 كلمة رسمية تظهر في دروس 1–12 قبل تعليمها (القانون 13).

## 2026-10-14 — الدفعة 68: تكملة Start Deutsch 1 — خطة ملزمة + أسبوع الامتحان 13 → 17 (D112)
- **قرار المالك (أ)**: الكلمات الرسمية غير المُعلَّمة (276 نصاً) كلها في 4 وحدات A1 تكميلية (13–16) قبل أسبوع الامتحان — 24 درساً (20 محتوى × 12–14 كلمة + 4 توليف).
- **إضافة**: `content/plans/a1-sd1-supplement.json` + المخطط `curriculum-plan.ts` + `tools/lib/curriculum-plan.ts` (8 قواعد e-plan-*/w-plan-*) + `tools/plan-status.ts` + `tools/move-unit.ts` + `coveredHeadwords` (التغطية بالنص المطبوع).
- **حدّ الوحدات**: `UNIT_MAX = 17` مصدر واحد بدل 8 حدود · **إصلاح عيب كامن**: حالة المتعلم لم تكن تقبل وحدة أسبوع الامتحان.
- **تغيير معلن (القانون 7)**: a1-u13-d1..d6 → a1-u17-d1..d6 (المعرّف وunit وحدهما) + 46 إشارة usedInLessons.
- **436/436 أخضر** (+17) · validator 881/0/0 · تحقق الطفرة 9/9.

## 2026-10-14 — الدفعة 67: تحقق مستقل من D110 + إصلاح عيبين (D111)
- **تحقق**: الملفان الرسميان بالبصمة نفسها · `--check` للفهارس الثلاثة · البوابة · مقارنة متقاطعة مع قائمتين غير رسميتين.
- **إصلاح**: علامة جمع على حدّ العمود (A2: «das Doppelzimmer, -») · الجذع المركِّب `einzel-` (`COMPOUND_STEMS`).
- **تغيير معلن (القانون 7)**: einzelzimmer → [A1,A2] (الحقل وحده) · التغطية بلا تغيير.
- **قياس**: فجوة SD1 = 278 (234 في قائمة A2 أيضاً · 44 خاصة بـSD1).
- **419/419 أخضر** · validator 880/0/0.

## 2026-10-14 — الدفعة 66: goetheList دليلٌ لا رأي (D110)
- **إضافة**: فهارس قوائم Goethe الرسمية الثلاث `content/wordlists/` (SD1 · Fit1 · A2 — كلمات رئيسية فقط، بلا جمل أمثلة) + المخطط `wordlist.ts` + المستخرِج `tools/goethe-wordlist.py` + المطابقة `tools/lib/goethe-lists.ts` + التدقيق `tools/goethe-audit.ts`.
- **قاعدة**: `e-goethe-list` (خطأ) — goetheList = الدليل بالضبط · المولِّد يشتقها آلياً.
- **تغيير معلن (القانون 7)**: 728 كلمة أُعيد وسمها (الحقل وحده): 466 [A1,A2] · 123 [A2] · 130 [] · 9 كلمات A2 → [A1,A2].
- **قياس**: منهجنا يغطي 61% من قائمة SD1 الرسمية (278 كلمة رسمية لم تُعلَّم بعد).
- **417/417 أخضر** · validator 880/0/0.

## 2026-10-14 — الدفعة 65: امتحان A1 التجريبي بالصيغة الرسمية (D109)
- **تغيير معلن (القانون 7)**: `a1-modelltest-1` أُعيد بناؤه كاملاً بمحتوى أصلي: الاستماع 6/4/5 (كان 4/3/2) · القراءة 5/5/5 (كان 4/3/2) · استمارة موضوعية · 30 بنداً بدل 18.
- **إضافة**: `content/schemas/answer-key.ts` (دليل حرفي لكل جواب) · `tools/lib/vocab-forms.ts` · نوع سكربت `message` · `ExamTaskType` + `kind` في الصيغتين الرسميتين · 35 مقطعاً صوتياً (حُذف 16).
- **قواعد**: `e-modelltest-format` (كان تحذيراً) · `e-hoeren-evidence` · `e-modelltest-vocab` · `w-modelltest-balance` · `w-modelltest-proper-noun`.
- **383/383 أخضر** · validator 877/0/0.

## 2026-10-14 — الدفعة 64: المراجع الرسمية (D108)
- **إضافة**: `content/exam-formats/` (Start Deutsch 1 + Goethe A2) + مخطط ExamFormat + قاعدة `w-modelltest-format` · 12 فصلاً لـ Netzwerk neu A2 في المرجع المنهجي · **359/359 أخضر**.

## 2026-10-14 — الدفعة 63: بنك Redemittel (D107)
- **إضافة**: `src/lib/phrase-bank.ts` + `tools/phrase-harvester.ts` + `tools/lib/content-disk.ts` + عرض العبارات في المهمة التواصلية · **352/352 أخضر**.

## 2026-10-14 — الدفعة 62: أعلام الخطر الصوتي بالقياس (D106)
- **إصلاح**: إعادة وسم 465 كلمة (+557 مقيساً / −92 مستحيلاً) · سياسة «المكتشَف ∪ القديم الممكن» · حارس على كل المحتوى · **339/339 أخضر**.

## 2026-10-14 — الدفعة 61: مولِّد مدخل الكلمة + السجل التلقائي (D105)
- **إضافة**: `tools/word-entry-generator.ts` + `tools/lib/word-entry.ts` (كشف صوتي من النطق المقيس · نحوي · بطاقات · مقطع ومسار) + 19 اختباراً.
- **تحسين**: `src/lesson-packs.ts` تلقائي (import.meta.glob) مع تحقق zod لكل ملف محتوى.
- **336/336 أخضر**.

## 2026-10-14 — الدفعة 60: الصوت يصل إلى المتعلم (D104)
- **إضافة**: `audio-assets.ts` (كل مقطع مُضمَّن تلقائياً) + `audio-player.ts` (مقطع ← Web Speech ← none · F044) + زر 🔊 + تشغيل عند ظهور الكلمة.
- **إصلاح**: لا مقطع كان يصل إلى dist · 233 مقطعاً كانت ستُدمج base64 · اسم داخلي في عامل الخدمة · المعاينة ترفض نطاقها.
- **317/317 أخضر**.

## 2026-10-14 — الدفعة 59: صوت المرأة يعمل فعلاً (D103)
- **إضافة**: صوت kerstin مُثبَّت في git (sha256 `d352a764…`) · الإناث الأربع بصوته عبر characterVoices · `one-voice` · قياس طيفي يثبت أنه صوت مختلف (0.822) وثابت (0.993).
- **إضافة**: السكربت الصوتي الموجَّه + `tools/dialogue-splitter.ts` + قواعد المدقِّق (صوت الشخصية الثابت · تطابق السكربت · اليتامى · جواب الاستماع مسموع).
- **إصلاح**: Hören الامتحان التجريبي بلا صوت ← 16 مقطعاً بصوتين · ich-Laut بصوت kerstin ([c] ← [ç]) · «Grüß» ← Gruß.
- **إصلاح**: بصمة الصوت المثبَّت لم يكن يفحصها أي اختبار — الآن الصوتان مقفولان · **306/306 أخضر**.

## 2026-10-14 — الدفعة 58: إصلاح نطق 6 مقاطع A1 (D102)
- **إصلاح**: مقاطع وُلّدت من رسم ASCII (gross بدل groß…) — 6 منها مقيسة الخطأ بالفونيمات (حركة قصيرة بدل طويلة · natürlich/süß مشوّهتان · fünfzig بلا f) — أُعيد توليد 11 مقطعاً.
- **إصلاح**: ملفا الكلمتين fünfzig و das Gleis.
- **إضافة**: `tools/phonemize.py` (قياس النطق) + `tests/word-audio-text.test.ts` (حارس دائم) · **284/284 أخضر**.

## 2026-10-14 — الدفعة 57: A2 يبدأ — a2-u1-d1 (D101)
- **محتوى**: أول درس A2 «يروي صباح أمس» — Perfekt منهجي (5 قوالب + haben/sein) · 13 كلمة A2 جديدة بأصواتها · محطات verb-bank / gap-fill / error-hunt / speaking.
- **بنية**: `LEVEL_ORDER` — A1 كله قبل A2 في المسار.
- **إصلاح**: `fullForm()` — لا أداة مكررة في البطاقات («die die Landschaft» → «die Landschaft»).
- **281/281 أخضر** · validator 872/0/0.

## 2026-10-14 — الدفعة 56: صوت المرأة — D98 صار حقيقياً (D100)
- **إصلاح**: سكربت `termux-upload-voice-kerstin.sh` كان سيرفض الملف الأصلي (بوابة 15–18MB والحقيقي 63,104,526 بايت) — الآن الحجم الدقيق + md5 الرسمي للملفات الثلاثة (onnx/json/MODEL_CARD) من فهرس rhasspy/piper.
- **إضافة فعلية**: قاعدتا المدقِّق `e-audio-voice-drift` (الصوتان المثبَّتان) و`e-audio-voice-role` (الأنثوي للحوار فقط) + توجيه gen-audio `voice_for()` بـfallback معلن + أمرا `voice-for`/`one-as`.
- **276/276 أخضر** (+11 اختباراً — تفشل 7 منها على الكود القديم) · validator 858/0/0.

## 2026-10-12 — سكربت رفع صوت المرأة (termux-upload-voice-kerstin.sh)
- **تأكيد فحص كامل**: ملف kerstin غير موجود في أي فرع أو سجل — المرفوع سابقاً هو صوت الرجل (thorsten).
- **سكربت جاهز** بنفس نمط termux-upload-voice.sh: تنزيل + تحقق (حجم + بصمة) + رفع إلى main + تنظيف.

## 2026-10-12 — إضافة 7: تقارير التقدم (D99)
- **progress-report.ts**: تقرير أسبوعي (أيامك مع مولر — F157) + تقرير شهري بمعايرة تقدير الذات (F160) + سطر الخريطة (§2.8).
- **حديد**: أرقام حقيقية فقط (E18) · حارس D23 يمسح اللوم من كل نص · تقرير العدم بلا رقم واحد.
- **265/265 أخضر** + tsc + validator (858/0/0) + build ✓.

## 2026-10-12 — إضافة 6: صوت امرأة (D98 · البنية جاهزة)
- **بنية الصوتين كاملة**: PINNED_VOICES + VOICE_ID_FEMALE + أدوار الحوار (character/guest/dialogue) للصوت الأنثوي.
- **قواعد validator جديدتان**: الصوتان المثبَّتان فقط + الدور المسموح للصوت الأنثوي.
- **gen-audio.py**: يوجّه شخصيات المرأة تلقائياً إلى kerstin مع fallback آمن للصوت الرئيسي.
- **صوت kerstin (MIT · ~16.8MB)**: غير قابل للتنزيل من الـsandbox — يُنزَّل مالكياً عبر Termux (بنمط thorsten) ويعمل فوراً.

## 2026-10-12 — الإضافات — الدفعة 53
- إضافة: نصوص القراءة (12 نصاً · D97) + إكمال الصور (12/12).
- **248/248 أخضر** · validator 858/0/0.

## 2026-10-12 — الإضافات — الدفعة 52
- إضافة: الصور التوضيحية الدفعة 1 (10 صور · هوية بصرية واحدة · D96).
- **247/247 أخضر** · validator 846/0/0.

## 2026-10-12 — الإضافات — الدفعة 51
- إضافة: الامتحان التجريبي الكامل (a1-modelltest-1 · 4 مهارات · 36 عنصراً · D95).
- **246/246 أخضر** · validator 846/0/0.

## 2026-10-12 — الإضافات — الدفعة 50
- إضافة: الاختبارات الدورية (9 اختبارات Kurztest/Monatsprüfung · D94).
- **245/245 أخضر** · validator 845/0/0.

## 2026-10-12 — الإضافات — الدفعة 49
- إضافة: بطاقات الثقافة Landeskunde (12 بطاقة · نوع محتوى جديد · D93).
- **244/244 أخضر** · validator 836/0/0.

## 2026-10-12 — حملة المحتوى — الدفعة 48
- إضافة: أسبوع التثبيت والامتحان (الوحدة 13 — 6 دروس تثبيت + Modelltest) + schema unit→13 (D92).
- **243/243 أخضر** · validator 824/0/0 · 742 كلمة · 78 يوماً.

## 2026-10-12 — حملة المحتوى — الدفعة 47 🏁
- إضافة: u12-d6 (المعركة الكبرى — 0 كلمات). **🏁 خطة A1 مكتملة: 742 كلمة · 72 يوماً.**
- **243/243 أخضر** · validator 818/0/0 · 743 مساراً. (D91)

## 2026-10-12 — حملة المحتوى — الدفعة 46
- إضافة: u12-d5 (12 كلمة — سرد الرحلة · آخر كلمات الخطة!) + 12 مقطعاً (743 مساراً).
- **243/243 أخضر** · validator 817/0/0 · 742 كلمة · 71 درساً. (D90)

## 2026-10-12 — حملة المحتوى — الدفعة 45
- إضافة: u12-d4 (12 كلمة — الروابط: denn≠weil) + 12 مقطعاً (731 مساراً).
- **243/243 أخضر** · validator 804/0/0 · 730 كلمة · 70 درساً. (D89)

## 2026-10-12 — حملة المحتوى — الدفعة 44
- إضافة: u12-d3 (12 كلمة — الماضي + الأفعال المنفصلة) + 12 مقطعاً (719 مساراً).
- **243/243 أخضر** · validator 791/0/0 · 718 كلمة · 69 درساً. (D88)

## 2026-10-12 — حملة المحتوى — الدفعة 43
- إضافة: u12-d2 (12 كلمة — المحطة والفندق) + 12 مقطعاً (707 مساراً).
- **243/243 أخضر** · validator 778/0/0 · 706 كلمة · 68 درساً. (D87)

## 2026-10-12 — حملة المحتوى — الدفعة 42
- إضافة: u12-d1 (12 كلمة — الوجهة والوثائق + الفعل المنفصل) + 12 مقطعاً (695 مساراً).
- **243/243 أخضر** · validator 765/0/0 · 694 كلمة · 67 درساً. (D86)

## 2026-10-12 — حملة المحتوى — الدفعة 41
- إضافة: u11-d6 (معركة الوحدة 11 — 0 كلمات · توليف). **الوحدة 11 مكتملة ✅**.
- **243/243 أخضر** · validator 752/0/0 · 682 كلمة · 66 درساً. (D85)

## 2026-10-12 — حملة المحتوى — الدفعة 40
- إضافة: u11-d5 (12 كلمة — مهمة: عند الطبيب) + 12 مقطعاً (683 مساراً).
- **243/243 أخضر** · validator 751/0/0 · 682 كلمة · 65 درساً. (D84)

## 2026-10-12 — حملة المحتوى — الدفعة 39
- إضافة: u11-d4 (12 كلمة — اختيار haben↔sein + sich fühlen) + 12 مقطعاً (671 مساراً).
- **243/243 أخضر** · validator 738/0/0 · 670 كلمة · 64 درساً. (D83)

## 2026-10-12 — حملة المحتوى — الدفعة 38
- إضافة: u11-d3 (12 كلمة — الماضي مع sein bin/war) + 12 مقطعاً (659 مساراً).
- **243/243 أخضر** · validator 725/0/0 · 658 كلمة · 63 درساً. (D82)

## 2026-10-12 — حملة المحتوى — الدفعة 37
- إضافة: u11-d2 (12 كلمة — وصف الألم: الطبيب والدواء) + 12 مقطعاً (647 مساراً).
- **243/243 أخضر** · validator 712/0/0 · 646 كلمة · 62 درساً. (D81)

## 2026-10-12 — حملة المحتوى — الدفعة 36
- إضافة: u11-d1 (12 كلمة — أجزاء الجسم + tut weh) + 12 مقطعاً (635 مساراً).
- **243/243 أخضر** · validator 699/0/0 · 634 كلمة · 61 درساً. (D80)

## 2026-10-12 — حملة المحتوى — الدفعة 35
- إضافة: u10-d6 (المعركة — توليف الوحدة 10).
- **الوحدات 1–10 مكتملة** ✅: 622 كلمة · 60 يوماً · 623 مساراً · **243/243 أخضر** · validator 686/0/0. (D79)

## 2026-10-12 — حملة المحتوى — الدفعة 34
- إضافة: u10-d5 (12 كلمة — أول weil-Satz: الفعل في نهاية جملة السبب) + 12 مقطعاً (623 مساراً).
- **243/243 أخضر** · validator 685/0/0 · 622 كلمة · 59 درساً. (D78)

## 2026-10-12 — حملة المحتوى — الدفعة 33
- إضافة: u10-d4 (12 كلمة — Perfekt + Zeitangaben + التصريف المنفصل auf-geschrieben) + 12 مقطعاً (611 مساراً).
- **243/243 أخضر** · validator 672/0/0 · 610 كلمة · 58 درساً. (D77)

## 2026-10-12 — حملة المحتوى — الدفعة 32
- إضافة: u10-d3 (12 كلمة — Perfekt haben: gestern + أفعال + التصريف آخر الجملة) + 12 مقطعاً (599 مساراً).
- **243/243 أخضر** · validator 659/0/0 · 598 كلمة · 57 درساً. (D76)

## 2026-10-12 — حملة المحتوى — الدفعة 31
- إضافة: u10-d2 (12 كلمة — المواعيد والتواريخ: am+Tag · der zwölfte Mai) + 12 مقطعاً (587 مساراً).
- **243/243 أخضر** · validator 646/0/0 · 586 كلمة · 56 درساً. (D75)

## 2026-10-12 — حملة المحتوى — الدفعة 30
- إضافة: u10-d1 (12 كلمة Wetter — Es الفاعل الصوري) + 12 مقطعاً (575 مساراً). تصحيح: الوحدة 10 = المواعيد والطقس.
- **243/243 أخضر** · validator 633/0/0 · 574 كلمة · 55 درساً. (D74)

## 2026-10-12 — حملة المحتوى — الدفعة 29
- إضافة: u9-d6 (المعركة — توليف الوحدة 9).
- **الوحدات 1–9 مكتملة** ✅: 562 كلمة · 54 يوماً · 563 مساراً · **243/243 أخضر** · validator 620/0/0. (D73)

## 2026-10-12 — حملة المحتوى — الدفعة 28
- إضافة: u9-d5 (6 كلمات — Satzklammer + TEKAMOLO) + 6 مقاطع (563 مساراً).
- **243/243 أخضر** · validator 619/0/0 · 562 كلمة · 53 درساً. (D72)

## 2026-10-12 — حملة المحتوى — الدفعة 27
- إضافة: u9-d4 (12 كلمة — Wechselpräpositionen: Wo?↔Wohin?) + 12 مقطعاً (557 مساراً).
- **243/243 أخضر** · validator 612/0/0 · 556 كلمة · 52 درساً. (D71)

## 2026-10-12 — حملة المحتوى — الدفعة 26
- إضافة: u9-d3 (12 كلمة — Imperativ Sie + أدب الطلب) + 12 مقطعاً (545 مساراً).
- **243/243 أخضر** · validator 599/0/0 · 544 كلمة · 51 درساً. (D70)

## 2026-10-12 — حملة المحتوى — الدفعة 25
- إضافة: u9-d2 (17 كلمة — المواصلات + الأفعال المنفصلة الثلاث) + 17 مقطعاً (533 مساراً).
- **243/243 أخضر** · validator 586/0/0 · 532 كلمة · 50 درساً. (D69)

## 2026-10-12 — حملة المحتوى — الدفعة 24
- إضافة: u9-d1 (18 كلمة — أماكن المدينة والاتجاهات + gegenüber+Dativ) + 18 مقطعاً (516 مساراً).
- **243/243 أخضر** · validator 568/0/0 · 515 كلمة · 49 درساً. (D68 — دروس المخططات)

## 2026-10-10 — حملة المحتوى — الدفعة 23
- إضافة: u8-d5 (17 كلمة + von/seit/bei + مهمة المتجر) + u8-d6 (المعركة) + 17 مقطعاً (500 مساراً).
- **الوحدات 1–8 مكتملة**: 499 كلمة · 48 درساً · 500 مساراً · **243/243 أخضر** · validator 551/0/0. (D67)

## 2026-10-10 — حملة المحتوى — الدفعة 22
- إضافة: u8-d3 (können/müssen — 12 كلمة) + u8-d4 (الداتيف الثابت — 12 كلمة) + 24 مقطعاً (483 مساراً).
- النتيجة: **243/243 أخضر** · validator 532/0/0. (D66)

## 2026-10-10 — حملة المحتوى — الدفعة 21
- إضافة: u8-d1 (Kleidung — 12 كلمة) + u8-d2 (Preise — 12 كلمة) + 24 مقطعاً (459 مساراً).
- النتيجة: **243/243 أخضر** · validator 506/0/0. (D65)

## 2026-10-10 — حملة المحتوى — الدفعة 20
- إضافة: u7-d5 (17 كلمة + Trennbare + وصف اليوم) + u7-d6 (المعركة) + 17 مقطعاً (435 مساراً).
- **الوحدات 1–7 مكتملة**: 434 كلمة · 42 درساً · 435 مساراً · **243/243 أخضر** · validator 480/0/0. (D64)

## 2026-10-10 — حملة المحتوى — الدفعة 19
- إضافة: u7-d3 (12 فعلاً منتظماً) + u7-d4 (شاذ fährt/isst + سفر — 12 كلمة) + 24 مقطعاً (418 مساراً).
- النتيجة: **243/243 أخضر** · validator 461/0/0. (D63)

## 2026-10-10 — حملة المحتوى — الدفعة 18
- إضافة: u7-d1 (Tagesablauf — 12 كلمة) + u7-d2 (Hobbys + gern/lieber — 12 كلمة) + 24 مقطعاً (394 مساراً).
- النتيجة: **243/243 أخضر** · validator 435/0/0. (D62)

## 2026-10-10 — حملة المحتوى — الدفعة 17
- إضافة: u6-d5 (17 كلمة + da + وصف شقة) + u6-d6 (المعركة) + 17 مقطعاً (370 مساراً).
- موازنة SRS: +comprehension لـ191 كلمة (w-srs-ratio انطفأ). (D61)
- **الوحدات 1–6 مكتملة**: 369 كلمة · 36 درساً · 370 مساراً · **243/243 أخضر** · validator 409/0/0.

## 2026-10-10 — حملة المحتوى — الدفعة 16
- إضافة: u6-d3 (es gibt — 12 كلمة) + u6-d4 (Wo/Wohin — 12 كلمة) + 24 مقطعاً (353 مساراً).
- استعادة البيئة: pip (numpy/scipy/soundfile/piper-tts) + npm ci. (D60)
- النتيجة: **243/243 أخضر** · validator 390/0/0.

## 2026-10-10 — حملة المحتوى — الدفعة 15
- إضافة: u6-d1 (Möbel — 12 كلمة) + u6-d2 (Zimmer — 12 كلمة) + 24 مقطعاً (329 مساراً).
- النتيجة: **243/243 أخضر** · validator 364/0/0. (D59)

## 2026-10-10 — حملة المحتوى — الدفعة 14
- إضافة: u5-d5 (17 كلمة + مهمة المقهى) + u5-d6 (المعركة) + 17 مقطعاً (305 مسارات).
- إصلاح: بطاقة gender لـmahlzeit · 3 بطاقات تحذير في u5-d6. (D58)
- **الوحدات 1–5 مكتملة**: 304 كلمة · 30 درساً · 305 مساراً · **243/243 أخضر** · validator 338/0/0.

## 2026-10-10 — حملة المحتوى — الدفعة 13
- إضافة: u5-d3 (Mahlzeiten + möchte/wollen — 12 كلمة) + u5-d4 (Tisch + kein/nicht — 12 كلمة) + 24 مقطعاً (288 مساراً).
- إصلاح مخطط: enums الصحيحة (phoneticRisks/grammarRisks/goetheList) + schemaVersion + بطاقة gender. (D57)
- النتيجة: **243/243 أخضر** · validator 319 ملفاً/0/0.

## 2026-10-10 — حملة المحتوى — الدفعة 12
- إضافة: u5-d1 (Essen — 12 كلمة) + u5-d2 (Trinken/Restaurant — 12 كلمة) + 24 مقطعاً صوتياً (264 مساراً).
- النتيجة: **243/243 أخضر** · validator 293 ملفاً/0/0. (D56)

## 2026-10-10 — حملة المحتوى — الدفعة 11
- إضافة: u4-d5 (خلط الملكية/المفعول + تسجيل — 12 كلمة) + u4-d6 (توليف + معركة الوحدة 4 بعتبة 0.75) + 14 مقطعاً صوتياً (240 مساراً).
- النتيجة: **243/243 أخضر** · validator 267 ملفاً/0/0 — **الوحدات 1–4 مكتملة** ✅. (D55)

## 2026-10-10 — حملة المحتوى — الدفعة 10
- إضافة: u4-d3 (أول Akkusativ — 12 كلمة) + u4-d4 (وصف الصورة الأسرية — 12 كلمة) + 24 مقطعاً صوتياً (226 مساراً).
- النتيجة: **243/243 أخضر** · validator 251 ملفاً/0/0. (D54)

## 2026-10-10 — حملة المحتوى — الدفعة 9
- إضافة: u4-d1 (Familie — 12 كلمة) + u4-d2 (الملكية mein/dein/sein — 12 كلمة) + 24 مقطعاً صوتياً (202 مسارات).
- صيانة بيئية: استعادة numpy/scipy/soundfile/piper-tts + npm ci بعد فقد البيئة (D53).
- النتيجة: **243/243 أخضر** · validator 225 ملفاً/0/0. (D53)

## 2026-10-10 — حملة المحتوى — الدفعة 8
- إضافة: u3-d5 (Hören: Zahlen/Uhrzeit — 12 كلمة) + u3-d6 (توليف + معركة الوحدة 3 بعتبة 0.75) + 14 مقطعاً صوتياً (178 مساراً).
- النتيجة: **243/243 أخضر** · validator 199 ملفاً/0/0 — **الوحدات 1–3 مكتملة** ✅. (D52)

## 2026-10-10 — حملة المحتوى — الدفعة 7
- إضافة: u3-d3 (Uhrzeit: halb/viertel — 12 كلمة) + u3-d4 (um/am/im + الشهور الستة — 12 كلمة) + 24 مقطعاً صوتياً (164 مساراً).
- النتيجة: **243/243 أخضر** · validator 183 ملفاً/0/0. (D51)

## 2026-10-10 — حملة المحتوى — الدفعة 6
- إضافة: u3-d1 (Zahlen 20–100 + zählen/Ziffer/mal — 12 كلمة) + u3-d2 (Zahlen 100–1000 + الأسعار — 12 كلمة) + 24 مقطعاً صوتياً (140 مساراً). استبدال بذرة a1-u3-d2 القديمة بالمحتوى الحقيقي.
- النتيجة: **243/243 أخضر** · validator 157 ملفاً/0 أخطاء/0 تحذيرات. (D50)

## 2026-10-10 — حملة المحتوى — الدفعة 5
- إضافة: u2-d4 (ß/ss + الكمية الصوتية — 12 كلمة) + u2-d5 (حوار التعارف — 12 كلمة) + u2-d6 (توليف + معركة الوحدة 2 بعتبة 0.75) + 25 مقطعاً صوتياً (116 مساراً).
- النتيجة: **243/243 أخضر** · validator 132 ملفاً/0 أخطاء — **الوحدتان 1+2 مكتملتان** ✅. (D49)

## 2026-10-10 — حملة المحتوى — الدفعة 4
- إضافة: u2-d2 (اللغات والسكن — 12 كلمة: 6 معاد تدريبها + 6 جديدة) + u2-d3 (شفرة الجنس — 12 كلمة) + 17 مقطعاً صوتياً (91 مساراً).
- النتيجة: **243/243 أخضر** · validator 104 ملفات/0 أخطاء — الوحدة 2: 3 من 6 أيام. (D48)

## 2026-10-10 — حملة المحتوى — الدفعة 3
- إضافة: d6 (توليف الوحدة 1 + معركة أسطورة 70/30 بعتبة 0.75) + u2-d1 (بداية الوحدة 2: Länder + wo/woher + Niederlande جمع) + 14 مقطعاً صوتياً (74 مساراً).
- النتيجة: **243/243 أخضر** · validator 85 ملفاً/0 أخطاء — **الوحدةة 1 مكتملة** ✅ والوحدةة 2 بدأت. (D47)

## 2026-10-10 — حملة المحتوى — الدفعة 2
- إضافة: d4 (أرقام/عمر/هاتف — 12 كلمة) + d5 (wer/woher + تعريف 4 جمل — 7 كلمات) بمصائدهما الستة + 19 مقطعاً صوتياً (60 مساراً) + تحديث السجل والاختبارات.
- النتيجة: **242/242 أخضر** · validator 69 ملفاً/0 أخطاء — الوحدة 1: d1–d5 جاهزة (يبقى d6). (D46)

## 2026-10-10 — حملة المحتوى — الدفعة 1
- إضافة: درسا الوحدة 1 d2 (بلاد + sein — 12 كلمة) وd3 (تهجئة وكتابة — 12 كلمة) بكل مصائدهما وحزم SRS + 24 مقطعاً صوتياً (41 مساراً) + سجل `lesson-packs` كامل (40 كلمة/3 دروس) + مسار App من السجل + 6 اختبارات محتوى.
- صيانة: مهلة صريحة لاختبارات تحليل الصوت (41 مساراً — العتبات كما هي).
- النتيجة: **242/242 أخضر** · validator 48 ملفاً/0 أخطاء — الوحدة 1: d1–d3 جاهزة. (D45)

## 2026-10-10 — دفعة واجهات M3
- إضافة: `src/components/SystemLab.tsx` — لوحة النظام بست شاشات (E17–E22) + زر فتحها في App + 8 اختبارات UI (حدود الصدق ظاهرة · لا أرقام من العدم · بلا لوم · التدقيق كله AA).
- النتيجة: **236/236 أخضر** — كل المحركات الـ26 وواجهاتها مرئية للمستخدم. (D44)

## 2026-10-10 — دفعة M3
- إضافة: E17 البوابات (6 أسابيع + 4 مهارات + حدود صدق Goethe معلنة) · E18 التقدم (بيانات حقيقية فقط + منحنى نسيان) · E19 التكيّف (تجميد يحفظ الجداول + عودة موزّعة) · E20 الترفيه (Wordle/قصص من مفرداتك + بلا ضغط) · E21 البيانات (round-trip + بصمة سلامة) · E22 الوصولية (WCAG AA + RTL/ليلي/تكبير/تركيز) + 27 اختباراً.
- النتيجة: **228/228 أخضر** — **كل المحركات الـ26 مبنية** (4 محركات M0 + E01–E22 الـ22 كلها) — المتبقي واجهات ومحتوى. (D43)

## 2026-10-10 — دفعة واجهات M2
- إضافة: `src/components/SkillsLab.tsx` — مختبر المهارات بثماني شاشات (E09–E16) + زر فتحه في App + 9 اختبارات UI (القفل قبل المحاولة مطبّق واجهياً).
- النتيجة: **201/201 أخضر** — كل محركات M2 يراها المستخدم الآن. (D42)

## 2026-10-10 — دفعة M2-ب
- إضافة: E13 القواعد (اكتشاف موجّه بقفل الكشف + حبّات الجملة + مقارنات عربية) · E14 المفردات الشبكية (إثراء كلمات الـ16 بروابط حقيقية + قصر ذهني) · E15 المهام الحقيقية (المقهى/القطار/الصيدلية بهداف معلنة) · E16 الثقافة (4 حقائق بمصادر + أغنية ملكية عامة) + 21 اختباراً.
- صيانة: مهلة صريحة 120 ثانية لاختبارات توليد الصوت (عتبات corr/durRatio كما هي) + إثراء بيانات الكلمات (wordFamily/kollocation).
- النتيجة: **192/192 أخضر** — M2 مكتملة. (D41)

## 2026-10-10 — دفعة M2-أ
- إضافة: محركات M2-أ الأربع — E09 الاستماع المتقدم (أزواج D16 + ضجيج تدريجي + أخبار بطيئة) · E10 النطق (مخارج D18 + دورة قبل/بعد) · E11 القراءة (قفل المفردات + ترجمة بعد المحاولة) · E12 الكتابة (تصحيح يشرح «لماذا» + جملة اليوم + يوميات) + 23 اختباراً.
- النتيجة: **171/171 أخضر** — المهارات الأربع مبنية بمصادرها الموثّقة. (D40)

## 2026-10-10 — دفعة M1-د (اكتمال المعلم 1)
- إضافة: 12 كلمة A1 جديدة (محتوى Netzwerk K1 — D15) + إكمال الدرس a1-u1-d1 (3 مصائد + حزمة SRS) + 12 مقطعاً صوتياً (17 مساراً في المانيفست) + `src/lib/lesson-runner.ts` + `src/components/LessonContent.tsx` + `src/lesson-packs.ts` + ربط App (الحصة الحقيقية + JIT الوحدة صفر) + 12 اختباراً.
- إصلاح: تسريب الاسم الداخلي «رحلة يوسف» (D31) — إعلان مولر الآن «Willkommen bei Schlüssel» + نص بطاقة الوحدة صفر.
- النتيجة: **148/148 أخضر** — الدرس الأول يُدرَّس فعلياً من أول جولة استرجاع إلى تقرير المساء. (D39)

## 2026-10-10 — دفعة M1-ج (E05 + E07 + E08 + واجهة الحصة)
- إضافة: `src/lib/audio-engine.ts` (E05 — سرعات/سلم سمعي/shadowing + حارس D16) + `src/lib/dictation-engine.ts` (E07 — تدفق النسخ + تصحيح لطيف F077) + `src/lib/warmth-engine.ts` (E08 — تقرير مسائي/معاينة غد/رسائل مولر + حارس D23) + `src/components/LessonSession.tsx` (واجهة الحصة الكاملة: 4 محطات + 3 استراحات + قفل اتجاه + شاشة §2.5) + ربط App بزر «ابدأ الحصة» + 30 اختباراً (7/6/6/11).
- النتيجة: **اكتملت محركات M1 الثمانية (E01–E08)** — 136/136 أخضر + tsc + validator + build. (D38)

## 2026-10-10 — D37: تثبيت صوت Piper في المستودع
- إضافة: `tools/piper-voices/de_DE-thorsten-medium.onnx` (+ `.onnx.json`) ملتزمان في git (قرار المالك — بلا LFS) + `termux-upload-voice.sh` (سكربت الرفع) + بصمة مثبّتة في التوثيق (`7e64762d…bb7819`).
- توثيق: D37 + تحديث `tools/README-downloads.md` + وصفة الاستعادة (برومت v1.4 — بلا تنزيل) + STATE.
- النتيجة: **106/106 خضراء كلها** في كل بيئة.

## 2026-10-10 — دفعة M1-ب (E03 + E04)
- إضافة: `src/lib/review-engine.ts` (E03 — SRS في محطة الاسترجاع: تحويل ts-fsrs v5 + جدولة §2.5 + طابور بلا جديد + حراس F121) + `src/lib/errors-engine.ts` (E04 — الدفتر الذهبي + التصنيف الثلاثي §4 + المعالجة حسب النوع + الجولة الإلزامية + قاعدة الدقائق الثلاث F038) + 30 اختباراً (tests/review-engine.test.ts + tests/errors-engine.test.ts).
- تغيير: `content/schemas/card.ts` — حقل اختياري `learning_steps` في SrsCardState (وفاء مع ts-fsrs v5 — بلا ترحيل، البيانات القديمة سليمة).
- توثيق: D36 (توفيق «كل خطأ → بطاقة» مع §4 + حد التصلّب + حارس الدقائق الثلاث) + تحديث PROGRESS/STATE/برومت الاستمرارية v1.3.

## 2026-10-09 — المعلم 0 مُغلَق (الدفعة 5)
- إضافة: توليد صوت Piper فعلي (5 Opus + مانيفست ببصمات) + `tools/{gen-audio,audio_probe,pcm_compare,asr_test}.py` + اختبار D16 (`docs/dos/d16-asr-report.json`) + `src/lib/asr-gate.ts` + `src/lib/audio.ts` + 15 اختباراً جديدة (audio-complete/voice-stability/asr-gate) + تقرير الإغلاق.
- إزالة: مانيفست العينة القديم (استُبدل بالمانيفست الحقيقي المولَّد).
- توثيق: D16 نتيجة (البديل مُفعَّل) + D28 (استقرار طيفي ≥0.93) + DoD كامل ✅.

## 2026-10-09 — المعلم 0، الدفعة 4
- إضافة: الوحدة صفر 4+8 JIT + أول تشغيل + أول درس + 10 اختبارات. إصلاح: تسريب day-one لأحداث JIT.

## 2026-10-09 — المعلم 0، الدفعة 3
- إضافة: PWA + قفل المسار + GenderBadge + 8 اختبارات.

## 2026-10-09 — المعلم 0، الدفعة 2
- إضافة: أداة G1 + Dexie/backup + 16 اختباراً.

## 2026-10-09 — المعلم 0، الدفعة 1
- إضافة: مخططات zod + D18/ts-fsrs + 15 اختباراً + خطة M0 + DECISIONS D1–D27.
