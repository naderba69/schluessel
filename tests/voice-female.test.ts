// tests/voice-female.test.ts — صوت المرأة (kerstin): مُثبَّت في git ويعمل فعلاً (D98 → D100 → D103)
// (1) المدقِّق: الصوتان المثبَّتان + دور الصوت الأنثوي · (2) الملفان مقفولان بالبصمة والحجم (D28)
// (3) التوجيه من المانيفست (مصدر الحقيقة) · (4) صوت مختلف حقاً وثابت (قياس طيفي) · (5) لا فونيم يسقط صامتاً
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { validateContentTree } from "../tools/validate-content.js";
import { VOICE_ID, VOICE_ID_FEMALE, PINNED_VOICES, FEMALE_ROLES, VOICE_PINS } from "../src/lib/audio.js";

const VOICES_DIR = join(process.cwd(), "tools/piper-voices");
const ALL_MALE = {
  yusuf: VOICE_ID, mueller: VOICE_ID, lena: VOICE_ID, ayse: VOICE_ID,
  "frau-berg": VOICE_ID, thomas: VOICE_ID, "frau-schmidt": VOICE_ID, "dr-weber": VOICE_ID,
};

function manifestWith(track: Record<string, unknown>, characterVoices: Record<string, string> = ALL_MALE) {
  return {
    path: "manifests/audio-manifest.test.json",
    data: {
      schemaVersion: "1.0.0", generator: "piper-tts-local", voiceLicense: "CC0", characterVoices,
      tracks: [{ file: "audio/characters/x.opus", isGuest: false, textDe: "Hallo!", priority: "P0", lessonRefs: [], ...track }],
    },
  };
}
const codes = (entries: { path: string; data: unknown }[]) => validateContentTree(entries).errors.map((e) => e.code);
const py = (args: string[]) => execFileSync("python3", args, { encoding: "utf8", timeout: 180_000 });

describe("D100 — المدقِّق: الصوتان المثبَّتان + دور الصوت الأنثوي", () => {
  it("الثوابت: صوتان مثبَّتان بالضبط + أدوار الحوار الثلاثة فقط", () => {
    expect([...PINNED_VOICES]).toEqual([VOICE_ID, VOICE_ID_FEMALE]);
    expect([...FEMALE_ROLES]).toEqual(["character", "guest", "dialogue"]);
  });

  it("صوت غير مثبَّت = e-audio-voice-drift", () => {
    expect(codes([manifestWith({ id: "x-drift", role: "dialogue", voiceParams: { speaker: "de_DE-eva_k-x_low", speedWpm: 120 } })]))
      .toContain("e-audio-voice-drift");
  });

  it("kerstin في كلمة أو إعلان = e-audio-voice-role", () => {
    for (const role of ["word", "announcement"])
      expect(codes([manifestWith({ id: `x-${role}`, role, voiceParams: { speaker: VOICE_ID_FEMALE, speedWpm: 110 } })]))
        .toContain("e-audio-voice-role");
  });

  it("kerstin لشخصية أنثى في حوار/شخصية/ضيف = مقبول", () => {
    for (const role of FEMALE_ROLES) {
      const c = codes([manifestWith(
        { id: `lena-${role}`, role, characterId: "lena", voiceParams: { speaker: VOICE_ID_FEMALE, speedWpm: 120 } },
        { ...ALL_MALE, lena: VOICE_ID_FEMALE },
      )]);
      expect(c.filter((x) => x.startsWith("e-audio-voice") || x === "e-audio-character-voice")).toEqual([]);
    }
  });

  it("صوت شخصية غير مثبَّت في characterVoices = e-audio-voice-drift", () => {
    expect(codes([manifestWith(
      { id: "ok", role: "dialogue", voiceParams: { speaker: VOICE_ID, speedWpm: 120 } },
      { ...ALL_MALE, ayse: "de_DE-ramona-low" },
    )])).toContain("e-audio-voice-drift");
  });
});

describe("D103 — الصوتان مُثبَّتان في git بالبصمة (D28) — لا تنزيل ولا رفع من المالك", () => {
  it.each(Object.entries(VOICE_PINS))("%s: الحجم والبصمة sha256 مطابقان حرفياً", (voice, pin) => {
    const f = join(VOICES_DIR, `${voice}.onnx`);
    expect(existsSync(f)).toBe(true);
    expect(statSync(f).size).toBe(pin.bytes);
    expect(createHash("sha256").update(readFileSync(f)).digest("hex")).toBe(pin.sha256);
    expect(existsSync(join(VOICES_DIR, `${voice}.onnx.json`))).toBe(true);
  });

  it("kerstin: md5 = الفهرس الرسمي rhasspy/piper حرفياً + بطاقة النموذج: بيانات CC0", () => {
    const onnx = readFileSync(join(VOICES_DIR, "de_DE-kerstin-low.onnx"));
    expect(createHash("md5").update(onnx).digest("hex")).toBe("1d5e5788cfddb04cbb34418f2841931e");
    const card = readFileSync(join(VOICES_DIR, "de_DE-kerstin-low.MODEL_CARD"), "utf8");
    expect(createHash("md5").update(card).digest("hex")).toBe("69ec1bc99fc7e19c9ddcdf712920a6c7");
    expect(card).toContain("License: CC0");
    expect(card).toContain("rhasspy/dataset-voice-kerstin");
    expect(VOICE_PINS[VOICE_ID_FEMALE].license).toContain("CC0");
  });

  it("سكربت رفع المالك أُلغي — لا خطوة يدوية متبقية", () => {
    expect(existsSync(join(process.cwd(), "termux-upload-voice-kerstin.sh"))).toBe(false);
  });
});

describe("D103 — التوجيه من المانيفست + صوت مختلف حقاً وثابت (قياس)", () => {
  const voiceFor = (who: string) =>
    JSON.parse(py([join(process.cwd(), "tools/gen-audio.py"), "voice-for", who])) as { speaker: string; fallback: boolean };

  it("الإناث → kerstin بلا fallback · الذكور → الرئيسي", () => {
    for (const who of ["lena", "ayse", "frau-berg", "frau-schmidt"])
      expect(voiceFor(who)).toMatchObject({ speaker: VOICE_ID_FEMALE, fallback: false });
    for (const who of ["mueller", "yusuf", "thomas", "dr-weber"])
      expect(voiceFor(who)).toMatchObject({ speaker: VOICE_ID, fallback: false });
  });

  it("one-voice يرفض صوتاً غير مثبَّت (لا fallback صامت)", () => {
    expect(() => py([join(process.cwd(), "tools/gen-audio.py"), "one-voice", "de_DE-eva_k-x_low", "Hallo.", "/tmp/x.opus"])).toThrow();
  });

  it("الصوتان مختلفان طيفياً (<0.93) وkerstin ثابت مع نفسه (≥0.93) لنفس الجملة", () => {
    const text = "Guten Morgen! Ich nehme ein Wasser, bitte.";
    const gen = (voice: string, out: string) => py([join(process.cwd(), "tools/gen-audio.py"), "one-voice", voice, text, out]);
    gen(VOICE_ID, "/tmp/vf-t.opus");
    gen(VOICE_ID_FEMALE, "/tmp/vf-k1.opus");
    gen(VOICE_ID_FEMALE, "/tmp/vf-k2.opus");
    const cmp = (a: string, b: string) =>
      JSON.parse(py([join(process.cwd(), "tools/pcm_compare.py"), a, b])) as { specCorr: number };
    expect(cmp("/tmp/vf-t.opus", "/tmp/vf-k1.opus").specCorr).toBeLessThan(0.93);
    expect(cmp("/tmp/vf-k1.opus", "/tmp/vf-k2.opus").specCorr).toBeGreaterThanOrEqual(0.93);
  }, 120_000);

  it("لا فونيم يسقط صامتاً: كل نص ألماني في content/ ممثَّل كاملاً في الصوتين بعد fit_phonemes", () => {
    const r = JSON.parse(py([join(process.cwd(), "tools/phonemize.py"), "--coverage"])) as {
      texts: number;
      voices: Record<string, { missingBeforeFit: Record<string, number>; fixedByFit: number; missingAfterFit: Record<string, number> }>;
    };
    expect(r.texts).toBeGreaterThan(2000);
    for (const v of Object.values(r.voices)) expect(v.missingAfterFit).toEqual({});
    expect(r.voices[VOICE_ID]!.fixedByFit).toBe(0); // الطبقة لا تمس الصوت الرئيسي
    expect(r.voices[VOICE_ID_FEMALE]!.missingBeforeFit["U+0327"]).toBeGreaterThan(0); // العيب حقيقي ومقيس
    expect(r.voices[VOICE_ID_FEMALE]!.fixedByFit).toBeGreaterThan(0);
  }, 120_000);

  it("ich-Laut بصوت kerstin = [ç] لا [c] («nicht»)", () => {
    const [r] = JSON.parse(py([join(process.cwd(), "tools/phonemize.py"), "--voice", VOICE_ID_FEMALE, "nicht"])) as { ipa: string }[];
    expect(r!.ipa).toContain("ç");
    expect(r!.ipa.normalize("NFD")).toContain("c\u0327"); // ç المركّبة تحديداً — المعروفة في خريطته
    expect(r!.ipa).not.toContain("c\u0327"); // لا الشكل المفكك الذي كان يُسقط
  });
});
