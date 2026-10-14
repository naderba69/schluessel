// tools/lib/vocab-forms.ts — صيغ المفردات المدروسة (مشترك: حاصد العبارات D107 + قفل مفردات الامتحان D109)
// تقدير مُعلن بحدوده: جذوع تصريف بسيطة (لا محلل صرفي) — قد يقبل كلمة غير مدروسة تشارك جذعاً،
// لكنه لا يرفض كلمة مدروسة بصيغها المسجلة (الجمع/المضارع/Perfekt/Präteritum/الأمر).
import type { Word } from "../../content/schemas/index.js";

/** الكلمات الوظيفية المغلقة (أدوات/ضمائر/مساعدة/جر/ربط/أعداد) — تُعرف دون درس */
export const CLOSED: ReadonlySet<string> = new Set(`der die das den dem des ein eine einen einem einer eines kein keine keinen keinem keiner
ich du er sie es wir ihr mich dich ihn uns euch mir dir ihm ihnen sich man mein meine meinen meinem meiner dein deine deinen deinem
sein seine seinen seinem ihre ihren ihrem unser unsere euer eure bin bist ist sind seid war waren habe hast hat haben habt hatte
werde wirst wird werden kann kannst können könnt muss musst müssen will willst wollen möchte möchtest möchten darf darfst dürfen
soll sollst sollen in im ins an am ans auf aus bei mit nach von vom zu zum zur für um ohne gegen durch bis seit über unter vor
hinter neben zwischen beim und oder aber denn sondern weil dass wenn als ob nicht auch noch schon nur sehr ja nein doch mal so wie was
wer wo wann warum welche welcher welches eins zwei drei vier fünf sechs sieben acht neun zehn elf zwölf zwanzig hundert es gibt`.split(/\s+/));

export const deumlaut = (s: string) => s.replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u");

/** الصيغ المعروفة من كلمة مدروسة: الجذع + صيغ الفعل + الجمع — مع جذوع تصريف بسيطة */
export function knownForms(w: Word): string[] {
  const base = w.de.replace(/^(der|die|das) /, "").replace(/^sich /, "").toLowerCase();
  const parts = [base, w.plural?.replace(/^die /, ""), w.forms?.praesens3s, w.forms?.perfekt, w.forms?.praeteritum, w.forms?.imperative]
    .filter((x): x is string => !!x).flatMap((x) => x.toLowerCase().split(/[\s/!.,]+/)).filter(Boolean);
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
