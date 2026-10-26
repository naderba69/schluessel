// tests/voice-stability.test.ts — test-audio-voice-stability: استقرار الأصوات عبر الجلسات (D20)
// الاستقرار الحقيقي (بصراحة): VITS/Piper عشوائي بالبذرة — لا بايتات متطابقة.
// الاستقرار = (1) الهوية مثبّتة لا تتذبذب + (2) التوقيع الطيفي: corr ≥0.93 بين التوليدات لنفس النص
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AudioManifest } from "../content/schemas/index.js";
import { VOICE_ID, VOICE_ID_FEMALE, PINNED_VOICES, FEMALE_ROLES, AUDIO_ENGINE, VOICE_LICENSE } from "../src/lib/audio.js";
import { fullForm } from "../src/lib/lesson-runner.js";

const CONTENT = join(process.cwd(), "content");
const manifest = AudioManifest.parse(
  JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")),
);

function sha256(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function genOne(out: string): string {
  execFileSync("python3", [join(process.cwd(), "tools/gen-audio.py"), "one", "die Wohnung.", out], {
    encoding: "utf8", timeout: 120_000,
  });
  return out;
}

function genWav(out: string): string {
  execFileSync("python3", [join(process.cwd(), "tools/gen-audio.py"), "one-wav", "die Wohnung.", out], {
    encoding: "utf8", timeout: 120_000,
  });
  return out;
}

function compare(a: string, b: string): { specCorr: number; durRatio: number; envCorr: number } {
  return JSON.parse(
    execFileSync("python3", [join(process.cwd(), "tools/pcm_compare.py"), a, b], { encoding: "utf8" }),
  );
}

/** عتبة القياس الفعلي (2026-10-09): نفس الكلمة مرتين = 0.976 | كلمات مختلفة = 0.70–0.91 */
const SPEC_CORR_MIN = 0.93;

describe("استقرار الأصوات عبر الجلسات (test-audio-voice-stability)", () => {
  it("كل المسارات بالصوتين المثبَّتين حصراً (D20+D98/D100): الكلمات والإعلانات بالرئيسي — والأنثوي للحوار فقط", () => {
    const pinned: readonly string[] = PINNED_VOICES;
    const femaleRoles: readonly string[] = FEMALE_ROLES;
    for (const t of manifest.tracks) {
      expect(pinned).toContain(t.voiceParams.speaker);
      if (t.role === "word" || t.role === "announcement") expect(t.voiceParams.speaker).toBe(VOICE_ID);
      if (t.voiceParams.speaker === VOICE_ID_FEMALE) expect(femaleRoles).toContain(t.role);
    }
    const voices = Object.values(manifest.characterVoices);
    expect(voices).toHaveLength(8);
    for (const v of voices) expect(pinned).toContain(v);
  });

  it("الهوية الصوتية المعلنة متطابقة: المحرك المحلي والرخصة CC0", () => {
    expect(AUDIO_ENGINE).toBe("piper-tts-local");
    expect(VOICE_LICENSE).toContain("CC0");
    expect(manifest.generator).toBe(AUDIO_ENGINE);
    expect(manifest.voiceLicense).toBe(VOICE_LICENSE);
  });

  it("الحضور الصوتي ثابت: توليدان خامان لنفس الكلمة → نفس التوقيع الطيفي (corr ≥ 0.93)", () => {
    const a = genWav("/tmp/vs-wohnung-a.wav");
    const b = genWav("/tmp/vs-wohnung-b.wav");
    const c = compare(a, b);
    expect(c.specCorr).toBeGreaterThanOrEqual(SPEC_CORR_MIN);
    // VITS يغيّر الطول العيّني حتى ±28% (قياس فعلي) — المطلوب عدم الانزياح الجوهري
    expect(c.durRatio).toBeGreaterThan(0.6);
    expect(c.durRatio).toBeLessThan(1.7);
  }, 120_000);

  it("الحضور الصوتي ثابت عبر المسار الكامل (توليد → تطبيع → Opus) مرتين", () => {
    const a = genOne("/tmp/vs-wohnung-a.opus");
    const b = genOne("/tmp/vs-wohnung-b.opus");
    const c = compare(a, b);
    expect(c.specCorr).toBeGreaterThanOrEqual(SPEC_CORR_MIN);
    expect(c.durRatio).toBeGreaterThan(0.6);
    expect(c.durRatio).toBeLessThan(1.7);
  }, 120_000);

  it("N-043 (D230): نص مقطع الاسم = الشكل الكامل بالأداة (تُسمَع كما تُرى)", () => {
    let checked = 0;
    for (const f of readdirSync(join(CONTENT, "words"))) {
      if (!f.endsWith(".json")) continue;
      const w = JSON.parse(readFileSync(join(CONTENT, "words", f), "utf8")) as {
        id: string; de: string; article?: string; wordClass: string;
      };
      if (w.wordClass !== "noun" || !w.article) continue;
      const t = manifest.tracks.find((x) => x.id === `word-${w.id}`);
      expect(t, `لا مقطع للاسم: ${w.id}`).toBeDefined();
      expect(t!.textDe).toBe(`${fullForm(w)}.`);
      checked++;
    }
    expect(checked).toBe(652); // الدبوس: كل الأسماء ذات الأداة (602 − 15 العارية N-137 · +8 من a2-u4-d1 في D338 · +6 من a2-u4-d2 في D339 · +2 من a2-u1-d2 في D312 · +3 من a2-u1-d3 في D313 · +5 من a2-u1-d4 في D314 · +3 من a2-u1-d5 في D315 · +2 من a2-u1-d6 في D316 · +7 من a2-u2-d1 في D318 · +4 من a2-u2-d2 في D319 · +5 من a2-u2-d3 في D320 · +3 من a2-u2-d4 في D321 · +3 من a2-u2-d5 في D322 · +2 من a2-u3-d1 في D327 · +3 من a2-u3-d2 في D328 · +7 من a2-u3-d3 في D330 · +2 من a2-u3-d4 في D333 · +2 من a2-u3-d5 في D334)
  });

  it("الملف الملتزم من نفس الصوت: التوقيع الطيفي ≥ 0.93 مع إعادة التوليد + سلسلة البصمة موثّقة", () => {
    const committed = join(CONTENT, "words/audio/de-DE/word-wohnung.opus");
    const regen = genOne("/tmp/vs-wohnung-c.opus");
    const c = compare(committed, regen);
    expect(c.specCorr).toBeGreaterThanOrEqual(SPEC_CORR_MIN);
    // سلسلة الالتزام: المانيفست يثبّت بصمة الملف الفعلي (لا وثيقة بلا تشغيل)
    const track = manifest.tracks.find((t) => t.id === "word-wohnung")!;
    expect(track.hash).toBe(`sha256:${sha256(committed)}`);
  }, 120_000);
});
