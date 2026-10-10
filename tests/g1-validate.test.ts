// g1-validate.test.ts — S0.4 | test-g1-validate-pass / test-g1-validate-catch
import { describe, it, expect } from "vitest";
import { validateContentTree, loadContentDir, type ContentEntry } from "../tools/validate-content.js";
import { join } from "node:path";

const sampleLesson = JSON.parse(
  JSON.stringify({
    schemaVersion: "1.0.0",
    id: "a1-u4-d4",
    level: "A1",
    unit: 4,
    day: 4,
    kind: "content",
    ziel: { de: "Du kannst deine Familie beschreiben.", ar: "تصف أسرتك" },
    canDoDaily: ["يصف صورة أسرية"],
    warmup: { cardIds: ["wohnung", "tisch"] },
    einstieg: {
      pretestItems: [{ prompt: { de: "x" }, answer: "y", revealNextSession: true }],
      guidedRetrieval: [],
    },
    praesentation: {
      wordIds: ["wohnung"],
      grammarArsenalIds: [],
      storySentenceIds: [],
      dualCodingRequired: true,
      riskFlagsShown: [],
    },
    uebung: {
      stations: [
        { type: "choice", items: [{ q: 1 }], interleavedWith: ["a1-u2-d3"], explanationRequired: true },
        { type: "gap-fill", items: [{ q: 1 }], interleavedWith: ["a1-u1-d5"], explanationRequired: true },
        { type: "match", items: [{ q: 1 }], interleavedWith: ["a1-u3-d2"], explanationRequired: true },
      ],
      communicativeTask: {
        goal: { de: "Familie vorstellen", ar: "تقديم الأسرة" },
        situation: { de: "Bei der Arbeit", ar: "في العمل" },
        successCriteria: ["يستخدم Akkusativ"],
      },
    },
    slider: { questionDe: "?", questionAr: "؟", min: 0, max: 100 },
    quiz: {
      variants: [
        { items: [{ q: 1 }, { q: 2 }, { q: 3 }], passingScore: 0.75 },
        { items: [{ q: 1 }, { q: 2 }, { q: 3 }], passingScore: 0.75 },
        { items: [{ q: 1 }, { q: 2 }, { q: 3 }], passingScore: 0.75 },
      ],
    },
    zusammenfassung: { summary: { de: "s", ar: "ص" }, warningCards: [], srsBundleWordIds: ["wohnung"] },
    gReferences: { duden: ["https://www.duden.de/"], wiktionary: [], goethe: [] },
    usedArsenalIds: [],
    audioManifestRefs: [],
    imageManifestRefs: [],
    curriculumRef: { netzwerkChapter: "Netzwerk neu A1 – Kapitel 4", goetheWordListOverlap: [] },
  }),
);

const sampleWord = {
  schemaVersion: "1.0.0",
  id: "wohnung",
  de: "Wohnung",
  article: "die",
  gender: "die",
  plural: "Wohnungen",
  ar: ["شقة"],
  wordClass: "noun",
  phoneticRisks: [],
  grammarRisks: [],
  chunk: false,
  wordFamily: [],
  level: "A1",
  unit: 3,
  goetheList: ["A1"],
  thema: "Wohnen",
  isFunctionWord: false,
  usedInLessons: ["a1-u4-d4"],
  srsCardTypes: ["production", "comprehension", "gender"],
};

describe("G1 — validateContentTree (test-g1-validate-pass/catch)", () => {
  it("pass: شجرة صالحة = أخطاء صفر", () => {
    const report = validateContentTree([
      { path: "words/wohnung.json", data: sampleWord },
      { path: "lessons/a1/a1-u4-d4.json", data: sampleLesson },
    ]);
    expect(report.errors).toEqual([]);
  });

  it("catch: كلمة ذات جنس بلا بطاقة gender", () => {
    const badWord = { ...sampleWord, srsCardTypes: ["production"] };
    const report = validateContentTree([
      { path: "words/wohnung.json", data: badWord },
      { path: "lessons/a1/a1-u4-d4.json", data: sampleLesson },
    ]);
    expect(report.errors.some((e) => e.code === "e-gender-card")).toBe(true);
  });

  it("catch: article لا يطابق gender", () => {
    const badWord = { ...sampleWord, article: "das" };
    const report = validateContentTree([{ path: "words/wohnung.json", data: badWord }]);
    expect(report.errors.some((e) => e.code === "e-article-gender")).toBe(true);
  });

  it("catch: درس A1 من اليوم 3+ بلا Interleaving", () => {
    const badLesson = JSON.parse(JSON.stringify(sampleLesson));
    for (const s of badLesson.uebung.stations) s.interleavedWith = [];
    const report = validateContentTree([
      { path: "words/wohnung.json", data: sampleWord },
      { path: "lessons/a1/a1-u4-d4.json", data: badLesson },
    ]);
    expect(report.errors.some((e) => e.code === "e-interleaving")).toBe(true);
  });

  it("catch: درس بلا روابط G2 موثقة", () => {
    const badLesson = JSON.parse(JSON.stringify(sampleLesson));
    badLesson.gReferences = { duden: [], wiktionary: [], goethe: [] };
    const report = validateContentTree([
      { path: "words/wohnung.json", data: sampleWord },
      { path: "lessons/a1/a1-u4-d4.json", data: badLesson },
    ]);
    expect(report.errors.some((e) => e.code === "e-g2-refs")).toBe(true);
  });

  it("catch: فهرس الاستخدام العكسي مكسور (usedInLessons لا تضم المستهلك)", () => {
    const badWord = { ...sampleWord, usedInLessons: [] };
    const report = validateContentTree([
      { path: "words/wohnung.json", data: badWord },
      { path: "lessons/a1/a1-u4-d4.json", data: sampleLesson },
    ]);
    expect(report.errors.some((e) => e.code === "e-reverse-index")).toBe(true);
  });

  it("catch: منطقة تحدٍّ بوسم خاطئ", () => {
    const badLesson = JSON.parse(JSON.stringify(sampleLesson));
    badLesson.challengeZone = { grammarRef: "x", items: [{ q: 1 }], badge: "تحدي!" };
    const report = validateContentTree([
      { path: "words/wohnung.json", data: sampleWord },
      { path: "lessons/a1/a1-u4-d4.json", data: badLesson },
    ]);
    expect(report.errors.some((e) => e.code === "e-schema" || e.code === "e-challenge-badge")).toBe(true);
  });

  it("catch: مرجع صوتي مفقود من المانيفست", () => {
    const badLesson = { ...JSON.parse(JSON.stringify(sampleLesson)), audioManifestRefs: ["ghost-track"] };
    const report = validateContentTree([
      {
        path: "manifests/audio-manifest.json",
        data: {
          schemaVersion: "1.0.0",
          generator: "piper-tts-local",
          voiceLicense: "CC0",
          characterVoices: {
            yusuf: "de_DE-thorsten-medium", mueller: "de_DE-thorsten-medium",
            lena: "de_DE-thorsten-medium", ayse: "de_DE-thorsten-medium",
            "frau-berg": "de_DE-thorsten-medium", thomas: "de_DE-thorsten-medium",
            "frau-schmidt": "de_DE-thorsten-medium", "dr-weber": "de_DE-thorsten-medium",
          },
          tracks: [],
        },
      },
      { path: "words/wohnung.json", data: sampleWord },
      { path: "lessons/a1/a1-u4-d4.json", data: badLesson },
    ]);
    expect(report.errors.some((e) => e.code === "e-audio-missing")).toBe(true);
  });
});

describe("G1 — content tree الحقيقي (test-g1-content-dir)", () => {
  it("شجرة /content الفعلية في الـrepo تمر بلا أخطاء", () => {
    const entries: ContentEntry[] = loadContentDir(join(process.cwd(), "content"));
    const report = validateContentTree(entries);
    if (report.errors.length > 0) console.error(report.errors);
    expect(report.errors).toEqual([]);
    expect(report.fileCount).toBeGreaterThan(0);
  });
});
