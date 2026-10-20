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
    expect(c.missedWords).toContain("Berlin"); // N-051: الرسم الأصلي لا الصغيرة
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

describe("N-051 (D229) — الكلمة الفائتة برسمها الأصلي (المقارنة تبقى كما هي)", () => {
  it("الاسم يُعرض مكبَّراً في المصفوفة وفي نص التلميح", () => {
    const c = compareDictation("Ich trinke Kaffee", "Ich trinke");
    expect(c.missedWords).toEqual(["Kaffee"]);
    expect(c.feedback).toContain("Kaffee");
    expect(c.feedback).not.toContain("kaffee");
  });

  it("ترقيم الجملة الملتصق يُسقط من العرض (للجملة لا للكلمة)", () => {
    const c = compareDictation("Kennst du das Wort?", "Kennst du das");
    expect(c.missedWords).toEqual(["Wort"]);
  });

  it("المقارنة لم تتغير: الصغيرة المكتوبة تطابق المكبَّرة المسموعة", () => {
    const c = compareDictation("Ich trinke Kaffee", "ich trinke kaffee");
    expect(c.status).toBe("minor"); // فرق التهجئة فقط
    expect(c.missedWords).toEqual([]);
    const d = compareDictation("Ich trinke Kaffee", "Ich trinke Kaffee");
    expect(d.status).toBe("correct");
  });
});
