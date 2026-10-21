// tests/learner-store.test.ts — حفظ التقدّم (D117): ذهاب وإياب · لا حفظ لحالة غير صالحة · ترتيب الكتابات · التالفة لا تُمحى بصمت
import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { openDb, SINGLETON, type Row } from "../src/stores/db.js";
import {
  APP_DB_NAME, browserLearnerStore, dexieLearnerStore, memoryLearnerStore,
} from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { recordQuizAttempt, reconcileState } from "../src/lib/lesson-path.js";
import { loadAllLessons } from "../src/lesson-packs.js";
const ALL_LESSONS = await loadAllLessons();

import { App } from "../src/App.js";
import type { LearnerProgress, LearnerState } from "../content/schemas/index.js";

let seq = 0;
const freshStore = () => {
  const db = openDb(`learner-store-test-${++seq}`);
  return { db, store: dexieLearnerStore(db) };
};

/** حالة بعد نجاح الدرس الأول — فيها نتيجة بوابة ومعايرة وsrs فارغة */
function afterFirstLesson(): LearnerState {
  const s = reconcileState(createInitialState("يوسف", new Date("2026-10-14")), ALL_LESSONS);
  return recordQuizAttempt(
    s,
    {
      lessonId: "a1-u1-d1", variantIndex: 0, total: 6, credit: 5.5, score: 5.5 / 6, percent: 92, passed: true,
      passingScore: 0.75, correct: 4, close: 1, wrong: 0, selfCorrect: 1, selfWrong: 0, predicted: 80, weakItems: ["x"],
    },
    ALL_LESSONS,
    "2026-10-14",
  );
}

describe("dexieLearnerStore — IndexedDB على جهاز المتعلم", () => {
  it("ذهاب وإياب: ما يُحفظ يُقرأ كما هو (التقدّم + نتيجة البوابة + المعايرة)", async () => {
    const { store } = freshStore();
    expect(await store.load()).toBeNull();
    const s = afterFirstLesson();
    await store.save(s);
    const back = await store.load();
    expect(back).toEqual(s);
    expect(back!.progress.completedLessons).toEqual(["a1-u1-d1"]);
    expect(back!.progress.gateResults[0]!.selfJudged).toBe(1);
    expect(store.persistent).toBe(true);
  });

  it("حالة لا تطابق المخطط تُرفض قبل الكتابة — والمحفوظ سابقاً يبقى سليماً", async () => {
    const { store } = freshStore();
    const good = afterFirstLesson();
    await store.save(good);
    const bad = { ...good, profile: { ...good.profile, name: "" } } as LearnerState;
    await expect(store.save(bad)).rejects.toThrow();
    expect(await store.load()).toEqual(good);
  });

  it("الكتابات متسلسلة: آخر حفظ هو الباقي ولو أُطلقت دون انتظار", async () => {
    const { store } = freshStore();
    const a = createInitialState("أ", new Date("2026-10-14"));
    const b = afterFirstLesson();
    const c = { ...b, profile: { ...b.profile, name: "ج" } };
    await Promise.all([store.save(a), store.save(b), store.save(c)]);
    expect((await store.load())!.profile.name).toBe("ج");
  });

  it("بيانات تالفة: التحميل يرمي (لا «أول تشغيل» يكتب فوقها) · النسخة الخام تُقرأ · والمسح صريح فقط", async () => {
    const { db, store } = freshStore();
    await store.save(afterFirstLesson());
    await db.progress.put({ key: SINGLETON, completedLessons: "ليست مصفوفة" } as unknown as Row<LearnerProgress>);
    await expect(store.load()).rejects.toThrow();
    const raw = JSON.parse(await store.rawDump());
    expect(raw.tables.progress[0].completedLessons).toBe("ليست مصفوفة");
    expect(raw.tables.profile[0].name).toBe("يوسف");
    await expect(store.load()).rejects.toThrow(); // ما زالت كما هي — لا شيء مُسح ضمناً
    await store.clear();
    expect(await store.load()).toBeNull();
  });
});

describe("memoryLearnerStore / browserLearnerStore — الإعلان الصريح عند غياب التخزين", () => {
  it("الذاكرة: ذهاب وإياب مع persistent=false (الواجهة تقول: هذه الجلسة فقط)", async () => {
    const m = memoryLearnerStore();
    expect(m.persistent).toBe(false);
    const s = afterFirstLesson();
    await m.save(s);
    expect(await m.load()).toEqual(s);
    await m.clear();
    expect(await m.load()).toBeNull();
  });

  it("المتصفح: IndexedDB إن وُجد وإلا الذاكرة · واسم قاعدة التطبيق ليس قاعدة الاختبارات", () => {
    expect(browserLearnerStore({}).persistent).toBe(false);
    expect(browserLearnerStore({ indexedDB: globalThis.indexedDB }).persistent).toBe(true);
    expect(APP_DB_NAME).toBe("schluessel");
    expect(openDb().name).not.toBe(APP_DB_NAME);
  });
});

describe("القشرة — لا شاشة قبل قراءة المحفوظ", () => {
  it("الرسم الأول = «جارٍ التحميل» (لا أول تشغيل يسبق قراءة تقدّم موجود)", () => {
    const html = renderToStaticMarkup(createElement(App, { store: memoryLearnerStore() }));
    expect(html).toContain('data-testid="boot-loading"');
    expect(html).not.toContain("start-session");
  });
});
