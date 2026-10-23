// schemas.test.ts — اختبارات مخططات البيانات | test-schema-* (DoD المعلم 0)
import { describe, it, expect } from "vitest";
import {
  Word, CardTemplate, Lesson, LearnerState, AudioManifest, CurriculumReference,
  GENDER_SHAPE, SCHEMA_VERSION,
} from "../content/schemas/index.js";

const validWord = {
  schemaVersion: SCHEMA_VERSION,
  id: "wohnung",
  de: "Wohnung",
  article: "die",
  gender: "die",
  plural: "Wohnungen",
  pluralRuleNote: "مؤنث -ung → -en (شفرة الجمع)",
  ar: ["شقة"],
  wordClass: "noun",
  phoneticRisks: ["vowel-long-short"],
  grammarRisks: ["needs-ein"],
  kollocation: { de: "eine Wohnung suchen", ar: "يبحث عن شقة", verb: "suchen" },
  chunk: false,
  wordFamily: ["wohnen"],
  sampleSentence: { de: "Ich suche eine Wohnung.", ar: "أبحث عن شقة.", sourceLesson: "a1-u6-d1" },
  level: "A1",
  unit: 6,
  goetheList: ["A1"],
  thema: "Wohnen",
  isFunctionWord: false,
  usedInLessons: ["a1-u6-d1"],
  srsCardTypes: ["production", "comprehension", "gender"],
} as const;

describe("مخطط الكلمة (test-schema-word)", () => {
  it("يقبل كلمة صالحة ويضبط الافتراضات", () => {
    const w = Word.parse(validWord);
    expect(w.gender).toBe("die");
    expect(w.usedInLessons).toContain("a1-u6-d1");
  });

  it("يرفض slug غير صالح", () => {
    expect(() => Word.parse({ ...validWord, id: "Wohnung!" })).toThrow();
  });

  it("يرفض محتوى بلا schemaVersion (قانون 32)", () => {
    const { schemaVersion, ...noVersion } = validWord;
    expect(() => Word.parse(noVersion)).toThrow();
  });

  it("ترميز الجنس المزدوج مكتمل (§15‑هـ)", () => {
    expect(GENDER_SHAPE.der).toBe("triangle");
    expect(GENDER_SHAPE.die).toBe("circle");
    expect(GENDER_SHAPE.das).toBe("square");
  });
});

const validLesson = {
  schemaVersion: SCHEMA_VERSION,
  id: "a1-u3-d2",
  level: "A1",
  unit: 3,
  day: 2,
  kind: "content",
  ziel: { de: "Du kannst Zahlen bis 1000 sagen.", ar: "تستطيع ذكر الأرقام حتى 1000" },
  canDoDaily: ["يذكر السعر والرقم الكبير"],
  warmup: { cardIds: ["wohnung", "tisch"] },
  einstieg: {
    pretestItems: [{ prompt: { de: "Wie sagt man 21?" }, answer: "einundzwanzig", revealNextSession: true }],
    guidedRetrieval: ["Zahlen 1–20"],
  },
  praesentation: {
    wordIds: ["wohnung"],
    grammarArsenalIds: ["ars-zahlen"],
    storySentenceIds: ["story-a1-u3-s2"],
    dualCodingRequired: true,
    riskFlagsShown: ["vowel-long-short"],
  },
  uebung: {
    stations: [
      { type: "choice", items: [{ q: "?", a: "!" }], interleavedWith: [], explanationRequired: true },
      { type: "gap-fill", items: [{ q: "?", a: "!" }], interleavedWith: ["a1-u2-d3"], explanationRequired: true },
      { type: "build-sentence", items: [{ q: "?", a: "!" }], interleavedWith: [], explanationRequired: true },
    ],
    communicativeTask: {
      goal: { de: "Bitte ein Ticket kaufen", ar: "شراء تذكرة" },
      situation: { de: "Am Bahnhof", ar: "في المحطة" },
      successCriteria: ["يستخدم رقماً صحيحاً في جملة"],
    },
  },
  slider: { questionDe: "Wie viel Prozent?", questionAr: "كم تتوقع؟", min: 0, max: 100 },
  quiz: {
    variants: [
      { items: [{ q: "«شكراً»؟", a: "Danke" }, { q: "Ich ___ Yusuf.", a: "heiße" }, { q: "«مرحباً»؟", a: "Hallo", choices: ["Hallo", "Tschüss"] }], passingScore: 0.75 },
      { items: [{ q: "«شكراً»؟", a: "Danke" }, { q: "Ich ___ Yusuf.", a: "heiße" }, { q: "«مرحباً»؟", a: "Hallo", choices: ["Hallo", "Tschüss"] }], passingScore: 0.75 },
      { items: [{ q: "«شكراً»؟", a: "Danke" }, { q: "Ich ___ Yusuf.", a: "heiße" }, { q: "«مرحباً»؟", a: "Hallo", choices: ["Hallo", "Tschüss"] }], passingScore: 0.75 },
    ],
  },
  zusammenfassung: {
    summary: { de: "Zusammenfassung", ar: "ملخص" },
    warningCards: [],
    srsBundleWordIds: ["wohnung"],
  },
  gReferences: { duden: ["https://www.duden.de/"], wiktionary: [], goethe: [] },
  usedArsenalIds: ["ars-zahlen"],
  audioManifestRefs: [],
  imageManifestRefs: [],
  curriculumRef: { netzwerkChapter: "Kapitel 3", goetheWordListOverlap: ["wohnung"] },
} as const;

describe("مخطط الدرس (test-schema-lesson)", () => {
  it("يقبل درساً كاملاً بالتشريح الثمانية", () => {
    const l = Lesson.parse(validLesson);
    expect(l.quiz.variants).toHaveLength(3);
    expect(l.einstieg.pretestItems[0].revealNextSession).toBe(true);
    expect(l.praesentation.dualCodingRequired).toBe(true);
  });

  it("يرفض درساً بـ3 تخمينات (القانون 21: 1–2 فقط)", () => {
    const bad = JSON.parse(JSON.stringify(validLesson));
    bad.einstieg.pretestItems.push({ prompt: { de: "x" }, answer: "y", revealNextSession: true });
    bad.einstieg.pretestItems.push({ prompt: { de: "x" }, answer: "y", revealNextSession: true });
    expect(() => Lesson.parse(bad)).toThrow();
  });

  it("يرفض quiz بأقل من 3 نسخ", () => {
    const bad = JSON.parse(JSON.stringify(validLesson));
    bad.quiz.variants = [bad.quiz.variants[0]];
    expect(() => Lesson.parse(bad)).toThrow();
  });

  it("D117: بند Quiz لا يُصحَّح يُرفض في أي درس — إجابة خارج خياراتها (عيب a1-u2-d6) · بلا إجابة · مفتاح غريب", () => {
    const withItem = (item: unknown) => {
      const l = JSON.parse(JSON.stringify(validLesson));
      l.quiz.variants[2].items[2] = item;
      return l;
    };
    expect(() => Lesson.parse(withItem({ q: "in ___ Mainzer Straße?", choices: ["die", "der"], a: "der (Dativ)" }))).toThrow(
      /الإجابة ليست بين الخيارات/,
    );
    expect(() => Lesson.parse(withItem({ q: "«شكراً»؟" }))).toThrow();
    expect(() => Lesson.parse(withItem({ q: "«شكراً»؟", a: "Danke", hint: "D…" }))).toThrow();
    expect(() => Lesson.parse(withItem({ q: "?", a: "der", choices: ["die", "der"], accept: ["dem"] }))).toThrow(/للإجابة المفتوحة فقط/);
    expect(() => Lesson.parse(withItem({ q: "?", a: "Danke", accept: ["Danke"] }))).toThrow(/يكرر/);
    expect(() => Lesson.parse(withItem({ q: "ترجم: اسمي يوسف", a: "Ich heiße Yusuf.", accept: ["Mein Name ist Yusuf."] }))).not.toThrow();
  });
});

const validState = {
  schemaVersion: SCHEMA_VERSION,
  profile: {
    schemaVersion: SCHEMA_VERSION,
    name: "يوسف",
    createdAt: "2026-10-09",
    level: "A1",
    unit0Shown: ["why-retrieval"],
    streak: { current: 3, freezesUsedThisMonth: 0 },
    calibration: [{ date: "2026-10-09", predicted: 70, actual: 85 }],
  },
  progress: {
    schemaVersion: SCHEMA_VERSION,
    completedLessons: ["a1-u1-d1"],
    availableLessons: ["a1-u1-d2"],
    lockedLessons: ["a1-u1-d3"],
    gateResults: [{
      gateId: "a1-u1-d1-quiz", kind: "lesson-quiz", score: 0.8, passed: true,
      attempts: 1, weakSections: [], date: "2026-10-09",
    }],
    currentUnit: { level: "A1", unit: 1 },
    levelExams: {},
  },
  srsCards: [{
    cardId: "wohnung", due: "2026-10-10", stability: 0, difficulty: 5,
    elapsed_days: 0, scheduled_days: 0, reps: 0, lapses: 0, state: "New", masteryLevel: "L0",
  }],
  sessions: [{
    date: "2026-10-09", dose: "ideal-120", durationMinutes: 120,
    canDoTicks: [{ statement: "يحيي", done: true }],
    wordsNew: 12, wordsPlanned: 12, srsMinutes: 10,
    srsDueRemaining: 0, listeningMinutes: 10, shadowingMinutes: 5,
    readingMinutes: 0,
    reflection: { learned: "الأرقام", tomorrow: "الوقت" },
  }],
  errors: [],
  telemetry: [],
  backup: {},
} as const;

describe("حالة المتعلم (test-schema-state)", () => {
  it("تقبل حالة كاملة", () => {
    const s = LearnerState.parse(validState);
    expect(s.profile.streak.freezesUsedThisMonth).toBe(0);
  });

  it("تمنع أكثر من 3 تجميدات شهرياً (§14)", () => {
    const bad = JSON.parse(JSON.stringify(validState));
    bad.profile.streak.freezesUsedThisMonth = 5;
    expect(() => LearnerState.parse(bad)).toThrow();
  });
});

describe("المانيفستات (test-audio-manifest)", () => {
  it("يقبل مانيفست صوت بصوت شخصية ثابت", () => {
    const m = AudioManifest.parse({
      schemaVersion: SCHEMA_VERSION,
      generator: "piper-tts-local",
      voiceLicense: "CC0",
      characterVoices: {
        yusuf: "de_DE-thorsten-medium", mueller: "de_DE-german-tux-medium",
        lena: "de_DE-thorsten-medium", ayse: "de_DE-thorsten-medium",
        "frau-berg": "de_DE-thorsten-medium", thomas: "de_DE-thorsten-medium",
        "frau-schmidt": "de_DE-thorsten-medium", "dr-weber": "de_DE-thorsten-medium",
      },
      tracks: [{
        id: "a1-u1-d1-dialog-1", file: "a1-u1-d1-dialog-1.opus",
        role: "dialogue", characterId: "yusuf", isGuest: false,
        voiceParams: { speaker: "de_DE-thorsten-medium", speedWpm: 110 },
        textDe: "Hallo! Ich heiße Yusuf.", priority: "P0", lessonRefs: ["a1-u1-d1"],
      }],
    });
    expect(m.tracks[0].isGuest).toBe(false);
    expect(m.generator).toBe("piper-tts-local");
  });
});

describe("المرجع المنهجي (test-curriculum-ref / D15)", () => {
  it("يثبت Netzwerk neu مرجعاً أساسياً بميزانية كلمات", () => {
    const c = CurriculumReference.parse({
      schemaVersion: SCHEMA_VERSION,
      primaryCourse: "Netzwerk neu (Klett)",
      secondaryCourse: "Schritte international neu",
      vocabularyAuthority: "Goethe-Institut word lists",
      levels: {
        A1: { chapters: [{ id: "k1", title: "Hallo", grammarPoints: ["sein"], vocabTopics: ["Begrüßung"], requiresPrevious: [] }], targetWordCount: 700 },
        A2: { chapters: [], targetWordCount: 750 },
        B1: { chapters: [], targetWordCount: 1000 },
        B2: { chapters: [], targetWordCount: 1100 },
      },
    });
    expect(c.primaryCourse).toBe("Netzwerk neu (Klett)");
    expect(c.levels.A1.targetWordCount).toBe(700);
  });
});
