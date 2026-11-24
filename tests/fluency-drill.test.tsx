// @vitest-environment happy-dom
// tests/fluency-drill.test.tsx — D577: تمرين الطلاقة 4/3/2 (§6 خيط الطلاقة)
// الجولات 4/3/2 بالأرقام الدستورية · المحتوى حتميّ من مخزون مُدرَّس · بلا حكم ولا درجات (D16/D23).
import { afterEach, describe, expect, it } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { FLUENCY_ROUNDS, mmss, pickFluencyLesson, pickFluencyLines, roundRemaining } from "../src/lib/fluency-drill.js";
import { taughtLessonIds } from "../src/lib/weekly-cards.js";
import { LESSON_ORDER, loadScriptsForLesson } from "../src/lesson-packs.js";
import { Fluency432 } from "../src/components/Fluency432.js";

const THU = new Date(2026, 9, 22, 10, 0, 0); // 2026-10-22 خميس (أسبوع ISO 43)

const roots: Root[] = [];
function mount(el: ReactElement) {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  roots.push(root);
  act(() => {
    root.render(el);
  });
  return host;
}
afterEach(() => {
  for (const r of roots.splice(0)) act(() => r.unmount());
  document.body.innerHTML = "";
});
async function waitFor(cond: () => boolean, what: string) {
  for (let i = 0; i < 200; i++) {
    if (cond()) return;
    await act(async () => new Promise((r) => setTimeout(r, 5)));
  }
  throw new Error(`لم يكتمل: ${what}`);
}

describe("D577 — نموذج 4/3/2", () => {
  it("الجولات 4/3/2 بالأرقام الدستورية (§6)", () => {
    expect(FLUENCY_ROUNDS.map((r) => r.minutes)).toEqual([4, 3, 2]);
    expect(roundRemaining(240, 30)).toBe(210);
    expect(roundRemaining(240, 300)).toBe(0); // لا سالب أبداً
    expect(mmss(210)).toBe("3:30");
    expect(mmss(45)).toBe("0:45");
  });

  it("الاختيار حتميّ ومن المخزون المُدرَّس (D126) — بمضاعف مختلف عن المرآة", () => {
    const a = pickFluencyLesson(THU, 5);
    expect(a).toBe(pickFluencyLesson(THU, 5));
    expect(taughtLessonIds(5)).toContain(a!);
    const lines = [
      { id: "l1", text: "a" },
      { id: "l2", text: "b" },
      { id: "l3", text: "c" },
      { id: "l4", text: "d" },
    ];
    const win = pickFluencyLines(lines, THU);
    expect(win).toHaveLength(3);
    expect(win).toEqual(pickFluencyLines(lines, THU));
  });
});

describe("D577 — التمرين في DOM", () => {
  it("ثلاث جولات متتابعة · المقطع باتجاه ltr · الإنجاز بلا درجات ولا حكم", async () => {
    const host = mount(<Fluency432 currentIndex={20} now={THU} />);
    await waitFor(() => host.querySelectorAll('[data-testid="f432-line"]').length > 0, "تحميل المقطع");
    expect(host.querySelectorAll('[data-testid="f432-line"]')).toHaveLength(3);
    for (const p of host.querySelectorAll('[data-testid="f432-line"]')) {
      expect(p.querySelector('[dir="ltr"]')).not.toBeNull(); // Bidi إلزامي
    }
    // الجولات متتابعة: الثانية معطّلة حتى تُنجز الأولى
    expect(host.querySelector<HTMLButtonElement>('[data-testid="f432-start-1"]')!.disabled).toBe(true);
    await act(async () => host.querySelector<HTMLButtonElement>('[data-testid="f432-start-0"]')!.click());
    expect(host.querySelector('[data-testid="f432-timer-0"]')).not.toBeNull();
    await act(async () => host.querySelector<HTMLButtonElement>('[data-testid="f432-finish-0"]')!.click());
    await act(async () => host.querySelector<HTMLButtonElement>('[data-testid="f432-start-1"]')!.click());
    await act(async () => host.querySelector<HTMLButtonElement>('[data-testid="f432-finish-1"]')!.click());
    await act(async () => host.querySelector<HTMLButtonElement>('[data-testid="f432-start-2"]')!.click());
    await act(async () => host.querySelector<HTMLButtonElement>('[data-testid="f432-finish-2"]')!.click());
    const done = host.querySelector('[data-testid="f432-done"]')!;
    expect(done.textContent).toContain("بلا درجات ولا حكم");
    expect(done.textContent).toContain("أنهيت 4/3/2");
  });
});
