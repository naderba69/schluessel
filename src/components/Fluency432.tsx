// src/components/Fluency432.tsx — تمرين الطلاقة 4/3/2 (D577 — §6 خيط الطلاقة)
// ثلاث جولات على المقطع نفسه: 4 دقائق ← 3 ← دقيقتان. أسرع قليلاً كل مرة، والوضوح أولاً.
// بلا حكم ولا درجات (D16) و(طلاقة بلا لوم — D23): عدّاد وعلامة إنجاز وحدهما.
import { useEffect, useRef, useState } from "react";
import type { AudioScript } from "../../content/schemas/index.js";
import { LESSON_INDEX, loadScriptsForLesson } from "../lesson-packs.js";
import { FLUENCY_ROUNDS, mmss, pickFluencyLesson, pickFluencyLines, roundRemaining } from "../lib/fluency-drill.js";
import { PlayButton } from "./LessonSession.js";

export function Fluency432({ currentIndex, now = new Date() }: { currentIndex: number; now?: Date }) {
  const lessonId = pickFluencyLesson(now, currentIndex);
  const [script, setScript] = useState<AudioScript | null>(null);
  const [done, setDone] = useState<boolean[]>([false, false, false]);
  const [active, setActive] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!lessonId) return;
    let live = true;
    const entry = LESSON_INDEX.find((e) => e.id === lessonId);
    void loadScriptsForLesson(lessonId, entry?.level ?? "A1").then(
      (scripts) => {
        if (!live) return;
        setScript(scripts.find((s) => s.kind === "dialogue") ?? scripts[0] ?? null);
      },
      () => {
        if (live) setScript(null);
      },
    );
    return () => {
      live = false;
    };
  }, [lessonId]);

  useEffect(() => {
    if (active === null) {
      if (tick.current) clearInterval(tick.current);
      tick.current = null;
      return;
    }
    setElapsed(0);
    tick.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [active]);

  if (!lessonId) return null;
  const lines = script ? pickFluencyLines(script.lines, now) : [];
  const finishRound = () => {
    if (active === null) return;
    setDone((d) => d.map((x, i) => (i === active ? true : x)));
    setActive(null);
  };
  const allDone = done.every(Boolean);

  return (
    <section data-testid="fluency-432" aria-label="تمرين الطلاقة 4/3/2">
      <h3>🎙️ تمرين الطلاقة 4/3/2</h3>
      <p data-testid="f432-intro">المقطع نفسه ثلاث جولات: ٤ دقائق ← ٣ ← دقيقتان. أسرع قليلاً كل مرة — والوضوح أولاً.</p>
      {script ? (
        lines.map((line) => (
          <p key={line.id} data-testid="f432-line">
            <span dir="ltr">{line.text}</span>{" "}
            <PlayButton audioId={line.id} speakText={line.text} label="استمع إلى السطر" />
          </p>
        ))
      ) : (
        <p data-testid="f432-loading">جارٍ اختيار المقطع…</p>
      )}
      <ol style={{ paddingInlineStart: 20 }}>
        {FLUENCY_ROUNDS.map((r, i) => (
          <li key={r.minutes} data-testid={`f432-round-${i}`}>
            {done[i] ? (
              <span>✓ الجولة {i + 1} ({r.labelAr}) — أُنجزت</span>
            ) : active === i ? (
              <>
                <span data-testid={`f432-timer-${i}`}>{mmss(roundRemaining(r.minutes * 60, elapsed))}</span>{" "}
                <button type="button" data-testid={`f432-finish-${i}`} onClick={finishRound}>
                  انتهيت ←
                </button>
              </>
            ) : (
              <button
                type="button"
                data-testid={`f432-start-${i}`}
                disabled={active !== null || (i > 0 && !done[i - 1])}
                onClick={() => setActive(i)}
              >
                ابدأ الجولة {i + 1} ({r.labelAr})
              </button>
            )}
          </li>
        ))}
      </ol>
      {allDone && (
        <p data-testid="f432-done">
          🎉 أنهيت 4/3/2 — ثلاث مرات، وكل مرة أسرع. الطلاقة تنمو بالتكرار: <strong>بلا درجات ولا حكم</strong> —
          المعيار أن يفهمك أي ألماني بلا جهد.
        </p>
      )}
    </section>
  );
}
