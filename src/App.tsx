// src/App.tsx — القشرة: أول تشغيل → تبويبات خمسة (اليوم · الخريطة · المدرب · الدفتر · الإعدادات) + حصة الدرس الحالي + بوابة Quiz + حفظ التقدّم (S0.6/S0.7/S0.8 + M1 + D117 + N-155/D269)
import { useEffect, useMemo, useRef, useState } from "react";
import type { CoachWindow, LearnerState, OpenSession, SrsCardState, Unit0Card } from "./../content/schemas/index.js";
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
import { CoachPulse } from "./components/CoachPulse.js";
import { DosePicker } from "./components/DosePicker.js";
import { MicroSession } from "./components/MicroSession.js";
import { ReflectionCard } from "./components/ReflectionCard.js";
import { BorrowedProvider } from "./components/StruckText.js";
import { planLessonStations, type SrsDuePair } from "./lib/lesson-runner.js";
import type { Station } from "./lib/lesson-engine.js";
import { cardsForEvent, loadUnit0Deck } from "./lib/unit0.js";
import { eveningReport, tomorrowPreview, muellerMessage } from "./lib/warmth-engine.js";
import {
  PATH,
  LESSON_INDEX,
  LESSON_ORDER,
  indexEntry,
  levelOfWord,
  loadSessionBundle,
  loadWords,
  loadFirstSession,
  type SessionBundle,
} from "./lesson-packs.js";
import { phrasesAvailable } from "./lib/phrase-bank.js";
import { currentLessonId, lessonAfter, openSessionFor, quizAttempts, reconcileState, recordQuizAttempt, setOpenSession } from "./lib/lesson-path.js";
import { dailyDoseForChoice, readPlannedDose, recordSession, writePlannedDose, type DoseChoice } from "./lib/session-log.js";
import type { QuizOutcome } from "./lib/quiz-session.js";
import { browserLearnerStore, type LearnerStore } from "./stores/learner-store.js";
import { SkillsLab } from "./components/SkillsLab.js";
import { DAY_FOCUS_AR, dayFocus, weekDots } from "./lib/day-engine.js";
import { PULSE_BODY_AR, PULSE_TITLE_AR, SNOOZE_MIN, isRestDay, pulseKey, readPulseStore, shouldPulse, writePulseStore } from "./lib/coach-engine.js";
import { CoachBlock } from "./components/CoachBlock.js";
import { GoldenBook } from "./components/GoldenBook.js";
import { buildErrorRound, upsertGoldenError, type ErrorSkill } from "./lib/errors-engine.js";
import { MAX_DUE_PER_SESSION, applySrsRating, countDueSrs, dueSrsCards } from "./lib/review-engine.js";
import { BRAND } from "./lib/brand.js";
import { buildProgressMap } from "./lib/progress-engine.js";
import { MapView } from "./components/MapView.js";
import { SystemLab } from "./components/SystemLab.js";
import { BottomNav } from "./components/BottomNav.js";
import { SettingsView } from "./components/SettingsView.js";
import type { MainTab } from "./components/main-tabs.js";

const MAIN_STYLE = { maxWidth: 720, margin: "0 auto" } as const; // N-155 (D270): الحشوة والخط من app.css وحدها (مصدر واحد — قانون 30)

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
  errors,
  onCapture,
  onResolveError,
  srsCards,
  onSrsRated,
}: {
  bundle: SessionBundle;
  /** N-150 (D250): أخطاء الدفتر + الالتقاط + الحل */
  errors: readonly import("./../content/schemas/index.js").ErrorEntry[];
  onCapture: (input: { skill: ErrorSkill; wrong: string; correct: string; explanation: string; source: string; closeSlip: boolean }) => void;
  onResolveError: (errorId: string) => void;
  /** D273: بطاقات SRS + حفظ التقييم — المستحق يُراجَع ويُجدوَل */
  srsCards: readonly SrsCardState[];
  onSrsRated: (srsCardId: string, rating: import("./lib/review-engine.js").RecallRating) => void;
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
  /** D273: أزواج المستحق (الحالة + الكلمة) — كلمات الدروس الأخرى تُحمَّل كسلاً */
  const [srsDue, setSrsDue] = useState<readonly SrsDuePair[]>([]);
  useEffect(() => {
    let alive = true;
    const due = dueSrsCards(srsCards).slice(0, MAX_DUE_PER_SESSION);
    const have = new Map(bundle.words.map((w) => [w.id, w]));
    const missing = due.map((c) => c.cardId).filter((id) => !have.has(id));
    Promise.allSettled(missing.map((id) => loadWords([id]).then((ws) => ws[0]!))).then((rs) => {
      if (!alive) return;
      for (const r of rs) if (r.status === "fulfilled" && r.value) have.set(r.value.id, r.value);
      setSrsDue(due.flatMap((card) => { const word = have.get(card.cardId); return word ? [{ card, word }] : []; }));
    });
    return () => { alive = false; };
  }, [bundle.words, srsCards]);
  const plan = useMemo(
    () => planLessonStations(lesson, bundle.words, bundle.rules, bundle.story, bundle.scripts, buildErrorRound([...errors]), srsDue),
    [bundle, errors, srsDue],
  );
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
            onErrorResolved={(id) => onResolveError(id)}
            onSrsRated={(id, r) => onSrsRated(id, r)}
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
            lessonId={lesson.id}
            onGrade={(g) => onCapture(g)}
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
              onGrade={({ item, given, verdict }) =>
                onCapture({
                  skill: item.choices ? "lesen" : "schreiben",
                  wrong: given || "—",
                  correct: item.a,
                  explanation: item.why ?? "قارن إجابتك بالتصحيح واستنتج الفرق.",
                  source: `${lesson.id}/quiz`,
                  closeSlip: verdict === "close",
                })
              }
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
  /** D274: جرعة اليوم المخططة (45/90/120) + الجلسة المصغّرة */
  const [plannedDose, setPlannedDose] = useState<DoseChoice>(() => readPlannedDose(localDay()));
  const [micro, setMicro] = useState<{ pairs: SrsDuePair[] | null } | null>(null);
  const microStart = useRef<number>(0);
  const [finishedNote, setFinishedNote] = useState<string | null>(null);
  /** N-155 (D269): التبويب الحالي — اليوم افتراضياً (قالب ثابت، قانون 16) */
  const [tab, setTab] = useState<MainTab>("today");
  /** D272: نافذة المدرب الحائنة الآن — شريط على الشاشة + إشعار نظام */
  const [pulse, setPulse] = useState<CoachWindow | null>(null);
  /** N-155 (D269): وضع المطوّر (#labs في العنوان) — المخابر مخفية عن المتعلم تماماً */
  const [labsMode, setLabsMode] = useState(
    () => typeof window !== "undefined" && window.location.hash === "#labs",
  );
  const [jitCard, setJitCard] = useState<Unit0Card | null>(null);

  useEffect(() => {
    const onHash = () => setLabsMode(window.location.hash === "#labs");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

/** D272: نبض النوافذ — فحص كل 30 ثانية؛ أثناء الحصة صمت (وضع التركيز) */
  useEffect(() => {
    if (!state || session) return;
    const windows = state.profile.coachWindows;
    const tick = () => {
      const now = new Date();
      const store = readPulseStore();
      const w = shouldPulse(now, windows, store);
      if (!w) return;
      const key = pulseKey(now, w);
      writePulseStore({ seen: [...store.seen, key], snoozeUntilMs: store.snoozeUntilMs });
      setPulse(w);
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          const n = new Notification(PULSE_TITLE_AR, { body: PULSE_BODY_AR[w], tag: key });
          n.onclick = () => {
            window.focus();
            setTab("coach");
            setPulse(null);
          };
        } catch {
          /* الإشعار رفاهية — الشريط على الشاشة هو الأساس */
        }
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, session]);

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

  // N-050: حزمة الدرس الأول عند الحاجة (أول تشغيل أو تبويب المدرب أو وضع المطوّر) — لا مع الغلاف
  useEffect(() => {
    // العائد بحالة محفوظة لا يحتاج الدرس الأول — يُحمَّل له وحده عند تبويب المدرب أو #labs
    const needFirst = (boot.phase === "ready" && (!state || onboarding)) || tab === "coach" || labsMode;
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
  }, [boot.phase, state, onboarding, tab, labsMode, firstBundle, firstError]);

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
  /** N-149 (D249): الخريطة الهادئة §2.8 — من الفهرس والتقدم الحقيقيين */
  const map = buildProgressMap({
    index: LESSON_INDEX,
    completedIds: state.progress.completedLessons,
    availableIds: state.progress.availableLessons,
    currentId,
    createdAtDay: state.profile.createdAt,
    todayDay: localDay(),
    srsCards: state.srsCards,
    cardLevelOf: levelOfWord,
  });
  /** N-147 (D247): شاشة اليوم §2.2 — نقاط الأسبوع + المستحق + الذهبية */
  const weekday = new Date().toLocaleDateString("ar", { weekday: "long" });
  const week = weekDots(state.sessions);
  const dueCount = countDueSrs(state.srsCards, localDay());
  const goldenCount = state.errors.length;
  /** D275: تركيز اليوم + إدخال اليوم + المساء (لبطاقة الغد) */
  const focus = DAY_FOCUS_AR[dayFocus(new Date())];
  const todayEntry = state.sessions.find((s) => s.date === localDay());
  const evening = new Date().getHours() >= 21;

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

  /** D274: الجلسة المصغّرة — المستحق الأقدم أولاً (بسقف الحصة)؛ الكلمة الغائبة تُتخطى بلا كسر */
  const startMicro = () => {
    if (!state) return;
    const due = dueSrsCards(state.srsCards).slice(0, MAX_DUE_PER_SESSION);
    if (due.length === 0) return;
    microStart.current = Date.now();
    setMicro({ pairs: null });
    void Promise.all(due.map((c) => loadWords([c.cardId]).then((ws) => ws[0], () => undefined))).then((words) => {
      const byId = new Map(words.flatMap((w) => (w ? [[w.id, w]] : [])));
      setMicro({ pairs: due.flatMap((card) => { const word = byId.get(card.cardId); return word ? [{ card, word }] : []; }) });
    });
  };

  const finishMicro = () => {
    const s = stateRef.current;
    if (s) {
      const minutes = Math.max(1, Math.round((Date.now() - microStart.current) / 60000));
      try {
        commit({ ...s, sessions: recordSession(s.sessions, { date: localDay(), durationMinutes: minutes, srsMinutes: minutes }) });
      } catch (e) {
        setSaveError(errText(e));
      }
    }
    setMicro(null);
    setFinishedNote("أحسنت — جلسة مصغّرة كاملة 🌱 كل مراجعة تثبّت.");
  };

  const rateSrs = (id: string, rating: import("./lib/review-engine.js").RecallRating) => {
    const st = stateRef.current;
    if (st) commit({ ...st, srsCards: applySrsRating(st.srsCards, id, rating) });
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
        commit({ ...s, sessions: recordSession(s.sessions, { date: localDay(), dose: dailyDoseForChoice(plannedDose), durationMinutes: minutes, wordsNew: session.bundle?.lesson.praesentation.wordIds.length ?? 0 }) });
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
        {/* N-151 (D251): اسم الرحلة أعلى الشاشة طوال الرحلة (§2.11) — اختياري */}
        {(state.profile.journeyName ?? "").trim() && (
          <span data-testid="journey-name"> · 🗺️ رحلة «{(state.profile.journeyName ?? "").trim()}»</span>
        )}
      </p>
      {pulse && !session && !labsMode && (
        <CoachPulse
          window={pulse}
          onTrain={() => {
            setTab("coach");
            setPulse(null);
          }}
          onSnooze={() => {
            const store = readPulseStore();
            writePulseStore({ seen: store.seen, snoozeUntilMs: Date.now() + SNOOZE_MIN * 60000 });
            setPulse(null);
          }}
          onDismiss={() => setPulse(null)}
        />
      )}
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
      {labsMode ? (
        <div data-testid="labs-view">
          <p data-testid="labs-note">🔧 وضع المطوّر — مختبرات الفحص (مخفية عن المتعلم).</p>
          {firstError ? (
            <p role="alert">تعذّر تجهيز المختبرات ({firstError}).</p>
          ) : firstBundle ? (
            <>
              <SkillsLab currentLessonId={currentId} words={firstBundle.direct} />
              <SystemLab
                words={firstBundle.direct}
                progress={state.progress}
                profile={{
                  name: state.profile.name,
                  journeyName: state.profile.journeyName ?? "",
                  coachWindows: state.profile.coachWindows ?? ["midday", "afternoon", "evening"],
                }}
                onSaveProfile={(patch) => commit({ ...state, profile: { ...state.profile, ...patch } })}
              />
            </>
          ) : (
            <p data-testid="lab-loading">جارٍ تجهيز المختبرات…</p>
          )}
        </div>
      ) : tab === "map" ? (
        <MapView map={map} />
      ) : tab === "coach" ? (
        <CoachBlock
          errors={state.errors}
          dueCount={dueCount}
          hasNewContent={!!current}
          windows={state.profile.coachWindows}
          words={firstBundle?.direct ?? []}
        />
      ) : tab === "golden" ? (
        <GoldenBook errors={state.errors} />
      ) : tab === "settings" ? (
        <SettingsView
          profile={{
            name: state.profile.name,
            journeyName: state.profile.journeyName ?? "",
            coachWindows: state.profile.coachWindows ?? ["midday", "afternoon", "evening"],
          }}
          onSaveProfile={(patch) => commit({ ...state, profile: { ...state.profile, ...patch } })}
          onWipe={() =>
            void store.clear().then(
              () => {
                setState(null);
                setSession(null);
                setMicro(null);
                setTab("today");
              },
              (e) => setSaveError(errText(e)),
            )
          }
        />
      ) : (
        <>
      <p data-testid="week-dots">
        <span dir="ltr">{week.dots.map((d) => (d ? "●" : "○")).join("")}</span> أسبوعك ({week.studied}/7)
      </p>
      {!micro && !session && dueCount > 0 && (
        <button data-testid="start-micro" onClick={startMicro}>
          ⚡ جلسة مصغّرة — {dueCount} مستحقة (نحو 10 دقائق)
        </button>
      )}
      {micro ? (
        micro.pairs ? (
          <MicroSession pairs={micro.pairs} onRated={rateSrs} onFinish={finishMicro} />
        ) : (
          <p data-testid="micro-loading">جارٍ تجهيز الجلسة المصغّرة…</p>
        )
      ) : session ? (
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
          errors={state.errors}
          onCapture={(input) => {
            const s = stateRef.current;
            if (s) commit({ ...s, errors: upsertGoldenError(s.errors, input) });
          }}
          onResolveError={(id) => {
            const s = stateRef.current;
            if (s) commit({ ...s, errors: s.errors.map((e) => (e.id === id ? { ...e, resolved: true } : e)) });
          }}
          srsCards={state.srsCards}
          onSrsRated={rateSrs}
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
          <DosePicker
            value={plannedDose}
            onChange={(d) => {
              setPlannedDose(d);
              writePlannedDose(localDay(), d);
            }}
          />
          <button data-testid="start-session" onClick={startSession}>
            ▶ ابدأ جلسة اليوم ({plannedDose} دقيقة)
          </button>
          <ul data-testid="today-counts">
            <li data-testid="due-count">مراجعات مستحقة اليوم: {dueCount} بطاقة</li>
            <li data-testid="golden-count">أخطاؤك الذهبية: {goldenCount}</li>
          </ul>
        </>
      ) : (
        <p data-testid="path-complete">أكملت كل ما نُشر من الدروس ✓ — الدروس التالية قيد الإنتاج.</p>
      )}

      {!micro && !session && (
        <>
          <p data-testid="day-focus">
            تركيز اليوم: {focus.label} — {focus.tip}
          </p>
          {todayEntry && todayEntry.durationMinutes > 0 && (
            <ReflectionCard
              key={todayEntry.date}
              initial={todayEntry.reflection ?? {}}
              onSave={(learned, tomorrow) => {
                const s = stateRef.current;
                if (s)
                  commit({
                    ...s,
                    sessions: recordSession(s.sessions, { date: localDay(), durationMinutes: 0, reflection: { learned, tomorrow } }),
                  });
              }}
            />
          )}
          {(evening || todayEntry?.reflection) && (
            <p data-testid="tomorrow-card">
              {tomorrowPreview({ hasNewContent: !!current, dueCount })}
              {todayEntry?.reflection?.tomorrow ? ` قلتَ إن الغد يحتاج: ${todayEntry.reflection.tomorrow} 🌱` : ""}
            </p>
          )}
        </>
      )}

      {isRestDay(new Date()) && (
        <p data-testid="rest-day-note">🌿 اليوم الأحد راحة — لا شيء مطلوب منك. زر الجلسة يعمل لمن أراد، بلا لوم.</p>
      )}
        </>
      )}
      {!session && !micro && !labsMode && <BottomNav tab={tab} onTab={setTab} />}
    </main>
  );
}
