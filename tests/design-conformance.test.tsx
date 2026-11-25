// @vitest-environment happy-dom
// tests/design-conformance.test.tsx — D581: مطابقة التصميم للدستور الإنتاجي (N-155)
// قانون 29 (Bidi: كل عنصر ألماني dir="ltr") · §15-هـ (الترميز المزدوج: لون + شكل معاً).
import { afterEach, describe, expect, it } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { BorrowedProvider, StruckText } from "../src/components/StruckText.js";
import { LearnCardView } from "../src/components/LessonSession.js";
import { GenderBadge, genderBadgeProps } from "../src/components/GenderBadge.js";

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

describe("D581 — القانون 29 (Bidi)", () => {
  it("StruckText: نص ألماني يُغلَّف dir=\"ltr\" تلقائياً · والعربي يبقى كما هو", () => {
    const de = mount(<StruckText text="Ich habe ~~gehen~~ gegangen." />);
    expect(de.querySelector('span[dir="ltr"]')).not.toBeNull();
    const ar = mount(<StruckText text="هذا خطأ شائع ~~لا يغتفر~~ يُصلح بالتدريب" />);
    expect(ar.querySelector('span[dir="ltr"]')).toBeNull();
    // وكلمة مستعارة ألمانية داخل نص عربي تبقى lang="de"
    const mixed = mount(
      <BorrowedProvider
        words={[{ form: "der Klappstuhl", wordId: "klappstuhl", ar: "كرسي قابل للطي", whyAr: "كلمة مستعارة من درس قادم" }]}
      >
        <StruckText text="المصطلح der Klappstuhl معروف" />
      </BorrowedProvider>,
    );
    expect(mixed.querySelector('abbr[lang="de"]')?.textContent).toBe("der Klappstuhl");
  });
});

describe("D581 — §15-هـ الترميز المزدوج (لون + شكل)", () => {
  it("الشارة تعرض اللون والشكل معاً — لا أحدهما أبداً", () => {
    const props = genderBadgeProps("die");
    expect(props["data-dual-coding"]).toBe("color+shape");
    expect(props["data-shape"]).not.toBe("");
    const host = mount(<GenderBadge gender="das" word="Buch" />);
    expect(host.querySelector('[data-gender="das"]')).not.toBeNull();
    expect(host.querySelector('[data-dual-coding="color+shape"]')).not.toBeNull();
  });

  it("بطاقة Präsentation تحمل شارة الجنس (§15-هـ: البطاقات وPräsentation)", () => {
    const host = mount(
      <LearnCardView
        gender="die"
        promptDe="die Tür"
        promptAr="الباب"
        attempted={false}
        revealed={false}
        explanation="der/die/das — الشكل واللون معاً"
        onAttempt={() => {}}
        onReveal={() => {}}
      />,
    );
    expect(host.querySelector('[data-testid="learn-card"] [data-dual-coding="color+shape"]')).not.toBeNull();
    expect(host.querySelector('[data-gender="die"]')).not.toBeNull();
    // والبطاقة بلا جنس (جملة) تبقى بلا شارة
    const plain = mount(
      <LearnCardView
        promptDe="Guten Morgen"
        promptAr="صباح الخير"
        attempted={false}
        revealed={false}
        explanation="تحية"
        onAttempt={() => {}}
        onReveal={() => {}}
      />,
    );
    expect(plain.querySelector('[data-dual-coding]')).toBeNull();
  });
});
