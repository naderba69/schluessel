// tools/lib/vocab-forms.ts — صيغ المفردات المدروسة (مشترك: حاصد العبارات D107 + قفل مفردات الامتحان D109)
// تقدير مُعلن بحدوده: جذوع تصريف بسيطة (لا محلل صرفي) — قد يقبل كلمة غير مدروسة تشارك جذعاً،
// لكنه لا يرفض كلمة مدروسة بصيغها المسجلة (الجمع/المضارع/Perfekt/Präteritum/الأمر).
import type { Word } from "../../content/schemas/index.js";

/** الكلمات الوظيفية المغلقة (أدوات/ضمائر/مساعدة/جر/ربط/أعداد) — تُعرف دون درس.
 * D121: الأعداد صنف مغلق كاملاً حتى 20 — كانت 13–19 وnull ناقصة فعُدّت «neunzehn» غير مدروسة
 * في درس الأعداد نفسه (a1-u1-d4)، وnull لا غنى عنها لرقم الهاتف. */
export const CLOSED: ReadonlySet<string> = new Set(`der die das den dem des ein eine einen einem einer eines kein keine keinen keinem keiner
ich du er sie es wir ihr mich dich ihn uns euch mir dir ihm ihnen sich man mein meine meinen meinem meiner dein deine deinen deinem
sein seine seinen seinem ihre ihren ihrem unser unsere euer eure bin bist ist sind seid war waren habe hast hat haben habt hatte
werde wirst wird werden kann kannst können könnt muss musst müssen will willst wollen möchte möchtest möchten darf darfst dürfen
soll sollst sollen in im ins an am ans auf aus bei mit nach von vom zu zum zur für um ohne gegen durch bis seit über unter vor
hinter neben zwischen beim und oder aber denn sondern weil dass wenn als ob nicht auch noch schon nur sehr ja nein doch mal so wie was
wer wo wann warum welche welcher welches null eins zwei drei vier fünf sechs sieben acht neun zehn elf zwölf
dreizehn vierzehn fünfzehn sechzehn siebzehn achtzehn neunzehn zwanzig hundert es gibt`.split(/\s+/));

export const deumlaut = (s: string) => s.replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u");

/**
 * الصيغ المعروفة من كلمة مدروسة: الجذع + صيغ الفعل + الجمع — مع جذوع تصريف بسيطة.
 * D115: تُقطَّع بـcontentTokens نفسها التي تقطّع النص المفحوص — كان التقطيع على [\s/!.,] فقط فيُنتج
 * «geht's?» و«(sie)» و«koste(n» التي لا تطابق أي نص (11 مدخلاً: Wie geht's? · Stell (dich) vor! · …).
 */
export function knownForms(w: Word): string[] {
  const base = w.de.replace(/^(der|die|das) /, "").replace(/^sich /, "").toLowerCase();
  const parts = [base, w.plural?.replace(/^die /, ""), w.forms?.praesens3s, w.forms?.perfekt, w.forms?.praeteritum, w.forms?.imperative]
    .filter((x): x is string => !!x).flatMap((x) => contentTokens(x));
  return parts;
}

export function stem(t: string): string[] {
  const out = [t];
  for (const suf of ["en", "st", "et", "te", "ten", "e", "t", "n", "s", "er", "es"]) if (t.length > suf.length + 2 && t.endsWith(suf)) out.push(t.slice(0, -suf.length));
  return out;
}

/** كل جذوع الصيغ المعروفة لمجموعة كلمات */
export function knownStems(words: readonly Word[]): Set<string> {
  const out = new Set<string>();
  for (const w of words) for (const f of knownForms(w)) for (const s of stem(deumlaut(f))) out.add(s);
  return out;
}

/**
 * D127: اللاحقة أو النهاية المكتوبة بشرطة في أولها (‑ung · ‑chen · ‑st) رمزٌ صرفي لا كلمة — قواعد الجنس
 * والتصريف والجمع تكتبها هكذا («‑ung ← die»). كان المقطِّع يجعل «‑chen» كلمةَ «chen» غير المدروسة.
 * تسقط من الفحص بشرطين معاً: (1) الشرطة أول الرمز لا داخل كلمة (E-Mail تبقى «mail» · Zeit‑ung تبقى «zeit»)
 * (2) الرمز حروف صغيرة من قائمة مغلقة للواحق الألمانية — فلا تصير الشرطة باباً خلفياً لكلمة غير مدروسة
 * (‑Mail · ‑battle تبقيان مخالفة). الحرف الواحد (‑e · ‑n · ‑t · ‑s) يُهمَل أصلاً في contentTokens.
 */
export const MORPHEMES: ReadonlySet<string> = new Set(`ung heit keit schaft in innen chen lein ling um er ion tät ei ik ur
ment nis tum ismus ist ent ant or en nen st et est te ten ieren zig isch lich ig`.split(/\s+/));
const MORPHEME_NOTATION = /(?<![\p{L}\p{N}])[-\u2010\u2011\u2013](\p{Ll}+)(?![\p{L}\p{N}])/gu;
/** يمحو رموز اللواحق المعروفة (بشرطة أولها) ويترك ما سواها كما هو */
export const stripMorphemeNotation = (text: string): string =>
  text.replace(MORPHEME_NOTATION, (m: string, suffix: string) => (MORPHEMES.has(suffix) ? " " : m));

/**
 * D128: رمز الحرف المكتوب (ss · ff · oo · ie) ليس كلمة — قاعدة طول الحركة تسمّي الحروف نفسها («ß أم ss؟»)
 * وكان المقطِّع يجعل «ss» كلمةً غير مدروسة. القائمة مغلقة ومن القاعدة نفسها: الحروف المضاعفة التي تُقصّر الحركة
 * قبلها (ومنها ck وtz بدل kk وzz) وحروف الإطالة aa · ee · oo · ie — ولا يطابق أيٌّ منها صيغة كلمة في المقرر (اختبار).
 * تسقط بشرطين معاً: (1) حرفان صغيران بالضبط (2) منفصلان لا داخل كلمة — فلا يصير الرمز باباً خلفياً لكلمة.
 * خارج القائمة عمداً: ei (das Ei كلمة في المقرر و‑ei لاحقة) · au · ah · oh · eh (تعجّبات) — تُكتب في why أو بالعربية.
 * والحرف الواحد (ß · h · s) يُهمَل أصلاً في contentTokens.
 */
export const GRAPHEMES: ReadonlySet<string> = new Set("ss ck tz ff ll mm nn pp rr tt bb dd gg aa ee oo ie".split(" "));
const GRAPHEME_NOTATION = /(?<![\p{L}\p{N}])(\p{Ll}{2})(?![\p{L}\p{N}])/gu;
/** يمحو رموز الحروف من القائمة المغلقة (حرفان صغيران منفصلان) ويترك ما سواها كما هو */
export const stripGraphemeNotation = (text: string): string =>
  text.replace(GRAPHEME_NOTATION, (m: string, g: string) => (GRAPHEMES.has(g) ? " " : m));

/** رموز المحتوى في نص ألماني: حروف فقط (الأرقام والرموز تسقط) · حرف واحد يُهمل (a/b في الخيارات) */
export function contentTokens(text: string): string[] {
  return text.toLowerCase().replace(/'s\b/g, "").replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter((t) => t.length > 1);
}

/**
 * D131: العدد المركّب من 21 إلى 99 كلمة واحدة: الآحاد + und + العشرات (einundzwanzig · fünfunddreißig) —
 * 72 صيغة لا تُعدّ في القائمة المغلقة ولا تُكتب مدخلاً لكل منها. eins تصير ein (einsundzwanzig ليست منها) ·
 * sechs وsieben تبقيان كاملتين في المركّب (sechsundzwanzig · siebenundzwanzig) — الحذف في العشرات وحدها.
 */
export const COMPOUND_NUMBER =
  /^(ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)und(zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig)$/u;

/**
 * المركّب معروف إن كانت عشراته مدروسة حتى الدرس — بجذوع الكلمات المدروسة لا بالقائمة المغلقة: zwanzig مغلقة منذ
 * D121 (درس 0–20) لكن العشرات كلمات تُدرَّس في a1-u3-d1، فلا يُقبل «einundzwanzig» قبله. والآحاد مغلقة أصلاً.
 */
export function compoundNumberKnown(t: string, stems: ReadonlySet<string>): boolean {
  const m = COMPOUND_NUMBER.exec(t);
  return m !== null && stems.has(deumlaut(m[2]!));
}

const TENS = "zwanzig|dreißig|vierzig|fünfzig|sechzig|siebzig|achtzig|neunzig";
/**
 * D132: من 100 إلى 1000 كلمة واحدة — المئات (الآحاد اختيارياً + hundert) ثم الباقي كما تعلّمناه: آحاد أو 10–19
 * أو عشرات أو مركّب (zweihundert · hunderteins · hundertzwanzig · dreihundertfünfundsechzig) — أو (ein)tausend.
 * eins في آخر العدد تبقى بـs (hunderteins لا hundertein) · ولا und بعد المئات (hundertundeins صيغة قديمة أقل شيوعاً —
 * لا تُقبل حتى يُقرَّر تدريسها) · وما فوق الألف (zweitausend) خارج النطاق حتى يُدرَّس.
 */
export const HUNDREDS_NUMBER = new RegExp(
  `^(?:(?:ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)?hundert((?:ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)und(?:${TENS})|${TENS}|` +
    "eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf|dreizehn|vierzehn|fünfzehn|sechzehn|siebzehn|achtzehn|neunzehn)?|(?:ein)?tausend)$",
  "u",
);
const TENS_ONLY = new RegExp(`^(?:${TENS})$`, "u");

/**
 * عدد من كلمة واحدة معروف حتى الدرس: المركّب 21–99 بعشراته المدروسة (D131) · وما بين 100 و1000 من الدرس الذي يُدرِّس
 * tausend (a1-u3-d2 — «Zahlen 100–1000» في الخطة اليومية) لا قبله ولو كانت hundert مغلقة منذ D121 — وباقيه بعد المئات
 * يتبع القاعدة نفسها (hundertzwanzig يحتاج zwanzig مدروسة · dreihundertfünfundsechzig يحتاج sechzig).
 */
export function numberWordKnown(t: string, stems: ReadonlySet<string>): boolean {
  if (compoundNumberKnown(t, stems)) return true;
  const m = HUNDREDS_NUMBER.exec(t);
  if (m === null || !stems.has("tausend")) return false;
  const rest = m[1];
  if (!rest) return true;
  if (COMPOUND_NUMBER.test(rest)) return compoundNumberKnown(rest, stems);
  if (TENS_ONLY.test(rest)) return stems.has(deumlaut(rest));
  return true; // آحاد و10–19: مغلقة
}

/**
 * D150: ظرف المكان المركّب da(r) + حرف مكان كلمةٌ واحدة تُركَّب بالقاعدة (ars-da-komposita — «da أول لقاء» في الخطة
 * اليومية): dar- قبل الحركة (darauf · darin · daran · darüber · darunter) وda- قبل الساكن (daneben · dahinter · dazwischen)
 * — صيغٌ لا تُكتب مدخلاً لكلٍّ منها (سابقة الأعداد D131 · D132). تُعرف من الدرس الذي يُدرِّس darauf (a1-u6-d5) لا قبله،
 * والحروف المكانية التي دُرّست للمكان وحدها: davor خارجها (vor في الوحدة 9) · ومركّبات المعنى المجرّد والزمن (damit · dafür
 * · dabei · danach · darum · davon · dazu — والنظام كله مع الأفعال وwo-Komposita في A2) كلماتٌ بمداخلها أو لاحقة.
 */
export const DA_COMPOUND = /^da(?:r(?:auf|in|an|über|unter)|hinter|neben|zwischen)$/u;
export const DA_COMPOUND_ANCHOR = "darauf";
export function daCompoundKnown(t: string, stems: ReadonlySet<string>): boolean {
  return DA_COMPOUND.test(t) && stems.has(DA_COMPOUND_ANCHOR);
}

/**
 * D167: العدد الترتيبي كلمةٌ واحدة تُركَّب بالقاعدة (ars-termin-datum — «التاريخ» في الخطة اليومية): الأصلي + ‑t من 1 إلى 19
 * (مع الشواذ الثلاثة: erst · dritt · siebt — وacht تبقى achte) و+ ‑st من 20 فصاعداً (zwanzigst · einunddreißigst · hundertst)
 * — ثم نهاية الصفة (der zwölfte · am zwölften · des zwölften · ein zwölfter · das zwölfte). صيغٌ لا تُكتب مدخلاً لكلٍّ منها
 * (سابقة الأعداد D131 · D132 وda-Komposita D150). تُعرف من الدرس الذي يُدرِّس das Datum (a1-u10-d2) لا قبله — والعشرات
 * والمئات داخلها تتبع قاعدتها (einundzwanzigste تحتاج zwanzig · dreißigste تحتاج dreißig).
 */
const ORDINAL_SMALL = "erst|zweit|dritt|viert|fünft|sechst|siebt|acht|neunt|zehnt|elft|zwölft|(?:drei|vier|fünf|sech|sieb|acht|neun)zehnt";
export const ORDINAL_NUMBER = new RegExp(`^(?:(${ORDINAL_SMALL})|((?:(?:ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)und)?(?:${TENS})|(?:ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun)?hundert|(?:ein)?tausend)st)(?:e|en|em|er|es)$`, "u");
export const ORDINAL_ANCHOR = "datum";
export function ordinalKnown(t: string, stems: ReadonlySet<string>): boolean {
  const m = ORDINAL_NUMBER.exec(t);
  if (m === null || !stems.has(ORDINAL_ANCHOR)) return false;
  if (m[1] !== undefined) return true; // 1–19: آحاد ومراهقات مغلقة
  const base = m[2]!;
  if (TENS_ONLY.test(base)) return stems.has(deumlaut(base));
  if (COMPOUND_NUMBER.test(base)) return compoundNumberKnown(base, stems);
  return numberWordKnown(base, stems); // المئات والألف من درس tausend
}

/**
 * الكلمات غير المدروسة في نص (مرتبة، بلا تكرار): ليست مغلقة · ليست اسم علم مُعلناً · ولا جذع لها
 * يطابق جذع صيغة مدروسة · ولا هي عدد من كلمة واحدة أجزاؤه مدروسة (D131 · D132) · ولا ظرف مكان da(r)+حرف بعد درسه (D150)
 * · ولا عدد ترتيبي بعد درس التاريخ (D167).
 */
export function unknownTokens(text: string, stems: ReadonlySet<string>, allow: ReadonlySet<string> = new Set()): string[] {
  const out = new Set<string>();
  for (const t of contentTokens(text)) {
    if (CLOSED.has(t) || allow.has(t)) continue;
    if (stem(deumlaut(t)).some((s) => stems.has(s))) continue;
    if (numberWordKnown(t, stems)) continue;
    if (daCompoundKnown(t, stems)) continue;
    if (ordinalKnown(t, stems)) continue;
    out.add(t);
  }
  return [...out].sort();
}
