// writing.ts — E12 محرك الكتابة | M2-أ
// المصادر: F075–F084 · corrective feedback (Hattie & Timperley 2007) · D23 (بلا لوم) · §2.5 (المحاولة قبل الكشف)
// الوظيفة: جملة اليوم + يوميات + تصحيح ذكي لطيف — **كل تصحيح يشرح «لماذا» إلزامياً**، وصفر لوم.

import { BLAME_WORDS } from "./warmth-engine.js";

export type CorrectionKind = "preposition" | "verb" | "word-order" | "conjugation" | "capital" | "spelling";

export type CorrectionRule = {
  id: string;
  /** النمط المطابق للخطأ (تعبير نمطي) */
  pattern: RegExp;
  /** التصحيح — دالة تستقبل المطابقة */
  fix: (m: RegExpExecArray) => string;
  /** «لماذا» — إلزامي غير فارغ (يُفحص عند البناء) */
  whyAr: string;
  kind: CorrectionKind;
};

function rule(r: CorrectionRule): CorrectionRule {
  if (!r.whyAr.trim()) throw new Error(`قاعدة بلا «لماذا» مرفوضة: ${r.id}`);
  return r;
}

/** المصائد الذهبية للدرس الأول — نفس منطق a1-u1-d1 (D39) */
export const GOLDEN_RULES: readonly CorrectionRule[] = Object.freeze([
  rule({
    id: "von-aus",
    pattern: /\bkomme?\s+von\s+([A-ZÄÖÜ][\wäöüß]*)/i,
    fix: (m) => m[0].replace(/\bvon\b/i, "aus"),
    whyAr: "«من (البلد)» تُرجم aus لا von — von تعني «من جهة/امتلاك»، أما الانتماء والمنشأ فمع aus.",
    kind: "preposition",
  }),
  rule({
    id: "verb-deletion",
    pattern: /^ich\s+(yusuf|ahmad|maria|[\u0600-\u06FF]+)/i,
    fix: (m) => `Ich heiße ${m[1]!.charAt(0).toUpperCase()}${m[1]!.slice(1).toLowerCase()}`,
    whyAr: "الجملة الألمانية لا تكتمل بلا فعل — هنا الفعل heiße (اسمي).",
    kind: "verb",
  }),
  rule({
    id: "du-heisst-question",
    pattern: /\b(heiße|heiß)\s+du\b/i,
    fix: () => "heißt du",
    whyAr: "مع du يُصرَّف heißen إلى heißt (heiß + t): «Wie heißt du?» — لا heiße.",
    kind: "conjugation",
  }),
  rule({
    id: "du-heisst-statement",
    pattern: /\bdu\s+(heiße|heiß)\b/i,
    fix: () => "du heißt",
    whyAr: "مع du يُصرَّف heißen إلى heißt (heiß + t) — لا heiße.",
    kind: "conjugation",
  }),
]);

export type CorrectionFix = { from: string; to: string; whyAr: string; kind: CorrectionKind };

export type Correction = {
  input: string;
  corrected: string;
  fixes: CorrectionFix[];
  /** نبرة ثابتة لطيفة — لا لوم في أي حال */
  tone: "gentle";
};

/** التصحيح الذكي اللطيف — يشرح السبب دائماً، ولا يجرّد الجملة من معناها */
export function correctSentence(input: string, rules: readonly CorrectionRule[] = GOLDEN_RULES): Correction {
  const fixes: CorrectionFix[] = [];
  let corrected = input.trim();
  for (const r of rules) {
    const m = r.pattern.exec(corrected);
    if (m) {
      const to = r.fix(m);
      fixes.push({ from: m[0], to, whyAr: r.whyAr, kind: r.kind });
      corrected = corrected.replace(m[0], to);
    }
  }
  return { input, corrected, fixes, tone: "gentle" };
}

/** غلاف لطيف للتصحيح — بلا سلاسل لوم إطلاقاً (D23) */
export function gentleWrap(c: Correction): string {
  for (const w of BLAME_WORDS) {
    if (c.corrected.includes(w) || c.fixes.some((f) => f.whyAr.includes(w))) {
      throw new Error(`كلمة لوم في التصحيح: ${w}`);
    }
  }
  if (c.fixes.length === 0) return "جملتك سليمة — أحسنت. هل تجرّب صيغة أخرى تحمل المعنى نفسه؟";
  const whys = c.fixes.map((f) => `• ${f.to} — ${f.whyAr}`).join(" ");
  return `اقتربت! التدقيق: ${whys}`;
}

/** جملة اليوم — تناوب حتمي على كلمات درسك (لا عشوائية تكسر الاختبارات) */
export function sentenceOfTheDay(words: { de: string; ar: string }[], dayIndex: number): {
  de: string;
  ar: string;
  focusWord: string;
} {
  if (words.length === 0) throw new Error("لا جملة بلا كلمات");
  const w = words[((dayIndex % words.length) + words.length) % words.length]!;
  return {
    de: `Heute: ${w.de}.`,
    ar: `اليوم: ${w.ar}.`,
    focusWord: w.de,
  };
}

/** هيكل يوميات A1 — تلميحات قصيرة تحفّز الكتابة بلا إجبار */
export function diaryPrompt(level: "A1"): {
  titleDe: string;
  titleAr: string;
  hintsAr: string[];
} {
  return {
    titleDe: "Mein Tag",
    titleAr: "يومي",
    hintsAr: [
      "جملتان تكفيان — الصدق أثمن من الكمال.",
      "ابدأ بـ: Heute habe ich…",
      "إن علقت: اكتب بالعربية كلمة واحدة وترجمها غداً في الحصة.",
    ],
  };
}
