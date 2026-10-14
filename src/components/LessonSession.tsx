// src/components/LessonSession.tsx — واجهة الحصة الكاملة (§2.3 — 4 محطات 15/40/50/15 + 3 استراحات)
// قفل الاتجاه من E01 (لا ارتجاع — قانون 3) · محاولة قبل كشف (F121) · §2.5 (أظهر الإجابة ثم قيّم)
// E05: التسجيل «لأذنك أنت» (D16) · E07: تصحيح لطيف (F077) · E08: تقرير مسائي + معاينة الغد (D23)
import { useState } from "react";
import type { Station } from "../lib/lesson-engine.js";
import { STATIONS, STATION_MINUTES, BREAKS_AFTER, canMove } from "../lib/lesson-engine.js";
import { RATING_LABELS_AR, type RecallRating } from "../lib/review-engine.js";
import { PLAYBACK_SPEEDS, RECORDING_DISCLAIMER_AR } from "../lib/audio-engine.js";
import { audioPlayer } from "../lib/audio-player.js";
import type { DictationComparison } from "../lib/dictation-engine.js";

export const STATION_LABELS_AR: Record<Station, string> = {
  recall: "استرجاع",
  learn: "الجديد",
  practice: "تدريب",
  close: "الخلاصة",
};

/** شريط التقدم بأربع نقاط (§2.3 — تعرف أين أنت دائماً) */
export function SessionProgress({ current }: { current: Station }) {
  return (
    <nav data-testid="session-progress" aria-label="محطات الحصة">
      {STATIONS.map((s) => (
        <span
          key={s}
          data-station={s}
          data-current={s === current ? "yes" : "no"}
          aria-current={s === current ? "step" : undefined}
        >
          {s === current ? "●" : "○"} {STATION_LABELS_AR[s]} ({STATION_MINUTES[s]}د)
        </span>
      ))}
    </nav>
  );
}

/** استراحة مقترحة بعد كل محطة (§2.3 — بلا ضغط) */
export function BreakPrompt({ after, onContinue }: { after: Station; onContinue: () => void }) {
  return (
    <section data-testid="break-prompt" data-after={after}>
      <p>استراحة قصيرة ☕ — اشرب ماءً وعُد متى شئت. الحصة واحدة متصلة والراحة جزء منها.</p>
      <button onClick={onContinue}>أكمل — {STATION_LABELS_AR[STATIONS[STATIONS.indexOf(after) + 1]]}</button>
    </section>
  );
}

/**
 * زر الاستماع (D104 — القانون 11: كل كلمة قابلة للسماع دائماً): المقطع الملتزم أولاً ← Web Speech احتياطاً.
 * الإعادة بلا سقف ولا عقوبة (D23).
 */
export function PlayButton({ audioId, speakText }: { audioId?: string; speakText: string }) {
  return (
    <button
      type="button"
      data-testid="play-audio"
      data-audio-id={audioId ?? ""}
      aria-label={`استمع: ${speakText}`}
      onClick={() => void audioPlayer().play({ trackId: audioId, text: speakText })}
    >
      🔊
    </button>
  );
}

/** شاشة الاسترجاع §2.5: حاول أولاً ← أظهر الإجابة ← قيّم (نسخت|صعب|جيد|سهل) */
export function RecallCardView({
  front,
  back,
  revealed,
  onReveal,
  onRate,
  audioId,
  speakText,
}: {
  front: string;
  back: string;
  revealed: boolean;
  onReveal: () => void;
  onRate: (rating: RecallRating) => void;
  audioId?: string;
  speakText?: string;
}) {
  return (
    <article data-testid="recall-card" data-revealed={revealed ? "yes" : "no"}>
      <p dir="ltr">
        {front} <PlayButton audioId={audioId} speakText={speakText ?? front} />
      </p>
      {!revealed ? (
        <>
          <p>أولاً: حاول تذكر! 💭</p>
          <button data-testid="reveal-btn" onClick={onReveal}>
            أظهر الإجابة
          </button>
        </>
      ) : (
        <>
          <p data-testid="recall-back" dir="ltr">
            {back}
          </p>
          <p>كم كانت صعبة؟</p>
          <div>
            {(Object.keys(RATING_LABELS_AR) as RecallRating[]).map((r) => (
              <button key={r} data-rating={r} onClick={() => onRate(r)}>
                {RATING_LABELS_AR[r]}
              </button>
            ))}
          </div>
        </>
      )}
    </article>
  );
}

/** محطة الجديد (F121): محاولة قبل الكشف — زر الكشف معطّل حتى تحاول */
export function LearnCardView({
  promptDe,
  promptAr,
  attempted,
  revealed,
  explanation,
  onAttempt,
  onReveal,
  audioId,
  speakText,
}: {
  promptDe: string;
  promptAr: string;
  attempted: boolean;
  revealed: boolean;
  explanation: string;
  onAttempt: () => void;
  onReveal: () => void;
  audioId?: string;
  speakText?: string;
}) {
  return (
    <article data-testid="learn-card" data-revealed={revealed ? "yes" : "no"}>
      <p dir="ltr">
        {promptDe} <PlayButton audioId={audioId} speakText={speakText ?? promptDe} />
      </p>
      <p>{promptAr}</p>
      {!revealed ? (
        <>
          <button data-testid="attempt-btn" onClick={onAttempt}>
            حاول أولاً
          </button>
          <button data-testid="learn-reveal-btn" onClick={onReveal} disabled={!attempted}>
            أظهر الشرح
          </button>
        </>
      ) : (
        <p data-testid="learn-explanation">{explanation}</p>
      )}
    </article>
  );
}

/** أدوات الصوت التفاعلي (E05): سرعات F044 + تسجيل shadowing بتحذير D16 الصريح */
export function AudioControlsView({ clipLabel }: { clipLabel: string }) {
  return (
    <section data-testid="audio-controls">
      <p dir="ltr">{clipLabel}</p>
      <button data-testid="play-btn">▶ تشغيل</button>
      {PLAYBACK_SPEEDS.map((s) => (
        <button key={s} data-speed={s}>
          {s}×
        </button>
      ))}
      <button data-testid="record-btn">⏺ سجّل صوتك (Shadowing)</button>
      <p data-testid="recording-disclaimer">{RECORDING_DISCLAIMER_AR}</p>
    </section>
  );
}

/** النسخ المسموع (E07): تسمع وتكتب — تصحيح مولر اللطيف (F077) */
export function DictationView({
  comparison,
  onReplay,
}: {
  comparison: DictationComparison | null;
  onReplay: () => void;
}) {
  return (
    <section data-testid="dictation-view">
      <button data-testid="dictation-replay" onClick={onReplay}>
        🔊 أعد الاستماع (بلا عقوبة)
      </button>
      <input aria-label="اكتب ما سمعت" dir="ltr" placeholder="اكتب ما سمعته..." />
      <button data-testid="dictation-check">تحقق</button>
      {comparison && (
        <p data-testid="dictation-feedback" data-status={comparison.status}>
          {comparison.feedback}
        </p>
      )}
    </section>
  );
}

/** الخلاصة (E08): تقرير المساء بسطر + معاينة الغد + كلمة مولر */
export function CloseView({ report, preview, muellerLine }: {
  report: string;
  preview: string;
  muellerLine: string;
}) {
  return (
    <section data-testid="close-view">
      <p data-testid="evening-report">{report}</p>
      <p data-testid="tomorrow-preview">{preview}</p>
      <p data-testid="mueller-close">— {muellerLine}</p>
    </section>
  );
}

export type StationContent = {
  recall?: React.ReactNode;
  learn?: React.ReactNode;
  practice?: React.ReactNode;
  close?: React.ReactNode;
};

/** صدفة الحصة: محطة واحدة في كل شاشة + استراحة بين المحطات + قفل اتجاه (E01) */
export function LessonSession({ content }: { content?: StationContent }) {
  const [index, setIndex] = useState(0);
  const [onBreak, setOnBreak] = useState(false);
  const station = STATIONS[index];

  const advance = () => {
    // قفل الاتجاه (E01): التقدم فقط — لا ارتجاع ولا قفز
    const next = STATIONS[index + 1];
    if (next && canMove(station, next)) {
      if (BREAKS_AFTER.includes(station)) setOnBreak(true);
      else setIndex(index + 1);
    }
  };

  if (onBreak) {
    return (
      <section data-testid="lesson-session" data-station={station}>
        <SessionProgress current={station} />
        <BreakPrompt
          after={station}
          onContinue={() => {
            setOnBreak(false);
            setIndex(index + 1);
          }}
        />
      </section>
    );
  }

  return (
    <section data-testid="lesson-session" data-station={station}>
      <SessionProgress current={station} />
      {content?.[station] ?? (
        <p data-testid="station-placeholder">محطة: {STATION_LABELS_AR[station]}</p>
      )}
      <p>
        <button data-testid="back-btn" disabled title="لا ارتجاع — قانون 3">
          السابق
        </button>
        <button data-testid="next-btn" onClick={advance}>
          {station === "close" ? "أنهِ الحصة" : "التالي"}
        </button>
      </p>
    </section>
  );
}
