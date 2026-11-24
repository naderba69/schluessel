// src/lib/grammar-atlas.ts — أطلس القواعد «خريطة المترو» (D576 — §12)
// الخطوط الستة الحاكمة بالمواصفة: 🔴 سكة الجملة · 🔵 الحالات · 🟢 الأفعال · 🟡 الصفات والأدلة
// · 🟣 حروف الجر · 🟠 الروابط والجسيمات. قواعد الأطلس: فتح تدريجي (المحطة تُفتح عند تقديمها في درسها)
// · تشريح المحطة (من شفرتها في الخزانة) · آلية الصدأ (محطة مهملة تُذكَّر بعد RUST_DAYS) ·
// الأطلس مرجع الحقيقة للقواعد — وكل الجمل والأمثلة فيه Bidi إلزامي (dir="ltr" في المكوّن).
// المحطات بلا شفرة مربوطة «مرجع» مفتوحة دائماً (تشريحها يأتي من درسها) — لا ادّعاء ربط لا وجود له.

export type AtlasStation = {
  id: string;
  titleAr: string;
  /** شفرة الخزانة التي تحمل تشريح المحطة (ars-*.json) — غيابها = محطة مرجعية */
  arsenalId?: string;
  /** أول درس يقدّم الشفرة (من usedInLessons) — تُفتح المحطة ببلوغه */
  firstLesson?: string;
};

export type AtlasLine = {
  id: "satzbau" | "kasus" | "verben" | "adjektive" | "praepositionen" | "konnektoren";
  color: string;
  nameAr: string;
  nameDe: string;
  stations: readonly AtlasStation[];
};

/** الخطوط الستة (§12 — المواصفة الحاكمة) */
export const ATLAS_LINES: readonly AtlasLine[] = Object.freeze([
  {
    id: "satzbau",
    color: "#c0392b",
    nameAr: "سكة الجملة",
    nameDe: "Satzbau",
    stations: [
      { id: "v2", titleAr: "V2 — الفعل ثانياً دائماً" },
      { id: "satzklammer", titleAr: "القلنسوة (Satzklammer)", arsenalId: "ars-satzklammer", firstLesson: "a1-u9-d5" },
      { id: "nebensatz", titleAr: "الجملة الفرعية", arsenalId: "ars-dass-satz", firstLesson: "a2-u2-d2" },
      { id: "tekamolo", titleAr: "TEKAMOLO — ترتيب الظروف", arsenalId: "ars-tekamolo", firstLesson: "a1-u9-d5" },
    ],
  },
  {
    id: "kasus",
    color: "#2980b9",
    nameAr: "الحالات",
    nameDe: "Kasus",
    stations: [
      { id: "nominativ", titleAr: "المرفوع (Nominativ)" },
      { id: "akkusativ", titleAr: "المنصوب (Akkusativ)", arsenalId: "ars-akkusativ-1", firstLesson: "a1-u4-d3" },
      { id: "dativ", titleAr: "المنسوب (Dativ)" },
      { id: "genitiv", titleAr: "المضاف (Genitiv)", arsenalId: "ars-genitiv-s", firstLesson: "a2-u10-d2" },
      { id: "dativ-fix", titleAr: "الداتيف الخاص", arsenalId: "ars-dativ-fix", firstLesson: "a1-u8-d4" },
    ],
  },
  {
    id: "verben",
    color: "#1e7e34",
    nameAr: "الأفعال",
    nameDe: "Verben",
    stations: [
      { id: "praesens", titleAr: "المضارع", arsenalId: "ars-praesens-regelm", firstLesson: "a1-u7-d3" },
      { id: "trennbar", titleAr: "المنفصلة", arsenalId: "ars-trennbare", firstLesson: "a1-u7-d5" },
      { id: "ablaut", titleAr: "الشاذة (Ablautreihen)" },
      { id: "perfekt", titleAr: "الماضي (Perfekt/Präteritum)", arsenalId: "ars-perfekt", firstLesson: "a1-u11-d3" },
      { id: "modal", titleAr: "الأدوات دلالةً", arsenalId: "ars-modal-fix", firstLesson: "a1-u11-d5" },
      { id: "konjunktiv", titleAr: "المنصوب الشرطي (Konjunktiv II ثم I)", arsenalId: "ars-konj-ii", firstLesson: "b1-u6-d1" },
    ],
  },
  {
    id: "adjektive",
    color: "#c9a227",
    nameAr: "الصفات والأدلة",
    nameDe: "Adjektive & Artikel",
    stations: [
      { id: "genuscode", titleAr: "الجنس الاشتقاقي", arsenalId: "ars-genuscode", firstLesson: "a1-u2-d3" },
      { id: "plural", titleAr: "الجمع", arsenalId: "ars-plural-umlaut", firstLesson: "a1-u6-d1" },
      { id: "adj-dekl", titleAr: "التصريف الثلاثي (قوي/ضعيف/مختلط)", arsenalId: "ars-adjektiv-dekl", firstLesson: "a2-u7-d1" },
      { id: "komparativ", titleAr: "المقارنة والتفضيل", arsenalId: "ars-komparativ", firstLesson: "a2-u7-d3" },
    ],
  },
  {
    id: "praepositionen",
    color: "#8e44ad",
    nameAr: "حروف الجر",
    nameDe: "Präpositionen",
    stations: [
      { id: "fixpraep", titleAr: "ثابتة الحالة", arsenalId: "ars-von-seit-bei", firstLesson: "a1-u8-d5" },
      { id: "wechsel", titleAr: "التحوّل (Wechselpräpositionen)", arsenalId: "ars-wechselpraep", firstLesson: "a1-u9-d4" },
      { id: "verben-praep", titleAr: "أفعال الجر الثابتة (10‑ك)", arsenalId: "ars-verben-praep", firstLesson: "b1-u7-d2" },
      { id: "da-wo", titleAr: "da-/wo-Komposita", arsenalId: "ars-da-komposita", firstLesson: "a1-u6-d5" },
    ],
  },
  {
    id: "konnektoren",
    color: "#e67e22",
    nameAr: "الروابط والجسيمات",
    nameDe: "Konnektoren & Partikeln",
    stations: [
      { id: "grund", titleAr: "und/aber/oder/denn" },
      { id: "neben-conn", titleAr: "weil/dass/wenn", arsenalId: "ars-weil-satz", firstLesson: "a1-u10-d5" },
      { id: "gegensatz", titleAr: "deshalb/trotzdem/dennoch", arsenalId: "ars-deshalb-trotzdem", firstLesson: "b1-u1-d1" },
      { id: "fein", titleAr: "zumal/wobei/sodass" },
      { id: "partikeln", titleAr: "Modalpartikeln", arsenalId: "ars-modalpartikeln", firstLesson: "b1-u5-d2" },
    ],
  },
]);

/** آلية الصدأ (§12): محطة مفتوحة لم تُراجَع منذ RUST_DAYS يوماً تُذكَّر */
export const RUST_DAYS = 21;

export type StationStatus = "reference" | "locked" | "open" | "rusty";

/**
 * حالة المحطة (حتمية — بلا وقت جداري):
 * - reference: بلا شفرة مربوطة — مرجع مفتوح دائماً (تشريحها من درسها).
 * - locked: لم يبلغ المتعلم درس تقديمها بعد (§12: فتح تدريجي).
 * - open: مفتوحة.
 * - rusty: مفتوحة لكنها مهملة منذ ≥RUST_DAYS يوماً (تُذكَّر لا تُؤنب — D23).
 */
export function stationStatus(
  station: AtlasStation,
  learnerIndex: number,
  lessonIndexOf: (lessonId: string) => number,
  daysSinceSeen?: number | null,
): StationStatus {
  if (!station.arsenalId || !station.firstLesson) return "reference";
  const taught = lessonIndexOf(station.firstLesson);
  if (taught < 0 || learnerIndex < taught) return "locked";
  if (daysSinceSeen != null && daysSinceSeen >= RUST_DAYS) return "rusty";
  return "open";
}

/** كل شفرات الأطلس المربوطة — لفحص التكامل (كلها موجودة في الخزانة) */
export function atlasArsenalIds(): string[] {
  return ATLAS_LINES.flatMap((l) => l.stations.map((s) => s.arsenalId).filter((x): x is string => !!x));
}
