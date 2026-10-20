// src/lib/session-log.ts — N-007 (D228): سجل الجلسة اليومي — يُكتب عند نهاية كل حصة (تقارير التقدم تحتاجه)
// D23: بلا سلاسل/لوم — السجل قياس يومي محايد: الدقائق تتراكم، والكلمات حدّ أعلى (لا تتضاعف بالإعادة)
import type { DailyDose, SessionLog } from "../../content/schemas/index.js";

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
};

/**
 * تسجيل حصة: إدخال واحد لليوم (upsert بالتاريخ).
 * الدقائق تُجمع (الزمن تراكمي) · الكلمات حدّ أعلى (إعادة الدرس لا تضاعف جديده) · الجرعة آخر كتابة.
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
        canDoTicks: [],
        wordsNew: Math.max(0, input.wordsNew ?? 0),
        wordsPlanned: Math.max(0, input.wordsPlanned ?? 0),
        srsMinutes: Math.max(0, input.srsMinutes ?? 0),
        srsDueRemaining: Math.max(0, input.srsDueRemaining ?? 0),
        listeningMinutes: Math.max(0, input.listeningMinutes ?? 0),
        shadowingMinutes: Math.max(0, input.shadowingMinutes ?? 0),
      },
    ];
  const prev = sessions[at]!;
  const next: SessionLog = {
    ...prev,
    dose,
    durationMinutes: prev.durationMinutes + input.durationMinutes,
    wordsNew: Math.max(prev.wordsNew, input.wordsNew ?? 0),
    wordsPlanned: Math.max(prev.wordsPlanned, input.wordsPlanned ?? 0),
    srsMinutes: prev.srsMinutes + Math.max(0, input.srsMinutes ?? 0),
    listeningMinutes: prev.listeningMinutes + Math.max(0, input.listeningMinutes ?? 0),
    shadowingMinutes: prev.shadowingMinutes + Math.max(0, input.shadowingMinutes ?? 0),
  };
  if (input.srsDueRemaining !== undefined) next.srsDueRemaining = input.srsDueRemaining; // رصيد لحظي: آخر قراءة
  return [...sessions.slice(0, at), next, ...sessions.slice(at + 1)];
}
