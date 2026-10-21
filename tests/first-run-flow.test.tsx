// @vitest-environment happy-dom
// tests/first-run-flow.test.tsx — طقس البداية §2.11 (N-151 · D251): اسم → رحلة → نوافذ → التزام واحد كامل
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FirstRun } from "../src/components/FirstRun.js";
import { loadFirstSession } from "../src/lesson-packs.js";
import type { LearnerState } from "../content/schemas/index.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const __FIRST = await loadFirstSession();

let container: HTMLElement;
let root: Root;
const q = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const screen = () => container.querySelector("section[data-screen]")?.getAttribute("data-screen");
const btn = (text: string) =>
  [...container.querySelectorAll("button")].find((b) => b.textContent === text) ?? null;

beforeEach(() => {
  container = document.createElement("div");
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
async function typeInto(el: Element | null, value: string) {
  if (!el) throw new Error("حقل غير موجود");
  const input = el as HTMLInputElement;
  await act(async () => {
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function boot(onComplete: (s: LearnerState) => void, onFinish: () => void) {
  await act(async () =>
    root.render(
      <FirstRun
        onComplete={onComplete}
        onFinish={onFinish}
        firstLesson={__FIRST.lesson}
        firstLessonWords={__FIRST.direct}
      />,
    ),
  );
}
async function passWelcomeAndName(name = "يوسف") {
  expect(screen()).toBe("welcome");
  await click(btn("لنبدأ"));
  expect(screen()).toBe("ask-name");
  await typeInto(container.querySelector('[aria-label="اسم المتعلم"]'), name);
  await click(btn("أنا جاهز"));
  expect(screen()).toBe("journey-name");
}
async function passUnit0AndFinish(onFinish: () => void) {
  expect(screen()).toBe("unit0-day1");
  await click(btn("التالية"));
  await click(btn("التالية"));
  await click(btn("التالية"));
  await click(btn("إلى أول درس"));
  expect(screen()).toBe("first-lesson");
  await click(q("first-lesson-start"));
  expect(onFinish).toHaveBeenCalledTimes(1);
}

describe("طقس البداية الكامل: التزام واحد بالاسم والرحلة والنوافذ", () => {
  it("رحلة مسماة + نافذتان ⇒ حالة كاملة ثم أول درس", async () => {
    const onComplete = vi.fn();
    const onFinish = vi.fn();
    await boot(onComplete, onFinish);
    await passWelcomeAndName();
    await typeInto(q("journey-input"), "ألمانيتي");
    await click(q("journey-next"));
    expect(screen()).toBe("coach-windows");
    await click(q("window-afternoon")); // إسقاط العصر — تبقى نافذتان
    await click(q("windows-next"));
    expect(onComplete).toHaveBeenCalledTimes(1);
    const state = onComplete.mock.calls[0]![0] as LearnerState;
    expect(state.profile.name).toBe("يوسف");
    expect(state.profile.journeyName).toBe("ألمانيتي");
    expect(state.profile.coachWindows).toEqual(["midday", "evening"]);
    await passUnit0AndFinish(onFinish);
  });

  it("تخطّي الرحلة + تأجيل النوافذ ⇒ فارغة + الثلاث", async () => {
    const onComplete = vi.fn();
    const onFinish = vi.fn();
    await boot(onComplete, onFinish);
    await passWelcomeAndName();
    await click(q("journey-next")); // فارغة — التابع يعمل
    await click(q("windows-defer"));
    expect(onComplete).toHaveBeenCalledTimes(1);
    const state = onComplete.mock.calls[0]![0] as LearnerState;
    expect(state.profile.journeyName).toBe("");
    expect(state.profile.coachWindows).toEqual(["midday", "afternoon", "evening"]);
    await passUnit0AndFinish(onFinish);
  });

  it("نافذة واحدة ⇒ التابع معطّل (نافذتان على الأقل)", async () => {
    const onComplete = vi.fn();
    await boot(onComplete, () => {});
    await passWelcomeAndName();
    await click(q("journey-next"));
    await click(q("window-afternoon"));
    await click(q("window-evening"));
    expect((q("windows-next") as HTMLButtonElement).disabled).toBe(true);
    expect(onComplete).not.toHaveBeenCalled();
    await click(q("window-evening"));
    expect((q("windows-next") as HTMLButtonElement).disabled).toBe(false);
  });

  it("لا التزام قبل النوافذ (الحالة تُبنى مرة واحدة كاملة)", async () => {
    const onComplete = vi.fn();
    await boot(onComplete, () => {});
    await passWelcomeAndName();
    expect(onComplete).not.toHaveBeenCalled();
    await click(q("journey-next"));
    expect(onComplete).not.toHaveBeenCalled();
  });
});
