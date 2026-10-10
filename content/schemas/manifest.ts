// manifest.ts — مانيفستا الصوت والصورة | القانون 11 + D20 (Piper حصراً) + §5‑هـ (role: guest)
import { z } from "zod";
import { SchemaVersioned, Slug } from "./common.js";

/** الشخصيات الثمانية (D20‑أ — §11) */
export const CharacterId = z.enum([
  "yusuf", "mueller", "lena", "ayse", "frau-berg", "thomas", "frau-schmidt", "dr-weber",
]);
export type CharacterId = z.infer<typeof CharacterId>;

/** الأصوات الثابتة لكل شخصية (D20 — Piper TTS محلي، أصوات CC0) */
export const AudioTrack = z.object({
  id: Slug,
  file: z.string().regex(/\.(opus|mp3|wav)$/),
  /** character: أحد الثمانية (ثابت) | guest: ضيف متغير (من B1 — §5‑هـ) | word: نطق كلمة */
  role: z.enum(["character", "guest", "word", "dialogue", "announcement"]),
  characterId: CharacterId.optional(),
  /** وسم الضيف (كسر عزلة الأذن) */
  isGuest: z.boolean().default(false),
  voiceParams: z.object({
    speaker: z.string(), // اسم صوت Piper
    speedWpm: z.number().positive(),
    pitch: z.number().optional(),
  }),
  textDe: z.string(),
  /** P0 حوارات | P1 جمل نموذجية | P2 أزواج نطق (القانون 11) */
  priority: z.enum(["P0", "P1", "P2"]),
  durationMs: z.number().positive().optional(),
  sizeBytes: z.number().positive().optional(),
  hash: z.string().optional(),
  lessonRefs: z.array(z.string()).default([]),
});

export const AudioManifest = SchemaVersioned.extend({
  generator: z.literal("piper-tts-local"), // D20 — لا API مدفوع
  voiceLicense: z.string(), // CC0/BY موثقة
  tracks: z.array(AudioTrack),
  /** أصوات الشخصيات الثمانية مثبتة عبر المسار كله */
  characterVoices: z.record(CharacterId, z.string()),
});

export const ImageSource = z.enum(["emoji", "svg-code", "cc0-photo", "ai-generated-optional"]);

export const ImageAsset = z.object({
  id: Slug,
  file: z.string(),
  source: ImageSource,
  license: z.string(),
  alt: z.string().min(1), // نص بديل إلزامي (§15)
  /** هوية بصرية: دليل واحد */
  styleGuide: z.string().optional(),
  usedInLessons: z.array(z.string()).default([]),
});

export const ImageManifest = SchemaVersioned.extend({
  assets: z.array(ImageAsset),
});

export type AudioTrack = z.infer<typeof AudioTrack>;
export type AudioManifest = z.infer<typeof AudioManifest>;
export type ImageAsset = z.infer<typeof ImageAsset>;
export type ImageManifest = z.infer<typeof ImageManifest>;
