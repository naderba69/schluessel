// src/lib/session-log.ts — N-007 (D228): سجل الجلسة اليومي — يُكتب عند نهاية كل حصة (تقارير التقدم تحتاجه)
// D23: بلا سلاسل/لوم — السجل قياس يومي محايد: الدقائق تتراكم، والكلمات حدّ أعلى (لا تتضاعف بالإعادة)
import type { DailyDose, SessionLog } from "../../content/schemas/index.js";

/* ══════════ D274 — الجرعة المخططة (45/90/120) + حماية جرعة اليوم ══════════ */
/** اختيارات الجرعة المعلنة (أ-8: لا تُسقط الجلسة — قلّصها) */
export const DOSE_CHOICES = [45, 90, 120] as const;
export type DoseChoice = (typeof DOSE_CHOICES)[number];
/** الافتراضي = المستهدف 90 (طموح بلا تخويف — المثالي 120 اختيار واعٍ) */
export const DEFAULT_DOSE: DoseChoice = 90;
export const DOSE_LABELS_AR: Record<DoseChoice, string> = {
  45: "45 دقيقة — الحد الأدنى 🌱",
  90: "90 دقيقة — المستهدف 🎯",
  120: "120 دقيقة — المثالي 🌟",
};

/** الجرعة المخططة من الاختيار — خارجها خطأ صريح (لا جرعات مخترعة) */
export function dailyDoseForChoice(minutes: number): DailyDose {
  if (minutes === 45) return "minimum-45";
  if (minutes === 90) return "target-90";
  if (minutes === 120) return "ideal-120";
  throw new Error(`جرعة غير معلنة: ${minutes} — الاختيارات 45/90/120 فقط`);
}

/** رتبة الجرعة — جرعة اليوم = الأعلى (جلسة مصغّرة لاحقة لا تُخفّض يوماً كاملاً) */
const DOSE_RANK: Record<DailyDose, number> = { "emergency-10": 0, "minimum-45": 1, "target-90": 2, "ideal-120": 3 };
export function maxDose(a: DailyDose, b: DailyDose): DailyDose {
  return DOSE_RANK[a] >= DOSE_RANK[b] ? a : b;
}

/** الجرعة المخططة لليوم — تُحفظ محلياً (تبقى بعد إعادة التحميل) */
const DOSE_STORE_KEY = "schluessel-dose-v1";
export function readPlannedDose(day: string): DoseChoice {
  try {
    if (typeof localStorage === "undefined") return DEFAULT_DOSE;
    const raw = localStorage.getItem(DOSE_STORE_KEY);
    if (!raw) return DEFAULT_DOSE;
    const p = JSON.parse(raw) as { day?: unknown; minutes?: unknown };
    if (p.day !== day) return DEFAULT_DOSE;
    return (DOSE_CHOICES as readonly number[]).includes(p.minutes as number) ? (p.minutes as DoseChoice) : DEFAULT_DOSE;
  } catch {
    return DEFAULT_DOSE;
  }
}
export function writePlannedDose(day: string, minutes: DoseChoice): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(DOSE_STORE_KEY, JSON.stringify({ day, minutes }));
  } catch {
    /* التخزين محظور — الجرعة للجلسة الحالية فقط */
  }
}

/** شريحة الجرعة من الدقائق المنجزة — حدودها أسماء الشفرة نفسها (10/45/90/120) */
export function doseForMinutes(minutes: number): DailyDose {
  if (minutes >= 120) return "ideal-120";
  if (minutes >= 90) return "target-90";
  if (minutes >= 45) return "minimum-45";
  return "emergency-10";
}

export type SessionInput = {
  date: string; // ISO day
  dose?: DailyDose; // الجرعة المخططة (بلا واجهة خطة بعد: تُشتق من الدقائق ما لم تُعطَ)
  durationMinutes: number;
  wordsNew?: number;
  wordsPlanned?: number;
  srsMinutes?: number;
  srsDueRemaining?: number;
  listeningMinutes?: number;
  shadowingMinutes?: number;
  /** D281: دقائق القراءة الحرة — تتراكم كأخواتها */
  readingMinutes?: number;
  /** D275: سطر التأمل — يُدمَج مع القديم (الفارغ يُتجاهَل ولا يمحو) */
  reflection?: { learned?: string; tomorrow?: string };
  /** D276: توقيعات Can-do — تُدمَج بالنص (الجديد يُلحَق والقديم يُحدَّث) */
  canDoTicks?: { statement: string; done: boolean }[];
};

/** دمج التوقيعات بالنص: الجديد يُلحَق (مشذَّباً غير فارغ) والقديم تُحدَّث حالته */
function mergeTicks(
  prev: readonly { statement: string; done: boolean }[],
  next?: readonly { statement: string; done: boolean }[],
): { statement: string; done: boolean }[] {
  if (!next) return [...prev];
  const out = prev.map((x) => ({ ...x }));
  for (const n of next) {
    const s = n.statement.trim();
    if (!s) continue;
    const at = out.findIndex((x) => x.statement === s);
    if (at < 0) out.push({ statement: s, done: n.done });
    else out[at] = { statement: s, done: n.done };
  }
  return out;
}

/** تنظيف سطر التأمل: تشذيب + إسقاط الفارغ — الفراغ الكامل = لا كتابة */
function cleanReflection(r?: { learned?: string; tomorrow?: string }): { learned?: string; tomorrow?: string } | undefined {
  if (!r) return undefined;
  const out: { learned?: string; tomorrow?: string } = {};
  const l = (r.learned ?? "").trim();
  const m = (r.tomorrow ?? "").trim();
  if (l) out.learned = l;
  if (m) out.tomorrow = m;
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * تسجيل حصة: إدخال واحد لليوم (upsert بالتاريخ).
 * الدقائق تُجمع (الزمن تراكمي) · الكلمات حدّ أعلى (إعادة الدرس لا تضاعف جديده) · الجرعة الأعلى تُحفَظ (D274).
 */
export function recordSession(sessions: readonly SessionLog[], input: SessionInput): SessionLog[] {
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes < 0)
    throw new Error(`مدة حصة غير صالحة: ${input.durationMinutes}`);
  const dose = input.dose ?? doseForMinutes(input.durationMinutes);
  const at = sessions.findIndex((s) => s.date === input.date);
  if (at < 0)
    return [
      ...sessions,
      {
        date: input.date,
        dose,
        durationMinutes: input.durationMinutes,
        canDoTicks: mergeTicks([], input.canDoTicks),
        wordsNew: Math.max(0, input.wordsNew ?? 0),
        wordsPlanned: Math.max(0, input.wordsPlanned ?? 0),
        srsMinutes: Math.max(0, input.srsMinutes ?? 0),
        srsDueRemaining: Math.max(0, input.srsDueRemaining ?? 0),
        listeningMinutes: Math.max(0, input.listeningMinutes ?? 0),
        shadowingMinutes: Math.max(0, input.shadowingMinutes ?? 0),
        readingMinutes: Math.max(0, input.readingMinutes ?? 0),
        ...(cleanReflection(input.reflection) ? { reflection: cleanReflection(input.reflection)! } : {}),
      },
    ];
  const prev = sessions[at]!;
  const next: SessionLog = {
    ...prev,
    dose: maxDose(prev.dose, dose),
    durationMinutes: prev.durationMinutes + input.durationMinutes,
    wordsNew: Math.max(prev.wordsNew, input.wordsNew ?? 0),
    wordsPlanned: Math.max(prev.wordsPlanned, input.wordsPlanned ?? 0),
    srsMinutes: prev.srsMinutes + Math.max(0, input.srsMinutes ?? 0),
    listeningMinutes: prev.listeningMinutes + Math.max(0, input.listeningMinutes ?? 0),
    shadowingMinutes: prev.shadowingMinutes + Math.max(0, input.shadowingMinutes ?? 0),
    readingMinutes: prev.readingMinutes + Math.max(0, input.readingMinutes ?? 0),
  };
  if (input.srsDueRemaining !== undefined) next.srsDueRemaining = input.srsDueRemaining; // رصيد لحظي: آخر قراءة
  const refl = cleanReflection(input.reflection);
  if (refl) next.reflection = { ...prev.reflection, ...refl };
  if (input.canDoTicks) next.canDoTicks = mergeTicks(prev.canDoTicks, input.canDoTicks);
  return [...sessions.slice(0, at), next, ...sessions.slice(at + 1)];
}
