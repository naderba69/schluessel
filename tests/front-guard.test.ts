// tests/front-guard.test.ts — قانون الجبهة بعد D185 (N-103 + N-112 + N-022 بإذن المالك D182)
// N-103 (2): الجذع المشتق القصير (≤3) لا يدخل إلا من فعل وبنهاية فعل — «wei» من Wein لا يمرّر weit.
// N-103 (1): صيغة كلمة درسٍ لاحق تُرفض ولو طابقت جذعاً (fragt قبل fragen عبر Frage) — إلا كاملة مدروسة (+نهاية) أو جذع فعل مدروس + نهاية فعل.
// N-112: الفعل القصير tun ⇒ tue/tust · وhattest/hattet/warst/wart مغلقة. · N-022: meta الدروس المُرقّاة تحت الجبهة.
import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { loadAudioTracks, loadGrammarRules, loadLessons, loadUpgradePlans, loadWords } from "../tools/lib/content-disk.js";
import { inspectLesson, metaOf, taughtUpTo, lessonGermanStrings } from "../tools/lib/lesson-upgrade.js";
import { CLOSED, knownStems, knownForms, contentTokens, deumlaut, stemKnown, unknownTokens, withLaterForms, stripMorphemeNotation, stripGraphemeNotation } from "../tools/lib/vocab-forms.js";

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
  it("D349: musste/musstest/musstet/mussten مغلقة (تعرُّض Präteritum-d4 كأخواتها war/hatte)", () => {
    for (const f of ["musste", "musstest", "musstet", "mussten"]) expect(CLOSED.has(f), f).toBe(true);
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
  it("D212: أمر drucken مسجَّل كاملاً (Druck!) — بدونه صيغة drücken اللاحقة (u14-d3) تكسر meta درس u13-d5 («Druck ihn!»)", () => {
    expect(w("drucken").forms?.imperative).toBe("druck!");
    const d5 = lessons.find((l) => l.id === "a1-u13-d5")!;
    const t = taughtUpTo(d5, lessons, words);
    expect(unknownTokens("Druck ihn!", withLaterForms(knownStems(t), t, words))).toEqual([]);
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
  it("D213: u8-d3 تستعير hinten (تُدرَّس u14-d4) — كانت تمرّ بجذع hinter (hint) فكشفتها صيغة <hinten اللاحقة", () => {
    const l = lessons.find((x) => x.id === "a1-u8-d3")!;
    expect(l.praesentation.borrowedWords).toEqual([expect.objectContaining({ form: "hinten", wordId: "hinten" })]);
    expect(JSON.stringify(l)).toContain("Dort hinten.");
    const e = plan.lessons.find((x) => x.lessonId === "a1-u8-d3")!;
    const r = inspectLesson(l, e, ctx);
    expect([r.borrowed, r.practice, r.quiz, r.meta]).toEqual([[], [], [], []]);
  });
  it("القائمة الكاملة للمستعارات في المقرر — تُطبع وتُثبَّت كي لا تكبر صامتةً (≤2 لكل درس بالمخطط)", () => {
    const all = lessons.flatMap((l) => l.praesentation.borrowedWords.map((b) => [l.id, b.form, b.wordId] as const));
    console.log("borrowedWords:", JSON.stringify(all));
    for (const l of lessons) expect(l.praesentation.borrowedWords.length, l.id).toBeLessThanOrEqual(2);
    for (const l of lessons) for (const b of l.praesentation.borrowedWords) expect(b.whyAr, `${l.id} ${b.form}`).toMatch(/\p{Script=Arabic}/u);
    expect(all).toEqual([["a1-u8-d2", "fragt", "fragen"], ["a1-u8-d3", "hinten", "hinten"], ["a1-u8-d5", "Bäcker", "baecker"], ["a2-u2-d4", "geehrter", "geehrte"]]); // D213: hinten · D383: Bäcker (beim-Bäcker في u8-d5 — تُدرَّس a2-u10-d2!) · D385: geehrter (Sehr-geehrter-Herr-Chef في u2-d4 — تُدرَّس a2-u10-d4!)
  });
});

describe("D188 — الصيغ الثابتة المعلنة من SD1 (fixedPhrases) وتوحيد منطق «الكلمة اللاحقة»", () => {
  it("قائمة fixedPhrases في خطة الترقية تُطبع وتُثبَّت (قرار المالك: العتبة ≥4 كلمات تبقى — والشائع يُعلن لا يُلوى)", () => {
    const all = loadUpgradePlans(CONTENT)[0]!.lessons.flatMap((e) => e.fixedPhrases.map((p) => [e.lessonId, p.de] as const));
    console.log("fixedPhrases:", JSON.stringify(all));
    for (const e of loadUpgradePlans(CONTENT)[0]!.lessons) expect(e.fixedPhrases.length, e.lessonId).toBeLessThanOrEqual(2);
    // D195: أول إعلان — سؤال الساعة الثابت في توليف u3 (هدف u3-d3 نفسه)؛ كل إضافة هنا قرار موثَّق لا تسريب صامت
    // D199: طلب المساعدة الثابت بـSie في لعب أدوار توليف u9 (هدف u9-d3) · «أنا في البيت» في جملة weil بتوليف u10 (u10-d5) — لا بديل طبيعي لهما
    // D226 (N-113): اكتمال الإعلان — دروس التعليم نفسها (u1-d5 سؤال الأصل · u3-d3 الساعة · u3-d5 التمهل · u9-d3 المساعدة وتنويعتها · u10-d5 مركبة weil) + حوار مسجل لا يُعاد (u13-d6 eb-18)
    expect(all).toEqual([["a1-u1-d5", "Woher kommen Sie?"], ["a1-u3-d3", "Wie spät ist es?"], ["a1-u3-d5", "Bitte nicht so schnell!"], ["a1-u9-d3", "Können Sie mir helfen?"], ["a1-u9-d3", "Können Sie mir bitte helfen?"], ["a1-u10-d5", "Ich bin zu Hause."], ["a1-u3-d6", "Wie spät ist es?"], ["a1-u9-d6", "Können Sie mir helfen?"], ["a1-u10-d6", "Ich bin zu Hause."], ["a1-u13-d6", "Das ist sehr nett von dir!"]]);
  });
  it("check-lesson.ts يستعمل المجموعة نفسها (withLaterForms + المستعارات): u8-d2 front 0 · later 0 — لا منطق ثانٍ", () => {
    const out = execFileSync("npx", ["tsx", "tools/dev/check-lesson.ts", "a1-u8-d2", "--json"], { cwd: join(__dirname, ".."), encoding: "utf8", timeout: 120_000 });
    const r = JSON.parse(out) as { summary: { front: number; later: number } };
    expect([r.summary.front, r.summary.later]).toEqual([0, 0]);
  }, 120_000);
});

describe("N-060 (D226) — ثقوب الجذوع معلنة لا صامتة: لقطة أزواج جذوع-القطع + الثقب المركّب الموثّق", () => {
  // الرمز المقبول بجذع وحده (لا صيغة مسجلة) إما تصريف حقيقي (ممرَّر بنيوياً: له كلمة غير-قطعة) أو في اللقطة؛
  // أي رمز جديد بجذع قطعة وحده يكسر هنا للفرز (إصلاح أو إعلان). والجذر المركّب المشترك (lernen ⇐ kennenlernen)
  // حدٌّ بنيوي (لا فاصل مركّبات) فموضعه الحي معلن. الفحص الكامل: npx tsx tools/dev/measure-stems.ts
  const CHUNK_SOLE = [ // [درس, رمز]: «الكل جاهز؟» ×12 (تُقرأ عبر Alles-klar) + wehe (مشتت إملائي مقصود u11-d6)
    // + ihrer (تصريف جدول الضمير المحفوظ) + viele ×2 (جمع طبيعي: Länder/Menschen — سابقة D224)
    ["a1-u1-d6", "alle"], ["a1-u11-d1", "alle"], ["a1-u11-d5", "alle"], ["a1-u11-d6", "wehe"],
    ["a1-u12-d1", "alle"], ["a1-u12-d3", "alle"], ["a1-u13-d1", "alle"], ["a1-u13-d1", "ihrer"], ["a1-u13-d2", "alle"],
    ["a1-u13-d4", "alle"], ["a1-u14-d6", "alle"], ["a1-u15-d6", "alle"], ["a1-u2-d1", "viele"], ["a1-u2-d2", "viele"], ["a1-u2-d4", "alle"], ["a1-u8-d3", "alle"],
  ].map(([l, t]) => `${l} :: ${t}`).sort();
  const KNOWN_COMPOUND = ["a1-u2-d5 :: lernen"]; // split-chunk موثّق في ars-kennenlernen («نحفظهما قطعتين كاملتين») — الإصلاح مرفوض: حِمل تعليمي
  let cache: { chunkSole: string[]; indirectAt: (l: string) => Set<string> } | undefined;
  const holes = () => {
    if (cache) return cache;
    const plan = loadUpgradePlans(CONTENT)[0]!.lessons;
    const doneIds = new Set(plan.filter((e) => e.rule === "done").map((e) => e.lessonId));
    const wStems = new Map(words.map((x) => [x.id, knownStems([x])]));
    const byId = new Map(words.map((x) => [x.id, x]));
    const chunkSole = new Set<string>();
    const perLesson = new Map<string, Set<string>>();
    for (const l of lessons.filter((x) => doneIds.has(x.id))) {
      const e = plan.find((x) => x.lessonId === l.id);
      const allow = new Set((e?.properNouns ?? []).flatMap((n) => contentTokens(n)));
      const taught = taughtUpTo(l, lessons, words);
      const horizon = knownStems(taught);
      const direct = new Set([...taught.flatMap((x) => knownForms(x).map(deumlaut)), ...CLOSED, ...allow]);
      const lines = lessonGermanStrings(l);
      for (const f of readdirSync(join(CONTENT, "audio-scripts"))) {
        if (!f.startsWith(`${l.id}-`) || !f.endsWith(".json")) continue;
        const s = JSON.parse(readFileSync(join(CONTENT, "audio-scripts", f), "utf8")) as { lines?: { textDe?: string; text?: string }[] };
        for (const ln of s.lines ?? []) { const t = ln.textDe ?? ln.text; if (t) lines.push(t); }
      }
      const ind = new Set<string>();
      for (const line of lines) {
        const de = stripGraphemeNotation(stripMorphemeNotation(line.replace(/~~/g, " ")));
        for (const t of contentTokens(de)) {
          const d = deumlaut(t);
          if (direct.has(d) || !stemKnown(d, horizon) || ind.has(d)) continue;
          ind.add(d);
          const via = taught.filter((x) => stemKnown(d, wStems.get(x.id)!));
          if (via.length > 0 && via.every((x) => byId.get(x.id)!.chunk)) chunkSole.add(`${l.id} :: ${d}`);
        }
      }
      perLesson.set(l.id, ind);
    }
    cache = { chunkSole: [...chunkSole].sort(), indirectAt: (x) => perLesson.get(x) ?? new Set() };
    return cache;
  };
  it("الرموز المقبولة بجذع قطعة وحده = اللقطة المعلنة لا غير", () => {
    expect(holes().chunkSole).toEqual(CHUNK_SOLE);
  });
  it("الثقب المركّب الموثّق حي في موضعه", () => {
    for (const pair of KNOWN_COMPOUND) {
      const [l, t] = pair.split(" :: ");
      expect(holes().indirectAt(l!).has(t!), pair).toBe(true);
    }
  });
});
