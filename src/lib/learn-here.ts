// src/lib/learn-here.ts — «كيف تتعلم هنا» — القانون 18: قوانين الدورة السبعة تُعرض أول استخدام
// النص مأخوذ حرفيًا من §8 (المصدر الواحد للحقيقة — قانون 30).
export const SEVEN_LAWS_AR: readonly string[] = [
  "القالب اليومي ثابت والمحتوى وحده يتغير.",
  "الكلمات الجديدة 10–11 في جلسة (داخل الخطة الأكاديمية).",
  "لا جلسة بلا استرجاع — الاسترجاع قبل الإضافة (MR2).",
  "السبت معركة، والمعركة المؤجلة هي الحاكمة للانتقال.",
  "الفشل = تنفس علاجي لا قفزة ولا وصم (D23).",
  "ندى الليل اختياري ونهايته معروفة مسبقاً.",
  "كل خطأ له عودة (دورة الخطأ الثلاثية).",
];

const KEY = "schluessel.learn-here.seen";

export function learnHereSeen(): boolean {
  try {
    return globalThis.localStorage?.getItem(KEY) === "1";
  } catch {
    return true; // بلا تخزين ← لا نُصرّ على العرض (لا نافذة مفاجئة)
  }
}

export function markLearnHereSeen(): void {
  try {
    globalThis.localStorage?.setItem(KEY, "1");
  } catch {
    /* بلا تخزين — يُعرض مجدداً في جلسة لاحقة، بلا كسر */
  }
}
