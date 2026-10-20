// src/lib/lesson-path.ts — مسار الدروس (D117): الدرس الحالي · تسجيل محاولة Quiz · فتح التالي بالنجاح وحده
// القانون 3/§3: مسار خطّي — لا قفز ولا ارتجاع؛ يُفتح الدرس التالي بـ≥75% في Quiz سابقه فقط (routes.ts يعرض الحالة).
// الحقيقة المخزَّنة = completedLessons (تاريخ لا يُمحى) · availableLessons مشتقّة منها ومن ترتيب المحتوى الحالي
// (reconcileProgress) — فتغيير المحتوى (مثل نقل الوحدة 17 ← 15 في D113) لا يترك متعلماً معلَّقاً بمعرّف اختفى.
import type { GateResult, LearnerProgress, LearnerState, Level } from "../../content/schemas/index.js";
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
): LearnerState {
  const cur = currentLessonId(state.progress, path);
  if (outcome.lessonId !== cur)
    throw new Error(`قفل المسار: ${outcome.lessonId} ليس الدرس الحالي (${cur ?? "اكتمل المسار"}) — لا قفز ولا ارتجاع`);
  const result: GateResult = {
    gateId: cur,
    kind: "lesson-quiz",
    score: outcome.score,
    passed: outcome.passed,
    attempts: quizAttempts(state.progress, cur) + 1,
    weakSections: outcome.weakItems,
    ...(outcome.selfCorrect > 0 ? { selfJudged: outcome.selfCorrect } : {}),
    date,
  };
  const progress: LearnerProgress = {
    ...state.progress,
    gateResults: [...state.progress.gateResults, result],
    completedLessons: outcome.passed ? [...state.progress.completedLessons, cur] : state.progress.completedLessons,
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
