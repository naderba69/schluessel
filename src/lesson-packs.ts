// src/lesson-packs.ts — سجل المحتوى الحي (D3: المحتوى بيانات في git) — تلقائي منذ D105
// كل ملف تحت content/ يُكتشف بـimport.meta.glob ويُتحقق منه بـzod عند الاستيراد — خطأ محتوى = خطأ بناء فوري.
// كان السجل ~1,700 سطر استيراد يدوي: كلمة تُنسى = كلمة غائبة عن المتعلم. الآن: الملف موجود ⇔ مُسجَّل.
import {
  Lesson as LessonSchema,
  Word as WordSchema,
  CultureCard,
  CyclicTest,
  Modelltest,
  ReadingText,
  ImageManifest,
  type Lesson,
  type Word,
} from "../content/schemas/index.js";
import imageManifest from "../content/manifests/image-manifest.json";
import { harvestPhrases, type Phrase } from "./lib/phrase-bank.js";

type JsonModules = Record<string, unknown>;
const json = (mods: JsonModules) => Object.keys(mods).sort().map((k) => mods[k]);

const WORD_JSONS = json(import.meta.glob("../content/words/*.json", { eager: true, import: "default" }));
const LESSON_JSONS = json(import.meta.glob("../content/lessons/*/*.json", { eager: true, import: "default" }));

/** بطاقات الثقافة الأسبوعية (D93) */
export const ALL_LANDESKUNDE = json(import.meta.glob("../content/landeskunde/*.json", { eager: true, import: "default" }))
  .map((j) => CultureCard.parse(j));

/** الاختبارات الدورية التراكمية (D94) */
export const ALL_PRUEFUNGEN = json(import.meta.glob("../content/pruefungen/*.json", { eager: true, import: "default" }))
  .map((j) => CyclicTest.parse(j));

/** الامتحانات التجريبية الكاملة (D95) */
export const ALL_MODELLTESTS = json(import.meta.glob("../content/modelltest/*.json", { eager: true, import: "default" }))
  .map((j) => Modelltest.parse(j));

/** مانيفست الصور — الترميز المزدوج (D96) */
export const ALL_IMAGES = ImageManifest.parse(imageManifest).assets;

/** نصوص القراءة (D97) */
export const ALL_LESETEXTS = json(import.meta.glob("../content/lese/*.json", { eager: true, import: "default" }))
  .map((j) => ReadingText.parse(j));

/** كل الكلمات المُتحقَّق منها — بلا استثناءات (مرتبة بالمعرّف) */
export const ALL_WORDS: Word[] = WORD_JSONS.map((j) => WordSchema.parse(j));

/** ترتيب المستويات (D101): A1 كله قبل A2 — قفل المسار لا يقفز بين المستويات أبداً */
export const LEVEL_ORDER: Record<Lesson["level"], number> = { A1: 0, A2: 1, B1: 2, B2: 3 };

/** كل الدروس مرتّبة (مستوى، وحدة، يوم) — بدون المستوى كان a2-u1-d1 سيقع بين a1-u1-d1 وa1-u1-d2 */
export const ALL_LESSONS: Lesson[] = LESSON_JSONS.map((j) => LessonSchema.parse(j)).sort(
  (a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level] || a.unit - b.unit || a.day - b.day,
);

/** كلمات درس بترتيب عرضه — كلمة مفقودة = خطأ فوري (D3) */
export function wordsForLesson(lesson: Lesson): Word[] {
  const byId = new Map(ALL_WORDS.map((w) => [w.id, w]));
  return lesson.praesentation.wordIds.map((id) => {
    const w = byId.get(id);
    if (!w) throw new Error(`كلمة مفقودة من المحتوى: ${id}`);
    return w;
  });
}

/** كلمات التشغيل: الجديد + بطاقات الدفء (استرجاع من دروس سابقة) */
export function runtimeWordsForLesson(lesson: Lesson): Word[] {
  const byId = new Map(ALL_WORDS.map((w) => [w.id, w]));
  const ids = [...lesson.praesentation.wordIds, ...lesson.warmup.cardIds];
  return [...new Set(ids)].map((id) => {
    const w = byId.get(id);
    if (!w) throw new Error(`كلمة مفقودة من المحتوى: ${id}`);
    return w;
  });
}

/** توافق مع الاستخدام القديم */
export const firstLesson: Lesson = ALL_LESSONS.find((l) => l.id === "a1-u1-d1")!;
export const firstLessonWords: Word[] = wordsForLesson(firstLesson);

/** ترتيب المسار (معرّفات الدروس) — أساس قانون الجبهة */
export const LESSON_ORDER: string[] = ALL_LESSONS.map((l) => l.id);

/** بنك Redemittel المحصود من المحتوى الحي (D107) — كل عبارة بوسم «ظهرت في درس…» */
export const PHRASE_BANK: Phrase[] = harvestPhrases(ALL_LESSONS, ALL_WORDS);
