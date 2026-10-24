// src/lib/video-corner.ts — ركن الفيديو §2.12 (D308 · N-156/11)
// الرف أوفلاين-أولاً: لا يُعرَض رابط إلا متحققاً (§34) — وما عداه «قادم».
// والبديل بلا إنترنت مذكور صراحة: الشادوينغ والقصص الصوتية المحلية.
import type { VideoEntry, VideoShelf } from "../../content/schemas/index.js";

export const VIDEO_CORNER_TITLE_AR = "🎬 ركن الفيديو";
export const VIDEO_OF_DAY_TITLE_AR = "🎬 فيديو اليوم";
export const VIDEO_INTERNET_NOTE_AR = "الفيديو يحتاج إنترنت — نقولها صراحة.";
export const VIDEO_OFFLINE_AR = "بلا إنترنت؟ الشادوينغ والقصص الصوتية في شاشة اليوم تعمل دائماً 🌱";
export const VIDEO_COMING_AR = "قادم — يُتحقق رابطه قبل الإطلاق (§34)";

/** المتحقق وحده قابل للعرض — الرابط هنا مضمون الوجود (المخطط يفرض التلازم) */
export function verifiedVideos(shelf: VideoShelf): VideoEntry[] {
  return shelf.entries.filter((e) => e.verified && e.url !== null);
}

/** غير المتحقق — يُعرَض «قادم» بلا رابط */
export function comingVideos(shelf: VideoShelf): VideoEntry[] {
  return shelf.entries.filter((e) => !e.verified || e.url === null);
}

/** فيديو اليوم: تناوب حتمي على المتحقق وحده — null = لا متحقق بعد */
export function videoOfDay(dayIndex: number, entries: readonly VideoEntry[]): VideoEntry | null {
  if (entries.length === 0) return null;
  return entries[((dayIndex % entries.length) + entries.length) % entries.length]!;
}
