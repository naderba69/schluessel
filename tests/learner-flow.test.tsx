// @vitest-environment happy-dom
// tests/learner-flow.test.tsx — الرحلة كاملة في DOM حقيقي (D117): أول تشغيل ← المحطات الأربع (مقفلة حتى تكتمل) ← بوابة Quiz
// ← الحفظ في IndexedDB ← إعادة التحميل تستأنف من الدرس التالي. ومسار «ليس بعد»: مراجعة ← نسخة أخرى ← سقف النسخ في الحصة.
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { Lesson, QuizItem } from "../content/schemas/index.js";
import { App } from "../src/App.js";
import { openDb } from "../src/stores/db.js";
import { dexieLearnerStore, type LearnerStore } from "../src/stores/learner-store.js";
import { setAudioPlayer } from "../src/lib/audio-player.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { reconcileState } from "../src/lib/lesson-path.js";
import { ALL_GRAMMAR_RULES, ALL_LESSONS, LESSON_ORDER } from "../src/lesson-packs.js";
import { visibleText } from "../src/lib/struck-text.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;
let seq = 0;
const lesson = (id: string): Lesson => ALL_LESSONS.find((l) => l.id === id)!;

beforeEach(() => {
  setAudioPlayer({ play: async () => "none" });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  setAudioPlayer(null);
});

// ——— أدوات قيادة الواجهة ———
const q = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const buttons = () => [...container.querySelectorAll<HTMLButtonElement>("button")];
const byText = (t: string) => buttons().find((b) => b.textContent?.includes(t)) ?? null;
async function click(el: Element | null, what = "عنصر") {
  if (!el) throw new Error(`غير موجود: ${what}`);
  if ((el as HTMLButtonElement).disabled) throw new Error(`معطَّل: ${what}`);
  await act(async () => (el as HTMLElement).click());
}
async function type(el: Element | null, value: string) {
  if (!el) throw new Error("حقل غير موجود");
  const input = el as HTMLInputElement;
  await act(async () => {
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function waitFor(cond: () => boolean | Promise<boolean>, what: string) {
  for (let i = 0; i < 200; i++) {
    if (await cond()) return;
    await act(async () => new Promise((r) => setTimeout(r, 5)));
  }
  throw new Error(`لم يتحقق: ${what}`);
}
const nextBtn = () => q("next-btn") as HTMLButtonElement;
const station = () => q("lesson-session")?.getAttribute("data-station");

async function boot(store: LearnerStore) {
  await act(async () => root.render(<App store={store} />));
  await waitFor(() => !q("boot-loading"), "انتهاء التحميل");
}

/** محطة تلو محطة: «التالي» معطَّل قبل الإكمال ثم يعمل — والاستراحة بين المحطات */
async function passStation(name: string, doIt: () => Promise<void>) {
  expect(station()).toBe(name);
  expect(nextBtn().disabled, `«التالي» قبل إكمال ${name}`).toBe(true);
  await doIt();
  expect(nextBtn().disabled, `«التالي» بعد إكمال ${name}`).toBe(false);
  await click(nextBtn(), "التالي");
  if (q("break-prompt")) await click(q("break-prompt")!.querySelector("button"), "أكمل بعد الاستراحة");
}

async function doRecall() {
  while (q("recall-card")) {
    await click(q("reveal-btn"), "اكشف");
    await click(container.querySelector("[data-rating]"), "تقييم");
  }
  expect(q("recall-done")).not.toBeNull();
}

async function doLearn() {
  while (q("learn-card")) {
    await click(q("attempt-btn"), "حاول");
    await click(q("learn-reveal-btn"), "اكشف");
    await click(q("learn-next"), "التالي في الجديد");
  }
  while (q("rule-discovery")) {
    const rule = ALL_GRAMMAR_RULES.find((r) => r.id === q("rule-discovery")!.getAttribute("data-rule-id"))!;
    await type(q("inference-input"), "مع ich نستعمل bin");
    await click(q("submit-inference"), "أرسل الاستنتاج");
    await click(q("reveal-rule"), "اكشف القاعدة");
    for (const word of rule.beads) {
      const bead = [...container.querySelectorAll('[data-testid^="bead-"]')].find((b) => b.textContent === word) ?? null;
      await click(bead, `حبة ${word}`);
    }
    await click(q("check-beads"), "تحقق من الحبات");
    await click(q("rule-done"), "أنهيت القاعدة");
  }
  expect(q("learn-done")).not.toBeNull();
}

async function doPractice() {
  for (let guard = 0; guard < 300 && !q("communicative-task"); guard++) {
    const item = q("practice-item");
    if (!item) {
      await click(q("practice-reveal"), "أظهر الإجابة (بند قديم)");
      await click(q("practice-next"), "التالي");
      continue;
    }
    const kind = item.getAttribute("data-kind");
    if (kind === "choice") await click(q("choice-0"), "خيار");
    else if (kind === "input") {
      await type(q("practice-input"), "x");
      await click(q("practice-check"), "تحقّق");
    } else if (kind === "order") {
      while (q("token-0")) await click(q("token-0"), "كلمة");
      await click(q("practice-check"), "تحقّق الترتيب");
    } else if (kind === "production") await click(q("practice-self"), "قارن");
    else throw new Error(`نوع لم يُغطَّ في الاختبار: ${kind}`);
    await click(q("practice-next"), "التالي");
  }
  expect(q("communicative-task")).not.toBeNull();
}

/** Quiz: answer(item) = ما يُدخله المتعلم · honestJudge = حكمه حين لا تطابق إجابته المفتوحة */
async function doQuiz(items: readonly QuizItem[], answer: (it: QuizItem) => string, prediction = true) {
  if (prediction) await click(q("quiz-start"), "ابدأ الاختبار");
  for (const it of items) {
    expect(q("quiz-question")!.textContent).toBe(visibleText(it.q)); // D128: ~~الخطأ~~ يُرسم شطباً بلا علامتيه
    const given = answer(it);
    if (it.choices) {
      const btn = [...container.querySelectorAll('[data-testid^="quiz-choice-"]')].find((b) => b.textContent === given) ?? null;
      await click(btn, `خيار ${given}`);
    } else {
      await type(q("quiz-input"), given);
      await click(q("quiz-check"), "تحقّق");
    }
    if (q("quiz-judge-no")) await click(q("quiz-judge-no"), "أخطأت");
    await click(q("quiz-next"), "التالي/النتيجة");
  }
}

const wrongOf = (it: QuizItem) => (it.choices ? it.choices.find((c) => c !== it.a)! : "؟؟");

async function startSession() {
  await click(q("start-session"), "ابدأ الحصة");
  if (q("jit-overlay")) await click(q("jit-dismiss"), "فهمت");
  expect(q("lesson-session")).not.toBeNull();
}

async function throughStations(id: string) {
  const l = lesson(id);
  await passStation("recall", doRecall);
  await passStation("learn", doLearn);
  await passStation("practice", doPractice);
  expect(station()).toBe("close");
  expect(q("quiz-station")!.getAttribute("data-phase")).toBe("predict");
  expect(nextBtn().disabled).toBe(true);
  expect(q("close-station")).toBeNull(); // §3: الخلاصة بعد الـQuiz
  return l;
}

describe("الرحلة كاملة — أول تشغيل ← درس كامل ← نجاح ← حفظ ← استئناف", () => {
  it("a1-u1-d1 من البداية حتى فتح الدرس التالي، ثم إعادة تحميل تستأنف منه", async () => {
    const name = `flow-${++seq}-${Date.now()}`;
    const store = dexieLearnerStore(openDb(name));
    await boot(store);

    // أول تشغيل: الترحيب ← الاسم ← بطاقات اليوم الأول ← شاشة أول درس (كانت تُتخطّى) ← اللوحة
    await click(byText("لنبدأ"), "لنبدأ");
    await type(container.querySelector('input[aria-label="اسم المتعلم"]'), "يوسف");
    await click(byText("أنا جاهز"), "أنا جاهز");
    expect(container.querySelector('[data-screen="ask-name"]')).toBeNull();
    while (byText("التالية")) await click(byText("التالية"), "التالية");
    await click(byText("إلى أول درس"), "إلى أول درس");
    expect(container.querySelector('[data-screen="first-lesson"]')).not.toBeNull();
    await click(q("first-lesson-start"), "إلى حصة اليوم");
    expect(q("current-lesson")!.getAttribute("data-lesson-id")).toBe("a1-u1-d1");
    await waitFor(async () => (await store.load())?.profile.name === "يوسف", "حفظ الاسم");

    await startSession();
    const l = await throughStations("a1-u1-d1");
    await doQuiz(l.quiz.variants[0].items, (it) => it.a);
    expect(q("quiz-station")!.getAttribute("data-passed")).toBe("yes");
    expect(q("quiz-headline")!.textContent).toContain("100%");
    expect(q("close-station")).not.toBeNull();
    await click(nextBtn(), "أنهِ الحصة");

    const next = LESSON_ORDER[1]!;
    expect(q("lesson-session")).toBeNull();
    expect(q("finished-note")!.textContent).toContain(`فُتح الدرس التالي: ${next}`);
    expect(q("current-lesson")!.getAttribute("data-lesson-id")).toBe(next);
    await waitFor(async () => (await store.load())?.progress.completedLessons.length === 1, "حفظ الإكمال");
    const saved = (await store.load())!;
    expect(saved.progress.completedLessons).toEqual(["a1-u1-d1"]);
    expect(saved.progress.availableLessons).toEqual([next]);
    expect(saved.progress.gateResults).toMatchObject([{ gateId: "a1-u1-d1", kind: "lesson-quiz", passed: true, attempts: 1, score: 1 }]);
    expect(saved.profile.calibration).toHaveLength(1);
    expect(saved.profile.unit0Shown.length).toBeGreaterThan(0);

    // «إعادة تحميل الصفحة»: متجر جديد على القاعدة نفسها ← اللوحة مباشرة عند الدرس التالي
    await act(async () => root.unmount());
    root = createRoot(container);
    await boot(dexieLearnerStore(openDb(name)));
    expect(byText("لنبدأ")).toBeNull();
    expect(q("current-lesson")!.getAttribute("data-lesson-id")).toBe(next);
    expect(container.querySelector('[data-lesson-id="a1-u1-d1"][data-status="completed"]')).not.toBeNull();
    expect(container.querySelector(`li[data-lesson-id="${next}"][data-status="available"]`)).not.toBeNull();
    expect(container.querySelector(`li[data-lesson-id="${LESSON_ORDER[2]}"][data-status="locked"]`)).not.toBeNull();
  }, 60_000);
});

describe("«ليس بعد» — مراجعة ثم نسخة أخرى · النسخ تتبادل عبر الحصص · لا تتكرر نسخة في الحصة · الدرس يبقى مفتوحاً", () => {
  it("حصة 1: النسخة 1 دون الحد ← إنهاء · حصة 2: النسخ 2←3←1 ثم السقف · حصة 3: النسخة 2 (4 mod 3) ← نجاح", async () => {
    const name = `flow-${++seq}-${Date.now()}`;
    const store = dexieLearnerStore(openDb(name));
    await store.save(reconcileState(createInitialState("يوسف", new Date("2026-10-14")), ALL_LESSONS));
    await boot(store);
    const l = lesson("a1-u1-d1");
    const version = () => q("quiz-station")!.textContent!.match(/النسخة (\d) من 3/)?.[1];

    // حصة 1: محاولة واحدة دون الحد — المراجعة تظهر، والإنهاء مسموح بلا إكراه
    await startSession();
    await throughStations("a1-u1-d1");
    expect(version()).toBe("1");
    await doQuiz(l.quiz.variants[0].items, wrongOf);
    expect(q("quiz-station")!.getAttribute("data-passed")).toBe("no");
    expect(q("quiz-review")!.querySelectorAll("li").length).toBe(l.quiz.variants[0].items.length);
    expect(q("close-station")).not.toBeNull();
    expect(q("quiz-retry")).not.toBeNull();
    expect(nextBtn().disabled).toBe(false);
    await click(nextBtn(), "أنهِ الحصة");
    expect(q("finished-note")!.textContent).toContain("الدرس يبقى مفتوحاً");
    expect(q("current-lesson")!.getAttribute("data-lesson-id")).toBe("a1-u1-d1");

    // حصة 2: تبدأ بالنسخة 2 (محاولة سابقة واحدة) ← 3 ← 1 ← السقف (3 محاولات في هذه الحصة)
    await startSession();
    await throughStations("a1-u1-d1");
    for (const [i, v] of [1, 2, 0].entries()) {
      if (i > 0) await click(q("quiz-retry"), "النسخة التالية");
      expect(version()).toBe(String(v + 1));
      await doQuiz(l.quiz.variants[v]!.items, wrongOf);
      expect(q("quiz-station")!.getAttribute("data-passed")).toBe("no");
    }
    expect(q("quiz-retry")).toBeNull();
    expect(q("quiz-no-retry")).not.toBeNull();
    await click(nextBtn(), "أنهِ الحصة");
    await waitFor(async () => (await store.load())?.progress.gateResults.length === 4, "حفظ المحاولات الأربع");
    const saved = (await store.load())!;
    expect(saved.progress.completedLessons).toEqual([]);
    expect(saved.progress.gateResults.map((g) => [g.passed, g.attempts])).toEqual([[false, 1], [false, 2], [false, 3], [false, 4]]);

    // حصة 3: المحاولة الخامسة = النسخة 2 (4 mod 3) — وبالإجابات الصحيحة تُفتح a1-u1-d2
    await startSession();
    await throughStations("a1-u1-d1");
    expect(version()).toBe("2");
    await doQuiz(l.quiz.variants[1].items, (it) => it.a);
    expect(q("quiz-station")!.getAttribute("data-passed")).toBe("yes");
    await click(nextBtn(), "أنهِ الحصة");
    expect(q("current-lesson")!.getAttribute("data-lesson-id")).toBe(LESSON_ORDER[1]);
    await waitFor(async () => (await store.load())?.progress.completedLessons.length === 1, "حفظ النجاح");
    expect((await store.load())!.progress.gateResults.at(-1)).toMatchObject({ passed: true, attempts: 5 });
  }, 90_000);
});
