// src/lib/audio-assets.ts — من ملف المحتوى إلى رابط يُشغَّل (D104)
// كان الصوت كله (772 مقطعاً) يُولَّد ويُقاس ويُختبر — ثم لا يصل إلى المتعلم: لا ملف واحد في dist.
// import.meta.glob يضمّن كل *.opus تحت content/ كأصل مُجزّأ (hash) في البناء — بلا نسخ يدوي ولا سجل يُنسى.
const CLIP_URLS = import.meta.glob("../../content/**/*.opus", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

const PREFIX = "../../content/";

/** معرّف المسار = اسم الملف بلا امتداد (word-licht · mt1-h2-d1-l2 · mueller-announce-01) */
const BY_ID: ReadonlyMap<string, string> = new Map(
  Object.entries(CLIP_URLS).map(([path, url]) => [path.slice(path.lastIndexOf("/") + 1).replace(/\.opus$/, ""), url]),
);

/** رابط المقطع بمعرّف مساره في المانيفست — undefined = لا مقطع (يتولى Web Speech) */
export function clipUrl(trackId: string): string | undefined {
  return BY_ID.get(trackId);
}

/** رابط المقطع بمساره النسبي عن content/ (حقل file في المانيفست) */
export function clipUrlForFile(file: string): string | undefined {
  return CLIP_URLS[PREFIX + file];
}

/** عدد المقاطع المضمَّنة — ومعرّفاتها فريدة (يُختبر: لا اسمان متماثلان في مجلدين) */
export const CLIP_FILE_COUNT = Object.keys(CLIP_URLS).length;
export const CLIP_ID_COUNT = BY_ID.size;
