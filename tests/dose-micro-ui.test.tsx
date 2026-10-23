// @vitest-environment happy-dom
// tests/dose-micro-ui.test.tsx — D274: اختيار الجرعة + الجلسة المصغّرة (مستقل + داخل التطبيق)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DosePicker } from "../src/components/DosePicker.js";
import { MicroSession } from "../src/components/MicroSession.js";
import { App } from "../src/App.js";
import { memoryLearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { loadWords } from "../src/lesson-packs.js";

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

describe("DosePicker — اختيار الجرعة", () => {
  it("ثلاث جرعات معلنة — النقر ينادي onChange والفعّالة موسومة", async () => {
    const onChange = vi.fn();
    await act(async () => {
      root.render(<DosePicker value={90} onChange={onChange} />);
    });
    expect(q("dose-45")!.textContent).toContain("الحد الأدنى");
    expect(q("dose-90")!.textContent).toContain("المستهدف");
    expect(q("dose-120")!.textContent).toContain("المثالي");
    expect(q("dose-90")!.getAttribute("aria-pressed")).toBe("true");
    expect(q("dose-45")!.getAttribute("aria-pressed")).toBe("false");
    await click(q("dose-45"));
    expect(onChange).toHaveBeenCalledWith(45);
  });
});

describe("MicroSession — الجلسة المصغّرة", () => {
  it("تعرض العدد — التقييم يُجدوِل والنهاية تُنهي", async () => {
    const [hallo, heissen] = await loadWords(["hallo", "heissen"]);
    const past = new Date(Date.now() - 86400000).toISOString();
    const pairs = [
      { card: { cardId: "hallo", due: past, stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1, reps: 0, lapses: 0, state: "Review" as const, masteryLevel: "L0" as const }, word: hallo! },
      { card: { cardId: "heissen", due: past, stability: 1, difficulty: 5, elapsed_days: 0, scheduled_days: 1, reps: 1, lapses: 0, state: "Review" as const, masteryLevel: "L0" as const }, word: heissen! },
    ];
    const onRated = vi.fn();
    const onFinish = vi.fn();
    await act(async () => {
      root.render(<MicroSession pairs={pairs} onRated={onRated} onFinish={onFinish} />);
    });
    expect(q("micro-count")!.textContent).toContain("2 بطاقة");
    for (const rating of ["good", "easy"]) {
      await click(container.querySelector('[data-testid="reveal-btn"]'));
      await click(container.querySelector(`[data-rating="${rating}"]`));
    }
    expect(onRated).toHaveBeenCalledTimes(2);
    expect(onRated).toHaveBeenCalledWith("hallo", "good");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("بلا بطاقات: رسالة لطيفة وزر إنهاء", async () => {
    const onFinish = vi.fn();
    await act(async () => {
      root.render(<MicroSession pairs={[]} onRated={vi.fn()} onFinish={onFinish} />);
    });
    expect(q("micro-empty")).not.toBeNull();
    await click(q("micro-finish-empty"));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});

describe("التطبيق — تدفق المصغّرة الكامل", () => {
  it("زر المصغّرة يظهر مع المستحق — المراجعة تُسجَّل في سجل اليوم", async () => {
    const store = memoryLearnerStore();
    const base = createInitialState("ضياء");
    const past = new Date(Date.now() - 86400000).toISOString();
    const card = (cardId: string) => ({
      cardId, due: past, stability: 1, difficulty: 5, elapsed_days: 0,
      scheduled_days: 1, reps: 0, lapses: 0, state: "Review" as const, masteryLevel: "L0" as const,
    });
    await store.save({ ...base, srsCards: [card("hallo")] });
    await act(async () => root.render(<App store={store} />));
    // زر المصغّرة ظاهر (مستحق واحد) — والجرعة الافتراضية 90
    const micro = q("start-micro");
    expect(micro).not.toBeNull();
    expect(micro!.textContent).toContain("1 مستحقة");
    expect(q("start-session")!.textContent).toContain("90 دقيقة");
    // تغيير الجرعة ينعكس على الزر ويُحفَظ
    await click(q("dose-45"));
    expect(q("start-session")!.textContent).toContain("45 دقيقة");
    // فتح المصغّرة ومراجعة البطاقة
    await click(q("start-micro"));
    for (let i = 0; i < 50 && !q("micro-session"); i++) await act(async () => {});
    expect(q("micro-session")).not.toBeNull();
    await click(container.querySelector('[data-testid="reveal-btn"]'));
    await click(container.querySelector('[data-rating="good"]'));
    for (let i = 0; i < 50 && q("micro-session"); i++) await act(async () => {});
    expect(q("micro-session")).toBeNull();
    // سُجّلت دقائق SRS في سجل اليوم
    const saved = await store.load();
    const today = saved!.sessions[saved!.sessions.length - 1]!;
    expect(today.srsMinutes).toBeGreaterThanOrEqual(1);
    expect(today.durationMinutes).toBeGreaterThanOrEqual(1);
  });
});
