// adaptation-engine.test.ts — E19: التجميد يحفظ الجداول ولا يكسرها + العودة موزّعة + بلا لوم (D23)
import { describe, it, expect } from "vitest";
import {
  freezePlan,
  resumePlan,
  quickFreeze,
  REASON_AR,
  type ScheduledCard,
} from "../src/lib/adaptation-engine.js";
import { BLAME_WORDS } from "../src/lib/warmth-engine.js";

const cards: ScheduledCard[] = [
  { id: "c1", dueDay: 5 },
  { id: "c2", dueDay: 6 },
  { id: "c3", dueDay: 20 },
];

describe("E19 — التجميد يحفظ الجداول ولا يكسرها", () => {
  it("البطاقات الأصلية محفوظة كما هي — عدد وترتيب نسبي", () => {
    const f = freezePlan(cards, "krank", 4, 7);
    expect(f.original).toHaveLength(3);
    expect(f.original.map((c) => c.id)).toEqual(["c1", "c2", "c3"]);
    expect(f.original.map((c) => c.dueDay)).toEqual([5, 6, 20]); // الجدول الأصلي لم يُمسّ
    expect(f.resumeDay).toBe(11);
  });

  it("مدة تجميد سالبة أو صفريّة = مرفوضة", () => {
    expect(() => freezePlan(cards, "reise", 1, 0)).toThrow();
    expect(() => freezePlan(cards, "reise", 1, -3)).toThrow();
  });
});

describe("E19 — العودة: spaced review بلا كومة يوم واحد", () => {
  it("بطاقات العودة تُوزَّع على أيام متتالية — واللاحقة تبقى في مكانها", () => {
    const f = freezePlan(cards, "ramadan", 4, 7);
    const r = resumePlan(f, 3);
    // c1 وc2 مستحقتان قبل/يوم العودة (11) — تُوزَّع على 11 و12
    const overdue = r.cards.filter((c) => c.id !== "c3");
    expect(overdue.map((c) => c.dueDay)).toEqual([11, 12]);
    expect(r.cards.find((c) => c.id === "c3")!.dueDay).toBe(20); // لم تُكسر
    expect(r.noteAr).toContain("لا شيء ضاع");
    expect(() => resumePlan(f, 0)).toThrow();
  });

  it("صفر لوم في كل نصوص العودة والتجميد — والأسباب الخمسة معلنة", () => {
    const f = quickFreeze(cards, "pruefung", 1, 5);
    const texts = [f.noteAr, resumePlan(f).noteAr, ...Object.values(REASON_AR)];
    for (const t of texts) for (const w of BLAME_WORDS) expect(t).not.toContain(w);
    expect(Object.keys(REASON_AR)).toEqual(["krank", "ramadan", "reise", "pruefung", "family"]);
  });
});
