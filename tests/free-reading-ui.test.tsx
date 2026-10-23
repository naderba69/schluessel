// @vitest-environment happy-dom
// tests/free-reading-ui.test.tsx — D281: نص القراءة الحر (مستقل + داخل التطبيق)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FreeReading } from "../src/components/FreeReading.js";
import { toEngineText } from "../src/lib/reading.js";
import { App, localDay } from "../src/App.js";
import { memoryLearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { ALL_LESETEXTS } from "../src/lesson-packs.js";
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

const U1TEXT = ALL_LESETEXTS.find((t) => t.id === "a1-lese-u1")!;
const ENGINE = toEngineText({ id: U1TEXT.id, level: "A1", title: U1TEXT.title, text: U1TEXT.text });

describe("FreeReading — مستقل", () => {
  it("المختبر + كشف الأجوبة + الإنهاء", async () => {
    let finished = 0;
    await act(async () => root.render(<FreeReading text={ENGINE} questions={U1TEXT.questions} onFinish={() => finished++} />));
    expect(q("reading-lab")).not.toBeNull();
    expect(q("read-first")!.textContent).toContain("لا تُترجم بعد"); // المحاولة قبل الكشف
    expect(q("read-question-0")!.textContent).toContain("Woher kommt Yusuf?");
    expect(q("read-answer-0")).toBeNull();
    await click(q("read-reveal-0"), "اكشف");
    expect(q("read-answer-0")!.textContent).toContain("Aus Tunesien.");
    await click(q("mark-read"), "قرأت");
    await click(q("translate-a1-lese-u1-s1"), "ترجم");
    expect(q("ar-a1-lese-u1-s1")).not.toBeNull();
    await click(q("reading-finish"), "أنهيت");
    expect(finished).toBe(1);
  });
});

describe("التطبيق — نص الخميس", () => {
  async function renderSeeded(at: Date, completed: string[], readMinutes: number) {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
    vi.setSystemTime(at);
    const store = memoryLearnerStore();
    const base = createInitialState("ضياء");
    const iso = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}`;
    const sessions = readMinutes > 0 ? recordSession([], { date: iso, durationMinutes: readMinutes, readingMinutes: readMinutes }) : [];
    await store.save({ ...base, progress: { ...base.progress, completedLessons: completed }, sessions });
    await act(async () => root.render(<App store={store} />));
    await waitFor(() => !q("boot-loading") && !q("first-loading"), "انتهاء التحميل");
    return store;
  }

  const THU = new Date(2026, 9, 22, 10, 0); // خميس
  const WED = new Date(2026, 9, 21, 10, 0); // أربعاء
  const U1 = ["a1-u1-d1", "a1-u1-d2", "a1-u1-d3", "a1-u1-d4", "a1-u1-d5", "a1-u1-d6"];

  it("الخميس + وحدة مكتملة ← الشارة بالنص الصحيح", async () => {
    await renderSeeded(THU, U1, 0);
    const b = q("reading-banner")!;
    expect(b.textContent).toContain("مرحباً، اسمي يوسف!");
    expect(b.textContent).toContain("الوحدة 1");
    expect(q("start-reading")).not.toBeNull();
  });

  it("الأربعاء ← بلا نص (الخميس وحده)", async () => {
    await renderSeeded(WED, U1, 0);
    expect(q("reading-banner")).toBeNull();
  });

  it("بلا وحدات مكتملة ← بلا نص", async () => {
    await renderSeeded(THU, [], 0);
    expect(q("reading-banner")).toBeNull();
  });

  it("المكتمل بلا نص (u13) ← بلا نص", async () => {
    await renderSeeded(THU, ["a1-u13-d1"], 0);
    expect(q("reading-banner")).toBeNull();
  });

  it("تمّ اليوم ← سطر الإنجاز بلا زر", async () => {
    await renderSeeded(THU, U1, 5);
    expect(q("reading-banner")).toBeNull();
    expect(q("reading-done")!.textContent).toContain("تمت");
  });

  it("التدفق الكامل: فتح ← قراءة ← كشف ← تسجيل الدقائق", async () => {
    const store = await renderSeeded(THU, U1, 0);
    await click(q("start-reading"), "اقرأ");
    expect(q("reading-title")!.textContent).toContain("مرحباً، اسمي يوسف!");
    expect(q("free-reading")).not.toBeNull();
    await click(q("mark-read"), "قرأت");
    await click(q("read-reveal-1"), "اكشف");
    expect(q("read-answer-1")!.textContent).toContain("Deutsch.");
    await click(q("reading-finish"), "أنهيت");
    await waitFor(() => !!q("finished-note"), "ملاحظة النهاية");
    expect(q("finished-note")!.textContent).toContain("قرأت نصاً كاملاً");
    const saved = await store.load();
    const entry = saved!.sessions.find((s) => s.date === localDay())!;
    expect(entry.readingMinutes).toBeGreaterThanOrEqual(1);
    expect(entry.durationMinutes).toBeGreaterThanOrEqual(1);
  });
});
