// tools/lib/word-entry.ts — منطق مولِّد مدخل الكلمة (D105) — دوال نقية مختبرة
// §5 الدستور: «كل كلمة جديدة تُفحص ضد الخريطة العربية آلياً». الكشف هنا من الرسم + النطق المقيس
// (IPA من espeak عبر الصوت المثبَّت — tools/phonemize.py) لا من التخمين. كل قاعدة موثّقة بسببها.
import type { Word } from "../../content/schemas/index.js";

type PhoneticRisk = Word["phoneticRisks"][number];
type GrammarRisk = Word["grammarRisks"][number];
type CardType = Word["srsCardTypes"][number];

/** البوادئ (للأفعال المنفصلة ولبداية الجذر في sp/st) */
export const SEPARABLE_PREFIXES = [
  "zurück", "zusammen", "vorbei", "weiter", "kennen", "spazieren", "fern", "fest", "statt", "teil", "los", "weg", "hin", "her",
  "ab", "an", "auf", "aus", "bei", "ein", "mit", "nach", "vor", "zu", "um",
] as const;

const ARTICLE = /^(der|die|das) (.+)$/;

/** معرّف الملف من الكلمة: بلا أداة ولا sich · ä→ae ö→oe ü→ue ß→ss · مسافات → «-» */
export function slugify(de: string): string {
  return de
    .replace(ARTICLE, "$2")
    .replace(/^sich /, "")
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** الاسم: الأداة والجنس من البادئة — اسم بلا أداة = خطأ (D57: كل اسم ذي جنس ⇒ بطاقة جنس) */
export function nounGender(de: string): { article: "der" | "die" | "das"; gender: "der" | "die" | "das"; lemma: string } | null {
  const m = de.match(ARTICLE);
  return m ? { article: m[1] as "der" | "die" | "das", gender: m[1] as "der" | "die" | "das", lemma: m[2]! } : null;
}

/** الجذع الذي يُفحص صوتياً: بلا أداة ولا sich */
export function lemmaOf(de: string): string {
  return de.replace(ARTICLE, "$2").replace(/^sich /, "");
}

/**
 * أعلام الخطر الصوتي (الخريطة العربية §5/10.1) — القواعد:
 * umlaut-u/o: ü/ö في الكلمة نفسها (الحركات الأمامية المدوَّرة — لا مقابل عربي). وملاوت الصيغ
 *   (Arzt→Ärzte · fahren→fährt) ليس نطق الكلمة: يغطيه plural-irregular/التصريف (قياس D105)
 * umlaut-a: ä ليست في «äu» (äu ثنائية [ɔʏ] لا [ɛ])
 * ch-ich-laut: «ch» مكتوبة + [ç] منطوقة · ch-ach-laut: «ch» + [x] · ig-ending: ‎-ig (لا ‎-eig) ⇒ [ɪç] منطوقة
 * auslaut-d/b/g: الحرف الأخير d/b/g (التصلّب الأخير) — ‎-ng=[ŋ] و‎-ig=[ç] مستثناتان؛ ‎-eig (Bahnsteig=[aɪk]) تصلّب؛
 *   وداخل الكلمة حين يُكتب الحرف ولا يُسمع نظيره المجهور أبداً (Erlebnis=[eːp] · Mädchen=[mɛːt])
 * sp-st-initial: «sp/st» مكتوبة ومنطوقة [ʃp/ʃt] (يشمل جذر المركّب: Bahnsteig) — لا اسم بلا sp/st
 * z: «z» = [ts] · v-f: «v» مكتوبة ولا [v] منطوقة (vier/von) — الدخيلة بـ[v] (Vase) لا تُعلَّم؛ و«w» ليست v
 * double-consonant: حرف ساكن مضاعف أو «ck» (يقصّر الحركة قبله — شفرة Vokalquantität)
 * vowel-long-short: علامة إطالة مكتوبة (aa/ee/oo · ie · حركة+h · ß بعد حركة غير ثنائية) + «ː» منطوقة؛
 *   وh بين حركتين تُعدّ علامة فقط إن لم تُنطق ([h] غائبة من IPA: gehen=[ɡeːən] نعم · behalten لا)
 * r-uvular: r مُصوَّتة: آخر الكلمة (‎-er / ‎-r = [ɐ]) أو في البوادئ ver-/er-/zer-/her- قبل ساكن — العربي يكررها [r]
 */
export function detectPhoneticRisks(de: string, rawIpa: string, _forms: string[] = []): PhoneticRisk[] {
  // espeak يُخرج ç مفككة (c+U+0327) — بلا NFC لا يُطابَق «ç» أبداً (كان ich-Laut لا يُكشف إطلاقاً — قياس D105)
  const ipa = rawIpa.normalize("NFC");
  const lemma = lemmaOf(de).toLowerCase();
  const tokens = lemma.split(/[\s-]+/).filter(Boolean);
  const isIgSuffix = (t: string) => t.endsWith("ig") && !t.endsWith("eig");
  const out = new Set<PhoneticRisk>();
  if (lemma.includes("ü")) out.add("umlaut-u");
  if (lemma.includes("ö")) out.add("umlaut-o");
  if (/ä(?!u)/.test(lemma)) out.add("umlaut-a");
  const hasCh = /ch(?!s)/.test(lemma);
  // [ç] من «ch» تحديداً: عدد [ç] يفوق ما تفسّره لواحق ‎-ig (achtzig: ch=[x] و‎-zig=[ç] ⇒ لا ich-Laut من ch)
  const cCount = (ipa.match(/ç/g) ?? []).length;
  if (hasCh && cCount > tokens.filter(isIgSuffix).length) out.add("ch-ich-laut");
  if (hasCh && /[xχ]/.test(ipa)) out.add("ch-ach-laut");
  if (tokens.some(isIgSuffix) && ipa.includes("ɪç")) out.add("ig-ending");
  for (const t of tokens) {
    if (t.endsWith("d")) out.add("auslaut-d");
    if (t.endsWith("b")) out.add("auslaut-b");
    if (t.endsWith("g") && !t.endsWith("ng") && !isIgSuffix(t)) out.add("auslaut-g");
  }
  // التصلّب داخل الكلمة (آخر المقطع): الحرف مكتوب ونظيره المجهور غائب تماماً من النطق —
  // Erlebnis=[…eːpnɪs] · Mädchen=[mɛːtçən] (خطأ عربي كلاسيكي: [mɛːdçən]) · Tag=[taːk]
  const gLetters = lemma.replace(/ng/g, "").replace(/ig\b/g, "");
  if (lemma.includes("d") && !ipa.includes("d") && ipa.includes("t")) out.add("auslaut-d");
  if (lemma.includes("b") && !ipa.includes("b") && ipa.includes("p")) out.add("auslaut-b");
  if (gLetters.includes("g") && !/[ɡg]/.test(ipa) && ipa.includes("k")) out.add("auslaut-g");
  if (/s[pt]/.test(lemma) && /ʃ[pt]/.test(ipa)) out.add("sp-st-initial");
  if (lemma.includes("z")) out.add("z");
  if (vSpokenAsF(lemma, ipa)) out.add("v-f");
  if (/(bb|dd|ff|gg|kk|ll|mm|nn|pp|rr|ss|tt|ck)/.test(lemma)) out.add("double-consonant");
  const silentH = /[aeiouäöü]h[aeiouäöü]/.test(lemma) && !ipa.includes("h");
  const lengthMark = silentH || /(aa|ee|oo|ie|[aeiouäöü]h(?![aeiouäöü])|(?<![ei]|[ae]u)ß)/.test(lemma);
  if (lengthMark && ipa.includes("ː")) out.add("vowel-long-short");
  if (tokens.some((t) => /er$/.test(t) || (/r$/.test(t) && !/rr$/.test(t))) || /^(ver|zer|her|er)(?![aeiouäöü])/.test(lemma))
    out.add("r-uvular");
  return [...out].sort();
}

/**
 * أعلام الخطر النحوي التي تُستنتج آلياً (الباقي — feste-praep/dative-verb/needs-es-dummy… — يحتاج معنى:
 * يُمرَّر يدوياً في المواصفة ويُدمج):
 * trennbar: صيغة المضارع كلمتان («macht an») · reflexive: «sich …» · needs-ist: Perfekt بـ«ist»
 * v2-order: ظرف (يقلب الفعل عند التصدير) · needs-ein: اسم معدود له جمع (العربية بلا أداة نكرة)
 * plural-irregular: جمع بحركة مُصوَّتة جديدة أو ‎-er · n-deklination: مذكر ‎-e بجمع ‎-n أو ‎-ent/-ant/-ist/-oge
 * gender-vs-natural: Mädchen/Fräulein (أنثى طبيعياً، محايد نحوياً)
 */
export function detectGrammarRisks(spec: {
  de: string; wordClass: string; plural?: string; pluralOnly?: boolean; forms?: { praesens3s?: string; perfekt?: string };
}): GrammarRisk[] {
  const out = new Set<GrammarRisk>();
  const g = nounGender(spec.de);
  if (spec.wordClass === "verb") {
    if (spec.forms?.praesens3s && spec.forms.praesens3s.trim().split(/\s+/).length >= 2 && !/^\S+ sich$/.test(spec.forms.praesens3s.trim()))
      out.add("trennbar");
    if (/^sich /.test(spec.de)) out.add("reflexive");
    if (spec.forms?.perfekt?.startsWith("ist ")) out.add("needs-ist");
  }
  if (spec.wordClass === "adverb") out.add("v2-order");
  if (spec.wordClass === "noun" && g) {
    const pl = (spec.plural ?? "").replace(/^die /, "");
    // D136: Pluralia tantum (مثل die Eltern/die Großeltern) لا تُسند إليها بطاقة «ein» للمفرد.
    if (pl && pl !== "—" && !spec.pluralOnly) out.add("needs-ein");
    const sing = g.lemma;
    // حالة الحرف لا تهم: «Ärzte» تبدأ بـÄ كبيرة (كان الكشف يفوتها — اختبار D105)
    const umlautInPluralOnly = /[äöü]/i.test(pl) && !/[äöü]/i.test(sing);
    if (pl && (umlautInPluralOnly || (pl.endsWith("er") && !sing.endsWith("er")))) out.add("plural-irregular");
    if (g.gender === "der" && ((sing.endsWith("e") && pl === `${sing}n`) || (/(ent|ant|ist|oge)$/.test(sing) && pl === `${sing}en`)))
      out.add("n-deklination");
    if (["Mädchen", "Fräulein"].includes(sing)) out.add("gender-vs-natural");
  }
  return [...out].sort();
}

/** أخطار صوتية تستحق بطاقة سماع (§4): الحركات المدوَّرة/الطول/الاحتكاكيان/r المُصوَّتة */
const AUDIO_WORTHY: readonly PhoneticRisk[] = ["umlaut-u", "umlaut-o", "ch-ich-laut", "ch-ach-laut", "vowel-long-short", "r-uvular"];

export function cardTypesFor(spec: { wordClass: string; gender: string; chunk?: boolean; kollocation?: unknown }, risks: PhoneticRisk[]): CardType[] {
  const out: CardType[] = ["production", "comprehension"];
  if (spec.gender !== "none") out.push("gender");
  if (risks.some((r) => AUDIO_WORTHY.includes(r))) out.push("audio");
  if (spec.chunk) out.push("chunk");
  if (spec.kollocation) out.push("kollocation");
  return out;
}

const FUNCTION_CLASSES = new Set(["preposition", "conjunction", "pronoun", "article", "particle"]);
export function isFunctionWord(wordClass: string, adverbFunction = false): boolean {
  return FUNCTION_CLASSES.has(wordClass) || (wordClass === "adverb" && adverbFunction);
}

/** نص المقطع الصوتي = الشكل الكامل كما يُكتب (D102: لا بدائل ASCII) + نقطة */
export function clipText(de: string): string {
  return /[.!?]$/.test(de) ? de : `${de}.`;
}

/** w-srs-ratio (§4): مسافة نسب البطاقات عن مستهدف المستوى — نفس صيغة المدقِّق حرفياً */
export function srsDistance(
  cardLists: readonly (readonly string[])[],
  target: { production: number; comprehension: number; audio: number },
): number {
  let p = 0, c = 0, a = 0, total = 0;
  for (const l of cardLists) {
    for (const t of l) { if (t === "production") p++; else if (t === "comprehension") c++; else if (t === "audio") a++; }
    total += Math.max(1, l.length);
  }
  if (total === 0) return 0;
  return Math.abs(p / total - target.production) + Math.abs(c / total - target.comprehension) + Math.abs(a / total - target.audio);
}

/**
 * v-f (D115): «v» مكتوبة ومنطوقة [f]. كان الشرط «لا [v] في النطق» فتُخفيه [v] الآتية من «w» أو «qu»
 * (wie viel [viː fˈiːl] · verschwinden [fɛɾʃvˈɪndən]). الآن: عدد [v] المنطوقة أقل من المتوقع لو نُطقت كل
 * «v» [v] (v + w + qu) — Vase ([v] دخيلة) لا · Auf Wiedersehen (لا v مكتوبة) لا.
 */
export function vSpokenAsF(lemma: string, ipa: string): boolean {
  if (!lemma.includes("v")) return false;
  const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;
  return count(ipa, /v/g) < count(lemma, /v/g) + count(lemma, /w/g) + count(lemma, /qu/g);
}

/**
 * D106: هل العلَم ممكن أصلاً لهذه الكلمة؟ (رسماً ونطقاً) — يُبقي الحكم اليدوي المعقول ويُسقط المستحيل
 * (sp-st على Berg · v-f على Straße · ich-Laut على Brücke). الوملاوت من الكلمة نفسها فقط (سياسة D105).
 */
export function plausibleRisk(risk: PhoneticRisk, de: string, rawIpa: string): boolean {
  const ipa = rawIpa.normalize("NFC");
  const lemma = lemmaOf(de).toLowerCase();
  const tokens = lemma.split(/[\s-]+/).filter(Boolean);
  const isIgSuffix = (t: string) => t.endsWith("ig") && !t.endsWith("eig");
  switch (risk) {
    case "umlaut-u": return lemma.includes("ü");
    case "umlaut-o": return lemma.includes("ö");
    case "umlaut-a": return /ä(?!u)/.test(lemma);
    case "ch-ich-laut": return /ch(?!s)/.test(lemma) && ipa.includes("ç");
    case "ch-ach-laut": return /ch(?!s)/.test(lemma) && /[xχ]/.test(ipa);
    case "ig-ending": return tokens.some(isIgSuffix);
    case "auslaut-d": return lemma.includes("d") && (tokens.some((t) => t.endsWith("d")) || !ipa.includes("d"));
    case "auslaut-b": return lemma.includes("b") && (tokens.some((t) => t.endsWith("b")) || !ipa.includes("b"));
    case "auslaut-g": return lemma.includes("g") && (tokens.some((t) => t.endsWith("g")) || !/[ɡg]/.test(ipa));
    case "sp-st-initial": return /s[pt]/.test(lemma) && /ʃ[pt]/.test(ipa);
    case "z": return lemma.includes("z");
    case "v-f": return vSpokenAsF(lemma, ipa);
    case "double-consonant": return /(bb|dd|ff|gg|kk|ll|mm|nn|pp|rr|ss|tt|ck)/.test(lemma);
    case "vowel-long-short": return ipa.includes("ː");
    case "r-uvular": return lemma.includes("r");
    default: return true;
  }
}

/** إعادة الوسم: المكتشَف ∪ (القديم الممكن) — مع ما أُضيف وما أُسقط للتقرير */
export function reannotate(old: readonly PhoneticRisk[], detected: readonly PhoneticRisk[], de: string, ipa: string): {
  risks: PhoneticRisk[]; added: PhoneticRisk[]; removed: PhoneticRisk[];
} {
  const keep = old.filter((r) => plausibleRisk(r, de, ipa));
  const risks = [...new Set([...detected, ...keep])].sort();
  return { risks, added: risks.filter((r) => !old.includes(r)), removed: old.filter((r) => !risks.includes(r)) };
}

/** الشكل الذي يُفحص صوتياً من حقل de (أول بديل «/» · بلا الشرح بين القوسين) */
export function citationForm(de: string): string {
  return de.split(" / ")[0]!.replace(/\s*\(.*?\)\s*/g, " ").trim();
}
