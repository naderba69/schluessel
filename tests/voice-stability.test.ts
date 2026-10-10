// tests/voice-stability.test.ts — test-audio-voice-stability: استقرار الأصوات عبر الجلسات (D20)
// الاستقرار الحقيقي (بصراحة): VITS/Piper عشوائي بالبذرة — لا بايتات متطابقة.
// الاستقرار = (1) الهوية مثبّتة لا تتذبذب + (2) التوقيع الطيفي: corr ≥0.93 بين التوليدات لنفس النص
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AudioManifest } from "../content/schemas/index.js";
import { VOICE_ID, AUDIO_ENGINE, VOICE_LICENSE } from "../src/lib/audio.js";

const CONTENT = join(process.cwd(), "content");
const manifest = AudioManifest.parse(
  JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")),
);

function sha256(file: string): string {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function genOne(out: string): string {
  execFileSync("python3", [join(process.cwd(), "tools/gen-audio.py"), "one", "Wohnung.", out], {
    encoding: "utf8", timeout: 120_000,
  });
  return out;
}

function genWav(out: string): string {
  execFileSync("python3", [join(process.cwd(), "tools/gen-audio.py"), "one-wav", "Wohnung.", out], {
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
  it("كل المسارات (الشخصيات الثمانية + الكلمات) بالمصوّت المثبّت الواحد — لا تذبذب", () => {
    for (const t of manifest.tracks) expect(t.voiceParams.speaker).toBe(VOICE_ID);
    const voices = Object.values(manifest.characterVoices);
    expect(voices).toHaveLength(8);
    for (const v of voices) expect(v).toBe(VOICE_ID);
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
  });

  it("الحضور الصوتي ثابت عبر المسار الكامل (توليد → تطبيع → Opus) مرتين", () => {
    const a = genOne("/tmp/vs-wohnung-a.opus");
    const b = genOne("/tmp/vs-wohnung-b.opus");
    const c = compare(a, b);
    expect(c.specCorr).toBeGreaterThanOrEqual(SPEC_CORR_MIN);
    expect(c.durRatio).toBeGreaterThan(0.6);
    expect(c.durRatio).toBeLessThan(1.7);
  });

  it("الملف الملتزم من نفس الصوت: التوقيع الطيفي ≥ 0.93 مع إعادة التوليد + سلسلة البصمة موثّقة", () => {
    const committed = join(CONTENT, "words/audio/de-DE/word-wohnung.opus");
    const regen = genOne("/tmp/vs-wohnung-c.opus");
    const c = compare(committed, regen);
    expect(c.specCorr).toBeGreaterThanOrEqual(SPEC_CORR_MIN);
    // سلسلة الالتزام: المانيفست يثبّت بصمة الملف الفعلي (لا وثيقة بلا تشغيل)
    const track = manifest.tracks.find((t) => t.id === "word-wohnung")!;
    expect(track.hash).toBe(`sha256:${sha256(committed)}`);
  });
});
