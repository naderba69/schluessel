// src/components/CoachPulse.tsx — شريط نبض النافذة (F002 · D272): يظهر على الشاشة حين تحين نافذتك
// دافئ بلا لوم (D23): درّبني الآن · بعد ساعة · إغلاق — كلها مقبولة ولا عتاب على أي منها
// D303: النبض يحمل مهمة محددة (نفس تدريب «درّبني» مسمّى سلفاً) لا دعوة عامة
import { useMemo } from "react";
import type { CoachWindow, ErrorEntry } from "../../content/schemas/index.js";
import { PULSE_BODY_AR, PULSE_TITLE_AR, WINDOW_LABELS_AR, dayIndexOfYear, windowTask } from "../lib/coach-engine.js";
import { alphabetLetters } from "./SkillsLab.js";

export function CoachPulse({
  window,
  errors = [],
  onTrain,
  onSnooze,
  onDismiss,
}: {
  window: CoachWindow;
  /** D303: أخطاء المتعلم — المهمة = أحدث خطأ غير محلول (غيابها = مهمة الحرف الاحتياطية) */
  errors?: readonly ErrorEntry[];
  onTrain: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
}) {
  const letters = useMemo(alphabetLetters, []);
  const letter = letters.length > 0 ? (letters[dayIndexOfYear() % letters.length]!.text.replace(/\.$/, "") ?? null) : null;
  const task = windowTask(window, errors, letter);
  return (
    <div data-testid="coach-pulse" role="status">
      <p data-testid="coach-pulse-title">
        {PULSE_TITLE_AR} — نافذة {WINDOW_LABELS_AR[window]}
      </p>
      <p data-testid="coach-pulse-body">{PULSE_BODY_AR[window]}</p>
      <p data-testid="coach-pulse-task">
        {task.titleAr}: <span dir="ltr">{task.taskAr}</span>
      </p>
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
