// src/lib/goethe-tag.ts — وسم «خارج A1» (D192 — N-045 · قرار المالك D182 أ): كلمات بقيت في دروس A1 لأن الدرس مبني عليها
// وهي خارج قائمة Goethe A1 الرسمية. الوسم مشتق من goetheList (D110: لا يُكتب يدوياً — فلا حقل ثانٍ يكرره ويختلف عنه)
// ويصل إلى بطاقة العرض (القانون 12): المتعلم يعرف أنّ هذه الكلمة إضافة للفهم لا من نواة الامتحان.
import type { Word } from "../../content/schemas/index.js";

export type GoetheTag = "A1" | "A2-only" | "outside";

/** A1: في قائمة A1 الرسمية · A2-only: في قائمة A2 وحدها · outside: في لا قائمة */
export function goetheTag(w: Pick<Word, "goetheList">): GoetheTag {
  if (w.goetheList.includes("A1")) return "A1";
  return w.goetheList.includes("A2") ? "A2-only" : "outside";
}

/** نص الوسم للبطاقة في درس A1 — فارغ للكلمات من قائمة A1 (الحالة العادية لا تُعلَّم) */
export function goetheTagLabel(w: Pick<Word, "goetheList" | "level">): string {
  if (w.level !== "A1") return "";
  switch (goetheTag(w)) {
    case "A1": return "";
    case "A2-only": return "خارج قائمة A1 الرسمية (من قائمة A2) — للفهم، تأتيك في A2";
    case "outside": return "خارج قائمتي A1 وA2 الرسميتين — كلمة الدرس للفهم";
  }
}
