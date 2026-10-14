// content/schemas/modelltest.ts — الامتحان التجريبي الكامل (4 مهارات) — D95 · الاستماع بصوت حقيقي D103
import { z } from "zod";

/** قسم من أقسام الامتحان (مهارة واحدة) */
export const ModelltestSection = z.object({
  skill: z.enum(["hoeren", "lesen", "schreiben", "sprechen"]),
  timeBudgetMin: z.number().int().min(5).max(60),
  instructions: z.object({ de: z.string().min(1), ar: z.string().min(1) }),
  parts: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    prompt: z.object({ de: z.string().min(1), ar: z.string().min(1) }),
    /** D103: سكربت الصوت لهذا الجزء (content/audio-scripts/) — إلزامي في Hören */
    audioScriptRef: z.string().regex(/^[a-z0-9-]+$/).optional(),
    items: z.array(z.object({
      q: z.string().min(1),
      a: z.string().min(1),
      choices: z.array(z.string().min(1)).optional(),
      /** D103: أسطر السكربت التي يُسمع فيها الجواب (معرّفات مسارات المانيفست) — إلزامي في Hören */
      audioRefs: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1).optional(),
    })).min(1),
  })).min(1),
}).superRefine((s, ctx) => {
  if (s.skill !== "hoeren") return;
  // D103: لا «Hören Sie» بلا صوت — كان القسم كله بلا ملف ولا نص يُسمع
  for (const [pi, p] of s.parts.entries()) {
    if (!p.audioScriptRef)
      ctx.addIssue({ code: "custom", path: ["parts", pi, "audioScriptRef"], message: `جزء استماع بلا سكربت صوتي: ${p.id}` });
    for (const [ii, it] of p.items.entries())
      if (!it.audioRefs?.length)
        ctx.addIssue({ code: "custom", path: ["parts", pi, "items", ii, "audioRefs"], message: `سؤال استماع بلا مقطع صوتي: ${p.id}#${ii + 1}` });
  }
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
