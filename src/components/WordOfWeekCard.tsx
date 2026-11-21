// src/components/WordOfWeekCard.tsx — «كلمة الأسبوع» (D571 — §8: الاثنين + كلمة الأسبوع)
// بطاقة أسبوعية تعرض كلمة من المخزون المُدرَّس وحده (D126) بجنسها الملوَّن ▲●■ (§15‑هـ) وجمعها
// (شفرة الجمع — §10.4‑5) وجملة مراسها (من القصة). الاسترجاع قبل التذكير (D12) سطر هادئ لا امتحان.
import { useEffect, useState } from "react";
import type { Word } from "../../content/schemas/index.js";
import { loadWords } from "../lesson-packs.js";
import { isWordOfWeekDay, pickWordOfWeek } from "../lib/weekly-cards.js";
import { GenderBadge } from "./GenderBadge.js";
import { PlayButton } from "./LessonSession.js";

export function WordOfWeekCard({ currentIndex, now = new Date() }: { currentIndex: number; now?: Date }) {
  const id = isWordOfWeekDay(now) ? pickWordOfWeek(now, currentIndex) : null;
  const [word, setWord] = useState<Word | null>(null);
  useEffect(() => {
    if (!id) {
      setWord(null);
      return;
    }
    let live = true;
    void loadWords([id]).then(
      (ws) => {
        if (live) setWord(ws[0] ?? null);
      },
      () => {
        if (live) setWord(null);
      },
    );
    return () => {
      live = false;
    };
  }, [id]);

  if (!id) return null; // ليس الاثنين — لا بطاقة (§8)
  if (!word) return <p data-testid="word-of-week-loading">كلمة الأسبوع…</p>;

  return (
    <section data-testid="word-of-week" aria-label="كلمة الأسبوع">
      <h3>كلمة الأسبوع 🗓️</h3>
      <p data-testid="wow-prompt">قبل أن تقرأ: من أين تتذكّر هذه الكلمة؟</p>
      <p>
        <span dir="ltr" data-testid="wow-de">
          {word.article ? `${word.article} ` : ""}
          {word.de}
        </span>{" "}
        <GenderBadge gender={word.gender} word={word.de} />{" "}
        <PlayButton audioId={`word-${word.id}`} speakText={word.de} label="استمع إلى الكلمة" />
      </p>
      {word.plural && (
        <p data-testid="wow-plural">
          الجمع: <span dir="ltr">{word.plural}</span>
          {word.pluralRuleNote ? ` — ${word.pluralRuleNote}` : ""}
        </p>
      )}
      <p data-testid="wow-ar">{word.ar.join(" · ")}</p>
      {word.kollocation && (
        <p data-testid="wow-kollocation">
          تلازمها: <span dir="ltr">{word.kollocation.de}</span> — {word.kollocation.ar}
        </p>
      )}
      {word.sampleSentence && (
        <blockquote data-testid="wow-sample">
          <span dir="ltr">{word.sampleSentence.de}</span>
          <br />
          <small>{word.sampleSentence.ar}</small>
        </blockquote>
      )}
    </section>
  );
}
