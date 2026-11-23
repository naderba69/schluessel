// @vitest-environment happy-dom
// tests/weekly-cards.test.tsx — D571: بطاقتا الدورة الأسبوعية (§8) — كلمة الأسبوع (الاثنين) والمرآة الصوتية (الخميس)
// الحتمية (D571): نفس اليوم نفس الاختيار — بلا عشوائية. العرض حصري لليوم المخصص (§8 تخصص الأيام).
import { afterEach, describe, expect, it } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { loadWords, FIRST_TAUGHT } from "../src/lesson-packs.js";
import {
  isoWeek,
  isVoiceMirrorDay,
  isWordOfWeekDay,
  pickMirrorLesson,
  pickMirrorLines,
  pickWordOfWeek,
  taughtLessonIds,
  taughtWordIds,
} from "../src/lib/weekly-cards.js";
import { WordOfWeekCard } from "../src/components/WordOfWeekCard.js";
import { VoiceMirrorCard } from "../src/components/VoiceMirrorCard.js";

// مواعيد مثبّتة: 2026-10-19 اثنين · 2026-10-20 ثلاثاء · 2026-10-22 خميس (أسبوع ISO 43)
const MON = new Date(2026, 9, 19, 10, 0, 0);
const TUE = new Date(2026, 9, 20, 10, 0, 0);
const THU = new Date(2026, 9, 22, 10, 0, 0);

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

/** انتظار التحميل الكسول (nabg) — نمط learner-flow: اقتراع بفواصل حقيقية */
async function waitFor(cond: () => boolean, what: string) {
  for (let i = 0; i < 200; i++) {
    if (cond()) return;
    await act(async () => new Promise((r) => setTimeout(r, 5)));
  }
  throw new Error(`لم يكتمل: ${what}`);
}

describe("D571 — الاختيار الحتمي (isoWeek + الانتقاء)", () => {
  it("isoWeek: الاثنين يبدأ الأسبوع — الاثنين ونهايته أحدٌ نفس الرقم", () => {
    expect(MON.getDay()).toBe(1); // حارس الثابت
    expect(THU.getDay()).toBe(4);
    expect(isoWeek(MON).week).toBe(isoWeek(new Date(2026, 9, 25)).week); // الأحد نهاية الأسبوع نفسه
    expect(isoWeek(MON).week).not.toBe(isoWeek(new Date(2026, 9, 26)).week); // الاثنين التالي يبدّل
  });

  it("pickWordOfWeek: حتمية — نفس اليوم الكلمة نفسها، ومن المخزون المُدرَّس وحده (D126)", () => {
    const a = pickWordOfWeek(MON, 0);
    const b = pickWordOfWeek(MON, 0);
    expect(a).toBe(b);
    const pool = taughtWordIds(0);
    expect(a).not.toBeNull();
    expect(pool).toContain(a!);
    // كل الكلمات المطروحة فعلًا: أول درس يدرّسها ≤ موضع المتعلم
    for (const w of taughtWordIds(3)) expect(FIRST_TAUGHT[w]).toBeLessThanOrEqual(3);
  });

  it("pickMirrorLesson + pickMirrorLines: حتمية ونافذة سطرين تلتوي", () => {
    const l1 = pickMirrorLesson(THU, 5);
    expect(l1).toBe(pickMirrorLesson(THU, 5));
    expect(taughtLessonIds(5)).toContain(l1!);
    const lines = [
      { id: "l1", text: "a" },
      { id: "l2", text: "b" },
      { id: "l3", text: "c" },
    ];
    const win = pickMirrorLines(lines, THU);
    expect(win).toHaveLength(2);
    expect(win).toEqual(pickMirrorLines(lines, THU)); // حتمية
    expect(win[1]!.id).toBe(lines[(lines.findIndex((x) => x.id === win[0]!.id) + 1) % 3]!.id); // متتاليان
  });

  it("أيام العرض (§8): كلمة الأسبوع الاثنين فقط · المرآة الخميس فقط", () => {
    expect(isWordOfWeekDay(MON)).toBe(true);
    expect(isWordOfWeekDay(TUE)).toBe(false);
    expect(isVoiceMirrorDay(THU)).toBe(true);
    expect(isVoiceMirrorDay(MON)).toBe(false);
  });
});

describe("D571 — البطاقتان في DOM", () => {
  it("كلمة الأسبوع: تظهر الاثنين بكلمة مُدرَّسة وجنسها وجمعها — وتختفي غير الاثنين", async () => {
    const host = mount(<WordOfWeekCard currentIndex={0} now={MON} />);
    await waitFor(() => !!host.querySelector('[data-testid="word-of-week"]'), "تحميل كلمة الأسبوع");
    const card = host.querySelector('[data-testid="word-of-week"]');
    expect(card).not.toBeNull();
    expect(host.querySelector('[data-testid="wow-de"]')!.textContent!.length).toBeGreaterThan(0);
    expect(host.querySelector('[data-testid="wow-ar"]')!.textContent!.length).toBeGreaterThan(0);
    expect(card!.querySelector('[data-testid="play-audio"]')).not.toBeNull(); // صوت الكلمة (D251: بمقطعها القائم)
    // الكلمة المعروضة هي انتقاء اليوم نفسه (حتمية)
    const shown = host.querySelector('[data-testid="wow-de"]')!.textContent!.trim();
    const [w] = await loadWords([pickWordOfWeek(MON, 0)!]);
    expect(shown).toContain(w!.de);

    const tueHost = mount(<WordOfWeekCard currentIndex={0} now={TUE} />);
    await act(async () => new Promise((r) => setTimeout(r, 20)));
    expect(tueHost.querySelector('[data-testid="word-of-week"]')).toBeNull();
  });

  it("المرآة الصوتية: تظهر الخميس بسطرين وتوجيه النبر وبلا حكم (D16) — وتختفي غير الخميس", async () => {
    const host = mount(<VoiceMirrorCard currentIndex={0} now={THU} />);
    await waitFor(() => !!host.querySelector('[data-testid="voice-mirror"]'), "تحميل المرآة الصوتية");
    const card = host.querySelector('[data-testid="voice-mirror"]');
    expect(card).not.toBeNull();
    expect(host.querySelectorAll('[data-testid="vm-line"]')).toHaveLength(2);
    expect(host.querySelector('[data-testid="vm-no-judge"]')!.textContent).toContain("بلا تصحيح ولا حكم");
    expect(card!.querySelectorAll('[data-testid="play-audio"]')).toHaveLength(2); // صوت الحوار القائم لا جديد (D251)
    // التقليد: 3 مرات بلا نجاح/رسوب — عدّاد تشجيعي وحده (D16/5‑ب)
    const repeat = host.querySelector<HTMLButtonElement>('[data-testid="vm-repeat"]')!;
    await act(async () => {
      repeat.click();
      repeat.click();
      repeat.click();
    });
    expect(host.querySelector('[data-testid="vm-done"]')).not.toBeNull();

    const monHost = mount(<VoiceMirrorCard currentIndex={0} now={MON} />);
    await act(async () => new Promise((r) => setTimeout(r, 20)));
    expect(monHost.querySelector('[data-testid="voice-mirror"]')).toBeNull();
  });
});
