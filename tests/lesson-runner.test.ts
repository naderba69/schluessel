// lesson-runner.test.ts — مُشغِّل الدرس: الدرس الحقيقي → شاشات الحصة الأربع (F121 + D3)
import { describe, it, expect } from "vitest";
import { planLessonStations } from "../src/lib/lesson-runner.js";
import { loadFirstSession, loadAllLessons, loadScriptsForLesson } from "../src/lesson-packs.js";
const __FIRST = await loadFirstSession();
const firstLesson = __FIRST.lesson;
const firstLessonWords = __FIRST.direct;

import type { Lesson } from "../content/schemas/index.js";

describe("مُشغِّل الدرس — الدرس الحقيقي a1-u1-d1", () => {
  it("N-050: كل صوت استماع في كل درس يُحلّ ضمن سكربتات الحصة الكسولة (بادئة الدرس + ملفات المستوى المشتركة)", async () => {
    for (const l of await loadAllLessons()) {
      const scripts = await loadScriptsForLesson(l.id, l.level);
      const lines = new Set(scripts.flatMap((s) => s.lines.map((x) => x.id)));
      for (const st of l.uebung.stations) {
        if (st.type !== "listening") continue;
        for (const item of st.items) {
          const a = (item as { audioId: string }).audioId;
          if (!a.startsWith("word-")) expect(lines.has(a), `${l.id}/${a}`).toBe(true);
        }
      }
    }
  });
  it("أربع محطات مبنية: استرجاع ← جديد ← تدريب ← خلاصة", () => {
    const plan = planLessonStations(firstLesson, firstLessonWords);
    expect(plan.lessonId).toBe("a1-u1-d1");
    expect(plan.recall.length).toBeGreaterThan(0);
    expect(plan.learn.length).toBe(firstLesson.praesentation.wordIds.length); // ثابت مشتقّ (D188): لا كلمة تسقط من الدرس
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

  it("الخلاصة: 3 مصائد ذهبية + حزمة SRS كاملة (كل كلمات الدرس)", () => {
    const plan = planLessonStations(firstLesson, firstLessonWords);
    expect(plan.close.warningCards.length).toBe(3);
    expect([...plan.close.srsBundleWordIds].sort()).toEqual([...firstLesson.praesentation.wordIds].sort()); // ثابت مشتقّ (D188)
    expect(plan.practice.communicativeTask.goal.de).toBe("Hallo! Ich heiße … Ich komme aus …"); // D185 (N-022): meta بالمدروس
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

describe("جولة الأخطاء في الاسترجاع (N-150 · D250)", () => {
  it("بطاقات الجولة أولاً (خطأ) ثم الدفء — بالترتيب المعطى", () => {
    const err = {
      id: "e-9", kind: "systematic", skill: "schreiben",
      payload: { wrong: "falsch geschrieben", correct: "richtig geschrieben", explanation: "التعليل", source: "a1-u1-d1/quiz" },
      remedialExercises: [], occurrences: 1, resolved: false, createdAt: "2026-10-21",
    } as unknown as import("../content/schemas/index.js").ErrorEntry;
    const plan = planLessonStations(firstLesson, firstLessonWords, [], [], [], [err]);
    expect(plan.recall[0]!.kind).toBe("error");
    expect(plan.recall[0]!.errorId).toBe("e-9");
    expect(plan.recall[0]!.front).toContain("falsch geschrieben");
    expect(plan.recall[0]!.back).toContain("richtig geschrieben");
    expect(plan.recall[1]!.kind).toBe("warmup");
  });
});
