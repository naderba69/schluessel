// src/lib/exam-engine.ts — امتحان المستوى (D284): النقاط الرسمية (100) · الأهلية · التسجيل · مهايئ القراءة
// القاعدة الرسمية (exam-formats/goethe-a1-sd1.json): كل مهارة 25 نقطة · المجموع 100 · النجاح ≥60 · غير مُجزّأ.
import type { GateResult, LearnerState } from "../../content/schemas/index.js";
import { passedUnitBattle, unitKeyOf, type PathLesson } from "./lesson-path.js";
import type { QuizForms, QuizOutcome } from "./quiz-session.js";

/** D284: نقاط المهارة الواحدة في سلم الـ100 الرسمي */
export const SECTION_POINTS = 25;
/** D284: عتبة النجاح الرسمية */
export const EXAM_PASS_AT = 60;
/** D284: مهارات الامتحان الأربع بالترتيب الرسمي */
export const EXAM_SKILLS = ["hoeren", "lesen", "schreiben", "sprechen"] as const;
export type ExamSkill = (typeof EXAM_SKILLS)[number];

const SKILL_AR: Record<ExamSkill, string> = { hoeren: "الاستماع", lesen: "القراءة", schreiben: "الكتابة", sprechen: "التحدث" };
export const examSkillAr = (s: ExamSkill): string => SKILL_AR[s];

/** D284: النقاط الرسمية — نسبة كل مهارة × 25 (لأسفل: الكسر لا يُهدى) · والحكم لا يصدر إلا باكتمال الأقسام الأربعة */
export function examPoints(sections: ReadonlyArray<{ skill: ExamSkill; pct: number }>): {
  points: Record<ExamSkill, number | null>;
  total: number;
  complete: boolean;
  passed: boolean;
} {
  const points = { hoeren: null, lesen: null, schreiben: null, sprechen: null } as Record<ExamSkill, number | null>;
  for (const s of sections) points[s.skill] = Math.floor(s.pct * SECTION_POINTS);
  const vals = EXAM_SKILLS.map((k) => points[k]);
  const complete = vals.every((v) => v !== null);
  const total = vals.reduce<number>((a, v) => a + (v ?? 0), 0);
  return { points, total, complete, passed: complete && total >= EXAM_PASS_AT };
}

/** D284: مفاتيح وحدات المستوى من المسار (مرتبة بلا تكرار) */
export function levelUnits(path: readonly PathLesson[], level: string): string[] {
  const units = [...new Set(path.filter((l) => l.level === level).map((l) => l.unit))].sort((a, b) => a - b);
  return units.map((u) => unitKeyOf(level as Parameters<typeof unitKeyOf>[0], u));
}

/** D284: تقدّم الأهلية — كم معركة وحدة اجتاز من مستوى الامتحان */
export function levelExamProgress(
  progress: Pick<import("../../content/schemas/index.js").LearnerProgress, "gateResults">,
  unitKeys: readonly string[],
): { done: number; total: number } {
  return { done: unitKeys.filter((k) => passedUnitBattle(progress, k)).length, total: unitKeys.length };
}

/** D284: الأهلية — كل معارك وحدات المستوى مجتازة (لا امتحان قبل إتمام المنهج) */
export function levelExamReady(
  progress: Pick<import("../../content/schemas/index.js").LearnerProgress, "gateResults">,
  unitKeys: readonly string[],
): boolean {
  return unitKeys.length > 0 && unitKeys.every((k) => passedUnitBattle(progress, k));
}

/** D284: معرّف بوابة القسم — الامتحان يُسجَّل قسماً قسماً ثم يُجمَع */
export const sectionGateId = (examId: string, skill: ExamSkill): string => `${examId}/${skill}`;

/** D284: محاولات القسم المسجلة */
export function sectionAttempts(
  progress: Pick<import("../../content/schemas/index.js").LearnerProgress, "gateResults">,
  examId: string,
  skill: ExamSkill,
): number {
  const id = sectionGateId(examId, skill);
  return progress.gateResults.filter((g) => g.kind === "level-exam" && g.gateId === id).length;
}

/** D284: تسجيل قسم — بوابة level-exam بمعرّف القسم + نسخة في سجل امتحانات المستوى */
export function recordLevelSection(
  state: LearnerState,
  examId: string,
  level: string,
  skill: ExamSkill,
  outcome: QuizOutcome,
  date: string,
): LearnerState {
  const gateId = sectionGateId(examId, skill);
  const prior = state.progress.gateResults.filter((g) => g.kind === "level-exam" && g.gateId === gateId).length;
  const entry: GateResult = {
    gateId,
    kind: "level-exam",
    score: outcome.score,
    passed: outcome.passed,
    attempts: prior + 1,
    weakSections: [],
    date,
  };
  const levelLog = state.progress.levelExams[level] ?? [];
  return {
    ...state,
    progress: {
      ...state.progress,
      gateResults: [...state.progress.gateResults, entry],
      levelExams: { ...state.progress.levelExams, [level]: [...levelLog, entry] },
    },
  };
}

/** D284: المجموع الرسمي من آخر نتيجة لكل قسم (الأحدث يغلب) */
export function modellTotal(
  progress: Pick<import("../../content/schemas/index.js").LearnerProgress, "gateResults">,
  examId: string,
): { points: Record<ExamSkill, number | null>; total: number; complete: boolean; passed: boolean } {
  const sections: { skill: ExamSkill; pct: number }[] = [];
  for (const skill of EXAM_SKILLS) {
    const last = progress.gateResults.filter((g) => g.kind === "level-exam" && g.gateId === sectionGateId(examId, skill)).at(-1);
    if (last) sections.push({ skill, pct: last.score });
  }
  return examPoints(sections);
}

/** D284: جزء قراءة بالشكل الأدنى الذي يحتاجه المهايئ */
export type ModellLesenPart = {
  readonly texts?: ReadonlyArray<{ readonly id: string; readonly de: string }>;
  readonly items: ReadonlyArray<{
    readonly q: string;
    readonly a: string;
    readonly choices?: readonly string[];
    readonly textRefs?: readonly string[];
    readonly evidence?: string;
  }>;
};

/** D284: مهايئ القراءة — 15 بنداً بخياراتها على المحطة (النص يُضمَّن في السؤال — اقرأ ثم أجب) */
export function modellLesenQuiz(examId: string, passingScore: number, parts: readonly ModellLesenPart[]): QuizForms {
  const items = parts.flatMap((p) => {
    const byId = new Map((p.texts ?? []).map((t) => [t.id, t.de]));
    return p.items.map((it) => {
      const refs = (it.textRefs ?? []).map((r) => byId.get(r)).filter((x): x is string => !!x);
      const reading = refs.length > 0 ? `📖 اقرأ ثم أجب — «${refs.join(" / ")}» — ` : "";
      const why = it.evidence ? `الدليل في النص: «${it.evidence}»` : undefined;
      return { q: `${reading}${it.q}`, a: it.a, choices: it.choices ? [...it.choices] : undefined, why };
    });
  });
  return {
    id: `${examId}/lesen`,
    quiz: { variants: [{ items, passingScore }] },
    slider: {
      questionDe: "Wie gut kannst du lesen?",
      questionAr: "قبل القراءة: كيف تقيّم فهمك للنصوص الألمانية القصيرة؟",
      min: 0,
      max: 100,
    },
  };
}
