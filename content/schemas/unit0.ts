// unit0.ts — الوحدة صفر (§9) — 4 بطاقات يوم أول + 9 بطاقات «عند أول استخدام فعلي» (Just-In-Time)
import { z } from "zod";
import { ArText, DeText, SchemaVersioned, Slug } from "./common.js";

/** محفّزات الظهور (§9 — جدول البطاقات الثماني) */
export const Unit0Trigger = z.enum([
  "day-one", // اليوم الأول (4 بطاقات — قبل أول درس مباشرة)
  "first-uebung", // أول مرة يدخل فيها تمرين Übung
  "first-pronounce", // أول مرة يظهر زر النطق
  "first-night-dew", // أول مساء تُعرض فيه ندى الليل
  "first-fast-error", // أول خطأ سريع فعلي
  "first-friday", // مساء الجمعة الأولى قبل أول سبت
  "first-palace", // أول فتح لقصر الذاكرة
  "first-mastery-board", // أول ظهور للوحة الإتقان
  "first-gate-pass", // أول بوابة عبور ناجحة
  "first-special-char", // N-049 (D233): أول بند كتابة فيه حرف ألماني خاص
]);
export type Unit0Trigger = z.infer<typeof Unit0Trigger>;

export const Unit0Card = z.object({
  id: Slug,
  trigger: Unit0Trigger,
  order: z.number().int().min(1).max(13), // N-049 (D233): البطاقة 13 (تُرفع عمداً مع كل بطاقة جديدة)
  title: z.object({ de: DeText.optional(), ar: ArText }),
  body: z.object({
    de: DeText.optional(),
    ar: ArText,
    /** جملة مولر الختامية */
    mueller: z.string().optional(),
  }),
});

export const Unit0Deck = SchemaVersioned.extend({
  cards: z.array(Unit0Card).length(13),
})
  .refine((d) => d.cards.filter((c) => c.trigger === "day-one").length === 4, {
    message: "الوحدة صفر يجب أن تحوي 4 بطاقات يوم أول بالضبط (§9)",
  })
  .refine((d) => new Set(d.cards.map((c) => c.id)).size === d.cards.length, {
    message: "معرّفات بطاقات الوحدة صفر يجب أن تكون فريدة",
  });

export type Unit0Card = z.infer<typeof Unit0Card>;
export type Unit0Deck = z.infer<typeof Unit0Deck>;
