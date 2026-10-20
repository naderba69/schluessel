// dictation-engine.test.ts — E07 النسخ المسموع: تدفق + مقارنة + تصحيح لطيف (F077)
import { describe, it, expect } from "vitest";
import {
  DICTATION_STEPS,
  dictationFlowValid,
  compareDictation,
  feedbackIsGentle,
} from "../src/lib/dictation-engine.js";

describe("E07 — تدفق النسخ (استمع ← اكتب ← اكشف ← قارن)", () => {
  it("التدفق السليم مقبول — وأي انعكاس مرفوض (محاولة قبل كشف)", () => {
    expect([...DICTATION_STEPS]).toEqual(["listen", "write", "reveal", "compare"]);
    expect(dictationFlowValid(["listen", "write", "reveal", "compare"])).toBe(true);
    expect(dictationFlowValid(["listen", "listen", "write", "write", "reveal", "compare"])).toBe(true);
    expect(dictationFlowValid(["write", "listen", "reveal", "compare"])).toBe(false); // كتابة قبل استماع
    expect(dictationFlowValid(["listen", "reveal", "write", "compare"])).toBe(false); // كشف قبل كتابة
    expect(dictationFlowValid(["listen", "write", "compare"])).toBe(false); // مقارنة قبل كشف
    expect(dictationFlowValid([])).toBe(false); // جلسة نسخ فارغة = مرفوضة
  });
});

describe("E07 — المقارنة والتصحيح اللطيف (F077 — لا علامات حمراء)", () => {
  it("تطابق تام → correct بتشجيع", () => {
    const c = compareDictation("Ich heiße Yusuf.", "Ich heiße Yusuf.");
    expect(c.status).toBe("correct");
    expect(c.missedWords).toEqual([]);
    expect(feedbackIsGentle(c.feedback)).toBe(true);
  });

  it("فرق أحرف كبيرة فقط → minor مع شرح «لماذا»", () => {
    const c = compareDictation("Ich wohne in Berlin.", "Ich wohne in berlin.");
    expect(c.status).toBe("minor");
    expect(c.feedback).toContain("حرف كبير"); // يشرح السبب (F077)
    expect(feedbackIsGentle(c.feedback)).toBe(true);
  });

  it("نصف الكلمات مطابق → minor يسمّي الناقصة", () => {
    const c = compareDictation("Ich wohne in Berlin", "Ich wohne in");
    expect(c.status).toBe("minor");
    expect(c.missedWords).toContain("berlin");
    expect(c.feedback).toContain("أعد سماع");
    expect(feedbackIsGentle(c.feedback)).toBe(true);
  });

  it("بعيد عن النص → retry بـ«لا بأس» — بلا لوم أبداً", () => {
    const c = compareDictation("Der Hund schläft auf dem Sofa", "ja");
    expect(c.status).toBe("retry");
    expect(c.feedback).toContain("لا بأس");
    expect(feedbackIsGentle(c.feedback)).toBe(true);
  });

  it("حارس F077/D23: كل مخرجات المقارنة خالية من اللوم وأسطر واحدة", () => {
    const samples = [
      compareDictation("Guten Morgen", "Guten Morgen"),
      compareDictation("Guten Morgen", "guten morgen"),
      compareDictation("Guten Morgen zusammen", "Guten Morgen"),
      compareDictation("Guten Morgen zusammen", "x"),
    ];
    for (const c of samples) expect(feedbackIsGentle(c.feedback)).toBe(true);
  });
});
