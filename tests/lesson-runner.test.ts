// lesson-runner.test.ts — مُشغِّل الدرس: الدرس الحقيقي → شاشات الحصة الأربع (F121 + D3)
import { describe, it, expect } from "vitest";
import { planLessonStations } from "../src/lib/lesson-runner.js";
import { firstLesson, firstLessonWords } from "../src/lesson-packs.js";
import type { Lesson } from "../content/schemas/index.js";

describe("مُشغِّل الدرس — الدرس الحقيقي a1-u1-d1", () => {
  it("أربع محطات مبنية: استرجاع ← جديد ← تدريب ← خلاصة", () => {
    const plan = planLessonStations(firstLesson, firstLessonWords);
    expect(plan.lessonId).toBe("a1-u1-d1");
    expect(plan.recall.length).toBeGreaterThan(0);
    expect(plan.learn.length).toBe(17);
    expect(plan.practice.stations.length).toBeGreaterThanOrEqual(3);
    expect(plan.close.summaryAr).toContain("قدمت نفسك");
  });

  it("محطة الاسترجاع = بطاقات الدفء بالترتيب — بلا جديد (F121)", () => {
    const plan = planLessonStations(firstLesson, firstLessonWords);
    expect(plan.recall.map((c) => c.id)).toEqual(["hallo", "heissen", "guten-tag"]);
    expect(plan.recall[0].front).toBe("Hallo");
    expect(plan.recall[0].back).toContain("مرحبا");
  });

  it("الجديد: شرح كل كلمة يحمل التحديد الكامل (الجنس/المثال)", () => {
    const plan = planLessonStations(firstLesson, firstLessonWords);
    const deutsch = plan.learn.find((l) => l.wordId === "deutsch");
    expect(deutsch?.explanation).toContain("das"); // التحديد الكامل لا الجنس مفرداً
    const kommen = plan.learn.find((l) => l.wordId === "kommen");
    expect(kommen?.promptDe).toBe("Ich komme aus Tunesien."); // الجملة أولاً لا القائمة
  });

  it("الخلاصة: 3 مصائد ذهبية + حزمة SRS كاملة (15 كلمة)", () => {
    const plan = planLessonStations(firstLesson, firstLessonWords);
    expect(plan.close.warningCards.length).toBe(3);
    expect(plan.close.srsBundleWordIds.length).toBe(17);
    expect(plan.practice.communicativeTask.goal.de).toBe("Sich vorstellen");
  });

  it("كلمة مفقودة = خطأ فوري (لا شاشات ناقصة أبداً)", () => {
    const broken = {
      ...firstLesson,
      praesentation: { ...firstLesson.praesentation, wordIds: ["hallo", "ghost-word"] },
    } as Lesson;
    expect(() => planLessonStations(broken, firstLessonWords)).toThrow("ghost-word");
  });

  it("لا جلسة بلا استرجاع: دفء فارغ = مرفوض (F121 — اختبار يقفله)", () => {
    const broken = { ...firstLesson, warmup: { cardIds: [] } } as Lesson;
    expect(() => planLessonStations(broken, firstLessonWords)).toThrow("F121");
  });
});
