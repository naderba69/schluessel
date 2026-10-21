// progress-engine.ts — E18 محرك التقدم الرباعي | M3
// المصادر: قياس مهاري معياري (CEFR — أشرطة مهارات) · منحنى النسيان (Ebbinghaus: R = e^−t/S)
// القاعدة الحديدية: **الأرقام من بياناتك الحقيقية فقط** — لا نسبة بلا ممارسة، لا تقدير من العدم.
import { GATE_INTERVAL_WEEKS, isGateWeek } from "./gate-engine.js";

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

/* ══════════ N-149 (D249) — الخريطة الهادئة (§2.8) ══════════ */
/** أسابيع الرحلة الكاملة A1 ← B2 (الخطة §7: 14 + 14 + 17 + 17) */
export const JOURNEY_WEEKS = 62;
/** عرض شريط المستوى (مربعات) — ثابت مهما كبر عدد الدروس */
export const MAP_BAR_WIDTH = 10;
export const MAP_LEVELS = ["A1", "A2", "B1", "B2"] as const;

export type MapLevel = { level: string; total: number; done: number };
export type MapUnitDay = { day: number; status: "completed" | "available" | "locked" };
export type ProgressMap = {
  levels: MapLevel[];
  /** الوحدة الحالية (null عند إكمال كل المنشور) */
  unit: { level: string; unit: number } | null;
  unitDays: MapUnitDay[];
  weekNumber: number;
  gateWeek: boolean;
  nextGateWeek: number;
  pathComplete: boolean;
};

const dayMs = (isoDay: string) => Date.parse(`${isoDay}T00:00:00Z`);

/** بانية الخريطة — من الفهرس والتقدم الحقيقيين فقط (لا يُخترع مستوى ولا يوم) */
export function buildProgressMap(opts: {
  index: readonly { id: string; level: string; unit: number; day: number }[];
  completedIds: readonly string[];
  availableIds: readonly string[];
  currentId: string | null;
  createdAtDay: string;
  todayDay: string;
}): ProgressMap {
  const done = new Set(opts.completedIds);
  const open = new Set(opts.availableIds);
  const levels = MAP_LEVELS.map((level) => {
    const mine = opts.index.filter((e) => e.level === level);
    return { level, total: mine.length, done: mine.filter((e) => done.has(e.id)).length };
  });
  const current = opts.currentId ? opts.index.find((e) => e.id === opts.currentId) ?? null : null;
  const unit = current ? { level: current.level, unit: current.unit } : null;
  const unitDays = unit
    ? opts.index
        .filter((e) => e.level === unit.level && e.unit === unit.unit)
        .sort((a, b) => a.day - b.day)
        .map((e) => ({
          day: e.day,
          status: (done.has(e.id) ? "completed" : open.has(e.id) ? "available" : "locked") as MapUnitDay["status"],
        }))
    : [];
  const weekNumber = Math.max(1, Math.floor((dayMs(opts.todayDay) - dayMs(opts.createdAtDay)) / 604800000) + 1);
  const gateWeek = isGateWeek(weekNumber);
  const nextGateWeek = Math.ceil(weekNumber / GATE_INTERVAL_WEEKS) * GATE_INTERVAL_WEEKS;
  return { levels, unit, unitDays, weekNumber, gateWeek, nextGateWeek, pathComplete: opts.currentId === null };
}

/** شريط مستوى بعرض ثابت (▓ للمكتمل و░ للباقي) — null للمستوى غير المنشور */
export function levelBar(level: MapLevel): string | null {
  if (level.total === 0) return null;
  const fill = Math.round((level.done / level.total) * MAP_BAR_WIDTH);
  return "▓".repeat(fill) + "░".repeat(MAP_BAR_WIDTH - fill);
}
