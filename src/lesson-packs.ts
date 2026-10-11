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

import wordAbend from "../content/words/abend.json";
import wordAbendessen from "../content/words/abendessen.json";
import wordAbwaschen from "../content/words/abwaschen.json";
import wordAchso from "../content/words/achso.json";
import wordAchtzig from "../content/words/achtzig.json";
import wordAdresse from "../content/words/adresse.json";
import wordAegypten from "../content/words/aegypten.json";
import wordAllesKlar from "../content/words/alles-klar.json";
import wordAlltag from "../content/words/alltag.json";
import wordAlphabet from "../content/words/alphabet.json";
import wordAlt from "../content/words/alt.json";
import wordAm from "../content/words/am.json";
import wordAnfangen from "../content/words/anfangen.json";
import wordAngebot from "../content/words/angebot.json";
import wordAnkommen from "../content/words/ankommen.json";
import wordAnprobieren from "../content/words/anprobieren.json";
import wordAnruf from "../content/words/anruf.json";
import wordAnrufen from "../content/words/anrufen.json";
import wordAntwort from "../content/words/antwort.json";
import wordAntworten from "../content/words/antworten.json";
import wordAnziehen from "../content/words/anziehen.json";
import wordAppetit from "../content/words/appetit.json";
import wordApril from "../content/words/april.json";
import wordArabisch from "../content/words/arabisch.json";
import wordArbeit from "../content/words/arbeit.json";
import wordArbeiten from "../content/words/arbeiten.json";
import wordAuch from "../content/words/auch.json";
import wordAuf from "../content/words/auf.json";
import wordAufWiedersehen from "../content/words/auf-wiedersehen.json";
import wordAufnehmen from "../content/words/aufnehmen.json";
import wordAufraeumen from "../content/words/aufraeumen.json";
import wordAufstehen from "../content/words/aufstehen.json";
import wordAufwachen from "../content/words/aufwachen.json";
import wordAuto from "../content/words/auto.json";
import wordBacken from "../content/words/backen.json";
import wordBaden from "../content/words/baden.json";
import wordBadezimmer from "../content/words/badezimmer.json";
import wordBahnhof from "../content/words/bahnhof.json";
import wordBalkon from "../content/words/balkon.json";
import wordBenutzen from "../content/words/benutzen.json";
import wordBeruf from "../content/words/beruf.json";
import wordBeschreiben from "../content/words/beschreiben.json";
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
import wordBoden from "../content/words/boden.json";
import wordBoot from "../content/words/boot.json";
import wordBrauchen from "../content/words/brauchen.json";
import wordBrille from "../content/words/brille.json";
import wordBroetchen from "../content/words/broetchen.json";
import wordBrot from "../content/words/brot.json";
import wordBruder from "../content/words/bruder.json";
import wordBuch from "../content/words/buch.json";
import wordBuchstabe from "../content/words/buchstabe.json";
import wordBuchstabieren from "../content/words/buchstabieren.json";
import wordBus from "../content/words/bus.json";
import wordButter from "../content/words/butter.json";
import wordCent from "../content/words/cent.json";
import wordComputer from "../content/words/computer.json";
import wordDach from "../content/words/dach.json";
import wordDanke from "../content/words/danke.json";
import wordDecke from "../content/words/decke.json";
import wordDein from "../content/words/dein.json";
import wordDeutsch from "../content/words/deutsch.json";
import wordDeutschland from "../content/words/deutschland.json";
import wordDort from "../content/words/dort.json";
import wordDreissig from "../content/words/dreissig.json";
import wordDunkel from "../content/words/dunkel.json";
import wordDurst from "../content/words/durst.json";
import wordDusche from "../content/words/dusche.json";
import wordDuschen from "../content/words/duschen.json";
import wordEcke from "../content/words/ecke.json";
import wordEi from "../content/words/ei.json";
import wordEinkaufen from "../content/words/einkaufen.json";
import wordEinrichtung from "../content/words/einrichtung.json";
import wordEis from "../content/words/eis.json";
import wordEltern from "../content/words/eltern.json";
import wordEnglisch from "../content/words/englisch.json";
import wordErzaehlen from "../content/words/erzaehlen.json";
import wordEssen from "../content/words/essen.json";
import wordEtage from "../content/words/etage.json";
import wordEuro from "../content/words/euro.json";
import wordEuropa from "../content/words/europa.json";
import wordFahren from "../content/words/fahren.json";
import wordFahrkarte from "../content/words/fahrkarte.json";
import wordFahrrad from "../content/words/fahrrad.json";
import wordFamilie from "../content/words/familie.json";
import wordFamilienname from "../content/words/familienname.json";
import wordFarbe from "../content/words/farbe.json";
import wordFebruar from "../content/words/februar.json";
import wordFeiern from "../content/words/feiern.json";
import wordFenster from "../content/words/fenster.json";
import wordFernsehen from "../content/words/fernsehen.json";
import wordFernseher from "../content/words/fernseher.json";
import wordFisch from "../content/words/fisch.json";
import wordFlasche from "../content/words/flasche.json";
import wordFleisch from "../content/words/fleisch.json";
import wordFlur from "../content/words/flur.json";
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
import wordFrisch from "../content/words/frisch.json";
import wordFrueh from "../content/words/frueh.json";
import wordFruehstueck from "../content/words/fruehstueck.json";
import wordFruehstuecken from "../content/words/fruehstuecken.json";
import wordFuenfzig from "../content/words/fuenfzig.json";
import wordFuss from "../content/words/fuss.json";
import wordFussball from "../content/words/fussball.json";
import wordGabel from "../content/words/gabel.json";
import wordGarten from "../content/words/garten.json";
import wordGast from "../content/words/gast.json";
import wordGeben from "../content/words/geben.json";
import wordGeburtstag from "../content/words/geburtstag.json";
import wordGehen from "../content/words/gehen.json";
import wordGehoeren from "../content/words/gehoeren.json";
import wordGeld from "../content/words/geld.json";
import wordGemeinsam from "../content/words/gemeinsam.json";
import wordGemuese from "../content/words/gemuese.json";
import wordGemuetlich from "../content/words/gemuetlich.json";
import wordGenau from "../content/words/genau.json";
import wordGeraet from "../content/words/geraet.json";
import wordGern from "../content/words/gern.json";
import wordGeschaeft from "../content/words/geschaeft.json";
import wordGeschwister from "../content/words/geschwister.json";
import wordGesicht from "../content/words/gesicht.json";
import wordGespraech from "../content/words/gespraech.json";
import wordGesund from "../content/words/gesund.json";
import wordGesundheit from "../content/words/gesundheit.json";
import wordGetraenk from "../content/words/getraenk.json";
import wordGlas from "../content/words/glas.json";
import wordGriechenland from "../content/words/griechenland.json";
import wordGroesse from "../content/words/groesse.json";
import wordGross from "../content/words/gross.json";
import wordGrossmutter from "../content/words/grossmutter.json";
import wordGrossvater from "../content/words/grossvater.json";
import wordGuenstig from "../content/words/guenstig.json";
import wordGutenAbend from "../content/words/guten-abend.json";
import wordGutenMorgen from "../content/words/guten-morgen.json";
import wordGutenTag from "../content/words/guten-tag.json";
import wordHaar from "../content/words/haar.json";
import wordHaehnchen from "../content/words/haehnchen.json";
import wordHaengen from "../content/words/haengen.json";
import wordHalb from "../content/words/halb.json";
import wordHallo from "../content/words/hallo.json";
import wordHandtuch from "../content/words/handtuch.json";
import wordHandy from "../content/words/handy.json";
import wordHaus from "../content/words/haus.json";
import wordHaushalt from "../content/words/haushalt.json";
import wordHeimat from "../content/words/heimat.json";
import wordHeiss from "../content/words/heiss.json";
import wordHeissen from "../content/words/heissen.json";
import wordHeizung from "../content/words/heizung.json";
import wordHell from "../content/words/hell.json";
import wordHemd from "../content/words/hemd.json";
import wordHier from "../content/words/hier.json";
import wordHinter from "../content/words/hinter.json";
import wordHobby from "../content/words/hobby.json";
import wordHoeren from "../content/words/hoeren.json";
import wordHof from "../content/words/hof.json";
import wordHose from "../content/words/hose.json";
import wordHuebsch from "../content/words/huebsch.json";
import wordHund from "../content/words/hund.json";
import wordHundert from "../content/words/hundert.json";
import wordHunger from "../content/words/hunger.json";
import wordHut from "../content/words/hut.json";
import wordItalien from "../content/words/italien.json";
import wordJacke from "../content/words/jacke.json";
import wordJahr from "../content/words/jahr.json";
import wordJanuar from "../content/words/januar.json";
import wordJung from "../content/words/jung.json";
import wordJuni from "../content/words/juni.json";
import wordKaese from "../content/words/kaese.json";
import wordKaffee from "../content/words/kaffee.json";
import wordKarte from "../content/words/karte.json";
import wordKartoffel from "../content/words/kartoffel.json";
import wordKasse from "../content/words/kasse.json";
import wordKatze from "../content/words/katze.json";
import wordKaufen from "../content/words/kaufen.json";
import wordKeller from "../content/words/keller.json";
import wordKellner from "../content/words/kellner.json";
import wordKennen from "../content/words/kennen.json";
import wordKennenlernen from "../content/words/kennenlernen.json";
import wordKind from "../content/words/kind.json";
import wordKino from "../content/words/kino.json";
import wordKissen from "../content/words/kissen.json";
import wordKlar from "../content/words/klar.json";
import wordKleid from "../content/words/kleid.json";
import wordKlein from "../content/words/klein.json";
import wordKochen from "../content/words/kochen.json";
import wordKoffer from "../content/words/koffer.json";
import wordKommen from "../content/words/kommen.json";
import wordKosten from "../content/words/kosten.json";
import wordKuchen from "../content/words/kuchen.json";
import wordKueche from "../content/words/kueche.json";
import wordKuehlschrank from "../content/words/kuehlschrank.json";
import wordKunde from "../content/words/kunde.json";
import wordKurz from "../content/words/kurz.json";
import wordLaecheln from "../content/words/laecheln.json";
import wordLaeffel from "../content/words/laeffel.json";
import wordLampe from "../content/words/lampe.json";
import wordLand from "../content/words/land.json";
import wordLangsam from "../content/words/langsam.json";
import wordLangweilig from "../content/words/langweilig.json";
import wordLaufen from "../content/words/laufen.json";
import wordLaut from "../content/words/laut.json";
import wordLeben from "../content/words/leben.json";
import wordLegen from "../content/words/legen.json";
import wordLehrer from "../content/words/lehrer.json";
import wordLeise from "../content/words/leise.json";
import wordLesen from "../content/words/lesen.json";
import wordLeute from "../content/words/leute.json";
import wordLieber from "../content/words/lieber.json";
import wordLimonade from "../content/words/limonade.json";
import wordLinks from "../content/words/links.json";
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
import wordMein from "../content/words/mein.json";
import wordMesser from "../content/words/messer.json";
import wordMiete from "../content/words/miete.json";
import wordMilch from "../content/words/milch.json";
import wordMinute from "../content/words/minute.json";
import wordMit from "../content/words/mit.json";
import wordMittag from "../content/words/mittag.json";
import wordMittagessen from "../content/words/mittagessen.json";
import wordMitte from "../content/words/mitte.json";
import wordMoebel from "../content/words/moebel.json";
import wordMoeglichkeit from "../content/words/moeglichkeit.json";
import wordMonat from "../content/words/monat.json";
import wordMontag from "../content/words/montag.json";
import wordMorgen from "../content/words/morgen.json";
import wordMuede from "../content/words/muede.json";
import wordMuell from "../content/words/muell.json";
import wordMusik from "../content/words/musik.json";
import wordMutter from "../content/words/mutter.json";
import wordMuttersprache from "../content/words/muttersprache.json";
import wordNachbar from "../content/words/nachbar.json";
import wordNachricht from "../content/words/nachricht.json";
import wordNacht from "../content/words/nacht.json";
import wordNachtisch from "../content/words/nachtisch.json";
import wordName from "../content/words/name.json";
import wordNatuerlich from "../content/words/natuerlich.json";
import wordNeben from "../content/words/neben.json";
import wordNehmen from "../content/words/nehmen.json";
import wordNett from "../content/words/nett.json";
import wordNeunzig from "../content/words/neunzig.json";
import wordNiederlande from "../content/words/niederlande.json";
import wordNoch from "../content/words/noch.json";
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
import wordPause from "../content/words/pause.json";
import wordPfeffer from "../content/words/pfeffer.json";
import wordPflanze from "../content/words/pflanze.json";
import wordPolen from "../content/words/polen.json";
import wordPortion from "../content/words/portion.json";
import wordPortugal from "../content/words/portugal.json";
import wordPreis from "../content/words/preis.json";
import wordPrima from "../content/words/prima.json";
import wordProbieren from "../content/words/probieren.json";
import wordPullover from "../content/words/pullover.json";
import wordPutzen from "../content/words/putzen.json";
import wordRabatt from "../content/words/rabatt.json";
import wordRahmen from "../content/words/rahmen.json";
import wordRechnung from "../content/words/rechnung.json";
import wordRechts from "../content/words/rechts.json";
import wordRegal from "../content/words/regal.json";
import wordReis from "../content/words/reis.json";
import wordReise from "../content/words/reise.json";
import wordReisen from "../content/words/reisen.json";
import wordReservieren from "../content/words/reservieren.json";
import wordRock from "../content/words/rock.json";
import wordRufen from "../content/words/rufen.json";
import wordRuhig from "../content/words/ruhig.json";
import wordRussland from "../content/words/russland.json";
import wordSaft from "../content/words/saft.json";
import wordSahne from "../content/words/sahne.json";
import wordSalat from "../content/words/salat.json";
import wordSalz from "../content/words/salz.json";
import wordSalzig from "../content/words/salzig.json";
import wordSatt from "../content/words/satt.json";
import wordScharf from "../content/words/scharf.json";
import wordSchicken from "../content/words/schicken.json";
import wordSchlafen from "../content/words/schlafen.json";
import wordSchlafzimmer from "../content/words/schlafzimmer.json";
import wordSchlau from "../content/words/schlau.json";
import wordSchliessen from "../content/words/schliessen.json";
import wordSchluessel from "../content/words/schluessel.json";
import wordSchmecken from "../content/words/schmecken.json";
import wordSchmetterling from "../content/words/schmetterling.json";
import wordSchnell from "../content/words/schnell.json";
import wordSchoen from "../content/words/schoen.json";
import wordSchrank from "../content/words/schrank.json";
import wordSchreiben from "../content/words/schreiben.json";
import wordSchreibtisch from "../content/words/schreibtisch.json";
import wordSchublade from "../content/words/schublade.json";
import wordSchuh from "../content/words/schuh.json";
import wordSchule from "../content/words/schule.json";
import wordSchweiz from "../content/words/schweiz.json";
import wordSchwester from "../content/words/schwester.json";
import wordSchwimmen from "../content/words/schwimmen.json";
import wordSechzig from "../content/words/sechzig.json";
import wordSehen from "../content/words/sehen.json";
import wordSeife from "../content/words/seife.json";
import wordSein from "../content/words/sein.json";
import wordSessel from "../content/words/sessel.json";
import wordSiebzig from "../content/words/siebzig.json";
import wordSitzen from "../content/words/sitzen.json";
import wordSocke from "../content/words/socke.json";
import wordSofa from "../content/words/sofa.json";
import wordSohn from "../content/words/sohn.json";
import wordSonntag from "../content/words/sonntag.json";
import wordSpaet from "../content/words/spaet.json";
import wordSpanien from "../content/words/spanien.json";
import wordSpass from "../content/words/spass.json";
import wordSpazieren from "../content/words/spazieren.json";
import wordSpeisekarte from "../content/words/speisekarte.json";
import wordSpiegel from "../content/words/spiegel.json";
import wordSpiel from "../content/words/spiel.json";
import wordSpielen from "../content/words/spielen.json";
import wordSprache from "../content/words/sprache.json";
import wordSprechen from "../content/words/sprechen.json";
import wordStadt from "../content/words/stadt.json";
import wordStehen from "../content/words/stehen.json";
import wordStellen from "../content/words/stellen.json";
import wordStimme from "../content/words/stimme.json";
import wordStockwerk from "../content/words/stockwerk.json";
import wordStolz from "../content/words/stolz.json";
import wordStrasse from "../content/words/strasse.json";
import wordStudieren from "../content/words/studieren.json";
import wordStuhl from "../content/words/stuhl.json";
import wordStunde from "../content/words/stunde.json";
import wordSuchen from "../content/words/suchen.json";
import wordSuess from "../content/words/suess.json";
import wordSuper from "../content/words/super.json";
import wordSupermarkt from "../content/words/supermarkt.json";
import wordSuppe from "../content/words/suppe.json";
import wordTag from "../content/words/tag.json";
import wordTante from "../content/words/tante.json";
import wordTanzen from "../content/words/tanzen.json";
import wordTasche from "../content/words/tasche.json";
import wordTasse from "../content/words/tasse.json";
import wordTausend from "../content/words/tausend.json";
import wordTee from "../content/words/tee.json";
import wordTelefon from "../content/words/telefon.json";
import wordTelefonieren from "../content/words/telefonieren.json";
import wordTelefonnummer from "../content/words/telefonnummer.json";
import wordTeller from "../content/words/teller.json";
import wordTeppich from "../content/words/teppich.json";
import wordTermin from "../content/words/termin.json";
import wordTeuer from "../content/words/teuer.json";
import wordTisch from "../content/words/tisch.json";
import wordTochter from "../content/words/tochter.json";
import wordToilette from "../content/words/toilette.json";
import wordToll from "../content/words/toll.json";
import wordTomate from "../content/words/tomate.json";
import wordTragen from "../content/words/tragen.json";
import wordTreffen from "../content/words/treffen.json";
import wordTreppe from "../content/words/treppe.json";
import wordTrinken from "../content/words/trinken.json";
import wordTrinkgeld from "../content/words/trinkgeld.json";
import wordTschuess from "../content/words/tschuess.json";
import wordTuer from "../content/words/tuer.json";
import wordTuerkei from "../content/words/tuerkei.json";
import wordTunesien from "../content/words/tunesien.json";
import wordUeber from "../content/words/ueber.json";
import wordUhr from "../content/words/uhr.json";
import wordUnten from "../content/words/unten.json";
import wordUnter from "../content/words/unter.json";
import wordUrlaub from "../content/words/urlaub.json";
import wordVase from "../content/words/vase.json";
import wordVater from "../content/words/vater.json";
import wordVerabredung from "../content/words/verabredung.json";
import wordVerheiratet from "../content/words/verheiratet.json";
import wordVerkaeufer from "../content/words/verkaeufer.json";
import wordVerkaufen from "../content/words/verkaufen.json";
import wordVerstehen from "../content/words/verstehen.json";
import wordViel from "../content/words/viel.json";
import wordViertel from "../content/words/viertel.json";
import wordVierzig from "../content/words/vierzig.json";
import wordVorhang from "../content/words/vorhang.json";
import wordVorname from "../content/words/vorname.json";
import wordVorspeise from "../content/words/vorspeise.json";
import wordVorstellen from "../content/words/vorstellen.json";
import wordWaesche from "../content/words/waesche.json";
import wordWand from "../content/words/wand.json";
import wordWarten from "../content/words/warten.json";
import wordWaschen from "../content/words/waschen.json";
import wordWaschmaschine from "../content/words/waschmaschine.json";
import wordWasser from "../content/words/wasser.json";
import wordWechselgeld from "../content/words/wechselgeld.json";
import wordWecken from "../content/words/wecken.json";
import wordWecker from "../content/words/wecker.json";
import wordWeg from "../content/words/weg.json";
import wordWein from "../content/words/wein.json";
import wordWelt from "../content/words/welt.json";
import wordWen from "../content/words/wen.json";
import wordWieGehts from "../content/words/wie-gehts.json";
import wordWiederholen from "../content/words/wiederholen.json";
import wordWo from "../content/words/wo.json";
import wordWoche from "../content/words/woche.json";
import wordWoher from "../content/words/woher.json";
import wordWohin from "../content/words/wohin.json";
import wordWohnen from "../content/words/wohnen.json";
import wordWohnung from "../content/words/wohnung.json";
import wordWohnzimmer from "../content/words/wohnzimmer.json";
import wordWunderbar from "../content/words/wunderbar.json";
import wordWurst from "../content/words/wurst.json";
import wordZaehlen from "../content/words/zaehlen.json";
import wordZahl from "../content/words/zahl.json";
import wordZahlen from "../content/words/zahlen.json";
import wordZeichnen from "../content/words/zeichnen.json";
import wordZeigen from "../content/words/zeigen.json";
import wordZeit from "../content/words/zeit.json";
import wordZeitung from "../content/words/zeitung.json";
import wordZentrum from "../content/words/zentrum.json";
import wordZiffer from "../content/words/ziffer.json";
import wordZimmer from "../content/words/zimmer.json";
import wordZucker from "../content/words/zucker.json";
import wordZug from "../content/words/zug.json";
import wordZusammen from "../content/words/zusammen.json";
import wordZwanzig from "../content/words/zwanzig.json";
import wordZwilling from "../content/words/zwilling.json";
import wordZwischen from "../content/words/zwischen.json";

const WORD_JSONS = [
  wordAbend,
  wordAbendessen,
  wordAbwaschen,
  wordAchso,
  wordAchtzig,
  wordAdresse,
  wordAegypten,
  wordAllesKlar,
  wordAlltag,
  wordAlphabet,
  wordAlt,
  wordAm,
  wordAnfangen,
  wordAngebot,
  wordAnkommen,
  wordAnprobieren,
  wordAnruf,
  wordAnrufen,
  wordAntwort,
  wordAntworten,
  wordAnziehen,
  wordAppetit,
  wordApril,
  wordArabisch,
  wordArbeit,
  wordArbeiten,
  wordAuch,
  wordAuf,
  wordAufWiedersehen,
  wordAufnehmen,
  wordAufraeumen,
  wordAufstehen,
  wordAufwachen,
  wordAuto,
  wordBacken,
  wordBaden,
  wordBadezimmer,
  wordBahnhof,
  wordBalkon,
  wordBenutzen,
  wordBeruf,
  wordBeschreiben,
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
  wordBoden,
  wordBoot,
  wordBrauchen,
  wordBrille,
  wordBroetchen,
  wordBrot,
  wordBruder,
  wordBuch,
  wordBuchstabe,
  wordBuchstabieren,
  wordBus,
  wordButter,
  wordCent,
  wordComputer,
  wordDach,
  wordDanke,
  wordDecke,
  wordDein,
  wordDeutsch,
  wordDeutschland,
  wordDort,
  wordDreissig,
  wordDunkel,
  wordDurst,
  wordDusche,
  wordDuschen,
  wordEcke,
  wordEi,
  wordEinkaufen,
  wordEinrichtung,
  wordEis,
  wordEltern,
  wordEnglisch,
  wordErzaehlen,
  wordEssen,
  wordEtage,
  wordEuro,
  wordEuropa,
  wordFahren,
  wordFahrkarte,
  wordFahrrad,
  wordFamilie,
  wordFamilienname,
  wordFarbe,
  wordFebruar,
  wordFeiern,
  wordFenster,
  wordFernsehen,
  wordFernseher,
  wordFisch,
  wordFlasche,
  wordFleisch,
  wordFlur,
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
  wordFrisch,
  wordFrueh,
  wordFruehstueck,
  wordFruehstuecken,
  wordFuenfzig,
  wordFuss,
  wordFussball,
  wordGabel,
  wordGarten,
  wordGast,
  wordGeben,
  wordGeburtstag,
  wordGehen,
  wordGehoeren,
  wordGeld,
  wordGemeinsam,
  wordGemuese,
  wordGemuetlich,
  wordGenau,
  wordGeraet,
  wordGern,
  wordGeschaeft,
  wordGeschwister,
  wordGesicht,
  wordGespraech,
  wordGesund,
  wordGesundheit,
  wordGetraenk,
  wordGlas,
  wordGriechenland,
  wordGroesse,
  wordGross,
  wordGrossmutter,
  wordGrossvater,
  wordGuenstig,
  wordGutenAbend,
  wordGutenMorgen,
  wordGutenTag,
  wordHaar,
  wordHaehnchen,
  wordHaengen,
  wordHalb,
  wordHallo,
  wordHandtuch,
  wordHandy,
  wordHaus,
  wordHaushalt,
  wordHeimat,
  wordHeiss,
  wordHeissen,
  wordHeizung,
  wordHell,
  wordHemd,
  wordHier,
  wordHinter,
  wordHobby,
  wordHoeren,
  wordHof,
  wordHose,
  wordHuebsch,
  wordHund,
  wordHundert,
  wordHunger,
  wordHut,
  wordItalien,
  wordJacke,
  wordJahr,
  wordJanuar,
  wordJung,
  wordJuni,
  wordKaese,
  wordKaffee,
  wordKarte,
  wordKartoffel,
  wordKasse,
  wordKatze,
  wordKaufen,
  wordKeller,
  wordKellner,
  wordKennen,
  wordKennenlernen,
  wordKind,
  wordKino,
  wordKissen,
  wordKlar,
  wordKleid,
  wordKlein,
  wordKochen,
  wordKoffer,
  wordKommen,
  wordKosten,
  wordKuchen,
  wordKueche,
  wordKuehlschrank,
  wordKunde,
  wordKurz,
  wordLaecheln,
  wordLaeffel,
  wordLampe,
  wordLand,
  wordLangsam,
  wordLangweilig,
  wordLaufen,
  wordLaut,
  wordLeben,
  wordLegen,
  wordLehrer,
  wordLeise,
  wordLesen,
  wordLeute,
  wordLieber,
  wordLimonade,
  wordLinks,
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
  wordMein,
  wordMesser,
  wordMiete,
  wordMilch,
  wordMinute,
  wordMit,
  wordMittag,
  wordMittagessen,
  wordMitte,
  wordMoebel,
  wordMoeglichkeit,
  wordMonat,
  wordMontag,
  wordMorgen,
  wordMuede,
  wordMuell,
  wordMusik,
  wordMutter,
  wordMuttersprache,
  wordNachbar,
  wordNachricht,
  wordNacht,
  wordNachtisch,
  wordName,
  wordNatuerlich,
  wordNeben,
  wordNehmen,
  wordNett,
  wordNeunzig,
  wordNiederlande,
  wordNoch,
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
  wordPause,
  wordPfeffer,
  wordPflanze,
  wordPolen,
  wordPortion,
  wordPortugal,
  wordPreis,
  wordPrima,
  wordProbieren,
  wordPullover,
  wordPutzen,
  wordRabatt,
  wordRahmen,
  wordRechnung,
  wordRechts,
  wordRegal,
  wordReis,
  wordReise,
  wordReisen,
  wordReservieren,
  wordRock,
  wordRufen,
  wordRuhig,
  wordRussland,
  wordSaft,
  wordSahne,
  wordSalat,
  wordSalz,
  wordSalzig,
  wordSatt,
  wordScharf,
  wordSchicken,
  wordSchlafen,
  wordSchlafzimmer,
  wordSchlau,
  wordSchliessen,
  wordSchluessel,
  wordSchmecken,
  wordSchmetterling,
  wordSchnell,
  wordSchoen,
  wordSchrank,
  wordSchreiben,
  wordSchreibtisch,
  wordSchublade,
  wordSchuh,
  wordSchule,
  wordSchweiz,
  wordSchwester,
  wordSchwimmen,
  wordSechzig,
  wordSehen,
  wordSeife,
  wordSein,
  wordSessel,
  wordSiebzig,
  wordSitzen,
  wordSocke,
  wordSofa,
  wordSohn,
  wordSonntag,
  wordSpaet,
  wordSpanien,
  wordSpass,
  wordSpazieren,
  wordSpeisekarte,
  wordSpiegel,
  wordSpiel,
  wordSpielen,
  wordSprache,
  wordSprechen,
  wordStadt,
  wordStehen,
  wordStellen,
  wordStimme,
  wordStockwerk,
  wordStolz,
  wordStrasse,
  wordStudieren,
  wordStuhl,
  wordStunde,
  wordSuchen,
  wordSuess,
  wordSuper,
  wordSupermarkt,
  wordSuppe,
  wordTag,
  wordTante,
  wordTanzen,
  wordTasche,
  wordTasse,
  wordTausend,
  wordTee,
  wordTelefon,
  wordTelefonieren,
  wordTelefonnummer,
  wordTeller,
  wordTeppich,
  wordTermin,
  wordTeuer,
  wordTisch,
  wordTochter,
  wordToilette,
  wordToll,
  wordTomate,
  wordTragen,
  wordTreffen,
  wordTreppe,
  wordTrinken,
  wordTrinkgeld,
  wordTschuess,
  wordTuer,
  wordTuerkei,
  wordTunesien,
  wordUeber,
  wordUhr,
  wordUnten,
  wordUnter,
  wordUrlaub,
  wordVase,
  wordVater,
  wordVerabredung,
  wordVerheiratet,
  wordVerkaeufer,
  wordVerkaufen,
  wordVerstehen,
  wordViel,
  wordViertel,
  wordVierzig,
  wordVorhang,
  wordVorname,
  wordVorspeise,
  wordVorstellen,
  wordWaesche,
  wordWand,
  wordWarten,
  wordWaschen,
  wordWaschmaschine,
  wordWasser,
  wordWechselgeld,
  wordWecken,
  wordWecker,
  wordWeg,
  wordWein,
  wordWelt,
  wordWen,
  wordWieGehts,
  wordWiederholen,
  wordWo,
  wordWoche,
  wordWoher,
  wordWohin,
  wordWohnen,
  wordWohnung,
  wordWohnzimmer,
  wordWunderbar,
  wordWurst,
  wordZaehlen,
  wordZahl,
  wordZahlen,
  wordZeichnen,
  wordZeigen,
  wordZeit,
  wordZeitung,
  wordZentrum,
  wordZiffer,
  wordZimmer,
  wordZucker,
  wordZug,
  wordZusammen,
  wordZwanzig,
  wordZwilling,
  wordZwischen,
];

const LESSON_JSONS = [lessonD1, lessonD2, lessonD3, lessonD4, lessonD5, lessonD6, lessonU2D1, lessonU2D2, lessonU2D3, lessonU2D4, lessonU2D5, lessonU2D6, lessonU3D1, lessonU3D2, lessonU3D3, lessonU3D4, lessonU3D5, lessonU3D6, lessonU4D1, lessonU4D2, lessonU4D3, lessonU4D4, lessonU4D5, lessonU4D6, lessonU5D1, lessonU5D2, lessonU5D3, lessonU5D4, lessonU5D5, lessonU5D6, lessonU6D1, lessonU6D2, lessonU6D3, lessonU6D4, lessonU6D5, lessonU6D6, lessonU7D1, lessonU7D2, lessonU7D3, lessonU7D4, lessonU7D5, lessonU7D6, lessonU8D1, lessonU8D2];

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
