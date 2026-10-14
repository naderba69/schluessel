// arsenal.ts — الخزانة (§10) + فهرس الاستخدام العكسي (10‑ح) + المرجع المنهجي (10‑ط — D15)
import { z } from "zod";
import { ArText, DeText, Level, SchemaVersioned, Slug, UsedInLessons } from "./common.js";

/** أنواع ملفات الخزانة */
export const ArsenalKind = z.enum([
  "shufra", // شفرة (قصة + قاعدة + استثناءات + تمارين)
  "table", // جدول حفظ/تصريف (مرجعية — ليست درساً)
  "list", // قائمة (كلمات مجانية، أفعال جر، Ablautreihen...)
  "map", // خريطة (10.1 النطق، 10‑ي التداخل النحوي)
  "code", // شفرة قراءة/نحو
]);

export const RiskLevel = z.enum(["red", "orange", "yellow"]); // 🔴🟠🟡

export const ArsenalFile = SchemaVersioned.extend({
  id: Slug,
  kind: ArsenalKind,
  /** رقم القسم في الدستور §10 (10.1، 10‑ي، 10‑ك...) */
  constitutionSection: z.string(),
  title: z.object({ de: DeText.optional(), ar: ArText }),
  payload: z.record(z.string(), z.unknown()),
  riskLevel: RiskLevel.optional(),
  levelIntroduced: Level.optional(),
  /** فهرس الاستخدام العكسي — يُحدَّث آلياً بكل درس يستهلك (قانون 7/10‑ح) */
  usedInLessons: UsedInLessons,
});

/** feste Verben mit Präposition (10‑ك) — الفعل وحرفه كوحدة واحدة */
export const FesteVerbenEntry = z.object({
  verb: DeText,
  preposition: DeText,
  case: z.enum(["Akkusativ", "Dativ", "Genitiv"]),
  ar: ArText,
  example: z.object({ de: DeText, ar: ArText }),
  levelIntroduced: Level,
});

/** خريطة التداخل النحوي (10‑ي) — عنصر بنيية 10.1 نفسها */
export const InterferenceEntry = z.object({
  id: Slug,
  risk: RiskLevel,
  pattern: z.string(), // مثال: حذف ein
  arabicCause: z.string(),
  wrongExample: DeText,
  correctExample: DeText,
  treatment: z.string(),
  grammarRisks: z.array(z.string()).default([]),
});

/**
 * المرجع المنهجي الموازي (10‑ط — D15): فهرس Netzwerk neu + قوائم Goethe
 * يُقارَن به تسلسل كل وحدة قبل بنائها (G2)
 */
export const CurriculumReference = SchemaVersioned.extend({
  primaryCourse: z.literal("Netzwerk neu (Klett)"), // D15
  secondaryCourse: z.string().default("Schritte international neu"),
  vocabularyAuthority: z.literal("Goethe-Institut word lists"),
  levels: z.record(
    Level,
    z.object({
      chapters: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          grammarPoints: z.array(z.string()),
          vocabTopics: z.array(z.string()),
          /** القواعد المسموح تقديمها في هذه المرحلة فقط (منع القاعدة قبل أساسها) */
          requiresPrevious: z.array(z.string()).default([]),
        }),
      ),
      targetWordCount: z.number().int().positive(), // A1≈700 | A2≈750 | B1≈1000 | B2≈1100
      /** D108: من أين جاءت عناوين الفصول (مصدر رسمي متحقَّق منه) — غيابه = غير متحقَّق */
      source: z.string().min(1).optional(),
    }),
  ),
});

export type ArsenalFile = z.infer<typeof ArsenalFile>;
export type FesteVerbenEntry = z.infer<typeof FesteVerbenEntry>;
export type InterferenceEntry = z.infer<typeof InterferenceEntry>;
export type CurriculumReference = z.infer<typeof CurriculumReference>;

// ——— D115: الشفرة النحوية = قاعدة اليوم بصيغة الاكتشاف الموجَّه (E13 · D114) ———

/** مرجع خريطة التداخل النحوي (D59) — المقارنة العربية في كل قاعدة تشير إليه كما تفعل بطاقات المصائد */
export const INTERFERENCE_MAP_REF = "10‑ي";

/** مثال اكتشاف: جملة ألمانية كاملة + معناها — الأمثلة قبل القاعدة دائماً (F121) */
export const DiscoveryExample = z.object({ de: DeText, ar: ArText }).strict();

/**
 * محتوى «الشفرة» (§10: قصة + قاعدة + استثناءات + تمارين) بصيغة الاكتشاف الموجَّه:
 * المشهد ← أمثلة ≥3 منه ← سؤال استنتاج ← القاعدة (de/ar) ← مقارنة عربية إلزامية ← الحدود ← حبّات الجملة.
 * قانون الجبهة (13) على نصوصها الألمانية يفرضه المدقِّق نسبةً لأول درس يشير إليها في المسار.
 */
export const ShufraPayload = z
  .object({
    topicAr: ArText,
    /** المشهد القصير الذي تأتي منه الأمثلة (سياق قصة لا جمل معزولة) */
    sceneAr: ArText,
    examples: z.array(DiscoveryExample).min(3).max(6),
    inferencePromptAr: ArText,
    ruleDe: DeText,
    ruleAr: ArText,
    /** «لا قاعدة بلا مقارنة» (E13) — بمرجع خريطة التداخل */
    contrastAr: ArText.refine((s) => s.includes(INTERFERENCE_MAP_REF), {
      message: `المقارنة العربية تشير إلى خريطة التداخل (${INTERFERENCE_MAP_REF}) — D59`,
    }),
    /** ما لا تغطيه القاعدة اليوم — معلن لا مسكوت عنه */
    limitsAr: z.array(ArText).max(4).default([]),
    /** حبّات الجملة: الترتيب الصحيح هو المصفوفة نفسها — بلا تكرار (ترتيب واحد ممكن) */
    beads: z
      .array(DeText)
      .min(3)
      .max(8)
      .refine((b) => new Set(b).size === b.length, { message: "حبّات مكررة تجعل الترتيب ملتبساً" }),
    /** أسماء العلم في الأمثلة تُعلن ولا تُستنتج (كقفل الامتحان D109) */
    properNouns: z.array(z.string().regex(/^\p{Lu}\p{Ll}+$/u, { message: "اسم علم: حرف كبير ثم صغيرة" })).default([]),
  })
  .strict();
export type ShufraPayload = z.infer<typeof ShufraPayload>;

/** ملف قاعدة: content/arsenal/grammar/<id>.json — يعرضه المُشغِّل في محطة «الجديد» بعد الكلمات */
export const GrammarRuleFile = ArsenalFile.extend({
  id: z.string().regex(/^ars-[a-z0-9-]+$/, { message: "معرّف القاعدة ars-…" }),
  kind: z.literal("shufra"),
  title: z.object({ de: DeText, ar: ArText }).strict(),
  payload: ShufraPayload,
  levelIntroduced: Level,
}).strict();
export type GrammarRuleFile = z.infer<typeof GrammarRuleFile>;
