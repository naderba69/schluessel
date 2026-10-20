// content/schemas/answer-key.ts — مفتاح الإجابة قابل للتحقق (D103 + D109)
// دوال نقية يستخدمها المخطط (فحوص داخل الملف: نص القراءة) والمدقِّق (فحوص عابرة للملفات: نص الصوت).
// المبدأ: لا جواب في المفتاح بلا معلومة حرفية في النص أو الصوت تحسمه — المعلومة تُسمّى «الدليل» (evidence).

/** الأعداد المكتوبة ↔ الأرقام (الصوت يقول «acht» والجواب «8») */
export const NUMBER_WORDS: Readonly<Record<string, string>> = {
  "0": "null", "1": "eins", "2": "zwei", "3": "drei", "4": "vier", "5": "fünf", "6": "sechs", "7": "sieben",
  "8": "acht", "9": "neun", "10": "zehn", "11": "elf", "12": "zwölf", "20": "zwanzig", "30": "dreißig",
};

/** كلمات وظيفية لا تحمل الجواب (أداة/جر) — لا يُشترط سماعها */
const STOP = new Set(["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "um", "von", "bis", "am", "im", "in", "zu", "und"]);

function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
}

/**
 * هل الجواب موجود فعلاً في النص (المنطوق أو المكتوب)؟ كل كلمة محتوى في الجواب يجب أن تَرِد
 * (الرقم 8 يقبل «acht» أو «8»). يمنع سؤالاً جوابه غير موجود في مادته.
 */
export function answerSupported(answer: string, transcript: string): { ok: boolean; missing: string[] } {
  const heard = new Set(tokens(transcript));
  const missing = tokens(answer)
    .filter((t) => !STOP.has(t))
    .filter((t) => !(heard.has(t) || (NUMBER_WORDS[t] !== undefined && heard.has(NUMBER_WORDS[t]!))));
  return { ok: missing.length === 0, missing };
}

/**
 * تطبيع للمطابقة الحرفية: أحرف صغيرة · علامات الاقتباس تُحذف · الشرطات كلها «-» · المسافات واحدة.
 * لا تطبيع أبعد من ذلك — الدليل يجب أن يكون اقتباساً حرفياً لا إعادة صياغة.
 */
export function normalizeEvidence(s: string): string {
  return s
    .toLowerCase()
    .replace(/[«»„“”"‚‘’']/g, "")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** هل الدليل اقتباس حرفي من النص؟ (بعد التطبيع) */
export function evidenceIn(evidence: string, text: string): boolean {
  const e = normalizeEvidence(evidence);
  return e.length > 0 && normalizeEvidence(text).includes(e);
}
