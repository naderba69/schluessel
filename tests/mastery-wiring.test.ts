// mastery-wiring.test.ts — D271: الإتقان M محسوب من بيانات SRS الحقيقية (D18) لا من فراغ
// العقد: masteryForLevel يصفّي بمستوى البطاقة ويطبّق العتبة (21 لـA1 / 30 فوقه) — المجهول يُستبعد
import { describe, it, expect } from "vitest";
import type { SrsCardState } from "../content/schemas/card.js";
import type { Level } from "../content/schemas/common.js";
import { masteryForLevel, masteryLineAr, buildProgressMap } from "../src/lib/progress-engine.js";
import { enrollSrsCards, scheduleRecall } from "../src/lib/review-engine.js";
import { LESSON_INDEX, levelOfWord } from "../src/lesson-packs.js";

function mk(cardId: string, stability: number): SrsCardState {
  return {
    cardId,
    due: new Date().toISOString(),
    stability,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 1,
    lapses: 0,
    state: "Review",
    masteryLevel: "L0",
  };
}

const levelOf: Record<string, Level> = { w1: "A1", w2: "A1", w3: "A2" };
const cardLevelOf = (id: string): Level | undefined => levelOf[id];

describe("masteryForLevel — D271", () => {
  it("عتبة A1 هي 21 يوماً: 25 تُحتسب و20 لا", () => {
    const m = masteryForLevel([mk("w1", 25), mk("w2", 20)], "A1", cardLevelOf);
    expect(m.thresholdDays).toBe(21);
    expect(m.counted).toBe(1);
    expect(m.total).toBe(2);
    expect(m.ratio).toBeCloseTo(0.5);
  });

  it("عتبة A2 هي 30 يوماً: 25 لا تُحتسب", () => {
    const m = masteryForLevel([mk("w3", 25)], "A2", cardLevelOf);
    expect(m.thresholdDays).toBe(30);
    expect(m.counted).toBe(0);
    expect(m.total).toBe(1);
  });

  it("بطاقة مستوى آخر لا تدخل في الحساب", () => {
    const m = masteryForLevel([mk("w1", 50), mk("w3", 50)], "A1", cardLevelOf);
    expect(m.total).toBe(1);
    expect(m.counted).toBe(1);
  });

  it("البطاقة مجهولة المستوى تُستبعد بصدق (لا تُخترع لها نسبة)", () => {
    const m = masteryForLevel([mk("ghost-word", 99)], "A1", cardLevelOf);
    expect(m.total).toBe(0);
    expect(m.ratio).toBe(0);
  });

  it("بلا بطاقات: النسبة صفر وسطر العرض دعوة لا رقم مخيف", () => {
    const m = masteryForLevel([], "A1", cardLevelOf);
    expect(m.ratio).toBe(0);
    expect(masteryLineAr("A1", m)).toContain("لا بطاقات مراجعة");
  });

  it("سطر العرض يحمل النسبة والعدد والعتبة", () => {
    const line = masteryLineAr("A1", masteryForLevel([mk("w1", 25), mk("w2", 1)], "A1", cardLevelOf));
    expect(line).toContain("50%");
    expect(line).toContain("1 من 2");
    expect(line).toContain("21");
  });
});

describe("levelOfWord — D271", () => {
  it("كلمة حقيقية من الفهرس تعود بمستوى درسها الأول", () => {
    const entry = LESSON_INDEX.find((e) => e.wordIds.length > 0)!;
    expect(levelOfWord(entry.wordIds[0])).toBe(entry.level);
  });

  it("الكلمة الغريبة عن الفهرس تعود undefined", () => {
    expect(levelOfWord("كلمة-غير-موجودة-أبداً")).toBeUndefined();
  });
});

describe("buildProgressMap + M — D271", () => {
  const base = {
    index: [
      { id: "a1-u1-d1", level: "A1", unit: 1, day: 1 },
      { id: "a1-u1-d2", level: "A1", unit: 1, day: 2 },
    ],
    completedIds: ["a1-u1-d1"] as string[],
    availableIds: ["a1-u1-d2"] as string[],
    currentId: "a1-u1-d2",
    createdAtDay: "2026-10-01",
    todayDay: "2026-10-22",
  };

  it("بلا SRS: لا حقل إتقان إطلاقاً", () => {
    expect(buildProgressMap(base).mastery).toBeUndefined();
  });

  it("مع SRS: إتقان للمستوى الذي له بطاقات فقط", () => {
    const map = buildProgressMap({ ...base, srsCards: [mk("w1", 30)], cardLevelOf });
    expect(map.mastery).toHaveLength(1);
    expect(map.mastery![0].level).toBe("A1");
    expect(map.mastery![0].lineAr).toContain("100%");
  });
});

describe("التكامل: من التقييم الحقيقي إلى M — D271", () => {
  it("تقييمات Good المتكررة ترفع الثبات وM يعكسها", () => {
    const fresh = enrollSrsCards([], ["w1", "w2"]);
    expect(fresh).toHaveLength(2);
    let day = new Date("2026-10-01T08:00:00Z");
    let cards = fresh;
    for (let i = 0; i < 6; i++) {
      day = new Date(day.getTime() + 86400000);
      cards = cards.map((c) => scheduleRecall(c, "good", day));
    }
    const m = masteryForLevel(cards, "A1", cardLevelOf);
    expect(m.total).toBe(2);
    // M = عدّ S≥21 حرفياً — بلا أرقام سحرية عن FSRS نفسه
    expect(m.counted).toBe(cards.filter((c) => c.stability >= 21).length);
  });
});
