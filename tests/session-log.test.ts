// session-log.test.ts — N-007 (D228): سجل الجلسة اليومي — إدخال واحد لليوم، الدقائق تتراكم، الكلمات حدّ أعلى
import { describe, it, expect } from "vitest";
import { dailyDoseForChoice, doseForMinutes, maxDose, readPlannedDose, recordSession, writePlannedDose } from "../src/lib/session-log.js";

describe("N-007 — شريحة الجرعة من الدقائق (حدودها أسماء الشفرة)", () => {
  it("العتبات الأربع حرفياً", () => {
    expect(doseForMinutes(0)).toBe("emergency-10");
    expect(doseForMinutes(44)).toBe("emergency-10");
    expect(doseForMinutes(45)).toBe("minimum-45");
    expect(doseForMinutes(89)).toBe("minimum-45");
    expect(doseForMinutes(90)).toBe("target-90");
    expect(doseForMinutes(119)).toBe("target-90");
    expect(doseForMinutes(120)).toBe("ideal-120");
    expect(doseForMinutes(300)).toBe("ideal-120");
  });
});

describe("N-007 — recordSession: upsert بالتاريخ", () => {
  it("أول حصة في اليوم تُنشئ إدخالاً بشريحة مستنتجة", () => {
    const out = recordSession([], { date: "2026-10-20", durationMinutes: 50, wordsNew: 18 });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ date: "2026-10-20", dose: "minimum-45", durationMinutes: 50, wordsNew: 18 });
  });

  it("حصة ثانية في اليوم نفسه: الدقائق تُجمع والكلمات حدّ أعلى والجرعة الأعلى تُحفَظ (D274)", () => {
    const once = recordSession([], { date: "2026-10-20", durationMinutes: 50, wordsNew: 18 });
    const twice = recordSession(once, { date: "2026-10-20", durationMinutes: 30, wordsNew: 18 });
    expect(twice).toHaveLength(1);
    expect(twice[0]).toMatchObject({ durationMinutes: 80, wordsNew: 18, dose: "minimum-45" });
  });

  it("يوم جديد يُلحق إدخالاً ولا يمسّ القديم", () => {
    const once = recordSession([], { date: "2026-10-20", durationMinutes: 50 });
    const out = recordSession(once, { date: "2026-10-21", durationMinutes: 10 });
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ date: "2026-10-20", durationMinutes: 50 });
    expect(out[1]).toMatchObject({ date: "2026-10-21", durationMinutes: 10 });
  });

  it("مدة سالبة/غير عدد تُرفض (لا إدخال فاسد)", () => {
    expect(() => recordSession([], { date: "2026-10-20", durationMinutes: -5 })).toThrow();
    expect(() => recordSession([], { date: "2026-10-20", durationMinutes: NaN })).toThrow();
  });
});

describe("D274 — الجرعة المخططة", () => {
  it("dailyDoseForChoice: 45/90/120 فقط — خارجها خطأ صريح", () => {
    expect(dailyDoseForChoice(45)).toBe("minimum-45");
    expect(dailyDoseForChoice(90)).toBe("target-90");
    expect(dailyDoseForChoice(120)).toBe("ideal-120");
    expect(() => dailyDoseForChoice(60)).toThrow();
  });

  it("maxDose: الأعلى تُحفَظ (مصغّرة لاحقة لا تُخفّض يوماً كاملاً)", () => {
    expect(maxDose("target-90", "emergency-10")).toBe("target-90");
    expect(maxDose("minimum-45", "ideal-120")).toBe("ideal-120");
  });

  it("جرعة مخططة تُسجَّل كما خُططت لا كما أُنجز", () => {
    const out = recordSession([], { date: "2026-10-22", dose: "target-90", durationMinutes: 50 });
    expect(out[0]).toMatchObject({ dose: "target-90", durationMinutes: 50 });
  });

  it("بلا localStorage (node): الافتراضي 90 والكتابة صامتة", () => {
    expect(readPlannedDose("2026-10-22")).toBe(90);
    expect(() => writePlannedDose("2026-10-22", 45)).not.toThrow();
  });
});

describe("D275 — سطر التأمل", () => {
  it("يُحفَظ مع الإدخال الجديد", () => {
    const out = recordSession([], {
      date: "2026-10-22",
      durationMinutes: 30,
      reflection: { learned: "الماضي", tomorrow: "الأرقام" },
    });
    expect(out[0]!.reflection).toEqual({ learned: "الماضي", tomorrow: "الأرقام" });
  });

  it("التحديث الجزئي يُدمَج ولا يمحو (دقائق صفر مسموحة)", () => {
    const once = recordSession([], {
      date: "2026-10-22",
      durationMinutes: 30,
      reflection: { learned: "الماضي", tomorrow: "الأرقام" },
    });
    const twice = recordSession(once, {
      date: "2026-10-22",
      durationMinutes: 0,
      reflection: { tomorrow: "الجمع" },
    });
    expect(twice[0]).toMatchObject({ durationMinutes: 30 });
    expect(twice[0]!.reflection).toEqual({ learned: "الماضي", tomorrow: "الجمع" });
  });

  it("الفارغ يُتجاهَل — لا يمحو ولا يُنشئ", () => {
    const once = recordSession([], { date: "2026-10-22", durationMinutes: 30, reflection: { learned: "x" } });
    const twice = recordSession(once, { date: "2026-10-22", durationMinutes: 0, reflection: { learned: "  " } });
    expect(twice[0]!.reflection).toEqual({ learned: "x" });
    const fresh = recordSession([], { date: "2026-10-22", durationMinutes: 30, reflection: { learned: " " } });
    expect(fresh[0]!.reflection).toBeUndefined();
  });
});

describe("D276 — توقيعات Can-do تُدمَج بالنص", () => {
  it("الجديد يُزرَع مع التوقيع", () => {
    const once = recordSession([], {
      date: "2026-10-23",
      durationMinutes: 45,
      canDoTicks: [{ statement: "أحيي", done: true }],
    });
    expect(once[0]!.canDoTicks).toEqual([{ statement: "أحيي", done: true }]);
  });

  it("توقيع ثانٍ يُلحَق ولا يمحو الأول", () => {
    const once = recordSession([], {
      date: "2026-10-23",
      durationMinutes: 45,
      canDoTicks: [{ statement: "أحيي", done: true }],
    });
    const twice = recordSession(once, {
      date: "2026-10-23",
      durationMinutes: 0,
      canDoTicks: [{ statement: "أودع", done: false }],
    });
    expect(twice[0]!.canDoTicks).toEqual([
      { statement: "أحيي", done: true },
      { statement: "أودع", done: false },
    ]);
  });

  it("إعادة التوقيع على النص نفسه تُحدِّث الحالة", () => {
    const once = recordSession([], {
      date: "2026-10-23",
      durationMinutes: 45,
      canDoTicks: [{ statement: "أحيي", done: true }],
    });
    const twice = recordSession(once, {
      date: "2026-10-23",
      durationMinutes: 0,
      canDoTicks: [{ statement: "  أحيي  ", done: false }],
    });
    expect(twice[0]!.canDoTicks).toEqual([{ statement: "أحيي", done: false }]);
  });

  it("الفارغ يُتجاهَل", () => {
    const once = recordSession([], {
      date: "2026-10-23",
      durationMinutes: 45,
      canDoTicks: [{ statement: "   ", done: true }],
    });
    expect(once[0]!.canDoTicks).toEqual([]);
  });
});

describe("D281 — دقائق القراءة تتراكم", () => {
  it("تُزرَع مع الجديد وتتراكم مع القديم", () => {
    const once = recordSession([], { date: "2026-10-22", durationMinutes: 10, readingMinutes: 4 });
    expect(once[0]!.readingMinutes).toBe(4);
    const twice = recordSession(once, { date: "2026-10-22", durationMinutes: 5, readingMinutes: 3 });
    expect(twice[0]!.readingMinutes).toBe(7);
    expect(twice[0]!.durationMinutes).toBe(15);
  });

  it("الغائب = صفر لا undefined", () => {
    const once = recordSession([], { date: "2026-10-22", durationMinutes: 10 });
    expect(once[0]!.readingMinutes).toBe(0);
  });
});
