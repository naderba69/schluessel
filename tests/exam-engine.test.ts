// tests/exam-engine.test.ts — امتحان المستوى (D284): النقاط الرسمية · الأهلية · التسجيل · مهايئ القراءة
import { describe, it, expect } from "vitest";
import { QuizItem as QuizItemSchema, type GateResult, type LearnerProgress } from "../content/schemas/index.js";
import { ALL_MODELLTESTS } from "../src/lesson-packs.js";
import { startQuizAttempt } from "../src/lib/quiz-session.js";
import {
  examPoints,
  levelExamProgress,
  levelExamReady,
  levelUnits,
  modellHoerenQuiz,
  modellLesenQuiz,
  modellTotal,
  playsLeft,
  recordLevelSection,
  sectionAttempts,
  type ExamSkill,
} from "../src/lib/exam-engine.js";
import { clipUrl } from "../src/lib/audio-assets.js";
import { createInitialState } from "../src/lib/state-factory.js";

const fresh = () => createInitialState("ضياء");
const gates = (list: GateResult[]): Pick<LearnerProgress, "gateResults"> => ({ gateResults: list });
const battle = (unitKey: string): GateResult => ({
  gateId: unitKey, kind: "unit-battle", score: 0.8, passed: true, attempts: 1, weakSections: [], date: "2026-10-20",
});
const section = (examId: string, skill: string, score: number): GateResult => ({
  gateId: `${examId}/${skill}`, kind: "level-exam", score, passed: score >= 0.6, attempts: 1, weakSections: [], date: "2026-10-20",
});
const PATH3 = [
  { id: "a1-u1-d1", level: "A1", unit: 1 },
  { id: "a1-u1-d2", level: "A1", unit: 1 },
  { id: "a1-u2-d1", level: "A1", unit: 2 },
  { id: "b1-u1-d1", level: "B1", unit: 1 },
] as const;

describe("D284: النقاط الرسمية (100)", () => {
  const full = (pct: number) =>
    (["hoeren", "lesen", "schreiben", "sprechen"] as const).map((skill) => ({ skill, pct }));

  it("كل مهارة 25 — والنجاح من 60", () => {
    const r = examPoints(full(1));
    expect(r.points).toEqual({ hoeren: 25, lesen: 25, schreiben: 25, sprechen: 25 });
    expect(r.total).toBe(100);
    expect(r.complete).toBe(true);
    expect(r.passed).toBe(true);
    expect(examPoints(full(0.6)).passed).toBe(true); // الحد نفسه ناجح
    expect(examPoints(full(0.59)).passed).toBe(false);
  });

  it("الناقص بلا حكم مهما علا مجموعه", () => {
    const r = examPoints([{ skill: "lesen", pct: 1 }, { skill: "hoeren", pct: 1 }]);
    expect(r.total).toBe(50);
    expect(r.complete).toBe(false);
    expect(r.passed).toBe(false);
    expect(r.points.schreiben).toBeNull();
  });

  it("التقريب لأسفل — الكسر لا يُهدى", () => {
    expect(examPoints([{ skill: "lesen", pct: 0.86 }]).points.lesen).toBe(21); // 21.5 ← 21
    expect(examPoints([{ skill: "lesen", pct: 0.84 }]).points.lesen).toBe(21);
  });
});

describe("D284: الأهلية", () => {
  it("مفاتيح الوحدات من المسار — مرتبة بلا تكرار وبلا مستوى آخر", () => {
    expect(levelUnits([...PATH3], "A1")).toEqual(["A1-u1", "A1-u2"]);
  });

  it("التقدم والأهلية — الكل أو لا شيء", () => {
    const units = ["A1-u1", "A1-u2"];
    expect(levelExamProgress(gates([battle("A1-u1")]), units)).toEqual({ done: 1, total: 2 });
    expect(levelExamReady(gates([battle("A1-u1")]), units)).toBe(false);
    expect(levelExamReady(gates([battle("A1-u1"), battle("A1-u2")]), units)).toBe(true);
    expect(levelExamReady(gates([]), [])).toBe(false); // بلا وحدات = بلا أهلية
  });
});

describe("D284: التسجيل والمجموع", () => {
  const outcome = (score: number) => ({
    lessonId: "x", variantIndex: 0, total: 15, credit: 15 * score, score, percent: score * 100,
    passed: score >= 0.6, passingScore: 0.6, correct: 0, close: 0, wrong: 0,
    predicted: null, calibrated: false, selfJudged: 0, judgeShare: 0, selfCorrect: 0, selfWrong: 0, weakItems: [],
  });

  it("القسم يُسجَّل بمعرّفه + نسخة في سجل المستوى — بلا إكمال دروس", () => {
    const s = recordLevelSection(fresh(), "a1-modelltest-1", "A1", "lesen", outcome(0.8), "2026-10-23");
    const g = s.progress.gateResults[0]!;
    expect(g).toMatchObject({ gateId: "a1-modelltest-1/lesen", kind: "level-exam", score: 0.8, attempts: 1 });
    expect(s.progress.levelExams["A1"]).toEqual([g]);
    expect(s.progress.completedLessons).toEqual([]);
    expect(sectionAttempts(s.progress, "a1-modelltest-1", "lesen")).toBe(1);
    const s2 = recordLevelSection(s, "a1-modelltest-1", "A1", "lesen", outcome(0.9), "2026-10-23");
    expect(s2.progress.gateResults[1]!.attempts).toBe(2);
    expect(s2.progress.levelExams["A1"]).toHaveLength(2);
  });

  it("المجموع من آخر نتيجة لكل قسم", () => {
    const p = gates([
      section("m1", "lesen", 0.8),
      section("m1", "hoeren", 0.6),
      section("m1", "lesen", 1), // الأحدث يغلب
    ]);
    const r = modellTotal(p, "m1");
    expect(r.points.lesen).toBe(25);
    expect(r.points.hoeren).toBe(15);
    expect(r.complete).toBe(false);
    const fullP = gates((["hoeren", "lesen", "schreiben", "sprechen"] as ExamSkill[]).map((sk) => section("m1", sk, 0.8)));
    const rf = modellTotal(fullP, "m1");
    expect(rf.total).toBe(80);
    expect(rf.complete).toBe(true);
    expect(rf.passed).toBe(true);
  });
});

describe("D284: مهايئ القراءة على المحتوى الحي", () => {
  const modell = ALL_MODELLTESTS.find((m) => m.id === "a1-modelltest-1")!;
  const lesen = modell.sections.find((s) => s.skill === "lesen")!;
  const quiz = modellLesenQuiz(modell.id, modell.passingScore, lesen.parts);

  it("15 بنداً صالحاً بمخطط QuizItem — وخياراتها محفوظة", () => {
    const items = quiz.quiz.variants[0]!.items;
    expect(items).toHaveLength(15);
    for (const it of items) expect(() => QuizItemSchema.parse(it)).not.toThrow();
    expect(items.every((it) => (it.choices?.length ?? 0) >= 2)).toBe(true);
    expect(quiz.quiz.variants[0]!.passingScore).toBe(0.6);
  });

  it("النص مضمَّن في السؤال — والدليل في why", () => {
    const items = quiz.quiz.variants[0]!.items;
    expect(items[0]!.q).toContain("📖");
    expect(items[0]!.q).toContain("Geburtstag");
    expect(items[0]!.q).toContain("Lena"); // نص الرسالة حاضر
    expect(items[0]!.why).toBeTruthy();
  });

  it("المحاولة تبدأ من 15 بنداً", () => {
    const a = startQuizAttempt(quiz, 0);
    expect(a.items).toHaveLength(15);
    expect(a.passingScore).toBe(0.6);
  });
});

describe("D285: السماح بالسماع", () => {
  it("المتبقي — بلا سالب", () => {
    expect(playsLeft(2, 0)).toBe(2);
    expect(playsLeft(2, 1)).toBe(1);
    expect(playsLeft(1, 1)).toBe(0);
    expect(playsLeft(1, 5)).toBe(0);
  });
});

describe("D285: مهايئ الاستماع على المحتوى الحي", () => {
  const modell = ALL_MODELLTESTS.find((m) => m.id === "a1-modelltest-1")!;
  const hoeren = modell.sections.find((s) => s.skill === "hoeren")!;
  const { quiz, tracks, plays } = modellHoerenQuiz(modell.id, modell.passingScore, hoeren.parts);
  const items = quiz.quiz.variants[0]!.items;

  it("15 بنداً صالحاً — والمسارات والسماح بمحاذاة الفهرس", () => {
    expect(items).toHaveLength(15);
    for (const it of items) expect(() => QuizItemSchema.parse(it)).not.toThrow();
    expect(tracks).toHaveLength(15);
    expect(plays).toHaveLength(15);
    expect(plays).toEqual([2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 2]); // الرسمي: 2/1/2
    expect(items[0]!.q).toContain("🔊");
  });

  it("كل مسار مذكور له مقطع ملتزم", () => {
    const refs = tracks.flat();
    expect(refs.length).toBeGreaterThan(15); // الحوارات متعددة الأسطر
    for (const r of refs) expect(clipUrl(r), r).toBeTruthy();
  });

  it("الغائب playCount = مرتان", () => {
    const { plays: p } = modellHoerenQuiz("m", 0.6, [{ items: [{ q: "q", a: "a" }] }]);
    expect(p).toEqual([2]);
  });
});
