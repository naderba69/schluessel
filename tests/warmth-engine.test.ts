// warmth-engine.test.ts — E08 محرك الدفء: تقرير مسائي + معاينة غد + رسائل مولر — صفر لوم (D23)
import { describe, it, expect } from "vitest";
import {
  BLAME_WORDS,
  hasBlame,
  eveningReport,
  tomorrowPreview,
  MULLER_MESSAGES,
  muellerMessage,
} from "../src/lib/warmth-engine.js";

describe("E08 — التقرير المسائي (F011: سطر واحد هادئ)", () => {
  it("سطر واحد، يذكر النوم شريك التثبيت، وخالٍ من اللوم", () => {
    const r = eveningReport({ cardsReviewed: 12, trapsNoticed: 2 });
    expect(r).not.toContain("\n");
    expect(r).toContain("النوم شريكك");
    expect(hasBlame(r)).toBe(false);
  });

  it("يوم بلا بطاقات: لا وهم ولا لوم — ترحيب هادئ", () => {
    const r = eveningReport({ cardsReviewed: 0, trapsNoticed: 0 });
    expect(hasBlame(r)).toBe(false);
    expect(r).not.toContain("سلسلة");
    expect(r.length).toBeGreaterThan(10);
  });
});

describe("E08 — معاينة الغد (F012: جملة واحدة)", () => {
  it("تختلف بحسب الغد — وكل الصيغ هادئة بلا إلحاح", () => {
    const withNew = tomorrowPreview({ hasNewContent: true, dueCount: 5 });
    const withoutNew = tomorrowPreview({ hasNewContent: false, dueCount: 0 });
    expect(withNew).toContain("غداً");
    expect(withNew).toContain("كلمات جديدة");
    expect(withoutNew).toContain("لا مراجعات مستحقة");
    expect(withNew).not.toEqual(withoutNew);
    for (const t of [withNew, withoutNew]) {
      expect(hasBlame(t)).toBe(false);
      expect(t).not.toContain("\n");
    }
  });
});

describe("E08 — رسائل مولر المتنوعة (D23 — بلا سلاسل ضغط)", () => {
  it("متنوعة (≥6) وكلها خالية من اللوم والضغط", () => {
    expect(MULLER_MESSAGES.length).toBeGreaterThanOrEqual(6);
    for (const m of MULLER_MESSAGES) expect(hasBlame(m)).toBe(false);
  });

  it("الاختيار حتمي ومتنوع عبر الأيام", () => {
    expect(muellerMessage(0)).toBe(MULLER_MESSAGES[0]);
    expect(muellerMessage(MULLER_MESSAGES.length)).toBe(MULLER_MESSAGES[0]); // يدور
    expect(muellerMessage(1)).not.toBe(muellerMessage(2));
    expect(muellerMessage(-1)).toBe(MULLER_MESSAGES[MULLER_MESSAGES.length - 1]);
  });

  it("الحارس الحاسم: صفر سلاسل/صفر توبيخ في كل نص يُولَّد (مسح شامل)", () => {
    // كل الرسائل + كل تقارير/معاينات ممثلة — يمسحها الحارس آلياً
    const generated: string[] = [...MULLER_MESSAGES];
    for (const cards of [0, 1, 12, 120])
      for (const traps of [0, 1, 5])
        generated.push(eveningReport({ cardsReviewed: cards, trapsNoticed: traps }));
    for (const hasNew of [true, false])
      for (const due of [0, 3, 40])
        generated.push(tomorrowPreview({ hasNewContent: hasNew, dueCount: due }));
    for (const text of generated) {
      expect(hasBlame(text)).toBe(false);
      expect(text).not.toContain("\n");
    }
  });

  it("قائمة الممنوعات تكشف الضغط واللوم (حارس يُختبر ذاتياً)", () => {
    expect(hasBlame("خسرت سلسلتك!")).toBe(true);
    expect(hasBlame("أنت متأخر عن الخطة")).toBe(true);
    expect(hasBlame("فشل ذريع")).toBe(true);
    expect(hasBlame("لا تقلق — نستأنف بلطف")).toBe(false);
    expect(BLAME_WORDS).toContain("سلسلة");
  });
});
