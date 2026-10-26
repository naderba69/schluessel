// @vitest-environment happy-dom
// tests/no-repeat.test.tsx — D311 · N-155/3: حارس اللاتكرار — كل معلومة تُقال مرة واحدة في شاشة اليوم
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "../src/App.js";
import { memoryLearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import type { ErrorEntry } from "../content/schemas/index.js";

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
const dueCard = (cardId: string, due: string) => ({
  cardId, due, stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1,
  reps: 1, lapses: 0, state: "Review" as const, masteryLevel: "L1" as const,
});
const err = (id: string, at: Date): ErrorEntry => ({
  id, kind: "slip", skill: "vocab",
  payload: { wrong: "x", correct: "y", explanation: "ز", source: "a1-u1-d1" },
  remedialExercises: [], occurrences: 1, resolved: false, createdAt: iso(at),
});

async function renderSeeded(at: Date) {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
  vi.setSystemTime(at);
  const store = memoryLearnerStore();
  const base = createInitialState("ضياء");
  await store.save({
    ...base,
    progress: { ...base.progress, completedLessons: ["a1-u1-d1", "a1-u1-d3"] },
    srsCards: [dueCard("w-1", iso(at)), dueCard("w-2", iso(at)), dueCard("w-3", iso(at))],
    errors: [err("e-1", at), err("e-2", at)],
  });
  await act(async () => root.render(<App store={store} />));
  await waitFor(() => !q("boot-loading") && !q("first-loading"), "انتهاء التحميل");
}

const countOf = (needle: string) =>
  (container.textContent ?? "").split(needle).length - 1;

describe("D311 — شاشة اليوم: كل معلومة مرة واحدة", () => {
  const WED = new Date(2026, 9, 21, 10, 0); // أربعاء مزدحم: مستحقات + ظل + ذهبية

  it("«مستحقة» مرة واحدة — في عدّاد المستحق فقط", async () => {
    await renderSeeded(WED);
    expect(q("due-count")).not.toBeNull();
    expect(q("start-micro")).not.toBeNull(); // داخل «المزيد» لكن موجود
    expect(countOf("مستحقة")).toBe(1);
  });

  it("«الذهبية» و«أسبوعك» مرة واحدة لكل منهما", async () => {
    await renderSeeded(WED);
    expect(countOf("أخطاؤك الذهبية")).toBe(1);
    expect(countOf("أسبوعك (")).toBe(1);
  });

  it("زر الجلسة الأساسي واحد — لا زر بدء ثانٍ خارج «المزيد» والمجدول", async () => {
    await renderSeeded(WED);
    const starts = ["start-session", "start-micro", "start-shadow", "start-reading", "start-deferred", "start-cyclic"]
      .filter((id) => q(id));
    expect(starts).toContain("start-session");
    const more = q("more-today")!;
    for (const id of starts) {
      if (id === "start-session") expect(more.contains(q(id))).toBe(false);
      else expect(more.contains(q(id))).toBe(true); // الأربعاء العادي: كل ثانوي داخل الغطاء
    }
  });
});
