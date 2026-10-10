// src/lesson-packs.ts — حزم المحتوى الجاهزة: الدرس الأول بكل كلماته (D3: المحتوى بيانات في git)
import {
  Lesson as LessonSchema,
  Word as WordSchema,
  type Lesson,
  type Word,
} from "../content/schemas/index.js";

import firstLessonJson from "../content/lessons/a1/a1-u1-d1.json";
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

export const firstLesson: Lesson = LessonSchema.parse(firstLessonJson);

export const firstLessonWords: Word[] = [
  wordHallo,
  wordHeissen,
  wordGutenTag,
  wordGutenMorgen,
  wordGutenAbend,
  wordTschuess,
  wordAufWiedersehen,
  wordWieGehts,
  wordDanke,
  wordBitte,
  wordKommen,
  wordWohnen,
  wordDeutsch,
  wordTunesien,
  wordDeutschland,
].map((w) => WordSchema.parse(w));
