// src/lib/image-assets.ts — من ملف الصورة إلى رابط يُعرَض (D298 · N-156/1)
// الصور الـ12 وُلّدت ورُبطت بالدروس (D96/D97) — ثم لا صورة واحدة في الواجهة.
// import.meta.glob يضمّن كل صور content/images/ كأصول مُجزّأة (hash) في البناء — بلا نسخ يدوي ولا سجل يُنسى.
const IMAGE_URLS = import.meta.glob("../../content/images/*.{jpg,jpeg,png,webp}", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

const PREFIX = "../../content/";

/** رابط الصورة بمسارها النسبي عن content/ (حقل file في المانيفست) — undefined = لا ملف */
export function imageUrlForFile(file: string): string | undefined {
  return IMAGE_URLS[PREFIX + file];
}

/** رابط الصورة بمعرّفها في المانيفست (img-brot) — undefined = لا ملف */
export function imageUrlById(imageId: string): string | undefined {
  const hit = Object.keys(IMAGE_URLS).find((p) => p.slice(p.lastIndexOf("/") + 1).replace(/\.[^.]+$/, "") === imageId);
  return hit ? IMAGE_URLS[hit] : undefined;
}

/** عدد الصور المضمَّنة (يُختبر: يساوي مانيفست الصور) */
export const IMAGE_FILE_COUNT = Object.keys(IMAGE_URLS).length;
