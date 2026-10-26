// errors-engine.test.ts — E04 محرك الأخطاء: دفتر ذهبي + جولة إلزامية + «الخطأ العابر» + الدقائق الثلاث
import { describe, it, expect } from "vitest";
import { ErrorEntry as ErrorEntrySchema, type ErrorEntry } from "../content/schemas/index.js";
import {
  FOSSILIZED_AFTER_REPETITIONS,
  SYSTEMATIC_REMEDIAL_EXERCISES,
  SLIP_REMEDIAL_EXERCISES,
  ERROR_RESHOW_GAP_MIN,
  autoClassify,
  processingFor,
  isTransient,
  captureError,
  srsCardIdFor,
  registerRecurrence,
  buildErrorRound,
  errorRoundRequired,
  sessionIncludesMandatoryRound,
  reshowAt,
  canReshow,
  upsertGoldenError,
  KIND_LABELS_AR,
} from "../src/lib/errors-engine.js";

function entry(over: Partial<ErrorEntry> = {}): ErrorEntry {
  return {
    id: "e1",
    kind: "systematic",
    skill: "grammar",
    payload: {
      wrong: "Ich habe nicht ein Buch",
      correct: "Ich habe kein Buch",
      explanation: "نفي الملكية بـkein لا mit nicht",
      source: "a1-u1-d1",
    },
    remedialExercises: ["remedial-1", "remedial-2", "remedial-3"],
    occurrences: 1,
    resolved: false,
    createdAt: "2026-10-09",
    ...over,
  };
}

describe("E04 — التصنيف الثلاثي (§4: نظامي / هفوة / متحجر)", () => {
  it("جهل القاعدة = خطأ نظامي", () => {
    expect(autoClassify({})).toBe("systematic");
    expect(autoClassify({ repeats: 2, wasMastered: false })).toBe("systematic");
  });

  it("قاعدة مُتقنة + خطأ سريع = هفوة («الخطأ العابر»)", () => {
    expect(autoClassify({ wasMastered: true })).toBe("slip");
    expect(isTransient("slip")).toBe(true);
    expect(isTransient("systematic")).toBe(false);
    expect(isTransient("fossilized")).toBe(false);
  });

  it("≥3 تكرارات بعد تصحيح سابق = متحجر", () => {
    expect(autoClassify({ repeats: FOSSILIZED_AFTER_REPETITIONS })).toBe("fossilized");
    expect(autoClassify({ repeats: 2 })).toBe("systematic");
  });

  it("زر التبديل اليدوي يُلغي التصنيف الآلي (§4)", () => {
    const manual = captureError({
      id: "e-manual",
      skill: "vocab",
      wrong: "die Haus",
      correct: "das Haus",
      explanation: "الجنس",
      source: "a1-u1-d1",
      hints: { wasMastered: true }, // آلياً: هفوة
      kind: "systematic", // يدوي: نظامي
    });
    expect(manual.kind).toBe("systematic");
  });
});

describe("E04 — المعالجة حسب النوع (جدول §4 — لا معالجة واحدة للكل)", () => {
  it("النظامي: بطاقة SRS + 3 تمارين علاجية + ظهور متباعد", () => {
    const p = processingFor("systematic");
    expect(p.createSrsCard).toBe(true);
    expect(p.remedialExercises).toBe(SYSTEMATIC_REMEDIAL_EXERCISES);
    expect(p.spacedReappearance).toBe(true);
  });

  it("الهفوة: لا بطاقة SRS + تمرين واحد فقط", () => {
    const p = processingFor("slip");
    expect(p.createSrsCard).toBe(false);
    expect(p.remedialExercises).toBe(SLIP_REMEDIAL_EXERCISES);
    expect(SLIP_REMEDIAL_EXERCISES).toBe(1);
  });

  it("المتحجر: Contrast Drills + إشعار مولر + متابعة أسبوعية", () => {
    const p = processingFor("fossilized");
    expect(p.contrastDrills).toBe(true);
    expect(p.mullerNotice).toBe(true);
    expect(p.weeklyFollowUp).toBe(true);
    expect(p.createSrsCard).toBe(false);
  });

  it("كل خطأ → بطاقة (قيد دفتر صالح للمخطط) + جولة إلزامية (F112)", () => {
    const e = captureError({
      id: "err-kein",
      skill: "grammar",
      wrong: "Ich habe nicht ein Buch",
      correct: "Ich habe kein Buch",
      explanation: "نفي الملكية",
      source: "a1-u1-d1",
      hints: {},
    });
    expect(() => ErrorEntrySchema.parse(e)).not.toThrow();
    expect(e.remedialExercises.length).toBe(3); // معالجة النظامي مضمّنة في القيد
    const round = buildErrorRound([e]);
    expect(round.map((r) => r.id)).toEqual(["err-kein"]);
  });

  it("بطاقة SRS تُربط للنظامي فقط — الهفوة والمتحجر بلا بطاقة (§4)", () => {
    expect(srsCardIdFor(entry({ kind: "systematic" }))).toBe("err-e1");
    expect(srsCardIdFor(entry({ kind: "slip" }))).toBeNull();
    expect(srsCardIdFor(entry({ kind: "fossilized" }))).toBeNull();
  });
});

describe("الجولة الإلزامية (§2.7 — تبدأ بها كل جلسة)", () => {
  it("كل الأخطاء غير المحلولة، الأقدم أولاً — وال المحلولة تخرج", () => {
    const round = buildErrorRound([
      entry({ id: "e-new", createdAt: "2026-10-10" }),
      entry({ id: "e-old", createdAt: "2026-10-01" }),
      entry({ id: "e-done", createdAt: "2026-10-02", resolved: true, resolvedAt: "2026-10-03" }),
    ]);
    expect(round.map((e) => e.id)).toEqual(["e-old", "e-new"]);
  });

  it("الحارس: الجولة إلزامية ما دام هناك خطأ غير محلول — لا تُتخطى", () => {
    const mixed = [entry({ id: "a" }), entry({ id: "b", resolved: true })];
    expect(errorRoundRequired(mixed)).toBe(true);
    expect(sessionIncludesMandatoryRound(mixed, ["a"])).toBe(true);
    expect(sessionIncludesMandatoryRound(mixed, [])).toBe(false); // جلسة بلا جولة = مرفوضة
    expect(sessionIncludesMandatoryRound(mixed, ["b"])).toBe(false); // ناقص: a غير مغطى
  });

  it("لا حرج حين لا توجد أخطاء (بلا لوم — D23)", () => {
    const clean = [entry({ id: "a", resolved: true })];
    expect(errorRoundRequired(clean)).toBe(false);
    expect(sessionIncludesMandatoryRound(clean, [])).toBe(true);
    expect(buildErrorRound(clean)).toEqual([]);
  });
});

describe("قاعدة الدقائق الثلاث (F038 — فجوة التذكر)", () => {
  it("الثابت = 3 دقائق — إعادة العرض بعد الخطأ بثلاث دقائق لا فوراً", () => {
    expect(ERROR_RESHOW_GAP_MIN).toBe(3);
    const erroredAt = new Date("2026-10-10T10:00:00.000Z");
    expect(reshowAt(erroredAt).toISOString()).toBe("2026-10-10T10:03:00.000Z");
  });

  it("قبل الدقائق الثلاث: ممنوع — بعدها: مسموح", () => {
    const erroredAt = new Date("2026-10-10T10:00:00.000Z");
    expect(canReshow(erroredAt, new Date("2026-10-10T10:02:59.000Z"))).toBe(false);
    expect(canReshow(erroredAt, new Date("2026-10-10T10:03:00.000Z"))).toBe(true);
    expect(canReshow(erroredAt, new Date("2026-10-10T10:30:00.000Z"))).toBe(true);
    expect(canReshow(erroredAt, erroredAt)).toBe(false); // لا إعادة فورية أبداً
  });
});

describe("التصحيح ثم التكرار = تصلّب (§4)", () => {
  it("الخطأ العائد بعد تصحيح يعود للجولة — والتكرار الثالث يُصنِّفه متحجراً", () => {
    let e = captureError({
      id: "err-again",
      skill: "grammar",
      wrong: "Ich bin heißen",
      correct: "Ich heiße",
      explanation: "الافعال الشاذة",
      source: "a1-u1-d2",
      hints: {},
      createdAt: "2026-10-01",
    });
    e = { ...e, resolved: true, resolvedAt: "2026-10-02" };
    e = registerRecurrence(e, { correctedBefore: true }); // occurrences 2
    expect(e.kind).toBe("systematic");
    expect(e.resolved).toBe(false);
    e = registerRecurrence(e, { correctedBefore: true }); // occurrences 3 = ≥ الحد
    expect(e.occurrences).toBe(FOSSILIZED_AFTER_REPETITIONS);
    expect(e.kind).toBe("fossilized");
  });

  it("بلا تصحيح سابق لا تصلّب مهما تكرر (الحد يُقرأ كما في §4)", () => {
    let e = entry({ kind: "systematic" });
    for (let i = 0; i < 5; i++) e = registerRecurrence(e, { correctedBefore: false });
    expect(e.kind).toBe("systematic");
    expect(e.occurrences).toBe(6);
  });
});

describe("الالتقاط التلقائي من الحصص (N-150 · D250)", () => {
  const input = {
    skill: "schreiben" as const, wrong: "Ich heisse Yusuf", correct: "Ich heiße Yusuf",
    explanation: "ß لا s", source: "a1-u1-d1/quiz", closeSlip: false,
  };
  const SLUG = /^[a-z0-9][a-z0-9-]*$/;

  it("خطأ جديد = قيد نظامي بمعرّف صالح", () => {
    const out = upsertGoldenError([], input);
    expect(out).toHaveLength(1);
    expect(out[0]!.kind).toBe("systematic");
    expect(out[0]!.occurrences).toBe(1);
    expect(out[0]!.resolved).toBe(false);
    expect(out[0]!.id).toMatch(SLUG);
  });

  it("القريب الشكلي = هفوة صريحة", () => {
    const out = upsertGoldenError([], { ...input, closeSlip: true });
    expect(out[0]!.kind).toBe("slip");
  });

  it("نفس الخطأ مجدداً = تكرار (والثالث = تحجّر) — لا قيد مكرر", () => {
    const once = upsertGoldenError([], input);
    const twice = upsertGoldenError(once, input);
    expect(twice).toHaveLength(1);
    expect(twice[0]!.occurrences).toBe(2);
    expect(twice[0]!.kind).toBe("systematic");
    const thrice = upsertGoldenError(twice, input);
    expect(thrice[0]!.occurrences).toBe(3);
    expect(thrice[0]!.kind).toBe("fossilized");
  });

  it("خطأ مختلف = قيد جديد بمعرّف مختلف", () => {
    const once = upsertGoldenError([], input);
    const twice = upsertGoldenError(once, { ...input, wrong: "anderer Fehler" });
    expect(twice).toHaveLength(2);
    expect(twice[0]!.id).not.toBe(twice[1]!.id);
  });

  it("أسماء الأنواع عربية وبلا لوم", () => {
    expect(KIND_LABELS_AR.systematic).toContain("نظامي");
    expect(KIND_LABELS_AR.slip).toContain("هفوة");
    expect(KIND_LABELS_AR.fossilized).toContain("متحجّر");
  });
});
