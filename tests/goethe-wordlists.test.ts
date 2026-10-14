// tests/goethe-wordlists.test.ts — D110: goetheList دليلٌ لا رأي (قوائم Goethe الرسمية الثلاث)
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { OfficialWordlist, Word, type WordlistEntry } from "../content/schemas/index.js";
import { loadWordlists, loadWords } from "../tools/lib/content-disk.js";
import {
  deriveGoetheList, evidenceFor, evidenceIn, indexWordlist, indexWordlists, pluralsFor, sameLevels, type WordLike,
} from "../tools/lib/goethe-lists.js";
import { validateContentTree, type ContentEntry } from "../tools/validate-content.js";
import { runGenerator } from "../tools/word-entry-generator.js";
import { auditGoethe } from "../tools/goethe-audit.js";

const C = join(process.cwd(), "content");
const LISTS = loadWordlists(C);
const byId = Object.fromEntries(LISTS.map((l) => [l.id, l]));
const IXS = indexWordlists(LISTS);

describe("D110 — الفهارس الثلاثة: مصدر موثَّق وكلمات رئيسية فقط", () => {
  it("SD1 + Fit1 (A1) + A2 — بأعداد الاستخراج المثبَّتة (أي تغيير في المستخرِج يظهر هنا)", () => {
    expect(LISTS.map((l) => [l.id, l.level])).toEqual([["goethe-a1-fit1", "A1"], ["goethe-a1-sd1", "A1"], ["goethe-a2", "A2"]]);
    expect(byId["goethe-a1-sd1"]!.counts).toEqual({ main: 626, sub: 58, group: 127 });
    expect(byId["goethe-a2"]!.counts).toEqual({ main: 1159, sub: 0, group: 247 });
    expect(byId["goethe-a1-fit1"]!.counts).toEqual({ main: 531, sub: 0, group: 170 });
    for (const l of LISTS) expect(new URL(l.officialUrl).hostname).toBe("www.goethe.de");
  });

  it("بصمة الملف الرسمي مثبَّتة (sha256 + git blob) — وFit1 منسوخ يدوياً ومعلن، وJSON مطابق لملف النسخ", () => {
    const sd1 = byId["goethe-a1-sd1"]!.source;
    expect([sd1.method, sd1.gitBlob, sd1.sha256, sd1.pages, sd1.pdfTitle]).toEqual([
      "pdf-extract", "0c8162cb3c82ea0088dae3ee1008829e93d593ad",
      "45fb648bc0ac02338f7898cae065953e320ab72ed0c14e13e0deffe6f1c5d64e", 29, "A1_SD1_Wortliste_02.indd",
    ]);
    const a2 = byId["goethe-a2"]!.source;
    expect([a2.method, a2.gitBlob, a2.pages, a2.pdfTitle]).toEqual([
      "pdf-extract", "c4f7e2bf15e8045b903559668840d6d2d6d75e16", 32, "Goethe-Zertifikat_A2_Wortliste_2016_03.qxp_A2_2015",
    ]);
    const fit1 = byId["goethe-a1-fit1"]!.source;
    expect(fit1.method).toBe("manual-transcription");
    const transcript = readFileSync(join(process.cwd(), fit1.transcript!));
    expect(createHash("sha256").update(transcript).digest("hex")).toBe(fit1.transcriptSha256);
    // ملف النسخ: كلمات رئيسية فقط — لا سطر يشبه جملة مثال
    for (const line of transcript.toString("utf8").split("\n").filter((l) => l && !l.startsWith("#") && !l.startsWith("@")))
      expect(/[.?!]$/.test(line.trim()) && line.trim().split(/\s+/).length >= 3, line).toBe(false);
  });

  it("لا جمل أمثلة في المستودع (حقوق النشر): كل مدخل قصير بلا علامة نهاية جملة", () => {
    for (const l of LISTS)
      for (const e of l.entries) {
        expect(e.headword.length).toBeLessThanOrEqual(120);
        expect(/[.?!]$/.test(e.headword) && e.headword.split(" ").length >= 3 && !/(z\. B\.|ca\.|usw\.)$/.test(e.headword), e.headword).toBe(false);
      }
  });

  it("المخطط يرفض جملة مثال وعدّاً لا يطابق المداخل واستخراجاً بلا بصمة", () => {
    const base = structuredClone(byId["goethe-a1-sd1"]!) as unknown as Record<string, unknown> & { entries: WordlistEntry[]; counts: { main: number }; source: Record<string, unknown> };
    const withSentence = structuredClone(base);
    withSentence.entries[0] = { ...withSentence.entries[0]!, headword: "Ab morgen muss ich arbeiten." };
    expect(OfficialWordlist.safeParse(withSentence).success).toBe(false);
    const badCount = structuredClone(base);
    badCount.counts.main += 1;
    expect(OfficialWordlist.safeParse(badCount).success).toBe(false);
    const noHash = structuredClone(base);
    delete noHash.source.sha256;
    expect(OfficialWordlist.safeParse(noHash).success).toBe(false);
  });

  it("المستخرِج حتمي: Fit1 يُعاد بناؤه من ملف النسخ فيطابق المحفوظ (--check)", () => {
    let py = "";
    try { py = execFileSync("python3", ["--version"], { encoding: "utf8" }); } catch { /* لا بايثون */ }
    if (!py) return;
    const out = execFileSync("python3", ["tools/goethe-wordlist.py", "--fit1", "--check"], { encoding: "utf8" });
    expect(out).toContain("مطابق");
  });
});

// ——— قائمة اصطناعية صغيرة: كل نوع دليل بحالة موجبة وسالبة ———
const SYN = {
  schemaVersion: "1.0.0", id: "syn-a1", level: "A1", exam: "x", title: "x", publisher: "Goethe-Institut",
  officialUrl: "https://www.goethe.de/x.pdf", statedEntries: null,
  source: { method: "manual-transcription", file: "x.pdf", transcript: "x.txt", pages: 1, extractor: "test", obtainedVia: "test", verifiedAgainst: "test" },
  openCategories: [{ id: "herkunft", group: "Länder", page: 8, note: "Angabe der eigenen Herkunft" }],
};
function synList(entries: Partial<WordlistEntry>[]) {
  const full = entries.map((e) => ({ page: 9, kind: "main", ...e }) as WordlistEntry);
  const filler = Array.from({ length: 100 }, (_, i) => ({ headword: `füll${i}`, lemmas: [`füll${i}`], page: 30, kind: "main" }) as WordlistEntry);
  const all = [...full, ...filler];
  return OfficialWordlist.parse({ ...SYN, entries: all, counts: {
    main: all.filter((e) => e.kind === "main").length, sub: all.filter((e) => e.kind === "sub").length, group: all.filter((e) => e.kind === "group").length,
  } });
}
const W = (de: string, wordClass = "noun", article?: string, chunk = false): WordLike => ({ de, wordClass, article, chunk });

describe("D110 — المطابقة: كل نوع دليل", () => {
  const ix = indexWordlist(synList([
    { headword: "der Arzt, -Ä, e", lemmas: ["Arzt"], article: "der" },
    { headword: "die Abfahrt", lemmas: ["Abfahrt"], article: "die", kind: "sub" },
    { headword: "der Montag", lemmas: ["Montag"], article: "der", kind: "group", group: "Wochentage" },
    { headword: "am Wochenende", lemmas: ["am Wochenende"], kind: "group", group: "Wochentage" },
    { headword: "die Nudel, -n", lemmas: ["Nudel"], article: "die" },
    { headword: "an", lemmas: ["an"] },
    { headword: "all-", lemmas: ["all-"] },
    { headword: "Lieblings-", lemmas: ["Lieblings-"] },
    { headword: "die Farbe, -n", lemmas: ["Farbe"], article: "die" },
    { headword: "gut", lemmas: ["gut"] },
    { headword: "der Tag, -e", lemmas: ["Tag"], article: "der" },
    { headword: "bitte", lemmas: ["bitte"] },
    { headword: "die Bitte, -n", lemmas: ["Bitte"], article: "die", kind: "sub" },
    { headword: "essen", lemmas: ["essen"] },
    { headword: "spazieren gehen", lemmas: ["spazieren gehen"] },
    { headword: "weh tun", lemmas: ["weh tun"] },
    { headword: "der See, -n", lemmas: ["See"], article: "der" },
    { headword: "s Mal, -e", lemmas: ["Mal"], article: "das" },
    { headword: "das Wiedersehen", lemmas: ["Wiedersehen"], article: "das" },
    { headword: "auf", lemmas: ["auf"] },
  ]));
  const kind = (w: WordLike) => evidenceIn(w, ix)?.kind ?? null;

  it("مدخل رئيسي · فرعي · مجموعة — والاسم يحتاج حرفاً كبيراً وأداة متوافقة", () => {
    expect(kind(W("der Arzt", "noun", "der"))).toBe("entry");
    expect(kind(W("die Abfahrt", "noun", "die"))).toBe("sub");
    expect(kind(W("der Montag", "noun", "der"))).toBe("group");
    expect(kind(W("das Essen", "noun", "das"))).toBeNull(); // «essen» فعل لا يُثبت الاسم
    expect(kind(W("essen", "verb"))).toBe("entry");
    expect(kind(W("die See", "noun", "die"))).toBeNull(); // der See ≠ die See
    expect(kind(W("wehtun", "verb"))).toBe("entry"); // weh tun = wehtun (بلا مسافة)
    expect(kind(W("mal", "particle"))).toBeNull(); // الأداة mal ليست الاسم das Mal
    expect(kind(W("das Mal", "noun", "das"))).toBe("entry");
  });

  it("مؤنث اسم مُدرج (Vorwort SD1) · جمع محسوب من علامة القائمة · دمج حرف الجر · الاسم في عبارة", () => {
    expect(evidenceIn(W("die Ärztin", "noun", "die"), ix)).toMatchObject({ kind: "feminine", via: "Arzt" });
    expect(evidenceIn(W("die Nudeln", "noun", "die"), ix)).toMatchObject({ kind: "plural" });
    expect(evidenceIn(W("am (an + dem)", "preposition"), ix)).toMatchObject({ kind: "contraction" });
    expect(evidenceIn(W("das Wochenende", "noun", "das"), ix)).toMatchObject({ kind: "group", via: "Wochenende ← am Wochenende" });
  });

  it("جذع بشرطة + تصريف · Lieblings- + اسم مُدرج · تلازم (spazieren ← spazieren gehen)", () => {
    expect(kind(W("alle", "pronoun"))).toBe("stem");
    expect(kind(W("alles", "pronoun"))).toBe("stem");
    expect(kind(W("allein", "adverb"))).toBeNull(); // all + ein ليست لاحقة تصريف
    expect(kind(W("die Lieblingsfarbe", "noun", "die"))).toBe("stem");
    expect(kind(W("spazieren", "verb"))).toBe("stem");
  });

  it("القطعة: كل كلماتها مُدرجة (Guten Tag) — والقطعة «Bitte» تطابق bitte لا الاسم", () => {
    expect(evidenceIn(W("Guten Tag", "chunk", undefined, true), ix)).toMatchObject({ kind: "composed", via: "gut + der Tag, -e" });
    expect(kind(W("Guten Abend", "chunk", undefined, true))).toBeNull(); // Abend غير مُدرج هنا
    expect(evidenceIn(W("Bitte", "chunk", undefined, true), ix)).toMatchObject({ kind: "entry", headword: "bitte" });
    // الكلمة الأولى كبيرة لبداية الجملة · والاسم داخل القطعة يطابق اسماً
    expect(evidenceIn(W("Auf Wiedersehen", "chunk", undefined, true), ix)).toMatchObject({ kind: "composed", via: "auf + das Wiedersehen" });
  });

  it("Herkunft: أسماء البلدان + لغة جمهورنا فقط — لا لغات أخرى ولا مركّبات ولا مشتقات", () => {
    expect(kind(W("Tunesien", "noun"))).toBe("herkunft");
    expect(kind(W("Arabisch", "noun", "das"))).toBe("herkunft");
    expect(kind(W("Französisch", "noun", "das"))).toBeNull();
    expect(kind(W("die Fremdsprache", "noun", "die"))).toBeNull();
    const noOpen = indexWordlist({ ...synList([{ headword: "gut", lemmas: ["gut"] }]), openCategories: [] });
    expect(evidenceIn(W("Tunesien", "noun"), noOpen)).toBeNull(); // A2 لا فئة مفتوحة فيها
  });

  it("لا دليل للمركّب ولا للمشتق غير المُدرج (Abendessen · Erkältung) — السياسة: الدليل الصريح وحده", () => {
    expect(kind(W("das Abendessen", "noun", "das"))).toBeNull();
    expect(kind(W("die Erkältung", "noun", "die"))).toBeNull();
  });
});

describe("D110 — الجمع من علامة القائمة (الأساليب الثلاثة) ولا تخمين", () => {
  const e = (headword: string, lemma: string, article = "der"): WordlistEntry => ({ headword, lemmas: [lemma], article, page: 1, kind: "main" });
  it.each([
    ["die Nudel, -n", "Nudel", "Nudeln"], ["der Kühlschrank, ¨-e", "Kühlschrank", "Kühlschränke"],
    ["der Arbeitsplatz, -ä, e", "Arbeitsplatz", "Arbeitsplätze"], ["der Apfel, -Ä", "Apfel", "Äpfel"],
    ["r Kopf, ö, -e", "Kopf", "Köpfe"], ["s Bad, ä, -er", "Bad", "Bäder"], ["das Buch, -ü, er", "Buch", "Bücher"],
    ["der Koffer, -", "Koffer", "Koffer"], ["der Bus, -se", "Bus", "Busse"], ["die Freundin, -nen", "Freundin", "Freundinnen"],
    ["s Thema, Themen", "Thema", "Themen"], ["der Baum, ¨-e", "Baum", "Bäume"], ["das Haus, -ä, er", "Haus", "Häuser"],
    ["die Adresse,-en", "Adresse", "Adressen"], ["das Datum, -en", "Datum", "Daten"], ["das Museum, -een", "Museum", "Museen"],
    ["der Vorschlag, ¨-e (haben/machen)", "Vorschlag", "Vorschläge"],
  ])("%s ⇒ %s", (headword, lemma, plural) => {
    expect(pluralsFor(e(headword, lemma), lemma)).toEqual([plural]);
  });
  it("لا ادعاء حين لا يُقرأ بيقين: (Sg.) · «die Woche, -e» (مستحيل صرفياً) · الصيغة الثانية في زوج", () => {
    expect(pluralsFor(e("das Alter (Sg.)", "Alter", "das"), "Alter")).toEqual([]);
    expect(pluralsFor(e("die Woche, -e", "Woche", "die"), "Woche")).toEqual([]);
    const pair: WordlistEntry = { headword: "der Freund, -e, die Freundin, -nen", lemmas: ["Freund", "Freundin"], article: "der", page: 1, kind: "main" };
    expect(pluralsFor(pair, "Freund")).toEqual(["Freunde"]);
    expect(pluralsFor(pair, "Freundin")).toEqual([]);
  });
});

describe("D110 — الحارس الدائم على المحتوى الحقيقي", () => {
  const words = loadWords(C);
  it("كل goetheList في المحتوى = الدليل بالضبط (لا وسم بلا دليل ولا دليل بلا وسم)", () => {
    const bad = words.filter((w) => !sameLevels(w.goetheList, deriveGoetheList(w, IXS))).map((w) => w.id);
    expect(bad).toEqual([]);
  });

  it("كلمات A2 كلها في قائمة A2 الرسمية · وجمعنا لا يخالف أي جمع مطبوع قابل للقراءة", () => {
    for (const w of words.filter((x) => x.level === "A2")) expect(w.goetheList, w.id).toContain("A2");
    const { plurals } = auditGoethe(words, LISTS);
    expect(plurals).toEqual([]);
  });

  it("أمثلة مرجعية: Abend [A1,A2] · Abendessen [] (مركّب) · Nudeln [A2] · Tschüss [A1,A2] (tschüs) · Arabisch [A1]", () => {
    const g = (id: string) => words.find((w) => w.id === id)!.goetheList;
    expect(g("abend")).toEqual(["A1", "A2"]);
    expect(g("abendessen")).toEqual([]);
    expect(g("nudeln")).toEqual(["A2"]);
    expect(g("tschuess")).toEqual(["A1", "A2"]);
    expect(g("arabisch")).toEqual(["A1"]);
    expect(g("mal")).toEqual(["A2"]); // A2 «mal / das Mal» — Fit1 «s Mal» اسمٌ لا يُثبت الأداة
    expect(evidenceFor(words.find((w) => w.id === "aerztin")!, IXS).map((e) => e.kind)).toContain("feminine");
  });
});

describe("D110 — المدقِّق والمولِّد يفرضان الدليل", () => {
  const list = synList([{ headword: "der Arzt, -Ä, e", lemmas: ["Arzt"], article: "der" }]);
  const word = (goetheList: string[]) => ({
    schemaVersion: "1.0.0", id: "arzt", de: "der Arzt", article: "der", gender: "der", ar: ["طبيب"], wordClass: "noun",
    level: "A1", unit: 1, goetheList, thema: "Gesundheit", usedInLessons: [], srsCardTypes: ["production", "comprehension", "gender"],
  });
  const tree = (gl: string[], withList = true): ContentEntry[] => [
    { path: "words/arzt.json", data: word(gl) },
    ...(withList ? [{ path: "wordlists/syn-a1.json", data: list }] : []),
  ];
  const codes = (es: ContentEntry[]) => validateContentTree(es).errors.map((e) => e.code);

  it("e-goethe-list: وسم بلا دليل خطأ · دليل بلا وسم خطأ · المطابق سليم · بلا فهارس لا فحص (أشجار جزئية)", () => {
    expect(codes(tree(["A1"]))).not.toContain("e-goethe-list");
    expect(codes(tree([]))).toContain("e-goethe-list");
    expect(codes(tree(["A1", "A2"]))).toContain("e-goethe-list");
    expect(codes(tree([], false))).not.toContain("e-goethe-list");
    expect(Word.parse(word(["A1"])).goetheList).toEqual(["A1"]);
  });

  it("المولِّد يشتق goetheList من الفهارس ويرفض مواصفة تخالف الدليل", () => {
    const root = mkdtempSync(join(tmpdir(), "goethe-gen-"));
    mkdirSync(join(root, "words"), { recursive: true });
    mkdirSync(join(root, "wordlists"), { recursive: true });
    mkdirSync(join(root, "manifests"), { recursive: true });
    writeFileSync(join(root, "wordlists/syn-a1.json"), JSON.stringify(list));
    writeFileSync(join(root, "manifests/audio-manifest.a1-u1.json"), JSON.stringify({ schemaVersion: "1.0.0", tracks: [] }));
    const spec = {
      de: "der Arzt", ar: ["طبيب"], wordClass: "noun", level: "A1", unit: 1, lesson: "a1-u1-d1", thema: "Gesundheit",
      sample: { de: "Der Arzt kommt.", ar: "الطبيب يأتي." }, plural: "die Ärzte",
    };
    const fakeIpa = (t: string[]) => t.map(() => "aːɐ̯tst");
    const r = runGenerator({ specs: [spec], contentRoot: root, phonemize: fakeIpa, dryRun: true });
    expect(r.planned[0]!.word.goetheList).toEqual(["A1"]);
    expect(() => runGenerator({ specs: [{ ...spec, goetheList: ["A2"] }], contentRoot: root, phonemize: fakeIpa, dryRun: true }))
      .toThrow(/goetheList/);
  });
});
