// review-engine.test.ts — E03 محرك المراجعة: SRS في محطة الاسترجاع + لا جلسة بلا استرجاع أولاً
import { describe, it, expect } from "vitest";
import { createEmptyCard, fsrs, generatorParameters, Rating } from "ts-fsrs";
import type { SrsCardState } from "../content/schemas/index.js";
import { buildDayPlan } from "../src/lib/day-engine.js";
import {
  RECALL_STATION_MINUTES,
  RECALL_RATINGS,
  RATING_LABELS_AR,
  RATING_TO_FSRS,
  toFsrsCard,
  fromFsrsCard,
  scheduleRecall,
  buildRecallQueue,
  sessionStartsWithRecall,
  recallFlowValid,
  type RecallRating,
} from "../src/lib/review-engine.js";

const NOW = new Date("2026-10-10T10:00:00.000Z");

function card(over: Partial<SrsCardState> = {}): SrsCardState {
  return {
    cardId: "wohnung",
    due: "2026-10-10T00:00:00.000Z",
    stability: 12,
    difficulty: 5,
    elapsed_days: 1,
    scheduled_days: 1,
    reps: 2,
    lapses: 0,
    learning_steps: 0,
    state: "Review",
    masteryLevel: "L2",
    ...over,
  };
}

describe("محرك المراجعة E03 — الجدولة (D6: ts-fsrs بمعاملات افتراضية)", () => {
  it("التحويل forth/back يحفظ كل حقول ts-fsrs (لا فقد)", () => {
    const s = card({ learning_steps: 2, last_review: "2026-10-09T08:00:00.000Z" });
    const back = fromFsrsCard(toFsrsCard(s), s);
    expect(back).toEqual(s);
  });

  it("§2.5: التقييمات الأربعة = نسيت | صعب | جيد | سهل", () => {
    expect(RECALL_RATINGS).toEqual(["again", "hard", "good", "easy"]);
    expect(RATING_LABELS_AR).toEqual({ again: "نسيت", hard: "صعب", good: "جيد", easy: "سهل" });
    expect(RATING_TO_FSRS.again).toBe(Rating.Again);
    expect(RATING_TO_FSRS.easy).toBe(Rating.Easy);
  });

  it("التقييم «نسيت» على بطاقة مراجعة يرفع Lapses ويعيدها Relearning", () => {
    const before = card({ lapses: 1, state: "Review" });
    const after = scheduleRecall(before, "again", NOW);
    expect(after.lapses).toBe(before.lapses + 1);
    expect(after.state).toBe("Relearning");
    expect(after.reps).toBe(before.reps + 1);
  });

  it("التقييم «جيد» يجدول موعداً مستقبلياً ويحفظ زمن آخر مراجعة", () => {
    const empty = fromFsrsCard(createEmptyCard(NOW), {
      cardId: "w1",
      due: NOW.toISOString(),
      stability: 0,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: 0,
      reps: 0,
      lapses: 0,
      learning_steps: 0,
      state: "New",
      masteryLevel: "L0",
    });
    const after = scheduleRecall(empty, "good", NOW);
    expect(new Date(after.due).getTime()).toBeGreaterThan(NOW.getTime());
    expect(after.last_review).toBe(NOW.toISOString());
    expect(after.state === "Learning" || after.state === "Review").toBe(true);
  });

  it("الجدولة تطابق ts-fsrs مباشرة (معاملات افتراضية حرفياً)", () => {
    const f = fsrs(generatorParameters());
    const s = card();
    const direct = f.next(toFsrsCard(s), NOW, Rating.Hard).card;
    const viaEngine = scheduleRecall(s, "hard", NOW);
    expect(viaEngine.due).toBe(direct.due.toISOString());
    expect(viaEngine.stability).toBe(direct.stability);
    expect(viaEngine.difficulty).toBe(direct.difficulty);
  });

  it("محطة 1 = 15 دقيقة (ربط E01)", () => {
    expect(RECALL_STATION_MINUTES).toBe(15);
  });
});

describe("طابور الاسترجاع — الجديد لا يدخل أبداً", () => {
  it("جولة الأخطاء الذهبية أولاً (الأقدم أولاً) ثم المستحقات (الأقدم أولاً) ثم مهارة اليوم", () => {
    const queue = buildRecallQueue({
      now: NOW,
      dueCards: [
        card({ cardId: "b", due: "2026-10-10T09:00:00.000Z" }),
        card({ cardId: "a", due: "2026-10-08T00:00:00.000Z" }),
      ],
      errorItems: [
        { id: "e-new", capturedOn: "2026-10-09" },
        { id: "e-old", capturedOn: "2026-10-05" },
      ],
      skillOfDay: "satzklammer",
    });
    expect(queue.map((q) => `${q.kind}:${q.id}`)).toEqual([
      "error-round:e-old",
      "error-round:e-new",
      "srs:a",
      "srs:b",
      "skill:satzklammer",
    ]);
  });

  it("يُستبعد: الجديد (state=New) والمتأخر (due بعد الآن)", () => {
    const queue = buildRecallQueue({
      now: NOW,
      dueCards: [
        card({ cardId: "new-1", state: "New", due: "2026-10-09T00:00:00.000Z" }),
        card({ cardId: "future-1", due: "2026-10-12T00:00:00.000Z" }),
        card({ cardId: "due-1", due: "2026-10-10T00:00:00.000Z" }),
      ],
    });
    expect(queue.map((q) => q.id)).toEqual(["due-1"]);
  });

  it("لا عنصر نوعه «new» في الطابور إطلاقاً (الجديد = محطة 2)", () => {
    const queue = buildRecallQueue({
      now: NOW,
      dueCards: [card()],
      errorItems: [{ id: "e1", capturedOn: "2026-10-09" }],
    });
    expect(queue.every((q) => q.kind === "error-round" || q.kind === "srs" || q.kind === "skill")).toBe(true);
  });

  it("التركيب مع E06: ترتيب الطابور = ترتيب محطة 1 في خطة اليوم", () => {
    const goldenErrors = [
      { id: "e2", capturedOn: "2026-10-11", pattern: "heißen", kind: "error" as const },
      { id: "e1", capturedOn: "2026-10-09", pattern: "ich bin/ich heiße", kind: "error" as const },
    ];
    const plan = buildDayPlan({ date: "2026-10-12", goldenErrors, dueCards: [], newItems: [] });
    const queue = buildRecallQueue({
      now: new Date("2026-10-12T08:00:00.000Z"),
      dueCards: [],
      errorItems: goldenErrors.map((e) => ({ id: e.id, capturedOn: e.capturedOn })),
    });
    expect(queue.map((q) => q.id)).toEqual(plan.station1.goldenErrors.map((e) => e.id));
  });
});

describe("حراس الجلسة (F121 — اختبار يقفله)", () => {
  it("لا جلسة بلا استرجاع أولاً: جديد/تدريب/خلاصة أولاً = مرفوضة", () => {
    expect(sessionStartsWithRecall([{ kind: "new" }, { kind: "recall" }])).toBe(false);
    expect(sessionStartsWithRecall([{ kind: "practice" }])).toBe(false);
    expect(sessionStartsWithRecall([{ kind: "close" }])).toBe(false);
    expect(sessionStartsWithRecall([])).toBe(false); // جلسة فارغة = بلا استرجاع
  });

  it("جلسة تبدأ بالاسترجاع = مقبولة", () => {
    expect(sessionStartsWithRecall([{ kind: "recall" }, { kind: "new" }])).toBe(true);
  });

  it("مسار الشاشة §2.5: محاولة ← كشف ← تقييم — أي انعكاس مرفوض", () => {
    expect(recallFlowValid([{ kind: "attempt" }, { kind: "reveal" }, { kind: "rate" }])).toBe(true);
    expect(recallFlowValid([{ kind: "attempt" }, { kind: "attempt" }, { kind: "reveal" }, { kind: "rate" }])).toBe(true);
    expect(recallFlowValid([{ kind: "reveal" }, { kind: "attempt" }, { kind: "rate" }])).toBe(false); // كشف قبل محاولة
    expect(recallFlowValid([{ kind: "attempt" }, { kind: "rate" }, { kind: "reveal" }])).toBe(false); // تقييم قبل كشف
    expect(recallFlowValid([{ kind: "attempt" }, { kind: "reveal" }, { kind: "attempt" }])).toBe(false); // محاولة بعد كشف
    expect(recallFlowValid([{ kind: "rate" }])).toBe(false);
    expect(recallFlowValid([])).toBe(true);
  });

  it("أنواع التقييم الأربعة كلها مقبولة من المُقيِّم (RecallRating)", () => {
    const ratings: RecallRating[] = ["again", "hard", "good", "easy"];
    for (const r of ratings) expect(RATING_TO_FSRS[r]).toBeGreaterThan(0);
  });
});
