// content/schemas/landeskunde.ts — بطاقات الثقافة الأسبوعية (Landeskunde) — D93
import { z } from "zod";
import { UnitNumber } from "./common.js";

/** بطاقة ثقافة أسبوعية (الجمعة — الخطة §2) */
export const CultureCard = z.object({
  schemaVersion: z.string().min(1),
  id: z.string().regex(/^[a-z0-9-]+$/),
  level: z.enum(["A1", "A2", "B1", "B2"]),
  unit: UnitNumber,
  title: z.object({ de: z.string().min(1), ar: z.string().min(1) }),
  facts: z.array(z.object({ de: z.string().min(1), ar: z.string().min(1) })).min(2),
  glossary: z.array(z.object({ de: z.string().min(1), ar: z.string().min(1) })), // N-023 (D224): مسرد البطاقة (قد يفرغ) — مرآة lese
  properNouns: z.array(z.string().min(1)).optional(), // N-023 (D224): أعلام معلنة — تُفحص استعمالاً
  sourceNote: z.string().min(1), // الصدق: ملاحظة المصدر/التحقق دائماً
});
export type CultureCard = z.infer<typeof CultureCard>;
