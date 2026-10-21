// @vitest-environment happy-dom
// tests/today-screen.test.tsx — شاشة اليوم §2.2 (N-147 · D247): تحية + يوم + نقاط أسبوع + زر واحد + عدّادان — والمخابر والمسار في تفاصيل مطوية
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "../src/App.js";
import { memoryLearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { recordSession } from "../src/lib/session-log.js";
import type { ErrorEntry } from "../content/schemas/index.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;
const q = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`);

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shiftDay = (base: Date, delta: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + delta);

async function renderSeeded() {
  const store = memoryLearnerStore();
  const today = new Date();
  const monday = shiftDay(today, -((today.getDay() + 6) % 7));
  let sessions = recordSession([], { date: iso(monday), durationMinutes: 120 });
  sessions = recordSession(sessions, { date: iso(shiftDay(monday, 1)), durationMinutes: 100 });
  const card = (cardId: string, due: string) => ({
    cardId,
    due,
    stability: 1,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 1,
    reps: 1,
    lapses: 0,
    state: "Review" as const,
    masteryLevel: "L1" as const,
  });
  const err = (id: string): ErrorEntry => ({
    id,
    kind: "slip",
    skill: "vocab",
    payload: { wrong: "x", correct: "y", explanation: "ز", source: "a1-u1-d1" },
    remedialExercises: [],
    occurrences: 1,
    resolved: false,
    createdAt: iso(today),
  });
  await store.save({
    ...createInitialState("ضياء"),
    sessions,
    srsCards: [card("w-due-1", iso(shiftDay(today, -1))), card("w-due-2", iso(today)), card("w-future-1", iso(shiftDay(today, 3)))],
    errors: [err("e-1"), err("e-2")],
  });
  await act(async () => root.render(<App store={store} />));
}

describe("شاشة اليوم §2.2 (N-147)", () => {
  it("تحية بالاسم + اليوم + نقاط الأسبوع (2/7) + العدّادان", async () => {
    await renderSeeded();
    const h1 = container.querySelector("h1")!;
    const weekday = new Date().toLocaleDateString("ar", { weekday: "long" });
    expect(h1.textContent).toContain("ضياء");
    expect(h1.textContent).toContain(weekday);
    expect(q("week-dots")!.textContent).toContain("●●○○○○○");
    expect(q("week-dots")!.textContent).toContain("(2/7)");
    expect(q("due-count")!.textContent).toContain("2");
    expect(q("golden-count")!.textContent).toContain("2");
    expect(q("brand-header")!.textContent).toContain("مفتاح");
  });

  it("زر واحد كبير لجلسة اليوم + المخابر والمسار مطوية تحته", async () => {
    await renderSeeded();
    const btn = q("start-session")!;
    expect(btn.textContent).toContain("120 دقيقة");
    expect(btn.closest("details")).toBeNull(); // الزر ظاهر لا مطوي
    expect(q("current-lesson")!.closest("details")).toBeNull(); // الهدف ظاهر
    // المطوي: المخابر والمسار والترميز
    expect(q("open-skills-lab")!.closest("details")!.getAttribute("data-testid")).toBe("more-labs");
    expect(q("open-system-lab")!.closest("details")!.getAttribute("data-testid")).toBe("more-labs");
    expect(q("path-list")!.closest("details")!.getAttribute("data-testid")).toBe("more-path");
    expect(q("post-first-run")!.closest("details")!.getAttribute("data-testid")).toBe("more-path");
    expect(q("more-gender")!.textContent).toContain("Tisch");
  });
});
