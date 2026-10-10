// play-engine.test.ts — E20: الألعاب من مفرداتك المدروسة فقط + بلا ضغط (D23)
import { describe, it, expect } from "vitest";
import {
  makeWordle,
  guessFeedback,
  makeStory,
  makeAnagram,
  isStudied,
  PLAY_RULES_AR,
} from "../src/lib/play-engine.js";
import { BLAME_WORDS } from "../src/lib/warmth-engine.js";

const studied = ["hallo", "danke", "bitte", "wohnen", "tschuess"];

describe("E20 — Wordle من مفرداتي فقط", () => {
  it("الكلمة من المدروسة فعلاً — وكلمات غير صالحة = رفض", () => {
    const w = makeWordle(studied);
    expect(studied.map((x) => x.toLowerCase())).toContain(w.word);
    expect(() => makeWordle(["ab", "xyz"])).toThrow(/5 حروف/);
    expect(() => makeWordle([])).toThrow();
  });

  it("تغذية التخمين: أخضر في مكانه · أصفر موجود · رمادي غائب", () => {
    expect(guessFeedback("hallo", "hallo")).toEqual(["green", "green", "green", "green", "green"]);
    expect(guessFeedback("xxxxx", "hallo")).toEqual(["gray", "gray", "gray", "gray", "gray"]);
    expect(guessFeedback("xxxxa", "hallo")).toEqual(["gray", "gray", "gray", "gray", "yellow"]);
    expect(() => guessFeedback("ha", "hallo")).toThrow();
  });
});

describe("E20 — القصة واللغز والقواعد", () => {
  it("القصة: كل الكلمات المملوءة من المدروسة — ونقص المفردات = رفض", () => {
    const s = makeStory(studied, "يومي", [
      { textAr: "أبدأ يومي بـ", blank: { id: "b1", ar: "تحية" } },
      { textAr: "ثم أقول", blank: { id: "b2", ar: "شكراً" } },
    ]);
    expect(s.fillWords.every((w) => isStudied(w, studied))).toBe(true);
    expect(() => makeStory([], "قصة فارغة", [{ textAr: "x", blank: { id: "b", ar: "y" } }])).toThrow();
  });

  it("اللغز من مفرداتي — وحارس isStudied يرفض الغريب", () => {
    const a = makeAnagram(studied);
    expect(isStudied(a.answer, studied)).toBe(true);
    expect(isStudied("Schule", studied)).toBe(false);
    expect(() => makeAnagram(["ab"])).toThrow();
  });

  it("قواعد اللعب: بلا مؤقت وبلا ضغط — صفر كلمات ضغط (D23)", () => {
    expect(PLAY_RULES_AR).toHaveLength(3);
    for (const r of PLAY_RULES_AR) for (const w of BLAME_WORDS) expect(r).not.toContain(w);
    for (const w of ["أسرع", "سريع", "عاجل", "احترق"]) {
      for (const r of PLAY_RULES_AR) expect(r).not.toContain(w);
    }
  });
});
