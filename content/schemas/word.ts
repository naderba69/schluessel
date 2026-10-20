// word.ts — مخطط الكلمة | §10.7 + إضافات v6.1 (Kollokationen/Chunks/أعلام الخطر 10‑ي و10.1)
import { z } from "zod";
import {
  ArText, CefrTag, DeText, Gender, Level, SchemaVersioned, Slug, UnitNumber, UsedInLessons,
} from "./common.js";

/** أعلام الخطر الصوتي (مقابل خريطة 10.1) */
export const PhoneticRisk = z.enum([
  "ch-ich-laut", "ch-ach-laut", "umlaut-u", "umlaut-o", "umlaut-a",
  "vowel-long-short", "auslaut-d", "auslaut-b", "auslaut-g",
  "r-uvular", "sp-st-initial", "ig-ending", "double-consonant", "z", "v-f",
  "w-v", "ie-short", "ng-velar", // D191 (N-002 — قرار المالك D182): w=[v] · «ie» قصيرة · [ŋ] في ‑ng وقبل k
]);
export type PhoneticRisk = z.infer<typeof PhoneticRisk>;

/** أعلام التداخل النحوي العربي (مقابل خريطة 10‑ي) */
export const GrammarRisk = z.enum([
  "needs-ein", "needs-ist", "v2-order", "gender-vs-natural", "needs-es-dummy",
  "kein-vs-nicht", "trennbar", "feste-praep", "dative-verb", "reflexive",
  "zu-infinitiv", "plural-irregular", "adjective-decl", "n-deklination",
]);
export type GrammarRisk = z.infer<typeof GrammarRisk>;

export const WordClass = z.enum([
  "noun", "verb", "adjective", "adverb", "preposition", "conjunction",
  "pronoun", "particle", "chunk", "numeral", "expression",
]);

export const Kollocation = z.object({
  de: DeText,
  ar: ArText,
  /** الفعل التلازمي المطلوب (مثلاً: treffen) — يدخل SRS كبطاقة واحدة */
  verb: DeText.optional(),
});

export const Word = SchemaVersioned.extend({
  id: Slug,
  /** الكلمة الألمانية (الشكل الأساسي) */
  de: DeText,
  /** التحديد الكامل عند الاسم: der Tisch (لا الجنس مفرداً — بطاقة الجنس v6.1) */
  article: z.string().optional(),
  gender: Gender.default("none"),

  /** الجمع (German plural) */
  plural: z.string().optional(),
  /** ملاحظة الجمع الاحتمالية (شفرة الجمع) */
  pluralRuleNote: z.string().optional(),
  ar: z.array(ArText).min(1),
  wordClass: WordClass,
  /** المضارع/الماضي/التصريف للفعل */
  forms: z
    .object({
      praesens3s: z.string().optional(),
      praeteritum: z.string().optional(),
      perfekt: z.string().optional(),
      imperative: z.string().optional(),
      konjunktivII: z.string().optional(),
      /** D188: جذع صريح للفعل القصير الذي لا يُشتق جذعه بقصّ ‑en (tun ⇒ tu) — حارس الجبهة يقبل عليه نهايات الفعل */
      stem: z.string().regex(/^\p{Ll}+$/u).optional(),
      /** D188: صيغ التصريف المعلنة لأدوات/ضمائر (jeder ⇒ jede · jedes · jeden · jedem) — بدل قائمة ضمنية في الكود */
      declined: z.array(z.string().regex(/^\p{Ll}+$/u)).optional(),
    })
    .optional(),
  /** أعلام الخطر */
  phoneticRisks: z.array(PhoneticRisk).default([]),
  grammarRisks: z.array(GrammarRisk).default([]),
  /** الكولوكيشن (اسم محوري + فعله التلازمي — §10.7) */
  kollocation: Kollocation.optional(),
  /** قطعة جاهزة أو تعبير وظيفي (يُعلَّم من A1 بلا تحليل نحوي) */
  chunk: z.boolean().default(false),
  /** عائلة الاشتقاق (Wortbildung) */
  wordFamily: z.array(Slug).default([]),
  /** جملة المراس من القصة */
  sampleSentence: z
    .object({
      de: DeText,
      ar: ArText,
      sourceLesson: z.string(),
    })
    .optional(),
  level: Level,
  unit: UnitNumber, // وحدة أول تقديم (A1: 13–14 = تكملة SD1 للفهم — D113)
  /** وسم قائمة Goethe الرسمية */
  goetheList: z.array(Level).default([]),
  thema: z.string(),
  /** وظيفية الكلمة (Funktionswörter تُعالج بمسار خاص) */
  isFunctionWord: z.boolean().default(false),
  audioRef: z.string().optional(),
  imageRef: z.string().optional(),
  /** فهرس الاستخدام العكسي (§10‑ح) — يُحدَّث آلياً */
  usedInLessons: UsedInLessons,
  /** أنواع البطاقات المولَّدة من هذه الكلمة (§4) */
  srsCardTypes: z
    .array(z.enum(["production", "comprehension", "audio", "gender", "chunk", "kollocation"]))
    .default(["production", "comprehension"]),
  cefr: CefrTag.optional(),
});
export type Word = z.infer<typeof Word>;

/**
 * N-137 (D230): أسماء عارية الاستعمال بجنس نحوي — البلدان بلا أداة (aus Frankreich) واللغات (Ich spreche
 * Deutsch) ما عدا المؤنث/الجمع (die Türkei · die Schweiz · die Niederlande). بلا article عمداً (البطاقة
 * والصوت عاريان) مع إبقاء gender النحوي (das — حقيقة يحتاجها النعت: das schöne Frankreich). النمو حصراً
 * بإعلان هنا (الحارس والاختبار يقرآنه).
 */
export const BARE_ARTICLE_IDS: ReadonlySet<string> = new Set([
  "aegypten", "arabisch", "deutsch", "englisch", "europa", "frankreich", "franzoesisch", "griechenland",
  "italien", "marokko", "oesterreich", "polen", "portugal", "russland", "spanien",
]);
