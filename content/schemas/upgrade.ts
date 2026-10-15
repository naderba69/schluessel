// upgrade.ts — خطة ترقية الدروس (D114 → حارس D115): قاعدة اليوم · التدريب · Quiz لكل درس محتوى
// «done» يتحقق منه المدقِّق آلياً (tools/lib/lesson-upgrade.ts)؛ «pending» دَين معلن لا يختفي بصمت.
import { z } from "zod";
import { ArText, DeText, Level, SchemaVersioned, Slug, UnitNumber } from "./common.js";

export const UpgradeStatus = z.enum(["pending", "done"]);
export type UpgradeStatus = z.infer<typeof UpgradeStatus>;

export const LessonUpgradeEntry = z
  .object({
    lessonId: Slug,
    rule: UpgradeStatus,
    practice: UpgradeStatus,
    quiz: UpgradeStatus,
    /** أسماء العلم المسموحة في تدريب الدرس وQuiz (تُعلن ولا تُستنتج — D109) */
    properNouns: z.array(z.string().regex(/^\p{Lu}\p{Ll}+$/u, { message: "اسم علم: حرف كبير ثم صغيرة" })).default([]),
    /**
     * D128: الأخطاء المقصودة التي يعرضها الدرس مشطوبة (~~Strasse~~) — كل خطأ يُعلن بتصحيحه ولا يُستنتج
     * (المطابقة الآلية بأقرب كلمة مدروسة تقبل كلمات حقيقية غير مدروسة: Brot ← Boot). يُقبل داخل ~~…~~ وحده،
     * والحارس يفحص الإعلان نفسه (tools/lib/lesson-upgrade.ts: e-upgrade-misspelling).
     */
    misspellings: z
      .array(
        z
          .object({
            wrong: z.string().regex(/^\p{L}{2,}$/u, { message: "الصيغة الخاطئة: كلمة واحدة من حرفين فأكثر" }),
            right: z.string().regex(/^\p{L}{2,}$/u, { message: "التصحيح: كلمة واحدة من حرفين فأكثر" }),
          })
          .strict()
          .refine((m) => m.wrong.toLowerCase() !== m.right.toLowerCase(), { message: "الخطأ يساوي تصحيحه" }),
      )
      .default([]),
  })
  .strict();
export type LessonUpgradeEntry = z.infer<typeof LessonUpgradeEntry>;

export const LessonUpgradePlan = SchemaVersioned.extend({
  id: Slug,
  level: Level,
  /** القرار المرجعي في DECISIONS.md */
  decision: z.string().regex(/^D\d+$/),
  title: z.object({ de: DeText, ar: ArText }).strict(),
  /** التقرير الذي يثبت الحاجة (التدقيق) */
  report: z.string().regex(/^docs\/reports\/[a-z0-9-]+\.md$/),
  /** نطاق الخطة: كل درس محتوى من المستوى في هذه الوحدات يجب أن يكون مُدرجاً (الاكتمال) */
  scope: z.object({ fromUnit: UnitNumber, toUnit: UnitNumber }).strict(),
  lessons: z.array(LessonUpgradeEntry).min(1),
})
  .strict()
  .superRefine((p, ctx) => {
    if (p.scope.fromUnit > p.scope.toUnit) ctx.addIssue({ code: "custom", message: "نطاق وحدات معكوس" });
    const seen = new Set<string>();
    for (const l of p.lessons) {
      if (seen.has(l.lessonId)) ctx.addIssue({ code: "custom", message: `درس مكرر في خطة الترقية: ${l.lessonId}` });
      seen.add(l.lessonId);
    }
  });
export type LessonUpgradePlan = z.infer<typeof LessonUpgradePlan>;
