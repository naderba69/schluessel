// tests/quiz-station.test.tsx — واجهة البوابة وقفل المحطات (D117): رسم ثابت (SSR) — المنطق نفسه مختبَر خالصاً في quiz-session/lesson-path
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QuizStation } from "../src/components/QuizStation.js";
import { LessonSession } from "../src/components/LessonSession.js";
import { FirstLessonScreen } from "../src/components/FirstRun.js";
import { GERMAN_KEYS, UmlautKeys } from "../src/components/LessonContent.js";
import { firstLesson, firstLessonWords } from "../src/lesson-packs.js";

const noop = () => {};

describe("QuizStation — §14 التوقّع أولاً · F121 لا كشف · القانون 13 سؤال الـSlider بالعربية", () => {
  const html = renderToStaticMarkup(<QuizStation lesson={firstLesson} priorAttempts={0} onAttemptComplete={noop} />);

  it("الشاشة الأولى = التوقّع بالعربية فقط (الألمانية فيها ما لم يُتعلَّم: Prozent · wirst · schaffen)", () => {
    expect(html).toContain('data-phase="predict"');
    expect(html).toContain(firstLesson.slider.questionAr);
    expect(html).not.toContain(firstLesson.slider.questionDe);
    expect(html).toContain('data-testid="quiz-slider"');
    expect(html).toContain("75%");
  });

  it("لا سؤال ولا إجابة قبل التوقّع", () => {
    for (const v of firstLesson.quiz.variants)
      for (const it of v.items) {
        expect(html).not.toContain(it.q);
        expect(html).not.toContain(`>${it.a}<`);
      }
  });

  it("قانون 21: النسخة تتبع المحاولات السابقة (0 ← الأولى · 4 ← الثانية)", () => {
    expect(html).toContain('data-variant="0"');
    expect(html).toContain("النسخة 1 من 3");
    const again = renderToStaticMarkup(<QuizStation lesson={firstLesson} priorAttempts={4} onAttemptComplete={noop} />);
    expect(again).toContain('data-variant="1"');
    expect(again).toContain("النسخة 2 من 3");
  });
});

describe("LessonSession — «التالي» مقفل حتى تكتمل المحطة (قانون 3: لا قفز داخل الحصة)", () => {
  const nextBtn = (html: string) => html.match(/<button[^>]*data-testid="next-btn"[^>]*>/)![0];

  it("محطة لم تكتمل: الزر معطَّل مع سببه", () => {
    const html = renderToStaticMarkup(<LessonSession done={{ recall: false }} />);
    expect(nextBtn(html)).toContain("disabled");
    expect(html).toContain('data-testid="station-lock"');
  });

  it("محطة اكتملت: الزر يعمل", () => {
    const html = renderToStaticMarkup(<LessonSession done={{ recall: true }} />);
    expect(nextBtn(html)).not.toContain("disabled");
    expect(html).not.toContain('data-testid="station-lock"');
  });

  it("بلا done (عرض الصدفة وحدها): لا قفل — توافق مع الاستخدام السابق", () => {
    expect(nextBtn(renderToStaticMarkup(<LessonSession />))).not.toContain("disabled");
  });
});

describe("التهيئة والأحرف الخاصة", () => {
  it("شاشة أول درس: زر «إلى حصة اليوم» حين تُعطى نهاية التهيئة — كانت القشرة تتخطّى الشاشة كلها", () => {
    expect(renderToStaticMarkup(<FirstLessonScreen lesson={firstLesson} words={firstLessonWords} onStart={noop} />)).toContain(
      'data-testid="first-lesson-start"',
    );
    expect(renderToStaticMarkup(<FirstLessonScreen lesson={firstLesson} words={firstLessonWords} />)).not.toContain(
      "first-lesson-start",
    );
  });

  it("أزرار ä ö ü ß Ä Ö Ü تحت الحقول", () => {
    const html = renderToStaticMarkup(<UmlautKeys onInsert={noop} />);
    for (const ch of GERMAN_KEYS) expect(html).toContain(`>${ch}</button>`);
    expect(GERMAN_KEYS).toHaveLength(7);
  });
});

describe("N-006 (D228) — الاستئناف: الاختبار من لقطته والمحطة من موضعها", () => {
  const v0 = firstLesson.quiz.variants[0]!;

  it("QuizStation: لقطة وسط المحاولة ← شاشة الإجابة عند البند المحفوظ لا من الأول", () => {
    const html = renderToStaticMarkup(
      <QuizStation
        lesson={firstLesson}
        priorAttempts={0}
        onAttemptComplete={noop}
        initialQuiz={{ variantIndex: 0, predicted: 80, answers: [{ given: "x", verdict: "wrong" }], cursor: 1 }}
      />,
    );
    expect(html).toContain('data-phase="answer"');
    expect(html).toContain(v0.items[1]!.q);
    expect(html).not.toContain(v0.items[0]!.q);
  });

  it("QuizStation: لقطة محاولة مكتملة راسبة ← النتيجة مع زر الإعادة (لا عطل على بند معدوم)", () => {
    const answers = v0.items.map(() => ({ given: "", verdict: "wrong" as const }));
    const html = renderToStaticMarkup(
      <QuizStation
        lesson={firstLesson}
        priorAttempts={0}
        onAttemptComplete={noop}
        initialQuiz={{ variantIndex: 0, predicted: 90, answers, cursor: v0.items.length }}
      />,
    );
    expect(html).toContain('data-phase="result"');
    expect(html).toContain('data-passed="no"');
    expect(html).toContain('data-testid="quiz-retry"');
  });

  it("LessonSession: initialStation تقفز للاستئناف (حالة أولية — لا كسر لقفل الاتجاه بعده)", () => {
    const html = renderToStaticMarkup(<LessonSession done={{ recall: true, learn: true }} initialStation="practice" />);
    expect(html).toContain('data-station="practice"');
  });
});
