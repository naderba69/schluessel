// content/schemas/exam-format.ts — الصيغة الرسمية للامتحان لكل مستوى (D108) — مصدرها وثائق Goethe المجانية
// المرجع الذي يُقاس عليه كل امتحان تجريبي (Modelltest): المدة · عدد الأجزاء · عدد البنود · مرات السماع.
import { z } from "zod";
import { Level, SchemaVersioned, Slug } from "./common.js";

/**
 * نوع المهمة (D109) — مشترك بين الصيغة الرسمية والامتحان التجريبي، فيُقاس الثاني على الأولى آلياً.
 * mc3 = اختيار من ثلاثة · richtig-falsch · a-b = نصّان يُختار أحدهما · zuordnung = مطابقة ·
 * formular = استمارة · freies-schreiben/freies-sprechen = إنتاج حر.
 */
export const ExamTaskType = z.enum(["mc3", "richtig-falsch", "a-b", "zuordnung", "formular", "freies-schreiben", "freies-sprechen"]);
export type ExamTaskType = z.infer<typeof ExamTaskType>;

/** التصنيف الآلي لعبارة الوثيقة الرسمية (taskType الألماني) — يمنع تناقض الحقلين */
export function taskTypeKind(taskType: string): ExamTaskType | null {
  if (/^Mehrfachauswahl, 3-gliedrig/.test(taskType)) return "mc3";
  if (/^Richtig\/Falsch/.test(taskType)) return "richtig-falsch";
  if (/\(a\/b\)/.test(taskType)) return "a-b";
  if (/^Zuordnen/.test(taskType)) return "zuordnung";
  if (/^Formular/.test(taskType)) return "formular";
  if (/^Freies Schreiben/.test(taskType)) return "freies-schreiben";
  if (/^Freies Sprechen/.test(taskType)) return "freies-sprechen";
  return null;
}

export const ExamPart = z.object({
  part: z.number().int().positive(),
  /** هدف الجزء كما تصفه الوثيقة الرسمية */
  goal: z.string().min(1),
  /** عبارة الوثيقة الرسمية حرفياً */
  taskType: z.string().min(1),
  /** D109: تصنيف آلي للعبارة نفسها — يجب أن يطابقها (taskTypeKind) */
  kind: ExamTaskType,
  /** عدد البنود (الاستماع والقراءة) — غائب للمهام الحرة (كتابة/كلام) */
  items: z.number().int().positive().optional(),
  /** مرات السماع (Hören فقط) */
  playCount: z.number().int().min(1).max(2).optional(),
});

export const ExamFormat = SchemaVersioned.extend({
  id: Slug,
  level: Level,
  exam: z.string().min(1),
  /** الوثائق الرسمية المجانية التي استُخرجت منها الصيغة (لا كتب تجارية) */
  sources: z.array(z.object({ title: z.string().min(1), url: z.string().url() })).min(1),
  passRule: z.object({
    totalPoints: z.number().int().positive(),
    passAt: z.number().int().positive(),
    writtenMin: z.number().int().positive().optional(),
    oralMin: z.number().int().positive().optional(),
    note: z.string().min(1),
  }),
  skills: z.array(z.object({
    skill: z.enum(["hoeren", "lesen", "schreiben", "sprechen"]),
    minutes: z.number().int().positive(),
    points: z.number().int().positive(),
    parts: z.array(ExamPart).min(1),
  })).length(4),
}).superRefine((f, ctx) => {
  const skills = f.skills.map((s) => s.skill);
  if (new Set(skills).size !== 4) ctx.addIssue({ code: "custom", path: ["skills"], message: "المهارات الأربع مرة واحدة لكل منها" });
  for (const [i, s] of f.skills.entries()) {
    s.parts.forEach((p, j) => {
      if (p.part !== j + 1) ctx.addIssue({ code: "custom", path: ["skills", i, "parts", j, "part"], message: "ترقيم الأجزاء 1..n بالترتيب" });
      if (taskTypeKind(p.taskType) !== p.kind)
        ctx.addIssue({ code: "custom", path: ["skills", i, "parts", j, "kind"], message: `kind=${p.kind} يناقض عبارة الوثيقة «${p.taskType}» (${taskTypeKind(p.taskType) ?? "غير مصنَّفة"})` });
      if ((s.skill === "hoeren" || s.skill === "lesen") && !p.items)
        ctx.addIssue({ code: "custom", path: ["skills", i, "parts", j, "items"], message: "عدد البنود إلزامي في الاستماع والقراءة" });
      if (s.skill === "hoeren" && !p.playCount)
        ctx.addIssue({ code: "custom", path: ["skills", i, "parts", j, "playCount"], message: "مرات السماع إلزامية في الاستماع" });
    });
  }
});
export type ExamFormat = z.infer<typeof ExamFormat>;
