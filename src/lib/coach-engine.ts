// src/lib/coach-engine.ts — محرك المدرب E02: حضور طول اليوم خارج الحصة (قرار المالك v1.1 — الأفكار الـ12 كاملة)
// حراس لا تُكسر (خطة v1.3 §2.10): تثبيت ومهارات فقط · ≤3 دقائق/تفاعل · ≤20 دقيقة/يوم · الأحد راحة · بلا لوم (D23)

export const COACH_TASK_MAX_SEC = 180; // كل تفاعل 30 ثانية–3 دقائق
export const COACH_TASK_MIN_SEC = 30;
export const COACH_DAILY_CAP_MIN = 20; // مجموع اليوم ≤ 20 دقيقة — كلها اختيارية
export const REST_DAY = 0; // الأحد = وضع الراحة

export const COACH_WINDOWS = ["midday", "afternoon", "evening"] as const;
export type CoachWindow = (typeof COACH_WINDOWS)[number];
export const DEFAULT_WINDOWS: CoachWindow[] = ["midday", "afternoon", "evening"];

/** الأفكار الـ12 كنوع مهمة (F001–F012) — كلها تثبيت/مهارات، لا محتوى جديد */
export const COACH_TASK_KINDS = [
  "train-me", // F001 زر «درّبني»
  "window-task", // F002 مهمة النافذة
  "phrase-of-day", // F003 عبارة اليوم
  "minute-conversation", // F004 محادثة الدقيقة
  "shadowing", // F005 التكرار الحرفي
  "on-the-go", // F006 وضع الطريق (صوتي بلا شاشة)
  "skill-of-day", // F007 مهارة اليوم
  "golden-error", // F008 الخطأ الذهبي العابر
  "weekly-challenge", // F009 التحدي الأسبوعي
  "day-closing", // F010 إغلاق اليوم (استرجاع حر)
  "evening-report", // F011 تقرير المدرب المسائي (سطر واحد)
  "tomorrow-preview", // F012 معاينة الغد
] as const;
export type CoachTaskKind = (typeof COACH_TASK_KINDS)[number];

/** أنواع لا تُقبل خارج الحصة أبداً — حارس «تثبيت ومهارات فقط» */
export const FORBIDDEN_OUTSIDE_LESSON = ["new-word", "new-grammar", "new-lesson"] as const;
export type ForbiddenKind = (typeof FORBIDDEN_OUTSIDE_LESSON)[number];

export type CoachTask = {
  id: string;
  kind: CoachTaskKind;
  durationSec: number;
  /** المرجع التعليمي: من مفردات/أخطاء مدروسة فقط — لا جديد */
  refsKnownContent: boolean;
};

export function isValidTask(task: CoachTask): { ok: boolean; reason?: string } {
  if (!COACH_TASK_KINDS.includes(task.kind))
    return { ok: false, reason: "نوع مهمة غير معروف للمدرب" };
  if (task.durationSec < COACH_TASK_MIN_SEC || task.durationSec > COACH_TASK_MAX_SEC)
    return { ok: false, reason: `مدة التفاعل يجب أن تكون ${COACH_TASK_MIN_SEC}–${COACH_TASK_MAX_SEC} ثانية` };
  if (!task.refsKnownContent)
    return { ok: false, reason: "خارج الحصة = تثبيت ومهارات فقط — لا محتوى جديد (حارس §2.10)" };
  return { ok: true };
}

/** الأحد: وضع الراحة — لا مهام إطلاقاً (بلا لوم عند الغياب — D23) */
export function isRestDay(date: Date): boolean {
  return date.getDay() === REST_DAY;
}

export function tasksForDay(date: Date, windows: CoachWindow[], planned: CoachTask[]): CoachTask[] {
  if (isRestDay(date)) return []; // الراحة مقدّمة على كل الجدولة
  const windowKinds: ReadonlySet<CoachTaskKind> = new Set(["window-task", "golden-error", "skill-of-day"]);
  const perWindow = new Map<CoachWindow, CoachTask[]>();
  for (const w of windows) perWindow.set(w, []);
  for (const task of planned) {
    if (!isValidTask(task).ok) continue;
    if (windowKinds.has(task.kind) && windows.length > 0) {
      // وزّع مهام النوافذ بالتناوب على النوافذ المفتوحة
      const target = perWindow.get(windows[0])!.length <= Math.min(...windows.map((w) => perWindow.get(w)!.length))
        ? windows[0]
        : windows.reduce((a, b) => (perWindow.get(a)!.length <= perWindow.get(b)!.length ? a : b));
      perWindow.get(target)!.push(task);
    } else {
      perWindow.get(windows[windows.length - 1] ?? "evening")!.push(task);
    }
  }
  return [...perWindow.values()].flat();
}

/** سقف اليوم: إن تجاوز المجموع 20 دقيقة — تُحذف المهام الاختيارية من الآخر (لا تُفرض أبداً) */
export function applyDailyCap(tasks: CoachTask[]): CoachTask[] {
  let usedSec = 0;
  const out: CoachTask[] = [];
  for (const t of tasks) {
    if (usedSec + t.durationSec > COACH_DAILY_CAP_MIN * 60) break;
    usedSec += t.durationSec;
    out.push(t);
  }
  return out;
}
