// adaptation-engine.ts — E19 محرك التكيّف الإنساني | M3
// المصادر: طلب يوسف (يوم المرض/رمضان/السفر/خطة العودة) · spaced review عند العودة (Cepeda 2006) · D23 (بلا لوم)
// القاعدة الحديدية: **التجميد يحفظ الجداول ولا يكسرها** — لا بطاقة تضيع، ولا عبارة لوم عند العودة.

export type FreezeReason = "krank" | "ramadan" | "reise" | "pruefung" | "family";

export const REASON_AR: Record<FreezeReason, string> = {
  krank: "يوم مرض",
  ramadan: "الشهر الفضيل",
  reise: "سفر",
  pruefung: "امتحان مدرسي",
  family: "ظرف عائلي",
};

export type ScheduledCard = {
  id: string;
  /** يوم الاستحقاق الأصلي (رقم يوم في التقويم) */
  dueDay: number;
};

export type FrozenPlan = {
  reason: FreezeReason;
  /** الجدول الأصلي **محفوظاً كما هو** (لا يُمسّ) */
  original: readonly ScheduledCard[];
  frozenFromDay: number;
  resumeDay: number;
  noteAr: string;
};

/** تجميد الخطة: البطاقات تُؤجّل بالكامل بمقدار المدة — **ترتيبها النسبي يبقى كما هو** */
export function freezePlan(
  cards: readonly ScheduledCard[],
  reason: FreezeReason,
  frozenFromDay: number,
  durationDays: number,
): FrozenPlan {
  if (durationDays <= 0) throw new Error("مدة التجميد يجب أن تكون موجبة");
  if (cards.some((c) => c.dueDay < 0)) throw new Error("يوم استحقاق سالب غير معقول");
  return {
    reason,
    original: Object.freeze([...cards].map((c) => ({ ...c }))),
    frozenFromDay,
    resumeDay: frozenFromDay + durationDays,
    noteAr: `${REASON_AR[reason]} — خطة معطّلة مؤقتاً وبلا أي خسارة. نراك عند العودة بجدولك محفوظاً.`,
  };
}

export type ResumedPlan = {
  cards: ScheduledCard[];
  spreadDays: number;
  noteAr: string;
};

/** العودة: بطاقات العودة **تُوزَّع بالتتابع** (spaced review) — لا كومة يوم واحد */
export function resumePlan(frozen: FrozenPlan, spreadDays = 3): ResumedPlan {
  if (spreadDays <= 0) throw new Error("أيام التوزيع يجب أن تكون موجبة");
  const overdue = frozen.original.filter((c) => c.dueDay <= frozen.resumeDay);
  const future = frozen.original.filter((c) => c.dueDay > frozen.resumeDay);
  const resumed: ScheduledCard[] = [
    ...overdue.map((c, i) => ({ id: c.id, dueDay: frozen.resumeDay + (i % spreadDays) })),
    ...future.map((c) => ({ ...c })),
  ];
  return {
    cards: resumed,
    spreadDays,
    noteAr: `أهلاً بعودتك! ${overdue.length} بطاقة بانتظارك موزّعة على ${spreadDays} أيام — لا تستعجل، ولا شيء ضاع.`,
  };
}

/** تجميد فوري من سبب معلن — لا أسئلة ولا استجواب */
export function quickFreeze(cards: readonly ScheduledCard[], reason: FreezeReason, today: number, durationDays: number) {
  return freezePlan(cards, reason, today, durationDays);
}
