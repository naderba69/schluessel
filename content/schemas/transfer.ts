// content/schemas/transfer.ts — سياقات التحويل للمعركة المؤجلة (Transfer 20%) — D293
import { z } from "zod";
import { UnitNumber } from "./common.js";
import { QuizItem } from "./lesson.js";

/** حزمة تحويل الوحدة: المهارة نفسها في مواقف جديدة — تُخلَط 20% في المؤجلة */
export const TransferPack = z.object({
  schemaVersion: z.string().min(1),
  id: z.string().regex(/^[a-z0-9-]+$/),
  level: z.enum(["A1", "A2", "B1", "B2"]),
  unit: UnitNumber,
  items: z.array(QuizItem).min(2),
});
export type TransferPack = z.infer<typeof TransferPack>;
