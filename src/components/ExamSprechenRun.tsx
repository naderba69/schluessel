// src/components/ExamSprechenRun.tsx — تشغيل التحدث (D287): تحدث بصوت عالٍ ← النموذج ← قيّم بصدق (كاملة/نصف/تعثّر)
// بلا حكم آلي على اللسان (§5-ب): التقييم ذاتي موجَّه بالنموذج — والدرجة تُحتسَب وتُذكَر.
import { useState } from "react";
import { sprechenOutcome, type SprechenGrade, type SprechenPrompt } from "../lib/exam-engine.js";
import type { QuizOutcome } from "../lib/quiz-session.js";

export function ExamSprechenRun({
  runId,
  passingScore,
  prompts,
  onComplete,
}: {
  runId: string;
  passingScore: number;
  prompts: readonly SprechenPrompt[];
  /** النتيجة + البنود غير الكاملة (للدفتر الذهبي) */
  onComplete: (outcome: QuizOutcome, partial: { q: string; model: string; grade: SprechenGrade }[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [grades, setGrades] = useState<SprechenGrade[]>([]);
  const [done, setDone] = useState(false);

  if (prompts.length === 0) return <p data-testid="sprechen-run">لا موجهات في هذا القسم.</p>;
  const prompt = prompts[Math.min(index, prompts.length - 1)]!;

  if (done) {
    const outcome = sprechenOutcome(runId, passingScore, prompts, grades);
    const partial = prompts
      .map((p, i) => ({ q: p.q, model: p.model, grade: grades[i] ?? 0 }))
      .filter((p) => p.grade < 1);
    return (
      <section data-testid="sprechen-run" data-phase="review">
        <p data-testid="sprechen-summary">
          نتيجتك الذاتية: {outcome.credit}/{outcome.total} ({Math.round(outcome.percent)}%)
        </p>
        <button data-testid="sprechen-confirm" onClick={() => onComplete(outcome, partial)}>
          اعتمد النتيجة
        </button>
      </section>
    );
  }

  const grade = (g: SprechenGrade) => {
    const next = [...grades, g];
    setGrades(next);
    setRevealed(false);
    if (index + 1 >= prompts.length) setDone(true);
    else setIndex(index + 1);
  };

  return (
    <section data-testid="sprechen-run" data-phase={revealed ? "grade" : "speak"}>
      <p data-testid="sprechen-counter">
        بند {index + 1} من {prompts.length}
      </p>
      <p data-testid="sprechen-part">{prompt.partAr}</p>
      <p dir="auto" data-testid="sprechen-q">
        🎙️ {prompt.q}
      </p>
      {!revealed ? (
        <button data-testid="sprechen-said" onClick={() => setRevealed(true)}>
          تحدثت بصوت عالٍ — أظهر النموذج
        </button>
      ) : (
        <>
          <p dir="auto" data-testid="sprechen-model">
            النموذج: {prompt.model}
          </p>
          <p>
            <button data-testid="sprechen-full" onClick={() => grade(1)}>
              قلتها كاملة ✓
            </button>{" "}
            <button data-testid="sprechen-half" onClick={() => grade(0.5)}>
              قلت جزءها (نصف)
            </button>{" "}
            <button data-testid="sprechen-miss" onClick={() => grade(0)}>
              تعثّرت ✗
            </button>
          </p>
        </>
      )}
    </section>
  );
}
