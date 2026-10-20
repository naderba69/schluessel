// src/lib/phrase-bank.ts — بنك Redemittel الوظيفي (D107) — §6 الدستور + هـ‑08 + قانون الجبهة (13)
// «يُقدَّم ضمن السياق الوظيفي للدرس (لا قوائم مسبقة تُخرق i+1) وكل عبارة تحمل وسم ظهرت في درس رقم…»
// الحصاد من المحتوى نفسه (لا قوائم مكتوبة يدوياً): جمل الكلمات + أجوبة التدريب والبوابة + الصحيح في المصائد
// + القطع الجاهزة. كل عبارة: وظائفها التواصلية + أول درس ظهرت فيه + كل دروسها + مصادرها.
import type { Lesson, Word } from "../../content/schemas/index.js";

export const PHRASE_FUNCTIONS = [
  "begruessen", "verabschieden", "vorstellen", "fragen-w", "fragen-janein", "bitten", "danken",
  "entschuldigen", "nachfragen", "begruenden", "vergangenheit", "zeit-termin", "gesundheit",
  "orientierung", "meinung", "aussage",
] as const;
export type PhraseFunction = (typeof PHRASE_FUNCTIONS)[number];

export const FUNCTION_LABELS_AR: Readonly<Record<PhraseFunction, string>> = {
  begruessen: "التحية", verabschieden: "الوداع", vorstellen: "التعريف بالنفس", "fragen-w": "سؤال بأداة استفهام",
  "fragen-janein": "سؤال نعم/لا", bitten: "الطلب بأدب", danken: "الشكر", entschuldigen: "الاعتذار",
  nachfragen: "الاستيضاح (بنك النجاة)", begruenden: "التعليل", vergangenheit: "سرد الماضي", "zeit-termin": "الوقت والمواعيد",
  gesundheit: "الصحة", orientierung: "الاتجاهات", meinung: "الرأي والذوق", aussage: "إخبار",
};

/** وظائف بنك النجاة التواصلي (§6) — يجب أن تتوفر مبكراً */
export const SURVIVAL_FUNCTIONS: readonly PhraseFunction[] = ["begruessen", "bitten", "danken", "entschuldigen", "nachfragen"];

export type PhraseSource = "sample" | "chunk" | "practice" | "quiz" | "warning";
export type Phrase = {
  de: string;
  ar?: string;
  functions: PhraseFunction[];
  /** هـ‑08: «ظهرت في درس رقم…» — أول درس بترتيب المسار */
  firstLesson: string;
  lessons: string[];
  sources: PhraseSource[];
};

const ARABIC = /[\u0600-\u06FF]/;
/** لغة واصفة نحوية (ليست عبارة تواصلية): «(Dativ: dir)» · «in + Dativ» */
const META = /\b(Dativ|Akkusativ|Nominativ|Genitiv|Perfekt|Präteritum|Präsens|Plural|Pluralia|Singular|Infinitiv|Partizip|Imperativ|trennbar)\b/;
const W_WORDS = /^(wer|wen|wem|was|wo|wohin|woher|wann|wie|warum|weshalb|welche[rsnm]?|wie viele?)\b/i;

/**
 * من نص محتوى إلى عبارة ألمانية نظيفة أو null:
 * يُسقط الشرح العربي بعد « — » والملاحظات بين قوسين (عربية أو نحوية) · يرفض: العربية · اللغة الواصفة
 * (Dativ/Perfekt…) · الخطأ المشطوب ~~ · الفراغات ___ · الأسهم → · البدائل / · المعادلات + · أقل من كلمتين.
 */
export function cleanPhrase(raw: string, opts: { chunk?: boolean } = {}): string | null {
  let s = raw.replace(/[«»]/g, "").replace(/\s+/g, " ").trim();
  const dash = s.indexOf(" — ");
  if (dash >= 0 && ARABIC.test(s.slice(dash))) s = s.slice(0, dash).trim();
  // ملاحظة بين قوسين بالعربية أو بلغة نحوية واصفة ← تُحذف (تبقى الجملة نفسها)
  s = s.replace(/\s*\([^)]*\)\s*/g, (m) => (ARABIC.test(m) || META.test(m) ? " " : m)).replace(/\s+/g, " ").trim();
  if (!s || ARABIC.test(s) || META.test(s) || /~~|___|→|\/|\+/.test(s)) return null;
  if (!/[A-Za-zÄÖÜäöüß]/.test(s)) return null;
  const tokens = s.split(" ").filter((t) => /[\p{L}]/u.test(t)).length;
  if (tokens < 2) return null;
  // Redemittel = قول لا مفردة: غير القطع الجاهزة يحتاج علامة نهاية جملة أو 3 كلمات («die Möbel» مفردة)
  if (!opts.chunk && tokens < 3 && !/[.!?]$/.test(s)) return null;
  return s;
}

const key = (s: string) => s.toLowerCase().replace(/[.!?…]+$/u, "").trim();

const RULES: readonly [PhraseFunction, RegExp][] = [
  ["begruessen", /\b(hallo|guten (morgen|tag|abend)|servus|grüß gott|herzlich willkommen|willkommen)\b/i],
  ["verabschieden", /\b(tschüss|auf wiedersehen|bis (morgen|bald|später|dann))\b/i],
  ["vorstellen", /\b(ich heiße|mein name ist|ich komme aus|ich bin aus|ich wohne in|ich bin \d+ jahre)\b/i],
  ["bitten", /\b(bitte|möchte|möchten|hätte gern|ich nehme|kann ich|können sie|könnten sie|geben sie)\b/i],
  ["danken", /\b(danke|vielen dank)\b/i],
  ["entschuldigen", /\b(entschuldigung|tut mir leid|verzeihung)\b/i],
  ["nachfragen", /\b(wie bitte|noch einmal|wiederholen|langsamer|was bedeutet|ich verstehe (das )?nicht|was meinen sie)\b/i],
  ["begruenden", /\b(weil|deshalb|deswegen|darum)\b/i],
  ["vergangenheit", /\b(habe|hast|hat|haben|habt|bin|bist|ist|sind|seid)\b.*\b(ge\p{L}+(t|en)|\p{L}+iert|vergessen|verloren|begonnen|beeilt|passiert|bekommen|verstanden|besucht|erzählt|bezahlt)[.!?]?$/iu],
  ["zeit-termin", /\b(um \d+|um (eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)|uhr|am (montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|wochenende)|termin|heute|morgen|gestern)\b/i],
  ["gesundheit", /\b(tut weh|tun weh|schmerz\p{L}*|krank|fieber|arzt|ärztin|apotheke|medikament)\b/iu],
  ["orientierung", /\b(links|rechts|geradeaus|wo ist|wie komme ich|gegenüber)\b/i],
  ["meinung", /\b(ich finde|finde ich|gefällt|ich mag|lieber|toll|schön)\b/i],
];

/** الوظائف التواصلية للعبارة (متعددة) — «إخبار» حين لا تنطبق وظيفة أخرى */
export function classifyPhrase(de: string): PhraseFunction[] {
  const s = de.trim();
  const out = new Set<PhraseFunction>();
  if (s.endsWith("?")) out.add(W_WORDS.test(s) ? "fragen-w" : "fragen-janein");
  for (const [fn, re] of RULES) if (re.test(s)) out.add(fn);
  if (out.size === 0) out.add("aussage");
  return PHRASE_FUNCTIONS.filter((f) => out.has(f));
}

/** حصاد البنك من الدروس بترتيب المسار (ALL_LESSONS) وكلماتها */
export function harvestPhrases(lessons: readonly Lesson[], words: readonly Word[]): Phrase[] {
  const bank = new Map<string, Phrase>();
  const add = (raw: string | undefined, lessonId: string, source: PhraseSource, ar?: string) => {
    if (!raw) return;
    const de = cleanPhrase(raw, { chunk: source === "chunk" });
    if (!de) return;
    const k = key(de);
    const p = bank.get(k);
    if (p) {
      if (!p.lessons.includes(lessonId)) p.lessons.push(lessonId);
      if (!p.sources.includes(source)) p.sources.push(source);
      if (!p.ar && ar) p.ar = ar;
      return;
    }
    bank.set(k, { de, ...(ar ? { ar } : {}), functions: classifyPhrase(de), firstLesson: lessonId, lessons: [lessonId], sources: [source] });
  };
  const byLesson = new Map<string, Word[]>();
  for (const w of words) {
    const src = w.sampleSentence?.sourceLesson;
    if (src) byLesson.set(src, [...(byLesson.get(src) ?? []), w]);
  }
  const byId = new Map(words.map((w) => [w.id, w]));
  for (const l of lessons) {
    for (const id of l.praesentation.wordIds) {
      const w = byId.get(id);
      if (w && (w.chunk || w.wordClass === "chunk" || w.wordClass === "expression")) add(w.de, l.id, "chunk", w.ar[0]);
    }
    for (const w of byLesson.get(l.id) ?? []) add(w.sampleSentence!.de, l.id, "sample", w.sampleSentence!.ar);
    for (const s of l.uebung.stations) for (const it of s.items) add(typeof it.a === "string" ? it.a : undefined, l.id, "practice");
    for (const v of l.quiz.variants) for (const it of v.items) add(typeof it.a === "string" ? it.a : undefined, l.id, "quiz");
    for (const c of l.zusammenfassung.warningCards)
      for (const part of c.correct.de.split(/ · | \/ /)) add(part, l.id, "warning");
  }
  return [...bank.values()];
}

/**
 * قانون الجبهة (13): لا يُعرض إلا ما ظهر في درس وصله المتعلم — العبارات حتى الدرس الحالي (ضمناً)،
 * اختيارياً لوظيفة واحدة، مرتبة من الأحدث (السياق الوظيفي للدرس أولاً).
 */
export function phrasesAvailable(
  bank: readonly Phrase[],
  lessonOrder: readonly string[],
  currentLessonId: string,
  fn?: PhraseFunction,
): Phrase[] {
  const cur = lessonOrder.indexOf(currentLessonId);
  if (cur < 0) return [];
  const pos = (id: string) => lessonOrder.indexOf(id);
  return bank
    .filter((p) => pos(p.firstLesson) >= 0 && pos(p.firstLesson) <= cur && (!fn || p.functions.includes(fn)))
    .sort((a, b) => pos(b.firstLesson) - pos(a.firstLesson));
}

/** تغطية الوظائف حتى درس معيّن — يكشف فجوات بنك النجاة (Wie bitte? …) */
export function functionCoverage(bank: readonly Phrase[], lessonOrder: readonly string[], upTo: string): Record<PhraseFunction, number> {
  const avail = phrasesAvailable(bank, lessonOrder, upTo);
  return Object.fromEntries(PHRASE_FUNCTIONS.map((f) => [f, avail.filter((p) => p.functions.includes(f)).length])) as Record<PhraseFunction, number>;
}
