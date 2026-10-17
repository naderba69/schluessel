// tests/lesson-upgrade.test.ts — حارس ترقية الدروس (D114 → D115 · رمز اللاحقة D127 · رمز الحرف والفجوة والخطأ المعلن D128)
// ضابط إيجابي: درس مُرقّى كامل (من كلمات a1-u1-d1 الحقيقية) = صفر مشكلة.
// ضوابط سلبية: كل معيار يُكسر وحده فيظهر رمزه بالضبط — «done» لا يمر بالكلام.
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import {
  GrammarRuleFile, LessonUpgradeEntry, LessonUpgradePlan, ShufraPayload, type Lesson,
} from "../content/schemas/index.js";
import { loadAudioTracks, loadGrammarRules, loadLessons, loadUpgradePlans, loadWords } from "../tools/lib/content-disk.js";
import {
  MISSPELLING_DISTANCE_MAX, checkGrammarRules, checkUpgrade, editDistance, fillInWordGap, frontViolations, germanOnly, inspectLesson,
  itemTexts, taughtUpTo, wordAppears, type UpgradeContext,
} from "../tools/lib/lesson-upgrade.js";
import {
  CLOSED, COMPOUND_NUMBER, DA_COMPOUND, DA_COMPOUND_ANCHOR, GRAPHEMES, HUNDREDS_NUMBER, ORDINAL_ANCHOR, ORDINAL_NUMBER, compoundNumberKnown, contentTokens, daCompoundKnown, deumlaut, knownForms, knownStems, numberWordKnown, ordinalKnown,
} from "../tools/lib/vocab-forms.js";

const CONTENT = join(__dirname, "..", "content");
const words = loadWords(CONTENT);
const realLessons = loadLessons(CONTENT);
const tracks = loadAudioTracks(CONTENT);
const real = realLessons.find((l) => l.id === "a1-u1-d1")!;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

const WHY = "شرح تفسيري بالعربية يوضح السبب";
const RULE_ID = "ars-test-sein";

/** درس u1-d1 مُرقّى بالكامل — كلماته السبع عشرة وحدها + الكلمات المغلقة + أسماء علم معلنة (ضابط مستقل عن محتواه الحقيقي) */
function upgraded(): Lesson {
  const l = clone(real);
  l.praesentation.grammarArsenalIds = [RULE_ID];
  l.usedArsenalIds = [RULE_ID];
  l.uebung.stations = [
    {
      type: "listening", interleavedWith: [], explanationRequired: true,
      items: [
        { audioId: "word-guten-morgen", speakText: "Guten Morgen.", q: "ماذا سمعت؟", choices: ["Guten Morgen", "Guten Abend"], a: "Guten Morgen", why: WHY },
        { audioId: "word-guten-abend", speakText: "Guten Abend.", q: "ماذا سمعت؟", choices: ["Guten Tag", "Guten Abend"], a: "Guten Abend", why: WHY },
        { audioId: "word-auf-wiedersehen", speakText: "Auf Wiedersehen.", q: "ماذا سمعت؟", choices: ["Auf Wiedersehen", "Tschüss"], a: "Auf Wiedersehen", why: WHY },
      ],
    },
    {
      type: "dictation", interleavedWith: [], explanationRequired: true,
      items: [
        { audioId: "word-tschuess", speakText: "Tschüss.", a: "Tschüss", why: WHY },
        { audioId: "word-danke", speakText: "Danke.", a: "Danke", why: WHY },
        { audioId: "word-deutschland", speakText: "Deutschland.", a: "Deutschland", why: WHY },
      ],
    },
    {
      type: "gap-fill", interleavedWith: [], explanationRequired: true,
      items: [
        { q: "Ich ___ Yusuf.", a: "heiße", why: WHY },
        { q: "Ich ___ aus Tunesien.", a: "komme", why: WHY },
        { q: "Ich ___ in Deutschland.", a: "wohne", why: WHY },
      ],
    },
    {
      type: "build-sentence", interleavedWith: [], explanationRequired: true,
      items: [
        { tokens: ["Yusuf.", "heiße", "Ich"], a: "Ich heiße Yusuf.", why: WHY },
        { tokens: ["wie", "Hallo,", "geht's?"], a: "Hallo, wie geht's?", why: WHY },
        { tokens: ["in", "Lena", "Deutschland.", "wohnt"], a: "Lena wohnt in Deutschland.", why: WHY },
      ],
    },
  ];
  const quiz = (tag: string) => [
    { q: `Hallo = ? (${tag})`, choices: ["مرحبا", "وداعا"], a: "مرحبا" },
    { q: `Ich ___ Yusuf. (${tag})`, a: "heiße" },
    { q: `Danke! — ? (${tag})`, choices: ["Bitte!", "Hallo!"], a: "Bitte!", why: WHY },
    { q: `Deutsch = ? (${tag})`, choices: ["الألمانية", "تونس"], a: "الألمانية" },
    { q: `Ich komme ___ Tunesien. (${tag})`, a: "aus" },
    { q: `Guten Tag = ? (${tag})`, choices: ["طاب يومك", "تصبح على خير"], a: "طاب يومك" },
    { q: `Du bist ___. (${tag})`, a: "neu" },
    { q: `«بكم؟» (${tag})`, choices: ["Wie viel?", "Wie geht's?"], a: "Wie viel?" },
  ];
  l.quiz.variants = [
    { items: quiz("أ"), passingScore: 0.75 },
    { items: quiz("ب"), passingScore: 0.75 },
    { items: quiz("ج"), passingScore: 0.75 },
  ];
  // بطاقة المصيدة الأولى الحقيقية تحمل «hier» (تُعلَّم في u2-d1) — تُصاغ في الضابط بكلمات الدرس
  l.zusammenfassung.warningCards[0]!.exercise = { q: "صحّح: ~~Ich Yusuf~~", a: "Ich heiße Yusuf." };
  return l;
}

const rule = (over: Partial<GrammarRuleFile["payload"]> = {}, usedInLessons = ["a1-u1-d1"]): GrammarRuleFile =>
  GrammarRuleFile.parse({
    schemaVersion: "1.0.0", id: RULE_ID, kind: "shufra", constitutionSection: "10‑ي",
    title: { de: "sein", ar: "فعل الكينونة" }, levelIntroduced: "A1", usedInLessons,
    payload: {
      topicAr: "الفعل sein", sceneAr: "يوسف يعرّف بنفسه",
      examples: [
        { de: "Ich bin Yusuf.", ar: "أنا يوسف." },
        { de: "Du bist aus Deutschland.", ar: "أنت من ألمانيا." },
        { de: "Lena ist aus Tunesien.", ar: "لينا من تونس." },
      ],
      inferencePromptAr: "ما الكلمة بعد الضمير؟", ruleDe: "ich bin · du bist · er/sie ist · Sie sind",
      ruleAr: "الجملة تحتاج فعلاً", contrastAr: "العربية تحذف الرابط (خريطة التداخل 10‑ي)",
      beads: ["Ich", "bin", "aus", "Tunesien."], properNouns: ["Yusuf", "Lena"],
      ...over,
    },
  });

function ctxWith(lesson: Lesson, rules: GrammarRuleFile[] = [rule()], ws = words): UpgradeContext {
  return {
    lessons: [lesson, ...realLessons.filter((l) => l.id !== lesson.id)],
    words: ws, tracks, rules: new Map(rules.map((r) => [r.id, r])),
  };
}

const entry = (over: Partial<LessonUpgradeEntry> = {}): LessonUpgradeEntry => ({
  lessonId: "a1-u1-d1", rule: "done", practice: "done", quiz: "done", properNouns: ["Yusuf", "Lena", "Tunis"], misspellings: [], ...over,
});
/** خطة بدرس واحد — النطاق يحصرها في درس u1-d1 (بقية دروس الوحدة 1 خارج الاكتمال بنطاق اليوم الأول) */
const planWith = (e: LessonUpgradeEntry[], scope = { fromUnit: 1, toUnit: 12 }) =>
  LessonUpgradePlan.parse({
    schemaVersion: "1.0.0", id: "t-upgrade", level: "A1", decision: "D114",
    title: { de: "T", ar: "ت" }, report: "docs/reports/lesson-explanations-audit.md", scope, lessons: e,
  });
/** مشاكل الدرس u1-d1 فقط (الاكتمال يُختبر وحده) */
const lessonIssues = (lesson: Lesson, e = entry(), rules?: GrammarRuleFile[], ws = words) =>
  checkUpgrade(planWith([e]), ctxWith(lesson, rules, ws)).filter((i) => i.code !== "e-upgrade-complete");
const codes = (lesson: Lesson, e = entry(), rules?: GrammarRuleFile[], ws = words) => lessonIssues(lesson, e, rules, ws).map((i) => i.code);
const legacy = realLessons.find((l) => l.id === "a1-u11-d2")!; // المثال غير المُرقّى ينتقل كل دفعة؛ بعد D171 صارت الوحدات 1–10 (d1..d5) وu11-d1 مُرقّاة (d6 توليف خارج المرور — N-004)

describe("D115 — الضابط الإيجابي", () => {
  it("درس مُرقّى كامل + قاعدة صالحة = صفر مشكلة (ولا تنبيه)", () => {
    expect(lessonIssues(upgraded())).toEqual([]);
    expect(checkGrammarRules(ctxWith(upgraded()))).toEqual([]);
  });

  it("التعليمات العربية خارج القفل · الكلمات المغلقة معروفة · أسماء العلم بالإعلان فقط", () => {
    expect(germanOnly("«مرحبا» = Hallo")).not.toMatch(/[\u0600-\u06FF]/);
    expect(codes(upgraded(), entry({ properNouns: ["Yusuf", "Tunis"] }))).toContain("e-upgrade-front"); // Lena غير معلنة
  });
});

describe("D127 — رمز اللاحقة ليس كلمة (قانون الجبهة)", () => {
  const none = new Set<string>();
  it("اللاحقة بشرطة أولها من القائمة المغلقة تسقط من الفحص — بالشرطة غير المنكسرة أو العادية، ولو التصقت بالعربية", () => {
    expect(frontViolations(["‑ung · ‑heit · ‑keit · ‑schaft · ‑in → die · ‑chen · ‑um → das · ‑ling · ‑er → der"], none, none)).toEqual([]);
    expect(frontViolations(["نهاية ‑ung تعني die · وبـ‑chen تصير das", "-ung/-heit/-keit"], none, none)).toEqual([]);
  });
  it("الشرطة داخل كلمة ليست رمزاً · ورمز خارج القائمة أو بحرف كبير يبقى مخالفة (لا باب خلفياً)", () => {
    expect(frontViolations(["E-Mail"], none, none)).toEqual(["mail"]);
    expect(frontViolations(["Zeit‑ung"], none, none)).toEqual(["ung", "zeit"]);
    expect(frontViolations(["‑Mail · ‑battle · ‑Ung"], none, none)).toEqual(["battle", "mail", "ung"]);
  });
});

describe("D128 — رمز الحرف · الفجوة داخل الكلمة · الخطأ المقصود المعلن (قانون الجبهة)", () => {
  const none = new Set<string>();
  const u2d4 = realLessons.find((l) => l.id === "a1-u2-d4")!;
  const stems = knownStems(taughtUpTo(u2d4, realLessons, words));
  it("رمز الحرف من القائمة المغلقة يسقط — حرفان صغيران منفصلان، ولو التصقا بالعربية", () => {
    expect(frontViolations(["ß أم ss؟ · ff · mm · ll · ck · tz · oo · ee · aa · ie", "بعد ss · وبـss · (oo)"], none, none)).toEqual([]);
  });
  it("لا باب خلفياً: الرمز داخل كلمة · بحرف كبير · أطول · أو خارج القائمة (ei · au · ah · oh · uu) يبقى مخالفة", () => {
    expect(frontViolations(["Kasse"], none, none)).toEqual(["kasse"]);
    expect(frontViolations(["SS · Ss · sss · ei · au · ah · oh · uu"], none, none)).toEqual(["ah", "au", "ei", "oh", "ss", "sss", "uu"]);
    // القائمة لا تطابق صيغة أي كلمة في المقرر ولا كلمة مغلقة — وei خارجها عمداً لأنها كلمة (das Ei في a1-u5-d1)
    const forms = new Set(words.flatMap((w) => knownForms(w)));
    expect([...GRAPHEMES].filter((g) => forms.has(g) || CLOSED.has(g))).toEqual([]);
    expect(forms.has("ei")).toBe(true);
  });
  it("الفجوة داخل الكلمة تُملأ بإجابتها: تُفحص الكلمة كاملة لا شظاياها — ولا إعفاء لها", () => {
    expect(fillInWordGap("الشارع: die Stra___e (ß أم ss؟)", "ß")).toBe("الشارع: die Straße (ß أم ss؟)");
    expect(fillInWordGap("Ich ___ Yusuf.", "heiße")).toBe("Ich ___ Yusuf."); // فجوة كلمة كاملة: لا تغيير
    expect(fillInWordGap("Kaf__ · B__t", "ff")).toBe("Kaf__ · B__t"); // فجوتان: لا ملء — بند لكل فجوة
    expect(itemTexts({ q: "Stra___e", a: "ß", why: "شرح" })).toEqual(["Straße", "ß"]);
    expect(frontViolations(itemTexts({ q: "die Stra___e", a: "ß" }), stems, none)).toEqual([]);
    expect(frontViolations(itemTexts({ q: "die Su___e", a: "pp" }), stems, none)).toEqual(["suppe"]);
    expect(frontViolations(["أكمل الكتابة: Kaf__ · B__t · g__en"], stems, none)).toEqual(["en", "kaf"]); // تمرين البطاقة الأصلي
  });
  it("الخطأ المعلن يسقط داخل ~~ وحدها — وما سواه داخل الشطب يُفحص، وخارجه يبقى مخالفة", () => {
    const wrong = new Set(["strasse", "heisse"]);
    expect(frontViolations(["صحّح: ~~die Strasse~~"], stems, none, wrong)).toEqual([]);
    expect(frontViolations(["صحّح: ~~die heisse Suppe~~"], stems, none, wrong)).toEqual(["suppe"]); // تمرين البطاقة الأصلي
    expect(frontViolations(["die Strasse"], stems, none, wrong)).toEqual(["strasse"]);
    expect(frontViolations(["~~die Strasse~~"], stems, none)).toEqual(["strasse"]); // بلا إعلان
  });
  it("قياس D128: الأقرب آلياً يقبل كلمات حقيقية (Brot ← Boot = 1) ⇒ الإعلان صريح ومفحوص — المسافة وحدها لا تكفي", () => {
    expect(editDistance("strasse", "straße")).toBe(2);
    expect(editDistance("wei", "wie")).toBe(1); // تبديل حرفين متجاورين
    expect(editDistance("brot", "boot")).toBe(1);
    expect(MISSPELLING_DISTANCE_MAX).toBe(2);
  });
  it("الإعلان نفسه يُفحص → e-upgrade-misspelling (تصحيح غير مدروس · كلمة حقيقية · يعرفها الحارس · بعيد · مكرر) · وغير المستعمل → w-upgrade-misspelling", () => {
    const fixture = upgraded();
    fixture.zusammenfassung.warningCards[0]!.exercise = { q: "صحّح: ~~Halo~~", a: "Hallo" };
    const halo = { wrong: "Halo", right: "Hallo" };
    expect(codes(fixture, entry({ misspellings: [halo] }))).toEqual([]);
    expect(codes(fixture)).toContain("e-upgrade-front"); // بلا إعلان: halo غير مدروسة
    const errs = (extra: { wrong: string; right: string }[]) =>
      lessonIssues(fixture, entry({ misspellings: [halo, ...extra] })).filter((i) => i.code === "e-upgrade-misspelling").map((i) => i.message);
    const brot = errs([{ wrong: "Brot", right: "Boot" }]);
    expect(brot.join("\n")).toMatch(/التصحيح غير مدروس/); // Boot لا تُدرَّس قبل u2-d4
    expect(brot.join("\n")).toMatch(/«Brot» كلمة حقيقية/);
    expect(errs([{ wrong: "Hallos", right: "Hallo" }]).join("\n")).toMatch(/الحارس يعرف «Hallos»/);
    expect(errs([{ wrong: "Hollay", right: "Hallo" }]).join("\n")).toMatch(/مسافة التحرير 3 > 2/);
    expect(errs([halo]).join("\n")).toMatch(/معلن مرتين/);
    expect(codes(upgraded(), entry({ misspellings: [halo] }))).toEqual(["w-upgrade-misspelling"]); // معلن ولا يظهر مشطوباً
  });
  it("المخطط: الخطأ كلمة واحدة من حرفين فأكثر · لا يساوي تصحيحه · لا مفتاح غريب", () => {
    const base = { lessonId: "a1-u1-d1", rule: "done", practice: "done", quiz: "done" };
    expect(LessonUpgradeEntry.safeParse({ ...base, misspellings: [{ wrong: "Strasse", right: "Straße" }] }).success).toBe(true);
    expect(LessonUpgradeEntry.parse(base).misspellings).toEqual([]);
    for (const bad of [{ wrong: "Hallo", right: "hallo" }, { wrong: "die Strasse", right: "Straße" }, { wrong: "x", right: "Straße" }, { wrong: "Strasse", right: "Straße", note: "x" }])
      expect(LessonUpgradeEntry.safeParse({ ...base, misspellings: [bad] }).success, JSON.stringify(bad)).toBe(false);
  });
});

describe("D131 — العدد المركّب 21–99 (قانون الجبهة)", () => {
  const none = new Set<string>();
  const at = (id: string) => knownStems(taughtUpTo(realLessons.find((l) => l.id === id)!, realLessons, words));
  it("معروفٌ إن كانت عشراته مدروسة حتى الدرس: في a1-u3-d1 نعم — وقبله لا، ولو كانت zwanzig مغلقة منذ D121", () => {
    const u3d1 = at("a1-u3-d1");
    expect(frontViolations(["einundzwanzig · Zweiunddreißig · fünfundvierzig · siebenundsechzig · neunundneunzig"], u3d1, none)).toEqual([]);
    expect(compoundNumberKnown("sechsunddreißig", u3d1)).toBe(true);
    const u2d5 = at("a1-u2-d5");
    expect(CLOSED.has("zwanzig")).toBe(true);
    expect(frontViolations(["einundzwanzig · fünfunddreißig"], u2d5, none)).toEqual(["einundzwanzig", "fünfunddreißig"]);
  });
  it("لا باب خلفياً: eins قبل und · آحاد مقصوصة · ترتيب مقلوب · عشرات ليست من القائمة · مئات — كلها غير معروفة", () => {
    const u3d1 = at("a1-u3-d1");
    expect(frontViolations(["einsundzwanzig · sechundzwanzig · siebundzwanzig · zwanzigeins · zwanzigundeins · einundzehn · einundhundert · zweihundert · fooundzwanzig"], u3d1, none))
      .toEqual(["einsundzwanzig", "einundhundert", "einundzehn", "fooundzwanzig", "sechundzwanzig", "siebundzwanzig", "zwanzigeins", "zwanzigundeins", "zweihundert"]);
    expect(COMPOUND_NUMBER.test("einsundzwanzig")).toBe(false);
  });
  it("الصيغ الاثنتان والسبعون كلها تطابق — ولا تطابق أيٌّ منها صيغة كلمة في المقرر (لا ازدواج مع المدخلات)", () => {
    const units = ["ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
    const tens = ["zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];
    const all = tens.flatMap((t) => units.map((u) => `${u}und${t}`));
    expect(all).toHaveLength(72);
    expect(all.every((w) => COMPOUND_NUMBER.test(w))).toBe(true);
    const forms = new Set(words.flatMap((w) => knownForms(w)));
    expect(all.filter((w) => forms.has(w))).toEqual([]);
  });
});

describe("D132 — الأعداد من 100 إلى 1000 (قانون الجبهة)", () => {
  const none = new Set<string>();
  const at = (id: string) => knownStems(taughtUpTo(realLessons.find((l) => l.id === id)!, realLessons, words));
  it("المئات وما بعدها معروفة من الدرس الذي يُدرِّس tausend (a1-u3-d2) — لا قبله ولو كانت hundert مغلقة منذ D121", () => {
    const u3d2 = at("a1-u3-d2");
    expect(frontViolations(["zweihundert · einhundert · hunderteins · hundertzwanzig · dreihundertfünfundsechzig · Neunhundertneunundneunzig · eintausend"], u3d2, none)).toEqual([]);
    expect(numberWordKnown("hunderteinundzwanzig", u3d2)).toBe(true);
    const u3d1 = at("a1-u3-d1");
    expect(CLOSED.has("hundert")).toBe(true);
    expect(frontViolations(["zweihundert · hunderteins"], u3d1, none)).toEqual(["hunderteins", "zweihundert"]);
  });
  it("الباقي بعد المئات يتبع قاعدته: عشراته مدروسة — ولا باب خلفياً (hundertein · hundertundeins · zweitausend · neunzehnhundert · eins قبل und)", () => {
    const u3d2 = at("a1-u3-d2");
    expect(frontViolations(["hundertein · hundertundeins · zweitausend · neunzehnhundert · hunderteinsundzwanzig · einsundzwanzighundert · hundertzwanzigeins"], u3d2, none))
      .toEqual(["einsundzwanzighundert", "hundertein", "hunderteinsundzwanzig", "hundertundeins", "hundertzwanzigeins", "neunzehnhundert", "zweitausend"]);
    // العشرات بعد المئات تحتاج درسها: بجذوع درس بلا sechzig لا تُعرف «dreihundertsechzig»
    const noSechzig = new Set([...u3d2].filter((x) => !x.startsWith("sechzig")));
    expect(numberWordKnown("dreihundertsechzig", noSechzig)).toBe(false);
    expect(numberWordKnown("dreihundertsechzig", u3d2)).toBe(true);
  });
  it("الصيغ كلها من 100 إلى 999 (ألف صيغة: hundert… وeinhundert… · بلا und بعد المئات) تطابق — ولا تطابق أيٌّ منها صيغة كلمة في المقرر", () => {
    const units = ["", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
    const below20 = ["", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
    const tens = ["zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];
    const rests = [...below20, ...tens, ...tens.flatMap((t) => units.slice(1).map((u) => `${u}und${t}`))];
    expect(rests).toHaveLength(100);
    const all = units.slice(1).flatMap((h) => rests.map((r) => `${h}hundert${r}`)).concat(rests.map((r) => `hundert${r}`));
    expect(all).toHaveLength(1000);
    expect(all.every((w) => HUNDREDS_NUMBER.test(w))).toBe(true);
    const forms = new Set(words.flatMap((w) => knownForms(w)));
    expect(all.filter((w) => w !== "hundert" && forms.has(w))).toEqual([]);
  });
});

describe("D167 — العدد الترتيبي بالقاعدة (قانون الجبهة): الأصلي + ‑t/‑st + نهاية الصفة من درس das Datum", () => {
  const none = new Set<string>();
  const at = (id: string) => knownStems(taughtUpTo(realLessons.find((l) => l.id === id)!, realLessons, words));
  const FORMS = ["erste", "zweite", "dritte", "siebte", "achte", "zwölfte", "dreizehnte", "neunzehnte", "zwanzigste", "einunddreißigste", "hundertste", "ersten", "zwölften", "achtzehnten", "dritter", "zweites", "siebtem"];
  it("معروفةٌ من الدرس الذي يُدرِّس das Datum (a1-u10-d2) — لا قبله ولو كانت الأعداد الأصلية كلها مدروسة", () => {
    const u10d2 = at("a1-u10-d2");
    expect(u10d2.has(ORDINAL_ANCHOR)).toBe(true);
    expect(frontViolations([FORMS.join(" · ")], u10d2, none)).toEqual([]);
    expect(ordinalKnown("zwölften", u10d2)).toBe(true);
    const u10d1 = at("a1-u10-d1");
    expect(u10d1.has("dreißig")).toBe(true);
    // achte وحدها تمرّ قبله من جذع كلمة مدروسة (تقدير الجذوع المعلن — لا من الترتيبي)
    expect(frontViolations([FORMS.join(" · ")], u10d1, none)).toEqual(FORMS.filter((f) => f !== "achte").sort());
  });
  it("العشرات والمئات داخل الترتيبي تتبع قاعدتها: zwanzigste بلا درس العشرات لا · fünfzigste تحتاج fünfzig · hundertste تحتاج tausend", () => {
    const base = new Set([ORDINAL_ANCHOR]);
    expect(ordinalKnown("zwölfte", base)).toBe(true);
    expect(ordinalKnown("zwanzigste", base)).toBe(false);
    expect(ordinalKnown("zwanzigste", new Set([ORDINAL_ANCHOR, "zwanzig"]))).toBe(true);
    expect(ordinalKnown("fünfundzwanzigste", new Set([ORDINAL_ANCHOR, "zwanzig"]))).toBe(true);
    expect(ordinalKnown("hundertste", new Set([ORDINAL_ANCHOR, "zwanzig"]))).toBe(false);
    expect(ordinalKnown("hundertste", new Set([ORDINAL_ANCHOR, "tausend"]))).toBe(true);
  });
  it("لا باب خلفياً: الأصلي بلا ‑t (zwölfe) · ‑t بلا نهاية (zwölft) · الشواذ بصيغتها الخاطئة (dreite · siebente · einste) · ‑te بعد العشرات (zwanzigte) · كلمات تشبهها (achtung · erstens)", () => {
    const u10d2 = at("a1-u10-d2");
    const probe = ["zwölfe", "zwölft", "dreite", "siebente", "einste", "zwanzigte", "zweitens", "ersteklasse", "achtundste", "zehnste"];
    expect(probe.filter((p) => ORDINAL_NUMBER.test(p))).toEqual([]);
    expect(frontViolations([probe.join(" · ")], u10d2, none).length).toBeGreaterThan(0);
  });
  it("الصيغ بالقاعدة لا بمدخل: لا كلمة ترتيبية في ملفات الكلمات — وzuerst (u9-d3) ليست ترتيبياً", () => {
    const forms = new Set(words.flatMap((w) => knownForms(w)));
    expect(FORMS.filter((f) => forms.has(f))).toEqual([]);
    expect(ORDINAL_NUMBER.test("zuerst")).toBe(false);
  });
});

describe("D150 — ظرف المكان المركّب da(r) + حرف (قانون الجبهة)", () => {
  const none = new Set<string>();
  const at = (id: string) => knownStems(taughtUpTo(realLessons.find((l) => l.id === id)!, realLessons, words));
  const FORMS = ["darauf", "darin", "daran", "darüber", "darunter", "daneben", "dahinter", "dazwischen"];
  it("معروفةٌ من الدرس الذي يُدرِّس darauf (a1-u6-d5) — لا قبله ولو كانت da وdaneben والحروف كلها مدروسة", () => {
    const u6d5 = at("a1-u6-d5");
    expect(frontViolations([FORMS.join(" · ")], u6d5, none)).toEqual([]);
    expect(daCompoundKnown("dazwischen", u6d5)).toBe(true);
    const u6d4 = at("a1-u6-d4");
    expect(["auf", "in", "an", "über", "unter", "hinter", "neben", "zwischen"].every((p) => CLOSED.has(p))).toBe(true);
    // daneben كلمة u6-d4 نفسها (D149) — والبقية تنتظر درس القاعدة
    expect(frontViolations([FORMS.join(" · ")], u6d4, none)).toEqual(["dahinter", "daran", "darauf", "darin", "darunter", "darüber", "dazwischen"]);
  });
  it("لا باب خلفياً: davor (vor في الوحدة 9) · مركّبات المعنى المجرّد والزمن · r في غير موضعها أو غائبة · الحرف قبل da", () => {
    const u6d5 = at("a1-u6-d5");
    const probe = ["davor", "damit", "dafür", "dabei", "davon", "dazu", "dagegen", "darum", "danach", "darneben", "darhinter", "daauf", "dain", "daunter", "aufda", "dahin"];
    expect(frontViolations([probe.join(" · ")], u6d5, none)).toEqual([...probe].sort());
  });
  it("الصيغ الثماني تطابق النمط بمرساة darauf — ومنها مدخلان فقط (darauf · daneben) والباقي بالقاعدة لا بمدخل (سابقة D131 · D132)", () => {
    expect(FORMS.every((f) => DA_COMPOUND.test(f))).toBe(true);
    expect(DA_COMPOUND_ANCHOR).toBe("darauf");
    const forms = new Set(words.flatMap((w) => knownForms(w)));
    expect(FORMS.filter((f) => forms.has(f))).toEqual(["darauf", "daneben"]);
  });
});

describe("D115 — التدريب: كل معيار يُكسر وحده", () => {
  const mutate = (fn: (l: Lesson) => void) => { const l = upgraded(); fn(l); return codes(l); };
  const item = (l: Lesson, s: number, i: number) => l.uebung.stations[s]!.items[i]! as Record<string, unknown>;

  it("بند بلا why عربي → e-upgrade-item (والإنجليزية لا تُحسب شرحاً)", () => {
    expect(mutate((l) => { delete item(l, 2, 0).why; })).toContain("e-upgrade-item");
    expect(mutate((l) => { item(l, 2, 0).why = "because the verb needs an ending"; })).toContain("e-upgrade-item");
  });
  it("أقل من 12 بنداً → e-upgrade-practice-size", () => {
    expect(mutate((l) => { l.uebung.stations[3]!.items.pop(); })).toContain("e-upgrade-practice-size");
  });
  it("لا إملاء → e-upgrade-practice-audio · ونوعان فقط → e-upgrade-practice-types", () => {
    expect(mutate((l) => { l.uebung.stations[1]!.type = "gap-fill"; l.uebung.stations[1]!.items = [{ q: "Ich ___ Lena.", a: "heiße", why: WHY }, { q: "Du ___ aus Deutschland.", a: "kommst", why: WHY }, { q: "Lena ___ in Tunesien.", a: "wohnt", why: WHY }]; }))
      .toContain("e-upgrade-practice-audio");
    const two = upgraded();
    two.uebung.stations = [two.uebung.stations[0]!, two.uebung.stations[1]!, { ...two.uebung.stations[0]!, items: two.uebung.stations[0]!.items.map((x) => ({ ...x, q: "ماذا سمعت؟ مرة ثانية" })) }];
    expect(codes(two)).toContain("e-upgrade-practice-types");
  });
  it("مسار صوتي غير موجود → e-upgrade-audio · نص منطوق ≠ نص المسار → e-upgrade-audio-text", () => {
    expect(mutate((l) => { item(l, 0, 0).audioId = "word-gibt-es-nicht"; })).toContain("e-upgrade-audio");
    expect(mutate((l) => { item(l, 1, 0).speakText = "Tschau."; item(l, 1, 0).a = "Tschau"; })).toContain("e-upgrade-audio-text");
  });
  it("الإملاء: الإجابة يجب أن تكون المسموع حرفياً → e-upgrade-item", () => {
    expect(mutate((l) => { item(l, 1, 1).a = "Bitte"; })).toContain("e-upgrade-item");
  });
  it("الترتيب: بطاقات ليست كلمات الإجابة · أو مرتبة سلفاً → e-upgrade-item", () => {
    expect(mutate((l) => { item(l, 3, 0).tokens = ["Yusuf.", "heißt", "Ich"]; })).toContain("e-upgrade-item");
    expect(mutate((l) => { item(l, 3, 0).tokens = ["Ich", "heiße", "Yusuf."]; })).toContain("e-upgrade-item");
  });
  it("اختيار إجابته ليست بين الخيارات → e-upgrade-item · بند مكرر → e-upgrade-item-dup", () => {
    expect(mutate((l) => { item(l, 0, 0).a = "Hallo"; })).toContain("e-upgrade-item");
    expect(mutate((l) => { l.uebung.stations[2]!.items.push({ ...item(l, 2, 0) }); })).toContain("e-upgrade-item-dup");
  });
  it("explanationRequired=false → e-upgrade-practice", () => {
    expect(mutate((l) => { l.uebung.stations[2]!.explanationRequired = false; })).toContain("e-upgrade-practice");
  });
  it("قانون الجبهة: كلمة غير مدروسة حتى الدرس في بند · أو في بطاقة مصيدة → e-upgrade-front", () => {
    expect(mutate((l) => { item(l, 2, 0).q = "Ich ___ heute Yusuf."; })).toContain("e-upgrade-front");
    const withHier = upgraded();
    withHier.zusammenfassung.warningCards[0]!.exercise = { q: "صحّح: ~~Er neu hier~~", a: "Er ist neu hier." }; // تمرين البطاقة الأصلي قبل D116
    const msg = lessonIssues(withHier).find((i) => i.code === "e-upgrade-front")!.message;
    expect(msg).toContain("hier");
  });
});

describe("D115 — Quiz", () => {
  const mutate = (fn: (l: Lesson) => void) => { const l = upgraded(); fn(l); return codes(l); };
  it("نسخة بأقل من 6 بنود → e-upgrade-quiz-size", () => {
    expect(mutate((l) => { l.quiz.variants[1]!.items.splice(5); })).toContain("e-upgrade-quiz-size");
  });
  it("سؤال مكرر في نسخة → e-upgrade-quiz-dup · نسختان متطابقتان → e-upgrade-quiz-variants", () => {
    expect(mutate((l) => { l.quiz.variants[0]!.items[1] = clone(l.quiz.variants[0]!.items[0]!); })).toContain("e-upgrade-quiz-dup");
    expect(mutate((l) => { l.quiz.variants[2] = clone(l.quiz.variants[0]!); })).toContain("e-upgrade-quiz-variants");
  });
  it("إجابة خارج الخيارات · مفتاح غريب → e-upgrade-quiz-item", () => {
    expect(mutate((l) => { (l.quiz.variants[0]!.items[0] as Record<string, unknown>).a = "مرحباً بك"; })).toContain("e-upgrade-quiz-item");
    expect(mutate((l) => { (l.quiz.variants[0]!.items[0] as Record<string, unknown>).hint = "x"; })).toContain("e-upgrade-quiz-item");
  });
  it("كلمة غير مدروسة في Quiz → e-upgrade-front", () => {
    expect(mutate((l) => { (l.quiz.variants[0]!.items[1] as Record<string, unknown>).q = "Ich ___ jetzt Yusuf."; })).toContain("e-upgrade-front");
  });
});

describe("D115 — القاعدة والتغطية والحالة pending", () => {
  it("rule=done بلا ملف · بلا فهرس عكسي · usedArsenalIds ناقص → e-upgrade-rule / e-upgrade-rule-index", () => {
    expect(codes(upgraded(), entry(), [])).toContain("e-upgrade-rule");
    expect(codes(upgraded(), entry(), [rule({}, ["a1-u1-d2"])])).toContain("e-upgrade-rule-index");
    const l = upgraded(); l.usedArsenalIds = [];
    expect(codes(l)).toContain("e-upgrade-rule-index");
  });
  it("كلمة جديدة بلا أي بند (practice+quiz done) → e-upgrade-word-unpracticed — وتُذكر الكلمة", () => {
    const l = upgraded();
    // البند الوحيد الذي يحمل Deutsch يُستبدل في النسخ الثلاث ← لا بند يسترجعها
    l.quiz.variants.forEach((v, vi) => { v.items[3] = { q: `«مرحبا» بالألمانية؟ (${vi})`, choices: ["Hallo", "Tschüss"], a: "Hallo" }; });
    const issue = lessonIssues(l).find((i) => i.code === "e-upgrade-word-unpracticed");
    expect(issue?.message).toContain("deutsch");
    expect(codes(l, entry({ quiz: "pending" }))).not.toContain("e-upgrade-word-unpracticed"); // لا حكم قبل اكتمال الجزأين
  });
  it("pending لا يُفحص (دَين معلن) · وpending يستوفي المعايير → w-upgrade-mark-done", () => {
    expect(codes(legacy, entry({ lessonId: "a1-u11-d2", rule: "pending", practice: "pending", quiz: "pending" }), [])).toEqual([]);
    const issues = lessonIssues(upgraded(), entry({ quiz: "pending" }));
    expect(issues).toEqual([expect.objectContaining({ level: "warning", code: "w-upgrade-mark-done" })]);
  });
  it("اسم علم معلن لا يظهر → w-upgrade-proper-noun (باب خلفي)", () => {
    expect(codes(upgraded(), entry({ properNouns: ["Yusuf", "Lena", "Omar"] }))).toContain("w-upgrade-proper-noun");
  });
  it("الخطة: درس غير موجود · درس توليف · غياب درس محتوى داخل النطاق", () => {
    const ctx = ctxWith(upgraded());
    const c = (p: LessonUpgradePlan) => checkUpgrade(p, ctx).map((i) => i.code);
    expect(c(planWith([entry({ lessonId: "a1-u99-d1" })]))).toContain("e-upgrade-lesson");
    expect(c(planWith([entry({ lessonId: "a1-u1-d6", rule: "pending", practice: "pending", quiz: "pending" })]))).toContain("e-upgrade-lesson");
    const complete = checkUpgrade(planWith([entry()], { fromUnit: 1, toUnit: 1 }), ctx).find((i) => i.code === "e-upgrade-complete");
    expect(complete?.message).toMatch(/^4 درس محتوى/); // u1-d2..d5
  });
});

describe("D116 — أمثلة بطاقات الكلمات (محطة «الجديد» ضمن rule)", () => {
  const withSample = (id: string, sample: { de: string; ar: string } | undefined) =>
    words.map((w) => (w.id === id ? { ...w, sampleSentence: sample && { ...sample, sourceLesson: "a1-u1-d1" } } : w));
  it("مثال فيه كلمة غير مدروسة حتى الدرس → e-upgrade-sample يسمّي الكلمة والمثال (المثال الأصلي لـ deutsch)", () => {
    const issue = lessonIssues(upgraded(), entry(), undefined, withSample("deutsch", { de: "Ich lerne Deutsch.", ar: "أتعلم الألمانية." }))
      .find((i) => i.code === "e-upgrade-sample");
    expect(issue?.message).toContain("lerne");
    expect(issue?.message).toContain("Ich lerne Deutsch.");
  });
  it("كلمة جديدة بلا مثال → e-upgrade-sample · واسم علم في المثال يمر بالإعلان فقط (Tunis)", () => {
    expect(codes(upgraded(), entry(), undefined, withSample("deutsch", undefined))).toContain("e-upgrade-sample");
    expect(codes(upgraded(), entry({ properNouns: ["Yusuf", "Lena"] }))).toContain("e-upgrade-sample"); // «Ich wohne in Tunis.»
  });
  it("rule=pending: الأمثلة لا تُفحص (دَين معلن)", () => {
    const bad = withSample("deutsch", { de: "Ich lerne Deutsch.", ar: "أتعلم الألمانية." });
    expect(codes(upgraded(), entry({ rule: "pending" }), undefined, bad)).not.toContain("e-upgrade-sample");
  });
});

describe("D115 — ملفات القواعد نفسها (checkGrammarRules)", () => {
  it("قانون الجبهة نسبةً لأول درس يشير إليها — حتى لو رُقّي درس لاحق", () => {
    const l = upgraded();
    const u2 = clone(realLessons.find((x) => x.id === "a1-u2-d1")!);
    u2.praesentation.grammarArsenalIds = [RULE_ID];
    const r = rule({ examples: [...rule().payload.examples, { de: "Yusuf ist hier.", ar: "يوسف هنا." }] }, ["a1-u1-d1", "a1-u2-d1"]);
    const ctx: UpgradeContext = { ...ctxWith(l, [r]), lessons: [l, u2, ...realLessons.filter((x) => x.id !== "a1-u1-d1" && x.id !== "a1-u2-d1")] };
    const issue = checkGrammarRules(ctx).find((i) => i.code === "e-rule-front");
    expect(issue?.message).toContain("a1-u1-d1");
    expect(issue?.message).toContain("hier");
    expect(issue?.ruleId).toBe(RULE_ID);
  });
  it("الفهرس العكسي بالاتجاهين → e-rule-index · المستوى → e-rule-level · اسم علم زائد → w-rule-proper-noun", () => {
    expect(checkGrammarRules(ctxWith(upgraded(), [rule({}, [])])).map((i) => i.code)).toContain("e-rule-index");
    expect(checkGrammarRules(ctxWith(upgraded(), [rule({}, ["a1-u1-d1", "a1-u3-d1"])])).map((i) => i.code)).toContain("e-rule-index");
    const a2 = GrammarRuleFile.parse({ ...rule(), levelIntroduced: "A2" });
    expect(checkGrammarRules(ctxWith(upgraded(), [a2])).map((i) => i.code)).toContain("e-rule-level");
    expect(checkGrammarRules(ctxWith(upgraded(), [rule({ properNouns: ["Yusuf", "Lena", "Omar"] })])).map((i) => i.code)).toContain("w-rule-proper-noun");
  });
  it("المخطط: المقارنة بلا 10‑ي · حبّات مكررة · أقل من 3 أمثلة · مفتاح غريب = مرفوض", () => {
    const p = rule().payload;
    expect(ShufraPayload.safeParse({ ...p, contrastAr: "العربية تحذف الرابط" }).success).toBe(false);
    expect(ShufraPayload.safeParse({ ...p, beads: ["Ich", "bin", "Ich"] }).success).toBe(false);
    expect(ShufraPayload.safeParse({ ...p, examples: p.examples.slice(0, 2) }).success).toBe(false);
    expect(ShufraPayload.safeParse({ ...p, extra: 1 }).success).toBe(false);
    expect(ShufraPayload.safeParse(p).success).toBe(true);
  });
  it("مخطط الخطة: درس مكرر · نطاق معكوس = مرفوض", () => {
    expect(() => planWith([entry(), entry()])).toThrow(/مكرر/);
    expect(() => planWith([entry()], { fromUnit: 5, toUnit: 2 })).toThrow(/معكوس/);
  });
});

describe("D115 — أدوات القياس", () => {
  it("taughtUpTo بترتيب المسار: hier (u2-d1) ليست مدروسة في u1-d1 وهي مدروسة في u2-d1", () => {
    const ids = (id: string) => new Set(taughtUpTo(realLessons.find((l) => l.id === id)!, realLessons, words).map((w) => w.id));
    expect(ids("a1-u1-d1").has("hier")).toBe(false);
    expect(ids("a1-u2-d1").has("hier")).toBe(true);
    expect(ids("a1-u1-d1").has("hallo")).toBe(true);
  });
  it("wordAppears: صيغ التصريف تُحسب (heiße/heißt ← heißen) · الكلمات المركبة تحتاج كل أجزائها المفتوحة", () => {
    const w = (id: string) => words.find((x) => x.id === id)!;
    const toks = (s: string) => new Set(contentTokens(s).map(deumlaut));
    expect(wordAppears(w("heissen"), toks("Wie heißt du?"))).toBe(true);
    expect(wordAppears(w("guten-tag"), toks("Guten Morgen!"))).toBe(false);
    expect(wordAppears(w("guten-tag"), toks("Guten Tag!"))).toBe(true);
    expect(wordAppears(w("wie-gehts"), toks("Hallo, wie geht's?"))).toBe(true);
  });
  it("D137 wordAppears: الشرح بين القوسين في de ليس جزءاً من الكلمة — «sein (ملكيته)» تُعدّ مسترجَعة بـsein/seine · و«am (an + dem)» بـam وحدها", () => {
    const w = (id: string) => words.find((x) => x.id === id)!;
    const toks = (s: string) => new Set(contentTokens(s).map(deumlaut));
    expect(w("sein").de).toBe("sein (ملكيته)"); // الاصطلاح القائم (والبطاقة تعرض الشرح) — الحارس هو الذي يتجاهله
    expect(wordAppears(w("sein"), toks("Das ist sein Hund."))).toBe(true);
    expect(wordAppears(w("sein"), toks("Das ist seine Tasche."))).toBe(true);
    expect(wordAppears(w("sein"), toks("Das ist mein Hund."))).toBe(false); // لا تمرير أعمى
    expect(wordAppears(w("am"), toks("Am Montag um drei Uhr."))).toBe(true);
    // قبل D137 كانت «ملكيته» رمزاً مطلوباً والنصوص المفحوصة ألمانية وحدها: sein لا تُعدّ مسترجَعةً أبداً (e-upgrade-word-unpracticed)
    const legacyRule = { ...w("sein"), de: "sein ملكيته" };
    expect(wordAppears(legacyRule, toks("Das ist sein Hund."))).toBe(false);
  });
  it("a1-u8-d4 مُرقّى (D159): صفر نقص — 52 بنداً · 4 أنواع · Quiz 6 · 12 كلمة · ars-dativ-fix · كل 20 سطراً وستة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u8-d4")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u8-d4")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([52, 4, 6, 12]);
    const earlier = new Set(realLessons.filter((x) => x.unit <= 7 || ["a1-u8-d1", "a1-u8-d2", "a1-u8-d3"].includes(x.id)).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    // القاعدة المخططة نفسها (ars-dativ-fix: «الداتيف الثابت mit/nach/aus/zu» في خطة v6.1) — تشاركها ستة دروس لاحقة فـusedInLessons يضمّها كلها (§10‑ح)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-dativ-fix"]);
    const rule = rules.get("ars-dativ-fix")!;
    expect(rule.usedInLessons).toEqual(["a1-u8-d4", "a1-u8-d6", "a1-u9-d1", "a1-u11-d2", "a1-u11-d5", "a1-u11-d6", "a1-u12-d6"]);
    expect(rule.payload.ruleDe).toBe("mit · nach · aus · zu: der/das → dem · die → der — zu dem = zum · zu der = zur — mit dem Bus · mit der Bahn · mit dem Auto · zum Flughafen · zur Schule · nach Berlin · nach Tunesien · nach Hause · aus Tunis · aus der Schweiz");
    // ثلاث خطوات: الحالة (الداتيف دائماً · dem/der · zum/zur) · nach أم zu (المدن والبلدان وHause بلا أداة · zu لما له أداة وللأشخاص) · aus للأصل (بلا أداة إلا die Schweiz)
    for (const x of ["يأتي الداتيف دائماً", "der ← dem · das ← dem · die ← der", "zu dem = zum", "zu der = zur", "nach للمدن والبلدان والقارات بلا أداة", "nach Hause = إلى البيت (حركة) · zu Hause = في البيت (مكان)", "zu لكل مكانٍ له أداة ولكل شخص", "die Schweiz ← aus der Schweiz", "Woher kommst du? — Aus Tunesien.", "abholen (يستقبل/يأخذ: Mein Vater holt mich ab"])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان (حرف الجر قبل الاسم · «من» للأصل بلا أداة · «إلى البيت/في البيت») والفروق الثلاثة — هي المصائد الثلاث (D118)
    const c = rule.payload.contrastAr;
    for (const x of ["«بالحافلة» = mit dem Bus", "«من تونس» = aus Tunesien", "nach Hause · zu Hause", "~~mit den Bus~~ · ~~mit die Bahn~~", "~~zu Berlin~~ أو ~~nach dem Flughafen~~", "~~aus Schweiz~~", "~~aus dem Tunesien~~", "خريطة التداخل 10‑ي"])
      expect(c).toContain(x);
    expect(rule.payload.limitsAr).toHaveLength(4);
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/von.*seit.*bei.*الدرس القادم \(a1-u8-d5 وa1-u8-d6\)/);
    expect(limits).toMatch(/mit meinem Vater · zu meiner Oma.*الوحدة 11/);
    expect(limits).toMatch(/im Supermarkt · am Flughafen.*in\/an\/auf.*ihm · ihr · uns.*gefällt mir/);
    expect(limits).toMatch(/zu قبل الصفة = «أكثر من اللازم».*ليست حرف جر/);
    expect(rule.payload.beads).toEqual(["Ich", "fahre", "mit", "der", "Bahn", "zum", "Flughafen."]);
    // النطاق في نصوص المتعلم الألمانية: لا von/seit/bei (u8-d5) ولا أدوات ملكية في الداتيف ولا Arzt/Flugzeug/Ticket/Haltestelle (غير مدروسة)
    // · ولا الجمل الرسمية الحرفية من SD1 («Ich gehe jetzt nach Hause.» · «Er fährt mit dem Taxi.» · «Ich fahre gern mit dem Zug.» · «Ich fliege nicht gern.» · «Kannst du mich zum Flughafen bringen?») (D108)
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]) });
    expect(shown).not.toMatch(/\b(von|seit|bei|beim|meinem|meiner|deinem|deiner|Arzt|Flugzeug|Ticket|Haltestelle)\b|Ich gehe jetzt nach Hause|Er fährt mit dem Taxi|Ich fahre gern mit dem Zug|Ich fliege nicht gern|zum Flughafen bringen/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Berlin", "Tunis"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // لا نواة في هذا الدرس (الخطة: النواة المعلّقة التالية a1-u9-d3) — والكلمات الاثنتا عشرة من الملف القائم بأمثلة مصحّحة: Berlin/Arzt (غير مدروستين) صارتا Tunesien/Schule · وبلا أعلام
    const w = (id: string) => words.find((x) => x.id === id)!;
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|\bArzt\b/);
    expect([sample("nach"), sample("zu"), sample("aus"), sample("rad"), sample("parken")]).toEqual(["Wann fliegst du nach Tunesien?", "Ich fahre mit dem Rad zur Schule.", "Kommst du aus der Schweiz?", "Fährst du mit dem Rad?", "Mein Vater parkt am Flughafen."]);
    expect(w("parken").ar).toEqual(["يركن (السيارة)"]); // كانت «يركّز سيارته»
    // الحوار (fh-1..20) مكالمةُ الدورة عبر الإنترنت (N-037/N-100): لينا في سويسرا لا تقلّ يوسف ولا تستقبله — أبوه يستقبله في تونس
    const script = JSON.parse(readFileSync(join(CONTENT, "audio-scripts/a1-u8-d4-wie-kommst-du-zum-flughafen.json"), "utf8")) as { lines: { id: string; speaker: string; text: string }[] };
    expect(script.lines).toHaveLength(20);
    expect(script.lines.find((x) => x.id === "fh-8")?.text).toBe("Mein Vater holt mich ab — mit dem Auto. Er parkt am Flughafen.");
    expect(script.lines.filter((x) => x.speaker === "lena").map((x) => x.text).join(" ")).not.toMatch(/hole dich|bringe dich|mein Auto/i);
    expect(script.lines.find((x) => x.id === "fh-13")?.text).toBe("In der Schweiz fahre ich immer mit dem Rad — zur Schule und zum Supermarkt.");
    // N-020 لهذا الدرس: الاستدعاء من دروس سابقة (bus · zug · fahren)
    expect(l.warmup.cardIds).toEqual(["bus", "zug", "fahren"]);
    expect(l.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const text = fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" }))));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        expect(text.includes(fold(ref).slice(0, 4)), `${st.type}: ${ref} لا يظهر في بنود المحطة`).toBe(true);
      }
    }
    // الحوار الجديد (fh-1..20) كله في الاستماع والإملاء مرة واحدة — السطر البطيء الوحيد (fh-1 · 105 كلمة/د) إملاءً مع ستة مقاطع كلمات، والتسعة عشر الباقية استماعاً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("fh-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `fh-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-abholen", "word-bahn", "word-fliegen", "word-flughafen", "word-gepaeck", "word-taxi"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `fh-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(19);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => f.includes(norm(a))))).toEqual([]);
    expect(quizAnswers.filter((a) => l.praesentation.wordIds.includes(a.toLowerCase()))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم (مع أعلام الخطة)
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("الدرس التالي غير المُرقّى (a1-u11-d2 بعد D171): يُشخَّص من محتواه الفعلي لا من فجوات الدفعة السابقة", () => {
    const r = inspectLesson(legacy, { properNouns: [] }, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect(r.practiceItems).toBe(6);
    // الفجوات الفعلية لـu11-d2 (مقيسة قبل النقل): لا ملف ars-gesundheit · مثال schmerz «Der Schmerz ist stark.» (stark غير مدروسة) · 6 بنود choice بلا خيارات ونوع واحد
    // بلا استماع ولا إملاء · «dativ» كلمةً في التدريب (رمز نحوي لا كلمة) · stark في الـQuiz · Quiz 3×4 — ولا كلمة بلا تدريب — القياس لا التخمين
    expect(r.rule.map((i) => i.code)).toEqual(["e-upgrade-rule", "e-upgrade-sample"]);
    expect(r.rule[0]?.message).toMatch(/ars-gesundheit/);
    expect(r.rule[1]?.message).toMatch(/schmerz .*stark/);
    expect(r.practice.map((i) => i.code).sort()).toEqual([
      ...Array(6).fill("e-upgrade-item"), "e-upgrade-front", "e-upgrade-practice-audio", "e-upgrade-practice-audio", "e-upgrade-practice-size", "e-upgrade-practice-types",
    ].sort());
    expect(r.practice.find((i) => i.code === "e-upgrade-front")?.message).toMatch(/: dativ$/);
    expect(r.quiz.map((i) => i.code)).toEqual(["e-upgrade-quiz-size", "e-upgrade-quiz-size", "e-upgrade-quiz-size", "e-upgrade-front"]);
    expect(r.quiz[3]?.message).toMatch(/: stark$/);
    expect(r.coverage).toEqual([]);
    expect(r.quizMin).toBe(4);
  });
  it("الدرس المرجعي الحقيقي a1-u1-d1 (D116): صفر نقص في كل جزء — 14 بنداً · 4 أنواع · Quiz 6 · 17 كلمة مُسترجعة", () => {
    const entryReal = loadUpgradePlans(CONTENT)[0]!.lessons.find((e) => e.lessonId === "a1-u1-d1")!;
    const r = inspectLesson(real, entryReal, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage }).toEqual({ rule: [], practice: [], quiz: [], coverage: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, real.praesentation.wordIds.length]).toEqual([14, 4, 6, 17]);
    expect(real.praesentation.grammarArsenalIds).toEqual(["ars-sein"]);
  });
  it("a1-u1-d2 مُرقّى (D119): صفر نقص — 16 بنداً · 4 أنواع · Quiz 6 · 16 كلمة مُسترجعة · قاعدة ars-laender-sprachen", () => {
    const l = realLessons.find((x) => x.id === "a1-u1-d2")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u1-d2")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage }).toEqual({ rule: [], practice: [], quiz: [], coverage: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([16, 4, 6, 16]);
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-laender-sprachen"]);
    expect(e.properNouns).toEqual(["Lena"]);
  });
  it("a1-u1-d3 مُرقّى (D120): صفر نقص — 19 بنداً · 4 أنواع (منها إملاء الحروف) · Quiz 6 · 16 كلمة · قاعدة الألفباء", () => {
    const l = realLessons.find((x) => x.id === "a1-u1-d3")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u1-d3")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage }).toEqual({ rule: [], practice: [], quiz: [], coverage: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([19, 4, 6, 16]);
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-alphabet-spelling"]);
    expect(e.properNouns).toEqual(["Yusuf", "Haddad", "Lena", "Müller"]);
  });
  it("a1-u1-d4 مُرقّى (D121): صفر نقص — 20 بنداً · 4 أنواع (استماع وإملاء أعداد) · Quiz 6 · 15 كلمة · قاعدة الأعداد", () => {
    const l = realLessons.find((x) => x.id === "a1-u1-d4")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u1-d4")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage }).toEqual({ rule: [], practice: [], quiz: [], coverage: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([20, 4, 6, 15]);
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-zahlen-1-20"]);
    expect(e.properNouns).toEqual(["Yusuf", "Haddad", "Lena", "Gartenstraße"]);
    // الاستدعاء من دروس سابقة (كان zahl/alt/telefon — كلمات اليوم نفسه)
    expect(l.warmup.cardIds).toEqual(["telefonnummer", "wie-viel", "heute"]);
  });
  it("a1-u1-d5 مُرقّى (D123): صفر نقص — 22 بنداً · 4 أنواع (استماع وإملاء من حوار جديد) · Quiz 6 · 17 كلمة · قاعدة wer/woher", () => {
    const l = realLessons.find((x) => x.id === "a1-u1-d5")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u1-d5")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage }).toEqual({ rule: [], practice: [], quiz: [], coverage: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([22, 4, 6, 17]);
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-wer-woher"]);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Nabil"]);
    // الاستدعاء من دروس سابقة (كان zusammen — كلمة اليوم نفسه): ما يبني عليه حوار اليوم
    expect(l.warmup.cardIds).toEqual(["kommen", "sprechen", "alt"]);
    // woher نُقلت إلى هنا (هدف الدرس «mit wer/woher fragen») — وفي u2-d1 صارت استدعاءً في الدفء لا كلمة جديدة (D125)
    const woher = words.find((w) => w.id === "woher")!;
    expect([woher.unit, woher.usedInLessons[0], woher.sampleSentence!.sourceLesson]).toEqual([1, "a1-u1-d5", "a1-u1-d5"]);
    expect(l.praesentation.wordIds).toContain("woher");
    // الاستماع والإملاء على مسارات حوار a1-u1-d5-wer-ist-das وحدها
    const audioIds = l.uebung.stations.filter((s) => s.type === "listening" || s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.audioId)));
    expect(audioIds.length).toBe(9);
    expect(audioIds.every((id) => /^wer-\d+$/.test(id) && tracks.has(id))).toBe(true);
  });
  it("a1-u2-d1 مُرقّى (D125): صفر نقص — 24 بنداً · 4 أنواع (استماع وإملاء من حوار جديد) · Quiz 6 · 12 كلمة · قاعدة wo/woher", () => {
    const l = realLessons.find((x) => x.id === "a1-u2-d1")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u2-d1")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage }).toEqual({ rule: [], practice: [], quiz: [], coverage: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([24, 4, 6, 12]);
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-wo-woher"]);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Nabil", "Berlin"]);
    // woher تُدرَّس في a1-u1-d5 (D123) ⇒ هنا استدعاءٌ لما سبق (الدفء) لا عرضٌ جديد · international نواة D113
    expect(l.praesentation.wordIds).not.toContain("woher");
    expect(l.praesentation.wordIds).toContain("international");
    expect(l.warmup.cardIds).toEqual(["woher", "wohnen", "schweiz"]);
    // الحوار الجديد a1-u2-d1-wo-wohnst-du: أسطره العشرة كلها مستعملة في الاستماع والإملاء (لا مسار بلا بند)
    const audioIds = l.uebung.stations.filter((s) => s.type === "listening" || s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.audioId)));
    expect([...audioIds].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))).toEqual(Array.from({ length: 10 }, (_, i) => `wo-${i + 1}`));
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
  });
  it("a1-u2-d2 مُرقّى (D126): صفر نقص — 25 بنداً · 4 أنواع (استماع وإملاء من حوار جديد) · Quiz 6 · 9 كلمات · قاعدة ein/eine", () => {
    const l = realLessons.find((x) => x.id === "a1-u2-d2")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u2-d2")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage }).toEqual({ rule: [], practice: [], quiz: [], coverage: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([25, 4, 6, 9]);
    // القاعدة: أداة النكرة (البند الأول في خريطة 10‑ي «حذف ein») — بدل «ars-sprachen-wohnen» التي لم يُكتب لها ملف قط
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-ein-eine"]);
    expect(l.usedArsenalIds).toEqual(["ars-ein-eine"]);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Berlin"]);
    // N-018: كلمات الوحدة الأولى الست لم تعد «جديدة» هنا — sprache وwohnen استدعاءٌ في الدفء · والنواة D113 ثلاث (das Leben بجانب الفعل leben)
    for (const old of ["sprache", "deutsch", "englisch", "arabisch", "wohnen", "langsam"]) {
      expect(l.praesentation.wordIds).not.toContain(old);
      expect(l.zusammenfassung.srsBundleWordIds).not.toContain(old);
      expect(l.audioManifestRefs).not.toContain(`word-${old}`);
    }
    expect(l.praesentation.wordIds).toEqual(expect.arrayContaining(["mensch", "ort", "das-leben", "leben"]));
    expect(l.warmup.cardIds).toEqual(["land", "sprache", "wohnen"]);
    // الحوار الجديد a1-u2-d2-ein-haus-eine-wohnung: أسطره الأحد عشر كلها مستعملة في الاستماع والإملاء (لا مسار بلا بند)
    const audioIds = l.uebung.stations.filter((s) => s.type === "listening" || s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.audioId)));
    expect([...audioIds].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))).toEqual(Array.from({ length: 11 }, (_, i) => `ha-${i + 1}`));
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
  });
  it("a1-u2-d3 مُرقّى (D127): صفر نقص — 25 بنداً · 4 أنواع (استماع وإملاء من حوار جديد) · Quiz 6 · 16 كلمة · شفرة الجنس", () => {
    const l = realLessons.find((x) => x.id === "a1-u2-d3")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u2-d3")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage }).toEqual({ rule: [], practice: [], quiz: [], coverage: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([25, 4, 6, 16]);
    // القاعدة المخططة نفسها (ars-genuscode) كُتب ملفها أخيراً — وقاعدتها تكتب اللواحق بشرطة (‑ung · ‑chen) فيمرّرها الحارس (D127)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-genuscode"]);
    expect(loadGrammarRules(CONTENT).get("ars-genuscode")?.payload.ruleDe).toMatch(/‑ung .*‑chen/);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Berlin"]);
    // النواة D113 (der Text · der Fehler · bedeuten) + die Lehrerin (‑in من الشفرة — كانت في التمارين قبل أن يكون لها مدخل)
    expect(l.praesentation.wordIds).toEqual(expect.arrayContaining(["text", "fehler", "bedeuten", "lehrerin"]));
    expect(l.warmup.cardIds).toEqual(["sprache", "wohnung", "freund"]);
    // الحوار الجديد a1-u2-d3-drei-fehler: أسطره الأحد عشر كلها مستعملة في الاستماع والإملاء (لا مسار بلا بند)
    const audioIds = l.uebung.stations.filter((s) => s.type === "listening" || s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.audioId)));
    expect([...audioIds].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))).toEqual(Array.from({ length: 11 }, (_, i) => `fe-${i + 1}`));
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    // الإملاء بلا أسطر فيها خطأ مقصود (das Zeitung · die Mädchen · die Schmetterling لا تُملى أبداً)
    const dictated = l.uebung.stations.filter((s) => s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.a)));
    expect(dictated.join("\n")).not.toMatch(/das Zeitung|die Mädchen|die Schmetterling/);
  });
  it("a1-u2-d4 مُرقّى (D128): صفر نقص — 29 بنداً · 4 أنواع (استماع وإملاء من حوار جديد) · Quiz 6 · 14 كلمة · طول الحركة", () => {
    const l = realLessons.find((x) => x.id === "a1-u2-d4")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u2-d4")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([29, 4, 6, 14]);
    // القاعدة المخططة نفسها (ars-vokalquantitaet) كُتب ملفها أخيراً — وقاعدتها تسمّي الحروف (ss · ff · oo · ie) فيمرّرها الحارس (D128)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-vokalquantitaet"]);
    expect(loadGrammarRules(CONTENT).get("ars-vokalquantitaet")?.payload.ruleDe).toMatch(/lang → ß .*kurz → ss .*oo · h · ie/);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Berlin"]);
    // الأخطاء المقصودة الثمانية معلنة بتصحيحها — وتظهر مشطوبة وحدها (بطاقات المصائد وتمارينها)
    expect(e.misspellings.map((m) => m.wrong)).toEqual(["Strasse", "gross", "Fuss", "Tase", "Kafee", "komen", "Wei", "drie"]);
    // النواة D113 (lang · lange) + kurz منقولة من u4-d5 (هدف الدرس: طويلة أم قصيرة) · وstrasse من u1-d4 لم تعد «جديدة» (N-018)
    expect(l.praesentation.wordIds).toEqual(expect.arrayContaining(["lang", "lange", "kurz"]));
    expect(l.praesentation.wordIds).not.toContain("strasse");
    const kurz = words.find((w) => w.id === "kurz")!;
    expect([kurz.unit, kurz.usedInLessons, kurz.sampleSentence?.sourceLesson]).toEqual([2, ["a1-u2-d4", "a1-u4-d5"], "a1-u2-d4"]);
    expect(l.warmup.cardIds).toEqual(["stadt", "zeitung", "wohnen"]);
    // الحوار الجديد a1-u2-d4-lang-oder-kurz: أسطره الخمسة عشر كلها في الاستماع والإملاء (لا مسار بلا بند)
    const audioIds = l.uebung.stations.filter((s) => s.type === "listening" || s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.audioId)));
    expect([...audioIds].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))).toEqual(Array.from({ length: 15 }, (_, i) => `lk-${i + 1}`));
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    // الإملاء بلا حرف منفرد يُنطق باسمه (mit ß · zwei s · das a) ولا علامة داخلية تُكتب بالضبط (— :)
    const dictated = l.uebung.stations.filter((s) => s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.a)));
    expect(dictated.join("\n")).not.toMatch(/mit ß|zwei s|das a |[—:]/);
    // ما خرج من الأصل: «ai الطويل» في heiß · «au (diphthong)» في groß · leesen · Suppe · heisst
    expect(JSON.stringify(l)).not.toMatch(/ai الطويل|diphthong|leesen|Suppe|heisst/);
  });
  it("a1-u2-d5 مُرقّى (D130): صفر نقص — 31 بنداً · 4 أنواع (استماع وإملاء من حوار جديد) · Quiz 6 · 15 كلمة · الفعل ثانياً مع الظروف", () => {
    const l = realLessons.find((x) => x.id === "a1-u2-d5")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u2-d5")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([31, 4, 6, 15]);
    // القاعدة المخططة نفسها (ars-kennenlernen) كُتب ملفها أخيراً: حرية الظرف مقابل V2 — auch · gern · also بعد الفعل،
    // وNatürlich · Also أولاً ⇒ الفعل ثم الفاعل (توسيع Hier wohne ich من u2-d1) · وvorstellen/kennenlernen قطعتان لا قاعدة الوحدة 7
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-kennenlernen"]);
    const rule = loadGrammarRules(CONTENT).get("ars-kennenlernen")!;
    expect(rule.payload.ruleDe).toMatch(/Ich lese auch gern\. .*Natürlich sprechen wir Deutsch! .*Hast du ein Hobby\?/);
    expect(rule.payload.contrastAr).toContain("حرية الظرف مقابل V2");
    expect(rule.payload.limitsAr.join("\n")).toMatch(/الوحدة السابعة/);
    expect(e.properNouns).toEqual(["Yusuf", "Ayşe", "Berlin"]);
    // النواة D113 (schlecht · also · die Gruppe) — وkennenzulernen (صيغة zu التي لا يعرفها الحارس) خرجت من المثال
    expect(l.praesentation.wordIds).toEqual(expect.arrayContaining(["schlecht", "also", "gruppe"]));
    const sample = (id: string) => words.find((w) => w.id === id)!.sampleSentence!.de;
    expect(sample("kennenlernen")).toBe("Wir lernen uns kennen.");
    expect([sample("oder"), sample("natuerlich"), sample("lesen"), sample("musik")].join(" ")).not.toMatch(/Tee|helfe|Bücher|höre/);
    expect(l.warmup.cardIds).toEqual(["vorname", "kennen", "freund"]);
    // الحوار الجديد a1-u2-d5-wir-sind-eine-gruppe: أسطره الستة عشر كلها في الاستماع والإملاء (لا مسار بلا بند)
    const audioIds = l.uebung.stations.filter((s) => s.type === "listening" || s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.audioId)));
    expect([...audioIds].sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))).toEqual(Array.from({ length: 16 }, (_, i) => `gr-${i + 1}`));
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    // الإملاء بلا اسم لا يُكتب بلوحة عادية (Ayşe — ş) ولا علامة داخلية تُكتب بالضبط (— :)
    const dictated = l.uebung.stations.filter((s) => s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.a)));
    expect(dictated.join("\n")).not.toMatch(/ş|[—:]/);
    // ما خرج من الأصل: kennenzulernen (صيغة zu) · Tee (الوحدة 5) · helfe (الوحدة 9) · höre (الوحدة 3)
    expect(JSON.stringify(l)).not.toMatch(/kennenzulernen|Tee\b|helfe|höre/);
  });
  it("a1-u3-d1 مُرقّى (D131): صفر نقص — 35 بنداً · 4 أنواع (حوار جديد + أعداد مسموعة) · Quiz 6 · 14 كلمة · العشرات والمركّب", () => {
    const l = realLessons.find((x) => x.id === "a1-u3-d1")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u3-d1")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([35, 4, 6, 14]);
    // القاعدة المخططة نفسها (ars-zahlen-100) كُتب ملفها أخيراً: العشرات واستثناءاتها الثلاثة + المركّب الآحاد ثم und ثم العشرات
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-zahlen-100"]);
    const rule = loadGrammarRules(CONTENT).get("ars-zahlen-100")!;
    expect(rule.payload.ruleDe).toMatch(/dreißig .*sechzig · siebzig .*zwei \+ und \+ dreißig = zweiunddreißig/);
    expect(rule.payload.contrastAr).toContain("العربية في صفّك");
    expect(e.properNouns).toEqual(["Lena"]);
    // الأخطاء المقصودة الأربعة معلنة بتصحيحها (zwanzigeins خارج حد الإعلان — N-048 — فعُرض الخطأ المنطوق كلمتين مدروستين)
    expect(e.misspellings.map((m) => m.wrong)).toEqual(["einsundzwanzig", "dreizig", "sechszig", "siebenzig"]);
    // النواة D113 (die Oma · das Essen بمعرّف das-essen بجانب الفعل essen)
    expect(l.praesentation.wordIds).toEqual(expect.arrayContaining(["oma", "das-essen"]));
    const sample = (id: string) => words.find((w) => w.id === id)!.sampleSentence!.de;
    expect(sample("fuenfzig")).toBe("Zwei mal fünfundzwanzig ist fünfzig.");
    expect(["dreissig", "vierzig", "sechzig", "achtzig", "neunzig", "hundert", "mal"].map(sample).join(" ")).not.toMatch(/Euro|Minuten|Stunde|Bedeutungen|Zweimal/);
    expect(l.warmup.cardIds).toEqual(["zahl", "nummer", "jahr"]);
    // الحوار الجديد (om-1..13) وأعداد المرجع الجديدة (9) كلها في الاستماع والإملاء
    const audioIds = l.uebung.stations.filter((s) => s.type === "listening" || s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.audioId)));
    expect(audioIds.filter((id) => id.startsWith("om-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))).toEqual(Array.from({ length: 13 }, (_, i) => `om-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("num-")).sort()).toEqual(["num-21", "num-24", "num-27", "num-35", "num-36", "num-42", "num-53", "num-63", "num-99"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    // الاستماع يميّز المقلوب (24/42 · 35/53 · 36/63) — والإجابة بين خياراتها مع مقلوبها
    const lis = l.uebung.stations.find((s) => s.type === "listening")!.items as { audioId: string; choices: string[]; a: string }[];
    expect(lis.find((i) => i.audioId === "num-42")!.choices).toEqual(expect.arrayContaining(["42", "24"]));
    // ما خرج من الأصل في النصوص المعروضة: twenty · zwanzigeins · dreissig (dreissig معرّف الكلمة يبقى — لا يُعرض) · Euro · Minuten · Zweimal
    const shown = [l.uebung.stations.map((s) => s.items), l.quiz, l.zusammenfassung.summary, l.zusammenfassung.warningCards, l.einstieg];
    expect(JSON.stringify(shown)).not.toMatch(/twenty|zwanzigeins|dreissig|Euro|Minuten|Zweimal/);
  });
  it("a1-u3-d2 مُرقّى (D132): صفر نقص — 35 بنداً · 4 أنواع (حوار جديد + أعداد وأسعار مسموعة) · Quiz 6 · 15 كلمة · المئات والأسعار", () => {
    const l = realLessons.find((x) => x.id === "a1-u3-d2")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u3-d2")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([35, 4, 6, 15]);
    // القاعدة المخططة نفسها (ars-preis-1000) كُتب ملفها أخيراً: المئات أولاً ثم الباقي · kosten بلا حرف جر · nur قبل العدد
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-preis-1000"]);
    const rule = loadGrammarRules(CONTENT).get("ars-preis-1000")!;
    expect(rule.payload.ruleDe).toMatch(/dreihundert \+ fünfundsechzig = dreihundertfünfundsechzig .*nur zweihundert Euro/);
    expect(rule.payload.limitsAr.join("\n")).toContain("kaufen + für");
    expect(e.properNouns).toEqual(["Lena", "Yusuf"]);
    // النواة D113 (der Dank · leicht · das Restaurant)
    expect(l.praesentation.wordIds).toEqual(expect.arrayContaining(["dank", "leicht", "restaurant"]));
    const sample = (id: string) => words.find((w) => w.id === id)!.sampleSentence!.de;
    expect(sample("geld")).toBe("Wie viel Geld hast du?"); // كان «Ich habe kein Geld.» — kein قاعدة a1-u5-d4
    expect(["billig", "preis", "kosten", "euro", "nur", "viel"].map(sample).join(" ")).not.toMatch(/Brot|gut|kein|Wie viel kostet das/);
    expect(l.warmup.cardIds).toEqual(["zwanzig", "hundert", "zaehlen"]);
    // الحوار الجديد (hd-1..14) والأعداد والأسعار المرجعية (7) كلها في الاستماع والإملاء
    const audioIds = l.uebung.stations.filter((s) => s.type === "listening" || s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.audioId)));
    expect(audioIds.filter((id) => id.startsWith("hd-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))).toEqual(Array.from({ length: 14 }, (_, i) => `hd-${i + 1}`));
    expect(audioIds.filter((id) => !id.startsWith("hd-")).sort()).toEqual(["eur-19-99", "eur-2-50", "num-102", "num-200", "num-600", "num-700", "num-900"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    // الاستماع يميّز ‑hundert من ‑zig و‑zehn (700/70/17) — والإجابة بين خياراتها مع شبيهاتها
    const lis = l.uebung.stations.find((s) => s.type === "listening")!.items as { audioId: string; choices: string[] }[];
    expect(lis.find((i) => i.audioId === "num-700")!.choices).toEqual(["700", "70", "17"]);
    // ما خرج من الأصل في النصوص المعروضة: bezahlen für · das Euro · Wie Geld · Brot · siebenhundert بلا أساس
    const shown = [l.uebung.stations.map((s) => s.items), l.quiz, l.zusammenfassung.summary, l.zusammenfassung.warningCards, l.einstieg];
    expect(JSON.stringify(shown)).not.toMatch(/bezahlen für|bezahle für|das Euro|Wie Geld|Brot/);
  });
  it("a1-u3-d3 مُرقّى (D133): صفر نقص — 35 بنداً · 4 أنواع (حوار جديد + أوقات مسموعة) · Quiz 6 · 15 كلمة · الساعة", () => {
    const l = realLessons.find((x) => x.id === "a1-u3-d3")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u3-d3")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([35, 4, 6, 15]);
    // القاعدة المخططة نفسها (ars-uhrzeit) كُتب ملفها أخيراً: halb للساعة التالية · Viertel nach/vor كالعربية · Uhr/Stunde · um للموعد
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-uhrzeit"]);
    const rule = loadGrammarRules(CONTENT).get("ars-uhrzeit")!;
    expect(rule.payload.ruleDe).toMatch(/halb drei = 2:30 .*vierzehn Uhr dreißig · eine Stunde · um halb acht/);
    expect(rule.payload.contrastAr).toMatch(/«السابعة والنصف»/);
    expect(e.properNouns).toEqual(["Yusuf", "Ayşe"]);
    // النواة D113 (nächst- بالكلمة nächste · geschlossen · geöffnet)
    expect(l.praesentation.wordIds).toEqual(expect.arrayContaining(["naechste", "geschlossen", "geoeffnet"]));
    const sample = (id: string) => words.find((w) => w.id === id)!.sampleSentence!.de;
    expect(["frueh", "spaet", "mittag", "halb"].map(sample).join(" ")).not.toMatch(/stehe|Mensa|schon spät|halb drei/);
    expect(l.warmup.cardIds).toEqual(["zwanzig", "tausend", "kosten"]);
    // الحوار الجديد (ab-1..14) والأوقات المرجعية (uz-1..7) كلها في الاستماع والإملاء
    const audioIds = l.uebung.stations.filter((s) => s.type === "listening" || s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.audioId)));
    expect(audioIds.filter((id) => id.startsWith("ab-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))).toEqual(Array.from({ length: 14 }, (_, i) => `ab-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("uz-")).sort()).toEqual(Array.from({ length: 7 }, (_, i) => `uz-${i + 1}`));
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    // الاستماع يميّز halb drei (2:30) من 3:30 — الفخ نفسه بين خياراته
    const lis = l.uebung.stations.find((s) => s.type === "listening")!.items as { audioId: string; choices: string[]; a: string }[];
    expect(lis.find((i) => i.audioId === "uz-2")).toMatchObject({ a: "2:30", choices: expect.arrayContaining(["3:30"]) });
    // الإملاء بلا اسم لا يُكتب بلوحة عادية (Ayşe) — ومدخل نطق nächste ([ɛː] الطويلة) يمسّ مسار السطر الذي يذكرها
    const dictated = l.uebung.stations.filter((s) => s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.a)));
    expect(dictated.join("\n")).not.toMatch(/ş/);
  });
  it("a1-u3-d4 مُرقّى (D134): صفر نقص — 34 بنداً · 4 أنواع (حوار جديد + مواعيد مسموعة) · Quiz 6 · 16 كلمة · um/am/im", () => {
    const l = realLessons.find((x) => x.id === "a1-u3-d4")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u3-d4")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([34, 4, 6, 16]);
    // القاعدة المخططة نفسها (ars-um-am-im) كُتب ملفها أخيراً: um/am/im · اليوم قبل الساعة · es الشكلي · sich treffen
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-um-am-im"]);
    const rule = loadGrammarRules(CONTENT).get("ars-um-am-im")!;
    expect(rule.payload.ruleDe).toMatch(/um drei Uhr · am Montag · am Abend · im Juni .*Es regnet\. · Wir treffen uns\./);
    expect(rule.payload.contrastAr).toContain("حذف es الوهمي");
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Berlin"]);
    // النواة D113 (fertig · regnen · scheinen) + die Sonne منقولة من a1-u10-d1 (scheinen لا تُستعمل بلا الشمس — سابقة kurz D128)
    expect(l.praesentation.wordIds).toEqual(expect.arrayContaining(["fertig", "regnen", "scheinen", "sonne"]));
    const sonne = words.find((w) => w.id === "sonne")!;
    expect([sonne.unit, sonne.usedInLessons, sonne.sampleSentence?.sourceLesson, sonne.sampleSentence?.de])
      .toEqual([3, ["a1-u3-d4", "a1-u10-d1", "a1-u15-d4"], "a1-u3-d4", "Heute scheint die Sonne."]); // كان «Die Sonne scheint.» = مثال SD1 حرفياً
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; lessonRefs: string[] }[] };
    expect(manifest.tracks.find((t) => t.id === "word-sonne")?.lessonRefs).toEqual(["a1-u3-d4", "a1-u10-d1"]);
    expect(words.find((w) => w.id === "regnen")!.grammarRisks).toContain("needs-es-dummy");
    const sample = (id: string) => words.find((w) => w.id === id)!.sampleSentence!.de;
    expect(["januar", "maerz", "mai", "sonntag", "termin"].map(sample).join(" ")).not.toMatch(/kalt|Frühling|schön|Ruhetag|einen/);
    expect(l.warmup.cardIds).toEqual(["uhr", "halb", "morgen"]);
    // الحوار الجديد (tm-1..15) والجمل المرجعية (tr-1..5) كلها في الاستماع والإملاء
    const audioIds = l.uebung.stations.filter((s) => s.type === "listening" || s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.audioId)));
    expect(audioIds.filter((id) => id.startsWith("tm-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)))).toEqual(Array.from({ length: 15 }, (_, i) => `tm-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("tr-")).sort()).toEqual(Array.from({ length: 5 }, (_, i) => `tr-${i + 1}`));
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    // الاستماع يراجع فخ halb (2:30 لا 3:30) داخل جملة موعد
    const lis = l.uebung.stations.find((s) => s.type === "listening")!.items as { audioId: string; choices: string[]; a: string }[];
    expect(lis.find((i) => i.audioId === "tr-2")).toMatchObject({ a: "الأحد 2:30", choices: expect.arrayContaining(["الأحد 3:30"]) });
  });
  it("a1-u3-d5 مُرقّى (D135): صفر نقص — 35 بنداً · 4 أنواع (حوار وأرقام/أوقات مسموعة) · Quiz 6 · 15 كلمة · طلب الإعادة", () => {
    const l = realLessons.find((x) => x.id === "a1-u3-d5")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u3-d5")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([35, 4, 6, 15]);
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-hoeren-zahlen"]);
    expect(e.properNouns).toEqual(["Yusuf", "Ayşe"]);
    expect(l.warmup.cardIds).toEqual(["uhr", "zwanzig", "telefonnummer"]);
    const audioIds = l.uebung.stations.filter((s) => s.type === "listening" || s.type === "dictation").flatMap((s) => s.items.map((i) => String(i.audioId)));
    expect(audioIds.filter((id) => id.startsWith("h5-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 14 }, (_, i) => `h5-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("n5-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 7 }, (_, i) => `n5-${i + 1}`));
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const listening = l.uebung.stations.find((s) => s.type === "listening")!.items as { audioId: string; choices: string[]; a: string }[];
    expect(listening.find((i) => i.audioId === "n5-1")).toMatchObject({ a: "04172", choices: expect.arrayContaining(["04712"]) });
    expect(listening.find((i) => i.audioId === "n5-6")).toMatchObject({ a: "8:30", choices: expect.arrayContaining(["9:30"]) });
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    const quizQuestions = l.quiz.variants.flatMap((v) => v.items.map((i) => i.q));
    expect(quizQuestions.some((q) => trainingQuestions.has(q))).toBe(false);
    // D135: هدف الدرس والمهمة والخلاصة ألمانيها من المدروس حتى اليوم — حارس خاص لهذه الحقول الوصفية (N-022).
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    expect(meta.flatMap((text) => frontViolations([text], taught, new Set(e.properNouns)))).toEqual([]);
    // N-053: NetworkLab يعرض Kollokation الكلمة؛ لا نسرّب bekommen غير المدروسة في درسها الأول.
    expect(words.find((w) => w.id === "anruf")!.kollocation).toEqual({ de: "Der Anruf kommt.", ar: "تأتي المكالمة.", verb: "kommen" });
  });
  it("a1-u4-d1 مُرقّى (D136): صفر نقص — 39 بنداً · 4 أنواع · Quiz 6 · 15 كلمة · كل 20 سطراً و3 أصوات كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u4-d1")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u4-d1")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([39, 4, 6, 15]);
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-familie"]);
    expect(l.ziel.de).toBe("Wer sind das? — Das sind die Großeltern.");
    expect(e.properNouns).toEqual([]); // الحوار تمرين في أسرة مرسومة خيالية، لا يثبت قرابة شخصية ليوسف أو Ayşe.
    expect(l.praesentation.wordIds).toEqual(expect.arrayContaining(["grosseltern", "junge", "opa"]));
    expect(words.find((w) => w.id === "grosseltern")!.grammarRisks).toEqual(["plural-irregular"]); // لا needs-ein لاسم جمع فقط.
    for (const id of ["eltern", "grosseltern"]) {
      const w = words.find((entry) => entry.id === id)!;
      expect([w.article, w.gender]).toEqual(["die", "none"]); // جمع دائم: أداة الجمع تبقى، ولا نعرض جنس مفرد.
      expect(w.srsCardTypes).not.toContain("gender");
    }
    expect(words.find((w) => w.id === "junge")!.grammarRisks).toEqual(expect.arrayContaining(["needs-ein", "n-deklination"]));

    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    expect([listening.items.length, dictation.items.length]).toEqual([20, 3]);
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(audioIds).toHaveLength(23);
    expect(new Set(audioIds).size).toBe(23); // لا تكرار صوتي بين المحطتين.
    expect(audioIds.filter((id) => id.startsWith("f4-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `f4-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-grosseltern", "word-junge", "word-opa"]);
    expect(dictation.items.map((i) => String(i.audioId)).sort()).toEqual(["f4-12", "f4-17", "word-grosseltern"].sort());
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);

    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    expect(meta.flatMap((text) => frontViolations([text], taught, new Set(e.properNouns)))).toEqual([]);
  });
  it("a1-u4-d2 مُرقّى (D137): صفر نقص — 35 بنداً · 4 أنواع · Quiz 6 · 13 كلمة · ars-possessiv · كل 17 سطراً و3 أصوات كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u4-d2")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u4-d2")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([35, 4, 6, 13]);
    // القاعدة المخططة نفسها (ars-possessiv) كُتب ملفها أخيراً: الجذع من المالك · ‑e من أداة المملوك (die والجمع) · Das gehört mir
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-possessiv"]);
    const rule = loadGrammarRules(CONTENT).get("ars-possessiv")!;
    expect(rule.payload.ruleDe).toMatch(/der Hund → mein Hund · die Katze → meine Katze · das Auto → mein Auto · die Eltern → meine Eltern/);
    expect(rule.payload.contrastAr).toContain("«كلبي» · «قطتي»"); // الياء العربية لا تتغير مع المملوك
    expect(rule.payload.contrastAr).toContain("العربية في صفّك"); // «كلبي» بلا «ال» = mein Hund بلا der — لا يُنسب إلى العربية ما ليس فيها
    expect(rule.payload.limitsAr.join(" ")).toMatch(/meinen Namen.*الدرس التالي/); // Akkusativ قاعدة a1-u4-d3 — لا تُسحب
    expect(e.properNouns).toEqual(["Lena", "Mia", "Bruno", "Yusuf"]);
    // النواة D113 (lieben) بالمولِّد · وأمثلة البطاقات القديمة الأربعة صُحّحت إلى الجبهة (Berlin · Omar · Rex · unser · schläft)
    expect(l.praesentation.wordIds).toContain("lieben");
    const lieben = words.find((w) => w.id === "lieben")!;
    expect([lieben.forms?.praesens3s, lieben.goetheList, lieben.sampleSentence?.de]).toEqual(["liebt", ["A1", "A2"], "Ich liebe meine Familie."]);
    const sample = (id: string) => words.find((w) => w.id === id)!.sampleSentence!.de;
    expect(["tante", "onkel", "hund", "katze"].map(sample).join(" ")).not.toMatch(/Berlin|Omar|Rex|Unser|schläft/);
    expect(l.warmup.cardIds).toEqual(["bruder", "mutter", "kind"]);
    // الحوار الجديد (be-1..17) كله في الاستماع والإملاء مرة واحدة · word-onkel المعاد توليده ([ŋ]) استماعاً · Schlüssel وlieben إملاءً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("be-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 17 }, (_, i) => `be-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-lieben", "word-onkel", "word-schluessel"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    // N-015: الإملاء من الأسطر البطيئة وحدها (مقيسة في المانيفست) — الأسرع (be-7 · be-9 · be-12) في الاستماع
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    const dictWpm = dictation.items.map((i) => wpm.get(String(i.audioId))!);
    expect(Math.max(...dictWpm)).toBeLessThanOrEqual(132);
    // الاستماع يحسم المالك بـsein: الكلب للعم لا للعمة
    const lis = listening.items as { audioId: string; choices: string[]; a: string }[];
    expect(lis.find((i) => i.audioId === "be-8")).toMatchObject({ a: "لعمّ لينا (أو خالها)", choices: expect.arrayContaining(["لعمّة لينا (أو خالتها)"]) });
    // لا مهمة مكررة بين التدريب والـQuiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const built = new Set(l.uebung.stations.filter((s) => s.type === "build-sentence").flatMap((s) => s.items.map((i) => String(i.a))));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.a)).some((a) => built.has(a))).toBe(false);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    // أسماء العلم تُقطَّع كما يقطّعها الحارس (contentTokens بحروف صغيرة) — «Lena · Yusuf» في الموقف (situation)
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
    expect(frontViolations([l.uebung.communicativeTask.situation.de], taught, new Set())).toEqual(["lena", "yusuf"]); // بلا الإعلان تُمسك
  });
  it("a1-u4-d3 مُرقّى (D138): صفر نقص — 38 بنداً · 4 أنواع · Quiz 6 · 14 كلمة · ars-akkusativ-1 · كل 18 سطراً و3 أصوات كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u4-d3")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u4-d3")!;
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([38, 4, 6, 14]);
    // القاعدة المخططة نفسها (ars-akkusativ-1) كُتب ملفها أخيراً: المذكر وحده بـ‑n (den · einen · meinen) · بعد ist لا مفعول · Wer/Wen
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-akkusativ-1"]);
    const rule = loadGrammarRules(CONTENT).get("ars-akkusativ-1")!;
    expect(rule.payload.ruleDe).toMatch(/der Hund → den Hund · ein Freund → einen Freund · mein Onkel → meinen Onkel · eine Frau → eine Frau · ein Foto → ein Foto/);
    expect(rule.payload.ruleAr).toContain("Ich buchstabiere meinen Namen"); // وعدُ حدود ars-possessiv (D137) يُوفى هنا
    expect(rule.payload.contrastAr).toContain("الفاعل مرفوع والمفعول به منصوب"); // النقل الإيجابي يُسمّى عوناً لا خطأً
    expect(rule.payload.contrastAr).toContain("مبتدأ مرفوع لا مفعول"); // «عندي أخٌ»
    expect(rule.payload.limitsAr.join(" ")).toMatch(/A2/); // الصفة المنعوتة لا تُسحب قبل قاعدتها
    expect(rule.payload.limitsAr.join(" ")).toMatch(/einen Jungen.*meinen Namen/); // n-Deklination تُسمّى حدّاً
    expect(e.properNouns).toEqual(["Lena", "Yusuf", "Nabil", "Bruno"]);
    // النواة D113 (beide · die Lösung) بالمولِّد · وأمثلة البطاقات القديمة صُحّحت: hängt/Wand · siehst · Genitiv «meiner Familie» · نصا SD1/A2 الحرفيان
    expect(l.praesentation.wordIds).toEqual(expect.arrayContaining(["beide", "loesung"]));
    const loesung = words.find((w) => w.id === "loesung")!;
    expect([loesung.de, loesung.plural, loesung.goetheList, loesung.sampleSentence?.de]).toEqual(["die Lösung", "die Lösungen", ["A1", "A2"], "Weißt du die Lösung?"]);
    const beide = words.find((w) => w.id === "beide")!;
    expect([beide.wordClass, beide.goetheList, beide.sampleSentence?.de]).toEqual(["pronoun", ["A1", "A2"], "Wir sind beide neu hier."]);
    const sample = (id: string) => words.find((w) => w.id === id)!.sampleSentence!.de;
    expect(["bild", "foto", "haar", "wen", "schoen"].map(sample).join(" ")).not.toMatch(/hängt|Wand|meiner|siehst|lange Haare|Bild ist sehr schön|schönes/);
    expect(l.warmup.cardIds).toEqual(["hund", "katze", "auto"]);
    // الحوار الجديد (wb-1..18) كله في الاستماع والإملاء مرة واحدة · word-bild استماعاً · die Lösung وHaar إملاءً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("wb-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 18 }, (_, i) => `wb-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-bild", "word-haar", "word-loesung"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    // N-015: الإملاء من الأسطر البطيئة وحدها (مقيسة في المانيفست) — الأسرع (wb-9 · wb-16 · wb-14 · wb-15) في الاستماع
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    const dictWpm = dictation.items.map((i) => wpm.get(String(i.audioId))!);
    expect(Math.max(...dictWpm)).toBeLessThanOrEqual(132);
    for (const fast of ["wb-9", "wb-14", "wb-15", "wb-16"]) expect(listening.items.map((i) => String(i.audioId))).toContain(fast);
    // الاستماع يفرّق klein (قصير القامة) من jung (صغير السن)
    const lis = listening.items as { audioId: string; choices: string[]; a: string }[];
    expect(lis.find((i) => i.audioId === "wb-4")).toMatchObject({ a: "هل هو قصير؟", choices: expect.arrayContaining(["هل هو شاب؟"]) });
    // لا مهمة مكررة بين التدريب والـQuiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    // ولا جملة أو عبارة مكررة إجابةً بين التدريب والـQuiz (الكلمة المفردة mein/Wer تتكرر بطبيعتها بين الفجوة والاختيار)
    const answers = new Set(l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a))).filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u4-d4 مُرقّى (D139): صفر نقص — 40 بنداً · 4 أنواع · Quiz 6 · 15 كلمة · ars-akkusativ-2 · كل 20 سطراً وصوتا كلمتين مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u4-d4")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u4-d4")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([40, 4, 6, 15]);
    // القاعدة المخططة نفسها (ars-akkusativ-2): الجواب بضمير (المذكر وحده ← ihn) · Wen?/Was? أولاً · stehen/sitzen بلا مفعول
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-akkusativ-2"]);
    const rule = rules.get("ars-akkusativ-2")!;
    expect(rule.payload.ruleDe).toMatch(/den Hund → ihn · die Katze → sie · das Foto → es · meine Großeltern → sie/);
    expect(rule.payload.ruleDe).toContain("Wer steht links? — Links steht mein Vater.");
    // وعدُ حدود ars-akkusativ-1 (D138: «er ← ihn — نتدرب عليه لاحقاً») يُوفى هنا
    expect(rules.get("ars-akkusativ-1")!.payload.limitsAr.join(" ")).toMatch(/er ← ihn/);
    // النقل الإيجابي يُسمّى عوناً («هو/ـه» · «يقفُ أبي») والفروق بمبررها: جنس الكلمة العربية · «بيني وبينك» · جذع المضارع
    expect(rule.payload.contrastAr).toContain("«يقفُ أبي»");
    expect(rule.payload.contrastAr).toContain("وهذا عون حقيقي");
    expect(rule.payload.contrastAr).toContain("«الصورة» مؤنثة فنقول «أراها»");
    expect(rule.payload.contrastAr).toContain("«بيني وبينك»");
    // لا قاعدة من وحدة لاحقة بلا إعلان: Dativ بعد neben/zwischen (الوحدتان 8 و9) · تغيّر الحركة (الوحدة 7) · نهايات der/die Bekannte (A2)
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/neben dem.*Dativ/);
    expect(limits).toMatch(/siehst.*الوحدة 7/);
    expect(limits).toMatch(/ein Bekannter.*A2/);
    expect(e.properNouns).toEqual(["Lena", "Yusuf"]);
    // النواة D113 (bekannt · die Bekannte · tot) بالمولِّد — die Bekannte مؤنثاً (لا ein Bekannter قبل A2) بعلَم adjective-decl
    expect(l.praesentation.wordIds).toEqual(expect.arrayContaining(["bekannt", "bekannte", "tot"]));
    const bekannte = words.find((w) => w.id === "bekannte")!;
    expect([bekannte.de, bekannte.plural, bekannte.goetheList, bekannte.grammarRisks]).toEqual(["die Bekannte", "die Bekannten", ["A1", "A2"], ["adjective-decl", "needs-ein"]]);
    const tot = words.find((w) => w.id === "tot")!;
    expect([tot.wordClass, tot.goetheList]).toEqual(["adjective", ["A1", "A2"]]);
    // أمثلة البطاقات القديمة: Stuhl/auf dem (Dativ) · Zeig mir (أمر + Dativ) · meiner (Dativ) · «Wir sind gemeinsam» (غير اصطلاحية)
    const sample = (id: string) => words.find((w) => w.id === id)!.sampleSentence!.de;
    expect(["zeigen", "sitzen", "laecheln", "neben", "gemeinsam"].map(sample).join(" ")).not.toMatch(/Stuhl|auf dem|Zeig mir|meiner|sind gemeinsam/);
    expect(l.warmup.cardIds).toEqual(["opa", "loesung", "foto"]);
    // الحوار الجديد (fo-1..20) كله في الاستماع والإملاء مرة واحدة · zwischen وlächeln إملاءً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("fo-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `fo-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-laecheln", "word-zwischen"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    // N-015: الإملاء من الأسطر البطيئة وحدها (مقيسة في المانيفست) — الأسرع (fo-3 · fo-5 · fo-6 · fo-16) في الاستماع
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    for (const fast of ["fo-3", "fo-5", "fo-6", "fo-16"]) expect(listening.items.map((i) => String(i.audioId))).toContain(fast);
    // الاستماع يحسم الضمير ihn (أراه) · وtot بسؤال هادئ عن معنى الجملة لا عن مشاعر المتعلم
    const lis = listening.items as { audioId: string; choices: string[]; a: string }[];
    expect(lis.find((i) => i.audioId === "fo-6")).toMatchObject({ a: "نعم، أراه. هل هذا أبوك؟" });
    expect(lis.find((i) => i.audioId === "fo-13")).toMatchObject({ a: "جده متوفّى" });
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة أو عبارة مكررة إجابةً بينهما · ولا مقطع كلمة يساوي إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set(l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))));
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    expect(quizAnswers.filter((a) => ["zwischen", "lächeln"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u4-d5 مُرقّى (D140): صفر نقص — 37 بنداً · 4 أنواع · Quiz 6 · 14 كلمة · ars-familie-mix · كل 17 سطراً وصوتا كلمتين مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u4-d5")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u4-d5")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([37, 4, 6, 14]);
    // القاعدة المخططة نفسها (ars-familie-mix): الجذع من المالك (sein · ihr) والنهاية من المملوك ودوره (Ø · ‑e · ‑en)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-familie-mix"]);
    const rule = rules.get("ars-familie-mix")!;
    expect(rule.payload.ruleDe).toMatch(/er → sein · sie → ihr — der Mann → ihr Mann · die Arbeit → ihre Arbeit · den Mann → ihren Mann/);
    // وعدُ ars-possessiv (D137: «كلبها = ihr Hund … نتدرب عليها في درس لاحق») يُوفى هنا — افتراض N-063
    expect(rules.get("ars-possessiv")!.payload.limitsAr.join(" ")).toMatch(/ihr Hund.*درس لاحق/);
    // النقل الإيجابي يُسمّى عوناً («زوجُه/زوجُها» ≈ sein/ihr) · والفروق بمبررها: «ـها» لا تتغير مع المملوك · الفرنسية sa mère · باء «فخور بـ»
    expect(rule.payload.contrastAr).toContain("العربية في صفّك");
    expect(rule.payload.contrastAr).toContain("«زوجُها · عملُها · رأيتُ زوجَها»");
    expect(rule.payload.contrastAr).toContain("sa mère");
    // لا قاعدة لاحقة بلا إعلان: Dativ بعد von/mit (الوحدة 8) · المنفصلة (الوحدة 7) · ihr «أنتم» لاحقاً · Geschwister جمع دائم
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/von meiner Familie.*Dativ/);
    expect(limits).toMatch(/aufnehmen.*الوحدة 7/);
    expect(limits).toMatch(/Ihr بحرف كبير/);
    expect(e.properNouns).toEqual(["Lena", "Yusuf", "Mia", "Berlin"]);
    // النواة D113 (das Glück · glücklich) + ihr (ملكيتها) بالمولِّد — ونص مقطع ihr بلا الشرح بين القوسين (D140: إصلاح المولِّد)
    expect(l.praesentation.wordIds).toEqual(expect.arrayContaining(["glueck", "gluecklich", "ihr"]));
    const ihr = words.find((w) => w.id === "ihr")!;
    expect([ihr.de, ihr.wordClass, ihr.isFunctionWord, ihr.sampleSentence?.de]).toEqual(["ihr (ملكيتها)", "pronoun", true, "Ihr Mann ist Lehrer."]);
    const glueck = words.find((w) => w.id === "glueck")!;
    expect([glueck.de, glueck.plural, glueck.goetheList]).toEqual(["das Glück", undefined, ["A1", "A2"]]);
    expect(tracks.get("word-ihr")?.textDe).toBe("ihr.");
    // kurz مُدرَّسة في a1-u2-d4 (D128) ⇒ لم تعد «جديدة» هنا (N-018) وتبقى استرجاعاً في التدريب
    expect(l.praesentation.wordIds).not.toContain("kurz");
    expect(l.uebung.stations.find((s) => s.type === "gap-fill")!.interleavedWith).toContain("kurz");
    // Geschwister جمع دائم كـEltern: بلا جنس مفرد ولا بطاقة جنس (اصطلاح D136)
    const geschwister = words.find((w) => w.id === "geschwister")!;
    expect([geschwister.gender, geschwister.srsCardTypes.includes("gender")]).toEqual(["none", false]);
    // أمثلة البطاقات القديمة: Sfax · Genitiv «meines Vaters» · «in der Schule» · «zur Arbeit» · Aufnahme + صفة منعوتة · «von meiner Familie»
    const sample = (id: string) => words.find((w) => w.id === id)!.sampleSentence!.de;
    expect(["geschwister", "beruf", "arbeiten", "arbeit", "aufnehmen", "erzaehlen", "zwilling"].map(sample).join(" "))
      .not.toMatch(/Sfax|meines|in der|zur|Aufnahme|kurze|meiner/);
    expect(l.warmup.cardIds).toEqual(["mann", "brille", "kind"]);
    // الحوار الجديد (na-1..17) كله في الاستماع والإملاء مرة واحدة · ihr وstolz إملاءً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("na-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 17 }, (_, i) => `na-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-ihr", "word-stolz"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    // N-015: الإملاء من الأسطر البطيئة وحدها (مقيسة في المانيفست) — الأسرع (na-7 · na-8 · na-10 · na-15 · na-16) في الاستماع
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    for (const fast of ["na-7", "na-8", "na-10", "na-15", "na-16"]) expect(listening.items.map((i) => String(i.audioId))).toContain(fast);
    // الاستماع يحسم ihr/sein في سطر واحد: «Ihr Mann ist Lehrer. Er liebt seinen Beruf.»
    const lis = listening.items as { audioId: string; choices: string[]; a: string }[];
    expect(lis.find((i) => i.audioId === "na-7")).toMatchObject({ a: "معلّم ويحب مهنته" });
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set(l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))));
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => String(i.q).replace("___", String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => f.includes(a)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["ihr", "stolz"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u9-d1 مُرقّى (D161): صفر نقص — 55 بنداً · 4 أنواع · Quiz 6 · 18 كلمة · ars-stadt-ort · كل 20 سطراً وخمسة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u9-d1")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u9-d1")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([55, 4, 6, 18]);
    // hier/dort مكررتان من u2-d1 بإعادة بناء مقصودة (D68) — وما عداهما جديد
    const earlier = new Set(realLessons.filter((x) => x.unit <= 8).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual(["hier", "dort"]);
    // القاعدة المخططة نفسها (ars-stadt-ort) — تشاركها u9-d6 (توليف) · وars-dativ-fix تبقى مرجعاً مستدعًى (zum · mit dem — usedInLessons السبعة من D159)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-stadt-ort", "ars-dativ-fix"]);
    const rule = rules.get("ars-stadt-ort")!;
    expect(rule.usedInLessons).toEqual(["a1-u9-d1", "a1-u9-d6"]);
    expect(rule.payload.ruleDe).toBe("Wo ist …? — gegenüber: der/das → dem · die → der — gegenüber der Kirche · gegenüber dem Park · gegenüber dem Bahnhof — in dem = im: im Norden · im Süden · im Osten · im Westen (Wo?) — nach Norden · nach Süden (Wohin?) — hier · dort · geradeaus · Ich gehe zurück. · zurück zum Kurs");
    // ثلاث خطوات: Wo ist + hier/dort · gegenüber + الداتيف · im (موقع) ≠ nach (اتجاه) — وكلمتا الطريق geradeaus/zurück
    for (const x of ["Wo ist …? = أين …؟", "hier (هنا) · dort (هناك)", "«مقابل» = gegenüber + الداتيف دائماً", "gegenüber der Kirche (die Kirche)", "gegenüber dem Park (der Park)", "in + dem = im", "im Norden von Berlin", "nach بلا أداة: nach Norden", "geradeaus = إلى الأمام مباشرة", "zurück = رجوعاً، وتقف في آخر الجملة", "Ich komme morgen zurück."])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان («أين» · «مقابل» قبل الاسم · «في/إلى» الجهة) والفروق الثلاثة — هي المصائد الثلاث (D118)
    const c = rule.payload.contrastAr;
    for (const x of ["«أين …؟» = Wo ist …?", "«مقابل الكنيسة» حرفٌ قبل الاسم", "«في الشمال» = im Norden و«إلى الشمال» = nach Norden", "~~gegenüber die Kirche~~", "~~gegenüber das Museum~~", "~~Das Krankenhaus ist nach Norden.~~", "~~Wir fahren im Norden.~~", "~~Ich komme zurück morgen.~~", "Ich komme morgen zurück.", "خريطة التداخل 10‑ي"])
      expect(c).toContain(x);
    expect(rule.payload.limitsAr).toHaveLength(4);
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/gegenüber بعد الاسم \(dem Bahnhof gegenüber\) وgegenüber \+ ضمير \(mir gegenüber\) ليست اليوم/);
    expect(limits).toMatch(/in\/an\/auf\/vor\/neben بالسؤالين Wo\? \(الداتيف\) وWohin\? \(الأكوزاتيف\) باب الوحدة 9 اليوم الرابع/);
    expect(limits).toMatch(/In den Süden fahren \(in \+ الأكوزاتيف\) في اليوم الرابع/);
    expect(limits).toMatch(/abbiegen · einsteigen · umsteigen.*Gehen Sie …!.*rechts\/links تعرفهما من قبل/);
    expect(rule.payload.beads).toEqual(["Die", "Apotheke", "ist", "gegenüber", "der", "Kirche."]);
    // النطاق في نصوص المتعلم الألمانية: لا Wechselpräpositionen بالموقع (an der · neben der · vor der · in die) ولا صيغة الأمر Sie (Gehen Sie · Fahren Sie) ولا dann/nah/Ecke/Mitte (غير مدروسة أو لاحقة أو خارج اليوم)
    // · ولا الجمل الرسمية الحرفية من SD1 («Wo ist die Post, bitte?» · «Wohin gehst du?» · «Wann kommst du zurück?») (D108)
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]) });
    expect(shown).not.toMatch(/\b(an der|neben der|vor der|in die|Gehen Sie|Fahren Sie|dann|nah|Ecke|Mitte|dorthin|hierhin|weit)\b|Wo ist die Post|Wohin gehst du|Wann kommst du zurück/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Berlin", "Tunesien", "Tunis"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // بلا نواة (الخطة: الإسناد المعلّق التالي a1-u9-d3) — والكلمات الثماني عشرة من الملف القائم بأمثلة مصحّحة: ثمانية أمثلة كانت بـan der/neben der/vor der/in den (باب u9-d4) أو بالإضافة (im Norden der Stadt) أو بصيغة الأمر Sie (Fahren Sie geradeaus! · Gehen Sie zurück …!) — وبلا أعلام
    const w = (id: string) => words.find((x) => x.id === id)!;
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|an der|neben der|vor der|in den|Norden der|Sie\b/);
    expect(["krankenhaus", "bank", "post", "platz", "nord", "sued", "geradeaus", "zurueck"].map(sample)).toEqual(["Das Krankenhaus ist im Süden.", "Die Bank ist gegenüber der Post.", "Die Post ist gegenüber der Apotheke.", "Die Kirche und die Bank sind am Platz.", "Mein Kurs ist im Norden.", "Meine Oma wohnt im Süden.", "Zu Fuß geradeaus — fünf Minuten.", "Ich gehe jetzt zurück zum Bahnhof."]);
    for (const id of l.praesentation.wordIds) expect(w(id).pluralRuleNote ?? "").not.toContain("Gleich_plural");
    // الحوار (sk-1..20) مكالمةُ الدورة (N-037/N-100): لينا تسأل عن برلين ويوسف عن بلدتها وعن تونس — لا لقاء
    const script = JSON.parse(readFileSync(join(CONTENT, "audio-scripts/a1-u9-d1-wo-ist-dein-kurs.json"), "utf8")) as { lines: { id: string; speaker: string; text: string }[] };
    expect(script.lines).toHaveLength(20);
    expect(script.lines.find((x) => x.id === "sk-2")?.text).toBe("Hallo Lena! Mein Kurs ist im Norden von Berlin, gegenüber der Universität.");
    expect(script.lines.find((x) => x.id === "sk-9")?.text).toBe("Ein Museum? Nein, hier nicht. Das Museum ist in der Stadt — eine Stunde mit dem Zug.");
    expect(script.lines.map((x) => x.text).join(" ")).not.toMatch(/\bwir (sind|gehen|fahren) (hier|zusammen)\b|hole dich|bringe dich|\bdann\b|\bnah\b|\bweit\b/i);
    // N-020 لهذا الدرس: الاستدعاء من دروس سابقة (stadt · bahnhof · rechts) — كانت stadt/strasse/wo
    expect(l.warmup.cardIds).toEqual(["stadt", "bahnhof", "rechts"]);
    expect(l.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
    // الاستدعاء المعلن كلمةً كاملة (أو جذع فعل) لا بادئة (N-102 — من هذه الكتلة فصاعداً)
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    const VERB_STEMS: Record<string, string> = { fliegen: "flieg", fahren: "fahr", gehen: "geh", wohnen: "wohn", kommen: "komm" };
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const toks = new Set(fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" })))).split(/[^a-z0-9]+/));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        const stem = VERB_STEMS[ref];
        const ok = stem ? [...toks].some((t) => t.startsWith(stem)) : [fold(ref), fold(ref) + "n", fold(ref) + "e", fold(ref) + "en"].some((f) => toks.has(f));
        expect(ok, `${st.type}: ${ref} لا يظهر في بنود المحطة كلمةً كاملة`).toBe(true);
      }
    }
    // الحوار الجديد (sk-1..20) كله في الاستماع والإملاء مرة واحدة — الإملاء من الأسطر البطيئة (sk-3 · sk-7 · sk-15 · sk-20 ≤132) مع خمسة مقاطع كلمات، والأسرع كلها استماعاً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("sk-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `sk-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-apotheke", "word-gegenueber", "word-geradeaus", "word-krankenhaus", "word-universitaet"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; textDe: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `sk-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(16);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // نص الإملاء = نص المسار حرفياً (مقاطع الكلمات القديمة غير متسقة: «die Apotheke.» و«Krankenhaus.» — D68)
    const textDe = new Map(manifest.tracks.map((t) => [t.id, t.textDe]));
    for (const i of dictation.items) expect(i.speakText).toBe(textDe.get(String(i.audioId)));
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => f.includes(norm(a))))).toEqual([]);
    expect(quizAnswers.filter((a) => l.praesentation.wordIds.includes(a.toLowerCase()))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم (مع أعلام الخطة)
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u9-d2 مُرقّى (D162): صفر نقص — 52 بنداً · 4 أنواع · Quiz 6 · 17 كلمة · ars-weg-verkehr · كل 20 سطراً وأربعة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u9-d2")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u9-d2")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([52, 4, 6, 17]);
    // الكلمات السبع عشرة كلها جديدة (لا تكرار من الوحدات 1–8 ولا من u9-d1)
    const earlier = new Set(realLessons.filter((x) => x.unit <= 8 || (x.unit === 9 && x.day === 1)).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    // القاعدة المخططة نفسها (ars-weg-verkehr) — تشاركها u9-d3 (الأمر Sie + الطريق) وu9-d6 (توليف) · بلا نواة (الخطة: الإسناد المعلّق التالي a1-u9-d3)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-weg-verkehr"]);
    const rule = rules.get("ars-weg-verkehr")!;
    expect(rule.usedInLessons).toEqual(["a1-u9-d2", "a1-u9-d3", "a1-u9-d6"]);
    expect(rule.payload.ruleDe).toBe("einsteigen · umsteigen · aussteigen: Ich steige … ein / um / aus. — Am Hauptbahnhof steige ich um. · Wo steigst du aus? — Am Flughafen. · Musst du umsteigen? — Nein, ich steige nicht um. — Wohin fährst du? — Zum Hauptbahnhof. · Wo ist die Haltestelle? — Gegenüber der Post. — Linie 5 · Bahnsteig 3 · von Bahnsteig 3 ab · in Richtung Flughafen · Die Abfahrt ist um acht Uhr. · Die Ankunft ist um neun Uhr. · weit ≠ nah · hin und zurück · am Park vorbei · Überall ist Verkehr.");
    // أربع خطوات: الأفعال المنفصلة الثلاثة (+ muss + الفعل كاملاً · nicht قبل الجزء) · Wohin ≠ Wo · أرقام الرحلة بلا أداة + um … Uhr · weit/nah · hin und zurück · vorbei · überall
    for (const x of ["einsteigen (يركب) · umsteigen (يغيّر وسيلة النقل) · aussteigen (ينزل)", "ich steige · du steigst · er steigt", "Am Hauptbahnhof steige ich um.", "Ich muss am Hauptbahnhof umsteigen.", "Ich steige nicht um.", "Wohin? (إلى أين) للاتجاه", "Wo? (أين) للموقع", "Linie 5 (الخط 5) · Bahnsteig 3 (الرصيف 3)", "in Richtung Flughafen", "Die Abfahrt ist um acht Uhr.", "weit (بعيد) ≠ nah (قريب)", "hin und zurück (ذهاباً وإياباً — بهذا الترتيب دائماً", "Der Zug fährt am Park vorbei.", "Überall ist Verkehr."])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان (hin und zurück · Linie 5 · Wo/Wohin) والفروق الثلاثة — هي المصائد الثلاث (D118)
    const c = rule.payload.contrastAr;
    for (const x of ["«ذهاباً وإياباً» = hin und zurück بالترتيب نفسه", "«الخط 5» و«الرصيف 3» = Linie 5 · Bahnsteig 3", "«أين؟» للموقع = Wo? و«إلى أين؟» للاتجاه = Wohin?", "~~Ich umsteige am Hauptbahnhof.~~", "~~Am Hauptbahnhof ich steige um.~~", "~~Wo fährst du?~~", "~~Die Abfahrt ist acht Uhr.~~", "Die Abfahrt ist um acht Uhr.", "خريطة التداخل 10‑ي"])
      expect(c).toContain(x);
    expect(rule.payload.limitsAr).toHaveLength(4);
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/in den Bus \(in \+ الأكوزاتيف\).*an der Haltestelle \(an \+ الداتيف\) باب الوحدة 9 اليوم الرابع/);
    expect(limits).toMatch(/صيغة الأمر المهذبة \(Steigen Sie hier aus! · Fahren Sie geradeaus!\).*في اليوم الثالث/);
    expect(limits).toMatch(/vorbei اليوم مع am \+ المكان.*an der Kirche vorbei.*في اليوم الرابع/);
    expect(limits).toMatch(/abfahren\/ankommen.*في الوحدة 12/);
    expect(rule.payload.beads).toEqual(["Am", "Hauptbahnhof", "steige", "ich", "um."]);
    // النطاق في نصوص المتعلم الألمانية: لا Wechselpräpositionen (in den · in die · an der) ولا صيغة الأمر Sie (u9-d3) ولا ganz/dann/Fahrt (غير مدروسة أو لاحقة)
    // · ولا كلمات u9-d3 (N-103: abbiegen · zuerst · danach · sofort · gerne · Stadtplan · Auskunft · Eingang · Ausgang · Problem · helfen · Entschuldigung)
    // · ولا الجمل الرسمية الحرفية من SD1 («Wo ist die Post, bitte?» · «Wohin gehst du?») (D108) — وhin und zurück عبارة معجمية ثابتة من ثلاث كلمات لا جملة
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]) });
    expect(shown).not.toMatch(/\b(in den|in die|an der|Steigen Sie|Fahren Sie|Gehen Sie|dann|ganz|Fahrt|abbiegen|zuerst|danach|sofort|gerne|Stadtplan|Auskunft|Eingang|Ausgang|Problem|helfen|Entschuldigung)\b|Wo ist die Post|Wohin gehst du/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Berlin", "Tunesien", "Tunis"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // الكلمات السبع عشرة من الملف القائم بأمثلة مصحّحة: سبعة أمثلة كانت بصيغة الأمر Sie (Bitte steigen Sie ein! · Fahren Sie an der Kirche vorbei!) أو بـin den/an der (باب u9-d4) أو بكلمة غير مدروسة (ganz) أو مصدراً مبتوراً (In Richtung Norden fahren.) أو تكراراً (Hin und zurück — hin und zurück.) — وبلا أعلام
    const w = (id: string) => words.find((x) => x.id === id)!;
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|an der|in den|Sie\b|ganz|Norden fahren/);
    expect(["richtung", "umsteigen", "einsteigen", "nah", "vorbei", "hin", "kreuzung"].map(sample)).toEqual(["Die Bahn fährt in Richtung Flughafen.", "Am Hauptbahnhof steige ich um.", "Ich steige am Bahnhof ein.", "Die Haltestelle ist sehr nah.", "Der Zug fährt am Park vorbei.", "Eine Fahrkarte hin und zurück, bitte.", "Geradeaus zur Kreuzung, dort links."]);
    for (const id of l.praesentation.wordIds) expect(w(id).sampleSentence?.sourceLesson).toBe("a1-u9-d2");
    // الحوار (hb-1..20) مكالمةُ الدورة قبل السفر (N-037/N-100): يوسف يصف رحلته إلى المطار (الاثنين — كما في sk-13 وfh) ولينا قطارها إلى الجدة — لا لقاء، ولا «غداً تطير»
    const script = JSON.parse(readFileSync(join(CONTENT, "audio-scripts/a1-u9-d2-mit-bus-und-bahn.json"), "utf8")) as { lines: { id: string; speaker: string; text: string }[] };
    expect(script.lines).toHaveLength(20);
    expect(script.lines.find((x) => x.id === "hb-4")?.text).toBe("Nein, zum Hauptbahnhof. Am Hauptbahnhof steige ich um. Die Bahn fährt zum Flughafen.");
    expect(script.lines.find((x) => x.id === "hb-13")?.text).toBe("Nein, ich steige nicht um. Der Zug fährt am Park vorbei, am Krankenhaus vorbei — und ich lese.");
    expect(script.lines.map((x) => x.text).join(" ")).not.toMatch(/\bwir (sind|gehen|fahren) (hier|zusammen)\b|hole dich|bringe dich|\bdann\b|\bganz\b|morgen fliegst|in den Bus|in die Bahn|an der Haltestelle/i);
    // N-020 لهذا الدرس: الاستدعاء من دروس سابقة (bus · bahn · fahrkarte — u7-d4/u8-d4) كما كان
    expect(l.warmup.cardIds).toEqual(["bus", "bahn", "fahrkarte"]);
    expect(l.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
    // الاستدعاء المعلن كلمةً كاملة (أو جذع فعل) لا بادئة (N-102)
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    const VERB_STEMS: Record<string, string> = { fliegen: "flieg", fahren: "fahr", kommen: "komm", kosten: "kost", wissen: "weiß", abholen: "holt" };
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const toks = new Set(fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" })))).split(/[^a-z0-9]+/));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        const stem = VERB_STEMS[ref];
        const ok = stem ? [...toks].some((t) => t.startsWith(fold(stem))) : [fold(ref), fold(ref) + "n", fold(ref) + "e", fold(ref) + "en"].some((f) => toks.has(f));
        expect(ok, `${st.type}: ${ref} لا يظهر في بنود المحطة كلمةً كاملة`).toBe(true);
      }
    }
    // الحوار الجديد (hb-1..20) كله في الاستماع والإملاء مرة واحدة — الإملاء من الأسطر البطيئة (hb-2 · hb-3 · hb-5 · hb-9 · hb-17 ≤132) مع أربعة مقاطع كلمات، والأسرع كلها استماعاً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("hb-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `hb-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-bahnsteig", "word-haltestelle", "word-richtung", "word-umsteigen"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; textDe: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `hb-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(11);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    const textDe = new Map(manifest.tracks.map((t) => [t.id, t.textDe]));
    for (const i of dictation.items) expect(i.speakText).toBe(textDe.get(String(i.audioId)));
    // معجم النطق (D162): Bahnsteig [st→ʃt] وHaltestelle [ɛ→ə] — مقطعا الكلمتين وأسطر الحوار ومسار نموذج الامتحان القديم أُعيدت
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; forms: { espeak: string; ipa: string }[]; regeneratedTracks: string[] }[] };
    expect(lex.entries.find((x) => x.word === "Bahnsteig")).toMatchObject({ forms: [{ espeak: "bˈɑːnstaɪk", ipa: "bˈɑːnʃtˌaɪk" }], regeneratedTracks: ["word-bahnsteig", "hb-9", "hb-10"] });
    expect(lex.entries.find((x) => x.word === "Haltestelle")).toMatchObject({ forms: [{ espeak: "hˈaltɛʃtˌɛlə", ipa: "hˈaltəʃtˌɛlə" }], regeneratedTracks: ["word-haltestelle", "mt1-h1-d6-l3", "hb-2", "hb-16", "st-9"] }); // st-9 (D165) يمسّ المدخل نفسه
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => f.includes(norm(a))))).toEqual([]);
    expect(quizAnswers.filter((a) => l.praesentation.wordIds.includes(a.toLowerCase()))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم (مع أعلام الخطة)
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u10-d1 مُرقّى (D166): صفر نقص — 60 بنداً · 4 أنواع · Quiz 6 · 12 كلمة · ars-wetter-es (جديدة) · أربعة أمثلة كلمات صُحّحت · كل 20 سطراً وأحد عشر مقطع كلمة مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u10-d1")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u10-d1")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([60, 4, 6, 12]);
    // الكلمات الاثنتا عشرة كما في الخطة (بلا إسناد نواة — u10-d1 ليس في خطة SD1) — sonne وحدها تكرار مقصود من u3-d4 (كانت كذلك قبل الترقية)
    const earlier = new Set(realLessons.filter((x) => x.unit <= 9).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual(["sonne"]);
    expect(l.praesentation.wordIds).toEqual(["wetter", "sonne", "regen", "schnee", "wind", "wolke", "himmel", "grad", "warm", "kalt", "nass", "sonnig"]);
    // قاعدة اليوم جديدة: ars-wetter-es (تشاركها u10-d6)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-wetter-es"]);
    const we = rules.get("ars-wetter-es")!;
    expect(we.usedInLessons).toEqual(["a1-u10-d1", "a1-u10-d6"]);
    expect(we.payload.ruleDe).toBe("Wie ist das Wetter? — Es regnet. · Es ist kalt. · Es ist warm. · Es ist heiß. · Heute ist es sonnig. · Es ist schön. — Jetzt regnet es. · Hier ist es warm. · Bei uns ist es kalt. · Morgen regnet es nicht. — Wie viel Grad sind es? — Es sind zwanzig Grad. · Nur acht Grad. — Die Sonne scheint. · Der Wind ist heute kalt. · Am Himmel sind Wolken. · Die Straße ist nass. · Am Morgen ist hier Schnee.");
    // جملة الطقس بأربع خطوات: السؤال · الشكلان (فعل الطقس / ist + صفة) · es لا يسقط بعد الزمن/المكان · الدرجات بالجمع وGrad بلا ‑e — والفاعل الحقيقي بلا es
    for (const x of ["جملة الطقس بأربع خطوات", "Wie ist das Wetter?", "es + فعل الطقس: Es regnet.", "es ist + صفة: Es ist kalt.", "إما الفعل وإما ist + صفة، لا معاً", "Jetzt regnet es. · Hier ist es warm. · Bei uns ist es kalt.", "Regnet es? · Ist es kalt?", "Es sind zwanzig Grad.", "Grad لا يأخذ ‑e بعد العدد", "Die Sonne scheint. · Der Wind ist heute kalt."])
      expect(we.payload.ruleAr).toContain(x);
    for (const x of ["~~Regnet heute.~~", "~~Heute regnet.~~", "~~Es kalt.~~", "~~Heute kalt.~~", "~~Es ist regnet.~~", "~~Es ist regnen.~~", "خريطة التداخل 10‑ي"]) expect(we.payload.contrastAr).toContain(x);
    expect(we.payload.limitsAr).toHaveLength(4);
    expect(we.payload.limitsAr.join(" ")).toMatch(/schneien .*ليس في قائمة SD1/);
    expect(we.payload.limitsAr.join(" ")).toMatch(/der Winter · der Sommer/);
    expect(we.payload.beads).toEqual(["Heute", "regnet", "es", "bei", "uns", "nicht."]);
    expect(we.payload.properNouns).toEqual(["Tunis"]);
    // النطاق في نصوص المتعلم الألمانية: لا schneit/Winter/Sommer/stark/blau (كانت في الملف القديم) ولا Perfekt/war ولا «Es ist regnet»
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]), g: l.ziel.de, t: [l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de] });
    expect(shown).not.toMatch(/\b(schneit|schneien|Winter|Sommer|stark|blau|war|geregnet|Es ist regnet|Grade)\b/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Berlin", "Tunis"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // أربعة أمثلة كلمات صُحّحت (كانت بـschneit/Winter · stark · blau · Winter — غير مدروسة) — بكلمات الدرس نفسه
    const w = (id: string) => words.find((x) => x.id === id)!;
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect([sample("schnee"), sample("wind"), sample("himmel"), sample("kalt")]).toEqual(["Am Morgen ist hier Schnee.", "Der Wind ist heute kalt.", "Am Himmel sind keine Wolken.", "Heute ist es kalt."]);
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|schneit|Winter|stark|blau/);
    for (const id of ["schnee", "wind", "himmel", "kalt"]) expect(w(id).sampleSentence?.sourceLesson).toBe("a1-u10-d1");
    expect(w("sonne").sampleSentence?.sourceLesson).toBe("a1-u3-d4");
    // الحوار (wt-1..20) مكالمة فيديو صباحية في اليوم الثالث بتونس (N-037/N-100): شمس عند يوسف ومطر وثلج عند لينا — لا لقاء في مكان واحد
    const script = JSON.parse(readFileSync(join(CONTENT, "audio-scripts/a1-u10-d1-wie-ist-das-wetter.json"), "utf8")) as { lines: { id: string; speaker: string; text: string }[] };
    expect(script.lines).toHaveLength(20);
    expect(script.lines.find((x) => x.id === "wt-5")?.text).toBe("Ja, es regnet, und es ist kalt. Der Wind ist auch kalt.");
    expect(script.lines.find((x) => x.id === "wt-15")?.text).toBe("Morgen regnet es nicht. Morgen ist es sonnig, aber kalt.");
    expect(script.lines.map((x) => x.text).join(" ")).not.toMatch(/\bwir (sind|gehen|fahren) (hier|zusammen)\b|hole dich|bringe dich|\bdann\b|\bweil\b|\bwarum\b|\bleider\b|\bsagt\b|\bwar\b|schneit|Winter|Ich nehme den Bus\./i);
    // N-020 لهذا الدرس: الاستدعاء من دروس سابقة (heiß · morgen · Uhr — u2-d4/u3-d3/u3-d1) كما كان
    expect(l.warmup.cardIds).toEqual(["heiss", "morgen", "uhr"]);
    expect(l.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
    // الاستدعاء المعلن كلمةً كاملة (أو جذع فعل) لا بادئة (N-102)
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const toks = new Set(fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" })))).split(/[^a-z0-9]+/));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        const ok = [fold(ref), fold(ref) + "n", fold(ref) + "e", fold(ref) + "en", fold(ref) + "s", fold(ref) + "t"].some((f) => toks.has(f));
        expect(ok, `${st.type}: ${ref} لا يظهر في بنود المحطة كلمةً كاملة`).toBe(true);
      }
    }
    // الحوار الجديد (wt-1..20) كله في الاستماع والإملاء مرة واحدة — الإملاء من الأسطر البطيئة الخمسة (≤132) مع أحد عشر مقطع كلمة (بلا sonne المعروفة)، والأسرع الخمسة عشر كلها استماعاً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("wt-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `wt-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-grad", "word-himmel", "word-kalt", "word-nass", "word-regen", "word-schnee", "word-sonnig", "word-warm", "word-wetter", "word-wind", "word-wolke"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; textDe: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `wt-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(15);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    const textDe = new Map(manifest.tracks.map((t) => [t.id, t.textDe]));
    for (const i of dictation.items) expect(i.speakText).toBe(textDe.get(String(i.audioId)));
    // معجم النطق: لا مدخل جديد — regnet (المدخل القائم) يمسّ أربعة أسطر جديدة (wt-4 · wt-5 · wt-11 · wt-15) سُجّلت (N-099)
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; regeneratedTracks: string[] }[] };
    expect(lex.entries).toHaveLength(74); // 72 في D166 — ثم geregnet · geholt في D168
    expect(lex.entries.find((x) => x.word === "regnet")?.regeneratedTracks).toEqual(["tm-2", "tr-3", "km-11", "fh-14", "vb-19", "wt-4", "wt-5", "wt-11", "wt-15", "wg-13"]); // wg-13 من D168
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => f.includes(norm(a))))).toEqual([]);
    expect(quizAnswers.filter((a) => l.praesentation.wordIds.includes(a.toLowerCase()))).toEqual([]);
    // المصائد الثلاث (es لا يسقط · الصفة تحتاج ist · لا فعلان معاً) — كل واحدة بـ10‑ي
    expect(l.zusammenfassung.warningCards.map((c) => c.commonError.de)).toEqual(["~~Heute regnet.~~ · ~~Regnet heute.~~", "~~Es kalt.~~ · ~~Heute kalt.~~", "~~Es ist regnet.~~ · ~~Es ist regnen.~~"]);
    for (const c of l.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم (مع أعلام الخطة)
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u10-d2 مُرقّى (D167): صفر نقص — 61 بنداً · 4 أنواع · Quiz 6 · 15 كلمة · ars-termin-datum (جديدة) · نواة lieb-/der Moment/enden · مثالا datum/einladung صُحّحا · كل 20 سطراً وخمسة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u10-d2")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u10-d2")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([61, 4, 6, 15]);
    // الكلمات الخمس عشرة كلها جديدة (لا تكرار من الوحدات 1–9 ولا من u10-d1) — والنواة الثلاث (D113: lieb- · der Moment · enden) في آخر القائمة
    const earlier = new Set(realLessons.filter((x) => x.unit <= 9 || (x.unit === 10 && x.day <= 1)).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(l.praesentation.wordIds).toEqual(["kalender", "datum", "dienstag", "mittwoch", "donnerstag", "freitag", "samstag", "einladung", "absage", "frei", "besetzt", "wochenende", "lieb", "moment", "enden"]);
    // قاعدة اليوم جديدة: ars-termin-datum (تشاركها u10-d6)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-termin-datum"]);
    const td = rules.get("ars-termin-datum")!;
    expect(td.usedInLessons).toEqual(["a1-u10-d2", "a1-u10-d6"]);
    expect(td.payload.ruleDe).toBe("Montag · Dienstag · Mittwoch · Donnerstag · Freitag · Samstag · Sonntag — am Dienstag · am Wochenende · Am Dienstag habe ich Zeit. — Welches Datum ist heute? — Heute ist der zweite April. · Heute ist der erste Mai. · Heute ist der dritte Juni. · Heute ist der siebte Januar. · Heute ist der zwölfte März. · Heute ist der zwanzigste Februar. — Wann? — Am zwölften April. · Am siebzehnten April endet der Kurs. · Ich habe am achtzehnten April Geburtstag. · Ich schreibe den achtzehnten April in meinen Kalender. — Hast du am Samstag Zeit? — Ja, am Samstag bin ich frei. · Nein, am Freitag ist alles besetzt. — Einen kleinen Moment! · Vielen Dank für die Einladung! · Das ist die erste Absage. — Liebe Lena, · Lieber Yusuf,");
    // التاريخ والموعد بأربع خطوات: الأيام مع am · الترتيبي (‑te حتى 19 · ‑ste من 20 · الشواذ) · النهاية حسب السؤال (der ‑e / am ‑en / den ‑en) · الموعد frei/besetzt + Einladung/Absage + lieb-/Moment/enden
    for (const x of ["التاريخ والموعد بأربع خطوات", "am Montag · am Dienstag · am Mittwoch · am Donnerstag · am Freitag · am Samstag · am Sonntag · am Wochenende", "Am Dienstag habe ich Zeit. (قوس u9-d5)", "من 1 إلى 19 بـ‑te", "من 20 فصاعداً بـ‑ste", "eins → erste · drei → dritte · sieben → siebte", "der 2. April = der zweite April", "Heute ist der zweite April. (der + ‑e بعد ist)", "am zwölften April (am + ‑en)", "den achtzehnten April in meinen Kalender. (den + ‑en)", "~~der zweite von April~~", "frei للشخص والمكان", "besetzt للمكان والموعد", "die Einladung والجواب: Vielen Dank für die Einladung! أو die Absage", "Der Kurs endet am siebzehnten April. (endet بـ‑et)", "Einen kleinen Moment!", "Liebe + مؤنث (Liebe Lena, · Liebe Oma,) وLieber + مذكر (Lieber Yusuf, · Lieber Vater,)"])
      expect(td.payload.ruleAr).toContain(x);
    for (const x of ["~~Dienstag habe ich Zeit.~~", "~~In Dienstag habe ich Zeit.~~", "~~der zweite von April~~", "~~der zwei April~~", "~~am zwölfte April~~", "~~den achtzehnte April~~", "خريطة التداخل 10‑ي"]) expect(td.payload.contrastAr).toContain(x);
    expect(td.payload.limitsAr).toHaveLength(4);
    expect(td.payload.limitsAr.join(" ")).toMatch(/Juli إلى Dezember/);
    expect(td.payload.limitsAr.join(" ")).toMatch(/Perfekt u10-d3/);
    expect(td.payload.beads).toEqual(["Am", "Samstag", "bin", "ich", "frei."]);
    expect(td.payload.properNouns).toEqual(["Lena", "Yusuf"]);
    // الأعداد الترتيبية في نصوص الدرس كلها على القاعدة (D167: الجذع datum مرساة) — ولا شهر غير مدروس (Juli–Dezember) ولا Perfekt ولا «Lenas» (إضافة ملكية غير مدروسة — أُعيدت صياغة za-19)
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]), g: l.ziel.de, t: [l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de] });
    expect(shown).not.toMatch(/\b(Juli|August|September|Oktober|November|Dezember|Lenas|gehabt|hatte|war|wichtig|Welcher Tag ist heute)\b/);
    const taughtAll = knownStems(taughtUpTo(l, realLessons, words));
    for (const o of ["zweite", "siebzehnten", "erste", "dritte", "siebte", "zwanzigste", "vierzehnten", "achtzehnten", "dreißigsten", "zwölfte", "zwölften", "einundzwanzigsten"]) expect(ordinalKnown(o, taughtAll), o).toBe(true);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Tunis", "Mia"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // مثالا كلمتين صُحّحا (datum كان بـwichtig · einladung كان باسم علم/صياغة قديمة) — بكلمات الدرس نفسه · والنواة الثلاث بأمثلة نظيفة
    const w = (id: string) => words.find((x) => x.id === id)!;
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect([sample("datum"), sample("einladung"), sample("lieb"), sample("moment"), sample("enden")]).toEqual(["Das Datum steht im Kalender.", "Die Einladung ist für Samstag.", "Liebe Oma, ich komme am Sonntag!", "Hast du einen Moment Zeit?", "Der Kurs endet um zwölf."]);
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|wichtig/);
    for (const id of ["datum", "einladung", "lieb", "moment", "enden"]) expect(w(id).sampleSentence?.sourceLesson).toBe("a1-u10-d2");
    for (const id of ["lieb", "moment", "enden"]) expect(w(id).goetheList).toEqual(["A1", "A2"]);
    expect(w("absage").goetheList).toEqual([]); // ليست في قائمة SD1 — تبقى [] (D110: لا تُكتب يدوياً)
    // الحوار (za-1..20) مكالمة فيديو في اليوم الرابع بتونس (N-037/N-100): الخميس 2 أبريل · الدورة تنتهي 17 · يوسف يعود 12 · عيد لينا 18 (سبت) في المطعم — لا لقاء في مكان واحد
    const script = JSON.parse(readFileSync(join(CONTENT, "audio-scripts/a1-u10-d2-der-zweite-april.json"), "utf8")) as { lines: { id: string; speaker: string; text: string }[] };
    expect(script.lines).toHaveLength(20);
    expect(script.lines.find((x) => x.id === "za-2")?.text).toBe("Heute ist Donnerstag, der zweite April. Und am Samstag ist Wochenende!");
    expect(script.lines.find((x) => x.id === "za-19")?.text).toBe("Gut. Ich schreibe den achtzehnten April in meinen Kalender: Lena hat Geburtstag!");
    expect(script.lines.map((x) => x.text).join(" ")).not.toMatch(/\bwir (sind|gehen|fahren) (hier|zusammen)\b|hole dich|bringe dich|\bdann\b|\bweil\b|\bwarum\b|\bleider\b|\bsagt\b|\bwar\b|\bLenas\b|Welcher Tag ist heute|Einen Moment, bitte|Danke für die Einladung!/i);
    // N-020 لهذا الدرس: الاستدعاء من دروس سابقة (Termin · reservieren · Montag — u3-d4/u5-d5/u3-d4) كما كان
    expect(l.warmup.cardIds).toEqual(["termin", "reservieren", "montag"]);
    expect(l.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
    // الاستدعاء المعلن كلمةً كاملة (أو جذع فعل) لا بادئة (N-102)
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const toks = new Set(fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" })))).split(/[^a-z0-9]+/));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        const ok = [fold(ref), fold(ref) + "n", fold(ref) + "e", fold(ref) + "en", fold(ref) + "s", fold(ref) + "t"].some((f) => toks.has(f));
        expect(ok, `${st.type}: ${ref} لا يظهر في بنود المحطة كلمةً كاملة`).toBe(true);
      }
    }
    // الحوار الجديد (za-1..20) كله في الاستماع والإملاء مرة واحدة — الإملاء من الأسطر البطيئة التسعة (≤132) مع خمسة مقاطع كلمات (النواة الثلاث + datum + kalender)، والأسرع الأحد عشر كلها استماعاً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("za-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `za-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-datum", "word-enden", "word-kalender", "word-lieb", "word-moment"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; textDe: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `za-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(11);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    const textDe = new Map(manifest.tracks.map((t) => [t.id, t.textDe]));
    for (const i of dictation.items) expect(i.speakText).toBe(textDe.get(String(i.audioId)));
    // معجم النطق: لا مدخل جديد في D167 (72 ← 74 بعد D168: geregnet · geholt) — April (8 أسطر) · Kurs (za-3 · za-4) · Onkel (za-12) مدخلات قائمة سُجّلت أسطرها الجديدة (N-099)
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; regeneratedTracks: string[] }[] };
    expect(lex.entries).toHaveLength(74);
    const regen = (word: string) => lex.entries.find((x) => x.word === word)?.regeneratedTracks.filter((t) => t.startsWith("za-"));
    expect(regen("April")).toEqual(["za-2", "za-3", "za-4", "za-5", "za-6", "za-8", "za-19", "za-20"]);
    expect(regen("Kurs")).toEqual(["za-3", "za-4"]);
    expect(regen("Onkel")).toEqual(["za-12"]);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => f.includes(norm(a))))).toEqual([]);
    expect(quizAnswers.filter((a) => l.praesentation.wordIds.includes(a.toLowerCase()))).toEqual([]);
    // المصائد الثلاث (am مع اليوم · الترتيبي + الشهر مباشرة · ‑en بعد am/den) — كل واحدة بـ10‑ي
    expect(l.zusammenfassung.warningCards.map((c) => c.commonError.de)).toEqual(["~~an Dienstag~~ · ~~in Dienstag~~ · ~~Dienstag habe ich Zeit.~~", "~~der zwei April~~ · ~~der zweite von April~~", "~~am zwölfte April~~ · ~~den achtzehnte April~~"]);
    for (const c of l.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم (مع أعلام الخطة)
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u10-d3 مُرقّى (D168): صفر نقص — 63 بنداً · 4 أنواع · Quiz 6 · 14 كلمة · ars-perfekt-haben (جديدة) · نواة früher/gewinnen · ستة أمثلة صُحّحت (N-108) · كل 20 سطراً وستة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u10-d3")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u10-d3")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([63, 4, 6, 14]);
    // الكلمات الأربع عشرة كلها جديدة (لا تكرار من الوحدات 1–9 ولا من u10-d1..d2) — والنواة (D113: früher · gewinnen) في آخر القائمة
    const earlier = new Set(realLessons.filter((x) => x.unit <= 9 || (x.unit === 10 && x.day <= 2)).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(l.praesentation.wordIds).toEqual(["gestern", "vorgestern", "letzt", "bringen", "holen", "lernen", "sagen", "fragen", "denken", "brief", "paket", "spaziergang", "frueher", "gewinnen"]);
    // قاعدة اليوم جديدة: ars-perfekt-haben (كانت مُشاراً إليها بلا ملف — تشاركها u10-d4 وu10-d6)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-perfekt-haben"]);
    const ph = rules.get("ars-perfekt-haben")!;
    expect(ph.usedInLessons).toEqual(["a1-u10-d3", "a1-u10-d4", "a1-u10-d6"]);
    expect(ph.payload.ruleDe).toContain("Was hast du gestern gemacht? — Gestern habe ich Deutsch gelernt.");
    expect(ph.payload.ruleDe).not.toMatch(/\b(Pizza|gehabt|war|hatte|bin|ist|gegangen|gefahren)\b/);
    // الماضي المركّب مع haben بأربع خطوات: جزءان (haben ثانياً + التصريف آخراً) · المنتظم ge‑…‑t (‑et بعد t/d) · القوي ge‑…‑en يُحفظ + المختلطان · ظروف الزمن والسؤال
    for (const x of ["الماضي المركّب مع haben بأربع خطوات", "haben مصرَّفاً في الموضع الثاني", "والتصريف الثالث (Partizip II) في آخر الجملة", "قوس الجملة (u9-d5) بالماضي", "ge‑ + الجذع + ‑t", "arbeiten → gearbeitet", "essen → gegessen", "gewinnen → gewonnen", "bringen → gebracht · denken → gedacht", "Vorgestern hat es geregnet.", "Früher habe ich viel Fußball gespielt.", "Was hast du gestern gemacht?"])
      expect(ph.payload.ruleAr).toContain(x);
    for (const x of ["~~Gestern ich Deutsch gelernt.~~", "~~Gestern lerne ich Deutsch.~~", "~~Ich habe gegessen Fisch.~~", "~~gegesst~~", "~~geschreibt~~", "خريطة التداخل 10‑ي"]) expect(ph.payload.contrastAr).toContain(x);
    expect(ph.payload.limitsAr).toHaveLength(4);
    expect(ph.payload.limitsAr.join(" ")).toMatch(/sein .*u11-d3/);
    expect(ph.payload.limitsAr.join(" ")).toMatch(/war وhatte/);
    expect(ph.payload.limitsAr.join(" ")).not.toMatch(/\b(vereinbart|weil)\b/); // N-103: لا كلمة من نواة u10-d4/u10-d5 حتى في الحدود
    expect(ph.payload.beads).toEqual(["Gestern", "habe", "ich", "Deutsch", "gelernt."]);
    expect(ph.payload.properNouns).toEqual(["Mia"]);
    // لا Perfekt مع sein ولا Präteritum ولا «gehabt» ولا كلمات غير مدروسة (pizza · arzt · lecker · dann) في ما يُعرض — ولا الخطأ القديم «gegeessen» (N-108)
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise.a]), g: l.ziel.de, t: [l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de] });
    expect(shown).not.toMatch(/\b(gehabt|hatte|war|gegangen|gefahren|geflogen|gewesen|Pizza|Arzt|lecker|dann|gegeessen|Lenas)\b/);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Tunis", "Mia", "Berlin"]);
    expect(e.misspellings ?? []).toEqual([]); // الصيغ المشطوبة (gegesst · gelest · geschlaft) يعرفها الحارس بالجذع المتساهل (N-103) — فلا تُعلن
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // ستة أمثلة صُحّحت (N-108: pizza · arzt · «gearbeiten» · أسماء علم) — بكلمات الدرس نفسه · والنواة بأمثلة نظيفة
    const w = (id: string) => words.find((x) => x.id === id)!;
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect([sample("gestern"), sample("vorgestern"), sample("letzt"), sample("fragen"), sample("paket"), sample("denken"), sample("frueher"), sample("gewinnen")]).toEqual([
      "Gestern habe ich Fisch gekocht.", "Vorgestern habe ich Fußball gespielt.", "Letzte Woche habe ich viel gearbeitet.", "Ich habe meine Lehrerin gefragt.", "Das Paket ist von meiner Oma.", "Ich habe an dich gedacht.", "Früher habe ich viel Fußball gespielt.", "Wir haben das Spiel gewonnen.",
    ]);
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Pizza|Arzt|gearbeiten/);
    for (const id of ["gestern", "vorgestern", "letzt", "fragen", "paket", "denken", "frueher", "gewinnen"]) expect(w(id).sampleSentence?.sourceLesson).toBe("a1-u10-d3");
    for (const id of ["frueher", "gewinnen"]) expect(w(id).goetheList).toEqual(["A1", "A2"]);
    expect(w("frueher").wordFamily).toEqual(["frueh"]);
    expect(w("gewinnen").forms).toMatchObject({ praesens3s: "gewinnt", perfekt: "hat gewonnen" });
    // الحوار (wg-1..20) مكالمة فيديو في اليوم الخامس بتونس (N-037/N-100): الجمعة 3 أبريل · «Was hast du gestern gemacht?» — لا sein-Perfekt ولا war/hatte ولا gehabt ولا كلمات غير مدروسة
    const script = JSON.parse(readFileSync(join(CONTENT, "audio-scripts/a1-u10-d3-was-hast-du-gestern-gemacht.json"), "utf8")) as { lines: { id: string; speaker: string; text: string }[] };
    expect(script.lines).toHaveLength(20);
    expect(script.lines.find((x) => x.id === "wg-1")?.text).toBe("Hallo Yusuf! Was hast du gestern gemacht?");
    expect(script.lines.map((x) => x.text).join(" ")).not.toMatch(/\b(gehabt|hatte|war|gegangen|gefahren|Pizza|Arzt|lecker|dann|schon|Lenas)\b|\bHa!/);
    // N-020 لهذا الدرس: الاستدعاء من دروس سابقة (machen · essen · kaufen) كما كان
    expect(l.warmup.cardIds).toEqual(["machen", "essen", "kaufen"]);
    expect(l.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
    // الاستدعاء المعلن كلمةً كاملة (أو جذع فعل) لا بادئة (N-102)
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const toks = new Set(fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" })))).split(/[^a-z0-9]+/));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        const ok = [fold(ref), fold(ref) + "n", fold(ref) + "e", fold(ref) + "en", fold(ref) + "s", fold(ref) + "t"].some((f) => toks.has(f));
        expect(ok, `${st.type}: ${ref} لا يظهر في بنود المحطة كلمةً كاملة`).toBe(true);
      }
    }
    // الحوار الجديد (wg-1..20) كله في الاستماع والإملاء مرة واحدة — الإملاء من الأسطر البطيئة الستة (≤132) مع ستة مقاطع كلمات (النواة + gestern · vorgestern · brief · paket)، والأسرع الأربعة عشر كلها استماعاً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("wg-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `wg-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-brief", "word-frueher", "word-gestern", "word-gewinnen", "word-paket", "word-vorgestern"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; textDe: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `wg-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(14);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    const textDe = new Map(manifest.tracks.map((t) => [t.id, t.textDe]));
    for (const i of dictation.items) expect(i.speakText).toBe(textDe.get(String(i.audioId)));
    // معجم النطق: مدخلان جديدان (geregnet · geholt) + مدخلات قائمة سُجّلت أسطرها الجديدة (Onkel · Fußball · regnet · Spaziergang — N-099)
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; regeneratedTracks: string[] }[] };
    expect(lex.entries).toHaveLength(74);
    const regen = (word: string) => lex.entries.find((x) => x.word === word)?.regeneratedTracks.filter((t) => t.startsWith("wg-"));
    expect(regen("geregnet")).toEqual(["wg-9", "wg-12"]);
    expect(regen("geholt")).toEqual(["wg-15"]);
    expect(regen("Onkel")).toEqual(["wg-7"]);
    expect(regen("Fußball")).toEqual(["wg-9", "wg-10"]);
    expect(regen("regnet")).toEqual(["wg-13"]);
    expect(regen("Spaziergang")).toEqual(["wg-19", "wg-20"]);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => f.includes(norm(a))))).toEqual([]);
    expect(quizAnswers.filter((a) => l.praesentation.wordIds.includes(a.toLowerCase()))).toEqual([]);
    // المصائد الثلاث (haben يسقط/يُستبدل بالحاضر · التصريف قبل المفعول · تعميم ge‑…‑t على القوي) — كل واحدة بـ10‑ي
    expect(l.zusammenfassung.warningCards.map((c) => c.commonError.de)).toEqual(["~~Gestern ich habe Deutsch gelernt.~~ · ~~Gestern lerne ich Deutsch.~~", "~~Ich habe gegessen Fisch.~~ · ~~Gestern habe ich gelernt Deutsch.~~", "~~gegesst~~ · ~~gelest~~ · ~~geschlaft~~"]);
    for (const c of l.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم (مع أعلام الخطة)
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u11-d1 مُرقّى (D171): صفر نقص — 69 بنداً · 4 أنواع · Quiz 6 · 15 كلمة · ars-koerper (جديدة) · نواة der Teil/tun/weh tun · ثلاثة أمثلة صُحّحت · كل 20 سطراً وتسعة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u11-d1")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u11-d1")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([69, 4, 6, 15]);
    // الكلمات الخمس عشرة كلها جديدة (لا تكرار من الوحدات 1–10) — والنواة (D113: der Teil · tun · weh tun) في آخر القائمة
    const earlier = new Set(realLessons.filter((x) => x.unit <= 10).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(l.praesentation.wordIds).toEqual(["kopf", "hand", "arm", "bein", "ruecken", "bauch", "hals", "auge", "nase", "mund", "zahn", "finger", "teil", "tun", "weh-tun"]);
    // قاعدة اليوم جديدة: ars-koerper (كانت مُشاراً إليها بلا ملف — تشاركها u11-d6)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-koerper"]);
    const ko = rules.get("ars-koerper")!;
    expect(ko.usedInLessons).toEqual(["a1-u11-d1", "a1-u11-d6"]);
    expect(ko.payload.ruleDe).toContain("Mir tut der Kopf weh.");
    expect(ko.payload.ruleDe).toContain("Meine Beine tun weh.");
    expect(ko.payload.ruleDe).toContain("die Hand → die Hände");
    expect(ko.payload.ruleDe).toContain("Was kann ich für dich tun?");
    expect(ko.payload.ruleDe).toContain("Die Aufgabe hat zwei Teile");
    expect(ko.payload.ruleDe).not.toMatch(/\b(Körper|Arzt|Ärztin|Schmerzen|Fieber|bleibe|bleiben|fühle|rot|blau|tue|tust|war|hatte)\b/);
    expect(ko.payload.ruleDe).not.toMatch(/Mein Kopf tut weh\.|Mir tut der Hals weh\.|Mein Arm tut weh\.|Mein Bein tut weh\.|Wo tut es weh\?/); // D108: أمثلة SD1 الرسمية لـKopf/Hals/Arm/weh tun حرفياً
    // الجسم بأربع خطوات: الجنس بلا منطق · أنماط الجمع الأربعة · weh tun (tut/tun · weh آخراً · الداتيف) · tun وder Teil
    for (const x of ["اثنا عشر جزءاً بجنسها", "die Hand أنثى وdas Bein محايد", "أومالوت + e: die Hände", "بلا نهاية: die Finger", "weh tun = «يؤلم»", "Meine Beine tun weh.", "Mir tut der Kopf weh.", "Seit wann tut dein Hals weh?", "tun = «يفعل»", "der Teil (‑e) = «الجزء»"])
      expect(ko.payload.ruleAr).toContain(x);
    for (const x of ["~~die Bein~~", "~~die Auge~~", "~~der Nase~~", "~~die Hands~~", "~~die Zahns~~", "~~Mein Kopf weh tut.~~", "~~Meine Beine tut weh.~~", "خريطة التداخل 10‑ي"]) expect(ko.payload.contrastAr).toContain(x);
    expect(ko.payload.limitsAr).toHaveLength(4);
    expect(ko.payload.limitsAr.join(" ")).toMatch(/u11-d2/);
    expect(ko.payload.limitsAr.join(" ")).toMatch(/sein .*u11-d3/);
    expect(ko.payload.limitsAr.join(" ")).toMatch(/u11-d4/);
    expect(ko.payload.limitsAr.join(" ")).toMatch(/N-107/);
    expect(ko.payload.limitsAr.join(" ")).not.toMatch(/\b(Arzt|Ärztin|Schmerz|Fieber|Erkältung|Tablette|bleiben|liegen|fühlen|Wunde|Blut|rot|blau)\b/); // N-103: لا كلمة من u11-d2..d4 بصيغتها الألمانية حتى في الحدود
    expect(ko.payload.beads).toEqual(["Mir", "tut", "der", "Kopf", "weh."]);
    expect(ko.payload.properNouns).toEqual([]);
    // لا Körper (ليست في SD1 ولا في المقرر) ولا Arzt/Fieber/Schmerzen (u11-d2) ولا bleiben/liegen (u11-d3) ولا fühlen (u11-d4) ولا rot/blau (N-107) ولا tue/tust (N-112) في ما يُعرض — ولا مثال SD1 الرسمي حرفياً
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise.a]), g: l.ziel.de, t: [l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de] });
    expect(shown).not.toMatch(/\b(Körper|Arzt|Ärztin|Schmerzen|Kopfschmerzen|Fieber|bleibe|bleiben|liege|liegen|fühle|rot|blau|tue|tust|war|hatte|Lenas|Mama)\b|Mein Kopf tut weh\.|Mir tut der Hals weh\.|Mein Arm tut weh\.|Mein Bein tut weh\.|Wo tut es weh\?|Wie geht es dir\?/);
    expect(e.properNouns).toEqual(["Yusuf", "Lena"]);
    expect(e.misspellings ?? []).toEqual([]); // المصائد الثلاث جنس وجمع وترتيب بكلمات حقيقية — لا صيغة مشطوبة تحتاج إعلاناً (Hands/Zahns/Kopfs/Fuße تُشطب في النص وتُقرأ كجذوع معروفة)
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // ثلاثة أمثلة صُحّحت: kopf («Mein Kopf tut weh.» = مثال SD1 الرسمي — D108) · auge («Mein Auge ist rot.» — rot بلا درس N-107) — والنواة بأمثلة نظيفة (weh tun «Meine Beine tun weh.» بعد أن كان المقترح «Mir tut der Hals weh.» مثال SD1 لـHals)
    const w = (id: string) => words.find((x) => x.id === id)!;
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect([sample("kopf"), sample("auge"), sample("teil"), sample("tun"), sample("weh-tun")]).toEqual([
      "Mir tut der Kopf weh.", "Mach die Augen zu!", "Die Aufgabe hat zwei Teile.", "Was kann ich für dich tun?", "Meine Beine tun weh.",
    ]);
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|rot|blau|Arzt|Körper|Mein Kopf tut weh\.|Mir tut der Hals weh\./);
    for (const id of l.praesentation.wordIds) expect(w(id).sampleSentence?.sourceLesson).toBe("a1-u11-d1");
    for (const id of ["teil", "tun", "weh-tun"]) expect(w(id).goetheList).toEqual(["A1", "A2"]);
    expect([w("teil").gender, w("teil").plural]).toEqual(["der", "die Teile"]);
    expect(w("tun").forms).toMatchObject({ praesens3s: "tut", perfekt: "hat getan" });
    expect(w("weh-tun").forms).toMatchObject({ praesens3s: "tut weh", perfekt: "hat wehgetan" });
    expect([w("weh-tun").chunk, w("weh-tun").wordFamily, w("tun").wordFamily]).toEqual([true, ["tun"], ["weh-tun"]]);
    // الحوار (kw-1..20) مكالمة فيديو مساء اليوم الثامن بتونس (N-037/N-100): الاثنين 6 أبريل · «Hallo Lena! Geht es dir heute gut? Bist du noch müde?» — لا Arzt/Fieber/bleiben/fühlen/Körper/Mama ولا war/hatte
    const script = JSON.parse(readFileSync(join(CONTENT, "audio-scripts/a1-u11-d1-alles-tut-weh.json"), "utf8")) as { lines: { id: string; speaker: string; text: string }[] };
    expect(script.lines).toHaveLength(20);
    expect(script.lines.find((x) => x.id === "kw-1")?.text).toBe("Hallo Lena! Geht es dir heute gut? Bist du noch müde?");
    expect(script.lines.map((x) => x.text).join(" ")).not.toMatch(/\b(Körper|Arzt|Ärztin|Fieber|Schmerzen|bleibe|bleiben|fühle|rot|blau|tue|tust|Mama|gehabt|hatte|war|Lenas|Oh)\b|Mir tut der Hals weh\.|Wo tut es weh\?/);
    expect(script.lines.filter((x) => /\bweh\b/.test(x.text))).toHaveLength(8);
    // N-020 لهذا الدرس: الاستدعاء من دروس سابقة (der Fuß · das Haar · das Ohr — أجزاء مدروسة من قبل) كما كان
    expect(l.warmup.cardIds).toEqual(["fuss", "haar", "ohr"]);
    expect(l.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
    // الاستدعاء المعلن كلمةً كاملة (أو جذع فعل) لا بادئة (N-102 — وN-110: zeigen/aufgabe/schlafen بتصريفها أو في speakText فقط لم تُعلن)
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const toks = new Set(fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" })))).split(/[^a-z0-9]+/));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        const ok = [fold(ref), fold(ref) + "n", fold(ref) + "e", fold(ref) + "en", fold(ref) + "s", fold(ref) + "t"].some((f) => toks.has(f));
        expect(ok, `${st.type}: ${ref} لا يظهر في بنود المحطة كلمةً كاملة`).toBe(true);
      }
    }
    // الحوار الجديد (kw-1..20) كله في الاستماع والإملاء مرة واحدة — الإملاء من الأسطر البطيئة الثلاثة (≤132) مع تسعة مقاطع كلمات (النواة الثلاث + hand · zahn · auge · bein · ruecken · bauch)، والأسرع السبعة عشر كلها استماعاً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("kw-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `kw-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-auge", "word-bauch", "word-bein", "word-hand", "word-ruecken", "word-teil", "word-tun", "word-weh-tun", "word-zahn"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; textDe: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `kw-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(17);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    const textDe = new Map(manifest.tracks.map((t) => [t.id, t.textDe]));
    for (const i of dictation.items) expect(i.speakText).toBe(textDe.get(String(i.audioId)));
    // معجم النطق: لا مدخل جديد في D171 (74) — أربعة مداخل قائمة سُجّلت أسطرها الجديدة (Hals · Fußball · okay · Kurs — N-099)
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; regeneratedTracks: string[] }[] };
    expect(lex.entries).toHaveLength(74);
    const regen = (word: string) => lex.entries.find((x) => x.word === word)?.regeneratedTracks.filter((t) => t.startsWith("kw-"));
    expect(regen("Hals")).toEqual(["kw-2", "kw-3", "kw-16"]);
    expect(regen("Fußball")).toEqual(["kw-4", "kw-6"]);
    expect(regen("okay")).toEqual(["kw-6"]);
    expect(regen("Kurs")).toEqual(["kw-8"]);
    expect(regen("Notfall")).toEqual([]);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => f.includes(norm(a))))).toEqual([]);
    expect(quizAnswers.filter((a) => l.praesentation.wordIds.includes(a.toLowerCase()))).toEqual([]);
    // كل إجابة Quiz من weh tun أو tun أو الجنس/الجمع أو der Teil — والمشتِّتات أخطاء جنس/جمع/ترتيب بكلمات معروفة (لا صيغ مختلقة)
    expect(quizAnswers.filter((a) => /\b(weh|tun|tut|Teil|Teile|Hände|Zähne|Füße|Beine|Ohren|Augen)\b/.test(a))).toHaveLength(18);
    // المصائد الثلاث (الجنس بلا منطق · الجمع بأومالوت لا ‑s · tut/tun وweh آخراً والداتيف) — كل واحدة بـ10‑ي
    expect(l.zusammenfassung.warningCards.map((c) => c.commonError.de)).toEqual(["~~der Hand~~ · ~~die Bein~~ · ~~die Auge~~ · ~~der Nase~~", "~~die Hands~~ · ~~die Zahns~~ · ~~die Kopfs~~ · ~~die Fuße~~", "~~Mein Kopf weh tut.~~ · ~~Meine Beine tut weh.~~ · ~~Mich tut der Kopf weh.~~"]);
    for (const c of l.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم (مع أعلام الخطة)
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u10-d5 مُرقّى (D170): صفر نقص — 66 بنداً · 4 أنواع · Quiz 6 · 15 كلمة · ars-weil-satz (جديدة) · نواة normal/der Job/verdienen · ثلاثة أمثلة صُحّحت · كل 20 سطراً وستة مقاطع كلمات مستخدمة — الوحدة 10 مكتملة", () => {
    const l = realLessons.find((x) => x.id === "a1-u10-d5")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u10-d5")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([66, 4, 6, 15]);
    // الكلمات الخمس عشرة كلها جديدة (لا تكرار من الوحدات 1–9 ولا من u10-d1..d4) — والنواة (D113: normal · der Job · verdienen) في آخر القائمة
    const earlier = new Set(realLessons.filter((x) => x.unit <= 9 || (x.unit === 10 && x.day <= 4)).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(l.praesentation.wordIds).toEqual(["weil", "warum", "deshalb", "darum", "wichtig", "dringend", "krank", "unwohl", "ruhe", "stress", "notfall", "ausruhen", "normal", "job", "verdienen"]);
    // قاعدة اليوم جديدة: ars-weil-satz (كانت مُشاراً إليها بلا ملف — تشاركها u10-d6 وu12-d4 وu12-d6)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-weil-satz"]);
    const ws = rules.get("ars-weil-satz")!;
    expect(ws.usedInLessons).toEqual(["a1-u10-d5", "a1-u10-d6", "a1-u12-d4", "a1-u12-d6"]);
    expect(ws.payload.ruleDe).toContain("Ich brauche einen Termin, weil ich krank bin.");
    expect(ws.payload.ruleDe).toContain("Yusuf kann nicht kommen, weil er lernen muss.");
    expect(ws.payload.ruleDe).toContain("Weil ich krank bin, brauche ich einen Termin.");
    expect(ws.payload.ruleDe).toContain("Ich bin krank, deshalb brauche ich einen Termin.");
    expect(ws.payload.ruleDe).not.toMatch(/\b(denn|dass|wenn|ob|Arzt|Fieber|bleibe|bleiben|fühle|gehabt|war|hatte)\b/);
    expect(ws.payload.ruleDe).not.toContain("Ich kann nicht kommen, weil ich arbeiten muss."); // D108: مثال SD1 الرسمي لـweil حرفياً — أُعيد صوغه
    // weil بأربع خطوات: المصرَّف آخراً · مع المودال/الماضي المركّب المودال/haben هو الأخير · Warum? وجملة weil المتقدّمة تقلب الرئيسية · deshalb/darum ظرفان والفعل ثانياً
    for (const x of ["weil تفتح جملة تابعة", "الفعل المصرَّف في الآخر", "weil er lernen muss", "weil ich gestern Fußball gespielt habe", "Warum? سؤال السبب", "Weil ich krank bin, brauche ich einen Termin.", "deshalb وdarum = «لهذا»", "Ich bin krank, deshalb brauche ich einen Termin."])
      expect(ws.payload.ruleAr).toContain(x);
    for (const x of ["~~Ich brauche einen Termin, weil ich bin krank.~~", "~~weil ich habe Fußball gespielt~~", "~~weil ich muss arbeiten~~", "~~Ich bin krank, deshalb ich brauche einen Termin.~~", "خريطة التداخل 10‑ي"]) expect(ws.payload.contrastAr).toContain(x);
    expect(ws.payload.limitsAr).toHaveLength(4);
    expect(ws.payload.limitsAr.join(" ")).toMatch(/denn .*u12-d4/);
    expect(ws.payload.limitsAr.join(" ")).toMatch(/dass وwenn/);
    expect(ws.payload.limitsAr.join(" ")).toMatch(/sein .*u11-d3/);
    expect(ws.payload.limitsAr.join(" ")).not.toMatch(/\b(Teil|tun|weh|Kopf|Hand|Arm|Bein|Bauch|Hals|Fieber|Erkältung)\b/); // N-103: لا كلمة من u11-d1/u11-d2 حتى في الحدود
    expect(ws.payload.beads).toEqual(["Ich", "brauche", "einen", "Termin,", "weil", "ich", "krank", "bin."]);
    expect(ws.payload.properNouns).toEqual(["Lena", "Yusuf", "Berlin", "Deutschland"]);
    // لا denn/dass/wenn ولا bleiben (u11-d3) ولا fühlen (u11-d4) ولا Arzt/Fieber (u11-d2) ولا war/hatte في ما يُعرض — ولا مثال SD1 الرسمي حرفياً
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise.a]), g: l.ziel.de, t: [l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de] });
    expect(shown).not.toMatch(/\b(denn|dass|wenn|ob|bleibe|bleiben|fühle|fühlst|Arzt|Fieber|gehabt|hatte|war|wollte|Lenas)\b|Ich kann nicht kommen, weil ich arbeiten muss\./);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Berlin", "Deutschland", "Tunesien"]);
    expect(e.misspellings ?? []).toEqual([]); // المصائد الثلاث أخطاء ترتيب بكلمات حقيقية — لا صيغة مشطوبة تحتاج إعلاناً
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // ثلاثة أمثلة صُحّحت: unwohl (fühlen غير مدروسة حتى u11-d4) · dringend («Es ist dringend.» ⊂ مثال SD1 الرسمي — D108) · stress («in der Arbeit» ⇒ im Kurs) — والنواة بأمثلة نظيفة
    const w = (id: string) => words.find((x) => x.id === id)!;
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect([sample("unwohl"), sample("dringend"), sample("stress"), sample("normal"), sample("job"), sample("verdienen")]).toEqual([
      "Mir ist heute unwohl.", "Der Termin ist dringend.", "Ich habe viel Stress im Kurs.", "Stress im Kurs ist normal.", "Meine Schwester hat einen Job im Supermarkt.", "Sie verdient nicht viel.",
    ]);
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|fühle|Arzt|Es ist dringend\./);
    for (const id of l.praesentation.wordIds) expect(w(id).sampleSentence?.sourceLesson).toBe("a1-u10-d5");
    for (const id of ["normal", "job", "verdienen"]) expect(w(id).goetheList).toEqual(["A1", "A2"]);
    expect([w("job").gender, w("job").plural]).toEqual(["der", "die Jobs"]);
    expect(w("verdienen").forms).toMatchObject({ praesens3s: "verdient", perfekt: "hat verdient" });
    // الحوار (wk-1..20) مكالمة فيديو متأخرة في اليوم السابع بتونس (N-037/N-100): الأحد 5 أبريل · «Warum rufst du so spät an? Ist das ein Notfall?» — لا denn/dass/wenn ولا bleiben ولا fühlen ولا war/hatte
    const script = JSON.parse(readFileSync(join(CONTENT, "audio-scripts/a1-u10-d5-warum-weil.json"), "utf8")) as { lines: { id: string; speaker: string; text: string }[] };
    expect(script.lines).toHaveLength(20);
    expect(script.lines.find((x) => x.id === "wk-1")?.text).toBe("Hallo Yusuf! Warum rufst du so spät an? Ist das ein Notfall?");
    expect(script.lines.map((x) => x.text).join(" ")).not.toMatch(/\b(denn|dass|wenn|bleibe|bleiben|fühle|Arzt|Fieber|gehabt|hatte|war|Lenas|Ah|Oh)\b/);
    expect(script.lines.filter((x) => /\b[Ww]eil\b/.test(x.text))).toHaveLength(5); // خمسة أسطر فيها weil (wk-3 · wk-5 · wk-10 · wk-12 · wk-17) — وdeshalb/darum في wk-16 وwk-18
    // N-020 لهذا الدرس: الاستدعاء من دروس سابقة (brauchen · müde · schlafen) كما كان
    expect(l.warmup.cardIds).toEqual(["brauchen", "muede", "schlafen"]);
    expect(l.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
    // الاستدعاء المعلن كلمةً كاملة (أو جذع فعل) لا بادئة (N-102 — وN-110: brauche/müde/gespielt لا تُحسب فلم تُعلن)
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const toks = new Set(fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" })))).split(/[^a-z0-9]+/));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        const ok = [fold(ref), fold(ref) + "n", fold(ref) + "e", fold(ref) + "en", fold(ref) + "s", fold(ref) + "t"].some((f) => toks.has(f));
        expect(ok, `${st.type}: ${ref} لا يظهر في بنود المحطة كلمةً كاملة`).toBe(true);
      }
    }
    // الحوار الجديد (wk-1..20) كله في الاستماع والإملاء مرة واحدة — الإملاء من الأسطر البطيئة الستة (≤132) مع ستة مقاطع كلمات (النواة + weil · deshalb · notfall)، والأسرع الأربعة عشر كلها استماعاً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("wk-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `wk-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-deshalb", "word-job", "word-normal", "word-notfall", "word-verdienen", "word-weil"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; textDe: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `wk-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(14);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    const textDe = new Map(manifest.tracks.map((t) => [t.id, t.textDe]));
    for (const i of dictation.items) expect(i.speakText).toBe(textDe.get(String(i.audioId)));
    // معجم النطق: لا مدخل جديد في D170 (74) — خمسة مداخل قائمة سُجّلت أسطرها الجديدة (Notfall · Fußball · Kurs · Tunesien · okay — N-099)
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; regeneratedTracks: string[] }[] };
    expect(lex.entries).toHaveLength(74);
    const regen = (word: string) => lex.entries.find((x) => x.word === word)?.regeneratedTracks.filter((t) => t.startsWith("wk-"));
    expect(regen("Notfall")).toEqual(["wk-1", "wk-2"]);
    expect(regen("Fußball")).toEqual(["wk-5"]);
    expect(regen("Kurs")).toEqual(["wk-10", "wk-11"]);
    expect(regen("Tunesien")).toEqual(["wk-15"]);
    expect(regen("okay")).toEqual(["wk-19"]);
    expect(regen("regnet")).toEqual([]);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => f.includes(norm(a))))).toEqual([]);
    expect(quizAnswers.filter((a) => l.praesentation.wordIds.includes(a.toLowerCase()))).toEqual([]);
    // كل إجابة Quiz جملة weil أو Warum أو deshalb أو من كلمات اليوم — والمشتِّتات أخطاء ترتيب بكلمات معروفة (لا صيغ مختلقة)
    expect(quizAnswers.filter((a) => /\b(weil|Warum|deshalb|Deshalb|dringend|Notfall|Job|normal|verdient|ausruhen)\b/i.test(a))).toHaveLength(18);
    // المصائد الثلاث (الفعل ثانياً في weil · المصرَّف قبل المصدر/التصريف الثالث · لا قلب بعد deshalb/جملة weil المتقدّمة) — كل واحدة بـ10‑ي
    expect(l.zusammenfassung.warningCards.map((c) => c.commonError.de)).toEqual(["~~Ich brauche einen Termin, weil ich bin krank.~~ · ~~weil ich habe keine Zeit~~", "~~weil ich habe Fußball gespielt~~ · ~~weil ich muss lernen~~", "~~Ich bin krank, deshalb ich brauche einen Termin.~~ · ~~Weil ich krank bin, ich brauche einen Termin.~~"]);
    for (const c of l.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم (مع أعلام الخطة)
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u10-d4 مُرقّى (D169): صفر نقص — 65 بنداً · 4 أنواع · Quiz 6 · 14 كلمة · ars-zeitangaben (جديدة) + ars-perfekt-haben · نواة der Anfang/der Verein · سبعة أمثلة صُحّحت (N-109) · كل 20 سطراً وستة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u10-d4")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u10-d4")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([65, 4, 6, 14]);
    // الكلمات الأربع عشرة كلها جديدة (لا تكرار من الوحدات 1–9 ولا من u10-d1..d3) — والنواة (D113: der Anfang · der Verein) في آخر القائمة
    const earlier = new Set(realLessons.filter((x) => x.unit <= 9 || (x.unit === 10 && x.day <= 3)).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(l.praesentation.wordIds).toEqual(["neulich", "damals", "vorher", "nachher", "endlich", "ploetzlich", "vereinbaren", "aufschreiben", "erinnerung", "notiz", "richtig", "falsch", "anfang", "verein"]);
    // قاعدتا اليوم: ars-perfekt-haben (من u10-d3) + ars-zeitangaben الجديدة (كانت مُشاراً إليها بلا ملف — تشاركها u10-d6 وu12-d5)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-perfekt-haben", "ars-zeitangaben"]);
    const za = rules.get("ars-zeitangaben")!;
    expect(za.usedInLessons).toEqual(["a1-u10-d4", "a1-u10-d6", "a1-u12-d5"]);
    expect(za.payload.ruleDe).toContain("Vorher habe ich eingekauft. · Ich habe vorher eingekauft.");
    expect(za.payload.ruleDe).toContain("anrufen → Ich habe angerufen.");
    expect(za.payload.ruleDe).toContain("telefonieren → Ich habe telefoniert.");
    expect(za.payload.ruleDe).not.toMatch(/\b(gehabt|war|hatte|bin|ist aufgestanden|gegangen|gefahren|Arzt|dann)\b/);
    // ظروف الزمن في الموضع الأول (يقلب الفاعل) أو بعد الفعل · المنفصلة: ‑ge‑ في الوسط كلمةً واحدة · be‑/ver‑/‑ieren بلا ge‑ · richtig/falsch بعد ist
    for (const x of ["في المقدمة فينقلب الفاعل", "داخل القوس بين haben والتصريف الثالث", "البادئة + ge + الجذع كلمة واحدة", "anrufen → angerufen", "telefonieren → telefoniert", "besuchen → besucht", "vereinbaren → vereinbart", "Deine Antwort ist richtig."]) expect(za.payload.ruleAr).toContain(x);
    for (const x of ["~~Ich habe angerufen neulich.~~", "~~Ich habe geanrufen.~~", "~~Ich habe gerufen an.~~", "~~Ich habe getelefoniert.~~", "~~Ich habe gebesucht.~~", "~~Ich habe gevereinbart.~~", "10‑ي"]) expect(za.payload.contrastAr).toContain(x);
    expect(za.payload.limitsAr).toHaveLength(4);
    expect(za.payload.limitsAr.join(" ")).toMatch(/sein .*u11-d3/);
    expect(za.payload.limitsAr.join(" ")).toMatch(/war وhatte/);
    expect(za.payload.limitsAr.join(" ")).not.toMatch(/\b(einpacken|mitbringen|losfahren|weil|normal|verdienen|Job)\b/); // N-103: لا كلمة من نواة u10-d5 ولا من منفصلات u12-d3 حتى في الحدود
    expect(za.payload.beads).toEqual(["Vorher", "habe", "ich", "eingekauft."]);
    expect(za.payload.properNouns).toEqual(["Lena", "Tunis"]);
    // لا Perfekt مع sein ولا Präteritum ولا «gehabt» ولا كلمات غير مدروسة (arzt · dann · schon) في ما يُعرض — ولا الخطأين القديمين غير المشطوبين (aufgeschreiben · geschriebenauf — N-109) — ولا «Das ist richtig/falsch» الرسميتين (D108)
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise.a]), g: l.ziel.de, t: [l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de] });
    expect(shown).not.toMatch(/\b(gehabt|hatte|war|gegangen|gefahren|geflogen|gewesen|Arzt|dann|schon|aufgeschreiben|geschriebenauf|Lenas)\b|Das ist (richtig|falsch)/);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Tunis", "Berlin"]);
    // الصيغ المشطوبة في المصيدة الثالثة ليست كلمات حقيقية في المقرر — تُعلن (بعد ‑ge‑ في be‑/ver‑/‑ieren) · «gerufen» كلمة حقيقية (rufen) فلا تُعلن (N-103)
    expect(e.misspellings).toEqual([{ wrong: "getelefoniert", right: "telefoniert" }, { wrong: "gebesucht", right: "besucht" }, { wrong: "gevereinbart", right: "vereinbart" }]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // سبعة أمثلة صُحّحت (N-109: arzt · dann · schon · «Das ist richtig/falsch» الرسميتان · أسماء علم) — بكلمات الدرس نفسه · والنواة بأمثلة نظيفة
    const w = (id: string) => words.find((x) => x.id === id)!;
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect([sample("neulich"), sample("aufschreiben"), sample("erinnerung"), sample("notiz"), sample("damals"), sample("richtig"), sample("falsch"), sample("anfang"), sample("verein")]).toEqual([
      "Neulich habe ich meine Oma angerufen.", "Ich habe den Termin aufgeschrieben.", "Ich habe im Handy eine Erinnerung gemacht.", "Ich habe eine Notiz geschrieben.", "Damals habe ich in Tunesien gewohnt.", "Deine Antwort ist richtig.", "Das Datum ist falsch.", "Am Anfang habe ich wenig verstanden.", "Ich spiele im Verein Fußball.",
    ]);
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Arzt|dann|schon|Das ist (richtig|falsch)/);
    for (const id of l.praesentation.wordIds) expect(w(id).sampleSentence?.sourceLesson).toBe("a1-u10-d4");
    for (const id of ["anfang", "verein"]) expect(w(id).goetheList).toEqual(["A1", "A2"]);
    expect(w("anfang").wordFamily).toEqual(["anfangen"]);
    expect([w("anfang").gender, w("verein").gender]).toEqual(["der", "der"]);
    // الحوار (ew-1..20) مكالمة فيديو في اليوم السادس بتونس (N-037/N-100): السبت 4 أبريل · «Endlich Wochenende!» — لا sein-Perfekt ولا war/hatte ولا gehabt ولا كلمات غير مدروسة
    const script = JSON.parse(readFileSync(join(CONTENT, "audio-scripts/a1-u10-d4-endlich-wochenende.json"), "utf8")) as { lines: { id: string; speaker: string; text: string }[] };
    expect(script.lines).toHaveLength(20);
    expect(script.lines.find((x) => x.id === "ew-1")?.text).toBe("Hallo Lena! Endlich Wochenende! Was hast du heute gemacht?");
    expect(script.lines.map((x) => x.text).join(" ")).not.toMatch(/\b(gehabt|hatte|war|gegangen|gefahren|Pizza|Arzt|lecker|dann|schon|Lenas)\b|\bHa!/);
    // N-020 لهذا الدرس: الاستدعاء من دروس سابقة (anrufen · telefonieren · termin) كما كان
    expect(l.warmup.cardIds).toEqual(["anrufen", "telefonieren", "termin"]);
    expect(l.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
    // الاستدعاء المعلن كلمةً كاملة (أو جذع فعل) لا بادئة (N-102)
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const toks = new Set(fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" })))).split(/[^a-z0-9]+/));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        const ok = [fold(ref), fold(ref) + "n", fold(ref) + "e", fold(ref) + "en", fold(ref) + "s", fold(ref) + "t"].some((f) => toks.has(f));
        expect(ok, `${st.type}: ${ref} لا يظهر في بنود المحطة كلمةً كاملة`).toBe(true);
      }
    }
    // الحوار الجديد (ew-1..20) كله في الاستماع والإملاء مرة واحدة — الإملاء من ثمانية أسطر بطيئة (≤132) مع ستة مقاطع كلمات (النواة + neulich · damals · notiz · erinnerung)، والأسرع الثمانية كلها استماعاً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("ew-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `ew-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-anfang", "word-damals", "word-erinnerung", "word-neulich", "word-notiz", "word-verein"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; textDe: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `ew-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(8);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    const textDe = new Map(manifest.tracks.map((t) => [t.id, t.textDe]));
    for (const i of dictation.items) expect(i.speakText).toBe(textDe.get(String(i.audioId)));
    // معجم النطق: لا مدخل جديد في D169 (74 كما في D168) — مدخلات قائمة سُجّلت أسطرها الجديدة (Kurs · April · Fußball · nachher · Notiz · geregnet — N-099)
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; regeneratedTracks: string[] }[] };
    expect(lex.entries).toHaveLength(74);
    const regen = (word: string) => lex.entries.find((x) => x.word === word)?.regeneratedTracks.filter((t) => t.startsWith("ew-"));
    expect(regen("Kurs")).toEqual(["ew-12"]);
    expect(regen("April")).toEqual(["ew-4", "ew-19"]);
    expect(regen("Fußball")).toEqual(["ew-14"]);
    expect(regen("nachher")).toEqual(["ew-3", "ew-4", "ew-10", "ew-11"]);
    expect(regen("Notiz")).toEqual(["ew-6", "ew-18"]);
    expect(regen("geregnet")).toEqual(["ew-16", "ew-17"]);
    expect(regen("regnet")).toEqual([]);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => f.includes(norm(a))))).toEqual([]);
    expect(quizAnswers.filter((a) => l.praesentation.wordIds.includes(a.toLowerCase()))).toEqual([]);
    // المصائد الثلاث (الظرف بعد التصريف · المنفصل مفكوكاً أو ge‑ في غير موضعها · ge‑ على be‑/ver‑/‑ieren) — كل واحدة بـ10‑ي
    expect(l.zusammenfassung.warningCards.map((c) => c.commonError.de)).toEqual(["~~Ich habe angerufen neulich.~~ · ~~Ich habe eingekauft vorher.~~", "~~Ich habe gerufen an.~~ · ~~Ich habe geschrieben auf.~~", "~~getelefoniert~~ · ~~gebesucht~~ · ~~gevereinbart~~"]);
    for (const c of l.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم (مع أعلام الخطة)
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u9-d5 مُرقّى (D165): صفر نقص — 58 بنداً · 4 أنواع · Quiz 6 · 11 كلمة · ars-satzklammer + ars-tekamolo (جديدتان) · نواة andere/weiter/halten/die Polizei/die Stelle · كل 20 سطراً وتسعة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u9-d5")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u9-d5")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([58, 4, 6, 11]);
    // الكلمات الإحدى عشرة كلها جديدة (لا تكرار من الوحدات 1–8 ولا من u9-d1..d4) — والنواة الخمس (D113) في آخر القائمة
    const earlier = new Set(realLessons.filter((x) => x.unit <= 8 || (x.unit === 9 && x.day <= 4)).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(l.praesentation.wordIds.slice(-5)).toEqual(["andere", "weiter", "halten", "polizei", "stelle"]);
    // قاعدتا اليوم جديدتان: ars-satzklammer (تشاركها u9-d6 وu11-d4 وu12-d4 وu12-d6 وأسبوع الامتحان) + ars-tekamolo (u9-d6)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-satzklammer", "ars-tekamolo"]);
    const sk = rules.get("ars-satzklammer")!;
    const tk = rules.get("ars-tekamolo")!;
    expect(sk.usedInLessons).toEqual(["a1-u9-d5", "a1-u9-d6", "a1-u11-d4", "a1-u12-d4", "a1-u12-d6", "a1-u15-d1", "a1-u15-d2", "a1-u15-d3", "a1-u15-d4", "a1-u15-d5", "a1-u15-d6"]);
    expect(tk.usedInLessons).toEqual(["a1-u9-d5", "a1-u9-d6"]);
    expect(sk.payload.ruleDe).toBe("Ich fahre heute in die Stadt. · Heute fahre ich in die Stadt. · Bei uns ist der Zug immer pünktlich. — Ich steige am Bahnhof aus. · Der Bus kommt um neun an. · Bald fahren wir weiter. · Der Bus fährt heute nicht weiter. — Ich muss am Hauptbahnhof umsteigen. · Du kannst hier aussteigen. · Ich muss nicht umsteigen. — Hält der Bus im Zentrum? · Kommt der Bus pünktlich an? · Wann kommt der Bus an? · Wohin fährst du? — ich halte · du hältst · er hält · wir halten — Heute ist Stau. · Das ist der Grund. · Die Polizei steht an der Kreuzung. · An dieser Stelle hält der Bus nicht. · Die Haltestelle ist auf der anderen Seite. · Die Verbindung ist gut. · Im Fahrplan steht: um neun Uhr.");
    expect(tk.payload.ruleDe).toBe("Ich fahre heute mit dem Bus in die Stadt. · Ich fahre jeden Tag um sieben mit dem Zug zur Schule. · Ich fahre heute Abend um sechs mit dem Bus zurück. — Heute fahre ich mit dem Bus in die Stadt. · Morgen gehe ich um zehn mit meiner Schwester zu Fuß ans Ufer. · Um neun kommt der Bus am Bahnhof an. — Ich muss heute mit dem Bus in die Stadt fahren. · Mein Vater fährt am Morgen mit dem Auto zur Arbeit. · Wir gehen am Abend zu Fuß ans Ufer. — Wann? Wie? Wohin?");
    // قوس الجملة بأربع خطوات: الفعل ثانياً والقلب · القوس (جزء منفصل/مصدر) · السؤال لا يكسره · الكلمات (hält · Polizei مفرد · Stelle · andere قطعتان)
    for (const x of ["قوس الجملة (Satzklammer) بأربع خطوات", "Heute fahre ich — لا ~~Heute ich fahre~~", "Bald fahren wir weiter. (weiter يغلق القوس كجزء منفصل: weiterfahren)", "Ich muss am Hauptbahnhof umsteigen.", "Hält der Bus im Zentrum?", "Wann kommt der Bus an?", "ich halte · du hältst · er/sie/es hält · wir halten", "die Polizei (الشرطة — مفرد دائماً", "die Stelle, -n", "auf der anderen Seite · ein anderer Bus"])
      expect(sk.payload.ruleAr).toContain(x);
    // ترتيب الظروف بأربع خطوات: Wann? ← Wie? ← Wohin? · الزمن يتقدّم · القوس يحيط · اليوم قبل الساعة — بلا المصطلح الأجنبي في النصوص الألمانية
    for (const x of ["Wann? (الزمن", "Wie? (الكيفية", "Wohin?/Wo? (المكان", "Heute fahre ich mit dem Bus in die Stadt.", "Ich fahre heute Abend um sechs mit dem Bus zurück.", "heute Abend um sechs · jeden Tag um sieben", "zuerst: wann? Danach: wie? Am Ende: wohin?"])
      expect(tk.payload.ruleAr).toContain(x);
    for (const x of ["~~Heute ich fahre in die Stadt.~~", "~~Der Bus kommt an um neun.~~", "~~Ich muss umsteigen am Hauptbahnhof.~~", "~~Der Bus haltet hier.~~", "خريطة التداخل 10‑ي"]) expect(sk.payload.contrastAr).toContain(x);
    for (const x of ["~~Ich fahre mit dem Bus heute in die Stadt.~~", "~~Ich fahre in die Stadt mit dem Bus.~~", "~~Morgen ich gehe ans Ufer.~~", "خريطة التداخل 10‑ي"]) expect(tk.payload.contrastAr).toContain(x);
    expect(sk.payload.limitsAr).toHaveLength(4);
    expect(tk.payload.limitsAr).toHaveLength(4);
    expect(sk.payload.limitsAr.join(" ")).toMatch(/abfahren كاملاً .* في الوحدة 12/);
    expect(tk.payload.limitsAr.join(" ")).toMatch(/Ka \(السبب: wegen/);
    expect(sk.payload.beads).toEqual(["Heute", "kommt", "der", "Bus", "nicht", "pünktlich", "an."]);
    expect(tk.payload.beads).toEqual(["Heute", "fahre", "ich", "mit", "dem", "Bus", "zur", "Schule."]);
    // النطاق في نصوص المتعلم الألمانية: لا abfahren (fährt … ab — u12-d1) ولا weil/warum (u10-d5) ولا dann/leider/denn (u12-d4) ولا Verspätung (u12-d2) ولا المصطلح TEKAMOLO/Satzklammer
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]), g: l.ziel.de, t: [l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de] });
    expect(shown).not.toMatch(/\b(ab\.|fährt ab|abfahren|weil|warum|dann|leider|denn|Verspätung|TEKAMOLO|TeKaMoLo|Satzklammer|umsteigen am|kommt an um)\b/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Berlin"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // النواة الخمس بملفات جديدة (المولِّد D105 · goetheList مشتقة D110 — ander- بالجذع من andere كـdies-/dieser) وأمثلتها من الدرس · ومثال pünktlich صُحّح (كان بـabfahren)
    const w = (id: string) => words.find((x) => x.id === id)!;
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect([sample("andere"), sample("weiter"), sample("halten"), sample("polizei"), sample("stelle"), sample("puenktlich")]).toEqual(["Die Haltestelle ist auf der anderen Seite.", "Bald fahren wir weiter.", "Der Bus hält hier nicht.", "Die Polizei steht an der Kreuzung.", "An dieser Stelle hält der Bus nicht.", "Der Bus kommt pünktlich an."]);
    expect(w("halten").forms).toMatchObject({ praesens3s: "hält", perfekt: "hat gehalten" });
    expect(w("polizei")).toMatchObject({ gender: "die", plural: "die Polizei", goetheList: ["A1", "A2"], usedInLessons: ["a1-u9-d5"] });
    expect(w("stelle")).toMatchObject({ gender: "die", plural: "die Stellen" });
    expect(w("andere").grammarRisks).toContain("adjective-decl");
    expect(w("weiter").grammarRisks).toContain("v2-order");
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|\bdann\b|fährt .* ab\b/);
    for (const id of l.praesentation.wordIds) expect(w(id).sampleSentence?.sourceLesson).toBe("a1-u9-d5");
    // الحوار (st-1..20) مكالمة من الحافلة في تونس (N-037/N-100): يوسف متأخر بسبب الازدحام ولينا في بلدتها — لا لقاء في مكان واحد
    const script = JSON.parse(readFileSync(join(CONTENT, "audio-scripts/a1-u9-d5-im-stau.json"), "utf8")) as { lines: { id: string; speaker: string; text: string }[] };
    expect(script.lines).toHaveLength(20);
    expect(script.lines.find((x) => x.id === "st-3")?.text).toBe("Ich fahre heute mit meinem Vater in die Stadt. Aber der Bus steht — heute ist Stau.");
    expect(script.lines.find((x) => x.id === "st-12")?.text).toBe("Bei uns ist der Zug immer pünktlich. Ich fahre jeden Tag um sieben mit dem Zug zur Schule.");
    expect(script.lines.map((x) => x.text).join(" ")).not.toMatch(/\bwir (sind|gehen|fahren) (hier|zusammen)\b|hole dich|bringe dich|\bdann\b|\bweil\b|\bwarum\b|\bleider\b|fährt ab|\bsagt\b|Der Bus fährt nicht weiter\.|TEKAMOLO/i);
    // N-020 لهذا الدرس: الاستدعاء من دروس سابقة (morgen · Abfahrt · umsteigen — u3-d3/u9-d2/u9-d2) كما كان
    expect(l.warmup.cardIds).toEqual(["morgen", "abfahrt", "umsteigen"]);
    expect(l.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
    // الاستدعاء المعلن كلمةً كاملة (أو جذع فعل) لا بادئة (N-102)
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const toks = new Set(fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" })))).split(/[^a-z0-9]+/));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        const ok = [fold(ref), fold(ref) + "n", fold(ref) + "e", fold(ref) + "en", fold(ref) + "s"].some((f) => toks.has(f));
        expect(ok, `${st.type}: ${ref} لا يظهر في بنود المحطة كلمةً كاملة`).toBe(true);
      }
    }
    // الحوار الجديد (st-1..20) كله في الاستماع والإملاء مرة واحدة — الإملاء من السطر البطيء الوحيد (st-16 ≤132) مع تسعة مقاطع كلمات، والأسرع التسعة عشر كلها استماعاً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("st-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `st-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-andere", "word-fahrplan", "word-grund", "word-halten", "word-polizei", "word-stau", "word-stelle", "word-verbindung", "word-weiter"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; textDe: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `st-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(19);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    const textDe = new Map(manifest.tracks.map((t) => [t.id, t.textDe]));
    for (const i of dictation.items) expect(i.speakText).toBe(textDe.get(String(i.audioId)));
    // معجم النطق (D165): nächsten [ɛ→ɛː] (كمّية الحركة — كـnächste القائم) — السطر st-19 أُعيد
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; forms: { espeak: string; ipa: string }[]; regeneratedTracks: string[] }[] };
    expect(lex.entries.find((x) => x.word === "nächsten")).toMatchObject({ forms: [{ espeak: "nˈɛçstən", ipa: "nˈɛːçstən" }], regeneratedTracks: ["st-19"] });
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => f.includes(norm(a))))).toEqual([]);
    expect(quizAnswers.filter((a) => l.praesentation.wordIds.includes(a.toLowerCase()))).toEqual([]);
    // المصائد الثلاث (القلب · القوس المغلق · الزمن ← الكيفية ← المكان) — كل واحدة بـ10‑ي
    expect(l.zusammenfassung.warningCards.map((c) => c.commonError.de)).toEqual(["~~Heute ich fahre in die Stadt.~~ · ~~Morgen ich gehe ans Ufer.~~", "~~Der Bus kommt an um neun.~~ · ~~Ich muss umsteigen am Hauptbahnhof.~~", "~~Ich fahre mit dem Bus heute in die Stadt.~~ · ~~Ich fahre in die Stadt mit dem Bus.~~"]);
    for (const c of l.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم (مع أعلام الخطة)
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u9-d4 مُرقّى (D164): صفر نقص — 57 بنداً · 4 أنواع · Quiz 6 · 14 كلمة · ars-wechselpraep (جديدة) + ars-imperativ-sie · نواة auf sein/zu sein · كل 20 سطراً وثمانية مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u9-d4")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u9-d4")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([57, 4, 6, 14]);
    // الكلمات الأربع عشرة كلها جديدة (لا تكرار من الوحدات 1–8 ولا من u9-d1..d3) — والنواة (D113) في آخر القائمة
    const earlier = new Set(realLessons.filter((x) => x.unit <= 8 || (x.unit === 9 && x.day <= 3)).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(l.praesentation.wordIds.slice(-2)).toEqual(["auf-sein", "zu-sein"]);
    // قاعدتا اليوم: ars-wechselpraep (الجديدة — تشاركها u9-d6) + ars-imperativ-sie (من D163)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-wechselpraep", "ars-imperativ-sie"]);
    const rule = rules.get("ars-wechselpraep")!;
    expect(rule.usedInLessons).toEqual(["a1-u9-d4", "a1-u9-d6"]);
    expect(rule.payload.ruleDe).toBe("Wo? — vor der Kirche · im Tunnel · am Ufer · auf der linken Seite · hinter dem Haus · in der Nähe · an der Ecke — Wohin? — vor die Kirche · in den Tunnel · ans Ufer · auf die Brücke · über die Brücke · auf den Parkplatz · in die Stadt — gegen: gegen die Wand · gegen den Tisch · gegen zehn Uhr — hundert Meter · zweihundert Meter geradeaus — Die Apotheke ist zu. · Die Bank ist auf.");
    // أربع خطوات: التسعة باسمها · Wo? الداتيف · Wohin? الأكوزاتيف (vor جديد · ans) · gegen أكوزاتيف دائماً + Meter + auf/zu sein
    for (const x of ["Wechselpräpositionen", "an · in · auf · vor (جديد: أمام) · hinter · über · unter · neben · zwischen", "Wo? → الداتيف", "Wohin? → الأكوزاتيف", "vor der Kirche", "vor die Kirche", "an das = ans", "gegen (ضد/نحو) + الأكوزاتيف دائماً", "gegen zehn Uhr", "وبعد الرقم بلا نهاية: zweihundert Meter", "auf sein (مفتوح) ≠ zu sein (مغلق)"])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان والفروق الثلاثة — هي المصائد الثلاث (D118)
    const c = rule.payload.contrastAr;
    for (const x of ["~~Ich gehe in dem Tunnel.~~", "~~gegen der Wand~~", "~~vor Kirche~~", "خريطة التداخل 10‑ي"])
      expect(c).toContain(x);
    expect(rule.payload.limitsAr).toHaveLength(4);
    expect(rule.payload.beads).toEqual(["Wir", "gehen", "über", "die", "Brücke", "in", "den", "Tunnel."]);
    // النطاق في نصوص المتعلم الألمانية: لا liegen/setzen (u11) ولا dann (u12-d4) ولا كلمات u9-d5 (N-103: bald · pünktlich · Stau · Grund · Verbindung · Fahrplan) ولا umsteigen (u9-d6)
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]) });
    expect(shown).not.toMatch(/\b(liegt|liegen|setzt|setzen|dann|bald|pünktlich|Stau|Grund|Verbindung|Fahrplan|umsteigen|steigst .* um|Fluss|Meer|Hotel|Ampel|Rathaus)\b/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Tunis"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // النواة بملفين جديدين (المولِّد D105 · goetheList مشتقة D110) وأمثلتها من الدرس · وأمثلة an/Brücke/Nähe صُحّحت (كانت بـAmpel وFluss)
    const w = (id: string) => words.find((x) => x.id === id)!;
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect([sample("auf-sein"), sample("zu-sein"), sample("an"), sample("bruecke"), sample("naehe"), sample("vor"), sample("gegen")]).toEqual(["Die Bank ist bis vier Uhr auf.", "Die Apotheke ist heute zu.", "Die Haltestelle ist an der Ecke.", "Wir gehen über die Brücke.", "In der Nähe ist eine Apotheke.", "Die Bank ist vor der Kirche.", "Das Auto fährt gegen die Wand."]);
    expect(w("auf-sein")).toMatchObject({ wordClass: "chunk", chunk: true, wordFamily: ["an-sein", "aus-sein", "zu-sein"], goetheList: ["A1", "A2"], usedInLessons: ["a1-u9-d4"] });
    expect(w("zu-sein")).toMatchObject({ wordClass: "chunk", chunk: true, goetheList: ["A1", "A2"], usedInLessons: ["a1-u9-d4"] });
    expect(w("naehe").plural).toBe("die Nähe");
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|\bdann\b|Ampel|Fluss/);
    for (const id of l.praesentation.wordIds) expect(w(id).sampleSentence?.sourceLesson).toBe("a1-u9-d4");
    // الحوار (tn-1..20) أول مكالمة دورة بعد السفر (N-037/N-100): يوسف في بيت العائلة في تونس ولينا في بلدتها — لا لقاء في مكان واحد
    const script = JSON.parse(readFileSync(join(CONTENT, "audio-scripts/a1-u9-d4-zu-hause-in-tunis.json"), "utf8")) as { lines: { id: string; speaker: string; text: string }[] };
    expect(script.lines).toHaveLength(20);
    expect(script.lines.find((x) => x.id === "tn-2")?.text).toBe("Ja, seit zwei Stunden! Ich bin jetzt zu Hause, bei der Familie. Das Haus ist im Zentrum, in der Nähe vom Park.");
    expect(script.lines.find((x) => x.id === "tn-12")?.text).toBe("Genau! Die Apotheke ist zu, die Bank ist auf. Einfach!");
    expect(script.lines.map((x) => x.text).join(" ")).not.toMatch(/\bwir (sind|gehen|fahren) (hier|zusammen)\b|hole dich|bringe dich|\bdann\b|\bliegt\b|\bwieder\b|\bgestern\b|\bOh\b/i);
    // N-020 لهذا الدرس: الاستدعاء من دروس سابقة (Wand · Tisch · wohin — u6-d3/u6-d1/u6-d4)
    expect(l.warmup.cardIds).toEqual(["wand", "tisch", "wohin"]);
    expect(l.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
    // الاستدعاء المعلن كلمةً كاملة (أو جذع فعل) لا بادئة (N-102)
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const toks = new Set(fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" })))).split(/[^a-z0-9]+/));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        const ok = [fold(ref), fold(ref) + "n", fold(ref) + "e", fold(ref) + "en", fold(ref) + "s"].some((f) => toks.has(f));
        expect(ok, `${st.type}: ${ref} لا يظهر في بنود المحطة كلمةً كاملة`).toBe(true);
      }
    }
    // الحوار الجديد (tn-1..20) كله في الاستماع والإملاء مرة واحدة — الإملاء من السطرين البطيئين (tn-12 · tn-20 ≤132) مع ثمانية مقاطع كلمات، والأسرع الثمانية عشر كلها استماعاً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("tn-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `tn-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-auf-sein", "word-aufzug", "word-bruecke", "word-naehe", "word-parkplatz", "word-tunnel", "word-ufer", "word-zu-sein"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; textDe: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `tn-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(18);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    const textDe = new Map(manifest.tracks.map((t) => [t.id, t.textDe]));
    for (const i of dictation.items) expect(i.speakText).toBe(textDe.get(String(i.audioId)));
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => f.includes(norm(a))))).toEqual([]);
    expect(quizAnswers.filter((a) => l.praesentation.wordIds.includes(a.toLowerCase()))).toEqual([]);
    // المصائد الثلاث (الأداة بين Wo/Wohin · gegen أكوزاتيف · الأداة لا تُحذف) — كل واحدة بـ10‑ي
    expect(l.zusammenfassung.warningCards.map((c) => c.commonError.de)).toEqual(["~~Ich gehe in dem Tunnel.~~ · ~~Wir sitzen an das Ufer.~~", "~~gegen der Wand~~ · ~~gegen dem Auto~~", "~~vor Kirche~~ · ~~in Nähe~~ · ~~hinter Haus~~"]);
    for (const c of l.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم (مع أعلام الخطة)
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u9-d3 مُرقّى (D163): صفر نقص — 53 بنداً · 4 أنواع · Quiz 6 · 15 كلمة · ars-imperativ-sie (جديدة) + ars-weg-verkehr · نواة bitten/erklären/die Hilfe · كل 20 سطراً وخمسة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u9-d3")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u9-d3")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([53, 4, 6, 15]);
    // الكلمات الخمس عشرة كلها جديدة (لا تكرار من الوحدات 1–8 ولا من u9-d1..d2) — والنواة الثلاث (D113) في آخر القائمة
    const earlier = new Set(realLessons.filter((x) => x.unit <= 8 || (x.unit === 9 && x.day <= 2)).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    expect(l.praesentation.wordIds.slice(-3)).toEqual(["bitten", "erklaeren", "hilfe"]);
    // قاعدتا اليوم: ars-imperativ-sie (الجديدة — تشاركها u9-d4 وu9-d6) + ars-weg-verkehr (من D162)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-imperativ-sie", "ars-weg-verkehr"]);
    const rule = rules.get("ars-imperativ-sie")!;
    expect(rule.usedInLessons).toEqual(["a1-u9-d3", "a1-u9-d4", "a1-u9-d6"]);
    expect(rule.payload.ruleDe).toBe("Gehen Sie geradeaus! · Nehmen Sie den Bus! · Warten Sie hier, bitte! · Kommen Sie sofort! — Biegen Sie links ab! · Steigen Sie hier aus! — Helfen Sie mir, bitte! · Entschuldigung, können Sie mir helfen? — Gerne! / Kein Problem. · Ich helfe dir. — Gehen Sie zuerst geradeaus, danach biegen Sie links ab. — Können Sie mir den Weg erklären? · Ich bitte um Hilfe. · Danke für die Hilfe! — Entschuldigung, wo ist die Auskunft? — Am Eingang, links. · Der Ausgang ist dort. · Haben Sie auch einen Stadtplan?");
    // أربع خطوات: الفعل أولاً ثم Sie · الجزء المنفصل في الآخر · helfen + الداتيف والطلب بـkönnen · zuerst/danach + um Hilfe bitten + die Hilfe + erklären
    for (const x of ["الفعل أولاً كما في المصدر ثم Sie مباشرة", "Sie gehen geradeaus. (خبر) → Gehen Sie geradeaus! (أمر)", "nehmen يبقى Nehmen Sie — لا nimmt", "Biegen Sie links ab! · Steigen Sie am Hauptbahnhof aus!", "Gehen Sie nicht links!", "Helfen Sie mir! · Hilfst du mir? · Ich helfe dir. · Er hilft mir. (mir/dir — لا mich/dich)", "ich helfe · du hilfst · er hilft · Sie helfen", "Entschuldigung, können Sie mir helfen?", "zuerst (أولاً) … danach (بعد ذلك) …", "Ich bitte um Hilfe. · Ich bitte dich um Hilfe. (um + الأكوزاتيف)", "Danke für die Hilfe!", "der Eingang (المدخل) ≠ der Ausgang (المخرج)"])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان (الأمر فعلٌ أولاً · zuerst/danach · bitten um) والفروق الثلاثة — هي المصائد الثلاث (D118)
    const c = rule.payload.contrastAr;
    for (const x of ["الأمر في العربية فعلٌ أولاً أيضاً", "«أولاً … بعد ذلك …» = zuerst … danach …", "~~Biegen links ab!~~", "~~Sie biegen links ab.~~", "~~Helfen Sie mich!~~", "~~Biegen Sie ab links!~~", "~~Abbiegen Sie links!~~", "Biegen Sie links ab! · Steigen Sie hier aus!", "خريطة التداخل 10‑ي"])
      expect(c).toContain(x);
    expect(rule.payload.limitsAr).toHaveLength(4);
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/الأمر مع du وihr \(Geh! · Nimm! · Geht!\) يأتي لاحقاً/);
    expect(limits).toMatch(/in die Straße وan der Ecke \(Wechselpräpositionen\) في اليوم الرابع/);
    expect(limits).toMatch(/bitten اليوم مع um Hilfe فقط/);
    expect(limits).toMatch(/داتيف الأسماء الكامل في الوحدة 11/);
    expect(rule.payload.beads).toEqual(["Biegen", "Sie", "am", "Eingang", "links", "ab!"]);
    // النطاق في نصوص المتعلم الألمانية: لا Wechselpräpositionen (in die/an der/in den) ولا الأمر مع du (Geh!/Nimm!) ولا dann/zweite (غير مدروستين — كانتا في أمثلة zuerst/danach القديمة)
    // · ولا كلمات u9-d4 (N-103: Brücke · Tunnel · Ufer · Seite · Parkplatz · Aufzug · Nähe · Meter) ولا fragen (u10-d3)
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]) });
    expect(shown).not.toMatch(/\b(in die|an der|in den|Geh|Nimm|dann|zweite|Brücke|Tunnel|Ufer|Seite|Parkplatz|Aufzug|Nähe|Meter|fragen|Fragen Sie)\b/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Tunesien", "Tunis"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // النواة الثلاث بملفات جديدة (المولِّد D105 · goetheList مشتقة D110) وأمثلتها من الدرس · ومثالا zuerst/danach صُحّحا (كانا بـdann وzweite)
    const w = (id: string) => words.find((x) => x.id === id)!;
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect([sample("bitten"), sample("erklaeren"), sample("hilfe"), sample("zuerst"), sample("danach")]).toEqual(["Ich bitte um Hilfe.", "Können Sie mir den Weg erklären?", "Danke für die Hilfe!", "Zuerst geradeaus, danach links.", "Danach biegen Sie rechts ab."]);
    expect(w("bitten").forms).toMatchObject({ praesens3s: "bittet", perfekt: "hat gebeten" });
    expect(w("bitten").grammarRisks).toContain("feste-praep");
    expect(w("hilfe")).toMatchObject({ gender: "die", goetheList: ["A1", "A2"], usedInLessons: ["a1-u9-d3"] });
    expect(w("hilfe").srsCardTypes).toContain("gender");
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|\bdann\b|zweite/);
    for (const id of l.praesentation.wordIds) expect(w(id).sampleSentence?.sourceLesson).toBe("a1-u9-d3");
    // الحوار (wf-1..20) مكالمةُ الدورة تمرينَ أدوار (N-037/N-100): لينا «الاستعلامات» ويوسف يسأل — ثم يتبادلان؛ لا لقاء في مكان واحد، والرحلة غداً (الاثنين كما في u9-d2)
    const script = JSON.parse(readFileSync(join(CONTENT, "audio-scripts/a1-u9-d3-weg-und-hilfe.json"), "utf8")) as { lines: { id: string; speaker: string; text: string }[] };
    expect(script.lines).toHaveLength(20);
    expect(script.lines.find((x) => x.id === "wf-1")?.text).toBe("Hallo Yusuf! Heute im Kurs: der Weg — mit Sie. Ich bin die Auskunft, und du suchst den Hauptbahnhof.");
    expect(script.lines.find((x) => x.id === "wf-19")?.text).toBe("Helfen Sie mir — nicht mich. Danke, Yusuf! Kein Problem mehr.");
    expect(script.lines.map((x) => x.text).join(" ")).not.toMatch(/\bwir (sind|gehen|fahren) (hier|zusammen)\b|hole dich|bringe dich|\bdann\b|\bzweite\b|in die Straße|an der Ecke|\bfragen\b/i);
    // N-020 لهذا الدرس: الاستدعاء من دروس سابقة (nehmen · suchen · wohin — u7-d4/u7-d3/u4-d4) كما كان
    expect(l.warmup.cardIds).toEqual(["nehmen", "suchen", "wohin"]);
    expect(l.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
    // الاستدعاء المعلن كلمةً كاملة (أو جذع فعل) لا بادئة (N-102)
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    const VERB_STEMS: Record<string, string> = { zeigen: "zeig", kommen: "komm", suchen: "such", geben: "geb", fliegen: "flieg" };
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const toks = new Set(fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" })))).split(/[^a-z0-9]+/));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        const stem = VERB_STEMS[ref];
        const ok = stem ? [...toks].some((t) => t.startsWith(fold(stem))) : [fold(ref), fold(ref) + "n", fold(ref) + "e", fold(ref) + "en", fold(ref) + "s"].some((f) => toks.has(f));
        expect(ok, `${st.type}: ${ref} لا يظهر في بنود المحطة كلمةً كاملة`).toBe(true);
      }
    }
    // الحوار الجديد (wf-1..20) كله في الاستماع والإملاء مرة واحدة — الإملاء من الأسطر البطيئة (wf-4 · wf-9 · wf-12 · wf-15 · wf-20 ≤132) مع خمسة مقاطع كلمات، والأسرع السبعة كلها استماعاً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("wf-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `wf-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-auskunft", "word-bitten", "word-entschuldigung", "word-erklaeren", "word-hilfe"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; textDe: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `wf-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(7);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    const textDe = new Map(manifest.tracks.map((t) => [t.id, t.textDe]));
    for (const i of dictation.items) expect(i.speakText).toBe(textDe.get(String(i.audioId)));
    // معجم النطق (D163): erklärt [ɛ→ɛː] (كمّية الحركة — espeak يقصّر ä في هذه الصيغة وحدها) — السطران wf-15/wf-16 أُعيدا
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; forms: { espeak: string; ipa: string }[]; regeneratedTracks: string[] }[] };
    expect(lex.entries.find((x) => x.word === "erklärt")).toMatchObject({ forms: [{ espeak: "ɛɾklˈɛɾt", ipa: "ɛɾklˈɛːɾt" }], regeneratedTracks: ["wf-15", "wf-16"] });
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => f.includes(norm(a))))).toEqual([]);
    expect(quizAnswers.filter((a) => l.praesentation.wordIds.includes(a.toLowerCase()))).toEqual([]);
    // المصائد الثلاث من الملف القديم نفسها (الفعل أولاً · helfen + الداتيف · الجزء المنفصل في الآخر) — كل واحدة بـ10‑ي
    expect(l.zusammenfassung.warningCards.map((c) => c.commonError.de)).toEqual(["~~Sie biegen links ab.~~ (كأمر) · ~~Biegen links Sie ab!~~", "~~Helfen Sie mich!~~ · ~~Ich helfe dich.~~", "~~Biegen Sie ab links!~~ · ~~Abbiegen Sie links!~~"]);
    for (const c of l.zusammenfassung.warningCards) expect(c.whyArabicSpeakerFails).toContain("10‑ي");
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم (مع أعلام الخطة)
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u8-d5 مُرقّى (D160): صفر نقص — 56 بنداً · 4 أنواع · Quiz 6 · 17 كلمة · ars-von-seit-bei · كل 20 سطراً وخمسة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u8-d5")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u8-d5")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([56, 4, 6, 17]);
    const earlier = new Set(realLessons.filter((x) => x.unit <= 7 || ["a1-u8-d1", "a1-u8-d2", "a1-u8-d3", "a1-u8-d4"].includes(x.id)).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    // القاعدة المخططة نفسها (ars-von-seit-bei: «von/seit/bei + مهمة: في المتجر» في خطة v6.1) — تشاركها u8-d6 (توليف) فـusedInLessons يضمّهما (§10‑ح)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-von-seit-bei"]);
    const rule = rules.get("ars-von-seit-bei")!;
    expect(rule.usedInLessons).toEqual(["a1-u8-d5", "a1-u8-d6"]);
    expect(rule.payload.ruleDe).toBe("von · seit · bei: der/das → dem · die → der · die Monate → den Monaten — von dem = vom · bei dem = beim — vom Markt · von mir · die Jacke von Lena · seit zwei Monaten · seit einem Jahr · Seit wann? · bei mir · bei der Bäckerei · beim Bäcker");
    // ثلاث خطوات: von (المصدر والمرسل والملكية · vom · von Lena = الإضافة · ≠ aus) · seit (الداتيف · الجمع + n · einem · المضارع · Seit wann) · bei (عند · bei mir · beim · bei der)
    for (const x of ["von = «من» للمصدر والمرسل والملكية", "von + dem تُدمج دائماً: vom", "die Jacke von Lena = سترة لينا", "aus للأصل والخروج من داخل مكان", "seit = «منذ» للمدة التي بدأت في الماضي وما زالت", "seit zwei Monaten (الجمع بـn)", "seit einem Jahr (das Jahr ← einem)", "والفعل بعدها مضارعٌ دائماً", "Seit wann …? — Seit einem Jahr.", "bei = «عند»", "bei + dem = beim دائماً", "bei der Bäckerei (die ← der)"])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان («منذ» مع المضارع · «عند» = bei · «سترة لينا» ≈ von Lena) والفروق الثلاثة — هي المصائد الثلاث (D118)
    const c = rule.payload.contrastAr;
    for (const x of ["«أدّخر منذ شهرين» = Ich spare seit zwei Monaten", "«عند الخبّاز» beim Bäcker", "die Jacke von Lena", "~~Ich komme von Tunesien.~~", "~~Die Tüte ist aus dem Markt.~~", "~~seit zwei Monate~~", "~~seit ein Jahr~~", "~~bei die Bäckerei~~", "~~bei den Bäcker~~", "خريطة التداخل 10‑ي"])
      expect(c).toContain(x);
    expect(rule.payload.limitsAr).toHaveLength(4);
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/أدوات الملكية في الداتيف \(von meiner Familie · bei meiner Oma\) في الوحدة 11/);
    expect(limits).toMatch(/seit مع المضارع وحده.*vor zwei Monaten.*von … bis ….*Perfekt/);
    expect(limits).toMatch(/wohnen bei \(أسكن عند\) تأتي مع الملكية في الوحدة 11/);
    expect(limits).toMatch(/verhandeln über \+ أكوزاتيف عبارةٌ ثابتة.*Umtausch وQuittung وSonnenbrille وTüte كلمات A2/);
    expect(rule.payload.beads).toEqual(["Ich", "spare", "seit", "zwei", "Monaten", "für", "die", "Geschenke."]);
    // النطاق في نصوص المتعلم الألمانية: لا أدوات ملكية في الداتيف (meiner/meinem/deiner — وmeinen أكوزاتيف مدروس: für meinen Vater) ولا vor/bis/wenn/dann/Arzt (غير مدروسة أو لاحقة)
    // · ولا الجمل الرسمية الحرفية من SD1 («Ich wohne seit drei Jahren in Köln.» · «Ich wohne bei meinen Eltern.» · «Das Auto von Felix ist kaputt.» · «Gehen Sie bitte zum Schalter drei!») (D108)
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]) });
    expect(shown).not.toMatch(/\b(meiner|meinem|deiner|deinem|vor|bis|wenn|dann|Arzt|Bäckers)\b|seit drei Jahren|bei meinen Eltern|von Felix|zum Schalter drei/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Tunesien"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // لا نواة في هذا الدرس (الخطة: الإسناد المعلّق التالي a1-u9-d3) — والكلمات السبع عشرة من الملف القائم بأمثلة مصحّحة: von (كان «von meiner Familie» — ملكية u11) · seit (كان ⊂ SD1 «Ich wohne seit drei Jahren in Köln.») · Mode · Umtausch — وبلا أعلام
    const w = (id: string) => words.find((x) => x.id === id)!;
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|meiner|seit drei Jahren/);
    expect([sample("von"), sample("seit"), sample("mode"), sample("umtausch")]).toEqual(["Die Tüte ist vom Markt.", "Ich spare seit zwei Monaten.", "Stiefel sind jetzt Mode.", "Der Umtausch ist eine Woche möglich."]);
    // ملاحظات الجمع بالاصطلاح — stiefel/schalter كانتا «Gleich_plural» (N-085) · Mode بلا جمع والقائمة A2 تقول ‑n
    for (const id of l.praesentation.wordIds) expect(w(id).pluralRuleNote ?? "").not.toContain("Gleich_plural");
    expect(w("stiefel").pluralRuleNote).toMatch(/^بلا نهاية: der Stiefel ← die Stiefel/);
    expect(w("schalter").pluralRuleNote).toMatch(/^بلا نهاية: der Schalter ← die Schalter/);
    expect(w("mode").plural).toBe("die Moden");
    // الحوار (vb-1..20) مكالمةُ الدورة (N-037/N-100): يوسف يعرض هدايا السوق من برلين ولينا تشتري عند مخبزها في سويسرا — لا لقاء
    const script = JSON.parse(readFileSync(join(CONTENT, "audio-scripts/a1-u8-d5-eine-tuete-vom-markt.json"), "utf8")) as { lines: { id: string; speaker: string; text: string }[] };
    expect(script.lines).toHaveLength(20);
    expect(script.lines.find((x) => x.id === "vb-6")?.text).toBe("Bei mir in Tunesien verhandeln wir immer! Auf dem Markt macht das jeder so.");
    expect(script.lines.find((x) => x.id === "vb-17")?.text).toBe("Stimmt. Und ich kaufe das Geschenk für meine Oma bei der Bäckerei: einen Kuchen.");
    expect(script.lines.map((x) => x.text).join(" ")).not.toMatch(/\bwir (sind|gehen|kaufen) (hier|zusammen)\b|hole dich|bringe dich/i);
    // N-020 لهذا الدرس: الاستدعاء من دروس سابقة (markt · verkaeufer · bezahlen) — كانت preis/zahlen/verkaeufer
    expect(l.warmup.cardIds).toEqual(["markt", "verkaeufer", "bezahlen"]);
    expect(l.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const text = fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" }))));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        expect(text.includes(fold(ref).slice(0, 4)), `${st.type}: ${ref} لا يظهر في بنود المحطة`).toBe(true);
      }
    }
    // الحوار الجديد (vb-1..20) كله في الاستماع والإملاء مرة واحدة — الإملاء من الأسطر البطيئة (vb-4 · vb-18 · vb-20 ≤132) مع خمسة مقاطع كلمات، والأسرع كلها استماعاً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("vb-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `vb-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-baeckerei", "word-quittung", "word-schmuck", "word-sonnenbrille", "word-tuete"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `vb-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(14);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => f.includes(norm(a))))).toEqual([]);
    expect(quizAnswers.filter((a) => l.praesentation.wordIds.includes(a.toLowerCase()))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم (مع أعلام الخطة)
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u5-d1 مُرقّى (D141): صفر نقص — 38 بنداً · 4 أنواع · Quiz 6 · 15 كلمة · ars-essen · كل 18 سطراً وصوتا كلمتين مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u5-d1")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u5-d1")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([38, 4, 6, 15]);
    // القاعدة المخططة نفسها (ars-essen): ما لا يُعدّ بلا أداة · الواحد المعدود ein/einen · الجمع بلا أداة · المحدد der/die/das
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-essen"]);
    const rule = rules.get("ars-essen")!;
    expect(rule.payload.ruleDe).toMatch(/Fisch · Reis · Gemüse → Ø: Ich mag Fisch\. · Apfel · Ei → ein · einen: Ich esse einen Apfel\./);
    // النقل الإيجابي يُسمّى عوناً (تنوين المعدود ≈ einen Apfel) · والفروق بمبررها: «ال» العامة · تنوين المادة · «أنا جوعان» صفة
    // · والفرنسية تأثيراً معلناً في الاتجاهين: J'aime le poisson تعزز الخطأ · j'ai faim تعين (سابقة u3-d1)
    expect(rule.payload.contrastAr).toContain("ما يساعدك: التنوين على اسم يُعدّ «آكلُ تفاحةً» يقابل einen Apfel");
    expect(rule.payload.contrastAr).toContain("«أحبّ السمكَ»");
    expect(rule.payload.contrastAr).toContain("«آكلُ لحماً · آكلُ أرزاً»");
    expect(rule.payload.contrastAr).toContain("J'aime le poisson");
    expect(rule.payload.contrastAr).toContain("j'ai faim");
    // لا قاعدة لاحقة بلا إعلان: Dativ بعد mit (الوحدة 8) · صيغة الطلب المهذب في الدرس الثالث · والمعنيان المعدود والمادة
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/mit Gemüse.*Dativ.*الوحدة 8/);
    expect(limits).toMatch(/الدرس الثالث/);
    expect(limits).toMatch(/Ich esse einen Salat/);
    expect(limits).toMatch(/ich mag · du magst · er\/sie mag/);
    expect(e.properNouns).toEqual(["Lena", "Yusuf", "Berlin"]);
    // النواة D113 (die Lebensmittel · der Apfel · mögen) بالمولِّد — Lebensmittel جمع بلا جنس مفرد ولا بطاقة جنس (اصطلاح D136)
    expect(l.praesentation.wordIds).toEqual(expect.arrayContaining(["lebensmittel", "apfel", "moegen"]));
    const lm = words.find((w) => w.id === "lebensmittel")!;
    expect([lm.de, lm.gender, lm.plural, lm.srsCardTypes.includes("gender"), lm.goetheList]).toEqual(["die Lebensmittel", "none", "die Lebensmittel", false, ["A1", "A2"]]);
    const apfel = words.find((w) => w.id === "apfel")!;
    expect([apfel.de, apfel.gender, apfel.plural, apfel.grammarRisks]).toEqual(["der Apfel", "der", "die Äpfel", ["needs-ein", "plural-irregular"]]);
    const moegen = words.find((w) => w.id === "moegen")!;
    // بلا praeteritum «mochte»: deumlaut(möchte) = mochte — كانت ستمرّر möchte (الدرس الثالث) صيغةً معروفة (N-060)
    expect([moegen.de, moegen.wordClass, moegen.forms?.praesens3s, moegen.forms?.praeteritum, moegen.sampleSentence?.de]).toEqual(["mögen", "verb", "mag", undefined, "Magst du Eier?"]);
    expect(tracks.get("word-lebensmittel")?.textDe).toBe("die Lebensmittel.");
    // Nudeln: die Nudel موجودة (قائمة Goethe A2 «die Nudel, -n») — لا «جمع فقط» ولا مصيدة جمع ثالثة بعد Eltern وGeschwister
    const nudeln = words.find((w) => w.id === "nudeln")!;
    expect(nudeln.pluralRuleNote).toMatch(/جمعاً عادةً.*die Nudel/);
    expect(nudeln.ar.join(" ")).not.toMatch(/جمع فقط/);
    expect(l.zusammenfassung.warningCards.map((c) => c.commonError.de).join(" ")).not.toMatch(/Nudel|Eies/);
    // أمثلة البطاقات القديمة: lecker · frisch · Frühstück (+ zum) · gesund · kein (الدرس الرابع) · «Ich habe Hunger!» (نص رسمي حرفي)
    const sample = (id: string) => words.find((w) => w.id === id)!.sampleSentence!.de;
    expect(["wurst", "fleisch", "fisch", "ei", "reis", "obst", "gemuese", "hunger"].map(sample).join(" "))
      .not.toMatch(/lecker|frisch|Frühstück|zum|gesund|kein|Ich habe Hunger/);
    expect(l.warmup.cardIds).toEqual(["kaese", "tasse", "das-essen"]);
    // الحوار الجديد (ff-1..18) كله في الاستماع والإملاء مرة واحدة · Gemüse وLebensmittel إملاءً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("ff-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 18 }, (_, i) => `ff-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-gemuese", "word-lebensmittel"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    // N-015: الإملاء من الأسطر البطيئة وحدها (مقيسة في المانيفست) — الأسرع (ff-12 · ff-13 · ff-15) في الاستماع
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    for (const fast of ["ff-12", "ff-13", "ff-15"]) expect(listening.items.map((i) => String(i.audioId))).toContain(fast);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set(l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))));
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => String(i.q).replace("___", String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => f.includes(a)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["Gemüse", "die Lebensmittel"].includes(a))).toEqual([]);
    // المشتتات ليست ألمانية صحيحة بمعنى آخر: لا «den Fisch» (صحيحة لسمك بعينه) ولا ein Brot/einen Salat/eine Suppe/eine Wurst
    // (معدودة صحيحة) ولا «zwei Eis» (بوظتان) ولا «essen Hunger» (تركيب سليم بمعنى عبثي)
    const choices = [
      ...l.uebung.stations.flatMap((s) => s.items.flatMap((i) => (Array.isArray(i.choices) ? i.choices.map(String) : []))),
      ...l.quiz.variants.flatMap((v) => v.items.flatMap((i) => (Array.isArray(i.choices) ? i.choices.map(String) : []))),
      ...l.einstieg.pretestItems.flatMap((p) => p.choices ?? []),
    ];
    expect(choices.filter((c) => /den Fisch|ein Brot|einen Salat|eine Suppe|eine Wurst|zwei Eis\b|essen Hunger|isst Hunger/.test(c))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u5-d2 مُرقّى (D142): صفر نقص — 40 بنداً · 4 أنواع · Quiz 6 · 15 كلمة · ars-trinken · كل 20 سطراً وصوتا كلمتين مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u5-d2")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u5-d2")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([40, 4, 6, 15]);
    // القاعدة المخططة نفسها (ars-trinken — أشار إليها grammarArsenalIds ولم يُكتب لها ملف قط): المطلوب مفعول به · الوعاء ثم المشروب بلا von
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-trinken"]);
    const rule = rules.get("ars-trinken")!;
    expect(rule.payload.ruleDe).toMatch(/Einen Saft, bitte! · Ich bekomme einen Tee\. · ein Glas Tee · eine Flasche Wasser — ohne von/);
    // النقل الإيجابي يُسمّى عوناً: «شاياً من فضلك» منصوب بفعل محذوف ≈ Einen Tee, bitte! · والإضافة «كأسُ شايٍ» بلا حرف ≈ ein Glas Tee
    // · والفروق بمبررها: التنوين على المضاف إليه (المشروب) ⇒ ~~einen Glas Saft~~ · «من» والفرنسية d'eau ⇒ ~~von~~ · «شرب الحساء»
    expect(rule.payload.contrastAr).toContain("«شاياً من فضلك» تقديرها «أعطني شاياً»");
    expect(rule.payload.contrastAr).toContain("«كأسُ شايٍ» بلا حرف");
    expect(rule.payload.contrastAr).toContain("~~einen Glas Saft~~");
    expect(rule.payload.contrastAr).toContain("un verre d'eau");
    expect(rule.payload.contrastAr).toContain("«نشربو الشربة»");
    expect(rule.payload.contrastAr).not.toMatch(/اسمها نفسه من/); // أصل كلمة الشربة مختلف فيه — الاستعمال وحده حجة
    // الحدود: الحصة في الطلب (امتداد حد ars-essen) · zwei Glas/Gläser كلاهما صحيح · become تأثير إنجليزي · «أودّ» والنفي لاحقاً
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/einen Salat = طبق سلطة/);
    expect(limits).toMatch(/zwei Glas Tee.*والصيغتان صحيحتان/);
    expect(limits).toMatch(/become.*تأثيرٌ إنجليزي/);
    expect(limits).toMatch(/الدرس القادم.*الدرس الرابع/);
    expect(e.properNouns).toEqual(["Lena", "Yusuf"]);
    // النواة D113 (bar · bekommen · die Bitte) بالمولِّد — die Bitte بمعرّف صريح لأن bitte «من فضلك» موجودة (D126)
    expect(l.praesentation.wordIds).toEqual(expect.arrayContaining(["bar", "bekommen", "die-bitte"]));
    const bitte = words.find((w) => w.id === "die-bitte")!;
    expect([bitte.de, bitte.gender, bitte.plural, bitte.wordFamily, bitte.goetheList]).toEqual(["die Bitte", "die", "die Bitten", ["bitte"], ["A1", "A2"]]);
    const bek = words.find((w) => w.id === "bekommen")!;
    expect([bek.wordClass, bek.forms?.praesens3s, bek.forms?.perfekt, bek.forms?.praeteritum]).toEqual(["verb", "bekommt", "hat bekommen", undefined]);
    expect(words.find((w) => w.id === "bar")!.sampleSentence?.de).toBe("Ich zahle bar.");
    expect(tracks.get("word-die-bitte")?.textDe).toBe("die Bitte.");
    // أمثلة البطاقات القديمة: Orangensaft · Zitrone · möchte (الدرس الثالث) · ونصوص رسمية حرفية (Ein Glas Wasser, bitte · Die Speisekarte, bitte · Ein Bier, bitte)
    const sample = (id: string) => words.find((w) => w.id === id)!.sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Orangensaft|Zitrone|möchte|Ein Glas Wasser, bitte|Die Speisekarte, bitte|Ein Bier, bitte/);
    // N-069: الكحول في أمثلة البطاقات يطلبه غير يوسف وبلا متكلم (Der Mann · Die Frau)
    expect([sample("bier"), sample("wein")]).toEqual(["Der Mann bestellt ein Bier.", "Die Frau bekommt ein Glas Wein."]);
    // milch: لا «قاعدة» سوائل محايدة · glas: الكأس لا «الزجاجة الزجاجية» (die Flasche = الزجاجة)
    expect(words.find((w) => w.id === "milch")!.pluralRuleNote).not.toMatch(/رغم كونها سائلاً/);
    expect(words.find((w) => w.id === "glas")!.ar).toEqual(["الكأس (من زجاج)", "الزجاج (المادة)"]);
    expect(l.warmup.cardIds).toEqual(["tasse", "kellner", "suppe"]);
    // النطق: e الوصل في Speisekarte شوا لا [eː] (مدخل معجم — خطأ صامت خارج التدقيق الآلي N-013) · word-speisekarte أُعيد وet-2 وُلّد به
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; forms: { espeak: string; ipa: string }[]; regeneratedTracks: string[] }[] };
    expect(lex.entries.find((x) => x.word === "Speisekarte")).toMatchObject({ forms: [{ espeak: "ʃpˈaɪzeːkˌaɾtə", ipa: "ʃpˈaɪzəkˌaɾtə" }], regeneratedTracks: ["word-speisekarte", "et-2"] });
    // الحوار الجديد (et-1..20) كله في الاستماع والإملاء مرة واحدة · Wasser وdie Bitte إملاءً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("et-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `et-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-die-bitte", "word-wasser"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    // N-015: الإملاء من الأسطر البطيئة وحدها (مقيسة في المانيفست) — الأسرع الثمانية في الاستماع
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    for (const fast of ["et-3", "et-4", "et-6", "et-11", "et-13", "et-14", "et-16", "et-17"]) expect(listening.items.map((i) => String(i.audioId))).toContain(fast);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set(l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))));
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    // المقارنة بعد التطبيع (حالة الحرف وعلامات الترقيم): «Ein Wasser, bitte!» داخل «Ich bekomme ein Wasser, bitte.» تُمسك (طفرة D142)
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["Wasser", "die Bitte", "Bitte"].includes(a))).toEqual([]);
    // المشتتات ليست ألمانية صحيحة بمعنى آخر (انظر اختبار المصائد في content-units)
    const choices = [
      ...l.uebung.stations.flatMap((s) => s.items.flatMap((i) => (Array.isArray(i.choices) ? i.choices.map(String) : []))),
      ...l.quiz.variants.flatMap((v) => v.items.flatMap((i) => (Array.isArray(i.choices) ? i.choices.map(String) : []))),
      ...l.einstieg.pretestItems.flatMap((p) => p.choices ?? []),
    ];
    expect(choices.filter((c) => /\bEin (Tee|Saft|Kaffee|Wein)\b|trink\w* eine Suppe|bestellt Sie|Zahle, bitte|zwei Glas\b/.test(c))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u5-d3 مُرقّى (D143): صفر نقص — 40 بنداً · 4 أنواع · Quiz 6 · 13 كلمة · ars-moechte-wollen · كل 20 سطراً وصوتا كلمتين مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u5-d3")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u5-d3")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([40, 4, 6, 13]);
    // القاعدة المخططة نفسها (ars-moechte-wollen — أشار إليها grammarArsenalIds في d3 وd5 وd6 ولم يُكتب لها ملف قط) فتُفهرس في الثلاثة
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-moechte-wollen"]);
    const rule = rules.get("ars-moechte-wollen")!;
    expect(rule.usedInLessons).toEqual(["a1-u5-d3", "a1-u5-d6"]); // D145: d5 صار بقاعدة يومه الخاصة ars-kein-nicht-2
    expect(rule.payload.ruleDe).toMatch(/ich möchte · du möchtest · er\/sie möchte · wir\/Sie möchten — ich will · du willst · er\/sie will · wir\/Sie wollen/);
    expect(rule.payload.ruleDe).toMatch(/Was für einen Kuchen\? · Was für eine Suppe\? · Was für ein Eis\?/);
    // möchte من mögen ومعناها غيره (Ich mag Kaffee ≠ Ich möchte einen Kaffee) — وmögen في بطاقات الاستدعاء
    expect(rule.payload.ruleAr).toContain("Ich mag Kaffee = أحبّ القهوة (عادةً) · Ich möchte einen Kaffee = أودّ قهوة (الآن)");
    // النقل الإيجابي يُسمّى عوناً: «أنا شبعان» صفة ≈ Ich bin satt · «أيّ» تُعرب بموقعها ≈ ein/einen في was für ein · الفرنسية je voudrais/je veux
    // · والفروق بمبررها: «أريد» محايدة و«نحبّ قهوة» ⇒ ~~Ich will einen Kaffee.~~ · الفعل الثاني مصرَّف «يريد أن يأكلَ» و«يحبّ ياكل»
    // ⇒ ~~Er möchte isst …~~ · وzu مصدرها الأقرب الإنجليزية to («أن» لا تُترجم)
    const c = rule.payload.contrastAr;
    for (const x of ["«أنا شبعان» صفةٌ", "«أيَّ كعكةٍ تريد؟» منصوبة", "je voudrais un café", "«نحبّ قهوة»", "~~Ich will einen Kaffee.~~", "«يحبّ ياكل»", "~~Er möchte isst einen Kuchen.~~", "«أن» العربية لا تُترجم هنا بشيء", "مصدرها الأقرب الإنجليزية I want to eat (to)"])
      expect(c).toContain(x);
    // الحدود: zum قطعة الوجبات وقاعدتها في الوحدة 8 · was für بلا ein مع الجمع والمادة والتعجب · Eis يُعدّ بالحصة ≠ Ei · will الإنجليزية
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/zum = zu \+ dem.*الوحدة الثامنة/);
    expect(limits).toMatch(/Was für Tee trinkst du\?.*Was für ein Kuchen!/);
    expect(limits).toMatch(/ein Eis · zwei Eis.*zwei Eier/);
    expect(limits).toMatch(/الإنجليزية will.*تأثيرٌ إنجليزي/);
    expect(rule.payload.limitsAr.join(" ")).not.toMatch(/\bkein\b|\bnicht\b/); // النفي درس الغد — بلا ألمانيته اليوم
    expect(e.properNouns).toEqual(["Lena", "Yusuf"]);
    // النواة D113 (was für ein) بالمولِّد — قطعة chunk بمعرّف was-fuer-ein ودليل SD1
    expect(l.praesentation.wordIds).toContain("was-fuer-ein");
    const wfe = words.find((w) => w.id === "was-fuer-ein")!;
    expect([wfe.de, wfe.wordClass, wfe.chunk, wfe.goetheList, wfe.usedInLessons]).toEqual(["was für ein", "chunk", true, ["A1"], ["a1-u5-d3"]]);
    expect(wfe.sampleSentence?.de).toBe("Was für ein Eis isst du gern?"); // لا نسخ لمثال SD1 «Was für eine Farbe möchten Sie?»
    expect(tracks.get("word-was-fuer-ein")?.textDe).toBe("was für ein.");
    // أمثلة البطاقات القديمة: es gibt (u6-d3) · gleichfalls · frisch (الدرس الرابع) — وبلا أسماء علم (N-021)
    const sample = (id: string) => words.find((w) => w.id === id)!.sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Was gibt es|gleichfalls|frisch|Lena|Yusuf|Berlin/);
    expect(["mittagessen", "abendessen", "appetit", "tomate"].map(sample)).toEqual([
      "Das Mittagessen ist fertig!", "Was möchtest du zum Abendessen?", "Guten Appetit! – Danke, guten Appetit!", "Einen Salat mit Tomaten, bitte!",
    ]);
    // N-019: حقل الجمع في eis كان نصاً شارحاً — das Eis بلا جمع (Goethe: Sg.) ويُعدّ بالحصة · وschmecken بلا «يذاق»
    const eis = words.find((w) => w.id === "eis")!;
    expect([eis.gender, eis.plural]).toEqual(["das", undefined]);
    expect(eis.pluralRuleNote).toMatch(/Sg\..*ein Eis · zwei Eis.*die Eier/);
    expect(words.find((w) => w.id === "schmecken")!.ar.join(" ")).not.toMatch(/يذاق/);
    expect(l.warmup.cardIds).toEqual(["mittag", "abend", "moegen"]);
    // النطق: همس آخر الجزء الأول في المركّبين (Mittag|essen [k] و a طويلة · Abend|essen [t]) — خطأ صامت خارج التدقيق الآلي (N-013)
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; forms: { espeak: string; ipa: string }[]; regeneratedTracks: string[] }[] };
    expect(lex.entries.find((x) => x.word === "Mittagessen")).toMatchObject({ forms: [{ espeak: "mˈɪtaɡˌɛsən", ipa: "mˈɪtɑːkˌɛsən" }], regeneratedTracks: ["word-mittagessen", "me-2"] });
    expect(lex.entries.find((x) => x.word === "Abendessen")).toMatchObject({ forms: [{ espeak: "ˈɑːbəndˌɛsən", ipa: "ˈɑːbəntˌɛsən" }], regeneratedTracks: ["word-abendessen", "me-17"] });
    expect(words.find((w) => w.id === "mittagessen")!.phoneticRisks).toContain("auslaut-g");
    expect(words.find((w) => w.id === "abendessen")!.phoneticRisks).toContain("auslaut-d");
    // الحوار الجديد (me-1..20) كله في الاستماع والإملاء مرة واحدة · Kartoffel وAppetit إملاءً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("me-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `me-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-appetit", "word-kartoffel"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    // N-015: الإملاء من الأسطر البطيئة وحدها (مقيسة في المانيفست) — الأسرع الثمانية في الاستماع
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    for (const fast of ["me-2", "me-4", "me-7", "me-8", "me-10", "me-11", "me-16", "me-18"]) expect(listening.items.map((i) => String(i.audioId))).toContain(fast);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set(l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))));
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["Kartoffel", "die Kartoffel", "Appetit", "der Appetit"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u5-d4 مُرقّى (D144): صفر نقص — 40 بنداً · 4 أنواع · Quiz 6 · 14 كلمة · ars-kein-nicht · كل 20 سطراً وصوتا كلمتين مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u5-d4")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u5-d4")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([40, 4, 6, 14]);
    // القاعدة المخططة نفسها (ars-kein-nicht — أشار إليها grammarArsenalIds في d4 وd5 وd6 ولم يُكتب لها ملف قط) فتُفهرس في الثلاثة
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-kein-nicht"]);
    const rule = rules.get("ars-kein-nicht")!;
    expect(rule.usedInLessons).toEqual(["a1-u5-d4", "a1-u5-d6"]); // D145: d5 صار بقاعدة يومه الخاصة ars-kein-nicht-2
    expect(rule.payload.ruleDe).toMatch(/ein Glas → kein Glas · eine Gabel → keine Gabel · einen Löffel → keinen Löffel · Fleisch → kein Fleisch · Eier → keine Eier — Die Suppe ist nicht scharf\./);
    expect(rule.payload.ruleAr).toContain("وهي ein بحرف k في أولها، فتتصرّف مثلها تماماً");
    // النقل الإيجابي يُسمّى عوناً: «لا» النافية للجنس ≈ kein · «لا شيء» = nichts · الفرنسية pas de · والفروق بمبررها: النفي على «عند» والاسم كما هو
    // ⇒ ~~Ich habe nicht Gabel.~~ · «ليس» نفيٌ وربطٌ معاً و«موش» التونسية بلا فعل ⇒ ~~Die Suppe nicht scharf.~~ · «لا» قبل الفعل ⇒ ~~Ich nicht zahle heute.~~
    const c = rule.payload.contrastAr;
    for (const x of ["«لا ماءَ في الكأس»", "«لا شيء» = nichts", "je n'ai pas de cuillère", "«ما عنديش …»", "~~Ich habe nicht Gabel.~~", "«ليس» فعلٌ ناقص يحمل النفي والربط معاً", "«الشربة موش حارّة»", "~~Die Suppe nicht scharf.~~", "«لا أدفعُ اليوم»", "~~Ich nicht zahle heute.~~"])
      expect(c).toContain(x);
    // الحدود: تمييز kein↔nicht المفصّل غداً (بلا ألمانيته اليوم) · nichts ≠ nicht · wenig عكس viel وein bisschen · scharf بمعنيين والبقشيش
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/في الدرس القادم.*kein/);
    expect(limits).toMatch(/Ich möchte nichts.*Ich esse heute nicht.*بمعنيين/);
    expect(limits).toMatch(/viel Fleisch ↔ wenig Fleisch.*ein bisschen/);
    expect(limits).toMatch(/Das Messer ist scharf.*neun Euro ← zehn Euro/);
    expect(e.properNouns).toEqual(["Lena", "Yusuf"]);
    // النواة D113 (nichts · wenig) بالمولِّد — goetheList [A1, A2] مشتقة
    const nichts = words.find((w) => w.id === "nichts")!;
    const wenig = words.find((w) => w.id === "wenig")!;
    expect([nichts.wordClass, nichts.goetheList, nichts.usedInLessons]).toEqual(["pronoun", ["A1", "A2"], ["a1-u5-d4"]]);
    expect([wenig.wordClass, wenig.goetheList, wenig.usedInLessons]).toEqual(["adverb", ["A1", "A2"], ["a1-u5-d4"]]);
    expect([tracks.get("word-nichts")?.textDe, tracks.get("word-wenig")?.textDe]).toEqual(["nichts.", "wenig."]);
    // معرّف Löffel صُحّح (laeffel ← loeffel) مع مساره وكل إحالاته
    expect(l.praesentation.wordIds).toContain("loeffel");
    expect(words.some((w) => w.id === "laeffel")).toBe(false);
    expect([tracks.has("word-loeffel"), tracks.has("word-laeffel")]).toEqual([true, false]);
    const loeffelTrack = (JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; file: string }[] }).tracks.find((t) => t.id === "word-loeffel")!;
    expect(loeffelTrack.file).toBe("words/audio/de-DE/word-loeffel.opus");
    expect(readFileSync(join(CONTENT, loeffelTrack.file)).length).toBeGreaterThan(1000); // الملف نفسه نُقل (git mv) لا أُعيد توليده
    // أمثلة البطاقات القديمة: Chips · leer · sofort · kalte/beliebt · kleine Portion (صفة منعوتة A2) · mit dem (Dativ) · für den · zu scharf — وبلا أسماء علم
    const sample = (id: string) => words.find((w) => w.id === id)!.sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Chips|leer|sofort|beliebt|kleine|Kalte|mit dem|für den|zu scharf|Lena|Yusuf|Berlin/);
    expect(l.warmup.cardIds).toEqual(["glas", "kellner", "viel"]);
    // الحوار الجديد (kn-1..20) كله في الاستماع والإملاء مرة واحدة · nichts وwenig إملاءً
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("kn-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `kn-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-nichts", "word-wenig"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    // N-015: الإملاء من الأسطر البطيئة وحدها (مقيسة في المانيفست) — الأسرع السبعة (>132) في الاستماع
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    for (const fast of ["kn-1", "kn-5", "kn-7", "kn-8", "kn-10", "kn-17", "kn-19"]) expect(listening.items.map((i) => String(i.audioId))).toContain(fast);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set(l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))));
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["nichts", "wenig"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u5-d5 مُرقّى (D145): صفر نقص — 40 بنداً · 4 أنواع · Quiz 6 · 17 كلمة · قاعدة يومه الخاصة ars-kein-nicht-2 · كل 20 سطراً وصوتا كلمتين مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u5-d5")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u5-d5")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([40, 4, 6, 17]);
    // كان يشير إلى قاعدتي d3/d4 وحدهما (الحارس راضٍ بلا قاعدة يوم ذات اكتشاف) — صار بقاعدته الخاصة: التمييز بالنظر إلى ما قبل الاسم
    // (وفاءٌ بحدّ D144 «nicht مع المعرّف والملكية … في الدرس القادم») وخرج d5 من فهرس القاعدتين
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-kein-nicht-2"]);
    expect(l.usedArsenalIds).toEqual(["ars-kein-nicht-2"]);
    const rule = rules.get("ars-kein-nicht-2")!;
    expect(rule.usedInLessons).toEqual(["a1-u5-d5"]);
    expect(rules.get("ars-kein-nicht")!.payload.limitsAr.join(" ")).toMatch(/nicht مع الاسم المعرّف أو بكلمة ملكية.*في الدرس القادم/);
    expect(rule.payload.ruleDe).toMatch(/keinen Kaffee ↔ den Kaffee nicht · kein Kaffee ↔ nicht mein Kaffee/);
    expect(rule.payload.ruleAr).toContain("انظر إلى ما قبل الاسم ثم اختر");
    // العون المسمّى: «لا» النافية للجنس لا تدخل إلا على النكرة (≈ kein) والمعرفة تُنفى بـ«ليس» أو بنفي الفعل (≈ nicht) · «لا، شكراً» = Nein, danke
    // · والفروق: «موش قهوة/موش قهوتي» حرف واحد للحالتين ⇒ ~~Das ist kein mein Kaffee.~~ · النفي ملاصق للفعل والفرنسية pas ⇒ ~~Ich trinke nicht den Kaffee.~~
    const c = rule.payload.contrastAr;
    for (const x of ["«لا» النافية للجنس لا تدخل إلا على النكرة", "«ليست قهوتي»", "«لا، شكراً» = Nein, danke", "«موش قهوة» و«موش قهوتي»", "~~Das ist kein mein Kaffee.~~", "je ne bois pas le café", "~~Ich trinke nicht den Kaffee.~~"])
      expect(c).toContain(x);
    // الحدود: nicht قبل المعرّف للمقابلة فقط (بلا sondern اليوم) · Durst/Hunger/Zeit بـkein · Küche ≠ Kuchen (ü بلا مقابل عربي) · «المقهى» كلمة الوحدة 13
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/nicht den Kaffee.*للمقابلة|حين تقابل بين شيئين/);
    expect(limits).toMatch(/Ich habe keinen Durst/);
    expect(limits).toMatch(/die Küche.*der Kuchen.*لا مقابل لها في العربية/);
    expect(limits).toMatch(/الوحدة 13 \(خطة D113\)/);
    expect(limits).not.toMatch(/Café|sondern/);
    expect(e.properNouns).toEqual(["Lena", "Yusuf"]);
    // d5 بلا إسناد نواة (plan-status: لا درس مخطط) — والكلمات السبع عشرة كما هي
    expect(l.praesentation.wordIds).toHaveLength(17);
    // أمثلة البطاقات القديمة: braucht · Tisch (u6-d1) · an der Kasse (Dativ) · nehme (u7-d4) · Als … · أمر Sie (u9-d3) · dir — وبلا أسماء علم
    const sample = (id: string) => words.find((w) => w.id === id)!.sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/braucht|Tisch|an der|nehme|\bAls\b|Probieren Sie|\bdir\b|Lena|Yusuf|Berlin/);
    expect(l.warmup.cardIds).toEqual(["kuchen", "mein", "hunger"]);
    // الحوار الجديد (ko-1..20) كله في الاستماع والإملاء مرة واحدة · Hähnchen وMahlzeit إملاءً · وسطرا Durst/Limonade وNachtisch مسجّلان على المعجم
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("ko-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `ko-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-haehnchen", "word-mahlzeit"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; regeneratedTracks: string[] }[] };
    for (const [w, t] of [["Durst", "ko-2"], ["Limonade", "ko-2"], ["Nachtisch", "ko-11"]] as const) expect(lex.entries.find((x) => x.word === w)!.regeneratedTracks).toContain(t);
    // N-015: الإملاء من الأسطر البطيئة وحدها (مقيسة في المانيفست) — الأسرع الثمانية (>132) في الاستماع
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    for (const fast of ["ko-3", "ko-5", "ko-8", "ko-11", "ko-13", "ko-15", "ko-16", "ko-18"]) expect(listening.items.map((i) => String(i.audioId))).toContain(fast);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set(l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))));
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["Hähnchen", "das Hähnchen", "Mahlzeit", "die Mahlzeit"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u6-d1 مُرقّى (D146): صفر نقص — 41 بنداً · 4 أنواع · Quiz 6 · 13 كلمة · ars-plural-umlaut · كل 20 سطراً وثلاثة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u6-d1")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u6-d1")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([41, 4, 6, 13]);
    // القاعدة المخططة نفسها (ars-plural-umlaut — أشار إليها grammarArsenalIds ولم يُكتب لها ملف قط): الجمع يُحفظ مع الكلمة وله خمسة أنماط
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-plural-umlaut"]);
    const rule = rules.get("ars-plural-umlaut")!;
    expect(rule.usedInLessons).toEqual(["a1-u6-d1"]);
    expect(rule.payload.ruleDe).toMatch(/der Stuhl → die Stühle · der Schrank → die Schränke · der Tisch → die Tische · die Lampe → die Lampen · das Sofa → die Sofas · der Sessel → die Sessel/);
    expect(rule.payload.ruleAr).toContain("ميولٌ لا قوانين");
    // العونان المسمّيان: جمع التكسير يغيّر داخل الكلمة (كرسي ← كراسي) كالنقطتين · المعدود من 3 إلى 10 جمع بالعربية أيضاً
    // · والفروق: المعدود بعد 11–99 مفرد منصوب وبعد المئة مفرد مجرور ⇒ ~~zwanzig Stuhl~~ · ü بلا مقابل عربي ⇒ ~~die Stuhle~~ · الجنس لا ينتقل ⇒ ~~die Schrank~~
    const c = rule.payload.contrastAr;
    for (const x of ["«كرسي ← كراسي»", "«ثلاثة كراسٍ»", "«عشرون كرسياً»", "«مئة كرسيّ»", "~~zwanzig Stuhl~~", "ü حركة أمامية مدوّرة لا مقابل لها في العربية", "~~die Stuhle~~", "~~die Schrank~~"])
      expect(c).toContain(x);
    // الحدود: ‑er والنقطتان بلا نهاية (Äpfel · Mütter) · الأنماط ميول (Tische بلا نقطتين) · لا مثنى · «الأثاث» والغرف لاحقاً بلا ألمانيتهما
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/die Kinder.*die Äpfel/);
    expect(limits).toMatch(/die Tische بلا نقطتين/);
    expect(limits).toMatch(/المثنى العربي/);
    expect(limits).not.toMatch(/Möbel|Zimmer/);
    expect(e.properNouns).toEqual(["Lena", "Yusuf"]);
    // النواة D113 (breit) بالمولِّد — goetheList [A1] مشتقة
    const breit = words.find((w) => w.id === "breit")!;
    expect([breit.wordClass, breit.goetheList, breit.usedInLessons]).toEqual(["adjective", ["A1"], ["a1-u6-d1"]]);
    expect(tracks.get("word-breit")?.textDe).toBe("breit.");
    // أمثلة البطاقات القديمة: «… ist neu/groß» الرتيبة · voll (غير مدروسة) · «Das Sofa ist groß.» قرب مثال SD1 «Das Sofa ist neu.» — وبلا أسماء علم
    const sample = (id: string) => words.find((w) => w.id === id)!.sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/\bvoll\b|Das Sofa ist (neu|groß)|Lena|Yusuf|Berlin/);
    expect(l.praesentation.wordIds.filter((id) => /^(Der|Die|Das) \p{L}+ ist (neu|groß)\.$/u.test(sample(id)))).toEqual([]);
    expect(words.find((w) => w.id === "bett")!.pluralRuleNote).not.toMatch(/قلب الحرف/);
    expect(l.warmup.cardIds).toEqual(["wohnung", "apfel", "mutter"]);
    // interleavedWith كلمات خلط حقيقية: كل مرجع كلمةُ درسٍ سابق (لا كلمة اليوم) ويظهر جذعه فعلاً في ألمانية بنود محطته
    const before = new Set(realLessons.filter((x) => x.unit <= 5).flatMap((x) => x.praesentation.wordIds));
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const text = fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" }))));
      for (const ref of st.interleavedWith) {
        expect(before.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        expect(text.includes(fold(ref).slice(0, 4)), `${st.type}: ${ref} لا يظهر في بنود المحطة`).toBe(true);
      }
    }
    // الحوار الجديد (mb-1..20) كله في الاستماع والإملاء مرة واحدة — والأسطر الثلاثة عشر فوق 132 كلها استماعاً (الإملاء سبعة أسطر ≤132 + ثلاثة مقاطع)
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("mb-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `mb-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-breit", "word-spiegel", "word-teppich"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `mb-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(13);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة · ولا جملة Quiz داخل فراغ مملوء (ومع التلميح) · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set(l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))));
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["breit", "der Teppich", "der Spiegel"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u6-d2 مُرقّى (D147): صفر نقص — 40 بنداً · 4 أنواع · Quiz 6 · 15 كلمة · ars-komposita-genus · كل 20 سطراً ومقطعا كلمتين مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u6-d2")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u6-d2")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([40, 4, 6, 15]);
    // القاعدة المخططة نفسها (ars-komposita-genus — أشار إليها grammarArsenalIds ولم يُكتب لها ملف قط): آخر جزء هو الأصل
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-komposita-genus"]);
    const rule = rules.get("ars-komposita-genus")!;
    expect(rule.usedInLessons).toEqual(["a1-u6-d2"]);
    expect(rule.payload.ruleDe).toMatch(/wohnen \+ das Zimmer → das Wohnzimmer · das Telefon \+ die Nummer → die Telefonnummer · die Familie \+ der Name → der Familienname/);
    expect(rule.payload.ruleAr).toContain("الأداة من الآخر دائماً");
    expect(rule.payload.ruleAr).toContain("die Familie لكن der Familienname");
    // العونان المسمّيان: الإضافة تسمّي باسمين · والأصل فيها يقرر التذكير والتأنيث
    // · والفروق: الأصل أولاً بالعربية ⇒ ~~die Familienname~~ · الإضافة كلمتان (والإنجليزية living room معلنة) ⇒ ~~Wohn Zimmer~~ · الخبر يطابق المبتدأ ⇒ ~~Die Wohnung ist ruhige.~~
    const c = rule.payload.contrastAr;
    for (const x of ["«غرفة النوم»", "«غرفةُ النوم واسعةٌ»", "«اسمُ العائلة»", "~~die Familienname~~", "الإنجليزية living room", "~~Wohn Zimmer~~", "«الشقةُ هادئةٌ»", "~~Die Wohnung ist ruhige.~~"])
      expect(c).toContain(x);
    // الحدود: حرف الوصل بلا قاعدة · الجزء الأول اسم أو فعل أو صفة · Zimmer ↔ Raum (die Räume) · «في غرفة النوم» في الدرس الرابع (أين؟) لا الوحدة التاسعة
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/Badezimmer بـe · Familienname بـn/);
    expect(limits).toMatch(/der Raum أعمّ.*die Räume/);
    expect(limits).toMatch(/الدرس الرابع من هذه الوحدة/);
    expect(rule.payload.beads).toEqual(["Das", "Wohnzimmer", "ist", "hell."]);
    // لا جزء مركّب وحده في نصوص القاعدة المفحوصة (Schlaf · Bade · Speise غير مدروسة)
    const ruleDe = [...rule.payload.examples.map((x) => x.de), rule.payload.ruleDe].join(" ");
    expect(ruleDe).not.toMatch(/\b(Schlaf|Bade|Speise|Wohn)\b/);
    // لينا متكلمة في الحوار ولا تُذكر باسمها في أي نص ألماني ⇒ المعلن Yusuf وحده (w-upgrade-proper-noun يمنع الإعلان الزائد)
    expect(e.properNouns).toEqual(["Yusuf"]);
    // النواة D113 (hoch · allein · der Raum) بالمولِّد — goetheList مشتقة
    const w = (id: string) => words.find((x) => x.id === id)!;
    expect([w("hoch").wordClass, w("hoch").goetheList, w("hoch").usedInLessons]).toEqual(["adjective", ["A1", "A2"], ["a1-u6-d2"]]);
    expect([w("allein").wordClass, w("allein").goetheList, w("allein").usedInLessons]).toEqual(["adverb", ["A1", "A2"], ["a1-u6-d2"]]);
    expect([w("raum").de, w("raum").plural, w("raum").goetheList, w("raum").usedInLessons]).toEqual(["der Raum", "die Räume", ["A1", "A2"], ["a1-u6-d2"]]);
    expect(["word-hoch", "word-allein", "word-raum"].map((id) => tracks.get(id)?.textDe)).toEqual(["hoch.", "allein.", "der Raum."]);
    // المعجم (N-013): Badezimmer من فئة Speisekarte — e الوصل [eː] ← شوا [ə] · وɑ المنبورة المفتوحة ← ɑː (كانت reviewed «ambiguous» منذ D121 فخرجت منها)
    // · وSchlafzimmer سُجّل عليه سطر zi-18 الجديد (كل مسار يمسّه المعجم مسجّل)
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; forms: { espeak: string; ipa: string }[]; regeneratedTracks: string[] }[]; reviewed: { word: string }[] };
    expect(lex.entries.find((x) => x.word === "Badezimmer")).toMatchObject({ forms: [{ espeak: "bˈɑdeːtsˌɪmɜ", ipa: "bˈɑːdətsˌɪmɜ" }] });
    // مسارات D147 مسجّلة — والدروس اللاحقة تضيف مساراتها (D150: mw-15) كما في okay وTunesien
    expect(lex.entries.find((x) => x.word === "Badezimmer")!.regeneratedTracks).toEqual(expect.arrayContaining(["word-badezimmer", "zi-8", "zi-16"]));
    expect(lex.reviewed.map((x) => x.word)).not.toContain("Badezimmer");
    expect(lex.entries.find((x) => x.word === "Schlafzimmer")!.regeneratedTracks).toEqual(["word-schlafzimmer", "zi-18"]);
    // أمثلة البطاقات القديمة: «… ist groß/hell/ruhig» الرتيبة — بقي اثنان مقصودان: ruhig (صواب مصيدة اليوم) وtreppe — وبلا أسماء علم
    // (flur كُتب أولاً «Der Flur ist kurz.» فأمسكه هذا السطر — صار جملة موضع)
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Mein Zimmer ist sehr hell|Hier ist das Schlafzimmer|Er kommt allein|Die Preise sind hoch/);
    expect(l.praesentation.wordIds.filter((id) => /^(Der|Die|Das) \p{L}+ ist \p{L}+\.$/u.test(sample(id)))).toEqual(["treppe", "ruhig"]);
    // ملاحظات الجمع: zimmer «مثل Fenster» (كلمة u6-d3) · garten «عائلة Gäste» (نمط آخر) · المركّبات عن الجمع لا الجنس
    expect(w("zimmer").pluralRuleNote).not.toMatch(/Fenster/);
    expect(w("garten").pluralRuleNote).toMatch(/der Garten ← die Gärten/);
    expect(w("garten").pluralRuleNote).not.toMatch(/Gäste/);
    for (const id of ["schlafzimmer", "wohnzimmer", "badezimmer"]) expect(w(id).pluralRuleNote).toMatch(/الجمع من آخر جزء/);
    expect(l.warmup.cardIds).toEqual(["familienname", "telefonnummer", "speisekarte"]);
    // interleavedWith كلمات خلط حقيقية: كل مرجع كلمةُ درسٍ سابق (لا كلمة اليوم) ويظهر جذعه فعلاً في ألمانية بنود محطته
    const before = new Set(realLessons.filter((x) => x.unit <= 5 || x.id === "a1-u6-d1").flatMap((x) => x.praesentation.wordIds));
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const text = fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" }))));
      for (const ref of st.interleavedWith) {
        expect(before.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        expect(text.includes(fold(ref).slice(0, 4)), `${st.type}: ${ref} لا يظهر في بنود المحطة`).toBe(true);
      }
    }
    // الحوار الجديد (zi-1..20) كله في الاستماع والإملاء مرة واحدة — والأسطر الاثنا عشر فوق 132 كلها استماعاً (الإملاء ثمانية أسطر ≤132 + مقطعان)
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("zi-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `zi-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-gemuetlich", "word-treppe"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `zi-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(12);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة · ولا جملة Quiz داخل فراغ مملوء (ومع التلميح) · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set(l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))));
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["gemütlich", "die Treppe", "Treppe"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u6-d3 مُرقّى (D148): صفر نقص — 42 بنداً · 4 أنواع · Quiz 6 · 15 كلمة · ars-es-gibt · كل 20 سطراً وأربعة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u6-d3")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u6-d3")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([42, 4, 6, 15]);
    // القاعدة المخططة نفسها (ars-es-gibt — أشار إليها grammarArsenalIds ولم يُكتب لها ملف قط) · وتوليف u6-d6 يشير إليها أيضاً (سابقة ars-kein-nicht)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-es-gibt"]);
    const rule = rules.get("ars-es-gibt")!;
    expect(rule.usedInLessons).toEqual(["a1-u6-d3", "a1-u6-d6"]);
    expect(rule.payload.ruleDe).toBe("Es gibt einen Schreibtisch. · Es gibt ein Fenster. · Es gibt keine Waschmaschine. · Es gibt zwei Fenster. · Gibt es einen Fernseher? · Hier gibt es ein Fenster.");
    for (const x of ["ما بعد es gibt مفعولٌ به كما بعد haben", "es وgibt لا يتغيّران مع ما بعدهما", "jeder · jede · jedes (كلّ) بنهاية der · die · das نفسها", "Es gibt Kaffee."])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان مسمّاة («فيه نافذة» نكرة · «يوجد كرسيان» فعلٌ مفرد قبل المثنى · الفرنسية il y a معلنة)
    // · والفروق — هي المصائد الثلاث: الاسم بعد «يوجد» فاعلٌ مرفوع ⇒ ~~Es gibt ein Tisch.~~ · لا ضمير شكلي ⇒ ~~Gibt einen Balkon?~~ · «كلّ» لا تتغيّر (وevery الإنجليزية) ⇒ ~~jeder Zimmer~~
    const c = rule.payload.contrastAr;
    for (const x of ["«فيه نافذة»", "«يوجد كرسيان»", "الفرنسية il y a", "«يوجد مكتبٌ»", "«في الغرفة نافذةٌ»", "~~Es gibt ein Tisch.~~", "~~Gibt einen Balkon?~~", "«كلُّ غرفةٍ»", "every الإنجليزية", "~~jeder Zimmer~~"])
      expect(c).toContain(x);
    // الحدود: المكان (أين؟) في الدرس القادم · es gibt + der/die/das لاحقاً · jed- للمفرد وjeden Tag · an/aus لا geöffnet/geschlossen (العامية «حلّ/سكّر» معلنة)
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/الدرس القادم/);
    expect(limits).toMatch(/للمفرد وحده.*jeden Tag/);
    expect(limits).toContain("«حلّ التلفزة · سكّر الضوّ»");
    expect(limits).not.toMatch(/\balle\b|geben/);
    expect(rule.payload.beads).toEqual(["Hier", "gibt", "es", "ein", "Fenster."]);
    // geben (المصدر) غير مدروس — لا يظهر في أي نص للمتعلم (gibt وحدها مغلقة): أمسكه الحارس في تلميح فراغ ومشتِّتات «Es geben …»
    const shown = JSON.stringify({ e: l.einstieg, u: l.uebung, q: l.quiz, z: l.zusammenfassung, ziel: l.ziel, p: rule.payload });
    expect(shown).not.toMatch(/\bgeben\b/);
    expect(e.properNouns).toEqual(["Lena", "Yusuf"]);
    // النواة D113 (jed- ⇒ jeder · an sein · aus sein) بالمولِّد — goetheList مشتقة (jed- جذعٌ تطابقه jeder)
    const w = (id: string) => words.find((x) => x.id === id)!;
    expect([w("jeder").wordClass, w("jeder").goetheList, w("jeder").usedInLessons]).toEqual(["pronoun", ["A1", "A2"], ["a1-u6-d3"]]);
    for (const id of ["an-sein", "aus-sein"]) expect([w(id).wordClass, w(id).chunk, w(id).goetheList, w(id).usedInLessons]).toEqual(["chunk", true, ["A1", "A2"], ["a1-u6-d3"]]);
    expect(["word-jeder", "word-an-sein", "word-aus-sein"].map((id) => tracks.get(id)?.textDe)).toEqual(["jeder.", "an sein.", "aus sein."]);
    // أمثلة البطاقات القديمة الاثنا عشر كلها «… ist neu/hell/groß/alt.» — صارت جملاً متنوعة تُظهر es gibt؛ ويبقى النمط في مثالَي an sein وaus sein (الخبر هو الكلمة نفسها)
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Das Licht ist aus|Die Waschmaschine ist günstig|Der Fernseher ist kaputt|Mein Computer ist schon sehr alt/);
    expect(l.praesentation.wordIds.filter((id) => /^(Der|Die|Das) \p{L}+ ist \p{L}+\.$/u.test(sample(id)))).toEqual(["an-sein", "aus-sein"]);
    expect(l.praesentation.wordIds.filter((id) => /\bgibt\b/i.test(sample(id)))).toEqual(["heizung", "kuehlschrank", "fernseher"]);
    // ملاحظات الجمع: tuer «die + e → ‑n» (Tür لا تنتهي بـe) · dach «مثل Nacht→Nächte» (Nächte ‑e لا ‑er) · المركّبات عن الجمع لا الجنس
    expect(w("tuer").pluralRuleNote).toBe("جمع ‑en: die Tür ← die Türen");
    expect(w("dach").pluralRuleNote).toMatch(/das Dach ← die Dächer/);
    expect(w("dach").pluralRuleNote).not.toMatch(/Nacht/);
    for (const id of ["kuehlschrank", "waschmaschine", "schreibtisch"]) expect(w(id).pluralRuleNote).toMatch(/الجمع من آخر جزء/);
    expect(l.warmup.cardIds).toEqual(["schrank", "balkon", "keller"]);
    // interleavedWith كلمات خلط حقيقية: كل مرجع كلمةُ درسٍ سابق (لا كلمة اليوم) ويظهر جذعه فعلاً في ألمانية بنود محطته (كانت كلمات اليوم نفسها)
    const before = new Set(realLessons.filter((x) => x.unit <= 5 || ["a1-u6-d1", "a1-u6-d2"].includes(x.id)).flatMap((x) => x.praesentation.wordIds));
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const text = fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" }))));
      for (const ref of st.interleavedWith) {
        expect(before.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        expect(text.includes(fold(ref).slice(0, 4)), `${st.type}: ${ref} لا يظهر في بنود المحطة`).toBe(true);
      }
    }
    // الحوار الجديد (eg-1..20) كله في الاستماع والإملاء مرة واحدة — والأسطر الستة عشر فوق 132 كلها استماعاً (الإملاء أربعة أسطر ≤132 + أربعة مقاطع)
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("eg-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `eg-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-decke", "word-jeder", "word-kuehlschrank", "word-waschmaschine"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `eg-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(16);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة · ولا جملة Quiz داخل فراغ مملوء (ومع التلميح) · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set(l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))));
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["Waschmaschine", "die Waschmaschine", "Kühlschrank", "der Kühlschrank", "Decke", "die Decke", "jeder"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u6-d4 مُرقّى (D149): صفر نقص — 44 بنداً · 4 أنواع · Quiz 6 · 15 كلمة · ars-wo-wohin · كل 20 سطراً وستة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u6-d4")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u6-d4")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([44, 4, 6, 15]);
    // القاعدة المخططة نفسها (ars-wo-wohin — أشار إليها grammarArsenalIds ولم يُكتب لها ملف قط) · وتوليف u6-d6 يشير إليها أيضاً (سابقة ars-es-gibt)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-wo-wohin"]);
    const rule = rules.get("ars-wo-wohin")!;
    expect(rule.usedInLessons).toEqual(["a1-u6-d4", "a1-u6-d6"]);
    expect(rule.payload.ruleDe).toBe("Wo? — Das Bett steht an der Wand. · Der Teppich ist unter dem Tisch. · Das Sofa steht im Zimmer. · Wohin? — Ich stelle das Sofa in die Ecke. · Ich lege den Schlüssel auf den Tisch. · Ich hänge das Foto über das Bett.");
    // أول Dativ مكانٍ بأداة في المنهج (قبل ars-dativ-fix u8-d4 وars-wechselpraep u9-d4 — هكذا خطّطه المنهج فلا سحب): dem/der للمكان وحدهما
    // · im/am من الوقت (u3-d4) · in der Schweiz من الوحدة 2 · وللوضع أداة المفعول به من الوحدة 4 · والفعل بشكل الشيء
    for (const x of ["der ← dem · das ← dem · die ← der", "in + dem = im · an + dem = am كما في الوقت", "die Schweiz ← in der Schweiz", "أداة المفعول به كما في الوحدة 4", "stellen لما يقف على أرجله أو قاعدته", "weg sein = ضاع أو ذهب"])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان مسمّاة (حرف الجر العربي يغيّر الاسم بعده · «إلى أين؟» مع الذهاب · «علّق/معلّقة» من جذر واحد كـhängen)
    // · والفروق — هي المصائد الثلاث: الجرّ العربي دائم مهما كان السؤال ⇒ ~~Ich stelle die Lampe in der Ecke.~~ · «وضع/حطّ» فعلٌ واحد (وput · mettre معلنتان) ⇒ ~~Ich lege die Tasse auf den Tisch.~~
    // · «أين تضع؟» و«وين» العامية ⇒ ~~Wo stellst du den Tisch?~~
    const c = rule.payload.contrastAr;
    for (const x of ["«على الطاولةِ»", "«إلى أين تذهب؟»", "«علّق» و«معلّقة»", "يجرّ دائماً مهما كان السؤال", "~~Ich stelle die Lampe in der Ecke.~~", "«حطّ»", "put الإنجليزية وmettre الفرنسية", "~~Ich lege die Tasse auf den Tisch.~~", "مستلقٍ على جنبه", "«وين ماشي؟»", "~~Wo stellst du den Tisch?~~"])
      expect(c).toContain(x);
    // الحدود: liegen في الوحدة 11 (اليوم ist للمستلقي) · الجمع وein بعد الحرف لاحقاً · vor والقاعدة باسمها في الوحدة 9 والحروف الثابتة في الوحدة 8 · Wo … hin العامية صحيحة وWo بلا hin خطأ
    const limits = rule.payload.limitsAr.join(" ");
    expect(rule.payload.limitsAr).toHaveLength(4);
    expect(limits).toMatch(/liegen.*الوحدة 11/);
    expect(limits).toMatch(/الجمع.*لاحقاً/);
    expect(limits).toMatch(/vor.*الوحدة 9.*الوحدة 8/);
    expect(limits).toContain("Wo stellst du den Tisch hin?");
    expect(rule.payload.beads).toEqual(["Das", "Bett", "steht", "an", "der", "Wand."]);
    // لا مصطلحا Akkusativ/Dativ في نصوص المتعلم الألمانية (كانا في Quiz القديم) · ولا liegen/liegt (u11-d3) · ولا Möbel (u6-d5) · ولا vor (u9-d4)
    const shown = JSON.stringify({ e: l.einstieg, s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "" }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "" }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise]) });
    expect(shown).not.toMatch(/Akkusativ|Dativ|\blieg(en|t|e)?\b|Möbel|\bvor\b/);
    expect(e.properNouns).toEqual(["Yusuf"]); // Lena متكلمة لا اسماً في نص ألماني (D147)
    // النواة D113 (da · daneben · weg sein) بالمولِّد — goetheList مشتقة · weg-sein قطعة بجانب der Weg (u7-d1)
    const w = (id: string) => words.find((x) => x.id === id)!;
    for (const id of ["da", "daneben"]) expect([w(id).wordClass, w(id).goetheList, w(id).usedInLessons]).toEqual(["adverb", ["A1", "A2"], ["a1-u6-d4"]]);
    expect([w("weg-sein").wordClass, w("weg-sein").chunk, w("weg-sein").goetheList, w("weg-sein").phoneticRisks]).toEqual(["chunk", true, ["A1", "A2"], ["auslaut-g"]]);
    expect(w("weg").de).toBe("Weg");
    expect(["word-da", "word-daneben", "word-weg-sein"].map((id) => tracks.get(id)?.textDe)).toEqual(["da.", "daneben.", "weg sein."]);
    // أمثلة البطاقات القديمة الاثنا عشر «… ist PREP dem/der …» رتيبة («Das Bild ist oben.» · «Der Keller ist unten.») — صارت جملاً متنوعة: المكان بـsteht/hängt/ist والوضع بـstellen/legen/hängen
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Das Bild ist oben|Der Keller ist unten|Wohin stellst du den Tisch/);
    expect(l.praesentation.wordIds.filter((id) => /^(Der|Die|Das) \p{L}+ ist \p{L}+\.$/u.test(sample(id)))).toEqual([]);
    expect(l.praesentation.wordIds.filter((id) => /\b(stelle|lege|hänge)\b/.test(sample(id)))).toEqual(["stellen", "legen", "haengen"]);
    expect(w("wohin").sampleSentence!.ar).toBe("إلى أين تضع الخزانة؟");
    // ملاحظتا الجمع بالاصطلاح الجديد: ecke · mitte (نادر)
    expect(w("ecke").pluralRuleNote).toBe("‑n بعد e: die Ecke ← die Ecken");
    expect(w("mitte").pluralRuleNote).toMatch(/die Mitte ← die Mitten \(نادر/);
    expect(l.warmup.cardIds).toEqual(["wo", "neben", "stehen"]);
    // interleavedWith كلمات خلط حقيقية: كل مرجع كلمةُ درسٍ سابق (لا كلمة اليوم) ويظهر جذعه فعلاً في ألمانية بنود محطته (كانت أزواج أثاث بلا تحقق)
    const before = new Set(realLessons.filter((x) => x.unit <= 5 || ["a1-u6-d1", "a1-u6-d2", "a1-u6-d3"].includes(x.id)).flatMap((x) => x.praesentation.wordIds));
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const text = fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" }))));
      for (const ref of st.interleavedWith) {
        expect(before.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        expect(text.includes(fold(ref).slice(0, 4)), `${st.type}: ${ref} لا يظهر في بنود المحطة`).toBe(true);
      }
    }
    // الحوار الجديد (ww-1..20) كله في الاستماع والإملاء مرة واحدة — والأسطر الثمانية عشر فوق 132 كلها استماعاً (الإملاء سطران ≤132 + ستة مقاطع)
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("ww-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `ww-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-daneben", "word-haengen", "word-hinter", "word-oben", "word-weg-sein", "word-wohin"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `ww-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(18);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة · ولا جملة Quiz داخل فراغ مملوء (ومع التلميح) · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set(l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))));
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["daneben", "hinter", "hängen", "wohin", "oben", "weg sein"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
    // الأسطر التي يمسّها المعجم مسجّلة على مداخلها (wohin · okay · Tunesien)
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; regeneratedTracks: string[] }[] };
    for (const [word, t] of [["wohin", "ww-2"], ["okay", "ww-3"], ["Tunesien", "ww-11"]] as const) expect(lex.entries.find((x) => x.word === word)!.regeneratedTracks).toContain(t);
  });
  it("a1-u6-d5 مُرقّى (D150): صفر نقص — 43 بنداً · 4 أنواع · Quiz 6 · 18 كلمة · ars-da-komposita · كل 20 سطراً وخمسة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u6-d5")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u6-d5")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([43, 4, 6, 18]);
    // القاعدة المخططة نفسها (ars-da-komposita — أشار إليها grammarArsenalIds ولم يُكتب لها ملف قط) · وتوليف u6-d6 يشير إليها أيضاً (سابقة ars-wo-wohin)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-da-komposita"]);
    const rule = rules.get("ars-da-komposita")!;
    expect(rule.usedInLessons).toEqual(["a1-u6-d5", "a1-u6-d6"]);
    expect(rule.payload.ruleDe).toBe("Da ist der Tisch. Darauf steht eine Vase. · Da ist der Schrank. Darin sind zwei Handtücher. · Da ist die Tür. Dahinter ist das Badezimmer.");
    // «da أول لقاء» كما في الخطة اليومية (والنظام كله مع الأفعال وwo-Komposita في A2 — لا سحب): للمكان · dar- قبل الحركة · لا تتغيّر · الفعل يطابق فاعله · وللوضع أيضاً
    for (const x of ["dar- قبل الحركة وda- قبل الساكن", "الكلمة لا تتغيّر أبداً", "والفعل يطابق الفاعل الذي بعده", "وللوضع (Wohin?) أيضاً"])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان مسمّاة («عليه · فيه» حرفٌ وضمير في كلمة · الهمزة تفصل الحركتين كما تفصل r · الفرنسية dessus معلنة)
    // · والفروق — هي المصائد الثلاث: الحرف قبل الضمير ⇒ auf es (on it الإنجليزية معلنة) · الفصحى تُفرد الفعل المتقدّم ⇒ steht zwei · «الأثاث» مفرد (furniture is معلنة · les meubles sont تعين)
    const c = rule.payload.contrastAr;
    for (const x of ["«عليه» · «فيه»", "الهمزة تفصل", "dessus · dessous · dedans", "~~Ich lege die Kissen auf es.~~", "on it الإنجليزية", "الفصحى تُفرد الفعل", "~~Darauf steht zwei Vasen.~~", "furniture is", "~~Die Möbel ist alt.~~", "les meubles sont"])
      expect(c).toContain(x);
    // الحدود: darin للمكان وحده · davor في الوحدة 9 والمعنى المجرّد في A2 · den Nachbar/den Nachbarn صيغتان مقبولتان (Wiktionary) · العامية drauf/drin والترتيبي في الوحدة 10
    const limits = rule.payload.limitsAr.join(" ");
    expect(rule.payload.limitsAr).toHaveLength(4);
    expect(limits).toContain("darin فللمكان وحده");
    expect(limits).toMatch(/davor.*الوحدة 9.*A2/);
    expect(limits).toContain("den Nachbar أيضاً: الصيغتان مقبولتان");
    expect(limits).toMatch(/drauf · drin · drunter.*الوحدة 10/);
    expect(rule.payload.beads).toEqual(["Darauf", "steht", "eine", "Vase."]);
    // النطاق في نصوص المتعلم الألمانية: لا davor (u9-d4) ولا مركّبات المعنى المجرّد ولا الترتيبي (u10-d2) ولا liegen (u11-d3) ولا العامية ولا Nachbarin (غير مدروسة)
    const shown = JSON.stringify({ e: l.einstieg, s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "" }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "" }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.commonError.de, c.correct.de, c.exercise]) });
    expect(shown).not.toMatch(/\bdavor\b|\bdamit\b|\bdafür\b|\bdabei\b|zweiten|\blieg(en|t|e)?\b|\bdrauf\b|\bdrin\b|Nachbarin/i);
    expect(e.properNouns).toEqual(["Yusuf", "Berlin"]);
    // معايير المهمة والخلاصة تُعرض نصاً خاماً (لا StruckText) ⇒ لا «~~» فيها — الشطب في المصائد والشروح وحدها
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // darauf بالمولِّد (goetheList [A2] مشتقة من مدخل A2 «da(r) (Bsp. darauf, darüber)») — وبقية الصيغ بالقاعدة في الحارس لا بمداخل
    const w = (id: string) => words.find((x) => x.id === id)!;
    expect([w("darauf").wordClass, w("darauf").goetheList, w("darauf").usedInLessons]).toEqual(["adverb", ["A2"], ["a1-u6-d5"]]);
    expect(tracks.get("word-darauf")?.textDe).toBe("darauf.");
    // N-070: Möbel جمعاً عادةً — بلا جنس مفرد ولا بطاقة جنس (اصطلاح Lebensmittel) فيشملها اختبار الجمع الدائم
    expect([w("moebel").gender, w("moebel").srsCardTypes.includes("gender")]).toEqual(["none", false]);
    expect(w("moebel").pluralRuleNote).toContain("تُستعمل جمعاً عادةً (قائمة Goethe: pl.)");
    // أمثلة البطاقات: الأربعة المخالفة (modern · offen · grün · zweiten) والرتيبة «Die X ist neu.» صارت جملاً تُظهر الشقة وكلمات da — بلا أسماء علم ولا نص رسمي
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|modern|offen|grün|zweiten|nur eine Dusche|Wie viel Miete|keine Seife|Das Gebäude hat/);
    expect(l.praesentation.wordIds.filter((id) => /^(Der|Die|Das) \p{L}+ ist \p{L}+\.$/u.test(sample(id)))).toEqual([]);
    expect(l.praesentation.wordIds.filter((id) => /\bda(r(auf|in|über|unter)|hinter|zwischen)\b/iu.test(sample(id)))).toEqual(["schublade", "rahmen", "seife", "vase", "darauf"]);
    // D108 بعد أن صار الفحص يشمل ملاحظات الجمع: «in der Mitte» (عبارة SD1 حرفية) في ملاحظة mitte من D149 صُحّحت
    expect(w("mitte").pluralRuleNote).not.toContain("in der Mitte");
    expect(l.warmup.cardIds).toEqual(["daneben", "auf", "badezimmer"]);
    // interleavedWith كلمات خلط حقيقية: كل مرجع كلمةُ درسٍ سابق ويظهر جذعه في ألمانية بنود محطته
    const before = new Set(realLessons.filter((x) => x.unit <= 5 || ["a1-u6-d1", "a1-u6-d2", "a1-u6-d3", "a1-u6-d4"].includes(x.id)).flatMap((x) => x.praesentation.wordIds));
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const text = fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" }))));
      for (const ref of st.interleavedWith) {
        expect(before.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        expect(text.includes(fold(ref).slice(0, 4)), `${st.type}: ${ref} لا يظهر في بنود المحطة`).toBe(true);
      }
    }
    // الحوار الجديد (mw-1..20) كله في الاستماع والإملاء مرة واحدة — والأسطر الثلاثة عشر فوق 132 كلها استماعاً (الإملاء ثلاثة أسطر ≤132 + خمسة مقاطع)
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("mw-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `mw-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-darauf", "word-geraet", "word-moebel", "word-pflanze", "word-schublade"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `mw-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(13);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء (ومع التلميح) · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["darauf", "Möbel", "Gerät", "Schublade", "Pflanze"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
    // الأسطر التي يمسّها المعجم مسجّلة على مداخلها — ومنها ستة مداخل جديدة: dunkel (n ← ŋ كـOnkel) · Handtuch/Handtücher (حركة الجزء الثاني الطويلة)
    // · dazwischen (النبر على zwi) · Etagen (جمع Etage) · Nachbarn (حركة المفرد) — وأُعيد توليد word-dunkel وword-handtuch المنشورين
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; forms: { espeak: string; ipa: string }[]; regeneratedTracks: string[] }[] };
    for (const [word, t] of [["okay", "mw-2"], ["Etagen", "mw-3"], ["dunkel", "mw-4"], ["Nachbarn", "mw-7"], ["Nachbar", "mw-8"], ["Tunesien", "mw-13"], ["Badezimmer", "mw-15"], ["Toilette", "mw-16"], ["dazwischen", "mw-17"], ["Handtücher", "mw-18"], ["Schublade", "mw-20"]] as const)
      expect(lex.entries.find((x) => x.word === word)!.regeneratedTracks).toContain(t);
    expect(lex.entries.find((x) => x.word === "dunkel")).toMatchObject({ forms: [{ espeak: "dˈʊnkəl", ipa: "dˈʊŋkəl" }] });
    expect(lex.entries.find((x) => x.word === "dunkel")!.regeneratedTracks).toEqual(expect.arrayContaining(["word-dunkel", "mw-4"])); // D154: + zg-16
    expect(lex.entries.find((x) => x.word === "Handtuch")).toMatchObject({ forms: [{ espeak: "hˈanttˌʊx", ipa: "hˈanttˌuːx" }], regeneratedTracks: ["word-handtuch"] });
    expect(lex.entries.find((x) => x.word === "dazwischen")!.forms).toEqual([{ espeak: "dˈatsvɪʃən", ipa: "dɑːtsvˈɪʃən" }]);
  });
  it("a1-u7-d1 مُرقّى (D151): صفر نقص — 43 بنداً · 4 أنواع · Quiz 6 · 15 كلمة · ars-tagesablauf · كل 20 سطراً وخمسة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u7-d1")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u7-d1")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([43, 4, 6, 15]);
    // القاعدة المخططة نفسها (ars-tagesablauf — أشار إليها grammarArsenalIds ولم يُكتب لها ملف قط) · وتوليف u7-d6 لا يشير إليها (ars-trennbare وأخواتها)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-tagesablauf"]);
    const rule = rules.get("ars-tagesablauf")!;
    expect(rule.usedInLessons).toEqual(["a1-u7-d1"]);
    expect(rule.payload.ruleDe).toBe("Um sieben wache ich auf. · Mein Wecker weckt mich. · Am Morgen dusche ich immer. · Die meisten Leute schlafen in der Nacht. · Um elf gehe ich schlafen.");
    // يوم كلمات في الخطة اليومية («كلمات 1–12 (Tagesablauf)»): أفعال اليوم قطعٌ (والمنفصلة قاعدة u7-d5) · um/am للوقت والفعل ثانياً (u2-d5 · u3-d4)
    // · immer/oft · die meisten + الجمع · gehen + المصدر بلا zu (كـmöchte — u5-d3)
    for (const x of ["أفعال يومك قطعٌ", "والقاعدة كاملةً في الدرس الخامس", "aufwachen بلا مفعول", "duschen تحت الدُش، وbaden في حوض الاستحمام", "die meisten = أغلب", "بصيغة المصدر بلا zu"])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان مسمّاة («استيقظ/أيقظ» و«فاق/فيّق» · «أنا تعبان» صفة · العادة بالمضارع) · والفروق — هي المصائد الثلاث:
    // «معظم الناس» إضافة (وmost people الإنجليزية معلنة) · «أستحمّ» للاثنين والقاموس يترجمها baden (صحيحة نحواً بمعنى آخر) · «أذهب لأنام» باللام (وgo to sleep معلنة)
    const c = rule.payload.contrastAr;
    for (const x of ["«فاق» و«فيّق»", "«أنا تعبان»", "العادة بالمضارع", "most people الإنجليزية", "~~Meisten die Leute trinken am Morgen Kaffee.~~", "والقاموس يترجمها baden", "~~Ich bade jeden Morgen.~~", "صحيحة نحواً بمعنى آخر", "se doucher", "go to sleep الإنجليزية", "~~Ich gehe zu schlafen.~~"])
      expect(c).toContain(x);
    const limits = rule.payload.limitsAr.join(" ");
    expect(rule.payload.limitsAr).toHaveLength(4);
    expect(limits).toMatch(/aufwachen · anziehen · anfangen تنفصل.*الدرس الخامس/);
    expect(limits).toMatch(/schläft.*الدرس الرابع/);
    expect(limits).toContain("meistens (غالباً) كلمةٌ أخرى لاحقاً");
    expect(limits).toMatch(/zum Kurs.*الوحدة 8/);
    expect(rule.payload.beads).toEqual(["Um", "sieben", "wache", "ich", "auf."]);
    // النطاق في نصوص المتعلم الألمانية: لا machen/frühstücken/aufstehen/nehmen (u7-d3..d5) · لا muss (u8-d3) · لا dann/danach/zuerst (u9 · u12)
    // · لا meistens (A2) · لا «zu + المصدر» خارج المصيدة · ولا الفعل المنفصل بلا انفصال خارج المشتِّت
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]) });
    expect(shown).not.toMatch(/\bmach(e|st|t|en)?\b|frühstück(e|st|t|en)\b|aufsteh|\bnehm|\bmuss\b|\bdann\b|\bdanach\b|\bzuerst\b|meistens|\bzu schlafen\b/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // النواة D113 (die Firma · immer · meist-) بالمولِّد — meist- بالكلمة die meisten (دليل «جذع» D110 كـjed- ⇒ jeder) بلا جنس ولا بطاقة جنس
    const w = (id: string) => words.find((x) => x.id === id)!;
    expect([w("firma").de, w("firma").plural, w("firma").goetheList, w("firma").gender]).toEqual(["die Firma", "die Firmen", ["A1", "A2"], "die"]);
    expect([w("immer").wordClass, w("immer").goetheList]).toEqual(["adverb", ["A1", "A2"]]);
    expect([w("meisten").de, w("meisten").wordClass, w("meisten").gender, w("meisten").srsCardTypes.includes("gender"), w("meisten").goetheList]).toEqual(["die meisten", "pronoun", "none", false, ["A1", "A2"]]);
    expect(["word-firma", "word-immer", "word-meisten"].map((id) => tracks.get(id)?.textDe)).toEqual(["die Firma.", "immer.", "die meisten."]);
    // أمثلة البطاقات: pause «Ich mache eine Pause.» (machen u7-d3) · wecker «Der Wecker klingelt.» · muede «Ich bin müde.» (نص SD1/A2 حرفي) — صارت جملاً بالمدروس
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Tunesien|mache|klingelt|\bIch bin müde\.|Ich gehe schlafen|bei einer anderen Firma|kommt immer zu spät|acht Stunden/);
    expect(l.praesentation.wordIds.filter((id) => /^(Der|Die|Das) \p{L}+ ist \p{L}+\.$/u.test(sample(id)))).toEqual([]);
    // معنى baden وduschen صار صادقاً (كان baden «يسبح (حمّاماً)» وduschen «يستحمّ» كأنهما واحد) · وملاحظات الجمع بلا «Gleich_plural» (مصطلح داخلي ظهر للمتعلم)
    expect(w("baden").ar).toEqual(["يستحمّ في الحوض", "يسبح (في البحر)"]);
    expect(w("duschen").ar).toEqual(["يستحمّ تحت الدُش"]);
    expect(w("wecker").pluralRuleNote).toBe("بلا نهاية: der Wecker ← die Wecker (‑er في الآخر — نمط D146)");
    expect(l.warmup.cardIds).toEqual(["uhr", "morgen", "abend"]);
    // interleavedWith كلمات خلط حقيقية: كل مرجع كلمةُ درسٍ سابق ويظهر جذعه في ألمانية بنود محطته
    const before = new Set(realLessons.filter((x) => x.unit <= 6).flatMap((x) => x.praesentation.wordIds));
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const text = fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" }))));
      for (const ref of st.interleavedWith) {
        expect(before.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        expect(text.includes(fold(ref).slice(0, 4)), `${st.type}: ${ref} لا يظهر في بنود المحطة`).toBe(true);
      }
    }
    // الحوار الجديد (mo-1..20) كله في الاستماع والإملاء مرة واحدة — والأسطر الخمسة عشر فوق 132 كلها استماعاً (الإملاء ثلاثة أسطر ≤132 + خمسة مقاطع)
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("mo-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `mo-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-alltag", "word-anziehen", "word-aufwachen", "word-immer", "word-muede"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `mo-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(15);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء (ومع التلميح) · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["aufwachen", "anziehen", "müde", "Alltag", "immer"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
    // السطر الذي يمسّه المعجم مسجّل على مدخله (Kurs ← mo-17)
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; regeneratedTracks: string[] }[] };
    expect(lex.entries.find((x) => x.word === "Kurs")!.regeneratedTracks).toContain("mo-17");
  });
  it("a1-u7-d2 مُرقّى (D152): صفر نقص — 46 بنداً · 4 أنواع · Quiz 6 · 15 كلمة · ars-gern-lieber · كل 20 سطراً وخمسة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u7-d2")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u7-d2")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([46, 4, 6, 15]);
    // القاعدة المخططة نفسها (ars-gern-lieber — أشار إليها grammarArsenalIds ولم يُكتب لها ملف قط) · وتوليف u7-d6 لا يشير إليها
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-gern-lieber"]);
    const rule = rules.get("ars-gern-lieber")!;
    expect(rule.usedInLessons).toEqual(["a1-u7-d2"]);
    expect(rule.payload.ruleDe).toBe("Ich schwimme gern. · Lena tanzt lieber. · Spielst du gern Fußball? · Ich zeichne nicht gern. · Die Kinder möchten mehr Spiele.");
    // قاعدة اليوم في الخطة اليومية («كلمات 13–24 (Hobbys) + gern/lieber»): gern ظرفٌ بعد فعل النشاط · lieber بلا mehr · nicht gern
    // · الهواية بلا أداة · gehen + spazieren بلا zu (u7-d1) · mehr قبل الاسم · المتعة والملل
    for (const x of ["gern = «بمحبة»، وليست فعلاً", "nicht قبل gern", "mögen (الوحدة 5)", "lieber = «أفضّل»", "كلمةٌ واحدة بلا mehr", "الهواية بلا أداة", "mehr = «أكثر» قبل الاسم", "Mir ist oft langweilig."])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان مسمّاة («بكل سرور» ظرفٌ · «مملّ» للشيء · «أكثر» للكمية) · والفروق — هي المصائد الثلاث:
    // «أكثر» (I like … more وj'aime plus معلنتان) · «أحبّ» فعلٌ (like وaimer معلنتان) · «أنا زهقان» صفة الشخص (I'm bored معلنة — والمشطوبة صحيحة نحواً بمعنى آخر)
    const c = rule.payload.contrastAr;
    for (const x of ["«بكل سرور»", "«مملّ» صفةٌ للشيء", "«أكثر» للكمية", "I like … more الإنجليزية وj'aime plus الفرنسية", "~~Ich lese mehr gern.~~", "like الإنجليزية وaimer الفرنسية", "~~Ich gern Fußball.~~", "I'm bored الإنجليزية", "~~Ich bin langweilig.~~", "صحيحة نحواً بمعنى آخر"])
      expect(c).toContain(x);
    const limits = rule.payload.limitsAr.join(" ");
    expect(rule.payload.limitsAr).toHaveLength(4);
    expect(limits).toMatch(/«الأكثر محبة».*لاحقاً/);
    expect(limits).toMatch(/بفعلٍ تتعلّمه في الدرس القادم/); // machen (u7-d3) لا يُكتب قبل درسه
    expect(limits).toContain("تُكتب ss مكانها، صحيحةً هناك");
    expect(limits).toMatch(/Mir ist oft langweilig قطعةٌ/);
    expect(limits).toMatch(/nach Tunesien.*الوحدة 8/);
    expect(rule.payload.beads).toEqual(["Ich", "schwimme", "gern."]);
    // النطاق في نصوص المتعلم الألمانية: لا machen (u7-d3 — «Das macht Spaß» كانت في البطاقة والتدريب) · لا Spass (صحيحة في سويسرا) · لا Tennis/Berlin القديمتين
    // · لا «lieber … als» ولا «am liebsten» · لا ins Kino ولا nach + مدينة · ولا «mehr gern» خارج المصيدة والمشتِّت
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]) });
    expect(shown).not.toMatch(/\bmach(e|st|t|en)?\b|\bSpass\b|Tennis|Berlin|lieber als|liebsten|\bins Kino\b|\bnach (Berlin|Tunesien)\b|mehr gern|\bbin langweilig\b/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // النواة D113 (der Film, -e · mehr · wandern) بالمولِّد
    const w = (id: string) => words.find((x) => x.id === id)!;
    expect([w("film").de, w("film").plural, w("film").goetheList, w("film").gender]).toEqual(["der Film", "die Filme", ["A1", "A2"], "der"]);
    expect([w("mehr").wordClass, w("mehr").goetheList, w("mehr").wordFamily]).toEqual(["adverb", ["A1", "A2"], ["viel"]]);
    expect([w("wandern").wordClass, w("wandern").forms, w("wandern").goetheList]).toEqual(["verb", { praesens3s: "wandert", perfekt: "ist gewandert", imperative: "wandere!" }, ["A1", "A2"]]);
    expect(["word-film", "word-mehr", "word-wandern"].map((id) => tracks.get(id)?.textDe)).toEqual(["der Film.", "mehr.", "wandern."]);
    // أمثلة البطاقات: reisen «Wir reisen nach Berlin.» · spass «Das macht Spaß!» (machen u7-d3) · langweilig «Der Film ist langweilig.» (Film قبل النواة — ونصٌّ يبدأ بـ«Der Film ist» حرفيّ في A2)
    // · kino «Ich gehe ins Kino.» — صارت جملاً بالمدروس
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Tunesien|macht|ins Kino|Der Film ist|Ich schwimme gern|Ich zeichne gern|Ich spiele gern/);
    expect(l.praesentation.wordIds.filter((id) => /^(Der|Die|Das) \p{L}+ ist \p{L}+\.$/u.test(sample(id)))).toEqual([]);
    // معنى lieber صار صادقاً (كان «أفضل» = better) · وملاحظات الجمع بلا مصطلح (Fremdwort · umlaut) ولا machen
    expect(w("lieber").ar).toEqual(["بمحبة أكثر", "أُفضّل"]);
    expect(w("spass").pluralRuleNote).toBe("بمعنى «المتعة» لا يُجمع · Viel Spaß! = استمتع!");
    expect(w("kino").pluralRuleNote).toBe("كلمة أجنبية الأصل: جمعها ‑s (das Kino ← die Kinos)");
    expect(w("fussball").pluralRuleNote).toBe("ä + ‑e: der Fußball ← die Fußbälle (كـder Gast ← die Gäste)");
    expect(l.warmup.cardIds).toEqual(["gern", "hobby", "lesen"]);
    // interleavedWith كلمات خلط حقيقية: كل مرجع كلمةُ درسٍ سابق ويظهر جذعه في ألمانية بنود محطته
    const before = new Set(realLessons.filter((x) => x.unit <= 6 || x.id === "a1-u7-d1").flatMap((x) => x.praesentation.wordIds));
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const text = fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" }))));
      for (const ref of st.interleavedWith) {
        expect(before.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        expect(text.includes(fold(ref).slice(0, 4)), `${st.type}: ${ref} لا يظهر في بنود المحطة`).toBe(true);
      }
    }
    // الحوار الجديد (fz-1..20) كله في الاستماع والإملاء مرة واحدة — والأسطر السبعة فوق 132 كلها استماعاً (الإملاء ثلاثة أسطر ≤132 + خمسة مقاطع)
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("fz-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `fz-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-mehr", "word-schwimmen", "word-spass", "word-spiel", "word-zeichnen"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `fz-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(7);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء (ومع التلميح) · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["Spaß", "zeichnen", "schwimmen", "mehr", "Spiel"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
    // الأسطر التي يمسّها المعجم مسجّلة على مداخلها (Kurs ← fz-7 · Fußball ← fz-2..4) · ومدخل جديد Hobbys (espeak يقرأ y «ü»: [hˈɔbyːs])
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; forms: { espeak: string; ipa: string }[]; regeneratedTracks: string[] }[] };
    const entryOf = (word: string) => lex.entries.find((x) => x.word === word)!;
    expect(entryOf("Kurs").regeneratedTracks).toContain("fz-7");
    expect(entryOf("Fußball").regeneratedTracks).toEqual(expect.arrayContaining(["fz-2", "fz-3", "fz-4"]));
    expect(entryOf("Hobbys").forms).toEqual([{ espeak: "hˈɔbyːs", ipa: "hˈɔbiːs" }]);
    expect(entryOf("Hobbys").regeneratedTracks).toEqual(["fz-1", "fz-20"]);
  });
  it("a1-u7-d3 مُرقّى (D153): صفر نقص — 47 بنداً · 4 أنواع · Quiz 6 · 15 كلمة · ars-praesens-regelm · كل 20 سطراً وخمسة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u7-d3")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u7-d3")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([47, 4, 6, 15]);
    // القاعدة المخططة نفسها (ars-praesens-regelm — أشار إليها grammarArsenalIds ولم يُكتب لها ملف قط) · وتوليف u7-d6 يشير إليها أيضاً فهي في usedInLessons
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-praesens-regelm"]);
    const rule = rules.get("ars-praesens-regelm")!;
    expect(rule.usedInLessons).toEqual(["a1-u7-d3", "a1-u7-d6"]);
    expect(realLessons.find((x) => x.id === "a1-u7-d6")!.usedArsenalIds).toContain("ars-praesens-regelm");
    expect(rule.payload.ruleDe).toBe("ich mache · du machst · er/sie/es macht · wir machen · ihr macht · sie/Sie machen — du wartest · er wartet · er öffnet — du putzt · du schließt — ich telefoniere · er telefoniert");
    // قاعدة اليوم في الخطة اليومية («Präsens regelmäßig»): جذعٌ ثابت + نهاية الفاعل · e بعد t/d وبعد ساكنٍ ثم n · لا s ثانية بعد s/ß/z · ‑ieren منتظمة · الفاعل لا يُحذف
    for (const x of ["الجذع = المصدر بلا ‑en", "ich ‑e (ich mache)", "du ‑st (du machst)", "ihr مثل er", "والفاعل يُذكر دائماً", "إذا انتهى الجذع بـt أو d", "du öffnest · er öffnet · sie zeichnet", "فلا s ثانية مع du", "كـdu heißt من الدرس الأول", "أفعال ‑ieren منتظمة كلها"])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان مسمّاة (التصريف بالشخص — أوله بالعربية وآخره بالألمانية · التخلّص من التقاء الساكنين · المضارع للحاضر وللعادة؛ والإنجليزية تفرّق — معلنة)
    // · والفروق — هي المصائد الثلاث: «تـ» واحدة للمخاطَب وللغائبة · مفرد الاحترام اليومي (والرسائل الرسمية وvous عونان) · «أنتظرك» بمفعولٍ مباشر (j'attends معلنة · wait for عون — والمشطوبة صحيحة نحواً بمعنى آخر)
    const c = rule.payload.contrastAr;
    for (const x of ["تغيّر أول الفعل (أ · ت · ي · ن) والألمانية آخره", "التقاء الساكنين", "«قُمِ الليلَ»", "I am waiting · I wait", "«تـ» في المضارع العربي واحدة للمخاطَب وللغائبة", "~~Lena machst …~~", "في الكلام اليومي", "«حضرتكم تتفضّلون»", "vous attendez الفرنسية", "~~Wartest Sie …?~~", "j'attends الفرنسية", "wait for", "~~Ich warte dich.~~", "صحيحة نحواً بمعنى آخر", "«يصون آلةً ويفحصها»"])
      expect(c).toContain(x);
    const limits = rule.payload.limitsAr.join(" ");
    expect(rule.payload.limitsAr).toHaveLength(4);
    expect(limits).toMatch(/تتغيّر حركتها.*في الدرس القادم/);
    expect(limits).toMatch(/الماضي.*الوحدة العاشرة/);
    expect(limits).toMatch(/warten auf \+ المنصوب قطعةٌ.*A2/);
    expect(limits).toMatch(/«أتصل بفلان» في الوحدة الثامنة/);
    expect(limits).toMatch(/«الاتصال بالهاتف» بفعلٍ آخر في الدرس الخامس/);
    expect(limits).toMatch(/nie = «لا … أبداً» بكلمةٍ واحدة بلا nicht/);
    // لا صيغ تغيير الحركة غير المدروسة (fährt · nimmt — u7-d4) ولا anrufen (u7-d5) في نصوص القاعدة
    expect(JSON.stringify(rule.payload)).not.toMatch(/fährt|nimmt|anruf/);
    expect(rule.payload.beads).toEqual(["Du", "suchst", "den", "Schlüssel."]);
    // النطاق في نصوص المتعلم الألمانية: لا تغيير حركة (u7-d4) · لا Perfekt (الوحدة 10 — كانت ~~ge-telefoniert~~ في البطاقة) · لا anrufen (u7-d5)
    // · لا Mail ولا Bus القديمتين · ولا mit + أداة بعد telefonieren (الوحدة 8)
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]) });
    expect(shown).not.toMatch(/\bfährt\b|\bnimmt\b|\bgibt\b|\bläuft\b|\bwäscht\b|\bsprichst?\b|gemacht|gewartet|geschickt|gesucht|geputzt|telefoniert hat|anruf|\bruft\b[^"]*\ban\b|Mail|\bBus\b|telefonier[^"]*\bmit (meiner|meinem|dem|der|einer|einem)\b/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Berlin"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // النواة D113 (die Hausaufgabe, -n · nie · einfach) بالمولِّد
    const w = (id: string) => words.find((x) => x.id === id)!;
    expect([w("hausaufgabe").de, w("hausaufgabe").plural, w("hausaufgabe").goetheList, w("hausaufgabe").gender]).toEqual(["die Hausaufgabe", "die Hausaufgaben", ["A1", "A2"], "die"]);
    expect(w("hausaufgabe").pluralRuleNote).toBe("‑n: die Hausaufgabe ← die Hausaufgaben (كـdie Aufgabe ← die Aufgaben)");
    expect([w("nie").wordClass, w("nie").goetheList]).toEqual(["adverb", ["A1", "A2"]]);
    expect([w("einfach").wordClass, w("einfach").goetheList]).toEqual(["adjective", ["A1", "A2"]]);
    expect(["word-hausaufgabe", "word-nie", "word-einfach"].map((id) => tracks.get(id)?.textDe)).toEqual(["die Hausaufgabe.", "nie.", "einfach."]);
    // أمثلة البطاقات: machen «Hausaufgaben» (قبل النواة) · schicken «Mail» · warten «Bus» (u7-d4) · telefonieren «mit meiner Familie» (الوحدة 8)
    // · rufen «Das Essen ist fertig» (نصٌّ حرفيّ في A2) — صارت جملاً بالمدروس، وأكثرها بغير ich (du machst · er öffnet · sie schließt · wir putzen)
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Tunesien|Mail|\bBus\b|mit meiner|Das Essen ist fertig/);
    expect(l.praesentation.wordIds.filter((id) => /^(Der|Die|Das) \p{L}+ ist \p{L}+\.$/u.test(sample(id)))).toEqual([]);
    expect([sample("machen"), sample("oeffnen"), sample("schliessen"), sample("putzen"), sample("warten")]).toEqual(["Was machst du am Sonntag?", "Er öffnet das Fenster.", "Am Abend schließt sie die Tür.", "Wir putzen die Küche zusammen.", "Wir warten auf den Kellner."]);
    // معنى rufen صار صادقاً: «ينادي» (كان «يتصل» — معنى anrufen في الدرس الخامس)
    expect(w("rufen").ar).toEqual(["ينادي", "يستدعي"]);
    expect(l.warmup.cardIds).toEqual(["arbeiten", "heissen", "wohnen"]);
    // interleavedWith كلمات خلط حقيقية: كل مرجع كلمةُ درسٍ سابق ويظهر جذعه في ألمانية بنود محطته
    const before = new Set(realLessons.filter((x) => x.unit <= 6 || ["a1-u7-d1", "a1-u7-d2"].includes(x.id)).flatMap((x) => x.praesentation.wordIds));
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const text = fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" }))));
      for (const ref of st.interleavedWith) {
        expect(before.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        expect(text.includes(fold(ref).slice(0, 4)), `${st.type}: ${ref} لا يظهر في بنود المحطة`).toBe(true);
      }
    }
    // الحوار الجديد (pr-1..20) كله في الاستماع والإملاء مرة واحدة — والأسطر الأحد عشر فوق 132 كلها استماعاً (الإملاء ثلاثة أسطر ≤132 + خمسة مقاطع)
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("pr-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `pr-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-einfach", "word-hausaufgabe", "word-oeffnen", "word-schliessen", "word-telefonieren"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `pr-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(11);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء (ومع التلميح) · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["die Hausaufgabe", "einfach", "öffnen", "schließen", "telefonieren"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
    // الأسطر التي يمسّها المعجم مسجّلة على مداخلها (Tunesien ← pr-11 · Fußball ← pr-14 · okay ← pr-18) · ومدخل جديد ruft (espeak يقصّر u: [rˈʊft] — وrufst/rufen صحيحتان)
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; forms: { espeak: string; ipa: string }[]; regeneratedTracks: string[] }[] };
    const entryOf = (word: string) => lex.entries.find((x) => x.word === word)!;
    expect(entryOf("Tunesien").regeneratedTracks).toContain("pr-11");
    expect(entryOf("Fußball").regeneratedTracks).toContain("pr-14");
    expect(entryOf("okay").regeneratedTracks).toContain("pr-18");
    expect(entryOf("ruft").forms).toEqual([{ espeak: "rˈʊft", ipa: "rˈuːft" }]);
    expect(entryOf("ruft").regeneratedTracks).toEqual(expect.arrayContaining(["pr-15"])); // D154: + zg-9
  });
  it("a1-u7-d4 مُرقّى (D154): صفر نقص — 48 بنداً · 4 أنواع · Quiz 6 · 14 كلمة · ars-praesens-unregelm · كل 20 سطراً وخمسة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u7-d4")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u7-d4")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([48, 4, 6, 14]);
    // sprechen خرجت من «الجديد»: مُدرَّسة منذ a1-u1-d2 (N-018 — كـstrasse في D128 وkurz في D140) · ولا كلمة من درس سابق تُعرض جديدة
    expect(l.praesentation.wordIds).not.toContain("sprechen");
    const earlier = new Set(realLessons.filter((x) => x.unit <= 6 || ["a1-u7-d1", "a1-u7-d2", "a1-u7-d3"].includes(x.id)).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    // القاعدة المخططة نفسها (ars-praesens-unregelm) · وتوليف u7-d6 يشير إليها فهي في usedInLessons
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-praesens-unregelm"]);
    const rule = rules.get("ars-praesens-unregelm")!;
    expect(rule.usedInLessons).toEqual(["a1-u7-d4", "a1-u7-d6"]);
    expect(realLessons.find((x) => x.id === "a1-u7-d6")!.usedArsenalIds).toContain("ars-praesens-unregelm");
    expect(rule.payload.ruleDe).toBe("ich fahre · du fährst · er/sie/es fährt · wir fahren · ihr fahrt · sie/Sie fahren — du läufst · er läuft — du nimmst · er nimmt · du gibst · er gibt — du isst · er isst · du liest · er liest");
    // قاعدة اليوم في الخطة اليومية («Präsens شاذ (fährt/isst)»): التغيير مع du وer/sie/es وحدهما · a ← ä · au ← äu · e ← i · e ← ie · nimmt
    // · ihr fahrt بلا ä · احفظ صيغة er · وقاعدة s/ß/z من الدرس الماضي باقية
    for (const x of ["مع du وer/sie/es وحدهما تتغيّر حركة الجذع", "a ← ä (fahren", "au ← äu (laufen", "e ← i (geben", "e ← ie (sehen", "du nimmst · er nimmt (mm بلا h)", "فـihr fahrt بلا ä", "احفظ صيغة er مع الفعل", "du isst · du liest"])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان (حركة عين المضارع تُحفظ · جمع التكسير كجموع اليوم · take/prendre = nehmen) والفروق — هي المصائد الثلاث
    const c = rule.payload.contrastAr;
    for (const x of ["حركة عين المضارع", "فتَح يفتَح · نصَر ينصُر · ضرَب يضرِب", "جمع التكسير", "take the bus والفرنسية prendre le bus", "«آخذ · تأخذ · يأخذ»", "~~Lena nehmt das Fahrrad.~~", "«أركب القطار»", "~~Ich fahre den Zug.~~", "صحيحة نحواً بمعنى آخر", "= «يقود»", "~~Lena ist einen Apfel.~~", "لا فعل كون في جملتها الاسمية"])
      expect(c).toContain(x);
    const limits = rule.payload.limitsAr.join(" ");
    expect(rule.payload.limitsAr).toHaveLength(4);
    // صدق اللهجة: er fahrt · er lauft · er wascht بلا ä صحيحة في جنوب ألمانيا والنمسا — فلا تُستعمل مشتِّتاً
    expect(limits).toMatch(/er fahrt · er lauft · er wascht بلا ä — صحيحةٌ هناك/);
    expect(limits).toMatch(/«بالقطار» و«بالحافلة» بحرف mit .*الوحدة 8/);
    expect(limits).toMatch(/ankommen فعلٌ منفصل تحفظه اليوم قطعةً.*الدرس القادم/);
    expect(limits).toMatch(/بحالة الداتيف لاحقاً/);
    // لا «mit dem Zug» (نصٌّ حرفي في SD1/A2 — والداتيف في الوحدة 8) ولا مصطلح Dativ في نص المتعلم
    expect(JSON.stringify(rule.payload)).not.toMatch(/mit dem|Dativ/);
    expect(rule.payload.beads).toEqual(["Du", "fährst", "Fahrrad."]);
    // النطاق في نصوص المتعلم الألمانية: لا mit + الأداة (الوحدة 8) · لا nach + مدينة · لا Bahn/Rad وحدهما (كلمتان لاحقتان) · لا Wäsche (u7-d5)
    // · لا Perfekt · ولا الكلمات القديمة (Buch · Park · Berlin في أمثلة البطاقات)
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]) });
    expect(shown).not.toMatch(/\bmit (dem|der|den)\b|\bnach (Berlin|Hause)\b|\bBahn\b|\bRad\b|Wäsche|gefahren|gelaufen|genommen|gegeben|\bBuch\b|\bPark\b/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Berlin"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // النواة D113 (gleich · ab · Achtung) بالمولِّد
    const w = (id: string) => words.find((x) => x.id === id)!;
    expect([w("gleich").wordClass, w("gleich").goetheList]).toEqual(["adverb", ["A1", "A2"]]);
    expect([w("ab").wordClass, w("ab").goetheList]).toEqual(["preposition", ["A1", "A2"]]);
    expect([w("achtung").de, w("achtung").wordClass, w("achtung").srsCardTypes]).toEqual(["Achtung", "expression", ["production", "comprehension", "audio", "chunk"]]);
    expect(["word-gleich", "word-ab", "word-achtung"].map((id) => tracks.get(id)?.textDe)).toEqual(["gleich.", "ab.", "Achtung."]);
    // أمثلة البطاقات: fahren «Wir fahren nach Berlin.» · geben «Er gibt mir das Buch.» · laufen «Ich laufe im Park.» · bus «Der Bus kommt gleich.» (gleich قبل النواة — صارت مدروسة اليوم)
    // · waschen «Ich wasche die Wäsche.» (Wäsche u7-d5) · والرتيبة «Die Fahrkarte ist teuer.» / «Der Bahnhof ist hier.» / «Das Fahrrad ist neu.» — صارت جملاً بالمدروس
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Tunesien|Buch|Park|Wäsche|\bmir\b/);
    expect(l.praesentation.wordIds.filter((id) => /^(Der|Die|Das) \p{L}+ ist \p{L}+\.$/u.test(sample(id)))).toEqual([]);
    expect([sample("fahren"), sample("nehmen"), sample("laufen"), sample("bus")]).toEqual(["Fährst du heute Auto?", "Nimmst du Milch und Zucker?", "Das Kind läuft in den Garten.", "Der Bus kommt gleich."]);
    // ملاحظات الجمع بالاصطلاح الجديد (لا «umlaut» ولا «مركّب X=der»)
    expect(["fahrkarte", "bahnhof", "zug", "bus", "fahrrad"].map((id) => w(id).plural)).toEqual(["die Fahrkarten", "die Bahnhöfe", "die Züge", "die Busse", "die Fahrräder"]);
    expect(w("zug").pluralRuleNote).toBe("ü + ‑e: der Zug ← die Züge (كـder Gast ← die Gäste)");
    expect(w("fahrrad").pluralRuleNote).toBe("ä + ‑er: das Fahrrad ← die Fahrräder (كـdas Dach ← die Dächer)");
    for (const id of ["fahrkarte", "bahnhof", "zug", "bus", "fahrrad"]) expect(w(id).pluralRuleNote).not.toMatch(/umlaut|مركّب|=/);
    expect(w("fahren").ar).toEqual(["يذهب بمركبة · يركب", "يقود (مركبة)"]);
    expect(l.warmup.cardIds).toEqual(["essen", "lesen", "schlafen"]);
    // interleavedWith كلمات خلط حقيقية: كل مرجع كلمةُ درسٍ سابق ويظهر جذعه في ألمانية بنود محطته
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const text = fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" }))));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        expect(text.includes(fold(ref).slice(0, 4)), `${st.type}: ${ref} لا يظهر في بنود المحطة`).toBe(true);
      }
    }
    // الحوار الجديد (zg-1..20) كله في الاستماع والإملاء مرة واحدة — والأسطر الأحد عشر فوق 132 كلها استماعاً (الإملاء ثلاثة أسطر ≤132 + خمسة مقاطع)
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("zg-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `zg-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-achtung", "word-bahnhof", "word-fahrkarte", "word-fahrrad", "word-gleich"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `zg-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(11);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء (ومع التلميح) · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["Fahrkarte", "Bahnhof", "Fahrrad", "Achtung", "gleich"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
    // الأسطر التي يمسّها المعجم مسجّلة على مداخلها (ruft ← zg-9 · dunkel ← zg-16) · ومدخل جديد schläft (espeak يقصّر ä: [ʃlˈɛft]) قبل التوليد
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; forms: { espeak: string; ipa: string }[]; regeneratedTracks: string[] }[] };
    const entryOf = (word: string) => lex.entries.find((x) => x.word === word)!;
    expect(entryOf("ruft").regeneratedTracks).toContain("zg-9");
    expect(entryOf("dunkel").regeneratedTracks).toContain("zg-16");
    expect(entryOf("schläft").forms).toEqual([{ espeak: "ʃlˈɛft", ipa: "ʃlˈɛːft" }]);
    expect(entryOf("schläft").regeneratedTracks).toEqual(["zg-3"]);
  });
  it("a1-u7-d5 مُرقّى (D155): صفر نقص — 49 بنداً · 4 أنواع · Quiz 6 · 17 كلمة · ars-trennbare · كل 20 سطراً وخمسة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u7-d5")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u7-d5")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([49, 4, 6, 17]);
    const earlier = new Set(realLessons.filter((x) => x.unit <= 6 || ["a1-u7-d1", "a1-u7-d2", "a1-u7-d3", "a1-u7-d4"].includes(x.id)).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    // القاعدة المخططة نفسها (ars-trennbare — «Trennbare (الإدخال)» في الخطة اليومية) · وتوليف u7-d6 يشير إليها فهي في usedInLessons
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-trennbare"]);
    const rule = rules.get("ars-trennbare")!;
    expect(rule.usedInLessons).toEqual(["a1-u7-d5", "a1-u7-d6"]);
    expect(realLessons.find((x) => x.id === "a1-u7-d6")!.usedArsenalIds).toContain("ars-trennbare");
    expect(rule.payload.ruleDe).toBe("Ich stehe um sieben auf. · Er räumt sein Zimmer auf. · Stehst du früh auf? · Steh auf! · Ich möchte früh aufstehen. · Wir frühstücken. · Ich besuche Oma.");
    // الجزء في الآخر والفعل ثانياً (قوسان) · السؤال والأمر · بعد möchte متصلاً · النبر علامة الانفصال · frühstücken/besuchen لا تنفصلان · القطع السابقة (aufwachen · ankommen)
    for (const x of ["جزؤه الأول (auf · an · ein · ab · fern) يذهب إلى آخر الجملة", "كأنهما قوسان", "في السؤال يتقدّم الفعل وحده", "Steh auf!", "بعد möchte (الوحدة 5) يبقى المصدر متصلاً", "النبر على الجزء الأول", "frühstücken وbesuchen فلا تنفصلان", "Wann wachst du auf? · Der Zug kommt um elf an."])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان (نفي الدارجة التونسية «ما … ش» حول الفعل · الإنجليزية get up/tidy up · الأفعال من أفعالٍ معروفة) والفروق — هي المصائد الثلاث
    const c = rule.payload.contrastAr;
    for (const x of ["«ما نعرفش»", "get up · tidy up", "kaufen ← einkaufen", "الفعل العربي كلمةٌ واحدة لا تتجزأ", "~~Ich aufstehe um sieben.~~", "tidy up my room", "~~Ich räume auf mein Zimmer.~~", "watch TV الإنجليزية وregarder la télé الفرنسية", "~~Ich sehe den Fernseher.~~", "صحيحة نحواً بمعنى آخر", "«أرى جهاز التلفاز»"])
      expect(c).toContain(x);
    const limits = rule.payload.limitsAr.join(" ");
    expect(rule.payload.limitsAr).toHaveLength(4);
    expect(limits).toMatch(/الماضي.*الوحدة العاشرة/);
    expect(limits).toMatch(/besuchen · verstehen · erzählen/);
    expect(limits).toMatch(/الوحدة 8.*كـmöchte اليوم/);
    expect(limits).toMatch(/der Fernseher = جهاز التلفاز/);
    // لا ألمانية غير مدروسة في الحدود (müssen · können · dass · Geschirr)
    expect(JSON.stringify(rule.payload)).not.toMatch(/\bmuss\b|\bkann\b|\bdass\b|Geschirr|Samstag/);
    expect(rule.payload.beads).toEqual(["Ich", "stehe", "um", "sieben", "auf."]);
    // النطاق في نصوص المتعلم الألمانية: لا Perfekt (ge‑ في الوسط) · لا müssen/können · لا Samstag/Geschirr/sauber/Meer/raus/bringen (أمثلة البطاقات القديمة)
    // · لا «bei uns/bei dir» (bei + Dativ — الوحدة 8)
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]) });
    expect(shown).not.toMatch(/aufgestanden|eingekauft|angerufen|ferngesehen|aufgeräumt|abgewaschen|\bmuss\b|\bkann\b|Samstag|Geschirr|sauber|\bMeer\b|\braus\b|\bbringe\b|\bbei (uns|dir|mir)\b/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // أمثلة البطاقات: einkaufen «am Samstag» · abwaschen «das Geschirr» · Wäsche «sauber» · Müll «bringe … raus» · Urlaub «ans Meer» (غير مدروسة)
    // والرتيبة «Der Koffer ist schwer.» · «Die Reise ist lang.» · «Das Zimmer ist hübsch.» — صارت جملاً بالمدروس وأكثرها بأفعال منفصلة مفصولة
    const w = (id: string) => words.find((x) => x.id === id)!;
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Tunesien|Samstag|Geschirr|sauber|Meer|raus|bringe/);
    expect(l.praesentation.wordIds.filter((id) => /^(Der|Die|Das) \p{L}+ ist \p{L}+\.$/u.test(sample(id)))).toEqual([]);
    expect([sample("aufstehen"), sample("anrufen"), sample("einkaufen"), sample("abwaschen")]).toEqual(["Mein Vater steht immer früh auf.", "Rufst du mich heute an?", "Wo kaufst du ein?", "Heute wäscht mein Bruder ab."]);
    // معنى Haushalt كان صينياً وعبرياً («家务» · «משק منزل») ⇒ عربية · وملاحظات الجمع بالاصطلاح الجديد (لا Gleich_plural ولا «der + e → جمع -e»)
    expect(w("haushalt").ar).toEqual(["أعمال البيت", "تدبير المنزل"]);
    expect(w("koffer").pluralRuleNote).toBe("بلا نهاية: der Koffer ← die Koffer (‑er في الآخر — نمط D146)");
    expect(w("buch").pluralRuleNote).toBe("ü + ‑er: das Buch ← die Bücher (كـdas Dach ← die Dächer)");
    for (const id of ["haushalt", "waesche", "muell", "buch", "besuch", "urlaub", "koffer", "reise"]) expect(w(id).pluralRuleNote).not.toMatch(/Gleich_plural|umlaut|مركّب|→ جمع/);
    expect(l.warmup.cardIds).toEqual(["aufwachen", "anfangen", "kochen"]);
    // interleavedWith كلمات خلط حقيقية: كل مرجع كلمةُ درسٍ سابق ويظهر جذعه في ألمانية بنود محطته
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const text = fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" }))));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        expect(text.includes(fold(ref).slice(0, 4)), `${st.type}: ${ref} لا يظهر في بنود المحطة`).toBe(true);
      }
    }
    // الحوار الجديد (hh-1..20) كله في الاستماع والإملاء مرة واحدة — والأسطر الأربعة عشر فوق 132 كلها استماعاً (الإملاء ثلاثة أسطر ≤132 + خمسة مقاطع)
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("hh-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `hh-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-abwaschen", "word-aufraeumen", "word-buch", "word-feiern", "word-reise"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `hh-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(14);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء (ومع التلميح) · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["aufräumen", "abwaschen", "Buch", "Reise", "feiern"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
    // الأسطر التي يمسّها المعجم مسجّلة على مداخلها (Tunesien ← hh-16 · hh-19)
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; regeneratedTracks: string[] }[] };
    expect(lex.entries.find((x) => x.word === "Tunesien")!.regeneratedTracks).toEqual(expect.arrayContaining(["hh-16", "hh-19"]));
  });
  it("a1-u8-d1 مُرقّى (D156): صفر نقص — 48 بنداً · 4 أنواع · Quiz 6 · 14 كلمة · ars-kleidung-genus · كل 20 سطراً وخمسة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u8-d1")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u8-d1")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([48, 4, 6, 14]);
    const earlier = new Set(realLessons.filter((x) => x.unit <= 7).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    // القاعدة المخططة نفسها (ars-kleidung-genus) — وتوليف u8-d6 لا يشير إليها (يشير إلى ars-dativ-fix وأخواتها) فـusedInLessons [u8-d1] وحده
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-kleidung-genus"]);
    const rule = rules.get("ars-kleidung-genus")!;
    expect(rule.usedInLessons).toEqual(["a1-u8-d1"]);
    expect(realLessons.find((x) => x.id === "a1-u8-d6")!.usedArsenalIds).not.toContain("ars-kleidung-genus");
    expect(rule.payload.ruleDe).toBe("der Rock · die Hose · das Hemd · die Schuhe — dieser Rock · diese Hose · dieses Hemd · diese Schuhe — Ich nehme diesen Rock. — Das Kleid gefällt mir. · Die Schuhe gefallen mir.");
    // الجنس يُحفظ ولا يُنقل من العربية · ‑e مؤنث غالباً · الزوج بالجمع · dies‑ بنهاية الأداة وdiesen · gefallen: الشيء فاعل والفعل يطابقه
    for (const x of ["احفظ الجنس مع كل قطعة ولا تنقله من العربية", "والتنورة مؤنثة بالعربية!", "‑e في الآخر مؤنثٌ غالباً", "والزوج بالجمع", "dies‑ (هذا/هذه) تأخذ نهاية الأداة نفسها", "den ← diesen", "الشيء فاعلٌ والشخص بـmir أو dir", "والفعل يطابق الشيء"])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان («يعجبني الفستان» وla robe me plaît · «هذا/هذه» تطابق · ‑e كتاء التأنيث) والفروق — هي المصائد الثلاث
    const c = rule.payload.contrastAr;
    for (const x of ["«يعجبني الفستان»", "La robe me plaît", "«هذا» و«هذه» تطابقان جنس الاسم", "كتاء التأنيث «ـة»", "«حذائي جديد» بالمفرد للزوج", "~~Mein Schuh ist neu.~~", "صحيحة نحواً بمعنى آخر", "I like the dress", "~~Ich gefalle das Kleid.~~", "ولا محايد فيها", "~~Dieser Kleid ist schön.~~"])
      expect(c).toContain(x);
    const limits = rule.payload.limitsAr.join(" ");
    expect(rule.payload.limitsAr).toHaveLength(4);
    expect(limits).toMatch(/mir وdir قطعتان اليوم مع gefallen.*الدرس الرابع من هذه الوحدة.*A2/);
    expect(limits).toMatch(/أسماء الألوان.*لاحقاً/);
    expect(limits).toMatch(/السعر.*الدرس القادم/);
    expect(limits).toMatch(/tragen = يلبس/);
    expect(rule.payload.beads).toEqual(["Dieses", "Kleid", "gefällt", "mir."]);
    // النطاق في نصوص المتعلم الألمانية: لا ألوان بأسمائها (rot · blau · weiß · schwarz) · لا warm (مثال Pullover القديم) · لا mit dem/zum (الداتيف u8-d4)
    // · ولا «Das gefällt mir.» ولا «Die Farbe gefällt mir gut.» (نصّان حرفيان في SD1)
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]) });
    expect(shown).not.toMatch(/\b(rot|blau|weiß|schwarz|grün|gelb)\b|\bwarm\b|\bmit dem\b|\bzum\b|"Das gefällt mir\.|Die Farbe gefällt mir gut/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Berlin"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // النواة D113 (dies- ⇒ dieser · gefallen) بالمولِّد — gefallen فعلٌ داتيفي (dative-verb) بصيغة gefällt
    const w = (id: string) => words.find((x) => x.id === id)!;
    expect([w("dieser").wordClass, w("dieser").goetheList]).toEqual(["pronoun", ["A1"]]);
    expect([w("gefallen").wordClass, w("gefallen").forms?.praesens3s, w("gefallen").grammarRisks, w("gefallen").goetheList]).toEqual(["verb", "gefällt", ["dative-verb"], ["A1", "A2"]]);
    expect(["word-dieser", "word-gefallen"].map((id) => tracks.get(id)?.textDe)).toEqual(["dieser.", "gefallen."]);
    // أمثلة البطاقات الرتيبة كلها («Die Hose ist neu.» · «Das Hemd ist neu.» · «Der Rock ist neu.» …) ومثال Pullover بـwarm (غير مدروسة) — صارت جملاً بالمدروس وأكثرها بـdies‑ وtragen
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Tunesien|\bwarm\b/);
    expect(l.praesentation.wordIds.filter((id) => /^(Der|Die|Das) \p{L}+ (ist|sind) \p{L}+\.$/u.test(sample(id)))).toEqual([]);
    expect([sample("schuh"), sample("kleid"), sample("pullover")]).toEqual(["Meine Schuhe sind neu.", "Meine Schwester mag dieses Kleid.", "Dieser Pullover ist sehr schön."]);
    // ملاحظات الجمع الاثنتا عشرة بالاصطلاح الجديد — ومنها المصحّحة علمياً في نقطة D156 الأولى (Mantel «+ er» · Kleid «umlaut» · Größe «Groesse» · Pullover «Gleich_plural»)
    for (const id of ["hose", "hemd", "schuh", "jacke", "mantel", "kleid", "rock", "socke", "hut", "pullover", "groesse", "farbe"]) expect(w(id).pluralRuleNote).toMatch(/^(‑|[äöü] \+ ‑|[äöü] بلا نهاية|بلا نهاية)/u);
    expect(w("hut").pluralRuleNote).toBe("ü + ‑e: der Hut ← die Hüte (كـder Stuhl ← die Stühle)");
    expect(l.warmup.cardIds).toEqual(["tasche", "tragen", "kaufen"]);
    // interleavedWith كلمات خلط حقيقية: كل مرجع كلمةُ درسٍ سابق ويظهر جذعه في ألمانية بنود محطته
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const text = fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" }))));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        expect(text.includes(fold(ref).slice(0, 4)), `${st.type}: ${ref} لا يظهر في بنود المحطة`).toBe(true);
      }
    }
    // الحوار الجديد (kl-1..20) كله في الاستماع والإملاء مرة واحدة — والأسطر الاثنا عشر فوق 132 كلها استماعاً (الإملاء ثلاثة أسطر ≤132 + خمسة مقاطع)
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("kl-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `kl-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-dieser", "word-gefallen", "word-groesse", "word-mantel", "word-pullover"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `kl-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(12);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء (ومع التلميح) · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["Pullover", "Größe", "Mantel", "gefallen", "dieser"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
    // الأسطر التي يمسّها المعجم مسجّلة على مداخلها (Tunesien ← kl-4 · Pullover ← kl-6)
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; regeneratedTracks: string[] }[] };
    expect(lex.entries.find((x) => x.word === "Tunesien")!.regeneratedTracks).toContain("kl-4");
    expect(lex.entries.find((x) => x.word === "Pullover")!.regeneratedTracks).toContain("kl-6");
  });
  it("a1-u8-d2 مُرقّى (D157): صفر نقص — 48 بنداً · 4 أنواع · Quiz 6 · 14 كلمة · ars-preise · كل 20 سطراً وخمسة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u8-d2")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u8-d2")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([48, 4, 6, 14]);
    const earlier = new Set(realLessons.filter((x) => x.unit <= 7 || x.id === "a1-u8-d1").flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    // القاعدة المخططة نفسها (ars-preise) — لا تكرار لقاعدة الأسعار حتى الألف (ars-preis-1000 · u3-d2): هذه عن السؤال والحكم والسنتات
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-preise"]);
    const rule = rules.get("ars-preise")!;
    expect(rule.usedInLessons).toEqual(["a1-u8-d2"]);
    expect(rule.payload.ruleDe).toBe("Was kostet der Hut? — Er kostet fünf Euro fünfzig. · Was kosten die Schuhe? — Sie kosten neununddreißig Euro neunundneunzig. · neunundneunzig Cent · circa vierzig Euro · Das macht zwanzig Euro. · Das ist günstig! · Der Markt ist am besten.");
    // ثلاث خطوات: الشيء فاعل والفعل يتبعه (kostet/kosten) والجواب بضمير جنس الكلمة · السنتات بلا Cent بعد Euro وما دون اليورو بـCent · الحكم (günstig/billig/teuer/zu teuer · Rabatt · am besten)
    for (const x of ["(مفرد ← kostet)", "(جمع ← kosten)", "Wie viel kostet …? بالمعنى نفسه", "Er kostet … (der Hut)", "Sie kosten … (die Schuhe)", "عدد السنتات بلا كلمة Cent", "neunundzwanzig Euro neunundneunzig", "neunundneunzig Cent", "بلا نهاية جمع بعد العدد", "Das macht …", "circa (مختصرةً ca.)", "günstig = مناسب السعر", "zu teuer = أغلى من اللازم", "am besten = «الأفضل»", "Am besten kaufe ich die Schuhe dort."])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان (الشيء فاعل في «كم يكلّف» · «حوالي» كـcirca · ثلاث درجات للحكم) والفروق الثلاثة — هي المصائد الثلاث (D118: خطأ المتعلم بالفعل ولا تهمة)
    const c = rule.payload.contrastAr;
    for (const x of ["«كم يكلّف الحذاء؟»", "«حوالي أربعين يورو»", "günstig / billig / teuer", "~~Was kostet die Schuhe?~~", "~~Wie kostet das Hemd?~~", "Wie وحدها = «كيف»", "~~Der Verkäufer fragt den Kunde.~~", "den Nachbarn", "Der Verkäufer fragt den Kunden.", "خريطة التداخل 10‑ي"])
      expect(c).toContain(x);
    expect(rule.payload.limitsAr).toHaveLength(4);
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/am besten اليوم حكمٌ.*باب المقارنة كله.*الوحدة 11/);
    expect(limits).toMatch(/zehn Euro Rabatt بالمبلغ.*النسبة المئوية.*لاحقاً/);
    expect(limits).toMatch(/بالبطاقة.*الدرس الرابع من هذه الوحدة/);
    expect(limits).toMatch(/verkaufen = يبيع.*anprobieren فعلٌ منفصل/);
    expect(rule.payload.beads).toEqual(["Was", "kosten", "die", "Schuhe?"]);
    // النطاق في نصوص المتعلم الألمانية: لا besser ولا Prozent ولا Sonderangebot (لاحقاً) · لا modals (u8-d3) · لا Kundin/Verkäuferin
    // · ولا الجمل الرسمية الحرفية من SD1 («Das ist mir zu teuer.» · «Wie viel kostet das?» · «Dort gibt es günstige Angebote.» · «Das macht 5 Euro 95.») (D108)
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]) });
    expect(shown).not.toMatch(/\b(besser|Prozent|Sonderangebot|Kundin|Verkäuferin|kann|muss|möchten|will)\b|Das ist mir zu teuer|Wie viel kostet das\?|Dort gibt es günstige Angebote|Das macht 5 Euro 95|fünf Euro fünfundneunzig/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // النواة D113 (best- ⇒ beste · circa/ca.) بالمولِّد — circa ظرفٌ قبل العدد (v2-order حين يتصدّر) وbeste صفة am besten / das beste
    const w = (id: string) => words.find((x) => x.id === id)!;
    expect([w("beste").wordClass, w("beste").goetheList]).toEqual(["adjective", ["A1"]]);
    expect([w("circa").wordClass, w("circa").grammarRisks, w("circa").goetheList]).toEqual(["adverb", ["v2-order"], ["A1"]]);
    expect(["word-beste", "word-circa"].map((id) => tracks.get(id)?.textDe)).toEqual(["beste.", "circa."]);
    // المعجم: espeak يقرأ c اللاتينية كافاً في circa [kˈɪɾkɑː] — مدخل D157 يصحّحها [tsˈɪɾkɑː] ومساراته الأربعة مسجّلة · وvierzig/Rabatt تمسّان أسطر الحوار الجديدة فسُجّلت عليها (لا تسجيل آلي من القاطع — N-099)
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; forms: { espeak: string; ipa: string }[]; regeneratedTracks: string[] }[] };
    const circa = lex.entries.find((x) => x.word === "circa")!;
    expect(circa.forms).toEqual([{ espeak: "kˈɪɾkɑː", ipa: "tsˈɪɾkɑː" }]);
    expect([...circa.regeneratedTracks].sort()).toEqual(["word-circa", "ws-17", "ws-4", "ws-5"]);
    expect(lex.entries.find((x) => x.word === "vierzig")!.regeneratedTracks).toEqual(expect.arrayContaining(["ws-4", "ws-5"]));
    expect(lex.entries.find((x) => x.word === "Rabatt")!.regeneratedTracks).toEqual(expect.arrayContaining(["ws-6", "ws-7"]));
    // أمثلة البطاقات الرتيبة («Der Rabatt ist gut.» · «Das Angebot ist gut.» · «Der Verkäufer ist nett.» …) صارت جملاً بالمدروس وبلا أعلام
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Tunesien|\bbesser\b|Prozent/);
    expect(l.praesentation.wordIds.filter((id) => /^(Der|Die|Das) \p{L}+ (ist|sind) \p{L}+\.$/u.test(sample(id)))).toEqual([]);
    expect([sample("cent"), sample("kunde"), sample("anprobieren")]).toEqual(["Ein Euro hat hundert Cent.", "Der Kunde bezahlt an der Kasse.", "Probierst du den Mantel an?"]);
    // ملاحظات الجمع بالاصطلاح — ومنها المصحّحة علمياً في D157: Cent «die Cent(s)» ← «die Cent» بلا نهاية بعد العدد · Verkäufer «Gleich_plural» ← «بلا نهاية» · Kunde ‑n مع المفعول den Kunden · Supermarkt/Markt «ä + ‑e»
    for (const id of ["cent", "rabatt", "angebot", "wechselgeld", "verkaeufer", "kunde", "supermarkt", "geschaeft", "markt"]) expect(w(id).pluralRuleNote).toMatch(/^(‑|[äöü] \+ ‑|[äöü] بلا نهاية|بلا نهاية|بلا جمع)/u);
    expect([w("cent").plural, w("cent").pluralRuleNote]).toEqual(["die Cent", "بلا نهاية بعد العدد: ein Cent · fünfzig Cent (كـEuro) — وdie Cents للقطع النقدية نفسها"]);
    expect(w("kunde").pluralRuleNote).toMatch(/^‑n: der Kunde ← die Kunden — وفي المفعول أيضاً den Kunden/);
    expect(w("markt").pluralRuleNote).toBe("ä + ‑e: der Markt ← die Märkte (كـder Gast ← die Gäste)");
    expect(l.warmup.cardIds).toEqual(["preis", "kosten", "bezahlen"]);
    // interleavedWith كلمات خلط حقيقية: كل مرجع كلمةُ درسٍ سابق ويظهر جذعه في ألمانية بنود محطته
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const text = fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" }))));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        expect(text.includes(fold(ref).slice(0, 4)), `${st.type}: ${ref} لا يظهر في بنود المحطة`).toBe(true);
      }
    }
    // الحوار الجديد (ws-1..20) كله في الاستماع والإملاء مرة واحدة — والأسطر الثمانية فوق 132 كلها استماعاً (الإملاء أربعة أسطر ≤132 + خمسة مقاطع)
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("ws-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `ws-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-angebot", "word-beste", "word-circa", "word-rabatt", "word-verkaeufer"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `ws-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(8);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["Rabatt", "Angebot", "Verkäufer", "circa", "beste"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("a1-u8-d3 مُرقّى (D158): صفر نقص — 50 بنداً · 4 أنواع · Quiz 6 · 13 كلمة · ars-koennen-muessen · كل 20 سطراً وخمسة مقاطع كلمات مستخدمة", () => {
    const l = realLessons.find((x) => x.id === "a1-u8-d3")!;
    const e = loadUpgradePlans(CONTENT)[0]!.lessons.find((x) => x.lessonId === "a1-u8-d3")!;
    const rules = loadGrammarRules(CONTENT);
    const r = inspectLesson(l, e, { lessons: realLessons, words, tracks, rules });
    expect({ rule: r.rule, practice: r.practice, quiz: r.quiz, coverage: r.coverage, misspellings: r.misspellings })
      .toEqual({ rule: [], practice: [], quiz: [], coverage: [], misspellings: [] });
    expect([r.practiceItems, r.practiceTypes.length, r.quizMin, l.praesentation.wordIds.length]).toEqual([50, 4, 6, 13]);
    const earlier = new Set(realLessons.filter((x) => x.unit <= 7 || ["a1-u8-d1", "a1-u8-d2"].includes(x.id)).flatMap((x) => x.praesentation.wordIds));
    expect(l.praesentation.wordIds.filter((id) => earlier.has(id))).toEqual([]);
    // القاعدة المخططة نفسها (ars-koennen-muessen) — تشاركها u8-d6 (توليف) فـusedInLessons يضمّهما (§10‑ح)
    expect(l.praesentation.grammarArsenalIds).toEqual(["ars-koennen-muessen"]);
    const rule = rules.get("ars-koennen-muessen")!;
    expect(rule.usedInLessons).toEqual(["a1-u8-d3", "a1-u8-d6"]);
    expect(rule.payload.ruleDe).toBe("ich kann · du kannst · er/sie/es kann · wir/sie/Sie können — ich muss · du musst · er/sie/es muss · wir/sie/Sie müssen — Ich muss einen Rucksack kaufen. · Kann ich den Rucksack anprobieren? · Was musst du kaufen? · Du musst nicht viel bezahlen.");
    // ثلاث خطوات: الصيغ (ich=er بلا ‑t · تغيّر الحركة kann/können · muss/müssen) · القنطرة (الناقص ثانياً والمصدر آخراً بلا zu · المنفصل متصلاً · الحذف حين يُفهم) · المعنى (قدرة/إمكان/طلب مهذب · وجوب · nicht müssen = لا حاجة)
    for (const x of ["ich kann · du kannst · er/sie/es kann · wir können", "ich muss · du musst · er/sie/es muss · wir müssen", "ich وer/sie/es سواء بلا ‑t", "kann ← können · muss ← müssen", "لا يتصرّف ولا تسبقه zu", "Kann ich den Rucksack anprobieren?", "يبقى متصلاً في الآخر (anprobieren · einkaufen)", "Er kann gut Deutsch (= sprechen)", "الطلب المهذب في السؤال (Kann ich …? · Können Sie …?)", "müssen + nicht = لا حاجة ولا ضرورة، لا «ممنوع»", "Du musst nicht viel bezahlen"])
      expect(rule.payload.ruleAr).toContain(x);
    // ثلاثة أعوان (الناقص قبل الأصلي في العربية أيضاً · «يجب أن/يمكن أن» قبل الفعل · «ممكن؟») والفروق الثلاثة — هي المصائد الثلاث (D118)
    const c = rule.payload.contrastAr;
    for (const x of ["«أستطيع أن أدفع»", "~~Ich muss zu bezahlen.~~", "~~Ich muss kaufe einen Gürtel.~~", "مصدراً جامداً", "Ich muss einen Gürtel kaufen.", "~~Du muss bezahlen.~~", "~~Wir muss bezahlen.~~", "du musst · wir müssen", "خريطة التداخل 10‑ي"])
      expect(c).toContain(x);
    expect(rule.payload.limitsAr).toHaveLength(4);
    const limits = rule.payload.limitsAr.join(" ");
    expect(limits).toMatch(/dürfen.*sollen.*لاحقاً.*«ممنوع» ليست nicht müssen بل nicht dürfen/);
    expect(limits).toMatch(/Können Sie …\? مع mir\/dir.*helfen والداتيف في الوحدة 9/);
    expect(limits).toMatch(/mit der Kreditkarte · mit Karte.*الدرس القادم/);
    expect(limits).toMatch(/kriegen = bekommen في الكلام اليومي.*zwei Stück Kuchen/);
    expect(rule.payload.beads).toEqual(["Ich", "muss", "einen", "Rucksack", "kaufen."]);
    // النطاق في نصوص المتعلم الألمانية: لا dürfen/sollen ولا man ولا «mit (der) Karte» (u8-d4) ولا Kaufhaus/helfen/voll (غير مدروسة)
    // · ولا الجمل الرسمية الحرفية من SD1 («Wo muss ich bezahlen?» · «Kann ich auch mit Karte zahlen?» · «Wo finde ich Kleidung?» · «Ich nehme ein Stück Kuchen.») (D108)
    const shown = JSON.stringify({ e: l.einstieg.pretestItems.map((p) => p.answer), s: l.uebung.stations.map((st) => st.items.map((i) => ({ ...i, why: "", choices: undefined, audioId: undefined }))), q: l.quiz.variants.map((v) => v.items.map((i) => ({ ...i, why: "", choices: undefined }))), z: l.zusammenfassung.summary.de, w: l.zusammenfassung.warningCards.map((c) => [c.correct.de, c.exercise.a]) });
    expect(shown).not.toMatch(/\b(darf|dürfen|soll|sollen|man|Kaufhaus|helfen|voll)\b|mit (der )?(Kredit)?[Kk]arte|Wo muss ich bezahlen|mit Karte zahlen|Wo finde ich Kleidung|Ich nehme ein Stück Kuchen/i);
    expect(e.properNouns).toEqual(["Yusuf", "Lena", "Berlin"]);
    expect(JSON.stringify([l.uebung.communicativeTask, l.zusammenfassung.summary])).not.toContain("~~");
    // النواة D113 (kriegen) بالمولِّد — فعل بصيغتيه، ومثاله بالمدروس وبلا نص رسمي
    const w = (id: string) => words.find((x) => x.id === id)!;
    expect([w("kriegen").wordClass, w("kriegen").forms, w("kriegen").goetheList, w("kriegen").usedInLessons]).toEqual(["verb", { praesens3s: "kriegt", perfekt: "hat gekriegt" }, ["A1", "A2"], ["a1-u8-d3"]]);
    expect(tracks.get("word-kriegen")?.textDe).toBe("kriegen.");
    // المعجم: espeak ينبر Abteilung على Ab‑ [ˈaptˌaɪlʊŋ] والمرجع يذكر الصيغتين فمرّ التدقيق — مدخل D158 يثبّت نبر الاسم الشائع [aptˈaɪlʊŋ] (القسم) · ومسارا الحوار سُجّلا يدوياً (N-099) كـTunesien/okay/Kreditkarte/regnet
    const lex = JSON.parse(readFileSync(join(CONTENT, "..", "tools/pronunciation-lexicon.json"), "utf8")) as { entries: { word: string; forms: { espeak: string; ipa: string }[]; regeneratedTracks: string[] }[] };
    const abt = lex.entries.find((x) => x.word === "Abteilung")!;
    expect(abt.forms).toEqual([{ espeak: "ˈaptˌaɪlʊŋ", ipa: "aptˈaɪlʊŋ" }]);
    expect([...abt.regeneratedTracks].sort()).toEqual(["km-3", "km-7", "word-abteilung"]);
    expect(lex.entries.find((x) => x.word === "Kreditkarte")!.regeneratedTracks).toEqual(expect.arrayContaining(["km-17", "km-18"]));
    expect(lex.entries.find((x) => x.word === "Tunesien")!.regeneratedTracks).toEqual(expect.arrayContaining(["km-1", "km-20"]));
    // أمثلة البطاقات: «Der Korb/Wagen ist voll.» (voll غير مدروسة) و«Ich zahle mit der Kreditkarte.» (داتيف u8-d4) صُحّحت — وبلا أعلام
    const sample = (id: string) => w(id).sampleSentence!.de;
    expect(l.praesentation.wordIds.map(sample).join(" ")).not.toMatch(/Lena|Yusuf|Berlin|Tunesien|\bvoll\b|mit der Kreditkarte/);
    expect([sample("korb"), sample("wagen"), sample("kreditkarte"), sample("kriegen")]).toEqual(["Brauchst du einen Korb?", "Der Wagen ist zu groß. Ich nehme einen Korb.", "Geht hier die Kreditkarte?", "Wo kriege ich hier einen Gürtel?"]);
    // ملاحظات الجمع بالاصطلاح — wagen/guertel كانتا «Gleich_plural» (N-085) · Stück كمقياس بلا نهاية · Kleidung جامدة
    for (const id of ["stueck", "korb", "wagen", "kleidung", "kreditkarte", "regenschirm", "rucksack", "guertel", "abteilung"]) expect(w(id).pluralRuleNote).not.toContain("Gleich_plural");
    expect(w("wagen").pluralRuleNote).toMatch(/^بلا نهاية: der Wagen ← die Wagen/);
    expect(w("guertel").pluralRuleNote).toMatch(/^بلا نهاية: der Gürtel ← die Gürtel/);
    expect(w("stueck").pluralRuleNote).toContain("zwei Stück Kuchen");
    expect(w("kleidung").pluralRuleNote).toMatch(/بلا جمع.*فعلٌ مفرد/);
    // N-020 لهذا الدرس: الاستدعاء من دروس سابقة (anprobieren · kaufen · bezahlen) — كانت passen وmöglich من كلمات اليوم نفسه
    expect(l.warmup.cardIds).toEqual(["anprobieren", "kaufen", "bezahlen"]);
    expect(l.warmup.cardIds.filter((id) => !earlier.has(id))).toEqual([]);
    const fold = (x: string) => x.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss");
    for (const st of l.uebung.stations) {
      expect(st.interleavedWith.length).toBeGreaterThan(0);
      const text = fold(JSON.stringify(st.items.map((i) => ({ ...i, why: "" }))));
      for (const ref of st.interleavedWith) {
        expect(earlier.has(ref), `${st.type}: ${ref} ليس كلمة درس سابق`).toBe(true);
        expect(text.includes(fold(ref).slice(0, 4)), `${st.type}: ${ref} لا يظهر في بنود المحطة`).toBe(true);
      }
    }
    // الحوار الجديد (km-1..20) كله في الاستماع والإملاء مرة واحدة — والأسطر الثلاثة عشر فوق 132 كلها استماعاً (الإملاء أربعة أسطر ≤132 + خمسة مقاطع)
    const listening = l.uebung.stations.find((s) => s.type === "listening")!;
    const dictation = l.uebung.stations.find((s) => s.type === "dictation")!;
    const audioIds = [...listening.items, ...dictation.items].map((i) => String(i.audioId));
    expect(new Set(audioIds).size).toBe(audioIds.length);
    expect(audioIds.filter((id) => id.startsWith("km-")).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3))))
      .toEqual(Array.from({ length: 20 }, (_, i) => `km-${i + 1}`));
    expect(audioIds.filter((id) => id.startsWith("word-")).sort()).toEqual(["word-abteilung", "word-guertel", "word-kreditkarte", "word-kriegen", "word-rucksack"]);
    expect(audioIds.every((id) => tracks.has(id))).toBe(true);
    const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { speedWpm: number } }[] };
    const wpm = new Map(manifest.tracks.map((t) => [t.id, t.voiceParams.speedWpm]));
    expect(Math.max(...dictation.items.map((i) => wpm.get(String(i.audioId))!))).toBeLessThanOrEqual(132);
    const fast = Array.from({ length: 20 }, (_, i) => `km-${i + 1}`).filter((id) => wpm.get(id)! > 132);
    expect(fast).toHaveLength(13);
    for (const id of fast) expect(listening.items.map((i) => String(i.audioId))).toContain(id);
    // لا مهمة مكررة بين التدريب والـQuiz · ولا جملة إجابة مكررة (ولا من المصائد) · ولا جملة Quiz داخل فراغ مملوء · ولا مقطع كلمة = إجابة Quiz
    const trainingQuestions = new Set(l.uebung.stations.flatMap((s) => s.items.flatMap((i) => typeof i.q === "string" ? [i.q] : [])));
    expect(l.quiz.variants.flatMap((v) => v.items.map((i) => i.q)).some((q) => trainingQuestions.has(q))).toBe(false);
    const answers = new Set([...l.uebung.stations.flatMap((s) => s.items.map((i) => String(i.a))), ...l.zusammenfassung.warningCards.flatMap((c) => [c.correct.de, String(c.exercise.a)])]);
    const quizAnswers = l.quiz.variants.flatMap((v) => v.items.map((i) => String(i.a)));
    expect(quizAnswers.filter((a) => a.includes(" ") && answers.has(a))).toEqual([]);
    const norm = (x: string) => x.toLowerCase().replace(/[^\p{L}\s]/gu, " ").replace(/\s+/g, " ").trim();
    const filled = l.uebung.stations.find((s) => s.type === "gap-fill")!.items.map((i) => norm(String(i.q).replace("___", String(i.a))));
    expect(quizAnswers.filter((a) => a.includes(" ") && filled.some((f) => ` ${f} `.includes(` ${norm(a)} `)))).toEqual([]);
    expect(quizAnswers.filter((a) => ["Rucksack", "Gürtel", "Abteilung", "Kreditkarte", "kriegen", "möglich"].includes(a))).toEqual([]);
    // N-022: هدف الدرس والمهمة والخلاصة بألمانية مدروسة حتى اليوم.
    const taught = knownStems(taughtUpTo(l, realLessons, words));
    const meta = [l.ziel.de, l.uebung.communicativeTask.goal.de, l.uebung.communicativeTask.situation.de, l.zusammenfassung.summary.de];
    const names = new Set(e.properNouns.flatMap((n) => contentTokens(n)));
    expect(meta.flatMap((text) => frontViolations([text], taught, names))).toEqual([]);
  });
  it("D146 مفتاح الإجابة أولاً: كل بند اختيار في الدروس المُرقّاة يكتب إجابته أول الخيارات (العرض يخلطها displayOrder) — فالمفتاح المقلوب إلى مشتِّت يُمسك آلياً · ثلاثة دروس قديمة مستثناة بالاسم", () => {
    // الطفرة «إجابة استماع = مشتِّت» نجت في D146: الإجابة بين الخيارات فيقبلها المخطط، ومعنى الخيار العربي لا يُفحص آلياً.
    // اتفاق التأليف (li/mc: a = choices[0]) يجعل المفتاح المقلوب مخالفةً بنيوية تُرى. الدروس الثلاثة كُتبت قبل الاتفاق ولم تُمسّ (عمل منجز — N-078).
    const LEGACY_ORDER = ["a1-u2-d3", "a1-u2-d4", "a1-u3-d5"];
    const plan = loadUpgradePlans(CONTENT)[0]!;
    const done = plan.lessons.filter((e) => e.rule === "done" && e.practice === "done" && e.quiz === "done").map((e) => e.lessonId);
    const keyedLate = (id: string) => {
      const l = realLessons.find((x) => x.id === id)!;
      const items: { choices: readonly unknown[]; a: unknown }[] = [
        ...l.uebung.stations.flatMap((s) => s.items),
        ...l.quiz.variants.flatMap((v) => v.items),
      ].flatMap((i) => (Array.isArray((i as { choices?: unknown }).choices) ? [i as unknown as { choices: unknown[]; a: unknown }] : []));
      items.push(...l.einstieg.pretestItems.flatMap((p) => (p.choices ? [{ choices: p.choices, a: p.answer }] : [])));
      return items.filter((i) => i.choices[0] !== i.a).length;
    };
    expect(done.length).toBeGreaterThanOrEqual(26);
    expect(done.filter((id) => !LEGACY_ORDER.includes(id) && keyedLate(id) > 0)).toEqual([]);
    // الاستثناء صادق: كل درس مستثنى يخالف فعلاً (إن رُتّب يوماً فليُحذف من القائمة)
    for (const id of LEGACY_ORDER) expect(keyedLate(id), id).toBeGreaterThan(0);
  });

  it("D121 e-upgrade-warmup: بطاقة استدعاء من كلمات اليوم أو لاحقة ⇒ خطأ · أول درس في المسار مستثنى", () => {
    const d4 = realLessons.find((x) => x.id === "a1-u1-d4")!;
    const e = entry({ lessonId: "a1-u1-d4", properNouns: ["Yusuf", "Haddad", "Lena", "Gartenstraße"] });
    const rules = [...loadGrammarRules(CONTENT).values()];
    expect(codes(d4, e, rules)).toEqual([]);
    const today = clone(d4);
    today.warmup.cardIds = ["telefonnummer", "alter"]; // alter: جديدة اليوم
    const issue = lessonIssues(today, e, rules).find((i) => i.code === "e-upgrade-warmup");
    expect(issue?.message).toMatch(/alter/);
    expect(issue?.message).not.toMatch(/telefonnummer/);
    const later = clone(d4);
    later.warmup.cardIds = ["hier"]; // تُدرَّس في u2-d1
    expect(codes(later, e, rules)).toEqual(["e-upgrade-warmup"]);
    // أول درس (u1-d1) لا شيء قبله يُستدعى: بطاقاته من كلماته هو — لا خطأ (الضابط الإيجابي نفسه)
    expect(upgraded().warmup.cardIds.every((id) => real.praesentation.wordIds.includes(id))).toBe(true);
    expect(codes(upgraded())).not.toContain("e-upgrade-warmup");
  });
  it("D121: الأعداد 0–20 صنف مغلق كامل — كانت 13–19 وnull ناقصة («neunzehn» غير مدروسة في درس الأعداد نفسه)", () => {
    const zeroToTwenty = "null eins zwei drei vier fünf sechs sieben acht neun zehn elf zwölf dreizehn vierzehn fünfzehn sechzehn siebzehn achtzehn neunzehn zwanzig".split(" ");
    expect(zeroToTwenty).toHaveLength(21);
    expect(zeroToTwenty.filter((n) => !CLOSED.has(n))).toEqual([]);
  });
});

describe("D115 — الخطة الحقيقية", () => {
  const plans = loadUpgradePlans(CONTENT);
  const plan = plans.find((p) => p.id === "a1-lesson-upgrade")!;
  const ctx: UpgradeContext = { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) };
  it("تغطي دروس المحتوى الستين في الوحدات 1–12 بالضبط — لا درس منسي ولا زائد", () => {
    const expected = realLessons.filter((l) => l.level === "A1" && l.kind === "content" && l.unit <= 12).map((l) => l.id).sort();
    expect(plan.lessons.map((e) => e.lessonId).sort()).toEqual(expected);
    expect(expected).toHaveLength(60);
  });
  it("الحارس: صفر مشكلة على المحتوى الحقيقي (done مُثبت · pending معلن) — ولا تنبيه أيضاً (البوابة 0/0)", () => {
    expect(checkUpgrade(plan, ctx).filter((i) => i.level === "error")).toEqual([]);
    expect(checkGrammarRules(ctx).filter((i) => i.level === "error")).toEqual([]);
    // D125: التنبيهات كانت تظهر في المدقِّق وحده (اسم علم معلن لا يُستعمل · pending يستوفي المعايير) — الآن يمسكها الاختبار أيضاً
    expect(checkUpgrade(plan, ctx)).toEqual([]);
    expect(checkGrammarRules(ctx)).toEqual([]);
  });
});
