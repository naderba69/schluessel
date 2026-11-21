// src/lib/weekly-cards.ts — بطاقتا الدورة الأسبوعية (D571 — §8 تخصص أيام الأسبوع)
// الاثنين: كلمة الأسبوع | الخميس: المرآة الصوتية (§7 محطة 15 — Prosodie · §5‑هـ).
// الاختيار حتميّ بحسب رقم الأسبوع ISO — نفس اليوم نفس الاختيار، وأسبوع جديد يبدّله. لا عشوائية في الاستدعاء.
import { FIRST_TAUGHT, LESSON_ORDER } from "../lesson-packs.js";

/** رقم الأسبوع ISO (الاثنين أول الأسبوع) + سنة الأسبوع */
export function isoWeek(d: Date): { year: number; week: number } {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; // الأحد 7
  t.setUTCDate(t.getUTCDate() + 4 - day); // نحو خميس السنة
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: t.getUTCFullYear(), week };
}

/**
 * كلمات المتعلم «المطروحة»: كل كلمة درّسها درسٌ وصل إليه (D59 FIRST_TAUGHT ≤ موضعه).
 * currentIndex = موضع الدرس الحالي في LESSON_ORDER (‑1/غائب ⇒ 0: كلمات أول درس).
 */
export function taughtWordIds(currentIndex: number): string[] {
  const top = Math.max(0, currentIndex);
  return Object.keys(FIRST_TAUGHT)
    .filter((w) => FIRST_TAUGHT[w] <= top)
    .sort();
}

/** كلمة الأسبوع (الاثنين) — حتمية: الأسبوع نفسه الكلمة نفسها (D126: كلها من مخزون مُدرَّس) */
export function pickWordOfWeek(now: Date, currentIndex: number): string | null {
  const pool = taughtWordIds(currentIndex);
  if (pool.length === 0) return null;
  return pool[isoWeek(now).week % pool.length]!;
}

/** الدروس المطروحة (حتى موضع المتعلم) — مصادر المرآة الصوتية */
export function taughtLessonIds(currentIndex: number): string[] {
  const top = Math.max(0, Math.min(currentIndex, LESSON_ORDER.length - 1));
  return LESSON_ORDER.slice(0, top + 1);
}

/** درس المرآة الصوتية (الخميس) — حتميّ بمضاعف مختلف عن كلمة الأسبوع فلا يزامنها */
export function pickMirrorLesson(now: Date, currentIndex: number): string | null {
  const pool = taughtLessonIds(currentIndex);
  if (pool.length === 0) return null;
  return pool[(isoWeek(now).week * 7) % pool.length]!;
}

export type MirrorLine = { id: string; text: string; direction?: string };

/** نافذة سطرين متتاليين (تلتوي عند الانتهاء) — حتمية بحسب الأسبوع */
export function pickMirrorLines(lines: readonly MirrorLine[], now: Date, count = 2): MirrorLine[] {
  if (lines.length === 0) return [];
  const start = (isoWeek(now).week * 3) % lines.length;
  return Array.from({ length: Math.min(count, lines.length) }, (_, i) => lines[(start + i) % lines.length]!);
}

/** يوم العرض (§8): كلمة الأسبوع الاثنين فقط · المرآة الصوتية الخميس فقط */
export function isWordOfWeekDay(now: Date): boolean {
  return now.getDay() === 1;
}
export function isVoiceMirrorDay(now: Date): boolean {
  return now.getDay() === 4;
}
