// src/lesson-packs.ts — سجل المحتوى الحي: الدروس وكلماتها (D3: المحتوى بيانات في git)
// كل ملف content يُحمَّل ويُتحقق من صحته بـzod عند الاستيراد — خطأ محتوى = خطأ بناء فوري.
import {
  Lesson as LessonSchema,
  Word as WordSchema,
  type Lesson,
  type Word,
} from "../content/schemas/index.js";

import lessonD1 from "../content/lessons/a1/a1-u1-d1.json";
import lessonD2 from "../content/lessons/a1/a1-u1-d2.json";
import lessonD3 from "../content/lessons/a1/a1-u1-d3.json";

import wordHallo from "../content/words/hallo.json";
import wordHeissen from "../content/words/heissen.json";
import wordGutenTag from "../content/words/guten-tag.json";
import wordGutenMorgen from "../content/words/guten-morgen.json";
import wordGutenAbend from "../content/words/guten-abend.json";
import wordTschuess from "../content/words/tschuess.json";
import wordAufWiedersehen from "../content/words/auf-wiedersehen.json";
import wordWieGehts from "../content/words/wie-gehts.json";
import wordDanke from "../content/words/danke.json";
import wordBitte from "../content/words/bitte.json";
import wordKommen from "../content/words/kommen.json";
import wordWohnen from "../content/words/wohnen.json";
import wordDeutsch from "../content/words/deutsch.json";
import wordTunesien from "../content/words/tunesien.json";
import wordDeutschland from "../content/words/deutschland.json";
import wordWohnung from "../content/words/wohnung.json";
import wordFrankreich from "../content/words/frankreich.json";
import wordSpanien from "../content/words/spanien.json";
import wordItalien from "../content/words/italien.json";
import wordTuerkei from "../content/words/tuerkei.json";
import wordMarokko from "../content/words/marokko.json";
import wordAegypten from "../content/words/aegypten.json";
import wordSchweiz from "../content/words/schweiz.json";
import wordEnglisch from "../content/words/englisch.json";
import wordFranzoesisch from "../content/words/franzoesisch.json";
import wordArabisch from "../content/words/arabisch.json";
import wordSprache from "../content/words/sprache.json";
import wordLand from "../content/words/land.json";
import wordBuchstabe from "../content/words/buchstabe.json";
import wordName from "../content/words/name.json";
import wordVorname from "../content/words/vorname.json";
import wordFamilienname from "../content/words/familienname.json";
import wordAdresse from "../content/words/adresse.json";
import wordTelefonnummer from "../content/words/telefonnummer.json";
import wordBuchstabieren from "../content/words/buchstabieren.json";
import wordLangsam from "../content/words/langsam.json";
import wordWiederholen from "../content/words/wiederholen.json";
import wordGenau from "../content/words/genau.json";
import wordAchso from "../content/words/achso.json";
import wordAlphabet from "../content/words/alphabet.json";

const WORD_JSONS = [
  wordHallo, wordHeissen, wordGutenTag, wordGutenMorgen, wordGutenAbend,
  wordTschuess, wordAufWiedersehen, wordWieGehts, wordDanke, wordBitte,
  wordKommen, wordWohnen, wordDeutsch, wordTunesien, wordDeutschland, wordWohnung,
  wordFrankreich, wordSpanien, wordItalien, wordTuerkei, wordMarokko, wordAegypten,
  wordSchweiz, wordEnglisch, wordFranzoesisch, wordArabisch, wordSprache, wordLand,
  wordBuchstabe, wordName, wordVorname, wordFamilienname, wordAdresse, wordTelefonnummer,
  wordBuchstabieren, wordLangsam, wordWiederholen, wordGenau, wordAchso, wordAlphabet,
];

const LESSON_JSONS = [lessonD1, lessonD2, lessonD3];

/** كل الكلمات المُتحقَّق منها — بلا استثناءات */
export const ALL_WORDS: Word[] = WORD_JSONS.map((j) => WordSchema.parse(j));

/** كل الدروس مرتّبة (وحدة، يوم) */
export const ALL_LESSONS: Lesson[] = LESSON_JSONS.map((j) => LessonSchema.parse(j)).sort(
  (a, b) => a.unit - b.unit || a.day - b.day,
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
