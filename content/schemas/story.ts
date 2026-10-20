// content/schemas/story.ts — جمل القصة المتصلة (D193 — N-003 · قرار المالك D182 Q3 أ)
// كانت `storySentenceIds` في 79 درساً تشير إلى جمل لا ملف لها. القرار: تُولَّد آلياً من أول سطر في حوار كل درس
// (`tools/dev/story-sentences.ts`) — فالقصة (يوسف · لينا · نبيل …) هي الحوارات نفسها مرتّبة، لا نصّ ثانٍ يُكتب ويُهمل.
// درس بلا حوار بعدُ = بلا جملة (الحقل فارغ بصدق) ويُضاف وحده حين يُكتب حواره.
import { z } from "zod";
import { ArText, DeText, Level, SchemaVersioned, Slug } from "./common.js";
import { CharacterId } from "./manifest.js";

export const StorySentenceId = z.string().regex(/^story-a[12]-u\d{1,2}-s\d$/u, "story-a1-u6-s4");

export const StorySentence = z.object({
  id: StorySentenceId,
  lessonId: Slug,
  /** مصدر الجملة — السكربت وسطره (الحارس يرفض جملة لم تعد تطابق سطرها) */
  scriptId: Slug,
  lineId: Slug,
  speaker: CharacterId,
  de: DeText,
  /** سياق الحلقة بالعربية = عنوان السكربت العربي (مكتوب أصلاً للمتعلم) */
  contextAr: ArText,
});
export type StorySentence = z.infer<typeof StorySentence>;

export const StoryBook = SchemaVersioned.extend({
  id: Slug,
  level: Level,
  /** مرتّبة بترتيب الدروس (وحدة ثم يوم) */
  sentences: z.array(StorySentence).superRefine((arr, ctx) => {
    const ids = new Set<string>();
    for (const s of arr) {
      if (ids.has(s.id)) ctx.addIssue({ code: "custom", message: `جملة قصة مكررة: ${s.id}` });
      ids.add(s.id);
    }
  }),
});
export type StoryBook = z.infer<typeof StoryBook>;
