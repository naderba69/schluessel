// tts-wiring.test.ts — N-014 (D230): ربط tts() بـsynth_phonemes مُختبَر حتمياً (mock — بلا صوت)
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

describe("N-014 — توصيل tts/synth_phonemes حتمي ومُثبَّت", () => {
  it("الفحص الحتمي أخضر (توجيه + استعادة)", () => {
    const out = execFileSync("python3", [join(process.cwd(), "tools/dev/check-tts-wiring.py")], {
      encoding: "utf8", timeout: 60_000,
    });
    expect(out).toContain("tts-wiring OK");
  });
});
