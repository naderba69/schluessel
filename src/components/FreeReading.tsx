import { useState } from "react";
import type { ReadingText } from "../lib/reading.js";
import { ReadingLab } from "./SkillsLab.js";

/**
 * D281: نص القراءة الحر الأسبوعي (ب-19) — مختبر القراءة (المحاولة قبل الكشف §2.5)
 * + أسئلة فهم تُكشَف ذاتياً + زر الإنهاء. الحكم ذاتي: القارئ يقارن جوابه بالنموذج.
 */
export function FreeReading({
  text,
  questions,
  onFinish,
}: {
  text: ReadingText;
  questions: readonly { q: string; a: string }[];
  onFinish: () => void;
}) {
  const [open, setOpen] = useState<number[]>([]);
  return (
    <section data-testid="free-reading">
      <ReadingLab text={text} />
      {questions.length > 0 && (
        <div data-testid="read-questions">
          <h4>افهم ما قرأت؟ — أجب ذهنياً ثم اكشف</h4>
          {questions.map((item, i) => (
            <p key={i} data-testid={`read-question-${i}`}>
              <span dir="ltr">{item.q}</span>{" "}
              <button data-testid={`read-reveal-${i}`} onClick={() => setOpen((o) => (o.includes(i) ? o : [...o, i]))}>
                اكشف الجواب
              </button>
              {open.includes(i) && (
                <span data-testid={`read-answer-${i}`} dir="ltr">
                  {" "}← {item.a}
                </span>
              )}
            </p>
          ))}
        </div>
      )}
      <button data-testid="reading-finish" onClick={onFinish}>
        أنهيت القراءة ✓
      </button>
    </section>
  );
}
