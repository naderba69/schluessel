// src/App.tsx — القشرة: أول تشغيل → مسار الواجهة + الترميز المزدوج (S0.6/S0.7/S0.8)
import { useState } from "react";
import type { LearnerState, Lesson, Word } from "./../content/schemas/index.js";
import { GenderBadge } from "./components/GenderBadge.js";
import { FirstRun } from "./components/FirstRun.js";
import { LessonSession } from "./components/LessonSession.js";
import { lessonStatus } from "./lib/routes.js";

import firstLessonJson from "../content/lessons/a1/a1-u1-d1.json";
import wordHallo from "../content/words/hallo.json";
import wordHeissen from "../content/words/heissen.json";
import wordGutenTag from "../content/words/guten-tag.json";
import { Lesson as LessonSchema, Word as WordSchema } from "../content/schemas/index.js";

const firstLesson = LessonSchema.parse(firstLessonJson);
const firstLessonWords = [wordHallo, wordHeissen, wordGutenTag].map((w) => WordSchema.parse(w));

const STATUS_LABEL: Record<string, string> = {
  completed: "✓ مكتمل",
  available: "● متاح",
  locked: "🔒 مقفل",
};

export function App() {
  const [state, setState] = useState<LearnerState | null>(null);
  const [sessionOpen, setSessionOpen] = useState(false);

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

  return (
    <main style={{ fontFamily: "sans-serif", padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1>أهلاً {state.profile.name} — رحلتك بدأت</h1>
      <p data-testid="post-first-run">الوحدة صفر (اليوم الأول) مكتملة — موعدك القادم: الاسترجاع قصيراً ثم الجديد.</p>

      <h2>حصة اليوم (120 دقيقة متصلة — D29)</h2>
      {sessionOpen ? (
        <LessonSession />
      ) : (
        <button data-testid="start-session" onClick={() => setSessionOpen(true)}>
          ▶ ابدأ الحصة
        </button>
      )}

      <h2>مسارك</h2>
      <ul>
        {["a1-u1-d1", "a1-u1-d2", "a1-u1-d3"].map((id) => {
          const status = lessonStatus(id, state.progress);
          return (
            <li key={id} data-status={status} dir="ltr">
              {id} — {STATUS_LABEL[status]}
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
