// @vitest-environment happy-dom
// tests/window-task.test.tsx — D303 · N-156/6: مهمة النافذة F002 (النبض يحمل مهمة محددة)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CoachPulse } from "../src/components/CoachPulse.js";
import {
  BLAME_WORDS,
  WINDOW_TASK_PREFIX_AR,
  WINDOW_TASK_SKILL_FALLBACK_AR,
  pickCoachDrill,
  windowTask,
} from "../src/lib/coach-engine.js";
import type { ErrorEntry } from "../content/schemas/index.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const err = (id: string, wrong: string, createdAt: string, resolved = false): ErrorEntry => ({
  id, kind: "slip", skill: "vocab",
  payload: { wrong, correct: "y", explanation: "ز", source: "a1-u1-d1" },
  remedialExercises: [], occurrences: 1, resolved, createdAt,
});

describe("D303 — مهمة النافذة: نفس تدريب «درّبني» مسمّى سلفاً", () => {
  it("مع أخطاء ← أحدث غير محلول مسمّى بنصه مع تسمية النافذة", () => {
    const errors = [err("e-old", "der Haus", "2026-10-18"), err("e-new", "die hennes", "2026-10-20")];
    const t = windowTask("afternoon", errors, "Aa");
    expect(t.titleAr).toContain("عصر");
    expect(t.taskAr).toContain("die hennes");
    expect(t.taskAr).not.toContain("der Haus");
    expect(pickCoachDrill(errors)!.id).toBe("e-new"); // نفس الاختيار
  });

  it("المحلول يُتخطى — وكل المحلولة ← احتياطي الحرف", () => {
    const errors = [err("e-1", "der Haus", "2026-10-20", true)];
    const t = windowTask("midday", errors, "Bb");
    expect(t.taskAr).toContain("Bb");
    expect(t.taskAr).not.toContain("der Haus");
  });

  it("بلا أخطاء وبلا حرف ← احتياطي مهارة اليوم", () => {
    const t = windowTask("evening", [], null);
    expect(t.titleAr).toContain("مساء");
    expect(t.taskAr).toBe(WINDOW_TASK_SKILL_FALLBACK_AR);
  });

  it("النوافذ الثلاث بتسمياتها الصحيحة", () => {
    expect(windowTask("midday", [], null).titleAr).toContain("ظهيرة");
    expect(windowTask("afternoon", [], null).titleAr).toContain("عصر");
    expect(windowTask("evening", [], null).titleAr).toContain("مساء");
  });

  it("نصوص المهمة بلا كلمة لوم واحدة (D23)", () => {
    const t = windowTask("midday", [err("e-1", "x", "2026-10-20")], "Aa");
    const all = `${WINDOW_TASK_PREFIX_AR} ${WINDOW_TASK_SKILL_FALLBACK_AR} ${t.titleAr} ${t.taskAr}`;
    for (const w of BLAME_WORDS) expect(all).not.toContain(w);
  });
});

describe("D303 — عرض المهمة في شريط النبض", () => {
  let container: HTMLElement;
  let root: Root;
  const q = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const noop = () => {};

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  it("مع أخطاء ← المهمة تسمّي الخطأ الذهبي", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 21, 10, 0));
    await act(async () => {
      root.render(
        <CoachPulse window="evening" errors={[err("e-1", "die hennes", "2026-10-20")]} onTrain={noop} onSnooze={noop} onDismiss={noop} />,
      );
    });
    expect(q("coach-pulse-task")!.textContent).toContain("die hennes");
    expect(q("coach-pulse-task")!.textContent).toContain("مساء");
  });

  it("بلا أخطاء ← مهمة احتياطية (حرف اليوم)", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 21, 10, 0));
    await act(async () => {
      root.render(<CoachPulse window="midday" onTrain={noop} onSnooze={noop} onDismiss={noop} />);
    });
    const text = q("coach-pulse-task")!.textContent!;
    expect(text).toContain("ظهيرة");
    expect(text.length).toBeGreaterThan(10);
  });
});
