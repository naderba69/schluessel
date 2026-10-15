// src/lib/struck-text.ts — الخطأ المشطوب في نصوص المحتوى (D128): «~~Strasse~~» ← مقاطع مشطوبة وغير مشطوبة
// اصطلاح المحتوى منذ البداية: الصيغة الخاطئة بين ~~ (بطاقة المصيدة إلزاماً — tests/content-units) · وحارس الجبهة D128
// يقبل الخطأ المقصود المعلن داخلها وحدها. كان المُشغِّل يعرض العلامتين خاماً للمتعلم؛ الآن يرسمهما شطباً حقيقياً.
export type StruckPart = { text: string; struck: boolean };

const STRUCK = /~~([\s\S]+?)~~/g;

/** المقاطع بالترتيب — زوج ~~ مغلق فقط يُشطب؛ «~~» وحيدة تبقى نصاً كما هي (لا يُبتلع ما بعدها) */
export function splitStruck(text: string): StruckPart[] {
  const parts: StruckPart[] = [];
  let last = 0;
  for (const m of text.matchAll(STRUCK)) {
    const at = m.index ?? 0;
    if (at > last) parts.push({ text: text.slice(last, at), struck: false });
    parts.push({ text: m[1]!, struck: true });
    last = at + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), struck: false });
  return parts;
}

/** النص كما يُرى بلا علامات الشطب (textContent بعد الرسم) */
export const visibleText = (text: string): string => splitStruck(text).map((p) => p.text).join("");
