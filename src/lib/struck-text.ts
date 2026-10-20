// src/lib/struck-text.ts — الخطأ المشطوب في نصوص المحتوى (D128): «~~Strasse~~» ← مقاطع مشطوبة وغير مشطوبة
// اصطلاح المحتوى منذ البداية: الصيغة الخاطئة بين ~~ (بطاقة المصيدة إلزاماً — tests/content-units) · وحارس الجبهة D128
// يقبل الخطأ المقصود المعلن داخلها وحدها. كان المُشغِّل يعرض العلامتين خاماً للمتعلم؛ الآن يرسمهما شطباً حقيقياً.
// D188: الكلمة المستعارة من درس لاحق (praesentation.borrowedWords) تُرسم بترجمتها على الكلمة نفسها — الإعلان يصل إلى المتعلم لا إلى الحارس وحده.
export type StruckPart = { text: string; struck: boolean; gloss?: string };
/** ترجمة الكلمة المستعارة: الصيغة ⇒ نصّ التلميح (D188) */
export type GlossMap = ReadonlyMap<string, string>;

const STRUCK = /~~([\s\S]+?)~~/g;

/** المقاطع بالترتيب — زوج ~~ مغلق فقط يُشطب؛ «~~» وحيدة تبقى نصاً كما هي (لا يُبتلع ما بعدها) */
export function splitStruck(text: string, gloss?: GlossMap): StruckPart[] {
  const parts: StruckPart[] = [];
  let last = 0;
  for (const m of text.matchAll(STRUCK)) {
    const at = m.index ?? 0;
    if (at > last) parts.push(...glossed(text.slice(last, at), gloss));
    parts.push({ text: m[1]!, struck: true });
    last = at + m[0].length;
  }
  if (last < text.length) parts.push(...glossed(text.slice(last), gloss));
  return parts;
}

/** تقسيم مقطع غير مشطوب حول الكلمات المستعارة (كلمة كاملة — حدود حروف يونيكود) */
function glossed(text: string, gloss?: GlossMap): StruckPart[] {
  if (!gloss || gloss.size === 0) return [{ text, struck: false }];
  const re = new RegExp(`(?<!\\p{L})(${[...gloss.keys()].map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?!\\p{L})`, "gu");
  const out: StruckPart[] = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ text: text.slice(last, at), struck: false });
    out.push({ text: m[1]!, struck: false, gloss: gloss.get(m[1]!) });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), struck: false });
  return out;
}

/** النص كما يُرى بلا علامات الشطب (textContent بعد الرسم) */
export const visibleText = (text: string): string => splitStruck(text).map((p) => p.text).join("");
