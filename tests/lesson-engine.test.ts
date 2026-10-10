// lesson-engine.test.ts — E01 محرك الحصة: 120 دقيقة متصلة، 4 محطات، قفل اتجاه، الاسترجاع قبل الشرح
import { describe, it, expect } from "vitest";
import {
  SESSION_MINUTES, STATIONS, STATION_MINUTES, totalMinutes,
  stationNext, canMove, attemptBeforeReveal, BREAKS_AFTER,
} from "../src/lib/lesson-engine.js";

describe("محرك الحصة E01 (حصة واحدة 120 دقيقة — قرار المالك)", () => {
  it("المجموع = 120 دقيقة بالضبط (15+40+50+15)", () => {
    expect(totalMinutes()).toBe(120);
    expect(SESSION_MINUTES).toBe(120);
  });

  it("أربع محطات بترتيب ثابت وثلاث استراحات داخلية", () => {
    expect(STATIONS).toEqual(["recall", "learn", "practice", "close"]);
    expect(BREAKS_AFTER.length).toBe(3);
  });

  it("التسلسل للأمام فقط — لا ارتجاع (قانون 3)", () => {
    expect(stationNext("recall")).toBe("learn");
    expect(stationNext("learn")).toBe("practice");
    expect(stationNext("practice")).toBe("close");
    expect(stationNext("close")).toBeNull();
    expect(canMove("recall", "learn")).toBe(true);
    expect(canMove("learn", "recall")).toBe(false); // ممنوع الرجوع
    expect(canMove("recall", "practice")).toBe(false); // ممنوع القفز
    expect(canMove("recall", "recall")).toBe(false);
  });

  it("F121: محاولة قبل أي كشف/شرح في محطة الجديد", () => {
    expect(attemptBeforeReveal([{ kind: "attempt" }, { kind: "reveal" }, { kind: "explain" }, { kind: "drill" }])).toBe(true);
    expect(attemptBeforeReveal([{ kind: "reveal" }, { kind: "attempt" }])).toBe(false); // كشف قبل محاولة = مرفوض
    expect(attemptBeforeReveal([{ kind: "attempt" }, { kind: "drill" }])).toBe(true);
    expect(attemptBeforeReveal([])).toBe(true);
  });
});
