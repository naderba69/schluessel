// @vitest-environment happy-dom
// tests/srs-rate-ui.test.tsx — D273: تقييم بطاقة SRS في المحطة ينادي الجدولة — والدفء لا يُجدوِل
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { RecallStation } from "../src/components/LessonContent.js";
import type { RecallCardData } from "../src/lib/lesson-runner.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;
const q = (sel: string) => container.querySelector<HTMLElement>(sel);

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function revealAndRate(rating: string) {
  await act(async () => {
    q('[data-testid="reveal-btn"]')!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await act(async () => {
    q(`[data-rating="${rating}"]`)!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

const srsCard: RecallCardData = {
  id: "srs-hallo",
  front: "«مرحبا» — قلها بالألمانية",
  back: "Hallo",
  speakText: "Hallo",
  kind: "srs",
  srsCardId: "hallo",
};
const warmCard: RecallCardData = {
  id: "hallo",
  front: "Hallo",
  back: "مرحبا",
  speakText: "Hallo",
  kind: "warmup",
};

describe("RecallStation — جدولة SRS", () => {
  it("تقييم بطاقة srs ينادي onSrsRated بالمعرّف والتقييم", async () => {
    const onSrsRated = vi.fn();
    await act(async () => {
      root.render(<RecallStation cards={[srsCard]} onSrsRated={onSrsRated} />);
    });
    await revealAndRate("good");
    expect(onSrsRated).toHaveBeenCalledTimes(1);
    expect(onSrsRated).toHaveBeenCalledWith("hallo", "good");
  });

  it("تقييم بطاقة الدفء لا ينادي الجدولة", async () => {
    const onSrsRated = vi.fn();
    await act(async () => {
      root.render(<RecallStation cards={[warmCard]} onSrsRated={onSrsRated} />);
    });
    await revealAndRate("easy");
    expect(onSrsRated).not.toHaveBeenCalled();
  });
});
