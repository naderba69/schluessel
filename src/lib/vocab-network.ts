// vocab-network.ts — E14 محرك المفردات الشبكي | M2-ب
// المصادر: semantic networks + dual coding (Paivio) · القاعدة: «كل كلمة بروابطها» (validator)
// الوظيفة: عائلات كلمات + كولوكيشنات + قصر ذهني — الكلمة لا تعيش منفردة.

import type { Word } from "../../content/schemas/index.js";

export type NetworkNode = {
  wordId: string;
  de: string;
  ar: readonly string[];
  family: readonly string[];
  kollocation?: { de: string; ar: string; verb?: string };
  /** وسم المفهوم (dual coding: الكلمة + صورة/مشهد) */
  conceptTag: string;
};

export type NetworkEdge = { from: string; to: string; kind: "family" | "kollocation" };

export function toNode(w: Word, conceptTag?: string): NetworkNode {
  return {
    wordId: w.id,
    de: w.de,
    ar: w.ar,
    family: w.wordFamily,
    ...(w.kollocation ? { kollocation: w.kollocation } : {}),
    conceptTag: conceptTag ?? w.thema ?? "alltag",
  };
}

export function buildNetwork(words: Pick<Word, "id" | "de" | "ar" | "wordFamily" | "kollocation" | "thema">[]): {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
} {
  const nodes = words.map((w) => toNode(w as Word));
  const ids = new Set(nodes.map((n) => n.wordId));
  const edges: NetworkEdge[] = [];
  for (const n of nodes) {
    for (const f of n.family) {
      if (ids.has(f)) edges.push({ from: n.wordId, to: f, kind: "family" });
    }
    if (n.kollocation) edges.push({ from: n.wordId, to: n.wordId, kind: "kollocation" });
  }
  return { nodes, edges };
}

/** validator E14: كل كلمة بروابطها — بلا عائلة وكولوكيشن = فجوة مُعلَنة */
export function missingLinks(nodes: readonly NetworkNode[]): string[] {
  return nodes.filter((n) => n.family.length === 0 && !n.kollocation).map((n) => n.wordId);
}

/** القصر الذهني: كل «غرفة» تحمل عائلة/وسم مفهوم — تثبيت بالترميز المزدوج (dual coding)
 *  تُوزَّع المجموعات على الغرف بالترتيب (تتشارك الغرف عند الحاجة) — لا كلمات خارج القصر. */
export function memoryPalace(nodes: readonly NetworkNode[], rooms: readonly string[]): {
  stations: { room: string; wordIds: string[] }[];
} {
  if (rooms.length === 0) throw new Error("لا قصر بلا غرف");
  const groups = new Map<string, string[]>();
  for (const n of nodes) {
    const key = n.conceptTag || "alltag";
    const list = groups.get(key) ?? [];
    list.push(n.wordId);
    groups.set(key, list);
  }
  return {
    stations: [...groups.values()].map((wordIds, i) => ({
      room: rooms[i % rooms.length]!,
      wordIds,
    })),
  };
}

/** مسار المراجعة الشبكية: عائلة ← كولوكيشن ← استخدام — قصر لا يتجاوز 3 تفاعلات (≤3 دقائق) */
export function networkReviewFlow(): { order: number; kind: "family" | "kollocation" | "use"; labelAr: string }[] {
  return [
    { order: 1, kind: "family", labelAr: "استدعي العائلة كاملة" },
    { order: 2, kind: "kollocation", labelAr: "اربط الكلمة بركبها الجاهز" },
    { order: 3, kind: "use", labelAr: "كوّن جملة من كلمات الغرفة" },
  ];
}
