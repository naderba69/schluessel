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
import lessonU10D1 from "../content/lessons/a1/a1-u10-d1.json";
import lessonU10D2 from "../content/lessons/a1/a1-u10-d2.json";
import lessonU10D3 from "../content/lessons/a1/a1-u10-d3.json";
import lessonU10D4 from "../content/lessons/a1/a1-u10-d4.json";
import lessonU10D5 from "../content/lessons/a1/a1-u10-d5.json";
import lessonU10D6 from "../content/lessons/a1/a1-u10-d6.json";
import lessonU11D1 from "../content/lessons/a1/a1-u11-d1.json";
import lessonU11D2 from "../content/lessons/a1/a1-u11-d2.json";
import lessonU11D3 from "../content/lessons/a1/a1-u11-d3.json";
import lessonU11D4 from "../content/lessons/a1/a1-u11-d4.json";
import lessonU11D5 from "../content/lessons/a1/a1-u11-d5.json";
import lessonU11D6 from "../content/lessons/a1/a1-u11-d6.json";
import lessonU12D1 from "../content/lessons/a1/a1-u12-d1.json";
import lessonU12D2 from "../content/lessons/a1/a1-u12-d2.json";
import lessonU12D3 from "../content/lessons/a1/a1-u12-d3.json";
import lessonU12D4 from "../content/lessons/a1/a1-u12-d4.json";
import lessonU12D5 from "../content/lessons/a1/a1-u12-d5.json";
import lessonU12D6 from "../content/lessons/a1/a1-u12-d6.json";
import lessonU13D1 from "../content/lessons/a1/a1-u13-d1.json";
import lessonU13D2 from "../content/lessons/a1/a1-u13-d2.json";
import lessonU13D3 from "../content/lessons/a1/a1-u13-d3.json";
import lessonU13D4 from "../content/lessons/a1/a1-u13-d4.json";
import lessonU13D5 from "../content/lessons/a1/a1-u13-d5.json";
import lessonU13D6 from "../content/lessons/a1/a1-u13-d6.json";
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
import lessonU5D1 from "../content/lessons/a1/a1-u5-d1.json";
import lessonU5D2 from "../content/lessons/a1/a1-u5-d2.json";
import lessonU5D3 from "../content/lessons/a1/a1-u5-d3.json";
import lessonU5D4 from "../content/lessons/a1/a1-u5-d4.json";
import lessonU5D5 from "../content/lessons/a1/a1-u5-d5.json";
import lessonU5D6 from "../content/lessons/a1/a1-u5-d6.json";
import lessonU6D1 from "../content/lessons/a1/a1-u6-d1.json";
import lessonU6D2 from "../content/lessons/a1/a1-u6-d2.json";
import lessonU6D3 from "../content/lessons/a1/a1-u6-d3.json";
import lessonU6D4 from "../content/lessons/a1/a1-u6-d4.json";
import lessonU6D5 from "../content/lessons/a1/a1-u6-d5.json";
import lessonU6D6 from "../content/lessons/a1/a1-u6-d6.json";
import lessonU7D1 from "../content/lessons/a1/a1-u7-d1.json";
import lessonU7D2 from "../content/lessons/a1/a1-u7-d2.json";
import lessonU7D3 from "../content/lessons/a1/a1-u7-d3.json";
import lessonU7D4 from "../content/lessons/a1/a1-u7-d4.json";
import lessonU7D5 from "../content/lessons/a1/a1-u7-d5.json";
import lessonU7D6 from "../content/lessons/a1/a1-u7-d6.json";
import lessonU8D1 from "../content/lessons/a1/a1-u8-d1.json";
import lessonU8D2 from "../content/lessons/a1/a1-u8-d2.json";
import lessonU8D3 from "../content/lessons/a1/a1-u8-d3.json";
import lessonU8D4 from "../content/lessons/a1/a1-u8-d4.json";
import lessonU8D5 from "../content/lessons/a1/a1-u8-d5.json";
import lessonU8D6 from "../content/lessons/a1/a1-u8-d6.json";
import lessonU9D1 from "../content/lessons/a1/a1-u9-d1.json";
import lessonU9D2 from "../content/lessons/a1/a1-u9-d2.json";
import lessonU9D3 from "../content/lessons/a1/a1-u9-d3.json";
import lessonU9D4 from "../content/lessons/a1/a1-u9-d4.json";
import lessonU9D5 from "../content/lessons/a1/a1-u9-d5.json";
import lessonU9D6 from "../content/lessons/a1/a1-u9-d6.json";

import wordAbbiegen from "../content/words/abbiegen.json";
import wordAbend from "../content/words/abend.json";
import wordAbendessen from "../content/words/abendessen.json";
import wordAbfahren from "../content/words/abfahren.json";
import wordAbfahrt from "../content/words/abfahrt.json";
import wordAbholen from "../content/words/abholen.json";
import wordAbsage from "../content/words/absage.json";
import wordAbteilung from "../content/words/abteilung.json";
import wordAbwaschen from "../content/words/abwaschen.json";
import wordAchso from "../content/words/achso.json";
import wordAchtzig from "../content/words/achtzig.json";
import wordAdresse from "../content/words/adresse.json";
import wordAegypten from "../content/words/aegypten.json";
import wordAerztin from "../content/words/aerztin.json";
import wordAllesKlar from "../content/words/alles-klar.json";
import wordAlltag from "../content/words/alltag.json";
import wordAlphabet from "../content/words/alphabet.json";
import wordAlt from "../content/words/alt.json";
import wordAm from "../content/words/am.json";
import wordAn from "../content/words/an.json";
import wordAndenken from "../content/words/andenken.json";
import wordAnfangen from "../content/words/anfangen.json";
import wordAngebot from "../content/words/angebot.json";
import wordAnkommen from "../content/words/ankommen.json";
import wordAnkunft from "../content/words/ankunft.json";
import wordAnmelden from "../content/words/anmelden.json";
import wordAnprobieren from "../content/words/anprobieren.json";
import wordAnruf from "../content/words/anruf.json";
import wordAnrufen from "../content/words/anrufen.json";
import wordAnsehen from "../content/words/ansehen.json";
import wordAntwort from "../content/words/antwort.json";
import wordAntworten from "../content/words/antworten.json";
import wordAnziehen from "../content/words/anziehen.json";
import wordApotheke from "../content/words/apotheke.json";
import wordAppetit from "../content/words/appetit.json";
import wordApril from "../content/words/april.json";
import wordArabisch from "../content/words/arabisch.json";
import wordArbeit from "../content/words/arbeit.json";
import wordArbeiten from "../content/words/arbeiten.json";
import wordArm from "../content/words/arm.json";
import wordArzt from "../content/words/arzt.json";
import wordAuch from "../content/words/auch.json";
import wordAuf from "../content/words/auf.json";
import wordAufWiedersehen from "../content/words/auf-wiedersehen.json";
import wordAufnehmen from "../content/words/aufnehmen.json";
import wordAufpassen from "../content/words/aufpassen.json";
import wordAufraeumen from "../content/words/aufraeumen.json";
import wordAufschreiben from "../content/words/aufschreiben.json";
import wordAufstehen from "../content/words/aufstehen.json";
import wordAufwachen from "../content/words/aufwachen.json";
import wordAufzug from "../content/words/aufzug.json";
import wordAuge from "../content/words/auge.json";
import wordAus from "../content/words/aus.json";
import wordAusflug from "../content/words/ausflug.json";
import wordAusgang from "../content/words/ausgang.json";
import wordAusgeben from "../content/words/ausgeben.json";
import wordAuskunft from "../content/words/auskunft.json";
import wordAusland from "../content/words/ausland.json";
import wordAuspacken from "../content/words/auspacken.json";
import wordAusruhen from "../content/words/ausruhen.json";
import wordAussicht from "../content/words/aussicht.json";
import wordAussteigen from "../content/words/aussteigen.json";
import wordAuto from "../content/words/auto.json";
import wordBacken from "../content/words/backen.json";
import wordBad from "../content/words/bad.json";
import wordBaden from "../content/words/baden.json";
import wordBadezimmer from "../content/words/badezimmer.json";
import wordBaeckerei from "../content/words/baeckerei.json";
import wordBahn from "../content/words/bahn.json";
import wordBahnhof from "../content/words/bahnhof.json";
import wordBahnsteig from "../content/words/bahnsteig.json";
import wordBald from "../content/words/bald.json";
import wordBalkon from "../content/words/balkon.json";
import wordBank from "../content/words/bank.json";
import wordBauch from "../content/words/bauch.json";
import wordBauchschmerz from "../content/words/bauchschmerz.json";
import wordBei from "../content/words/bei.json";
import wordBein from "../content/words/bein.json";
import wordBeispiel from "../content/words/beispiel.json";
import wordBenutzen from "../content/words/benutzen.json";
import wordBerg from "../content/words/berg.json";
import wordBeruf from "../content/words/beruf.json";
import wordBeschreiben from "../content/words/beschreiben.json";
import wordBesetzt from "../content/words/besetzt.json";
import wordBesichtigen from "../content/words/besichtigen.json";
import wordBesser from "../content/words/besser.json";
import wordBestellen from "../content/words/bestellen.json";
import wordBestellung from "../content/words/bestellung.json";
import wordBesuch from "../content/words/besuch.json";
import wordBesuchen from "../content/words/besuchen.json";
import wordBett from "../content/words/bett.json";
import wordBezahlen from "../content/words/bezahlen.json";
import wordBier from "../content/words/bier.json";
import wordBild from "../content/words/bild.json";
import wordBillig from "../content/words/billig.json";
import wordBisMorgen from "../content/words/bis-morgen.json";
import wordBitte from "../content/words/bitte.json";
import wordBleiben from "../content/words/bleiben.json";
import wordBlut from "../content/words/blut.json";
import wordBluten from "../content/words/bluten.json";
import wordBoden from "../content/words/boden.json";
import wordBoot from "../content/words/boot.json";
import wordBrauchen from "../content/words/brauchen.json";
import wordBrennen from "../content/words/brennen.json";
import wordBrief from "../content/words/brief.json";
import wordBrille from "../content/words/brille.json";
import wordBringen from "../content/words/bringen.json";
import wordBroetchen from "../content/words/broetchen.json";
import wordBrot from "../content/words/brot.json";
import wordBruder from "../content/words/bruder.json";
import wordBruecke from "../content/words/bruecke.json";
import wordBuch from "../content/words/buch.json";
import wordBuchen from "../content/words/buchen.json";
import wordBuchstabe from "../content/words/buchstabe.json";
import wordBuchstabieren from "../content/words/buchstabieren.json";
import wordBus from "../content/words/bus.json";
import wordButter from "../content/words/butter.json";
import wordCent from "../content/words/cent.json";
import wordComputer from "../content/words/computer.json";
import wordDach from "../content/words/dach.json";
import wordDamals from "../content/words/damals.json";
import wordDanach from "../content/words/danach.json";
import wordDanke from "../content/words/danke.json";
import wordDann from "../content/words/dann.json";
import wordDarum from "../content/words/darum.json";
import wordDatum from "../content/words/datum.json";
import wordDauern from "../content/words/dauern.json";
import wordDecke from "../content/words/decke.json";
import wordDein from "../content/words/dein.json";
import wordDenken from "../content/words/denken.json";
import wordDenn from "../content/words/denn.json";
import wordDeshalb from "../content/words/deshalb.json";
import wordDeswegen from "../content/words/deswegen.json";
import wordDeutsch from "../content/words/deutsch.json";
import wordDeutschland from "../content/words/deutschland.json";
import wordDienstag from "../content/words/dienstag.json";
import wordDonnerstag from "../content/words/donnerstag.json";
import wordDoppelzimmer from "../content/words/doppelzimmer.json";
import wordDort from "../content/words/dort.json";
import wordDreissig from "../content/words/dreissig.json";
import wordDringend from "../content/words/dringend.json";
import wordDunkel from "../content/words/dunkel.json";
import wordDurst from "../content/words/durst.json";
import wordDusche from "../content/words/dusche.json";
import wordDuschen from "../content/words/duschen.json";
import wordEcke from "../content/words/ecke.json";
import wordEi from "../content/words/ei.json";
import wordEingang from "../content/words/eingang.json";
import wordEinkaufen from "../content/words/einkaufen.json";
import wordEinladung from "../content/words/einladung.json";
import wordEinpacken from "../content/words/einpacken.json";
import wordEinrichtung from "../content/words/einrichtung.json";
import wordEinsteigen from "../content/words/einsteigen.json";
import wordEinzelzimmer from "../content/words/einzelzimmer.json";
import wordEis from "../content/words/eis.json";
import wordEltern from "../content/words/eltern.json";
import wordEmpfang from "../content/words/empfang.json";
import wordEndlich from "../content/words/endlich.json";
import wordEnglisch from "../content/words/englisch.json";
import wordEntschuldigung from "../content/words/entschuldigung.json";
import wordErinnerung from "../content/words/erinnerung.json";
import wordErkaltung from "../content/words/erkaltung.json";
import wordErlauben from "../content/words/erlauben.json";
import wordErzaehlen from "../content/words/erzaehlen.json";
import wordEssen from "../content/words/essen.json";
import wordEtage from "../content/words/etage.json";
import wordEuro from "../content/words/euro.json";
import wordEuropa from "../content/words/europa.json";
import wordFahren from "../content/words/fahren.json";
import wordFahrkarte from "../content/words/fahrkarte.json";
import wordFahrplan from "../content/words/fahrplan.json";
import wordFahrrad from "../content/words/fahrrad.json";
import wordFahrt from "../content/words/fahrt.json";
import wordFalsch from "../content/words/falsch.json";
import wordFamilie from "../content/words/familie.json";
import wordFamilienname from "../content/words/familienname.json";
import wordFarbe from "../content/words/farbe.json";
import wordFebruar from "../content/words/februar.json";
import wordFeiern from "../content/words/feiern.json";
import wordFenster from "../content/words/fenster.json";
import wordFernsehen from "../content/words/fernsehen.json";
import wordFernseher from "../content/words/fernseher.json";
import wordFieber from "../content/words/fieber.json";
import wordFinden from "../content/words/finden.json";
import wordFinger from "../content/words/finger.json";
import wordFisch from "../content/words/fisch.json";
import wordFit from "../content/words/fit.json";
import wordFlasche from "../content/words/flasche.json";
import wordFleisch from "../content/words/fleisch.json";
import wordFliegen from "../content/words/fliegen.json";
import wordFlug from "../content/words/flug.json";
import wordFlughafen from "../content/words/flughafen.json";
import wordFlur from "../content/words/flur.json";
import wordFluss from "../content/words/fluss.json";
import wordFoto from "../content/words/foto.json";
import wordFotografieren from "../content/words/fotografieren.json";
import wordFrage from "../content/words/frage.json";
import wordFragen from "../content/words/fragen.json";
import wordFrankreich from "../content/words/frankreich.json";
import wordFranzoesisch from "../content/words/franzoesisch.json";
import wordFrau from "../content/words/frau.json";
import wordFrei from "../content/words/frei.json";
import wordFreiheit from "../content/words/freiheit.json";
import wordFreitag from "../content/words/freitag.json";
import wordFremdsprache from "../content/words/fremdsprache.json";
import wordFreuen from "../content/words/freuen.json";
import wordFreund from "../content/words/freund.json";
import wordFreundin from "../content/words/freundin.json";
import wordFreundlich from "../content/words/freundlich.json";
import wordFreundschaft from "../content/words/freundschaft.json";
import wordFrisch from "../content/words/frisch.json";
import wordFrueh from "../content/words/frueh.json";
import wordFruehstueck from "../content/words/fruehstueck.json";
import wordFruehstuecken from "../content/words/fruehstuecken.json";
import wordFuehlen from "../content/words/fuehlen.json";
import wordFuenfzig from "../content/words/fuenfzig.json";
import wordFuss from "../content/words/fuss.json";
import wordFussball from "../content/words/fussball.json";
import wordGabel from "../content/words/gabel.json";
import wordGarten from "../content/words/garten.json";
import wordGast from "../content/words/gast.json";
import wordGeben from "../content/words/geben.json";
import wordGeburtstag from "../content/words/geburtstag.json";
import wordGegen from "../content/words/gegen.json";
import wordGegenueber from "../content/words/gegenueber.json";
import wordGehen from "../content/words/gehen.json";
import wordGehoeren from "../content/words/gehoeren.json";
import wordGeld from "../content/words/geld.json";
import wordGemeinsam from "../content/words/gemeinsam.json";
import wordGemuese from "../content/words/gemuese.json";
import wordGemuetlich from "../content/words/gemuetlich.json";
import wordGenau from "../content/words/genau.json";
import wordGepaeck from "../content/words/gepaeck.json";
import wordGeradeaus from "../content/words/geradeaus.json";
import wordGeraet from "../content/words/geraet.json";
import wordGern from "../content/words/gern.json";
import wordGerne from "../content/words/gerne.json";
import wordGeschaeft from "../content/words/geschaeft.json";
import wordGeschenk from "../content/words/geschenk.json";
import wordGeschwister from "../content/words/geschwister.json";
import wordGesicht from "../content/words/gesicht.json";
import wordGespraech from "../content/words/gespraech.json";
import wordGestern from "../content/words/gestern.json";
import wordGesund from "../content/words/gesund.json";
import wordGesundheit from "../content/words/gesundheit.json";
import wordGetraenk from "../content/words/getraenk.json";
import wordGlas from "../content/words/glas.json";
import wordGleis from "../content/words/gleis.json";
import wordGrad from "../content/words/grad.json";
import wordGriechenland from "../content/words/griechenland.json";
import wordGrippe from "../content/words/grippe.json";
import wordGroesse from "../content/words/groesse.json";
import wordGross from "../content/words/gross.json";
import wordGrossmutter from "../content/words/grossmutter.json";
import wordGrossvater from "../content/words/grossvater.json";
import wordGrund from "../content/words/grund.json";
import wordGuenstig from "../content/words/guenstig.json";
import wordGuertel from "../content/words/guertel.json";
import wordGutenAbend from "../content/words/guten-abend.json";
import wordGutenMorgen from "../content/words/guten-morgen.json";
import wordGutenTag from "../content/words/guten-tag.json";
import wordHaar from "../content/words/haar.json";
import wordHaehnchen from "../content/words/haehnchen.json";
import wordHaengen from "../content/words/haengen.json";
import wordHalb from "../content/words/halb.json";
import wordHalle from "../content/words/halle.json";
import wordHallo from "../content/words/hallo.json";
import wordHals from "../content/words/hals.json";
import wordHaltestelle from "../content/words/haltestelle.json";
import wordHand from "../content/words/hand.json";
import wordHandtuch from "../content/words/handtuch.json";
import wordHandy from "../content/words/handy.json";
import wordHauptbahnhof from "../content/words/hauptbahnhof.json";
import wordHaus from "../content/words/haus.json";
import wordHausarzt from "../content/words/hausarzt.json";
import wordHaushalt from "../content/words/haushalt.json";
import wordHeimat from "../content/words/heimat.json";
import wordHeiss from "../content/words/heiss.json";
import wordHeissen from "../content/words/heissen.json";
import wordHeizung from "../content/words/heizung.json";
import wordHelfen from "../content/words/helfen.json";
import wordHell from "../content/words/hell.json";
import wordHemd from "../content/words/hemd.json";
import wordHier from "../content/words/hier.json";
import wordHimmel from "../content/words/himmel.json";
import wordHin from "../content/words/hin.json";
import wordHinter from "../content/words/hinter.json";
import wordHobby from "../content/words/hobby.json";
import wordHoeren from "../content/words/hoeren.json";
import wordHof from "../content/words/hof.json";
import wordHolen from "../content/words/holen.json";
import wordHose from "../content/words/hose.json";
import wordHotel from "../content/words/hotel.json";
import wordHuebsch from "../content/words/huebsch.json";
import wordHund from "../content/words/hund.json";
import wordHundert from "../content/words/hundert.json";
import wordHunger from "../content/words/hunger.json";
import wordHusten from "../content/words/husten.json";
import wordHut from "../content/words/hut.json";
import wordIdee from "../content/words/idee.json";
import wordImpfung from "../content/words/impfung.json";
import wordIn from "../content/words/in.json";
import wordInsel from "../content/words/insel.json";
import wordItalien from "../content/words/italien.json";
import wordJacke from "../content/words/jacke.json";
import wordJahr from "../content/words/jahr.json";
import wordJanuar from "../content/words/januar.json";
import wordJucken from "../content/words/jucken.json";
import wordJung from "../content/words/jung.json";
import wordJuni from "../content/words/juni.json";
import wordKaese from "../content/words/kaese.json";
import wordKaffee from "../content/words/kaffee.json";
import wordKalender from "../content/words/kalender.json";
import wordKalt from "../content/words/kalt.json";
import wordKarte from "../content/words/karte.json";
import wordKartoffel from "../content/words/kartoffel.json";
import wordKasse from "../content/words/kasse.json";
import wordKatze from "../content/words/katze.json";
import wordKaufen from "../content/words/kaufen.json";
import wordKeller from "../content/words/keller.json";
import wordKellner from "../content/words/kellner.json";
import wordKennen from "../content/words/kennen.json";
import wordKennenlernen from "../content/words/kennenlernen.json";
import wordKette from "../content/words/kette.json";
import wordKind from "../content/words/kind.json";
import wordKino from "../content/words/kino.json";
import wordKirche from "../content/words/kirche.json";
import wordKissen from "../content/words/kissen.json";
import wordKlar from "../content/words/klar.json";
import wordKleid from "../content/words/kleid.json";
import wordKleidung from "../content/words/kleidung.json";
import wordKlein from "../content/words/klein.json";
import wordKochen from "../content/words/kochen.json";
import wordKoffer from "../content/words/koffer.json";
import wordKommen from "../content/words/kommen.json";
import wordKopf from "../content/words/kopf.json";
import wordKopfschmerz from "../content/words/kopfschmerz.json";
import wordKorb from "../content/words/korb.json";
import wordKosten from "../content/words/kosten.json";
import wordKrank from "../content/words/krank.json";
import wordKrankenhaus from "../content/words/krankenhaus.json";
import wordKrankenwagen from "../content/words/krankenwagen.json";
import wordKreditkarte from "../content/words/kreditkarte.json";
import wordKreuzung from "../content/words/kreuzung.json";
import wordKuchen from "../content/words/kuchen.json";
import wordKueche from "../content/words/kueche.json";
import wordKuehlschrank from "../content/words/kuehlschrank.json";
import wordKunde from "../content/words/kunde.json";
import wordKurz from "../content/words/kurz.json";
import wordLaecheln from "../content/words/laecheln.json";
import wordLaeffel from "../content/words/laeffel.json";
import wordLampe from "../content/words/lampe.json";
import wordLand from "../content/words/land.json";
import wordLandschaft from "../content/words/landschaft.json";
import wordLangsam from "../content/words/langsam.json";
import wordLangweilig from "../content/words/langweilig.json";
import wordLaufen from "../content/words/laufen.json";
import wordLaut from "../content/words/laut.json";
import wordLeben from "../content/words/leben.json";
import wordLegen from "../content/words/legen.json";
import wordLehrer from "../content/words/lehrer.json";
import wordLeider from "../content/words/leider.json";
import wordLeise from "../content/words/leise.json";
import wordLernen from "../content/words/lernen.json";
import wordLesen from "../content/words/lesen.json";
import wordLetzt from "../content/words/letzt.json";
import wordLeute from "../content/words/leute.json";
import wordLieber from "../content/words/lieber.json";
import wordLiegen from "../content/words/liegen.json";
import wordLimonade from "../content/words/limonade.json";
import wordLinie from "../content/words/linie.json";
import wordLinks from "../content/words/links.json";
import wordLosfahren from "../content/words/losfahren.json";
import wordLustig from "../content/words/lustig.json";
import wordMachen from "../content/words/machen.json";
import wordMaedchen from "../content/words/maedchen.json";
import wordMaerz from "../content/words/maerz.json";
import wordMahlzeit from "../content/words/mahlzeit.json";
import wordMai from "../content/words/mai.json";
import wordMal from "../content/words/mal.json";
import wordMann from "../content/words/mann.json";
import wordMantel from "../content/words/mantel.json";
import wordMarkt from "../content/words/markt.json";
import wordMarmelade from "../content/words/marmelade.json";
import wordMarokko from "../content/words/marokko.json";
import wordMedikament from "../content/words/medikament.json";
import wordMeer from "../content/words/meer.json";
import wordMein from "../content/words/mein.json";
import wordMeinung from "../content/words/meinung.json";
import wordMesser from "../content/words/messer.json";
import wordMeter from "../content/words/meter.json";
import wordMiete from "../content/words/miete.json";
import wordMieten from "../content/words/mieten.json";
import wordMilch from "../content/words/milch.json";
import wordMinute from "../content/words/minute.json";
import wordMit from "../content/words/mit.json";
import wordMitbringen from "../content/words/mitbringen.json";
import wordMitnehmen from "../content/words/mitnehmen.json";
import wordMittag from "../content/words/mittag.json";
import wordMittagessen from "../content/words/mittagessen.json";
import wordMitte from "../content/words/mitte.json";
import wordMittwoch from "../content/words/mittwoch.json";
import wordMode from "../content/words/mode.json";
import wordMoebel from "../content/words/moebel.json";
import wordMoeglich from "../content/words/moeglich.json";
import wordMoeglichkeit from "../content/words/moeglichkeit.json";
import wordMonat from "../content/words/monat.json";
import wordMontag from "../content/words/montag.json";
import wordMorgen from "../content/words/morgen.json";
import wordMuede from "../content/words/muede.json";
import wordMuell from "../content/words/muell.json";
import wordMund from "../content/words/mund.json";
import wordMuseum from "../content/words/museum.json";
import wordMusik from "../content/words/musik.json";
import wordMutter from "../content/words/mutter.json";
import wordMuttersprache from "../content/words/muttersprache.json";
import wordNach from "../content/words/nach.json";
import wordNachbar from "../content/words/nachbar.json";
import wordNachher from "../content/words/nachher.json";
import wordNachricht from "../content/words/nachricht.json";
import wordNacht from "../content/words/nacht.json";
import wordNachtisch from "../content/words/nachtisch.json";
import wordNaehe from "../content/words/naehe.json";
import wordNah from "../content/words/nah.json";
import wordName from "../content/words/name.json";
import wordNase from "../content/words/nase.json";
import wordNass from "../content/words/nass.json";
import wordNatuerlich from "../content/words/natuerlich.json";
import wordNatur from "../content/words/natur.json";
import wordNeben from "../content/words/neben.json";
import wordNehmen from "../content/words/nehmen.json";
import wordNett from "../content/words/nett.json";
import wordNeulich from "../content/words/neulich.json";
import wordNeunzig from "../content/words/neunzig.json";
import wordNiederlande from "../content/words/niederlande.json";
import wordNiesen from "../content/words/niesen.json";
import wordNoch from "../content/words/noch.json";
import wordNord from "../content/words/nord.json";
import wordNotaufnahme from "../content/words/notaufnahme.json";
import wordNotfall from "../content/words/notfall.json";
import wordNotiz from "../content/words/notiz.json";
import wordNudeln from "../content/words/nudeln.json";
import wordNummer from "../content/words/nummer.json";
import wordNur from "../content/words/nur.json";
import wordOben from "../content/words/oben.json";
import wordObst from "../content/words/obst.json";
import wordOder from "../content/words/oder.json";
import wordOeffnen from "../content/words/oeffnen.json";
import wordOesterreich from "../content/words/oesterreich.json";
import wordOhr from "../content/words/ohr.json";
import wordOkay from "../content/words/okay.json";
import wordOnkel from "../content/words/onkel.json";
import wordOst from "../content/words/ost.json";
import wordPaket from "../content/words/paket.json";
import wordPark from "../content/words/park.json";
import wordParken from "../content/words/parken.json";
import wordParkplatz from "../content/words/parkplatz.json";
import wordPass from "../content/words/pass.json";
import wordPassen from "../content/words/passen.json";
import wordPatient from "../content/words/patient.json";
import wordPause from "../content/words/pause.json";
import wordPfeffer from "../content/words/pfeffer.json";
import wordPflanze from "../content/words/pflanze.json";
import wordPflaster from "../content/words/pflaster.json";
import wordPlan from "../content/words/plan.json";
import wordPlanen from "../content/words/planen.json";
import wordPlatz from "../content/words/platz.json";
import wordPloetzlich from "../content/words/ploetzlich.json";
import wordPolen from "../content/words/polen.json";
import wordPortion from "../content/words/portion.json";
import wordPortugal from "../content/words/portugal.json";
import wordPost from "../content/words/post.json";
import wordPostkarte from "../content/words/postkarte.json";
import wordPreis from "../content/words/preis.json";
import wordPrima from "../content/words/prima.json";
import wordProbieren from "../content/words/probieren.json";
import wordProblem from "../content/words/problem.json";
import wordPuenktlich from "../content/words/puenktlich.json";
import wordPullover from "../content/words/pullover.json";
import wordPutzen from "../content/words/putzen.json";
import wordQuittung from "../content/words/quittung.json";
import wordRabatt from "../content/words/rabatt.json";
import wordRad from "../content/words/rad.json";
import wordRahmen from "../content/words/rahmen.json";
import wordRauchen from "../content/words/rauchen.json";
import wordRechnung from "../content/words/rechnung.json";
import wordRechts from "../content/words/rechts.json";
import wordRegal from "../content/words/regal.json";
import wordRegen from "../content/words/regen.json";
import wordRegenschirm from "../content/words/regenschirm.json";
import wordReis from "../content/words/reis.json";
import wordReise from "../content/words/reise.json";
import wordReisen from "../content/words/reisen.json";
import wordReservieren from "../content/words/reservieren.json";
import wordReservierung from "../content/words/reservierung.json";
import wordRezept from "../content/words/rezept.json";
import wordRezeption from "../content/words/rezeption.json";
import wordRichtig from "../content/words/richtig.json";
import wordRichtung from "../content/words/richtung.json";
import wordRing from "../content/words/ring.json";
import wordRock from "../content/words/rock.json";
import wordRucksack from "../content/words/rucksack.json";
import wordRuecken from "../content/words/ruecken.json";
import wordRufen from "../content/words/rufen.json";
import wordRuhe from "../content/words/ruhe.json";
import wordRuhig from "../content/words/ruhig.json";
import wordRussland from "../content/words/russland.json";
import wordSaft from "../content/words/saft.json";
import wordSagen from "../content/words/sagen.json";
import wordSahne from "../content/words/sahne.json";
import wordSalat from "../content/words/salat.json";
import wordSalbe from "../content/words/salbe.json";
import wordSalz from "../content/words/salz.json";
import wordSalzig from "../content/words/salzig.json";
import wordSamstag from "../content/words/samstag.json";
import wordSatt from "../content/words/satt.json";
import wordSchalter from "../content/words/schalter.json";
import wordScharf from "../content/words/scharf.json";
import wordSchicken from "../content/words/schicken.json";
import wordSchlafen from "../content/words/schlafen.json";
import wordSchlafzimmer from "../content/words/schlafzimmer.json";
import wordSchlau from "../content/words/schlau.json";
import wordSchliessen from "../content/words/schliessen.json";
import wordSchlucken from "../content/words/schlucken.json";
import wordSchluessel from "../content/words/schluessel.json";
import wordSchmecken from "../content/words/schmecken.json";
import wordSchmerz from "../content/words/schmerz.json";
import wordSchmerzen from "../content/words/schmerzen.json";
import wordSchmetterling from "../content/words/schmetterling.json";
import wordSchmuck from "../content/words/schmuck.json";
import wordSchnee from "../content/words/schnee.json";
import wordSchnell from "../content/words/schnell.json";
import wordSchnupfen from "../content/words/schnupfen.json";
import wordSchoen from "../content/words/schoen.json";
import wordSchrank from "../content/words/schrank.json";
import wordSchreiben from "../content/words/schreiben.json";
import wordSchreibtisch from "../content/words/schreibtisch.json";
import wordSchublade from "../content/words/schublade.json";
import wordSchuh from "../content/words/schuh.json";
import wordSchule from "../content/words/schule.json";
import wordSchwach from "../content/words/schwach.json";
import wordSchweiz from "../content/words/schweiz.json";
import wordSchwester from "../content/words/schwester.json";
import wordSchwimmen from "../content/words/schwimmen.json";
import wordSchwindel from "../content/words/schwindel.json";
import wordSechzig from "../content/words/sechzig.json";
import wordSee from "../content/words/see.json";
import wordSehen from "../content/words/sehen.json";
import wordSehenswuerdigkeit from "../content/words/sehenswuerdigkeit.json";
import wordSeife from "../content/words/seife.json";
import wordSein from "../content/words/sein.json";
import wordSeit from "../content/words/seit.json";
import wordSeite from "../content/words/seite.json";
import wordSessel from "../content/words/sessel.json";
import wordSiebzig from "../content/words/siebzig.json";
import wordSitzen from "../content/words/sitzen.json";
import wordSocke from "../content/words/socke.json";
import wordSofa from "../content/words/sofa.json";
import wordSofort from "../content/words/sofort.json";
import wordSohn from "../content/words/sohn.json";
import wordSondern from "../content/words/sondern.json";
import wordSonne from "../content/words/sonne.json";
import wordSonnenbrille from "../content/words/sonnenbrille.json";
import wordSonnig from "../content/words/sonnig.json";
import wordSonntag from "../content/words/sonntag.json";
import wordSpaet from "../content/words/spaet.json";
import wordSpanien from "../content/words/spanien.json";
import wordSparen from "../content/words/sparen.json";
import wordSpass from "../content/words/spass.json";
import wordSpazieren from "../content/words/spazieren.json";
import wordSpaziergang from "../content/words/spaziergang.json";
import wordSpeisekarte from "../content/words/speisekarte.json";
import wordSpezialist from "../content/words/spezialist.json";
import wordSpiegel from "../content/words/spiegel.json";
import wordSpiel from "../content/words/spiel.json";
import wordSpielen from "../content/words/spielen.json";
import wordSprache from "../content/words/sprache.json";
import wordSprechen from "../content/words/sprechen.json";
import wordSpritze from "../content/words/spritze.json";
import wordStadt from "../content/words/stadt.json";
import wordStadtplan from "../content/words/stadtplan.json";
import wordStau from "../content/words/stau.json";
import wordStehen from "../content/words/stehen.json";
import wordStellen from "../content/words/stellen.json";
import wordStiefel from "../content/words/stiefel.json";
import wordStimme from "../content/words/stimme.json";
import wordStockwerk from "../content/words/stockwerk.json";
import wordStolz from "../content/words/stolz.json";
import wordStrand from "../content/words/strand.json";
import wordStrasse from "../content/words/strasse.json";
import wordStress from "../content/words/stress.json";
import wordStudieren from "../content/words/studieren.json";
import wordStueck from "../content/words/stueck.json";
import wordStuhl from "../content/words/stuhl.json";
import wordStunde from "../content/words/stunde.json";
import wordSuchen from "../content/words/suchen.json";
import wordSued from "../content/words/sued.json";
import wordSuess from "../content/words/suess.json";
import wordSuper from "../content/words/super.json";
import wordSupermarkt from "../content/words/supermarkt.json";
import wordSuppe from "../content/words/suppe.json";
import wordTablette from "../content/words/tablette.json";
import wordTag from "../content/words/tag.json";
import wordTante from "../content/words/tante.json";
import wordTanzen from "../content/words/tanzen.json";
import wordTasche from "../content/words/tasche.json";
import wordTasse from "../content/words/tasse.json";
import wordTausend from "../content/words/tausend.json";
import wordTaxi from "../content/words/taxi.json";
import wordTee from "../content/words/tee.json";
import wordTelefon from "../content/words/telefon.json";
import wordTelefonieren from "../content/words/telefonieren.json";
import wordTelefonnummer from "../content/words/telefonnummer.json";
import wordTeller from "../content/words/teller.json";
import wordTeppich from "../content/words/teppich.json";
import wordTermin from "../content/words/termin.json";
import wordTeuer from "../content/words/teuer.json";
import wordThermometer from "../content/words/thermometer.json";
import wordTisch from "../content/words/tisch.json";
import wordTochter from "../content/words/tochter.json";
import wordToilette from "../content/words/toilette.json";
import wordToll from "../content/words/toll.json";
import wordTomate from "../content/words/tomate.json";
import wordTourist from "../content/words/tourist.json";
import wordTragen from "../content/words/tragen.json";
import wordTreffen from "../content/words/treffen.json";
import wordTreppe from "../content/words/treppe.json";
import wordTrinken from "../content/words/trinken.json";
import wordTrinkgeld from "../content/words/trinkgeld.json";
import wordTropfen from "../content/words/tropfen.json";
import wordTschuess from "../content/words/tschuess.json";
import wordTuer from "../content/words/tuer.json";
import wordTuerkei from "../content/words/tuerkei.json";
import wordTuete from "../content/words/tuete.json";
import wordTunesien from "../content/words/tunesien.json";
import wordTunnel from "../content/words/tunnel.json";
import wordUeber from "../content/words/ueber.json";
import wordUeberall from "../content/words/ueberall.json";
import wordUfer from "../content/words/ufer.json";
import wordUhr from "../content/words/uhr.json";
import wordUmsteigen from "../content/words/umsteigen.json";
import wordUmtausch from "../content/words/umtausch.json";
import wordUnfall from "../content/words/unfall.json";
import wordUniversitaet from "../content/words/universitaet.json";
import wordUnten from "../content/words/unten.json";
import wordUnter from "../content/words/unter.json";
import wordUntersuchen from "../content/words/untersuchen.json";
import wordUnwohl from "../content/words/unwohl.json";
import wordUrlaub from "../content/words/urlaub.json";
import wordVase from "../content/words/vase.json";
import wordVater from "../content/words/vater.json";
import wordVerabredung from "../content/words/verabredung.json";
import wordVerbinden from "../content/words/verbinden.json";
import wordVerbindung from "../content/words/verbindung.json";
import wordVereinbaren from "../content/words/vereinbaren.json";
import wordVerhandeln from "../content/words/verhandeln.json";
import wordVerheiratet from "../content/words/verheiratet.json";
import wordVerkaeufer from "../content/words/verkaeufer.json";
import wordVerkaufen from "../content/words/verkaufen.json";
import wordVerkehr from "../content/words/verkehr.json";
import wordVerpassen from "../content/words/verpassen.json";
import wordVerschwinden from "../content/words/verschwinden.json";
import wordVerspaetung from "../content/words/verspaetung.json";
import wordVerstehen from "../content/words/verstehen.json";
import wordViel from "../content/words/viel.json";
import wordVielleicht from "../content/words/vielleicht.json";
import wordViertel from "../content/words/viertel.json";
import wordVierzig from "../content/words/vierzig.json";
import wordVisum from "../content/words/visum.json";
import wordVon from "../content/words/von.json";
import wordVor from "../content/words/vor.json";
import wordVorbei from "../content/words/vorbei.json";
import wordVorgestern from "../content/words/vorgestern.json";
import wordVorhang from "../content/words/vorhang.json";
import wordVorher from "../content/words/vorher.json";
import wordVorname from "../content/words/vorname.json";
import wordVorschlag from "../content/words/vorschlag.json";
import wordVorspeise from "../content/words/vorspeise.json";
import wordVorstellen from "../content/words/vorstellen.json";
import wordWaesche from "../content/words/waesche.json";
import wordWagen from "../content/words/wagen.json";
import wordWald from "../content/words/wald.json";
import wordWand from "../content/words/wand.json";
import wordWarm from "../content/words/warm.json";
import wordWarten from "../content/words/warten.json";
import wordWarum from "../content/words/warum.json";
import wordWaschen from "../content/words/waschen.json";
import wordWaschmaschine from "../content/words/waschmaschine.json";
import wordWasser from "../content/words/wasser.json";
import wordWechselgeld from "../content/words/wechselgeld.json";
import wordWecken from "../content/words/wecken.json";
import wordWecker from "../content/words/wecker.json";
import wordWeg from "../content/words/weg.json";
import wordWeil from "../content/words/weil.json";
import wordWein from "../content/words/wein.json";
import wordWeit from "../content/words/weit.json";
import wordWelt from "../content/words/welt.json";
import wordWen from "../content/words/wen.json";
import wordWest from "../content/words/west.json";
import wordWetter from "../content/words/wetter.json";
import wordWichtig from "../content/words/wichtig.json";
import wordWieGehts from "../content/words/wie-gehts.json";
import wordWieder from "../content/words/wieder.json";
import wordWiederholen from "../content/words/wiederholen.json";
import wordWind from "../content/words/wind.json";
import wordWo from "../content/words/wo.json";
import wordWoche from "../content/words/woche.json";
import wordWochenende from "../content/words/wochenende.json";
import wordWoher from "../content/words/woher.json";
import wordWohin from "../content/words/wohin.json";
import wordWohnen from "../content/words/wohnen.json";
import wordWohnung from "../content/words/wohnung.json";
import wordWohnzimmer from "../content/words/wohnzimmer.json";
import wordWolke from "../content/words/wolke.json";
import wordWunde from "../content/words/wunde.json";
import wordWunderbar from "../content/words/wunderbar.json";
import wordWurst from "../content/words/wurst.json";
import wordZaehlen from "../content/words/zaehlen.json";
import wordZahl from "../content/words/zahl.json";
import wordZahlen from "../content/words/zahlen.json";
import wordZahn from "../content/words/zahn.json";
import wordZahnschmerz from "../content/words/zahnschmerz.json";
import wordZeichnen from "../content/words/zeichnen.json";
import wordZeigen from "../content/words/zeigen.json";
import wordZeit from "../content/words/zeit.json";
import wordZeitung from "../content/words/zeitung.json";
import wordZentrum from "../content/words/zentrum.json";
import wordZiel from "../content/words/ziel.json";
import wordZiffer from "../content/words/ziffer.json";
import wordZimmer from "../content/words/zimmer.json";
import wordZu from "../content/words/zu.json";
import wordZucker from "../content/words/zucker.json";
import wordZuerst from "../content/words/zuerst.json";
import wordZug from "../content/words/zug.json";
import wordZuletzt from "../content/words/zuletzt.json";
import wordZurueck from "../content/words/zurueck.json";
import wordZurueckgeben from "../content/words/zurueckgeben.json";
import wordZurueckkommen from "../content/words/zurueckkommen.json";
import wordZusammen from "../content/words/zusammen.json";
import wordZwanzig from "../content/words/zwanzig.json";
import wordZwilling from "../content/words/zwilling.json";
import wordZwischen from "../content/words/zwischen.json";

import cultureLandeskundeU1 from "../content/landeskunde/a1-landeskunde-u1.json";
import cultureLandeskundeU10 from "../content/landeskunde/a1-landeskunde-u10.json";
import cultureLandeskundeU11 from "../content/landeskunde/a1-landeskunde-u11.json";
import cultureLandeskundeU12 from "../content/landeskunde/a1-landeskunde-u12.json";
import cultureLandeskundeU2 from "../content/landeskunde/a1-landeskunde-u2.json";
import cultureLandeskundeU3 from "../content/landeskunde/a1-landeskunde-u3.json";
import cultureLandeskundeU4 from "../content/landeskunde/a1-landeskunde-u4.json";
import cultureLandeskundeU5 from "../content/landeskunde/a1-landeskunde-u5.json";
import cultureLandeskundeU6 from "../content/landeskunde/a1-landeskunde-u6.json";
import cultureLandeskundeU7 from "../content/landeskunde/a1-landeskunde-u7.json";
import cultureLandeskundeU8 from "../content/landeskunde/a1-landeskunde-u8.json";
import cultureLandeskundeU9 from "../content/landeskunde/a1-landeskunde-u9.json";

/** بطاقات الثقافة الأسبوعية (D93) */
export const ALL_LANDESKUNDE = [
  cultureLandeskundeU1,
  cultureLandeskundeU10,
  cultureLandeskundeU11,
  cultureLandeskundeU12,
  cultureLandeskundeU2,
  cultureLandeskundeU3,
  cultureLandeskundeU4,
  cultureLandeskundeU5,
  cultureLandeskundeU6,
  cultureLandeskundeU7,
  cultureLandeskundeU8,
  cultureLandeskundeU9,
];

import pruefungKurztestW10 from "../content/pruefungen/a1-kurztest-w10.json";
import pruefungKurztestW12 from "../content/pruefungen/a1-kurztest-w12.json";
import pruefungKurztestW2 from "../content/pruefungen/a1-kurztest-w2.json";
import pruefungKurztestW4 from "../content/pruefungen/a1-kurztest-w4.json";
import pruefungKurztestW6 from "../content/pruefungen/a1-kurztest-w6.json";
import pruefungKurztestW8 from "../content/pruefungen/a1-kurztest-w8.json";
import pruefungMonatspruefungW12 from "../content/pruefungen/a1-monatspruefung-w12.json";
import pruefungMonatspruefungW4 from "../content/pruefungen/a1-monatspruefung-w4.json";
import pruefungMonatspruefungW8 from "../content/pruefungen/a1-monatspruefung-w8.json";

/** الاختبارات الدورية التراكمية (D94) */
export const ALL_PRUEFUNGEN = [
  pruefungKurztestW10,
  pruefungKurztestW12,
  pruefungKurztestW2,
  pruefungKurztestW4,
  pruefungKurztestW6,
  pruefungKurztestW8,
  pruefungMonatspruefungW12,
  pruefungMonatspruefungW4,
  pruefungMonatspruefungW8,
];

import modelltest0 from "../content/modelltest/a1-modelltest-1.json";
import imageManifest from "../content/manifests/image-manifest.json";

/** الامتحانات التجريبية الكاملة (D95) */
export const ALL_MODELLTESTS = [
  modelltest0,
];

/** مانيفست الصور — الترميز المزدوج (D96) */
export const ALL_IMAGES = imageManifest.assets;

const WORD_JSONS = [
  wordAbbiegen,
  wordAbend,
  wordAbendessen,
  wordAbfahren,
  wordAbfahrt,
  wordAbholen,
  wordAbsage,
  wordAbteilung,
  wordAbwaschen,
  wordAchso,
  wordAchtzig,
  wordAdresse,
  wordAegypten,
  wordAerztin,
  wordAllesKlar,
  wordAlltag,
  wordAlphabet,
  wordAlt,
  wordAm,
  wordAn,
  wordAndenken,
  wordAnfangen,
  wordAngebot,
  wordAnkommen,
  wordAnkunft,
  wordAnmelden,
  wordAnprobieren,
  wordAnruf,
  wordAnrufen,
  wordAnsehen,
  wordAntwort,
  wordAntworten,
  wordAnziehen,
  wordApotheke,
  wordAppetit,
  wordApril,
  wordArabisch,
  wordArbeit,
  wordArbeiten,
  wordArm,
  wordArzt,
  wordAuch,
  wordAuf,
  wordAufWiedersehen,
  wordAufnehmen,
  wordAufpassen,
  wordAufraeumen,
  wordAufschreiben,
  wordAufstehen,
  wordAufwachen,
  wordAufzug,
  wordAuge,
  wordAus,
  wordAusflug,
  wordAusgang,
  wordAusgeben,
  wordAuskunft,
  wordAusland,
  wordAuspacken,
  wordAusruhen,
  wordAussicht,
  wordAussteigen,
  wordAuto,
  wordBacken,
  wordBad,
  wordBaden,
  wordBadezimmer,
  wordBaeckerei,
  wordBahn,
  wordBahnhof,
  wordBahnsteig,
  wordBald,
  wordBalkon,
  wordBank,
  wordBauch,
  wordBauchschmerz,
  wordBei,
  wordBein,
  wordBeispiel,
  wordBenutzen,
  wordBerg,
  wordBeruf,
  wordBeschreiben,
  wordBesetzt,
  wordBesichtigen,
  wordBesser,
  wordBestellen,
  wordBestellung,
  wordBesuch,
  wordBesuchen,
  wordBett,
  wordBezahlen,
  wordBier,
  wordBild,
  wordBillig,
  wordBisMorgen,
  wordBitte,
  wordBleiben,
  wordBlut,
  wordBluten,
  wordBoden,
  wordBoot,
  wordBrauchen,
  wordBrennen,
  wordBrief,
  wordBrille,
  wordBringen,
  wordBroetchen,
  wordBrot,
  wordBruder,
  wordBruecke,
  wordBuch,
  wordBuchen,
  wordBuchstabe,
  wordBuchstabieren,
  wordBus,
  wordButter,
  wordCent,
  wordComputer,
  wordDach,
  wordDamals,
  wordDanach,
  wordDanke,
  wordDann,
  wordDarum,
  wordDatum,
  wordDauern,
  wordDecke,
  wordDein,
  wordDenken,
  wordDenn,
  wordDeshalb,
  wordDeswegen,
  wordDeutsch,
  wordDeutschland,
  wordDienstag,
  wordDonnerstag,
  wordDoppelzimmer,
  wordDort,
  wordDreissig,
  wordDringend,
  wordDunkel,
  wordDurst,
  wordDusche,
  wordDuschen,
  wordEcke,
  wordEi,
  wordEingang,
  wordEinkaufen,
  wordEinladung,
  wordEinpacken,
  wordEinrichtung,
  wordEinsteigen,
  wordEinzelzimmer,
  wordEis,
  wordEltern,
  wordEmpfang,
  wordEndlich,
  wordEnglisch,
  wordEntschuldigung,
  wordErinnerung,
  wordErkaltung,
  wordErlauben,
  wordErzaehlen,
  wordEssen,
  wordEtage,
  wordEuro,
  wordEuropa,
  wordFahren,
  wordFahrkarte,
  wordFahrplan,
  wordFahrrad,
  wordFahrt,
  wordFalsch,
  wordFamilie,
  wordFamilienname,
  wordFarbe,
  wordFebruar,
  wordFeiern,
  wordFenster,
  wordFernsehen,
  wordFernseher,
  wordFieber,
  wordFinden,
  wordFinger,
  wordFisch,
  wordFit,
  wordFlasche,
  wordFleisch,
  wordFliegen,
  wordFlug,
  wordFlughafen,
  wordFlur,
  wordFluss,
  wordFoto,
  wordFotografieren,
  wordFrage,
  wordFragen,
  wordFrankreich,
  wordFranzoesisch,
  wordFrau,
  wordFrei,
  wordFreiheit,
  wordFreitag,
  wordFremdsprache,
  wordFreuen,
  wordFreund,
  wordFreundin,
  wordFreundlich,
  wordFreundschaft,
  wordFrisch,
  wordFrueh,
  wordFruehstueck,
  wordFruehstuecken,
  wordFuehlen,
  wordFuenfzig,
  wordFuss,
  wordFussball,
  wordGabel,
  wordGarten,
  wordGast,
  wordGeben,
  wordGeburtstag,
  wordGegen,
  wordGegenueber,
  wordGehen,
  wordGehoeren,
  wordGeld,
  wordGemeinsam,
  wordGemuese,
  wordGemuetlich,
  wordGenau,
  wordGepaeck,
  wordGeradeaus,
  wordGeraet,
  wordGern,
  wordGerne,
  wordGeschaeft,
  wordGeschenk,
  wordGeschwister,
  wordGesicht,
  wordGespraech,
  wordGestern,
  wordGesund,
  wordGesundheit,
  wordGetraenk,
  wordGlas,
  wordGleis,
  wordGrad,
  wordGriechenland,
  wordGrippe,
  wordGroesse,
  wordGross,
  wordGrossmutter,
  wordGrossvater,
  wordGrund,
  wordGuenstig,
  wordGuertel,
  wordGutenAbend,
  wordGutenMorgen,
  wordGutenTag,
  wordHaar,
  wordHaehnchen,
  wordHaengen,
  wordHalb,
  wordHalle,
  wordHallo,
  wordHals,
  wordHaltestelle,
  wordHand,
  wordHandtuch,
  wordHandy,
  wordHauptbahnhof,
  wordHaus,
  wordHausarzt,
  wordHaushalt,
  wordHeimat,
  wordHeiss,
  wordHeissen,
  wordHeizung,
  wordHelfen,
  wordHell,
  wordHemd,
  wordHier,
  wordHimmel,
  wordHin,
  wordHinter,
  wordHobby,
  wordHoeren,
  wordHof,
  wordHolen,
  wordHose,
  wordHotel,
  wordHuebsch,
  wordHund,
  wordHundert,
  wordHunger,
  wordHusten,
  wordHut,
  wordIdee,
  wordImpfung,
  wordIn,
  wordInsel,
  wordItalien,
  wordJacke,
  wordJahr,
  wordJanuar,
  wordJucken,
  wordJung,
  wordJuni,
  wordKaese,
  wordKaffee,
  wordKalender,
  wordKalt,
  wordKarte,
  wordKartoffel,
  wordKasse,
  wordKatze,
  wordKaufen,
  wordKeller,
  wordKellner,
  wordKennen,
  wordKennenlernen,
  wordKette,
  wordKind,
  wordKino,
  wordKirche,
  wordKissen,
  wordKlar,
  wordKleid,
  wordKleidung,
  wordKlein,
  wordKochen,
  wordKoffer,
  wordKommen,
  wordKopf,
  wordKopfschmerz,
  wordKorb,
  wordKosten,
  wordKrank,
  wordKrankenhaus,
  wordKrankenwagen,
  wordKreditkarte,
  wordKreuzung,
  wordKuchen,
  wordKueche,
  wordKuehlschrank,
  wordKunde,
  wordKurz,
  wordLaecheln,
  wordLaeffel,
  wordLampe,
  wordLand,
  wordLandschaft,
  wordLangsam,
  wordLangweilig,
  wordLaufen,
  wordLaut,
  wordLeben,
  wordLegen,
  wordLehrer,
  wordLeider,
  wordLeise,
  wordLernen,
  wordLesen,
  wordLetzt,
  wordLeute,
  wordLieber,
  wordLiegen,
  wordLimonade,
  wordLinie,
  wordLinks,
  wordLosfahren,
  wordLustig,
  wordMachen,
  wordMaedchen,
  wordMaerz,
  wordMahlzeit,
  wordMai,
  wordMal,
  wordMann,
  wordMantel,
  wordMarkt,
  wordMarmelade,
  wordMarokko,
  wordMedikament,
  wordMeer,
  wordMein,
  wordMeinung,
  wordMesser,
  wordMeter,
  wordMiete,
  wordMieten,
  wordMilch,
  wordMinute,
  wordMit,
  wordMitbringen,
  wordMitnehmen,
  wordMittag,
  wordMittagessen,
  wordMitte,
  wordMittwoch,
  wordMode,
  wordMoebel,
  wordMoeglich,
  wordMoeglichkeit,
  wordMonat,
  wordMontag,
  wordMorgen,
  wordMuede,
  wordMuell,
  wordMund,
  wordMuseum,
  wordMusik,
  wordMutter,
  wordMuttersprache,
  wordNach,
  wordNachbar,
  wordNachher,
  wordNachricht,
  wordNacht,
  wordNachtisch,
  wordNaehe,
  wordNah,
  wordName,
  wordNase,
  wordNass,
  wordNatuerlich,
  wordNatur,
  wordNeben,
  wordNehmen,
  wordNett,
  wordNeulich,
  wordNeunzig,
  wordNiederlande,
  wordNiesen,
  wordNoch,
  wordNord,
  wordNotaufnahme,
  wordNotfall,
  wordNotiz,
  wordNudeln,
  wordNummer,
  wordNur,
  wordOben,
  wordObst,
  wordOder,
  wordOeffnen,
  wordOesterreich,
  wordOhr,
  wordOkay,
  wordOnkel,
  wordOst,
  wordPaket,
  wordPark,
  wordParken,
  wordParkplatz,
  wordPass,
  wordPassen,
  wordPatient,
  wordPause,
  wordPfeffer,
  wordPflanze,
  wordPflaster,
  wordPlan,
  wordPlanen,
  wordPlatz,
  wordPloetzlich,
  wordPolen,
  wordPortion,
  wordPortugal,
  wordPost,
  wordPostkarte,
  wordPreis,
  wordPrima,
  wordProbieren,
  wordProblem,
  wordPuenktlich,
  wordPullover,
  wordPutzen,
  wordQuittung,
  wordRabatt,
  wordRad,
  wordRahmen,
  wordRauchen,
  wordRechnung,
  wordRechts,
  wordRegal,
  wordRegen,
  wordRegenschirm,
  wordReis,
  wordReise,
  wordReisen,
  wordReservieren,
  wordReservierung,
  wordRezept,
  wordRezeption,
  wordRichtig,
  wordRichtung,
  wordRing,
  wordRock,
  wordRucksack,
  wordRuecken,
  wordRufen,
  wordRuhe,
  wordRuhig,
  wordRussland,
  wordSaft,
  wordSagen,
  wordSahne,
  wordSalat,
  wordSalbe,
  wordSalz,
  wordSalzig,
  wordSamstag,
  wordSatt,
  wordSchalter,
  wordScharf,
  wordSchicken,
  wordSchlafen,
  wordSchlafzimmer,
  wordSchlau,
  wordSchliessen,
  wordSchlucken,
  wordSchluessel,
  wordSchmecken,
  wordSchmerz,
  wordSchmerzen,
  wordSchmetterling,
  wordSchmuck,
  wordSchnee,
  wordSchnell,
  wordSchnupfen,
  wordSchoen,
  wordSchrank,
  wordSchreiben,
  wordSchreibtisch,
  wordSchublade,
  wordSchuh,
  wordSchule,
  wordSchwach,
  wordSchweiz,
  wordSchwester,
  wordSchwimmen,
  wordSchwindel,
  wordSechzig,
  wordSee,
  wordSehen,
  wordSehenswuerdigkeit,
  wordSeife,
  wordSein,
  wordSeit,
  wordSeite,
  wordSessel,
  wordSiebzig,
  wordSitzen,
  wordSocke,
  wordSofa,
  wordSofort,
  wordSohn,
  wordSondern,
  wordSonne,
  wordSonnenbrille,
  wordSonnig,
  wordSonntag,
  wordSpaet,
  wordSpanien,
  wordSparen,
  wordSpass,
  wordSpazieren,
  wordSpaziergang,
  wordSpeisekarte,
  wordSpezialist,
  wordSpiegel,
  wordSpiel,
  wordSpielen,
  wordSprache,
  wordSprechen,
  wordSpritze,
  wordStadt,
  wordStadtplan,
  wordStau,
  wordStehen,
  wordStellen,
  wordStiefel,
  wordStimme,
  wordStockwerk,
  wordStolz,
  wordStrand,
  wordStrasse,
  wordStress,
  wordStudieren,
  wordStueck,
  wordStuhl,
  wordStunde,
  wordSuchen,
  wordSued,
  wordSuess,
  wordSuper,
  wordSupermarkt,
  wordSuppe,
  wordTablette,
  wordTag,
  wordTante,
  wordTanzen,
  wordTasche,
  wordTasse,
  wordTausend,
  wordTaxi,
  wordTee,
  wordTelefon,
  wordTelefonieren,
  wordTelefonnummer,
  wordTeller,
  wordTeppich,
  wordTermin,
  wordTeuer,
  wordThermometer,
  wordTisch,
  wordTochter,
  wordToilette,
  wordToll,
  wordTomate,
  wordTourist,
  wordTragen,
  wordTreffen,
  wordTreppe,
  wordTrinken,
  wordTrinkgeld,
  wordTropfen,
  wordTschuess,
  wordTuer,
  wordTuerkei,
  wordTuete,
  wordTunesien,
  wordTunnel,
  wordUeber,
  wordUeberall,
  wordUfer,
  wordUhr,
  wordUmsteigen,
  wordUmtausch,
  wordUnfall,
  wordUniversitaet,
  wordUnten,
  wordUnter,
  wordUntersuchen,
  wordUnwohl,
  wordUrlaub,
  wordVase,
  wordVater,
  wordVerabredung,
  wordVerbinden,
  wordVerbindung,
  wordVereinbaren,
  wordVerhandeln,
  wordVerheiratet,
  wordVerkaeufer,
  wordVerkaufen,
  wordVerkehr,
  wordVerpassen,
  wordVerschwinden,
  wordVerspaetung,
  wordVerstehen,
  wordViel,
  wordVielleicht,
  wordViertel,
  wordVierzig,
  wordVisum,
  wordVon,
  wordVor,
  wordVorbei,
  wordVorgestern,
  wordVorhang,
  wordVorher,
  wordVorname,
  wordVorschlag,
  wordVorspeise,
  wordVorstellen,
  wordWaesche,
  wordWagen,
  wordWald,
  wordWand,
  wordWarm,
  wordWarten,
  wordWarum,
  wordWaschen,
  wordWaschmaschine,
  wordWasser,
  wordWechselgeld,
  wordWecken,
  wordWecker,
  wordWeg,
  wordWeil,
  wordWein,
  wordWeit,
  wordWelt,
  wordWen,
  wordWest,
  wordWetter,
  wordWichtig,
  wordWieGehts,
  wordWieder,
  wordWiederholen,
  wordWind,
  wordWo,
  wordWoche,
  wordWochenende,
  wordWoher,
  wordWohin,
  wordWohnen,
  wordWohnung,
  wordWohnzimmer,
  wordWolke,
  wordWunde,
  wordWunderbar,
  wordWurst,
  wordZaehlen,
  wordZahl,
  wordZahlen,
  wordZahn,
  wordZahnschmerz,
  wordZeichnen,
  wordZeigen,
  wordZeit,
  wordZeitung,
  wordZentrum,
  wordZiel,
  wordZiffer,
  wordZimmer,
  wordZu,
  wordZucker,
  wordZuerst,
  wordZug,
  wordZuletzt,
  wordZurueck,
  wordZurueckgeben,
  wordZurueckkommen,
  wordZusammen,
  wordZwanzig,
  wordZwilling,
  wordZwischen,
];

const LESSON_JSONS = [lessonD1, lessonD2, lessonD3, lessonD4, lessonD5, lessonD6, lessonU10D1, lessonU10D2, lessonU10D3, lessonU10D4, lessonU10D5, lessonU10D6, lessonU11D1, lessonU11D2, lessonU11D3, lessonU11D4, lessonU11D5, lessonU11D6, lessonU12D1, lessonU12D2, lessonU12D3, lessonU12D4, lessonU12D5, lessonU12D6, lessonU13D1, lessonU13D2, lessonU13D3, lessonU13D4, lessonU13D5, lessonU13D6, lessonU2D1, lessonU2D2, lessonU2D3, lessonU2D4, lessonU2D5, lessonU2D6, lessonU3D1, lessonU3D2, lessonU3D3, lessonU3D4, lessonU3D5, lessonU3D6, lessonU4D1, lessonU4D2, lessonU4D3, lessonU4D4, lessonU4D5, lessonU4D6, lessonU5D1, lessonU5D2, lessonU5D3, lessonU5D4, lessonU5D5, lessonU5D6, lessonU6D1, lessonU6D2, lessonU6D3, lessonU6D4, lessonU6D5, lessonU6D6, lessonU7D1, lessonU7D2, lessonU7D3, lessonU7D4, lessonU7D5, lessonU7D6, lessonU8D1, lessonU8D2, lessonU8D3, lessonU8D4, lessonU8D5, lessonU8D6, lessonU9D1, lessonU9D2, lessonU9D3, lessonU9D4, lessonU9D5, lessonU9D6];

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
