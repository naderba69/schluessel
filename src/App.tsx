// src/App.tsx — القشرة: أول تشغيل → مسار الدروس + حصة الدرس الحالي + بوابة Quiz + حفظ التقدّم (S0.6/S0.7/S0.8 + M1 + D117)
import { useEffect, useMemo, useRef, useState } from "react";
import type { LearnerState, OpenSession, Unit0Card } from "./../content/schemas/index.js";
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
  PATH,
  LESSON_INDEX,
  LESSON_ORDER,
  indexEntry,
  loadSessionBundle,
  loadFirstSession,
  type SessionBundle,
} from "./lesson-packs.js";
import { phrasesAvailable } from "./lib/phrase-bank.js";
import { currentLessonId, lessonAfter, openSessionFor, quizAttempts, reconcileState, recordQuizAttempt, setOpenSession } from "./lib/lesson-path.js";
import { recordSession } from "./lib/session-log.js";
import type { QuizOutcome } from "./lib/quiz-session.js";
import { browserLearnerStore, type LearnerStore } from "./stores/learner-store.js";
import { SkillsLab } from "./components/SkillsLab.js";
import { weekDots } from "./lib/day-engine.js";
import { countDueSrs } from "./lib/review-engine.js";
import { BRAND } from "./lib/brand.js";
import { SystemLab } from "./components/SystemLab.js";

const STATUS_LABEL: Record<string, string> = {
  completed: "✓ مكتمل",
  available: "● الدرس الحالي",
  locked: "🔒 مقفل",
};

const MAIN_STYLE = { fontFamily: "sans-serif", padding: 24, maxWidth: 720, margin: "0 auto" } as const;
const INDEX_IDS = new Set(LESSON_ORDER);

/** تاريخ اليوم بتوقيت الجهاز (لا UTC — في تونس بعد منتصف الليل يختلف اليوم) */
export function localDay(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** حصة درس واحد (D29: 120 دقيقة متصلة) — الدرس ثابت طوال الحصة ولو فُتح التالي بالنجاح في وسطها */
function LessonRun({
  bundle,
  priorAttempts,
  hasNext,
  onAttempt,
  onFinish,
  initialOpen,
  onProgress,
  unit0Shown,
  onUnit0Show,
}: {
  bundle: SessionBundle;
  priorAttempts: number;
  hasNext: boolean;
  onAttempt: (o: QuizOutcome) => void;
  onFinish: (last: QuizOutcome | null) => void;
  /** N-006: لقطة حصة سابقة لهذا الدرس تُستأنف (محطة+بنود+اختبار) */
  initialOpen?: OpenSession;
  /** N-006: يُنادى عند كل تقدّم داخل الحصة لحفظ اللقطة */
  onProgress: (open: OpenSession) => void;
  /** N-049 (D233): بطاقات الوحدة صفر المعروضة + حفظ العرض الدائم */
  unit0Shown: readonly string[];
  onUnit0Show: (id: string) => void;
}) {
  const { lesson } = bundle;
  const plan = useMemo(() => planLessonStations(lesson, bundle.words, bundle.rules, bundle.story, bundle.scripts), [bundle]);
  /** §6 + قانون الجبهة: Redemittel ضمن سياق الدرس — مما ظهر حتى درس الحصة فقط */
  const redemittel = useMemo(() => phrasesAvailable(bundle.bank, LESSON_ORDER, lesson.id).slice(0, 6), [bundle]);
  const [done, setDone] = useState<Partial<Record<Station, boolean>>>(() => ({
    recall: plan.recall.length === 0 || initialOpen?.done.includes("recall") === true,
    learn: (plan.learn.length === 0 && plan.rules.length === 0) || initialOpen?.done.includes("learn") === true,
    ...(initialOpen?.done.includes("practice") ? { practice: true as const } : {}),
    ...(initialOpen?.done.includes("close") ? { close: true as const } : {}),
  }));
  const [last, setLast] = useState<QuizOutcome | null>(null);
  /** N-006: مرآة قابلة للتغيير للقطة — تُدفع كاملة عند كل تقدّم (لا إغلاقات قديمة) */
  const snap = useRef({
    station: initialOpen?.station ?? "recall",
    done: new Set<Station>(initialOpen?.done ?? []),
    pos: {
      recall: initialOpen?.pos.recall,
      learn: initialOpen?.pos.learn ? { ...initialOpen.pos.learn } : undefined,
      practice: initialOpen?.pos.practice ? { ...initialOpen.pos.practice } : undefined,
    },
    quiz: initialOpen?.quiz,
  });
  const save = () => {
    const pos: OpenSession["pos"] = {};
    if (snap.current.pos.recall !== undefined) pos.recall = snap.current.pos.recall;
    if (snap.current.pos.learn) pos.learn = { ...snap.current.pos.learn };
    if (snap.current.pos.practice) pos.practice = { ...snap.current.pos.practice };
    onProgress({
      lessonId: lesson.id,
      station: snap.current.station,
      done: [...snap.current.done],
      pos,
      ...(snap.current.quiz ? { quiz: snap.current.quiz } : {}),
    });
  };
  const mark = (st: Station) => {
    snap.current.done.add(st);
    setDone((d) => ({ ...d, [st]: true }));
    save();
  };
  const due = plan.close.srsBundleWordIds.length;

  return (
    <BorrowedProvider words={lesson.praesentation.borrowedWords ?? []}>
    <LessonSession
      done={done}
      onFinish={() => onFinish(last)}
      initialStation={initialOpen?.station}
      onStationChange={(st) => {
        snap.current.station = st;
        save();
      }}
      content={{
        recall: (
          <RecallStation
            cards={plan.recall}
            onDone={() => mark("recall")}
            initialIndex={initialOpen?.pos.recall}
            onProgress={(i) => {
              snap.current.pos.recall = i;
              save();
            }}
          />
        ),
        learn: (
          <LearnStation
            cards={plan.learn}
            rules={plan.rules}
            onDone={() => mark("learn")}
            initialIndex={initialOpen?.pos.learn?.index}
            initialRuleIndex={initialOpen?.pos.learn?.ruleIndex}
            onProgress={(i, r) => {
              snap.current.pos.learn = { index: i, ruleIndex: r };
              save();
            }}
          />
        ),
        practice: (
          <PracticeStation
            data={plan.practice}
            redemittel={redemittel}
            onDone={() => mark("practice")}
            unit0Shown={unit0Shown}
            onUnit0Show={onUnit0Show}
            initial={initialOpen?.pos.practice}
            onProgress={(st, i) => {
              snap.current.pos.practice = { station: st, item: i };
              save();
            }}
          />
        ),
        close: (
          <>
            <QuizStation
              lesson={lesson}
              priorAttempts={priorAttempts}
              initialQuiz={initialOpen?.quiz}
              onQuizProgress={(q) => {
                snap.current.quiz = q;
                save();
              }}
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
  const [session, setSession] = useState<{ lessonId: string; bundle: SessionBundle | null; priorAttempts: number } | null>(null);
  const openToken = useRef(0); // N-050: حارس تسابق فتح الحصص — آخر طلب وحده يُعتمد
  /** حزمة الدرس الأول (الشاشة الأولى والمخابر) — تُحمَّل عند الحاجة فقط */
  const [firstBundle, setFirstBundle] = useState<SessionBundle | null>(null);
  const [firstError, setFirstError] = useState<string | null>(null);
  const sessionStart = useRef<number>(0); // N-007: بداية الحصة لقياس مدتها عند النهاية
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
        setState(s ? reconcileState(s, PATH) : null);
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

  // N-050: حزمة الدرس الأول عند الحاجة (الشاشة الأولى أو المخابر) — لا مع الغلاف
  useEffect(() => {
    // العائد بحالة محفوظة لا يحتاج الدرس الأول — يُحمَّل له وحده عند فتح مختبر
    const needFirst = (boot.phase === "ready" && (!state || onboarding)) || labOpen || systemOpen;
    if (!needFirst || firstBundle || firstError) return;
    let alive = true;
    void loadFirstSession().then(
      (b) => {
        if (alive) setFirstBundle(b);
      },
      (e) => {
        if (alive) setFirstError(errText(e));
      },
    );
    return () => {
      alive = false;
    };
  }, [boot.phase, state, onboarding, labOpen, systemOpen, firstBundle, firstError]);

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
    if (firstError) {
      return (
        <main style={MAIN_STYLE}>
          <p role="alert">تعذّر تجهيز درسك الأول ({firstError}) — تحقق من الاتصال وأعد تحميل الصفحة.</p>
        </main>
      );
    }
    if (!firstBundle) {
      return (
        <main style={MAIN_STYLE}>
          <p data-testid="first-loading">جارٍ تجهيز درسك الأول…</p>
        </main>
      );
    }
    return (
      <main style={MAIN_STYLE}>
        <FirstRun
          onComplete={(s) => {
            setOnboarding(true);
            commit(reconcileState(s, PATH));
          }}
          onFinish={() => setOnboarding(false)}
          firstLesson={firstBundle.lesson}
          firstLessonWords={firstBundle.direct}
        />
      </main>
    );
  }

  const currentId = currentLessonId(state.progress, PATH);
  const current = currentId ? indexEntry(currentId) : null;
  const completedCount = state.progress.completedLessons.filter((id) => INDEX_IDS.has(id)).length;
  /** N-147 (D247): شاشة اليوم §2.2 — نقاط الأسبوع + المستحق + الذهبية */
  const weekday = new Date().toLocaleDateString("ar", { weekday: "long" });
  const week = weekDots(state.sessions);
  const dueCount = countDueSrs(state.srsCards, localDay());
  const goldenCount = state.errors.length;

  const openSession = () => {
    if (!currentId) return;
    const id = currentId;
    const t = ++openToken.current;
    setFinishedNote(null);
    sessionStart.current = Date.now();
    setSession({ lessonId: id, bundle: null, priorAttempts: quizAttempts(state.progress, id) });
    void loadSessionBundle(id).then(
      (bundle) => {
        if (openToken.current === t) setSession((s) => (s && s.lessonId === id ? { ...s, bundle } : s));
      },
      (e) => {
        if (openToken.current !== t) return;
        setSession(null);
        setFinishedNote(`تعذّر فتح حصة ${id} (${errText(e)}) — تحقق من الاتصال وأعد المحاولة.`);
      },
    );
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
      commit(recordQuizAttempt(s, o, PATH, localDay(), session?.bundle?.lesson.zusammenfassung.srsBundleWordIds ?? [])); // N-005 (D227)
    } catch (e) {
      setSaveError(errText(e)); // قفل المسار لا يُتجاوز بصمت — يُعلن
    }
  };

  const onProgress = (open: OpenSession) => {
    const s = stateRef.current;
    if (!s || !session || open.lessonId !== session.lessonId) return;
    try {
      commit({ ...s, progress: setOpenSession(s.progress, open) });
    } catch (e) {
      setSaveError(errText(e));
    }
  };

  const onFinish = (last: QuizOutcome | null) => {
    if (!session) return;
    const id = session.lessonId;
    // N-007: سجل الجلسة اليومي — المدة من بداية الحصة (دقيقة على الأقل)، والجديد = كلمات الدرس
    const s = stateRef.current;
    if (s) {
      const minutes = Math.max(1, Math.round((Date.now() - sessionStart.current) / 60000));
      try {
        commit({ ...s, sessions: recordSession(s.sessions, { date: localDay(), durationMinutes: minutes, wordsNew: session.bundle?.lesson.praesentation.wordIds.length ?? 0 }) });
      } catch (e) {
        setSaveError(errText(e));
      }
    }
    const next = lessonAfter(id, PATH);
    setFinishedNote(
      last?.passed
        ? `أنهيت حصة ${id} ونجحت (${last.percent}%) ✓ — ${next ? `فُتح الدرس التالي: ${next}` : "أكملت كل ما نُشر حتى الآن"}.`
        : `أنهيت حصة ${id} — الدرس يبقى مفتوحاً، وتعود إليه في حصتك القادمة بنسخة اختبار أخرى. لا بأس: «ليس بعد» ليست «لا».`,
    );
    setSession(null);
  };

  return (
    <main style={MAIN_STYLE}>
      <p data-testid="brand-header">
        🔑 {BRAND.nameAr} — <span dir="ltr">{BRAND.nameDe}</span> · {BRAND.sloganAr}
      </p>
      <h1>أهلاً {state.profile.name} · اليوم: {weekday}</h1>
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

      {jitCard && <JitCardOverlay card={jitCard} onDismiss={dismissJit} />}
      <p data-testid="week-dots">
        <span dir="ltr">{week.dots.map((d) => (d ? "●" : "○")).join("")}</span> أسبوعك ({week.studied}/7)
      </p>
      {session ? (
        session.bundle ? (
        <LessonRun
          key={`${session.lessonId}-${session.priorAttempts}`}
          bundle={session.bundle}
          priorAttempts={session.priorAttempts}
          hasNext={lessonAfter(session.lessonId, PATH) !== null}
          onAttempt={onAttempt}
          onFinish={onFinish}
          initialOpen={openSessionFor(state.progress, session.lessonId)}
          onProgress={onProgress}
          unit0Shown={state.profile.unit0Shown}
          onUnit0Show={(id) => {
            if (!stateRef.current!.profile.unit0Shown.includes(id))
              commit({ ...stateRef.current!, profile: { ...stateRef.current!.profile, unit0Shown: [...stateRef.current!.profile.unit0Shown, id] } });
          }}
        />
        ) : (
          <p data-testid="session-loading">جارٍ فتح حصة {session.lessonId}…</p>
        )
      ) : current ? (
        <>
          <p data-testid="current-lesson" data-lesson-id={current.id}>
            <span dir="ltr">{current.id}</span> — {current.zielAr}
          </p>
          <button data-testid="start-session" onClick={startSession}>
            ▶ ابدأ جلسة اليوم (120 دقيقة)
          </button>
          <ul data-testid="today-counts">
            <li data-testid="due-count">مراجعات مستحقة اليوم: {dueCount} بطاقة</li>
            <li data-testid="golden-count">أخطاؤك الذهبية: {goldenCount}</li>
          </ul>
        </>
      ) : (
        <p data-testid="path-complete">أكملت كل ما نُشر من الدروس ✓ — الدروس التالية قيد الإنتاج.</p>
      )}

      <details data-testid="more-labs">
        <summary>🧪 المخابر والأدوات</summary>
      {labOpen ? (
        firstBundle ? (
          <SkillsLab currentLessonId={currentId} words={firstBundle.direct} />
        ) : (
          <p data-testid="lab-loading">جارٍ تجهيز المختبر…</p>
        )
      ) : (
        <button data-testid="open-skills-lab" onClick={() => setLabOpen(true)}>
          🧪 افتح مختبر المهارات
        </button>
      )}

      {systemOpen ? (
        firstBundle ? (
          <SystemLab words={firstBundle.direct} />
        ) : (
          <p data-testid="lab-loading">جارٍ تجهيز اللوحة…</p>
        )
      ) : (
        <button data-testid="open-system-lab" onClick={() => setSystemOpen(true)}>
          🛠️ افتح لوحة النظام
        </button>
      )}

      </details>
      <details data-testid="more-path">
        <summary>🗺️ مسارك الكامل</summary>
      <p data-testid="post-first-run">
        أكملت {completedCount} من {LESSON_INDEX.length} درساً منشوراً
        {current ? ` · الدرس الحالي: ${current.id}` : " · أكملت كل ما نُشر حتى الآن"}
      </p>
      <ul data-testid="path-list">
        {LESSON_INDEX.map((l) => {
          const status = lessonStatus(l.id, state.progress);
          return (
            <li key={l.id} data-status={status} data-lesson-id={l.id}>
              <span dir="ltr">{l.id}</span> — {l.zielAr} — {STATUS_LABEL[status]}
            </li>
          );
        })}
      </ul>

      </details>
      <details data-testid="more-gender">
        <summary>عن الترميز المزدوج للجنس (§15‑هـ)</summary>
      <p>
        <GenderBadge gender="der" word="Tisch" /> | <GenderBadge gender="die" word="Wohnung" /> |{" "}
        <GenderBadge gender="das" word="Kind" />
      </p>
      </details>
    </main>
  );
}
