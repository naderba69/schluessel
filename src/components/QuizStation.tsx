// src/components/QuizStation.tsx — بوابة Quiz الدرس (D117): Slider التوقّع ← البنود ← النتيجة + المعايرة
// تشريح الدرس (§3): 6 Slider ← 7 Quiz ← 8 Zusammenfassung — فتُعرض الخلاصة بعد أول محاولة (للمراجعة عند «ليس بعد»).
// القانون 13 (الجبهة): سؤال الـSlider يُعرض بالعربية فقط — «Wie viel Prozent wirst du schaffen?» فيها ما لم يُتعلَّم بعد.
import { useRef, useState } from "react";
import type { Lesson } from "../../content/schemas/index.js";
import { displayOrder } from "../lib/practice-session.js";
import {
  advanceQuiz, answerQuizItem, calibrationNoteAr, canRetryInSession, creditOf, currentQuizItem, isAnswered, isComplete,
  judgeQuizItem, needsJudgment, outcomeHeadlineAr, predictScore, quizOutcome, startQuizAttempt, verdictNoteAr,
  type QuizAttempt, type QuizOutcome,
} from "../lib/quiz-session.js";
import { UmlautKeys, insertAtCursor } from "./LessonContent.js";
import { StruckText } from "./StruckText.js";

export type QuizLesson = Pick<Lesson, "id" | "quiz" | "slider">;

export function QuizStation({
  lesson,
  priorAttempts,
  onAttemptComplete,
}: {
  lesson: QuizLesson;
  /** محاولات مسجّلة قبل هذه الحصة — تحدد النسخة (قانون 21) */
  priorAttempts: number;
  /** يُنادى مرة واحدة عند اكتمال كل محاولة (نجاحاً أو «ليس بعد») */
  onAttemptComplete: (outcome: QuizOutcome) => void;
}) {
  const variantCount = lesson.quiz.variants.length;
  const [base] = useState(priorAttempts);
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const [attempt, setAttempt] = useState<QuizAttempt>(() => startQuizAttempt(lesson, priorAttempts));
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null);
  const lo = Math.max(0, lesson.slider.min);
  const hi = Math.min(100, lesson.slider.max);
  const [prediction, setPrediction] = useState(Math.round((lo + hi) / 2 / 5) * 5);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const need = Math.round(attempt.passingScore * 100);

  if (attempt.predicted === null) {
    return (
      <section data-testid="quiz-station" data-phase="predict" data-variant={attempt.variantIndex}>
        <h3>
          اختبار الدرس 📝 — النسخة {attempt.variantIndex + 1} من {variantCount}
        </h3>
        <p data-testid="quiz-rule">
          {attempt.items.length} أسئلة · النجاح {need}% فأكثر يفتح الدرس التالي — وإن لم تبلغه فهذا «ليس بعد»: راجع وجرّب نسخة أخرى.
        </p>
        <label>
          {lesson.slider.questionAr}{" "}
          <input
            data-testid="quiz-slider"
            type="range"
            min={lo}
            max={hi}
            step={5}
            value={prediction}
            aria-valuetext={`${prediction}%`}
            onChange={(e) => setPrediction(Number(e.target.value))}
          />{" "}
          <output data-testid="quiz-prediction">{prediction}%</output>
        </label>
        <p>
          <button data-testid="quiz-start" onClick={() => setAttempt(predictScore(attempt, prediction))}>
            ابدأ الاختبار
          </button>
        </p>
      </section>
    );
  }

  if (isComplete(attempt) && outcome) {
    const retry = !outcome.passed && canRetryInSession(sessionAttempts, variantCount);
    const review = attempt.items
      .map((it, i) => ({ it, ans: attempt.answers[i]! }))
      .filter(({ ans }) => creditOf(ans.verdict) < 1);
    return (
      <section data-testid="quiz-station" data-phase="result" data-passed={outcome.passed ? "yes" : "no"}>
        <p data-testid="quiz-headline">{outcomeHeadlineAr(outcome)}</p>
        <p data-testid="quiz-calibration">{calibrationNoteAr(outcome.predicted, outcome.percent)}</p>
        {review.length > 0 && (
          <>
            <h4>للمراجعة</h4>
            <ul data-testid="quiz-review">
              {review.map(({ it, ans }, i) => (
                <li key={i}>
                  <span dir="auto">
                    <StruckText text={it.q} />
                  </span>{" "}
                  — كتبت: <span dir="auto">{ans.given.trim() || "—"}</span> ← الصحيح:{" "}
                  <span dir="auto">
                    <StruckText text={it.a} />
                  </span>
                  {it.why ? (
                    <>
                      {" · "}
                      <StruckText text={it.why} />
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        )}
        {retry && (
          <button
            data-testid="quiz-retry"
            onClick={() => {
              setAttempt(startQuizAttempt(lesson, base + sessionAttempts));
              setOutcome(null);
              setText("");
            }}
          >
            جرّب النسخة التالية
          </button>
        )}
        {!outcome.passed && !retry && (
          <p data-testid="quiz-no-retry">
            استعملت النسخ الثلاث في هذه الحصة — الإعادة الآن تختبر حفظ الإجابات لا الإتقان. راجع الخلاصة والمصائد أدناه؛ الدرس يبقى
            مفتوحاً لحصتك القادمة.
          </p>
        )}
      </section>
    );
  }

  const item = currentQuizItem(attempt)!;
  const answered = isAnswered(attempt);
  const answer = answered ? attempt.answers[attempt.cursor]! : null;
  const submit = (given: string) => setAttempt(answerQuizItem(attempt, given));
  const next = () => {
    const after = advanceQuiz(attempt);
    setText("");
    setAttempt(after);
    if (isComplete(after)) {
      const o = quizOutcome(after);
      setOutcome(o);
      setSessionAttempts(sessionAttempts + 1);
      onAttemptComplete(o);
    }
  };

  return (
    <section data-testid="quiz-station" data-phase="answer" data-variant={attempt.variantIndex}>
      <p data-testid="quiz-counter">
        سؤال {attempt.cursor + 1} من {attempt.items.length}
      </p>
      <p dir="auto" data-testid="quiz-question">
        <StruckText text={item.q} />
      </p>
      {item.choices ? (
        <p>
          {displayOrder(item.choices, `${lesson.id}|${attempt.variantIndex}|${item.q}`).map((c, i) => (
            <button
              key={c}
              data-testid={`quiz-choice-${i}`}
              dir="auto"
              disabled={answered}
              data-picked={answer?.given === c ? "yes" : undefined}
              onClick={() => submit(c)}
            >
              {c}
            </button>
          ))}
        </p>
      ) : (
        <p>
          <input
            ref={inputRef}
            data-testid="quiz-input"
            dir="auto"
            value={text}
            disabled={answered}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !answered && text.trim()) submit(text);
            }}
          />
          <UmlautKeys disabled={answered} onInsert={(ch) => insertAtCursor(inputRef.current, text, ch, setText)} />
          <button data-testid="quiz-check" disabled={answered || !text.trim()} onClick={() => submit(text)}>
            تحقّق
          </button>
        </p>
      )}
      {answer && (
        <div data-testid="quiz-feedback" data-verdict={answer.verdict}>
          <p dir="auto">{verdictNoteAr(item, answer)}</p>
          {item.why && answer.verdict !== "judge" && (
            <p data-testid="quiz-why">
              <StruckText text={item.why} />
            </p>
          )}
          {needsJudgment(attempt) ? (
            <p>
              <button data-testid="quiz-judge-yes" onClick={() => setAttempt(judgeQuizItem(attempt, true))}>
                إجابتي صحيحة بصيغة أخرى
              </button>{" "}
              <button data-testid="quiz-judge-no" onClick={() => setAttempt(judgeQuizItem(attempt, false))}>
                أخطأت
              </button>
            </p>
          ) : (
            <button data-testid="quiz-next" onClick={next}>
              {attempt.cursor + 1 === attempt.items.length ? "النتيجة" : "التالي ←"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
