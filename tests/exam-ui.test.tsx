// @vitest-environment happy-dom
// tests/exam-ui.test.tsx — D284: امتحان المستوى (بطاقة الأهلية + قسم القراءة — داخل التطبيق)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App, localDay } from "../src/App.js";
import { memoryLearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { ALL_MODELLTESTS, PATH } from "../src/lesson-packs.js";
import { levelUnits, modellHoerenQuiz, modellLesenQuiz, modellSchreibenQuiz, type ExamSkill } from "../src/lib/exam-engine.js";
import type { GateResult } from "../content/schemas/index.js";
import { createAudioPlayer, setAudioPlayer, type AudioBackend } from "../src/lib/audio-player.js";

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
  setAudioPlayer(null);
  vi.useRealTimers();
  await act(async () => root.unmount());
  container.remove();
});

async function click(el: Element | null, what = "زر") {
  if (!el) throw new Error(`${what} غير موجود`);
  await act(async () => (el as HTMLElement).click());
}

async function waitFor(cond: () => boolean, what: string) {
  for (let i = 0; i < 100; i++) {
    if (cond()) return;
    await act(async () => {});
  }
  throw new Error(`لم يتحقق: ${what}`);
}

const battle = (unitKey: string): GateResult => ({
  gateId: unitKey, kind: "unit-battle", score: 0.8, passed: true, attempts: 1, weakSections: [], date: "2026-10-20",
});
const section = (examId: string, skill: string, score: number): GateResult => ({
  gateId: `${examId}/${skill}`, kind: "level-exam", score, passed: score >= 0.6, attempts: 1, weakSections: [], date: "2026-10-20",
});
const UNITS = levelUnits(PATH, "A1");
const READY = UNITS.map(battle);
const MODELL = ALL_MODELLTESTS.find((m) => m.id === "a1-modelltest-1")!;

async function renderSeeded(gates: GateResult[] = []) {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
  vi.setSystemTime(new Date(2026, 9, 19, 10, 0)); // اثنين — الامتحان بلا يوم محدد
  const store = memoryLearnerStore();
  const base = createInitialState("ضياء");
  await store.save({ ...base, progress: { ...base.progress, gateResults: gates } });
  await act(async () => root.render(<App store={store} />));
  await waitFor(() => !q("boot-loading") && !q("first-loading"), "انتهاء التحميل");
  await click(q("tab-map"), "الخريطة");
  return store;
}

async function typeInto(input: Element | null, value: string) {
  if (!input) throw new Error("حقل غير موجود");
  const el = input as HTMLInputElement;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
  await act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function clickChoice(answer: string) {
  const btns = [...container.querySelectorAll<HTMLButtonElement>("[data-testid^=\"quiz-choice-\"]")];
  const hit = btns.find((b) => b.textContent === answer);
  if (!hit) throw new Error(`الخيار «${answer}» غير موجود`);
  return click(hit, "الخيار");
}

describe("D284: بطاقة الامتحان", () => {
  it("غير المؤهل ← تقدّم بلا زر", async () => {
    expect(UNITS.length).toBeGreaterThan(0);
    await renderSeeded([]);
    expect(q("exam-card")).not.toBeNull();
    expect(q("exam-progress")!.textContent).toMatch(/0\/\d+/);
    expect(q("start-exam-lesen")).toBeNull();
  });

  it("المؤهل ← نقاط الأقسام + زر القراءة + خارطة الطريق", async () => {
    await renderSeeded(READY);
    expect(q("exam-ready")!.textContent).toContain("مفتوح");
    expect(q("exam-points")!.textContent).toContain("القراءة —");
    expect(q("start-exam-lesen")!.textContent).toContain("15 بنداً");
    expect(q("exam-roadmap")!.textContent).toContain("حيّة");
    expect(q("exam-total")!.textContent).toContain("يكتمل بالأقسام الأربعة");
  });

  it("الأقسام الأربعة ← الحكم الرسمي", async () => {
    const gates = [...READY, ...(["hoeren", "lesen", "schreiben", "sprechen"] as ExamSkill[]).map((sk) => section(MODELL.id, sk, 0.8))];
    await renderSeeded(gates);
    expect(q("exam-verdict")!.textContent).toContain("80/100");
    expect(q("exam-verdict")!.textContent).toContain("ناجح");
  });
});

describe("D284: التدفق الكامل للقراءة", () => {
  it("بدء ← 15 بنداً ← تسجيل القسم + النقاط + الدقائق", async () => {
    const store = await renderSeeded(READY);
    await click(q("start-exam-lesen"), "ابدأ القراءة");
    expect(q("exam-lesen-title")!.textContent).toContain("a1-modelltest-1");
    const items = modellLesenQuiz(
      MODELL.id,
      MODELL.passingScore,
      MODELL.sections.find((s) => s.skill === "lesen")!.parts,
    ).quiz.variants[0]!.items;
    expect(items).toHaveLength(15);
    await click(q("quiz-start"), "ابدأ الاختبار");
    for (const it of items) {
      await clickChoice(it.a);
      await click(q("quiz-next"), "التالي/النتيجة");
    }
    await waitFor(() => !!q("finished-note"), "ملاحظة النهاية");
    expect(q("finished-note")!.textContent).toContain("قسم القراءة تم (25/25 نقطة)");
    const saved = await store.load();
    const g = saved!.progress.gateResults.find((x) => x.gateId === "a1-modelltest-1/lesen")!;
    expect(g.kind).toBe("level-exam");
    expect(saved!.progress.levelExams["A1"]).toHaveLength(1);
    const entry = saved!.sessions.find((s) => s.date === localDay())!;
    expect(entry.durationMinutes).toBeGreaterThanOrEqual(1);
  });
});

describe("D285: قسم الاستماع", () => {
  function fakePlayer(opts: { failClip?: boolean; speech?: boolean } = {}) {
    const played: string[] = [];
    const backend: AudioBackend = {
      async playUrl(url) {
        if (opts.failClip) throw new Error("autoplay blocked");
        played.push(url);
      },
      async speak() {},
      canSpeak: () => opts.speech !== false,
    };
    setAudioPlayer(createAudioPlayer(backend, (id) => `clip://${id}`));
    return played;
  }

  async function startHoeren(store_gates: GateResult[] = READY) {
    const store = await renderSeeded(store_gates);
    await click(q("start-exam-hoeren"), "ابدأ الاستماع");
    expect(q("exam-hoeren-title")!.textContent).toContain("a1-modelltest-1");
    await click(q("quiz-start"), "ابدأ الاختبار");
    return store;
  }

  it("البطاقة تعرض زر الاستماع وخارطة الأقسام الباقية", async () => {
    await renderSeeded(READY);
    expect(q("start-exam-hoeren")!.textContent).toContain("🔊");
    expect(q("exam-roadmap")!.textContent).toContain("حيّة");
  });

  it("التشغيل يستهلك من السماح — والفاشل لا يُحسَب", async () => {
    fakePlayer();
    await startHoeren();
    expect(q("quiz-play")!.textContent).toContain("متبقٍ 2"); // القسم 1: مرتان
    await click(q("quiz-play"), "استمع");
    await waitFor(() => q("quiz-play")!.textContent!.includes("متبقٍ 1"), "نقص العداد");
    await click(q("quiz-play"), "استمع ثانية");
    await waitFor(
      () => q("quiz-play")!.textContent!.includes("متبقٍ 0") && (q("quiz-play") as HTMLButtonElement).disabled,
      "نفاد السماح وتعطّل الزر",
    );
  });

  it("الفشل الصوتي لا يستهلك السماح", async () => {
    fakePlayer({ failClip: true, speech: false });
    await startHoeren();
    await click(q("quiz-play"), "استمع");
    await waitFor(() => q("quiz-play")!.textContent!.includes("استمع (متبقٍ"), "انتهاء المحاولة الفاشلة");
    expect(q("quiz-play")!.textContent).toContain("متبقٍ 2");
    expect((q("quiz-play") as HTMLButtonElement).disabled).toBe(false);
  });

  it("التدفق الكامل — المسارات تُشغَّل والقسم يُسجَّل ودقائقه استماع", async () => {
    const played = fakePlayer();
    const store = await startHoeren();
    const hoerenParts = MODELL.sections.find((s) => s.skill === "hoeren")!.parts;
    const items = modellHoerenQuiz(MODELL.id, MODELL.passingScore, hoerenParts).quiz.quiz.variants[0]!.items;
    expect(items).toHaveLength(15);
    await click(q("quiz-play"), "استمع");
    await waitFor(() => played.length > 0, "تشغيل مسارات البند الأول");
    expect(played[0]).toContain("mt1-h1-d1-l1");
    for (const it of items) {
      await clickChoice(it.a);
      await click(q("quiz-next"), "التالي/النتيجة");
    }
    await waitFor(() => !!q("finished-note"), "ملاحظة النهاية");
    expect(q("finished-note")!.textContent).toContain("قسم الاستماع تم (25/25 نقطة)");
    const saved = await store.load();
    const g = saved!.progress.gateResults.find((x) => x.gateId === "a1-modelltest-1/hoeren")!;
    expect(g.kind).toBe("level-exam");
    const entry = saved!.sessions.find((s) => s.date === localDay())!;
    expect(entry.durationMinutes).toBeGreaterThanOrEqual(1);
    expect(entry.listeningMinutes).toBeGreaterThanOrEqual(1);
  });

  it("الراسب في النسخة الوحيدة يرى نصها الصادق", async () => {
    // مباشر على المحطة (التطبيق ينتقل لليوم عند الاكتمال فلا يبقي طور النتيجة)
    const { QuizStation } = await import("../src/components/QuizStation.js");
    const one = {
      id: "t1",
      quiz: { variants: [{ items: [{ q: "q1", a: "a", choices: ["a", "b"] }], passingScore: 0.75 }] },
      slider: { questionDe: "x", questionAr: "توقع؟", min: 0, max: 100 },
    };
    await act(async () => root.render(<QuizStation lesson={one} priorAttempts={0} onAttemptComplete={() => {}} />));
    await click(q("quiz-start"), "ابدأ");
    await clickChoice("b");
    await click(q("quiz-next"), "النتيجة");
    await waitFor(() => !!q("quiz-no-retry"), "نص اللاإعادة");
    expect(q("quiz-no-retry")!.textContent).toContain("النسخة الوحيدة");
  });
});

describe("D286: قسم الكتابة", () => {
  it("البطاقة تعرض زر الكتابة والقسم الأخير المتبقي", async () => {
    await renderSeeded(READY);
    expect(q("start-exam-schreiben")!.textContent).toContain("8 بنود");
    expect(q("exam-roadmap")!.textContent).toContain("حيّة");
  });

  it("التدفق الكامل — استمارة آلية + رسالة بحكم ذاتي + دفتر ذهبي", async () => {
    const store = await renderSeeded(READY);
    await click(q("start-exam-schreiben"), "ابدأ الكتابة");
    expect(q("exam-schreiben-title")!.textContent).toContain("a1-modelltest-1");
    const schreibenParts = MODELL.sections.find((s) => s.skill === "schreiben")!.parts;
    const items = modellSchreibenQuiz(MODELL.id, MODELL.passingScore, schreibenParts).quiz.variants[0]!.items;
    expect(items).toHaveLength(8);
    await click(q("quiz-start"), "ابدأ الاختبار");
    // الاستمارة (5): إجابات مطابقة ← صحيحة آلياً
    for (const it of items.slice(0, 5)) {
      await typeInto(q("quiz-input"), it.a);
      await click(q("quiz-check"), "تحقّق");
      await click(q("quiz-next"), "التالي");
    }
    // الرسالة (3): الأولى مطابقة للنموذج ← صحيحة · والأخريان حكم ذاتي صادق ← خاطئة
    await typeInto(q("quiz-input"), items[5]!.a);
    await click(q("quiz-check"), "تحقّق");
    await click(q("quiz-next"), "التالي");
    for (const it of items.slice(6)) {
      await typeInto(q("quiz-input"), "نص ناقص لا يطابق النموذج");
      await click(q("quiz-check"), "تحقّق");
      expect(q("quiz-judge-no")).not.toBeNull(); // النموذج عُرض والحكم للمتعلم
      await click(q("quiz-judge-no"), "أخطأت");
      await click(q("quiz-next"), "التالي/النتيجة");
    }
    await waitFor(() => !!q("finished-note"), "ملاحظة النهاية");
    expect(q("finished-note")!.textContent).toContain("قسم الكتابة تم (18/25 نقطة)"); // 6/8 = 0.75 ← 18
    const saved = await store.load();
    const g = saved!.progress.gateResults.find((x) => x.gateId === "a1-modelltest-1/schreiben")!;
    expect(g.kind).toBe("level-exam");
    expect(g.passed).toBe(true);
    const gold = saved!.errors.filter((e) => e.payload.source === "a1-modelltest-1/schreiben");
    expect(gold).toHaveLength(2);
    expect(gold.every((e) => e.skill === "schreiben")).toBe(true);
  });
});

describe("D287: قسم التحدث", () => {
  it("البطاقة تعرض زر التحدث واكتمال الأقسام", async () => {
    await renderSeeded(READY);
    expect(q("start-exam-sprechen")!.textContent).toContain("21 بنداً");
    expect(q("exam-roadmap")!.textContent).toContain("الأقسام الأربعة حيّة");
  });

  it("التدفق الكامل — تحدُّث معلَن + نموذج + تقييم صادق + ذهبي", async () => {
    const store = await renderSeeded(READY);
    await click(q("start-exam-sprechen"), "ابدأ التحدث");
    expect(q("exam-sprechen-title")!.textContent).toContain("a1-modelltest-1");
    expect(q("sprechen-counter")!.textContent).toContain("بند 1 من 21");
    // 14 كاملة + 4 نصف + 3 تعثّر = 16/21 ← 19 نقطة
    const plan = [...Array<string>(14).fill("sprechen-full"), ...Array<string>(4).fill("sprechen-half"), ...Array<string>(3).fill("sprechen-miss")];
    for (const btn of plan) {
      await click(q("sprechen-said"), "تحدثت");
      expect(q("sprechen-model")).not.toBeNull();
      await click(q(btn), btn);
    }
    await waitFor(() => !!q("sprechen-summary"), "ملخص التقييم");
    expect(q("sprechen-summary")!.textContent).toContain("16/21");
    await click(q("sprechen-confirm"), "اعتمد");
    await waitFor(() => !!q("finished-note"), "ملاحظة النهاية");
    expect(q("finished-note")!.textContent).toContain("قسم التحدث تم (19/25 نقطة)");
    const saved = await store.load();
    const g = saved!.progress.gateResults.find((x) => x.gateId === "a1-modelltest-1/sprechen")!;
    expect(g.kind).toBe("level-exam");
    expect(g.passed).toBe(true);
    const gold = saved!.errors.filter((e) => e.payload.source === "a1-modelltest-1/sprechen");
    expect(gold).toHaveLength(7);
    const entry = saved!.sessions.find((s) => s.date === localDay())!;
    expect(entry.durationMinutes).toBeGreaterThanOrEqual(1);
  });
});
