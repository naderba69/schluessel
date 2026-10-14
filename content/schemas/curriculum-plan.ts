// content/schemas/curriculum-plan.ts — خطة توزيع منهجية مُلزِمة (D112 → D113)
// قرار المالك (D113 — الخيار ج): النواة (شائعة جداً أو يعرضها المنهج قبل تعليمها) تُعلَّم مبكراً داخل دروس قائمة (core)،
// والباقي فهماً سلبياً في وحدات تكميلية قصيرة قبل أسبوع الامتحان (supplementMode: receptive).
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

/** إسناد كلمات نواة إلى درس محتوى قائم (D113) — pending حتى يُنتَج، done حين يعلّمها الدرس فعلاً (المدقِّق يتحقق) */
export const CoreLesson = z.object({
  lessonId: Slug,
  headwords: z.array(z.string().min(1)).min(1),
  status: z.enum(["pending", "done"]),
});
export type CoreLesson = z.infer<typeof CoreLesson>;

/** ظهور كلمة قبل تعليمها يُعالَج بإعادة صياغة النص لا بتقديم الكلمة (D113) — المسار نسبي عن content/ */
export const TextFix = z.object({
  headword: z.string().min(1),
  source: z.string().regex(/^[a-z0-9-]+\/[a-z0-9/-]+\.json$/),
  reason: z.string().min(1),
  status: z.enum(["pending", "done"]),
});
export type TextFix = z.infer<typeof TextFix>;

export const CurriculumPlan = SchemaVersioned.extend({
  id: Slug,
  level: Level,
  /** القرار المرجعي في DECISIONS.md */
  decision: z.string().regex(/^D\d+$/),
  title: Theme,
  /** معرّف الفهرس الرسمي (content/wordlists/<id>.json) */
  sourceList: Slug,
  /** أساس القرار موثَّقاً (التقرير + المعايير) — نصوص للقارئ لا تُنفَّذ */
  method: z.record(z.string(), z.string()).optional(),
  /** النواة داخل الدروس القائمة (D113) */
  core: z.object({ lessons: z.array(CoreLesson).min(1), textFixes: z.array(TextFix).default([]) }).optional(),
  /** نمط الوحدات التكميلية: productive (تعليم كامل — D112) أو receptive (فهم سلبي — D113) */
  supplementMode: z.enum(["productive", "receptive"]).default("productive"),
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
  const note = (h: string, where: string) => {
    const prev = seen.get(h);
    if (prev) issue(`«${h}» مخططة مرتين (${prev} و${where})`, ["units"]);
    else seen.set(h, where);
  };
  const coreIds = new Set<string>();
  p.core?.lessons.forEach((c, i) => {
    const m = c.lessonId.match(new RegExp(`^${lv}-u(\\d+)-d(\\d+)$`));
    if (!m) issue(`معرّف درس النواة ${c.lessonId} لا يتبع ${lv}-u{n}-d{i}`, ["core", "lessons", i, "lessonId"]);
    else if (Number(m[1]) > p.placement.afterUnit) issue(`النواة تُسنَد إلى دروس قائمة حتى الوحدة ${p.placement.afterUnit}: ${c.lessonId}`, ["core", "lessons", i, "lessonId"]);
    if (coreIds.has(c.lessonId)) issue(`درس نواة مكرر: ${c.lessonId}`, ["core", "lessons", i]);
    coreIds.add(c.lessonId);
    for (const h of c.headwords) note(h, c.lessonId);
  });
  for (const u of p.units) for (const l of u.contentLessons) for (const h of l.headwords) note(h, l.lessonId);
  p.core?.textFixes.forEach((t, i) => {
    if (!seen.has(t.headword)) issue(`إصلاح نص لكلمة غير مخططة: «${t.headword}»`, ["core", "textFixes", i, "headword"]);
  });
});
export type CurriculumPlan = z.infer<typeof CurriculumPlan>;

/** كل الكلمات المخططة (النواة + التكملة) ← درسها */
export function plannedHeadwords(p: CurriculumPlan): Map<string, string> {
  const m = new Map<string, string>();
  for (const c of p.core?.lessons ?? []) for (const h of c.headwords) m.set(h, c.lessonId);
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
