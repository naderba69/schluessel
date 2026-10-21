// src/components/MapView.tsx — الخريطة الهادئة (N-149 · D249 — §2.8): مستويات + وحدة + أسبوع + بوابة
// هادئة (D23): أشرطة ونقاط بلا أرقام مخيفة — أين أنت وخطوتك التالية فقط
import { JOURNEY_WEEKS, levelBar, type ProgressMap } from "../lib/progress-engine.js";

const DAY_DOT = { completed: "●", available: "◉", locked: "○" } as const;

export function MapView({ map }: { map: ProgressMap }) {
  return (
    <section data-testid="progress-map">
      <h2>🗺️ خريطتك</h2>
      <ul data-testid="map-levels">
        {map.levels.map((l) => {
          const bar = levelBar(l);
          return (
            <li key={l.level} data-level={l.level}>
              <span dir="ltr">{l.level}</span>{" "}
              {bar ? (
                <span dir="ltr">{bar}</span>
              ) : (
                <span data-testid={`map-unpublished-${l.level}`}>قيد الإنتاج</span>
              )}
            </li>
          );
        })}
      </ul>
      {map.unit ? (
        <p data-testid="map-unit">
          الوحدة {map.unit.unit} ({map.unit.level}):{" "}
          <span dir="ltr">{map.unitDays.map((d) => DAY_DOT[d.status]).join("")}</span>
        </p>
      ) : (
        <p data-testid="map-unit">أكملت كل ما نُشر حتى الآن ✓ — الجديد قيد الإنتاج.</p>
      )}
      <p data-testid="map-week">
        {map.weekNumber <= JOURNEY_WEEKS
          ? `الأسبوع ${map.weekNumber} من ${JOURNEY_WEEKS}`
          : `الأسبوع ${map.weekNumber}`}
      </p>
      <p data-testid="map-gate">
        {map.gateWeek
          ? "🚪 هذا أسبوع بوابة — اختبار مفصلي للتثبيت (ليس تموضعاً أبداً)"
          : `🚪 البوابة القادمة: الأسبوع ${map.nextGateWeek}`}
      </p>
    </section>
  );
}
