import type { SessionLog } from "../../content/schemas/index.js";

/** عرض الجرعة المنفذة كدقائق (§14: 45/90/120) */
const DOSE_MINUTES: Record<SessionLog["dose"], number> = {
  "emergency-10": 10,
  "minimum-45": 45,
  "target-90": 90,
  "ideal-120": 120,
};

/**
 * D276: شريط المتابعة اليومي (§14 «القياس اليومي»).
 * Can-do ✓/○ ×2 | الجرعة المنفذة | الكلمات | SRS | سطر التأمل.
 * الكلمات: مُنجَزة فقط (المخطط يُحسب مع تعدد دروس اليوم — D276 يُثبت درساً واحداً).
 */
export function MeasureStrip({ entry, dueCount }: { entry: SessionLog; dueCount: number }) {
  const ticks = entry.canDoTicks ?? [];
  const refl = entry.reflection && (entry.reflection.learned || entry.reflection.tomorrow);
  return (
    <p data-testid="measure-strip">
      القياس اليومي:{" "}
      {ticks.length > 0
        ? ticks.map((t, i) => (
            <span key={i} data-testid={`measure-cando-${i}`}>
              {t.done ? "✓" : "○"} Can-do {i + 1}
            </span>
          ))
        : "○ Can-do 1 ○ Can-do 2"}{" "}
      | الجرعة {DOSE_MINUTES[entry.dose]} دقيقة | الكلمات {entry.wordsNew}/{entry.wordsPlanned} | SRS{" "}
      {entry.srsMinutes} دقيقة ({dueCount} متأخرة) | التأمل {refl ? "✓" : "○"}
    </p>
  );
}
