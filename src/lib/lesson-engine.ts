// src/lib/lesson-engine.ts — محرك الحصة E01: حصة واحدة متصلة 120 دقيقة (قرار المالك v1.1)
// أربع محطات بإيقاع ثابت + قفل اتجاه (لا ارتجاع — قانون 3) + الاسترجاع قبل الجديد (F121)
export const SESSION_MINUTES = 120 as const; // حصة واحدة متصلة — لا تقسيم (D29)

export const STATIONS = ["recall", "learn", "practice", "close"] as const;
export type Station = (typeof STATIONS)[number];

/** المدة الرسمية لكل محطة (دقائق) — مجموعها = 120 */
export const STATION_MINUTES: Record<Station, number> = {
  recall: 15, // محطة 1: أخطاء الأمس الذهبية + البطاقات المستحقة
  learn: 40, // محطة 2: الجديد (سؤال قبل شرح — testing effect)
  practice: 50, // محطة 3: بناء/إنتاج/تحدث
  close: 15, // محطة 4: تثبيت + معاينة الغد (النوم شريكك)
};

export const BREAKS_AFTER: ReadonlyArray<Station> = ["recall", "learn", "practice"]; // 3 استراحات قصيرة داخل الحصة

export function stationOrder(): Station[] {
  return [...STATIONS];
}

export function totalMinutes(): number {
  return STATIONS.reduce((sum, s) => sum + STATION_MINUTES[s], 0);
}

export function stationNext(current: Station): Station | null {
  const i = STATIONS.indexOf(current);
  return i === -1 || i === STATIONS.length - 1 ? null : STATIONS[i + 1];
}

/** قفل الاتجاه: مسموح التقدم فقط — لا ارتجاع (قانون 3 + خطة v1.3) */
export function canMove(from: Station, to: Station): boolean {
  return STATIONS.indexOf(to) === STATIONS.indexOf(from) + 1;
}

/**
 * حارس F121 (الاسترجاع قبل الشرح): في محطة «learn» يجب أن يسبق أي كشف (reveal)
 * محاولةً (attempt). المحتوى الذي يعرض الشرح قبل السؤال مرفوض.
 */
export type LearnStep = { kind: "attempt" | "reveal" | "explain" | "drill" };

export function attemptBeforeReveal(steps: LearnStep[]): boolean {
  let sawAttempt = false;
  for (const step of steps) {
    if (step.kind === "attempt") sawAttempt = true;
    if ((step.kind === "reveal" || step.kind === "explain") && !sawAttempt) return false;
  }
  return true;
}
