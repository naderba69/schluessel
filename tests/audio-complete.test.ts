// tests/audio-complete.test.ts — test-audio-complete: 100% من الملفات الصوتية بتحليل فعلي (القانون 6)
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { AudioManifest } from "../content/schemas/index.js";
import { VOICE_ID, WORD_CLIP_MAX_SEC, RMS_WINDOW_DB } from "../src/lib/audio.js";

const CONTENT = join(process.cwd(), "content");
const manifest = AudioManifest.parse(
  JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")),
);

function probe(file: string): { durationSec: number; rmsDb: number } {
  return JSON.parse(
    execFileSync("python3", [join(process.cwd(), "tools/audio_probe.py"), file], { encoding: "utf8" }),
  );
}

describe("اكتمال الصوت (test-audio-complete)", () => {
  it("المانيفست: توليد Piper محلي + رخصة CC0 موثقة (D20)", () => {
    expect(manifest.generator).toBe("piper-tts-local");
    expect(manifest.voiceLicense).toContain("CC0");
  });

  it("كل مسار صوتي: ملفه موجود فعلياً وبصمته SHA-256 مطابقة", () => {
    expect(manifest.tracks.length).toBeGreaterThan(0);
    for (const t of manifest.tracks) {
      const f = join(CONTENT, t.file);
      expect(existsSync(f), `مفقود: ${t.file}`).toBe(true);
      const sha = `sha256:${createHash("sha256").update(readFileSync(f)).digest("hex")}`;
      expect(t.hash, `بصمة غير مطابقة: ${t.file}`).toBe(sha);
    }
  });

  it("تحليل فعلي: مقاطع الكلمات ≤1.5s وRMS داخل النافذة لكل المسارات", () => {
    for (const t of manifest.tracks) {
      const p = probe(join(CONTENT, t.file));
      if (t.role === "word")
        expect(p.durationSec, `طول خارج الحد: ${t.file}`).toBeLessThanOrEqual(WORD_CLIP_MAX_SEC);
      expect(p.rmsDb, `RMS خارج النافذة: ${t.file}`).toBeGreaterThanOrEqual(RMS_WINDOW_DB[0]);
      expect(p.rmsDb, `RMS خارج النافذة: ${t.file}`).toBeLessThanOrEqual(RMS_WINDOW_DB[1]);
    }
  }, 120_000);

  it("كل مسار كلمات يشير إلى ملف كلمة موجود في content/words", () => {
    for (const t of manifest.tracks.filter((x) => x.role === "word")) {
      const wid = t.id.replace(/^word-/, "");
      expect(existsSync(join(CONTENT, `words/${wid}.json`)), `كلمة مفقودة: ${wid}`).toBe(true);
    }
  });

  it("قياسات المانيفست متطابقة مع القياس الفعلي للملف", () => {
    for (const t of manifest.tracks) {
      const p = probe(join(CONTENT, t.file));
      expect(Math.abs(p.durationSec * 1000 - (t.durationMs ?? 0)), `قياس غير مطابق: ${t.file}`).toBeLessThan(20);
    }
  }, 120_000);
});
