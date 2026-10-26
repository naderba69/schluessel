// content/schemas/audio-script.ts — السكربت الصوتي الموجَّه (D103 — القانون 11: «المانيفست قبل أي توليد»)
// كل سطر = مسار صوتي واحد بصوت متحدثه الثابت (characterVoices في المانيفست) — يقسّمه dialogue-splitter.
// التقسيم سطراً سطراً يحفظ ثابت «صوت واحد لكل مسار» فتبقى قاعدتا المدقِّق (الصوتان + الأدوار) صادقتين.
import { z } from "zod";
import { ArText, DeText, Level, SchemaVersioned, Slug } from "./common.js";
import { CharacterId } from "./manifest.js";

/**
 * §5‑هـ: سرعة A2 تبدأ من 0.85× — فمواد A1 لا تتجاوزها. lengthScale غير خطي في Piper (قياس D103:
 * 1.18 أبطأ بـ7–9% فقط) — المعايرة المقيسة (متوسط 6 توليدات/صوت): 1.30 → thorsten ×1.172 · kerstin ×1.147
 * | 1.40 → ×1.249 · ×1.217. الهدف ×1.176 (=1/0.85) ← 1.32 ≈ 0.84× (thorsten) و0.86× (kerstin).
 */
export const A1_LENGTH_SCALE = 1.32;

/**
 * نوع السكربت ← دور المسار في المانيفست (ROLE_FOR_KIND).
 * message (D109): رسالة هاتفية/على المجيب الآلي — شخصية واحدة تتكلم في كل سطر (Hören Teil 3 في A1)؛
 * ليست حواراً (لا طرف ثانٍ) ولا إعلاناً (ليست بصوت المذيع المحايد).
 */
export const ScriptKind = z.enum(["dialogue", "announcement", "words", "message"]);
export type ScriptKind = z.infer<typeof ScriptKind>;

/** المتحدث: إحدى الشخصيات الثمانية (صوتها ثابت) أو «المذيع» المحايد للإعلانات (الصوت الرئيسي) */
export const ScriptSpeaker = z.union([CharacterId, z.literal("announcer")]);
export type ScriptSpeaker = z.infer<typeof ScriptSpeaker>;

export const AudioScriptLine = z.object({
  id: Slug,
  speaker: ScriptSpeaker,
  text: DeText,
  /** توجيه الأداء بالعربية (النبرة/المقصد) — «سطر موجَّه» للمراجع البشري */
  direction: z.string().min(1).optional(),
  /**
   * D182 (قرار المالك على N-015): إبطاء سطرٍ بعينه فوق lengthScale السكربت — لسطر قاسه tools/dev/speech-rate.py
   * فوق 200 كلمة/دقيقة. لا يقلّ عن قيمة السكربت (لا تسريع سطر منفرد) — يحرسه superRefine. الحدّ الأعلى 2.0 (القياس:
   * 1.32 → 1.5 أبطأت الأسئلة القصيرة 5–10% فقط؛ الأسطر الأقصر تحتاج 1.8).
   */
  lengthScale: z.number().min(0.8).max(2).optional(),
});
export type AudioScriptLine = z.infer<typeof AudioScriptLine>;

export const AudioScript = SchemaVersioned.extend({
  id: Slug,
  kind: ScriptKind,
  level: Level,
  title: z.object({ de: DeText, ar: ArText }),
  /** أين يُستخدم: معرّف درس (a1-u2-d5) أو «<modelltest-id>#<part-id>» */
  usedIn: z.array(z.string().min(1)).min(1),
  /**
   * طول الفونيم في Piper (>1 أبطأ). مواد A1 ≥ A1_LENGTH_SCALE (≈0.85× مقيسة).
   * السرعة الفعلية تُقاس من الملف وتُسجَّل في speedWpm — لا قيمة اسمية.
   */
  lengthScale: z.number().min(0.8).max(1.5).default(1),
  lines: z.array(AudioScriptLine).min(1),
}).superRefine((s, ctx) => {
  const ids = new Set<string>();
  for (const [i, l] of s.lines.entries()) {
    if (ids.has(l.id)) ctx.addIssue({ code: "custom", path: ["lines", i, "id"], message: `معرّف سطر مكرر: ${l.id}` });
    ids.add(l.id);
    if (s.kind === "announcement" && l.speaker !== "announcer")
      ctx.addIssue({ code: "custom", path: ["lines", i, "speaker"], message: "الإعلانات بصوت المذيع المحايد فقط (announcer)" });
    if (s.kind !== "announcement" && l.speaker === "announcer")
      ctx.addIssue({ code: "custom", path: ["lines", i, "speaker"], message: "announcer للإعلانات فقط — الحوار والكلمات بأصوات الشخصيات" });
    if (l.lengthScale !== undefined && l.lengthScale < s.lengthScale)
      ctx.addIssue({ code: "custom", path: ["lines", i, "lengthScale"], message: `lengthScale السطر (${l.lengthScale}) أسرع من السكربت (${s.lengthScale}) — الإبطاء وحده مسموح (D182)` });
  }
  if (s.level === "A1" && s.lengthScale < A1_LENGTH_SCALE)
    ctx.addIssue({ code: "custom", path: ["lengthScale"], message: `مواد A1 لا تتجاوز سرعة 0.85× (lengthScale ≥ ${A1_LENGTH_SCALE})` });
  if (s.kind === "dialogue") {
    const speakers = new Set(s.lines.map((l) => l.speaker));
    if (s.lines.length < 2 || speakers.size < 2)
      ctx.addIssue({ code: "custom", path: ["lines"], message: "الحوار يحتاج سطرين ومتحدثَين مختلفين على الأقل" });
  }
});
export type AudioScript = z.infer<typeof AudioScript>;

/** طول الفونيم الفعلي لسطر: السطر إن حُدّد (أبطأ) وإلا السكربت (D182) */
export function lineLengthScale(script: Pick<AudioScript, "lengthScale">, line: Pick<AudioScriptLine, "lengthScale">): number {
  return line.lengthScale ?? script.lengthScale;
}
