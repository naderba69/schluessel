// @vitest-environment happy-dom
// tests/one-action.test.tsx — D310 · N-155/2: فعل واحد بارز (§2.2 «زر واحد») + «المزيد اليوم» للثانوي
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "../src/App.js";
import { memoryLearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
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

async function waitFor(cond: () => boolean, what: string) {
  for (let i = 0; i < 300; i++) {
    if (cond()) return;
    await act(async () => {
      await new Promise((r) => setImmediate(r));
    });
  }
  throw new Error(`لم يتحقق: ${what}`);
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const battleWin = (unitKey: string, date: string): GateResult => ({
  gateId: unitKey, kind: "unit-battle", score: 0.8, passed: true, attempts: 1, weakSections: [], date,
});
const dueCard = (cardId: string, due: string) => ({
  cardId, due, stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1,
  reps: 1, lapses: 0, state: "Review" as const, masteryLevel: "L1" as const,
});

async function renderSeeded(at: Date, opts: { completed?: string[]; gates?: GateResult[]; dues?: number } = {}) {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
  vi.setSystemTime(at);
  const store = memoryLearnerStore();
  const base = createInitialState("ضياء");
  const srsCards = Array.from({ length: opts.dues ?? 0 }, (_, i) => dueCard(`w-due-${i}`, iso(at)));
  await store.save({
    ...base,
    progress: { ...base.progress, completedLessons: opts.completed ?? [], gateResults: opts.gates ?? [] },
    srsCards,
  });
  await act(async () => root.render(<App store={store} />));
  await waitFor(() => !q("boot-loading") && !q("first-loading"), "انتهاء التحميل");
}

const inside = (outerId: string, innerId: string) =>
  q(outerId)!.contains(q(innerId));

describe("D310 — شاشة اليوم: جلسة واحدة بارزة والثانوي في «المزيد»", () => {
  const WED = new Date(2026, 9, 21, 10, 0); // أربعاء
  const THU = new Date(2026, 9, 22, 10, 0); // خميس
  const MON = new Date(2026, 9, 19, 10, 0); // اثنين

  it("يوم عادي بمستحقات وظل: الجلسة خارج «المزيد» والمصغّرة والظل داخله", async () => {
    await renderSeeded(WED, { completed: ["a1-u1-d1", "a1-u1-d3"], dues: 2 });
    expect(q("start-session")).not.toBeNull();
    expect(q("more-today")).not.toBeNull();
    expect(q("more-today")!.textContent).toContain("المزيد اليوم");
    expect(inside("more-today", "start-session")).toBe(false);
    expect(inside("more-today", "start-micro")).toBe(true);
    expect(inside("more-today", "start-shadow")).toBe(true);
    expect(inside("more-today", "shadow-banner")).toBe(true);
  });

  it("يوم نظيف بلا ثانوي: لا «المزيد» أصلاً (لا ضجيج فارغ)", async () => {
    await renderSeeded(WED, { completed: ["a1-u1-d1"], dues: 0 });
    expect(q("start-session")).not.toBeNull();
    expect(q("more-today")).toBeNull();
  });

  it("الخميس: القراءة الحرة داخل «المزيد»", async () => {
    await renderSeeded(THU, { completed: ["a1-u1-d1", "a1-u1-d3"], dues: 0 });
    expect(q("more-today")).not.toBeNull();
    expect(inside("more-today", "start-reading")).toBe(true);
    expect(inside("more-today", "reading-banner")).toBe(true);
  });

  it("الاثنين: المؤجلة المجدولة تبقى خارج «المزيد» (المؤجلة أولاً)", async () => {
    const U1_6 = ["a1-u1-d1", "a1-u1-d2", "a1-u1-d3", "a1-u1-d4", "a1-u1-d5", "a1-u1-d6"];
    await renderSeeded(MON, { completed: U1_6, gates: [battleWin("A1-u1", "2026-10-17")], dues: 1 });
    expect(q("start-deferred")).not.toBeNull();
    expect(inside("more-today", "start-deferred")).toBe(false);
    expect(inside("more-today", "deferred-banner")).toBe(false);
    expect(inside("more-today", "start-micro")).toBe(true); // المصغّرة ثانوية دائماً
  });
});
