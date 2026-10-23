// src/lesson-packs.ts — سجل المحتوى الحي (D3: المحتوى بيانات في git) — تلقائي منذ D105، كسول منذ D242 (N-050)
// الملف موجود ⇔ مُسجَّل — والتحقق بـzod عند التحميل (خطأ محتوى = خطأ صريح فوري).
// القاعدة: الغلاف والقائمة يحمّلان الفهرس وحده (~68K)؛ الدرس وكلماته وقواعده وحواراته وبنكه تُحمَّل عند فتح الحصة فقط.
// الاختبارات تحمل الكل عبر loadAll* — والتطبيق لا يستدعي loadAll* أبداً.
import { z } from "zod";
import {
  Lesson as LessonSchema,
  Word as WordSchema,
  CultureCard,
  CyclicTest,
  Modelltest,
  ReadingText,
  TransferPack,
  ImageManifest,
  GrammarRuleFile,
  StoryBook,
  AudioScript,
  type Lesson,
  type Word,
} from "../content/schemas/index.js";
import imageManifest from "../content/manifests/image-manifest.json";
import lessonIndexJson from "../content/manifests/lesson-index.json";
import { ruleFromShufra, type GrammarRule } from "./lib/grammar-discovery.js";
import type { Phrase } from "./lib/phrase-bank.js";
import type { PathLesson } from "./lib/lesson-path.js";

type JsonModules = Record<string, unknown>;
const json = (mods: JsonModules) => Object.keys(mods).sort().map((k) => mods[k]);

// ---------- الفهرس الخفيف (يُحمَّل مع الغلاف — القائمة والمسار منه) ----------
const LessonIndexEntry = z.object({
  id: z.string(), level: z.enum(["A1", "A2", "B1", "B2"]), unit: z.number(), day: z.number(),
  zielAr: z.string(), wordIds: z.array(z.string()),
});
export type LessonIndexEntry = z.infer<typeof LessonIndexEntry>;

/** كل الدروس المنشورة: معرّف + مستوى + وحدة + يوم + هدف + كلمات — من content/manifests/lesson-index.json (تولّده tools/dev/content-index.py) */
export const LESSON_INDEX: LessonIndexEntry[] = z.array(LessonIndexEntry).parse(lessonIndexJson);

/** ترتيب الدروس: المستوى ثم الوحدة ثم اليوم (D128) */
export const LESSON_ORDER: string[] = LESSON_INDEX.map((e) => e.id);

export const LEVEL_ORDER: Record<Lesson["level"], number> = { A1: 0, A2: 1, B1: 2, B2: 3 };

/** المسار الخفيف للقائمة (PathLesson) — من الفهرس وحده */
export const PATH: PathLesson[] = LESSON_INDEX.map((e) => ({ id: e.id, level: e.level, unit: e.unit }));

/** أول درس يدرّس كل كلمة (D59): من wordIds الفهرس — الترتيب نفسه كما كان من الدروس الكاملة */
export const FIRST_TAUGHT: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  LESSON_INDEX.forEach((e, i) => {
    for (const w of e.wordIds) if (!(w in m)) m[w] = i;
  });
  return m;
})();

/** D271: مستوى أول درس يدرّس الكلمة — undefined للكلمة الغريبة عن الفهرس (تُستبعد من M بصدق) */
export function levelOfWord(wordId: string): LessonIndexEntry["level"] | undefined {
  const i = FIRST_TAUGHT[wordId];
  return i === undefined ? undefined : LESSON_INDEX[i].level;
}

/** صف الفهرس لدرس — غيابه يعني درساً محذوفاً من git والمسار يشير إليه (D3: خطأ صريح) */
export function indexEntry(lessonId: string): LessonIndexEntry {
  const e = LESSON_INDEX.find((x) => x.id === lessonId);
  if (!e) throw new Error(`درس مفقود من الفهرس: ${lessonId} — حدّث content/manifests/lesson-index.json`);
  return e;
}

// ---------- ملفات صغيرة خاملة (للاختبارات والمخابر؛ تُقشَّط من حزمة التطبيق إن لم تُستورد) ----------
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

/** حزم التحويل للمؤجلة (D293) */
export const ALL_TRANSFER = json(import.meta.glob("../content/transfer/*.json", { eager: true, import: "default" }))
  .map((j) => TransferPack.parse(j));

// ---------- لوادر كسولة (الحصة تحمل درسها وحده) ----------
type LazyMods = Record<string, () => Promise<unknown>>;
const WORD_MODS = import.meta.glob("../content/words/*.json", { import: "default" }) as unknown as LazyMods;
const LESSON_MODS = import.meta.glob("../content/lessons/*/*.json", { import: "default" }) as unknown as LazyMods;
const GRAMMAR_MODS = import.meta.glob("../content/arsenal/grammar/*.json", { import: "default" }) as unknown as LazyMods;
const SCRIPT_MODS = import.meta.glob("../content/audio-scripts/*.json", { import: "default" }) as unknown as LazyMods;
const STORY_MODS = import.meta.glob("../content/story/*.json", { import: "default" }) as unknown as LazyMods;

const CACHE = new Map<string, unknown>();

async function loadJson<T>(mods: LazyMods, key: string, schema: { parse: (d: unknown) => T }): Promise<T> {
  const hit = CACHE.get(key);
  if (hit !== undefined) return hit as T;
  const l = mods[key];
  if (!l) throw new Error(`محتوى مفقود: ${key} — الملف غائب من git`);
  const data = schema.parse(await l());
  CACHE.set(key, data);
  return data;
}

/** كلمة واحدة بالمعرّف (اسم الملف = المعرّف — N-050) */
export function loadWord(id: string): Promise<Word> {
  return loadJson(WORD_MODS, `../content/words/${id}.json`, WordSchema);
}

/** كلمات بالمعرّفات — بالترتيب المعطى */
export function loadWords(ids: readonly string[]): Promise<Word[]> {
  return Promise.all(ids.map(loadWord));
}

/** كل الكلمات — للاختبارات الشاملة فقط (التطبيق لا يستدعيها) */
export function loadAllWords(): Promise<Word[]> {
  return Promise.all(Object.keys(WORD_MODS).sort().map((k) => loadJson(WORD_MODS, k, WordSchema)));
}

/** درس واحد بالمعرّف (المجلد = المستوى بحروف صغيرة — N-050) */
export function loadLesson(id: string): Promise<Lesson> {
  const e = indexEntry(id);
  return loadJson(LESSON_MODS, `../content/lessons/${e.level.toLowerCase()}/${id}.json`, LessonSchema);
}

/** كل الدروس — للاختبارات الشاملة فقط */
export async function loadAllLessons(): Promise<Lesson[]> {
  const lessons = await Promise.all(
    Object.keys(LESSON_MODS).sort().map((k) => loadJson(LESSON_MODS, k, LessonSchema)),
  );
  return lessons.sort((a, b) => LEVEL_ORDER[a.level]! - LEVEL_ORDER[b.level]! || a.unit - b.unit || a.day - b.day);
}

/**
 * كلمات الدرس المباشرة — غياب كلمة = خطأ فوري (D3: لا شاشات ناقصة أبداً).
 * الرسالة نفسها كما كانت: «مفقودة».
 */
export async function wordsForLesson(lesson: Lesson): Promise<Word[]> {
  const out: Word[] = [];
  for (const id of lesson.praesentation.wordIds) {
    const key = `../content/words/${id}.json`;
    if (!WORD_MODS[key]) throw new Error(`كلمة مفقودة من المحتوى: ${id}`);
    out.push(await loadJson(WORD_MODS, key, WordSchema));
  }
  return out;
}

/**
 * كلمات التشغيل: المباشرة + أفراد العوائل المدروسة حتى هذا الدرس (D59) — يُستبعد الأجنبي/المؤجل والقواعد-فقط.
 * FIRST_TAUGHT من الفهرس — النتيجة نفسها كما كانت من الدروس الكاملة.
 */
export async function runtimeWordsForLesson(lesson: Lesson): Promise<Word[]> {
  // N-116 (ج — D227): الحزمة أيضاً — قد تفوق كلمات العرض (dürfen/sollen في u11-d5) والمشغّل يتحقق من اكتمالها
  const ids = [...new Set([...lesson.praesentation.wordIds, ...lesson.warmup.cardIds, ...lesson.zusammenfassung.srsBundleWordIds])];
  for (const id of ids) {
    if (!WORD_MODS[`../content/words/${id}.json`]) throw new Error(`كلمة مفقودة من المحتوى: ${id}`);
  }
  const base = await loadWords(ids);
  // D118: أعضاء عائلة كلمات الدرس الذين دُرسوا حتى هذا الدرس (ضمناً) — لتُعرض العائلة بصيغتها الألمانية؛
  // ما لم يُدرَّس بعد لا يُمرَّر فلا يظهر (قانون الجبهة 13). درس خارج المسار (اختبار) ⇒ لا إضافات.
  const at = LESSON_ORDER.indexOf(lesson.id);
  const extra = new Set<string>();
  if (at >= 0)
    for (const w of base)
      for (const f of w.wordFamily) {
        const first = FIRST_TAUGHT[f];
        if (first !== undefined && first <= at && !ids.includes(f)) extra.add(f);
      }
  const extras = await loadWords([...extra]);
  return [...base, ...extras];
}

/** قاعدة واحدة — الغائبة تُسقط (D115: معرّف بلا ملف = قاعدة لم تُكتب بعد — تُخفى لا أن تُكسر الحصة) */
export async function loadGrammarRule(id: string): Promise<GrammarRule | undefined> {
  const key = `../content/arsenal/grammar/${id}.json`;
  if (!GRAMMAR_MODS[key]) return undefined;
  return ruleFromShufra(await loadJson(GRAMMAR_MODS, key, GrammarRuleFile));
}

/** قواعد الدرس — بالترتيب، والغائبة تُسقط (كما كان) */
export async function loadGrammarRules(ids: readonly string[]): Promise<GrammarRule[]> {
  const rules = await Promise.all(ids.map(loadGrammarRule));
  return rules.filter((r): r is GrammarRule => !!r);
}

/** كل القواعد — للاختبارات الشاملة فقط */
export async function loadAllGrammarRules(): Promise<GrammarRule[]> {
  const files = await Promise.all(
    Object.keys(GRAMMAR_MODS).sort().map((k) => loadJson(GRAMMAR_MODS, k, GrammarRuleFile)),
  );
  return files.map(ruleFromShufra);
}

/**
 * سكربتات الحصة: حوارات الدرس (`${lessonId}-*`) + ملفات المستوى المشتركة (alphabet/zahlen/termine — N-050).
 * سكربتات الامتحانات (mt*) لا تُحمَّل في الحصة.
 */
const LESSON_FILE = /^[a-z]\d+-u\d+-d\d+-/;
export async function loadScriptsForLesson(lessonId: string, level: string): Promise<import("../content/schemas/index.js").AudioScript[]> {
  const lvl = level.toLowerCase();
  const keys = Object.keys(SCRIPT_MODS).sort().filter((k) => {
    const base = k.slice(k.lastIndexOf("/") + 1);
    if (base.startsWith(`${lessonId}-`)) return true;
    if (!base.startsWith(`${lvl}-`)) return false;
    if (LESSON_FILE.test(base)) return false;
    if (base.includes("-mt")) return false;
    return true;
  });
  return Promise.all(keys.map((k) => loadJson(SCRIPT_MODS, k, AudioScript)));
}

/** D280: هل للدرس سكربت مباشر؟ (فحص متزامن على مفاتيح الـglob — بلا تحميل) */
export function hasDirectScript(lessonId: string): boolean {
  return Object.keys(SCRIPT_MODS).some((k) => {
    const base = k.slice(k.lastIndexOf("/") + 1);
    return base.startsWith(`${lessonId}-`);
  });
}

/** D280: درس الظل اليومي — أحدث درس مكتمل له حوار مباشر («ظل حواراً متقناً» ب-20) */
export function shadowingLessonId(completedIds: readonly string[]): string | undefined {
  return [...completedIds].reverse().find((id) => hasDirectScript(id));
}

/** كل السكربتات — للاختبارات الشاملة فقط */
export function loadAllScripts(): Promise<import("../content/schemas/index.js").AudioScript[]> {
  return Promise.all(Object.keys(SCRIPT_MODS).sort().map((k) => loadJson(SCRIPT_MODS, k, AudioScript)));
}

/** كتب القصة (ملف واحد اليوم — 64K — يُحمَّل مع الحصة ويُحفظ) */
export function loadStoryBooks(): Promise<import("../content/schemas/index.js").StoryBook[]> {
  return Promise.all(Object.keys(STORY_MODS).sort().map((k) => loadJson(STORY_MODS, k, StoryBook)));
}

const BankPhrase = z.object({
  de: z.string(), ar: z.string().optional(), functions: z.array(z.string()), firstLesson: z.string(),
  lessons: z.array(z.string()), sources: z.array(z.string()),
});

/** بنك Redemittel المُحصَد مسبقاً (content/manifests/phrase-bank.json — تولّده tools/dev/build-phrase-bank.ts) */
let bankCache: Phrase[] | null = null;
export async function loadPhraseBank(): Promise<Phrase[]> {
  if (bankCache) return bankCache;
  const mod = await import("../content/manifests/phrase-bank.json");
  bankCache = z.array(BankPhrase).parse(mod.default) as Phrase[];
  return bankCache;
}

/** حزمة الحصة الكاملة: الدرس + كلمات التشغيل + القواعد + السكربتات + القصة + البنك — تحميل متوازٍ */
export interface SessionBundle {
  lesson: Lesson;
  /** كلمات التشغيل (مباشرة + عوائل مدروسة — للمخطط) */
  words: Word[];
  /** كلمات الدرس المباشرة وحدها (للشاشة الأولى والمخابر — كما كانت firstLessonWords) */
  direct: Word[];
  rules: GrammarRule[];
  scripts: import("../content/schemas/index.js").AudioScript[];
  story: import("../content/schemas/index.js").StoryBook[];
  bank: Phrase[];
}

export async function loadSessionBundle(lessonId: string): Promise<SessionBundle> {
  const lesson = await loadLesson(lessonId);
  const [direct, words, rules, scripts, story, bank] = await Promise.all([
    wordsForLesson(lesson),
    runtimeWordsForLesson(lesson),
    loadGrammarRules(lesson.praesentation.grammarArsenalIds ?? []),
    loadScriptsForLesson(lesson.id, lesson.level),
    loadStoryBooks(),
    loadPhraseBank(),
  ]);
  return { lesson, direct, words, rules, scripts, story, bank };
}

/** حزمة أول درس (a1-u1-d1) — الشاشة الأولى والمخابر */
export function loadFirstSession(): Promise<SessionBundle> {
  return loadSessionBundle("a1-u1-d1");
}
