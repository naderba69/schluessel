// src/components/CoachBlock.tsx — حضور المدرب اليومي (N-148 · D248 — §2.10): درّبني + النوافذ + إغلاق اليوم
// الحارس: تثبيت ومهارات فقط (أخطاؤك وحروفك — لا جديد) · الأحد صمت (isRestDay) · بلا لوم (D23)
import { useMemo, useState } from "react";
import type { CoachWindow, ErrorEntry } from "../../content/schemas/index.js";
import {
  DEFAULT_WINDOWS,
  WINDOW_LABELS_AR,
  dayIndexOfYear,
  isRestDay,
  pickCoachDrill,
} from "../lib/coach-engine.js";
import { tomorrowPreview } from "../lib/warmth-engine.js";
import { alphabetLetters } from "./SkillsLab.js";
import { PlayButton } from "./LessonSession.js";

export function CoachBlock({
  errors,
  dueCount,
  hasNewContent,
  windows = DEFAULT_WINDOWS,
}: {
  errors: readonly ErrorEntry[];
  dueCount: number;
  hasNewContent: boolean;
  /** N-151 (D251): نوافذ المتعلم من طقس البداية/الإعدادات — الافتراضي الثلاث */
  windows?: readonly CoachWindow[];
}) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const rest = isRestDay(new Date());
  const drill = useMemo(() => pickCoachDrill(errors), [errors]);
  const letters = useMemo(alphabetLetters, []);
  const letter = letters.length > 0 ? letters[dayIndexOfYear() % letters.length]! : null;
  const evening = new Date().getHours() >= 21;
  const close = () => {
    setOpen(false);
    setRevealed(false);
  };

  return (
    <section data-testid="coach-block">
      <h2>🤝 مدربك اليوم</h2>
      <p data-testid="coach-windows">
        نوافذ المدرب: {windows.map((w) => WINDOW_LABELS_AR[w]).join(" · ")}
      </p>
      {rest ? (
        <p data-testid="coach-rest">🌿 اليوم راحة — المدرب صامت. نم جيداً، فالنوم شريكك.</p>
      ) : !open ? (
        <button data-testid="train-me" onClick={() => setOpen(true)}>
          🎯 درّبني (دقيقة واحدة)
        </button>
      ) : drill ? (
        <div data-testid="coach-drill">
          <p>
            أصلح خطأك الذهبي 💛: <span dir="ltr">«{drill.payload.wrong}»</span>
          </p>
          {!revealed ? (
            <button data-testid="coach-reveal" onClick={() => setRevealed(true)}>
              أظهر التصحيح
            </button>
          ) : (
            <>
              <p data-testid="coach-answer" dir="ltr">
                ✓ {drill.payload.correct}
              </p>
              <p>{drill.payload.explanation}</p>
              <button data-testid="coach-done" onClick={close}>
                تم ✓
              </button>
            </>
          )}
        </div>
      ) : (
        <div data-testid="coach-drill">
          <p>
            🎧 استمع وردّد حرف اليوم: <strong dir="ltr">{letter?.text.replace(/\.$/, "")}</strong>
          </p>
          {letter && <PlayButton audioId={letter.id} speakText={letter.text} />}
          <button data-testid="coach-done" onClick={close}>
            تم ✓
          </button>
        </div>
      )}
      {evening && !rest && (
        <div data-testid="day-closing">
          <p>🌙 ماذا تتذكر من اليوم؟ قلها بصوت عالٍ — النوم يثبّتها.</p>
          <p data-testid="tomorrow-preview">{tomorrowPreview({ hasNewContent, dueCount })}</p>
        </div>
      )}
    </section>
  );
}
