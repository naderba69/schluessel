// tests/coach-pulse.test.ts — D272: نبض النوافذ (F002) — الحراس والنص الدافئ
import { describe, it, expect } from "vitest";
import {
  BLAME_WORDS,
  PULSE_BODY_AR,
  PULSE_TITLE_AR,
  WINDOW_RANGES,
  isQuietHours,
  pulseKey,
  readPulseStore,
  shouldPulse,
  windowDueNow,
  writePulseStore,
  type CoachWindow,
  type PulseStore,
} from "../src/lib/coach-engine.js";

const WED = (h: number, m = 0) => new Date(2026, 9, 21, h, m); // أربعاء
const SUN = (h: number, m = 0) => new Date(2026, 9, 25, h, m); // أحد (راحة)
const STORE: PulseStore = { seen: [], snoozeUntilMs: 0 };
const ALL: CoachWindow[] = ["midday", "afternoon", "evening"];

describe("windowDueNow — النافذة الحائنة", () => {
  it("12:30 ظهراً = midday", () => {
    expect(windowDueNow(WED(12, 30), ALL)).toBe("midday");
  });
  it("16:00 عصراً = afternoon", () => {
    expect(windowDueNow(WED(16), ALL)).toBe("afternoon");
  });
  it("20:00 مساءً = evening", () => {
    expect(windowDueNow(WED(20), ALL)).toBe("evening");
  });
  it("خارج النطاقات (10:00) = لا نافذة", () => {
    expect(windowDueNow(WED(10), ALL)).toBeNull();
  });
  it("النافذة غير المختارة لا تحين (ظهيرة فقط → 16:00 صامت)", () => {
    expect(windowDueNow(WED(16), ["midday"])).toBeNull();
  });
  it("حدّ البداية مشمول والنهاية مستبعدة", () => {
    expect(windowDueNow(WED(12, 0), ALL)).toBe("midday");
    expect(windowDueNow(WED(14, 0), ALL)).toBeNull();
  });
});

describe("shouldPulse — الحراس", () => {
  it("الأحد صمت كامل ولو في قلب النافذة", () => {
    expect(shouldPulse(SUN(12, 30), ALL, STORE)).toBeNull();
  });
  it("الليل صمت (23:00) والفجر صمت (06:00)", () => {
    expect(isQuietHours(WED(23))).toBe(true);
    expect(isQuietHours(WED(6))).toBe(true);
    expect(isQuietHours(WED(12, 30))).toBe(false);
    expect(shouldPulse(WED(23), ALL, STORE)).toBeNull();
  });
  it("النافذة تُعرض مرة واحدة في يومها", () => {
    const now = WED(12, 30);
    const seen: PulseStore = { seen: [pulseKey(now, "midday")], snoozeUntilMs: 0 };
    expect(shouldPulse(now, ALL, seen)).toBeNull();
  });
  it("أمس المعروض لا يحجب اليوم (المفتاح يومي)", () => {
    const yesterday = new Date(2026, 9, 20, 12, 30);
    const seen: PulseStore = { seen: [pulseKey(yesterday, "midday")], snoozeUntilMs: 0 };
    expect(shouldPulse(WED(12, 30), ALL, seen)).toBe("midday");
  });
  it("التأجيل يسكت حتى انتهائه ثم يعود النبض", () => {
    const now = WED(12, 30);
    const snoozed: PulseStore = { seen: [], snoozeUntilMs: now.getTime() + 3600000 };
    expect(shouldPulse(now, ALL, snoozed)).toBeNull();
    const later = new Date(now.getTime() + 3600001);
    expect(shouldPulse(later, ALL, snoozed)).toBe("midday");
  });
  it("الحالة السعيدة: نافذة حائنة بلا موانع = نبض", () => {
    expect(shouldPulse(WED(16, 10), ALL, STORE)).toBe("afternoon");
  });
});

describe("نص النبض — بلا لوم أبداً (D23)", () => {
  it("العنوان والنصوص الثلاثة خالية من كلمات اللوم", () => {
    const texts = [PULSE_TITLE_AR, ...Object.values(PULSE_BODY_AR)];
    expect(texts).toHaveLength(4);
    for (const t of texts) {
      expect(t.length).toBeGreaterThan(10);
      for (const b of BLAME_WORDS) expect(t).not.toContain(b);
    }
  });
  it("كل نافذة رمزية لها نطاق ونص", () => {
    for (const w of ALL) {
      expect(WINDOW_RANGES[w].startMin).toBeLessThan(WINDOW_RANGES[w].endMin);
      expect(PULSE_BODY_AR[w]).toBeTruthy();
    }
  });
});

describe("مخزن النبض", () => {
  it("المفتاح يومي: نافذة+تاريخ", () => {
    expect(pulseKey(WED(12, 30), "midday")).toBe("2026-10-21:midday");
  });
  it("بلا localStorage (node): قراءة افتراضية وكتابة صامتة", () => {
    expect(readPulseStore()).toEqual({ seen: [], snoozeUntilMs: 0 });
    expect(() => writePulseStore({ seen: ["x"], snoozeUntilMs: 1 })).not.toThrow();
  });
});
