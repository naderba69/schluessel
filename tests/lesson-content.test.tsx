// lesson-content.test.tsx — تشغيل المحطات فعلياً: الحصة الحقيقية على الواجهة + JIT الوحدة صفر
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  RecallStation,
  LearnStation,
  PracticeStation,
  CloseStation,
  JitCardOverlay,
} from "../src/components/LessonContent.js";
import { LessonSession } from "../src/components/LessonSession.js";
import { planLessonStations } from "../src/lib/lesson-runner.js";
import { firstLesson, firstLessonWords } from "../src/lesson-packs.js";
import { loadUnit0Deck, jitCards } from "../src/lib/unit0.js";
import { eveningReport, tomorrowPreview, muellerMessage, BLAME_WORDS } from "../src/lib/warmth-engine.js";

const plan = planLessonStations(firstLesson, firstLessonWords);

describe("تشغيل الدرس الحقيقي على الواجهة", () => {
  it("محطة الاسترجاع: بطاقة من 3 — «حاول تذكر» أولاً", () => {
    const html = renderToStaticMarkup(<RecallStation cards={plan.recall} />);
    expect(html).toContain("بطاقة 1 من 3");
    expect(html).toContain("Hallo");
    expect(html).toContain("حاول تذكر");
  });

  it("N-006: initialIndex يستأنف من البطاقة المحفوظة (مع تقليم خارج النطاق)", () => {
    expect(renderToStaticMarkup(<RecallStation cards={plan.recall} initialIndex={2} />)).toContain("بطاقة 3 من 3");
    expect(renderToStaticMarkup(<RecallStation cards={plan.recall} initialIndex={99} />)).toContain("بطاقة 3 من 3");
  });

  it("محطة الجديد: أول عنصر من كل كلمات الدرس — بجملة الدرس الحقيقية · ثم قاعدة اليوم (D116 · ثابت مشتقّ D188)", () => {
    const html = renderToStaticMarkup(<LearnStation cards={plan.learn} />);
    expect(html).toContain(`عنصر 1 من ${plan.learn.length}`);
    expect(html).toContain("Hallo! Wie heißt du?"); // N-021 (D225): مثال hallo بلا اسم شخصية
  });

  it("محطة التدريب (الدرس المُرقّى — D116): أول بند فراغ قاعدة اليوم · لا إجابة ولا «لماذا» قبل المحاولة", () => {
    const html = renderToStaticMarkup(<PracticeStation data={plan.practice} />);
    expect(html).toContain('data-testid="practice-input"');
    expect(html).toContain("Ich ___ Yusuf.");
    expect(html).not.toContain("practice-why");
    expect(html).not.toContain(">bin<");
  });

  it("الخلاصة: التلخيص + المصائد الثلاث + تقرير مولر — بلا لوم", () => {
    const html = renderToStaticMarkup(
      <CloseStation
        data={plan.close}
        report={eveningReport({ cardsReviewed: 3, trapsNoticed: 3 })}
        preview={tomorrowPreview({ hasNewContent: false, dueCount: 15 })}
        muellerLine={muellerMessage(2)}
      />,
    );
    expect(html).toContain("قدمت نفسك");
    expect(html).toContain("warning-cards");
    expect(html).toContain("Ich komme aus Tunesien"); // المصيدة الثانية (aus لا von)
    expect(html).toContain("النوم شريكك");
    for (const w of BLAME_WORDS) expect(html).not.toContain(w);
  });

  it("الحصة الكاملة: صدفة + محتوى حقيقي في المحطة الأولى", () => {
    const html = renderToStaticMarkup(
      <LessonSession
        content={{
          recall: <RecallStation cards={plan.recall} />,
          learn: <LearnStation cards={plan.learn} />,
          practice: <PracticeStation data={plan.practice} />,
          close: <CloseStation data={plan.close} report="r" preview="p" muellerLine="m" />,
        }}
      />,
    );
    expect(html).toContain('data-station="recall"');
    expect(html).toContain("بطاقة 1 من 3");
  });
});

describe("الوحدة صفر في الواجهة (§9 — JIT عند أول استخدام)", () => {
  it("بطاقة JIT تُعرض بعنوانها وكلمة مولر — وزر «فهمت»", () => {
    const card = jitCards(loadUnit0Deck())[0]; // u0-why-hard (first-uebung)
    const html = renderToStaticMarkup(<JitCardOverlay card={card} onDismiss={() => {}} />);
    expect(html).toContain('data-testid="jit-overlay"');
    expect(html).toContain(card.title.ar);
    expect(html).toContain("فهمت");
  });
});
