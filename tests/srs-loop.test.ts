// tests/srs-loop.test.ts — D273: حلقة SRS مغلقة — المستحق يُراجَع والتقييم يُجدوِل
import { describe, it, expect } from "vitest";
import type { SrsCardState, Word } from "../content/schemas/index.js";
import {
  MAX_DUE_PER_SESSION,
  applySrsRating,
  dueSrsCards,
  srsDirection,
} from "../src/lib/review-engine.js";
import { planLessonStations, srsRecallCards } from "../src/lib/lesson-runner.js";
import { loadFirstSession } from "../src/lesson-packs.js";

const __FIRST = await loadFirstSession();
const firstLesson = __FIRST.lesson;
const firstLessonWords = __FIRST.direct;
const hallo = firstLessonWords.find((w) => w.id === "hallo")!;

function mk(cardId: string, due: string, reps = 0): SrsCardState {
  return {
    cardId,
    due,
    stability: 1,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 0,
    reps,
    lapses: 0,
    state: "Review",
    masteryLevel: "L0",
  };
}
const newDue = (cardId: string, due: string): SrsCardState => ({ ...mk(cardId, due), state: "New", stability: 0, difficulty: 0 });

describe("dueSrsCards — المستحق", () => {
  const NOW = new Date("2026-10-22T12:00:00Z");
  it("المستحق الآن أو قبله فقط — المستقبل مستبعد", () => {
    const due = dueSrsCards(
      [mk("a", "2026-10-22T11:00:00Z"), mk("b", "2026-10-23T11:00:00Z")],
      NOW,
    );
    expect(due.map((c) => c.cardId)).toEqual(["a"]);
  });
  it("بطاقة New المستحقة مشمولة (أول مراجعة في جلسة الغد — ب-11)", () => {
    const due = dueSrsCards([newDue("n", "2026-10-22T11:00:00Z")], NOW);
    expect(due.map((c) => c.cardId)).toEqual(["n"]);
  });
  it("الأقدم استحقاقاً أولاً", () => {
    const due = dueSrsCards(
      [mk("new", "2026-10-22T11:00:00Z"), mk("old", "2026-10-20T11:00:00Z")],
      NOW,
    );
    expect(due.map((c) => c.cardId)).toEqual(["old", "new"]);
  });
  it("سقف الحصة 15 (أ-9: ≈12 دقيقة)", () => {
    expect(MAX_DUE_PER_SESSION).toBe(15);
  });
});

describe("srsDirection — تدوير مواضع السؤال (F039)", () => {
  it("reps زوجي = إنتاج، فردي = فهم", () => {
    expect(srsDirection(mk("a", "2026-10-22T11:00:00Z", 0))).toBe("production");
    expect(srsDirection(mk("a", "2026-10-22T11:00:00Z", 1))).toBe("comprehension");
    expect(srsDirection(mk("a", "2026-10-22T11:00:00Z", 2))).toBe("production");
  });
});

describe("srsRecallCards — شكل البطاقة", () => {
  const word: Word = hallo;
  it("الإنتاج: الوجه المعنى والظهر الصيغة", () => {
    const [c] = srsRecallCards([{ card: mk("hallo", "2026-10-22T11:00:00Z", 0), word }]);
    expect(c!.kind).toBe("srs");
    expect(c!.srsCardId).toBe("hallo");
    expect(c!.front).toContain("بالألمانية");
    expect(c!.back).toBe("Hallo");
    expect(c!.audioId).toBe("word-hallo");
  });
  it("الفهم: الوجه الصيغة والظهر المعنى", () => {
    const [c] = srsRecallCards([{ card: mk("hallo", "2026-10-22T11:00:00Z", 1), word }]);
    expect(c!.front).toBe("Hallo");
    expect(c!.back).toContain("مرحبا");
  });
});

describe("applySrsRating — التقييم يُجدوِل", () => {
  it("البطاقة المستهدفة وحدها تتغير (الثبات يتحرك) والباقي ثابت", () => {
    const now = new Date("2026-10-22T12:00:00Z");
    const before = [mk("a", "2026-10-22T11:00:00Z"), mk("b", "2026-10-22T11:00:00Z")];
    const after = applySrsRating(before, "a", "good", now);
    expect(after[1]).toEqual(before[1]);
    expect(after[0]!.cardId).toBe("a");
    expect(after[0]!.stability).not.toBe(before[0]!.stability);
    expect(after[0]!.reps).toBe(before[0]!.reps + 1);
  });
});

describe("planLessonStations — المستحق بعد الدفء", () => {
  const pair = { card: mk("hallo", "2026-10-22T11:00:00Z", 0), word: hallo };
  it("الترتيب: دفء ثم SRS — والتوافق الخلفي بلا مستحق", () => {
    const plan = planLessonStations(firstLesson, firstLessonWords, [], [], [], [], [pair]);
    expect(plan.recall.map((c) => c.kind)).toEqual(["warmup", "warmup", "warmup", "srs"]);
    expect(plan.recall[3]!.srsCardId).toBe("hallo");
    const legacy = planLessonStations(firstLesson, firstLessonWords);
    expect(legacy.recall.every((c) => c.kind !== "srs")).toBe(true);
  });
});
