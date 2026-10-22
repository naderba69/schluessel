// @vitest-environment happy-dom
// tests/coach-pulse-ui.test.tsx — D272: شريط النبض على الشاشة + زر تفعيل التذكير
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CoachPulse } from "../src/components/CoachPulse.js";
import { NotificationOptIn } from "../src/components/CoachBlock.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;
const q = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`);

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete (globalThis as Record<string, unknown>).Notification;
});

async function click(el: HTMLElement | null) {
  expect(el).not.toBeNull();
  await act(async () => {
    el!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

describe("CoachPulse — الشريط", () => {
  it("يعرض النافذة والنص والأزرار الثلاثة، وكل زر ينادي معالجه", async () => {
    const onTrain = vi.fn();
    const onSnooze = vi.fn();
    const onDismiss = vi.fn();
    await act(async () => {
      root.render(<CoachPulse window="midday" onTrain={onTrain} onSnooze={onSnooze} onDismiss={onDismiss} />);
    });
    expect(q("coach-pulse-title")!.textContent).toContain("ظهيرة");
    expect(q("coach-pulse-body")!.textContent!.length).toBeGreaterThan(10);
    await click(q("coach-pulse-train"));
    await click(q("coach-pulse-snooze"));
    await click(q("coach-pulse-dismiss"));
    expect(onTrain).toHaveBeenCalledTimes(1);
    expect(onSnooze).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe("NotificationOptIn — التفعيل الاختياري", () => {
  it("بلا دعم إشعارات: لا شيء يُعرض (لا كسر)", async () => {
    await act(async () => {
      root.render(<NotificationOptIn />);
    });
    expect(container.textContent).toBe("");
  });

  it("الإذن الافتراضي: زر تفعيل → بعد القبول سطر المفعّل", async () => {
    (globalThis as Record<string, unknown>).Notification = {
      permission: "default",
      requestPermission: async () => "granted",
    };
    await act(async () => {
      root.render(<NotificationOptIn />);
    });
    expect(q("notify-enable")).not.toBeNull();
    await click(q("notify-enable"));
    await act(async () => {});
    expect(q("notify-status")!.textContent).toContain("مفعّل");
  });

  it("الإذن المرفوض: سطر لطيف بلا لوم ولا زر", async () => {
    (globalThis as Record<string, unknown>).Notification = { permission: "denied" };
    await act(async () => {
      root.render(<NotificationOptIn />);
    });
    expect(q("notify-enable")).toBeNull();
    expect(q("notify-status")!.textContent).toContain("لا بأس");
  });
});
