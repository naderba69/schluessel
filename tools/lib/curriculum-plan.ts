// tools/lib/curriculum-plan.ts — حارس خطة التوزيع المنهجية (D112 → D113) — يعتمد على المحتوى
// المخطط (content/schemas/curriculum-plan.ts) يفرض البنية؛ هنا ما يحتاج الكلمات والدروس والفهارس:
//   e-plan-source      الفهرس المرجعي موجود
//   e-plan-headword    كل كلمة مخططة كلمةٌ رئيسية حقيقية في الفهرس (نصاً حرفياً)
//   e-plan-complete    كل كلمة رسمية لم يعلّمها المنهج مخططة (قرار المالك: لا تُنسى كلمة)
//   e-plan-taught      الدرس المنتَج (تكملة) أو إسناد النواة done يعلّم كلماته بكلماته هو (praesentation.wordIds)
//   w-plan-elsewhere   كلمة مخططة علّمها درس آخر — حدّث الخطة بتغيير معلن
//   w-plan-mark-done   إسناد نواة pending وكلماته مُعلَّمة فعلاً في درسه — علِّمه done
//   e-plan-core-lesson درس النواة موجود · محتوى · من المستوى · حتى الوحدة afterUnit
//   e-plan-core-load   حجم درس النواة بعد الإسناد ≤ 18 كلمة (أعلى حِمل قائم في المنهج)
//   e-plan-text-fix    ملف إصلاح النص موجود
//   e-plan-receptive   الوحدات السلبية: بطاقات الكلمة comprehension بلا production
//   e-plan-kind        نوع الدرس المنتَج = نوعه في الخطة (محتوى / توليف)
//   e-plan-unplanned   درس في وحدة تكميلية غير وارد في الخطة
//   e-plan-exam-week   أسبوع الامتحان في وحدته (دروس توليف) ولا درس بعده في المستوى نفسه
import { auditGoethe } from "../goethe-audit.js";
import { coveredHeadwords, indexWordlists, type ListIndex } from "./goethe-lists.js";
import { plannedHeadwords, plannedLessonKinds, type CurriculumPlan } from "../../content/schemas/curriculum-plan.js";
import type { Lesson, OfficialWordlist, Word } from "../../content/schemas/index.js";

export type PlanIssue = { level: "error" | "warning"; code: string; message: string };
export type PlanLessonLike = Pick<Lesson, "id" | "level" | "unit" | "day" | "kind"> & { praesentation: { wordIds: string[] } };
export interface PlanContext {
  words: Word[];
  lessons: PlanLessonLike[];
  lists: OfficialWordlist[];
  /** مسارات ملفات المحتوى (نسبية عن content/) — لفحص textFixes؛ غيابها يتخطى الفحص */
  paths?: Set<string>;
}

/** أعلى حِمل كلمات قائم في درس محتوى (a1-u9-d1) — سقف الإسناد */
export const CORE_LOAD_MAX = 18;

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

export interface CoreLessonStatus {
  lessonId: string;
  unit: number;
  day: number;
  status: "pending" | "done";
  exists: boolean;
  /** عدد كلمات الدرس الآن */
  size: number;
  headwords: string[];
  /** لم يعلّمها الدرس بكلماته بعد */
  missing: string[];
}

function sourceIndex(plan: CurriculumPlan, lists: OfficialWordlist[]): ListIndex | null {
  const list = lists.find((l) => l.id === plan.sourceList);
  return list ? indexWordlists([list])[0]! : null;
}

function ownCoverage(lesson: PlanLessonLike | undefined, byId: Map<string, Word>, ix: ListIndex | null): Set<string> {
  if (!lesson || !ix) return new Set();
  return coveredHeadwords(lesson.praesentation.wordIds.map((id) => byId.get(id)).filter((w): w is Word => !!w), ix);
}

const unitDay = (id: string) => {
  const m = id.match(/-u(\d+)-d(\d+)$/);
  return m ? { unit: Number(m[1]), day: Number(m[2]) } : { unit: 0, day: 0 };
};

/** حالة كل درس تكملة مخطط: منتَج؟ وما الذي لم يُعلَّم من كلماته — أساس tools/plan-status.ts وe-plan-taught */
export function planStatus(plan: CurriculumPlan, ctx: PlanContext): PlanLessonStatus[] {
  const ix = sourceIndex(plan, ctx.lists);
  const byId = new Map(ctx.words.map((w) => [w.id, w]));
  const lessonById = new Map(ctx.lessons.map((l) => [l.id, l]));
  const out: PlanLessonStatus[] = [];
  for (const u of plan.units) {
    u.contentLessons.forEach((pl, d) => {
      const lesson = lessonById.get(pl.lessonId);
      const hit = ownCoverage(lesson, byId, ix);
      out.push({
        lessonId: pl.lessonId, unit: u.unit, day: d + 1, kind: "content", themeDe: pl.theme.de, produced: !!lesson,
        headwords: pl.headwords, missing: lesson ? pl.headwords.filter((h) => !hit.has(h)) : pl.headwords,
      });
    });
    out.push({
      lessonId: u.integrationLessonId, unit: u.unit, day: u.contentLessons.length + 1, kind: "integration",
      themeDe: `${u.theme.de} — Integration`, produced: lessonById.has(u.integrationLessonId), headwords: [], missing: [],
    });
  }
  return out;
}

/** حالة إسنادات النواة (D113) — بترتيب المسار */
export function coreStatus(plan: CurriculumPlan, ctx: PlanContext): CoreLessonStatus[] {
  const ix = sourceIndex(plan, ctx.lists);
  const byId = new Map(ctx.words.map((w) => [w.id, w]));
  const lessonById = new Map(ctx.lessons.map((l) => [l.id, l]));
  return (plan.core?.lessons ?? []).map((c) => {
    const lesson = lessonById.get(c.lessonId);
    const hit = ownCoverage(lesson, byId, ix);
    return {
      lessonId: c.lessonId, ...unitDay(c.lessonId), status: c.status, exists: !!lesson,
      size: lesson?.praesentation.wordIds.length ?? 0, headwords: c.headwords, missing: c.headwords.filter((h) => !hit.has(h)),
    };
  }).sort((a, b) => a.unit - b.unit || a.day - b.day);
}

export function checkPlan(plan: CurriculumPlan, ctx: PlanContext): PlanIssue[] {
  const issues: PlanIssue[] = [];
  const err = (code: string, message: string) => issues.push({ level: "error", code, message });
  const warn = (code: string, message: string) => issues.push({ level: "warning", code, message });
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
    err("e-plan-complete", `${notPlanned.length} كلمة رسمية في ${plan.sourceList} لم تُعلَّم ولم تُخطَّط (قرار المالك ${plan.decision}): ${notPlanned.slice(0, 12).join("، ")}${notPlanned.length > 12 ? " …" : ""}`);

  const ix = indexWordlists([list])[0]!;
  const everywhere = coveredHeadwords(ctx.words, ix);
  const byId = new Map(ctx.words.map((w) => [w.id, w]));
  const lessonById = new Map(ctx.lessons.map((l) => [l.id, l]));
  const missingWord = (lessonId: string, h: string, how: string) => {
    if (everywhere.has(h)) warn("w-plan-elsewhere", `${lessonId}: «${h}» علّمها درس آخر — حدّث الخطة بتغيير معلن (${plan.decision})`);
    else err("e-plan-taught", `${lessonId}: ${how} «${h}» (أضف مدخل كلمة يثبتها: npx tsx tools/goethe-audit.ts --word <id>)`);
  };

  // ——— النواة داخل الدروس القائمة (D113) ———
  for (const c of coreStatus(plan, ctx)) {
    const lesson = lessonById.get(c.lessonId);
    if (!lesson) { err("e-plan-core-lesson", `${c.lessonId}: درس النواة غير موجود`); continue; }
    if (lesson.kind !== "content" || lesson.level !== plan.level || lesson.unit > plan.placement.afterUnit)
      err("e-plan-core-lesson", `${c.lessonId}: النواة تُسنَد إلى درس محتوى ${plan.level} حتى الوحدة ${plan.placement.afterUnit}`);
    const finalSize = c.status === "done" ? c.size : c.size + c.missing.length;
    if (finalSize > CORE_LOAD_MAX) err("e-plan-core-load", `${c.lessonId}: ${finalSize} كلمة بعد الإسناد > ${CORE_LOAD_MAX}`);
    if (c.status === "done") for (const h of c.missing) missingWord(c.lessonId, h, "إسناد done وكلمات الدرس لا تعلّم");
    else {
      const taughtHere = c.headwords.filter((h) => !c.missing.includes(h));
      if (taughtHere.length === c.headwords.length) warn("w-plan-mark-done", `${c.lessonId}: كل كلمات الإسناد مُعلَّمة في الدرس — علِّمه done`);
      for (const h of c.missing) if (everywhere.has(h)) warn("w-plan-elsewhere", `${c.lessonId}: «${h}» (pending) علّمها درس آخر — حدّث الخطة (${plan.decision})`);
    }
  }
  if (ctx.paths) for (const t of plan.core?.textFixes ?? [])
    if (!ctx.paths.has(t.source)) err("e-plan-text-fix", `إصلاح نص «${t.headword}»: الملف ${t.source} غير موجود`);

  // ——— دروس التكملة المنتَجة: تعلّم كلماتها بكلماتها هي · ونمطها ———
  const kinds = plannedLessonKinds(plan);
  for (const s of planStatus(plan, ctx)) {
    if (!s.produced) continue;
    const lesson = lessonById.get(s.lessonId)!;
    if (lesson.kind !== s.kind) err("e-plan-kind", `${s.lessonId}: النوع ${lesson.kind} والخطة ${s.kind}`);
    for (const h of s.missing) missingWord(s.lessonId, h, "كلمات الدرس لا تعلّم المخططة له");
    if (plan.supplementMode === "receptive" && s.kind === "content") {
      const mine = new Set(s.headwords);
      for (const id of lesson.praesentation.wordIds) {
        const w = byId.get(id);
        if (!w || ![...coveredHeadwords([w], ix)].some((h) => mine.has(h))) continue;
        if (!w.srsCardTypes.includes("comprehension") || w.srsCardTypes.includes("production"))
          err("e-plan-receptive", `${s.lessonId}: ${w.id} في وحدة للفهم — بطاقاته comprehension بلا production (الآن: ${w.srsCardTypes.join("، ")})`);
      }
    }
  }

  // ——— الوحدات التكميلية: لا درس خارج الخطة · أسبوع الامتحان في وحدته ولا شيء بعده ———
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
