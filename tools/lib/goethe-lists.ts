// tools/lib/goethe-lists.ts — goetheList دليلٌ لا رأي (D110)
// يطابق كلماتنا بفهارس قوائم Goethe الرسمية (content/wordlists/*.json — tools/goethe-wordlist.py)
// ويشتق goetheList = المستويات التي تحوي قائمتُها الرسمية الكلمةَ فعلاً. المدقِّق يفرض المساواة
// (e-goethe-list) والمولِّد يملؤها آلياً — فلا وسم يدوي بعد اليوم.
//
// أنواع الدليل (بالأولوية):
//   entry    مدخل رئيسي في القائمة الأبجدية (مع توافق أداة التعريف إن وُجدت في الطرفين)
//   sub      مدخل فرعي مُزاح (SD1: «eingerückter Nebeneintrag» — جزء من القائمة لا يُعدّ في الـ650)
//   group    بند Wortgruppe (أعداد · أشهر · ألوان · مهن …)
//   feminine صيغة مؤنثة لاسم مذكّر مُدرج — Vorwort SD1 ص3 وص5: «Weibliche Formen werden in der Regel
//            nicht zusätzlich aufgelistet, sind aber Bestandteil des lexikalischen Inventars»
//   plural   الكلمة عندنا بصيغة الجمع (die Nudeln) وجمعُ مدخلٍ مُدرج — محسوب من علامة الجمع المطبوعة
//   contraction  am/im/zum/zur/ins/ans/vom/beim = حرف جر مُدرج + أداة (an + dem …)
//   stem     جذع مُدرج بشرطة (all- · dies- · Lieblings-) + لاحقة تصريف، أو سابقة فعل مُدرجة + فعل مُدرج
//            أو الفعل الأول من تلازم مُدرج (spazieren ← spazieren gehen)
//   herkunft اسم بلد / لغة المتعلّم — الفئة المفتوحة «Angabe der eigenen Herkunft oder Nationalität»
//            (SD1 ص8 · Fit1 ص7) — قائمة صريحة أدناه، لا تخمين
//   composed قطعة (chunk/تعبير) كل كلماتها مُدرجة (Guten Tag = gut + Tag)
import type { Level } from "../../content/schemas/common.js";
import type { OfficialWordlist, WordlistEntry } from "../../content/schemas/wordlist.js";

export type EvidenceKind = "entry" | "sub" | "group" | "feminine" | "plural" | "contraction" | "stem" | "herkunft" | "composed";
export interface Evidence {
  list: string;
  level: Level;
  kind: EvidenceKind;
  headword: string;
  page: number;
  via?: string;
}

/** ما يلزم من الكلمة (Word كاملة أو مواصفة المولِّد) */
export interface WordLike {
  de: string;
  article?: string;
  wordClass: string;
  chunk?: boolean;
}

interface Hit { entry: WordlistEntry; lemma: string }
export interface ListIndex {
  id: string;
  level: Level;
  herkunft: boolean;
  exact: Map<string, Hit[]>;
  lower: Map<string, Hit[]>;
  squash: Map<string, Hit[]>;
  plural: Map<string, Hit[]>;
  /** الاسم في آخر عبارة مُدرجة: «am Montag» · «in der Nacht» · «um Mitternacht» */
  phraseNoun: Map<string, Hit[]>;
  stems: Hit[];
}

const LEVEL_ORDER: readonly Level[] = ["A1", "A2", "B1", "B2"];

/**
 * الفئة المفتوحة «eigene Herkunft» — أسماء البلدان (أعلام لا تُحصى؛ أمثلة القائمة «z. B.» توضيحية)
 * ولغة جمهورنا (العربية). لغات أخرى (Englisch · Französisch) تحتاج دليلاً حرفياً.
 * كلمة بلد جديدة تُضاف هنا صراحةً (مراجَعة) — وإلا فلا دليل.
 */
export const HERKUNFT: ReadonlySet<string> = new Set([
  "Ägypten", "Deutschland", "Europa", "Frankreich", "Griechenland", "Italien", "Marokko", "Niederlande",
  "Österreich", "Polen", "Portugal", "Russland", "Schweiz", "Spanien", "Tunesien", "Türkei",
  "Arabisch",
]);

/** صيغ إملائية مزدوجة مقبولة (Duden) — صريحة لا قاعدة عامة */
const ORTHO_VARIANTS: Readonly<Record<string, string>> = { "tschüss": "tschüs" };

/** الدمج الإلزامي لحرف الجر بالأداة (قواعد A1 — لا مداخل مستقلة في القوائم) */
const CONTRACTIONS: Readonly<Record<string, string>> = {
  am: "an", ans: "an", im: "in", ins: "in", zum: "zu", zur: "zu", vom: "von", beim: "bei",
};

/** سوابق فعلية تذكرها القائمة جذعاً منتجاً (A2: her-/hin-/weg-/zurück-) */
const VERB_PREFIX_STEMS: ReadonlySet<string> = new Set(["her", "hin", "weg", "zurück"]);
/**
 * D111: جذع صغير الحرف يُركَّب مع الأسماء (كـLieblings-) لا لاحقة تصريف فقط — قائمة صريحة بدليلها:
 * A2 ص13 «einzel-» وأمثلتها الرسمية مركّبات (Einzelkind · Einzelzimmer). بقية الجذوع الصغيرة (all- · dies- ·
 * jed- …) أدوات تُصرَّف فلا تُركَّب: «Einkauf» ليس ein- + Kauf.
 */
const COMPOUND_STEMS: ReadonlySet<string> = new Set(["einzel"]);
const STEM_ENDINGS: readonly string[] = ["", "e", "er", "es", "en", "em", "s"];

export function normKey(s: string): string {
  return s.normalize("NFC").replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim().replace(/[!?;:,]+$/, "").trim();
}
const squashOf = (s: string) => normKey(s).toLowerCase().replace(/[\s-]/g, "");
const isCap = (s: string) => /^[A-ZÄÖÜ]/.test(s);

function deumlautLast(s: string): string {
  const i = Math.max(s.lastIndexOf("ä"), s.lastIndexOf("ö"), s.lastIndexOf("ü"), s.lastIndexOf("Ä"), s.lastIndexOf("Ö"), s.lastIndexOf("Ü"));
  if (i < 0) return s;
  const map: Record<string, string> = { ä: "a", ö: "o", ü: "u", Ä: "A", Ö: "O", Ü: "U" };
  return s.slice(0, i) + map[s[i]!] + s.slice(i + 1);
}

const UMLAUT: Readonly<Record<string, string>> = { a: "ä", o: "ö", u: "ü", A: "Ä", O: "Ö", U: "Ü" };
/** يضع الإبدال الصوتي على آخر حرف علة قابل (au → äu) */
export function umlautLast(s: string): string {
  const au = s.lastIndexOf("au");
  let i = -1;
  for (let k = s.length - 1; k >= 0; k--) if ("aouAOU".includes(s[k]!)) { i = k; break; }
  if (au >= 0 && au === i - 1) i = au; // Baum → Bäume (لا Baüme)
  if (i < 0) return s;
  return s.slice(0, i) + UMLAUT[s[i]!] + s.slice(i + 1);
}

/** علامة الجمع للمتغيّر الأول: «-n» · «¨-e» · «-ä, e» (SD1) · «ö, -e» (Fit1) · «Themen» — أو null */
function firstMarker(headword: string): string | null {
  const parts = headword.replace(/\s*\([^()]*\)/g, "").split(/[/;]/)[0]!.split(",").map((x) => x.trim());
  if (parts.length < 2 || !parts[1]) return null;
  const [m1, m2] = [parts[1], parts[2]];
  // SD1 «-ä, e» · Fit1 «ä, -e» · «ü, er»: إبدال ثم لاحقة في جزأين
  if (/^-?[äöüÄÖÜ]$/.test(m1) && m2 !== undefined && /^-?[a-zäöüß]*$/.test(m2) && !/^(der|die|das)\b/.test(m2)) return `${m1}, ${m2}`;
  return m1;
}

const hasPairs = (headword: string) => /\/|;|,\s*(der|die|das)\s/.test(headword);

/**
 * D131: صيغة لا تظهر إلا داخل قوسين منفصلين («Großmutter, ¨- (Oma)» · «die Feier, -n (z. B. Feierabend)») كلمةٌ أخرى
 * لا تُحمَّل علامة جمع الكلمة الأولى — كانت «Oma» تُعطى «Omä» من «¨-» التي لـGroßmutter، وSD1 نفسها «die Oma, -s».
 * أما القوس الملتصق بالكلمة («(Fahr)Rad» · «(E-)Mail» · «(Kredit)-Karte» · «Chat(room)») فجزءٌ منها والعلامة تشمله.
 */
function onlyInDetachedParens(headword: string, lemma: string): boolean {
  const squash = (x: string) => x.replace(/[()\-]/g, "").toLowerCase();
  const rest = headword.replace(/(^|\s)\([^()]*\)(?=[\s,;/]|$)/g, "$1");
  return !squash(rest).includes(squash(lemma));
}

/**
 * جمع صيغة معيّنة من مدخل، من علامة الجمع المطبوعة — الأساليب الثلاثة:
 *   A2 «die Nudel, -n» · «der Kühlschrank, ¨-e» · «der Koffer, -» · «der Apfel, ¨-»
 *   SD1 «der Arbeitsplatz, -ä, e» · «der Apfel, -Ä» · «das Buch, -ü, er»
 *   Fit1 «r Kopf, ö, -e» · «s Bad, ä, -er» · «s Thema, Themen» · «r Arzt, Ärzte»
 * يعيد [] حين لا علامة (Sg.) أو حين لا تُقرأ بيقين (أزواج لصيغة غير الأولى · «die Woche, -e») — لا تخمين.
 */
export function pluralsFor(entry: WordlistEntry, lemma: string): string[] {
  if (!entry.article && entry.kind !== "group") return [];
  if (!/^[A-ZÄÖÜ]/.test(lemma) || !entry.lemmas.includes(lemma)) return [];
  if (hasPairs(entry.headword) && lemma !== entry.lemmas[0]) return [];
  if (onlyInDetachedParens(entry.headword, lemma)) return [];
  const marker = firstMarker(entry.headword);
  if (!marker) return [];
  if (/^[A-ZÄÖÜ][a-zäöüß]+$/.test(marker)) return lemma === entry.lemmas[0] ? [marker] : []; // Themen · Ärzte
  if (!/^[-¨äöüÄÖÜ=]/.test(marker)) return [];
  const um = /¨/.test(marker) || /^-?[äöüÄÖÜ](?:$|[\s,-])/.test(marker);
  const suffix = (marker.replace(/¨/g, "").match(/([a-zäöüß]*)\s*$/)?.[1] ?? "").replace(/^[äöü]$/, "");
  if (suffix.length > 3) return []; // D208: لاحقة صغيرة بأكثر من 3 أحرف ليست لاحقة جمع (أطولها nen) بل اختصار إبدال ذيل («- männer» ← Hausmänner · «-ücher» ← Wörterbücher) — لا تُقرأ بيقين فلا تُدَّعى (لا تخمين)
  if (/um$/.test(lemma) && /^(e?en|a)$/.test(suffix)) { // Datum → Daten · Museum, -een → Museen · Praktikum, -a
    const stem = lemma.slice(0, -2);
    return [stem + (stem.endsWith("e") && suffix.startsWith("e") ? suffix.slice(1) : suffix).replace(/^een$/, "en")];
  }
  // D151: الدخيلة المنتهية بـ‑a تُسقطها قبل ‑en (A2 «die Firma, -en» ← Firmen · كـThema ← Themen · Villa ← Villen) —
  // لا جمع ألمانياً بـ‑aen، وكان الإلحاق الحرفي يقرأ «Firmaen» فيخطّئ جمعنا الصحيح
  if (/a$/.test(lemma) && suffix === "en" && !um) return [lemma.slice(0, -1) + "en"];
  if (lemma.endsWith("e") && suffix === "e") return []; // «die Woche, -e»: مستحيل صرفياً — لا ادعاء
  const suf = lemma.endsWith("e") && suffix.startsWith("e") ? suffix.slice(1) : suffix; // Adresse, -en → Adressen
  const base = um ? umlautLast(lemma) : lemma;
  if (um && base === lemma) return [];
  return [base + suf];
}

export const pluralsOf = (entry: WordlistEntry): string[] => pluralsFor(entry, entry.lemmas[0]!);

function push(m: Map<string, Hit[]>, k: string, h: Hit) {
  const a = m.get(k);
  if (a) a.push(h);
  else m.set(k, [h]);
}

export function indexWordlist(list: OfficialWordlist): ListIndex {
  const ix: ListIndex = {
    id: list.id, level: list.level, herkunft: list.openCategories.some((c) => c.id === "herkunft"),
    exact: new Map(), lower: new Map(), squash: new Map(), plural: new Map(), phraseNoun: new Map(), stems: [],
  };
  for (const entry of list.entries) {
    for (const lemma of entry.lemmas) for (const pl of pluralsFor(entry, lemma)) push(ix.plural, normKey(pl), { entry, lemma });
    for (const lemma of entry.lemmas) {
      const h = { entry, lemma };
      if (lemma.endsWith("-") && lemma.length > 2) {
        ix.stems.push({ entry, lemma: lemma.slice(0, -1) });
        continue;
      }
      const k = normKey(lemma);
      const pm = k.match(/^(?:am|im|um|in der|in den|im|zum|zur|an|auf) ([A-ZÄÖÜ][\p{L}-]+)$/u);
      if (pm) push(ix.phraseNoun, pm[1]!, h);
      push(ix.exact, k, h);
      push(ix.lower, k.toLowerCase(), h);
      push(ix.squash, squashOf(k), h);
    }
  }
  return ix;
}

export const indexWordlists = (lists: OfficialWordlist[]): ListIndex[] => lists.map(indexWordlist);

/** صيغة الاستشهاد بلا أداة ولا sich ولا بدائل */
export function lemmaFor(w: WordLike): string {
  return normKey(
    w.de.split(" / ")[0]!.replace(/\s*\(.*?\)\s*/g, " ").trim()
      .replace(/^(der|die|das)\s+/, "")
      .replace(/^sich\s+/, ""),
  );
}

const isNoun = (w: WordLike) => w.wordClass === "noun";
const articleOk = (entry: WordlistEntry, article?: string) =>
  !article || !entry.article || entry.article.split("/").includes(article);

/** بحث صيغة واحدة: الاسم يطابق صيغة بحرف كبير (وأداة متوافقة)؛ غير الاسم يقبل اختلاف حالة الحرف الأول */
function lookup(ix: ListIndex, lemma: string, noun: boolean, article?: string): Hit[] {
  const k0 = normKey(lemma);
  const k = ORTHO_VARIANTS[k0.toLowerCase()] && !(ix.exact.get(k0) || ix.lower.get(k0.toLowerCase()))
    ? ORTHO_VARIANTS[k0.toLowerCase()]! : k0;
  let hits = ix.exact.get(k) ?? [];
  if (!noun) {
    // «Bitte»/«Danke» قطعةً تطابق bitte/danke لا الاسم die Bitte
    const low = (ix.lower.get(k.toLowerCase()) ?? []).filter((h) => !isCap(h.lemma));
    if (low.length) hits = low;
  }
  if (hits.length === 0) hits = ix.squash.get(squashOf(k)) ?? [];
  if (noun) hits = hits.filter((h) => isCap(h.lemma) && articleOk(h.entry, article));
  // غير الاسم لا يُثبته اسم: الأداة «mal» ليست «das Mal» — إلا اسماً مُدرجاً بحرفه الكبير نفسه (قطعة «Danke» تطابق danke أعلاه)
  else hits = hits.filter((h) => !isCap(h.lemma) || (isCap(k) && h.lemma === k && !h.entry.article));
  return hits;
}

const kindOf = (e: WordlistEntry): EvidenceKind => (e.kind === "group" ? "group" : e.kind === "sub" ? "sub" : "entry");
const ev = (ix: ListIndex, kind: EvidenceKind, e: WordlistEntry, via?: string): Evidence =>
  ({ list: ix.id, level: ix.level, kind, headword: e.headword, page: e.page, ...(via ? { via } : {}) });

function stemEvidence(ix: ListIndex, lemma: string): Evidence | null {
  for (const s of ix.stems) {
    if (isCap(s.lemma)) {
      // Lieblings- + Farbe · Geburts- + Tag : الجزء الثاني مُدرج اسماً
      if (lemma.startsWith(s.lemma) && lemma.length > s.lemma.length + 2) {
        const rest = lemma.slice(s.lemma.length);
        const restCap = rest[0]!.toUpperCase() + rest.slice(1);
        const r = lookup(ix, restCap, true);
        if (r.length) return ev(ix, "stem", s.entry, `${s.lemma}- + ${r[0]!.entry.headword}`);
      }
      continue;
    }
    const low = lemma.toLowerCase();
    if (!low.startsWith(s.lemma)) continue;
    const rest = low.slice(s.lemma.length);
    if (STEM_ENDINGS.includes(rest)) return ev(ix, "stem", s.entry, `${s.lemma}-${rest}`);
    if (COMPOUND_STEMS.has(s.lemma) && isCap(lemma) && rest.length > 2) {
      const r = lookup(ix, rest[0]!.toUpperCase() + rest.slice(1), true);
      if (r.length) return ev(ix, "stem", s.entry, `${s.lemma}- + ${r[0]!.entry.headword}`);
    }
    if (VERB_PREFIX_STEMS.has(s.lemma) && rest.length > 2) {
      const r = lookup(ix, rest, false).filter((h) => !isCap(h.lemma));
      if (r.length) return ev(ix, "stem", s.entry, `${s.lemma}- + ${r[0]!.entry.headword}`);
    }
  }
  return null;
}

/** صيغ محتملة لكلمة داخل قطعة: Guten → gut · geht's → gehen */
function deinflect(t: string): string[] {
  const base = t.replace(/'s$/, "");
  const out = new Set([t, base]);
  for (const b of [base]) {
    for (const end of ["en", "em", "er", "es", "e", "n", "s", "st", "t"]) {
      if (b.length > end.length + 1 && b.toLowerCase().endsWith(end)) {
        const stem = b.slice(0, -end.length);
        out.add(stem);
        out.add(stem + "en");
        out.add(stem + "n");
      }
    }
  }
  return [...out];
}

function tokenEvidence(ix: ListIndex, token: string, initial: boolean): Evidence | null {
  for (const cand of deinflect(token)) {
    // داخل القطعة: الكلمة الكبيرة اسمٌ (Tag · Wiedersehen) — والأولى قد تكون كبيرة لبداية الجملة فقط (Guten · Auf · Wie)
    const h = [
      ...(isCap(cand) ? lookup(ix, cand, true) : []),
      ...(!isCap(cand) || initial ? lookup(ix, cand.toLowerCase(), false) : []),
    ];
    if (h.length) return ev(ix, kindOf(h[0]!.entry), h[0]!.entry);
    const s = stemEvidence(ix, initial ? cand.toLowerCase() : cand);
    if (s) return s;
  }
  return null;
}

/** الدليل في قائمة واحدة (أقوى دليل) أو null */
export function evidenceIn(w: WordLike, ix: ListIndex): Evidence | null {
  const lemma = lemmaFor(w);
  const noun = isNoun(w);
  const hits = lookup(ix, lemma, noun, w.article);
  if (hits.length) {
    const best = hits.find((h) => h.entry.kind === "main") ?? hits.find((h) => h.entry.kind === "sub") ?? hits[0]!;
    return ev(ix, kindOf(best.entry), best.entry);
  }
  if (noun && /in$/.test(lemma) && lemma.length >= 5 && (!w.article || w.article === "die")) {
    const stem = lemma.slice(0, -2);
    for (const base of new Set([stem, stem + "e", deumlautLast(stem), deumlautLast(stem) + "e"])) {
      const h = lookup(ix, base, true).filter((x) => !x.entry.article || x.entry.article.split("/").includes("der"));
      if (h.length) return ev(ix, "feminine", h[0]!.entry, base);
    }
  }
  if (noun) {
    const ph = ix.phraseNoun.get(lemma) ?? [];
    if (ph.length) return ev(ix, kindOf(ph[0]!.entry), ph[0]!.entry, `${lemma} ← ${ph[0]!.lemma}`);
    const pl = (ix.plural.get(lemma) ?? []).filter((h) => articleOk(h.entry, w.article === "die" ? undefined : w.article));
    if (pl.length) return ev(ix, "plural", pl[0]!.entry, `Pl. ${lemma}`);
  }
  const contracted = CONTRACTIONS[lemma.toLowerCase()];
  if (contracted) {
    const h = lookup(ix, contracted, false);
    if (h.length) return ev(ix, "contraction", h[0]!.entry, `${lemma} = ${contracted} + Artikel`);
  }
  const st = stemEvidence(ix, lemma);
  if (st) return st;
  if (!noun && !lemma.includes(" ")) {
    for (const v of ["gehen", "fahren", "spielen", "haben"]) {
      const h = lookup(ix, `${lemma} ${v}`, false);
      if (h.length) return ev(ix, "stem", h[0]!.entry, `${lemma} ← ${lemma} ${v}`);
    }
  }
  if (ix.herkunft && HERKUNFT.has(lemma)) {
    return { list: ix.id, level: ix.level, kind: "herkunft", headword: "Angabe der eigenen Herkunft oder Nationalität", page: 0, via: lemma };
  }
  if (w.chunk || w.wordClass === "chunk" || w.wordClass === "expression" || lemma.includes(" ")) {
    const tokens = lemma.split(" ").map((t) => t.replace(/[^\p{L}'-]/gu, "")).filter(Boolean);
    if (tokens.length > 1) {
      const parts = tokens.map((t, i) => tokenEvidence(ix, t, i === 0));
      if (parts.every(Boolean)) {
        const first = parts[0]!;
        return { list: ix.id, level: ix.level, kind: "composed", headword: first.headword, page: first.page, via: parts.map((p) => p!.headword).join(" + ") };
      }
    }
  }
  return null;
}

/** دليل كل قائمة (قائمة واحدة لكل مستوى تكفي: A1 من SD1 أو Fit1) */
export function evidenceFor(w: WordLike, ixs: ListIndex[]): Evidence[] {
  return ixs.map((ix) => evidenceIn(w, ix)).filter((e): e is Evidence => e !== null);
}

/**
 * D112: الكلمات الرئيسية (بنصها المطبوع) التي تثبتها مجموعة كلمات في فهرس واحد — بمنطق التدقيق نفسه
 * (Herkunft فئة مفتوحة لا كلمة رئيسية · القطعة تثبت كل أجزائها). المفتاح النص لا الصفحة: «an sein» مطبوعة
 * مرتين في SD1 (ص10 تحت an · ص23 تحت sein) وevidenceIn يعيد مدخلاً واحداً — والكلمة الواحدة تغطي الاثنين.
 */
export function coveredHeadwords(words: WordLike[], ix: ListIndex): Set<string> {
  const out = new Set<string>();
  for (const w of words) {
    const e = evidenceIn(w, ix);
    if (!e || e.kind === "herkunft") continue;
    out.add(e.headword);
    if (e.kind === "composed" && e.via) for (const h of e.via.split(" + ")) out.add(h);
  }
  return out;
}

export function levelsOf(evs: Evidence[]): Level[] {
  const s = new Set(evs.map((e) => e.level));
  return LEVEL_ORDER.filter((l) => s.has(l));
}

/** goetheList المشتقة من الدليل — المصدر الوحيد للحقيقة (D110) */
export const deriveGoetheList = (w: WordLike, ixs: ListIndex[]): Level[] => levelsOf(evidenceFor(w, ixs));

export function sameLevels(a: readonly string[], b: readonly string[]): boolean {
  const x = [...new Set(a)].sort();
  const y = [...new Set(b)].sort();
  return x.length === y.length && x.every((v, i) => v === y[i]);
}

export function describeEvidence(evs: Evidence[]): string {
  if (evs.length === 0) return "لا دليل في أي قائمة رسمية";
  return evs.map((e) => `${e.level}: ${e.list} «${e.headword}»${e.page ? ` ص${e.page}` : ""} (${e.kind}${e.via ? ` ← ${e.via}` : ""})`).join(" · ");
}
