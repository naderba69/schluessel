// @vitest-environment happy-dom
// tests/shadowing-ui.test.tsx — D280: جري الشادوينغ (مستقل + داخل التطبيق)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ShadowingRun } from "../src/components/ShadowingRun.js";
import { App, localDay } from "../src/App.js";
import { memoryLearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { loadScriptsForLesson } from "../src/lesson-packs.js";
import { recordSession } from "../src/lib/session-log.js";
import type { AudioScript } from "../content/schemas/index.js";

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
  for (let i = 0; i < 300; i++) {
    if (cond()) return;
    await act(async () => {
      await new Promise((r) => setImmediate(r));
    });
  }
  throw new Error(`لم يتحقق: ${what}`);
}

const FAKE_SCRIPT = {
  id: "t-shadow",
  kind: "dialogue",
  level: "A1",
  title: { de: "T", ar: "ت" },
  usedIn: ["a1-u1-d3"],
  lines: [
    { id: "l1", speaker: "lena", text: "Guten Tag!" },
    { id: "l2", speaker: "yusuf", text: "Hallo!", direction: "بودّ" },
  ],
} as unknown as AudioScript;

describe("ShadowingRun — مستقل", () => {
  it("سطراً سطراً: عدّاد + تشغيل آمن + ترديد ← إنهاء", async () => {
    let finished = 0;
    await act(async () => root.render(<ShadowingRun script={FAKE_SCRIPT} onFinish={() => finished++} />));
    expect(q("shadow-counter")!.textContent).toContain("سطر 1 من 2");
    expect(q("shadow-line")!.textContent).toContain("Guten Tag!");
    await click(q("shadow-play"), "استمع"); // بلا وسيلة صوتية في الاختبار — لا يكسر
    await click(q("shadow-said"), "ردّدت");
    expect(q("shadow-counter")!.textContent).toContain("سطر 2 من 2");
    expect(q("shadow-direction")!.textContent).toContain("بودّ");
    await click(q("shadow-said"), "ردّدت");
    expect(q("shadow-run")!.getAttribute("data-phase")).toBe("done");
    await click(q("shadow-finish"), "سجّل");
    expect(finished).toBe(1);
  });
});

describe("التطبيق — الشادوينغ اليومي", () => {
  async function renderSeeded(at: Date, completed: string[], shadowMinutes: number) {
    await loadScriptsForLesson("a1-u1-d3", "A1"); // تدفئة بالمؤقت الحقيقي
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
    vi.setSystemTime(at);
    const store = memoryLearnerStore();
    const base = createInitialState("ضياء");
    const sessions =
      shadowMinutes > 0
        ? recordSession([], { date: `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`, durationMinutes: shadowMinutes, shadowingMinutes: shadowMinutes })
        : [];
    await store.save({ ...base, progress: { ...base.progress, completedLessons: completed }, sessions });
    await act(async () => root.render(<App store={store} />));
    await waitFor(() => !q("boot-loading") && !q("first-loading"), "انتهاء التحميل");
    return store;
  }

  const FRI = new Date(2026, 9, 23, 10, 0); // جمعة
  const SUN = new Date(2026, 9, 18, 10, 0); // أحد

  it("درس متقن بحوار ← الشارة والزر", async () => {
    await renderSeeded(FRI, ["a1-u1-d1", "a1-u1-d3"], 0);
    expect(q("shadow-banner")!.textContent).toContain("a1-u1-d3"); // الأحدث لا الأول
    expect(q("start-shadow")).not.toBeNull();
  });

  it("بلا دروس مكتملة ← بلا شارة", async () => {
    await renderSeeded(FRI, [], 0);
    expect(q("shadow-banner")).toBeNull();
  });

  it("المكتمل بلا حوار مباشر ← بلا شارة", async () => {
    await renderSeeded(FRI, ["a1-u1-d1"], 0);
    expect(q("shadow-banner")).toBeNull();
  });

  it("تمّ اليوم (3 دقائق) ← سطر الإنجاز بلا زر", async () => {
    await renderSeeded(FRI, ["a1-u1-d3"], 3);
    expect(q("shadow-banner")).toBeNull();
    expect(q("shadow-done")!.textContent).toContain("تم");
  });

  it("الأحد: مخفي (يوم راحة)", async () => {
    await renderSeeded(SUN, ["a1-u1-d3"], 0);
    expect(q("shadow-banner")).toBeNull();
  });

  it("التدفق الكامل: بدء ← ظل الأسطر ← تسجيل الدقائق", async () => {
    const store = await renderSeeded(FRI, ["a1-u1-d3"], 0);
    await click(q("start-shadow"), "ابدأ الظل");
    await waitFor(() => !!q("shadow-title"), "فتح الظل");
    expect(q("shadow-title")!.textContent).toContain("a1-u1-d3");
    for (let i = 0; i < 30 && q("shadow-said"); i++) await click(q("shadow-said"), "ردّدت");
    await click(q("shadow-finish"), "سجّل");
    await waitFor(() => !!q("finished-note"), "ملاحظة النهاية");
    expect(q("finished-note")!.textContent).toContain("ظللت حواراً");
    const saved = await store.load();
    const entry = saved!.sessions.find((s) => s.date === localDay())!;
    expect(entry.shadowingMinutes).toBeGreaterThanOrEqual(1);
    expect(entry.durationMinutes).toBeGreaterThanOrEqual(1);
  });
});
