// common.ts — الأنواع المشتركة | الدستور v6.1 — قانون 29 (Bidi) + قانون 32 (schemaVersion)
import { z } from "zod";

/** إصدار مخططات البيانات — يُرفق بكل ملف محتوى/حالة (قانون 32) */
export const SCHEMA_VERSION = "1.0.0";

export const SchemaVersioned = z.object({
  schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/, "schemaVersion must be semver"),
});
export type SchemaVersioned = z.infer<typeof SchemaVersioned>;

/** المستويات الأربعة */
export const Level = z.enum(["A1", "A2", "B1", "B2"]);
export type Level = z.infer<typeof Level>;

/**
 * أعلى رقم وحدة في أي مستوى — مصدر واحد للحقيقة (القانون 30) بدل أرقام مبعثرة في المخططات (D112).
 * A1: الوحدات 1–12 خطة study-plan v6.1 · 13–16 تكملة Start Deutsch 1 (D112 — content/plans/a1-sd1-supplement.json)
 * · 17 أسبوع التثبيت والامتحان (D92، كان 13 قبل D112). اختبارٌ يربطه بـplacement.examWeekUnit في الخطة فلا ينحرفان.
 */
export const UNIT_MAX = 17;
export const UnitNumber = z.number().int().min(1).max(UNIT_MAX);

/** مرجع مستوى/وحدة */
export const LevelUnitRef = z.object({
  level: Level,
  unit: UnitNumber,
});
export type LevelUnitRef = z.infer<typeof LevelUnitRef>;

/**
 * الجنس النحوي + الترميز المزدوج (§15‑هـ): لون + شكل ثابت
 * der = أزرق ▲ | die = أحمر ● | das = أخضر ■
 */
export const Gender = z.enum(["der", "die", "das", "none"]);
export type Gender = z.infer<typeof Gender>;

export const GenderShape = z.enum(["triangle", "circle", "square", "none"]);
export type GenderShape = z.infer<typeof GenderShape>;

export const GENDER_SHAPE: Record<Gender, GenderShape> = {
  der: "triangle",
  die: "circle",
  das: "square",
  none: "none",
};

/** كل نص ألماني يُخزَّن ويُعرض بـ dir="ltr" (قانون 29) */
export const DeText = z.string().min(1);
export const ArText = z.string().min(1);

export const Bilingual = z.object({
  de: DeText,
  ar: ArText,
  /** تهجئة صوتية عربية اختيارية */
  arPhonetic: z.string().optional(),
});
export type Bilingual = z.infer<typeof Bilingual>;

/** معرّف قارّ (slug) */
export const Slug = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "slug must be kebab-case ascii");

/** قائمة معرّفات دروس (فهرس الاستخدام العكسي — §10‑ح) */
export const UsedInLessons = z.array(z.string()).default([]);

/** مستوى CEFR الفرعي للعنصر */
export const CefrTag = z.enum([
  "A1", "A1+", "A2", "A2+", "B1", "B1+", "B2", "B2+",
]);
