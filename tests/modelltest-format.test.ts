// tests/modelltest-format.test.ts — D109: الامتحان التجريبي بالصيغة الرسمية بنداً بنداً
// مفتاح إجابة بدليل حرفي (مخطط + مدقِّق) · توازن المفتاح · قفل المفردات (قانون الجبهة 13) · المحتوى الحقيقي.
import { describe, it, expect } from "vitest";
import type { z } from "zod";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  Modelltest, ExamFormat, AudioScript, AudioManifest, evidenceIn, normalizeEvidence, answerSupported, TASKS_FOR_SKILL,
} from "../content/schemas/index.js";
import { validateContentTree, loadContentDir } from "../tools/validate-content.js";
import { VOICE_ID_FEMALE } from "../src/lib/audio.js";

const C = join(process.cwd(), "content");
const read = (p: string) => JSON.parse(readFileSync(join(C, p), "utf8"));
const P = { de: "x", ar: "س" };
const RF = ["Richtig", "Falsch"];

type MtInput = z.input<typeof Modelltest>;
type Part = MtInput["sections"][number]["parts"][number];

/** امتحان صغير صالح يغطي كل أنواع المهام المستعملة — كل اختبار يُفسده في نقطة واحدة */
const FIXTURE: MtInput = {
  schemaVersion: "1.0.0", id: "mt-x", level: "A1", title: { de: "T", ar: "ت" }, passingScore: 0.6, sourceNote: "s",
  properNouns: ["Lena"],
  sections: [
    { skill: "hoeren", timeBudgetMin: 20, instructions: P, parts: [
      { id: "hoeren-1", prompt: P, taskType: "mc3", playCount: 2, audioScriptRef: "s-1",
        items: [{ q: "Was trinkt Lena?", a: "Wasser", choices: ["Kaffee", "Wasser", "Milch"], audioRefs: ["s-1-l1"], evidence: "ein Wasser" }] },
      { id: "hoeren-2", prompt: P, taskType: "richtig-falsch", playCount: 1, audioScriptRef: "s-1",
        items: [{ q: "Lena trinkt Wasser.", a: "Richtig", choices: RF, audioRefs: ["s-1-l1"], evidence: "ein Wasser" }] },
    ] },
    { skill: "lesen", timeBudgetMin: 25, instructions: P, parts: [
      { id: "lesen-1", prompt: P, taskType: "a-b",
        texts: [{ id: "ta", kind: "anzeige", de: "Bäckerei: Sonntag geöffnet." }, { id: "tb", kind: "anzeige", de: "Bäckerei: Sonntag geschlossen." }],
        items: [{ q: "Sie möchten am Sonntag Brot kaufen.", a: "a", choices: ["a", "b"], textRefs: ["ta", "tb"], evidence: "Sonntag geöffnet" }] },
      { id: "lesen-2", prompt: P, taskType: "richtig-falsch", texts: [{ id: "sign", kind: "schild", de: "Montag geschlossen." }],
        items: [{ q: "Am Montag kann man kaufen.", a: "Falsch", choices: RF, textRefs: ["sign"], evidence: "Montag geschlossen" }] },
    ] },
    { skill: "schreiben", timeBudgetMin: 20, instructions: P, parts: [
      { id: "schreiben-1", prompt: P, taskType: "formular", texts: [{ id: "sit", kind: "situation", de: "Lena kommt am 6. Juni mit dem Zug." }],
        items: [{ q: "Ankunft:", a: "6. Juni", textRefs: ["sit"], evidence: "am 6. Juni" }] },
    ] },
    { skill: "sprechen", timeBudgetMin: 15, instructions: P, parts: [
      { id: "sprechen-1", prompt: P, taskType: "freies-sprechen", items: [{ q: "Name?", a: "Ich heiße Lena." }] },
    ] },
  ],
};
type T = MtInput;
const valid = (): T => structuredClone(FIXTURE);
const parse = (t: T) => Modelltest.parse(t);
const fails = (mutate: (t: T) => void, msg: RegExp) => {
  const t = valid();
  mutate(t);
  expect(() => parse(t)).toThrow(msg);
};
// وصول مختصر للأجزاء (h1/h2 استماع · l1 a-b · l2 لافتة · s1 استمارة · sp1 كلام)
const part = (t: T, s: number, p: number): Part => t.sections[s]!.parts[p]!;
const h1 = (t: T) => part(t, 0, 0);
const h2 = (t: T) => part(t, 0, 1);
const l1 = (t: T) => part(t, 1, 0);
const l2 = (t: T) => part(t, 1, 1);
const s1 = (t: T) => part(t, 2, 0);
const sp1 = (t: T) => part(t, 3, 0);

describe("D109 — مفتاح الإجابة: دوال الدليل", () => {
  it("التطبيع: الحالة والاقتباس والشرطات والمسافات فقط — الدليل اقتباس متصل لا إعادة صياغة", () => {
    expect(normalizeEvidence("  «Montag–Freitag»   8 Uhr ")).toBe("montag-freitag 8 uhr");
    expect(evidenceIn("montag - freitag", "Montag — Freitag")).toBe(true); // أنواع الشرطات كلها «-»
    expect(evidenceIn("Montag-Freitag", "Montag–Freitag geöffnet")).toBe(true);
    expect(evidenceIn("Montag-Freitag", "Montag - Freitag")).toBe(false); // المسافات جزء من الاقتباس
    expect(evidenceIn("Sonntag geöffnet", "Auch am Sonntag von 8 bis 11 Uhr geöffnet!")).toBe(false);
    expect(evidenceIn("", "x")).toBe(false);
  });
  it("answerSupported (مشترك المخطط/المدقِّق): «3» = drei · «6. Juni» يجد 6 وjuni", () => {
    expect(answerSupported("3", "drei Nächte").ok).toBe(true);
    expect(answerSupported("6. Juni", "am 6. Juni").ok).toBe(true);
    expect(answerSupported("7. Juni", "am 6. Juni").missing).toEqual(["7"]);
  });
});

describe("D109 — قواعد المخطط: كل نوع مهمة بشروطه", () => {
  it("الامتحان الصغير الصالح يمر", () => {
    expect(parse(valid()).sections).toHaveLength(4);
    expect(TASKS_FOR_SKILL.sprechen).toEqual(["freies-sprechen"]);
  });
  it("مهمة لا تصلح لمهارتها · Hören بلا مرات سماع · صوت في القراءة = رفض", () => {
    fails((t) => { sp1(t).taskType = "richtig-falsch"; }, /لا تصلح لمهارة sprechen/);
    fails((t) => { delete h1(t).playCount; }, /بلا مرات سماع/);
    fails((t) => { l2(t).playCount = 1; }, /صوت في غير الاستماع/);
  });
  it("mc3 = ثلاثة خيارات مختلفة · Richtig/Falsch حرفياً بترتيبه · الجواب بين الخيارات", () => {
    fails((t) => { h1(t).items[0]!.choices = ["Kaffee", "Wasser"]; }, /ثلاثة خيارات/);
    fails((t) => { h1(t).items[0]!.choices = ["Wasser", "Wasser", "Milch"]; }, /ثلاثة خيارات/);
    fails((t) => { h2(t).items[0]!.choices = ["Falsch", "Richtig"]; }, /Richtig\/Falsch حرفياً/);
    fails((t) => { h1(t).items[0]!.a = "Tee"; }, /ليس بين الخيارات/);
  });
  it("لا جواب استماع/قراءة/استمارة بلا دليل", () => {
    fails((t) => { delete h2(t).items[0]!.evidence; }, /بلا دليل حرفي/);
    fails((t) => { delete l2(t).items[0]!.evidence; }, /بلا دليل حرفي/);
    fails((t) => { delete s1(t).items[0]!.evidence; }, /بلا دليل حرفي/);
  });
  it("a-b: نصّان بالضبط · الدليل في النص المختار تحديداً (مفتاح يشير إلى النص الخطأ = رفض)", () => {
    fails((t) => { l1(t).items[0]!.textRefs = ["ta"]; }, /نصّان بالضبط/);
    fails((t) => { l1(t).items[0]!.a = "b"; }, /ليس اقتباساً حرفياً من tb/);
  });
  it("القراءة: الدليل اقتباس حرفي (إعادة الصياغة مرفوضة) · الإحالة إلى نص موجود · لا نص يتيم", () => {
    fails((t) => { l2(t).items[0]!.evidence = "am Montag zu"; }, /ليس اقتباساً حرفياً/);
    fails((t) => { l2(t).items[0]!.textRefs = ["ghost"]; }, /إحالة إلى نص غير موجود/);
    fails((t) => { l2(t).texts!.push({ id: "extra", kind: "schild", de: "Ausgang" }); }, /نص لا يسأل عنه أي بند: lesen-2\/extra/);
  });
  it("الاستمارة: الجواب وارد في دليله (لا استنتاج خارج النص)", () => {
    fails((t) => { s1(t).items[0]!.a = "7. Juni"; }, /غير وارد في دليله/);
  });
  it("معرّف جزء مكرر · اسم علم بحرف صغير · مهارة مكررة = رفض", () => {
    fails((t) => { h2(t).id = "hoeren-1"; }, /معرّف جزء مكرر/);
    fails((t) => { t.properNouns = ["lena"]; }, /حرف كبير/);
    fails((t) => { t.sections[3]!.skill = "lesen"; }, /المهارات الأربع/);
  });
});

describe("D109 — قواعد المدقِّق: التوازن وقفل المفردات وأسماء العلم", () => {
  // كلمات المحتوى الحقيقية (A1 + A2) — قفل المفردات يقيس عليها
  const words = loadContentDir(C).filter((e) => e.path.startsWith("words/"));
  const tree = (t: T) => [...words, { path: "modelltest/mt-x.json", data: t }];
  const issues = (t: T, code: string) => {
    const r = validateContentTree(tree(t));
    return [...r.errors, ...r.warnings].filter((i) => i.code === code).map((i) => i.message);
  };
  const sayIt = (t: T, a: string) => { sp1(t).items[0]!.a = a; };

  it("نص من مفردات A1 المدروسة + اسم علم مُعلن = صفر مخالفات", () => {
    expect(issues(valid(), "e-modelltest-vocab")).toEqual([]);
    expect(issues(valid(), "w-modelltest-proper-noun")).toEqual([]);
  });
  it("كلمة غير مدروسة = e-modelltest-vocab يسمّي الجزء والكلمة", () => {
    const t = valid();
    sayIt(t, "Ich heiße Lena und ich trinke Wasser auf der Konferenz."); // D204: Hochzeit صارت مدروسة (u13-d1)
    expect(issues(t, "e-modelltest-vocab")).toEqual([expect.stringMatching(/^sprechen-1: .*konferenz$/)]);
  });
  it("كلمة A2 في امتحان A1 = مخالفة · والامتحان نفسه بمستوى A2 = مقبول (المستوى وما قبله)", () => {
    const t = valid();
    sayIt(t, "Ich habe das Wasser vergessen.");
    expect(issues(t, "e-modelltest-vocab").join()).toContain("vergessen");
    t.level = "A2";
    expect(issues(t, "e-modelltest-vocab")).toEqual([]);
  });
  it("اسم العلم يُستثنى بإعلانه فقط — وإعلان اسم لا يظهر = تحذير (لا باب خلفي)", () => {
    const t = valid();
    t.properNouns = [];
    expect(issues(t, "e-modelltest-vocab").join()).toContain("lena");
    t.properNouns = ["Lena", "Karim"];
    expect(issues(t, "w-modelltest-proper-noun")).toEqual(["اسم علم مُعلن لا يظهر في نصوص الامتحان: Karim"]);
  });
  it("التوازن: جزء Richtig/Falsch كل أجوبته واحدة = w-modelltest-balance · والمختلط لا", () => {
    const t = valid();
    const item = l2(t).items[0]!;
    l2(t).texts![0]!.de = "Montag geschlossen. Dienstag geöffnet. Mittwoch geöffnet.";
    l2(t).items = [item, { ...item, q: "Dienstag zu.", evidence: "Dienstag geöffnet" }, { ...item, q: "Mittwoch zu.", evidence: "Mittwoch geöffnet" }];
    expect(issues(t, "w-modelltest-balance")).toEqual(["lesen-2: كل الأجوبة «Falsch» — مفتاح يُخمَّن"]);
    l2(t).items[1] = { ...item, q: "Dienstag offen.", a: "Richtig", evidence: "Dienstag geöffnet" };
    expect(issues(t, "w-modelltest-balance")).toEqual([]);
  });
});

describe("D109 — المحتوى الحقيقي: a1-modelltest-1 = صيغة Start Deutsch 1 بنداً بنداً", () => {
  const test = Modelltest.parse(read("modelltest/a1-modelltest-1.json"));
  const fmt = ExamFormat.parse(read("exam-formats/goethe-a1-sd1.json"));
  const parts = (skill: string) => test.sections.find((s) => s.skill === skill)!.parts;

  it("لكل مهارة: المدة وعدد الأجزاء ونوع كل مهمة وعدد بنودها ومرات سماعها = الوثيقة الرسمية", () => {
    for (const official of fmt.skills) {
      const ours = test.sections.find((s) => s.skill === official.skill)!;
      expect(ours.timeBudgetMin, official.skill).toBe(official.minutes);
      expect(ours.parts.map((p) => p.taskType)).toEqual(official.parts.map((p) => p.kind));
      official.parts.forEach((op, i) => {
        if (op.items) expect(ours.parts[i]!.items.length, `${official.skill} ${op.part}`).toBe(op.items);
        if (op.playCount) expect(ours.parts[i]!.playCount, `${official.skill} ${op.part}`).toBe(op.playCount);
      });
    }
    expect(parts("hoeren").map((p) => p.items.length)).toEqual([6, 4, 5]);
    expect(parts("lesen").map((p) => p.items.length)).toEqual([5, 5, 5]);
    expect(test.passingScore).toBe(fmt.passRule.passAt / fmt.passRule.totalPoints);
  });

  it("المدقِّق على الشجرة الحقيقية: صفر أخطاء صيغة/استماع/مفردات/مخطط وصفر تحذيرات امتحان", () => {
    const r = validateContentTree(loadContentDir(C));
    expect(r.errors.filter((e) => /modelltest|hoeren|e-schema/.test(e.code) || e.path.startsWith("modelltest/"))).toEqual([]);
    expect(r.warnings.filter((w) => w.code.startsWith("w-modelltest"))).toEqual([]);
  });

  it("مفتاح متوازن: كل جزء Richtig/Falsch فيه الجوابان · مواضع mc3 موزعة (كلٌّ ≥3 من 11) · a وb كلاهما", () => {
    for (const p of [...parts("hoeren"), ...parts("lesen")].filter((x) => x.taskType === "richtig-falsch"))
      expect(new Set(p.items.map((i) => i.a)), p.id).toEqual(new Set(RF));
    const mc = parts("hoeren").filter((p) => p.taskType === "mc3").flatMap((p) => p.items);
    expect(mc).toHaveLength(11);
    const pos = [0, 1, 2].map((k) => mc.filter((i) => i.choices!.indexOf(i.a) === k).length);
    expect(Math.min(...pos)).toBeGreaterThanOrEqual(3);
    expect(new Set(parts("lesen")[1]!.items.map((i) => i.a))).toEqual(new Set(["a", "b"]));
  });

  it("الاستماع: Teil 1 حوارات · Teil 2 إعلانات بالمذيع · Teil 3 رسائل هاتفية — وكل حوار يجمع الصوتين (لا شخصان بصوت واحد)", () => {
    const manifest = AudioManifest.parse(read("manifests/audio-manifest.a1-u1.json"));
    const kinds = parts("hoeren").map((p) => AudioScript.parse(read(`audio-scripts/${p.audioScriptRef}.json`)));
    expect(kinds.map((s) => s.kind)).toEqual(["dialogue", "announcement", "message"]);
    for (const it of parts("hoeren")[0]!.items) {
      const speakers = new Set(it.audioRefs!.map((id) => kinds[0]!.lines.find((l) => l.id === id)!.speaker));
      expect(speakers.size, it.q).toBe(2);
      const voices = new Set([...speakers].map((s) => manifest.characterVoices[s as keyof typeof manifest.characterVoices]));
      expect(voices.size, `${it.q}: صوتان مختلفان`).toBe(2);
      expect(voices.has(VOICE_ID_FEMALE)).toBe(true);
    }
  });

  it("الصدق: ملاحظة المصدر تعلن الأصالة وحدود التدريب · أسماء العلم قليلة وكلها مستعملة", () => {
    expect(test.sourceNote).toContain("أصلي");
    expect(test.sourceNote).toContain("ليس امتحاناً رسمياً");
    expect(test.properNouns.length).toBeLessThanOrEqual(20);
  });
});
