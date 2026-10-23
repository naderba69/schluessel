// src/lib/lesson-path.ts — مسار الدروس (D117): الدرس الحالي · تسجيل محاولة Quiz · فتح التالي بالنجاح وحده
// القانون 3/§3: مسار خطّي — لا قفز ولا ارتجاع؛ يُفتح الدرس التالي بـ≥75% في Quiz سابقه فقط (routes.ts يعرض الحالة).
// الحقيقة المخزَّنة = completedLessons (تاريخ لا يُمحى) · availableLessons مشتقّة منها ومن ترتيب المحتوى الحالي
// (reconcileProgress) — فتغيير المحتوى (مثل نقل الوحدة 17 ← 15 في D113) لا يترك متعلماً معلَّقاً بمعرّف اختفى.
import type { CalibrationEntry, CyclicTest, ErrorEntry, GateResult, LearnerProgress, LearnerState, Level, OpenSession } from "../../content/schemas/index.js";
import type { QuizOutcome } from "./quiz-session.js";
import { enrollSrsCards } from "./review-engine.js";

export type PathLesson = { readonly id: string; readonly level: Level; readonly unit: number };

/** الدرس الحالي: أول درس في ترتيب المسار لم يكتمل — null = اكتمل كل المنشور */
export function currentLessonId(progress: Pick<LearnerProgress, "completedLessons">, path: readonly PathLesson[]): string | null {
  const done = new Set(progress.completedLessons);
  return path.find((l) => !done.has(l.id))?.id ?? null;
}

/** الدرس الذي يلي درساً في الترتيب (للرسائل فقط) */
export function lessonAfter(lessonId: string, path: readonly PathLesson[]): string | null {
  const i = path.findIndex((l) => l.id === lessonId);
  return i >= 0 ? (path[i + 1]?.id ?? null) : null;
}

/** اشتقاق المتاح والوحدة الحالية من التاريخ + ترتيب المحتوى (يُنادى عند التحميل وبعد كل نتيجة) */
export function reconcileProgress(progress: LearnerProgress, path: readonly PathLesson[]): LearnerProgress {
  const cur = currentLessonId(progress, path);
  const lesson = path.find((l) => l.id === cur);
  return {
    ...progress,
    availableLessons: cur ? [cur] : [],
    currentUnit: lesson ? { level: lesson.level, unit: lesson.unit } : progress.currentUnit,
  };
}

export function reconcileState(state: LearnerState, path: readonly PathLesson[]): LearnerState {
  return { ...state, progress: reconcileProgress(state.progress, path) };
}

/** محاولات Quiz هذا الدرس حتى الآن (تحدد النسخة التالية — قانون 21) */
export function quizAttempts(progress: Pick<LearnerProgress, "gateResults">, lessonId: string): number {
  return progress.gateResults.filter((g) => g.kind === "lesson-quiz" && g.gateId === lessonId).length;
}

/** D277: مفتاح الوحدة للمعارك — «A1-u1» */
export const unitKeyOf = (level: Level, unit: number): string => `${level}-u${unit}`;

/** D277: محاولات معركة الوحدة (تدوير النسخ — قانون 21) */
export function battleAttempts(progress: Pick<LearnerProgress, "gateResults">, unitKey: string): number {
  return progress.gateResults.filter((g) => g.kind === "unit-battle" && g.gateId === unitKey).length;
}

/** D277: محاولات المعركة المؤجلة */
export function delayedAttempts(progress: Pick<LearnerProgress, "gateResults">, unitKey: string): number {
  return progress.gateResults.filter((g) => g.kind === "delayed-battle" && g.gateId === unitKey).length;
}

/** D277: هل اجتاز معركة الوحدة؟ (شرط المؤجلة) */
export function passedUnitBattle(progress: Pick<LearnerProgress, "gateResults">, unitKey: string): boolean {
  return progress.gateResults.some((g) => g.kind === "unit-battle" && g.gateId === unitKey && g.passed);
}

/** D277: وحدات مؤجلتها مستحقة — معركة مجتازة وبلا مؤجلة مسجلة */
export function deferredUnits(progress: Pick<LearnerProgress, "gateResults">): string[] {
  const passed = new Set<string>();
  const delayed = new Set<string>();
  for (const g of progress.gateResults) {
    if (g.kind === "unit-battle" && g.passed) passed.add(g.gateId);
    if (g.kind === "delayed-battle") delayed.add(g.gateId);
  }
  return [...passed].filter((u) => !delayed.has(u));
}

/** D278: وحدات معاركها مجتازة — بترتيب أول اجتياز (تقرير المعايرة كل وحدتين) */
export function passedBattleUnits(progress: Pick<LearnerProgress, "gateResults">): string[] {
  const out: string[] = [];
  for (const g of progress.gateResults) {
    if (g.kind === "unit-battle" && g.passed && !out.includes(g.gateId)) out.push(g.gateId);
  }
  return out;
}

/** D278: إحصاء معارك وحدة: محاولات المعركة + أفضل نتيجة + أفضل مؤجلة */
export function unitBattleStats(
  progress: Pick<LearnerProgress, "gateResults">,
  unitKey: string,
): { battles: number; best: number | null; delayedBest: number | null } {
  const scores = progress.gateResults.filter((g) => g.kind === "unit-battle" && g.gateId === unitKey).map((g) => g.score);
  const delayed = progress.gateResults.filter((g) => g.kind === "delayed-battle" && g.gateId === unitKey).map((g) => g.score);
  return {
    battles: scores.length,
    best: scores.length > 0 ? Math.max(...scores) : null,
    delayedBest: delayed.length > 0 ? Math.max(...delayed) : null,
  };
}

/** D278: تفريغ الوحدة — مشتق من السجل وحده (بلا حالة جديدة) */
export type UnitDebrief = {
  unitKey: string;
  battles: number;
  /** أفضل نتيجة معركة (0–1) — null بلا معركة */
  best: number | null;
  /** أفضل مؤجلة — null لم تُؤدَّ بعد */
  delayedBest: number | null;
  goldenOpen: number;
  goldenResolved: number;
  calibrations: number;
  /** متوسط (التوقع − النتيجة) — null بلا معايرة */
  bias: number | null;
};

export function unitDebrief(
  progress: Pick<LearnerProgress, "gateResults">,
  errors: readonly ErrorEntry[],
  calibration: readonly CalibrationEntry[],
  unitKey: string,
  unitLessonIds: readonly string[],
): UnitDebrief {
  const st = unitBattleStats(progress, unitKey);
  const inUnit = (lessonId: string) => unitLessonIds.includes(lessonId);
  const fromUnit = errors.filter((e) => {
    const src = e.payload.source;
    return unitLessonIds.some((id) => src === id || src.startsWith(`${id}/`));
  });
  const cal = calibration.filter((c) => c.lessonId !== undefined && inUnit(c.lessonId));
  return {
    unitKey,
    battles: st.battles,
    best: st.best,
    delayedBest: st.delayedBest,
    goldenOpen: fromUnit.filter((e) => !e.resolved).length,
    goldenResolved: fromUnit.filter((e) => e.resolved).length,
    calibrations: cal.length,
    bias: cal.length > 0 ? cal.reduce((s, c) => s + (c.predicted - c.actual), 0) / cal.length : null,
  };
}

/** D283: أسبوع الرحلة (1-based) — أسابيع اثنينية منذ اثنين أسبوع الإنشاء */
export function journeyWeek(createdAtISO: string, today = new Date()): number {
  const [y, m, d] = createdAtISO.split("-").map(Number);
  if (!y || !m || !d) return 1;
  const created = new Date(y, m - 1, d);
  const mondayOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate() - ((x.getDay() + 6) % 7));
  const start = mondayOf(created).getTime();
  const now = mondayOf(today).getTime();
  return Math.max(1, Math.round((now - start) / 604800000) + 1);
}

/** D283: محاولات اختبار دوري (Kurztest/الشهري) */
export function cyclicAttempts(progress: Pick<LearnerProgress, "gateResults">, testId: string): number {
  return progress.gateResults.filter(
    (g) => (g.kind === "kurztest" || g.kind === "monthly") && g.gateId === testId,
  ).length;
}

/** D283: اختبار الأسبوع الدوري — سبت + أسبوع زوجي (الشهرية في أسابيعها بدل القصير) */
export function cyclicTestFor(
  tests: readonly CyclicTest[],
  level: string,
  weekNumber: number,
  today: Date,
): CyclicTest | undefined {
  if (today.getDay() !== 6 || weekNumber < 2 || weekNumber % 2 !== 0) return undefined;
  const kind = weekNumber % 4 === 0 ? "monatspruefung" : "kurztest";
  return tests.find((t) => t.level === level && t.kind === kind && t.week === weekNumber);
}

/** D283: الاختبار الدوري المستحق — موجود + بلا تسجيل */
export function cyclicDue(
  tests: readonly CyclicTest[],
  level: string,
  weekNumber: number,
  today: Date,
  progress: Pick<LearnerProgress, "gateResults">,
): CyclicTest | undefined {
  const hit = cyclicTestFor(tests, level, weekNumber, today);
  if (!hit) return undefined;
  return cyclicAttempts(progress, hit.id) === 0 ? hit : undefined;
}

/** D283: تسجيل الاختبار الدوري — بلا قفل مسار ولا إكمال (تراكمي تشخيصي، والمعايرة تُحفَظ) */
export function recordCyclicTest(
  state: LearnerState,
  test: Pick<CyclicTest, "id" | "kind">,
  outcome: QuizOutcome,
  date: string,
): LearnerState {
  const result: GateResult = {
    gateId: test.id,
    kind: test.kind === "monatspruefung" ? "monthly" : "kurztest",
    score: outcome.score,
    passed: outcome.passed,
    attempts: cyclicAttempts(state.progress, test.id) + 1,
    weakSections: outcome.weakItems,
    ...(outcome.selfCorrect > 0 ? { selfJudged: outcome.selfCorrect } : {}),
    date,
  };
  const calibration =
    outcome.predicted === null
      ? state.profile.calibration
      : [...state.profile.calibration, { date, predicted: outcome.predicted, actual: outcome.percent }];
  return {
    ...state,
    profile: { ...state.profile, calibration },
    progress: { ...state.progress, gateResults: [...state.progress.gateResults, result] },
  };
}

/** D277: المؤجلة اليوم؟ — اثنين + مستحقة (الخطة: أول 25 د من الاثنين) */
export function deferredDue(progress: Pick<LearnerProgress, "gateResults">, unitKey: string, dayISO: string): boolean {
  const [y, m, d] = dayISO.split("-").map(Number);
  if (!y || !m || !d) return false;
  if (new Date(y, m - 1, d).getDay() !== 1) return false; // الاثنين وحده
  return deferredUnits(progress).includes(unitKey);
}

/**
 * تسجيل محاولة Quiz للدرس الحالي: نتيجة البوابة + سطر المعايرة (§14) + الإكمال عند النجاح وحده.
 * قفل المسار: محاولة لدرس غير الحالي (قفز للأمام أو عودة لمكتمل) خطأ برمجي يُرمى — لا يُسجَّل بصمت.
 */
export function recordQuizAttempt(
  state: LearnerState,
  outcome: QuizOutcome,
  path: readonly PathLesson[],
  date: string,
  srsBundle: readonly string[] = [], // N-005 (D227): حزمة الدرس — تدخل SRS عند النجاح وحده
  unitKey?: string, // D277: حاضر = اختبار اليوم السادس معركةُ وحدة (unit-battle)
): LearnerState {
  const cur = currentLessonId(state.progress, path);
  if (outcome.lessonId !== cur)
    throw new Error(`قفل المسار: ${outcome.lessonId} ليس الدرس الحالي (${cur ?? "اكتمل المسار"}) — لا قفز ولا ارتجاع`);
  const isBattle = unitKey !== undefined;
  const result: GateResult = {
    gateId: isBattle ? unitKey : cur,
    kind: isBattle ? "unit-battle" : "lesson-quiz",
    score: outcome.score,
    passed: outcome.passed,
    attempts: (isBattle ? battleAttempts(state.progress, unitKey) : quizAttempts(state.progress, cur)) + 1,
    weakSections: outcome.weakItems,
    ...(outcome.selfCorrect > 0 ? { selfJudged: outcome.selfCorrect } : {}),
    date,
  };
  const progress: LearnerProgress = {
    ...state.progress,
    gateResults: [...state.progress.gateResults, result],
    completedLessons: outcome.passed ? [...state.progress.completedLessons, cur] : state.progress.completedLessons,
    openSession: outcome.passed ? undefined : state.progress.openSession, // N-006: النجاح يُغلق الحصة المفتوحة؛ «ليس بعد» تُبقيها للاستئناف
  };
  const calibration =
    outcome.predicted === null
      ? state.profile.calibration
      : [...state.profile.calibration, { date, predicted: outcome.predicted, actual: outcome.percent, lessonId: cur }];
  return {
    ...state,
    profile: { ...state.profile, calibration },
    progress: reconcileProgress(progress, path),
    ...(outcome.passed && srsBundle.length > 0
      ? { srsCards: [...state.srsCards, ...enrollSrsCards(state.srsCards, srsBundle, new Date(date))] }
      : {}),
  };
}

/** D277: تسجيل المعركة المؤجلة — بلا قفل مسار ولا إكمال (استرجاع متباعد، والمعايرة تُحفَظ)
 * transferShare تُحجَب عمداً: لا سياقات تحويل بعدُ (N-158) — الصدق أولاً. */
export function recordDelayedBattle(
  state: LearnerState,
  unitKey: string,
  outcome: QuizOutcome,
  date: string,
): LearnerState {
  const result: GateResult = {
    gateId: unitKey,
    kind: "delayed-battle",
    score: outcome.score,
    passed: outcome.passed,
    attempts: delayedAttempts(state.progress, unitKey) + 1,
    weakSections: outcome.weakItems,
    ...(outcome.selfCorrect > 0 ? { selfJudged: outcome.selfCorrect } : {}),
    date,
  };
  const calibration =
    outcome.predicted === null
      ? state.profile.calibration
      : [...state.profile.calibration, { date, predicted: outcome.predicted, actual: outcome.percent }];
  return {
    ...state,
    profile: { ...state.profile, calibration },
    progress: { ...state.progress, gateResults: [...state.progress.gateResults, result] },
  };
}

/** N-006 (D228): حفظ لقطة الحصة المفتوحة (تُكتب عند كل تقدّم داخل الحصة) */
export function setOpenSession(progress: LearnerProgress, open: OpenSession): LearnerProgress {
  return { ...progress, openSession: { ...open, done: [...open.done], pos: { ...open.pos } } };
}

/** N-006: لقطة هذا الدرس وحده — لقطة درس آخر (قديمة) تُتجاهل عند الفتح */
export function openSessionFor(progress: Pick<LearnerProgress, "openSession">, lessonId: string): OpenSession | undefined {
  const o = progress.openSession;
  return o && o.lessonId === lessonId ? o : undefined;
}
