#!/usr/bin/env python3
"""
tools/goethe-wordlist.py — فهرس الكلمات الرئيسية من قوائم Goethe الرسمية (D110)

يستخرج عمود الكلمة الرئيسية فقط (الكلمة + أداة التعريف + علامة الجمع/التصريف كما طُبعت)
وبنود «مجموعات الكلمات» (Wortgruppen) من قوائم Goethe الرسمية المجانية. لا يكتب أي جملة مثال
أبداً (حقوق النشر — المستودع عام)، ولا تُرفع ملفات PDF إلى المستودع: تُمرَّر مساراتها فقط.

الاستخدام:
  pip install pdfplumber==0.11.10        # للاستخراج من PDF فقط
  python3 tools/goethe-wordlist.py --sd1 A1_SD1_Wortliste_02.pdf --a2 Goethe-Zertifikat_A2_Wortliste.pdf
  python3 tools/goethe-wordlist.py --fit1                # من النسخ المكتوب للكلمات الرئيسية (لا PDF)
  python3 tools/goethe-wordlist.py ... --check           # يتحقق أن JSON المحفوظ مطابق (لا كتابة)
  python3 tools/goethe-wordlist.py --sd1 X.pdf --dump-raw /tmp/sd1.txt   # تشخيص

المخرجات: content/wordlists/goethe-a1-sd1.json · goethe-a2.json · goethe-a1-fit1.json
(المخطط: content/schemas/wordlist.ts — والمطابقة مع كلماتنا: tools/lib/goethe-lists.ts)

طريقة الاستخراج (لا تخمين):
  * الكلمات بإحداثياتها (pdfplumber): عمود الكلمة الرئيسية = ما يقع يسار حدّ عمود الأمثلة.
  * SD1: عمود واحد؛ المدخل الفرعي (eingerückter Nebeneintrag) مُزاح ≥3pt عن المدخل الرئيسي.
  * A2: عمودان في الصفحة؛ صيغ الفعل تلتف على أسطر (abgeben, / gibt ab, / hat abgegeben):
    السطر التالي تتمة إن انتهى السابق بفاصلة أو / أو ( ، أو تلاه بلا فراغ فقرة (< 12.5pt).
  * الكلمة المقطوعة بشرطة (der Kühl- / schrank) تُوصل إن كان للمدخل أداة تعريف والتتمة بحرف صغير.
  * Wortgruppen جداول غير منتظمة: بنودها مكتوبة هنا يدوياً (GROUPS) ويُتحقَّق آلياً أن كل بند
    موجود حرفياً في نص صفحته — أي خطأ نسخ يوقف الأداة.
  * Fit1: لا نسخة PDF في بيئة البناء (المضيف محجوب)؛ الكلمات الرئيسية منسوخة يدوياً من العرض
    النصي للوثيقة الرسمية في content/wordlists/sources/goethe-a1-fit1-headwords.txt (المنهج مُعلَن
    في JSON: method = manual-transcription).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "content" / "wordlists"
FIT1_TRANSCRIPT = OUT_DIR / "sources" / "goethe-a1-fit1-headwords.txt"
SCHEMA_VERSION = "1.0.0"

# ——————————————————————————————————————————— المصادر الرسمية ———
META = {
    "goethe-a1-sd1": {
        "level": "A1",
        "exam": "Goethe-Zertifikat A1: Start Deutsch 1",
        "title": "Goethe-Zertifikat A1 Start Deutsch 1 — Wortliste",
        "officialUrl": "https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf",
        "file": "A1_SD1_Wortliste_02.pdf",
        "alphaPages": list(range(9, 28)),
        "statedEntries": "circa 650 Einträge (Vorwort S. 3, S. 5)",
        "obtainedVia": "GitHub (goethe.de محجوب في بيئة البناء): git blob نفسه 0c8162cb… في 7 مستودعات مستقلة — "
                       "lincw/deutsch_a1 · pm470/German-A1 · 24521450/anki-deutsch · enrico200165/evlearn_languages · "
                       "settlersxp/Langu · JuanOlaya/juanolaya.github.io",
        "verifiedAgainst": "goethe.de 2026-10-14 (قراءة مباشرة): عنوان الملف A1_SD1_Wortliste_02.indd ونص المقدمة "
                           "والفهرس ومجموعات الكلمات مطابقة",
    },
    "goethe-a2": {
        "level": "A2",
        "exam": "Goethe-Zertifikat A2",
        "title": "Goethe-Zertifikat A2 — Wortliste",
        "officialUrl": "https://www.goethe.de/pro/relaunch/prf/de/Goethe-Zertifikat_A2_Wortliste.pdf",
        "file": "Goethe-Zertifikat_A2_Wortliste.pdf",
        "alphaPages": list(range(8, 32)),
        "statedEntries": "circa 1300 lexikalische Einheiten (Vorwort S. 4)",
        "obtainedVia": "GitHub (goethe.de محجوب في بيئة البناء): JuanOlaya/juanolaya.github.io — git blob c4f7e2bf… "
                       "(تعديل 2025-06-11)؛ النسخة الأقدم (e9ab944e…، تعديل 2020-09-15، في مستودعين) تعطي الكلمات "
                       "الرئيسية نفسها حرفياً",
        "verifiedAgainst": "goethe.de 2026-10-14 (قراءة مباشرة): العنوان نفسه · Impressum (© 2016، 1. Auflage) · "
                           "Vorwort · Wortgruppen مطابقة · الكلمات الرئيسية E–F وS–U مطابقة بالعيّنة",
    },
    "goethe-a1-fit1": {
        "level": "A1",
        "exam": "Goethe-Zertifikat A1: Fit in Deutsch 1",
        "title": "Goethe-Zertifikat A1: Fit in Deutsch 1 — Wortliste (2. Auflage 2024)",
        "officialUrl": "https://www.goethe.de/pro/relaunch/prf/de/Goethe-Zertifikat_A1_Fit1_Wortliste.pdf",
        "file": "Goethe-Zertifikat_A1_Fit1_Wortliste.pdf",
        "alphaPages": list(range(9, 22)),
        "statedEntries": "circa 650 Einträge (Vorwort S. 4)",
        "obtainedVia": "goethe.de 2026-10-14 (قراءة مباشرة للعرض النصي للـPDF الرسمي) — لا نسخة PDF في بيئة البناء "
                       "ولا على GitHub",
        "verifiedAgainst": "الترتيب الأبجدي محفوظ · الصفحات 9–21 كلها منسوخة · فجوتان معلنتان في ملف النسخ",
    },
}

# ——————————————————————————————————— Wortgruppen (منسوخة يدوياً + تحقق آلي) ———
# (اسم المجموعة، الصفحة، البنود كما طُبعت). البند = كلمة رئيسية واحدة (قد تحمل علامة جمع).
GROUPS: dict[str, list[tuple[str, int, list[str]]]] = {
    "goethe-a1-sd1": [
        ("Zahlen", 6, ["eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn",
                       "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn",
                       "neunzehn", "zwanzig", "einundzwanzig", "dreißig", "vierzig", "fünfzig", "sechzig",
                       "siebzig", "achtzig", "neunzig", "(ein)hundert", "hunderteins", "zweihundert",
                       "(ein)tausend", "eine Million, =en", "eine Milliarde, =en", "das/der/die erste",
                       "zweite", "dritte", "vierte"]),
        ("Datum", 6, ["ein halb", "halb", "ein Viertel", "Viertel"]),
        ("Uhrzeit", 7, ["null Uhr drei", "halb drei"]),
        ("Zeitmaße, Zeitangaben", 7, ["die Sekunde, -n", "die Minute, -n", "die Stunde, -n", "der Tag, -e",
                                      "die Woche, -e", "das Jahr, -e"]),
        ("Woche/Wochentage", 7, ["der Wochentag, -e", "der Sonntag", "der Montag", "der Dienstag", "der Mittwoch",
                                 "der Donnerstag", "der Freitag", "der Samstag/Sonnabend", "das Wochenende",
                                 "am Wochenende"]),
        ("Tag/Tageszeiten", 7, ["der Tag", "der Morgen", "der Vormittag,-e", "der Mittag", "der Nachmittag,-e",
                                "der Abend,-e", "die Nacht,¨-e"]),
        ("Überschrift «Monat/Monatsnamen»", 7, ["Monat"]),
        ("Monat/Monatsnamen", 7, ["der Januar", "der Februar", "der März", "der April", "der Mai", "der Juni",
                                  "der Juli", "der August", "der September", "der Oktober", "der November",
                                  "der Dezember"]),
        ("Jahr/Jahreszeiten", 8, ["der Frühling/das Frühjahr", "der Sommer", "der Herbst", "der Winter"]),
        ("Währungen", 8, ["Euro", "Cent"]),
        ("Maße und Gewichte", 8, ["ein Meter", "ein Zentimeter", "zweihundert Kilometer", "ein Quadratmeter",
                                  "ein Grad", "unter Null", "minus", "über Null", "plus", "ein Prozent",
                                  "ein Liter", "ein Gramm", "ein Pfund", "ein Kilo(gramm)"]),
        ("Länder/Ländernamen/Nationalitäten", 8, ["Deutschland", "der/die Deutsche, -n", "deutsch", "Europa",
                                                 "Europäer", "europäisch", "Türkei", "Türke/Türkin", "türkisch",
                                                 "Finnland", "Finne/Finnin", "finnisch", "Mexiko",
                                                 "Mexikaner/Mexikanerin", "mexikanisch"]),
        ("Farben", 8, ["schwarz", "grau", "blau", "grün", "weiß", "rot", "gelb", "braun"]),
        ("Himmelsrichtungen", 8, ["der Norden", "der Süden", "der Westen", "der Osten"]),
    ],
    "goethe-a2": [
        ("Abkürzungen", 5, ["ca.", "d.h.", "ICE", "Lkw, -s", "PC, -s", "SMS", "usw.", "WC, -s", "z. B."]),
        ("Anweisungssprache zur Prüfung", 5, ["Antwortbogen, -", "Aufgabe, -n", "Beispiel, -e", "Durchsage, -n",
                                              "Lösung, -en", "markieren", "Prüfer, -, Prüferin, -nen",
                                              "Prüfung, -en", "Punkt, -e", "Teil, -e", "Test, -s", "Text, -e",
                                              "Wörterbuch, ¨-er"]),
        ("Berufe", 5, ["Angestellter, -e / Angestellte, -", "Arzt, ¨-e / Ärztin, -nen",
                       "Auszubildender, -e/ Auszubildende,-", "Autor, -en; Autorin, -nen", "Babysitter,-",
                       "Bäcker, - / Bäckerin, -nen", "Doktor, -en; Doktorin, -nen", "Fahrer, -; Fahrerin, -nen",
                       "Friseur, -e / Friseurin, -nen", "Handwerker, - / Handwerkerin, -nen",
                       "Hausmann, ¨-er / Hausfrau, -en", "Journalist, -en / Journalistin, -nen",
                       "Kaufmann, Kaufleute / Kauffrau, -en", "Kellner, - / Kellnerin, -nen",
                       "Koch, ¨-e / Köchin, -nen", "Krankenpfleger, - / Krankenschwester, -n",
                       "Künstler, - / Künstlerin, -nen", "Lehrer, - / Lehrerin, -nen",
                       "Mechaniker, - / Mechanikerin, -nen", "Model, -s, -le", "Musiker, - / Musikerin, -nen",
                       "Polizist, -en / Polizistin, -nen", "Rentner, - / Rentnerin, -nen",
                       "Sänger, - / Sängerin, -nen", "Schauspieler, - / Schauspielerin, -nen",
                       "Techniker, - / Technikerin, -nen", "Verkäufer, - / Verkäuferin, -nen"]),
        ("Familienmitglieder", 5, ["Bruder, ¨-", "Cousin, -s", "Cousine, -n", "Eltern (Pl.)", "Enkel,-",
                                   "Enkelin, -nen", "Geschwister (Pl.)", "Großeltern (Pl.)", "Großmutter, ¨- (Oma)",
                                   "Großvater, ¨- (Opa)", "Kind, -er", "Mutter, ¨- (Mama)", "Onkel, -",
                                   "Schwester, -n", "Sohn, ¨-e", "Tante, -n", "Tochter, ¨-", "Vater, ¨- (Papa)",
                                   "Verwandte, -n"]),
        ("Familienstand", 5, ["ledig", "verheiratet", "getrennt / geschieden"]),
        ("Farben", 5, ["blau", "braun", "gelb", "grau", "grün", "lila", "orange", "rosa", "rot", "schwarz", "weiß"]),
        ("Himmelsrichtungen", 5, ["Norden", "Süden", "Osten", "Westen"]),
        ("Länder und Nationalitäten", 6, ["Deutschland", "Deutsche, -n", "deutsch", "auf Deutsch", "Österreich",
                                          "Österreicher, - / Österreicherin, -nen", "österreichisch",
                                          "die Schweiz", "Schweizer, - / Schweizerin, -nen", "schweizerisch",
                                          "Luxemburg", "Luxemburger, - / Luxemburgerin, -nen", "luxemburgisch",
                                          "Europa", "Europäer, - / Europäerin, -nen", "europäisch"]),
        ("Schule und Schulfächer", 6, ["Abitur (Sg.)", "Direktor, -en", "Hausaufgabe, -n", "Klasse, -n",
                                       "Klassenfahrt, -en", "Sekretariat, -e", "Stundenplan, ¨-e", "Biologie",
                                       "Chemie", "Deutsch", "Englisch", "Französisch", "Geografie", "Geschichte",
                                       "Kunst(erziehung)", "Latein", "Mathematik", "Musik", "Physik", "Religion",
                                       "Sozialkunde", "Sport"]),
        ("Währungen und Maße", 6, ["Euro", "Cent", "Franke", "Rappen", "ein Meter fünfzig", "ein Gramm",
                                   "ein Kilogramm", "Grad Celsius"]),
        ("Feiertage", 6, ["Karneval", "Ostern", "Weihnachten", "Neujahr/Silvester"]),
        ("Überschrift «Monate»", 6, ["Monate"]),
        ("Monate", 6, ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September",
                       "Oktober", "November", "Dezember"]),
        ("Jahreszeiten", 6, ["Frühling / Frühjahr", "Sommer", "Herbst", "Winter"]),
        ("Tageszeiten", 6, ["Tag, -e", "Morgen, -", "Vormittag, -e", "Mittag, -e", "Nachmittag, -e", "Abend, -e",
                            "Nacht, ¨-e", "Mitternacht", "täglich", "tagsüber", "morgens", "am Morgen",
                            "vormittags", "am Vormittag", "mittags", "am Mittag", "nachmittags",
                            "am Nachmittag", "abends", "am Abend", "nachts", "in der Nacht", "um Mitternacht"]),
        ("Uhrzeit", 7, ["halb vier", "viertel nach zehn", "viertel vor sieben"]),
        ("Wochentage", 7, ["am Wochenende", "montags", "am Montag", "dienstags", "am Dienstag", "mittwochs",
                           "am Mittwoch", "donnerstags", "am Donnerstag", "freitags", "am Freitag", "samstags",
                           "am Samstag", "sonntags", "am Sonntag", "Arbeitstag/Werktag", "Feiertag"]),
        ("Zeitmaße", 7, ["Sekunde", "Minute", "Stunde", "Woche", "Jahr"]),
        ("Zahlen", 7, ["eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf",
                       "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn",
                       "neunzehn", "zwanzig", "einundzwanzig", "dreißig", "vierzig", "fünfzig", "sechzig",
                       "siebzig", "achtzig", "neunzig", "(ein)hundert", "hunderteins", "zweihundert",
                       "(ein)tausend", "zweitausendeins", "eine Million", "der/die erste", "der/die zweite",
                       "der/die dritte", "der/ die vierte", "erstens", "zweitens", "drittens", "viertens",
                       "einmal", "zweimal", "dreimal", "viermal"]),
    ],
}

# الفئة المفتوحة في SD1 وFit1: «Angabe der eigenen Herkunft oder Nationalität» — لا قائمة مغلقة
OPEN_CATEGORIES = {
    "goethe-a1-sd1": [{"id": "herkunft", "group": "Länder/Ländernamen/Nationalitäten", "page": 8,
                       "note": "Angabe der eigenen Herkunft oder Nationalität — Land, Bewohner, Nationalität "
                               "(z. B. Türkei, Türke/Türkin, türkisch)"}],
    "goethe-a1-fit1": [{"id": "herkunft", "group": "Länder und Nationalitäten", "page": 7,
                        "note": "Angabe der eigenen Herkunft oder Nationalität (z. B. Türkei, Türke/Türkin, türkisch)"}],
    "goethe-a2": [],
}

# ——————————————————————————————————————— تحليل الكلمة الرئيسية ———
# حالات غير منتظمة تُحلّ صراحة (المطبوع → الأداة + الصيغ). كل ما عداها يُحلَّل بالقواعد العامة.
OVERRIDES: dict[str, tuple[str | None, list[str]]] = {
    # SD1
    "das Hähnchen, die Halbpension": ("das", ["Hähnchen"]),
    "dort, -her, -hin": (None, ["dort", "dorther", "dorthin"]),
    "der, die, das": (None, ["der", "die", "das"]),
    "(Kredit)-Karte, -n": ("die", ["Karte", "Kreditkarte"]),
    "Grad (Celsius)": ("der", ["Grad", "Grad Celsius"]),
    "Grad Celsius": ("der", ["Grad", "Grad Celsius"]),
    "Monat": ("der", ["Monat"]),          # عنوان المجموعة «Monat/Monatsnamen» (SD1 ص7)
    "Monate": ("der", ["Monat"]),         # عنوان المجموعة «Monate» (A2 ص6)
    "leidtun/leid tun, tut leid, hat leidgetan": (None, ["leidtun", "leid tun"]),
    "informieren (sich) (über), informiert, hat informiert": (None, ["informieren"]),
    "mit (+ mitbringen/ -kommen/-machen/ -nehmen/-spielen)":
        (None, ["mit", "mitbringen", "mitkommen", "mitmachen", "mitnehmen", "mitspielen"]),
    "was für ein": (None, ["was für ein"]),
    "das Wort, -ö, er/-e": ("das", ["Wort"]),
    "eine Million, =en": ("die", ["Million"]),
    "eine Milliarde, =en": ("die", ["Milliarde"]),
    "ein halb": (None, ["halb"]),
    "ein Viertel": ("das", ["Viertel"]),
    "null Uhr drei": (None, ["null"]),
    "halb drei": (None, ["halb"]),
    "ein Meter": ("der", ["Meter"]),
    "ein Zentimeter": ("der", ["Zentimeter"]),
    "zweihundert Kilometer": ("der", ["Kilometer"]),
    "ein Quadratmeter": ("der", ["Quadratmeter"]),
    "ein Grad": ("der", ["Grad"]),
    "unter Null": (None, ["Null", "unter Null"]),
    "über Null": (None, ["über Null"]),
    "ein Prozent": ("das", ["Prozent"]),
    "ein Liter": ("der", ["Liter"]),
    "ein Gramm": ("das", ["Gramm"]),
    "ein Pfund": ("das", ["Pfund"]),
    "ein Kilo(gramm)": ("das", ["Kilo", "Kilogramm"]),
    "Türke/Türkin": ("der", ["Türke", "Türkin"]),
    "Finne/Finnin": ("der", ["Finne", "Finnin"]),
    "Mexikaner/Mexikanerin": ("der", ["Mexikaner", "Mexikanerin"]),
    # A2
    "auf jeden/ keinen Fall": (None, ["auf jeden Fall", "auf keinen Fall"]),
    "der Bescheid (bekommen/ geben/sagen)": ("der", ["Bescheid"]),
    "der Club, -s / Klub, -s": ("der", ["Club", "Klub"]),
    "da(r) (Bsp. darauf, darüber)": (None, ["da", "darauf", "darüber"]),
    "dabei (sein), ist dabei, war dabei, ist dabei gewesen": (None, ["dabei", "dabei sein"]),
    "dafür/dagegen sein, ist dafür/dagegen, war dafür/dagegen, ist dafür/ dagegen gewesen":
        (None, ["dafür", "dagegen", "dafür sein", "dagegen sein"]),
    "die Ehefrau, -en/ der Ehemann,¨-er/ der Ehepartner, -": ("die", ["Ehefrau", "Ehemann", "Ehepartner"]),
    "einverstanden sein, ist einverstanden, war einverstanden, ist einverstanden gewesen":
        (None, ["einverstanden", "einverstanden sein"]),
    "die Feier, -n (z. B. Feierabend, Feiertag)": ("die", ["Feier", "Feierabend", "Feiertag"]),
    "Geburts- (jahr, ort, tag), (-e, -e, -e)": (None, ["Geburts-", "Geburtsjahr", "Geburtsort", "Geburtstag"]),
    "die Tafel, -n (z. B. Infotafel)": ("die", ["Tafel", "Infotafel"]),
    "der Vorschlag, ¨-e (haben/machen)": ("der", ["Vorschlag"]),
    "weg/weg- (wegbringen/ -fahren/-gehen/ -laufen/-machen/ -nehmen/-werfen)":
        (None, ["weg", "weg-", "wegbringen", "wegfahren", "weggehen", "weglaufen", "wegmachen", "wegnehmen",
                "wegwerfen"]),
    "weiter (z. B. weitermachen/-helfen)": (None, ["weiter", "weitermachen", "weiterhelfen"]),
    "wollen, will, wollte, hat gewollt (hat wollen als Modalverb)": (None, ["wollen"]),
    "zurück- (fahren, geben, gehen, kommen, laufen)":
        (None, ["zurück-", "zurückfahren", "zurückgeben", "zurückgehen", "zurückkommen", "zurücklaufen"]),
    "(an-)/(aus)ziehen, zieht (an/aus), hat/ist (an/aus)gezogen": (None, ["ziehen", "anziehen", "ausziehen"]),
    "wer (wen, wem)": (None, ["wer", "wen", "wem"]),
    "an sein / aus sein": (None, ["an sein", "aus sein"]),
    "verbieten / verboten sein": (None, ["verbieten", "verboten sein"]),
    "getrennt / geschieden": (None, ["getrennt", "geschieden"]),
    "Großmutter, ¨- (Oma)": ("die", ["Großmutter", "Oma"]),
    "Großvater, ¨- (Opa)": ("der", ["Großvater", "Opa"]),
    "Mutter, ¨- (Mama)": ("die", ["Mutter", "Mama"]),
    "Vater, ¨- (Papa)": ("der", ["Vater", "Papa"]),
    "Kaufmann, Kaufleute / Kauffrau, -en": (None, ["Kaufmann", "Kauffrau"]),
    "ein Meter fünfzig": ("der", ["Meter"]),
    "ein Kilogramm": ("das", ["Kilogramm"]),
    "eine Million": ("die", ["Million"]),
    "halb vier": (None, ["halb"]),
    "viertel nach zehn": (None, ["viertel"]),
    "viertel vor sieben": (None, ["viertel"]),
    "de Rentner, - / die Rentnerin, -nen": ("der", ["Rentner", "Rentnerin"]),  # «de» خطأ طباعي في الأصل
    "Angestellter, -e / Angestellte, -": (None, ["Angestellter", "Angestellte"]),
    "Auszubildender, -e/ Auszubildende,-": (None, ["Auszubildender", "Auszubildende"]),
    "sich umziehen, zieht sich um, zog sich um, hat sich umgezogen": (None, ["umziehen"]),
    # Fit1
    "e Disco, -s (-thek, -en)": ("die", ["Disco", "Diskothek"]),
    "r, e, s beste": (None, ["beste"]),
    "r, e, s nächste": (None, ["nächste"]),
    "welch- , -er, -e, -s": (None, ["welch-"]),
    "(s Fahrrad)": ("das", ["Fahrrad"]),
    "der/die Europäer (-in)": ("der/die", ["Europäer", "Europäerin"]),
    "der/die Italiener (-in)": ("der/die", ["Italiener", "Italienerin"]),
    "der/die Engländer (-in)": ("der/die", ["Engländer", "Engländerin"]),
    "chatten, r Chat(room), -s": (None, ["chatten", "Chat", "Chatroom"]),
    "faxen, s Fax, -e": (None, ["faxen", "Fax"]),
    "ankreuzen, s Kreuz, -e": (None, ["ankreuzen", "Kreuz"]),
    "e (Schüler-)Band, s": ("die", ["Band", "Schülerband"]),
    "r Teil, -e / r Prüfungsteil, -e": ("der", ["Teil", "Prüfungsteil"]),
    "r Hausmann, - männer / e Hausfrau, -en": (None, ["Hausmann", "Hausfrau"]),
    "r Kaufmann, -männer / e Kauffrau, -en": (None, ["Kaufmann", "Kauffrau"]),
    "e Grundschule/Hauptschule": ("die", ["Grundschule", "Hauptschule"]),
    "e Sprachenschule / s Goethe-Institut": (None, ["Sprachenschule", "Goethe-Institut"]),
    "Deutsch/Mathematik/Englisch/Geografie/Kunst(erziehung)/Sozialkunde/Sport/Physik/Chemie/Geschichte":
        (None, ["Deutsch", "Mathematik", "Englisch", "Geografie", "Kunst", "Kunsterziehung", "Sozialkunde",
                "Sport", "Physik", "Chemie", "Geschichte"]),
    "1 Euro = 100 Cent": (None, ["Euro", "Cent"]),
    "ein Meter fünfzig ": ("der", ["Meter"]),
    "zwei Kilometer": ("der", ["Kilometer"]),
    "Türkei, Türke/Türkin, türkisch": (None, ["Türkei", "Türke", "Türkin", "türkisch"]),
}

ABBREV = {"z. B.", "ca.", "usw.", "d.h.", "z.B."}
FIT1_ART = {"r": "der", "e": "die", "s": "das", "r/e": "der/die", "e/s": "die/das", "r/s": "der/das"}
ANNOT = re.compile(r"\s*\((?:Sg|Pl|pl|Sing|sg)\.?\)")


def norm_ws(s: str) -> str:
    s = unicodedata.normalize("NFC", s)
    s = s.replace("\u2013", "-").replace("\u2014", "-").replace("\u2019", "'").replace("\u2018", "'")
    s = s.replace("\u00a0", " ").replace("\u03b2", "ß")  # β (Beta) بدل ß في بعض النسخ
    return re.sub(r"\s+", " ", s).strip()


def split_top(s: str, sep_re: str) -> list[str]:
    """تقسيم خارج الأقواس فقط"""
    out, depth, cur, i = [], 0, "", 0
    pat = re.compile(sep_re)
    while i < len(s):
        ch = s[i]
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        if depth == 0:
            m = pat.match(s, i)
            if m and m.end() > i:
                out.append(cur)
                cur = ""
                i = m.end()
                continue
        cur += ch
        i += 1
    out.append(cur)
    return [x.strip() for x in out if x.strip()]


def take_article(s: str, notation: str) -> tuple[str | None, str]:
    if notation == "fit1":
        m = re.match(r"^(r/e|e/s|r/s|r|e|s)\s+(?=\S)", s)
        if m:
            return FIT1_ART[m.group(1)], s[m.end():]
    m = re.match(r"^((?:der|die|das)(?:\s*/\s*(?:der|die|das))*)\s+(?=\S)", s)
    if m:
        return re.sub(r"\s+", "", m.group(1)), s[m.end():]
    return None, s


def expand_parens(lemma: str) -> list[str]:
    """(ab)fahren → fahren + abfahren · (E-)Mail → Mail + E-Mail · (Kredit)-Karte → Karte + Kreditkarte ·
    (Fahr)Rad → Rad + Fahrrad · gern(e) → gern + gerne · Kilo(gramm) → Kilo + Kilogramm"""
    m = re.fullmatch(r"\(([^()\s]+)\)(-?)(\S+)", lemma)
    if m:
        pre, hy, base = m.groups()
        if pre.endswith("-"):
            joined = pre + base
        elif hy or (pre[:1].isupper() and base[:1].isupper()):
            joined = pre + base[0].lower() + base[1:]
        else:
            joined = pre + base
        return [base, joined]
    m = re.fullmatch(r"(\S+?)\(([^()\s]+)\)", lemma)
    if m:
        return [m.group(1), m.group(1) + m.group(2)]
    return [lemma]


def clean_lemma(s: str) -> str:
    s = s.strip()
    s = re.sub(r"^\(sich\)\s*", "", s)
    s = re.sub(r"\s*\(sich\)$", "", s)
    s = re.sub(r"^sich\s+", "", s)
    if s not in ABBREV:
        s = s.rstrip("!;,").strip()
    return s


def parse_headword(raw: str, notation: str = "std") -> tuple[str | None, list[str]]:
    h = norm_ws(raw)
    if h in OVERRIDES:
        art, lem = OVERRIDES[h]
        return art, list(lem)
    h2 = ANNOT.sub("", h).strip()
    h2 = re.sub(r"\b(der|die|das)\s*/\s*(der|die|das)\b", r"\1/\2", h2)  # der/ die vierte
    h2 = re.sub(r";\s*(?=[-¨])", ", ", h2)  # r Herr; -en
    if h2 in OVERRIDES:
        art, lem = OVERRIDES[h2]
        return art, list(lem)
    # أزواج بأداة: «der Freund, -e, die Freundin, -nen» · «der Partner, -/ die Partnerin, -nen»
    variants = []
    for v in split_top(h2, r"\s*/\s+|\s+/\s*|\s*;\s*|,\s+(?=(?:der|die|das)\s)"):
        # «hat gehangen/ gehängt»: الشرطة المائلة بعد فاصلة وأمام كلمة صغيرة = صيغة بديلة لا كلمة رئيسية
        if variants and "," in variants[-1] and re.match(r"^[a-zäöüß]", v) and not re.match(r"^(der|die|das|r|e|s)\s", v):
            variants[-1] = variants[-1] + "/" + v
        else:
            variants.append(v)
    article_main: str | None = None
    lemmas: list[str] = []
    for vi, v in enumerate(variants):
        art, rest = take_article(v, notation)
        if vi == 0:
            article_main = art
        head = split_top(rest, r",\s*")
        if not head:
            continue
        lemma_part = head[0]
        # «gut, besser, am besten» · «gern, lieber, am liebsten»: صيغة التفضيل جزء من المدخل
        if len(head) == 3 and re.fullmatch(r"am [a-zäöüß]+", head[2]) and re.fullmatch(r"[a-zäöüß]+", head[1]):
            head = [head[0], head[1]]
            comparative = [head[1]]
        else:
            comparative = []
        # «Prüfer, -, Prüferin, -nen»: كلمة كبيرة الحرف بين صيغ اسم = صيغة مؤنثة
        extra = [x for x in head[1:] if lemma_part[:1].isupper() and re.fullmatch(r"[A-ZÄÖÜ][\wäöüß]+in", x)]
        for part in [lemma_part, *extra, *comparative]:
            minors = part.split("/") if "/" in part and part not in ABBREV and not part.startswith("(") else [part]
            pairs = [take_article(x.strip(), notation) for x in minors if x.strip()]
            for (a2, _) in pairs:
                if a2 and article_main is None:
                    article_main = a2
            lems = [x for (_, x) in pairs]
            if len(lems) > 1:  # dafür/dagegen sein → dafür sein + dagegen sein
                last_words = lems[-1].split(" ")
                if len(last_words) > 1 and all(" " not in x for x in lems[:-1]) and pairs[-1][0] is None:
                    tail = " ".join(last_words[1:])
                    lems = [x + " " + tail for x in lems[:-1]] + [lems[-1]]
            for mnr in lems:
                for e in expand_parens(clean_lemma(mnr)):
                    e = clean_lemma(e)
                    forms = [e]
                    m = re.fullmatch(r"([a-zäöüß]+) sein", e)  # erkältet sein → erkältet (صفة + sein)
                    if m and m.group(1) not in {"an", "auf", "aus", "weg", "zu"}:
                        forms.append(m.group(1))
                    for f in forms:
                        if f and not f.startswith("-") and f not in lemmas:
                            lemmas.append(f)
    return article_main, lemmas


# ——————————————————————————————————————— الاستخراج من PDF ———
def page_lines(page, xmin: float, xmax: float, hx: float):
    """أسطر عمود: [{'top', 'head': [words], 'ex': [words]}].
    حدّ عمود الأمثلة = أكثر x0 تكراراً بعد hx في هذه الصفحة (يتزحزح 105–107 / 374–376 بين الصفحات)؛
    الكلمة الملتصقة بمثال («-eIch») تُقسَم على مستوى الحرف عند ذلك الحدّ."""
    from collections import Counter

    words = [w for w in page.extract_words(extra_attrs=["fontname", "size"], return_chars=True)
             if w["size"] > 6.5 and 60 < w["top"] < 790 and xmin <= w["x0"] < xmax]
    common = Counter(round(w["x0"], 1) for w in words if w["x0"] >= hx).most_common(1)
    ex_col = common[0][0] if common else hx
    ex_x = ex_col - 1.5  # بعض أسطر الأمثلة مُزاحة 0.6pt (374.4 مقابل 375.0)
    head, ex = [], []
    for w in words:
        if w["x0"] >= ex_x:
            ex.append(w)
            continue
        # قصّ فقط حيث يبدأ مثالٌ فعلاً: حرف كبير (بداية جملة) عند حدّ العمود تماماً — لا داخل كلمة طويلة
        cut = next((i for i, c in enumerate(w["chars"])
                    if i > 0 and abs(c["x0"] - ex_col) < 1.5 and (c["text"].isupper() or c["text"] in "„\"'(–-")), None)
        if cut is None:
            head.append(w)
        else:
            hc, ec = w["chars"][:cut], w["chars"][cut:]
            head.append({**w, "text": "".join(c["text"] for c in hc), "x1": hc[-1]["x1"]})
            ex.append({**w, "text": "".join(c["text"] for c in ec), "x0": ec[0]["x0"]})
    rows: list[dict] = []
    for w, kind in sorted([(w, "head") for w in head] + [(w, "ex") for w in ex], key=lambda t: (t[0]["top"], t[0]["x0"])):
        if rows and abs(rows[-1]["top"] - w["top"]) < 2.0:
            rows[-1][kind].append(w)
        else:
            rows.append({"top": w["top"], "head": [], "ex": []})
            rows[-1][kind].append(w)
    for r in rows:
        r["head"].sort(key=lambda w: w["x0"])
        r["ex"].sort(key=lambda w: w["x0"])
    return rows


LETTER = re.compile(r"^[A-Za-zÄÖÜäöü]$")
HEADING = re.compile(r"^(ALPHABETISCHER|WORTSCHATZ|ALPHABETISCHER WORTSCHATZ)$")


def segment(rows, page_no: int, mode: str, main_x: float | None, carry):
    """يحوّل أسطر عمود إلى مداخل. carry = المدخل المفتوح من العمود/الصفحة السابقة (للالتفاف)."""
    entries = []
    cur = carry
    prev_top = None
    prev_had_head = False
    for ln in rows:
        htxt = norm_ws(" ".join(w["text"] for w in ln["head"]))
        if not htxt:
            prev_had_head = False
            prev_top = ln["top"]
            continue
        if LETTER.match(htxt) or HEADING.match(htxt):
            cur, prev_had_head, prev_top = None, False, ln["top"]
            continue
        x = ln["head"][0]["x0"]
        gap = (ln["top"] - prev_top) if prev_top is not None else 99.0
        cont = False
        if cur is not None:
            r = cur["headword"]
            noun = re.match(r"^\(?(der|die|das|de)\s", r) is not None
            if re.fullmatch(r"[-¨=]{1,2}[a-zäöü]{0,4}", htxt) and prev_had_head:
                cont = True  # das Hähnchen, / -  (علامة جمع وحيدة على سطر)
            elif r.endswith(("/", "(")) or r.count("(") > r.count(")"):
                cont = True  # die Ehefrau, -en/ / der Ehemann · die Feier, -n (z. B. Feierabend, / Feiertag)
            elif (prev_had_head and re.search(r"[A-Za-zÄÖÜäöüß]-$", r) and htxt[:1].islower()
                    and not re.match(r"^(der|die|das)\b", htxt)
                    and (noun or r.count("(") > r.count(")"))):
                cont = True  # der Kühl- / schrank  (سطران متتاليان فقط)
            elif mode == "a2":
                pair = re.match(r"^(?:der|die|das)\s+(\S{4})", htxt)
                same_stem = pair is not None and re.search(r"\s" + re.escape(pair.group(1)), " " + r) is not None
                if r.endswith(",") and (not noun or re.match(r"^[-¨(]", htxt) or same_stem):
                    cont = True  # abgeben, / gibt ab, / hat abgegeben · der Freund, -e, / die Freundin  (لا: das Doppelzimmer, / das Dorf)
                elif re.fullmatch(r"(der|die|das)(/(der|die|das))*", r):
                    cont = True  # der/die / Bekannte, -n
                elif re.match(r"^\([^()]*\)(?:[,;]|\s|$)", htxt) or re.match(r"^\([^()]*$", htxt):
                    cont = True  # (Sg.) · (z. B. …) · (bekommen/ … · (sich), entschuldigt, …  (لا: (ab)fahren مدخل جديد)
                elif re.search(r"(?:^|\s)(hat|ist|hat/ist|war)$", r):
                    cont = True  # … hat/ist / (an/aus)gezogen
                elif prev_had_head and ((htxt.startswith("sein,") and re.fullmatch(r"[a-zäöüß]+", r))
                                        or (htxt == "gewesen" and " war " in r)):
                    cont = True  # einverstanden / sein, ist … · … ist erkältet / gewesen
        if cont:
            if cur["headword"].endswith("-") and htxt[:1].islower() and re.search(r"[A-Za-zÄÖÜäöüß]-$", cur["headword"]):
                cur["headword"] = cur["headword"][:-1] + htxt
            else:
                cur["headword"] = cur["headword"] + " " + htxt
        else:
            kind = "sub" if (main_x is not None and x > main_x + 3.0) else "main"
            cur = {"headword": htxt, "page": page_no, "kind": kind}
            entries.append(cur)
        prev_had_head = True
        prev_top = ln["top"]
    return entries, cur  # المدخل الأخير يُمرَّر للعمود/الصفحة التالية — القواعد نفسها تقرر الالتفاف


def extract_pdf(list_id: str, pdf_path: Path):
    import pdfplumber  # noqa: WPS433 — اعتماد اختياري (الاستخراج فقط)

    meta = META[list_id]
    entries = []
    page_texts: dict[int, str] = {}
    with pdfplumber.open(str(pdf_path)) as pdf:
        info = pdf.metadata or {}
        n_pages = len(pdf.pages)
        for pno in sorted({g[1] for g in GROUPS.get(list_id, [])}):
            page_texts[pno] = pdf.pages[pno - 1].extract_text() or ""
        carry = None
        for pno in meta["alphaPages"]:
            page = pdf.pages[pno - 1]
            if list_id == "goethe-a1-sd1":
                cols = [(100.0, 600.0, 230.0, 143.0)]
                mode = "sd1"
            else:
                cols = [(25.0, 297.0, 100.0, None), (297.0, 600.0, 370.0, None)]
                mode = "a2"
            for (xmin, xmax, hx, main_x) in cols:
                rows = page_lines(page, xmin, xmax, hx)
                got, carry = segment(rows, pno, mode, main_x, carry)
                entries.extend(got)
    return entries, page_texts, {"pages": n_pages, "pdfTitle": info.get("Title"), "pdfModDate": info.get("ModDate"),
                                 "pdfCreationDate": info.get("CreationDate")}


def squash(s: str) -> str:
    """للتحقق فقط: بلا مسافات ولا حالة أحرف (عناوين SD1 مطبوعة بأحرف صغيرة: «monat/monatsnamen»)"""
    s = norm_ws(s)
    s = re.sub(r"([A-Za-zÄÖÜäöüß])- ([a-zäöüß])", r"\1\2", s)  # Krankenschwes- ter
    return re.sub(r"\s+", "", s).lower()


def token_present(tok: str, hay: str) -> bool:
    """الرمز موجود حرفياً، أو مقطوعاً بشرطة سطر في الأصل (Krankenschwes- … ter) بجزأين موجودين كليهما"""
    if tok in hay:
        return True
    return any((tok[:i] + "-") in hay and tok[i:] in hay for i in range(3, len(tok) - 1))


def verify_groups(list_id: str, page_texts: dict[int, str]) -> list[str]:
    """كل رمز من كل بند منسوخ يدوياً يجب أن يوجد في نص صفحته (الصفحات جداول متعددة الأعمدة،
    فالبند الملتف قد تتخلله أسطر عمود مجاور — لذا الفحص رمزاً رمزاً لا سلسلة واحدة)."""
    problems = []
    for (group, pno, items) in GROUPS.get(list_id, []):
        hay = squash(page_texts.get(pno, ""))
        for it in items:
            if squash(it) in hay:
                continue
            toks = [t.lower() for t in re.split(r"[\s,/;()=]+", norm_ws(it)) if len(t) >= 2]
            missing = [t for t in toks if not token_present(t, hay)]
            if missing:
                problems.append(f"{list_id} p{pno} [{group}] «{it}» غير موجود في نص الصفحة (ينقص: {', '.join(missing)})")
    return problems


# ——————————————————————————————————————— Fit1: النسخ المكتوب ———
def read_fit1_transcript(path: Path):
    entries, groups = [], []
    page, group = None, None
    for ln in path.read_text(encoding="utf8").splitlines():
        s = ln.rstrip()
        if not s.strip() or s.lstrip().startswith("#"):
            continue
        if s.startswith("@page "):
            page = int(s.split()[1])
            continue
        if s.startswith("@group "):
            group = s[len("@group "):].strip()
            continue
        if s.startswith("@alpha"):
            group = None
            continue
        if page is None:
            raise SystemExit(f"{path}: سطر قبل أي @page: {s}")
        item = {"headword": norm_ws(s), "page": page, "kind": "group" if group else "main"}
        if group:
            item["group"] = group
            groups.append(item)
        else:
            entries.append(item)
    return entries, groups


# ——————————————————————————————————————— البناء والكتابة ———
def build_entry(e: dict, notation: str) -> dict:
    art, lemmas = parse_headword(e["headword"], notation)
    if not lemmas:
        raise SystemExit(f"مدخل بلا صيغة: {e}")
    out = {"headword": norm_ws(e["headword"]), "lemmas": lemmas}
    if art:
        out["article"] = art
    out["page"] = e["page"]
    out["kind"] = e["kind"]
    if e.get("group"):
        out["group"] = e["group"]
    return out


def file_facts(path: Path) -> dict:
    data = path.read_bytes()
    blob = subprocess.run(["git", "hash-object", str(path)], capture_output=True, text=True, check=True).stdout.strip()
    return {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(), "gitBlob": blob}


def assemble(list_id: str, alpha: list[dict], groups: list[dict], source: dict) -> dict:
    meta = META[list_id]
    notation = "fit1" if list_id == "goethe-a1-fit1" else "std"
    entries = [build_entry(e, notation) for e in alpha] + [build_entry(g, notation) for g in groups]
    counts = {
        "main": sum(1 for e in entries if e["kind"] == "main"),
        "sub": sum(1 for e in entries if e["kind"] == "sub"),
        "group": sum(1 for e in entries if e["kind"] == "group"),
    }
    return {
        "schemaVersion": SCHEMA_VERSION,
        "id": list_id,
        "level": meta["level"],
        "exam": meta["exam"],
        "title": meta["title"],
        "publisher": "Goethe-Institut",
        "officialUrl": meta["officialUrl"],
        "statedEntries": meta["statedEntries"],
        "source": source,
        "openCategories": OPEN_CATEGORIES.get(list_id, []),
        "counts": counts,
        "entries": entries,
    }


def dumps(doc: dict) -> str:
    """رأس مُنسَّق + مدخل واحد في كل سطر (فروق git مقروءة: سطر = كلمة رئيسية)"""
    head = json.dumps({k: v for k, v in doc.items() if k != "entries"}, ensure_ascii=False, indent=2)
    rows = ",\n".join("    " + json.dumps(e, ensure_ascii=False) for e in doc["entries"])
    return head[:-2] + ',\n  "entries": [\n' + rows + "\n  ]\n}\n"


def write_or_check(doc: dict, check: bool) -> bool:
    path = OUT_DIR / f"{doc['id']}.json"
    text = dumps(doc)
    if check:
        old = path.read_text(encoding="utf8") if path.exists() else ""
        ok = old == text
        print(f"{'✓' if ok else '✗'} {path.relative_to(ROOT)} {'مطابق' if ok else 'غير مطابق — أعد التشغيل بلا --check'}")
        return ok
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf8")
    c = doc["counts"]
    print(f"✓ {path.relative_to(ROOT)} — main {c['main']} · sub {c['sub']} · group {c['group']}")
    return True


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--sd1", type=Path, help="A1_SD1_Wortliste_02.pdf")
    ap.add_argument("--a2", type=Path, help="Goethe-Zertifikat_A2_Wortliste.pdf")
    ap.add_argument("--fit1", action="store_true", help="من النسخ المكتوب sources/goethe-a1-fit1-headwords.txt")
    ap.add_argument("--obtained-via", default="", help="يستبدل source.obtainedVia (إن وصل الملف بطريق آخر)")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--dump-raw", type=Path, help="يكتب المداخل الخام (تشخيص) بدل JSON")
    args = ap.parse_args()
    ok = True
    for list_id, pdf in (("goethe-a1-sd1", args.sd1), ("goethe-a2", args.a2)):
        if not pdf:
            continue
        alpha, page_texts, info = extract_pdf(list_id, pdf)
        if args.dump_raw:
            args.dump_raw.write_text("\n".join(f"{e['page']}\t{e['kind']}\t{e['headword']}" for e in alpha), encoding="utf8")
            print(f"raw → {args.dump_raw} ({len(alpha)})")
            continue
        problems = verify_groups(list_id, page_texts)
        if problems:
            print("\n".join(problems), file=sys.stderr)
            return 2
        groups = [{"headword": it, "page": pno, "kind": "group", "group": g}
                  for (g, pno, items) in GROUPS[list_id] for it in items]
        source = {"method": "pdf-extract", "file": META[list_id]["file"], **file_facts(pdf), **info,
                  "extractor": "tools/goethe-wordlist.py (pdfplumber 0.11.10)",
                  "obtainedVia": args.obtained_via or META[list_id]["obtainedVia"],
                  "verifiedAgainst": META[list_id]["verifiedAgainst"]}
        ok &= write_or_check(assemble(list_id, alpha, groups, source), args.check)
    if args.fit1:
        alpha, groups = read_fit1_transcript(FIT1_TRANSCRIPT)
        source = {"method": "manual-transcription", "file": META["goethe-a1-fit1"]["file"],
                  "transcript": str(FIT1_TRANSCRIPT.relative_to(ROOT)),
                  "transcriptSha256": hashlib.sha256(FIT1_TRANSCRIPT.read_bytes()).hexdigest(),
                  "pages": 23,
                  "extractor": "tools/goethe-wordlist.py (transcript parser)",
                  "obtainedVia": args.obtained_via or META["goethe-a1-fit1"]["obtainedVia"],
                  "verifiedAgainst": META["goethe-a1-fit1"]["verifiedAgainst"]}
        ok &= write_or_check(assemble("goethe-a1-fit1", alpha, groups, source), args.check)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
