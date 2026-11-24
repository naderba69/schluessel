// src/lib/fluency-drill.ts — تمرين الطلاقة 4/3/2 (D577 — §6 خيط الطلاقة)
// «4/3/2»: المقطع نفسه ثلاث جولات — 4 دقائق ثم 3 ثم دقيقتان؛ أسرع قليلاً كل مرة والوضوح أولاً.
// تمرين كلام بلا حكم ولا درجات (D16/5‑ب — «المعيار: يفهمك أي ألماني») و(D23 — بلا لوم).
// المحتوى: أسطر حوار من مخزون مُدرَّس وحده (D126) — بصوت متحدثيه القائم (لا صوت جديد — D251).
import { isoWeek, taughtLessonIds } from "./weekly-cards.js";

/** جولات 4/3/2 (§6 — المواصفة الحاكمة بالأرقام نفسها) */
export const FLUENCY_ROUNDS = [
  { minutes: 4, labelAr: "٤ دقائق" },
  { minutes: 3, labelAr: "٣ دقائق" },
  { minutes: 2, labelAr: "دقيقتان" },
] as const;

export type FluencyLine = { id: string; text: string };

/** درس التمرين — حتميّ بمضاعف مختلف عن المرآة وكلمة الأسبوع (5 و2+1) */
export function pickFluencyLesson(now: Date, currentIndex: number): string | null {
  const pool = taughtLessonIds(currentIndex);
  if (pool.length === 0) return null;
  return pool[(isoWeek(now).week * 5) % pool.length]!;
}

/** ثلاثة أسطر متتالية (تلتوي) — حتمية بحسب الأسبوع */
export function pickFluencyLines(lines: readonly FluencyLine[], now: Date, count = 3): FluencyLine[] {
  if (lines.length === 0) return [];
  const start = (isoWeek(now).week * 2 + 1) % lines.length;
  return Array.from({ length: Math.min(count, lines.length) }, (_, i) => lines[(start + i) % lines.length]!);
}

/** عدّاد الجولة بالثواني (حتمي — يُدخل الزمن من الخارج) */
export function roundRemaining(totalSeconds: number, elapsedSeconds: number): number {
  return Math.max(0, totalSeconds - elapsedSeconds);
}

/** صيغة العدّاد mm:ss */
export function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
