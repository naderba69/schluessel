// advanced-listening.test.ts — E09: أزواج D16 + ضجيج تدريجي + أخبار بطيئة (Logan/Lively/Pisoni 1991)
import { describe, it, expect } from "vitest";
import {
  D16_MINIMAL_PAIRS,
  buildListeningSession,
  judgeDiscrimination,
  advanceNoise,
  NOISE_STAGES,
  SLOW_SPEEDS,
  isTranscriptAfterListening,
} from "../src/lib/advanced-listening.js";
import { BLAME_WORDS } from "../src/lib/warmth-engine.js";

describe("E09 — أزواج Bär/Bett من اختبار D16 نفسها", () => {
  it("الأزواج الثلاثة هي أزواج D16 حرفياً", () => {
    expect(D16_MINIMAL_PAIRS.map((p) => [p.deA, p.deB])).toEqual([
      ["Bär", "Bett"],
      ["Kirche", "Kirsche"],
      ["Tier", "Tür"],
    ]);
    for (const p of D16_MINIMAL_PAIRS) {
      expect(p.arA).toBeTruthy();
      expect(p.hintAr).toBeTruthy();
      expect(p.risk).toBeTruthy();
    }
  });

  it("الجلسة: استماع ← تمييز ← نطق لكل زوج — والنص المكتوب أخيراً", () => {
    const s = buildListeningSession({ withSlowNews: true });
    const kinds = s.steps.map((x) => x.kind);
    expect(kinds.slice(0, 3)).toEqual(["hoeren", "unterscheiden", "nachsprechen"]);
    expect(isTranscriptAfterListening(s.steps)).toBe(true);
  });

  it("الأخبار البطيئة: سرعات 0.7 → 0.85 → 1.0 تصاعدية", () => {
    expect(SLOW_SPEEDS).toEqual([0.7, 0.85, 1.0]);
    const s = buildListeningSession({ pairs: [D16_MINIMAL_PAIRS[0]!], withSlowNews: true });
    const speeds = s.steps.filter((x) => x.kind === "hoeren" && x.speed !== undefined && x.speed < 1).map((x) => x.speed);
    expect(speeds).toEqual([0.7, 0.85]);
  });
});

describe("E09 — الضجيج التدريجي ببوابة 80%", () => {
  it("ترقية عند ≥ 80% والبقاء دونها (صعوبات مرغوبة بلا ضغط)", () => {
    expect(judgeDiscrimination(8, 10, "clean").advance).toBe(true);
    expect(judgeDiscrimination(7, 10, "clean").advance).toBe(false);
    expect(judgeDiscrimination(7, 10, "clean").nextNoise).toBe("clean");
    expect(judgeDiscrimination(8, 10, "clean").nextNoise).toBe("soft");
  });

  it("سلّم الضجيج لا يتجاوز آخر مرحلة — وبلا لوم في النبرات", () => {
    expect(advanceNoise("full", true)).toBe("full");
    expect(NOISE_STAGES.length).toBe(4);
    const note = judgeDiscrimination(1, 10).noteAr;
    for (const w of BLAME_WORDS) expect(note).not.toContain(w);
    expect(() => judgeDiscrimination(1, 0)).toThrow();
  });
});
