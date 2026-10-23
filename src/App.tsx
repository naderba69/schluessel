// src/App.tsx — القشرة: أول تشغيل → تبويبات خمسة (اليوم · الخريطة · المدرب · الدفتر · الإعدادات) + حصة الدرس الحالي + بوابة Quiz + حفظ التقدّم (S0.6/S0.7/S0.8 + M1 + D117 + N-155/D269)
import { useEffect, useMemo, useRef, useState } from "react";
import type { AudioScript, CoachWindow, LearnerState, OpenSession, SrsCardState, Unit0Card } from "./../content/schemas/index.js";
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
import { MeasureStrip } from "./components/MeasureStrip.js";
import { UnitDebriefCard } from "./components/UnitDebrief.js";
import { CalibrationReportCard } from "./components/CalibrationReport.js";
import { WeeklyGoalCard } from "./components/WeeklyGoal.js";
import { FreeReading } from "./components/FreeReading.js";
import { readingPick, toEngineText } from "./lib/reading.js";
import { ShadowingRun } from "./components/ShadowingRun.js";
import { BorrowedProvider } from "./components/StruckText.js";
import { planLessonStations, type SrsDuePair } from "./lib/lesson-runner.js";
import type { Station } from "./lib/lesson-engine.js";
import { cardsForEvent, loadUnit0Deck } from "./lib/unit0.js";
import { eveningReport, tomorrowPreview, muellerMessage } from "./lib/warmth-engine.js";
import {
  PATH,
  ALL_LESETEXTS,
  ALL_PRUEFUNGEN,
  ALL_MODELLTESTS,
  ALL_TRANSFER,
  LESSON_INDEX,
  LESSON_ORDER,
  indexEntry,
  levelOfWord,
  loadLesson,
  loadScriptsForLesson,
  loadSessionBundle,
  loadWords,
  shadowingLessonId,
  loadFirstSession,
  type SessionBundle,
} from "./lesson-packs.js";
import { phrasesAvailable } from "./lib/phrase-bank.js";
import { battleAttempts, currentLessonId, cyclicAttempts, cyclicDue, cyclicTestFor, deferredDue, delayedAttempts, journeyWeek, lessonAfter, mixTransferItems, openSessionFor, passedBattleUnits, passedUnitBattle, quizAttempts, reconcileState, recordCyclicTest, recordDelayedBattle, recordQuizAttempt, setOpenSession, unitDebrief, unitKeyOf } from "./lib/lesson-path.js";
import { dailyDoseForChoice, readPlannedDose, recordSession, writePlannedDose, type DoseChoice } from "./lib/session-log.js";
import { cyclicQuizLesson, type QuizOutcome } from "./lib/quiz-session.js";
import { certificateDate, examSkillAr, levelExamProgress, levelExamReady, levelUnits, modellHoerenQuiz, modellLesenQuiz, modellSchreibenQuiz, modellSprechenRun, modellTotal, recordLevelSection, sectionAttempts, weakExamSections, EXAM_SKILLS, type SprechenGrade } from "./lib/exam-engine.js";
import { browserLearnerStore, type LearnerStore } from "./stores/learner-store.js";
import { SkillsLab } from "./components/SkillsLab.js";
import { DAY_FOCUS_AR, dayFocus, flexWeek, weekDots, weeklyGoalState } from "./lib/day-engine.js";
import { PULSE_BODY_AR, PULSE_TITLE_AR, SNOOZE_MIN, isRestDay, pulseKey, readPulseStore, shouldPulse, writePulseStore } from "./lib/coach-engine.js";
import { CoachBlock } from "./components/CoachBlock.js";
import { GoldenBook } from "./components/GoldenBook.js";
import { buildErrorRound, upsertGoldenError, type ErrorSkill } from "./lib/errors-engine.js";
import { MAX_DUE_PER_SESSION, applySrsRating, countDueSrs, dueSrsCards } from "./lib/review-engine.js";
import { BRAND } from "./lib/brand.js";
import { buildProgressMap } from "./lib/progress-engine.js";
import { MapView } from "./components/MapView.js";
import { ExamSprechenRun } from "./components/ExamSprechenRun.js";
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
  ticks,
  onTick,
}: {
  bundle: SessionBundle;
  /** N-150 (D250): أخطاء الدفتر + الالتقاط + الحل */
  errors: readonly import("./../content/schemas/index.js").ErrorEntry[];
  onCapture: (input: { skill: ErrorSkill; wrong: string; correct: string; explanation: string; source: string; closeSlip: boolean }) => void;
  onResolveError: (errorId: string) => void;
  /** D273: بطاقات SRS + حفظ التقييم — المستحق يُراجَع ويُجدوَل */
  srsCards: readonly SrsCardState[];
  onSrsRated: (srsCardId: string, rating: import("./lib/review-engine.js").RecallRating) => void;
  /** D276: توقيعات Can-do + الحفظ — التفريغ الختامي (ب-5) */
  ticks: readonly { statement: string; done: boolean }[];
  onTick: (statement: string, done: boolean) => void;
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
                ticks={ticks}
                onTick={onTick}
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
  const [deferred, setDeferred] = useState<{ unitKey: string; lessonId: string; bundle: SessionBundle | null } | null>(null); // D277: المعركة المؤجلة الجارية
  const [weeklyGoal, setWeeklyGoal] = useState<{ unitKey: string; goal: string } | null>(null); // D279: هدف الأسبوع (canDo السادس)
  const [shadow, setShadow] = useState<{ lessonId: string; script: AudioScript | null } | null>(null); // D280: الشادوينغ الجاري
  const [reading, setReading] = useState<{ textId: string } | null>(null); // D281: نص الخميس الجاري (النصوص حاضرة — بلا تحميل)
  const [cyclic, setCyclic] = useState<{ testId: string } | null>(null); // D283: الاختبار الدوري الجاري (حاضر — بلا تحميل)
  const [examRun, setExamRun] = useState<false | "lesen" | "hoeren" | "schreiben" | "sprechen">(false); // D287: قسم الامتحان الجاري (حاضر — بلا تحميل)
  const microStart = useRef<number>(0);
  const deferredStart = useRef<number>(0); // D277: بداية المؤجلة لقياس مدتها
  const shadowStart = useRef<number>(0); // D280: بداية الشادوينغ لقياس دقائقه
  const readingStart = useRef<number>(0); // D281: بداية القراءة لقياس دقائقها
  const cyclicStart = useRef<number>(0); // D283: بداية الدوري لقياس دقائقه
  const examStart = useRef<number>(0); // D284: بداية قسم القراءة لقياس دقائقه
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

  // D279: هدف الأسبوع — يُحمَّل مرة لكل وحدة حين يُعلَن (قبل الإرجاع المبكر — قانون الخطافات)
  useEffect(() => {
    const cid = state ? currentLessonId(state.progress, PATH) : null;
    const cur = cid ? indexEntry(cid) : null;
    if (!cur || !state) return;
    const key = unitKeyOf(cur.level, cur.unit);
    const now = new Date();
    const gs = weeklyGoalState(passedUnitBattle(state.progress, key), now.getDay(), now.getHours() >= 21);
    if (gs === "hidden" || weeklyGoal?.unitKey === key) return;
    const d6 = LESSON_INDEX.find((x) => x.day === 6 && unitKeyOf(x.level, x.unit) === key);
    if (!d6) return;
    let live = true;
    void loadLesson(d6.id).then(
      (l) => {
        if (live && l.canDoDaily[0]) setWeeklyGoal({ unitKey: key, goal: l.canDoDaily[0] });
      },
      () => {}, // الفشل = غياب البطاقة لا كسر الشاشة
    );
    return () => {
      live = false;
    };
  });

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
  /** D282: الأسبوع المرن — الحالي والماضي + نافذة العودة (اثنين→أربعاء) */
  const nowFlex = flexWeek(state.sessions);
  const prevFlex = flexWeek(state.sessions, new Date(), 1);
  const hasOlder = state.sessions.some((x) => x.date < prevFlex.monday);
  const returnKind =
    [1, 2, 3].includes(new Date().getDay())
      ? prevFlex.studied > 0 && !prevFlex.success
        ? ("light" as const)
        : prevFlex.studied === 0 && hasOlder
          ? ("back" as const)
          : null
      : null;
  const dueCount = countDueSrs(state.srsCards, localDay());
  const goldenCount = state.errors.length;
  /** D275: تركيز اليوم + إدخال اليوم + المساء (لبطاقة الغد) */
  const focus = DAY_FOCUS_AR[dayFocus(new Date())];
  const todayEntry = state.sessions.find((s) => s.date === localDay());
  const evening = new Date().getHours() >= 21;
  /** D277: اليوم معركة؟ — سبت + الحالي يوم سادس + معركته لم تُجتَز */
  const battleNow =
    new Date().getDay() === 6 && !!current && current.day === 6 &&
    !passedUnitBattle(state.progress, unitKeyOf(current.level, current.unit));
  /** D278: تفريغ الوحدة السابقة — يُعرض أول أيام الوحدة التالية وحدها (لحظة التفريغ) */
  const curIdx = current ? LESSON_INDEX.findIndex((x) => x.id === current.id) : -1;
  const prevEntry =
    curIdx > 0 && current
      ? [...LESSON_INDEX.slice(0, curIdx)]
          .reverse()
          .find((x) => unitKeyOf(x.level, x.unit) !== unitKeyOf(current.level, current.unit))
      : undefined;
  const prevKey = prevEntry ? unitKeyOf(prevEntry.level, prevEntry.unit) : undefined;
  const debrief =
    current?.day === 1 && prevKey && passedUnitBattle(state.progress, prevKey)
      ? unitDebrief(
          state.progress,
          state.errors,
          state.profile.calibration,
          prevKey,
          LESSON_INDEX.filter((x) => unitKeyOf(x.level, x.unit) === prevKey).map((x) => x.id),
        )
      : null;
  /** D278: تقرير المعايرة — كل وحدتين مجتازتين */
  const passedUnits = passedBattleUnits(state.progress);
  const showCalibration = passedUnits.length >= 2 && passedUnits.length % 2 === 0;
  /** D280: الشادوينغ اليومي — أحدث حوار متقن · يُخفى الأحد ومتى تمّ (3 دقائق) */
  const shadowLesson =
    new Date().getDay() === 0 ? undefined : shadowingLessonId(state.progress.completedLessons);
  const shadowDoneToday = (todayEntry?.shadowingMinutes ?? 0) >= 3;
  /** D281: نص الخميس الحر — نص أحدث وحدة مكتملة (i-1) · يُخفَى بعد إتمامه */
  const thursdayPick =
    new Date().getDay() === 4
      ? readingPick(ALL_LESETEXTS, state.progress.completedLessons, (id) => {
          const e = indexEntry(id);
          return e ? { level: e.level, unit: e.unit } : undefined;
        })
      : undefined;
  const thursdayEngine =
    thursdayPick && thursdayPick.level !== "B2"
      ? toEngineText({ id: thursdayPick.id, level: thursdayPick.level, title: thursdayPick.title, text: thursdayPick.text })
      : undefined;
  const readingDoneToday = (todayEntry?.readingMinutes ?? 0) > 0;
  /** D283: الاختبار الدوري — سبت الأسبوع الزوجي (القصير 15 د · الشهرية 45 د) */
  const weekNo = journeyWeek(state.profile.createdAt);
  const weekTest = cyclicTestFor(ALL_PRUEFUNGEN, state.profile.level, weekNo, new Date());
  const dueTest = weekTest && cyclicAttempts(state.progress, weekTest.id) === 0 ? weekTest : undefined;
  const cyclicDone = weekTest !== undefined && cyclicAttempts(state.progress, weekTest.id) > 0;
  /** D284: امتحان المستوى — الأهلية بإتمام معارك الوحدات · القراءة أول الأقسام الحية */
  const modell = ALL_MODELLTESTS.find((m) => m.level === state.profile.level);
  const examUnits = levelUnits(PATH, state.profile.level);
  const examProg = levelExamProgress(state.progress, examUnits);
  const examReady = levelExamReady(state.progress, examUnits);
  const examTotal = modell ? modellTotal(state.progress, modell.id) : null;
  const certDate = modell ? certificateDate(state.progress, modell.id) : null;
  const examWeak = examTotal ? weakExamSections(examTotal.points) : [];
  const lesenParts = modell?.sections.find((s) => s.skill === "lesen")?.parts;
  const hoerenParts = modell?.sections.find((s) => s.skill === "hoeren")?.parts;
  const hoerenQuiz = modell && hoerenParts ? modellHoerenQuiz(modell.id, modell.passingScore, hoerenParts) : null;
  const schreibenParts = modell?.sections.find((s) => s.skill === "schreiben")?.parts;
  const schreibenQuiz = modell && schreibenParts ? modellSchreibenQuiz(modell.id, modell.passingScore, schreibenParts) : null;
  const sprechenParts = modell?.sections.find((s) => s.skill === "sprechen")?.parts;
  const sprechenRun = modell && sprechenParts ? modellSprechenRun(modell.id, modell.passingScore, sprechenParts) : null;
  /** D279: هدف الأسبوع — canDo الأول لاختبار السادس في الوحدة الحالية (يُحمَّل مرة لكل وحدة) */
  const curKey = current ? unitKeyOf(current.level, current.unit) : undefined;
  const goalState =
    current && curKey ? weeklyGoalState(passedUnitBattle(state.progress, curKey), new Date().getDay(), evening) : "hidden";
  /** D277: مؤجلة اليوم؟ — أول وحدة مستحقة يوم الاثنين */
  const deferredKey =
    new Date().getDay() === 1
      ? state.progress.gateResults
        .filter((x) => x.kind === "unit-battle" && x.passed)
        .map((x) => x.gateId)
        .find((u) => deferredDue(state.progress, u, localDay()))
      : undefined;

  const openSession = () => {
    if (!currentId) return;
    const id = currentId;
    const t = ++openToken.current;
    setFinishedNote(null);
    sessionStart.current = Date.now();
    const idx = indexEntry(id);
    const prior = idx && idx.day === 6 ? battleAttempts(state.progress, unitKeyOf(idx.level, idx.unit)) : quizAttempts(state.progress, id);
    setSession({ lessonId: id, bundle: null, priorAttempts: prior });
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

  /** D277: بدء المعركة المؤجلة — اختبار السادس بنسخة جديدة (25 د) */
  const startDeferred = () => {
    if (!state || !deferredKey) return;
    const d6 = LESSON_INDEX.find((e) => e.day === 6 && unitKeyOf(e.level, e.unit) === deferredKey);
    if (!d6) {
      setFinishedNote(`تعذّر إيجاد اختبار ${deferredKey} — أُبلغت الإدارة (N-158).`);
      return;
    }
    deferredStart.current = Date.now();
    setFinishedNote(null);
    setDeferred({ unitKey: deferredKey, lessonId: d6.id, bundle: null });
    const t = ++openToken.current;
    void loadSessionBundle(d6.id).then(
      (bundle) => {
        if (openToken.current === t) setDeferred((d) => (d && d.lessonId === d6.id ? { ...d, bundle } : d));
      },
      (e) => {
        if (openToken.current !== t) return;
        setDeferred(null);
        setFinishedNote(`تعذّر فتح المؤجلة (${errText(e)}) — تحقق من الاتصال وأعد المحاولة.`);
      },
    );
  };

  /** D293: درس المؤجلة — كل نسخه مخلوطة بالتحويل عند وجود حزمة الوحدة (الملح = المحاولات: تناوب عبر الحصص) */
  const deferredLesson = (lesson: SessionBundle["lesson"], unitKey: string) => {
    const pack = ALL_TRANSFER.find((p) => p.level === lesson.level && p.unit === lesson.unit);
    if (!pack) return lesson;
    const salt = battleAttempts(state.progress, unitKey) + delayedAttempts(state.progress, unitKey);
    return {
      ...lesson,
      quiz: {
        ...lesson.quiz,
        variants: lesson.quiz.variants.map((v) => ({ ...v, items: mixTransferItems(v.items, pack.items, salt).items })),
      },
    };
  };

  /** D277: اكتمال المؤجلة — تُسجَّل بلا قفل مسار + دقائقها في سجل اليوم */
  const finishDeferred = (o: QuizOutcome) => {
    const d = deferred;
    if (!d) return;
    // D293: حصة التحويل = حصة النسخة المقدَّمة فعلاً (بلا حزمة = غائبة بصدق)
    const pack = d.bundle ? ALL_TRANSFER.find((p) => p.level === d.bundle!.lesson.level && p.unit === d.bundle!.lesson.unit) : undefined;
    const served = d.bundle?.lesson.quiz.variants[o.variantIndex];
    const share = pack && served ? mixTransferItems(served.items, pack.items, 0).transferShare : undefined;
    const s = stateRef.current;
    if (s) {
      const minutes = Math.max(1, Math.round((Date.now() - deferredStart.current) / 60000));
      try {
        const s1 = recordDelayedBattle(s, d.unitKey, o, localDay(), share);
        commit({ ...s1, sessions: recordSession(s1.sessions, { date: localDay(), durationMinutes: minutes }) });
      } catch (e) {
        setSaveError(errText(e));
      }
    }
    setDeferred(null);
    setFinishedNote(
      o.passed
        ? `المؤجلة تمت (${o.percent}%) ✓ — ذاكرتك أثبتت بعد أسبوع.`
        : `المؤجلة تمت (${o.percent}%) — «ليس بعد» تُراجَع في حصصك القادمة، لا بأس.`,
    );
  };

  /** D280: بدء الشادوينغ — حوار الدرس المتقن (حواري أولاً) */
  const startShadow = () => {
    if (!state || !shadowLesson) return;
    const entry = indexEntry(shadowLesson);
    if (!entry) return;
    shadowStart.current = Date.now();
    setFinishedNote(null);
    setShadow({ lessonId: shadowLesson, script: null });
    const t = ++openToken.current;
    void loadScriptsForLesson(shadowLesson, entry.level).then(
      (scripts) => {
        if (openToken.current !== t) return;
        const pick = scripts.find((s) => s.kind === "dialogue") ?? scripts[0];
        if (!pick) {
          setShadow(null);
          setFinishedNote(`لا حوار في ${shadowLesson} بعد — أُبلغت الإدارة.`);
          return;
        }
        setShadow((d) => (d && d.lessonId === shadowLesson ? { ...d, script: pick } : d));
      },
      (e) => {
        if (openToken.current !== t) return;
        setShadow(null);
        setFinishedNote(`تعذّر فتح الشادوينغ (${errText(e)}) — تحقق من الاتصال وأعد المحاولة.`);
      },
    );
  };

  /** D280: تسجيل الشادوينغ — دقائقه الحقيقية في سجل اليوم (ظل + مدة) */
  const finishShadow = () => {
    const s = stateRef.current;
    if (s) {
      const minutes = Math.max(1, Math.round((Date.now() - shadowStart.current) / 60000));
      try {
        commit({
          ...s,
          sessions: recordSession(s.sessions, { date: localDay(), durationMinutes: minutes, shadowingMinutes: minutes }),
        });
      } catch (e) {
        setSaveError(errText(e));
      }
    }
    setShadow(null);
    setFinishedNote("ظللت حواراً متقناً بصوتك 🎙️ — النطق عضلة وهذه حركتها اليومية.");
  };

  /** D281: بدء نص الخميس — حاضر فوراً (النصوص eager) */
  const startReading = () => {
    if (!thursdayPick || !thursdayEngine) return;
    readingStart.current = Date.now();
    setFinishedNote(null);
    setReading({ textId: thursdayPick.id });
  };

  /** D281: تسجيل القراءة — دقائقها الحقيقية في سجل اليوم */
  const finishReading = () => {
    const s = stateRef.current;
    if (s) {
      const minutes = Math.max(1, Math.round((Date.now() - readingStart.current) / 60000));
      try {
        commit({
          ...s,
          sessions: recordSession(s.sessions, { date: localDay(), durationMinutes: minutes, readingMinutes: minutes }),
        });
      } catch (e) {
        setSaveError(errText(e));
      }
    }
    setReading(null);
    setFinishedNote("قرأت نصاً كاملاً بالألمانية 📖 — القراءة الحرة تبني المعجم بصمت.");
  };

  /** D283: بدء الاختبار الدوري — حاضر فوراً */
  const startCyclic = () => {
    if (!dueTest) return;
    cyclicStart.current = Date.now();
    setFinishedNote(null);
    setCyclic({ testId: dueTest.id });
  };

  /** D283: اكتمال الدوري — يُسجَّل بلا قفل مسار + دقائقه في سجل اليوم */
  const finishCyclic = (o: QuizOutcome) => {
    const c = cyclic;
    const test = weekTest && cyclic?.testId === weekTest.id ? weekTest : undefined;
    if (!c || !test) return;
    const s = stateRef.current;
    if (s) {
      const minutes = Math.max(1, Math.round((Date.now() - cyclicStart.current) / 60000));
      try {
        const s1 = recordCyclicTest(s, test, o, localDay());
        commit({ ...s1, sessions: recordSession(s1.sessions, { date: localDay(), durationMinutes: minutes }) });
      } catch (e) {
        setSaveError(errText(e));
      }
    }
    setCyclic(null);
    setFinishedNote(
      o.passed
        ? `الاختبار الدوري تم (${o.percent}%) ✓ — التراكمي يثبت.`
        : `الاختبار الدوري تم (${o.percent}%) — الفجوات وقود المراجعة، لا بأس.`,
    );
  };

  /** D284: بدء قسم القراءة — حاضر فوراً */
  const startExamLesen = () => {
    if (!modell || !lesenParts || !examReady) return;
    examStart.current = Date.now();
    setFinishedNote(null);
    setExamRun("lesen");
  };

  /** D284: اكتمال القراءة — تُسجَّل قسماً + دقائقها في سجل اليوم */
  const finishExamLesen = (o: QuizOutcome) => {
    if (!modell || examRun !== "lesen") return;
    const points = Math.round(o.score * 25);
    const s = stateRef.current;
    if (s) {
      const minutes = Math.max(1, Math.round((Date.now() - examStart.current) / 60000));
      try {
        const s1 = recordLevelSection(s, modell.id, s.profile.level, "lesen", o, localDay());
        commit({ ...s1, sessions: recordSession(s1.sessions, { date: localDay(), durationMinutes: minutes }) });
      } catch (e) {
        setSaveError(errText(e));
      }
    }
    setExamRun(false);
    setTab("today"); // D284: الملاحظة في تبويب اليوم — نعيده إليه ليراها
    setFinishedNote(`قسم القراءة تم (${points}/25 نقطة) — المجموع الرسمي يكتمل بالأقسام الأربعة.`);
  };

  /** D285: بدء قسم الاستماع — حاضر فوراً */
  const startExamHoeren = () => {
    if (!hoerenQuiz || !examReady) return;
    examStart.current = Date.now();
    setFinishedNote(null);
    setExamRun("hoeren");
  };

  /** D285: اكتمال الاستماع — يُسجَّل قسماً + دقائقه استماعاً في سجل اليوم */
  const finishExamHoeren = (o: QuizOutcome) => {
    if (!modell || examRun !== "hoeren") return;
    const points = Math.floor(o.score * 25);
    const s = stateRef.current;
    if (s) {
      const minutes = Math.max(1, Math.round((Date.now() - examStart.current) / 60000));
      try {
        const s1 = recordLevelSection(s, modell.id, s.profile.level, "hoeren", o, localDay());
        commit({ ...s1, sessions: recordSession(s1.sessions, { date: localDay(), durationMinutes: minutes, listeningMinutes: minutes }) });
      } catch (e) {
        setSaveError(errText(e));
      }
    }
    setExamRun(false);
    setTab("today");
    setFinishedNote(`قسم الاستماع تم (${points}/25 نقطة) — المجموع الرسمي يكتمل بالأقسام الأربعة.`);
  };

  /** D286: بدء قسم الكتابة — حاضر فوراً */
  const startExamSchreiben = () => {
    if (!schreibenQuiz || !examReady) return;
    examStart.current = Date.now();
    setFinishedNote(null);
    setExamRun("schreiben");
  };

  /** D286: اكتمال الكتابة — تُسجَّل قسماً + دقائقها في سجل اليوم */
  const finishExamSchreiben = (o: QuizOutcome) => {
    if (!modell || examRun !== "schreiben") return;
    const points = Math.floor(o.score * 25);
    const s = stateRef.current;
    if (s) {
      const minutes = Math.max(1, Math.round((Date.now() - examStart.current) / 60000));
      try {
        const s1 = recordLevelSection(s, modell.id, s.profile.level, "schreiben", o, localDay());
        commit({ ...s1, sessions: recordSession(s1.sessions, { date: localDay(), durationMinutes: minutes }) });
      } catch (e) {
        setSaveError(errText(e));
      }
    }
    setExamRun(false);
    setTab("today");
    setFinishedNote(`قسم الكتابة تم (${points}/25 نقطة) — المجموع الرسمي يكتمل بالأقسام الأربعة.`);
  };

  /** D287: بدء قسم التحدث — حاضر فوراً */
  const startExamSprechen = () => {
    if (!sprechenRun || !examReady) return;
    examStart.current = Date.now();
    setFinishedNote(null);
    setExamRun("sprechen");
  };

  /** D287: اكتمال التحدث — يُسجَّل قسماً + غير الكامل في الذهبي + دقائقه في سجل اليوم */
  const finishExamSprechen = (o: QuizOutcome, partial: { q: string; model: string; grade: SprechenGrade }[]) => {
    if (!modell || examRun !== "sprechen") return;
    const points = Math.floor(o.score * 25);
    const s = stateRef.current;
    if (s) {
      const minutes = Math.max(1, Math.round((Date.now() - examStart.current) / 60000));
      try {
        const s1 = recordLevelSection(s, modell.id, s.profile.level, "sprechen", o, localDay());
        let errors = s1.errors;
        for (const p of partial) {
          errors = upsertGoldenError(errors, {
            skill: "sprechen",
            wrong: p.grade === 0 ? "تعثّرت في النطق" : "نطقت جزءها فقط",
            correct: p.model,
            explanation: `الموجّه: ${p.q} — كرر النموذج بصوت عالٍ ثلاث مرات.`,
            source: `${modell.id}/sprechen`,
            closeSlip: p.grade === 0.5,
          });
        }
        commit({ ...s1, errors, sessions: recordSession(s1.sessions, { date: localDay(), durationMinutes: minutes }) });
      } catch (e) {
        setSaveError(errText(e));
      }
    }
    setExamRun(false);
    setTab("today");
    setFinishedNote(`قسم التحدث تم (${points}/25 نقطة) — المجموع الرسمي يكتمل بالأقسام الأربعة.`);
  };

  const rateSrs = (id: string, rating: import("./lib/review-engine.js").RecallRating) => {
    const st = stateRef.current;
    if (st) commit({ ...st, srsCards: applySrsRating(st.srsCards, id, rating) });
  };

  const onAttempt = (o: QuizOutcome) => {
    const s = stateRef.current;
    if (!s) return;
    const bl = session?.bundle?.lesson;
    const bKey = bl && bl.day === 6 ? unitKeyOf(bl.level, bl.unit) : undefined; // D277: اختبار السادس معركة وحدة
    try {
      commit(recordQuizAttempt(s, o, PATH, localDay(), session?.bundle?.lesson.zusammenfassung.srsBundleWordIds ?? [], bKey)); // N-005 (D227)
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
        <>
          <MapView map={map} />
          {modell && lesenParts && examTotal && !examRun && hoerenQuiz && schreibenQuiz && sprechenRun && (
            <section data-testid="exam-card">
              <h2>🎓 امتحان المستوى التجريبي</h2>
              {!examReady ? (
                <p data-testid="exam-progress">
                  يفتح بعد إتمام معارك الوحدات ({examProg.done}/{examProg.total})
                </p>
              ) : (
                <>
                  <p data-testid="exam-ready">أنهيت المنهج — الامتحان مفتوح ✓</p>
                  <p data-testid="exam-points">
                    {EXAM_SKILLS.map((sk) => {
                      const v = examTotal.points[sk];
                      return `${examSkillAr(sk)} ${v === null ? "—" : `${v}/25`}`;
                    }).join(" · ")}
                  </p>
                  {examTotal.complete ? (
                    <>
                      <p data-testid="exam-verdict">
                        {examTotal.passed
                          ? `المجموع الرسمي ${examTotal.total}/100 — ناجح 🎓`
                          : `المجموع الرسمي ${examTotal.total}/100 — أعد الأقسام الضعيفة`}
                      </p>
                      {examTotal.passed ? (
                        <section data-testid="exam-cert">
                          <p>
                            🎓 شهادة إتمام داخلية — {state.profile.name} — مستوى {state.profile.level}
                            {certDate ? ` — ${certDate}` : ""}
                          </p>
                          <p data-testid="exam-advice">
                            {examWeak.length === 0
                              ? `توصية: مستواك يؤهلك لامتحان Goethe-Zertifikat ${state.profile.level} الرسمي — احجز بثقة. (تدريبنا داخلي ولا يمنح شهادة رسمية.)`
                              : `توصية: ناجح — لكن قوِّ قبل الحجز الرسمي: ${examWeak.map((s) => `${examSkillAr(s)} (${examTotal.points[s]}/25)`).join(" · ")}. (تدريبنا داخلي ولا يمنح شهادة رسمية.)`}
                          </p>
                        </section>
                      ) : (
                        <p data-testid="exam-advice">
                          توصية: أعد {examWeak.map((s) => `${examSkillAr(s)} (${examTotal.points[s]}/25)`).join(" · ")} ثم
                          أعد الحساب — المجموع يُبنى من آخر نتيجة لكل قسم.
                        </p>
                      )}
                    </>
                  ) : (
                    <p data-testid="exam-total">المجموع الرسمي يكتمل بالأقسام الأربعة</p>
                  )}
                  <button data-testid="start-exam-lesen" onClick={startExamLesen}>
                    ابدأ قسم القراءة (15 بنداً — 25 نقطة)
                  </button>{" "}
                  <button data-testid="start-exam-hoeren" onClick={startExamHoeren}>
                    ابدأ قسم الاستماع 🔊 (15 بنداً — 25 نقطة)
                  </button>{" "}
                  <button data-testid="start-exam-schreiben" onClick={startExamSchreiben}>
                    ابدأ قسم الكتابة ✍️ (8 بنود — 25 نقطة)
                  </button>{" "}
                  <button data-testid="start-exam-sprechen" onClick={startExamSprechen}>
                    ابدأ قسم التحدث 🎙️ (21 بنداً — 25 نقطة)
                  </button>
                  <p data-testid="exam-roadmap">الأقسام الأربعة حيّة ✓ — بالتوفيق 🎓</p>
                </>
              )}
            </section>
          )}
          {modell && lesenParts && examRun === "lesen" && (
            <>
              <p data-testid="exam-lesen-title">قسم القراءة 📖 — {modell.id} (15 بنداً — 25 نقطة)</p>
              <QuizStation
                lesson={modellLesenQuiz(modell.id, modell.passingScore, lesenParts)}
                priorAttempts={sectionAttempts(state.progress, modell.id, "lesen")}
                onAttemptComplete={finishExamLesen}
                onGrade={({ item, given, verdict }) => {
                  const s = stateRef.current;
                  if (s)
                    commit({
                      ...s,
                      errors: upsertGoldenError(s.errors, {
                        skill: "lesen",
                        wrong: given || "—",
                        correct: item.a,
                        explanation: item.why ?? "قارن إجابتك بالتصحيح واستنتج الفرق.",
                        source: `${modell.id}/lesen`,
                        closeSlip: verdict === "close",
                      }),
                    });
                }}
              />
            </>
          )}
          {modell && hoerenQuiz && examRun === "hoeren" && (
            <>
              <p data-testid="exam-hoeren-title">قسم الاستماع 🔊 — {modell.id} (15 بنداً — 25 نقطة)</p>
              <QuizStation
                lesson={hoerenQuiz.quiz}
                priorAttempts={sectionAttempts(state.progress, modell.id, "hoeren")}
                audio={{
                  tracksFor: (_item, index) => hoerenQuiz.tracks[index] ?? [],
                  playsFor: (_item, index) => hoerenQuiz.plays[index] ?? 0,
                }}
                onAttemptComplete={finishExamHoeren}
                onGrade={({ item, given, verdict }) => {
                  const s = stateRef.current;
                  if (s)
                    commit({
                      ...s,
                      errors: upsertGoldenError(s.errors, {
                        skill: "hoeren",
                        wrong: given || "—",
                        correct: item.a,
                        explanation: item.why ?? "قارن إجابتك بالتصحيح واستنتج الفرق.",
                        source: `${modell.id}/hoeren`,
                        closeSlip: verdict === "close",
                      }),
                    });
                }}
              />
            </>
          )}
          {modell && schreibenQuiz && examRun === "schreiben" && (
            <>
              <p data-testid="exam-schreiben-title">قسم الكتابة ✍️ — {modell.id} (8 بنود — 25 نقطة)</p>
              <QuizStation
                lesson={schreibenQuiz}
                priorAttempts={sectionAttempts(state.progress, modell.id, "schreiben")}
                onAttemptComplete={finishExamSchreiben}
                onGrade={({ item, given, verdict }) => {
                  const s = stateRef.current;
                  if (s)
                    commit({
                      ...s,
                      errors: upsertGoldenError(s.errors, {
                        skill: "schreiben",
                        wrong: given || "—",
                        correct: item.a,
                        explanation: item.why ?? "قارن إجابتك بالتصحيح واستنتج الفرق.",
                        source: `${modell.id}/schreiben`,
                        closeSlip: verdict === "close",
                      }),
                    });
                }}
              />
            </>
          )}
          {modell && sprechenRun && examRun === "sprechen" && (
            <>
              <p data-testid="exam-sprechen-title">قسم التحدث 🎙️ — {modell.id} (21 بنداً — 25 نقطة)</p>
              <ExamSprechenRun
                runId={sprechenRun.id}
                passingScore={sprechenRun.passingScore}
                prompts={sprechenRun.prompts}
                onComplete={finishExamSprechen}
              />
            </>
          )}
        </>
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
      <p data-testid="flex-week">
        {nowFlex.success
          ? `أسبوع ناجح ✓ — ${nowFlex.days45} أيام × 45 دقيقة`
          : nowFlex.days45 > 0
            ? `${nowFlex.days45} من 3 — ثلاثة أيام × 45 دقيقة تكفي لأسبوع ناجح`
            : "ثلاثة أيام × 45 دقيقة تكفي لأسبوع ناجح"}
      </p>
      {returnKind === "light" && (
        <p data-testid="flex-return">الأسبوع الماضي كان خفيفاً — وهذا طبيعي. هذا الأسبوع يبدأ نظيفاً 🌱</p>
      )}
      {returnKind === "back" && (
        <p data-testid="flex-return">عدت — وهذا أهم شيء. نبدأ بخفة، بلا ديون 🌱</p>
      )}
      {!micro && !session && !deferred && !shadow && !reading && !cyclic && dueCount > 0 && (
        <button data-testid="start-micro" onClick={startMicro}>
          ⚡ جلسة مصغّرة — {dueCount} مستحقة (نحو 10 دقائق)
        </button>
      )}
      {cyclic && weekTest && cyclic.testId === weekTest.id ? (
        <>
          <p data-testid="cyclic-title">
            {weekTest.kind === "monatspruefung" ? "المعركة الشهرية 🏆" : "الاختبار القصير 📝"} — {weekTest.id} ({weekTest.timeBudgetMin} دقيقة)
          </p>
          <QuizStation
            lesson={cyclicQuizLesson(weekTest)}
            priorAttempts={cyclicAttempts(state.progress, weekTest.id)}
            onAttemptComplete={finishCyclic}
            onGrade={({ item, given, verdict }) => {
              const s = stateRef.current;
              if (s)
                commit({
                  ...s,
                  errors: upsertGoldenError(s.errors, {
                    skill: item.choices ? "lesen" : "schreiben",
                    wrong: given || "—",
                    correct: item.a,
                    explanation: item.why ?? "قارن إجابتك بالتصحيح واستنتج الفرق.",
                    source: `${weekTest.id}/cyclic`,
                    closeSlip: verdict === "close",
                  }),
                });
            }}
          />
        </>
      ) : reading && thursdayEngine && thursdayPick ? (
        <>
          <p data-testid="reading-title">نص القراءة الحر 📖 — {thursdayEngine.titleAr}</p>
          <FreeReading text={thursdayEngine} questions={thursdayPick.questions} onFinish={finishReading} />
        </>
      ) : shadow ? (
        shadow.script ? (
          <>
            <p data-testid="shadow-title">الشادوينغ اليومي 🎙️ — ظل حوار {shadow.lessonId} (نحو 3 دقائق)</p>
            <ShadowingRun script={shadow.script} onFinish={finishShadow} />
          </>
        ) : (
          <p data-testid="shadow-loading">جارٍ فتح حوار الظل {shadow.lessonId}…</p>
        )
      ) : deferred ? (
        deferred.bundle ? (
          <>
            <p data-testid="deferred-title">المعركة المؤجلة ⚔️ — {deferred.unitKey} (25 دقيقة — خذ وقتك)</p>
            <QuizStation
              lesson={deferredLesson(deferred.bundle.lesson, deferred.unitKey)}
              priorAttempts={battleAttempts(state.progress, deferred.unitKey) + delayedAttempts(state.progress, deferred.unitKey)}
              onAttemptComplete={finishDeferred}
              onGrade={({ item, given, verdict }) => {
                const s = stateRef.current;
                if (s)
                  commit({
                    ...s,
                    errors: upsertGoldenError(s.errors, {
                      skill: item.choices ? "lesen" : "schreiben",
                      wrong: given || "—",
                      correct: item.a,
                      explanation: item.why ?? "قارن إجابتك بالتصحيح واستنتج الفرق.",
                      source: `${deferred.lessonId}/deferred`,
                      closeSlip: verdict === "close",
                    }),
                  });
              }}
            />
          </>
        ) : (
          <p data-testid="deferred-loading">جارٍ فتح المؤجلة {deferred.lessonId}…</p>
        )
      ) : micro ? (
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
          ticks={todayEntry?.canDoTicks ?? []}
          onTick={(statement, done) => {
            const s = stateRef.current;
            if (s)
              commit({
                ...s,
                sessions: recordSession(s.sessions, { date: localDay(), durationMinutes: 0, canDoTicks: [{ statement, done }] }),
              });
          }}
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

      {!micro && !session && !deferred && !shadow && !reading && !cyclic && (
        <>
          {battleNow && current && (
            <p data-testid="battle-banner">
              اليوم المعركة ⚔️ — معركة الوحدة {current.unit} (النجاح من 75% — خذ وقتك ولا تستعجل)
            </p>
          )}
          {deferredKey && (
            <>
              <p data-testid="deferred-banner">
                موعد المؤجلة ⏳ — معركة {deferredKey} المؤجلة أولاً (25 دقيقة) ثم درس جديد
              </p>
              <button data-testid="start-deferred" onClick={startDeferred}>
                ⚔️ ابدأ المؤجلة
              </button>
            </>
          )}
          <p data-testid="day-focus">
            تركيز اليوم: {focus.label} — {focus.tip}
          </p>
          {weeklyGoal && curKey && weeklyGoal.unitKey === curKey && goalState !== "hidden" && (
            <WeeklyGoalCard goal={weeklyGoal.goal} state={goalState} />
          )}
          {shadowLesson && !shadowDoneToday && (
            <>
              <p data-testid="shadow-banner">الشادوينغ اليومي 🎙️ — 3 دقائق ظلٌّ لحوار متقن ({shadowLesson})</p>
              <button data-testid="start-shadow" onClick={startShadow}>
                🎙️ ابدأ الظل
              </button>
            </>
          )}
          {shadowDoneToday && <p data-testid="shadow-done">الشادوينغ اليومي تم ✓ — 3 دقائق بصوتك</p>}
          {thursdayEngine && thursdayPick && !readingDoneToday && (
            <>
              <p data-testid="reading-banner">نص القراءة الحر 📖 — {thursdayEngine.titleAr} (من الوحدة {thursdayPick.unit})</p>
              <button data-testid="start-reading" onClick={startReading}>
                📖 اقرأ النص
              </button>
            </>
          )}
          {readingDoneToday && <p data-testid="reading-done">قراءة الخميس تمت ✓ — نص كامل بفهمك</p>}
          {dueTest && (
            <>
              <p data-testid="cyclic-banner">
                {dueTest.kind === "monatspruefung"
                  ? `اليوم المعركة الشهرية 🏆 — تراكمي الشهر (الوحدات ${dueTest.coversUnits.join("، ")}) — ${dueTest.timeBudgetMin} دقيقة`
                  : `اليوم الاختبار القصير 📝 — تراكمي الأسبوعين (الوحدات ${dueTest.coversUnits.join("، ")}) — ${dueTest.timeBudgetMin} دقيقة`}
              </p>
              <button data-testid="start-cyclic" onClick={startCyclic}>
                ابدأ الاختبار
              </button>
            </>
          )}
          {cyclicDone && <p data-testid="cyclic-done">الاختبار الدوري تم ✓ — نتيجته في سجلك</p>}
          {todayEntry && todayEntry.durationMinutes > 0 && (
            <MeasureStrip entry={todayEntry} dueCount={dueCount} />
          )}
          {debrief && <UnitDebriefCard debrief={debrief} muellerLine={muellerMessage(passedUnits.length)} />}
          {showCalibration && !micro && !session && !deferred && (
            <CalibrationReportCard entries={state.profile.calibration} />
          )}
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
