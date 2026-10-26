// src/lib/phonetic-risks.ts — أعلام الخطر الصوتي ← تنبيه عربي قصير يراه المتعلم في بطاقة العرض (D191 — القانون 12:
// العلَم الذي لا يصل إلى الشاشة لا ينفع المتعلم). القائمة مقفلة في content/schemas/word.ts (D57 + D191) — كل علَم له نص هنا
// (الاختبار يفرض التغطية الكاملة).
import type { PhoneticRisk } from "../../content/schemas/index.js";

export const PHONETIC_RISK_HINT: Readonly<Record<PhoneticRisk, string>> = {
  "ch-ich-laut": "ch هنا خفيفة من مقدّم الفم (مثل «ich») — ليست خاءً",
  "ch-ach-laut": "ch هنا من الحلق (مثل «Buch») — قريبة من الخاء",
  "umlaut-u": "ü: قل «ي» وأنت تضمّ الشفتين — ليست «و» ولا «ي»",
  "umlaut-o": "ö: قل «ي/ي» وأنت تدوّر الشفتين — ليست «و»",
  "umlaut-a": "ä: فتحة مائلة إلى «إي» قصيرة — ليست ألفاً",
  "vowel-long-short": "الحركة الطويلة هنا طويلة فعلاً — المدّ يغيّر المعنى",
  "auslaut-d": "d في آخر الكلمة/المقطع تُنطق t",
  "auslaut-b": "b في آخر الكلمة/المقطع تُنطق p",
  "auslaut-g": "g في آخر الكلمة/المقطع تُنطق k",
  "r-uvular": "r غير مكرَّرة: في آخر الكلمة تكاد تكون فتحة خفيفة (‑er = «ـَ»)",
  "sp-st-initial": "sp/st في أول المقطع تُنطق «شپ/شت»",
  "ig-ending": "‑ig في آخر الكلمة تُنطق «ـِش» الخفيفة (مثل ich)",
  "double-consonant": "الحرف المضاعف يعني: الحركة قبله قصيرة",
  z: "z تُنطق «تس» — ليست زاياً",
  "v-f": "v هنا تُنطق f",
  "w-v": "w تُنطق «ڤ» (v الإنجليزية) — ليست «و»",
  "ie-short": "ie هنا قصيرة خلافاً للقاعدة — لا تمدّها",
  "ng-velar": "ng صوت أنفي واحد (مثل «ng» في الإنجليزية) — لا تُسمِع g أو k بعده",
};

/** سطر التنبيه للبطاقة — فارغ إن لم يكن للكلمة أعلام */
export function pronunciationHint(risks: readonly PhoneticRisk[]): string {
  return risks.map((r) => PHONETIC_RISK_HINT[r]).join(" · ");
}
