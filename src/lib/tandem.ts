// src/lib/tandem.ts — التبادل اللغوي البشري: Tandem/HelloTalk (D578 — §6 + قانون 12 + L340)
// المواصفة الحاكمة (L340): تظهر «من بداية B1» كل 3 أسابيع كتذكير هادئ،
// نص غير قابل للنقر (قانون 12 — «المدينة المسورة»): اسمان مكتوبان + جملة إرشاد + سطر أمان.
// النص أدناه هو نص الدستور حرفياً — لا اختصار فيه ولا إضافة عليه (D57 — صدق).
import { isoWeek } from "./weekly-cards.js";

/** نص التوصية — الدستور L340 حرفياً */
export const TANDEM_COPY =
  "المحاكاة تقترب من المحادثة الحقيقية ولا تطابقها. إن أردت تدريب أذنك على بشر حقيقيين: Tandem أو HelloTalk (اسم مكتوب — لن نخرجك برابط). ابحث عن ألماني يتعلم العربية. لا تشارك بياناتك الشخصية. هذا تذكير اختياري — هدفك النجاح في الامتحان لا الولاء لأداة.";

/** أول فهرس درس B1 في القائمة (L340: «من بداية B1») */
export function b1StartIndex(lessonOrder: readonly string[]): number {
  return lessonOrder.findIndex((id) => id.startsWith("b1-"));
}

/** هل تظهر البطاقة؟ كل 3 أسابيع + من بداية B1 (حتميّ — بلا وقت جداري) */
export function tandemDue(week: number, currentIndex: number, b1Index: number): boolean {
  return b1Index >= 0 && currentIndex >= b1Index && week % 3 === 0;
}

/** إصدار الأسبوع (للاختبارات والتتبع) */
export function tandemDueNow(now: Date, currentIndex: number, lessonOrder: readonly string[]): boolean {
  return tandemDue(isoWeek(now).week, currentIndex, b1StartIndex(lessonOrder));
}
