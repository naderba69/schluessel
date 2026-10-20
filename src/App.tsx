// src/App.tsx — القشرة: أول تشغيل → مسار الدروس + حصة الدرس الحالي + بوابة Quiz + حفظ التقدّم (S0.6/S0.7/S0.8 + M1 + D117)
import { useEffect, useMemo, useRef, useState } from "react";
import type { LearnerState, Lesson, Unit0Card } from "./../content/schemas/index.js";
import { GenderBadge } from "./components/GenderBadge.js";
import { FirstRun } from "./components/FirstRun.js";
import { LessonSession } from "./components/LessonSession.js";
import {
  RecallStation,
  LearnStation,
  PracticeStation,
  CloseStation,
  JitCardOverlay,
} from "./components/LessonContent.js";
import { QuizStation } from "./components/QuizStation.js";
import { BorrowedProvider } from "./components/StruckText.js";
import { lessonStatus } from "./lib/routes.js";
import { planLessonStations } from "./lib/lesson-runner.js";
import type { Station } from "./lib/lesson-engine.js";
import { cardsForEvent, loadUnit0Deck } from "./lib/unit0.js";
import { eveningReport, tomorrowPreview, muellerMessage } from "./lib/warmth-engine.js";
import {
  firstLesson,
  firstLessonWords,
  runtimeWordsForLesson,
  ALL_LESSONS,
  ALL_GRAMMAR_RULES,
  ALL_STORY,
  PHRASE_BANK,
  LESSON_ORDER,
} from "./lesson-packs.js";
import { phrasesAvailable } from "./lib/phrase-bank.js";
import { currentLessonId, lessonAfter, quizAttempts, reconcileState, recordQuizAttempt } from "./lib/lesson-path.js";
import type { QuizOutcome } from "./lib/quiz-session.js";
import { browserLearnerStore, type LearnerStore } from "./stores/learner-store.js";
import { SkillsLab } from "./components/SkillsLab.js";
import { SystemLab } from "./components/SystemLab.js";

const STATUS_LABEL: Record<string, string> = {
  completed: "✓ مكتمل",
  available: "● الدرس الحالي",
  locked: "🔒 مقفل",
};

const MAIN_STYLE = { fontFamily: "sans-serif", padding: 24, maxWidth: 720, margin: "0 auto" } as const;
const LESSON_BY_ID = new Map(ALL_LESSONS.map((l) => [l.id, l]));

/** تاريخ اليوم بتوقيت الجهاز (لا UTC — في تونس بعد منتصف الليل يختلف اليوم) */
export function localDay(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** حصة درس واحد (D29: 120 دقيقة متصلة) — الدرس ثابت طوال الحصة ولو فُتح التالي بالنجاح في وسطها */
function LessonRun({
  lesson,
  priorAttempts,
  hasNext,
  onAttempt,
  onFinish,
}: {
  lesson: Lesson;
  priorAttempts: number;
  hasNext: boolean;
  onAttempt: (o: QuizOutcome) => void;
  onFinish: (last: QuizOutcome | null) => void;
}) {
  const plan = useMemo(() => planLessonStations(lesson, runtimeWordsForLesson(lesson), ALL_GRAMMAR_RULES, ALL_STORY), [lesson]);
  /** §6 + قانون الجبهة: Redemittel ضمن سياق الدرس — مما ظهر حتى درس الحصة فقط */
  const redemittel = useMemo(() => phrasesAvailable(PHRASE_BANK, LESSON_ORDER, lesson.id).slice(0, 6), [lesson.id]);
  const [done, setDone] = useState<Partial<Record<Station, boolean>>>(() => ({
    recall: plan.recall.length === 0,
    learn: plan.learn.length === 0 && plan.rules.length === 0,
  }));
  const [last, setLast] = useState<QuizOutcome | null>(null);
  const mark = (s: Station) => setDone((d) => ({ ...d, [s]: true }));
  const due = plan.close.srsBundleWordIds.length;

  return (
    <BorrowedProvider words={lesson.praesentation.borrowedWords ?? []}>
    <LessonSession
      done={done}
      onFinish={() => onFinish(last)}
      content={{
        recall: <RecallStation cards={plan.recall} onDone={() => mark("recall")} />,
        learn: <LearnStation cards={plan.learn} rules={plan.rules} onDone={() => mark("learn")} />,
        practice: <PracticeStation data={plan.practice} redemittel={redemittel} onDone={() => mark("practice")} />,
        close: (
          <>
            <QuizStation
              lesson={lesson}
              priorAttempts={priorAttempts}
              onAttemptComplete={(o) => {
                setLast(o);
                mark("close");
                onAttempt(o);
              }}
            />
            {last && (
              <CloseStation
                data={plan.close}
                report={eveningReport({ cardsReviewed: plan.recall.length, trapsNoticed: plan.close.warningCards.length })}
                preview={
                  last.passed && !hasNext
                    ? "أكملت كل ما نُشر من الدروس حتى الآن — الدروس التالية قيد الإنتاج. ☀️"
                    : tomorrowPreview({ hasNewContent: last.passed, dueCount: due })
                }
                muellerLine={muellerMessage(0)}
              />
            )}
          </>
        ),
      }}
    />
    </BorrowedProvider>
  );
}

type Boot = { phase: "loading" } | { phase: "ready" } | { phase: "error"; message: string };

export function App({ store: injected }: { store?: LearnerStore }) {
  const store = useMemo(() => injected ?? browserLearnerStore(), [injected]);
  const [boot, setBoot] = useState<Boot>({ phase: "loading" });
  const [state, setState] = useState<LearnerState | null>(null);
  const stateRef = useRef<LearnerState | null>(null);
  stateRef.current = state;
  const [onboarding, setOnboarding] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [session, setSession] = useState<{ lesson: Lesson; priorAttempts: number } | null>(null);
  const [finishedNote, setFinishedNote] = useState<string | null>(null);
  const [labOpen, setLabOpen] = useState(false);
  const [systemOpen, setSystemOpen] = useState(false);
  const [jitCard, setJitCard] = useState<Unit0Card | null>(null);

  // التحميل: الحالة المحفوظة ← مصالحة المسار مع ترتيب المحتوى الحالي · التالفة لا تُمسّ (شاشة إنقاذ)
  useEffect(() => {
    let alive = true;
    store.load().then(
      (s) => {
        if (!alive) return;
        setState(s ? reconcileState(s, ALL_LESSONS) : null);
        setBoot({ phase: "ready" });
      },
      (e) => {
        if (alive) setBoot({ phase: "error", message: errText(e) });
      },
    );
    return () => {
      alive = false;
    };
  }, [store]);

  /** كل تغيير في الحالة يُحفظ فوراً — والفشل يُعلن (لا يُبلع) */
  const commit = (next: LearnerState) => {
    stateRef.current = next;
    setState(next);
    store.save(next).then(
      () => setSaveError(null),
      (e) => setSaveError(errText(e)),
    );
  };

  if (boot.phase === "loading") {
    return (
      <main style={MAIN_STYLE}>
        <p data-testid="boot-loading">جارٍ تحميل تقدّمك…</p>
      </main>
    );
  }

  if (boot.phase === "error") {
    const download = async () => {
      const blob = new Blob([await store.rawDump()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `schluessel-raw-${localDay()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
    return (
      <main style={MAIN_STYLE} data-testid="boot-error">
        <h1>تعذّرت قراءة تقدّمك المحفوظ</h1>
        <p>البيانات على هذا الجهاز لا تطابق المخطط (تالفة أو من إصدار غير متوافق). لم نغيّر منها شيئاً.</p>
        <p>
          <small dir="ltr">{boot.message.slice(0, 300)}</small>
        </p>
        <button data-testid="raw-dump" onClick={() => void download()}>
          ⬇️ نزّل نسخة خام من بياناتك
        </button>{" "}
        {!confirmReset ? (
          <button data-testid="reset-start" onClick={() => setConfirmReset(true)}>
            ابدأ من جديد…
          </button>
        ) : (
          <p>
            سيُمحى كل التقدّم المحفوظ على هذا الجهاز نهائياً — نزّل النسخة الخام أولاً.{" "}
            <button
              data-testid="reset-confirm"
              onClick={() =>
                void store.clear().then(
                  () => {
                    setState(null);
                    setConfirmReset(false);
                    setBoot({ phase: "ready" });
                  },
                  (e) => setBoot({ phase: "error", message: errText(e) }),
                )
              }
            >
              نعم، امحُ وابدأ من جديد
            </button>{" "}
            <button onClick={() => setConfirmReset(false)}>تراجع</button>
          </p>
        )}
      </main>
    );
  }

  if (!state || onboarding) {
    return (
      <main style={MAIN_STYLE}>
        <FirstRun
          onComplete={(s) => {
            setOnboarding(true);
            commit(reconcileState(s, ALL_LESSONS));
          }}
          onFinish={() => setOnboarding(false)}
          firstLesson={firstLesson}
          firstLessonWords={firstLessonWords}
        />
      </main>
    );
  }

  const currentId = currentLessonId(state.progress, ALL_LESSONS);
  const current = currentId ? LESSON_BY_ID.get(currentId) ?? null : null;
  const completedCount = state.progress.completedLessons.filter((id) => LESSON_BY_ID.has(id)).length;

  const openSession = () => {
    if (!current) return;
    setFinishedNote(null);
    setSession({ lesson: current, priorAttempts: quizAttempts(state.progress, current.id) });
  };

  // الوحدة صفر JIT (§9): بطاقة عند أول استخدام فعلي — لا دفعة واحدة (قانون 23)
  const startSession = () => {
    const due = cardsForEvent(loadUnit0Deck(), state.profile.unit0Shown, "first-uebung");
    if (due.length > 0) setJitCard(due[0]);
    else openSession();
  };

  const dismissJit = () => {
    if (jitCard) {
      commit({ ...state, profile: { ...state.profile, unit0Shown: [...state.profile.unit0Shown, jitCard.id] } });
    }
    setJitCard(null);
    openSession();
  };

  const onAttempt = (o: QuizOutcome) => {
    const s = stateRef.current;
    if (!s) return;
    try {
      commit(recordQuizAttempt(s, o, ALL_LESSONS, localDay(), LESSON_BY_ID.get(o.lessonId)?.zusammenfassung.srsBundleWordIds ?? [])); // N-005 (D227)
    } catch (e) {
      setSaveError(errText(e)); // قفل المسار لا يُتجاوز بصمت — يُعلن
    }
  };

  const onFinish = (last: QuizOutcome | null) => {
    if (!session) return;
    const id = session.lesson.id;
    const next = lessonAfter(id, ALL_LESSONS);
    setFinishedNote(
      last?.passed
        ? `أنهيت حصة ${id} ونجحت (${last.percent}%) ✓ — ${next ? `فُتح الدرس التالي: ${next}` : "أكملت كل ما نُشر حتى الآن"}.`
        : `أنهيت حصة ${id} — الدرس يبقى مفتوحاً، وتعود إليه في حصتك القادمة بنسخة اختبار أخرى. لا بأس: «ليس بعد» ليست «لا».`,
    );
    setSession(null);
  };

  return (
    <main style={MAIN_STYLE}>
      <h1>أهلاً {state.profile.name} — رحلتك بدأت</h1>
      <p data-testid="post-first-run">
        أكملت {completedCount} من {ALL_LESSONS.length} درساً منشوراً
        {current ? ` · الدرس الحالي: ${current.id}` : " · أكملت كل ما نُشر حتى الآن"}
      </p>
      {!store.persistent && (
        <p data-testid="no-storage" role="alert">
          ⚠️ التخزين المحلي غير متاح في هذا المتصفح — تقدّمك يبقى في هذه الجلسة فقط.
        </p>
      )}
      {saveError && (
        <p data-testid="save-error" role="alert">
          ⚠️ تعذّر حفظ آخر تغيير ({saveError}) — تقدّمك ما زال في هذه الجلسة؛ لا تغلق الصفحة قبل أن يعود الحفظ.
        </p>
      )}
      {finishedNote && <p data-testid="finished-note">{finishedNote}</p>}

      <h2>حصة اليوم (120 دقيقة متصلة — D29)</h2>
      {jitCard && <JitCardOverlay card={jitCard} onDismiss={dismissJit} />}
      {session ? (
        <LessonRun
          key={`${session.lesson.id}-${session.priorAttempts}`}
          lesson={session.lesson}
          priorAttempts={session.priorAttempts}
          hasNext={lessonAfter(session.lesson.id, ALL_LESSONS) !== null}
          onAttempt={onAttempt}
          onFinish={onFinish}
        />
      ) : current ? (
        <>
          <p data-testid="current-lesson" data-lesson-id={current.id}>
            <span dir="ltr">{current.id}</span> — {current.ziel.ar}
          </p>
          <button data-testid="start-session" onClick={startSession}>
            ▶ ابدأ الحصة
          </button>
        </>
      ) : (
        <p data-testid="path-complete">أكملت كل ما نُشر من الدروس ✓ — الدروس التالية قيد الإنتاج.</p>
      )}

      <h2>مختبر المهارات (M2 — E09–E16)</h2>
      {labOpen ? (
        <SkillsLab />
      ) : (
        <button data-testid="open-skills-lab" onClick={() => setLabOpen(true)}>
          🧪 افتح مختبر المهارات
        </button>
      )}

      <h2>لوحة النظام (M3)</h2>
      {systemOpen ? (
        <SystemLab />
      ) : (
        <button data-testid="open-system-lab" onClick={() => setSystemOpen(true)}>
          🛠️ افتح لوحة النظام
        </button>
      )}

      <h2>مسارك</h2>
      <ul data-testid="path-list">
        {ALL_LESSONS.map((l) => {
          const status = lessonStatus(l.id, state.progress);
          return (
            <li key={l.id} data-status={status} data-lesson-id={l.id}>
              <span dir="ltr">{l.id}</span> — {l.ziel.ar} — {STATUS_LABEL[status]}
            </li>
          );
        })}
      </ul>

      <h2>الترميز المزدوج للجنس (§15‑هـ)</h2>
      <p>
        <GenderBadge gender="der" word="Tisch" /> | <GenderBadge gender="die" word="Wohnung" /> |{" "}
        <GenderBadge gender="das" word="Kind" />
      </p>
    </main>
  );
}
