// src/components/DosePicker.tsx — اختيار جرعة اليوم (أ-8 · D274): 45/90/120 — «لا تُسقط الجلسة — قلّصها»
// بلا لوم (D23): الحد الأدنى خيار معلن محترم لا عيب — كل جرعة تُحتسب يوماً
import { DOSE_CHOICES, DOSE_LABELS_AR, type DoseChoice } from "../lib/session-log.js";

export function DosePicker({ value, onChange }: { value: DoseChoice; onChange: (d: DoseChoice) => void }) {
  return (
    <div data-testid="dose-picker">
      <p>جرعتك اليوم؟</p>
      <div>
        {DOSE_CHOICES.map((d) => (
          <button
            key={d}
            data-testid={`dose-${d}`}
            aria-pressed={value === d}
            onClick={() => onChange(d)}
          >
            {value === d ? "✓ " : ""}
            {DOSE_LABELS_AR[d]}
          </button>
        ))}
      </div>
    </div>
  );
}
