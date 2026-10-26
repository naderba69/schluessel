// @vitest-environment happy-dom
// tests/flex-week-ui.test.tsx — D282: الأسبوع المرن (الحكم + العودة بلا ديون)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "../src/App.js";
import { memoryLearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { recordSession } from "../src/lib/session-log.js";

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
  for (let i = 0; i < 100; i++) {
    if (cond()) return;
    await act(async () => {});
  }
  throw new Error(`لم يتحقق: ${what}`);
}

async function renderSeeded(at: Date, days: [string, number][]) {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
  vi.setSystemTime(at);
  const store = memoryLearnerStore();
  const base = createInitialState("ضياء");
  let sessions = recordSession([], { date: "2026-01-01", durationMinutes: 0 });
  sessions = [];
  for (const [date, durationMinutes] of days) sessions = recordSession(sessions, { date, durationMinutes });
  await store.save({ ...base, sessions });
  await act(async () => root.render(<App store={store} />));
  await waitFor(() => !q("boot-loading") && !q("first-loading"), "انتهاء التحميل");
}

const MON = new Date(2026, 9, 19, 10, 0); // اثنين
const THU = new Date(2026, 9, 22, 10, 0); // خميس
const FRI = new Date(2026, 9, 23, 10, 0); // جمعة

describe("D282: حكم الأسبوع", () => {
  it("3×45 ← «أسبوع ناجح»", async () => {
    await renderSeeded(FRI, [["2026-10-19", 45], ["2026-10-20", 45], ["2026-10-21", 45]]);
    expect(q("flex-week")!.textContent).toContain("أسبوع ناجح ✓");
  });

  it("1×45 ← «1 من 3»", async () => {
    await renderSeeded(FRI, [["2026-10-19", 45], ["2026-10-20", 10]]);
    const t = q("flex-week")!.textContent!;
    expect(t).toContain("1 من 3");
    expect(t).toContain("تكفي لأسبوع ناجح");
  });

  it("أسبوع فارغ ← القاعدة وحدها", async () => {
    await renderSeeded(MON, []);
    expect(q("flex-week")!.textContent).toContain("ثلاثة أيام × 45 دقيقة تكفي");
  });
});

describe("D282: العودة بلا ديون (اثنين→أربعاء)", () => {
  it("الماضي خفيف ← «يبدأ نظيفاً»", async () => {
    await renderSeeded(MON, [["2026-10-12", 30]]);
    expect(q("flex-return")!.textContent).toContain("يبدأ نظيفاً");
  });

  it("الماضي ناجح ← بلا عودة", async () => {
    await renderSeeded(MON, [["2026-10-12", 45], ["2026-10-13", 45], ["2026-10-14", 45]]);
    expect(q("flex-return")).toBeNull();
  });

  it("انقطاع ثم عودة ← «عدت»", async () => {
    await renderSeeded(MON, [["2026-10-05", 60]]);
    expect(q("flex-return")!.textContent).toContain("عدت");
  });

  it("جديد تماماً ← بلا عودة", async () => {
    await renderSeeded(MON, []);
    expect(q("flex-return")).toBeNull();
  });

  it("الخميس ← بلا عودة (انتهت النافذة)", async () => {
    await renderSeeded(THU, [["2026-10-12", 30]]);
    expect(q("flex-return")).toBeNull();
  });
});
