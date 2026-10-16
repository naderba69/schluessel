// tests/word-entry.test.ts — D105: مولِّد مدخل الكلمة + الكشف الصوتي المقيس + السجل التلقائي
import { describe, it, expect, beforeEach } from "vitest";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Word, AudioManifest } from "../content/schemas/index.js";
import {
  slugify, nounGender, detectPhoneticRisks, detectGrammarRisks, cardTypesFor, clipText, srsDistance,
  plausibleRisk, reannotate, citationForm, lemmaOf,
} from "../tools/lib/word-entry.js";
import { planWord, runGenerator, phonemizeAll, auditRisks, spokenForm, type WordSpec } from "../tools/word-entry-generator.js";
import { ALL_WORDS, ALL_LESSONS } from "../src/lesson-packs.js";

// espeak يُخرج ç مفككة — الاختبار يستعمل الشكل نفسه
const C = "c\u0327";

describe("D105 — الكشف الصوتي: كل قاعدة بحالة موجبة وسالبة (IPA ثابتة)", () => {
  const risks = (de: string, ipa: string, forms: string[] = []) => detectPhoneticRisks(de, ipa, forms);

  it("ich/ach-Laut من «ch» فقط — achtzig: ch=[x] و‎-zig=[ç] ⇒ لا ich-Laut من ch", () => {
    expect(risks("das Licht", `lˈɪ${C}t`)).toEqual(["ch-ich-laut"]);
    expect(risks("lachen", "lˈaxən")).toEqual(["ch-ach-laut"]);
    expect(risks("achtzig", `ˈaxtsɪ${C}`)).toEqual(["ch-ach-laut", "ig-ending", "z"]);
    expect(risks("richtig", `ʁˈɪ${C}tɪ${C}`)).toContain("ch-ich-laut");
  });

  it("sp/st منطوقة [ʃ] فقط (يشمل جذر المركّب) — Berg وFenster لا", () => {
    expect(risks("der Bahnsteig", "bˈaːnʃtaɪk")).toEqual(["auslaut-g", "sp-st-initial", "vowel-long-short"]);
    expect(risks("der Berg", "bˈɛɾk")).toEqual(["auslaut-g"]);
    expect(risks("das Fenster", "fˈɛnstɐ")).not.toContain("sp-st-initial");
    expect(risks("das Beispiel", "bˈaɪʃpiːl")).toContain("sp-st-initial");
  });

  it("‎-ig لاحقة [ɪç] لا ‎-eig · التصلّب الأخير d/b/g (لا ‎-ng)", () => {
    expect(risks("billig", `bˈɪlɪ${C}`)).toEqual(["double-consonant", "ig-ending"]);
    expect(risks("der Bahnsteig", "bˈaːnʃtaɪk")).not.toContain("ig-ending");
    expect(risks("der Abend", "ˈaːbənt")).toContain("auslaut-d");
    expect(risks("halb", "hˈalp")).toContain("auslaut-b");
    expect(risks("lang", "lˈaŋ")).not.toContain("auslaut-g");
    // داخل الكلمة: الحرف مكتوب ونظيره المجهور غائب من النطق
    expect(risks("das Erlebnis", "ɛɾlˈeːpnɪs")).toContain("auslaut-b");
    expect(risks("das Mädchen", `mˈɛːt${C}ən`)).toContain("auslaut-d");
    expect(risks("die Wohnung", "vˈoːnʊŋ")).not.toContain("auslaut-g");
    expect(risks("das Abendessen", "ˈaːbəntˌɛsən")).toContain("auslaut-d");
    expect(risks("die Ruhe", "rˈuːə")).not.toContain("auslaut-d");
  });

  it("v-f: «v» بلا [v] منطوقة — Vase (دخيلة [v]) لا · «w» ليست v", () => {
    expect(risks("der Vater", "fˈaːtɐ")).toEqual(["r-uvular", "v-f"]);
    expect(risks("die Vase", "vˈaːzə")).not.toContain("v-f");
    expect(risks("Auf Wiedersehen", "aʊf vˈiːdɐzeːən")).not.toContain("v-f");
    // D115: [v] الآتية من «w» لا تُخفي «v» المنطوقة [f]
    expect(risks("wie viel", "viː fˈiːl")).toContain("v-f");
    expect(risks("verschwinden", "fɛɾʃvˈɪndən")).toContain("v-f");
    expect(plausibleRisk("v-f", "wie viel", "viː fˈiːl")).toBe(true);
  });

  it("الإطالة المكتوبة + «ː»: groß نعم · heiß (ثنائية) لا · gehen (h صامتة) نعم · behalten (h منطوقة) لا", () => {
    expect(risks("groß", "ɡrˈoːs")).toContain("vowel-long-short");
    expect(risks("heiß", "hˈaɪs")).not.toContain("vowel-long-short");
    expect(risks("gehen", "ɡˈeːən")).toContain("vowel-long-short");
    expect(risks("behalten", "bəhˈaltən")).not.toContain("vowel-long-short");
  });

  it("الوملاوت من الكلمة نفسها لا من صيغها (Arzt→Ärzte يغطيه plural-irregular) · äu ليست ä", () => {
    expect(risks("der Arzt", "ˈaːɐtst", ["die Ärzte"])).toEqual(["z"]);
    expect(risks("der Käse", "kˈɛːzə")).toContain("umlaut-a");
    expect(risks("aufräumen", "ˈaʊfrˌɔøman")).not.toContain("umlaut-a");
    expect(risks("früh", "frˈyː")).toContain("umlaut-u");
    expect(risks("schön", "ʃˈøːn")).toContain("umlaut-o");
  });

  it("r المُصوَّتة: ‎-er/‎-r أو ver-/er- قبل ساكن — gerade (r بداية مقطع) لا", () => {
    expect(risks("der Lehrer", "lˈeːrɐ")).toContain("r-uvular");
    expect(risks("verlieren", "fɛɾlˈiːrən")).toContain("r-uvular");
    expect(risks("gerade", "ɡərˈɑːdə")).not.toContain("r-uvular");
  });
});

describe("D105 — الكشف النحوي + المعرّف + البطاقات", () => {
  it("trennbar/reflexive/needs-ist/v2-order — «beeilt sich» ليس منفصلاً", () => {
    expect(detectGrammarRisks({ de: "anmachen", wordClass: "verb", forms: { praesens3s: "macht an", perfekt: "hat angemacht" } })).toEqual(["trennbar"]);
    expect(detectGrammarRisks({ de: "sich beeilen", wordClass: "verb", forms: { praesens3s: "beeilt sich", perfekt: "hat sich beeilt" } })).toEqual(["reflexive"]);
    expect(detectGrammarRisks({ de: "fallen", wordClass: "verb", forms: { praesens3s: "fällt", perfekt: "ist gefallen" } })).toEqual(["needs-ist"]);
    expect(detectGrammarRisks({ de: "schon", wordClass: "adverb" })).toEqual(["v2-order"]);
  });

  it("الأسماء: needs-ein للمعدود · plural-irregular (وملاوت/‎-er) · n-deklination · gender-vs-natural", () => {
    expect(detectGrammarRisks({ de: "das Licht", wordClass: "noun", plural: "die Lichter" })).toEqual(["needs-ein", "plural-irregular"]);
    expect(detectGrammarRisks({ de: "der Arzt", wordClass: "noun", plural: "die Ärzte" })).toEqual(["needs-ein", "plural-irregular"]);
    expect(detectGrammarRisks({ de: "der Kunde", wordClass: "noun", plural: "die Kunden" })).toContain("n-deklination");
    expect(detectGrammarRisks({ de: "der Student", wordClass: "noun", plural: "die Studenten" })).toContain("n-deklination");
    expect(detectGrammarRisks({ de: "das Mädchen", wordClass: "noun", plural: "die Mädchen" })).toContain("gender-vs-natural");
    expect(detectGrammarRisks({ de: "die Großeltern", wordClass: "noun", plural: "die Großeltern", pluralOnly: true })).toEqual([]);
    expect(detectGrammarRisks({ de: "die Milch", wordClass: "noun" })).toEqual([]);
  });

  it("المعرّف والأداة ونص المقطع", () => {
    expect(slugify("das Licht")).toBe("licht");
    expect(slugify("sich beeilen")).toBe("beeilen");
    expect(slugify("Auf Wiedersehen")).toBe("auf-wiedersehen");
    expect(slugify("die Straße")).toBe("strasse");
    expect(slugify("der Schlüssel")).toBe("schluessel");
    expect(nounGender("die Wohnung")).toEqual({ article: "die", gender: "die", lemma: "Wohnung" });
    expect(nounGender("lachen")).toBeNull();
    expect(clipText("das Licht")).toBe("das Licht.");
    expect(clipText("Wie geht's?")).toBe("Wie geht's?");
  });

  it("البطاقات: الاسم ⇒ gender (D57) · خطر صوتي حرج ⇒ audio · وصيغة w-srs-ratio = المدقِّق", () => {
    expect(cardTypesFor({ wordClass: "noun", gender: "das" }, ["ch-ich-laut"])).toEqual(["production", "comprehension", "gender", "audio"]);
    expect(cardTypesFor({ wordClass: "verb", gender: "none" }, ["double-consonant"])).toEqual(["production", "comprehension"]);
    expect(srsDistance([["production", "comprehension"]], { production: 0.5, comprehension: 0.4, audio: 0.1 })).toBeCloseTo(0.2, 5);
  });
});

describe("D105 — planWord: مواصفة ← كلمة كاملة صالحة", () => {
  const base: WordSpec = {
    de: "das Erlebnis", ar: ["تجربة"], wordClass: "noun", level: "A2", unit: 1, lesson: "a2-u1-d3", thema: "Vergangenheit",
    sample: { de: "Das war ein tolles Erlebnis!", ar: "كانت تجربة رائعة!" }, plural: "die Erlebnisse",
    goetheList: [], chunk: false, functionWord: false, wordFamily: [],
  };
  it("اسم: أداة/جنس/بطاقة جنس/فهرس الاستخدام — ويمر من zod", () => {
    const p = planWord(base, "ɛɾlˈeːpnɪs");
    expect(Word.parse(p.word)).toBeTruthy();
    expect(p.word).toMatchObject({ id: "erlebnis", article: "das", gender: "das", usedInLessons: ["a2-u1-d3"], level: "A2" });
    expect(p.word.srsCardTypes).toContain("gender");
    expect(p.word.phoneticRisks).toContain("r-uvular");
    expect(p.clipText).toBe("das Erlebnis.");
  });
  it("اسم بلا أداة = رفض (D57)", () => {
    expect(() => planWord({ ...base, de: "Erlebnis" }, "x")).toThrow(/بلا أداة/);
  });
  it("الإضافات اليدوية تُدمج مع المستنتج", () => {
    const p = planWord({ ...base, grammarRisks: ["feste-praep"] }, "ɛɾlˈeːpnɪs");
    expect(p.word.grammarRisks).toEqual(["feste-praep", "needs-ein"]);
  });
  it("D136: الجمع فقط لا يولّد needs-ein ولا بطاقة جنس مفرد، وتبقى الأداة والجمع", () => {
    const p = planWord({
      ...base,
      de: "die Großeltern", ar: ["الأجداد"], level: "A1", unit: 4, lesson: "a1-u4-d1", thema: "Familie",
      sample: { de: "Die Großeltern sind hier.", ar: "الأجداد هنا." },
      plural: "die Großeltern", pluralRuleNote: "جمع فقط؛ لا مفرد لهذه الصيغة.", pluralOnly: true,
      grammarRisks: ["plural-irregular"],
    }, "ɡʁˈoːsʔɛltɐn");
    expect(p.word.grammarRisks).toEqual(["plural-irregular"]);
    expect(p.word).toMatchObject({ article: "die", gender: "none", plural: "die Großeltern" });
    expect(p.word.srsCardTypes).not.toContain("gender");
  });
});

describe("D105 — runGenerator على شجرة مؤقتة (نطق ومقطع وهميان)", () => {
  let root: string;
  let py: string;
  const fakeIpa = (texts: string[]) => texts.map(() => "ɛɾlˈeːpnɪs");
  const okClip = () => ({ durationMs: 900, sizeBytes: 4000, hash: "sha256:abc", pcmSha256: "def", rmsDb: -17 });
  const spec = {
    de: "das Erlebnis", ar: ["تجربة"], wordClass: "noun", level: "A2", unit: 1, lesson: "a2-u1-d3", thema: "Vergangenheit",
    sample: { de: "Das war ein tolles Erlebnis!", ar: "كانت تجربة رائعة!" }, plural: "die Erlebnisse",
  };
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), "wordgen-"));
    mkdirSync(join(root, "words"), { recursive: true });
    mkdirSync(join(root, "manifests"), { recursive: true });
    writeFileSync(join(root, "manifests/audio-manifest.a1-u1.json"), JSON.stringify({
      schemaVersion: "1.0.0", generator: "piper-tts-local", voiceLicense: "CC0",
      characterVoices: Object.fromEntries(["yusuf", "mueller", "lena", "ayse", "frau-berg", "thomas", "frau-schmidt", "dr-weber"].map((c) => [c, "de_DE-thorsten-medium"])),
      tracks: [
        { id: "word-alt", file: "words/audio/de-DE/word-alt.opus", role: "word", isGuest: false, voiceParams: { speaker: "de_DE-thorsten-medium", speedWpm: 110 }, textDe: "alt.", priority: "P2", lessonRefs: [] },
        { id: "mueller-announce-01", file: "audio/characters/m.opus", role: "announcement", characterId: "mueller", isGuest: false, voiceParams: { speaker: "de_DE-thorsten-medium", speedWpm: 130 }, textDe: "Hallo!", priority: "P0", lessonRefs: [] },
      ],
    }, null, 2) + "\n");
    py = join(root, "gen-audio.py");
    writeFileSync(py, 'word_tracks = [\n    ("word-alt", "alt.", "alt", []),\n    ]\n    char_tracks = [\n]\n');
  });

  it("يكتب الكلمة + مسارها بين مسارات الكلمات (قبل الإعلان) + سطرها في gen-audio — والمانيفست صالح", () => {
    const r = runGenerator({ specs: [spec], contentRoot: root, phonemize: fakeIpa, clip: okClip, genAudioPy: py });
    expect(r.written).toBe(true);
    const w = Word.parse(JSON.parse(readFileSync(join(root, "words/erlebnis.json"), "utf8")));
    expect(w.id).toBe("erlebnis");
    const m = AudioManifest.parse(JSON.parse(readFileSync(join(root, "manifests/audio-manifest.a1-u1.json"), "utf8")));
    expect(m.tracks.map((t) => t.id)).toEqual(["word-alt", "word-erlebnis", "mueller-announce-01"]);
    expect(m.tracks[1]!.textDe).toBe("das Erlebnis.");
    expect(readFileSync(py, "utf8")).toContain('("word-erlebnis", "das Erlebnis.", "erlebnis", ["a2-u1-d3"]),');
  });

  it("--dry-run لا يكتب شيئاً · كلمة موجودة = رفض · مقطع طويل يُعاد ثم يُرفض بلا كتابة", () => {
    const dry = runGenerator({ specs: [spec], contentRoot: root, phonemize: fakeIpa, clip: okClip, genAudioPy: py, dryRun: true });
    expect(dry.written).toBe(false);
    expect(readdirSync(join(root, "words"))).toEqual([]);
    let calls = 0;
    const long = () => (calls++, { ...okClip(), durationMs: 1800 });
    expect(() => runGenerator({ specs: [spec], contentRoot: root, phonemize: fakeIpa, clip: long, genAudioPy: py })).toThrow(/أطول/);
    expect(calls).toBe(3);
    expect(existsSync(join(root, "words/erlebnis.json"))).toBe(false);
    runGenerator({ specs: [spec], contentRoot: root, phonemize: fakeIpa, clip: okClip, genAudioPy: py });
    expect(() => runGenerator({ specs: [spec], contentRoot: root, phonemize: fakeIpa, clip: okClip, genAudioPy: py })).toThrow(/موجودة/);
  });

  it("مواصفة ناقصة أو حقل مجهول = رفض برسالة واضحة", () => {
    expect(() => runGenerator({ specs: [{ ...spec, ar: [] }], contentRoot: root, phonemize: fakeIpa, clip: okClip, genAudioPy: py })).toThrow(/غير صالحة/);
    expect(() => runGenerator({ specs: [{ ...spec, colour: "blau" }], contentRoot: root, phonemize: fakeIpa, clip: okClip, genAudioPy: py })).toThrow(/غير صالحة/);
  });

  it("D126 المتجانسان: das Leben بجانب الفعل leben — المعرّف الصريح يُكتب ملفاً ومساراً وسطراً · ويُرفض حين لا تجانس أو يساوي الآلي أو لا يحويه", () => {
    const leben = { ...spec, de: "das Leben", ar: ["الحياة"], unit: 2, lesson: "a1-u2-d2", level: "A1", sample: { de: "Das Leben ist neu.", ar: "الحياة جديدة." }, plural: undefined };
    const run = (s: object) => runGenerator({ specs: [s], contentRoot: root, phonemize: fakeIpa, clip: okClip, genAudioPy: py });
    // المعرّف الآلي «leben» حر بعد ⇒ الصريح مرفوض (لا تسمية حرة)
    expect(() => run({ ...leben, id: "das-leben" })).toThrow(/بلا تجانس/);
    writeFileSync(join(root, "words/leben.json"), JSON.stringify({ id: "leben", de: "leben", level: "A1", srsCardTypes: ["production", "comprehension"] }) + "\n");
    expect(() => run(leben)).toThrow(/موجودة: leben/); // بلا id: الآلي يصطدم بالفعل
    expect(() => run({ ...leben, id: "leben" })).toThrow(/يساوي الآلي/);
    expect(() => run({ ...leben, id: "das-dasein" })).toThrow(/لا يحوي «leben»/);
    expect(() => run({ ...leben, id: "Das_Leben" })).toThrow(/غير صالحة/);
    const r = run({ ...leben, id: "das-leben" });
    expect(r.planned[0]!.word.id).toBe("das-leben");
    expect(Word.parse(JSON.parse(readFileSync(join(root, "words/das-leben.json"), "utf8"))).de).toBe("das Leben");
    const m = AudioManifest.parse(JSON.parse(readFileSync(join(root, "manifests/audio-manifest.a1-u1.json"), "utf8")));
    expect(m.tracks.find((x) => x.id === "word-das-leben")?.textDe).toBe("das Leben.");
    expect(readFileSync(py, "utf8")).toContain('("word-das-leben", "das Leben.", "das-leben", ["a1-u2-d2"]),');
  });

  it("D140: الشرح بين القوسين («ihr (ملكيتها)» على اصطلاح «sein (ملكيته)») لا يُنطق ولا يدخل المقطع ولا المعرّف — وحقل de يبقى كما هو", () => {
    const seen: string[] = [];
    const spy = (texts: string[]) => { seen.push(...texts); return texts.map(() => "ˈiːɾ"); };
    const ihr = {
      ...spec, de: "ihr (ملكيتها)", ar: ["ـها (ملكها)"], wordClass: "pronoun", level: "A1", unit: 4, lesson: "a1-u4-d5", thema: "Besitz",
      sample: { de: "Ihr Mann ist Lehrer.", ar: "زوجها معلّم." }, plural: undefined, functionWord: true, chunk: true,
    };
    const r = runGenerator({ specs: [ihr], contentRoot: root, phonemize: spy, clip: okClip, genAudioPy: py });
    expect(seen).toEqual(["ihr"]); // كان «ihr (ملكيتها)» كاملاً — العربية إلى espeak
    expect(r.planned[0]!.word).toMatchObject({ id: "ihr", de: "ihr (ملكيتها)", isFunctionWord: true });
    expect(r.planned[0]!.clipText).toBe("ihr.");
    const m = AudioManifest.parse(JSON.parse(readFileSync(join(root, "manifests/audio-manifest.a1-u1.json"), "utf8")));
    expect(m.tracks.find((x) => x.id === "word-ihr")?.textDe).toBe("ihr.");
    expect(readFileSync(py, "utf8")).toContain('("word-ihr", "ihr.", "ihr", ["a1-u4-d5"]),');
    // الشرح وحده يسقط: البدائل «/» تبقى كما كانت (المقطع ينطقها كلها) · والمعرّف الآلي لا يأخذ حروف الشرح
    expect(spokenForm("am (an + dem)")).toBe("am");
    expect(spokenForm("Entschuldigung / Entschuldigen Sie")).toBe("Entschuldigung / Entschuldigen Sie");
    expect(planWord({ ...(ihr as WordSpec), de: "am (an + dem)", wordClass: "preposition" }, "ˈam").word.id).toBe("am");
  });
});

describe("D105 — تكامل حقيقي + السجل التلقائي", () => {
  it("phonemize الحقيقي (الصوت المثبَّت) + الكاشف: das Licht ⇒ ich-Laut", () => {
    const [ipa] = phonemizeAll(["Licht"]);
    expect(detectPhoneticRisks("das Licht", ipa!)).toContain("ch-ich-laut");
  });

  it("السجل تلقائي: كل ملف كلمة/درس مُسجَّل — لا أكثر ولا أقل", () => {
    const words = readdirSync(join(process.cwd(), "content/words")).filter((f) => f.endsWith(".json"));
    expect(ALL_WORDS.map((w) => `${w.id}.json`).sort()).toEqual(words.sort());
    const lessonFiles = ["a1", "a2"].flatMap((lvl) => {
      const d = join(process.cwd(), "content/lessons", lvl);
      return existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(".json")) : [];
    });
    expect(ALL_LESSONS.length).toBe(lessonFiles.length);
  });
});

describe("D106 — إعادة وسم أعلام الخطر: المكتشَف ∪ القديم الممكن + حارس دائم", () => {
  it("الإمكان: sp-st على Berg مستحيل · v-f على Straße مستحيل · طول على schon ممكن (حكم يدوي معقول)", () => {
    expect(plausibleRisk("sp-st-initial", "der Berg", "bˈɛɾk")).toBe(false);
    expect(plausibleRisk("v-f", "die Straße", "ʃtrˈɑːsə")).toBe(false);
    expect(plausibleRisk("ch-ich-laut", "die Brücke", "brˈʏkə")).toBe(false);
    expect(plausibleRisk("vowel-long-short", "schon", "ʃˈoːn")).toBe(true);
    expect(plausibleRisk("umlaut-u", "die Ankunft", "ˈankʊnft")).toBe(false); // ü في الجمع فقط
  });

  it("reannotate: يُسقط المستحيل ويضيف المقيس ويُبقي الممكن", () => {
    expect(reannotate(["sp-st-initial"], ["auslaut-g"], "der Berg", "bˈɛɾk")).toEqual({ risks: ["auslaut-g"], added: ["auslaut-g"], removed: ["sp-st-initial"] });
    expect(reannotate(["vowel-long-short"], [], "schon", "ʃˈoːn")).toEqual({ risks: ["vowel-long-short"], added: [], removed: [] });
    expect(citationForm("der Morgen / morgen")).toBe("der Morgen");
    expect(citationForm("am (an + dem)")).toBe("am");
  });

  it("الحارس على كل كلمات المحتوى: كل علَم مقيس موجود + لا علَم مستحيل (لا تدقيق يبقى معلّقاً)", () => {
    const rows = auditRisks();
    expect(rows.length).toBe(ALL_WORDS.length);
    const pending = rows.filter((r) => r.added.length || r.removed.length).map((r) => `${r.de}: −${r.removed} +${r.added}`);
    expect(pending).toEqual([]);
    for (const w of ALL_WORDS) {
      const row = rows.find((r) => r.id === w.id)!;
      for (const risk of w.phoneticRisks) expect(plausibleRisk(risk, citationForm(w.de), row.ipa), `${w.id}: ${risk}`).toBe(true);
      expect(lemmaOf(citationForm(w.de)).length).toBeGreaterThan(0);
    }
  }, 60_000);
});
