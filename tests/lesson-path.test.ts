// tests/lesson-path.test.ts — مسار الدروس (D117): الدرس الحالي · الفتح بالنجاح وحده · قفل المسار · المصالحة · المسار المنشور كله
import { describe, it, expect } from "vitest";
import { createEmptyCard } from "ts-fsrs";
import { LearnerState as LearnerStateSchema, type LearnerState } from "../content/schemas/index.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { lessonStatus } from "../src/lib/routes.js";
import {
  battleAttempts, currentLessonId, deferredDue, deferredUnits, delayedAttempts, lessonAfter, openSessionFor, passedUnitBattle,
  quizAttempts, reconcileProgress, reconcileState, recordDelayedBattle, recordQuizAttempt, setOpenSession, unitKeyOf,
  type PathLesson,
} from "../src/lib/lesson-path.js";
import {
  advanceQuiz, answerQuizItem, predictScore, quizOutcome, startQuizAttempt, type QuizOutcome,
} from "../src/lib/quiz-session.js";
import { planLessonStations } from "../src/lib/lesson-runner.js";
import { LESSON_ORDER, loadAllGrammarRules, loadAllLessons, runtimeWordsForLesson } from "../src/lesson-packs.js";
const ALL_GRAMMAR_RULES = await loadAllGrammarRules();
const ALL_LESSONS = await loadAllLessons();


const PATH: PathLesson[] = [
  { id: "a1-u1-d1", level: "A1", unit: 1 },
  { id: "a1-u1-d2", level: "A1", unit: 1 },
  { id: "a1-u2-d1", level: "A1", unit: 2 },
  { id: "a2-u1-d1", level: "A2", unit: 1 },
];
const DAY = "2026-10-14";
const fresh = (): LearnerState => reconcileState(createInitialState("يوسف", new Date(DAY)), PATH);

function outcome(lessonId: string, score: number, extra: Partial<QuizOutcome> = {}): QuizOutcome {
  return {
    lessonId, variantIndex: 0, total: 4, credit: score * 4, score, percent: Math.round(score * 100),
    passed: score >= 0.75, passingScore: 0.75, correct: 0, close: 0, wrong: 0, selfCorrect: 0, selfWrong: 0,
    predicted: 70, weakItems: score < 1 ? ["«المال»؟"] : [], ...extra,
  };
}

describe("الدرس الحالي والمصالحة", () => {
  it("أول تشغيل: a1-u1-d1 وحده متاح · الباقي مقفل", () => {
    const s = fresh();
    expect(currentLessonId(s.progress, PATH)).toBe("a1-u1-d1");
    expect(PATH.map((l) => lessonStatus(l.id, s.progress))).toEqual(["available", "locked", "locked", "locked"]);
  });

  it("المصالحة تُسقط معرّفاً اختفى من المحتوى (نقل وحدة) وتصحّح الوحدة الحالية — والتاريخ لا يُمحى", () => {
    const s = fresh();
    const stale = { ...s.progress, completedLessons: ["a1-u1-d1", "a1-u17-d1"], availableLessons: ["a1-u17-d2"] };
    const r = reconcileProgress(stale, PATH);
    expect(r.availableLessons).toEqual(["a1-u1-d2"]);
    expect(r.completedLessons).toEqual(["a1-u1-d1", "a1-u17-d1"]);
    expect(r.currentUnit).toEqual({ level: "A1", unit: 1 });
  });

  it("lessonAfter: التالي في الترتيب · null بعد الأخير أو لمعرّف مجهول", () => {
    expect(lessonAfter("a1-u1-d2", PATH)).toBe("a1-u2-d1");
    expect(lessonAfter("a2-u1-d1", PATH)).toBeNull();
    expect(lessonAfter("zz", PATH)).toBeNull();
  });
});

describe("recordQuizAttempt — الفتح بالنجاح وحده (≥75%)", () => {
  it("النجاح: يكتمل الدرس · يُفتح التالي · نتيجة البوابة + سطر المعايرة · والحالة صالحة بالمخطط", () => {
    const s = recordQuizAttempt(fresh(), outcome("a1-u1-d1", 1, { selfCorrect: 1 }), PATH, DAY);
    expect(s.progress.completedLessons).toEqual(["a1-u1-d1"]);
    expect(s.progress.availableLessons).toEqual(["a1-u1-d2"]);
    expect(s.progress.gateResults).toEqual([
      { gateId: "a1-u1-d1", kind: "lesson-quiz", score: 1, passed: true, attempts: 1, weakSections: [], selfJudged: 1, date: DAY },
    ]);
    expect(s.profile.calibration).toEqual([{ date: DAY, predicted: 70, actual: 100, lessonId: "a1-u1-d1" }]);
    expect(() => LearnerStateSchema.parse(s)).not.toThrow();
  });

  it("«ليس بعد»: لا إكمال ولا فتح · تُعدّ المحاولة (فتتغير النسخة التالية) · والنقاط الضعيفة تُسجَّل", () => {
    const s1 = recordQuizAttempt(fresh(), outcome("a1-u1-d1", 0.5), PATH, DAY);
    expect(s1.progress.completedLessons).toEqual([]);
    expect(s1.progress.availableLessons).toEqual(["a1-u1-d1"]);
    expect(quizAttempts(s1.progress, "a1-u1-d1")).toBe(1);
    expect(s1.progress.gateResults[0]).toMatchObject({ passed: false, attempts: 1, weakSections: ["«المال»؟"] });
    expect(s1.progress.gateResults[0]).not.toHaveProperty("selfJudged");
    const s2 = recordQuizAttempt(s1, outcome("a1-u1-d1", 0.75), PATH, DAY);
    expect(s2.progress.gateResults[1]).toMatchObject({ passed: true, attempts: 2 });
    expect(currentLessonId(s2.progress, PATH)).toBe("a1-u1-d2");
  });

  it("قفل المسار: محاولة لدرس قادم (قفز) أو مكتمل (ارتجاع) تُرمى — ولا يتغير شيء", () => {
    const s = recordQuizAttempt(fresh(), outcome("a1-u1-d1", 1), PATH, DAY);
    expect(() => recordQuizAttempt(s, outcome("a1-u2-d1", 1), PATH, DAY)).toThrow(/قفل المسار/);
    expect(() => recordQuizAttempt(s, outcome("a1-u1-d1", 1), PATH, DAY)).toThrow(/قفل المسار/);
    expect(s.progress.completedLessons).toEqual(["a1-u1-d1"]);
  });

  it("عبور المستوى: بعد آخر درس A1 تصير الوحدة الحالية A2/1 · وبعد الأخير لا متاح", () => {
    let s = fresh();
    for (const id of ["a1-u1-d1", "a1-u1-d2", "a1-u2-d1"]) s = recordQuizAttempt(s, outcome(id, 1), PATH, DAY);
    expect(s.progress.currentUnit).toEqual({ level: "A2", unit: 1 });
    s = recordQuizAttempt(s, outcome("a2-u1-d1", 1), PATH, DAY);
    expect(currentLessonId(s.progress, PATH)).toBeNull();
    expect(s.progress.availableLessons).toEqual([]);
    expect(() => recordQuizAttempt(s, outcome("a2-u1-d1", 1), PATH, DAY)).toThrow(/اكتمل المسار/);
  });
});

describe("المسار المنشور كله — من a1-u1-d1 إلى آخر درس عبر الواجهة الخالصة نفسها", () => {
  it(`كل درس يُبنى للحصة، وQuiz كل درس يُجتاز بإجابات النموذج، فيُفتح الذي يليه — حتى آخر درس (${ALL_LESSONS.length})`, async () => {
    let s = reconcileState(createInitialState("يوسف", new Date(DAY)), ALL_LESSONS);
    const visited: string[] = [];
    for (let guard = 0; guard < ALL_LESSONS.length + 1; guard++) {
      const id = currentLessonId(s.progress, ALL_LESSONS);
      if (!id) break;
      const lesson = ALL_LESSONS.find((l) => l.id === id)!;
      const plan = planLessonStations(lesson, await runtimeWordsForLesson(lesson), ALL_GRAMMAR_RULES);
      expect(plan.lessonId).toBe(id);
      let a = predictScore(startQuizAttempt(lesson, quizAttempts(s.progress, id)), 80);
      for (const it of a.items) a = advanceQuiz(answerQuizItem(a, it.a));
      const o = quizOutcome(a);
      expect(o.percent, id).toBe(100);
      s = recordQuizAttempt(s, o, ALL_LESSONS, DAY);
      visited.push(id);
    }
    expect(visited).toEqual(LESSON_ORDER);
    expect(currentLessonId(s.progress, ALL_LESSONS)).toBeNull();
    expect(() => LearnerStateSchema.parse(s)).not.toThrow();
  });
});

describe("N-005 (D227) — دورة ربط SRS: الحزمة تدخل المراجعة عند النجاح وحده", () => {
  it("النجاح يُسجّل كلمات الحزمة بطاقات New مستحقة الآن (L0 · مصنع FSRS نفسه)", () => {
    const s = recordQuizAttempt(fresh(), outcome("a1-u1-d1", 1), PATH, DAY, ["hund", "katze"]);
    expect(s.srsCards.map((c) => [c.cardId, c.state, c.due, c.masteryLevel])).toEqual([
      ["hund", "New", new Date(DAY).toISOString(), "L0"],
      ["katze", "New", new Date(DAY).toISOString(), "L0"],
    ]);
    const factory = createEmptyCard(new Date(DAY)); // القيم الافتراضية من المكتبة لا من يدي
    expect([s.srsCards[0]!.stability, s.srsCards[0]!.difficulty, s.srsCards[0]!.reps]).toEqual([factory.stability, factory.difficulty, factory.reps]);
    expect(() => LearnerStateSchema.parse(s)).not.toThrow();
  });
  it("الرسوب لا يُسجّل شيئاً · والمسجَّلة لا تتكرر", () => {
    const s1 = recordQuizAttempt(fresh(), outcome("a1-u1-d1", 0.5), PATH, DAY, ["hund"]);
    expect(s1.srsCards).toEqual([]);
    const s2 = recordQuizAttempt(s1, outcome("a1-u1-d1", 0.8), PATH, DAY, ["hund", "hund", "katze"]);
    expect(s2.srsCards.map((c) => c.cardId)).toEqual(["hund", "katze"]);
  });
});

describe("N-006 (D228) — الحصة المفتوحة: حفظ/مطابقة/مسح بالنحاح", () => {
  const OPEN = { lessonId: "a1-u1-d1", station: "practice" as const, done: ["recall" as const], pos: { recall: 3 }, quiz: undefined };

  it("setOpenSession تحفظ اللقطة · وopenSessionFor يطابق الدرس وحده", () => {
    const p = setOpenSession(fresh().progress, OPEN);
    expect(p.openSession).toMatchObject({ lessonId: "a1-u1-d1", station: "practice" });
    expect(openSessionFor(p, "a1-u1-d1")).toBeDefined();
    expect(openSessionFor(p, "a1-u1-d2")).toBeUndefined();
  });

  it("النجاح يمسح الحصة المفتوحة · و«ليس بعد» يُبقيها للاستئناف", () => {
    const withOpen = { ...fresh(), progress: setOpenSession(fresh().progress, OPEN) };
    const passed = recordQuizAttempt(withOpen, outcome("a1-u1-d1", 1), PATH, DAY);
    expect(passed.progress.openSession).toBeUndefined();
    const failed = recordQuizAttempt(withOpen, outcome("a1-u1-d1", 0.5), PATH, DAY);
    expect(failed.progress.openSession).toMatchObject({ lessonId: "a1-u1-d1" });
  });
});

describe("D277: معركة الوحدة", () => {
  it("unitKey حاضر ← kind=unit-battle وبوابة الوحدة وعدّاد مستقل", () => {
    let s = fresh();
    s = recordQuizAttempt(s, outcome("a1-u1-d1", 0.5), PATH, DAY, [], "A1-u1");
    s = recordQuizAttempt(s, outcome("a1-u1-d1", 0.5), PATH, DAY, [], "A1-u1");
    const battles = s.progress.gateResults.filter((g) => g.kind === "unit-battle");
    expect(battles.map((g) => [g.gateId, g.attempts])).toEqual([["A1-u1", 1], ["A1-u1", 2]]);
    expect(battleAttempts(s.progress, "A1-u1")).toBe(2);
    expect(quizAttempts(s.progress, "a1-u1-d1")).toBe(0); // عدّاد الاختبار لم يُمسّ
  });

  it("المعركة الناجحة تُكمل الدرس وتفتح التالي (المسار كما هو)", () => {
    const s = recordQuizAttempt(fresh(), outcome("a1-u1-d1", 0.8), PATH, DAY, [], "A1-u1");
    expect(s.progress.completedLessons).toContain("a1-u1-d1");
    expect(currentLessonId(s.progress, PATH)).toBe("a1-u1-d2");
    expect(passedUnitBattle(s.progress, "A1-u1")).toBe(true);
    expect(passedUnitBattle(s.progress, "A1-u2")).toBe(false);
  });

  it("unitKeyOf: «A1-u1»", () => {
    expect(unitKeyOf("A1", 1)).toBe("A1-u1");
  });
});

describe("D277: المعركة المؤجلة", () => {
  it("بلا قفل ولا إكمال — والمعايرة تُحفَظ وtransferShare غائب", () => {
    const s = recordDelayedBattle(fresh(), "A1-u9", outcome("a1-u9-d6", 0.8), "2026-10-19");
    const g = s.progress.gateResults.find((x) => x.kind === "delayed-battle")!;
    expect(g.gateId).toBe("A1-u9");
    expect(g.attempts).toBe(1);
    expect("transferShare" in g).toBe(false); // الصدق: لا سياقات تحويل بعدُ (N-158)
    expect(s.progress.completedLessons).toEqual([]);
    expect(currentLessonId(s.progress, PATH)).toBe("a1-u1-d1");
    expect(s.profile.calibration.at(-1)).toMatchObject({ predicted: 70, actual: 80 });
    expect(delayedAttempts(s.progress, "A1-u9")).toBe(1);
  });

  it("توقّع فارغ ← بلا سطر معايرة", () => {
    const s = recordDelayedBattle(fresh(), "A1-u9", outcome("a1-u9-d6", 0.8, { predicted: null }), "2026-10-19");
    expect(s.profile.calibration).toEqual([]);
  });

  it("deferredUnits: المجتازة بلا مؤجلة وحدها", () => {
    let s = fresh();
    s = recordQuizAttempt(s, outcome("a1-u1-d1", 0.8), PATH, DAY, [], "A1-u1");
    s = recordQuizAttempt(s, outcome("a1-u1-d2", 0.5), PATH, DAY, [], "A1-u1"); // رسوب لاحق لا يمحو الاجتياز
    expect(deferredUnits(s.progress)).toEqual(["A1-u1"]);
    s = recordDelayedBattle(s, "A1-u1", outcome("a1-u1-d6", 0.8), "2026-10-19");
    expect(deferredUnits(s.progress)).toEqual([]);
  });

  it("deferredDue: الاثنين وحده + شرط الاجتياز", () => {
    let s = fresh();
    s = recordQuizAttempt(s, outcome("a1-u1-d1", 0.8), PATH, DAY, [], "A1-u1");
    expect(deferredDue(s.progress, "A1-u1", "2026-10-19")).toBe(true); // اثنين
    expect(deferredDue(s.progress, "A1-u1", "2026-10-18")).toBe(false); // أحد
    expect(deferredDue(s.progress, "A1-u1", "2026-10-21")).toBe(false); // أربعاء
    expect(deferredDue(s.progress, "A1-u2", "2026-10-19")).toBe(false); // بلا اجتياز
    expect(deferredDue(s.progress, "A1-u1", "not-a-date")).toBe(false);
  });
});
