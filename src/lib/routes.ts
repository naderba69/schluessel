// src/lib/routes.ts — مسار الواجهة: مكتمل/متاح/مقفل (S0.6 — لا درس مقفل يُفتح)
import type { LearnerProgress } from "../../content/schemas/index.js";

export type LessonStatus = "completed" | "available" | "locked";

export function lessonStatus(lessonId: string, progress: LearnerProgress): LessonStatus {
  if (progress.completedLessons.includes(lessonId)) return "completed";
  if (progress.availableLessons.includes(lessonId) && !progress.lockedLessons.includes(lessonId))
    return "available";
  return "locked";
}

/** القانون 3/§3: لا يُفتح درس إلا بالنجاح (≥75%) في سابقه — الواجهة لا تعرض إلا «متاح» */
export function isLessonUnlocked(lessonId: string, progress: LearnerProgress): boolean {
  return lessonStatus(lessonId, progress) !== "locked";
}
