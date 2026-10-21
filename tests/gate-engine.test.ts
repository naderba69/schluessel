// gate-engine.test.ts — E17: بوابة كل 6 أسابيع + 4 مهارات + حدود صدق Goethe معلنة (§4)
import { describe, it, expect } from "vitest";
import {
  GATE_INTERVAL_WEEKS,
  buildGate,
  isGateWeek,
  gateSchedule,
  evaluateGate,
  INTERNAL_PASS_PERCENT,
} from "../src/lib/gate-engine.js";

describe("E17 — البوابة كل 6 أسابيع فقط", () => {
  it("أسبوع البوابة = 6/12/18 — والأسبوع العادي يُرمى فوراً", () => {
    expect(GATE_INTERVAL_WEEKS).toBe(6);
    expect(isGateWeek(6)).toBe(true);
    expect(isGateWeek(12)).toBe(true);
    expect(isGateWeek(7)).toBe(false);
    expect(() => buildGate(7)).toThrow(/ليس أسبوع بوابة/);
    expect(() => buildGate(0)).toThrow();
  });

  it("الجدول: بوابات فقط خلال الفترة — بلا اختبارات مفاجئة", () => {
    expect(gateSchedule(1, 13)).toEqual([6, 12]);
    expect(gateSchedule(1, 5)).toEqual([]);
    expect(() => gateSchedule(10, 5)).toThrow();
  });
});

describe("E17 — المهارات الأربع + حدود الصدق", () => {
  it("أقسام البوابة: Hören/Lesen/Schreiben/Sprechen دائماً", () => {
    const g = buildGate(6);
    expect(g.sections.map((s) => s.skill)).toEqual(["hoeren", "lesen", "schreiben", "sprechen"]);
    for (const s of g.sections) expect(s.noteAr).toBeTruthy();
  });

  it("N-029: صيغة Sprechen متحقق منها من وثائق Goethe — بلا needs-web-verify (§4)", () => {
    const g = buildGate(6);
    expect(g.sections.every((s) => s.formatSource !== "needs-web-verify")).toBe(true);
    const sp = g.sections.find((s) => s.skill === "sprechen")!;
    expect(sp.formatSource).toBe("goethe-verifiziert");
    expect(sp.noteAr).toContain("3 أجزاء");
    expect(sp.noteAr).toContain("صياغة طلب"); // Teil 3 = Bitten — لا «Plan» (ذاك A2 · N-139)
    expect(sp.noteAr).toContain("مجموعة ≤4 بلا تحضير");
    expect(g.overallNoteAr).toContain("تُعاد مراجعتها عند النشر");
  });

  it("التقييم: أربع نتائج إلزامية — والعتبة الداخلية معلنة لا مخفية", () => {
    const results = [
      { skill: "hoeren", percent: 80 },
      { skill: "lesen", percent: 75 },
      { skill: "schreiben", percent: 70 },
      { skill: "sprechen", percent: 65 },
    ] as const;
    const ev = evaluateGate(results);
    expect(ev.overall).toBe(false); // 65 < 70
    expect(ev.perSkill.find((p) => p.skill === "sprechen")!.passed).toBe(false);
    expect(ev.noteAr).toContain(String(INTERNAL_PASS_PERCENT));
    expect(() => evaluateGate(results.slice(0, 3))).toThrow(/ناقصة/);
  });
});
