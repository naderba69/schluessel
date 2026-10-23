// @vitest-environment happy-dom
// tests/debrief-ui.test.tsx — D278: بطاقتا التفريغ والمعايرة (مستقل + داخل التطبيق)
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { UnitDebriefCard } from "../src/components/UnitDebrief.js";
import { CalibrationReportCard } from "../src/components/CalibrationReport.js";
import type { UnitDebrief } from "../src/lib/lesson-path.js";
import { App } from "../src/App.js";
import { memoryLearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import type { CalibrationEntry, ErrorEntry, GateResult } from "../content/schemas/index.js";

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

const FULL: UnitDebrief = {
  unitKey: "A1-u1", battles: 2, best: 0.85, delayedBest: 0.9,
  goldenOpen: 1, goldenResolved: 3, calibrations: 4, bias: -12,
};

describe("UnitDebriefCard — مستقل", () => {
  it("الكامل: معركة + مؤجلة + ذهبية + معايرة + مولر", () => {
    const html = renderToStaticMarkup(<UnitDebriefCard debrief={FULL} muellerLine="مهلاً" />);
    expect(html).toContain("تفريغ الوحدة A1-u1");
    expect(html).toContain("2 محاولات");
    expect(html).toContain("85%");
    expect(html).toContain("المؤجلة: 90%");
    expect(html).toContain("3 حُلَّت و1 تنتظر دورها");
    expect(html).toContain("نتائجك أعلى من توقعك");
    expect(html).toContain("مهلاً");
  });

  it("الأدنى: بلا مؤجلة ولا ذهبية ولا معايرة — أسطرها تغيب بلطف", () => {
    const html = renderToStaticMarkup(
      <UnitDebriefCard
        debrief={{ unitKey: "A1-u2", battles: 1, best: 0.75, delayedBest: null, goldenOpen: 0, goldenResolved: 0, calibrations: 0, bias: null }}
        muellerLine="م"
      />,
    );
    expect(html).toContain("1 محاولة");
    expect(html).toContain("المؤجلة: يوم الاثنين");
    expect(html).not.toContain("debrief-golden");
    expect(html).not.toContain("debrief-bias");
  });
});

describe("CalibrationReportCard — مستقل", () => {
  it("المتوسطات والحكم", () => {
    const html = renderToStaticMarkup(
      <CalibrationReportCard entries={[{ predicted: 70, actual: 80 }, { predicted: 90, actual: 80 }]} />,
    );
    expect(html).toContain("تقرير المعايرة");
    expect(html).toContain("2 توقعات");
    expect(html).toContain("توقّعك 80%");
    expect(html).toContain("نتيجتك 80%");
    expect(html).toContain("دقيق");
  });

  it("الفارغ: دعوة", () => {
    const html = renderToStaticMarkup(<CalibrationReportCard entries={[]} />);
    expect(html).toContain("لا توقعات بعد");
  });
});

describe("التطبيق — التفريغ والمعايرة", () => {
  const U1 = ["a1-u1-d1", "a1-u1-d2", "a1-u1-d3", "a1-u1-d4", "a1-u1-d5", "a1-u1-d6"];
  const U2 = ["a1-u2-d1", "a1-u2-d2", "a1-u2-d3", "a1-u2-d4", "a1-u2-d5", "a1-u2-d6"];
  const battleWin = (unitKey: string): GateResult => ({
    gateId: unitKey, kind: "unit-battle", score: 0.8, passed: true, attempts: 1, weakSections: [], date: "2026-10-17",
  });
  const cal = (lessonId: string, predicted: number, actual: number): CalibrationEntry => ({
    date: "2026-10-17", predicted, actual, lessonId,
  });
  const err = (id: string, source: string, resolved: boolean): ErrorEntry => ({
    id, kind: "slip", skill: "vocab",
    payload: { wrong: "x", correct: "y", explanation: "ز", source },
    remedialExercises: [], occurrences: 1, resolved, createdAt: "2026-10-17",
  });

  async function renderSeeded(seed: { completed: string[]; gates: GateResult[]; calibration?: CalibrationEntry[]; errors?: ErrorEntry[] }) {
    const store = memoryLearnerStore();
    const base = createInitialState("ضياء");
    await store.save({
      ...base,
      profile: { ...base.profile, calibration: seed.calibration ?? [] },
      progress: { ...base.progress, completedLessons: seed.completed, gateResults: seed.gates },
      errors: seed.errors ?? [],
    });
    await act(async () => root.render(<App store={store} />));
    for (let i = 0; i < 50 && (q("boot-loading") || q("first-loading")); i++) await act(async () => {});
  }

  it("أول أيام الوحدة الجديدة: تفريغ السابقة بأرقامها", async () => {
    await renderSeeded({
      completed: U1,
      gates: [battleWin("A1-u1")],
      calibration: [cal("a1-u1-d1", 70, 80)],
      errors: [err("e1", "a1-u1-d3/quiz", false), err("e2", "a1-u1-d6/deferred", true)],
    });
    const card = q("unit-debrief")!;
    expect(card.textContent).toContain("تفريغ الوحدة A1-u1");
    expect(card.textContent).toContain("1 محاولة");
    expect(card.textContent).toContain("80%");
    expect(card.textContent).toContain("المؤجلة: يوم الاثنين");
    expect(card.textContent).toContain("1 حُلَّت و1 تنتظر دورها");
  });

  it("منتصف الوحدة (اليوم الثاني): بلا تفريغ", async () => {
    await renderSeeded({ completed: [...U1, "a1-u2-d1"], gates: [battleWin("A1-u1")] });
    expect(q("unit-debrief")).toBeNull();
  });

  it("وحدتان مجتازتان: تقرير المعايرة ظاهر", async () => {
    await renderSeeded({
      completed: [...U1, ...U2],
      gates: [battleWin("A1-u1"), battleWin("A1-u2")],
      calibration: [cal("a1-u1-d1", 70, 80), cal("a1-u2-d1", 90, 80)],
    });
    const card = q("calibration-report")!;
    expect(card.textContent).toContain("تقرير المعايرة");
    expect(card.textContent).toContain("توقّعك 80%");
    expect(card.textContent).toContain("دقيق");
  });

  it("وحدة واحدة: بلا تقرير (كل وحدتين)", async () => {
    await renderSeeded({ completed: U1, gates: [battleWin("A1-u1")] });
    expect(q("calibration-report")).toBeNull();
  });
});
