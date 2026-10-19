// tests/interleave.test.ts — الاستدعاء المعلن في المحطات (interleavedWith) — N-102/N-110 (D184 بإذن المالك D182)
// يحلّ محلّ حلقات «أول أربعة أحرف» في كتل tests/lesson-upgrade.test.ts القديمة (تبقى كما هي؛ هذا الفحص أشدّ ويشمل دروس A1 الـ78 كلها):
//   1) كل معرّف مُستدعى كلمةُ درسٍ سابق في المسار (لا كلمة اليوم ولا كلمة لاحقة ولا معرّف بلا ملف)؛
//   2) تظهر فعلاً في نصوص بنود المحطة (speakText ضمنها) رمزاً كاملاً أو صيغةً مسجَّلة في ملفها (praesens3s · perfekt · praeteritum ·
//      imperative · الجمع) أو جذعاً + نهاية مغلقة — والفعل المنفصل بجزئه (stehe … auf).
// ضوابط سلبية: البادئة لا تكفي (geschaeft ≠ Geschenk · schweiz ≠ Schwester · sonne ≠ Sonnenbrille).
import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { loadLessons, loadWords } from "../tools/lib/content-disk.js";
import { interleaveSupported, itemTexts, taughtUpTo } from "../tools/lib/lesson-upgrade.js";

const CONTENT = join(__dirname, "..", "content");
const words = loadWords(CONTENT);
const all = loadLessons(CONTENT);
const lessons = all.filter((l) => l.level === "A1"); // A2 (a2-u1-d1 النموذج) تحت المرحلة ج — خارج هذا الحارس حتى تُبنى على المنهج
const byId = new Map(words.map((w) => [w.id, w]));
const word = (id: string) => { const w = byId.get(id); if (!w) throw new Error(`no word ${id}`); return w; };

describe("interleavedWith — الاستدعاء المعلن كلمةُ درسٍ سابق تظهر فعلاً في المحطة (N-102/N-110)", () => {
  const declared = lessons.flatMap((l) => l.uebung.stations.flatMap((s) => s.interleavedWith.map((r) => ({ l, s, r }))));
  it("كل دروس A1 الـ88 (12×6 + u13-d1..d6 + u14-d1..d4 + u15×6 — D204–D213) تُعلن استدعاءً (≥ 1 محطة من اليوم 3) وكلها مرجعيّة", () => {
    expect(lessons.length).toBe(88);
    expect(declared.length).toBeGreaterThan(300);
    for (const { l, r } of declared) expect(byId.has(r), `${l.id}: «${r}» بلا ملف كلمة`).toBe(true);
  });
  it("المعرّف المُستدعى من درس سابق (لا من اليوم ولا من درس لاحق)", () => {
    const bad = declared.filter(({ l, r }) => !taughtUpTo(l, all, words).some((w) => w.id === r)).map(({ l, r }) => `${l.id}:${r}`);
    expect(bad).toEqual([]);
  });
  it("المعرّف المُستدعى يظهر في نصوص بنود محطته كلمةً كاملة أو صيغةً مسجَّلة", () => {
    const bad = declared
      .filter(({ s, r }) => !interleaveSupported(word(r), s.items.flatMap((it) => itemTexts(it))))
      .map(({ l, s, r }) => `${l.id}/${s.type}:${r}`);
    expect(bad).toEqual([]);
  });
});

describe("interleaveSupported — ضوابط", () => {
  it("البادئة لا تكفي (N-102)", () => {
    expect(interleaveSupported(word("geschaeft"), ["Das Geschenk ist schön."])).toBe(false);
    expect(interleaveSupported(word("schweiz"), ["Meine Schwester kommt."])).toBe(false);
    expect(interleaveSupported(word("sonne"), ["Die Sonnenbrille ist neu."])).toBe(false);
  });
  it("الكلمة الكاملة والجمع والصيغ المسجَّلة وspeakText (N-110)", () => {
    expect(interleaveSupported(word("geschaeft"), ["Das Geschäft ist zu."])).toBe(true);
    expect(interleaveSupported(word("freundin"), ["Meine Freundinnen kommen."])).toBe(true);
    expect(interleaveSupported(word("kaufen"), ["Ich habe Brot gekauft."])).toBe(true);
    expect(interleaveSupported(word("kaufen"), ["Der Verkäufer verkauft Hüte."])).toBe(false);
    expect(interleaveSupported(word("muede"), ["Ich bin müde."])).toBe(true);
    expect(interleaveSupported(word("neu"), ["Das ist ein neues Buch."])).toBe(true);
    expect(interleaveSupported(word("zeigen"), ["Zeig mir das Foto!"])).toBe(true);
    expect(interleaveSupported(word("aufraeumen"), ["Ich habe aufgeräumt."])).toBe(true);
    expect(interleaveSupported(word("aufstehen"), ["Ich stehe um sieben auf."])).toBe(true);
    expect(interleaveSupported(word("aufstehen"), ["Ich stehe hier."])).toBe(false);
    expect(interleaveSupported(word("zwanzig"), ["einundzwanzig"])).toBe(false);
    expect(interleaveSupported(word("sein"), ["Ich bin hier."])).toBe(false);
  });
});
