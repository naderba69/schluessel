// src/components/CoachBlock.tsx — حضور المدرب اليومي (N-148 · D248 — §2.10): درّبني + النوافذ + إغلاق اليوم
// الحارس: تثبيت ومهارات فقط (أخطاؤك وحروفك — لا جديد) · الأحد صمت (isRestDay) · بلا لوم (D23)
import { useMemo, useRef, useState } from "react";
import { audioPlayer } from "../lib/audio-player.js";
import type { CoachWindow, ErrorEntry, Word } from "../../content/schemas/index.js";
import {
  DEFAULT_WINDOWS,
  MINUTE_CONVERSATION_ASK_AR,
  MINUTE_CONVERSATION_REVEAL_AR,
  MINUTE_CONVERSATION_TITLE_AR,
  MINUTE_CONVERSATION_YOU_AR,
  ON_THE_GO_GAP_MS,
  ON_THE_GO_REPEAT_AR,
  ON_THE_GO_SAFETY_AR,
  ON_THE_GO_TITLE_AR,
  RECURRING_TITLE_AR,
  SKILL_OF_DAY_HINT_AR,
  WINDOW_LABELS_AR,
  WEEKLY_CHALLENGE_DONE_AR,
  dayIndexOfYear,
  isRestDay,
  minuteConversation,
  onTheGoQueue,
  pickCoachDrill,
  pickRecurringDrill,
  playOnTheGo,
  skillOfDay,
  weeklyChallenge,
} from "../lib/coach-engine.js";
import { sentenceOfTheDay } from "../lib/writing.js";
import { coachEveningReport, tomorrowPreview } from "../lib/warmth-engine.js";
import { alphabetLetters, dialoguePairs, numberLines, timeLines } from "./SkillsLab.js";
import { VideoCorner } from "./VideoCorner.js";
import { PlayButton } from "./LessonSession.js";

export function CoachBlock({
  errors,
  dueCount,
  hasNewContent,
  windows = DEFAULT_WINDOWS,
  words = [],
  studiedToday = false,
  shadowLessonId = null,
  onStartShadow,
}: {
  errors: readonly ErrorEntry[];
  dueCount: number;
  hasNewContent: boolean;
  /** D304: هل درس المتعلم اليوم (من جلسة اليوم) — لسطر التقرير المسائي فقط */
  studiedToday?: boolean;
  /** D306: حوار الظل اليوم (null = لا ظل) + بدئه — تبويب المدرب يدل على الشادوينغ */
  shadowLessonId?: string | null;
  onStartShadow?: () => void;
  /** N-151 (D251): نوافذ المتعلم من طقس البداية/الإعدادات — الافتراضي الثلاث */
  windows?: readonly CoachWindow[];
  /** N-148 (D252): كلمات الدرس لعبارة اليوم — تصل مع الحزمة؛ القائمة لا تنتظرها (تعزيز تدريجي) */
  words?: readonly Word[];
}) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [challengeDone, setChallengeDone] = useState(false);
  const [dialogueRevealed, setDialogueRevealed] = useState(false);
  const rest = isRestDay(new Date());
  const challenge = weeklyChallenge(new Date());
  const dialogue = useMemo(dialoguePairs, []);
  const convo = minuteConversation(dayIndexOfYear(), dialogue);
  const drill = useMemo(() => pickCoachDrill(errors), [errors]);
  const recurring = useMemo(() => pickRecurringDrill(errors), [errors]);
  const [recurringRevealed, setRecurringRevealed] = useState(false);
  const showRecurring = recurring !== null && recurring.id !== drill?.id;
  const letters = useMemo(alphabetLetters, []);
  const letter = letters.length > 0 ? letters[dayIndexOfYear() % letters.length]! : null;
  const numbers = useMemo(numberLines, []);
  const times = useMemo(timeLines, []);
  const skill = skillOfDay(dayIndexOfYear(), { letter: letters, number: numbers, time: times });
  const [goRunning, setGoRunning] = useState(false);
  const [goPlayed, setGoPlayed] = useState(0);
  const goQueue = skill ? onTheGoQueue(dayIndexOfYear(), skill.line, dialogue) : [];
  const goCancel = useRef(false);
  const startOnTheGo = () => {
    goCancel.current = false;
    setGoRunning(true);
    setGoPlayed(0);
    void playOnTheGo(
      audioPlayer(),
      goQueue,
      ON_THE_GO_GAP_MS,
      (played) => setGoPlayed(played),
      () => goCancel.current,
    ).finally(() => setGoRunning(false));
  };
  const evening = new Date().getHours() >= 21;
  const phrase = words.length > 0 ? sentenceOfTheDay(words.map((w) => ({ de: w.de, ar: w.ar[0]! })), dayIndexOfYear()) : null;
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
      <NotificationOptIn />
      {phrase && (
        <p data-testid="coach-phrase">
          ☀️ عبارة اليوم (10 ثوانٍ — اسمع وردّد): <span dir="ltr">«{phrase.de}»</span>{" "}
          <span dir="rtl">— {phrase.ar}</span>{" "}
          <PlayButton speakText={phrase.de} label={`استمع لعبارة اليوم: ${phrase.de}`} />
        </p>
      )}
      {skill && !rest && (
        <p data-testid="skill-of-day">
          🎯 مهارة اليوم — {skill.labelAr}: <span dir="ltr">«{skill.line.text}»</span>{" "}
          <PlayButton audioId={skill.line.id} speakText={skill.line.text} label={`استمع لمهارة اليوم: ${skill.line.text}`} />{" "}
          <small>{SKILL_OF_DAY_HINT_AR}</small>
        </p>
      )}
      {convo && !rest && (
        <div data-testid="minute-conversation">
          <p>
            {MINUTE_CONVERSATION_TITLE_AR}: <span dir="ltr">«{convo.pair.q.text}»</span>{" "}
            <PlayButton audioId={convo.pair.q.id} speakText={convo.pair.q.text} label={`استمع لسؤال مولر: ${convo.pair.q.text}`} />
          </p>
          <p><small>{MINUTE_CONVERSATION_ASK_AR}</small></p>
          {!dialogueRevealed ? (
            <button data-testid="convo-reveal" onClick={() => setDialogueRevealed(true)}>
              {MINUTE_CONVERSATION_REVEAL_AR}
            </button>
          ) : (
            <p data-testid="convo-answer">
              <span dir="ltr">«{convo.pair.a.text}»</span>{" "}
              <PlayButton audioId={convo.pair.a.id} speakText={convo.pair.a.text} label={`استمع لجواب مولر: ${convo.pair.a.text}`} />{" "}
              <small>{MINUTE_CONVERSATION_YOU_AR}</small>
            </p>
          )}
        </div>
      )}
      {goQueue.length > 0 && !rest && (
        <div data-testid="on-the-go">
          <p>{ON_THE_GO_TITLE_AR} ({goQueue.length} مقاطع — {ON_THE_GO_REPEAT_AR})</p>
          <p><small>{ON_THE_GO_SAFETY_AR}</small></p>
          {!goRunning ? (
            <button data-testid="go-start" onClick={startOnTheGo}>
              ابدأ وضع الطريق ▶
            </button>
          ) : (
            <>
              <p data-testid="go-progress" aria-live="polite">
                عُزِف {goPlayed} من {goQueue.length}…
              </p>
              <button data-testid="go-stop" onClick={() => { goCancel.current = true; }}>
                أوقف ⏹
              </button>
            </>
          )}
        </div>
      )}
      {challenge && !challengeDone && (
        <div data-testid="weekly-challenge">
          <p>
            {challenge.titleAr} (دعوة لا امتحان — {challenge.durationSec} ثانية): {challenge.taskAr}
          </p>
          <button data-testid="challenge-done" onClick={() => setChallengeDone(true)}>
            قدّمتها بصوت عالٍ ✓
          </button>
        </div>
      )}
      {challenge && challengeDone && <p data-testid="challenge-praise">{WEEKLY_CHALLENGE_DONE_AR}</p>}
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
      {showRecurring && !rest && recurring && (
        <div data-testid="recurring-error">
          <p>
            {RECURRING_TITLE_AR} (تكرر {recurring.occurrences} مرات):{" "}
            <span dir="ltr">«{recurring.payload.wrong}»</span>
          </p>
          {!recurringRevealed ? (
            <button data-testid="recurring-reveal" onClick={() => setRecurringRevealed(true)}>
              أظهر التصحيح
            </button>
          ) : (
            <>
              <p data-testid="recurring-answer" dir="ltr">
                ✓ {recurring.payload.correct}
              </p>
              <p>{recurring.payload.explanation}</p>
            </>
          )}
        </div>
      )}
      {shadowLessonId && !rest && (
        <div data-testid="shadow-entry">
          <p>
            🎙️ ظل اليوم: حوار <span dir="ltr">{shadowLessonId}</span> (3 دقائق)
          </p>
          <button data-testid="shadow-entry-start" onClick={onStartShadow}>
            ابدأ الظل
          </button>
        </div>
      )}
      {evening && !rest && (
        <div data-testid="day-closing">
          <p data-testid="coach-evening-report">
            {coachEveningReport({ resolvedCount: errors.filter((e) => e.resolved).length, studiedToday })}
          </p>
          <p>🌙 ماذا تتذكر من اليوم؟ قلها بصوت عالٍ — النوم يثبّتها.</p>
          <p data-testid="tomorrow-preview">{tomorrowPreview({ hasNewContent, dueCount })}</p>
        </div>
      )}
      <VideoCorner />
    </section>
  );
}

/** D272: تفعيل تذكير النوافذ — اختياري صريح؛ الرفض يُحترم بلا لوم ولا إلحاح */
export function NotificationOptIn() {
  const supported = typeof Notification !== "undefined";
  const [perm, setPerm] = useState<string>(supported ? Notification.permission : "unsupported");
  if (!supported) return null;
  if (perm === "granted")
    return <p data-testid="notify-status">🔔 تذكير النوافذ مفعّل — مولر ينبض بلطف في وقتك 🌱</p>;
  if (perm === "denied")
    return (
      <p data-testid="notify-status">🔕 التذكير مطفأ من المتصفح — لا بأس إطلاقاً، المدرب هنا متى جئت.</p>
    );
  return (
    <button
      data-testid="notify-enable"
      onClick={() => {
        Notification.requestPermission().then(setPerm).catch(() => setPerm(Notification.permission));
      }}
    >
      🔔 فعّل تذكير النوافذ (اختياري)
    </button>
  );
}
