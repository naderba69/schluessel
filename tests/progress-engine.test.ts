// progress-engine.test.ts — E18: الأرقام من بياناتك الحقيقية فقط + منحنى النسيان (Ebbinghaus)
import { describe, it, expect } from "vitest";
import {
  skillBars,
  retention,
  monthlyEstimate,
  progressSnapshot,
} from "../src/lib/progress-engine.js";

describe("E18 — أشرطة المهارات من بيانات حقيقية فقط", () => {
  it("بلا بيانات = رفض فوري — لا أرقام من العدم", () => {
    expect(() => skillBars([])).toThrow(/لا أرقام من العدم/);
  });

  it("النسب محسوبة من itemsDone/itemsCorrect الفعلية — لا مزيد", () => {
    const bars = skillBars([
      { skill: "hoeren", minutes: 30, itemsDone: 10, itemsCorrect: 8 },
      { skill: "lesen", minutes: 12, itemsDone: 4, itemsCorrect: 4 },
    ]);
    expect(bars[0]!.accuracy).toBe(0.8);
    expect(bars[1]!.accuracy).toBe(1);
    expect(bars[0]!.labelAr).toBe("الاستماع");
  });

  it("بيانات غير منطقية (صحيح > منجز) = خطأ فوري", () => {
    expect(() => skillBars([{ skill: "lesen", minutes: 1, itemsDone: 2, itemsCorrect: 3 }])).toThrow();
    expect(() => skillBars([{ skill: "lesen", minutes: -1, itemsDone: 2, itemsCorrect: 1 }])).toThrow();
  });
});

describe("E18 — منحنى النسيان والتقدير الشهري", () => {
  it("الاحتفاظ R = e^(−t/S): يوم بلا مراجعة بثبات 10 = ~0.90", () => {
    expect(retention(0, 10)).toBeCloseTo(1, 5);
    expect(retention(10, 10)).toBeCloseTo(Math.exp(-1), 5);
    expect(() => retention(-1, 10)).toThrow();
    expect(() => retention(1, 0)).toThrow();
  });

  it("التقدير الشهري يصرّح بمصدره — وصفر مراجعات = رسالة صادقة", () => {
    expect(monthlyEstimate(0, 0).noteAr).toContain("لا مراجعات");
    const m = monthlyEstimate(24, 90);
    expect(m.reviews).toBe(24);
    expect(m.noteAr).toContain("بياناتك أنت");
  });

  it("اللقطة المجمعة: كل رقم مربوط بمبدأه", () => {
    const snap = progressSnapshot([{ skill: "sprechen", minutes: 5, itemsDone: 2, itemsCorrect: 1 }], 3, 15);
    expect(snap.bars).toHaveLength(1);
    expect(snap.principleAr).toContain("نشاطك الفعلي");
  });
});
