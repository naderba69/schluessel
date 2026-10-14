// tests/word-audio-text.test.ts — D102: نص كل مقطع كلمة = رسم الكلمة نفسها (لا رسم ASCII بديل ولا خطأ إملائي)
// اكتُشف: 10 مقاطع A1 وُلّدت من رسم ASCII (gross/Fuss/suess…) و«fünzig» بلا f — 6 منها تُنطق خطأً فعلاً،
// و4 منها في درس a1-u2-d4 الذي يعلّم «ß بعد الطويل» بينما الصوت يقول [ɡrɔs] قصيراً.
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AudioManifest } from "../content/schemas/index.js";
import { ALL_WORDS } from "../src/lesson-packs.js";
import type { Word } from "../content/schemas/index.js";

const manifest = AudioManifest.parse(
  JSON.parse(readFileSync(join(process.cwd(), "content/manifests/audio-manifest.a1-u1.json"), "utf8")),
);
const strip = (x: string) => x.trim().replace(/[.!?]+$/, "").trim();

/** الأشكال المقبولة لنص المقطع: الكلمة · بلا أداة · مع الأداة · كل بديل «/» · بلا الشرح بين القوسين */
function accepted(w: Word): Set<string> {
  const out = new Set<string>();
  for (const alt of w.de.replace(/\s*\(.*?\)\s*/g, " ").trim().split(" / ")) {
    const a = strip(alt);
    out.add(a);
    const m = a.match(/^(der|die|das) (.+)$/);
    if (m) out.add(m[2]!);
    if (w.article && !a.startsWith(`${w.article} `)) out.add(`${w.article} ${a}`);
  }
  // المقطع قول مستقل: الحرف الأول كبير مقبول («Alles klar.» لـ«alles klar») — لا يغيّر النطق ولا الرسم
  for (const a of [...out]) out.add(a.charAt(0).toUpperCase() + a.slice(1));
  return out;
}

describe("D102 — نص المقطع الصوتي يطابق رسم الكلمة (Unicode حرفياً)", () => {
  const byId = new Map(ALL_WORDS.map((w) => [w.id, w]));
  const wordTracks = manifest.tracks.filter((t) => t.role === "word");

  it("كل مقطع كلمة: نصه أحد أشكال الكلمة المقبولة — لا ss بدل ß ولا ue بدل ü ولا حرف ناقص", () => {
    expect(wordTracks.length).toBe(ALL_WORDS.length);
    const bad: string[] = [];
    for (const t of wordTracks) {
      const w = byId.get(t.id.replace(/^word-/, ""))!;
      if (!accepted(w).has(strip(t.textDe))) bad.push(`${t.id}: «${t.textDe}» ≠ «${w.de}»`);
    }
    expect(bad).toEqual([]);
  });

  it("الرسم الصحيح في ملفات الكلمات المُصلَحة: fünfzig · das Gleis", () => {
    expect(byId.get("fuenfzig")!.de).toBe("fünfzig");
    expect(byId.get("gleis")!.de).toBe("das Gleis");
  });

  it("قياس النطق الفعلي (espeak-ng عبر الصوت المثبَّت): الحركات الطويلة والحروف صحيحة في المقاطع الستة المُصلَحة", () => {
    const expected: Record<string, RegExp> = {
      "word-fuss": /uː/, // Fuß [fuːs] — كان [fʊs]
      "word-gross": /oː/, // groß [ɡroːs] — كان [ɡrɔs]
      "word-suess": /yː/, // süß [zyːs] — كان [zuːɛs]
      "word-gespraech": /ɛː/, // Gespräch [ɡəʃprɛːç] — كان [ɛ] قصيراً
      "word-natuerlich": /yː/, // natürlich [naːtyːɐ̯lɪç] — كان [nɑtuːɜlɪç]
      "word-fuenfzig": /nf/, // fünfzig [fʏnftsɪç] — كان [fʏntsɪç]
    };
    const tracks = wordTracks.filter((t) => t.id in expected);
    expect(tracks).toHaveLength(6);
    const ipa = JSON.parse(
      execFileSync("python3", [join(process.cwd(), "tools/phonemize.py"), ...tracks.map((t) => t.textDe)], { encoding: "utf8" }),
    ) as { text: string; ipa: string }[];
    tracks.forEach((t, i) => expect(ipa[i]!.ipa, `${t.id} (${t.textDe})`).toMatch(expected[t.id]!));
  });
});
