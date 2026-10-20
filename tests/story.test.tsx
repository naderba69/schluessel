// tests/story.test.tsx — D193 (N-003): جمل القصة مولَّدة من أول سطر في حوار كل درس وتصل إلى شاشة الخلاصة
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { join } from "node:path";
import { CharacterId } from "../content/schemas/index.js";
import { ALL_LESSONS, ALL_STORY, ALL_GRAMMAR_RULES, ALL_WORDS } from "../src/lesson-packs.js";
import { planLessonStations } from "../src/lib/lesson-runner.js";
import { CHARACTER_NAME_AR, storyLineFor, storySoFar } from "../src/lib/story.js";
import { storyDrift, buildStory } from "../tools/dev/story-sentences.js";
import { CloseStation } from "../src/components/LessonContent.js";

const CONTENT = join(import.meta.dirname, "..", "content");

describe("D193 — القصة المتصلة (N-003 · قرار المالك D182 أ)", () => {
  it("الملف على القرص = المشتق من الحوارات الآن (لا انحراف) — ولا جملة قصة بلا حوار", () => {
    expect(storyDrift(CONTENT)).toEqual([]);
    const { books, lessonIds } = buildStory(CONTENT);
    const n = [...books.values()].reduce((a, b) => a + b.sentences.length, 0);
    const withId = [...lessonIds.values()].filter((x) => x.length === 1).length;
    expect(n).toBe(withId); // كل جملة لدرس وكل درس له حوار له جملة
    expect(n).toBeGreaterThanOrEqual(57); // 2026-10-18: 57 حواراً من 79 درساً — يرتفع مع كل حوار جديد ولا ينخفض
  });

  it("الدفتر مرتّب بترتيب الدروس · كل شخصية لها اسم عربي · الجملة = أول سطر فعلاً", () => {
    for (const c of CharacterId.options) expect(CHARACTER_NAME_AR[c]).toMatch(/\p{Script=Arabic}/u);
    const order = new Map(ALL_LESSONS.map((l, i) => [l.id, i]));
    for (const b of ALL_STORY) {
      const idx = b.sentences.map((s) => order.get(s.lessonId)!);
      expect(idx).toEqual([...idx].sort((a, z) => a - z));
      for (const s of b.sentences) expect(s.id).toBe(`story-${s.lessonId.replace(/-d(\d)$/, "-s$1")}`);
    }
  });

  it("المُشغِّل: درس له حوار ⇒ سطر قصة في الخلاصة + القصة حتى الآن (≤3 سطور سابقة بترتيبها) · درس بلا حوار ⇒ null بصدق", () => {
    const linked = new Set(ALL_STORY.flatMap((b) => b.sentences.map((s) => s.lessonId)));
    for (const l of ALL_LESSONS) {
      const words = ALL_WORDS.filter((w) => l.praesentation.wordIds.includes(w.id) || l.warmup.cardIds.includes(w.id) || l.zusammenfassung.srsBundleWordIds.includes(w.id));
      const plan = planLessonStations(l, words, ALL_GRAMMAR_RULES, ALL_STORY);
      expect(plan.close.storyLine !== null, l.id).toBe(linked.has(l.id));
      expect(plan.close.storyLine).toEqual(storyLineFor(l.id, ALL_STORY));
      expect(plan.close.storySoFar.length).toBeLessThanOrEqual(3);
      if (plan.close.storyLine) expect(l.praesentation.storySentenceIds).toEqual([plan.close.storyLine.id]);
      else expect(l.praesentation.storySentenceIds).toEqual([]);
    }
    const u6d4 = storySoFar("a1-u6-d4", ALL_STORY);
    expect(u6d4.map((x) => x.id)).toEqual(["story-a1-u6-s1", "story-a1-u6-s2", "story-a1-u6-s3"]);
    expect(storyLineFor("a1-u6-d4", ALL_STORY)).toMatchObject({ speakerAr: "لينا", de: "Hallo, Yusuf! Ist das Sofa schon da?" });
  });

  it("الشاشة: محطة الخلاصة تعرض «سطر القصة اليوم» بالاسم العربي والجملة الألمانية والسياق", () => {
    const l = ALL_LESSONS.find((x) => x.id === "a1-u6-d4")!;
    const words = ALL_WORDS.filter((w) => l.praesentation.wordIds.includes(w.id) || l.warmup.cardIds.includes(w.id) || l.zusammenfassung.srsBundleWordIds.includes(w.id));
    const plan = planLessonStations(l, words, ALL_GRAMMAR_RULES, ALL_STORY);
    const html = renderToStaticMarkup(<CloseStation data={plan.close} report="r" preview="p" muellerLine="m" />);
    expect(html).toContain('data-testid="story-line"');
    expect(html).toContain("سطر القصة اليوم");
    expect(html).toContain("Ist das Sofa schon da?");
    expect(html).toContain("القصة حتى الآن");
    expect(html).toContain("لينا");
    // درس بلا حوار: لا صندوق فارغ
    const l1 = ALL_LESSONS.find((x) => x.id === "a1-u1-d1")!;
    const w1 = ALL_WORDS.filter((w) => l1.praesentation.wordIds.includes(w.id) || l1.warmup.cardIds.includes(w.id) || l1.zusammenfassung.srsBundleWordIds.includes(w.id));
    const html1 = renderToStaticMarkup(<CloseStation data={planLessonStations(l1, w1, ALL_GRAMMAR_RULES, ALL_STORY).close} report="r" preview="p" muellerLine="m" />);
    expect(html1).not.toContain("story-line");
  });
});
