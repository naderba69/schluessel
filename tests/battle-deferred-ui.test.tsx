// @vitest-environment happy-dom
// tests/battle-deferred-ui.test.tsx — D277: شارتا المعركة والمؤجلة + تدفق المؤجلة الكامل
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "../src/App.js";
import { memoryLearnerStore, type LearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { ALL_TRANSFER, loadSessionBundle } from "../src/lesson-packs.js";
import { startQuizAttempt } from "../src/lib/quiz-session.js";
import { mixTransferItems } from "../src/lib/lesson-path.js";
import type { GateResult, QuizItem } from "../content/schemas/index.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;
const q = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`);

beforeEach(() => {
  container = document.createElement("div");
  window.location.hash = "";
  window.localStorage.clear();
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  vi.useRealTimers();
  await act(async () => root.unmount());
  container.remove();
});

async function click(el: Element | null, what = "زر") {
  if (!el) throw new Error(`${what} غير موجود`);
  await act(async () => (el as HTMLElement).click());
}

const FAKE = { toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] } as const;

async function waitForReal(cond: () => boolean, what: string) {
  for (let i = 0; i < 300; i++) {
    if (cond()) return;
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
  }
  throw new Error(`لم يتحقق: ${what}`);
}

async function waitFor(cond: () => boolean, what: string) {
  for (let i = 0; i < 300; i++) {
    if (cond()) return;
    await act(async () => {
      await new Promise((r) => setImmediate(r)); // نبضة حقيقية تدفع الاستيراد الديناميكي (setImmediate غير مزيّف)
    });
  }
  throw new Error(`لم يتحقق: ${what}`);
}

async function typeInto(input: Element | null, value: string) {
  if (!input) throw new Error("حقل غير موجود");
  const el = input as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
  await act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const U1_5 = ["a1-u1-d1", "a1-u1-d2", "a1-u1-d3", "a1-u1-d4", "a1-u1-d5"];
const U1_6 = [...U1_5, "a1-u1-d6"];
const battleWin = (unitKey: string, date: string): GateResult => ({
  gateId: unitKey, kind: "unit-battle", score: 0.8, passed: true, attempts: 1, weakSections: [], date,
});

async function renderSeeded(at: Date, completed: string[], gates: GateResult[]): Promise<LearnerStore> {
  vi.useFakeTimers({ toFake: [...FAKE.toFake] });
  vi.setSystemTime(at);
  const store = memoryLearnerStore();
  const base = createInitialState("ضياء");
  await store.save({ ...base, progress: { ...base.progress, completedLessons: completed, gateResults: gates } });
  await act(async () => root.render(<App store={store} />));
  await waitFor(() => !q("boot-loading") && !q("first-loading"), "انتهاء التحميل");
  return store;
}

const SAT = new Date(2026, 9, 24, 10, 0); // سبت
const MON = new Date(2026, 9, 19, 10, 0); // اثنين
const WED = new Date(2026, 9, 21, 10, 0); // أربعاء

describe("D277: شارة المعركة (السبت)", () => {
  it("السبت والحالي يوم سادس بلا اجتياز ← «اليوم المعركة»", async () => {
    await renderSeeded(SAT, U1_5, []);
    const b = q("battle-banner")!;
    expect(b.textContent).toContain("اليوم المعركة");
    expect(b.textContent).toContain("الوحدة 1");
    expect(b.textContent).toContain("75%");
  });

  it("المعركة مجتازة ← بلا شارة", async () => {
    await renderSeeded(SAT, U1_6, [battleWin("A1-u1", "2026-10-17")]);
    expect(q("battle-banner")).toBeNull();
  });

  it("يوم عادي (أربعاء) والحالي سادس ← بلا شارة", async () => {
    await renderSeeded(WED, U1_5, []);
    expect(q("battle-banner")).toBeNull();
  });
});

describe("D277: المؤجلة (الاثنين)", () => {
  it("الاثنين + معركة مجتازة بلا مؤجلة ← الشارة والزر", async () => {
    await renderSeeded(MON, U1_6, [battleWin("A1-u1", "2026-10-17")]);
    expect(q("deferred-banner")!.textContent).toContain("موعد المؤجلة");
    expect(q("start-deferred")).not.toBeNull();
  });

  it("الأربعاء ← بلا مؤجلة", async () => {
    await renderSeeded(WED, U1_6, [battleWin("A1-u1", "2026-10-17")]);
    expect(q("deferred-banner")).toBeNull();
  });

  it("المعركة غير مجتازة ← بلا مؤجلة", async () => {
    await renderSeeded(MON, U1_6, []);
    expect(q("deferred-banner")).toBeNull();
  });

  it("التدفق الكامل: بدء ← اختبار ← تسجيل delayed-battle + دقائق اليوم", async () => {
    // أول وحدة بلا حزمة تحويل — وإن اكتملت الحزم (D297: كل A1) فالتدفق على u15 مخلوطاً
    const packless = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].find(
      (u) => !ALL_TRANSFER.some((p) => p.level === "A1" && p.unit === u),
    );
    const pureUnit = packless ?? 15;
    const expectPure = packless !== undefined;
    const pureKey = `A1-u${pureUnit}`;
    const { lesson } = await loadSessionBundle(`a1-u${pureUnit}-d6`);
    const base = startQuizAttempt(lesson, 1).items;
    const flowPack = ALL_TRANSFER.find((p) => p.level === "A1" && p.unit === pureUnit);
    const items: readonly QuizItem[] = flowPack ? mixTransferItems(base, flowPack.items, 1).items : base; // الملح = المعركة الواحدة
    const pure6 = [1, 2, 3, 4, 5, 6].map((d) => `a1-u${pureUnit}-d${d}`);
    const store = await renderSeeded(MON, pure6, [battleWin(pureKey, "2026-10-17")]);
    await click(q("start-deferred"), "ابدأ المؤجلة");
    vi.useRealTimers(); // الاستيراد الديناميكي لا يكتمل تحت التزييف — تحميل حقيقي
    await waitForReal(() => !!q("deferred-title"), "فتح المؤجلة");
    expect(q("deferred-title")!.textContent).toContain(pureKey);
    vi.useFakeTimers({ toFake: [...FAKE.toFake] });
    vi.setSystemTime(MON); // عودة للاثنين قبل الإجابة — التسجيل بتاريخ الاثنين
    expect(q("quiz-station")!.getAttribute("data-variant")).toBe("1");
    await click(q("quiz-start"), "ابدأ الاختبار");
    for (const it of items) {
      if (it.choices) {
        const btn = [...container.querySelectorAll('[data-testid^="quiz-choice-"]')].find((b) => b.textContent === it.a) ?? null;
        await click(btn, `خيار ${it.a}`);
      } else {
        await typeInto(q("quiz-input"), it.a);
        await click(q("quiz-check"), "تحقّق");
        if (q("quiz-judge-yes")) await click(q("quiz-judge-yes"), "صحيحة");
      }
      await click(q("quiz-next"), "التالي/النتيجة");
    }
    await waitFor(() => !!q("finished-note"), "ملاحظة النهاية");
    expect(q("finished-note")!.textContent).toContain("المؤجلة تمت");
    expect(q("deferred-banner")).toBeNull(); // سُجّلت فاختفت

    const saved = await store.load();
    const delayed = saved!.progress.gateResults.find((g) => g.kind === "delayed-battle")!;
    expect(delayed.gateId).toBe(pureKey);
    expect(delayed.passed).toBe(true);
    if (expectPure) expect("transferShare" in delayed).toBe(false);
    else expect(delayed.transferShare).toBeGreaterThan(0); // كل الوحدات بحزم: خلط متوقع
    const entry = saved!.sessions.find((s) => s.date === "2026-10-19")!;
    expect(entry.durationMinutes).toBeGreaterThanOrEqual(1);
  });
});

describe("D293: المؤجلة بالتحويل (الوحدة الرائدة u1)", () => {
  it("بند 🔀 واحد مخلوط + transferShare مسجلة", async () => {
    const { lesson } = await loadSessionBundle("a1-u1-d6");
    const pack = ALL_TRANSFER.find((p) => p.level === "A1" && p.unit === 1)!;
    const items = mixTransferItems(startQuizAttempt(lesson, 1).items, pack.items, 1).items; // الملح = محاولة المعركة الواحدة
    expect(items.filter((i) => i.q.startsWith("🔀 "))).toHaveLength(1);
    const store = await renderSeeded(MON, U1_6, [battleWin("A1-u1", "2026-10-17")]);
    await click(q("start-deferred"), "ابدأ المؤجلة");
    vi.useRealTimers();
    await waitForReal(() => !!q("deferred-title"), "فتح المؤجلة");
    vi.useFakeTimers({ toFake: [...FAKE.toFake] });
    vi.setSystemTime(MON);
    await click(q("quiz-start"), "ابدأ الاختبار");
    let sawTransfer = false;
    for (const it of items) {
      if (q("quiz-question")!.textContent!.includes("🔀")) sawTransfer = true;
      if (it.choices) {
        const btn = [...container.querySelectorAll('[data-testid^="quiz-choice-"]')].find((b) => b.textContent === it.a) ?? null;
        await click(btn, `خيار ${it.a}`);
      } else {
        await typeInto(q("quiz-input"), it.a);
        await click(q("quiz-check"), "تحقّق");
        if (q("quiz-judge-yes")) await click(q("quiz-judge-yes"), "صحيحة");
      }
      await click(q("quiz-next"), "التالي/النتيجة");
    }
    expect(sawTransfer).toBe(true);
    await waitFor(() => !!q("finished-note"), "ملاحظة النهاية");
    const saved = await store.load();
    const delayed = saved!.progress.gateResults.find((g) => g.kind === "delayed-battle")!;
    expect(delayed.passed).toBe(true);
    expect(delayed.transferShare).toBeCloseTo(1 / 6);
  });
});
