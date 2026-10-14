// tests/audio-scripts.test.ts — D103: السكربت الصوتي + مقسِّم الحوار + الاستماع بصوت حقيقي
import { describe, it, expect, beforeEach } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AudioScript, AudioManifest, Modelltest, A1_LENGTH_SCALE, evidenceIn } from "../content/schemas/index.js";
import {
  ROLE_FOR_KIND, PRIORITY_FOR_KIND, expectedVoice, measuredWpm, buildTrack, planScript,
  checkScriptAgainstManifest, answerSupported, scriptTrackFile, type TrackLike,
} from "../tools/lib/script-audio.js";
import { runSplitter, allScriptFiles, MANIFEST_REL, type Generate } from "../tools/dialogue-splitter.js";
import { validateContentTree, loadContentDir } from "../tools/validate-content.js";
import { VOICE_ID, VOICE_ID_FEMALE } from "../src/lib/audio.js";

const VOICES = {
  yusuf: VOICE_ID, mueller: VOICE_ID, lena: VOICE_ID_FEMALE, ayse: VOICE_ID_FEMALE,
  "frau-berg": VOICE_ID_FEMALE, thomas: VOICE_ID, "frau-schmidt": VOICE_ID_FEMALE, "dr-weber": VOICE_ID,
};
const dialog = (lines: { id: string; speaker: string; text: string }[], extra: Record<string, unknown> = {}) =>
  AudioScript.parse({
    schemaVersion: "1.0.0", id: "t-dialog", kind: "dialogue", level: "A2", title: { de: "T", ar: "ت" },
    usedIn: ["a2-u1-d3"], lines, ...extra,
  });
const M = { durationMs: 2000, sizeBytes: 9000, hash: "sha256:x", pcmSha256: "y", rmsDb: -17 };

describe("D103 — المنطق المشترك (دوال نقية)", () => {
  it("الأدوار والأولويات: حوار/إعلان/رسالة هاتفية = P0 · كلمات = شخصية P2 · الرسالة = شخصية وحدها (D109)", () => {
    expect(ROLE_FOR_KIND).toEqual({ dialogue: "dialogue", announcement: "announcement", words: "character", message: "character" });
    expect(PRIORITY_FOR_KIND).toEqual({ dialogue: "P0", announcement: "P0", words: "P2", message: "P0" });
  });

  it("الصوت الثابت: المذيع = الرئيسي · lena = kerstin · شخصية بلا صوت أو بصوت غير مثبَّت = خطأ", () => {
    expect(expectedVoice("announcer", VOICES)).toBe(VOICE_ID);
    expect(expectedVoice("lena", VOICES)).toBe(VOICE_ID_FEMALE);
    expect(expectedVoice("thomas", VOICES)).toBe(VOICE_ID);
    expect(() => expectedVoice("lena", {})).toThrow();
    expect(() => expectedVoice("lena", { lena: "de_DE-ramona-low" })).toThrow();
  });

  it("السرعة مقيسة من الملف: 10 كلمات في 5 ثوانٍ = 120 ك/د (لا قيمة اسمية)", () => {
    expect(measuredWpm("eins zwei drei vier fünf sechs sieben acht neun zehn.", 5000)).toBe(120);
    expect(measuredWpm("— Hallo! —", 1000)).toBe(60); // الشرطات ليست كلمات
  });

  it("buildTrack: مسار السطر كامل الحقول (الصوت/الدور/الشخصية/الأولوية/الدرس/القياس)", () => {
    const s = dialog([{ id: "t-l1", speaker: "lena", text: "Hallo Thomas!" }, { id: "t-l2", speaker: "thomas", text: "Hallo Lena!" }]);
    const t = buildTrack(s, s.lines[0]!, VOICE_ID_FEMALE, M);
    expect(t).toMatchObject({
      id: "t-l1", file: scriptTrackFile("t-dialog", "t-l1"), role: "dialogue", characterId: "lena",
      voiceParams: { speaker: VOICE_ID_FEMALE, speedWpm: 60, lengthScale: 1 }, priority: "P0",
      lessonRefs: ["a2-u1-d3"], durationMs: 2000, rmsDb: -17,
    });
  });

  it("planScript: لا إعادة توليد لسطر لم يتغير — وأي تغيير (نص/سرعة/صوت/بصمة) يُعيده", () => {
    const s = dialog([{ id: "t-l1", speaker: "lena", text: "Hallo!" }, { id: "t-l2", speaker: "thomas", text: "Tag!" }]);
    const tracks = new Map<string, TrackLike>(s.lines.map((l) => {
      const t = buildTrack(s, l, expectedVoice(l.speaker, VOICES), M);
      return [l.id, t] as const;
    }));
    expect(planScript(s, tracks, VOICES).generate).toEqual([]);
    const changedText = dialog([{ id: "t-l1", speaker: "lena", text: "Hallo, Thomas!" }, { id: "t-l2", speaker: "thomas", text: "Tag!" }]);
    expect(planScript(changedText, tracks, VOICES).generate.map((l) => l.id)).toEqual(["t-l1"]);
    const slower = dialog(s.lines, { lengthScale: 1.2 });
    expect(planScript(slower, tracks, VOICES).generate).toHaveLength(2);
    expect(planScript(s, tracks, { ...VOICES, lena: VOICE_ID }).generate.map((l) => l.id)).toEqual(["t-l1"]);
    expect(planScript(s, tracks, VOICES, (t) => t.id !== "t-l2").generate.map((l) => l.id)).toEqual(["t-l2"]);
  });

  it("answerSupported: الأرقام تُسمع كلماتٍ («8» = acht) — والجواب الغائب يُكشف", () => {
    expect(answerSupported("um 8 Uhr", "Der nächste Zug fährt um acht Uhr.").ok).toBe(true);
    expect(answerSupported("Gleis 3", "Er fährt von Gleis drei.").ok).toBe(true);
    expect(answerSupported("der Kopf", "Nein, nur der Kopf.").ok).toBe(true);
    expect(answerSupported("Wasser", "Ich nehme einen Kaffee.")).toEqual({ ok: false, missing: ["wasser"] });
    expect(answerSupported("von 7 bis 10 Uhr", "von sieben bis elf Uhr").missing).toEqual(["10"]);
  });
});

describe("D103 — قواعد مخطط السكربت", () => {
  const base = { schemaVersion: "1.0.0", id: "x", level: "A2", title: { de: "T", ar: "ت" }, usedIn: ["a2-u1-d1"] };
  it("الإعلان بصوت المذيع فقط · الحوار بمتحدثَين · لا معرّف مكرر · A1 لا يتجاوز 0.85×", () => {
    expect(() => AudioScript.parse({ ...base, kind: "announcement", lines: [{ id: "a", speaker: "lena", text: "Achtung!" }] })).toThrow();
    // D109: الرسالة الهاتفية بصوت شخصية (سطر واحد يكفي) — لا بصوت المذيع
    expect(AudioScript.parse({ ...base, kind: "message", lines: [{ id: "a", speaker: "lena", text: "Hallo, hier ist Lena." }] }).lines).toHaveLength(1);
    expect(() => AudioScript.parse({ ...base, kind: "message", lines: [{ id: "a", speaker: "announcer", text: "Hallo!" }] })).toThrow();
    expect(() => AudioScript.parse({ ...base, kind: "dialogue", lines: [{ id: "a", speaker: "lena", text: "Hallo!" }, { id: "b", speaker: "lena", text: "Tschüss!" }] })).toThrow();
    expect(() => AudioScript.parse({ ...base, kind: "words", lines: [{ id: "a", speaker: "lena", text: "eins" }, { id: "a", speaker: "lena", text: "zwei" }] })).toThrow();
    expect(() => AudioScript.parse({ ...base, kind: "words", level: "A1", lines: [{ id: "a", speaker: "lena", text: "eins" }] })).toThrow();
    expect(AudioScript.parse({ ...base, kind: "words", level: "A1", lengthScale: A1_LENGTH_SCALE, lines: [{ id: "a", speaker: "lena", text: "eins" }] }).lines).toHaveLength(1);
  });
});

describe("D103 — مقسِّم الحوار على شجرة مؤقتة (مولِّد وهمي — بلا Piper)", () => {
  let root: string;
  let calls: string[];
  const fake: Generate = (voice, text, outAbs, ls) => {
    calls.push(`${voice}|${text}|${ls}`);
    mkdirSync(join(outAbs, ".."), { recursive: true });
    writeFileSync(outAbs, `${voice}:${text}`);
    return { ...M, hash: undefined as unknown as string };
  };
  const scriptFile = () => join(root, "audio-scripts/t-dialog.json");
  const writeScript = (lines: { id: string; speaker: string; text: string }[]) =>
    writeFileSync(scriptFile(), JSON.stringify({
      schemaVersion: "1.0.0", id: "t-dialog", kind: "dialogue", level: "A2", title: { de: "T", ar: "ت" },
      usedIn: ["a2-u1-d3"], lines,
    }));

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "splitter-"));
    calls = [];
    mkdirSync(join(root, "manifests"), { recursive: true });
    mkdirSync(join(root, "audio-scripts"), { recursive: true });
    writeFileSync(join(root, MANIFEST_REL), JSON.stringify({
      schemaVersion: "1.0.0", generator: "piper-tts-local", voiceLicense: "CC0", characterVoices: VOICES, tracks: [],
    }, null, 2) + "\n");
    writeScript([{ id: "t-l1", speaker: "lena", text: "Hallo!" }, { id: "t-l2", speaker: "thomas", text: "Tag!" }]);
  });

  it("يولّد كل سطر بصوت متحدثه + يكتب مانيفستاً صالحاً — والتشغيل الثاني لا يولّد شيئاً", () => {
    const r1 = runSplitter({ scriptFiles: [scriptFile()], contentRoot: root, generate: fake });
    expect(r1.generated).toEqual(["t-l1", "t-l2"]);
    expect(calls).toEqual([`${VOICE_ID_FEMALE}|Hallo!|1`, `${VOICE_ID}|Tag!|1`]);
    const m = AudioManifest.parse(JSON.parse(readFileSync(join(root, MANIFEST_REL), "utf8")));
    expect(m.tracks.map((t) => [t.id, t.voiceParams.speaker, t.characterId])).toEqual([
      ["t-l1", VOICE_ID_FEMALE, "lena"], ["t-l2", VOICE_ID, "thomas"],
    ]);
    const r2 = runSplitter({ scriptFiles: [scriptFile()], contentRoot: root, generate: fake });
    expect(r2).toMatchObject({ generated: [], kept: ["t-l1", "t-l2"], written: false });
  });

  it("سطر حُذف من السكربت ← مساره وملفه يُزالان (لا يتامى)", () => {
    runSplitter({ scriptFiles: [scriptFile()], contentRoot: root, generate: fake });
    const f2 = join(root, scriptTrackFile("t-dialog", "t-l2"));
    expect(existsSync(f2)).toBe(true);
    writeScript([{ id: "t-l1", speaker: "lena", text: "Hallo!" }, { id: "t-l3", speaker: "yusuf", text: "Servus!" }]);
    const r = runSplitter({ scriptFiles: [scriptFile()], contentRoot: root, generate: fake });
    expect(r.generated).toEqual(["t-l3"]);
    expect(r.pruned).toEqual(["t-l2"]);
    expect(existsSync(f2)).toBe(false);
    const ids = JSON.parse(readFileSync(join(root, MANIFEST_REL), "utf8")).tracks.map((t: { id: string }) => t.id);
    expect(ids).toEqual(["t-l1", "t-l3"]);
  });

  it("--dry-run لا يكتب شيئاً ولا يولّد", () => {
    const before = readFileSync(join(root, MANIFEST_REL), "utf8");
    const r = runSplitter({ scriptFiles: [scriptFile()], contentRoot: root, generate: fake, dryRun: true });
    expect(r.generated).toHaveLength(2);
    expect(calls).toEqual([]);
    expect(readFileSync(join(root, MANIFEST_REL), "utf8")).toBe(before);
  });

  it("شخصية بلا صوت مثبَّت ← رفض قبل أي كتابة", () => {
    writeFileSync(join(root, MANIFEST_REL), JSON.stringify({
      schemaVersion: "1.0.0", generator: "piper-tts-local", voiceLicense: "CC0", characterVoices: { thomas: VOICE_ID }, tracks: [],
    }));
    const before = readFileSync(join(root, MANIFEST_REL), "utf8");
    expect(() => runSplitter({ scriptFiles: [scriptFile()], contentRoot: root, generate: fake })).toThrow(/lena/);
    expect(readFileSync(join(root, MANIFEST_REL), "utf8")).toBe(before);
  });
});

describe("D103 — قواعد المدقِّق الجديدة تلتقط الأعطال", () => {
  const manifest = (tracks: unknown[]) => ({
    path: "manifests/audio-manifest.t.json",
    data: { schemaVersion: "1.0.0", generator: "piper-tts-local", voiceLicense: "CC0", characterVoices: VOICES, tracks },
  });
  const script = {
    path: "audio-scripts/t-dialog.json",
    data: { schemaVersion: "1.0.0", id: "t-dialog", kind: "dialogue", level: "A2", title: { de: "T", ar: "ت" },
      usedIn: ["mt-x#hoeren-teil1"], lines: [{ id: "t-l1", speaker: "lena", text: "Ich nehme ein Wasser." }, { id: "t-l2", speaker: "thomas", text: "Gern." }] },
  };
  const track = (id: string, speaker: string, characterId: string, textDe: string) => ({
    id, file: `audio/scripts/t-dialog/${id}.opus`, role: "dialogue", characterId, isGuest: false,
    voiceParams: { speaker, speedWpm: 120 }, textDe, priority: "P0", lessonRefs: [],
  });
  const good = [track("t-l1", VOICE_ID_FEMALE, "lena", "Ich nehme ein Wasser."), track("t-l2", VOICE_ID, "thomas", "Gern.")];
  const codes = (entries: { path: string; data: unknown }[]) => validateContentTree(entries).errors.map((e) => e.code);

  it("شجرة سليمة = صفر أخطاء صوت", () => {
    expect(codes([manifest(good), script])).toEqual([]);
  });
  it("صوت الشخصية ≠ صوتها الثابت = e-audio-character-voice", () => {
    expect(codes([manifest([track("t-l1", VOICE_ID, "lena", "Ich nehme ein Wasser."), good[1]]), script])).toContain("e-audio-character-voice");
  });
  it("نص المسار ≠ نص السكربت = e-audio-script-text · سطر بلا مسار = e-audio-script-missing · مسار يتيم = e-audio-script-orphan", () => {
    expect(codes([manifest([track("t-l1", VOICE_ID_FEMALE, "lena", "Ich nehme Kaffee."), good[1]]), script])).toContain("e-audio-script-text");
    expect(codes([manifest([good[0]]), script])).toContain("e-audio-script-missing");
    expect(codes([manifest([...good, track("t-l9", VOICE_ID, "thomas", "x")]), script])).toContain("e-audio-script-orphan");
  });

  const rest = [
    { skill: "lesen", timeBudgetMin: 25, instructions: { de: "x", ar: "س" }, parts: [{ id: "lesen-1", prompt: { de: "x", ar: "س" }, taskType: "richtig-falsch",
      texts: [{ id: "t1", kind: "schild", de: "Montag geschlossen." }],
      items: [{ q: "Am Montag ist offen.", a: "Falsch", choices: ["Richtig", "Falsch"], textRefs: ["t1"], evidence: "Montag geschlossen" }] }] },
    { skill: "schreiben", timeBudgetMin: 20, instructions: { de: "x", ar: "س" }, parts: [{ id: "schreiben-1", prompt: { de: "x", ar: "س" }, taskType: "freies-schreiben", items: [{ q: "q", a: "a" }] }] },
    { skill: "sprechen", timeBudgetMin: 15, instructions: { de: "x", ar: "س" }, parts: [{ id: "sprechen-1", prompt: { de: "x", ar: "س" }, taskType: "freies-sprechen", items: [{ q: "q", a: "a" }] }] },
  ];
  const mt = (items: unknown[], audioScriptRef = "t-dialog", taskType = "mc3") => ({
    path: "modelltest/mt-x.json",
    data: {
      schemaVersion: "1.0.0", id: "mt-x", level: "A1", title: { de: "T", ar: "ت" }, passingScore: 0.6, sourceNote: "s",
      sections: [
        { skill: "hoeren", timeBudgetMin: 20, instructions: { de: "x", ar: "س" }, parts: [{ id: "hoeren-teil1", prompt: { de: "x", ar: "س" }, taskType, playCount: 2, audioScriptRef, items }] },
        ...rest,
      ],
    },
  });
  const ok = { q: "Was trinkt sie?", a: "Wasser", choices: ["Kaffee", "Wasser", "Milch"], audioRefs: ["t-l1", "t-l2"], evidence: "Ich nehme ein Wasser" };
  it("الاستماع: جواب مسموع = مقبول · جواب غير مسموع = e-hoeren-answer · خارج الخيارات = رفض المخطط · سكربت مجهول = e-hoeren-audio", () => {
    expect(codes([manifest(good), script, mt([ok])])).toEqual([]);
    expect(codes([manifest(good), script, mt([{ ...ok, a: "Milch" }])])).toContain("e-hoeren-answer");
    expect(codes([manifest(good), script, mt([{ ...ok, choices: ["Kaffee", "Milch", "Tee"] }])])).toContain("e-schema"); // D109: المخطط نفسه
    expect(codes([manifest(good), script, mt([ok], "ghost-script")])).toContain("e-hoeren-audio");
  });
  it("D109: الدليل منطوق حرفياً في مقاطع البند وإلا e-hoeren-evidence · Richtig/Falsch يُحسم بالدليل لا بسماع «Richtig»", () => {
    expect(codes([manifest(good), script, mt([{ ...ok, evidence: "Ich nehme einen Tee" }])])).toContain("e-hoeren-evidence");
    expect(codes([manifest(good), script, mt([{ ...ok, audioRefs: ["t-l2"] }])])).toContain("e-hoeren-evidence"); // الدليل في سطر آخر
    const rf = { q: "Sie trinkt Wasser.", a: "Richtig", choices: ["Richtig", "Falsch"], audioRefs: ["t-l1"], evidence: "ein Wasser" };
    expect(codes([manifest(good), script, mt([rf], "t-dialog", "richtig-falsch")])).toEqual([]);
  });
  it("سؤال استماع بلا مقطع = مرفوض في المخطط نفسه", () => {
    expect(() => Modelltest.parse(mt([{ q: "Was?", a: "Wasser" }]).data)).toThrow(/بلا مقطع صوتي/);
  });
});

describe("D103 — المحتوى الحقيقي: Hören الامتحان التجريبي بصوت حقيقي بصوتين", () => {
  const content = join(process.cwd(), "content");
  const manifest = JSON.parse(readFileSync(join(content, MANIFEST_REL), "utf8")) as {
    tracks: (TrackLike & { durationMs: number })[]; characterVoices: Record<string, string>;
  };
  const byId = new Map(manifest.tracks.map((t) => [t.id, t] as const));
  const scripts = allScriptFiles(content).map((f) => AudioScript.parse(JSON.parse(readFileSync(f, "utf8"))));

  it("كل سكربت مطابق للمانيفست حرفياً (نص/دور/متحدث/صوت) وكل ملف موجود", () => {
    expect(scripts.length).toBeGreaterThanOrEqual(3);
    for (const s of scripts) {
      expect(checkScriptAgainstManifest(s, byId, manifest.characterVoices)).toEqual([]);
      for (const l of s.lines) expect(existsSync(join(content, scriptTrackFile(s.id, l.id))), l.id).toBe(true);
    }
  });

  it("الشخصيات الإناث بصوت kerstin فعلاً — وحوار واحد على الأقل يجمع الصوتين", () => {
    const female = new Set(["lena", "ayse", "frau-berg", "frau-schmidt"]);
    const lines = scripts.flatMap((s) => s.lines);
    const femaleLines = lines.filter((l) => female.has(l.speaker));
    expect(femaleLines.length).toBeGreaterThanOrEqual(4);
    for (const l of femaleLines) expect(byId.get(l.id)!.voiceParams.speaker).toBe(VOICE_ID_FEMALE);
    const mixed = scripts.filter((s) => new Set(s.lines.map((l) => byId.get(l.id)!.voiceParams.speaker)).size === 2);
    expect(mixed.length).toBeGreaterThanOrEqual(1);
  });

  it("كل سؤال Hören: مقاطعه موجودة ودليله منطوق فيها وجوابه مسموع (عدا Richtig/Falsch) — والمدقِّق على الشجرة الحقيقية صفر أخطاء", () => {
    const t = Modelltest.parse(JSON.parse(readFileSync(join(content, "modelltest/a1-modelltest-1.json"), "utf8")));
    const hoeren = t.sections.find((s) => s.skill === "hoeren")!;
    let items = 0;
    for (const p of hoeren.parts)
      for (const it of p.items) {
        items++;
        const text = it.audioRefs!.map((id) => byId.get(id)!.textDe).join(" ");
        expect(evidenceIn(it.evidence!, text), `${p.id}: ${it.evidence}`).toBe(true);
        if (p.taskType !== "richtig-falsch") expect(answerSupported(it.a, text).ok, `${p.id}: ${it.a}`).toBe(true);
      }
    expect(items).toBe(15); // D109: 6 + 4 + 5 كالصيغة الرسمية (كانت 9)
    const errs = validateContentTree(loadContentDir(content)).errors.filter((e) => /audio|hoeren/.test(e.code));
    expect(errs).toEqual([]);
  });
});
