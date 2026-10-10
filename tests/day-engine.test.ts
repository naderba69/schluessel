// day-engine.test.ts — E06 محرك اليوم: الاسترجاع أولاً (§12) + أخطاء ذهبية بالأقدم + حدود اليوم الأول
import { describe, it, expect } from "vitest";
import { buildDayPlan, recallBeforeNew, DAY_ONE_MAX_CARDS } from "../src/lib/day-engine.js";

describe("محرك اليوم E06", () => {
  it("الأخطاء الذهبية تُرتب بالأقدم التقاطاً وتأتي أولاً", () => {
    const plan = buildDayPlan({
      date: "2026-10-12",
      goldenErrors: [
        { id: "e2", capturedOn: "2026-10-11", pattern: "heißen", kind: "error" },
        { id: "e1", capturedOn: "2026-10-09", pattern: "ich bin/ich heiße", kind: "error" },
      ],
      dueCards: [{ cardId: "c1", due: "2026-10-12", kind: "review" }],
      newItems: [{ id: "w-wohnung", kind: "new-word" }],
    });
    expect(plan.station1.goldenErrors.map((e) => e.id)).toEqual(["e1", "e2"]);
  });

  it("الحارس: جديد بلا استرجاع = خطة مرفوضة (لا جلسة بلا استرجاع أولاً)", () => {
    const bad = buildDayPlan({ date: "d", goldenErrors: [], dueCards: [], newItems: [{ id: "x", kind: "new-word" }] });
    expect(recallBeforeNew(bad)).toBe(false);
    const good = buildDayPlan({
      date: "d",
      goldenErrors: [],
      dueCards: [{ cardId: "c1", due: "d", kind: "review" }],
      newItems: [{ id: "x", kind: "new-word" }],
    });
    expect(recallBeforeNew(good)).toBe(true);
    const pureReview = buildDayPlan({ date: "d", goldenErrors: [], dueCards: [{ cardId: "c", due: "d", kind: "review" }], newItems: [] });
    expect(recallBeforeNew(pureReview)).toBe(true);
  });

  it("اليوم الأول: 4 بطاقات فقط (§9 — لا إغراق)", () => {
    expect(DAY_ONE_MAX_CARDS).toBe(4);
  });
});
