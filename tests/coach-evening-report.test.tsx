// @vitest-environment happy-dom
// tests/coach-evening-report.test.tsx — D304 · N-156/7: سطر المدرب المسائي F011 في تبويب المدرب
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CoachBlock } from "../src/components/CoachBlock.js";
import { coachEveningReport, hasBlame } from "../src/lib/warmth-engine.js";
import { BLAME_WORDS as COACH_BLAME } from "../src/lib/coach-engine.js";
import type { ErrorEntry } from "../content/schemas/index.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const err = (id: string, resolved: boolean): ErrorEntry => ({
  id, kind: "slip", skill: "vocab",
  payload: { wrong: "x", correct: "y", explanation: "ز", source: "a1-u1-d1" },
  remedialExercises: [], occurrences: 1, resolved, createdAt: "2026-10-20",
});

describe("D304 — سطر المدرب المسائي: هادئ بلا أرقام مخيفة وبلا لوم", () => {
  it("درس + حلّ ← يسمّيهما معاً", () => {
    const r = coachEveningReport({ resolvedCount: 2, studiedToday: true });
    expect(r).toContain("درستَ اليوم");
    expect(r).toContain("حللتَ 2 من أخطائك الذهبية");
    expect(r).toContain("نم جيداً");
  });

  it("بلا دراسة وبلا حلّ ← باب مفتوح لا عتاب", () => {
    const r = coachEveningReport({ resolvedCount: 0, studiedToday: false });
    expect(r).toContain("الباب مفتوح دائماً");
    expect(r).not.toContain("حللتَ");
  });

  it("حلّ بلا دراسة ← يُذكَر الحل وحده", () => {
    const r = coachEveningReport({ resolvedCount: 1, studiedToday: false });
    expect(r).toContain("حللتَ 1");
    expect(r).not.toContain("درستَ اليوم");
  });

  it("كل الفروع بلا لوم في القائمتين (D23)", () => {
    const all = [
      coachEveningReport({ resolvedCount: 0, studiedToday: false }),
      coachEveningReport({ resolvedCount: 3, studiedToday: true }),
      coachEveningReport({ resolvedCount: 1, studiedToday: false }),
      coachEveningReport({ resolvedCount: 0, studiedToday: true }),
    ].join(" ");
    expect(hasBlame(all)).toBe(false);
    for (const w of COACH_BLAME) expect(all).not.toContain(w);
  });
});

describe("D304 — عرض السطر في إغلاق اليوم", () => {
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

  async function mount(at: Date, props: { errors?: ErrorEntry[]; studiedToday?: boolean } = {}) {
    vi.useFakeTimers();
    vi.setSystemTime(at);
    root = createRoot(container);
    await act(async () =>
      root!.render(
        <CoachBlock
          errors={props.errors ?? []}
          dueCount={0}
          hasNewContent={false}
          studiedToday={props.studiedToday ?? false}
        />,
      ),
    );
  }

  it("مساء يوم عادي: السطر ظاهر قبل سؤال التذكر", async () => {
    await mount(new Date(2026, 9, 21, 21, 30), { errors: [err("e-1", true), err("e-2", false)], studiedToday: true });
    const html = q("day-closing")!.innerHTML;
    expect(html.indexOf('data-testid="coach-evening-report"')).toBeLessThan(html.indexOf("ماذا تتذكر"));
    expect(q("coach-evening-report")!.textContent).toContain("حللتَ 1");
  });

  it("صباحاً: لا سطر (الإغلاق مسائي فقط)", async () => {
    await mount(new Date(2026, 9, 21, 10, 0));
    expect(q("coach-evening-report")).toBeNull();
  });

  it("مساء الأحد: المدرب صامت — لا سطر", async () => {
    await mount(new Date(2026, 9, 25, 21, 30));
    expect(q("coach-evening-report")).toBeNull();
  });
});
