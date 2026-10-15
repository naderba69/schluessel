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
const legacy = realLessons.find((l) => l.id === "a1-u3-d5")!; // لم يُرقَّ بعد (u1-d1..d5 + u2-d1..d5 + u3-d1..d4 مُرقّاة — D116 · D119 · D120 · D121 · D123 · D125 · D126 · D127 · D128 · D130 · D131 · D132 · D133 · D134)

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
    expect(codes(legacy, entry({ lessonId: "a1-u3-d5", rule: "pending", practice: "pending", quiz: "pending" }), [])).toEqual([]);
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
  it("درس حقيقي لم يُرقَّ (a1-u3-d5): يُشخَّص بدقة (قاعدة بلا ملف · 6 بنود · أمثلة وتمارين وQuiz فيها غير المدروس)", () => {
    const r = inspectLesson(legacy, { properNouns: [] }, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect(r.practiceItems).toBeLessThan(12);
    expect(r.rule.map((i) => i.code)).toEqual(expect.arrayContaining(["e-upgrade-rule", "e-upgrade-sample"]));
    // D134: فجواته مقيسة قبل نقل المثال إليه — مثال laut فيه Radio · مثال stimme فيه ruhig · مثال noch فيه einmal (نواة الدرس) ·
    // وتمارينه فيها Dativ وRadio وstehe (aufstehen — الوحدة 7) · وفي الـQuiz Dativ
    const front = r.practice.find((i) => i.code === "e-upgrade-front")?.message;
    expect(front).toMatch(/radio/);
    expect(front).toMatch(/stehe/);
    const samples = r.rule.map((i) => i.message).join("\n");
    expect(samples).toMatch(/radio/);
    expect(samples).toMatch(/ruhig/);
    expect(r.quiz.find((i) => i.code === "e-upgrade-front")?.message).toMatch(/dativ/);
    expect(r.coverage).toEqual([]);
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
