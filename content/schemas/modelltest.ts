// content/schemas/modelltest.ts — الامتحان التجريبي الكامل (4 مهارات) — D95
import { z } from "zod";

/** قسم من أقسام الامتحان (مهارة واحدة) */
export const ModelltestSection = z.object({
  skill: z.enum(["hoeren", "lesen", "schreiben", "sprechen"]),
  timeBudgetMin: z.number().int().min(5).max(60),
  instructions: z.object({ de: z.string().min(1), ar: z.string().min(1) }),
  parts: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    prompt: z.object({ de: z.string().min(1), ar: z.string().min(1) }),
    items: z.array(z.object({
      q: z.string().min(1),
      a: z.string().min(1),
      choices: z.array(z.string().min(1)).optional(),
    })).min(1),
  })).min(1),
});

/** امتحان تجريبي كامل — نموذج A1 الرسمي (4 مهارات) */
export const Modelltest = z.object({
  schemaVersion: z.string().min(1),
  id: z.string().regex(/^[a-z0-9-]+$/),
  level: z.enum(["A1", "A2", "B1", "B2"]),
  title: z.object({ de: z.string().min(1), ar: z.string().min(1) }),
  passingScore: z.number().min(0).max(1),
  sections: z.array(ModelltestSection).length(4), // أربع مهارات دائماً
  sourceNote: z.string().min(1), // الصدق: ملاحظة المصدر/التحقق
});
export type Modelltest = z.infer<typeof Modelltest>;
