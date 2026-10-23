// tests/day-focus.test.ts — D275: تخصص الأيام (ب-4/ب-13) — عادة ثابتة بلا لوم
import { describe, it, expect } from "vitest";
import { DAY_FOCUS_AR, dayFocus, weeklyGoalState, type DayFocus } from "../src/lib/day-engine.js";
import { BLAME_WORDS } from "../src/lib/coach-engine.js";

const D = (y: number, m: number, d: number, h = 10) => new Date(y, m, d, h);

describe("dayFocus — خريطة الأسبوع", () => {
  const week: [Date, DayFocus][] = [
    [D(2026, 9, 19), "listening"], // اثنين
    [D(2026, 9, 20), "grammar"], // ثلاثاء
    [D(2026, 9, 21), "speaking"], // أربعاء
    [D(2026, 9, 22), "writing"], // خميس
    [D(2026, 9, 23), "culture"], // جمعة
    [D(2026, 9, 24), "battle"], // سبت
    [D(2026, 9, 25), "rest"], // أحد
  ];
  for (const [date, want] of week) {
    it(`${date.toDateString()} = ${want}`, () => {
      expect(dayFocus(date)).toBe(want);
    });
  }

  it("كل تركيز له تسمية وتوجيه — خالٍ من اللوم (D23)", () => {
    const keys = Object.keys(DAY_FOCUS_AR) as DayFocus[];
    expect(keys).toHaveLength(7);
    for (const k of keys) {
      expect(DAY_FOCUS_AR[k]!.label.length).toBeGreaterThan(2);
      expect(DAY_FOCUS_AR[k]!.tip.length).toBeGreaterThan(10);
      for (const b of BLAME_WORDS) {
        expect(DAY_FOCUS_AR[k]!.tip).not.toContain(b);
      }
    }
  });
});

describe("D279: حالة الهدف الأسبوعي (ب-18)", () => {
  it("الأحد صمت دائماً — حتى بعد التحقق", () => {
    expect(weeklyGoalState(false, 0, false)).toBe("hidden");
    expect(weeklyGoalState(true, 0, false)).toBe("hidden");
  });

  it("الاثنين: قبل المساء مخفي · مساءً إعلان", () => {
    expect(weeklyGoalState(false, 1, false)).toBe("hidden");
    expect(weeklyGoalState(false, 1, true)).toBe("announce");
  });

  it("الثلاثاء–الجمعة تذكير · السبت قياس", () => {
    for (const w of [2, 3, 4, 5]) expect(weeklyGoalState(false, w, false)).toBe("reminder");
    expect(weeklyGoalState(false, 6, false)).toBe("measure");
  });

  it("المجتاز متحقق — في أي يوم معلن", () => {
    expect(weeklyGoalState(true, 6, false)).toBe("achieved");
    expect(weeklyGoalState(true, 3, false)).toBe("achieved");
    expect(weeklyGoalState(true, 1, true)).toBe("achieved");
    expect(weeklyGoalState(true, 1, false)).toBe("hidden"); // الإعلان لم يحن
  });
});
