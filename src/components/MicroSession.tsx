// src/components/MicroSession.tsx — الجلسة المصغّرة (أ-9 · D274): مراجعة SRS فقط، نحو 10 دقائق، بلا جديد
// للصباح/المساء ولفائض المستحق — تُحتسب في سجل اليوم (دقائق SRS) ولا تفتح دروساً
import { RecallStation } from "./LessonContent.js";
import { srsRecallCards, type SrsDuePair } from "../lib/lesson-runner.js";
import type { RecallRating } from "../lib/review-engine.js";

export function MicroSession({
  pairs,
  onRated,
  onFinish,
}: {
  pairs: readonly SrsDuePair[];
  onRated: (srsCardId: string, rating: RecallRating) => void;
  onFinish: () => void;
}) {
  const cards = srsRecallCards(pairs);
  return (
    <section data-testid="micro-session">
      <h2>⚡ جلسة مصغّرة — مراجعة فقط</h2>
      {cards.length === 0 ? (
        <>
          <p data-testid="micro-empty">لا بطاقات قابلة للعرض الآن — عُد لاحقاً 🌱</p>
          <button data-testid="micro-finish-empty" onClick={onFinish}>
            إنهاء
          </button>
        </>
      ) : (
        <>
          <p data-testid="micro-count">
            {cards.length} بطاقة مستحقة (نحو 10 دقائق) — بلا كلمات جديدة.
          </p>
          <RecallStation cards={cards} onDone={onFinish} onSrsRated={(id, r) => onRated(id, r)} />
        </>
      )}
    </section>
  );
}
