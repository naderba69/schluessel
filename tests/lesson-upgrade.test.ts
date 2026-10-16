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
import { CLOSED, COMPOUND_NUMBER, GRAPHEMES, HUNDREDS_NUMBER, compoundNumberKnown, contentTokens, deumlaut, knownForms, knownStems, numberWordKnown } from "../tools/lib/vocab-forms.js";

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
const legacy = realLessons.find((l) => l.id === "a1-u6-d4")!; // المثال غير المُرقّى ينتقل كل دفعة؛ بعد D148 صار u1..u5 d1..d5 + u6-d1..d3 مُرقّى

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
    expect(codes(legacy, entry({ lessonId: "a1-u6-d4", rule: "pending", practice: "pending", quiz: "pending" }), [])).toEqual([]);
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
  it("الدرس التالي غير المُرقّى (a1-u6-d4 بعد D148): يُشخَّص من محتواه الفعلي لا من فجوات الدفعة السابقة", () => {
    const r = inspectLesson(legacy, { properNouns: [] }, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect(r.practiceItems).toBe(6);
    // بعد D148 صار u6-d3 مكتملاً؛ الفجوات الفعلية لـu6-d4 (مقيسة قبل النقل): لا ملف ars-wo-wohin (وأمثلة البطاقات سليمة للحارس)
    // · 6 بنود choice بلا خيارات (e-upgrade-item لكلٍّ) ونوع واحد بلا استماع ولا إملاء · مصطلحا «Akkusativ/Dativ» في الـQuiz · Quiz 3×4 — القياس لا التخمين
    expect(r.rule.map((i) => i.code)).toEqual(["e-upgrade-rule"]);
    expect(r.rule[0]?.message).toMatch(/ars-wo-wohin/);
    expect(r.practice.map((i) => i.code).sort()).toEqual([
      ...Array(6).fill("e-upgrade-item"), "e-upgrade-practice-audio", "e-upgrade-practice-audio", "e-upgrade-practice-size", "e-upgrade-practice-types",
    ].sort());
    expect(r.quiz.map((i) => i.code)).toEqual(["e-upgrade-quiz-size", "e-upgrade-quiz-size", "e-upgrade-quiz-size", "e-upgrade-front"]);
    expect(r.quiz.find((i) => i.code === "e-upgrade-front")?.message).toMatch(/akkusativ.*dativ/);
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
    expect(lex.entries.find((x) => x.word === "Badezimmer")).toMatchObject({ forms: [{ espeak: "bˈɑdeːtsˌɪmɜ", ipa: "bˈɑːdətsˌɪmɜ" }], regeneratedTracks: ["word-badezimmer", "zi-8", "zi-16"] });
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
