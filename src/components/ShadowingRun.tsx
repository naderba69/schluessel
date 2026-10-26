import { useEffect, useRef, useState } from "react";
import type { AudioScript } from "../../content/schemas/index.js";
import { audioPlayer } from "../lib/audio-player.js";
import { RECORDING_DISCLAIMER_AR } from "../lib/audio-engine.js";
import { SelfRecorder, blobUrlOf, recordingSupported, revokeBlobUrl, type RecState } from "../lib/self-record.js";

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
      <LineRecorder key={line.id} />
      <button data-testid="shadow-said" onClick={() => (last ? setDone(true) : setCursor(cursor + 1))}>
        ردّدت بصوت عالٍ ✓
      </button>
    </section>
  );
}

/**
 * D307: مسجّل السطر الذاتي (F005 — «تسجّل صوتك، تقارن بنفسك») — اختياري صرف:
 * «ردّدت» تعمل دائماً بلا تسجيل. الرفض/غياب الدعم يُحترَم بلا لوم، والتسجيل
 * Blob مؤقت على الجهاز يُمسَح بمغادرة السطر — لا رفع ولا تخزين ولا تقييم آلي.
 */
export function LineRecorder() {
  const [state, setState] = useState<RecState>(() => (recordingSupported() ? "idle" : "unsupported"));
  const [mine, setMine] = useState<string | null>(null);
  const rec = useRef<SelfRecorder | null>(null);

  useEffect(() => () => {
    if (mine) revokeBlobUrl(mine);
  }, [mine]);

  if (state === "unsupported")
    return <p data-testid="rec-note">التسجيل غير متاح على هذا المتصفح — الترديد بصوت عالٍ يكفي تماماً 🌱</p>;
  if (state === "denied")
    return <p data-testid="rec-note">الميكروفون مرفوض — لا بأس إطلاقاً، الترديد بصوت عالٍ يكفي 🌱</p>;

  return (
    <div data-testid="line-recorder">
      <p>
        <small>{RECORDING_DISCLAIMER_AR}</small>
      </p>
      {state === "idle" && (
        <button
          data-testid="rec-start"
          onClick={() => {
            const r = new SelfRecorder();
            rec.current = r;
            void r.start().then((s) => setState(s === "recording" ? "recording" : "denied"));
          }}
        >
          🎙️ سجّل نفسك (اختياري)
        </button>
      )}
      {state === "recording" && (
        <>
          <p data-testid="rec-live" aria-live="polite">
            يسجّل… ردّد السطر بصوت عالٍ 🔴
          </p>
          <button
            data-testid="rec-stop"
            onClick={() => {
              void rec.current?.stop().then((blob) => {
                setMine(blobUrlOf(blob) ?? null);
                setState("recorded");
              });
            }}
          >
            ⏹ أوقف التسجيل
          </button>
        </>
      )}
      {state === "recorded" && (
        <>
          {mine && (
            <button data-testid="rec-play-mine" onClick={() => void new Audio(mine).play().catch(() => {})}>
              🔊 اسمع نفسك
            </button>
          )}{" "}
          <button
            data-testid="rec-again"
            onClick={() => {
              if (mine) revokeBlobUrl(mine);
              setMine(null);
              setState("idle");
            }}
          >
            🎙️ سجّل من جديد
          </button>
          <p>
            <small>تسجيلك على جهازك وحده ويُمسَح بمغادرة السطر — قارن صوتك بمولر بنفسك 🎧</small>
          </p>
        </>
      )}
    </div>
  );
}
