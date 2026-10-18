// tests/front-guard.test.ts — قانون الجبهة بعد D185 (N-103 + N-112 + N-022 بإذن المالك D182)
// N-103 (2): الجذع المشتق القصير (≤3) لا يدخل إلا من فعل وبنهاية فعل — «wei» من Wein لا يمرّر weit.
// N-103 (1): صيغة كلمة درسٍ لاحق تُرفض ولو طابقت جذعاً (fragt قبل fragen عبر Frage) — إلا كاملة مدروسة (+نهاية) أو جذع فعل مدروس + نهاية فعل.
// N-112: الفعل القصير tun ⇒ tue/tust · وhattest/hattet/warst/wart مغلقة. · N-022: meta الدروس المُرقّاة تحت الجبهة.
import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { loadAudioTracks, loadGrammarRules, loadLessons, loadUpgradePlans, loadWords } from "../tools/lib/content-disk.js";
import { inspectLesson, metaOf, taughtUpTo } from "../tools/lib/lesson-upgrade.js";
import { CLOSED, knownStems, unknownTokens, withLaterForms } from "../tools/lib/vocab-forms.js";

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
    expect(unknown("Tag Tage neu neues neuer gut guter Omas ab", ["tag", "neu", "gut", "oma", "ab"])).toEqual([]);
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
  it("D188: لا قائمة ضمنية في الكود — gut بطاقة في u1-d1 · تصريف jeder معلن في بطاقته (forms.declined) · جذع tun في forms.stem", () => {
    expect(words.find((x) => x.id === "gut")?.usedInLessons).toEqual(["a1-u1-d1"]);
    expect(w("jeder").forms?.declined).toEqual(["jede", "jedes", "jeden", "jedem"]);
    expect(w("tun").forms?.stem).toBe("tu");
    expect(unknown("gut guter gute", ["gut"])).toEqual([]);
    expect(unknown("gut", ["wie-gehts"])).toEqual(["gut"]);
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
  it("صفر e-upgrade-meta في كل درس مُرقّى (practice=done — كانت 11 درساً: u1-d1..u3-d3؛ منذ D194 الخطة تضم دروس التوليف وpending منها خارج هذا الفحص كما في الحارس)", () => {
    const bad = plan.lessons.filter((e) => e.practice === "done").map((e) => {
      const l = lessons.find((x) => x.id === e.lessonId)!;
      return [e.lessonId, inspectLesson(l, e, { lessons, words, tracks, rules }).meta.map((i) => i.message)] as const;
    }).filter(([, m]) => m.length);
    expect(bad).toEqual([]);
  });
});

describe("D188 — الكلمات المستعارة المعلنة (borrowedWords): الأمانة قبل الطبيعية — وللمتعلم لا للحارس وحده", () => {
  const tracks = loadAudioTracks(CONTENT);
  const rules = loadGrammarRules(CONTENT);
  const plan = loadUpgradePlans(CONTENT)[0]!;
  const u8d2 = lessons.find((l) => l.id === "a1-u8-d2")!;
  const entry = plan.lessons.find((e) => e.lessonId === "a1-u8-d2")!;
  const ctx = { lessons, words, tracks, rules };
  const inspect = (l: typeof u8d2) => inspectLesson(l, entry, ctx);
  const withBorrowed = (b: (typeof u8d2)["praesentation"]["borrowedWords"]) => ({ ...u8d2, praesentation: { ...u8d2.praesentation, borrowedWords: b } });

  it("u8-d2: «Der Verkäufer fragt den Kunden.» عادت (كانت D185 قد لوتها إلى kennt) — fragt مستعارة من fragen (u10-d3) وتمرّ بلا خطأ", () => {
    expect(u8d2.praesentation.borrowedWords).toEqual([expect.objectContaining({ form: "fragt", wordId: "fragen", ar: "يسأل" })]);
    expect(JSON.stringify(u8d2)).toContain("Der Verkäufer fragt den Kunden.");
    const r = inspect(u8d2);
    expect([r.borrowed, r.practice, r.quiz, r.meta]).toEqual([[], [], [], []]);
  });
  it("بلا الإعلان تُرفض fragt (الحارس لم يلن) — ومع إعلان كاذب يُرفض الإعلان", () => {
    expect(inspect(withBorrowed([])).practice.map((i) => i.code)).toContain("e-upgrade-front");
    const msgs = (b: Parameters<typeof withBorrowed>[0]) => inspect(withBorrowed(b)).borrowed.map((i) => i.message);
    expect(msgs([{ form: "fragt", wordId: "kennen", ar: "يعرف", whyAr: "اختبار" }]).join()).toContain("مدروسة أصلاً");
    expect(msgs([{ form: "fragt", wordId: "weit", ar: "بعيد", whyAr: "اختبار" }]).join()).toContain("ليست صيغة لبطاقة");
    expect(msgs([{ form: "weit", wordId: "weit", ar: "بعيد", whyAr: "اختبار" }]).join()).toContain("لا تظهر في نصوص الدرس");
    expect(msgs([{ form: "fragt", wordId: "xx-nicht-da", ar: "؟", whyAr: "اختبار" }]).join()).toContain("لا بطاقة");
  });
  it("القائمة الكاملة للمستعارات في المقرر — تُطبع وتُثبَّت كي لا تكبر صامتةً (≤2 لكل درس بالمخطط)", () => {
    const all = lessons.flatMap((l) => l.praesentation.borrowedWords.map((b) => [l.id, b.form, b.wordId] as const));
    console.log("borrowedWords:", JSON.stringify(all));
    for (const l of lessons) expect(l.praesentation.borrowedWords.length, l.id).toBeLessThanOrEqual(2);
    for (const l of lessons) for (const b of l.praesentation.borrowedWords) expect(b.whyAr, `${l.id} ${b.form}`).toMatch(/\p{Script=Arabic}/u);
    expect(all).toEqual([["a1-u8-d2", "fragt", "fragen"]]);
  });
});

describe("D188 — الصيغ الثابتة المعلنة من SD1 (fixedPhrases) وتوحيد منطق «الكلمة اللاحقة»", () => {
  it("قائمة fixedPhrases في خطة الترقية تُطبع وتُثبَّت (قرار المالك: العتبة ≥4 كلمات تبقى — والشائع يُعلن لا يُلوى)", () => {
    const all = loadUpgradePlans(CONTENT)[0]!.lessons.flatMap((e) => e.fixedPhrases.map((p) => [e.lessonId, p.de] as const));
    console.log("fixedPhrases:", JSON.stringify(all));
    for (const e of loadUpgradePlans(CONTENT)[0]!.lessons) expect(e.fixedPhrases.length, e.lessonId).toBeLessThanOrEqual(2);
    // D195: أول إعلان — سؤال الساعة الثابت في توليف u3 (هدف u3-d3 نفسه)؛ كل إضافة هنا قرار موثَّق لا تسريب صامت
    // D199: طلب المساعدة الثابت بـSie في لعب أدوار توليف u9 (هدف u9-d3) · «أنا في البيت» في جملة weil بتوليف u10 (u10-d5) — لا بديل طبيعي لهما
    expect(all).toEqual([["a1-u3-d6", "Wie spät ist es?"], ["a1-u9-d6", "Können Sie mir helfen?"], ["a1-u10-d6", "Ich bin zu Hause."]]);
  });
  it("check-lesson.ts يستعمل المجموعة نفسها (withLaterForms + المستعارات): u8-d2 front 0 · later 0 — لا منطق ثانٍ", () => {
    const out = execFileSync("npx", ["tsx", "tools/dev/check-lesson.ts", "a1-u8-d2", "--json"], { cwd: join(__dirname, ".."), encoding: "utf8", timeout: 120_000 });
    const r = JSON.parse(out) as { summary: { front: number; later: number } };
    expect([r.summary.front, r.summary.later]).toEqual([0, 0]);
  }, 120_000);
});
