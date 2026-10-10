// lesson-ui.test.tsx — واجهة الحصة الكاملة: 4 محطات + 3 استراحات + قفل اتجاه + §2.5 + E05/E07/E08
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SessionProgress,
  BreakPrompt,
  RecallCardView,
  LearnCardView,
  AudioControlsView,
  DictationView,
  CloseView,
  LessonSession,
} from "../src/components/LessonSession.js";
import { BLAME_WORDS, eveningReport, tomorrowPreview, muellerMessage } from "../src/lib/warmth-engine.js";
import { compareDictation } from "../src/lib/dictation-engine.js";
import { STATIONS, BREAKS_AFTER, totalMinutes } from "../src/lib/lesson-engine.js";

const buttonTag = (markup: string, testid: string): string =>
  markup.match(new RegExp(`<button[^>]*data-testid="${testid}"[^>]*>`))?.[0] ?? "";

describe("واجهة الحصة — الشريط والاستراحات وقفل الاتجاه (§2.3 + E01)", () => {
  it("أربع نقاط محطات 15/40/50/15 — المحطة الحالية معلَّمة", () => {
    const html = renderToStaticMarkup(<SessionProgress current="learn" />);
    for (const s of STATIONS) expect(html).toContain(`data-station="${s}"`);
    expect(html).toContain('data-station="learn" data-current="yes"');
    expect(html).toContain("15د");
    expect(html).toContain("40د");
    expect(totalMinutes()).toBe(120);
  });

  it("ثلاث استراحات داخل الحصة — نص هادئ بلا ضغط", () => {
    expect(BREAKS_AFTER.length).toBe(3);
    const html = renderToStaticMarkup(<BreakPrompt after="recall" onContinue={() => {}} />);
    expect(html).toContain("استراحة");
    expect(html).toContain('data-after="recall"');
    for (const w of BLAME_WORDS) expect(html).not.toContain(w);
  });

  it("الصدفة: لا ارتجاع — زر «السابق» معطّل دائماً (قانون 3)", () => {
    const html = renderToStaticMarkup(<LessonSession />);
    expect(html).toContain('data-station="recall"');
    expect(buttonTag(html, "back-btn")).toContain("disabled");
    expect(buttonTag(html, "next-btn")).not.toContain("disabled");
  });

  it("محتوى المحطة يُمرَّر من الخارج (ربط بالمحركات)", () => {
    const html = renderToStaticMarkup(<LessonSession content={{ recall: <p>محتوى استرجاع</p> }} />);
    expect(html).toContain("محتوى استرجاع");
    expect(html).not.toContain("station-placeholder");
  });
});

describe("شاشة الاسترجاع §2.5 — محاولة ← كشف ← تقييم", () => {
  it("قبل الكشف: «حاول أولاً» وزر الإظهار", () => {
    const html = renderToStaticMarkup(
      <RecallCardView front="die Wohnung" back="الشقة" revealed={false} onReveal={() => {}} onRate={() => {}} />,
    );
    expect(html).toContain("حاول تذكر");
    expect(html).toContain('data-testid="reveal-btn"');
    expect(html).not.toContain("data-rating");
  });

  it("بعد الكشف: الإجابة + أزرار التقييم الأربعة (نسيت|صعب|جيد|سهل)", () => {
    const html = renderToStaticMarkup(
      <RecallCardView front="die Wohnung" back="الشقة" revealed={true} onReveal={() => {}} onRate={() => {}} />,
    );
    expect(html).toContain("الشقة");
    for (const label of ["نسيت", "صعب", "جيد", "سهل"]) expect(html).toContain(label);
  });

  it("محطة الجديد (F121): زر الكشف معطّل حتى تحاول", () => {
    const before = renderToStaticMarkup(
      <LearnCardView
        promptDe="Ich heiße Yusuf"
        promptAr="أنا اسمي يوسف"
        attempted={false}
        revealed={false}
        explanation="heißen = الاسم"
        onAttempt={() => {}}
        onReveal={() => {}}
      />,
    );
    expect(buttonTag(before, "learn-reveal-btn")).toContain("disabled");
    const after = renderToStaticMarkup(
      <LearnCardView
        promptDe="Ich heiße Yusuf"
        promptAr="أنا اسمي يوسف"
        attempted={true}
        revealed={false}
        explanation="heißen = الاسم"
        onAttempt={() => {}}
        onReveal={() => {}}
      />,
    );
    expect(buttonTag(after, "learn-reveal-btn")).not.toContain("disabled");
  });
});

describe("أدوات الصوت (E05/D16) — التسجيل لأذنك أنت", () => {
  it("السرعات الثلاث + التحذير الصريح — بلا أي عنصر تقييم آلي", () => {
    const html = renderToStaticMarkup(<AudioControlsView clipLabel="Hallo! Guten Tag." />);
    for (const s of ["0.75×", "1×", "1.25×"]) expect(html).toContain(s);
    expect(html).toContain("أذنك أنت");
    expect(html).toContain('data-testid="record-btn"');
    expect(html).not.toContain("auto-score");
    expect(html).not.toContain("درجة");
  });
});

describe("النسخ والخلاصة (E07/E08) — تصحيح لطيف وتقرير هادئ", () => {
  it("تغذية النسخ تظهر بلطف — وخالية من اللوم في كل الحالات", () => {
    for (const expected of ["Ich wohne in Berlin", "Guten Morgen zusammen"]) {
      const comparison = compareDictation(expected, "x");
      const html = renderToStaticMarkup(<DictationView comparison={comparison} onReplay={() => {}} />);
      expect(html).toContain('data-testid="dictation-feedback"');
      for (const w of BLAME_WORDS) expect(html).not.toContain(w);
    }
  });

  it("الخلاصة: تقرير المساء بسطر + معاينة الغد + كلمة مولر", () => {
    const html = renderToStaticMarkup(
      <CloseView
        report={eveningReport({ cardsReviewed: 8, trapsNoticed: 1 })}
        preview={tomorrowPreview({ hasNewContent: true, dueCount: 3 })}
        muellerLine={muellerMessage(0)}
      />,
    );
    expect(html).toContain('data-testid="evening-report"');
    expect(html).toContain('data-testid="tomorrow-preview"');
    expect(html).toContain("النوم شريكك");
    expect(html).toContain("غداً");
    for (const w of BLAME_WORDS) expect(html).not.toContain(w);
  });
});
