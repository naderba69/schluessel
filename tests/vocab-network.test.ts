// vocab-network.test.ts — E14: كل كلمة بروابطها (validator) + القصر الذهني + dual coding (Paivio)
import { describe, it, expect } from "vitest";
import {
  buildNetwork,
  missingLinks,
  memoryPalace,
  networkReviewFlow,
  toNode,
} from "../src/lib/vocab-network.js";
import { firstLessonWords } from "../src/lesson-packs.js";
import { loadUnit0Deck } from "../src/lib/unit0.js";

describe("E14 — الشبكة الدلالية: كل كلمة بروابطها", () => {
  it("كل كلمات الدرس الـ15 لها روابط (عائلة أو كولوكيشن) — validator أخضر", () => {
    const { nodes, edges } = buildNetwork(firstLessonWords);
    expect(nodes.length).toBe(15);
    expect(missingLinks(nodes)).toEqual([]);
    expect(edges.length).toBeGreaterThan(10);
  });

  it("الفجوة تُرصد بصراحة — كلمة بلا روابط تظهر في missingLinks", () => {
    const bare = {
      id: "bare", de: "bare", ar: ["عارية"], wordFamily: [], thema: "test",
    } as never;
    expect(missingLinks([toNode(bare)])).toEqual(["bare"]);
  });

  it("الكولوكيشن يدخل الشبكة حرفياً من بيانات الكلمة (kommen: aus Tunesien kommen)", () => {
    const { nodes } = buildNetwork(firstLessonWords);
    const kommen = nodes.find((n) => n.wordId === "kommen")!;
    expect(kommen.kollocation?.de).toBe("aus Tunesien kommen");
    expect(kommen.family).toContain("wohnen");
    expect(kommen.conceptTag).toBeTruthy(); // dual coding: وسم مفهوم لكل كلمة
  });
});

describe("E14 — القصر الذهني ومراجعة الشبكة", () => {
  it("كل الكلمات داخل غرف القصر — لا كلمة خارجه", () => {
    const { nodes } = buildNetwork(firstLessonWords);
    const { stations } = memoryPalace(nodes, ["المدخل", "المطبخ", "الغرفة"]);
    const all = stations.flatMap((s) => s.wordIds);
    expect(new Set(all)).toEqual(new Set(nodes.map((n) => n.wordId)));
    expect(() => memoryPalace(nodes, [])).toThrow(/غرف/);
  });

  it("مسار المراجعة الشبكية: 3 تفاعلات فقط (≤3 دقائق) — عائلة ← كولوكيشن ← استخدام", () => {
    const flow = networkReviewFlow();
    expect(flow.map((f) => f.kind)).toEqual(["family", "kollocation", "use"]);
    expect(flow.length).toBe(3);
    // الوحدة صفر تبقى مراجعها ≤3 دقائق (E02) — الشبكة كذلك
    const deck = loadUnit0Deck();
    expect(deck.cards.length).toBeGreaterThan(0);
  });
});
