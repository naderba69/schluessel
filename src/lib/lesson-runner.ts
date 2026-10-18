// src/lib/lesson-runner.ts — مُشغِّل الدرس: يحوّل محتوى الدرس (D3: بيانات في git) إلى شاشات الحصة الأربع
// الربط: E01 (المحطات) · §2.5 (الاسترجاع) · F121 (محاولة قبل كشف) · D29 (حصة واحدة متصلة)
import type { Lesson, Word } from "../../content/schemas/index.js";
import type { GrammarRule } from "./grammar-discovery.js";

/** بطاقة المصيدة — من مخطط الدرس مباشرة (لا نكرر التعريف) */
export type WarningCardData = Lesson["zusammenfassung"]["warningCards"][number];

export type RecallCardData = {
  id: string;
  front: string;
  back: string;
  /** D104: مسار الكلمة في المانيفست (word-<id>) + نصها المنطوق للاحتياطي (Web Speech) */
  audioId: string;
  speakText: string;
};

export type LearnCardData = {
  wordId: string;
  /** النص الألماني (كلمة/جملة) — يُعرض أولاً */
  promptDe: string;
  /** المعنى/السياق العربي — يُحاول المتعلم أولاً */
  promptAr: string;
  /** الشرح بعد المحاولة: التحديد الكامل + الجنس + مصيدة متوقعة */
  explanation: string;
  /** D104: «الصوت يُشغَّل لحظة ظهور الكلمة» (§3 Präsentation) — مسار الكلمة + نصها المنطوق */
  audioId: string;
  speakText: string;
};

export type PracticeData = {
  stations: Lesson["uebung"]["stations"];
  communicativeTask: Lesson["uebung"]["communicativeTask"];
  /** D188: الكلمات المستعارة المعلنة — تُعرض قبل التدريب وتُترجم على الكلمة */
  borrowed?: Lesson["praesentation"]["borrowedWords"];
};

export type CloseData = {
  summaryDe: string;
  summaryAr: string;
  warningCards: WarningCardData[];
  srsBundleWordIds: string[];
};

export type LessonStationPlan = {
  lessonId: string;
  /** محطة 1 — الاسترجاع: بطاقات الدفء أولاً (لا جديد أبداً هنا) */
  recall: RecallCardData[];
  /** محطة 2 — الجديد: محاولة قبل الكشف (F121) */
  learn: LearnCardData[];
  /** محطة 2 بعد الكلمات — قاعدة اليوم بالاكتشاف الموجَّه (D115): المعرّفات التي لها ملف قاعدة فقط */
  rules: GrammarRule[];
  /** محطة 3 — التدريب */
  practice: PracticeData;
  /** محطة 4 — الخلاصة */
  close: CloseData;
};

function wordById(words: Word[], id: string): Word {
  const w = words.find((x) => x.id === id);
  if (!w) throw new Error(`كلمة مفقودة من المحتوى: ${id}`);
  return w;
}

/**
 * الشكل الكامل للكلمة مع أداة التعريف — مرة واحدة فقط (D101).
 * 273 اسماً من A1 تحمل الأداة داخل `de` نفسه ("die Landschaft") — كانت تُعرض «die die Landschaft».
 */
export function fullForm(w: Pick<Word, "de" | "article">): string {
  if (!w.article) return w.de;
  return w.de.startsWith(`${w.article} `) ? w.de : `${w.article} ${w.de}`;
}

/**
 * عائلة الكلمة كما يراها المتعلم (D118): الصيغة الألمانية الكاملة لا المعرّف — كان يُعرض «tuerkei» و«wie-gehts»
 * (159 من 205 مرجعاً عائلياً في A1: رسم خاطئ أمام المتعلم) — ومن الكلمات المعروفة الممرَّرة وحدها: المُمرِّر يقرر
 * ما دُرس (قانون الجبهة 13)، فالعضو غير الممرَّر لا يظهر (كان 4 أعضاء غير مدروسين يظهرون، 3 منها في أول درس).
 */
export function familyForms(w: { readonly wordFamily: readonly string[] }, known: ReadonlyMap<string, Pick<Word, "de" | "article">>): string[] {
  return w.wordFamily.flatMap((id) => {
    const f = known.get(id);
    return f ? [fullForm(f)] : [];
  });
}

function explainWord(w: Word, known: ReadonlyMap<string, Word>): string {
  const gender = w.gender !== "none" ? ` (${w.gender})` : "";
  const members = familyForms(w, known);
  const family = members.length ? ` — عائلة: ${members.join("، ")}` : "";
  const sentence = w.sampleSentence ? ` مثال: «${w.sampleSentence.de}» = ${w.sampleSentence.ar}` : "";
  return `${fullForm(w)}${gender} = ${w.ar.join("، ")}${family}.${sentence}`;
}

/**
 * بناء خطة شاشات الحصة من الدرس وكلماته:
 * الاسترجاع (الدفء) ← الجديد (العرض) ← التدريب (المحطات + المهمة التواصلية) ← الخلاصة (المصائد + حزمة SRS).
 * أي كلمة مفقودة = خطأ فوري (لا شاشات ناقصة أبداً).
 */
export function planLessonStations(lesson: Lesson, words: Word[], grammarRules: readonly GrammarRule[] = []): LessonStationPlan {
  const known: ReadonlyMap<string, Word> = new Map(words.map((w) => [w.id, w]));
  const recall: RecallCardData[] = lesson.warmup.cardIds.map((id) => {
    const w = wordById(words, id);
    return { id, front: fullForm(w), back: w.ar.join(" · "), audioId: `word-${w.id}`, speakText: fullForm(w) };
  });
  if (recall.length === 0) throw new Error("لا جلسة بلا استرجاع (F121): بطاقات الدفء مطلوبة");

  const learn: LearnCardData[] = lesson.praesentation.wordIds.map((id) => {
    const w = wordById(words, id);
    return {
      wordId: id,
      promptDe: w.sampleSentence?.de ?? fullForm(w),
      promptAr: w.sampleSentence?.ar ?? w.ar[0],
      explanation: explainWord(w, known),
      audioId: `word-${w.id}`,
      speakText: fullForm(w),
    };
  });

  for (const id of lesson.zusammenfassung.srsBundleWordIds) wordById(words, id); // حزمة SRS مكتملة

  // معرّف بلا ملف = قاعدة لم تُكتب بعد (دَين معلن في خطة الترقية؛ الحارس يمنع done بلا ملف) — لا شاشة فارغة
  const rules = lesson.praesentation.grammarArsenalIds
    .map((id) => grammarRules.find((r) => r.id === id))
    .filter((r): r is GrammarRule => !!r);

  return {
    lessonId: lesson.id,
    recall,
    learn,
    rules,
    practice: {
      stations: lesson.uebung.stations,
      communicativeTask: lesson.uebung.communicativeTask,
      borrowed: lesson.praesentation.borrowedWords ?? [],
    },
    close: {
      summaryDe: lesson.zusammenfassung.summary.de,
      summaryAr: lesson.zusammenfassung.summary.ar,
      warningCards: lesson.zusammenfassung.warningCards,
      srsBundleWordIds: lesson.zusammenfassung.srsBundleWordIds,
    },
  };
}
