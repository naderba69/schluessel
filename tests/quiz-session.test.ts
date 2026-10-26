// tests/quiz-session.test.ts — بوابة Quiz الدرس (D117): التصحيح · ترتيب القوانين (§14/F121) · الحدّ 75% · تبادل النسخ · المحتوى الحي
import { describe, it, expect } from "vitest";
import type { Lesson, OpenStation, QuizItem } from "../content/schemas/index.js";
import { OpenStation as OpenStationSchema, OpenSession, QuizAnswer as QuizAnswerSchema, QuizItem as QuizItemSchema } from "../content/schemas/index.js";
import {
  advanceQuiz, answerQuizItem, calibrationNoteAr, canRetryInSession, CLOSE_CREDIT, currentQuizItem, cyclicQuizLesson, gradeQuizAnswer,
  isComplete, judgeQuizItem, needsJudgment, outcomeHeadlineAr, predictScore, quizNormal, quizOutcome, restoreQuizAttempt,
  startQuizAttempt, variantFor, verdictNoteAr, type QuizAttempt,
} from "../src/lib/quiz-session.js";
import { STATIONS } from "../src/lib/lesson-engine.js";
import { displayOrder } from "../src/lib/practice-session.js";
import { hasBlame } from "../src/lib/warmth-engine.js";
import { loadAllLessons } from "../src/lesson-packs.js";
const ALL_LESSONS = await loadAllLessons();


const WHY = "مع ich فعل sein هو bin دائماً.";
const choice: QuizItem = { q: "Ich ___ aus Tunesien.", a: "bin", choices: ["bin", "bist", "ist"], why: WHY };
const open: QuizItem = { q: "رتّب: neu / bist / Du", a: "Du bist neu." };
const noun: QuizItem = { q: "«المال»؟", a: "das Geld" };
const street: QuizItem = { q: "«شارع»؟", a: "die Straße" };
const arabic: QuizItem = { q: "heißen = ?", a: "يُسمّى" };
const withAccept: QuizItem = { q: "ترجم: اسمي يوسف", a: "Ich heiße Yusuf.", accept: ["Mein Name ist Yusuf."] };

function lessonOf(items: QuizItem[][], passing = 0.75): Pick<Lesson, "id" | "quiz"> {
  const v = (its: QuizItem[]) => ({ items: its, passingScore: passing });
  return { id: "t-u1-d1", quiz: { variants: [v(items[0]!), v(items[1] ?? items[0]!), v(items[2] ?? items[0]!)] } };
}

/** يجيب البنود بالترتيب: سلسلة = إجابة · {judge} = إجابة ثم حكم */
function run(a: QuizAttempt, answers: (string | { given: string; claim: boolean })[]): QuizAttempt {
  let s = a;
  for (const x of answers) {
    s = answerQuizItem(s, typeof x === "string" ? x : x.given);
    if (typeof x !== "string") s = judgeQuizItem(s, x.claim);
    s = advanceQuiz(s);
  }
  return s;
}

describe("gradeQuizAnswer — مصحِّح عادل: لا يُسقط من أجاب صواباً ولا يمنح ما لم يُستحق", () => {
  it("الاختيار: الإجابة وحدها صحيحة", () => {
    expect(gradeQuizAnswer(choice, "bin").verdict).toBe("correct");
    expect(gradeQuizAnswer(choice, "bist").verdict).toBe("wrong");
    expect(gradeQuizAnswer(choice, "").verdict).toBe("wrong");
  });

  it("المفتوحة: الفراغات والترقيم الأخير وعلامات الاقتباس لا تُحسب أخطاء", () => {
    for (const g of ["Du bist neu.", "Du bist neu", "  Du   bist neu!  ", "«Du bist neu»", "Du bist neu?"])
      expect(gradeQuizAnswer(open, g).verdict, g).toBe("correct");
  });

  it("accept: صيغة صحيحة أخرى مُعلنة في المحتوى = صحيحة آلياً", () => {
    expect(gradeQuizAnswer(withAccept, "Mein Name ist Yusuf").verdict).toBe("correct");
    expect(gradeQuizAnswer(withAccept, "Ich heiße Yusuf").verdict).toBe("correct");
  });

  it("الحرف الكبير/الصغير فقط ← قريب (نصف درجة) لا صحيح ولا خطأ", () => {
    expect(gradeQuizAnswer(noun, "das geld")).toEqual({ verdict: "close", closeKind: "case" });
    expect(CLOSE_CREDIT).toBe(0.5);
  });

  it("ß/ä/ö/ü مكتوبة ss/ae/oe/ue ← قريب (spelling) — اللوحة بلا الأحرف لا تمحو المعرفة", () => {
    expect(gradeQuizAnswer(street, "die Strasse")).toEqual({ verdict: "close", closeKind: "spelling" });
    expect(gradeQuizAnswer({ q: "?", a: "Tschüss" }, "Tschuess")).toEqual({ verdict: "close", closeKind: "spelling" });
  });

  it("العربية: التشكيل وصور الهمزة والألف المقصورة والتاء المربوطة لا تُسقط الإجابة", () => {
    expect(gradeQuizAnswer(arabic, "يسمى").verdict).toBe("correct");
    expect(gradeQuizAnswer({ q: "Deutsch = ?", a: "اللغة الألمانية" }, "اللغه الالمانيه").verdict).toBe("correct");
    expect(quizNormal("بكم؟")).toBe("بكم");
  });

  it("مفتوحة مختلفة ← «احكم أنت» (لا خطأ آلي) · فارغة ← خطأ بلا حكم", () => {
    expect(gradeQuizAnswer(withAccept, "Ich bin Yusuf.").verdict).toBe("judge");
    expect(gradeQuizAnswer(open, "   ").verdict).toBe("wrong");
  });
});

describe("مسار المحاولة — ترتيب القوانين يُفرض بالرمي لا بالاتفاق", () => {
  const lesson = lessonOf([[choice, open, noun, withAccept]]);

  it("§14: لا إجابة قبل التوقّع · ولا توقّع بعد أول إجابة · والتوقّع عدد صحيح 0–100", () => {
    const a = startQuizAttempt(lesson, 0);
    expect(() => answerQuizItem(a, "bin")).toThrow(/التوقّع أولاً/);
    for (const bad of [-1, 101, 50.5, Number.NaN]) expect(() => predictScore(a, bad)).toThrow();
    const b = answerQuizItem(predictScore(a, 70), "bin");
    expect(() => predictScore(b, 80)).toThrow(/قبل أول إجابة/);
  });

  it("F121: لا «التالي» قبل الإجابة · الإجابة الأولى هي المحتسبة · لا تالي قبل الحكم", () => {
    const a = predictScore(startQuizAttempt(lesson, 0), 60);
    expect(() => advanceQuiz(a)).toThrow(/F121/);
    const b = answerQuizItem(a, "bist");
    expect(() => answerQuizItem(b, "bin")).toThrow(/الإجابة الأولى/);
    const c = answerQuizItem(advanceQuiz(b), "Bist du neu?");
    expect(needsJudgment(c)).toBe(true);
    expect(() => advanceQuiz(c)).toThrow(/احكم/);
    expect(() => judgeQuizItem(b, true)).toThrow(/لا بند ينتظر/);
  });

  it("النتيجة بعد آخر بند فقط — ثم: الدرجات والحالات والمراجعة محسوبة بدقة", () => {
    const a = predictScore(startQuizAttempt(lesson, 0), 90);
    expect(() => quizOutcome(a)).toThrow();
    const done = run(a, ["bin", { given: "Bist du neu?", claim: true }, "das geld", { given: "Ich bin Yusuf.", claim: false }]);
    expect(isComplete(done)).toBe(true);
    expect(currentQuizItem(done)).toBeNull();
    const o = quizOutcome(done);
    expect(o).toMatchObject({ total: 4, credit: 2.5, correct: 1, selfCorrect: 1, close: 1, selfWrong: 1, wrong: 0, predicted: 90 });
    expect(o.score).toBeCloseTo(0.625);
    expect(o.percent).toBe(63);
    expect(o.passed).toBe(false);
    expect(o.weakItems).toEqual([noun.q, withAccept.q]);
    expect(outcomeHeadlineAr(o)).toContain("منها 1 بحكمك");
  });

  it("الحدّ: 75% بالضبط ينجح · أقل منه لا (الدروس كلها 0.75)", () => {
    const four = lessonOf([[choice, choice, choice, choice]]);
    const pass = quizOutcome(run(predictScore(startQuizAttempt(four, 0), 50), ["bin", "bin", "bin", "ist"]));
    expect(pass.score).toBe(0.75);
    expect(pass.passed).toBe(true);
    const six = lessonOf([[choice, choice, choice, choice, choice, choice]]);
    const fail = quizOutcome(run(predictScore(startQuizAttempt(six, 0), 50), ["bin", "bin", "bin", "bin", "ist", "ist"]));
    expect(fail.percent).toBe(67);
    expect(fail.passed).toBe(false);
  });

  it("قانون 21: النسخ تتبادل بعدد المحاولات السابقة · ولا تتكرر نسخة داخل الحصة الواحدة", () => {
    expect([0, 1, 2, 3, 4, 5].map((n) => variantFor(n, 3))).toEqual([0, 1, 2, 0, 1, 2]);
    const three = lessonOf([[choice, choice, choice], [open, open, open], [noun, noun, noun]]);
    expect(startQuizAttempt(three, 4).variantIndex).toBe(1);
    expect(startQuizAttempt(three, 4).items[0]).toBe(open);
    expect(() => startQuizAttempt(three, -1)).toThrow();
    expect([0, 1, 2, 3].map((n) => canRetryInSession(n, 3))).toEqual([true, true, true, false]);
  });
});

describe("نصوص الواجهة — بلا لوم (D23) ومعايرة صادقة (§14)", () => {
  it("المعايرة: دقيق / أعلى / أقل — والنصوص بلا لوم", () => {
    expect(calibrationNoteAr(70, 75)).toContain("دقيق");
    expect(calibrationNoteAr(90, 50)).toContain("أعلى من الأداء");
    expect(calibrationNoteAr(30, 80)).toContain("أفضل مما تظن");
    expect(calibrationNoteAr(null, 80)).toBe("");
    for (const t of [calibrationNoteAr(90, 50), calibrationNoteAr(70, 75), calibrationNoteAr(30, 80)]) expect(hasBlame(t)).toBe(false);
  });

  it("ملاحظة كل حكم بلا لوم — والإجابة تُذكر بعد المحاولة", () => {
    const notes = (["correct", "wrong", "judge", "self-correct", "self-wrong"] as const).map((verdict) =>
      verdictNoteAr(noun, { given: "x", verdict }),
    );
    notes.push(verdictNoteAr(noun, { given: "das geld", verdict: "close", closeKind: "case" }));
    for (const n of notes) expect(hasBlame(n), n).toBe(false);
    expect(notes[1]).toContain("das Geld");
  });
});

describe("المحتوى الحي — كل بند Quiz في كل درس منشور قابل للتصحيح (D117)", () => {
  const items = ALL_LESSONS.flatMap((l) => l.quiz.variants.flatMap((v, vi) => v.items.map((it) => ({ l: l.id, vi, it }))));

  it("كل البنود بشكل QuizItem (المخطط صار يفرضه — كان الحارس على المُرقّى فقط)", () => {
    expect(items.length).toBeGreaterThan(900);
    for (const { l, it } of items) expect(QuizItemSchema.safeParse(it).success, `${l}: ${it.q}`).toBe(true);
  });

  it("إجابة النموذج تنال الدرجة الكاملة آلياً في كل بند (بند لا يُجاب صواباً = بوابة ظالمة)", () => {
    const bad = items.filter(({ it }) => gradeQuizAnswer(it, it.a).verdict !== "correct");
    expect(bad.map(({ l, it }) => `${l}: ${it.q}`)).toEqual([]);
  });

  it("الحدّ 75% في كل نسخة من كل درس", () => {
    for (const l of ALL_LESSONS) for (const v of l.quiz.variants) expect(v.passingScore, l.id).toBe(0.75);
  });

  it("خلط الخيارات عند العرض: تبديل حتمي — والإجابة لا تبقى في الموضع الأول (كانت فيه 18/18 في a1-u1-d1)", () => {
    const withChoices = items.filter(({ it }) => it.choices);
    const firstPos = withChoices.filter(({ l, vi, it }) => displayOrder(it.choices!, `${l}|${vi}|${it.q}`)[0] === it.a).length;
    expect(withChoices.length).toBeGreaterThan(40);
    expect(firstPos / withChoices.length).toBeLessThan(0.6);
    const c = ["a", "b", "c", "d"];
    expect(displayOrder(c, "seed")).toEqual(displayOrder(c, "seed"));
    expect([...displayOrder(c, "seed")].sort()).toEqual(c);
    expect(new Set(["s1", "s2", "s3", "s4", "s5", "s6"].map((s) => displayOrder(c, s).join(""))).size).toBeGreaterThan(1);
  });
});

describe("N-006 (D228) — استعادة المحاولة من اللقطة", () => {
  const lesson = lessonOf([[choice, open, noun, street], [arabic, withAccept, noun, choice]]);

  it("استعادة تامة: النسخة والتوقّع والإجابات والمؤشر", () => {
    const live = run(predictScore(startQuizAttempt(lesson, 0), 80), ["bin", { given: "xxx", claim: true }]);
    const restored = restoreQuizAttempt(lesson, {
      variantIndex: live.variantIndex,
      predicted: live.predicted,
      answers: [...live.answers],
      cursor: live.cursor,
    });
    expect(restored.variantIndex).toBe(live.variantIndex);
    expect(restored.predicted).toBe(80);
    expect(restored.answers).toEqual(live.answers);
    expect(restored.cursor).toBe(live.cursor);
    expect(restored.items).toEqual(lesson.quiz.variants[live.variantIndex]!.items);
  });

  it("fail-safe: نسخة خارج النطاق بعد تغيير المحتوى ← محاولة جديدة لا عطل", () => {
    const restored = restoreQuizAttempt(lesson, { variantIndex: 99, predicted: 70, answers: [], cursor: 5 });
    expect(restored.variantIndex).toBe(0);
    expect(restored.cursor).toBe(0);
    expect(restored.answers).toEqual([]);
  });

  it("fail-safe: مؤشر وإجابات تتجاوز البنود الجديدة ← تقليم صامت", () => {
    const short = lessonOf([[choice]]);
    const restored = restoreQuizAttempt(short, {
      variantIndex: 0,
      predicted: null,
      answers: [
        { given: "bin", verdict: "correct" },
        { given: "x", verdict: "wrong" },
        { given: "y", verdict: "wrong" },
      ],
      cursor: 5,
    });
    expect(restored.cursor).toBe(1);
    expect(restored.answers).toHaveLength(1);
  });
});

describe("N-006 (D228) — المخطط: محطات الاستئناف مرآة STATIONS + إجابة الـQuiz مميَّزة", () => {
  it("OpenStation يطابق STATIONS حرفياً وبالترتيب", () => {
    expect(OpenStationSchema.options).toEqual([...STATIONS]);
    const st: OpenStation = "close";
    expect(st).toBe("close");
  });

  it("QuizAnswer: close بلا نوع تُرفض · وغير-close بنوع تُرفض · والصحيح يُقبل", () => {
    expect(QuizAnswerSchema.safeParse({ given: "x", verdict: "close", closeKind: "case" }).success).toBe(true);
    expect(QuizAnswerSchema.safeParse({ given: "x", verdict: "close" }).success).toBe(false);
    expect(QuizAnswerSchema.safeParse({ given: "x", verdict: "correct", closeKind: "case" }).success).toBe(false);
    expect(QuizAnswerSchema.safeParse({ given: "x", verdict: "self-correct" }).success).toBe(true);
  });

  it("OpenSession كاملة تُقبل · ومحطة غريبة تُرفض", () => {
    const good = {
      lessonId: "a1-u1-d1",
      station: "practice",
      done: ["recall", "learn"],
      pos: { recall: 3, learn: { index: 9, ruleIndex: 0 }, practice: { station: 1, item: 2 } },
      quiz: { variantIndex: 1, predicted: 80, answers: [{ given: "bin", verdict: "correct" }], cursor: 1 },
    };
    expect(OpenSession.safeParse(good).success).toBe(true);
    expect(OpenSession.safeParse({ ...good, station: "nope" }).success).toBe(false);
  });
});

describe("D283: مهايئ الدوري على المحطة", () => {
  const test = {
    id: "a1-kurztest-w2",
    passingScore: 0.75,
    items: [
      { q: "«مرحباً»؟", a: "hallo" },
      { q: "«شكراً»؟", a: "danke" },
      { q: "«من فضلك»؟", a: "bitte" },
    ],
  };

  it("نسخة واحدة صالحة بمخطط QuizItem — وسلايدر 0..100", () => {
    const lesson = cyclicQuizLesson(test);
    expect(lesson.id).toBe("a1-kurztest-w2");
    expect(lesson.quiz.variants).toHaveLength(1);
    const v = lesson.quiz.variants[0]!;
    expect(v.passingScore).toBe(0.75);
    for (const it of v.items) expect(() => QuizItemSchema.parse(it)).not.toThrow();
    expect([lesson.slider.min, lesson.slider.max]).toEqual([0, 100]);
  });

  it("المحاولة تبدأ من النسخة الوحيدة دائماً", () => {
    const lesson = cyclicQuizLesson(test);
    const a = startQuizAttempt(lesson, 5);
    expect(a.variantIndex).toBe(0);
    expect(a.items).toHaveLength(3);
    expect(a.passingScore).toBe(0.75);
  });
});
