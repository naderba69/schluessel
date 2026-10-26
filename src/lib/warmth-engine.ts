// src/lib/warmth-engine.ts — محرك الدفء E08: تقرير المساء بسطر + معاينة الغد + رسائل مولر المتنوعة
// المصادر: D23 (تحفيز هادئ — بلا لوم وبلا سلاسل ضغط) · F011 (تقرير مسائي سطر واحد) · F012 (معاينة الغد)
// الحارس الحاسم: صفر سلاسل/صفر توبيخ في كل نص يُولَّد (اختبار يقفله — يمسح كل النصوص)

/**
 * قائمة ممنوعات النبرة (D23): لا لوم، لا تخويف، ولا ضغط «السلسلة» إطلاقاً —
 * كل نص يولّده التطبيق يمر على هذه القائمة آلياً في الاختبارات.
 */
export const BLAME_WORDS = [
  "خسرت",
  "سلسلة",
  "فشل",
  "توبيخ",
  "عقاب",
  "أيام ضائعة",
  "كسول",
  "عطلت",
  "مُهمل",
  "مهمل",
  "متأخر",
  "احمر",
  "علامة حمراء",
] as const;

export function hasBlame(text: string): boolean {
  return BLAME_WORDS.some((w) => text.includes(w));
}

/** التقرير المسائي (F011): سطر واحد هادئ — بلا أرقام مخيفة وبلا لوم */
export function eveningReport(input: {
  cardsReviewed: number;
  trapsNoticed: number;
}): string {
  const review = input.cardsReviewed > 0
    ? `راجعتَ ${input.cardsReviewed} بطاقة`
    : "فتحتَ التطبيق ولو لدقيقة";
  const traps = input.trapsNoticed > 0
    ? `، وانتبهت إلى ${input.trapsNoticed} مصائد في دفترك`
    : "، وحافظت على دفء المسار";
  return `يوم جميل: ${review}${traps} — تقدم حقيقي. النوم شريكك في التثبيت. 🌙`;
}

/** التقرير المسائي للمدرب (F011 · D304 · N-156/7): سطر واحد هادئ في تبويب المدرب — بلا أرقام مخيفة وبلا لوم */
export function coachEveningReport(input: {
  resolvedCount: number;
  studiedToday: boolean;
}): string {
  const studied = input.studiedToday
    ? "درستَ اليوم — والقليل المتصل يغلب الكثير المنقطع"
    : "حتى بلا دراسة اليوم، الباب مفتوح دائماً";
  const resolved = input.resolvedCount > 0
    ? `، وحللتَ ${input.resolvedCount} من أخطائك الذهبية 💛`
    : "";
  return `مساء الخير 🌙: ${studied}${resolved}. نم جيداً — النوم يثبّت ما تعلمته.`;
}

/** معاينة الغد (F12): جملة واحدة — تُقال دائماً بإطار اختياري هادئ */
export function tomorrowPreview(input: { hasNewContent: boolean; dueCount: number }): string {
  const due = input.dueCount > 0
    ? `نسترجع ${input.dueCount} بطاقة من ذاكرتك`
    : "لا مراجعات مستحقة — يوم خفيف";
  const next = input.hasNewContent
    ? "ثم نفتح كلمات جديدة بلطف"
    : "ثم نُثبّت ما تعلمناه";
  return `غداً: ${due}، ${next}. ابدأ حينما تشاء — لا إلحاح. ☀️`;
}

/** رسائل مولر المتنوعة (D23 — تُبدَّل لتبقى العبارات حية بلا ضغط) */
export const MULLER_MESSAGES = [
  "اللغة مفتاحك — والمفتاح يدور بلطف، مهما بطيء.",
  "الاسترجاع اليومي أهم من الجلسة الطويلة — قطرة تدوم.",
  "النسيان ليس عدوّك؛ هو ما يخبرنا أين نعود غداً.",
  "كل كلمة ألمانية تقولها اليوم هي انتصار صغير.",
  "لا نسابق أحداً — نسير معك على مهل.",
  "النوم شريكك: ما استرجعته الليلة يثبت غداً.",
  "أخطاؤك هي خريطتك — وكل خريطة تحتاج خطأً واحداً على الأقل.",
] as const;

/** اختيار حتمي متنوع — بلا عشوائية حتى تبقى الاختبارات صادقة */
export function muellerMessage(dayIndex: number): string {
  const i = ((dayIndex % MULLER_MESSAGES.length) + MULLER_MESSAGES.length) % MULLER_MESSAGES.length;
  return MULLER_MESSAGES[i];
}

/** D278: تقرير المعايرة (slider ↔ نتيجة — كل وحدتين): تجميع + حكم لطيف بلا لوم */
export type CalibrationReport = {
  count: number;
  meanPred: number;
  meanAct: number;
  /** متوسط (التوقع − النتيجة): موجب = طموح فوق الأداء */
  bias: number;
  verdict: string;
};

export function calibrationReport(entries: readonly { predicted: number; actual: number }[]): CalibrationReport {
  if (entries.length === 0)
    return {
      count: 0,
      meanPred: 0,
      meanAct: 0,
      bias: 0,
      verdict: "لا توقعات بعد — توقّع نتيجتك قبل كل اختبار وسترى صورتك هنا.",
    };
  const meanPred = Math.round(entries.reduce((s, e) => s + e.predicted, 0) / entries.length);
  const meanAct = Math.round(entries.reduce((s, e) => s + e.actual, 0) / entries.length);
  const bias = meanPred - meanAct;
  const verdict =
    Math.abs(bias) <= 10
      ? `توقّعك دقيق — تعرف مستواك، وهذه مهارة بحد ذاتها.`
      : bias > 0
        ? `تتوقع أعلى من نتيجتك عادة — الطموح وقود، والمراجعة القصيرة تقرّب الصورة.`
        : `نتائجك أعلى من توقعك عادة — أنت أفضل مما تظن 🌟`;
  return { count: entries.length, meanPred, meanAct, bias, verdict };
}
