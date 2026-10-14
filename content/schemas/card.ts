// card.ts — مخطط البطاقة (قالب المحتوى) | §4 — أنواع البطاقات ونسبها v6.1
import { z } from "zod";
import { ArText, DeText, Level, SchemaVersioned, Slug, UnitNumber } from "./common.js";

/**
 * أنواع البطاقات (§4):
 * production   : ar→de (الإنتاج) — نسبتها ترتفع 40%→70% عبر المستويات
 * comprehension: de→ar (الفهم)
 * audio        : صوت→معنى (10%)
 * gender       : الكلمة → التحديد الكامل (der/die/das + الترميز المزدوج)
 * chunk        : قطعة جاهزة (من A1)
 * kollocation  : اسم + فعله التلازمي كوحدة
 */
export const CardType = z.enum([
  "production", "comprehension", "audio", "gender", "chunk", "kollocation",
]);
export type CardType = z.infer<typeof CardType>;

export const CardDirection = z.enum([
  "ar→de", "de→ar", "audio→meaning", "word→article-full", "cue→chunk",
]);

/** مستويات التلميح الثلاثة (MR8: سحب المساعدة تدريجياً) */
export const ThreeHints = z.object({
  level1: z.string(),
  level2: z.string(),
  level3: z.string(),
});

export const CardTemplate = SchemaVersioned.extend({
  id: Slug,
  type: CardType,
  direction: CardDirection,
  front: z.object({ de: DeText.optional(), ar: ArText.optional(), audioRef: z.string().optional() }),
  back: z.object({ de: DeText.optional(), ar: ArText.optional(), audioRef: z.string().optional() }),
  /** مصادر البطاقة (كلمات/أسطر خزانة) */
  sourceWordIds: z.array(Slug).default([]),
  sourceArsenalIds: z.array(z.string()).default([]),
  level: Level,
  unit: UnitNumber,
  lessonId: z.string().optional(),
  hints: ThreeHints.optional(),
  /** تفسير الخطأ الشائع المتوقع (من 10‑ي) — يُعرض في التصحيح الفوري */
  commonErrorNote: z.object({ wrong: DeText, why: z.string(), correct: DeText }).optional(),
  /** المصدر: حزمة درس / دورة خطأ / خزانة */
  generatedFrom: z.enum(["lesson-bundle", "error-cycle", "arsenal"]),
  /** الترميز المزدوج للجنس إن كانت البطاقة تحمل جنساً */
  genderCode: z.enum(["der-blue-triangle", "die-red-circle", "das-green-square", "none"]).default("none"),
});
export type CardTemplate = z.infer<typeof CardTemplate>;

/** حالة مثيل البطاقة لدى المتعلم (تُخزَّن في Dexie لا في المحتوى) */
export const SrsCardState = z.object({
  cardId: Slug,
  /** حقول ts-fsrs */
  due: z.string(), // ISO date
  stability: z.number().nonnegative(),
  difficulty: z.number().min(1).max(10),
  elapsed_days: z.number().nonnegative(),
  scheduled_days: z.number().nonnegative(),
  reps: z.number().nonnegative().default(0),
  lapses: z.number().nonnegative().default(0),
  /** خطوات التعلّم داخل ts-fsrs v5 (فهرس الخطوة الحالية) — للتحويل الكامل forth/back (اختياري — البيانات القديمة سليمة) */
  learning_steps: z.number().nonnegative().optional(),
  state: z.enum(["New", "Learning", "Review", "Relearning"]),
  last_review: z.string().optional(),
  /** L0–L4 (سلم الإتقان) */
  masteryLevel: z.enum(["L0", "L1", "L2", "L3", "L4"]).default("L0"),
});
export type SrsCardState = z.infer<typeof SrsCardState>;

/** نسبة بطاقات S ≥ العتبة — مقياس الإتقان M (D18) */
export function computeMastery(
  cards: SrsCardState[],
  level: Level,
  now: Date = new Date(),
): { ratio: number; thresholdDays: number; counted: number; total: number } {
  const thresholdDays = level === "A1" ? 21 : 30;
  const total = cards.length;
  const counted = cards.filter((c) => c.stability >= thresholdDays).length;
  return {
    ratio: total === 0 ? 0 : counted / total,
    thresholdDays,
    counted,
    total,
  };
}
