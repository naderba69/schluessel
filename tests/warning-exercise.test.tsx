// @vitest-environment happy-dom
// warning-exercise.test.tsx — N-047 (D229): تمرين بطاقة المصيدة يظهر بمحاولة قبل الكشف (F121)
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { WarningExercise } from "../content/schemas/index.js";
import { CloseStation, WarningExerciseView } from "../src/components/LessonContent.js";
import { planLessonStations } from "../src/lib/lesson-runner.js";
import { firstLesson, firstLessonWords } from "../src/lesson-packs.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("N-047 — الخلاصة تعرض تمرين كل بطاقة والإجابة مخفية أولاً", () => {
  const plan = planLessonStations(firstLesson, firstLessonWords);

  it("3 تمارين بأسئلتها · بلا إجابات · بلا زر كشف قبل المحاولة", () => {
    const html = renderToStaticMarkup(<CloseStation data={plan.close} report="r" preview="p" muellerLine="m" />);
    expect(html.match(/data-testid="warning-exercise"/g)).toHaveLength(3);
    expect(html.match(/تمرينها:/g)).toHaveLength(3);
    expect(html).not.toContain('data-testid="warning-answer"');
    expect(html).toContain('data-testid="warning-check"');
    expect(html).not.toContain('data-testid="warning-reveal"');
  });

  it("تمرين الاختيار (a1-u3-d5 حياً): الأزرار الثلاثة ظاهرة والإجابة مخفية", () => {
    const html = renderToStaticMarkup(<WarningExerciseView q="اختر الأداة: ___ Anruf" a="der" choices={["der", "die", "das"]} />);
    expect(html).toContain('data-testid="warning-choice-der"');
    expect(html).toContain('data-testid="warning-choice-die"');
    expect(html).toContain('data-testid="warning-choice-das"');
    expect(html).not.toContain('data-testid="warning-answer"');
  });

  it("المخطط: خيارات بلا إجابة تُرفض · ومكررة تُرفض · والإدخال وحده يُقبل", () => {
    expect(WarningExercise.safeParse({ q: "q", a: "der", choices: ["die", "das"] }).success).toBe(false);
    expect(WarningExercise.safeParse({ q: "q", a: "der", choices: ["der", "der"] }).success).toBe(false);
    expect(WarningExercise.safeParse({ q: "q", a: "der", choices: ["der", "die", "das"] }).success).toBe(true);
    expect(WarningExercise.safeParse({ q: "صحّح: x", a: "Er ist neu." }).success).toBe(true);
  });
});

describe("N-047 — التفاعل: محاولة ← تصحيح ← كشف", () => {
  let container: HTMLElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });
  const q = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`);

  it("إجابة خاطئة ← «ليس بعد» + زر الكشف ← الكشف يُظهر الصحيح", async () => {
    await act(async () => root.render(<WarningExerciseView q="أكمل: Wie ___ du?" a="heißt" />));
    const input = q("warning-input") as HTMLInputElement;
    await act(async () => {
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")!.set!.call(input, "bist");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => q("warning-check")!.click());
    expect(q("warning-verdict")!.textContent).toContain("ليس بعد");
    expect(q("warning-reveal")).not.toBeNull();
    await act(async () => q("warning-reveal")!.click());
    expect(q("warning-answer")!.textContent).toContain("heißt");
  });

  it("إجابة صحيحة ← ✓ ولا زر كشف", async () => {
    await act(async () => root.render(<WarningExerciseView q="أكمل: Wie ___ du?" a="heißt" />));
    const input = q("warning-input") as HTMLInputElement;
    await act(async () => {
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")!.set!.call(input, "heißt");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => q("warning-check")!.click());
    expect(q("warning-verdict")!.textContent).toContain("✓ صحيح");
    expect(q("warning-reveal")).toBeNull();
  });

  it("الاختيار الخاطئ محاولة تُظهر الكشف", async () => {
    await act(async () => root.render(<WarningExerciseView q="اختر الأداة: ___ Anruf" a="der" choices={["der", "die", "das"]} />));
    await act(async () => q("warning-choice-die")!.click());
    expect(q("warning-verdict")!.textContent).toContain("ليس بعد");
    expect(q("warning-reveal")).not.toBeNull();
  });
});
