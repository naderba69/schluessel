// @vitest-environment happy-dom
// tests/grammar-atlas.test.tsx — D576: أطلس القواعد «خريطة المترو» (§12)
// الخطوط الستة · الفتح التدريجي · تشريح المحطة · آلية الصدأ · Bidi إلزامي على كل الأمثلة.
import { afterEach, describe, expect, it } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ATLAS_LINES, RUST_DAYS, atlasArsenalIds, stationStatus } from "../src/lib/grammar-atlas.js";
import { LESSON_ORDER, loadGrammarRule } from "../src/lesson-packs.js";
import { GrammarAtlas } from "../src/components/GrammarAtlas.js";

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
async function waitFor(cond: () => boolean, what: string) {
  for (let i = 0; i < 200; i++) {
    if (cond()) return;
    await act(async () => new Promise((r) => setTimeout(r, 5)));
  }
  throw new Error(`لم يكتمل: ${what}`);
}

describe("D576 — نموذج الأطلس (§12)", () => {
  it("الخطوط الستة بأسمائها ومواصفتها الحاكمة", () => {
    expect(ATLAS_LINES.map((l) => l.id)).toEqual(["satzbau", "kasus", "verben", "adjektive", "praepositionen", "konnektoren"]);
    expect(ATLAS_LINES).toHaveLength(6);
    expect(ATLAS_LINES.every((l) => l.stations.length >= 4)).toBe(true);
  });

  it("تكامل: كل شفرة مربوطة موجودة فعلاً في الخزانة (الأطلس مرجع الحقيقة)", async () => {
    const ids = atlasArsenalIds();
    expect(ids.length).toBeGreaterThanOrEqual(15);
    const rules = await Promise.all(ids.map((id) => loadGrammarRule(id)));
    for (let i = 0; i < ids.length; i++) expect(rules[i], ids[i]).toBeDefined();
  });

  it("الحالة: مرجع · مقفلة · مفتوحة · صدأ (≥21 يوماً) — حتمية بلا وقت جداري", () => {
    const li = (id: string) => LESSON_ORDER.indexOf(id);
    const kl = ATLAS_LINES[0]!.stations[1]!; // القلنسوة — a1-u9-d5
    const taughtAt = li(kl.firstLesson!);
    expect(taughtAt).toBeGreaterThanOrEqual(0);
    expect(stationStatus(kl, taughtAt - 1, li)).toBe("locked");
    expect(stationStatus(kl, taughtAt, li)).toBe("open");
    expect(stationStatus(kl, taughtAt, li, RUST_DAYS - 1)).toBe("open");
    expect(stationStatus(kl, taughtAt, li, RUST_DAYS)).toBe("rusty");
    expect(stationStatus(ATLAS_LINES[0]!.stations[0]!, 0, li)).toBe("reference"); // V2 بلا شفرة
  });
});

describe("D576 — الأطلس في DOM", () => {
  it("الخطوط الستة والمحطات تُرسم · المقفلة 🔒 معطّلة · والمفتوحة تُظهر التشريح (Bidi إلزامي)", async () => {
    const kl = ATLAS_LINES[0]!.stations[1]!;
    const idx = LESSON_ORDER.indexOf(kl.firstLesson!);
    const host = mount(<GrammarAtlas currentIndex={idx} />);
    expect(host.querySelector('[data-testid="grammar-atlas"]')).not.toBeNull();
    for (const line of ATLAS_LINES) expect(host.querySelector(`[data-testid="atlas-line-${line.id}"]`)).not.toBeNull();

    const locked = host.querySelector<HTMLButtonElement>(('[data-testid="station-konjunktiv"]')); // b1-u6-d1 — مقفلة هنا
    expect(locked!.disabled).toBe(true);
    expect(locked!.getAttribute("data-status")).toBe("locked");

    const openBtn = host.querySelector<HTMLButtonElement>(`[data-testid="station-${kl.id}"]`)!;
    expect(openBtn.getAttribute("data-status")).toBe("open");
    await act(async () => openBtn.click());
    await waitFor(() => !!host.querySelector('[data-testid="anatomy-topic"]'), "تحميل تشريح المحطة");
    expect(host.querySelector('[data-testid="anatomy-contrast"]')).not.toBeNull(); // لا قاعدة بلا مقارنة
    const de = host.querySelector('[data-testid="anatomy-rule-de"]')!;
    expect(de.getAttribute("dir")).toBe("ltr"); // Bidi إلزامي (§12)
    for (const ex of host.querySelectorAll('[data-testid="anatomy-example"]')) {
      expect(ex.querySelector('[dir="ltr"]')).not.toBeNull();
    }
  });

  it("الصدأ يُظهر التذكير لا اللوم (D23)", async () => {
    const kl = ATLAS_LINES[0]!.stations[1]!;
    const idx = LESSON_ORDER.indexOf(kl.firstLesson!);
    const host = mount(<GrammarAtlas currentIndex={idx} daysSinceSeen={{ [kl.id]: RUST_DAYS + 5 }} />);
    const btn = host.querySelector<HTMLButtonElement>(`[data-testid="station-${kl.id}"]`)!;
    expect(btn.getAttribute("data-status")).toBe("rusty");
    expect(btn.getAttribute("aria-label")).toContain("تذكير لا لوم");
  });
});
