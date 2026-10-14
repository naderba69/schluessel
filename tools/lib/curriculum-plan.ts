// tools/lib/curriculum-plan.ts — حارس خطة التوزيع المنهجية (D112) — يعتمد على المحتوى
// المخطط (content/schemas/curriculum-plan.ts) يفرض البنية؛ هنا ما يحتاج الكلمات والدروس والفهارس:
//   e-plan-source    الفهرس المرجعي موجود
//   e-plan-headword  كل كلمة مخططة كلمةٌ رئيسية حقيقية في الفهرس (نصاً حرفياً)
//   e-plan-complete  كل كلمة رسمية لم يعلّمها المنهج مخططة (قرار المالك: «الكل» — لا تُنسى كلمة)
//   e-plan-taught    الدرس المخطط حين يُنتَج يعلّم كلماته المخططة بكلماته هو (praesentation.wordIds)
//   w-plan-elsewhere كلمة مخططة علّمها درس آخر — حدّث الخطة بتغيير معلن
//   e-plan-kind      نوع الدرس المنتَج = نوعه في الخطة (محتوى / توليف)
//   e-plan-unplanned درس في وحدة تكميلية غير وارد في الخطة
//   e-plan-exam-week أسبوع الامتحان في وحدته (دروس توليف) ولا درس بعده في المستوى نفسه
import { auditGoethe } from "../goethe-audit.js";
import { coveredHeadwords, indexWordlists } from "./goethe-lists.js";
import { plannedHeadwords, plannedLessonKinds, type CurriculumPlan } from "../../content/schemas/curriculum-plan.js";
import type { Lesson, OfficialWordlist, Word } from "../../content/schemas/index.js";

export type PlanIssue = { level: "error" | "warning"; code: string; message: string };
export type PlanLessonLike = Pick<Lesson, "id" | "level" | "unit" | "day" | "kind"> & { praesentation: { wordIds: string[] } };

export interface PlanLessonStatus {
  lessonId: string;
  unit: number;
  day: number;
  kind: "content" | "integration";
  themeDe: string;
  produced: boolean;
  headwords: string[];
  /** مخططة لم يعلّمها الدرس (أو لم يُنتَج بعد) */
  missing: string[];
}

/** حالة كل درس مخطط: منتَج؟ وما الذي لم يُعلَّم من كلماته — أساس tools/plan-status.ts وe-plan-taught */
export function planStatus(plan: CurriculumPlan, ctx: { words: Word[]; lessons: PlanLessonLike[]; lists: OfficialWordlist[] }): PlanLessonStatus[] {
  const list = ctx.lists.find((l) => l.id === plan.sourceList);
  const ix = list ? indexWordlists([list])[0]! : null;
  const byId = new Map(ctx.words.map((w) => [w.id, w]));
  const lessonById = new Map(ctx.lessons.map((l) => [l.id, l]));
  const out: PlanLessonStatus[] = [];
  for (const u of plan.units) {
    u.contentLessons.forEach((pl, d) => {
      const lesson = lessonById.get(pl.lessonId);
      let missing = pl.headwords;
      if (lesson && ix) {
        const own = lesson.praesentation.wordIds.map((id) => byId.get(id)).filter((w): w is Word => !!w);
        const hit = coveredHeadwords(own, ix);
        missing = pl.headwords.filter((h) => !hit.has(h));
      }
      out.push({ lessonId: pl.lessonId, unit: u.unit, day: d + 1, kind: "content", themeDe: pl.theme.de, produced: !!lesson, headwords: pl.headwords, missing });
    });
    out.push({
      lessonId: u.integrationLessonId, unit: u.unit, day: u.contentLessons.length + 1, kind: "integration",
      themeDe: `${u.theme.de} — Integration`, produced: lessonById.has(u.integrationLessonId), headwords: [], missing: [],
    });
  }
  return out;
}

export function checkPlan(plan: CurriculumPlan, ctx: { words: Word[]; lessons: PlanLessonLike[]; lists: OfficialWordlist[] }): PlanIssue[] {
  const issues: PlanIssue[] = [];
  const err = (code: string, message: string) => issues.push({ level: "error", code, message });
  const list = ctx.lists.find((l) => l.id === plan.sourceList);
  if (!list) {
    err("e-plan-source", `الفهرس المرجعي ${plan.sourceList} غير موجود في content/wordlists`);
    return issues;
  }
  const planned = plannedHeadwords(plan);
  const printed = new Set(list.entries.filter((e) => e.kind !== "group").map((e) => e.headword));
  for (const [h, lessonId] of planned)
    if (!printed.has(h)) err("e-plan-headword", `${lessonId}: «${h}» ليست كلمة رئيسية في ${plan.sourceList} (النص حرفياً كما طُبع)`);

  // الاكتمال: ما لم يعلّمه المنهج كله ولا تغطيه الوظيفية المغلقة يجب أن يكون مخططاً
  const { uncovered } = auditGoethe(ctx.words, [list]);
  const notPlanned = [...new Set((uncovered.get(list.id) ?? []).map((e) => e.headword))].filter((h) => !planned.has(h));
  if (notPlanned.length)
    err("e-plan-complete", `${notPlanned.length} كلمة رسمية في ${plan.sourceList} لم تُعلَّم ولم تُخطَّط (قرار المالك ${plan.decision}: الكل): ${notPlanned.slice(0, 12).join("، ")}${notPlanned.length > 12 ? " …" : ""}`);

  // الدروس المنتَجة: تعلّم كلماتها المخططة بكلماتها هي
  const ix = indexWordlists([list])[0]!;
  const everywhere = coveredHeadwords(ctx.words, ix);
  const kinds = plannedLessonKinds(plan);
  const lessonById = new Map(ctx.lessons.map((l) => [l.id, l]));
  for (const s of planStatus(plan, ctx)) {
    if (!s.produced) continue;
    const lesson = lessonById.get(s.lessonId)!;
    if (lesson.kind !== s.kind) err("e-plan-kind", `${s.lessonId}: النوع ${lesson.kind} والخطة ${s.kind}`);
    for (const h of s.missing) {
      if (everywhere.has(h)) issues.push({ level: "warning", code: "w-plan-elsewhere", message: `${s.lessonId}: «${h}» علّمها درس آخر — حدّث الخطة بتغيير معلن (${plan.decision})` });
      else err("e-plan-taught", `${s.lessonId}: كلمات الدرس لا تعلّم «${h}» المخططة له (أضف مدخل كلمة يثبتها: npx tsx tools/goethe-audit.ts --word <id>)`);
    }
  }

  // الوحدات التكميلية: لا درس خارج الخطة · أسبوع الامتحان في وحدته ولا شيء بعده
  const first = plan.placement.afterUnit + 1;
  const exam = plan.placement.examWeekUnit;
  const sameLevel = ctx.lessons.filter((l) => l.level === plan.level);
  for (const l of sameLevel) {
    if (l.unit >= first && l.unit < exam && !kinds.has(l.id)) err("e-plan-unplanned", `${l.id}: درس في وحدة تكميلية غير وارد في الخطة ${plan.id}`);
    if (l.unit > exam) err("e-plan-exam-week", `${l.id}: درس بعد أسبوع الامتحان (الوحدة ${exam}) في ${plan.level}`);
    if (l.unit === exam && l.kind !== "integration") err("e-plan-exam-week", `${l.id}: أسبوع الامتحان دروس توليف فقط`);
  }
  if (!sameLevel.some((l) => l.unit === exam)) err("e-plan-exam-week", `لا دروس لأسبوع الامتحان في الوحدة ${exam} (${plan.level})`);
  return issues;
}

