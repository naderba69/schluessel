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
 * الكلمات غير المدروسة في نص (مرتبة، بلا تكرار): ليست مغلقة · ليست اسم علم مُعلناً · ولا جذع لها
 * يطابق جذع صيغة مدروسة.
 */
export function unknownTokens(text: string, stems: ReadonlySet<string>, allow: ReadonlySet<string> = new Set()): string[] {
  const out = new Set<string>();
  for (const t of contentTokens(text)) {
    if (CLOSED.has(t) || allow.has(t)) continue;
    if (stem(deumlaut(t)).some((s) => stems.has(s))) continue;
    out.add(t);
  }
  return [...out].sort();
}
