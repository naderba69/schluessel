// tests/front-guard.test.ts — قانون الجبهة بعد D185 (N-103 + N-112 + N-022 بإذن المالك D182)
// N-103 (2): الجذع المشتق القصير (≤3) لا يدخل إلا من فعل وبنهاية فعل — «wei» من Wein لا يمرّر weit.
// N-103 (1): صيغة كلمة درسٍ لاحق تُرفض ولو طابقت جذعاً (fragt قبل fragen عبر Frage) — إلا كاملة مدروسة (+نهاية) أو جذع فعل مدروس + نهاية فعل.
// N-112: الفعل القصير tun ⇒ tue/tust · وhattest/hattet/warst/wart مغلقة. · N-022: meta الدروس المُرقّاة تحت الجبهة.
import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { loadAudioTracks, loadGrammarRules, loadLessons, loadUpgradePlans, loadWords } from "../tools/lib/content-disk.js";
import { inspectLesson, metaOf, taughtUpTo } from "../tools/lib/lesson-upgrade.js";
import { CLOSED, IMPLICIT_FORMS, knownStems, unknownTokens, withLaterForms } from "../tools/lib/vocab-forms.js";

const CONTENT = join(__dirname, "..", "content");
const words = loadWords(CONTENT);
const lessons = loadLessons(CONTENT);
const w = (id: string) => { const x = words.find((y) => y.id === id); if (!x) throw new Error(id); return x; };
const unknown = (text: string, ids: string[]) => unknownTokens(text, knownStems(ids.map(w)));

describe("N-103 (2) — الجذوع القصيرة", () => {
  it("الاسم القصير لا يعطي جذعاً مشتقاً (wei من Wein · bei من Bein · dan من dann)", () => {
    expect(unknown("weit", ["wein"])).toEqual(["weit"]);
    expect(unknown("beide", ["bein"])).toEqual(["beide"]);
    expect(unknown("dann", ["dank"])).toEqual(["dann"]);
  });
  it("الصيغة الكاملة القصيرة تبقى وتقبل النهايات (Tag/Tage · neu/neues · gut/guter · Oma/Omas · ab)", () => {
    expect(unknown("Tag Tage neu neues neuer gut guter Omas ab", ["tag", "neu", "wie-gehts", "oma", "ab"])).toEqual([]);
  });
  it("جذع الفعل القصير يقبل نهايات الفعل وحدها (geh+st · ess+e · hör+t — لا ess+er؛ أما geh+er فتمرّ لأن Geh! صيغة أمر مسجَّلة كاملة)", () => {
    expect(unknown("gehst esse hört", ["gehen", "essen", "hoeren"])).toEqual([]);
    expect(unknown("esser", ["essen"])).toEqual(["esser"]);
    expect(unknown("geher", ["gehen"])).toEqual([]);
  });
});

describe("N-112 — الأفعال القصيرة والمساعدة", () => {
  it("tun ⇒ tue · tust · tut · getan", () => {
    expect(unknown("Ich tue das. Was tust du? Er tut weh. Was hast du getan?", ["tun", "weh-tun"])).toEqual([]);
    expect(unknown("tue tust", [])).toEqual(["tue", "tust"]);
  });
  it("hattest/hattet/warst/wart مغلقة كأخواتها war/hatte", () => {
    for (const f of ["hattest", "hattet", "warst", "wart", "hatten", "waren"]) expect(CLOSED.has(f), f).toBe(true);
  });
  it("القائمة الضمنية مغلقة وصغيرة: gut من بطاقة Wie geht's · تصريف jeder", () => {
    expect(Object.keys(IMPLICIT_FORMS).sort()).toEqual(["jeder", "wie-gehts"]);
    expect(words.some((x) => x.id === "gut")).toBe(false); // لا بطاقة gut في المقرر — فإن أُضيفت تُحذف من القائمة
    expect(unknown("jede jedes jeden jedem", ["jeder"])).toEqual([]);
    expect(unknown("jede", [])).toEqual(["jede"]);
  });
});

describe("N-103 (1) — كلمة الدرس اللاحق تُرفض ولو طابقت جذعاً", () => {
  const u8d4 = lessons.find((l) => l.id === "a1-u8-d4")!;
  const taught = taughtUpTo(u8d4, lessons, words);
  const stems = withLaterForms(knownStems(taught), taught, words);
  it("weit (u9-d2) وfragt (fragen u10-d3) مرفوضان حتى u8-d4 — كانا يمرّان بجذعي Wein (قصير — حُصر) وFrage (≥4 — يمسكه فحص اللاحق وحده)", () => {
    expect(unknownTokens("Meine Oma wohnt nicht weit.", knownStems(taught))).toEqual(["weit"]);
    expect(unknownTokens("Der Verkäufer fragt den Kunden.", knownStems(taught))).toEqual([]); // frag من Frage — بلا فحص اللاحق يمرّ
    expect(unknownTokens("Meine Oma wohnt nicht weit. Der Verkäufer fragt den Kunden.", stems)).toEqual(["fragt", "weit"]);
  });
  it("الاستثناءات: صيغة مدروسة كاملة + نهاية (große ⇐ groß) · جذع فعل مدروس + نهاية فعل (wasche ⇐ waschen) · lernen ⇐ lern (kennenlernen)", () => {
    expect(unknownTokens("Die große Stadt. Ich wasche mich. Ich lerne Deutsch.", stems)).toEqual([]);
  });
});

describe("N-022 — meta الدروس المُرقّاة الستين تحت قانون الجبهة", () => {
  const tracks = loadAudioTracks(CONTENT);
  const rules = loadGrammarRules(CONTENT);
  const plan = loadUpgradePlans(CONTENT)[0]!;
  it("metaOf: هدف الدرس · هدف المهمة وموقفها · الخلاصة", () => {
    expect(metaOf(lessons.find((l) => l.id === "a1-u1-d1")!)).toHaveLength(4);
  });
  it("صفر e-upgrade-meta في الستين (كانت 11 درساً: u1-d1..u3-d3)", () => {
    const bad = plan.lessons.map((e) => {
      const l = lessons.find((x) => x.id === e.lessonId)!;
      return [e.lessonId, inspectLesson(l, e, { lessons, words, tracks, rules }).meta.map((i) => i.message)] as const;
    }).filter(([, m]) => m.length);
    expect(bad).toEqual([]);
  });
});
