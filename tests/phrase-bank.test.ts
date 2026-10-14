// tests/phrase-bank.test.ts — D107: بنك Redemittel المحصود + وسم «ظهرت في درس» + قانون الجبهة
import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PracticeStation } from "../src/components/LessonContent.js";
import { planLessonStations } from "../src/lib/lesson-runner.js";
import { PHRASE_BANK, LESSON_ORDER, firstLesson, firstLessonWords } from "../src/lesson-packs.js";
import {
  cleanPhrase, classifyPhrase, harvestPhrases, phrasesAvailable, functionCoverage, SURVIVAL_FUNCTIONS, type Phrase,
} from "../src/lib/phrase-bank.js";
import { ALL_LESSONS, ALL_WORDS } from "../src/lesson-packs.js";
import { vocabularyReport } from "../tools/phrase-harvester.js";
import { loadLessons, loadWords } from "../tools/lib/content-disk.js";

const ORDER = ALL_LESSONS.map((l) => l.id);
const BANK = harvestPhrases(ALL_LESSONS, ALL_WORDS);

describe("D107 — تنظيف العبارة: قول ألماني تواصلي فقط", () => {
  it("يُسقط الشرح العربي والملاحظات النحوية ويُبقي الجملة", () => {
    expect(cleanPhrase("Ich habe meine Brille verloren. — ver- بلا ge")).toBe("Ich habe meine Brille verloren.");
    expect(cleanPhrase("Ich antworte dir. (Dativ: dir)")).toBe("Ich antworte dir.");
    expect(cleanPhrase("«Was ist passiert?»")).toBe("Was ist passiert?");
  });
  it("يرفض: العربية · الخطأ المشطوب · الفراغ · السهم · البدائل · المعادلات · اللغة الواصفة · المفردة", () => {
    for (const bad of ["ماذا حدث؟", "~~Was hat passiert?~~", "Mein Handy ___ gefallen.", "das Licht → die Lichter",
      "habe / ist", "in + Dativ", "Dativ: mit dem Handy", "gelacht", "die Möbel"]) expect(cleanPhrase(bad), bad).toBeNull();
    expect(cleanPhrase("alles klar", { chunk: true })).toBe("alles klar"); // القطعة الجاهزة تُقبل بكلمتين
  });
});

describe("D107 — التصنيف الوظيفي (متعدد)", () => {
  it("أمثلة من المحتوى الحقيقي", () => {
    expect(classifyPhrase("Hallo, ich heiße Yusuf.")).toEqual(["begruessen", "vorstellen"]);
    expect(classifyPhrase("Was ist passiert?")).toEqual(["fragen-w", "vergangenheit"]);
    expect(classifyPhrase("Ich nehme ein Wasser, bitte.")).toEqual(["bitten"]);
    expect(classifyPhrase("Noch einmal, bitte!")).toEqual(["bitten", "nachfragen"]);
    expect(classifyPhrase("Der Zug hat Verspätung, deswegen bin ich spät.")).toEqual(["begruenden"]);
    expect(classifyPhrase("Hast du schon gefrühstückt?")).toEqual(["fragen-janein", "vergangenheit"]);
    expect(classifyPhrase("Das Auto ist rot.")).toEqual(["aussage"]);
  });
});

describe("D107 — الحصاد من المحتوى الحقيقي", () => {
  it("بنك نظيف: لا عربية · لا تكرار · كل درس موجود · أول ظهور = الأبكر بترتيب المسار", () => {
    expect(BANK.length).toBeGreaterThan(800);
    const keys = new Set<string>();
    for (const p of BANK) {
      expect(p.de).not.toMatch(/[\u0600-\u06FF]/);
      const k = p.de.toLowerCase().replace(/[.!?…]+$/u, "");
      expect(keys.has(k), p.de).toBe(false);
      keys.add(k);
      for (const l of p.lessons) expect(ORDER).toContain(l);
      expect(Math.min(...p.lessons.map((l) => ORDER.indexOf(l)))).toBe(ORDER.indexOf(p.firstLesson));
      expect(p.functions.length).toBeGreaterThan(0);
    }
  });

  it("جمل الكلمات تُوسَم بدرسها: جمل a2-u1-d1 الجديدة تظهر فيه أولاً", () => {
    const a2 = BANK.filter((p) => p.firstLesson === "a2-u1-d1");
    expect(a2.map((p) => p.de)).toContain("Ich habe meinen Schlüssel vergessen!");
    expect(a2.find((p) => p.de === "Was ist passiert?")?.functions).toContain("vergangenheit");
  });

  it("الأدوات والتطبيق يحصدان البنك نفسه (القرص = Vite)", () => {
    const c = join(process.cwd(), "content");
    const fromDisk = harvestPhrases(loadLessons(c), loadWords(c));
    expect(fromDisk.map((p) => p.de)).toEqual(BANK.map((p) => p.de));
  });
});

describe("D107 — قانون الجبهة (13): لا عبارة من درس لم يصله المتعلم", () => {
  it("عند a1-u1-d1: عبارات هذا الدرس فقط · نهاية A1: لا عبارة A2 · درس مجهول: لا شيء", () => {
    const day1 = phrasesAvailable(BANK, ORDER, "a1-u1-d1");
    expect(day1.length).toBeGreaterThan(0);
    for (const p of day1) expect(p.firstLesson).toBe("a1-u1-d1");
    const lastA1 = [...ALL_LESSONS].reverse().find((l) => l.level === "A1")!.id;
    for (const p of phrasesAvailable(BANK, ORDER, lastA1)) expect(p.firstLesson.startsWith("a2")).toBe(false);
    expect(phrasesAvailable(BANK, ORDER, "x-u9-d9")).toEqual([]);
  });

  it("تصفية بالوظيفة + الأحدث أولاً (السياق الوظيفي للدرس)", () => {
    const asks = phrasesAvailable(BANK, ORDER, "a2-u1-d1", "nachfragen");
    for (const p of asks) expect(p.functions).toContain("nachfragen");
    const pos = asks.map((p) => ORDER.indexOf(p.firstLesson));
    expect(pos).toEqual([...pos].sort((a, b) => b - a));
  });
});

describe("D107 — التغطية تكشف الفجوات + تقدير قفل المفردات", () => {
  it("بنك صناعي بلا «nachfragen» ⇒ تغطيته صفر (الأداة تكشف الفجوة)", () => {
    const fake: Phrase[] = [{ de: "Hallo Lena!", functions: ["begruessen"], firstLesson: "a", lessons: ["a"], sources: ["sample"] }];
    expect(functionCoverage(fake, ["a"], "a").nachfragen).toBe(0);
  });

  it("المحتوى الحقيقي: كل وظائف بنك النجاة لها عبارة على الأقل حتى نهاية A1", () => {
    const lastA1 = [...ALL_LESSONS].reverse().find((l) => l.level === "A1")!.id;
    const cov = functionCoverage(BANK, ORDER, lastA1);
    for (const f of SURVIVAL_FUNCTIONS) expect(cov[f], f).toBeGreaterThan(0);
  });

  it("تقرير قفل المفردات: بنيته سليمة ونسبته بين 0 و1", () => {
    const r = vocabularyReport(BANK, ORDER, ALL_WORDS);
    expect(r.total).toBe(BANK.length);
    expect(r.clean).toBeGreaterThan(0);
    expect(r.clean).toBeLessThanOrEqual(r.total);
    expect(r.topUnknown.length).toBeLessThanOrEqual(15);
  });
});

describe("D107 — Redemittel في المهمة التواصلية (السياق الوظيفي + الجبهة)", () => {
  it("السجل يصدّر البنك نفسه المحصود", () => {
    expect(PHRASE_BANK.map((p) => p.de)).toEqual(BANK.map((p) => p.de));
    expect(LESSON_ORDER).toEqual(ORDER);
  });

  it("المهمة التواصلية لدرس 1 تعرض عباراته فقط — لا عبارة من درس لاحق", () => {
    const plan = planLessonStations(firstLesson, firstLessonWords);
    const red = phrasesAvailable(PHRASE_BANK, LESSON_ORDER, plan.lessonId).slice(0, 6);
    expect(red.length).toBeGreaterThan(0);
    const html = renderToStaticMarkup(createElement(PracticeStation, { data: { ...plan.practice, stations: [] }, redemittel: red }));
    expect(html).toContain('data-testid="redemittel"');
    expect(html).toContain('data-first-lesson="a1-u1-d1"');
    expect(html).not.toMatch(/data-first-lesson="a1-u(?!1-d1")/);
    expect(html).toContain('data-testid="play-audio"'); // كل عبارة قابلة للسماع (Web Speech)
  });
});
