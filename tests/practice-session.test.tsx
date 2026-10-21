// tests/practice-session.test.tsx — التدريب المُنمَّط وقاعدة اليوم في المُشغِّل (D115)
// المنطق خالص (Node) + رسم ثابت للواجهة: لا «لماذا» ولا إجابة قبل المحاولة (F121) · بلا لوم (D23).
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BuildSentenceItem, GrammarRuleFile, type Lesson } from "../content/schemas/index.js";
import {
  checkAttempt, initialPractice, nextItem, normalizeAnswer, submitAttempt, toTypedItem, type TypedItem,
} from "../src/lib/practice-session.js";
import { ruleFromShufra, startDiscovery, viewExamples, submitInference, revealRule } from "../src/lib/grammar-discovery.js";
import { hasBlame } from "../src/lib/warmth-engine.js";
import { LearnStation, PracticeStation, RuleDiscoveryView } from "../src/components/LessonContent.js";
import { planLessonStations } from "../src/lib/lesson-runner.js";
import { loadFirstSession } from "../src/lesson-packs.js";
const __FIRST = await loadFirstSession();
const firstLesson = __FIRST.lesson;
const firstLessonWords = __FIRST.direct;


const WHY = "لأن الفعل مع ich ينتهي بـ ‑e";
const typed = (type: Parameters<typeof toTypedItem>[0], raw: unknown) => {
  const t = toTypedItem(type, raw);
  if (!t) throw new Error(`لم يُنمَّط: ${type}`);
  return t;
};

describe("toTypedItem — البند المُنمَّط بالمخطط نفسه الذي يفرضه الحارس", () => {
  it("كل طريقة تفاعل من نوع محطتها", () => {
    expect(typed("listening", { audioId: "word-hallo", speakText: "Hallo.", q: "؟", choices: ["Hallo", "Tschüss"], a: "Hallo", why: WHY }))
      .toMatchObject({ kind: "choice", audio: { audioId: "word-hallo" } });
    expect(typed("dictation", { audioId: "word-danke", speakText: "Danke.", a: "Danke", why: WHY })).toMatchObject({ kind: "input", mode: "dictation" });
    expect(typed("gap-fill", { q: "Ich ___ Yusuf.", a: "heiße", why: WHY })).toMatchObject({ kind: "input", mode: "gap" });
    expect(typed("error-hunt", { q: "Ich Yusuf.", a: "Ich bin Yusuf.", why: WHY })).toMatchObject({ kind: "input", mode: "correct" });
    expect(typed("build-sentence", { tokens: ["bin", "Ich", "neu."], a: "Ich bin neu.", why: WHY })).toMatchObject({ kind: "order" });
    expect(typed("speaking", { q: "عرّف بنفسك", a: "Ich heiße Yusuf.", why: WHY })).toMatchObject({ kind: "production" });
    expect(typed("match", { pairs: [{ de: "Hallo", ar: "مرحبا" }, { de: "Danke", ar: "شكراً" }, { de: "Bitte", ar: "عفواً" }], why: WHY })).toMatchObject({ kind: "match" });
    expect(typed("reading", { text: "Ich bin Yusuf.", q: "ما اسمه؟", a: "Yusuf", why: WHY })).toMatchObject({ kind: "input", mode: "short" });
  });
  it("البند القديم (بلا why) = null ← يبقى بسلوكه القديم «أظهر الإجابة»", () => {
    expect(toTypedItem("choice", { q: "«طاب يومك»؟", a: "Guten Tag" })).toBeNull();
    expect(toTypedItem("gap-fill", { q: "Ich ___ Yusuf.", a: "heiße", why: "short" })).toBeNull();
  });
});

describe("checkAttempt — تصحيح تفسيري لطيف", () => {
  const gap = typed("gap-fill", { q: "Ich ___ Yusuf.", a: "heiße", accept: ["heisse"], why: WHY });
  it("الفراغ: صحيح · بديل مقبول · فراغات/نقطة أخيرة لا تُحسب · حرف كبير فقط = قريب · غير ذلك = ليس بعد", () => {
    expect(checkAttempt(gap, "heiße").status).toBe("correct");
    expect(checkAttempt(gap, "heisse").status).toBe("correct");
    expect(checkAttempt(gap, "  heiße. ").status).toBe("correct");
    expect(checkAttempt(gap, "Heiße").status).toBe("close");
    const v = checkAttempt(gap, "heißt");
    expect(v).toMatchObject({ status: "retry", expected: "heiße", why: WHY });
  });
  it("الإملاء عبر محرك النسخ (compareDictation): النقطة الأخيرة لا تُحسب · الحرف الكبير قريب", () => {
    const d = typed("dictation", { audioId: "word-tschuess", speakText: "Tschüss.", a: "Tschüss", why: WHY });
    expect(checkAttempt(d, "Tschüss.").status).toBe("correct");
    expect(checkAttempt(d, "tschüss").status).toBe("close");
    expect(checkAttempt(d, "Tschau").status).toBe("retry");
  });
  it("الترتيب · الاختيار · التوصيل · الإنتاج الحر (تقييم ذاتي — لا حكم آلي)", () => {
    const o = typed("build-sentence", { tokens: ["bin", "Ich", "neu."], a: "Ich bin neu.", why: WHY });
    expect(checkAttempt(o, ["Ich", "bin", "neu."]).status).toBe("correct");
    expect(checkAttempt(o, ["bin", "Ich", "neu."]).status).toBe("retry");
    const c = typed("choice", { q: "؟", choices: ["Guten Morgen", "Guten Abend"], a: "Guten Morgen", why: WHY });
    expect(checkAttempt(c, "Guten Abend")).toMatchObject({ status: "retry", expected: "Guten Morgen" });
    const m = typed("match", { pairs: [{ de: "Hallo", ar: "مرحبا" }, { de: "Danke", ar: "شكراً" }, { de: "Bitte", ar: "عفواً" }], why: WHY });
    expect(checkAttempt(m, { Hallo: "مرحبا", Danke: "شكراً", Bitte: "عفواً" }).status).toBe("correct");
    expect(checkAttempt(m, { Hallo: "شكراً", Danke: "مرحبا", Bitte: "عفواً" }).noteAr).toContain("1 من 3");
    expect(checkAttempt(typed("speaking", { q: "عرّف بنفسك", a: "Ich heiße Yusuf.", why: WHY }), "").status).toBe("self");
  });
  it("كل نصوص التغذية الراجعة خالية من اللوم (D23)", () => {
    const items: [TypedItem, Parameters<typeof checkAttempt>[1]][] = [
      [gap, "x"], [gap, "Heiße"], [typed("dictation", { audioId: "word-danke", speakText: "Danke.", a: "Danke", why: WHY }), "Bitte"],
      [typed("build-sentence", { tokens: ["bin", "Ich", "neu."], a: "Ich bin neu.", why: WHY }), ["neu."]],
    ];
    for (const [it_, a] of items) expect(hasBlame(checkAttempt(it_, a).noteAr)).toBe(false);
    expect(normalizeAnswer(" Wie  geht’s? ")).toBe("Wie geht's");
  });
});

describe("مسار المحطة — F121: لا انتقال قبل المحاولة", () => {
  const stations = [{ items: [1, 2] }, { items: [3] }];
  const item = typed("gap-fill", { q: "Ich ___ Yusuf.", a: "heiße", why: WHY });
  it("التالي يرمي قبل المحاولة · المحاولة مرة واحدة (لا يُعاد كتابة التصحيح) · العبور بين المحطات", () => {
    const s0 = initialPractice();
    expect(() => nextItem(s0, stations)).toThrow(/F121/);
    const s1 = submitAttempt(s0, item, "heißt");
    expect(submitAttempt(s1, item, "heiße").verdict!.status).toBe("retry");
    const s2 = nextItem(s1, stations);
    expect(s2).toEqual({ station: 0, item: 1, verdict: null });
    expect(nextItem(submitAttempt(s2, item, "heiße"), stations)).toEqual({ station: 1, item: 0, verdict: null });
  });
});

const ruleFile = GrammarRuleFile.parse({
  schemaVersion: "1.0.0", id: "ars-test-sein", kind: "shufra", constitutionSection: "10‑ي",
  title: { de: "sein", ar: "فعل الكينونة" }, levelIntroduced: "A1", usedInLessons: ["a1-u1-d1"],
  payload: {
    topicAr: "الفعل sein", sceneAr: "يوسف في أول يوم",
    examples: [{ de: "Ich bin Yusuf.", ar: "أنا يوسف." }, { de: "Du bist neu.", ar: "أنت جديد." }, { de: "Lena ist aus Deutschland.", ar: "لينا من ألمانيا." }],
    inferencePromptAr: "ما الكلمة بعد الضمير؟", ruleDe: "ich bin · du bist · er/sie ist · Sie sind",
    ruleAr: "الجملة الألمانية تحتاج فعلاً دائماً", contrastAr: "العربية تحذف الرابط (خريطة التداخل 10‑ي)",
    limitsAr: ["صيغ الجمع لاحقاً"], beads: ["Ich", "bin", "aus", "Tunesien."], properNouns: ["Yusuf", "Lena"],
  },
});
const rule = ruleFromShufra(ruleFile);

describe("قاعدة اليوم من المحتوى (D115)", () => {
  it("ruleFromShufra بلا إعادة صياغة · المحرك يقبل الكائن · الكشف يحمل الحدود · والأقفال كما هي", () => {
    expect(rule).toMatchObject({ id: "ars-test-sein", sceneAr: "يوسف في أول يوم", limitsAr: ["صيغ الجمع لاحقاً"] });
    const s = startDiscovery(rule);
    expect(() => revealRule(s, rule)).toThrow(/قبل المثال/);
    viewExamples(s, rule);
    expect(() => revealRule(s, rule)).toThrow(/محاول/);
    submitInference(s, "bin بعد ich");
    expect(revealRule(s, rule).limitsAr).toEqual(["صيغ الجمع لاحقاً"]);
  });
  it("الواجهة: المشهد والأمثلة والسؤال ظاهرة · الكشف مقفل · لا قاعدة ولا مقارنة ولا حبّات قبل المحاولة", () => {
    const html = renderToStaticMarkup(<RuleDiscoveryView rule={rule} />);
    expect(html).toContain("يوسف في أول يوم");
    expect(html).toContain("Ich bin Yusuf.");
    expect(html).toContain('data-testid="reveal-rule" data-locked="true"');
    expect(html).not.toContain(rule.ruleAr);
    expect(html).not.toContain("خريطة التداخل");
    expect(html).not.toContain('data-testid="beads"');
  });
  it("محطة «الجديد»: القاعدة بعد آخر بطاقة (لا قبلها) · وبلا ملف قاعدة لا شاشة فارغة", () => {
    expect(renderToStaticMarkup(<LearnStation cards={[]} rules={[rule]} />)).toContain('data-testid="rule-discovery"');
    expect(renderToStaticMarkup(<LearnStation cards={[]} />)).toContain('data-testid="learn-done"');
    const plan = planLessonStations(firstLesson, firstLessonWords, [rule]);
    const withCards = renderToStaticMarkup(<LearnStation cards={plan.learn} rules={[rule]} />);
    expect(withCards).toContain('data-testid="learn-station"');
    expect(withCards).toContain("ثم قاعدة اليوم");
    expect(withCards).not.toContain('data-testid="rule-discovery"');
  });
  it("المُشغِّل يحلّ معرّفات الدرس التي لها ملف فقط — وبلا قواعد = []", () => {
    const lesson: Lesson = { ...firstLesson, praesentation: { ...firstLesson.praesentation, grammarArsenalIds: ["ars-test-sein", "ars-not-written"] } };
    expect(planLessonStations(lesson, firstLessonWords, [rule]).rules.map((r) => r.id)).toEqual(["ars-test-sein"]);
    expect(planLessonStations(firstLesson, firstLessonWords).rules).toEqual([]);
  });
});

describe("محطة التدريب في الواجهة", () => {
  const practice = (items: unknown[], type: Lesson["uebung"]["stations"][number]["type"]) => ({
    stations: [{ type, items: items as Record<string, unknown>[], interleavedWith: [], explanationRequired: true }],
    communicativeTask: firstLesson.uebung.communicativeTask,
    dialogues: [],
  });
  it("بند مُنمَّط: السؤال وطريقة الإجابة ظاهران — لا why ولا الإجابة قبل المحاولة (F121)", () => {
    const html = renderToStaticMarkup(<PracticeStation data={practice([{ q: "Ich ___ Yusuf.", a: "heiße", why: WHY }], "gap-fill")} />);
    expect(html).toContain("Ich ___ Yusuf.");
    expect(html).toContain('data-testid="practice-input"');
    expect(html).not.toContain(WHY);
    expect(html).not.toContain("heiße");
    expect(html).not.toContain('data-testid="practice-feedback"');
  });
  it("الاستماع: زر الصوت + الخيارات · الإملاء: لا يُطبع النص المسموع أبداً قبل المحاولة", () => {
    const l = renderToStaticMarkup(<PracticeStation data={practice([{ audioId: "word-guten-morgen", speakText: "Guten Morgen.", q: "ماذا سمعت؟", choices: ["Guten Morgen", "Guten Abend"], a: "Guten Morgen", why: WHY }], "listening")} />);
    expect(l).toContain('data-testid="choice-1"');
    expect(l).not.toContain(WHY);
    const d = renderToStaticMarkup(<PracticeStation data={practice([{ audioId: "word-tschuess", speakText: "Tschüss.", a: "Tschüss", why: WHY }], "dictation")} />);
    expect(d).toContain("استمع واكتب");
    expect(d).not.toContain("Tschüss");
  });
  it("بند قديم: «أظهر الإجابة» كما كان (توافق كامل مع الدروس غير المُرقّاة)", () => {
    const html = renderToStaticMarkup(<PracticeStation data={practice([{ q: "«طاب يومك»؟", a: "Guten Tag" }], "choice")} />);
    expect(html).toContain('data-testid="practice-reveal"');
    expect(html).not.toContain("Guten Tag");
  });
});

describe("N-055 (D229) — الترتيب الثاني المصرَّح به مقبول (accept)", () => {
  it("المحرّك: الترتيبان صحيحان · وغيرهما ليس بعد", () => {
    // تبديل وسطي بالبطاقات نفسها حرفياً (TEKAMOLO) — الحرف الكبير يمنع عادةً ترتيباً ثانياً في الأول (D130)
    const o = typed("build-sentence", {
      tokens: ["Stadt.", "heute", "Ich", "in", "mit", "die", "dem", "Bus", "fahre"], // غير مرتبة سلفاً (شرط المخطط)
      a: "Ich fahre heute mit dem Bus in die Stadt.",
      accept: ["Ich fahre mit dem Bus heute in die Stadt."],
      why: WHY,
    });
    expect(o).toMatchObject({ kind: "order", accept: ["Ich fahre mit dem Bus heute in die Stadt."] });
    expect(checkAttempt(o, ["Ich", "fahre", "heute", "mit", "dem", "Bus", "in", "die", "Stadt."]).status).toBe("correct");
    expect(checkAttempt(o, ["Ich", "fahre", "mit", "dem", "Bus", "heute", "in", "die", "Stadt."]).status).toBe("correct");
    expect(checkAttempt(o, ["Heute", "fahre", "ich", "mit", "dem", "Bus", "in", "die", "Stadt."]).status).toBe("retry"); // ليست من البطاقات
  });

  it("المخطط: accept من البطاقات نفسها حرفياً · ولا يكرر الإجابة · ولا يكرر نفسه", () => {
    const base = { tokens: ["bin", "Ich", "neu."], a: "Ich bin neu.", why: WHY };
    expect(BuildSentenceItem.safeParse({ ...base, accept: ["Ich neu. bin"] }).success).toBe(true);
    expect(BuildSentenceItem.safeParse({ ...base, accept: ["Ich bin müde."] }).success).toBe(false); // ليست من البطاقات
    expect(BuildSentenceItem.safeParse({ ...base, accept: ["Ich bin neu."] }).success).toBe(false); // تكرار الإجابة
    expect(BuildSentenceItem.safeParse({ ...base, accept: ["Ich neu. bin", "Ich neu. bin"] }).success).toBe(false); // تكرار نفسه
    expect(BuildSentenceItem.safeParse(base).success).toBe(true); // اختياري — الـ390 بنداً بلا accept صالحة
  });
});
