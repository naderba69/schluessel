// @vitest-environment happy-dom
// tests/cando-measure-ui.test.tsx — D276: توقيع Can-do + شريط القياس اليومي (§14)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { CloseStation } from "../src/components/LessonContent.js";
import { MeasureStrip } from "../src/components/MeasureStrip.js";
import { planLessonStations } from "../src/lib/lesson-runner.js";
import { loadFirstSession } from "../src/lesson-packs.js";
import { SessionLog } from "../content/schemas/index.js";
import { App, localDay } from "../src/App.js";
import { memoryLearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { recordSession } from "../src/lib/session-log.js";

const __FIRST = await loadFirstSession();
const firstLesson = __FIRST.lesson;
const firstLessonWords = __FIRST.direct;
const plan = planLessonStations(firstLesson, firstLessonWords);

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

describe("D276: الخطة + التوقيع", () => {
  it("plan.close.canDos = أهداف الدرس (1–2)", () => {
    expect(plan.close.canDos).toEqual(firstLesson.canDoDaily);
    expect(plan.close.canDos.length).toBeGreaterThanOrEqual(1);
    expect(plan.close.canDos.length).toBeLessThanOrEqual(2);
  });

  it("التفريغ يعرض الهدفين بلا توقيع: ○ + زر «أوقّع»", () => {
    const html = renderToStaticMarkup(
      <CloseStation data={plan.close} report="r" preview="p" muellerLine="m" ticks={[]} onTick={() => {}} />,
    );
    expect(html).toContain("cando-signoff");
    for (const s of plan.close.canDos) expect(html).toContain(s);
    expect(html).toContain("○");
    expect(html).toContain("أوقّع");
    expect(html).not.toContain("إلغاء التوقيع");
  });

  it("الموقَّع يظهر ✓ + «إلغاء التوقيع»", () => {
    const html = renderToStaticMarkup(
      <CloseStation
        data={plan.close}
        report="r"
        preview="p"
        muellerLine="m"
        ticks={[{ statement: plan.close.canDos[0]!, done: true }]}
        onTick={() => {}}
      />,
    );
    expect(html).toContain("✓");
    expect(html).toContain("إلغاء التوقيع");
  });

  it("النقر ينادي onTick بالنص والحالة المعكوسة", async () => {
    const onTick = vi.fn();
    await act(async () => {
      root.render(
        <CloseStation data={plan.close} report="r" preview="p" muellerLine="m" ticks={[]} onTick={onTick} />,
      );
    });
    await click(q("cando-sign-0"));
    expect(onTick).toHaveBeenCalledWith(plan.close.canDos[0], true);
  });
});

describe("D276: شريط القياس", () => {
  const entry = SessionLog.parse({
    date: "2026-10-23",
    dose: "target-90",
    durationMinutes: 90,
    canDoTicks: [
      { statement: "أحيي", done: true },
      { statement: "أودع", done: false },
    ],
    wordsNew: 5,
    wordsPlanned: 8,
    srsMinutes: 15,
    reflection: { learned: "الماضي" },
  });

  it("الشريط الكامل: جرعة + كلمات + SRS + تأمل + Can-do", () => {
    const html = renderToStaticMarkup(<MeasureStrip entry={entry} dueCount={3} />);
    expect(html).toContain("الجرعة 90 دقيقة");
    expect(html).toContain("الكلمات 5/8");
    expect(html).toContain("SRS 15 دقيقة (3 متأخرة)");
    expect(html).toContain("التأمل ✓");
    expect(html).toContain("✓ Can-do 1");
    expect(html).toContain("○ Can-do 2");
  });

  it("الفارغ: ○ ×2 + تأمل ○", () => {
    const empty = SessionLog.parse({ date: "2026-10-23", dose: "minimum-45", durationMinutes: 45 });
    const html = renderToStaticMarkup(<MeasureStrip entry={empty} dueCount={0} />);
    expect(html).toContain("○ Can-do 1 ○ Can-do 2");
    expect(html).toContain("التأمل ○");
  });

  it("التطبيق: الشريط ظاهر في تبويب اليوم بعد الدراسة", async () => {
    const store = memoryLearnerStore();
    const base = createInitialState("ضياء");
    const sessions = recordSession([], {
      date: localDay(),
      durationMinutes: 45,
      canDoTicks: [{ statement: "أحيي", done: true }],
      wordsNew: 5,
      srsMinutes: 15,
    });
    await store.save({ ...base, sessions });
    await act(async () => root.render(<App store={store} />));
    const strip = q("measure-strip")!;
    expect(strip.textContent).toContain("الجرعة 45 دقيقة");
    expect(strip.textContent).toContain("الكلمات 5/0");
    expect(strip.textContent).toContain("✓ Can-do 1");
  });
});
