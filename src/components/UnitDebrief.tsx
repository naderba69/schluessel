import type { UnitDebrief } from "../lib/lesson-path.js";

/**
 * D278: بطاقة تفريغ الوحدة — تُعرض أول أيام الوحدة التالية:
 * المعركة (محاولات + أفضل نتيجة) · المؤجلة · الدفتر الذهبي · معايرة الوحدة · طمأنة مولر.
 */
export function UnitDebriefCard({ debrief, muellerLine }: { debrief: UnitDebrief; muellerLine: string }) {
  const pct = (s: number) => `${Math.round(s * 100)}%`;
  return (
    <section data-testid="unit-debrief">
      <h3>تفريغ الوحدة {debrief.unitKey} 🎉</h3>
      <p data-testid="debrief-battle">
        المعركة: {debrief.battles} {debrief.battles === 1 ? "محاولة" : "محاولات"}
        {debrief.best !== null ? ` — أفضل نتيجة ${pct(debrief.best)} ✓` : ""}
      </p>
      <p data-testid="debrief-delayed">
        {debrief.delayedBest !== null ? `المؤجلة: ${pct(debrief.delayedBest)} ✓` : "المؤجلة: يوم الاثنين ⏳"}
      </p>
      {(debrief.goldenOpen > 0 || debrief.goldenResolved > 0) && (
        <p data-testid="debrief-golden">
          الدفتر الذهبي: {debrief.goldenResolved} حُلَّت {debrief.goldenOpen > 0 ? `و${debrief.goldenOpen} تنتظر دورها` : "— والصفحة نظيفة"}
        </p>
      )}
      {debrief.bias !== null && (
        <p data-testid="debrief-bias">
          معايرة الوحدة: {debrief.calibrations} {debrief.calibrations === 1 ? "توقعاً" : "توقعات"} —{" "}
          {Math.abs(Math.round(debrief.bias)) <= 10
            ? "توقّعك دقيق"
            : debrief.bias > 0
              ? "تتوقع أعلى من نتيجتك"
              : "نتائجك أعلى من توقعك"}
        </p>
      )}
      <p data-testid="debrief-mueller">— {muellerLine}</p>
    </section>
  );
}
