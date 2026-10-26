// progress-engine.test.ts — E18: الأرقام من بياناتك الحقيقية فقط + منحنى النسيان (Ebbinghaus)
import { describe, it, expect } from "vitest";
import {
  skillBars,
  retention,
  monthlyEstimate,
  progressSnapshot,
  buildProgressMap,
  levelBar,
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

describe("الخريطة الهادئة §2.8 (N-149 · D249)", () => {
  const index = [
    { id: "a1-u1-d1", level: "A1", unit: 1, day: 1 },
    { id: "a1-u1-d2", level: "A1", unit: 1, day: 2 },
    { id: "a2-u1-d1", level: "A2", unit: 1, day: 1 },
  ];
  const base = {
    index, completedIds: [] as string[], availableIds: ["a1-u1-d1"], currentId: "a1-u1-d1",
    createdAtDay: "2026-10-21", todayDay: "2026-10-21",
  };

  it("المستويات من الفهرس: A1 درسان وA2 درس وB1/B2 صفران", () => {
    const map = buildProgressMap(base);
    expect(map.levels).toEqual([
      { level: "A1", total: 2, done: 0 },
      { level: "A2", total: 1, done: 0 },
      { level: "B1", total: 0, done: 0 },
      { level: "B2", total: 0, done: 0 },
    ]);
    expect(map.unit).toEqual({ level: "A1", unit: 1 });
    expect(map.unitDays).toEqual([
      { day: 1, status: "available" },
      { day: 2, status: "locked" },
    ]);
    expect(map.pathComplete).toBe(false);
  });

  it("المكتمل يُحتسب والشريط بعرض ثابت (غير المنشور null)", () => {
    const map = buildProgressMap({ ...base, completedIds: ["a1-u1-d1"], availableIds: ["a1-u1-d2"], currentId: "a1-u1-d2" });
    expect(map.levels[0]).toEqual({ level: "A1", total: 2, done: 1 });
    expect(levelBar(map.levels[0]!)).toBe("▓▓▓▓▓░░░░░");
    expect(levelBar(map.levels[2]!)).toBeNull();
  });

  it("الأسبوع من تاريخ البدء والبوابة كل 6 (الأسبوع 6 بوابة)", () => {
    expect(buildProgressMap(base).weekNumber).toBe(1);
    expect(buildProgressMap(base).nextGateWeek).toBe(6);
    expect(buildProgressMap(base).gateWeek).toBe(false);
    const w6 = buildProgressMap({ ...base, todayDay: "2026-11-25" }); // +35 يوم = الأسبوع 6
    expect(w6.weekNumber).toBe(6);
    expect(w6.gateWeek).toBe(true);
    expect(w6.nextGateWeek).toBe(6);
  });

  it("بلا درس حالي = إكمال المسار (وحدة null)", () => {
    const map = buildProgressMap({ ...base, currentId: null });
    expect(map.pathComplete).toBe(true);
    expect(map.unit).toBeNull();
    expect(map.unitDays).toEqual([]);
  });
});
