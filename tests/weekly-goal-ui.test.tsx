// @vitest-environment happy-dom
// tests/weekly-goal-ui.test.tsx — D279: الهدف الأسبوعي (إعلان الاثنين وقياس المعركة)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { WeeklyGoalCard } from "../src/components/WeeklyGoal.js";
import { App } from "../src/App.js";
import { memoryLearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { loadLesson } from "../src/lesson-packs.js";
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

const battleWin = (unitKey: string): GateResult => ({
  gateId: unitKey, kind: "unit-battle", score: 0.8, passed: true, attempts: 1, weakSections: [], date: "2026-10-17",
});

describe("WeeklyGoalCard — مستقل", () => {
  it("الحالات الأربع تنطق بما يناسبها", () => {
    expect(renderToStaticMarkup(<WeeklyGoalCard goal="س" state="announce" />)).toContain("هدف هذا الأسبوع");
    expect(renderToStaticMarkup(<WeeklyGoalCard goal="س" state="reminder" />)).toContain("يقرّبك منه");
    expect(renderToStaticMarkup(<WeeklyGoalCard goal="س" state="measure" />)).toContain("يُقاس اليوم");
    expect(renderToStaticMarkup(<WeeklyGoalCard goal="س" state="achieved" />)).toContain("تحقق");
  });
});

describe("التطبيق — الهدف الأسبوعي", () => {
  async function renderSeeded(at: Date, gates: GateResult[] = []) {
    await loadLesson("a1-u1-d6"); // تدفئة الذاكرة بالمؤقت الحقيقي — الاستيراد الديناميكي لا يكتمل تحت التزييف
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
    vi.setSystemTime(at);
    const store = memoryLearnerStore();
    await store.save(createInitialState("ضياء"));
    const saved = await store.load();
    await store.save({ ...saved!, progress: { ...saved!.progress, gateResults: gates } });
    await act(async () => root.render(<App store={store} />));
    await waitFor(() => !q("boot-loading") && !q("first-loading"), "انتهاء التحميل");
  }

  it("مساء الاثنين: إعلان بهدف السادس الحقيقي", async () => {
    await renderSeeded(new Date(2026, 9, 19, 21, 30));
    await waitFor(() => !!q("weekly-goal"), "ظهور الهدف");
    const card = q("weekly-goal")!;
    expect(card.getAttribute("data-state")).toBe("announce");
    expect(card.textContent).toContain("هدف هذا الأسبوع");
    expect(card.textContent).toContain("يعرّف بنفسه في خمس جمل");
  });

  it("صباح الاثنين: مخفي (قبل الإعلان)", async () => {
    await renderSeeded(new Date(2026, 9, 19, 10, 0));
    await waitFor(() => !!q("day-focus"), "شاشة اليوم");
    expect(q("weekly-goal")).toBeNull();
  });

  it("الأربعاء: تذكير", async () => {
    await renderSeeded(new Date(2026, 9, 21, 10, 0));
    await waitFor(() => !!q("weekly-goal"), "ظهور الهدف");
    expect(q("weekly-goal")!.getAttribute("data-state")).toBe("reminder");
  });

  it("السبت بلا معركة: قياس", async () => {
    await renderSeeded(new Date(2026, 9, 24, 10, 0));
    await waitFor(() => !!q("weekly-goal"), "ظهور الهدف");
    expect(q("weekly-goal")!.getAttribute("data-state")).toBe("measure");
  });

  it("السبت بعد الاجتياز: تحقق", async () => {
    await renderSeeded(new Date(2026, 9, 24, 10, 0), [battleWin("A1-u1")]);
    await waitFor(() => !!q("weekly-goal"), "ظهور الهدف");
    const card = q("weekly-goal")!;
    expect(card.getAttribute("data-state")).toBe("achieved");
    expect(card.textContent).toContain("تحقق");
  });

  it("الأحد: صمت", async () => {
    await renderSeeded(new Date(2026, 9, 18, 10, 0));
    await waitFor(() => !!q("day-focus"), "شاشة اليوم");
    expect(q("weekly-goal")).toBeNull();
  });
});
