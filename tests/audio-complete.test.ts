// tests/audio-complete.test.ts — test-audio-complete: 100% من الملفات الصوتية بتحليل فعلي (القانون 6)
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AudioManifest } from "../content/schemas/index.js";
import { VOICE_ID, WORD_CLIP_MAX_SEC, RMS_WINDOW_DB } from "../src/lib/audio.js";
import { probeAudioFiles } from "../tools/validate-content.js";

const CONTENT = join(process.cwd(), "content");
const manifest = AudioManifest.parse(
  JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")),
);

type Probe = { durationSec: number; rmsDb: number; pcmSha256: string };
const PROBE = join(process.cwd(), "tools/audio_probe.py");
function probe(file: string): Probe {
  return JSON.parse(execFileSync("python3", [PROBE, file], { encoding: "utf8" }));
}
/** D133: كل المسارات بعملية Python واحدة (كانت عملية لكل مسار في اختبارين فتجاوزت المهلة عند 1038 مساراً) — مرة واحدة للملف */
let all: Map<string, Probe> | null = null;
function probeAll(): Map<string, Probe> {
  if (all) return all;
  const files = manifest.tracks.map((t) => join(CONTENT, t.file));
  const out = JSON.parse(execFileSync("python3", [PROBE, ...files], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 })) as Probe[];
  all = new Map(files.map((f, i) => [f, out[i]!] as const));
  return all;
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

  it("المدقِّق (D133): القياس دفعةً واحدة · وملف معطوب يُنسب إليه وحده (العودة إلى القياس ملفاً ملفاً)", () => {
    const dir = mkdtempSync(join(tmpdir(), "probe-"));
    const good = join(CONTENT, manifest.tracks[0]!.file);
    const bad = join(dir, "bad.opus");
    writeFileSync(bad, "ليس صوتاً");
    const r = probeAudioFiles([good, bad]);
    expect([...r.keys()]).toEqual([good]);
    expect(r.get(good)).toEqual(expect.objectContaining({ durationSec: probe(good).durationSec, rmsDb: probe(good).rmsDb }));
  });

  it("أداة القياس: الدفعة الواحدة = القياس المنفرد لكل ملف (لا تحيّز من التجميع)", () => {
    const sample = [manifest.tracks[0]!, manifest.tracks[Math.floor(manifest.tracks.length / 2)]!, manifest.tracks.at(-1)!].map((t) => join(CONTENT, t.file));
    const batch = JSON.parse(execFileSync("python3", [PROBE, ...sample], { encoding: "utf8" })) as Probe[];
    expect(batch).toEqual(sample.map((f) => probe(f)));
  });

  it("تحليل فعلي: مقاطع الكلمات ≤1.5s وRMS داخل النافذة لكل المسارات", () => {
    const probes = probeAll();
    for (const t of manifest.tracks) {
      const p = probes.get(join(CONTENT, t.file))!;
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
    const probes = probeAll();
    for (const t of manifest.tracks) {
      const p = probes.get(join(CONTENT, t.file))!;
      expect(Math.abs(p.durationSec * 1000 - (t.durationMs ?? 0)), `قياس غير مطابق: ${t.file}`).toBeLessThan(20);
    }
  }, 120_000);
});
