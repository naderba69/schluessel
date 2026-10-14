// src/components/LessonContent.tsx — مشغّل محتوى المحطات: الحصة تمشي بخطواتها الحقيقية
// F121: محاولة قبل كشف · §2.5: تقييم بعد الكشف · E08: الخلاصة الهادئة · الوحدة صفر JIT (§9)
import { useEffect, useState } from "react";
import { audioPlayer } from "../lib/audio-player.js";
import type { Unit0Card } from "../../content/schemas/index.js";
import type { LearnCardData, RecallCardData, PracticeData, CloseData } from "../lib/lesson-runner.js";
import { RecallCardView, LearnCardView, CloseView } from "./LessonSession.js";
import type { RecallRating } from "../lib/review-engine.js";

/** محطة 1 — الاسترجاع: بطاقة بعد بطاقة، والتقييم يمرّر للتالية */
export function RecallStation({ cards }: { cards: RecallCardData[] }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const card = cards[index];
  if (!card) return <p data-testid="recall-done">انتهت جولة الاسترجاع — إلى الجديد! 💪</p>;
  return (
    <div data-testid="recall-station">
      <p data-testid="recall-counter">
        بطاقة {index + 1} من {cards.length}
      </p>
      <RecallCardView
        front={card.front}
        back={card.back}
        audioId={card.audioId}
        speakText={card.speakText}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        onRate={(_r: RecallRating) => {
          setRevealed(false);
          setIndex(index + 1);
        }}
      />
    </div>
  );
}

/** محطة 2 — الجديد: محاولة ← كشف ← التالي (F121) */
export function LearnStation({ cards }: { cards: LearnCardData[] }) {
  const [index, setIndex] = useState(0);
  const [attempted, setAttempted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const card = cards[index];
  // §3 Präsentation (D104): «الصوت يُشغَّل لحظة ظهور الكلمة» — مرة عند الظهور، والإعادة بزر 🔊
  useEffect(() => {
    if (card) void audioPlayer().play({ trackId: card.audioId, text: card.speakText });
  }, [card]);
  if (!card) return <p data-testid="learn-done">اكتمل الجديد — إلى التدريب! 🎯</p>;
  return (
    <div data-testid="learn-station">
      <p data-testid="learn-counter">
        عنصر {index + 1} من {cards.length}
      </p>
      <LearnCardView
        promptDe={card.promptDe}
        promptAr={card.promptAr}
        attempted={attempted}
        revealed={revealed}
        explanation={card.explanation}
        audioId={card.audioId}
        speakText={card.speakText}
        onAttempt={() => setAttempted(true)}
        onReveal={() => setRevealed(true)}
      />
      {revealed && (
        <button
          data-testid="learn-next"
          onClick={() => {
            setRevealed(false);
            setAttempted(false);
            setIndex(index + 1);
          }}
        >
          التالي ←
        </button>
      )}
    </div>
  );
}

/** محطة 3 — التدريب: محطات Übung بالترتيب + المهمة التواصلية (CLT) */
export function PracticeStation({ data }: { data: PracticeData }) {
  const [stationIndex, setStationIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const station = data.stations[stationIndex];
  const item = station?.items[itemIndex] as { q?: string; a?: string } | undefined;

  if (!station || !item) {
    return (
      <section data-testid="communicative-task">
        <h3>المهمة التواصلية 🤝</h3>
        <p>{data.communicativeTask.goal.ar} — {data.communicativeTask.situation.ar}</p>
        <ul>
          {data.communicativeTask.successCriteria.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section data-testid="practice-station" data-type={station.type}>
      <p data-testid="practice-counter">
        تمرين {itemIndex + 1} من {station.items.length} — محطة {stationIndex + 1} من {data.stations.length}
      </p>
      <p dir="ltr">{item.q}</p>
      {!showAnswer ? (
        <button data-testid="practice-reveal" onClick={() => setShowAnswer(true)}>
          أظهر الإجابة
        </button>
      ) : (
        <>
          <p data-testid="practice-answer" dir="ltr">
            {item.a}
          </p>
          <button
            data-testid="practice-next"
            onClick={() => {
              setShowAnswer(false);
              if (itemIndex + 1 < station.items.length) setItemIndex(itemIndex + 1);
              else {
                setItemIndex(0);
                setStationIndex(stationIndex + 1);
              }
            }}
          >
            التالي ←
          </button>
        </>
      )}
    </section>
  );
}

/** محطة 4 — الخلاصة: التلخيص + المصائد الذهبية + تقرير مولر المسائي (E08) */
export function CloseStation({
  data,
  report,
  preview,
  muellerLine,
}: {
  data: CloseData;
  report: string;
  preview: string;
  muellerLine: string;
}) {
  return (
    <section data-testid="close-station">
      <h3>ماذا تعلمت اليوم 🌟</h3>
      <p data-testid="lesson-summary">
        {data.summaryDe} — {data.summaryAr}
      </p>
      <h4>مصائد ذهبية (أخطاؤك هي كنزك)</h4>
      <ul data-testid="warning-cards">
        {data.warningCards.map((card, i) => (
          <li key={i}>
            <span dir="ltr">{card.commonError.de}</span> — {card.whyArabicSpeakerFails} ← الصحيح:{" "}
            <span dir="ltr">{card.correct.de}</span>
          </li>
        ))}
      </ul>
      <CloseView report={report} preview={preview} muellerLine={muellerLine} />
    </section>
  );
}

/** بطاقة الوحدة صفر JIT (§9) — عند أول استخدام فعلي للمهارة */
export function JitCardOverlay({ card, onDismiss }: { card: Unit0Card; onDismiss: () => void }) {
  return (
    <aside data-testid="jit-overlay" data-card-id={card.id}>
      <h3>{card.title.ar}</h3>
      <p>{card.body.ar}</p>
      {card.body.mueller && <p data-testid="jit-mueller">— {card.body.mueller}</p>}
      <button data-testid="jit-dismiss" onClick={onDismiss}>
        فهمت ✓
      </button>
    </aside>
  );
}
