// content/schemas/video.ts — ركن الفيديو §2.12 (D308 · N-156/11)
// القيد: §34 (لا اختلاق) — الرابط والتحقق متلازمان: لا رابط معروض بلا تحقق حيّ،
// ولا «متحقق» بلا رابط. والتثبيت عام لا يدّعي محتوى حلقة بعينها.
import { z } from "zod";
import { Level } from "./common.js";

/** المصادر المجانية الموثقة المسموحة (قائمة مغلقة — §34: المصدر) */
export const VIDEO_SOURCES = ["DW", "Easy German", "Dreaming German", "Jojo", "Marija"] as const;

export const VideoEntry = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    titleDe: z.string().min(1),
    titleAr: z.string().min(1),
    source: z.enum(VIDEO_SOURCES),
    /** الرابط — غائب (null) حتى التحقق الحيّ */
    url: z
      .string()
      .regex(/^https:\/\//, "e-video-url-scheme: الرابط https حصراً")
      .nullable(),
    level: Level,
    /** دقائق الفيديو 3–6 (فيديو اليوم) */
    minutes: z.number().int().min(3).max(6),
    /** سؤال التثبيت بعد المشاهدة: سؤال عربي + جواب توجيهي (لا يدّعي محتوى الحلقة) */
    fixation: z.object({
      q: z.string().regex(/[؀-ۿ]/, "e-video-fixation-ar: سؤال التثبيت عربي"),
      a: z.string().min(1),
    }),
    verified: z.boolean(),
  })
  .refine((e) => (e.verified ? e.url !== null : true), {
    message: "e-video-verified-nourl: متحقق بلا رابط",
  })
  .refine((e) => (e.url !== null ? e.verified : true), {
    message: "e-video-url-unverified: رابط بلا تحقق (§34)",
  });
export type VideoEntry = z.infer<typeof VideoEntry>;

/** رف المستوى: entries قد تكون فارغة (الرف يُملأ بعد التحقق — والركن يعمل أوفلاين) */
export const VideoShelf = z.object({
  schemaVersion: z.string().min(1),
  id: z.string().regex(/^[a-z0-9-]+$/),
  level: Level,
  entries: z.array(VideoEntry),
});
export type VideoShelf = z.infer<typeof VideoShelf>;
