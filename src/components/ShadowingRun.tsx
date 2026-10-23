import { useState } from "react";
import type { AudioScript } from "../../content/schemas/index.js";
import { audioPlayer } from "../lib/audio-player.js";

/**
 * D280: جري الشادوينغ اليومي (ب-20) — سطراً سطراً: استمع ← ردّد بصوت عالٍ.
 * الحكم ذاتي (D16 — بلا تصحيح آلي): المتعلم يعلن أنه ردّد. التشغيل بالمشغّل
 * المشترك (مقطع ← Web Speech) — والفشل الصوتي لا يمنع الترديد.
 */
export function ShadowingRun({ script, onFinish }: { script: AudioScript; onFinish: () => void }) {
  const [cursor, setCursor] = useState(0);
  const [done, setDone] = useState(false);
  const line = script.lines[cursor]!;
  const last = cursor === script.lines.length - 1;

  if (done) {
    return (
      <section data-testid="shadow-run" data-phase="done">
        <p data-testid="shadow-done-run">أنهيت الظل 🎙️ — {script.lines.length} {script.lines.length === 1 ? "سطراً" : "أسطر"} بصوتك</p>
        <button data-testid="shadow-finish" onClick={onFinish}>
          سجّل الشادوينغ ✓
        </button>
      </section>
    );
  }

  return (
    <section data-testid="shadow-run" data-phase="line">
      <p data-testid="shadow-counter">
        سطر {cursor + 1} من {script.lines.length}
      </p>
      <p data-testid="shadow-line">
        {line.speaker}: <span dir="ltr">«{line.text}»</span>
      </p>
      {line.direction && <p data-testid="shadow-direction">{line.direction}</p>}
      <button
        data-testid="shadow-play"
        onClick={() => {
          void audioPlayer()
            .play({ text: line.text })
            .catch(() => {});
        }}
      >
        🔊 استمع
      </button>
      <button data-testid="shadow-said" onClick={() => (last ? setDone(true) : setCursor(cursor + 1))}>
        ردّدت بصوت عالٍ ✓
      </button>
    </section>
  );
}
