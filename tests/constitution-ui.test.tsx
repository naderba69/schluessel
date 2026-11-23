// @vitest-environment happy-dom
// tests/constitution-ui.test.tsx — D570 (N-155): مطابقة الواجهة للدستور الإنتاجي — القطع المضافة
// القانون 18: «كيف تتعلم هنا» تُعرض أول استخدام (قوانين الدورة السبعة حرفيًا من §8)
// القانون 27: زر «أشك أن هذا خطأ» في كل تمرين → طابور G1
// §16: مؤشر الاتصال (PWA)
import { describe, it, expect, beforeEach } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { LearnHereCard } from "../src/components/LearnHereCard.js";
import { SuspectButton } from "../src/components/SuspectButton.js";
import { ConnectionIndicator } from "../src/components/ConnectionIndicator.js";
import { SEVEN_LAWS_AR, learnHereSeen, markLearnHereSeen } from "../src/lib/learn-here.js";
import { addSuspect, loadSuspects } from "../src/lib/suspect-queue.js";

function mount(el: ReactElement): { root: Root; host: HTMLElement } {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => root.render(el));
  return { root, host };
}

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "";
});

describe("D570 — القانون 18: «كيف تتعلم هنا» — قوانين الدورة السبعة أول استخدام", () => {
  it("السبع قوانين نص §8 حرفياً (المصدر الواحد — قانون 30)", () => {
    expect(SEVEN_LAWS_AR).toHaveLength(7);
    expect(SEVEN_LAWS_AR[0]).toContain("القالب اليومي ثابت");
    expect(SEVEN_LAWS_AR[4]).toContain("لا قفزة ولا وصم"); // D23
  });

  it("تُعرض أول استخدام — ثم تختفي بعد «فهمت» ولا تُعاد", () => {
    expect(learnHereSeen()).toBe(false);
    const { root, host } = mount(<LearnHereCard />);
    expect(host.querySelectorAll("li")).toHaveLength(7);
    const btn = host.querySelector<HTMLButtonElement>('[data-testid="learn-here-dismiss"]')!;
    act(() => btn.click());
    expect(host.querySelector('[data-testid="learn-here"]')).toBeNull();
    expect(learnHereSeen()).toBe(true);
    act(() => root.render(<LearnHereCard />));
    expect(host.querySelector('[data-testid="learn-here"]')).toBeNull();
    void markLearnHereSeen(); // لا يضر
  });
});

describe("D570 — القانون 27: زر «أشك أن هذا خطأ» → طابور G1", () => {
  it("النقر يسجّل الشك في الطابور ويُظهر الطمأنة", () => {
    const { host } = mount(<SuspectButton source="a1-u1-d1/practice-s2-i1" text="gut" />);
    expect(loadSuspects()).toHaveLength(0);
    const btn = host.querySelector<HTMLButtonElement>('[data-testid="suspect-button"]')!;
    expect(btn.textContent).toContain("أشك");
    act(() => btn.click());
    const q = loadSuspects();
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ source: "a1-u1-d1/practice-s2-i1", text: "gut" });
    expect(host.querySelector('[data-testid="suspect-thanks"]')?.textContent).toContain("يُعاد فحصه");
    // الطمأنة لا تلوم ولا تذمّر (D23)
    expect(host.textContent).not.toMatch(/خطأ منك|أنت مقصّر/);
  });

  it("addSuspect يتراكم ولا يفقد السجل السابق", () => {
    addSuspect("x/q1", "a");
    addSuspect("x/q2", "b");
    expect(loadSuspects().map((s) => s.source)).toEqual(["x/q1", "x/q2"]);
  });
});

describe("D570 — §16: مؤشر الاتصال (PWA)", () => {
  it("يعرض حالة الاتصال بصدق (أخضر متصل · رسالة أوفلاين صريحة)", () => {
    const { host } = mount(<ConnectionIndicator />);
    const ind = host.querySelector('[data-testid="connection-indicator"]')!;
    expect(ind.getAttribute("data-online")).toBe("1");
    expect(ind.textContent).toContain("متصل");
  });
});
