// first-run.test.ts — S0.7 + S0.11 | test-first-run-flow / test-unit0-jit
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  FIRST_RUN_STEPS, firstRunNext, completeFirstRun,
} from "../src/lib/first-run.js";
import {
  loadUnit0Deck, dayOneCards, jitCards, shouldShowCard, cardsForEvent,
} from "../src/lib/unit0.js";
import {
  WelcomeScreen, NameScreen, Unit0CardView, FirstLessonScreen,
} from "../src/components/FirstRun.js";
import { Lesson as LessonSchema, Word as WordSchema } from "../content/schemas/index.js";
import firstLessonJson from "../content/lessons/a1/a1-u1-d1.json";
import wordHallo from "../content/words/hallo.json";
import wordHeissen from "../content/words/heissen.json";
import wordGutenTag from "../content/words/guten-tag.json";

describe("أول تشغيل (test-first-run-flow)", () => {
  it("المسار: ترحيب → اسم → وحدة صفر → أول درس — بلا اختبار تموضع إطلاقاً", () => {
    expect([...FIRST_RUN_STEPS]).toEqual(["welcome", "ask-name", "unit0-day1", "first-lesson"]);
    const flow: string[] = [];
    let s: string | null = FIRST_RUN_STEPS[0];
    while (s) { flow.push(s); s = firstRunNext(s as never); }
    expect(flow).toEqual([...FIRST_RUN_STEPS]);
    expect(flow.join(" ")).not.toMatch(/placement|test|تموضع|تحديد/);
  });

  it("completeFirstRun: اسم فارغ مرفوض (§16)", () => {
    expect(() => completeFirstRun("   ")).toThrow();
  });

  it("completeFirstRun: يُنشئ حالة باسم المتعلم ويُظهر بطاقات اليوم الأربع فقط", () => {
    const state = completeFirstRun("يوسف");
    expect(state.profile.name).toBe("يوسف");
    expect(state.profile.unit0Shown).toHaveLength(4);
    expect(state.profile.level).toBe("A1");
    expect(state.progress.availableLessons).toEqual(["a1-u1-d1"]); // أول درس في نفس الجلسة (§16)
    expect(state.srsCards).toEqual([]);
  });

  it("شاشات الترحيب والاسم تُعرضان فعلياً (بلا شاشة فارغة)", () => {
    const welcome = renderToStaticMarkup(<WelcomeScreen onNext={() => {}} />);
    expect(welcome).toContain("مولر");
    expect(welcome).toContain("data-screen=\"welcome\"");
    const name = renderToStaticMarkup(<NameScreen onSubmit={() => {}} />);
    expect(name).toContain("اسم المتعلم");
  });

  it("شاشة أول درس تعرض الهدف والكلمات بترميز الجنس", () => {
    const lesson = LessonSchema.parse(firstLessonJson);
    const words = [wordHallo, wordHeissen, wordGutenTag].map((w) => WordSchema.parse(w));
    const html = renderToStaticMarkup(<FirstLessonScreen lesson={lesson} words={words} />);
    expect(html).toContain("data-lesson-id=\"a1-u1-d1\"");
    expect(html).toContain("data-testid=\"can-do\"");
    expect(html).toContain("gender-badge");
  });
});

describe("الوحدة صفر JIT (test-unit0-jit)", () => {
  const deck = loadUnit0Deck();

  it("الحزمة: 12 بطاقة = 4 يوم أول + 8 JIT", () => {
    expect(deck.cards).toHaveLength(12);
    expect(dayOneCards(deck)).toHaveLength(4);
    expect(jitCards(deck)).toHaveLength(8);
  });

  it("كل بطاقة JIT لا تظهر إلا عند محفّزها فعلياً (لا دفعة واحدة)", () => {
    for (const card of jitCards(deck)) {
      expect(shouldShowCard(card, [], card.trigger)).toBe(true);
      const otherEvent = card.trigger === "first-uebung" ? "first-palace" : "first-uebung";
      expect(shouldShowCard(card, [], otherEvent)).toBe(false);
    }
    // مثال صريح: بطاقة «النوم شريكك» لا تظهر عند أول Übung
    const sleep = jitCards(deck).find((c) => c.trigger === "first-night-dew")!;
    expect(shouldShowCard(sleep, [], "first-uebung")).toBe(false);
    expect(shouldShowCard(sleep, [], "first-night-dew")).toBe(true);
    // بطاقات اليوم الأول تظهر عند حدث day-one فقط (لا تتسرب لأحداث JIT)
    const first = dayOneCards(deck)[0];
    expect(shouldShowCard(first, [], "day-one")).toBe(true);
    expect(shouldShowCard(first, [], "first-uebung")).toBe(false);
  });

  it("لا إعادة إظهار لبطاقة عُرضت من قبل", () => {
    const palace = jitCards(deck).find((c) => c.trigger === "first-palace")!;
    expect(shouldShowCard(palace, [palace.id], "first-palace")).toBe(false);
    expect(cardsForEvent(deck, [palace.id], "first-palace")).toEqual([]);
  });

  it("بطاقات اليوم الأول: 4 بطاقات بالضبط وبأوامر 1–4", () => {
    const d1 = dayOneCards(deck);
    expect(d1.map((c) => c.order)).toEqual([1, 2, 3, 4]);
  });

  it("بطاقة الوحدة صفر لها نص فعلي (اختبار PDF: قيمتها في السياق التفاعلي لكنها ليست فارغة)", () => {
    for (const card of deck.cards) {
      expect(card.body.ar.length).toBeGreaterThan(30);
      expect(card.title.ar.length).toBeGreaterThan(3);
    }
  });
});
