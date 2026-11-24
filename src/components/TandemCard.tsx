// src/components/TandemCard.tsx — بطاقة التبادل اللغوي البشري (D578 — §6 + قانون 12)
// كل 3 أسابيع من بداية B1: تذكير هادئ اختياري. نص غير قابل للنقر (المدينة المسورة — قانون 12):
// اسمان مكتوبان (Tandem / HelloTalk) + جملة إرشاد + سطر أمان — لا روابط إطلاقاً.
import { LESSON_ORDER } from "../lesson-packs.js";
import { TANDEM_COPY, b1StartIndex, tandemDue } from "../lib/tandem.js";
import { isoWeek } from "../lib/weekly-cards.js";

export function TandemCard({ currentIndex, now = new Date() }: { currentIndex: number; now?: Date }) {
  const b1Index = b1StartIndex(LESSON_ORDER);
  if (!tandemDue(isoWeek(now).week, currentIndex, b1Index)) return null;
  return (
    <section data-testid="tandem-card" aria-label="التبادل اللغوي البشري">
      <h2>🤝 التبادل اللغوي البشري <small>(تذكير كل 3 أسابيع)</small></h2>
      <p data-testid="tandem-copy">{TANDEM_COPY}</p>
    </section>
  );
}
