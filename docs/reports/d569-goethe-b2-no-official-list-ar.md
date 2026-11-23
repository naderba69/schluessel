# تقرير D569 — التوصية 4 تُغلق بالدليل: لا قائمة Goethe رسمية للمستوى B2

**التاريخ:** 2026-11-20 · **الدفعة:** 523 · **الإصدار:** 7.115

## الخلاصة

**معهد Goethe لا ينشر قائمة كلمات رسمية للمستوى B2.** القوائم الرسمية المنشورة هي أربعة فقط: A1 (Fit in Deutsch 1) وA1 (Start Deutsch 1) وA2 وB1. وهذا هو الحال المتّفق عليه في كل مصادر التعلّم المستقلة.

## الدليل (بحث ويب حيّ — 2026-11-20)

1. **r/German (2022 و2025 — ثلاث خيوط مختلفة)**: «Leider gibt es keine B2- oder C1-Liste» · «That's because there aren't any» · «There is no official B2 Wortschatz because at that level you're expected to have all the basic vocabulary» · «Goethe hat leider keine offizielle Wortliste für B2».
2. **r/WriteStreakGerman (2025)**: «Es ist allgemein bekannt, dass das Goethe Institut eine offizielle Wortliste zu jedem Niveau von A1 bis B1 bietet. Es gibt jedoch keine solche Liste ab dem Niveau B2.»
3. **ما يُتداول باسم «Goethe B2 Wortliste» ليس رسمياً**: صفحة إعلانات («I am not robot!» + كلمات عشوائية) تكرّر نص مقدّمة **قائمة B1** نفسها («2400 lexikalische Einheiten … Niveaustufe B1»)، ومواقع SEO تدّعي أرقاماً متناقضة (300–400 مقابل 2000–3000 مقابل 3000–4000 كلمة) — ولا يُصدَّق منها شيء.
4. **موقع goethe.de نفسه محجوب من بيئة البناء** — والتحقّق المباشر من صفحته الرسمية يبقى ضمن التوصية 6 (تحقق الروابط) عند توفر الشبكة المفتوحة.
   - **تحديث (D572 — 2026-11-21):** نُفّذ التحقق المباشر — صفحة goethe.de الرسمية لامتحان B2 **بلا قسم قائمة كلمات** بينما صفحتا A2 وB1 تحملان «Wortliste» صراحة، والتفاصيل الكاملة في `docs/reports/d572-live-link-check-ar.md`.

## القرار (D110 يحمينا أصلاً)

- **لا تُكتب قائمة B2 يدوياً أبداً** (D110: الوسم دليل لا رأي) — فبلا مصدر رسمي لا يمكن أن يظهر وسم B2 على أي كلمة، والآلية (`tools/lib/goethe-lists.ts`) تمنع ذلك هندسياً.
- **حارس دائم جديد** في الاختبارات: صفر كلمات بوسم B2 + صفر ملفات `goethe-b2` في `content/wordlists/` — حتى لا يُنسى هذا يوماً.
- كلمات المقرر (2538) أصلها القوائم الأربع المنشورة وتُدرَّس بمنهجها الخاص — لا نقص يُغطّيه وسم B2.

**التالي:** التوصية 5 (جلسة مناقشة الملاحظات المفتوحة — N-155 أولها) — القرار للمالك.
