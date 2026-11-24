// @vitest-environment happy-dom
// tests/training-tools.test.tsx — D579: الأدوات الخمس نصف المكتملة (D573 البند 5)
// توقيت 50/75/100% · مفكك الديناصورات · مراجعة القصر · بنّاء العرض · مدرب المناقشة · بوابات المعالم.
import { afterEach, describe, expect, it } from "vitest";
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { Word } from "../content/schemas/index.js";
import {
  OFFICIAL_MINUTES,
  TIMING_RATIOS,
  discussionFrames,
  dinoDecompose,
  longestWord,
  palaceReviewPlan,
  presentationOutline,
  scaledMinutes,
  toolUnlocked,
} from "../src/lib/training-tools.js";
import { networkReviewFlow } from "../src/lib/vocab-network.js";
import { LESSON_ORDER } from "../src/lesson-packs.js";
import { TrainingTools } from "../src/components/TrainingTools.js";

function word(id: string, de: string, ar: string): Word {
  return { schemaVersion: "1.0.0", id, de, ar: [ar], gender: "none", wordFamily: [], theme: "test" } as unknown as Word;
}

const WORDS = [
  word("w1", "der Fuß", "قدم"),
  word("w2", "der Ball", "كرة"),
  word("w3", "die Arbeit", "عمل"),
  word("w4", "der Platz", "مكان"),
  word("w5", "die Schutz", "حماية"),
  word("w6", "die Versicherung", "تأمين"),
  word("w7", "das Recht", "قانون"),
];

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

describe("D579 — نماذج الأدوات", () => {
  it("التوقيت التدريجي 50/75/100% من الزمن الرسمي", () => {
    expect(TIMING_RATIOS).toEqual([50, 75, 100]);
    expect(scaledMinutes(60, 50)).toBe(30);
    expect(scaledMinutes(60, 75)).toBe(45);
    expect(scaledMinutes(60, 100)).toBe(60);
    expect(OFFICIAL_MINUTES.B1!.schreiben).toBe(60); // دقائق رسمية موثّقة (exam-formats)
  });

  it("مفكك الديناصورات: مركّبة ← أجزاء معروفة (مع حذف الفوغن-إس)", () => {
    const known = new Set(["fuß", "ball", "arbeit", "platz", "recht", "schutz", "versicherung"]);
    expect(dinoDecompose("Fußball", known)).toEqual(["Fuß", "ball"]);
    const arbeitsplatz = dinoDecompose("Arbeitsplatz", known)!;
    expect(arbeitsplatz).toHaveLength(2);
    expect(arbeitsplatz.join("").toLowerCase()).toBe("arbeitsplatz");
    expect(dinoDecompose("Rechtsschutzversicherung", known)).toEqual(["Rechts", "schutz", "versicherung"]);
    expect(dinoDecompose("Xylophon", known)).toBeNull(); // صدق: لا تفكيك بلا يقين
    expect(longestWord(["kurz", "Fußball"])).toBe("Fußball");
  });

  it("مراجعة القصر: غرفة×3 خطوات · وبنّاء العرض/المناقش: 3 محطات لكل", () => {
    const plan = palaceReviewPlan(
      [
        { room: "المدخل", wordIds: ["a", "b"] },
        { room: "المطبخ", wordIds: ["c"] },
      ],
      networkReviewFlow(),
    );
    expect(plan).toHaveLength(6); // 2 غرف × 3 خطوات
    expect(presentationOutline().map((s) => s.slot)).toEqual(["einleitung", "hauptteil", "schluss"]);
    expect(discussionFrames().map((s) => s.slot)).toEqual(["meinung", "gruende", "gegenargument"]);
  });

  it("بوابات المعالم: الديناصورات A2 · العرض B1 · المناقشة B2 · التوقيت والقصر أبداً مفتوحان", () => {
    const a2 = LESSON_ORDER.findIndex((id) => id.startsWith("a2-"));
    const b1 = LESSON_ORDER.findIndex((id) => id.startsWith("b1-"));
    const b2 = LESSON_ORDER.findIndex((id) => id.startsWith("b2-"));
    expect(toolUnlocked("dino", a2 - 1, LESSON_ORDER, 0)).toBe(false);
    expect(toolUnlocked("dino", a2, LESSON_ORDER, 0)).toBe(true);
    expect(toolUnlocked("presentation", b1 - 1, LESSON_ORDER, 0)).toBe(false);
    expect(toolUnlocked("presentation", b1, LESSON_ORDER, 0)).toBe(true);
    expect(toolUnlocked("discussion", b2 - 1, LESSON_ORDER, 0)).toBe(false);
    expect(toolUnlocked("discussion", b2, LESSON_ORDER, 0)).toBe(true);
    expect(toolUnlocked("timing", 0, LESSON_ORDER, 0)).toBe(true);
    expect(toolUnlocked("palace", 0, LESSON_ORDER, 3)).toBe(true);
    expect(toolUnlocked("palace", 0, LESSON_ORDER, 2)).toBe(false); // لا قصر بلا كلمات
  });
});

describe("D579 — الأدوات في DOM", () => {
  it("الخمسة تُرسم · المقفلة عند معلمها · والتوقيت يحسب أمام العين", async () => {
    const b2 = LESSON_ORDER.findIndex((id) => id.startsWith("b2-"));
    const host = mount(<TrainingTools words={WORDS} lessonIndex={b2} />);
    for (const id of ["timing", "dino", "palace", "presentation", "discussion"]) {
      expect(host.querySelector(`[data-testid="tt-${id}"]`)).not.toBeNull();
    }
    await act(async () => host.querySelector<HTMLButtonElement>('[data-testid="tt-toggle-timing"]')!.click());
    const scaled = host.querySelectorAll('[data-testid="tt-timing-scaled"]');
    expect(scaled.length).toBe(4);
    await act(async () => host.querySelector<HTMLButtonElement>('[data-testid="tt-timing-ratio-50"]')!.click());
    expect(host.querySelector('[data-testid="tt-timing-scaled"]')!.textContent).toBe("20"); // B1 hoeren 40 × 50٪

    // الديناصور: تفكيك أمامي
    await act(async () => host.querySelector<HTMLButtonElement>('[data-testid="tt-toggle-dino"]')!.click());
    expect(host.querySelector('[data-testid="tt-dino-parts"]')).not.toBeNull();

    // قفل البوابات عند مستوى مبكر
    const early = mount(<TrainingTools words={WORDS} lessonIndex={0} />);
    const dino = early.querySelector<HTMLButtonElement>('[data-testid="tt-toggle-dino"]')!;
    expect(dino.disabled).toBe(true);
  });
});
