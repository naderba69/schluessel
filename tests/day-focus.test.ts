// tests/day-focus.test.ts — D275: تخصص الأيام (ب-4/ب-13) — عادة ثابتة بلا لوم
import { describe, it, expect } from "vitest";
import { DAY_FOCUS_AR, FLEX_DAYS, FLEX_MINUTES, dayFocus, flexWeek, weeklyGoalState, type DayFocus } from "../src/lib/day-engine.js";
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

describe("D282: الأسبوع المرن (ب-16)", () => {
  const S = (date: string, durationMinutes: number) => ({ date, durationMinutes });

  it("الثوابت: 3 أيام × 45 دقيقة", () => {
    expect([FLEX_DAYS, FLEX_MINUTES]).toEqual([3, 45]);
  });

  it("الأسبوع الحالي: عدّ الأيام ≥45 والنجاح بثلاثة", () => {
    const fri = D(2026, 9, 23); // جمعة — الأسبوع 19..25
    const two = flexWeek([S("2026-10-19", 45), S("2026-10-20", 90), S("2026-10-21", 10)], fri);
    expect(two).toMatchObject({ days45: 2, studied: 3, success: false, monday: "2026-10-19" });
    const three = flexWeek([S("2026-10-19", 45), S("2026-10-20", 45), S("2026-10-21", 45)], fri);
    expect(three.success).toBe(true);
  });

  it("الحد: 44 لا تُحسب · 45 تُحسب", () => {
    const fri = D(2026, 9, 23);
    expect(flexWeek([S("2026-10-19", 44)], fri).days45).toBe(0);
    expect(flexWeek([S("2026-10-19", 45)], fri).days45).toBe(1);
  });

  it("الأسبوع الماضي (back=1) والأحد يتبع اثنينه", () => {
    const wed = D(2026, 9, 21);
    const prev = flexWeek([S("2026-10-12", 45), S("2026-10-13", 20)], wed, 1);
    expect(prev).toMatchObject({ days45: 1, studied: 2, success: false, monday: "2026-10-12" });
    const sun = D(2026, 9, 18); // أحد — أسبوعه يبدأ 10-12
    expect(flexWeek([], sun).monday).toBe("2026-10-12");
  });
});
