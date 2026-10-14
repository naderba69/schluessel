// content/schemas/pruefungen.ts — الاختبارات الدورية التراكمية (Kurztest/Monatsprüfung) — D94
import { z } from "zod";
import { UnitNumber } from "./common.js";

/** اختبار دوري تراكمي: كل أسبوعين Kurztest · كل 4 أسابيع Monatsprüfung (الخطة §2) */
export const CyclicTest = z.object({
  schemaVersion: z.string().min(1),
  id: z.string().regex(/^[a-z0-9-]+$/),
  level: z.enum(["A1", "A2", "B1", "B2"]),
  kind: z.enum(["kurztest", "monatspruefung"]),
  week: z.number().int().min(2).max(14),
  coversUnits: z.array(UnitNumber).min(1),
  timeBudgetMin: z.number().int().min(5).max(90),
  passingScore: z.number().min(0).max(1),
  items: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).min(4),
});
export type CyclicTest = z.infer<typeof CyclicTest>;
