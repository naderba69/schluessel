// src/App.tsx — القشرة: أول تشغيل → مسار الواجهة + حصة حقيقية (S0.6/S0.7/S0.8 + M1)
import { useState } from "react";
import type { LearnerState, Unit0Card } from "./../content/schemas/index.js";
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
import { lessonStatus } from "./lib/routes.js";
import { planLessonStations } from "./lib/lesson-runner.js";
import { cardsForEvent, loadUnit0Deck } from "./lib/unit0.js";
import { eveningReport, tomorrowPreview, muellerMessage } from "./lib/warmth-engine.js";
import { firstLesson, firstLessonWords, ALL_LESSONS, PHRASE_BANK, LESSON_ORDER } from "./lesson-packs.js";
import { phrasesAvailable } from "./lib/phrase-bank.js";
import { SkillsLab } from "./components/SkillsLab.js";
import { SystemLab } from "./components/SystemLab.js";

const plan = planLessonStations(firstLesson, firstLessonWords);
/** §6 + قانون الجبهة: Redemittel ضمن سياق الدرس — مما ظهر حتى درس الحصة فقط */
const redemittel = phrasesAvailable(PHRASE_BANK, LESSON_ORDER, plan.lessonId).slice(0, 6);

const STATUS_LABEL: Record<string, string> = {
  completed: "✓ مكتمل",
  available: "● متاح",
  locked: "🔒 مقفل",
};

export function App() {
  const [state, setState] = useState<LearnerState | null>(null);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [labOpen, setLabOpen] = useState(false);
  const [systemOpen, setSystemOpen] = useState(false);
  const [jitCard, setJitCard] = useState<Unit0Card | null>(null);

  if (!state) {
    return (
      <main style={{ fontFamily: "sans-serif", padding: 24, maxWidth: 720, margin: "0 auto" }}>
        <FirstRun
          onComplete={setState}
          firstLesson={firstLesson}
          firstLessonWords={firstLessonWords}
        />
      </main>
    );
  }

  // الوحدة صفر JIT (§9): بطاقة عند أول استخدام فعلي — لا دفعة واحدة (قانون 23)
  const startSession = () => {
    const due = cardsForEvent(loadUnit0Deck(), state.profile.unit0Shown, "first-uebung");
    if (due.length > 0) setJitCard(due[0]);
    else setSessionOpen(true);
  };

  const dismissJit = () => {
    if (jitCard) {
      setState({
        ...state,
        profile: { ...state.profile, unit0Shown: [...state.profile.unit0Shown, jitCard.id] },
      });
    }
    setJitCard(null);
    setSessionOpen(true);
  };

  return (
    <main style={{ fontFamily: "sans-serif", padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>أهلاً {state.profile.name} — رحلتك بدأت</h1>
      <p data-testid="post-first-run">الوحدة صفر (اليوم الأول) مكتملة — موعدك القادم: الاسترجاع قصيراً ثم الجديد.</p>

      <h2>حصة اليوم (120 دقيقة متصلة — D29)</h2>
      {jitCard && <JitCardOverlay card={jitCard} onDismiss={dismissJit} />}
      {sessionOpen ? (
        <LessonSession
          content={{
            recall: <RecallStation cards={plan.recall} />,
            learn: <LearnStation cards={plan.learn} />,
            practice: <PracticeStation data={plan.practice} redemittel={redemittel} />,
            close: (
              <CloseStation
                data={plan.close}
                report={eveningReport({
                  cardsReviewed: plan.recall.length,
                  trapsNoticed: plan.close.warningCards.length,
                })}
                preview={tomorrowPreview({
                  hasNewContent: false,
                  dueCount: plan.close.srsBundleWordIds.length,
                })}
                muellerLine={muellerMessage(0)}
              />
            ),
          }}
        />
      ) : (
        <button data-testid="start-session" onClick={startSession}>
          ▶ ابدأ الحصة
        </button>
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
      <ul>
        {ALL_LESSONS.map((l) => {
          const status = lessonStatus(l.id, state.progress);
          return (
            <li key={l.id} data-status={status} dir="ltr">
              {l.id} — {STATUS_LABEL[status]}
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
