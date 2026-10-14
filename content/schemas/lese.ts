// content/schemas/lese.ts — نصوص القراءة القصيرة (وحدة واحدة لكل نص) — D97
import { z } from "zod";
import { UnitNumber } from "./common.js";

/** نص قراءة A1 قصير — من مفردات الوحدة نفسها */
export const ReadingText = z.object({
  schemaVersion: z.string().min(1),
  id: z.string().regex(/^[a-z0-9-]+$/),
  level: z.enum(["A1", "A2", "B1", "B2"]),
  unit: UnitNumber,
  title: z.object({ de: z.string().min(1), ar: z.string().min(1) }),
  text: z.object({ de: z.string().min(40), ar: z.string().min(10) }),
  glossary: z.array(z.object({ de: z.string().min(1), ar: z.string().min(1) })).min(1),
  questions: z.array(z.object({ q: z.string().min(1), a: z.string().min(1) })).min(2),
  sourceNote: z.string().min(1),
});
export type ReadingText = z.infer<typeof ReadingText>;
