// src/lib/coach-engine.ts — محرك المدرب E02: حضور طول اليوم خارج الحصة (قرار المالك v1.1 — الأفكار الـ12 كاملة)
// حراس لا تُكسر (خطة v1.3 §2.10): تثبيت ومهارات فقط · ≤3 دقائق/تفاعل · ≤20 دقيقة/يوم · الأحد راحة · بلا لوم (D23)
import type { ErrorEntry } from "../../content/schemas/index.js";

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

/** N-148 (D248): أسماء النوافذ المعروضة للمتعلم */
export const WINDOW_LABELS_AR: Record<CoachWindow, string> = { midday: "ظهيرة", afternoon: "عصر", evening: "مساء" };

/** N-148 (D248): رقم اليوم في السنة (0–365) — لتدوير حرف اليوم وعبارة اليوم يومياً */
export function dayIndexOfYear(today = new Date()): number {
  const start = new Date(today.getFullYear(), 0, 1);
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((day.getTime() - start.getTime()) / 86400000);
}

/** N-148 (D248): تدريب «درّبني» — أحدث خطأ غير محلول أولاً (تثبيتٌ من كنزك لا جديد) */
export function pickCoachDrill(errors: readonly ErrorEntry[]): ErrorEntry | null {
  const open = errors.filter((e) => !e.resolved);
  if (open.length === 0) return null;
  return [...open].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]!;
}

/* ══════════ D272 — نبض النوافذ (F002): تذكير لطيف يفتح على الشاشة ══════════ */
/** النطاقات الزمنية للنوافذ الرمزية (بالدقائق من منتصف الليل — توقيت الجهاز) */
export const WINDOW_RANGES: Record<CoachWindow, { startMin: number; endMin: number }> = {
  midday: { startMin: 12 * 60, endMin: 14 * 60 }, // 12:00–14:00
  afternoon: { startMin: 15 * 60 + 30, endMin: 17 * 60 + 30 }, // 15:30–17:30
  evening: { startMin: 19 * 60 + 30, endMin: 20 * 60 + 30 }, // 19:30–20:30 (قبل سهرة الإغلاق)
};
/** ساعات الصمت الليلي — لا نبض ولا إشعار فيها أبداً */
export const QUIET_START_MIN = 22 * 60; // 22:00
export const QUIET_END_MIN = 8 * 60; // 08:00
/** التأجيل اللطيف: ساعة واحدة */
export const SNOOZE_MIN = 60;

const minOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();
const dayKeyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/** النافذة المختارة الحائنة الآن — null خارج النطاقات */
export function windowDueNow(now: Date, windows: readonly CoachWindow[]): CoachWindow | null {
  const m = minOfDay(now);
  for (const w of windows) {
    const r = WINDOW_RANGES[w];
    if (m >= r.startMin && m < r.endMin) return w;
  }
  return null;
}

/** هل نحن في صمت الليل؟ */
export function isQuietHours(now: Date): boolean {
  const m = minOfDay(now);
  return m >= QUIET_START_MIN || m < QUIET_END_MIN;
}

/** مخزن النبض اليومي — يُحفظ في localStorage (يبقى بعد إعادة التحميل) */
export type PulseStore = { seen: string[]; snoozeUntilMs: number };
export const PULSE_STORE_KEY = "schluessel-pulse-v1";
export const pulseKey = (now: Date, w: CoachWindow) => `${dayKeyOf(now)}:${w}`;

export function readPulseStore(): PulseStore {
  try {
    if (typeof localStorage === "undefined") return { seen: [], snoozeUntilMs: 0 };
    const raw = localStorage.getItem(PULSE_STORE_KEY);
    if (!raw) return { seen: [], snoozeUntilMs: 0 };
    const p = JSON.parse(raw) as Partial<PulseStore>;
    return { seen: Array.isArray(p.seen) ? p.seen.filter((s) => typeof s === "string") : [], snoozeUntilMs: typeof p.snoozeUntilMs === "number" ? p.snoozeUntilMs : 0 };
  } catch {
    return { seen: [], snoozeUntilMs: 0 };
  }
}

export function writePulseStore(store: PulseStore): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(PULSE_STORE_KEY, JSON.stringify(store));
  } catch {
    /* التخزين ممتلئ/محظور — النبض يعمل للجلسة الحالية فقط */
  }
}

/**
 * هل يحين النبض الآن؟ الحراس بالترتيب: الأحد صمت · الليل صمت · نافذة حائنة ·
 * لم تُعرض اليوم · انتهى التأجيل. تُعرض كل نافذة مرة واحدة في يومها.
 */
export function shouldPulse(
  now: Date,
  windows: readonly CoachWindow[],
  store: PulseStore,
): CoachWindow | null {
  if (isRestDay(now) || isQuietHours(now)) return null;
  if (now.getTime() < store.snoozeUntilMs) return null;
  const w = windowDueNow(now, windows);
  if (!w) return null;
  if (store.seen.includes(pulseKey(now, w))) return null;
  return w;
}

/** نص النبض الدافئ — بلا لوم أبداً (D23): دعوة لا توبيخ */
export const PULSE_TITLE_AR = "🤝 مولر — دقيقة تثبيت";
export const PULSE_BODY_AR: Record<CoachWindow, string> = {
  midday: "استراحة الظهيرة 🌱 دقيقة تثبيت إن ناسبك — وإن كنت مشغولاً فتجاهلني بلا أي حرج.",
  afternoon: "العصر وقت مناسب للتثبيت 🌱 دقيقة واحدة فقط — أو أجّلني، لا بأس إطلاقاً.",
  evening: "قبل أن ينتهي اليوم 🌱 دقيقة مع أخطائك الذهبية — وإن تعبت فالراحة أولى.",
};
/** كلمات اللوم الممنوعة في أي نص مدرب — يفحصها الاختبار (D23) */
export const BLAME_WORDS = ["فاتك", "خسرت", "لم تتدرب", "تأخرت", "كسل", "عقاب", "متأخر"];

/** F009 — التحدي الأسبوعي (D299 · N-156/2): مهمة مهارية الجمعة/السبت فقط — بلا سلسلة وبلا لوم (D23) */
export const CHALLENGE_DAYS = [5, 6] as const; // الجمعة = 5 · السبت = 6
export const WEEKLY_CHALLENGE_TITLE_AR = "🏆 تحدي الأسبوع";
export const WEEKLY_CHALLENGE_TASK_AR =
  "قدّم نفسك بصوت عالٍ في 30 ثانية: اسمك، عمرك، من أين أنت — لأذنك أنت، بلا تسجيل وبلا تقييم.";
export const WEEKLY_CHALLENGE_DONE_AR = "أحسنت! 🌟 التقديم بصوت عالٍ يثبّت ما تعلمته.";
export const WEEKLY_CHALLENGE_SEC = 30;

export type WeeklyChallenge = { titleAr: string; taskAr: string; durationSec: number };

/** تحدي اليوم — null في غير الجمعة/السبت (ومنها الأحد: الراحة فوق التحدي) */
export function weeklyChallenge(date: Date): WeeklyChallenge | null {
  if (!(CHALLENGE_DAYS as readonly number[]).includes(date.getDay())) return null;
  return { titleAr: WEEKLY_CHALLENGE_TITLE_AR, taskAr: WEEKLY_CHALLENGE_TASK_AR, durationSec: WEEKLY_CHALLENGE_SEC };
}

/** F007 — مهارة اليوم (D300 · N-156/3): تناوب حتمي على 3 مهارات مصغرة معلنة — اسمع وردّد (30 ثانية) */
export const SKILL_OF_DAY_KINDS = ["letter", "number", "time"] as const;
export type SkillOfDayKind = (typeof SKILL_OF_DAY_KINDS)[number];
export const SKILL_OF_DAY_LABEL_AR: Record<SkillOfDayKind, string> = {
  letter: "حرف اليوم",
  number: "رقم اليوم",
  time: "وقت اليوم",
};
export const SKILL_OF_DAY_HINT_AR = "اسمع وردّد بصوت عالٍ — دقيقة واحدة تكفي 🌱";

export type SkillLine = { id: string; text: string };
export type SkillOfDay = { kind: SkillOfDayKind; labelAr: string; line: SkillLine; durationSec: number };

/** مهارة اليوم من فهرس اليوم: تناوب حتمي (حرف ← رقم ← وقت) والبند داخل المهارة بالفهرس أيضاً */
export function skillOfDay(
  dayIndex: number,
  pools: Record<SkillOfDayKind, readonly SkillLine[]>,
): SkillOfDay | null {
  const kind = SKILL_OF_DAY_KINDS[((dayIndex % SKILL_OF_DAY_KINDS.length) + SKILL_OF_DAY_KINDS.length) % SKILL_OF_DAY_KINDS.length]!;
  const pool = pools[kind];
  if (pool.length === 0) return null;
  const line = pool[Math.floor(dayIndex / SKILL_OF_DAY_KINDS.length) % pool.length]!;
  return { kind, labelAr: SKILL_OF_DAY_LABEL_AR[kind], line, durationSec: 30 };
}

/** F004 — محادثة الدقيقة (D301 · N-156/4): مولر يسأل صوتياً وأنت تجيب بصوت عالٍ ثم تكشف جوابه — بلا تسجيل وبلا تقييم */
export const MINUTE_CONVERSATION_TITLE_AR = "💬 محادثة الدقيقة";
export const MINUTE_CONVERSATION_ASK_AR = "اسمع سؤال مولر وأجب بصوت عالٍ — ثم اكشف جوابه وقارن بنفسك 🌱";
export const MINUTE_CONVERSATION_REVEAL_AR = "أظهر جواب مولر";
export const MINUTE_CONVERSATION_YOU_AR = "وأنت؟ أجب عن نفسك بصوت عالٍ أيضاً.";

export type DialoguePair = { q: SkillLine; a: SkillLine };
export type MinuteConversation = { pair: DialoguePair; durationSec: number };

/** حوار اليوم من فهرس اليوم: تناوب حتمي على الأزواج */
export function minuteConversation(dayIndex: number, pairs: readonly DialoguePair[]): MinuteConversation | null {
  if (pairs.length === 0) return null;
  const pair = pairs[((dayIndex % pairs.length) + pairs.length) % pairs.length]!;
  return { pair, durationSec: 60 };
}

/** F006 — وضع الطريق (D302 · N-156/5): تدريب صوتي بلا شاشة — 5 مقاطع معروفة بفجوات ترديد، والأمان أولاً */
export const ON_THE_GO_TITLE_AR = "🎧 وضع الطريق";
export const ON_THE_GO_SAFETY_AR =
  "للأمان: ابدأ ثم ضع الهاتف في جيبك — لا تنظر إلى الشاشة أثناء المشي أو القيادة.";
export const ON_THE_GO_REPEAT_AR = "ردّد بصوت عالٍ بعد كل مقطع.";
export const ON_THE_GO_GAP_MS = 3000; // فجوة الترديد بين المقاطع
export const ON_THE_GO_COUNT = 5;

export type OnTheGoItem = { trackId: string; text: string };

/** قائمة اليوم: مهارة اليوم + سؤالين وجوابيهما من الحوار — تناوب حتمي بفهرس اليوم */
export function onTheGoQueue(
  dayIndex: number,
  skill: SkillLine,
  pairs: readonly DialoguePair[],
): OnTheGoItem[] {
  if (pairs.length === 0) return [{ trackId: skill.id, text: skill.text }];
  const at = (i: number) => pairs[((dayIndex + i) % pairs.length + pairs.length) % pairs.length]!;
  const p1 = at(0);
  const p2 = at(1);
  return [
    { trackId: skill.id, text: skill.text },
    { trackId: p1.q.id, text: p1.q.text },
    { trackId: p1.a.id, text: p1.a.text },
    { trackId: p2.q.id, text: p2.q.text },
    { trackId: p2.a.id, text: p2.a.text },
  ];
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * تشغيل القائمة مقطعاً مقطعاً مع فجوة ترديد — يُعيد عدد ما عُزِف فعلاً.
 * الإلغاء تعاوني بين المقاطع (isCancelled) — بلا قطع لمقطع بدأ (أمان السمع).
 */
export async function playOnTheGo(
  player: { play(req: { trackId?: string; text: string }): Promise<unknown> },
  queue: readonly OnTheGoItem[],
  gapMs: number,
  onProgress: (played: number, total: number) => void,
  isCancelled: () => boolean,
): Promise<number> {
  let played = 0;
  for (const [i, item] of queue.entries()) {
    if (isCancelled()) break;
    await player.play({ trackId: item.trackId, text: item.text });
    played = i + 1;
    onProgress(played, queue.length);
    if (i < queue.length - 1) {
      await wait(gapMs);
      if (isCancelled()) break;
    }
  }
  return played;
}

/** F002 — مهمة النافذة (D303 · N-156/6): النبض يحمل مهمة محددة لا دعوة عامة — نفس تدريب «درّبني» مسمّى سلفاً */
export const WINDOW_TASK_PREFIX_AR = "🎯 مهمة النافذة";
export const WINDOW_TASK_SKILL_FALLBACK_AR = "استمع لمهارة اليوم وردّدها.";

export type WindowTask = { titleAr: string; taskAr: string };

/** مهمة النافذة: أحدث خطأ ذهبي غير محلول ← حرف اليوم ← مهارة اليوم (نفس ترتيب «درّبني») */
export function windowTask(
  window: CoachWindow,
  errors: readonly ErrorEntry[],
  letterText: string | null,
): WindowTask {
  const label = WINDOW_LABELS_AR[window];
  const drill = pickCoachDrill(errors);
  if (drill) return { titleAr: `${WINDOW_TASK_PREFIX_AR} — ${label}`, taskAr: `أصلح خطأك الذهبي 💛: «${drill.payload.wrong}»` };
  if (letterText) return { titleAr: `${WINDOW_TASK_PREFIX_AR} — ${label}`, taskAr: `استمع وردّد حرف اليوم: ${letterText}` };
  return { titleAr: `${WINDOW_TASK_PREFIX_AR} — ${label}`, taskAr: WINDOW_TASK_SKILL_FALLBACK_AR };
}
