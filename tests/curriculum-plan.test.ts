// tests/curriculum-plan.test.ts — خطة Start Deutsch 1 (D112 → D113: الخيار ج)
// النواة (123) مبكراً داخل دروس 1–12 · الباقي (153) للفهم في الوحدتين 13–14 · أسبوع الامتحان 15
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { CurriculumPlan, LearnerProgress, UNIT_MAX, plannedHeadwords, type Word } from "../content/schemas/index.js";
import { loadLessons, loadWordlists, loadWords } from "../tools/lib/content-disk.js";
import { CORE_LOAD_MAX, checkPlan, coreStatus, planStatus, proseStrings, textFixToken, wholeWordRegex, type PlanLessonLike } from "../tools/lib/curriculum-plan.js";
import { coveredHeadwords, indexWordlists } from "../tools/lib/goethe-lists.js";
import { auditGoethe } from "../tools/goethe-audit.js";
import { loadPlans } from "../tools/plan-status.js";
import { ALL_LESSONS, LESSON_ORDER } from "../src/lesson-packs.js";
import { readFileSync, readdirSync, statSync } from "node:fs";

const CONTENT = join(__dirname, "..", "content");
const words = loadWords(CONTENT);
const lessons = loadLessons(CONTENT);
const lists = loadWordlists(CONTENT);
const plans = loadPlans(CONTENT);
const plan = plans.find((p) => p.id === "a1-sd1-supplement")!;
const sd1 = lists.find((l) => l.id === "goethe-a1-sd1")!;
const paths = new Set<string>();
(function walk(dir: string, rel: string) {
  for (const n of readdirSync(dir)) {
    const full = join(dir, n);
    if (statSync(full).isDirectory()) walk(full, rel ? `${rel}/${n}` : n);
    else if (n.endsWith(".json")) paths.add(rel ? `${rel}/${n}` : n);
  }
})(CONTENT, "");
const ctx = { words, lessons, lists, paths };

/** كلمة اصطناعية بشكل Word الكامل (نسخة من كلمة حقيقية) — دليلها من الفهرس الحقيقي */
const base = words.find((w) => w.id === "gestern")!;
function syn(de: string, wordClass: Word["wordClass"], article?: string, srsCardTypes: Word["srsCardTypes"] = ["production", "comprehension"]): Word {
  return { ...structuredClone(base), id: `syn-${de.replace(/\W+/g, "-").toLowerCase()}`, de, wordClass, article, chunk: false, plural: undefined, goetheList: [], srsCardTypes };
}
const lessonLike = (id: string, unit: number, day: number, kind: "content" | "integration", wordIds: string[]): PlanLessonLike =>
  ({ id, level: "A1", unit, day, kind, praesentation: { wordIds } });
const coreOf = (p = plan) => new Map(p.core!.lessons.map((c) => [c.lessonId, c]));
const codes = (issues: { code: string }[]) => [...new Set(issues.map((i) => i.code))].sort();

describe("D113 — الخطة الحقيقية: النواة مبكراً · الباقي للفهم · الامتحان 15", () => {
  it("البنية: 48 إسناد نواة (123 كلمة) + وحدتان للفهم 13–14 (153 كلمة · 13–17 للدرس) · المجموع 276", () => {
    expect(plans.map((p) => p.id)).toEqual(["a1-sd1-supplement"]);
    expect(plan.decision).toBe("D113");
    expect(plan.supplementMode).toBe("receptive");
    expect(plan.core!.lessons).toHaveLength(48);
    expect(plan.core!.lessons.reduce((n, c) => n + c.headwords.length, 0)).toBe(123);
    expect(plan.units.map((u) => u.unit)).toEqual([13, 14]);
    for (const u of plan.units) {
      expect(u.contentLessons.map((l) => l.lessonId)).toEqual([1, 2, 3, 4, 5].map((d) => `a1-u${u.unit}-d${d}`));
      expect(u.integrationLessonId).toBe(`a1-u${u.unit}-d6`);
      for (const l of u.contentLessons) expect(l.headwords.length).toBeGreaterThanOrEqual(13), expect(l.headwords.length).toBeLessThanOrEqual(17);
    }
    expect(plan.units.reduce((n, u) => n + u.contentLessons.reduce((m, l) => m + l.headwords.length, 0), 0)).toBe(153);
    expect(plannedHeadwords(plan).size).toBe(276);
    expect(plan.placement).toEqual({ afterUnit: 12, examWeekUnit: 15 });
  });

  it("UNIT_MAX (حدّ كل المخططات) = وحدة أسبوع الامتحان في الخطة — لا ينحرفان", () => {
    expect(UNIT_MAX).toBe(plan.placement.examWeekUnit);
  });

  it("المدقِّق: صفر مشكلة على المحتوى الحقيقي", () => {
    expect(checkPlan(plan, ctx)).toEqual([]);
  });

  it("الاكتمال حرفياً: المخطط (نواة + تكملة) = كل ما لم يعلّمه المنهج من SD1", () => {
    const { uncovered } = auditGoethe(words, [sd1]);
    const notTaught = new Set(uncovered.get(sd1.id)!.map((e) => e.headword));
    const taughtNow = coveredHeadwords(words, indexWordlists([sd1])[0]!);
    const planned = plannedHeadwords(plan);
    for (const h of notTaught) expect(planned.has(h), h).toBe(true);
    for (const h of planned.keys()) expect(notTaught.has(h) || taughtNow.has(h), h).toBe(true);
  });

  it("إسنادات النواة: دروس محتوى قائمة في 1–12 · الحِمل النهائي ≤ 18 · > 3 كلمات للدرس في الدروس الخفيفة وحدها (≤ 7 قبل الإسناد: u1-d5 7 · u9-d5 6)", () => {
    for (const c of coreStatus(plan, ctx)) {
      const l = lessons.find((x) => x.id === c.lessonId)!;
      expect(l.kind, c.lessonId).toBe("content");
      expect(l.unit, c.lessonId).toBeLessThanOrEqual(12);
      expect(c.size + c.missing.length, c.lessonId).toBeLessThanOrEqual(CORE_LOAD_MAX);
      // «خفيف» حكمٌ على الدرس قبل الإسناد — بعد done يضم حجمه كلمات النواة وما أُضيف معها بتغيير معلن
      if (c.headwords.length > 3 && c.status === "pending") expect(c.size, `${c.lessonId}: إسناد كبير لدرس غير خفيف`).toBeLessThanOrEqual(7);
    }
    // D123: u1-d5 بعد الترقية 7 → 17 = 7 نواة + woher (نُقلت لهدف الدرس) + Schülerin · Studentin (المؤنث جزء من المخزون الرسمي) — ≤ 18
    const d5 = coreStatus(plan, ctx).find((c) => c.lessonId === "a1-u1-d5")!;
    expect([d5.status, d5.size, d5.missing]).toEqual(["done", 17, []]);
    // D125: u2-d1 = 12 (woher صارت استدعاءً في الدفء — تُدرَّس في u1-d5 — وinternational نواة)
    const u2d1 = coreStatus(plan, ctx).find((c) => c.lessonId === "a1-u2-d1")!;
    expect([u2d1.status, u2d1.size, u2d1.missing]).toEqual(["done", 12, []]);
    // D126: u2-d2 من 12 إلى 9 — كلمات الوحدة الأولى الست خرجت من «الجديد» (N-018: استدعاءٌ ومراجعة) · والنواة ثلاث (das Leben بمعرّف das-leben)
    const u2d2 = coreStatus(plan, ctx).find((c) => c.lessonId === "a1-u2-d2")!;
    expect([u2d2.status, u2d2.size, u2d2.missing]).toEqual(["done", 9, []]);
    // D127: u2-d3 من 12 إلى 16 — النواة ثلاث (bedeuten · der Text · der Fehler) + die Lehrerin (‑in من شفرة اليوم،
    // وكانت في التمارين قبل أن يكون لها مدخل — والمؤنث من المخزون الرسمي: سابقة D123)
    const u2d3 = coreStatus(plan, ctx).find((c) => c.lessonId === "a1-u2-d3")!;
    expect([u2d3.status, u2d3.size, u2d3.missing]).toEqual(["done", 16, []]);
  });

  it("مراسٍ تعليمية: heute في u1-d2 (إصلاح ملخص u1-d1) · wissen u1-d5 · tun + weh tun معاً في وحدة الصحة · الأزواج معاً", () => {
    const c = coreOf();
    expect(c.get("a1-u1-d2")!.headwords).toContain("heute");
    expect(plan.core!.textFixes.find((f) => f.headword === "heute")!.source).toBe("lessons/a1/a1-u1-d1.json");
    expect(c.get("a1-u1-d5")!.headwords).toContain("wissen");
    expect(c.get("a1-u11-d1")!.headwords).toEqual(expect.arrayContaining(["tun", "weh tun"]));
    expect(plan.core!.textFixes.find((f) => f.headword === "weh tun")!.source).toBe("words/fuss.json");
    expect(c.get("a1-u3-d3")!.headwords).toEqual(expect.arrayContaining(["geschlossen", "geöffnet"]));
    expect(c.get("a1-u2-d4")!.headwords).toEqual(["lang", "lange"]);
    expect(c.get("a1-u4-d1")!.headwords).toContain("der Opa, -s");
    for (const f of plan.core!.textFixes) expect(paths.has(f.source), f.source).toBe(true);
  });

  it("أسبوع الامتحان صار الوحدة 15: ستة دروس توليف هي آخر A1 في المسار — قبل A2 مباشرة", () => {
    const a1 = ALL_LESSONS.filter((l) => l.level === "A1");
    const exam = a1.filter((l) => l.unit === 15);
    expect(exam.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6].map((d) => `a1-u15-d${d}`));
    for (const l of exam) expect(l.kind).toBe("integration");
    expect(a1[a1.length - 1]!.id).toBe("a1-u15-d6");
    expect(LESSON_ORDER[LESSON_ORDER.indexOf("a1-u15-d6") + 1]).toBe("a2-u1-d1");
    expect(a1.some((l) => l.unit === 13 || l.unit === 14)).toBe(planStatus(plan, ctx).some((s) => s.produced));
  });

  it("حالة المتعلم تقبل الوحدات حتى 15 وترفض 16", () => {
    const st = { schemaVersion: "1.0.0", currentUnit: { level: "A1", unit: 15 } };
    expect(LearnerProgress.safeParse(st).success).toBe(true);
    expect(LearnerProgress.safeParse({ ...st, currentUnit: { level: "A1", unit: 16 } }).success).toBe(false);
  });

  it("النواة: u1-d1 (D116) · u1-d2 (D119) · u1-d3 (D120) · u1-d4 (D121) · u1-d5 (D123) · u2-d1 (D125) · u2-d2 (D126) · u2-d3 (D127) · u2-d4 (D128) · u2-d5 (D130) · u3-d1 (D131) · u3-d2 (D132) · u3-d3 (D133) · u3-d4 (D134) · u3-d5 (D135) · u4-d1 (D136) · u4-d2 (D137) · u4-d3 (D138) · u4-d4 (D139) · u4-d5 (D140) · u5-d1 (D141) · u5-d2 (D142) · u5-d3 (D143) · u5-d4 (D144) · u6-d1 (D146) done · التالي a1-u6-d2 · تكملة a1-u13-d1 (15 كلمة)", () => {
    const cs = coreStatus(plan, ctx);
    expect(cs.find((c) => c.lessonId === "a1-u1-d1")).toMatchObject({ status: "done", missing: [] });
    expect(cs.find((c) => c.lessonId === "a1-u1-d2")).toMatchObject({ status: "done", missing: [] });
    expect(cs.find((c) => c.lessonId === "a1-u1-d3")).toMatchObject({ status: "done", missing: [] });
    expect(cs.find((c) => c.lessonId === "a1-u1-d4")).toMatchObject({ status: "done", missing: [] });
    expect(cs.find((c) => c.lessonId === "a1-u1-d5")).toMatchObject({
      status: "done", missing: [],
      headwords: ["das Ende", "wissen", "das Wort, -ö, er/-e", "oft", "bisschen", "der Schüler, -", "der Student, -en"],
    });
    expect(cs.find((c) => c.lessonId === "a1-u2-d1")).toMatchObject({ status: "done", missing: [], headwords: ["international"] });
    expect(cs.find((c) => c.lessonId === "a1-u2-d2")).toMatchObject({ status: "done", missing: [], headwords: ["der Mensch, -en", "der Ort, -e", "das Leben"] });
    expect(cs.find((c) => c.lessonId === "a1-u2-d3")).toMatchObject({ status: "done", missing: [], headwords: ["bedeuten", "der Text, -e", "der Fehler, -"] });
    // D128: lang · lange + kurz منقولة من u4-d5 · وstrasse (من u1-d4) خرجت من «الجديد» (N-018) ⇒ 14 كلمة
    expect(cs.find((c) => c.lessonId === "a1-u2-d4")).toMatchObject({ status: "done", missing: [], headwords: ["lang", "lange"], size: 14 });
    // D130: schlecht · also · die Gruppe (نواة) فوق كلماته الاثنتي عشرة ⇒ 15 كلمة
    expect(cs.find((c) => c.lessonId === "a1-u2-d5")).toMatchObject({ status: "done", missing: [], headwords: ["schlecht", "also", "die Gruppe, -n"], size: 15 });
    // D131: die Oma · das Essen (نواة — das Essen بمعرّف das-essen بجانب الفعل essen) فوق كلماته الاثنتي عشرة ⇒ 14 كلمة
    expect(cs.find((c) => c.lessonId === "a1-u3-d1")).toMatchObject({ status: "done", missing: [], headwords: ["die Oma, -s", "das Essen"], size: 14 });
    // D132: der Dank · leicht · das Restaurant (نواة) فوق كلماته الاثنتي عشرة ⇒ 15 كلمة
    expect(cs.find((c) => c.lessonId === "a1-u3-d2")).toMatchObject({ status: "done", missing: [], headwords: ["der Dank", "leicht", "das Restaurant, -s"], size: 15 });
    // D133: nächst- (بالكلمة nächste — دليل «جذع» D110) · geschlossen · geöffnet فوق كلماته الاثنتي عشرة ⇒ 15 كلمة
    expect(cs.find((c) => c.lessonId === "a1-u3-d3")).toMatchObject({ status: "done", missing: [], headwords: ["nächst-", "geschlossen", "geöffnet"], size: 15 });
    // D134: fertig · regnen · scheinen (نواة) + die Sonne منقولة من a1-u10-d1 (scheinen تحتاجها) فوق كلماته الاثنتي عشرة ⇒ 16 كلمة
    expect(cs.find((c) => c.lessonId === "a1-u3-d4")).toMatchObject({ status: "done", missing: [], headwords: ["fertig", "regnen", "scheinen"], size: 16 });
    expect(cs.find((c) => c.lessonId === "a1-u3-d5")).toMatchObject({
      status: "done", missing: [], headwords: ["einmal", "später", "die Aufgabe, -n"], size: 15,
    });
    expect(cs.find((c) => c.lessonId === "a1-u4-d1")).toMatchObject({
      status: "done", missing: [], headwords: ["die Großeltern (pl.)", "der Junge, -n", "der Opa, -s"], size: 15,
    });
    // D137: lieben (نواة) فوق كلماته الاثنتي عشرة ⇒ 13 كلمة
    expect(cs.find((c) => c.lessonId === "a1-u4-d2")).toMatchObject({
      status: "done", missing: [], headwords: ["lieben"], size: 13,
    });
    // D138: beide · die Lösung (نواة) فوق كلماته الاثنتي عشرة ⇒ 14 كلمة
    expect(cs.find((c) => c.lessonId === "a1-u4-d3")).toMatchObject({
      status: "done", missing: [], headwords: ["beide", "die Lösung, -en"], size: 14,
    });
    // D139: bekannt · die Bekannte (المؤنث — der/die في الفهرس) · tot (نواة) فوق كلماته الاثنتي عشرة ⇒ 15 كلمة
    expect(cs.find((c) => c.lessonId === "a1-u4-d4")).toMatchObject({
      status: "done", missing: [], headwords: ["bekannt", "der/die Bekannte, -n", "tot"], size: 15,
    });
    // D140: das Glück · glücklich (نواة) + ihr (ملكيتها — N-063) فوق كلماته، وkurz (مُدرَّسة في u2-d4) خرجت من «الجديد» ⇒ 14 كلمة
    expect(cs.find((c) => c.lessonId === "a1-u4-d5")).toMatchObject({
      status: "done", missing: [], headwords: ["das Glück", "glücklich"], size: 14,
    });
    // D141: die Lebensmittel (جمع — بلا جنس مفرد) · der Apfel · mögen (نواة) فوق كلماته الاثنتي عشرة ⇒ 15 كلمة
    expect(cs.find((c) => c.lessonId === "a1-u5-d1")).toMatchObject({
      status: "done", missing: [], headwords: ["die Lebensmittel (pl.)", "der Apfel, -Ä", "mögen"], size: 15,
    });
    // D142: bar · bekommen · die Bitte (نواة — die-bitte بمعرّف صريح بجانب bitte «من فضلك») فوق كلماته الاثنتي عشرة ⇒ 15 كلمة
    expect(cs.find((c) => c.lessonId === "a1-u5-d2")).toMatchObject({
      status: "done", missing: [], headwords: ["bar", "bekommen", "die Bitte, -n"], size: 15,
    });
    // D143: was für ein (نواة — قطعة chunk بمعرّف was-fuer-ein) فوق كلماته الاثنتي عشرة ⇒ 13 كلمة
    expect(cs.find((c) => c.lessonId === "a1-u5-d3")).toMatchObject({
      status: "done", missing: [], headwords: ["was für ein"], size: 13,
    });
    // D144: nichts · wenig (نواة) فوق كلماته الاثنتي عشرة ⇒ 14 كلمة (ومعرّف Löffel صُحّح laeffel ← loeffel)
    expect(cs.find((c) => c.lessonId === "a1-u5-d4")).toMatchObject({
      status: "done", missing: [], headwords: ["nichts", "wenig"], size: 14,
    });
    // a1-u5-d5 بلا إسناد نواة (d5 مهمة المقهى — D145) · D146: breit (نواة) فوق كلماته الاثنتي عشرة ⇒ 13 كلمة
    expect(cs.find((c) => c.lessonId === "a1-u6-d1")).toMatchObject({
      status: "done", missing: [], headwords: ["breit"], size: 13,
    });
    expect(cs.find((c) => c.status === "pending")).toMatchObject({
      lessonId: "a1-u6-d2", headwords: ["hoch", "allein", "der Raum, -ä, e"], missing: ["hoch", "allein", "der Raum, -ä, e"],
    });
    const next = planStatus(plan, ctx).find((s) => !s.produced)!;
    expect(next.lessonId).toBe("a1-u13-d1");
    expect(next.headwords).toHaveLength(15);
  });
});

describe("D113 — المخطط يرفض البنية الخاطئة", () => {
  type Raw = { units: { unit: number; contentLessons: { lessonId: string; headwords: string[] }[]; integrationLessonId: string }[];
    placement: { examWeekUnit: number }; core: { lessons: { lessonId: string; headwords: string[] }[]; textFixes: { headword: string; source: string }[] } };
  const fails = (mut: (p: Raw) => void, re: RegExp) => {
    const p = structuredClone(plan) as unknown as Raw;
    mut(p);
    const r = CurriculumPlan.safeParse(p);
    expect(r.success).toBe(false);
    expect(r.error!.issues.map((i) => i.message).join(" | ")).toMatch(re);
  };
  it("التكملة: معرّف · تتابع · توليف · امتحان · حجم · تكرار", () => {
    fails((p) => { p.units[0]!.contentLessons[1]!.lessonId = "a1-u13-d9"; }, /a1-u13-d2/);
    fails((p) => { p.units[1]!.unit = 15; }, /متتابعة/);
    fails((p) => { p.units[0]!.integrationLessonId = "a1-u13-d7"; }, /التوليف/);
    fails((p) => { p.placement.examWeekUnit = 13; }, /أسبوع الامتحان/);
    fails((p) => { p.units[0]!.contentLessons[0]!.headwords.splice(0, 5); }, /خارج 13–17/);
    fails((p) => { p.units[1]!.contentLessons[4]!.headwords[0] = "das Baby, -s"; }, /مرتين/);
  });
  it("النواة: تكرار مع التكملة · درس بعد afterUnit · درس مكرر · إصلاح لكلمة غير مخططة · مسار غير صالح", () => {
    fails((p) => { p.core.lessons[0]!.headwords.push("das Baby, -s"); }, /مرتين/);
    fails((p) => { p.core.lessons[0]!.lessonId = "a1-u13-d1"; }, /حتى الوحدة 12/);
    fails((p) => { p.core.lessons[1]!.lessonId = p.core.lessons[0]!.lessonId; }, /مكرر/);
    fails((p) => { p.core.textFixes[0]!.headword = "Quatsch"; }, /غير مخططة/);
    fails((p) => { p.core.textFixes[0]!.source = "../etc/passwd"; }, /Invalid|regex|pattern|string/i);
  });
});

describe("D113 — المدقِّق: كل قاعدة تُطلق في حالتها", () => {
  const clonePlan = () => CurriculumPlan.parse(structuredClone(plan));
  const realLesson = (id: string) => lessons.find((l) => l.id === id)!;

  it("e-plan-source · e-plan-headword · e-plan-complete", () => {
    expect(codes(checkPlan({ ...plan, sourceList: "goethe-xx" }, ctx))).toEqual(["e-plan-source"]);
    // إسناد pending الذي لم يُنتَج بعد: بعد D146 صار التالي a1-u6-d2؛ تغيير كلمة منه يترك الأصلية غير مخططة.
    const typo = clonePlan();
    typo.core!.lessons.find((c) => c.lessonId === "a1-u6-d2")!.headwords[0] = "hoch!";
    const issues = checkPlan(typo, ctx);
    expect(codes(issues)).toEqual(["e-plan-complete", "e-plan-headword"]);
    expect(issues.find((i) => i.code === "e-plan-complete")!.message).toMatch(/hoch/);
  });

  it("e-plan-taught: إسناد done ولم يُعلَّم ⇒ خطأ لكل كلمة · done ومُعلَّم بدليل حقيقي (a1-u1-d2 بعد ترقيته — D119) ⇒ صفر", () => {
    const core = ["heute", "jetzt", "schwer"];
    const l = realLesson("a1-u1-d2");
    expect(l.praesentation.wordIds).toEqual(expect.arrayContaining(core)); // الدليل الحقيقي
    expect(checkPlan(plan, ctx)).toEqual([]);
    const stripped = { ...l, praesentation: { ...l.praesentation, wordIds: l.praesentation.wordIds.filter((id) => !core.includes(id)) } };
    const lessonsWithout = [...lessons.filter((x) => x.id !== l.id), stripped];
    // لا مدخل لها في أي مكان ⇒ e-plan-taught لكل كلمة
    const bad = checkPlan(plan, { ...ctx, words: words.filter((w) => !core.includes(w.id)), lessons: lessonsWithout }).filter((i) => i.code === "e-plan-taught");
    expect(bad.map((i) => i.message.match(/«(.+?)»/)![1]).sort()).toEqual(core);
    // مدخلها موجود لكن الدرس المُسنَد لا يعلّمها ⇒ تحذير w-plan-elsewhere (لا خطأ)
    expect(codes(checkPlan(plan, { ...ctx, lessons: lessonsWithout }))).toEqual(["w-plan-elsewhere"]);
  });

  it("w-plan-mark-done: pending وكل كلماته مُعلَّمة في درسه · w-plan-elsewhere: كلمة نواة علّمها درس آخر", () => {
    const p = clonePlan();
    p.core!.lessons.find((c) => c.lessonId === "a1-u1-d2")!.status = "pending"; // كلماته مُعلَّمة فعلاً (D119)
    const mark = checkPlan(p, ctx);
    expect(codes(mark)).toEqual(["w-plan-mark-done"]);
    expect(mark[0]!.level).toBe("warning");
    // محاكاة انتقال معلن: d5 يصير pending، وتُنقل Aufgabe تجريبياً إلى درس آخر؛ الحارس يطلب تحديث الخطة.
    const transfer = clonePlan();
    transfer.core!.lessons.find((c) => c.lessonId === "a1-u3-d5")!.status = "pending";
    const d5 = realLesson("a1-u3-d5");
    const d5WithoutAufgabe = { ...d5, praesentation: { ...d5.praesentation, wordIds: d5.praesentation.wordIds.filter((id) => id !== "aufgabe") } };
    const other = realLesson("a1-u4-d1");
    const elsewhere = { ...other, praesentation: { ...other.praesentation, wordIds: [...other.praesentation.wordIds, "aufgabe"] } };
    const changedLessons = lessons.filter((x) => x.id !== d5.id && x.id !== other.id).concat(d5WithoutAufgabe, elsewhere);
    const w = checkPlan(transfer, { ...ctx, lessons: changedLessons });
    expect(codes(w)).toEqual(["w-plan-elsewhere"]);
    expect(w[0]!.message).toMatch(/a1-u3-d5.*«die Aufgabe, -n»/);
  });

  it("e-plan-core-lesson (توليف · غير موجود) · e-plan-core-load (> 18) · e-plan-text-fix", () => {
    const integ = clonePlan();
    integ.core!.lessons.find((c) => c.lessonId === "a1-u6-d2")!.lessonId = "a1-u3-d6"; // النواة لا تُسند إلى درس التوليف
    expect(codes(checkPlan(integ, ctx))).toEqual(["e-plan-core-lesson"]);
    const ghost = clonePlan();
    ghost.core!.lessons.find((c) => c.lessonId === "a1-u6-d2")!.lessonId = "a1-u12-d7";
    expect(codes(checkPlan(ghost, ctx))).toEqual(["e-plan-core-lesson"]);
    const heavy = clonePlan(); // a1-u9-d1 فيه 18 كلمة — أي إسناد يتجاوز السقف
    const u9d5 = heavy.core!.lessons.find((c) => c.lessonId === "a1-u9-d5")!;
    u9d5.headwords = u9d5.headwords.filter((h) => h !== "weiter");
    heavy.core!.lessons.push({ lessonId: "a1-u9-d1", headwords: ["weiter"], status: "pending" });
    expect(codes(checkPlan(heavy, ctx))).toEqual(["e-plan-core-load"]);
    const noFile = new Set([...paths].filter((x) => x !== "words/fuss.json"));
    expect(codes(checkPlan(plan, { ...ctx, paths: noFile }))).toEqual(["e-plan-text-fix"]);
  });

  it("e-plan-receptive: كلمة وحدة الفهم ببطاقة production ⇒ خطأ · comprehension وحدها ⇒ لا", () => {
    const prod = syn("heiraten", "verb");
    const comp = { ...syn("heiraten", "verb", undefined, ["comprehension"]), id: "syn-heiraten-c" };
    const run = (w: Word) => checkPlan(plan, { ...ctx, words: [...words, w], lessons: [...lessons, lessonLike("a1-u13-d1", 13, 1, "content", [w.id])] })
      .filter((i) => i.code === "e-plan-receptive");
    expect(run(prod)).toHaveLength(1);
    expect(run(comp)).toHaveLength(0);
  });

  it("e-plan-kind · e-plan-unplanned · e-plan-exam-week", () => {
    const run = (extra: PlanLessonLike[], drop: (l: PlanLessonLike) => boolean = () => false) =>
      codes(checkPlan(plan, { ...ctx, lessons: [...lessons.filter((l) => !drop(l)), ...extra] }));
    expect(run([lessonLike("a1-u13-d6", 13, 6, "content", ["gestern"])])).toEqual(["e-plan-kind"]);
    expect(run([lessonLike("a1-u14-d7", 14, 7, "content", ["gestern"])])).toEqual(["e-plan-unplanned"]);
    expect(run([lessonLike("a1-u16-d1", 16, 1, "integration", ["gestern"])])).toEqual(["e-plan-exam-week"]);
    expect(run([lessonLike("a1-u15-d7", 15, 7, "content", ["gestern"])])).toEqual(["e-plan-exam-week"]);
    expect(run([], (l) => l.unit === 15)).toEqual(["e-plan-exam-week"]);
  });
});

describe("D115 — «done» في إصلاح النص يُثبت ولا يُصدَّق", () => {
  const source = "lessons/a1/a1-u1-d1.json";
  const fix = plan.core!.textFixes.find((t) => t.source === source)!;
  const withStatus = (status: "pending" | "done") =>
    CurriculumPlan.parse({ ...plan, core: { ...plan.core!, textFixes: plan.core!.textFixes.map((t) => (t === fix ? { ...t, status } : t)) } });
  const realStrings = proseStrings(JSON.parse(readFileSync(join(CONTENT, source), "utf8")));
  /** نص الملخص قبل إصلاحه (D116) — الضابط السلبي يبقى ثابتاً بعد أن أُصلح الملف الحقيقي */
  const preFix = [...realStrings, "Heute hast du dich vorgestellt: Begrüßung, Name, Herkunft."];
  const fixIssues = (p: typeof plan, strings: string[]) =>
    checkPlan(p, { ...ctx, texts: new Map([[source, strings]]) }).filter((i) => i.code === "e-plan-text-fix");

  it("الإصلاح الحقيقي (heute في ملخص u1-d1): done والملف ما زال يحملها → e-plan-text-fix بالنص نفسه", () => {
    expect(fix.headword).toBe("heute");
    const issues = fixIssues(withStatus("done"), preFix);
    expect(issues).toHaveLength(1);
    expect(issues[0]!.message).toContain("Heute hast du");
  });
  it("done والكلمة غابت → لا خطأ · pending والكلمة موجودة → لا خطأ (دَين معلن)", () => {
    expect(fixIssues(withStatus("done"), preFix.filter((s) => !/heute/i.test(s)))).toEqual([]);
    expect(fixIssues(withStatus("pending"), preFix)).toEqual([]);
  });
  it("الملف الحقيقي بعد الإصلاح (D116): الخطة تقول done والإثبات يمر — بلا heute في أي نص", () => {
    expect(fix.status).toBe("done");
    expect(realStrings.some((s) => /\bheute\b/i.test(s))).toBe(false);
    expect(fixIssues(plan, realStrings)).toEqual([]);
  });
  it("رمز البحث وكلمته الكاملة: weh tun → weh · die X → X · heutige ليست heute", () => {
    expect(textFixToken("weh tun")).toBe("weh");
    expect(textFixToken("die Straßenbahn")).toBe("Straßenbahn");
    expect(textFixToken("nächst-")).toBe("nächst");
    expect(wholeWordRegex("heute").test("Bis heute.")).toBe(true);
    expect(wholeWordRegex("heute").test("die heutige Zeit")).toBe(false);
    expect(wholeWordRegex("weh").test("Mein Fuß tut weh.")).toBe(true);
  });
  it("proseStrings: نصوص القارئ فقط — المعرّفات والروابط تسقط", () => {
    expect(proseStrings({ id: "heute", wordIds: ["heute"], url: "https://x.de/heute", t: { de: "Heute ist gut." } })).toEqual(["Heute ist gut."]);
  });
});
