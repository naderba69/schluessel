// tests/voice-female.test.ts — D100: صوت المرأة (kerstin) — ما ادّعاه D98 صار حقيقياً ومقفولاً باختبار
// (1) المدقِّق يطبّق الصوتين المثبَّتين + دور الصوت الأنثوي فعلاً
// (2) gen-audio يوجّه الإناث إلى kerstin عند وجود ملفه — وإلا fallback صريح للصوت الرئيسي (لا ادعاء)
// (3) سكربت Termux يتحقق بالقيم الرسمية (63,104,526 بايت + md5) — لا بوابة «~16.8MB» الخاطئة
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { validateContentTree } from "../tools/validate-content.js";
import { VOICE_ID, VOICE_ID_FEMALE, PINNED_VOICES, FEMALE_ROLES } from "../src/lib/audio.js";

const ALL_MALE = {
  yusuf: VOICE_ID, mueller: VOICE_ID, lena: VOICE_ID, ayse: VOICE_ID,
  "frau-berg": VOICE_ID, thomas: VOICE_ID, "frau-schmidt": VOICE_ID, "dr-weber": VOICE_ID,
};

function manifestWith(track: Record<string, unknown>, characterVoices: Record<string, string> = ALL_MALE) {
  return {
    path: "manifests/audio-manifest.test.json",
    data: {
      schemaVersion: "1.0.0",
      generator: "piper-tts-local",
      voiceLicense: "CC0 (Thorsten-Voice)",
      characterVoices,
      tracks: [{
        file: "audio/characters/x.opus", isGuest: false, textDe: "Hallo!", priority: "P0", lessonRefs: [],
        ...track,
      }],
    },
  };
}

const codes = (entries: { path: string; data: unknown }[]) =>
  validateContentTree(entries).errors.map((e) => e.code);

describe("D100 — المدقِّق: الصوتان المثبَّتان + دور الصوت الأنثوي (مُنفَّذ فعلياً)", () => {
  it("الثوابت: صوتان مثبَّتان بالضبط + أدوار الحوار الثلاثة فقط", () => {
    expect([...PINNED_VOICES]).toEqual([VOICE_ID, VOICE_ID_FEMALE]);
    expect([...FEMALE_ROLES]).toEqual(["character", "guest", "dialogue"]);
  });

  it("صوت غير مثبَّت = e-audio-voice-drift (لا تذبذب أبداً)", () => {
    const c = codes([manifestWith({ id: "x-drift", role: "dialogue", voiceParams: { speaker: "de_DE-eva_k-x_low", speedWpm: 120 } })]);
    expect(c).toContain("e-audio-voice-drift");
  });

  it("kerstin في دور كلمة = e-audio-voice-role (الكلمات بالصوت الرئيسي دائماً)", () => {
    const c = codes([manifestWith({ id: "word-x", role: "word", voiceParams: { speaker: VOICE_ID_FEMALE, speedWpm: 110 } })]);
    expect(c).toContain("e-audio-voice-role");
    expect(c).not.toContain("e-audio-voice-drift");
  });

  it("kerstin في إعلان = e-audio-voice-role", () => {
    const c = codes([manifestWith({ id: "ann-x", role: "announcement", voiceParams: { speaker: VOICE_ID_FEMALE, speedWpm: 130 } })]);
    expect(c).toContain("e-audio-voice-role");
  });

  it("kerstin في حوار/شخصية/ضيف = مقبول (لا خطأ صوت)", () => {
    for (const role of FEMALE_ROLES) {
      const c = codes([manifestWith(
        { id: `lena-${role}`, role, characterId: "lena", voiceParams: { speaker: VOICE_ID_FEMALE, speedWpm: 120 } },
        { ...ALL_MALE, lena: VOICE_ID_FEMALE },
      )]);
      expect(c.filter((x) => x.startsWith("e-audio-voice"))).toEqual([]);
    }
  });

  it("صوت شخصية غير مثبَّت في characterVoices = e-audio-voice-drift", () => {
    const c = codes([manifestWith(
      { id: "ok-track", role: "dialogue", voiceParams: { speaker: VOICE_ID, speedWpm: 120 } },
      { ...ALL_MALE, ayse: "de_DE-ramona-low" },
    )]);
    expect(c).toContain("e-audio-voice-drift");
  });
});

describe("D100 — gen-audio: توجيه صادق (kerstin عند وجود ملفه — وإلا fallback معلن)", () => {
  const voiceFor = (who: string) =>
    JSON.parse(execFileSync("python3", [join(process.cwd(), "tools/gen-audio.py"), "voice-for", who], { encoding: "utf8" })) as {
      speaker: string; fallback: boolean;
    };
  const kerstinPresent =
    existsSync(join(process.cwd(), "tools/piper-voices/de_DE-kerstin-low.onnx")) &&
    existsSync(join(process.cwd(), "tools/piper-voices/de_DE-kerstin-low.onnx.json"));

  it("الشخصيات الإناث → kerstin إن وُجد الملف، وإلا الرئيسي مع fallback=true (لا ادعاء)", () => {
    for (const who of ["lena", "ayse", "frau-berg", "frau-schmidt"]) {
      const v = voiceFor(who);
      if (kerstinPresent) expect(v).toMatchObject({ speaker: VOICE_ID_FEMALE, fallback: false });
      else expect(v).toMatchObject({ speaker: VOICE_ID, fallback: true });
    }
  });

  it("الشخصيات الذكور → الصوت الرئيسي دائماً بلا fallback", () => {
    for (const who of ["mueller", "yusuf", "thomas", "dr-weber"]) {
      expect(voiceFor(who)).toMatchObject({ speaker: VOICE_ID, fallback: false });
    }
  });
});

describe("D100 — سكربت Termux لصوت المرأة: القيم الرسمية لا التقدير الخاطئ", () => {
  const script = readFileSync(join(process.cwd(), "termux-upload-voice-kerstin.sh"), "utf8");

  it("الحجم الدقيق + md5 من الفهرس الرسمي (voices.json) للملفات الثلاثة", () => {
    expect(script).toContain("ONNX_SIZE=63104526");
    expect(script).toContain("ONNX_MD5=1d5e5788cfddb04cbb34418f2841931e");
    expect(script).toContain("JSON_SIZE=5952");
    expect(script).toContain("JSON_MD5=952af66f912007b6ec6b065b94072447");
    expect(script).toContain("CARD_SIZE=272");
    expect(script).toContain("CARD_MD5=69ec1bc99fc7e19c9ddcdf712920a6c7");
  });

  it("لا بوابة «~16.8MB» القديمة (كانت سترفض الملف الأصلي) ولا بصمة مختلقة", () => {
    expect(script).not.toMatch(/15000000|18000000/);
    expect(script).not.toContain("847543129bf7babb9f238f9a6803765e110d477c2190ca24398a18b21c86f734");
  });

  it("بطاقة النموذج تُرفع مع الصوت (الترخيص من المصدر نفسه) + رفع بلا force + تنظيف التوكن", () => {
    expect(script).toContain("de_DE-kerstin-low.MODEL_CARD");
    expect(script).not.toMatch(/push\s+(-f|--force)/);
    expect(script).toContain('rm -rf "$WORK"');
  });
});
