// data-engine.test.ts — E21: استعادة كاملة round-trip + بصمة سلامة تكشف التلاعب (F210–F219)
import { describe, it, expect } from "vitest";
import { exportJson, exportCsv, fingerprint, restore, roundTrip } from "../src/lib/data-engine.js";

const learner = {
  name: "يوسف",
  profile: { level: "A1", streak: 3 },
  words: ["hallo", "danke", "wohnen"],
};

describe("E21 — الدورة الكاملة: تصدير ← استعادة", () => {
  it("round-trip: ما يُصدَّر يُستعاد بعمق مطابق تماماً", () => {
    const { restored, fp } = roundTrip(learner);
    expect(restored).toEqual(learner);
    expect(fp).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("البصمة تكشف أي تعديل — لا استعادة عمياء", () => {
    const json = exportJson(learner);
    const fp = fingerprint(json);
    const tampered = json.replace("يوسف", "أحمد");
    expect(() => restore(tampered, fp)).toThrow(/بصمة السلامة/);
    expect(restore(json, fp)).toEqual(learner); // الأصل سليم
  });
});

describe("E21 — تصدير CSV", () => {
  it("رأس معلن + صفوف — والمحارف الخاصة مؤمّنة", () => {
    const csv = exportCsv([
      { word: "hallo", reviews: 3 },
      { word: "danke", reviews: 1, note: 'يقول "شكراً"' },
    ]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("word,reviews,note");
    expect(lines[1]).toBe("hallo,3,");
    expect(lines[2]).toContain('""شكراً""'); // علامات التنصيص مهربة
    expect(() => exportCsv([])).toThrow();
  });
});
