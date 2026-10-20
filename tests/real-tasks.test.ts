// real-tasks.test.ts — E15: كل مهمة بهدف تواصلي معلن (Ellis) + التدفق: هدف ← محاولة ← نموذج
import { describe, it, expect } from "vitest";
import {
  A1_TASKS,
  registerTask,
  taskFlow,
  evaluateTask,
  type RealTask,
} from "../src/lib/real-tasks.js";

describe("E15 — المهام الثلاث (المقهى/القطار/الصيدلية)", () => {
  it("كل مهمة: هدف تواصلي معلن + حوار كامل + معايير نجاح", () => {
    for (const t of A1_TASKS) {
      expect(() => registerTask(t)).not.toThrow();
      expect(t.goalAr.trim()).not.toBe("");
      expect(t.dialogue.length).toBeGreaterThanOrEqual(3);
      expect(t.successCriteriaAr.length).toBeGreaterThan(0);
    }
    expect(A1_TASKS.map((t) => t.setting)).toEqual(["kafee", "bahnhof", "apotheke"]);
  });

  it("الحوار يضم الطرفين A وB — والترجمة لكل جملة (D31: أسماء حيّة A/B)", () => {
    for (const t of A1_TASKS) {
      const speakers = new Set(t.dialogue.map((l) => l.speaker));
      expect(speakers.has("A")).toBe(true);
      expect(speakers.has("B")).toBe(true);
      for (const l of t.dialogue) {
        expect(l.de.trim()).not.toBe("");
        expect(l.ar.trim()).not.toBe("");
      }
    }
  });

  it("مهمة بلا هدف = مرفوضة — وحوار فارغ = مرفوض (التسجيل مغلق)", () => {
    const bare: RealTask = { ...A1_TASKS[0]!, goalAr: "  ", id: "x" };
    expect(() => registerTask(bare)).toThrow(/هدف/);
    expect(() => registerTask({ ...A1_TASKS[0]!, dialogue: [] })).toThrow(/حوار/);
    expect(() => registerTask({ ...A1_TASKS[0]!, successCriteriaAr: [] })).toThrow(/معايير/);
  });
});

describe("E15 — التدفق والتقييم", () => {
  it("الهدف يُعلن أولاً — والنموذج يأتي بعد المحاولة (§2.5)", () => {
    const kinds = taskFlow(A1_TASKS[0]!).map((s) => s.kind);
    expect(kinds).toEqual(["goal", "attempt", "model", "retry"]);
    expect(kinds.indexOf("model")).toBeGreaterThan(kinds.indexOf("attempt"));
  });

  it("التقييم بمعايير النجاح المعلنة فقط — الناقص يُصرَّح به", () => {
    const t = A1_TASKS[0]!;
    const partial = [t.successCriteriaAr[0]!];
    const r = evaluateTask(t, partial);
    expect(r.success).toBe(false);
    expect(r.missing.length).toBe(t.successCriteriaAr.length - 1);
    expect(evaluateTask(t, t.successCriteriaAr).success).toBe(true);
  });
});
