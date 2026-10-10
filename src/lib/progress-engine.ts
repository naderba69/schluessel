// progress-engine.ts — E18 محرك التقدم الرباعي | M3
// المصادر: قياس مهاري معياري (CEFR — أشرطة مهارات) · منحنى النسيان (Ebbinghaus: R = e^−t/S)
// القاعدة الحديدية: **الأرقام من بياناتك الحقيقية فقط** — لا نسبة بلا ممارسة، لا تقدير من العدم.

export type Skill = "hoeren" | "lesen" | "schreiben" | "sprechen";

export type SkillStat = {
  skill: Skill;
  minutes: number;
  itemsDone: number;
  itemsCorrect: number;
};

export type SkillBar = {
  skill: Skill;
  /** نسبة الإتقان من بياناتك الفعلية فقط */
  accuracy: number;
  minutes: number;
  labelAr: string;
};

const LABEL_AR: Record<Skill, string> = {
  hoeren: "الاستماع",
  lesen: "القراءة",
  schreiben: "الكتابة",
  sprechen: "التحدث",
};

/** أشرطة المهارات الأربع — **ترفض الأرقام الخيالية**: بلا بيانات = لا أشرطة */
export function skillBars(stats: readonly SkillStat[]): SkillBar[] {
  if (stats.length === 0) throw new Error("لا تقدّم بلا بيانات — لا أرقام من العدم (E18)");
  return stats.map((s) => {
    if (s.minutes < 0 || s.itemsDone < 0 || s.itemsCorrect < 0 || s.itemsCorrect > s.itemsDone) {
      throw new Error(`بيانات غير منطقية في ${s.skill}`);
    }
    return {
      skill: s.skill,
      accuracy: s.itemsDone === 0 ? 0 : s.itemsCorrect / s.itemsDone,
      minutes: s.minutes,
      labelAr: LABEL_AR[s.skill],
    };
  });
}

/** منحنى النسيان (Ebbinghaus): الاحتفاظ R = e^(−t/S) — t أيام منذ المراجعة، S ثبات الذاكرة بالأيام */
export function retention(daysSinceReview: number, stabilityDays: number): number {
  if (daysSinceReview < 0) throw new Error("زمن سالب غير معقول");
  if (stabilityDays <= 0) throw new Error("ثبات الذاكرة يجب أن يكون موجباً");
  return Math.exp(-daysSinceReview / stabilityDays);
}

/** التقدير الشهري — من مراجعاتك الفعلية فقط */
export function monthlyEstimate(realReviewsThisMonth: number, realMinutesThisMonth: number): {
  reviews: number;
  minutes: number;
  noteAr: string;
} {
  if (realReviewsThisMonth < 0 || realMinutesThisMonth < 0) throw new Error("أرقام سالبة غير معقولة");
  return {
    reviews: realReviewsThisMonth,
    minutes: realMinutesThisMonth,
    noteAr:
      realReviewsThisMonth === 0
        ? "لا مراجعات هذا الشهر بعد — الأرقام تظهر أول ما تبدأ."
        : `${realReviewsThisMonth} مراجعة و${realMinutesThisMonth} دقيقة هذا الشهر — من بياناتك أنت.`,
  };
}

/** تقدّم مجمع جاهز للعرض — كل رقم مربوط بمصدره */
export function progressSnapshot(stats: readonly SkillStat[], reviewsThisMonth: number, minutesThisMonth: number) {
  return {
    bars: skillBars(stats),
    month: monthlyEstimate(reviewsThisMonth, minutesThisMonth),
    principleAr: "كل رقم هنا محسوب من نشاطك الفعلي — لا أهداف مزيّفة ولا نسب معلّقة.",
  };
}
