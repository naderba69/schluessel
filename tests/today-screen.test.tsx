// @vitest-environment happy-dom
// tests/today-screen.test.tsx — شاشة اليوم §2.2 (N-147 · D247): تحية + يوم + نقاط أسبوع + زر واحد + عدّادان — والمخابر والمسار في تفاصيل مطوية
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "../src/App.js";
import { memoryLearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { recordSession } from "../src/lib/session-log.js";
import type { ErrorEntry, Word } from "../content/schemas/index.js";
import { WritingLab } from "../src/components/SkillsLab.js";

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
  vi.useRealTimers();
});

async function click(el: Element | null) {
  if (!el) throw new Error("زر غير موجود");
  await act(async () => (el as HTMLElement).click());
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shiftDay = (base: Date, delta: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + delta);

async function renderSeeded(opts: { at?: Date; withErrors?: boolean } = {}) {
  vi.useFakeTimers();
  vi.setSystemTime(opts.at ?? new Date(2026, 9, 21, 10, 0)); // أربعاء 10:00 — يوم عادي
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
    errors: opts.withErrors === false ? [] : [err("e-1"), err("e-2")],
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
    expect(q("path-list")).toBeNull(); // القائمة الكاملة انتقلت إلى لوحة النظام
    expect(q("post-first-run")).toBeNull();
    expect(q("progress-map")).not.toBeNull(); // الخريطة الهادئة ظاهرة بدلها
    expect(q("more-gender")!.textContent).toContain("Tisch");
  });
});

describe("حضور المدرب اليومي (N-148 · D248)", () => {
  it("درّبني: خطأ ذهبي ← كشف ← تم", async () => {
    await renderSeeded();
    expect(q("coach-windows")!.textContent).toContain("ظهيرة · عصر · مساء");
    await click(q("train-me"));
    expect(q("coach-drill")!.textContent).toContain("x"); // wrong من البذرة
    await click(q("coach-reveal"));
    expect(q("coach-answer")!.textContent).toContain("y");
    await click(q("coach-done"));
    expect(q("coach-drill")).toBeNull();
    expect(q("train-me")).not.toBeNull();
  });

  it("بلا أخطاء: تدريب حرف اليوم بالصوت", async () => {
    await renderSeeded({ withErrors: false });
    expect(q("golden-count")!.textContent).toContain("0");
    await click(q("train-me"));
    expect(q("coach-drill")!.textContent).toContain("حرف اليوم");
    await click(q("coach-done"));
    expect(q("coach-drill")).toBeNull();
  });

  it("إغلاق اليوم يظهر مساءً (21+) ويختفي صباحاً", async () => {
    await renderSeeded({ at: new Date(2026, 9, 21, 21, 30) });
    expect(q("day-closing")!.textContent).toContain("ماذا تتذكر");
    expect(q("tomorrow-preview")!.textContent!.length).toBeGreaterThan(10);
  });

  it("صباحاً: لا إغلاق", async () => {
    await renderSeeded({ at: new Date(2026, 9, 21, 10, 0) });
    expect(q("day-closing")).toBeNull();
  });

  it("الأحد راحة (N-152): المدرب صامت والزر يعمل بلا لوم", async () => {
    await renderSeeded({ at: new Date(2026, 9, 18, 10, 0) }); // أحد
    expect(new Date().getDay()).toBe(0);
    expect(q("coach-rest")!.textContent).toContain("راحة");
    expect(q("train-me")).toBeNull();
    expect(q("rest-day-note")!.textContent).toContain("راحة");
    expect(q("start-session")).not.toBeNull(); // الزر يبقى لمن أراد
  });

  it("يوم عادي: لا رسالة راحة", async () => {
    await renderSeeded();
    expect(q("rest-day-note")).toBeNull();
    expect(q("coach-rest")).toBeNull();
    expect(q("train-me")).not.toBeNull();
  });
});

describe("عبارة اليوم تتدوير يومياً (N-148 · D248)", () => {
  const words = [
    { de: "Hallo", ar: ["مرحباً"] },
    { de: "Danke", ar: ["شكراً"] },
  ] as Word[];

  async function renderWritingAt(at: Date): Promise<string> {
    vi.useFakeTimers();
    vi.setSystemTime(at);
    await act(async () => root.render(<WritingLab words={words} />));
    return container.querySelector('[data-testid="sentence-of-day"]')!.textContent!;
  }

  it("أول يومين يعطيان عبارتين مختلفتين", async () => {
    const jan1 = await renderWritingAt(new Date(2026, 0, 1, 10, 0));
    expect(jan1).toContain("Hallo");
    await act(async () => root.unmount());
    container.innerHTML = "";
    const { createRoot: fresh } = await import("react-dom/client");
    root = fresh(container);
    const jan2 = await renderWritingAt(new Date(2026, 0, 2, 10, 0));
    expect(jan2).toContain("Danke");
  });
});

describe("الخريطة الهادئة §2.8 (N-149 · D249)", () => {
  it("مستويات + وحدة + أسبوع + بوابة من البيانات (متعلم جديد)", async () => {
    await renderSeeded();
    const levels = q("map-levels")!.textContent!;
    expect(levels).toContain("A1");
    expect(levels).toContain("░░░░░░░░░░"); // A1: صفر من 90
    expect(q("map-unpublished-B1")!.textContent).toContain("قيد الإنتاج");
    expect(q("map-unpublished-B2")!.textContent).toContain("قيد الإنتاج");
    expect(q("map-unit")!.textContent).toContain("الوحدة 1");
    expect(q("map-unit")!.textContent).toContain("◉○○○○○"); // d1 متاح والباقي مقفل
    expect(q("map-week")!.textContent).toContain("الأسبوع 1 من 62");
    expect(q("map-gate")!.textContent).toContain("الأسبوع 6");
  });
});

describe("الدفتر الذهبي §2.7 (N-150 · D250)", () => {
  it("يعرض الأخطاء: الخاطئ ← الصحيح + التعليل + النوع", async () => {
    await renderSeeded();
    expect(q("golden-book")!.textContent).toContain("دفتر أخطائك الذهبية (2)");
    const entries = container.querySelectorAll('[data-testid="golden-entry"]');
    expect(entries.length).toBe(2);
    expect(q("golden-book")!.textContent).toContain("x");
    expect(q("golden-book")!.textContent).toContain("y");
    expect(q("golden-book")!.textContent).toContain("ز");
    expect(q("golden-book")!.textContent).toContain("هفوة");
  });

  it("بلا أخطاء: رسالة فارغة صريحة لا قائمة وهمية", async () => {
    await renderSeeded({ withErrors: false });
    expect(q("golden-empty")!.textContent).toContain("دفترك فارغ");
    expect(container.querySelector('[data-testid="golden-entry"]')).toBeNull();
  });
});
