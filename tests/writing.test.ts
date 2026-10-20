// writing.test.ts — E12: تصحيح يشرح «لماذا» دائماً + جملة اليوم + يوميات — صفر لوم (D23)
import { describe, it, expect } from "vitest";
import {
  GOLDEN_RULES,
  correctSentence,
  gentleWrap,
  sentenceOfTheDay,
  diaryPrompt,
} from "../src/lib/writing.js";
import { BLAME_WORDS } from "../src/lib/warmth-engine.js";

describe("E12 — التصحيح اللطيف يشرح السبب دائماً (Hattie & Timperley)", () => {
  it("المصيدة الذهبية: von → aus مع شرح السبب", () => {
    const c = correctSentence("Ich komme von Tunesien.");
    expect(c.corrected).toBe("Ich komme aus Tunesien.");
    expect(c.fixes[0]!.whyAr).toContain("aus");
    expect(c.fixes[0]!.whyAr).toContain("von");
  });

  it("حذف الفعل: «Ich Yusuf.» → «Ich heiße Yusuf» + سبب", () => {
    const c = correctSentence("Ich Yusuf.");
    expect(c.corrected).toBe("Ich heiße Yusuf.");
    expect(c.fixes[0]!.whyAr).toContain("فعل");
  });

  it("تصريف du: «Wie heiße du?» → «Wie heißt du?» — والصيغة الصحيحة لا تُمسّ", () => {
    const c = correctSentence("Wie heiße du?");
    expect(c.corrected).toBe("Wie heißt du?");
    expect(correctSentence("Wie heißt du?").fixes).toEqual([]);
    expect(correctSentence("Ich heiße Yusuf.").fixes).toEqual([]); // heiße مع ich صحيحة
  });

  it("كل تصحيح يحمل «لماذا» غير فارغ — وكل قاعدة مبنية كذلك", () => {
    for (const r of GOLDEN_RULES) expect(r.whyAr.trim()).not.toBe("");
    const c = correctSentence("Ich komme von Deutschland und du heiße Maria.");
    for (const f of c.fixes) expect(f.whyAr.trim()).not.toBe("");
  });

  it("صفر لوم في العبارات — والجملة السليمة تُشاد بها", () => {
    const c = correctSentence("Ich komme von Tunesien.");
    const wrapped = gentleWrap(c);
    for (const w of BLAME_WORDS) expect(wrapped).not.toContain(w);
    expect(gentleWrap(correctSentence("Ich heiße Yusuf."))).toContain("سليمة");
    expect(() => gentleWrap({ input: "x", corrected: "أنت كسول", fixes: [], tone: "gentle" })).toThrow();
  });
});

describe("E12 — جملة اليوم واليوميات", () => {
  const words = [{ de: "hallo", ar: "مرحبا" }, { de: "danke", ar: "شكراً" }];

  it("جملة اليوم حتمية من كلمات الدرس (تناوب منتظم)", () => {
    expect(sentenceOfTheDay(words, 0).focusWord).toBe("hallo");
    expect(sentenceOfTheDay(words, 1).focusWord).toBe("danke");
    expect(sentenceOfTheDay(words, 2).focusWord).toBe("hallo");
    expect(() => sentenceOfTheDay([], 0)).toThrow();
  });

  it("يوميات A1: هيكل لطيف بتلميحات — بلا إجبار", () => {
    const p = diaryPrompt("A1");
    expect(p.titleDe).toBe("Mein Tag");
    expect(p.hintsAr.length).toBeGreaterThan(0);
    for (const h of p.hintsAr) for (const w of BLAME_WORDS) expect(h).not.toContain(w);
  });
});
