// progress-report.test.ts — تقارير التقدم: أسبوعي + شهري (معايرة F160) + سطر الخريطة
// القواعد المغلقة: أرقام حقيقية فقط (E18) · هادئ بلا لوم (D23) · لا أرقام مخيفة (§2.8) · F157 بلا «سلسلة»
import { describe, it, expect } from "vitest";
import { weeklyReport, monthlyReport, mapLine } from "../src/lib/progress-report.js";
import { hasBlame, BLAME_WORDS } from "../src/lib/warmth-engine.js";

const WEEK = {
  daysWithMueller: 5,
  reviewsDone: 42,
  minutesTotal: 90,
  wordsSecured: 12,
  nextFocusAr: "المضارع Perfekt",
};

describe("التقرير الأسبوعي — أرقام حقيقية فقط (E18)", () => {
  it("يذكر أرقام المدخلات حرفياً — لا أرقام محسوبة من العدم", () => {
    const r = weeklyReport(WEEK);
    expect(r.isEmpty).toBe(false);
    expect(r.daysLine).toContain("5 من 7");
    expect(r.effortLine).toContain("42");
    expect(r.effortLine).toContain("90");
    expect(r.securedLine).toContain("12");
    expect(r.nextStepLine).toContain("المضارع Perfekt");
  });

  it("F157: «أيامك مع مولر» لا «سلسلة» — ولا لوم إطلاقاً (D23)", () => {
    const r = weeklyReport(WEEK);
    for (const line of r.linesAr) {
      expect(hasBlame(line)).toBe(false);
      expect(line).not.toContain("سلسلة");
    }
    expect(r.daysLine).toContain("أيامك مع مولر");
  });

  it("أسبوع فارغ: isEmpty=true — بصراحة، بلا أرقام مخيفة إطلاقاً", () => {
    const r = weeklyReport({
      daysWithMueller: 0,
      reviewsDone: 0,
      minutesTotal: 0,
      wordsSecured: 0,
      nextFocusAr: "التحية",
    });
    expect(r.isEmpty).toBe(true);
    for (const line of r.linesAr) {
      expect(/\d/.test(line)).toBe(false); // صفر رقم في تقرير العدم
      expect(hasBlame(line)).toBe(false);
    }
  });

  it("أيام معدومة تُقال بإطار هادئ («خفيف» — لا «خسرت»)", () => {
    const r = weeklyReport({ ...WEEK, daysWithMueller: 0, reviewsDone: 0, minutesTotal: 0, wordsSecured: 3 });
    expect(r.daysLine).toContain("خفيف");
    expect(hasBlame(r.daysLine)).toBe(false);
  });

  it("7 أيام كاملة تُقال بفخر هادئ", () => {
    const r = weeklyReport({ ...WEEK, daysWithMueller: 7 });
    expect(r.daysLine).toContain("7 من 7");
  });

  it("رفض الأرقام غير المنطقية (E18): سالب · كسر · 8 أيام · تركيز فارغ", () => {
    expect(() => weeklyReport({ ...WEEK, reviewsDone: -1 })).toThrow();
    expect(() => weeklyReport({ ...WEEK, minutesTotal: 1.5 })).toThrow();
    expect(() => weeklyReport({ ...WEEK, daysWithMueller: 8 })).toThrow();
    expect(() => weeklyReport({ ...WEEK, nextFocusAr: "  " })).toThrow();
  });
});

describe("التقرير الشهري — معايرة تقدير الذات (F160)", () => {
  const STATS = [
    { skill: "hoeren" as const, minutes: 40, itemsDone: 10, itemsCorrect: 6 },
    { skill: "sprechen" as const, minutes: 25, itemsDone: 8, itemsCorrect: 7 },
    { skill: "lesen" as const, minutes: 30, itemsDone: 12, itemsCorrect: 9 },
    { skill: "schreiben" as const, minutes: 15, itemsDone: 6, itemsCorrect: 3 },
  ];

  it("معايرة: تقديرك دقيق (فارق ≤5%) — تُقال بثقة هادئة", () => {
    const r = monthlyReport({
      reviewsThisMonth: 120,
      minutesThisMonth: 300,
      stats: STATS,
      selfEstimatePercent: 68,
      gateResultPercent: 71,
      retentionNow: null,
    });
    expect(r.calibrationLine).toContain("دقيق جداً");
    expect(r.calibrationLine).toContain("3%");
  });

  it("معايرة: فارق متوسط (≤15%) — «قريب»", () => {
    const r = monthlyReport({
      reviewsThisMonth: 10,
      minutesThisMonth: 30,
      stats: STATS,
      selfEstimatePercent: 80,
      gateResultPercent: 68,
      retentionNow: null,
    });
    expect(r.calibrationLine).toContain("قريب");
    expect(r.calibrationLine).toContain("12%");
  });

  it("معايرة: فارق كبير — «طبيعي والمعايرة تُضبط» — بلا لوم (D23)", () => {
    const r = monthlyReport({
      reviewsThisMonth: 10,
      minutesThisMonth: 30,
      stats: STATS,
      selfEstimatePercent: 90,
      gateResultPercent: 40,
      retentionNow: null,
    });
    expect(r.calibrationLine).toContain("طبيعي");
    expect(hasBlame(r.calibrationLine)).toBe(false);
  });

  it("بوابة لم تُجرَ بعد: لا نخترع نتيجة — وننتظر بصراحة", () => {
    const r = monthlyReport({
      reviewsThisMonth: 5,
      minutesThisMonth: 10,
      stats: [],
      selfEstimatePercent: 50,
      gateResultPercent: null,
      retentionNow: null,
    });
    expect(r.calibrationLine).toContain("50%");
    expect(r.calibrationLine).toContain("البوابة");
  });

  it("لا تقدير ولا بوابة: المعايرة تنتظر بصراحة — ولا أشرطة بلا بيانات (E18)", () => {
    const r = monthlyReport({
      reviewsThisMonth: 0,
      minutesThisMonth: 0,
      stats: [],
      selfEstimatePercent: null,
      gateResultPercent: null,
      retentionNow: null,
    });
    expect(r.calibrationLine).toContain("لم تُقدِّر");
    expect(r.skillsLine).toContain("لا نسب من العدم");
    expect(/\d/.test(r.monthLine)).toBe(false);
  });

  it("الأشرطة من البيانات الحقيقية: الأقوى (sprechen 7/8) والتركيز (schreiben 3/6)", () => {
    const r = monthlyReport({
      reviewsThisMonth: 20,
      minutesThisMonth: 60,
      stats: STATS,
      selfEstimatePercent: null,
      gateResultPercent: null,
      retentionNow: null,
    });
    expect(r.skillsLine).toContain("التحدث");
    expect(r.skillsLine).toContain("الكتابة");
  });

  it("منحنى النسيان: R = e^(−t/S) — 7 من 21 يوماً ≈ 72% — من حقيقتك", () => {
    const r = monthlyReport({
      reviewsThisMonth: 1,
      minutesThisMonth: 5,
      stats: [],
      selfEstimatePercent: null,
      gateResultPercent: null,
      retentionNow: { daysSinceReview: 7, stabilityDays: 21 },
    });
    expect(r.retentionLine).toContain("72%");
  });

  it("رفض نسب خارج 0..100 وأرقام سالبة (E18)", () => {
    const base = {
      reviewsThisMonth: 5,
      minutesThisMonth: 10,
      stats: [],
      retentionNow: null,
      selfEstimatePercent: null,
      gateResultPercent: null,
    };
    expect(() => monthlyReport({ ...base, selfEstimatePercent: 120 })).toThrow();
    expect(() => monthlyReport({ ...base, gateResultPercent: -5 })).toThrow();
    expect(() => monthlyReport({ ...base, reviewsThisMonth: -1 })).toThrow();
  });
});

describe("سطر الخريطة (§2.8) + حارس D23 الشامل", () => {
  it("سطر الخريطة: أين أنت + خطوتك التالية — بلا أرقام مخيفة", () => {
    const line = mapLine({ whereAr: "في منتصف الوحدة الثالثة", nextStepAr: "الأفعال المنفصلة" });
    expect(line).toContain("أنت الآن");
    expect(line).toContain("الأفعال المنفصلة");
    expect(hasBlame(line)).toBe(false);
  });

  it("سطر خريطة بحقول فارغة يُرفض", () => {
    expect(() => mapLine({ whereAr: " ", nextStepAr: "x" })).toThrow();
    expect(() => mapLine({ whereAr: "x", nextStepAr: "" })).toThrow();
  });

  it("D23 شامل: كل نص يمكن توليده عبر التقارير خالٍ من كلمات اللوم", () => {
    const texts: string[] = [];
    for (const days of [0, 1, 4, 7]) {
      texts.push(
        ...weeklyReport({
          daysWithMueller: days,
          reviewsDone: days * 5,
          minutesTotal: days * 10,
          wordsSecured: days,
          nextFocusAr: "اختبار",
        }).linesAr,
      );
    }
    texts.push(
      ...monthlyReport({
        reviewsThisMonth: 0,
        minutesThisMonth: 0,
        stats: [{ skill: "lesen", minutes: 1, itemsDone: 1, itemsCorrect: 0 }],
        selfEstimatePercent: 10,
        gateResultPercent: 95,
        retentionNow: { daysSinceReview: 1, stabilityDays: 1 },
      }).linesAr,
    );
    texts.push(mapLine({ whereAr: "بداية الطريق", nextStepAr: "الخطوة الأولى" }));
    expect(texts.length).toBeGreaterThan(10);
    for (const t of texts) {
      expect(hasBlame(t)).toBe(false);
      for (const w of BLAME_WORDS) expect(t).not.toContain(w);
    }
  });
});
