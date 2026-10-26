// @vitest-environment happy-dom
// tests/weekly-challenge.test.tsx — D299 · N-156/2: التحدي الأسبوعي F009 (مهمة مهارية الجمعة/السبت)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CoachBlock } from "../src/components/CoachBlock.js";
import {
  BLAME_WORDS,
  COACH_TASK_MAX_SEC,
  COACH_TASK_MIN_SEC,
  WEEKLY_CHALLENGE_DONE_AR,
  WEEKLY_CHALLENGE_TASK_AR,
  WEEKLY_CHALLENGE_TITLE_AR,
  isValidTask,
  weeklyChallenge,
} from "../src/lib/coach-engine.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const FRI = new Date(2026, 9, 23, 10, 0); // جمعة
const SAT = new Date(2026, 9, 24, 10, 0); // سبت
const SUN = new Date(2026, 9, 25, 10, 0); // أحد
const WED = new Date(2026, 9, 21, 10, 0); // أربعاء

describe("D299 — التحدي الأسبوعي: الجمعة/السبت فقط، دعوة بلا لوم", () => {
  it("الجمعة والسبت ← تحدي · الأحد (راحة) والأربعاء ← لا شيء", () => {
    expect(FRI.getDay()).toBe(5);
    expect(SAT.getDay()).toBe(6);
    expect(weeklyChallenge(FRI)).not.toBeNull();
    expect(weeklyChallenge(SAT)).not.toBeNull();
    expect(weeklyChallenge(SUN)).toBeNull();
    expect(weeklyChallenge(WED)).toBeNull();
  });

  it("التحدي مهمة صالحة: 30–180 ثانية + تثبيت فقط (بلا جديد)", () => {
    const c = weeklyChallenge(FRI)!;
    expect(c.durationSec).toBeGreaterThanOrEqual(COACH_TASK_MIN_SEC);
    expect(c.durationSec).toBeLessThanOrEqual(COACH_TASK_MAX_SEC);
    expect(isValidTask({ id: "f009", kind: "weekly-challenge", durationSec: c.durationSec, refsKnownContent: true }).ok).toBe(true);
  });

  it("نصوص التحدي بلا كلمة لوم واحدة (D23)", () => {
    const all = `${WEEKLY_CHALLENGE_TITLE_AR} ${WEEKLY_CHALLENGE_TASK_AR} ${WEEKLY_CHALLENGE_DONE_AR}`;
    for (const w of BLAME_WORDS) expect(all).not.toContain(w);
  });
});

describe("D299 — عرض التحدي في تبويب المدرب", () => {
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

  async function mount(at: Date) {
    vi.useFakeTimers();
    vi.setSystemTime(at);
    root = createRoot(container);
    await act(async () => root!.render(<CoachBlock errors={[]} dueCount={0} hasNewContent={false} />));
  }

  it("الجمعة: التحدي ظاهر مع زر الإنجاز", async () => {
    await mount(FRI);
    expect(q("weekly-challenge")!.textContent).toContain("30 ثانية");
    expect(q("weekly-challenge")!.textContent).toContain("دعوة لا امتحان");
    expect(q("challenge-done")).not.toBeNull();
  });

  it("الأربعاء: لا تحدي", async () => {
    await mount(WED);
    expect(q("weekly-challenge")).toBeNull();
  });

  it("زر الإنجاز ← ثناء محلي بلا تخزين (بلا سلسلة ضغط — D23)", async () => {
    await mount(SAT);
    await act(async () => (q("challenge-done") as HTMLElement).click());
    expect(q("weekly-challenge")).toBeNull();
    expect(q("challenge-praise")!.textContent).toContain("أحسنت");
  });
});
