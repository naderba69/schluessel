// reading.test.ts — E11: قفل المفردات (G1) + الترجمة بعد المحاولة (§2.5) + الإضاءة المتزامنة
import { describe, it, expect } from "vitest";
import {
  knownFormsFromWords,
  checkTextVocabulary,
  registerReadingText,
  readingFlow,
  tapTranslate,
  highlightAt,
  readingPick,
  splitSentences,
  toEngineText,
  tokenize,
  FUNCTION_WORD_FORMS,
  type ReadingText,
} from "../src/lib/reading.js";
import { loadFirstSession } from "../src/lesson-packs.js";
import { ALL_LESETEXTS } from "../src/lesson-packs.js";
const __FIRST = await loadFirstSession();
const firstLessonWords = __FIRST.direct;


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

describe("D281: نص الخميس الحر (ب-19)", () => {
  const unitOf = (id: string) => {
    const m = id.match(/^(A\d)-u(\d+)-d\d+$/i);
    return m ? { level: m[1]!.toUpperCase(), unit: Number(m[2]) } : undefined;
  };

  it("splitSentences: ألماني وعربي", () => {
    expect(splitSentences("Hallo! Wie geht es? Gut.")).toEqual(["Hallo!", "Wie geht es?", "Gut."]);
    expect(splitSentences("مرحباً! كيف حالك؟ بخير.")).toEqual(["مرحباً!", "كيف حالك؟", "بخير."]);
  });

  it("toEngineText: مقابلة الترتيب بالترتيب — والزائد يُسقَط بلا كسر", () => {
    const full = toEngineText({
      id: "t1", level: "A1", title: { de: "T", ar: "ت" }, text: { de: "Hallo! Tschüss.", ar: "مرحباً! وداعاً." },
    });
    expect(full.segments.map((s) => [s.de, s.ar])).toEqual([
      ["Hallo!", "مرحباً!"],
      ["Tschüss.", "وداعاً."],
    ]);
    const short = toEngineText({
      id: "t2", level: "A1", title: { de: "T", ar: "ت" }, text: { de: "Hallo! Tschüss. Danke.", ar: "مرحباً!" },
    });
    expect(short.segments).toHaveLength(1);
  });

  it("النصوص الخمسة عشر كلها متوازية الجمل (قفل)", () => {
    expect(ALL_LESETEXTS).toHaveLength(15);
    for (const t of ALL_LESETEXTS) {
      const de = splitSentences(t.text.de);
      const ar = splitSentences(t.text.ar);
      expect([t.id, de.length, ar.length]).toEqual([t.id, de.length, de.length]);
      expect(de.length).toBeGreaterThan(0);
    }
  });

  it("readingPick: نص أحدث وحدة مكتملة — ويتخطى بلا نص", () => {
    const texts = ALL_LESETEXTS.map((t) => ({ id: t.id, level: t.level, unit: t.unit }));
    expect(readingPick(texts, ["a1-u1-d1", "a1-u1-d6"], unitOf)?.id).toBe("a1-lese-u1");
    expect(readingPick(texts, ["a1-u1-d6", "a1-u2-d3"], unitOf)?.id).toBe("a1-lese-u2");
    expect(readingPick(texts, ["a1-u12-d6", "a1-u13-d1"], unitOf)?.id).toBe("a1-lese-u13"); // D292: u13 صار له نص
    const partial = texts.filter((t) => t.unit <= 12); // التخطي يُختبَر بقائمة ناقصة مصنوعة
    expect(readingPick(partial, ["a1-u12-d6", "a1-u13-d1"], unitOf)?.id).toBe("a1-lese-u12");
    expect(readingPick(partial, ["a1-u13-d1"], unitOf)).toBeUndefined();
    expect(readingPick(texts, [], unitOf)).toBeUndefined();
  });
});
