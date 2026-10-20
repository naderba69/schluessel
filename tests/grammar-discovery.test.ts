// grammar-discovery.test.ts — E13: القاعدة لا تظهر قبل المثال والمحاولة (قفل) + حبّات الجملة + المقارنة العربية
import { describe, it, expect } from "vitest";
import {
  A1_RULES,
  startDiscovery,
  viewExamples,
  submitInference,
  revealRule,
  grammarFlow,
  shuffledBeads,
  checkBeads,
} from "../src/lib/grammar-discovery.js";

describe("E13 — القفل: القاعدة لا تظهر قبل المثال (guided discovery)", () => {
  it("كشف القاعدة مرفوض قبل رؤية الأمثلة", () => {
    const s = startDiscovery("v2-position");
    const rule = A1_RULES[0]!;
    expect(() => revealRule(s, rule)).toThrow(/القاعدة لا تظهر قبل المثال/);
  });

  it("كشف القاعدة مرفوض قبل محاولة الاستنتاج (§2.5)", () => {
    const s = startDiscovery("v2-position");
    const rule = A1_RULES[0]!;
    viewExamples(s, rule);
    expect(() => revealRule(s, rule)).toThrow(/محاول/);
    submitInference(s, "الفعل في المرتبة الثانية دائماً");
    expect(revealRule(s, rule).ruleAr).toContain("المرتبة الثانية");
  });

  it("لا استنتاج قبل الأمثلة (F121) — واستنتاج فارغ مرفوض", () => {
    const s = startDiscovery("aus-vs-von");
    expect(() => submitInference(s, "أي نص")).toThrow(/F121/);
    viewExamples(s, A1_RULES[1]!);
    expect(() => submitInference(s, "   ")).toThrow();
  });

  it("التدفق: أمثلة ← استنتاج ← كشف ← حبّات — بالترتيب حرفياً", () => {
    const kinds = grammarFlow().map((x) => x.kind);
    expect(kinds).toEqual(["examples", "inference", "reveal", "beads"]);
    expect(kinds.indexOf("reveal")).toBeGreaterThan(kinds.indexOf("examples"));
  });
});

describe("E13 — حبّات الجملة + المقارنة العربية في كل قاعدة", () => {
  it("ترتيب الحبّات: الحل مصفوفة القاعدة — والخلط يُكشف", () => {
    const rule = A1_RULES[0]!; // N-009: ["Hier", "wohne", "ich"]
    expect(checkBeads(rule, rule.beads)).toBe(true);
    expect(checkBeads(rule, shuffledBeads(rule, 1))).toBe(false);
    expect(checkBeads(rule, [...rule.beads, "x"])).toBe(false);
  });

  it("كل قاعدة: مثال أولاً + مقارنة عربية غير فارغة (لا قاعدة بلا مقارنة)", () => {
    for (const r of A1_RULES) {
      expect(r.examples.length).toBeGreaterThanOrEqual(2);
      expect(r.contrastAr.trim()).not.toBe("");
      expect(r.inferencePromptAr.trim()).not.toBe("");
    }
    expect(A1_RULES.map((r) => r.id)).toEqual(["v2-position", "aus-vs-von", "heissen-du"]);
    expect(() => startDiscovery("xx")).toThrow();
  });
});

describe("N-009 (D228) — قواعد المختبر الثلاث: ألمانية نظيفة عند أفق كل قاعدة", () => {
  it("كل قاعدة تحمل أفقاً + ألمانيتها (أمثلة/حبّات/قاعدة/تعليمات) نظيفة عنده", async () => {
    const { join } = await import("node:path");
    const { loadLessons, loadWords } = await import("../tools/lib/content-disk.js");
    const { taughtUpTo, frontViolations } = await import("../tools/lib/lesson-upgrade.js");
    const { knownStems } = await import("../tools/lib/vocab-forms.js");
    const root = join(__dirname, "..", "content");
    const lessons = loadLessons(root);
    const words = loadWords(root);
    const byId = new Map(lessons.map((l) => [l.id, l]));
    const horizons = new Map(A1_RULES.filter((r) => r.lesson).map((r) => [r.id, r.lesson!]));
    // الدبوس: الآفاق الثلاثة المعتمدة (أي تغيير أفق يُراجَع هنا)
    expect(horizons).toEqual(
      new Map([
        ["v2-position", "a1-u2-d1"],
        ["aus-vs-von", "a1-u8-d5"],
        ["heissen-du", "a1-u1-d1"],
      ]),
    );
    for (const r of A1_RULES) {
      const lesson = byId.get(r.lesson!)!;
      const stems = knownStems(taughtUpTo(lesson, lessons, words));
      const texts = [...r.examples.map((e) => e.de), [...r.beads].join(" "), r.ruleDe, r.inferencePromptAr, r.contrastAr];
      expect(frontViolations(texts, stems, new Set(["yusuf", "lena"]))).toEqual([]);
    }
  });
});
