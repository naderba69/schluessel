// @vitest-environment happy-dom
// tests/golden-flow.test.tsx — الدفتر الذهبي §2.7 (N-150 · D250): الالتقاط من الاختبار والتدريب + حلّ الجولة
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { RecallStation, PracticeStation } from "../src/components/LessonContent.js";
import { QuizStation } from "../src/components/QuizStation.js";
import { startQuizAttempt, currentQuizItem } from "../src/lib/quiz-session.js";
import { loadFirstSession } from "../src/lesson-packs.js";
import type { Lesson } from "../content/schemas/index.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const __FIRST = await loadFirstSession();
const firstLesson = __FIRST.lesson;

let container: HTMLElement;
let root: Root;
const q = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
const qa = (sel: string) => [...container.querySelectorAll<HTMLElement>(sel)];

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

const ERR_CARD = {
  id: "err-round-e-1", front: "أصلح: «x»", back: "y — التعليل", speakText: "y",
  kind: "error" as const, errorId: "e-1",
};
const WARM_CARD = { id: "w1", front: "Hallo", back: "مرحباً", speakText: "Hallo", kind: "warmup" as const };

describe("حلّ الجولة: جيد/سهل يحلّ الخطأ — نسيت/صعب يُبقيه", () => {
  it("تقييم بطاقة الخطأ «جيد» ← حلّها", async () => {
    const onErrorResolved = vi.fn();
    await act(async () => root.render(<RecallStation cards={[ERR_CARD, WARM_CARD]} onErrorResolved={onErrorResolved} />));
    await click(q("reveal-btn"));
    await click(container.querySelector('[data-rating="good"]'));
    expect(onErrorResolved).toHaveBeenCalledTimes(1);
    expect(onErrorResolved).toHaveBeenCalledWith("e-1", "good");
    // بطاقة الدفء بعدها: تقييمها لا يحلّ شيئاً
    await click(q("reveal-btn"));
    await click(container.querySelector('[data-rating="good"]'));
    expect(onErrorResolved).toHaveBeenCalledTimes(1);
  });

  it("تقييمها «نسيت» ← تبقى في الدفتر", async () => {
    const onErrorResolved = vi.fn();
    await act(async () => root.render(<RecallStation cards={[ERR_CARD]} onErrorResolved={onErrorResolved} />));
    await click(q("reveal-btn"));
    await click(container.querySelector('[data-rating="again"]'));
    expect(onErrorResolved).not.toHaveBeenCalled();
  });
});

describe("التقاط الاختبار: الخاطئ يُسجَّل والصحيح يمرّ بصمت", () => {
  const item0 = currentQuizItem(startQuizAttempt(firstLesson, 0))!;

  it("إجابة خاطئة ← onGrade بالبند والمُعطى والحكم", async () => {
    const onGrade = vi.fn();
    await act(async () =>
      root.render(<QuizStation lesson={firstLesson} priorAttempts={0} onAttemptComplete={() => {}} onGrade={onGrade} />),
    );
    await click(q("quiz-start"));
    if (item0.choices) {
      const wrong = item0.choices.find((c) => c !== item0.a)!;
      await click(qa('[data-testid^="quiz-choice-"]').find((b) => b.textContent === wrong) ?? null);
    } else {
      await typeInto(q("quiz-input"), "إجابة خاطئة حتماً");
      await click(q("quiz-check"));
      if (q("quiz-judge-no")) await click(q("quiz-judge-no"));
    }
    expect(onGrade).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls[0]![0]).toMatchObject({ given: expect.any(String), item: { q: item0.q } });
    expect(["wrong", "self-wrong", "close"]).toContain(onGrade.mock.calls[0]![0].verdict);
  });

  it("إجابة صحيحة ← صمت", async () => {
    const onGrade = vi.fn();
    await act(async () =>
      root.render(<QuizStation lesson={firstLesson} priorAttempts={0} onAttemptComplete={() => {}} onGrade={onGrade} />),
    );
    await click(q("quiz-start"));
    if (item0.choices) {
      await click(qa('[data-testid^="quiz-choice-"]').find((b) => b.textContent === item0.a) ?? null);
    } else {
      await typeInto(q("quiz-input"), item0.a);
      await click(q("quiz-check"));
      if (q("quiz-judge-yes")) await click(q("quiz-judge-yes"));
    }
    expect(onGrade).not.toHaveBeenCalled();
  });
});

describe("التقاط التدريب: المهارة من النوع والقريب هفوة", () => {
  const practice = (items: unknown[], type: Lesson["uebung"]["stations"][number]["type"]) => ({
    stations: [{ type, items: items as Record<string, unknown>[], interleavedWith: [], explanationRequired: true }],
    communicativeTask: firstLesson.uebung.communicativeTask,
    dialogues: [],
  });

  it("فراغ خاطئ ← schreiben + المصدر + التعليل", async () => {
    const onGrade = vi.fn();
    await act(async () =>
      root.render(
        <PracticeStation
          data={practice([{ q: "Ich ___ Yusuf.", a: "heiße", why: "الحرف ß يكتب هكذا لا s" }], "gap-fill")}
          lessonId="a1-u1-d1"
          onGrade={onGrade}
        />,
      ),
    );
    await typeInto(q("practice-input"), "haus");
    await click(q("practice-check"));
    expect(onGrade).toHaveBeenCalledTimes(1);
    expect(onGrade).toHaveBeenCalledWith({
      skill: "schreiben", wrong: "haus", correct: "heiße", explanation: "الحرف ß يكتب هكذا لا s",
      source: "a1-u1-d1/practice-s0-i0", closeSlip: false,
    });
  });

  it("اختيار خاطئ ← lesen", async () => {
    const onGrade = vi.fn();
    await act(async () =>
      root.render(
        <PracticeStation
          data={practice(
            [{ audioId: "word-guten-morgen", speakText: "Guten Morgen.", q: "ماذا سمعت؟", choices: ["Guten Morgen", "Guten Abend"], a: "Guten Morgen", why: "التحية الصباحية" }],
            "listening",
          )}
          lessonId="a1-u1-d1"
          onGrade={onGrade}
        />,
      ),
    );
    await click(qa('[data-testid^="choice-"]').find((b) => b.textContent === "Guten Abend") ?? null);
    expect(onGrade).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls[0]![0]).toMatchObject({ skill: "lesen", wrong: "Guten Abend", correct: "Guten Morgen" });
  });

  it("فرق الحرف الكبير وحده ← closeSlip", async () => {
    const onGrade = vi.fn();
    await act(async () =>
      root.render(
        <PracticeStation
          data={practice([{ q: "das ___ ist groß.", a: "Haus", why: "الأسماء كبيرة" }], "gap-fill")}
          lessonId="a1-u1-d1"
          onGrade={onGrade}
        />,
      ),
    );
    await typeInto(q("practice-input"), "haus");
    await click(q("practice-check"));
    expect(onGrade).toHaveBeenCalledTimes(1);
    expect(onGrade.mock.calls[0]![0]).toMatchObject({ closeSlip: true });
  });

  it("بلا lessonId: لا التقاط (توافق)", async () => {
    const onGrade = vi.fn();
    await act(async () =>
      root.render(<PracticeStation data={practice([{ q: "Ich ___ Yusuf.", a: "heiße", why: "الحرف ß يكتب هكذا لا s" }], "gap-fill")} onGrade={onGrade} />),
    );
    await typeInto(q("practice-input"), "haus");
    await click(q("practice-check"));
    expect(onGrade).not.toHaveBeenCalled();
  });
});
