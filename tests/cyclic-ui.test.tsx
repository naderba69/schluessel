// @vitest-environment happy-dom
// tests/cyclic-ui.test.tsx — D283: الاختبار الدوري (القصير والشهري — داخل التطبيق)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App, localDay } from "../src/App.js";
import { memoryLearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { ALL_PRUEFUNGEN } from "../src/lesson-packs.js";
import { cyclicQuizLesson } from "../src/lib/quiz-session.js";
import type { GateResult } from "../content/schemas/index.js";

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

async function waitFor(cond: () => boolean, what: string) {
  for (let i = 0; i < 100; i++) {
    if (cond()) return;
    await act(async () => {});
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

async function renderSeeded(at: Date, createdAt: string, gates: GateResult[] = []) {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
  vi.setSystemTime(at);
  const store = memoryLearnerStore();
  const base = createInitialState("ضياء");
  await store.save({
    ...base,
    profile: { ...base.profile, createdAt },
    progress: { ...base.progress, gateResults: gates },
  });
  await act(async () => root.render(<App store={store} />));
  await waitFor(() => !q("boot-loading") && !q("first-loading"), "انتهاء التحميل");
  return store;
}

const SAT2 = new Date(2026, 9, 17, 10, 0); // سبت الأسبوع 2 (من 10-05)
const SAT4 = new Date(2026, 9, 31, 10, 0); // سبت الأسبوع 4
const FRI2 = new Date(2026, 9, 16, 10, 0); // جمعة
const kurzDone: GateResult = {
  gateId: "a1-kurztest-w2", kind: "kurztest", score: 0.8, passed: true, attempts: 1, weakSections: [], date: "2026-10-17",
};

describe("D283: شارة الدوري", () => {
  it("سبت الأسبوع 2 ← القصير (تراكمي + 15 د)", async () => {
    await renderSeeded(SAT2, "2026-10-05");
    const b = q("cyclic-banner")!;
    expect(b.textContent).toContain("الاختبار القصير");
    expect(b.textContent).toContain("تراكمي الأسبوعين");
    expect(b.textContent).toContain("15 دقيقة");
    expect(q("start-cyclic")).not.toBeNull();
  });

  it("سبت الأسبوع 4 ← الشهرية (45 د) لا القصير", async () => {
    await renderSeeded(SAT4, "2026-10-05");
    expect(q("cyclic-banner")!.textContent).toContain("المعركة الشهرية");
    expect(q("cyclic-banner")!.textContent).toContain("45 دقيقة");
  });

  it("المسجَّل ← «تم» بلا زر", async () => {
    await renderSeeded(SAT2, "2026-10-05", [kurzDone]);
    expect(q("cyclic-banner")).toBeNull();
    expect(q("cyclic-done")!.textContent).toContain("تم");
  });

  it("الجمعة ← لا شيء", async () => {
    await renderSeeded(FRI2, "2026-10-05");
    expect(q("cyclic-banner")).toBeNull();
  });

  it("الأسبوع 1 ← لا شيء", async () => {
    await renderSeeded(SAT2, "2026-10-12");
    expect(q("cyclic-banner")).toBeNull();
  });

  it("سبت الأسبوع 14 ← آخر القصير (تراكمي الوحدات 1–14)", async () => {
    await renderSeeded(new Date(2027, 0, 9, 10, 0), "2026-10-05");
    expect(q("cyclic-banner")!.textContent).toContain("الاختبار القصير");
    expect(q("cyclic-banner")!.textContent).toContain("14");
    expect(q("start-cyclic")).not.toBeNull();
  });
});

describe("D283: التدفق الكامل للقصير", () => {
  it("بدء ← 8 بنود مفتوحة ← تسجيل kurztest + الدقائق", async () => {
    const store = await renderSeeded(SAT2, "2026-10-05");
    await click(q("start-cyclic"), "ابدأ");
    expect(q("cyclic-title")!.textContent).toContain("a1-kurztest-w2");
    const test = ALL_PRUEFUNGEN.find((t) => t.id === "a1-kurztest-w2")!;
    const items = cyclicQuizLesson(test).quiz.variants[0]!.items;
    expect(items).toHaveLength(8);
    await click(q("quiz-start"), "ابدأ الاختبار");
    for (const it of items) {
      await typeInto(q("quiz-input"), it.a);
      await click(q("quiz-check"), "تحقّق");
      if (q("quiz-judge-yes")) await click(q("quiz-judge-yes"), "صحيحة");
      await click(q("quiz-next"), "التالي/النتيجة");
    }
    await waitFor(() => !!q("finished-note"), "ملاحظة النهاية");
    expect(q("finished-note")!.textContent).toContain("الاختبار الدوري تم");
    const saved = await store.load();
    const g = saved!.progress.gateResults.find((x) => x.gateId === "a1-kurztest-w2")!;
    expect(g.kind).toBe("kurztest");
    expect(g.passed).toBe(true);
    const entry = saved!.sessions.find((s) => s.date === localDay())!;
    expect(entry.durationMinutes).toBeGreaterThanOrEqual(1);
  });
});
