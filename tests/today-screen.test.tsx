// @vitest-environment happy-dom
// tests/today-screen.test.tsx — شاشة اليوم §2.2 (N-147 · D247 + تبويبات N-155 · D269): تحية + يوم + نقاط + زر واحد + عدّادان — والباقي في 5 تبويبات
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "../src/App.js";
import { memoryLearnerStore } from "../src/stores/learner-store.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { recordSession } from "../src/lib/session-log.js";
import type { ErrorEntry, Word } from "../content/schemas/index.js";
import { WritingLab } from "../src/components/SkillsLab.js";
import { SettingsScreen, SystemLab } from "../src/components/SystemLab.js";
import { CoachBlock } from "../src/components/CoachBlock.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLElement;
let root: Root;
const q = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`);

beforeEach(() => {
  container = document.createElement("div");
  window.location.hash = ""; // N-155: عزل وضع المطوّر بين الاختبارات
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
});

async function click(el: Element | null) {
  if (!el) throw new Error("زر غير موجود");
  await act(async () => (el as HTMLElement).click());
}

async function waitFor(cond: () => boolean, what: string) {
  for (let i = 0; i < 100 && !cond(); i++) await act(async () => {});
  if (!cond()) throw new Error(`انتهت المهلة: ${what}`);
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shiftDay = (base: Date, delta: number) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + delta);

async function renderSeeded(opts: { at?: Date; withErrors?: boolean; profilePatch?: Record<string, unknown> } = {}) {
  vi.useFakeTimers();
  vi.setSystemTime(opts.at ?? new Date(2026, 9, 21, 10, 0)); // أربعاء 10:00 — يوم عادي
  const store = memoryLearnerStore();
  const today = new Date();
  const monday = shiftDay(today, -((today.getDay() + 6) % 7));
  let sessions = recordSession([], { date: iso(monday), durationMinutes: 120 });
  sessions = recordSession(sessions, { date: iso(shiftDay(monday, 1)), durationMinutes: 100 });
  const card = (cardId: string, due: string) => ({
    cardId,
    due,
    stability: 1,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 1,
    reps: 1,
    lapses: 0,
    state: "Review" as const,
    masteryLevel: "L1" as const,
  });
  const err = (id: string): ErrorEntry => ({
    id,
    kind: "slip",
    skill: "vocab",
    payload: { wrong: "x", correct: "y", explanation: "ز", source: "a1-u1-d1" },
    remedialExercises: [],
    occurrences: 1,
    resolved: false,
    createdAt: iso(today),
  });
  const base = createInitialState("ضياء");
  await store.save({
    ...base,
    profile: { ...base.profile, ...opts.profilePatch },
    sessions,
    srsCards: [card("w-due-1", iso(shiftDay(today, -1))), card("w-due-2", iso(today)), card("w-future-1", iso(shiftDay(today, 3)))],
    errors: opts.withErrors === false ? [] : [err("e-1"), err("e-2")],
  });
  await act(async () => root.render(<App store={store} />));
}

describe("شاشة اليوم §2.2 (N-147)", () => {
  it("تحية بالاسم + اليوم + نقاط الأسبوع (2/7) + العدّادان", async () => {
    await renderSeeded();
    const h1 = container.querySelector("h1")!;
    const weekday = new Date().toLocaleDateString("ar", { weekday: "long" });
    expect(h1.textContent).toContain("ضياء");
    expect(h1.textContent).toContain(weekday);
    expect(q("week-dots")!.textContent).toContain("●●○○○○○");
    expect(q("week-dots")!.textContent).toContain("(2/7)");
    expect(q("due-count")!.textContent).toContain("2");
    expect(q("golden-count")!.textContent).toContain("2");
    expect(q("brand-header")!.textContent).toContain("مفتاح");
  });

  it("زر واحد كبير لجلسة اليوم + الباقي في تبويبات (لا تكديس — N-155)", async () => {
    await renderSeeded();
    const btn = q("start-session")!;
    expect(btn.textContent).toContain("120 دقيقة");
    expect(btn.closest("details")).toBeNull(); // الزر ظاهر لا مطوي
    expect(q("current-lesson")!.closest("details")).toBeNull(); // الهدف ظاهر
    // اليوم وحده ظاهر: لا خريطة ولا مدرب ولا دفتر ولا مخابر ولا ترميز
    expect(q("progress-map")).toBeNull();
    expect(q("coach-block")).toBeNull();
    expect(q("golden-book")).toBeNull();
    expect(q("open-skills-lab")).toBeNull();
    expect(q("open-system-lab")).toBeNull();
    expect(q("more-labs")).toBeNull();
    expect(q("more-gender")).toBeNull();
    expect(q("path-list")).toBeNull();
    // الشريط السفلي بخمسة أقسام — اليوم مفعّل
    expect(q("bottom-nav")).not.toBeNull();
    for (const t of ["today", "map", "coach", "golden", "settings"]) expect(q(`tab-${t}`)).not.toBeNull();
    expect(q("tab-today")!.getAttribute("data-active")).toBe("yes");
  });

  it("أثناء الحصة: الشريط مخفي (تركيز — N-155)", async () => {
    await renderSeeded();
    expect(q("bottom-nav")).not.toBeNull();
    await click(q("start-session"));
    if (q("jit-overlay")) await click(q("jit-dismiss")); // بطاقة الوحدة صفر أولاً
    expect(q("bottom-nav")).toBeNull();
  });
});

describe("حضور المدرب اليومي (N-148 · D248)", () => {
  it("درّبني: خطأ ذهبي ← كشف ← تم", async () => {
    await renderSeeded();
    await click(q("tab-coach"));
    expect(q("coach-windows")!.textContent).toContain("ظهيرة · عصر · مساء");
    await click(q("train-me"));
    expect(q("coach-drill")!.textContent).toContain("x"); // wrong من البذرة
    await click(q("coach-reveal"));
    expect(q("coach-answer")!.textContent).toContain("y");
    await click(q("coach-done"));
    expect(q("coach-drill")).toBeNull();
    expect(q("train-me")).not.toBeNull();
  });

  it("بلا أخطاء: تدريب حرف اليوم بالصوت", async () => {
    await renderSeeded({ withErrors: false });
    expect(q("golden-count")!.textContent).toContain("0");
    await click(q("tab-coach"));
    await click(q("train-me"));
    expect(q("coach-drill")!.textContent).toContain("حرف اليوم");
    await click(q("coach-done"));
    expect(q("coach-drill")).toBeNull();
  });

  it("إغلاق اليوم يظهر مساءً (21+) ويختفي صباحاً", async () => {
    await renderSeeded({ at: new Date(2026, 9, 21, 21, 30) });
    await click(q("tab-coach"));
    expect(q("day-closing")!.textContent).toContain("ماذا تتذكر");
    expect(q("tomorrow-preview")!.textContent!.length).toBeGreaterThan(10);
  });

  it("صباحاً: لا إغلاق", async () => {
    await renderSeeded({ at: new Date(2026, 9, 21, 10, 0) });
    await click(q("tab-coach"));
    expect(q("day-closing")).toBeNull();
  });

  it("الأحد راحة (N-152): المدرب صامت والزر يعمل بلا لوم", async () => {
    await renderSeeded({ at: new Date(2026, 9, 18, 10, 0) }); // أحد
    expect(new Date().getDay()).toBe(0);
    expect(q("rest-day-note")!.textContent).toContain("راحة");
    expect(q("start-session")).not.toBeNull(); // الزر يبقى لمن أراد
    await click(q("tab-coach"));
    expect(q("coach-rest")!.textContent).toContain("راحة");
    expect(q("train-me")).toBeNull();
  });

  it("يوم عادي: لا رسالة راحة", async () => {
    await renderSeeded();
    expect(q("rest-day-note")).toBeNull();
    await click(q("tab-coach"));
    expect(q("coach-rest")).toBeNull();
    expect(q("train-me")).not.toBeNull();
  });
});

describe("عبارة اليوم تتدوير يومياً (N-148 · D248)", () => {
  const words = [
    { de: "Hallo", ar: ["مرحباً"] },
    { de: "Danke", ar: ["شكراً"] },
  ] as Word[];

  async function renderWritingAt(at: Date): Promise<string> {
    vi.useFakeTimers();
    vi.setSystemTime(at);
    await act(async () => root.render(<WritingLab words={words} />));
    return container.querySelector('[data-testid="sentence-of-day"]')!.textContent!;
  }

  it("أول يومين يعطيان عبارتين مختلفتين", async () => {
    const jan1 = await renderWritingAt(new Date(2026, 0, 1, 10, 0));
    expect(jan1).toContain("Hallo");
    await act(async () => root.unmount());
    container.innerHTML = "";
    const { createRoot: fresh } = await import("react-dom/client");
    root = fresh(container);
    const jan2 = await renderWritingAt(new Date(2026, 0, 2, 10, 0));
    expect(jan2).toContain("Danke");
  });
});

describe("الخريطة الهادئة §2.8 (N-149 · D249)", () => {
  it("مستويات + وحدة + أسبوع + بوابة من البيانات (متعلم جديد)", async () => {
    await renderSeeded();
    await click(q("tab-map"));
    const levels = q("map-levels")!.textContent!;
    expect(levels).toContain("A1");
    expect(levels).toContain("░░░░░░░░░░"); // A1: صفر من 90
    expect(q("map-unpublished-B1")!.textContent).toContain("قيد الإنتاج");
    expect(q("map-unpublished-B2")!.textContent).toContain("قيد الإنتاج");
    expect(q("map-unit")!.textContent).toContain("الوحدة 1");
    expect(q("map-unit")!.textContent).toContain("◉○○○○○"); // d1 متاح والباقي مقفل
    expect(q("map-week")!.textContent).toContain("الأسبوع 1 من 62");
    expect(q("map-gate")!.textContent).toContain("الأسبوع 6");
  });
});

describe("الدفتر الذهبي §2.7 (N-150 · D250)", () => {
  it("يعرض الأخطاء: الخاطئ ← الصحيح + التعليل + النوع", async () => {
    await renderSeeded();
    await click(q("tab-golden"));
    expect(q("golden-book")!.textContent).toContain("دفتر أخطائك الذهبية (2)");
    const entries = container.querySelectorAll('[data-testid="golden-entry"]');
    expect(entries.length).toBe(2);
    expect(q("golden-book")!.textContent).toContain("x");
    expect(q("golden-book")!.textContent).toContain("y");
    expect(q("golden-book")!.textContent).toContain("ز");
    expect(q("golden-book")!.textContent).toContain("هفوة");
  });

  it("بلا أخطاء: رسالة فارغة صريحة لا قائمة وهمية", async () => {
    await renderSeeded({ withErrors: false });
    await click(q("tab-golden"));
    expect(q("golden-empty")!.textContent).toContain("دفترك فارغ");
    expect(container.querySelector('[data-testid="golden-entry"]')).toBeNull();
  });
});

describe("طقس البداية على الشاشة (N-151 · D251)", () => {
  async function typeInto(el: Element | null, value: string) {
    if (!el) throw new Error("حقل غير موجود");
    const input = el as HTMLInputElement;
    await act(async () => {
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), "value")!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  async function mount(node: React.ReactNode) {
    const { createRoot: makeRoot } = await import("react-dom/client");
    const host = document.createElement("div");
    container.appendChild(host);
    const r = makeRoot(host);
    await act(async () => r.render(node));
    return r;
  }
  async function renderSettings(onSave: (patch: Record<string, unknown>) => void) {
    return mount(
      <SettingsScreen
        profile={{ name: "ضياء", journeyName: "", coachWindows: ["midday", "afternoon", "evening"] }}
        onSaveProfile={onSave}
      />,
    );
  }

  it("اسم الرحلة أعلى الشاشة حين سُمّيت", async () => {
    await renderSeeded({ profilePatch: { journeyName: "ألمانيتي" } });
    expect(q("journey-name")!.textContent).toContain("ألمانيتي");
    expect(q("brand-header")!.textContent).toContain("رحلة");
  });

  it("بلا اسم رحلة: لا سطر وهمي", async () => {
    await renderSeeded();
    expect(q("journey-name")).toBeNull();
  });

  it("المدرب يعرض النوافذ المختارة من الحالة", async () => {
    await renderSeeded({ profilePatch: { coachWindows: ["midday", "evening"] } });
    await click(q("tab-coach"));
    expect(q("coach-windows")!.textContent).toContain("ظهيرة · مساء");
    expect(q("coach-windows")!.textContent).not.toContain("عصر");
  });

  it("الإعدادات: تعديل الاسم يُحفظ", async () => {
    const onSave = vi.fn();
    const r = await renderSettings(onSave);
    await typeInto(q("settings-name-input"), "نور");
    await click(q("settings-name-save"));
    expect(onSave).toHaveBeenCalledWith({ name: "نور" });
    await act(async () => r.unmount());
  });

  it("الإعدادات: تسمية الرحلة + تقليص النوافذ يُحفظان", async () => {
    const onSave = vi.fn();
    const r = await renderSettings(onSave);
    await typeInto(q("settings-journey-input"), "برلين");
    await click(q("settings-journey-save"));
    expect(onSave).toHaveBeenCalledWith({ journeyName: "برلين" });
    await click(q("settings-window-afternoon"));
    await click(q("settings-windows-save"));
    expect(onSave).toHaveBeenCalledWith({ coachWindows: ["midday", "evening"] });
    await act(async () => r.unmount());
  });

  it("الإعدادات: نافذة واحدة ⇒ الحفظ معطّل", async () => {
    const r = await renderSettings(() => {});
    await click(q("settings-window-afternoon"));
    await click(q("settings-window-evening"));
    expect((q("settings-windows-save") as HTMLButtonElement).disabled).toBe(true);
    await act(async () => r.unmount());
  });

  it("الإعدادات: بلا ملف ⇒ لا محررات (توافق)", async () => {
    const r = await mount(<SettingsScreen />);
    expect(q("profile-editors")).toBeNull();
    expect(q("settings-controls")).not.toBeNull();
    await act(async () => r.unmount());
  });

  it("لوحة النظام: تبويب الإعدادات يمرّر الملف والمحررات", async () => {
    const r = await mount(
      <SystemLab
        words={[]}
        profile={{ name: "ضياء", journeyName: "", coachWindows: ["midday", "afternoon", "evening"] }}
        onSaveProfile={() => {}}
      />,
    );
    await click(q("stab-settings"));
    expect(q("settings-name-input")).not.toBeNull();
    await act(async () => r.unmount());
  });
});

describe("عبارة اليوم على القائمة (N-148 · D252)", () => {
  const WORDS = [
    { de: "Hallo", ar: ["مرحباً"] },
    { de: "Danke", ar: ["شكراً"] },
  ] as Word[];
  async function mountCoach(words: Word[], at: Date) {
    vi.useFakeTimers();
    vi.setSystemTime(at);
    const { createRoot: makeRoot } = await import("react-dom/client");
    const host = document.createElement("div");
    container.appendChild(host);
    const r = makeRoot(host);
    await act(async () => r.render(<CoachBlock errors={[]} dueCount={0} hasNewContent={false} words={words} />));
    return r;
  }

  it("مع الكلمات: العبارة ظاهرة مع زر استماع", async () => {
    const r = await mountCoach(WORDS, new Date(2026, 0, 1, 7, 0));
    expect(q("coach-phrase")!.textContent).toContain("Hallo");
    const play = q("coach-phrase")!.querySelector('[data-testid="play-audio"]')!;
    expect(play.getAttribute("aria-label")).toContain("عبارة اليوم");
    await act(async () => r.unmount());
  });

  it("تدور يومياً على الكلمات", async () => {
    const r1 = await mountCoach(WORDS, new Date(2026, 0, 1, 7, 0));
    expect(q("coach-phrase")!.textContent).toContain("Hallo");
    await act(async () => r1.unmount());
    const r2 = await mountCoach(WORDS, new Date(2026, 0, 2, 7, 0));
    expect(q("coach-phrase")!.textContent).toContain("Danke");
    await act(async () => r2.unmount());
  });

  it("بلا كلمات (الحزمة لم تصل): لا عبارة — والقائمة لا تنتظر", async () => {
    const r = await mountCoach([], new Date(2026, 0, 1, 7, 0));
    expect(q("coach-phrase")).toBeNull();
    expect(q("coach-block")).not.toBeNull();
    await act(async () => r.unmount());
  });
});

describe("تبويب الإعدادات (N-155 · D269)", () => {
  it("المحررات + النسخ + المسح + عن المشروع (§2.9)", async () => {
    await renderSeeded();
    await click(q("tab-settings"));
    expect(q("settings-view")).not.toBeNull();
    expect(q("settings-name-input")).not.toBeNull();
    expect(q("data-screen")).not.toBeNull();
    expect(q("wipe-screen")).not.toBeNull();
    expect(q("about-screen")!.textContent).toContain("مفتاح");
  });

  it("المسح: تأكيد بخطوتين ثم عودة لأول تشغيل", async () => {
    await renderSeeded();
    await click(q("tab-settings"));
    expect(q("wipe-confirm")).toBeNull();
    await click(q("wipe-start"));
    expect(q("wipe-confirm")).not.toBeNull();
    await click(q("wipe-confirm"));
    await waitFor(() => !q("bottom-nav"), "اختفاء الشريط بعد المسح");
    expect(q("current-lesson")).toBeNull();
  });
});

describe("المخابر مخفية عن المتعلم (N-155 · D269)", () => {
  it("بلا #labs: لا أثر للمخابر في أي تبويب", async () => {
    window.location.hash = "";
    await renderSeeded();
    for (const t of ["today", "map", "coach", "golden", "settings"]) {
      await click(q(`tab-${t}`));
      expect(q("labs-view")).toBeNull();
      expect(q("skills-lab")).toBeNull();
      expect(q("system-lab")).toBeNull();
    }
  });

  it("#labs: المختبرات ظاهرة للمطوّر وحده", async () => {
    window.location.hash = "#labs";
    await renderSeeded();
    expect(q("labs-view")).not.toBeNull();
    expect(q("labs-note")!.textContent).toContain("المطوّر");
    expect(q("bottom-nav")).toBeNull();
    await waitFor(() => !!q("skills-lab") && !!q("system-lab"), "مختبرا المهارات والنظام");
    await act(async () => {
      window.location.hash = "";
    });
  });
});
