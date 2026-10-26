// @vitest-environment happy-dom
// tests/reflection-ui.test.tsx — D275: سطر التأمل + بطاقة الغد (مستقل + داخل التطبيق)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ReflectionCard } from "../src/components/ReflectionCard.js";
import { App, localDay } from "../src/App.js";
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
  await act(async () => root.unmount());
  container.remove();
});

async function click(el: Element | null) {
  if (!el) throw new Error("زر غير موجود");
  await act(async () => (el as HTMLElement).click());
}

async function type(input: Element | null, value: string) {
  if (!input) throw new Error("حقل غير موجود");
  const el = input as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
  await act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("ReflectionCard — مستقل", () => {
  it("حقلان + حفظ — ينادي onSave بالنصين ويؤكد", async () => {
    const onSave = vi.fn();
    await act(async () => {
      root.render(<ReflectionCard initial={{}} onSave={onSave} />);
    });
    await type(q("reflection-learned"), "الماضي مع haben");
    await type(q("reflection-tomorrow"), "مراجعة الأرقام");
    await click(q("reflection-save"));
    expect(onSave).toHaveBeenCalledWith("الماضي مع haben", "مراجعة الأرقام");
    expect(q("reflection-saved")).not.toBeNull();
  });

  it("القيم المحفوظة تظهر أولية", async () => {
    await act(async () => {
      root.render(<ReflectionCard initial={{ learned: "x", tomorrow: "y" }} onSave={vi.fn()} />);
    });
    expect((q("reflection-learned") as HTMLInputElement).value).toBe("x");
    expect((q("reflection-tomorrow") as HTMLInputElement).value).toBe("y");
  });
});

describe("التطبيق — التركيز والتأمل والغد", () => {
  async function renderWithToday(minutes: number) {
    const store = memoryLearnerStore();
    const base = createInitialState("ضياء");
    const sessions = minutes > 0 ? recordSession([], { date: localDay(), durationMinutes: minutes }) : [];
    await store.save({ ...base, sessions });
    await act(async () => root.render(<App store={store} />));
    return store;
  }

  it("سطر التركيز ظاهر دائماً", async () => {
    await renderWithToday(0);
    expect(q("day-focus")!.textContent).toContain("تركيز اليوم:");
  });

  it("بلا دراسة اليوم: لا بطاقة تأمل (لا تأمل بلا دراسة)", async () => {
    await renderWithToday(0);
    expect(q("reflection-card")).toBeNull();
  });

  it("بعد دراسة اليوم: التأمل يُحفَظ وبطاقة الغد تذكر طلبك", async () => {
    const store = await renderWithToday(30);
    expect(q("reflection-card")).not.toBeNull();
    await type(q("reflection-learned"), "الماضي");
    await type(q("reflection-tomorrow"), "الأرقام");
    await click(q("reflection-save"));
    for (let i = 0; i < 50 && !q("tomorrow-card"); i++) await act(async () => {});
    const card = q("tomorrow-card")!;
    expect(card.textContent).toContain("غداً:");
    expect(card.textContent).toContain("الأرقام");
    const saved = await store.load();
    const entry = saved!.sessions.find((s) => s.date === localDay())!;
    expect(entry.reflection).toEqual({ learned: "الماضي", tomorrow: "الأرقام" });
  });
});
