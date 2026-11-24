// @vitest-environment happy-dom
// tests/tandem-card.test.tsx — D578: التبادل اللغوي البشري (§6 + قانون 12 + L340)
// كل 3 أسابيع · من بداية B1 · نص الدستور حرفياً · بلا روابط إطلاقاً (المدينة المسورة).
import { afterEach, describe, expect, it } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { TANDEM_COPY, b1StartIndex, tandemDue, tandemDueNow } from "../src/lib/tandem.js";
import { LESSON_ORDER } from "../src/lesson-packs.js";
import { TandemCard } from "../src/components/TandemCard.js";

const b1 = b1StartIndex(LESSON_ORDER);
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

describe("D578 — نموذج التوصية (L340)", () => {
  it("كل 3 أسابيع · ومن بداية B1 وحدها", () => {
    expect(b1).toBeGreaterThan(0); // B1 موجودة فعلًا
    expect(tandemDue(3, b1, b1)).toBe(true);
    expect(tandemDue(2, b1, b1)).toBe(false); // ليس كل أسبوع
    expect(tandemDue(3, b1 - 1, b1)).toBe(false); // قبل B1 لا تظهر
    expect(tandemDue(6, b1 + 50, b1)).toBe(true);
  });

  it("حتمية الإصدار — نفس اليوم نفس القرار", () => {
    const d = new Date(2026, 9, 22, 10, 0, 0);
    expect(tandemDueNow(d, b1, LESSON_ORDER)).toBe(tandemDueNow(d, b1, LESSON_ORDER));
  });
});

describe("D578 — البطاقة في DOM", () => {
  it("نص الدستور حرفياً · بلا روابط إطلاقاً (قانون 12) · تذكير اختياري", () => {
    const due = new Date(2026, 0, 1, 10, 0, 0); // 2026-01-01 = أسبوع ISO 1 → 1%3≠0… اختر أسبوعاً مناسبًا
    // أسبوع مضاعف 3: 2026-01-15 (أسبوع ISO 3)
    const dueDate = new Date(2026, 0, 15, 10, 0, 0);
    const host = mount(<TandemCard currentIndex={b1} now={dueDate} />);
    const card = host.querySelector('[data-testid="tandem-card"]');
    expect(card).not.toBeNull();
    const copy = host.querySelector('[data-testid="tandem-copy"]')!;
    expect(copy.textContent).toBe(TANDEM_COPY); // حرفياً
    expect(copy.textContent).toContain("Tandem");
    expect(copy.textContent).toContain("HelloTalk");
    expect(copy.textContent).toContain("ابحث عن ألماني يتعلم العربية");
    expect(copy.textContent).toContain("لا تشارك بياناتك الشخصية");
    expect(copy.textContent).toContain("تذكير اختياري");
    expect(card!.querySelectorAll("a")).toHaveLength(0); // قانون 12: لا روابط حية
    void due;

    // وفي أسبوع لا يوافق الدورية: لا بطاقة
    const off = mount(<TandemCard currentIndex={b1} now={due} />);
    expect(off.querySelector('[data-testid="tandem-card"]')).toBeNull();
    // وقبل B1: لا بطاقة
    const early = mount(<TandemCard currentIndex={0} now={dueDate} />);
    expect(early.querySelector('[data-testid="tandem-card"]')).toBeNull();
  });
});
