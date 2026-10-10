// reading.test.ts — E11: قفل المفردات (G1) + الترجمة بعد المحاولة (§2.5) + الإضاءة المتزامنة
import { describe, it, expect } from "vitest";
import {
  knownFormsFromWords,
  checkTextVocabulary,
  registerReadingText,
  readingFlow,
  tapTranslate,
  highlightAt,
  tokenize,
  FUNCTION_WORD_FORMS,
  type ReadingText,
} from "../src/lib/reading.js";
import { firstLessonWords } from "../src/lesson-packs.js";

const text: ReadingText = {
  id: "a1-text-1",
  level: "A1",
  titleDe: "Hallo",
  titleAr: "تحية",
  segments: [
    { id: "s1", de: "Hallo! Ich heiße Yusuf.", ar: "مرحبا! اسمي يوسف.", focusWordIds: ["hallo", "heissen"] },
    { id: "s2", de: "Ich wohne in Tunesien.", ar: "أنا أسكن في تونس.", focusWordIds: ["wohnen", "tunesien"] },
  ],
};

describe("E11 — قفل المفردات: كل نص ضمن مفردات مرحلته", () => {
  // extra = أشكال تدرّبها الحصة فعلاً: الاسم «Yusuf» + المضارع الأول (heiße/wohne — بيانات الكلمات تسجّل 3s فقط)
  const known = knownFormsFromWords(firstLessonWords, ["yusuf", "heiße", "wohne"]);

  it("نص A1 يمر على مفردات الدرس — و«lerne» غير مدروسة تُرفض", () => {
    expect(checkTextVocabulary(tokenize("Hallo ich heiße Yusuf"), known)).toEqual([]);
    // lernen ليس ضمن كلمات الدرس الـ15
    const bad = checkTextVocabulary(tokenize("Ich lerne Deutsch"), known);
    expect(bad).toEqual(["lerne"]);
  });

  it("التسجيل يرمي فوراً عند تجاوز المفردات (G1)", () => {
    expect(registerReadingText(text, known)).toBe(text);
    const badText = { ...text, segments: [{ id: "s3", de: "Ich lerne Deutsch", ar: "أتعلم", focusWordIds: [] }] };
    expect(() => registerReadingText(badText, known)).toThrow(/lerne/);
  });

  it("الكلمات الوظيفية مسموحة دائماً + أشكال التصريف تُحسب", () => {
    expect(FUNCTION_WORD_FORMS.has("ich")).toBe(true);
    expect(known.has("heißt")).toBe(true); // praesens3s لـheissen
    expect(known.has("kommt")).toBe(true); // praesens3s لـkommen
  });
});

describe("E11 — الترجمة بعد المحاولة + الإضاءة المتزامنة", () => {
  it("التدفق: جوهر ← قراءة ثانية ← ترجمة بالنقر (لا ترجمة قبل المحاولة)", () => {
    const steps = readingFlow(text);
    const kinds = steps.map((s) => s.kind);
    expect(kinds[0]).toBe("gist");
    expect(kinds.indexOf("tap-translate")).toBeGreaterThan(kinds.indexOf("gist"));
  });

  it("النقر للترجمة يعيد المقاطع — ومقطع مجهول = خطأ", () => {
    expect(tapTranslate(text, "s2").ar).toContain("تونس");
    expect(() => tapTranslate(text, "xx")).toThrow();
  });

  it("الإضاءة تتبع تقدّم القراءة (0..1) — وخارج النطاق = لا شيء", () => {
    expect(highlightAt(text.segments, 0.1)?.id).toBe("s1");
    expect(highlightAt(text.segments, 0.9)?.id).toBe("s2");
    expect(highlightAt(text.segments, 1.5)).toBeNull();
    expect(highlightAt([], 0.5)).toBeNull();
  });
});
