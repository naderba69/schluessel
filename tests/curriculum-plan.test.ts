// tests/curriculum-plan.test.ts — خطة تكملة Start Deutsch 1 (D112): كل كلمة رسمية غير مُعلَّمة ← درس بعينه
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { CurriculumPlan, LearnerProgress, UNIT_MAX, plannedHeadwords, type Word } from "../content/schemas/index.js";
import { loadLessons, loadWordlists, loadWords } from "../tools/lib/content-disk.js";
import { checkPlan, planStatus, type PlanLessonLike } from "../tools/lib/curriculum-plan.js";
import { coveredHeadwords, indexWordlists } from "../tools/lib/goethe-lists.js";
import { auditGoethe } from "../tools/goethe-audit.js";
import { loadPlans } from "../tools/plan-status.js";
import { ALL_LESSONS, LESSON_ORDER } from "../src/lesson-packs.js";

const CONTENT = join(__dirname, "..", "content");
const words = loadWords(CONTENT);
const lessons = loadLessons(CONTENT);
const lists = loadWordlists(CONTENT);
const plans = loadPlans(CONTENT);
const plan = plans.find((p) => p.id === "a1-sd1-supplement")!;
const sd1 = lists.find((l) => l.id === "goethe-a1-sd1")!;
const ctx = { words, lessons, lists };

/** كلمة اصطناعية بشكل Word الكامل (نسخة من كلمة حقيقية) — لاختبار e-plan-taught بدليل حقيقي من الفهرس */
const base = words.find((w) => w.id === "gestern")!;
function syn(de: string, wordClass: Word["wordClass"], article?: string): Word {
  const w = structuredClone(base);
  return { ...w, id: `syn-${de.replace(/\W+/g, "-").toLowerCase()}`, de, wordClass, article, chunk: false, plural: undefined, goetheList: [] };
}
const lessonLike = (id: string, unit: number, day: number, kind: "content" | "integration", wordIds: string[]): PlanLessonLike =>
  ({ id, level: "A1", unit, day, kind, praesentation: { wordIds } });

describe("D112 — الخطة الحقيقية: الكل مخطط، مرة واحدة، في مكانه", () => {
  it("خطة واحدة: 4 وحدات (13–16) × 5 دروس محتوى + توليف · 276 كلمة رئيسية · 12–14 للدرس · الامتحان في 17", () => {
    expect(plans.map((p) => p.id)).toEqual(["a1-sd1-supplement"]);
    expect(plan.units.map((u) => u.unit)).toEqual([13, 14, 15, 16]);
    for (const u of plan.units) {
      expect(u.contentLessons.map((l) => l.lessonId)).toEqual([1, 2, 3, 4, 5].map((d) => `a1-u${u.unit}-d${d}`));
      expect(u.integrationLessonId).toBe(`a1-u${u.unit}-d6`);
      for (const l of u.contentLessons) expect(l.headwords.length).toBeGreaterThanOrEqual(12), expect(l.headwords.length).toBeLessThanOrEqual(14);
    }
    expect(plannedHeadwords(plan).size).toBe(276);
    expect(plan.placement).toEqual({ afterUnit: 12, examWeekUnit: 17 });
  });

  it("UNIT_MAX (حدّ كل المخططات) = وحدة أسبوع الامتحان في الخطة — لا ينحرفان", () => {
    expect(UNIT_MAX).toBe(plan.placement.examWeekUnit);
  });

  it("المدقِّق: صفر مشكلة على المحتوى الحقيقي (اكتمال · نصوص حرفية · دروس منتَجة تعلّم كلماتها · أسبوع الامتحان)", () => {
    expect(checkPlan(plan, ctx)).toEqual([]);
  });

  it("الاكتمال حرفياً: الكلمات المخططة = كل ما لم يعلّمه المنهج من SD1 (276 نصاً — «an sein»/«auf sein» المطبوعتان مرتين مرة واحدة)", () => {
    const { uncovered } = auditGoethe(words, [sd1]);
    const notTaught = new Set(uncovered.get(sd1.id)!.map((e) => e.headword));
    const taughtNow = coveredHeadwords(words, indexWordlists([sd1])[0]!);
    const planned = plannedHeadwords(plan);
    // كل غير مُعلَّم مخطط، وكل مخطط إما غير مُعلَّم بعد أو علّمه درسه المخطط (المدقِّق يفرض الثانية)
    for (const h of notTaught) expect(planned.has(h), h).toBe(true);
    for (const h of planned.keys()) expect(notTaught.has(h) || taughtNow.has(h), h).toBe(true);
    expect(uncovered.get(sd1.id)!.filter((e) => e.headword === "an sein")).toHaveLength(2);
  });

  it("أسبوع الامتحان صار الوحدة 17: ستة دروس توليف هي آخر A1 في المسار — قبل A2 مباشرة", () => {
    const a1 = ALL_LESSONS.filter((l) => l.level === "A1");
    const exam = a1.filter((l) => l.unit === 17);
    expect(exam.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6].map((d) => `a1-u17-d${d}`));
    for (const l of exam) expect(l.kind).toBe("integration");
    expect(a1[a1.length - 1]!.id).toBe("a1-u17-d6");
    expect(LESSON_ORDER[LESSON_ORDER.indexOf("a1-u17-d6") + 1]).toBe("a2-u1-d1");
    expect(a1.some((l) => l.unit >= 13 && l.unit <= 16)).toBe(planStatus(plan, ctx).some((s) => s.produced));
  });

  it("عيب كامن أُصلح: حالة المتعلم تقبل الوحدات حتى 17 (كانت max(12) — أسبوع الامتحان 13 نفسه لم يكن ممثَّلاً)", () => {
    const st = { schemaVersion: "1.0.0", currentUnit: { level: "A1", unit: 17 } };
    expect(LearnerProgress.safeParse(st).success).toBe(true);
    expect(LearnerProgress.safeParse({ ...st, currentUnit: { level: "A1", unit: 18 } }).success).toBe(false);
  });

  it("planStatus: الدرس التالي a1-u13-d1 «Jetzt, heute, später» بكلماته الـ14", () => {
    const next = planStatus(plan, ctx).find((s) => !s.produced)!;
    expect(next.lessonId).toBe("a1-u13-d1");
    expect(next.headwords).toEqual(["heute", "jetzt", "gleich", "später", "früher", "der Moment", "lange", "ab", "zurzeit", "eilig", "fertig", "nächst-", "der Anfang", "das Ende"]);
  });
});

describe("D112 — المخطط يرفض البنية الخاطئة", () => {
  const raw = () => structuredClone(plan) as unknown as { units: { unit: number; contentLessons: { lessonId: string; headwords: string[] }[]; integrationLessonId: string }[]; placement: { examWeekUnit: number } };
  const fails = (mut: (p: ReturnType<typeof raw>) => void, re: RegExp) => {
    const p = raw();
    mut(p);
    const r = CurriculumPlan.safeParse(p);
    expect(r.success).toBe(false);
    expect(r.error!.issues.map((i) => i.message).join(" | ")).toMatch(re);
  };
  it("معرّف درس · تتابع الوحدات · درس التوليف · أسبوع الامتحان · الحجم · التكرار", () => {
    fails((p) => { p.units[0]!.contentLessons[1]!.lessonId = "a1-u13-d9"; }, /a1-u13-d2/);
    fails((p) => { p.units[1]!.unit = 15; }, /متتابعة/);
    fails((p) => { p.units[0]!.integrationLessonId = "a1-u13-d7"; }, /التوليف/);
    fails((p) => { p.placement.examWeekUnit = 13; }, /أسبوع الامتحان/);
    fails((p) => { p.units[0]!.contentLessons[0]!.headwords.splice(0, 5); }, /خارج 12–14/);
    fails((p) => { p.units[3]!.contentLessons[4]!.headwords[0] = "heute"; }, /مرتين/);
  });
});

describe("D112 — المدقِّق: كل قاعدة تُطلق في حالتها", () => {
  const codes = (issues: { code: string }[]) => [...new Set(issues.map((i) => i.code))].sort();

  it("e-plan-source · e-plan-headword · e-plan-complete", () => {
    expect(codes(checkPlan({ ...plan, sourceList: "goethe-xx" }, ctx))).toEqual(["e-plan-source"]);
    const typo = structuredClone(plan);
    typo.units[0]!.contentLessons[0]!.headwords[0] = "heute!";
    const issues = checkPlan(typo, ctx);
    expect(codes(issues)).toEqual(["e-plan-complete", "e-plan-headword"]); // النص الخاطئ ليس كلمة رئيسية · و«heute» لم تعد مخططة
    expect(issues.find((i) => i.code === "e-plan-complete")!.message).toMatch(/heute/);
  });

  it("e-plan-taught: الدرس المنتَج يعلّم 13 من 14 ⇒ خطأ واحد للناقصة بالضبط (دليل حقيقي من الفهرس)", () => {
    const taught = [
      syn("heute", "adverb"), syn("jetzt", "adverb"), syn("gleich", "adverb"), syn("später", "adverb"), syn("früher", "adverb"),
      syn("der Moment", "noun", "der"), syn("lange", "adverb"), syn("ab", "preposition"), syn("zurzeit", "adverb"),
      syn("eilig", "adjective"), syn("fertig", "adjective"), syn("nächste", "adjective"), syn("der Anfang", "noun", "der"),
    ];
    const lesson = lessonLike("a1-u13-d1", 13, 1, "content", taught.map((w) => w.id));
    const issues = checkPlan(plan, { words: [...words, ...taught], lessons: [...lessons, lesson], lists });
    expect(issues.map((i) => `${i.code} ${i.message.match(/«(.+?)»/)?.[1]}`)).toEqual(["e-plan-taught das Ende"]);
  });

  it("w-plan-elsewhere: كلمة مخططة علّمها درس آخر — تحذير لا خطأ", () => {
    const heute = syn("heute", "adverb");
    const lesson = lessonLike("a1-u13-d1", 13, 1, "content", ["gestern"]);
    const issues = checkPlan(plan, { words: [...words, heute], lessons: [...lessons, lesson], lists });
    const elsewhere = issues.filter((i) => i.code === "w-plan-elsewhere");
    expect(elsewhere).toHaveLength(1);
    expect(elsewhere[0]!.level).toBe("warning");
    expect(elsewhere[0]!.message).toMatch(/«heute»/);
    expect(issues.filter((i) => i.code === "e-plan-taught")).toHaveLength(13);
  });

  it("e-plan-kind · e-plan-unplanned · e-plan-exam-week", () => {
    const run = (extra: PlanLessonLike[], drop: (l: PlanLessonLike) => boolean = () => false) =>
      codes(checkPlan(plan, { words, lessons: [...lessons.filter((l) => !drop(l)), ...extra], lists }));
    expect(run([lessonLike("a1-u13-d6", 13, 6, "content", ["gestern"])])).toEqual(["e-plan-kind"]);
    expect(run([lessonLike("a1-u14-d7", 14, 7, "content", ["gestern"])])).toEqual(["e-plan-unplanned"]);
    expect(run([lessonLike("a1-u18-d1", 18, 1, "integration", ["gestern"])])).toEqual(["e-plan-exam-week"]);
    expect(run([lessonLike("a1-u17-d7", 17, 7, "content", ["gestern"])])).toEqual(["e-plan-exam-week"]);
    expect(run([], (l) => l.unit === 17)).toEqual(["e-plan-exam-week"]);
  });
});
