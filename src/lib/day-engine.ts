// src/lib/day-engine.ts — محرك اليوم E06: يبني حصة اليوم آلياً (SRS + أخطاء ذهبية + مهارة اليوم)
// القانون: لا جلسة بلا استرجاع أولاً (F121/اختبار آلي يقفله) — أخطاء الأمس الذهبية في المقدمة دائماً (§12)

export type DueCard = { cardId: string; due: string; kind: "review" };
export type GoldenError = { id: string; capturedOn: string; pattern: string; kind: "error" };
export type NewItem = { id: string; kind: "new-word" | "new-grammar" };

export type DayPlan = {
  date: string; // YYYY-MM-DD
  station1: { goldenErrors: GoldenError[]; dueCards: DueCard[] };
  newItems: NewItem[]; // محطة 2 — بعد الاسترجاع دائماً
  skillOfDay?: string; // F007 مهارة اليوم
};

/**
 * بناء خطة اليوم: الأخطاء الذهبية أولاً (الأقدم التقاطاً)، ثم البطاقات المستحقة (الأقدم استحقاقاً)،
 * ثم الجديد. الترتيب نفسه هو الحارس: الاسترجاع يسبق الجديد في بنية الخطة.
 */
export function buildDayPlan(opts: {
  date: string;
  goldenErrors: GoldenError[];
  dueCards: DueCard[];
  newItems: NewItem[];
  skillOfDay?: string;
}): DayPlan {
  const goldenErrors = [...opts.goldenErrors].sort((a, b) => a.capturedOn.localeCompare(b.capturedOn));
  const dueCards = [...opts.dueCards].sort((a, b) => a.due.localeCompare(b.due));
  return {
    date: opts.date,
    station1: { goldenErrors, dueCards },
    newItems: [...opts.newItems],
    skillOfDay: opts.skillOfDay,
  };
}

/** اختبار آلي للحارس: هل خطة اليوم تبدأ بالاسترجاع (محطة 1) قبل أي جديد؟ */
export function recallBeforeNew(plan: DayPlan): boolean {
  const hasRecall = plan.station1.goldenErrors.length > 0 || plan.station1.dueCards.length > 0;
  const hasNew = plan.newItems.length > 0;
  // يوم فيه جديد بلا استرجاع = مرفوض؛ يوم استرجاع خالص (بلا جديد) = سليم
  if (hasNew && !hasRecall) return false;
  return true;
}

/** حدود اليوم الأول: 4 بطاقات فقط (الوحدة صفر §9) — لا إغراق */
export const DAY_ONE_MAX_CARDS = 4;

/** N-147 (D247): نقاط الأسبوع لشاشة اليوم (§2.2) — الاثنين أولاً · محايد بلا لوم (D23) */
export function weekDots(sessions: readonly { date: string }[], today = new Date()): { dots: readonly boolean[]; studied: number } {
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
  const studiedDays = new Set(sessions.map((x) => x.date));
  const dots = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return studiedDays.has(iso(d));
  });
  return { dots, studied: dots.filter(Boolean).length };
}

/* ══════════ D275 — تخصص الأيام (ب-4/ب-13): عادة معرفية ثابتة ══════════ */
/** تركيز اليوم — ثقل إضافي لا إلغاء للتشريح (الاثنين استماع … السبت معركة · الأحد راحة) */
export type DayFocus = "listening" | "grammar" | "speaking" | "writing" | "culture" | "battle" | "rest";

export function dayFocus(date: Date): DayFocus {
  switch (date.getDay()) {
    case 1: return "listening";
    case 2: return "grammar";
    case 3: return "speaking";
    case 4: return "writing";
    case 5: return "culture";
    case 6: return "battle";
    default: return "rest";
  }
}

/** التسمية + سطر التوجيه اللطيف (D23 — تشجيع لا أمر ولا لوم) */
export const DAY_FOCUS_AR: Record<DayFocus, { label: string; tip: string }> = {
  listening: { label: "الاستماع 🎧", tip: "اليوم أذنك أولاً — استمع كل جملة مرتين قبل أن تقرأها." },
  grammar: { label: "القواعد 🧩", tip: "الثلاثاء يوم القواعد — قاعدة اليوم تستحق التمهل." },
  speaking: { label: "الكلام 🗣️", tip: "تحدث بصوت عالٍ اليوم — مهمتك التواصلية تستحق وقتاً أطول." },
  writing: { label: "الكتابة ✍️", tip: "اكتب بيدك أو بلوحتك — الإملاء اليوم بتركيز خاص." },
  culture: { label: "التوليف والثقافة 🌍", tip: "نجمع خيوط الأسبوع — ولا تنسَ بطاقة ثقافة الجمعة." },
  battle: { label: "المعركة ⚔️", tip: "يوم المراجعة الأسبوعية — أظهر ما ثبت بهدوء." },
  rest: { label: "الراحة 🌿", tip: "لا شيء مطلوب منك — النوم شريكك في التثبيت." },
};
