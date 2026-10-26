// @vitest-environment happy-dom
// tests/shadow-entry.test.tsx — D306 · N-156/9: مدخل الشادوينغ في تبويب المدرب (F005 يكتمل 12/12)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CoachBlock } from "../src/components/CoachBlock.js";
import { App } from "../src/App.js";
import { memoryLearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { loadScriptsForLesson } from "../src/lesson-packs.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root | null = null;
const q = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`);

beforeEach(() => {
  container = document.createElement("div");
  window.location.hash = "";
  window.localStorage.clear();
  document.body.appendChild(container);
});
afterEach(async () => {
  if (root) await act(async () => root!.unmount());
  root = null;
  container.remove();
  vi.useRealTimers();
});

async function click(el: Element | null, what = "زر") {
  if (!el) throw new Error(`${what} غير موجود`);
  await act(async () => (el as HTMLElement).click());
}

async function waitFor(cond: () => boolean, what: string) {
  for (let i = 0; i < 300; i++) {
    if (cond()) return;
    await act(async () => {
      await new Promise((r) => setImmediate(r));
    });
  }
  throw new Error(`لم يتحقق: ${what}`);
}

describe("D306 — مدخل الظل في تبويب المدرب", () => {
  async function mountCoach(at: Date, shadowLessonId: string | null, onStartShadow: () => void) {
    vi.useFakeTimers();
    vi.setSystemTime(at);
    root = createRoot(container);
    await act(async () =>
      root!.render(
        <CoachBlock
          errors={[]}
          dueCount={0}
          hasNewContent={false}
          shadowLessonId={shadowLessonId}
          onStartShadow={onStartShadow}
        />,
      ),
    );
  }

  it("مع حوار ← المدخل ظاهر بالمعرّف والزر ينادي البدء", async () => {
    let started = 0;
    await mountCoach(new Date(2026, 9, 21, 10, 0), "a1-u1-d3", () => started++);
    expect(q("shadow-entry")!.textContent).toContain("a1-u1-d3");
    await click(q("shadow-entry-start"), "ابدأ الظل");
    expect(started).toBe(1);
  });

  it("بلا حوار ← مخفي", async () => {
    await mountCoach(new Date(2026, 9, 21, 10, 0), null, () => {});
    expect(q("shadow-entry")).toBeNull();
  });

  it("الأحد: المدرب صامت — مخفي ولو وُجد حوار", async () => {
    await mountCoach(new Date(2026, 9, 25, 10, 0), "a1-u1-d3", () => {});
    expect(q("shadow-entry")).toBeNull();
  });
});

describe("D306 — التدفق: تبويب المدرب ← بدء الظل ← شاشة الظل", () => {
  async function renderSeeded(at: Date, completed: string[]) {
    await loadScriptsForLesson("a1-u1-d3", "A1"); // تدفئة بالمؤقت الحقيقي
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
    vi.setSystemTime(at);
    const store = memoryLearnerStore();
    const base = createInitialState("ضياء");
    await store.save({ ...base, progress: { ...base.progress, completedLessons: completed }, sessions: [] });
    root = createRoot(container);
    await act(async () => root!.render(<App store={store} />));
    await waitFor(() => !q("boot-loading") && !q("first-loading"), "انتهاء التحميل");
  }

  it("من تبويب المدرب: المدخل ← بدء ← شاشة الظل في تبويب اليوم", async () => {
    await renderSeeded(new Date(2026, 9, 23, 10, 0), ["a1-u1-d1", "a1-u1-d3"]);
    await click(q("tab-coach"), "تبويب المدرب");
    expect(q("shadow-entry")!.textContent).toContain("a1-u1-d3");
    await click(q("shadow-entry-start"), "ابدأ الظل من المدرب");
    await waitFor(() => !!q("shadow-title"), "فتح الظل");
    expect(q("shadow-title")!.textContent).toContain("a1-u1-d3");
  });

  it("بلا دروس مكتملة ← لا مدخل في تبويب المدرب", async () => {
    await renderSeeded(new Date(2026, 9, 23, 10, 0), []);
    await click(q("tab-coach"), "تبويب المدرب");
    expect(q("shadow-entry")).toBeNull();
  });
});
