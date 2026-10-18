// tools/lib/vocab-forms.ts — صيغ المفردات المدروسة (مشترك: حاصد العبارات D107 + قفل مفردات الامتحان D109)
// تقدير مُعلن بحدوده: جذوع تصريف بسيطة (لا محلل صرفي) — قد يقبل كلمة غير مدروسة تشارك جذعاً،
// لكنه لا يرفض كلمة مدروسة بصيغها المسجلة (الجمع/المضارع/Perfekt/Präteritum/الأمر).
import type { Word } from "../../content/schemas/index.js";

/** الكلمات الوظيفية المغلقة (أدوات/ضمائر/مساعدة/جر/ربط/أعداد) — تُعرف دون درس.
 * D121: الأعداد صنف مغلق كاملاً حتى 20 — كانت 13–19 وnull ناقصة فعُدّت «neunzehn» غير مدروسة
 * في درس الأعداد نفسه (a1-u1-d4)، وnull لا غنى عنها لرقم الهاتف. */
export const CLOSED: ReadonlySet<string> = new Set(`der die das den dem des ein eine einen einem einer eines kein keine keinen keinem keiner
ich du er sie es wir ihr mich dich ihn uns euch mir dir ihm ihnen sich man mein meine meinen meinem meiner dein deine deinen deinem
sein seine seinen seinem ihre ihren ihrem unser unsere euer eure bin bist ist sind seid war warst wart waren habe hast hat haben habt hatte hattest hattet hatten
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
/**
 * D185 (N-103): صيغ مُعلنة تُتعلَّم داخل بطاقة كلمة بلا بطاقة خاصة — قائمة مغلقة صغيرة لا تُوسَّع إلا بقرار:
 * · gut: لا بطاقة لها في المقرر كله، وتُتعلَّم في a1-u1-d1 من مثال «Wie geht's? — Danke, gut.» (كانت تمرّ خطأً بجذع «gut» المشتق من Guten Tag).
 * · jeder: تصريف أداة الكلّية (jede · jedes · jeden · jedem) — كان يمرّ بالجذع المشتق «jed» قبل حصر الجذوع القصيرة.
 */
export const IMPLICIT_FORMS: Readonly<Record<string, readonly string[]>> = {
  "wie-gehts": ["gut"],
  jeder: ["jede", "jedes", "jeden", "jedem"],
};
export function knownForms(w: Word): string[] {
  const base = w.de.replace(/^(der|die|das) /, "").replace(/^sich /, "").toLowerCase();
  const parts = [base, w.plural?.replace(/^die /, ""), w.forms?.praesens3s, w.forms?.perfekt, w.forms?.praeteritum, w.forms?.imperative, ...(IMPLICIT_FORMS[w.id] ?? [])]
    .filter((x): x is string => !!x).flatMap((x) => contentTokens(x));
  return parts;
}

export const STEM_SUFFIXES = ["en", "st", "et", "te", "ten", "e", "t", "n", "s", "er", "es"] as const;
/** نهايات تصريف الفعل وحدها (N-103 — الجذع القصير لا يقبل غيرها) */
export const VERB_SUFFIXES: ReadonlySet<string> = new Set(["e", "st", "t", "en", "et", "te", "ten", "est"]);
export function stem(t: string): string[] {
  return stemmed(t).map((x) => x.base);
}
/** الجذوع المحتملة مع النهاية المقصوصة ("" للرمز نفسه) */
export function stemmed(t: string, minBase = 3): { base: string; suffix: string }[] {
  const out = [{ base: t, suffix: "" }];
  for (const suf of STEM_SUFFIXES) if (t.length - suf.length >= minBase && t.endsWith(suf)) out.push({ base: t.slice(0, -suf.length), suffix: suf });
  return out;
}

/** علامتا المجموعة: «=» صيغة مسجَّلة كاملة · «~» جذع مشتق من صيغة فعل (D185 — N-103) */
export const FULL = "=";
export const VERB = "~";
/** علامة صيغة كلمة درسٍ لاحق (تُضاف بـwithLaterForms) */
export const LATER = "<";
/**
 * كل جذوع الصيغ المعروفة لمجموعة كلمات.
 * N-103 (D185 — بإذن المالك): الجذع المشتق القصير (≤3 أحرف) لا يدخل إلا من صيغة فعل وبقصّ نهاية فعل — كان «wei» يُشتق من
 * Wein بقصّ n فيمرّ weit (كلمة درس لاحق)، و«bei» من Bein و«dan» من dann … (128 جذعاً قصيراً من أسماء وظروف).
 * الصيغة الكاملة تُسجَّل كما هي (وبعلامة «=») مهما قصرت (Tag · gut · neu · Oma · ab) ويُقبل عليها أي نهاية (neues · guter · Tage).
 * N-112: الفعل القصير المنتهي بـ‑n لا ‑en (tun) يعطي جذعه بقصّ n (tu ⇒ tue · tust · tut).
 */
export function knownStems(words: readonly Word[]): Set<string> {
  const out = new Set<string>();
  for (const w of words) {
    const verb = !!w.forms;
    for (const f0 of knownForms(w)) {
      const f = deumlaut(f0);
      out.add(f);
      out.add(FULL + f);
      for (const { base, suffix } of stemmed(f)) {
        if (base === f) continue;
        if (verb && VERB_SUFFIXES.has(suffix)) { out.add(VERB + base); out.add(base); continue; }
        if (base.length >= 4) out.add(base);
      }
      if (verb && /[^e]n$/u.test(f) && f.length <= 4) { const b = f.slice(0, -1); out.add(b); out.add(VERB + b); }
    }
  }
  return out;
}
/** هل يُقبل الرمز على الصيغ المعروفة؟ (الكاملة · أو كاملة + نهاية · أو جذع ≥4 · أو جذع فعل قصير + نهاية فعل) */
export function stemKnown(d: string, stems: ReadonlySet<string>): boolean {
  if (stems.has(d)) return true;
  for (const { base, suffix } of stemmed(d, 2)) { // الجذع ذو الحرفين لفعل قصير معلن (tu ⇒ tue/tust — N-112)
    if (base === d) continue;
    if (stems.has(FULL + base)) return true;
    if (base.length >= 4 && stems.has(base)) return true;
    if (stems.has(VERB + base) && VERB_SUFFIXES.has(suffix)) return true;
  }
  return false;
}
/**
 * N-103 (1): الرمز الذي هو صيغة مسجَّلة لكلمة درسٍ لاحق يُرفض ولو طابق جذعاً — إلا أن يكون صيغة كاملة مدروسة،
 * أو صيغة كاملة مدروسة + نهاية (große ⇐ groß · lernen ⇐ lern من kennenlernen)، أو جذع فعل مدروس + نهاية فعل (wasche ⇐ waschen).
 * (fragt من Frage قبل fragen · weit من Wein قبل weit ⇒ مرفوضان.)
 */
export function laterWordLeak(d: string, stems: ReadonlySet<string>): boolean {
  if (!stems.has(LATER + d)) return false;
  if (stems.has(FULL + d)) return false;
  for (const { base, suffix } of stemmed(d, 2)) {
    if (base === d) continue;
    if (stems.has(FULL + base)) return false;
    if (stems.has(VERB + base) && VERB_SUFFIXES.has(suffix)) return false;
  }
  return true;
}
/** يضيف إلى مجموعة الجذوع صيغ كلمات الدروس اللاحقة (بعلامة «<») — ما ليس صيغةً مدروسة ولا مغلقة */
export function withLaterForms(stems: ReadonlySet<string>, taught: readonly Word[], all: readonly Word[]): Set<string> {
  const ids = new Set(taught.map((w) => w.id));
  const earlier = new Set(taught.flatMap((w) => knownForms(w)).map(deumlaut));
  const out = new Set(stems);
  for (const w of all) {
    if (ids.has(w.id)) continue;
    for (const f0 of knownForms(w)) { const f = deumlaut(f0); if (f.length > 2 && !earlier.has(f) && !CLOSED.has(f0) && !CLOSED.has(f)) out.add(LATER + f); }
  }
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
    const d = deumlaut(t);
    if (laterWordLeak(d, stems)) { out.add(t); continue; }
    if (stemKnown(d, stems)) continue;
    if (numberWordKnown(t, stems)) continue;
    if (daCompoundKnown(t, stems)) continue;
    if (ordinalKnown(t, stems)) continue;
    out.add(t);
  }
  return [...out].sort();
}
