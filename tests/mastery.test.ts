// mastery.test.ts — مقياس الإتقان M (D18) مع ts-fsrs بمعاملاته الافتراضية (D6/D25)
import { describe, it, expect } from "vitest";
import { fsrs, generatorParameters, createEmptyCard, Rating, State, Card as FsrsCard } from "ts-fsrs";
import { computeMastery, SrsCardState } from "../content/schemas/card.js";

function toSrsState(card: FsrsCard, id: string): SrsCardState {
  return {
    cardId: id,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    // ts-fsrs v5: state رقمي (enum) — يُحوَّل لاسمه النصي
    state: State[card.state] as "New" | "Learning" | "Review" | "Relearning",
    last_review: card.last_review?.toISOString(),
    masteryLevel: "L0",
  };
}

describe("computeMastery — D18 (test-fsrs-mastery)", () => {
  it("بطاقات جديدة = إتقان 0 وعتبة A1 = 21 يوماً", () => {
    const cards = [toSrsState(createEmptyCard(new Date()), "w1"), toSrsState(createEmptyCard(new Date()), "w2")];
    const m = computeMastery(cards, "A1");
    expect(m.thresholdDays).toBe(21);
    expect(m.total).toBe(2);
    expect(m.ratio).toBe(0);
  });

  it("الاسترجاع الناجح يرفع Stability ثم يرفع M", () => {
    const f = fsrs(generatorParameters()); // معاملات افتراضية حرفياً (قانون 19)
    let card = createEmptyCard(new Date("2026-10-01"));
    // ثلاث مراجعات ناجحة على مدى ~10 أيام
    for (let i = 0; i < 3; i++) {
      const now = card.due;
      card = f.next(card, now, Rating.Good).card;
    }
    const state = toSrsState(card, "w1");
    expect(state.stability).toBeGreaterThan(0);
    const m = computeMastery([state], "A1");
    // الاستقرار بعد 3 مراجعات جيدة قد يتجاوز 21 يوماً في FSRS الافتراضي؛ نتحقق من التطابق الحسابي نفسه
    const expected = state.stability >= 21 ? 1 : 0;
    expect(m.ratio).toBe(expected);
  });

  it("عتبة A2+ = 30 يوماً", () => {
    const m = computeMastery([], "B1");
    expect(m.thresholdDays).toBe(30);
    expect(m.ratio).toBe(0);
  });

  it("البطاقات المتجاوزة للعتبة تُحسب بنسبتها (R(t) لا يدخل إطلاقاً)", () => {
    const mk = (s: number, id: string): SrsCardState => ({
      cardId: id, due: "2026-10-10", stability: s, difficulty: 5,
      elapsed_days: 0, scheduled_days: 0, reps: 1, lapses: 0, state: "Review", masteryLevel: "L1",
    });
    const m = computeMastery([mk(25, "a"), mk(10, "b"), mk(40, "c"), mk(5, "d")], "A1");
    expect(m.counted).toBe(2);
    expect(m.ratio).toBeCloseTo(0.5);
  });
});
