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
import lessonU3D1 from "../content/lessons/a1/a1-u3-d1.json";
import lessonU3D2 from "../content/lessons/a1/a1-u3-d2.json";
import lessonU3D3 from "../content/lessons/a1/a1-u3-d3.json";
import lessonU3D4 from "../content/lessons/a1/a1-u3-d4.json";
import lessonU3D5 from "../content/lessons/a1/a1-u3-d5.json";
import lessonU3D6 from "../content/lessons/a1/a1-u3-d6.json";
import lessonU4D1 from "../content/lessons/a1/a1-u4-d1.json";
import lessonU4D2 from "../content/lessons/a1/a1-u4-d2.json";
import lessonU4D3 from "../content/lessons/a1/a1-u4-d3.json";
import lessonU4D4 from "../content/lessons/a1/a1-u4-d4.json";
import lessonU4D5 from "../content/lessons/a1/a1-u4-d5.json";
import lessonU4D6 from "../content/lessons/a1/a1-u4-d6.json";

import wordAbend from "../content/words/abend.json";
import wordAchso from "../content/words/achso.json";
import wordAchtzig from "../content/words/achtzig.json";
import wordAdresse from "../content/words/adresse.json";
import wordAegypten from "../content/words/aegypten.json";
import wordAllesKlar from "../content/words/alles-klar.json";
import wordAlphabet from "../content/words/alphabet.json";
import wordAlt from "../content/words/alt.json";
import wordAm from "../content/words/am.json";
import wordAnruf from "../content/words/anruf.json";
import wordAntwort from "../content/words/antwort.json";
import wordAntworten from "../content/words/antworten.json";
import wordApril from "../content/words/april.json";
import wordArabisch from "../content/words/arabisch.json";
import wordArbeit from "../content/words/arbeit.json";
import wordArbeiten from "../content/words/arbeiten.json";
import wordAuch from "../content/words/auch.json";
import wordAufWiedersehen from "../content/words/auf-wiedersehen.json";
import wordAufnehmen from "../content/words/aufnehmen.json";
import wordAuto from "../content/words/auto.json";
import wordBeruf from "../content/words/beruf.json";
import wordBeschreiben from "../content/words/beschreiben.json";
import wordBezahlen from "../content/words/bezahlen.json";
import wordBild from "../content/words/bild.json";
import wordBillig from "../content/words/billig.json";
import wordBisMorgen from "../content/words/bis-morgen.json";
import wordBitte from "../content/words/bitte.json";
import wordBoot from "../content/words/boot.json";
import wordBrille from "../content/words/brille.json";
import wordBroetchen from "../content/words/broetchen.json";
import wordBruder from "../content/words/bruder.json";
import wordBuchstabe from "../content/words/buchstabe.json";
import wordBuchstabieren from "../content/words/buchstabieren.json";
import wordDanke from "../content/words/danke.json";
import wordDein from "../content/words/dein.json";
import wordDeutsch from "../content/words/deutsch.json";
import wordDeutschland from "../content/words/deutschland.json";
import wordDort from "../content/words/dort.json";
import wordDreissig from "../content/words/dreissig.json";
import wordEltern from "../content/words/eltern.json";
import wordEnglisch from "../content/words/englisch.json";
import wordErzaehlen from "../content/words/erzaehlen.json";
import wordEssen from "../content/words/essen.json";
import wordEuro from "../content/words/euro.json";
import wordEuropa from "../content/words/europa.json";
import wordFamilie from "../content/words/familie.json";
import wordFamilienname from "../content/words/familienname.json";
import wordFebruar from "../content/words/februar.json";
import wordFoto from "../content/words/foto.json";
import wordFrage from "../content/words/frage.json";
import wordFrankreich from "../content/words/frankreich.json";
import wordFranzoesisch from "../content/words/franzoesisch.json";
import wordFrau from "../content/words/frau.json";
import wordFreiheit from "../content/words/freiheit.json";
import wordFremdsprache from "../content/words/fremdsprache.json";
import wordFreuen from "../content/words/freuen.json";
import wordFreund from "../content/words/freund.json";
import wordFreundin from "../content/words/freundin.json";
import wordFreundlich from "../content/words/freundlich.json";
import wordFreundschaft from "../content/words/freundschaft.json";
import wordFrueh from "../content/words/frueh.json";
import wordFuenfzig from "../content/words/fuenfzig.json";
import wordFuss from "../content/words/fuss.json";
import wordGeburtstag from "../content/words/geburtstag.json";
import wordGehen from "../content/words/gehen.json";
import wordGehoeren from "../content/words/gehoeren.json";
import wordGeld from "../content/words/geld.json";
import wordGemeinsam from "../content/words/gemeinsam.json";
import wordGenau from "../content/words/genau.json";
import wordGern from "../content/words/gern.json";
import wordGeschwister from "../content/words/geschwister.json";
import wordGesicht from "../content/words/gesicht.json";
import wordGespraech from "../content/words/gespraech.json";
import wordGesundheit from "../content/words/gesundheit.json";
import wordGriechenland from "../content/words/griechenland.json";
import wordGross from "../content/words/gross.json";
import wordGrossmutter from "../content/words/grossmutter.json";
import wordGrossvater from "../content/words/grossvater.json";
import wordGutenAbend from "../content/words/guten-abend.json";
import wordGutenMorgen from "../content/words/guten-morgen.json";
import wordGutenTag from "../content/words/guten-tag.json";
import wordHaar from "../content/words/haar.json";
import wordHalb from "../content/words/halb.json";
import wordHallo from "../content/words/hallo.json";
import wordHandy from "../content/words/handy.json";
import wordHaus from "../content/words/haus.json";
import wordHeimat from "../content/words/heimat.json";
import wordHeiss from "../content/words/heiss.json";
import wordHeissen from "../content/words/heissen.json";
import wordHier from "../content/words/hier.json";
import wordHobby from "../content/words/hobby.json";
import wordHoeren from "../content/words/hoeren.json";
import wordHund from "../content/words/hund.json";
import wordHundert from "../content/words/hundert.json";
import wordItalien from "../content/words/italien.json";
import wordJahr from "../content/words/jahr.json";
import wordJanuar from "../content/words/januar.json";
import wordJung from "../content/words/jung.json";
import wordJuni from "../content/words/juni.json";
import wordKaese from "../content/words/kaese.json";
import wordKaffee from "../content/words/kaffee.json";
import wordKarte from "../content/words/karte.json";
import wordKatze from "../content/words/katze.json";
import wordKaufen from "../content/words/kaufen.json";
import wordKellner from "../content/words/kellner.json";
import wordKennen from "../content/words/kennen.json";
import wordKennenlernen from "../content/words/kennenlernen.json";
import wordKind from "../content/words/kind.json";
import wordKlar from "../content/words/klar.json";
import wordKlein from "../content/words/klein.json";
import wordKommen from "../content/words/kommen.json";
import wordKosten from "../content/words/kosten.json";
import wordKurz from "../content/words/kurz.json";
import wordLaecheln from "../content/words/laecheln.json";
import wordLand from "../content/words/land.json";
import wordLangsam from "../content/words/langsam.json";
import wordLaut from "../content/words/laut.json";
import wordLeben from "../content/words/leben.json";
import wordLehrer from "../content/words/lehrer.json";
import wordLeise from "../content/words/leise.json";
import wordLesen from "../content/words/lesen.json";
import wordLeute from "../content/words/leute.json";
import wordLinks from "../content/words/links.json";
import wordLustig from "../content/words/lustig.json";
import wordMaedchen from "../content/words/maedchen.json";
import wordMaerz from "../content/words/maerz.json";
import wordMai from "../content/words/mai.json";
import wordMal from "../content/words/mal.json";
import wordMann from "../content/words/mann.json";
import wordMarokko from "../content/words/marokko.json";
import wordMein from "../content/words/mein.json";
import wordMinute from "../content/words/minute.json";
import wordMit from "../content/words/mit.json";
import wordMittag from "../content/words/mittag.json";
import wordMoeglichkeit from "../content/words/moeglichkeit.json";
import wordMonat from "../content/words/monat.json";
import wordMontag from "../content/words/montag.json";
import wordMorgen from "../content/words/morgen.json";
import wordMusik from "../content/words/musik.json";
import wordMutter from "../content/words/mutter.json";
import wordMuttersprache from "../content/words/muttersprache.json";
import wordNachricht from "../content/words/nachricht.json";
import wordNacht from "../content/words/nacht.json";
import wordName from "../content/words/name.json";
import wordNatuerlich from "../content/words/natuerlich.json";
import wordNeben from "../content/words/neben.json";
import wordNett from "../content/words/nett.json";
import wordNeunzig from "../content/words/neunzig.json";
import wordNiederlande from "../content/words/niederlande.json";
import wordNoch from "../content/words/noch.json";
import wordNummer from "../content/words/nummer.json";
import wordNur from "../content/words/nur.json";
import wordOder from "../content/words/oder.json";
import wordOesterreich from "../content/words/oesterreich.json";
import wordOhr from "../content/words/ohr.json";
import wordOkay from "../content/words/okay.json";
import wordOnkel from "../content/words/onkel.json";
import wordPolen from "../content/words/polen.json";
import wordPortugal from "../content/words/portugal.json";
import wordPreis from "../content/words/preis.json";
import wordPrima from "../content/words/prima.json";
import wordRechnung from "../content/words/rechnung.json";
import wordRechts from "../content/words/rechts.json";
import wordRussland from "../content/words/russland.json";
import wordSchlau from "../content/words/schlau.json";
import wordSchluessel from "../content/words/schluessel.json";
import wordSchmetterling from "../content/words/schmetterling.json";
import wordSchnell from "../content/words/schnell.json";
import wordSchoen from "../content/words/schoen.json";
import wordSchreiben from "../content/words/schreiben.json";
import wordSchule from "../content/words/schule.json";
import wordSchweiz from "../content/words/schweiz.json";
import wordSchwester from "../content/words/schwester.json";
import wordSechzig from "../content/words/sechzig.json";
import wordSehen from "../content/words/sehen.json";
import wordSein from "../content/words/sein.json";
import wordSiebzig from "../content/words/siebzig.json";
import wordSitzen from "../content/words/sitzen.json";
import wordSohn from "../content/words/sohn.json";
import wordSonntag from "../content/words/sonntag.json";
import wordSpaet from "../content/words/spaet.json";
import wordSpanien from "../content/words/spanien.json";
import wordSprache from "../content/words/sprache.json";
import wordStadt from "../content/words/stadt.json";
import wordStehen from "../content/words/stehen.json";
import wordStimme from "../content/words/stimme.json";
import wordStolz from "../content/words/stolz.json";
import wordStrasse from "../content/words/strasse.json";
import wordStudieren from "../content/words/studieren.json";
import wordStunde from "../content/words/stunde.json";
import wordSuess from "../content/words/suess.json";
import wordSuper from "../content/words/super.json";
import wordTag from "../content/words/tag.json";
import wordTante from "../content/words/tante.json";
import wordTasche from "../content/words/tasche.json";
import wordTasse from "../content/words/tasse.json";
import wordTausend from "../content/words/tausend.json";
import wordTelefon from "../content/words/telefon.json";
import wordTelefonnummer from "../content/words/telefonnummer.json";
import wordTermin from "../content/words/termin.json";
import wordTeuer from "../content/words/teuer.json";
import wordTochter from "../content/words/tochter.json";
import wordToll from "../content/words/toll.json";
import wordTragen from "../content/words/tragen.json";
import wordTreffen from "../content/words/treffen.json";
import wordTschuess from "../content/words/tschuess.json";
import wordTuerkei from "../content/words/tuerkei.json";
import wordTunesien from "../content/words/tunesien.json";
import wordUhr from "../content/words/uhr.json";
import wordVater from "../content/words/vater.json";
import wordVerabredung from "../content/words/verabredung.json";
import wordVerheiratet from "../content/words/verheiratet.json";
import wordVerstehen from "../content/words/verstehen.json";
import wordViel from "../content/words/viel.json";
import wordViertel from "../content/words/viertel.json";
import wordVierzig from "../content/words/vierzig.json";
import wordVorname from "../content/words/vorname.json";
import wordVorstellen from "../content/words/vorstellen.json";
import wordWelt from "../content/words/welt.json";
import wordWen from "../content/words/wen.json";
import wordWieGehts from "../content/words/wie-gehts.json";
import wordWiederholen from "../content/words/wiederholen.json";
import wordWo from "../content/words/wo.json";
import wordWoche from "../content/words/woche.json";
import wordWoher from "../content/words/woher.json";
import wordWohnen from "../content/words/wohnen.json";
import wordWohnung from "../content/words/wohnung.json";
import wordWunderbar from "../content/words/wunderbar.json";
import wordZaehlen from "../content/words/zaehlen.json";
import wordZahl from "../content/words/zahl.json";
import wordZeigen from "../content/words/zeigen.json";
import wordZeit from "../content/words/zeit.json";
import wordZeitung from "../content/words/zeitung.json";
import wordZentrum from "../content/words/zentrum.json";
import wordZiffer from "../content/words/ziffer.json";
import wordZusammen from "../content/words/zusammen.json";
import wordZwanzig from "../content/words/zwanzig.json";
import wordZwilling from "../content/words/zwilling.json";
import wordZwischen from "../content/words/zwischen.json";

const WORD_JSONS = [
  wordAbend,
  wordAchso,
  wordAchtzig,
  wordAdresse,
  wordAegypten,
  wordAllesKlar,
  wordAlphabet,
  wordAlt,
  wordAm,
  wordAnruf,
  wordAntwort,
  wordAntworten,
  wordApril,
  wordArabisch,
  wordArbeit,
  wordArbeiten,
  wordAuch,
  wordAufWiedersehen,
  wordAufnehmen,
  wordAuto,
  wordBeruf,
  wordBeschreiben,
  wordBezahlen,
  wordBild,
  wordBillig,
  wordBisMorgen,
  wordBitte,
  wordBoot,
  wordBrille,
  wordBroetchen,
  wordBruder,
  wordBuchstabe,
  wordBuchstabieren,
  wordDanke,
  wordDein,
  wordDeutsch,
  wordDeutschland,
  wordDort,
  wordDreissig,
  wordEltern,
  wordEnglisch,
  wordErzaehlen,
  wordEssen,
  wordEuro,
  wordEuropa,
  wordFamilie,
  wordFamilienname,
  wordFebruar,
  wordFoto,
  wordFrage,
  wordFrankreich,
  wordFranzoesisch,
  wordFrau,
  wordFreiheit,
  wordFremdsprache,
  wordFreuen,
  wordFreund,
  wordFreundin,
  wordFreundlich,
  wordFreundschaft,
  wordFrueh,
  wordFuenfzig,
  wordFuss,
  wordGeburtstag,
  wordGehen,
  wordGehoeren,
  wordGeld,
  wordGemeinsam,
  wordGenau,
  wordGern,
  wordGeschwister,
  wordGesicht,
  wordGespraech,
  wordGesundheit,
  wordGriechenland,
  wordGross,
  wordGrossmutter,
  wordGrossvater,
  wordGutenAbend,
  wordGutenMorgen,
  wordGutenTag,
  wordHaar,
  wordHalb,
  wordHallo,
  wordHandy,
  wordHaus,
  wordHeimat,
  wordHeiss,
  wordHeissen,
  wordHier,
  wordHobby,
  wordHoeren,
  wordHund,
  wordHundert,
  wordItalien,
  wordJahr,
  wordJanuar,
  wordJung,
  wordJuni,
  wordKaese,
  wordKaffee,
  wordKarte,
  wordKatze,
  wordKaufen,
  wordKellner,
  wordKennen,
  wordKennenlernen,
  wordKind,
  wordKlar,
  wordKlein,
  wordKommen,
  wordKosten,
  wordKurz,
  wordLaecheln,
  wordLand,
  wordLangsam,
  wordLaut,
  wordLeben,
  wordLehrer,
  wordLeise,
  wordLesen,
  wordLeute,
  wordLinks,
  wordLustig,
  wordMaedchen,
  wordMaerz,
  wordMai,
  wordMal,
  wordMann,
  wordMarokko,
  wordMein,
  wordMinute,
  wordMit,
  wordMittag,
  wordMoeglichkeit,
  wordMonat,
  wordMontag,
  wordMorgen,
  wordMusik,
  wordMutter,
  wordMuttersprache,
  wordNachricht,
  wordNacht,
  wordName,
  wordNatuerlich,
  wordNeben,
  wordNett,
  wordNeunzig,
  wordNiederlande,
  wordNoch,
  wordNummer,
  wordNur,
  wordOder,
  wordOesterreich,
  wordOhr,
  wordOkay,
  wordOnkel,
  wordPolen,
  wordPortugal,
  wordPreis,
  wordPrima,
  wordRechnung,
  wordRechts,
  wordRussland,
  wordSchlau,
  wordSchluessel,
  wordSchmetterling,
  wordSchnell,
  wordSchoen,
  wordSchreiben,
  wordSchule,
  wordSchweiz,
  wordSchwester,
  wordSechzig,
  wordSehen,
  wordSein,
  wordSiebzig,
  wordSitzen,
  wordSohn,
  wordSonntag,
  wordSpaet,
  wordSpanien,
  wordSprache,
  wordStadt,
  wordStehen,
  wordStimme,
  wordStolz,
  wordStrasse,
  wordStudieren,
  wordStunde,
  wordSuess,
  wordSuper,
  wordTag,
  wordTante,
  wordTasche,
  wordTasse,
  wordTausend,
  wordTelefon,
  wordTelefonnummer,
  wordTermin,
  wordTeuer,
  wordTochter,
  wordToll,
  wordTragen,
  wordTreffen,
  wordTschuess,
  wordTuerkei,
  wordTunesien,
  wordUhr,
  wordVater,
  wordVerabredung,
  wordVerheiratet,
  wordVerstehen,
  wordViel,
  wordViertel,
  wordVierzig,
  wordVorname,
  wordVorstellen,
  wordWelt,
  wordWen,
  wordWieGehts,
  wordWiederholen,
  wordWo,
  wordWoche,
  wordWoher,
  wordWohnen,
  wordWohnung,
  wordWunderbar,
  wordZaehlen,
  wordZahl,
  wordZeigen,
  wordZeit,
  wordZeitung,
  wordZentrum,
  wordZiffer,
  wordZusammen,
  wordZwanzig,
  wordZwilling,
  wordZwischen,
];

const LESSON_JSONS = [lessonD1, lessonD2, lessonD3, lessonD4, lessonD5, lessonD6, lessonU2D1, lessonU2D2, lessonU2D3, lessonU2D4, lessonU2D5, lessonU2D6, lessonU3D1, lessonU3D2, lessonU3D3, lessonU3D4, lessonU3D5, lessonU3D6, lessonU4D1, lessonU4D2, lessonU4D3, lessonU4D4, lessonU4D5, lessonU4D6];

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
