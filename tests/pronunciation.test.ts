// pronunciation.test.ts — E10: مخارج D18 الموثّقة + دورة r/ch/ü — بلا درجات نطق (D16)
import { describe, it, expect } from "vitest";
import {
  SOUND_CARDS,
  drillCycle,
  buildPronunciationSession,
  selfCompare,
} from "../src/lib/pronunciation.js";

describe("E10 — خرائط الفم من D18 (لا تخمين)", () => {
  it("البطاقات الثلاث بمخارج D18 حرفياً", () => {
    const byId = Object.fromEntries(SOUND_CARDS.map((c) => [c.id, c]));
    expect(byId.r!.articulationDe).toBe("Zungenspitze an der unteren Schneidezähne — Zunge runter!");
    expect(byId.ch!.articulationDe).toBe("Zunge hinter den unteren Schneidezähnen");
    expect(byId.ue!.articulationDe).toBe(
      "Lippen wie bei einem u, aber die Zunge nimmt die Position des i ein",
    );
    for (const c of SOUND_CARDS) {
      expect(c.source).toBe("D18");
      expect(c.articulationAr).toBeTruthy();
      expect(c.drillWords.length).toBeGreaterThan(1);
    }
  });

  it("كلمات D18 للتدريب: Rad/Rabe · Kirche/Küche · Tür/müde", () => {
    const byId = Object.fromEntries(SOUND_CARDS.map((c) => [c.id, c]));
    expect(byId.r!.drillWords).toContain("Rad");
    expect(byId.ch!.drillWords).toContain("Kirche");
    expect(byId.ue!.drillWords).toContain("Tür");
    expect(byId.ue!.drillWords).toContain("müde");
  });
});

describe("E10 — دورة التدريب: استمع ← خريطة ← سجّل ← قارن", () => {
  it("الترتيب: خريطة الفم بعد الاستماع، والتسجيل قبل التدريب وبعده", () => {
    const steps = drillCycle("r");
    const kinds = steps.map((s) => s.kind);
    expect(kinds).toEqual(["hoeren", "muenzkarte", "aufnehmen-vorher", "nachsprechen", "aufnehmen-nachher", "selbstvergleich"]);
  });

  it("المقارنة قبل/بعد = score: null — لا درجات للنطق إطلاقاً", () => {
    const c = selfCompare("قبل: ثقيل", "بعد: أخف");
    expect(c.score).toBeNull();
    expect(c.noteAr).toContain("لا نُعطي درجات");
  });

  it("الجلسة الثلاثية كاملة + صوت مجهول = خطأ فوري", () => {
    const s = buildPronunciationSession();
    expect(s.cycles.map((c) => c.soundId)).toEqual(["r", "ch", "ue"]);
    expect(() => buildPronunciationSession(["xx" as never])).toThrow();
    expect(() => drillCycle("xx" as never)).toThrow();
  });
});
