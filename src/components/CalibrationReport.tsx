import { calibrationReport } from "../lib/warmth-engine.js";

/**
 * D278: بطاقة تقرير المعايرة (كل وحدتين — §14):
 * كم توقعاً · متوسط التوقع مقابل متوسط النتيجة · الحكم اللطيف.
 */
export function CalibrationReportCard({ entries }: { entries: readonly { predicted: number; actual: number }[] }) {
  const r = calibrationReport(entries);
  return (
    <section data-testid="calibration-report">
      <h3>تقرير المعايرة 🔍 — توقّعك مقابل نتيجتك</h3>
      <p data-testid="calibration-means">
        {r.count} {r.count === 1 ? "توقعاً" : "توقعات"} — توقّعك {r.meanPred}% · نتيجتك {r.meanAct}%
      </p>
      <p data-testid="calibration-verdict">{r.verdict}</p>
    </section>
  );
}
