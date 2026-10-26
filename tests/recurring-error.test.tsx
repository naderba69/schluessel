// @vitest-environment happy-dom
// tests/recurring-error.test.tsx — D305 · N-156/8: الخطأ الذهبي العابر F008 (الأكثر تكراراً لا الأحدث)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CoachBlock } from "../src/components/CoachBlock.js";
import {
  BLAME_WORDS,
  RECURRING_MIN_OCCURRENCES,
  RECURRING_TITLE_AR,
  pickCoachDrill,
  pickRecurringDrill,
} from "../src/lib/coach-engine.js";
import type { ErrorEntry } from "../content/schemas/index.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const err = (id: string, wrong: string, createdAt: string, occurrences: number, resolved = false): ErrorEntry => ({
  id, kind: "slip", skill: "vocab",
  payload: { wrong, correct: `صح-${wrong}`, explanation: "شرح", source: "a1-u1-d1" },
  remedialExercises: [], occurrences, resolved, createdAt,
});

describe("D305 — الخطأ المتكرر: الأعلى تكراراً بين غير المحلولة", () => {
  it("يختار الأكثر تكراراً ولو لم يكن الأحدث (عكس «درّبني»)", () => {
    const errors = [err("e-old", "قديم", "2026-10-18", 5), err("e-new", "جديد", "2026-10-20", 2)];
    expect(pickRecurringDrill(errors)!.id).toBe("e-old");
    expect(pickCoachDrill(errors)!.id).toBe("e-new");
  });

  it("التعادل في التكرار ← الأحدث", () => {
    const errors = [err("e-old", "قديم", "2026-10-18", 3), err("e-new", "جديد", "2026-10-20", 3)];
    expect(pickRecurringDrill(errors)!.id).toBe("e-new");
  });

  it("المحلول يُستبعَد ولو تكرر كثيراً", () => {
    const errors = [err("e-done", "محلول", "2026-10-19", 9, true), err("e-open", "مفتوح", "2026-10-18", 2)];
    expect(pickRecurringDrill(errors)!.id).toBe("e-open");
  });

  it(`مرة واحدة ليست تكراراً (الحد ${RECURRING_MIN_OCCURRENCES}) — والقائمة الفارغة ← null`, () => {
    expect(RECURRING_MIN_OCCURRENCES).toBe(2);
    expect(pickRecurringDrill([err("e-1", "مرة", "2026-10-20", 1)])).toBeNull();
    expect(pickRecurringDrill([])).toBeNull();
  });

  it("نص البطاقة بلا لوم (D23)", () => {
    for (const w of BLAME_WORDS) expect(RECURRING_TITLE_AR).not.toContain(w);
  });
});

describe("D305 — بطاقة الخطأ العنيد في تبويب المدرب", () => {
  let container: HTMLElement;
  let root: Root | null = null;
  const q = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`);

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  afterEach(async () => {
    if (root) await act(async () => root!.unmount());
    root = null;
    container.remove();
    vi.useRealTimers();
  });

  async function mount(at: Date, errors: ErrorEntry[]) {
    vi.useFakeTimers();
    vi.setSystemTime(at);
    root = createRoot(container);
    await act(async () => root!.render(<CoachBlock errors={errors} dueCount={0} hasNewContent={false} />));
  }

  const WED = new Date(2026, 9, 21, 10, 0);
  const SUN = new Date(2026, 9, 25, 10, 0);

  it("المتكرر ≠ الأحدث ← البطاقة ظاهرة بالعدد والنص، والكشف يُظهر التصحيح", async () => {
    await mount(WED, [err("e-old", "قديم", "2026-10-18", 5), err("e-new", "جديد", "2026-10-20", 2)]);
    expect(q("recurring-error")!.textContent).toContain("تكرر 5 مرات");
    expect(q("recurring-error")!.textContent).toContain("قديم");
    expect(q("recurring-answer")).toBeNull();
    await act(async () => (q("recurring-reveal") as HTMLElement).click());
    expect(q("recurring-answer")!.textContent).toContain("صح-قديم");
  });

  it("المتكرر = الأحدث ← مخفية (لا تمرين مكرر)", async () => {
    await mount(WED, [err("e-1", "وحيد", "2026-10-20", 4)]);
    expect(pickRecurringDrill([err("e-1", "وحيد", "2026-10-20", 4)])!.id).toBe("e-1");
    expect(q("recurring-error")).toBeNull();
  });

  it("بلا متكرر ← مخفية", async () => {
    await mount(WED, [err("e-1", "مرة", "2026-10-20", 1)]);
    expect(q("recurring-error")).toBeNull();
  });

  it("الأحد: المدرب صامت — مخفية", async () => {
    await mount(SUN, [err("e-old", "قديم", "2026-10-18", 5), err("e-new", "جديد", "2026-10-20", 2)]);
    expect(q("recurring-error")).toBeNull();
  });
});
