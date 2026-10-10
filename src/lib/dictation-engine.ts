// src/lib/dictation-engine.ts — محرك النسخ المسموع (Dictation) E07: تسمع وتكتب (F076)
// المصدر: generation effect (Slamecka & Graf 1978) — أقوى ربط صوت↔كتابة · F077 (تصحيح لطيف)
// الحارس: تصحيح لطيف يشرح «لماذا» — بلا علامات حمراء وبلا لوم (D23 — يُختبر آلياً)
import { hasBlame } from "./warmth-engine.js";

/** تدفق النسخ: استمع ← اكتب ← اكشف ← قارن (محاولة قبل كشف — F121) */
export const DICTATION_STEPS = ["listen", "write", "reveal", "compare"] as const;
export type DictationStep = (typeof DICTATION_STEPS)[number];

export function dictationFlowValid(steps: ReadonlyArray<DictationStep>): boolean {
  if (steps.length === 0) return false; // جلسة نسخ فارغة = مرفوضة (لا استماع = لا نسخ)
  let listened = false;
  let wrote = false;
  let revealed = false;
  for (const s of steps) {
    if (s === "listen") listened = true;
    else if (s === "write") {
      if (!listened || revealed) return false; // تكتب بعد الاستماع وقبل الكشف فقط
      wrote = true;
    } else if (s === "reveal") {
      if (!wrote || revealed) return false; // لا كشف قبل محاولة الكتابة
      revealed = true;
    } else {
      if (!revealed) return false; // المقارنة بعد الكشف
    }
  }
  return true;
}

export type DiffStatus = "correct" | "minor" | "retry";

export type DictationComparison = {
  status: DiffStatus;
  matchedWords: string[];
  missedWords: string[];
  /** نص مولر — لطيف دائماً، يشرح لماذا (F077) — يُضمن خالياً من اللوم */
  feedback: string;
};

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function words(text: string): string[] {
  return normalize(text).toLowerCase().split(" ").filter(Boolean);
}

/**
 * مقارنة لطيفة (F077): مولر يصحح بلطف ويشرح لماذا.
 * - تطابق تام → correct
 * - فرق تهجئة/أحرف كبيرة أو نصف الكلمات مطابق → minor (تشجيع + سبب)
 * - غير ذلك → retry («لا بأس» — إعادة بلا عقوبة)
 */
export function compareDictation(expected: string, written: string): DictationComparison {
  const expWords = words(expected);
  const gotWords = words(written);
  const matchedWords = expWords.filter((w) => gotWords.includes(w));
  const missedWords = expWords.filter((w) => !gotWords.includes(w));
  const ratio = expWords.length === 0 ? 1 : matchedWords.length / expWords.length;

  if (normalize(expected) === normalize(written)) {
    return {
      status: "correct",
      matchedWords,
      missedWords: [],
      feedback: "أحسنت! كتابتك دقيقة تماماً. ✅",
    };
  }
  if (normalize(expected).toLowerCase() === normalize(written).toLowerCase()) {
    return {
      status: "minor",
      matchedWords,
      missedWords: [],
      feedback:
        "قريب جداً! فرق التهجئة فقط: كل اسم في ألمانية يبدأ بحرف كبير — أصلِح الحرف ويكتمل. ✍️",
    };
  }
  if (ratio >= 0.5) {
    return {
      status: "minor",
      matchedWords,
      missedWords,
      feedback: `قريب جداً! أعد سماع: ${missedWords.join("، ")} — وحاول كتابتها مرة أخرى. 🎧`,
    };
  }
  return {
    status: "retry",
    matchedWords,
    missedWords,
    feedback: "لا بأس أبداً — أعد الاستماع وجرّب من جديد. كل محاولة تقرّبك. 🌱",
  };
}

/** حارس F077/D23: كل تغذية راجعة للنسخ خالية من اللوم — أو الاختبار يرفضها */
export function feedbackIsGentle(feedback: string): boolean {
  return feedback.length > 0 && !hasBlame(feedback) && !feedback.includes("\n");
}
