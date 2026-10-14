// content/schemas/curriculum-plan.ts — خطة توزيع منهجية مُلزِمة (D112)
// قرار المالك (D112): الكلمات الرسمية التي لم يعلّمها المنهج تُعلَّم كلها في وحدات تكميلية قبل أسبوع الامتحان.
// الخطة تربط كل كلمة رئيسية رسمية (كما طُبعت في الفهرس حرفياً) بدرس بعينه — فلا تُنسى كلمة ولا تتكرر،
// والمدقِّق يفرض أن الدرس حين يُنتَج يعلّم كلماته المخططة فعلاً (tools/lib/curriculum-plan.ts).
// هنا الثوابت البنيوية وحدها (لا تحتاج محتوى): معرّفات الدروس · تتابع الوحدات · مكان أسبوع الامتحان · الأحجام · لا تكرار.
import { z } from "zod";
import { ArText, DeText, Level, SchemaVersioned, Slug, UNIT_MAX } from "./common.js";

const Theme = z.object({ de: DeText, ar: ArText });

export const PlanLesson = z.object({
  lessonId: Slug,
  theme: Theme,
  /** الكلمات الرئيسية كما طُبعت في الفهرس الرسمي حرفياً (headword) — النص مفتاحها لا الصفحة */
  headwords: z.array(z.string().min(1)).min(1),
});
export type PlanLesson = z.infer<typeof PlanLesson>;

export const PlanUnit = z.object({
  unit: z.number().int().min(1),
  theme: Theme,
  /** دروس المحتوى D1..Dn (التقويم الأسبوعي: الاثنين→الجمعة) */
  contentLessons: z.array(PlanLesson).min(1),
  /** درس التوليف والمعركة D(n+1) — بلا كلمات جديدة (study-plan v6.1 §1) */
  integrationLessonId: Slug,
});
export type PlanUnit = z.infer<typeof PlanUnit>;

export const CurriculumPlan = SchemaVersioned.extend({
  id: Slug,
  level: Level,
  /** القرار المرجعي في DECISIONS.md */
  decision: z.string().regex(/^D\d+$/),
  title: Theme,
  /** معرّف الفهرس الرسمي (content/wordlists/<id>.json) */
  sourceList: Slug,
  headwordsPerLesson: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }),
  placement: z.object({
    /** آخر وحدة قبل التكملة */
    afterUnit: z.number().int().min(0),
    /** وحدة أسبوع التثبيت والامتحان — تلي آخر وحدة تكميلية مباشرة */
    examWeekUnit: z.number().int().min(1).max(UNIT_MAX),
  }),
  units: z.array(PlanUnit).min(1),
}).superRefine((p, ctx) => {
  const issue = (message: string, path: (string | number)[] = []) => ctx.addIssue({ code: "custom", message, path });
  const lv = p.level.toLowerCase();
  if (p.headwordsPerLesson.min > p.headwordsPerLesson.max) issue("headwordsPerLesson: min > max", ["headwordsPerLesson"]);
  p.units.forEach((u, i) => {
    const expected = p.placement.afterUnit + 1 + i;
    if (u.unit !== expected) issue(`الوحدات متتابعة بعد ${p.placement.afterUnit}: المتوقع ${expected} لا ${u.unit}`, ["units", i, "unit"]);
    u.contentLessons.forEach((l, d) => {
      const id = `${lv}-u${u.unit}-d${d + 1}`;
      if (l.lessonId !== id) issue(`معرّف الدرس ${l.lessonId} ≠ ${id}`, ["units", i, "contentLessons", d, "lessonId"]);
      const n = l.headwords.length;
      if (n < p.headwordsPerLesson.min || n > p.headwordsPerLesson.max)
        issue(`${l.lessonId}: ${n} كلمة خارج ${p.headwordsPerLesson.min}–${p.headwordsPerLesson.max}`, ["units", i, "contentLessons", d, "headwords"]);
    });
    const integ = `${lv}-u${u.unit}-d${u.contentLessons.length + 1}`;
    if (u.integrationLessonId !== integ) issue(`درس التوليف ${u.integrationLessonId} ≠ ${integ}`, ["units", i, "integrationLessonId"]);
    if (u.contentLessons.length + 1 > 8) issue(`الوحدة ${u.unit}: ${u.contentLessons.length + 1} أيام > 8 (حدّ مخطط الدرس)`, ["units", i]);
  });
  const last = p.units[p.units.length - 1];
  if (last && p.placement.examWeekUnit !== last.unit + 1)
    issue(`أسبوع الامتحان يلي آخر وحدة تكميلية: المتوقع ${last.unit + 1} لا ${p.placement.examWeekUnit}`, ["placement", "examWeekUnit"]);
  const seen = new Map<string, string>();
  for (const u of p.units) for (const l of u.contentLessons) for (const h of l.headwords) {
    const prev = seen.get(h);
    if (prev) issue(`«${h}» مخططة مرتين (${prev} و${l.lessonId})`, ["units"]);
    else seen.set(h, l.lessonId);
  }
});
export type CurriculumPlan = z.infer<typeof CurriculumPlan>;

/** كل الكلمات المخططة ← درسها */
export function plannedHeadwords(p: CurriculumPlan): Map<string, string> {
  const m = new Map<string, string>();
  for (const u of p.units) for (const l of u.contentLessons) for (const h of l.headwords) m.set(h, l.lessonId);
  return m;
}

/** كل معرّفات الدروس المخططة (المحتوى + التوليف) ← نوعها */
export function plannedLessonKinds(p: CurriculumPlan): Map<string, "content" | "integration"> {
  const m = new Map<string, "content" | "integration">();
  for (const u of p.units) {
    for (const l of u.contentLessons) m.set(l.lessonId, "content");
    m.set(u.integrationLessonId, "integration");
  }
  return m;
}
