// content-units.test.ts — المحتوى حيّ: كل درس وكلماته تعمل على المُشغِّل (D45)
import { describe, it, expect } from "vitest";
import { ALL_LESSONS, ALL_WORDS, wordsForLesson, runtimeWordsForLesson, firstLesson, firstLessonWords } from "../src/lesson-packs.js";
import { planLessonStations } from "../src/lib/lesson-runner.js";

describe("سجل المحتوى — الوحدة 1 كاملة + بداية الوحدة 2", () => {
  it("الدروس مرتّبة والسجل مطابق للملفات", () => {
    expect(ALL_LESSONS.map((l) => l.id)).toEqual([
      "a1-u1-d1", "a1-u1-d2", "a1-u1-d3", "a1-u1-d4", "a1-u1-d5", "a1-u1-d6", "a1-u2-d1", "a1-u2-d2", "a1-u2-d3", "a1-u2-d4", "a1-u2-d5", "a1-u2-d6", "a1-u3-d1", "a1-u3-d2", "a1-u3-d3", "a1-u3-d4", "a1-u3-d5", "a1-u3-d6", "a1-u4-d1", "a1-u4-d2", "a1-u4-d3", "a1-u4-d4", "a1-u4-d5", "a1-u4-d6", "a1-u5-d1", "a1-u5-d2", "a1-u5-d3", "a1-u5-d4", "a1-u5-d5", "a1-u5-d6", "a1-u6-d1", "a1-u6-d2", "a1-u6-d3", "a1-u6-d4", "a1-u6-d5", "a1-u6-d6", "a1-u7-d1", "a1-u7-d2", "a1-u7-d3", "a1-u7-d4", "a1-u7-d5", "a1-u7-d6", "a1-u8-d1", "a1-u8-d2", "a1-u8-d3", "a1-u8-d4", "a1-u8-d5", "a1-u8-d6", "a1-u9-d1", "a1-u9-d2",
    ]);
    expect(ALL_LESSONS.map((l) => [l.unit, l.day])).toEqual([
      [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 6], [9, 1], [9, 2],
    ]);
    expect(ALL_WORDS.length).toBe(532);
  });

  it("d6 توليف: نوع integration + معركة بعتبة 75% + جسيما التوليف", () => {
    const d6 = ALL_LESSONS.find((l) => l.id === "a1-u1-d6")!;
    expect(d6.kind).toBe("integration");
    expect(d6.praesentation.wordIds).toEqual(["alles-klar", "bis-morgen"]);
    for (const v of d6.quiz.variants) expect(v.passingScore).toBe(0.75);
  });

  it("كل درس: كلماته مكتملة + مصائده الثلاثة + حزمة SRS + مراجع صوت مطابقة", () => {
    for (const l of ALL_LESSONS) {
      const words = wordsForLesson(l);
      expect(words.length).toBeGreaterThanOrEqual(2); // d6 توليف: جسيمان فقط (بلا جديد تقريباً)
      expect(l.zusammenfassung.warningCards).toHaveLength(3);
      expect(l.zusammenfassung.srsBundleWordIds).toEqual(l.praesentation.wordIds);
      expect(l.audioManifestRefs).toHaveLength(l.praesentation.wordIds.length);
      for (const w of words) expect(w.usedInLessons).toContain(l.id);
    }
  });

  it("كل درس يمشي على مُشغِّل الحصة (planLessonStations) بكل محطاته", () => {
    for (const l of ALL_LESSONS) {
      const plan = planLessonStations(l, runtimeWordsForLesson(l));
      expect(plan.lessonId).toBe(l.id);
      expect(plan.recall.length).toBeGreaterThan(0);
      expect(plan.learn.length).toBe(l.praesentation.wordIds.length);
      expect(plan.practice.stations.length).toBeGreaterThanOrEqual(3);
      expect(plan.close.warningCards).toHaveLength(3);
    }
  });

  it("التوافق مع الاستخدام القديم: firstLesson هو d1 بكل كلماته الـ15", () => {
    expect(firstLesson.id).toBe("a1-u1-d1");
    expect(firstLessonWords).toHaveLength(15);
    expect(() => wordsForLesson({ ...firstLesson, praesentation: { ...firstLesson.praesentation, wordIds: ["xx"] } })).toThrow(/مفقودة/);
  });
});

describe("مصائد الوحدة 1 — انعكاسات عربية معلَّلة", () => {
  it("كل مصيدة: خطأ شائع + سبب للمتحدث العربي + تمرين تطبيق", () => {
    for (const l of ALL_LESSONS) {
      for (const t of l.zusammenfassung.warningCards) {
        expect(t.commonError.de).toContain("~~");
        expect(t.whyArabicSpeakerFails).toContain("10");
        expect(t.correct.de).toBeTruthy();
        expect(String(t.exercise.q).trim()).not.toBe("");
        expect(String(t.exercise.a).trim()).not.toBe("");
      }
    }
  });

  it("د2: ألمانيا aus لا von · أسماء لغات ألمانية · سؤال بالفعل أولاً — ود3: تصريف + حشو + حروف كبيرة", () => {
    const d2 = ALL_LESSONS.find((l) => l.id === "a1-u1-d2")!;
    const d3 = ALL_LESSONS.find((l) => l.id === "a1-u1-d3")!;
    expect(d2.zusammenfassung.warningCards[0]!.commonError.de).toContain("Ich bin Tunesien");
    expect(d2.zusammenfassung.warningCards[1]!.correct.de).toContain("Arabisch");
    expect(d3.zusammenfassung.warningCards[0]!.correct.de).toContain("buchstabiere");
    expect(d3.zusammenfassung.warningCards[2]!.correct.de).toBe("der Name");
  });
});
