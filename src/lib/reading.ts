// reading.ts — E11 محرك القراءة | M2-أ
// المصادر: extensive/graded reading (Krashen input) · G1 («كل نص A1 ضمن مفردات مرحلته») · §2.5 (المحاولة قبل الكشف)
// الوظيفة: نص متدرج + إضاءة متزامنة (محاذاة كلمة/توقيت) + نقر للترجمة — **قفل المفردات** على كل نص.

import type { Word } from "../../content/schemas/index.js";

export type ReadingSegment = {
  id: string;
  de: string;
  ar: string;
  /** الكلمات الأساسية في المقطع (ربط بالإضاءة المتزامنة) */
  focusWordIds: string[];
};

export type ReadingText = {
  id: string;
  level: "A1" | "A2" | "B1";
  titleDe: string;
  titleAr: string;
  segments: ReadingSegment[];
};

/** كلمات وظيفية مغلقة مسموحة دائماً (أداة + ضمائر + روابط) — لا تُحسب من مفردات المرحلة */
export const FUNCTION_WORD_FORMS: ReadonlySet<string> = new Set([
  "ich", "du", "er", "sie", "es", "wir", "ihr", "sie", "mich", "dich", "sich",
  "der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer",
  "ist", "bin", "bist", "sind", "seid", "hat", "habe", "hast",
  "in", "im", "an", "am", "auf", "aus", "mit", "von", "zu", "zum", "zur", "für", "nach", "bei", "ohne", "gegen",
  "und", "oder", "aber", "denn", "weil", "dass", "wenn", "als",
  "nicht", "kein", "keine", "keinen", "ja", "nein", "auch", "sehr", "schon", "noch", "hier", "dort", "heute", "morgen",
]);

/** مجموع أشكال الكلمات المدروسة (الشكل الأساسي + التصريفات) — أحرف صغيرة للمقارنة */
export function knownFormsFromWords(words: Pick<Word, "de" | "forms">[], extra: string[] = []): Set<string> {
  const out = new Set<string>(FUNCTION_WORD_FORMS);
  for (const f of extra) out.add(f.toLowerCase());
  for (const w of words) {
    out.add(w.de.toLowerCase());
    if (w.forms) for (const v of Object.values(w.forms)) if (typeof v === "string") out.add(v.toLowerCase());
  }
  return out;
}

export function tokenize(de: string): string[] {
  return (de.match(/[A-Za-zÄÖÜäöüß]+/g) ?? []).map((t) => t.toLowerCase());
}

/** قفل G1: الكلمات المحتوية خارج المفردات المدروسة = انتهاك (تُرمى عند التسجيل) */
export function checkTextVocabulary(tokens: string[], known: Set<string>): string[] {
  return [...new Set(tokens.filter((t) => !known.has(t)))];
}

export function registerReadingText(text: ReadingText, known: Set<string>): ReadingText {
  const violations = checkTextVocabulary(text.segments.flatMap((s) => tokenize(s.de)), known);
  if (violations.length > 0) {
    throw new Error(`نص يتجاوز مفردات مرحلته: ${violations.join(", ")}`);
  }
  return text;
}

export type ReadingStep = {
  order: number;
  kind: "gist" | "second-read" | "tap-translate" | "focus-words";
  labelAr: string;
};

/** تدفق القراءة: جوهر بلا ترجمة ← قراءة ثانية ← (الترجمة بالنقر) — الترجمة لا تسبق المحاولة (§2.5) */
export function readingFlow(text: ReadingText): ReadingStep[] {
  return [
    { order: 1, kind: "gist", labelAr: `اقرأ «${text.titleAr}» مرة واحدة — لا تُترجم بعد` },
    { order: 2, kind: "second-read", labelAr: "اقرأ ثانية وركّز على الكلمات المضاءة" },
    { order: 3, kind: "focus-words", labelAr: "انقر الكلمات المضاءة لسماعها" },
    { order: 4, kind: "tap-translate", labelAr: "الآن انقر أي مقطع لترجمته" },
  ];
}

/** الترجمة بالنقر — بعد المحاولة فقط */
export function tapTranslate(text: ReadingText, segmentId: string): { ar: string; de: string } {
  const seg = text.segments.find((s) => s.id === segmentId);
  if (!seg) throw new Error(`مقطع غير موجود: ${segmentId}`);
  return { ar: seg.ar, de: seg.de };
}

/** إضاءة متزامنة: أي الكلمات تُضاء الآن (بنسبة 0..1 من زمن المقطع الصوتي) */
export function highlightAt(segments: ReadingSegment[], progress: number): ReadingSegment | null {
  if (segments.length === 0 || progress < 0 || progress > 1) return null;
  const i = Math.min(segments.length - 1, Math.floor(progress * segments.length));
  return segments[i] ?? null;
}
