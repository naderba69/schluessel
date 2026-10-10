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
import lessonD4 from "../content/lessons/a1/a1-u1-d4.json";
import lessonD5 from "../content/lessons/a1/a1-u1-d5.json";
import lessonD6 from "../content/lessons/a1/a1-u1-d6.json";
import lessonU2D1 from "../content/lessons/a1/a1-u2-d1.json";
import lessonU2D2 from "../content/lessons/a1/a1-u2-d2.json";
import lessonU2D3 from "../content/lessons/a1/a1-u2-d3.json";
import lessonU2D4 from "../content/lessons/a1/a1-u2-d4.json";
import lessonU2D5 from "../content/lessons/a1/a1-u2-d5.json";
import lessonU2D6 from "../content/lessons/a1/a1-u2-d6.json";

import wordAchso from "../content/words/achso.json";
import wordAdresse from "../content/words/adresse.json";
import wordAegypten from "../content/words/aegypten.json";
import wordAllesKlar from "../content/words/alles-klar.json";
import wordAlphabet from "../content/words/alphabet.json";
import wordAlt from "../content/words/alt.json";
import wordAntwort from "../content/words/antwort.json";
import wordArabisch from "../content/words/arabisch.json";
import wordAuch from "../content/words/auch.json";
import wordAufWiedersehen from "../content/words/auf-wiedersehen.json";
import wordBisMorgen from "../content/words/bis-morgen.json";
import wordBitte from "../content/words/bitte.json";
import wordBoot from "../content/words/boot.json";
import wordBroetchen from "../content/words/broetchen.json";
import wordBuchstabe from "../content/words/buchstabe.json";
import wordBuchstabieren from "../content/words/buchstabieren.json";
import wordDanke from "../content/words/danke.json";
import wordDeutsch from "../content/words/deutsch.json";
import wordDeutschland from "../content/words/deutschland.json";
import wordDort from "../content/words/dort.json";
import wordEnglisch from "../content/words/englisch.json";
import wordEssen from "../content/words/essen.json";
import wordEuropa from "../content/words/europa.json";
import wordFamilienname from "../content/words/familienname.json";
import wordFrage from "../content/words/frage.json";
import wordFrankreich from "../content/words/frankreich.json";
import wordFranzoesisch from "../content/words/franzoesisch.json";
import wordFreiheit from "../content/words/freiheit.json";
import wordFremdsprache from "../content/words/fremdsprache.json";
import wordFreuen from "../content/words/freuen.json";
import wordFreund from "../content/words/freund.json";
import wordFreundin from "../content/words/freundin.json";
import wordFreundschaft from "../content/words/freundschaft.json";
import wordFuss from "../content/words/fuss.json";
import wordGeburtstag from "../content/words/geburtstag.json";
import wordGehen from "../content/words/gehen.json";
import wordGenau from "../content/words/genau.json";
import wordGern from "../content/words/gern.json";
import wordGespraech from "../content/words/gespraech.json";
import wordGesundheit from "../content/words/gesundheit.json";
import wordGriechenland from "../content/words/griechenland.json";
import wordGross from "../content/words/gross.json";
import wordGutenAbend from "../content/words/guten-abend.json";
import wordGutenMorgen from "../content/words/guten-morgen.json";
import wordGutenTag from "../content/words/guten-tag.json";
import wordHallo from "../content/words/hallo.json";
import wordHandy from "../content/words/handy.json";
import wordHaus from "../content/words/haus.json";
import wordHeiss from "../content/words/heiss.json";
import wordHeissen from "../content/words/heissen.json";
import wordHier from "../content/words/hier.json";
import wordHobby from "../content/words/hobby.json";
import wordItalien from "../content/words/italien.json";
import wordJahr from "../content/words/jahr.json";
import wordKaese from "../content/words/kaese.json";
import wordKaffee from "../content/words/kaffee.json";
import wordKellner from "../content/words/kellner.json";
import wordKennen from "../content/words/kennen.json";
import wordKennenlernen from "../content/words/kennenlernen.json";
import wordKommen from "../content/words/kommen.json";
import wordLand from "../content/words/land.json";
import wordLangsam from "../content/words/langsam.json";
import wordLeben from "../content/words/leben.json";
import wordLehrer from "../content/words/lehrer.json";
import wordLesen from "../content/words/lesen.json";
import wordLeute from "../content/words/leute.json";
import wordMaedchen from "../content/words/maedchen.json";
import wordMarokko from "../content/words/marokko.json";
import wordMoeglichkeit from "../content/words/moeglichkeit.json";
import wordMonat from "../content/words/monat.json";
import wordMusik from "../content/words/musik.json";
import wordMuttersprache from "../content/words/muttersprache.json";
import wordName from "../content/words/name.json";
import wordNatuerlich from "../content/words/natuerlich.json";
import wordNett from "../content/words/nett.json";
import wordNiederlande from "../content/words/niederlande.json";
import wordNummer from "../content/words/nummer.json";
import wordOder from "../content/words/oder.json";
import wordOesterreich from "../content/words/oesterreich.json";
import wordOkay from "../content/words/okay.json";
import wordPolen from "../content/words/polen.json";
import wordPortugal from "../content/words/portugal.json";
import wordRechnung from "../content/words/rechnung.json";
import wordRussland from "../content/words/russland.json";
import wordSchmetterling from "../content/words/schmetterling.json";
import wordSchreiben from "../content/words/schreiben.json";
import wordSchule from "../content/words/schule.json";
import wordSchweiz from "../content/words/schweiz.json";
import wordSpanien from "../content/words/spanien.json";
import wordSprache from "../content/words/sprache.json";
import wordStadt from "../content/words/stadt.json";
import wordStrasse from "../content/words/strasse.json";
import wordSuess from "../content/words/suess.json";
import wordSuper from "../content/words/super.json";
import wordTag from "../content/words/tag.json";
import wordTasse from "../content/words/tasse.json";
import wordTelefon from "../content/words/telefon.json";
import wordTelefonnummer from "../content/words/telefonnummer.json";
import wordTschuess from "../content/words/tschuess.json";
import wordTuerkei from "../content/words/tuerkei.json";
import wordTunesien from "../content/words/tunesien.json";
import wordVorname from "../content/words/vorname.json";
import wordVorstellen from "../content/words/vorstellen.json";
import wordWelt from "../content/words/welt.json";
import wordWieGehts from "../content/words/wie-gehts.json";
import wordWiederholen from "../content/words/wiederholen.json";
import wordWo from "../content/words/wo.json";
import wordWoche from "../content/words/woche.json";
import wordWoher from "../content/words/woher.json";
import wordWohnen from "../content/words/wohnen.json";
import wordWohnung from "../content/words/wohnung.json";
import wordZahl from "../content/words/zahl.json";
import wordZeitung from "../content/words/zeitung.json";
import wordZentrum from "../content/words/zentrum.json";
import wordZusammen from "../content/words/zusammen.json";

const WORD_JSONS = [
  wordAchso,
  wordAdresse,
  wordAegypten,
  wordAllesKlar,
  wordAlphabet,
  wordAlt,
  wordAntwort,
  wordArabisch,
  wordAuch,
  wordAufWiedersehen,
  wordBisMorgen,
  wordBitte,
  wordBoot,
  wordBroetchen,
  wordBuchstabe,
  wordBuchstabieren,
  wordDanke,
  wordDeutsch,
  wordDeutschland,
  wordDort,
  wordEnglisch,
  wordEssen,
  wordEuropa,
  wordFamilienname,
  wordFrage,
  wordFrankreich,
  wordFranzoesisch,
  wordFreiheit,
  wordFremdsprache,
  wordFreuen,
  wordFreund,
  wordFreundin,
  wordFreundschaft,
  wordFuss,
  wordGeburtstag,
  wordGehen,
  wordGenau,
  wordGern,
  wordGespraech,
  wordGesundheit,
  wordGriechenland,
  wordGross,
  wordGutenAbend,
  wordGutenMorgen,
  wordGutenTag,
  wordHallo,
  wordHandy,
  wordHaus,
  wordHeiss,
  wordHeissen,
  wordHier,
  wordHobby,
  wordItalien,
  wordJahr,
  wordKaese,
  wordKaffee,
  wordKellner,
  wordKennen,
  wordKennenlernen,
  wordKommen,
  wordLand,
  wordLangsam,
  wordLeben,
  wordLehrer,
  wordLesen,
  wordLeute,
  wordMaedchen,
  wordMarokko,
  wordMoeglichkeit,
  wordMonat,
  wordMusik,
  wordMuttersprache,
  wordName,
  wordNatuerlich,
  wordNett,
  wordNiederlande,
  wordNummer,
  wordOder,
  wordOesterreich,
  wordOkay,
  wordPolen,
  wordPortugal,
  wordRechnung,
  wordRussland,
  wordSchmetterling,
  wordSchreiben,
  wordSchule,
  wordSchweiz,
  wordSpanien,
  wordSprache,
  wordStadt,
  wordStrasse,
  wordSuess,
  wordSuper,
  wordTag,
  wordTasse,
  wordTelefon,
  wordTelefonnummer,
  wordTschuess,
  wordTuerkei,
  wordTunesien,
  wordVorname,
  wordVorstellen,
  wordWelt,
  wordWieGehts,
  wordWiederholen,
  wordWo,
  wordWoche,
  wordWoher,
  wordWohnen,
  wordWohnung,
  wordZahl,
  wordZeitung,
  wordZentrum,
  wordZusammen,
];

const LESSON_JSONS = [lessonD1, lessonD2, lessonD3, lessonD4, lessonD5, lessonD6, lessonU2D1, lessonU2D2, lessonU2D3, lessonU2D4, lessonU2D5, lessonU2D6];

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
