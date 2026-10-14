// tests/lesson-upgrade.test.ts — حارس ترقية الدروس (D114 → D115)
// ضابط إيجابي: درس مُرقّى كامل (من كلمات a1-u1-d1 الحقيقية) = صفر مشكلة.
// ضوابط سلبية: كل معيار يُكسر وحده فيظهر رمزه بالضبط — «done» لا يمر بالكلام.
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import {
  GrammarRuleFile, LessonUpgradePlan, ShufraPayload, type Lesson, type LessonUpgradeEntry,
} from "../content/schemas/index.js";
import { loadAudioTracks, loadGrammarRules, loadLessons, loadUpgradePlans, loadWords } from "../tools/lib/content-disk.js";
import {
  checkGrammarRules, checkUpgrade, germanOnly, inspectLesson, taughtUpTo, wordAppears, type UpgradeContext,
} from "../tools/lib/lesson-upgrade.js";
import { contentTokens, deumlaut } from "../tools/lib/vocab-forms.js";

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
  lessonId: "a1-u1-d1", rule: "done", practice: "done", quiz: "done", properNouns: ["Yusuf", "Lena", "Tunis"], ...over,
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
const legacy = realLessons.find((l) => l.id === "a1-u1-d4")!; // لم يُرقَّ بعد (u1-d2 · u1-d3 مُرقّيان — D119 · D120)

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
    expect(codes(legacy, entry({ lessonId: "a1-u1-d4", rule: "pending", practice: "pending", quiz: "pending" }), [])).toEqual([]);
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
  it("درس حقيقي لم يُرقَّ (a1-u1-d4): يُشخَّص بدقة (قاعدة بلا ملف · 6 بنود · أمثلة فيها غير المدروس · كلمات بلا استرجاع)", () => {
    const r = inspectLesson(legacy, { properNouns: [] }, { lessons: realLessons, words, tracks, rules: loadGrammarRules(CONTENT) });
    expect(r.practiceItems).toBeLessThan(12);
    expect(r.rule.map((i) => i.code)).toEqual(expect.arrayContaining(["e-upgrade-rule", "e-upgrade-sample"]));
    expect(r.coverage.map((i) => i.code)).toContain("e-upgrade-word-unpracticed");
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
  it("الحارس: صفر خطأ على المحتوى الحقيقي (done مُثبت · pending معلن)", () => {
    expect(checkUpgrade(plan, ctx).filter((i) => i.level === "error")).toEqual([]);
    expect(checkGrammarRules(ctx).filter((i) => i.level === "error")).toEqual([]);
  });
});
