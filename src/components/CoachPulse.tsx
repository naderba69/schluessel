// src/components/CoachPulse.tsx — شريط نبض النافذة (F002 · D272): يظهر على الشاشة حين تحين نافذتك
// دافئ بلا لوم (D23): درّبني الآن · بعد ساعة · إغلاق — كلها مقبولة ولا عتاب على أي منها
import type { CoachWindow } from "../lib/coach-engine.js";
import { PULSE_BODY_AR, PULSE_TITLE_AR, WINDOW_LABELS_AR } from "../lib/coach-engine.js";

export function CoachPulse({
  window,
  onTrain,
  onSnooze,
  onDismiss,
}: {
  window: CoachWindow;
  onTrain: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
}) {
  return (
    <div data-testid="coach-pulse" role="status">
      <p data-testid="coach-pulse-title">
        {PULSE_TITLE_AR} — نافذة {WINDOW_LABELS_AR[window]}
      </p>
      <p data-testid="coach-pulse-body">{PULSE_BODY_AR[window]}</p>
      <div>
        <button data-testid="coach-pulse-train" onClick={onTrain}>
          🎯 درّبني الآن
        </button>{" "}
        <button data-testid="coach-pulse-snooze" onClick={onSnooze}>
          ⏰ ذكّرني بعد ساعة
        </button>{" "}
        <button data-testid="coach-pulse-dismiss" onClick={onDismiss} aria-label="إغلاق تذكير اليوم">
          ✕
        </button>
      </div>
    </div>
  );
}
