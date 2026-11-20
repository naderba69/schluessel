#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""D568 (التوصية 3 من المراجعة الشاملة): بطاقات الثقافة A2/B1/B2 — كل وحدة ببطاقة واحدة.
المصدر الوحيد لهذا الملف — يولّد content/landeskunde/{a2,b1,b2}-landeskunde-u*.json
(بطاقتا b1-u3 وb1-u12 القديمتان تُعاد كتابتهما بأصل مُدقَّق). القواعد (N-023/D224):
حقائق تحت جبهة الوحدة (أفقها آخر درس) · المسرد حيّ (كلمات جديدة يتعلمها المتعلم هنا) ·
الأعلام مُعلنة ومستعملة. أداة التدقيق: npx tsx tools/dev/culture-audit.ts

Usage: python3 tools/dev/culture-cards.py [--dry-run]
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "content/landeskunde"
DRY = "--dry-run" in sys.argv
SRC = "حقائق ثقافية عامة مستقرة — التفاصيل الرسمية (الأسعار/التواريخ) تتغير فتحتاج needs-web-verify عند الإطلاق"

# id: (title_de, title_ar, facts[(de, ar)], glossary[(de, ar)], properNouns, sourceNote)
CARDS: dict[str, tuple] = {
    # ───────── A2 (14) ─────────
    "a2-landeskunde-u1": (
        "Frühstück und Morgen", "الإفطار والصباح",
        [
            ("Zum Frühstück essen viele Menschen Brot mit Käse.", "على الإفطار يأكل كثير من الناس خبزاً مع الجبن."),
            ("Am Morgen trinken viele Menschen Kaffee oder Tee.", "في الصباح يشرب كثير من الناس قهوة أو شاياً."),
            ("Am Abend ist das Essen oft einfach: Brot mit Käse oder Wurst.", "في المساء الطعام غالباً بسيط: خبز مع جبن أو سجق."),
        ],
        [("das Abendbrot", "الوجبة المسائية (خبز)"), ("der Sauerteig", "الخميرة الطبيعية للخبز")], [], SRC,
    ),
    "a2-landeskunde-u2": (
        "Arbeiten in Deutschland", "العمل في ألمانيا",
        [
            ("Man arbeitet oft fünf Tage: von Montag bis Freitag.", "يُعمل غالباً خمسة أيام: من الاثنين إلى الجمعة."),
            ("Der Feierabend kommt nach der Arbeit: am Abend bleibt man zu Hause.", "نهاية العمل بعد الدوام: في المساء يبقى المرء في البيت."),
            ("Im Büro sagt man oft «Sie» zum Chef und zu den Kollegen.", "في المكتب يُقال غالباً «Sie» للمدير والزملاء."),
        ],
        [("die Gleitzeit", "الوقت المرن للعمل")], [], SRC,
    ),
    "a2-landeskunde-u3": (
        "Vereine in Deutschland", "الأندية في ألمانيا",
        [
            ("Viele Menschen sind in einem Verein: Sport, Musik oder Feuerwehr.", "كثير من الناس في نادٍ: رياضة أو موسيقى أو إطفاء."),
            ("Am Wochenende haben die Menschen frei und besuchen Freunde.", "في نهاية الأسبوع يتوفر الناس ويزورون الأصدقاء."),
            ("Treffen im Verein sind oft am Abend.", "اللقاءات في النادي غالباً في المساء."),
        ],
        [("das Vereinsleben", "حياة النادي"), ("das Schützenfest", "مهرجان الرماية (تقليد)"), ("die Feuerwehr", "الإطفاء")], [], SRC,
    ),
    "a2-landeskunde-u4": (
        "Die Stadt", "المدينة",
        [
            ("In der Stadt gibt es ein Rathaus, eine Kirche und einen Markt.", "في المدينة يوجد مبنى البلدية وكنيسة وسوق."),
            ("Die Stadtbibliothek ist oft im Zentrum: dort kann man Bücher lesen.", "مكتبة المدينة غالباً في المركز: هناك تُقرأ الكتب."),
            ("Das Theater hat am Abend Vorstellungen.", "المسرح له عروض في المساء."),
        ],
        [("die Stadtbibliothek", "مكتبة المدينة"), ("der Bürgermeister", "عمدة المدينة"), ("die Vorstellung", "العرض (المسرحية)")], [], SRC,
    ),
    "a2-landeskunde-u5": (
        "Geburtstag feiern", "الاحتفال بعيد الميلاد",
        [
            ("Zum Geburtstag bringt man ein Geschenk mit.", "في عيد الميلاد يحضر المرء هدية."),
            ("Man gratuliert am Tag des Geburtstags — nicht früher!", "يُهنَّأ في يوم العيد — لا قبله! (عند البعض حظ سيء)"),
            ("Die Kerzen auf der Torte sind für einen Wunsch.", "الشموع على الكعكة لأمنية."),
        ],
        [("das Geburtstagskind", "طفل/صاحب العيد"), ("die Kerze", "الشمعة")], [], SRC,
    ),
    "a2-landeskunde-u6": (
        "Brot und Küche", "الخبز والمطبخ",
        [
            ("Deutschland ist bekannt für Brot: es gibt viele Sorten.", "ألمانيا مشهورة بالخبز: فيه أنواع كثيرة."),
            ("Zum Mittagessen gibt es oft eine warme Mahlzeit.", "في الغداء غالباً طعام ساخن."),
            ("Kartoffeln sind in vielen Gerichten.", "البطاطس في أطباق كثيرة."),
        ],
        [("der Sauerteig", "الخميرة الطبيعية للخبز"), ("die Kartoffelsuppe", "حساء البطاطس"), ("die Sorte", "النوع")], [], SRC,
    ),
    "a2-landeskunde-u7": (
        "Das Wetter", "الطقس",
        [
            ("Im Winter ist es kalt und oft schneit es.", "في الشتاء بارد وكثيراً يثلج."),
            ("Im Frühling wird es warm und alles wird grün.", "في الربيع يصبح دافئاً وكل شيء يصبح أخضر."),
            ("Die Menschen reden oft über das Wetter.", "الناس يتحدثون كثيراً عن الطقس."),
        ],
        [("die Wettervorhersage", "نشرة الطقس (التوقعات)"), ("die Frühlingsblume", "زهرة الربيع")], [], SRC,
    ),
    "a2-landeskunde-u8": (
        "Zeitung und Nachrichten", "الجريدة والأخبار",
        [
            ("Viele Menschen lesen morgens die Zeitung.", "كثير من الناس يقرؤون الجريدة صباحاً."),
            ("Es gibt Zeitungen für die Stadt und für das ganze Land.", "توجد جرائد للمدينة وللبلاد كلها."),
            ("Die Nachrichten gibt es auch im Internet und im Radio.", "الأخبار موجودة أيضاً على الإنترنت والراديو."),
        ],
        [("die Tageszeitung", "الجريدة اليومية"), ("die Schlagzeile", "العنوان الرئيسي")], [], SRC,
    ),
    "a2-landeskunde-u9": (
        "Mit der Bahn reisen", "السفر بالقطار",
        [
            ("Der ICE ist der schnelle Zug in Deutschland.", "الـICE هو القطار السريع في ألمانيا."),
            ("Am Bahnhof gibt es einen Fahrplan mit den Zeiten.", "في المحطة جدول مواعيد."),
            ("Das Ticket gibt es am Automaten oder online.", "التذكرة تُشترى من الجهاز أو عبر الإنترنت."),
        ],
        [("der Fernverkehr", "القطارات بين المدن"), ("der Fahrkartenautomat", "جهاز بيع التذاكر")], [], SRC,
    ),
    "a2-landeskunde-u10": (
        "Amt und Polizei", "المصلحة والشرطة",
        [
            ("Für neue Papiere geht man zum Amt.", "لأوراق جديدة يُذهب إلى المصلحة."),
            ("Die Polizei hilft in Gefahr: die Nummer ist 110.", "الشرطة تساعد في الخطر: الرقم 110."),
            ("Viele Formulare gibt es auch online.", "نماذج كثيرة موجودة أيضاً على الإنترنت."),
        ],
        [("das Bürgeramt", "مصلحة المواطنين"), ("die Wartenummer", "رقم الانتظار"), ("das Amt", "المصلحة (الإدارة)")], [], SRC,
    ),
    "a2-landeskunde-u11": (
        "Einen Beruf lernen", "تعلّم مهنة",
        [
            ("Junge Menschen lernen einen Beruf: im Betrieb und in der Berufsschule.", "الشباب يتعلمون مهنة: في المؤسسة ومدرسة المهنة."),
            ("Es gibt viele Berufe: Koch, Mechaniker oder Verkäufer.", "مهن كثيرة: طباخ أو ميكانيكي أو بائع."),
            ("Nach der Ausbildung arbeitet man oft im Betrieb.", "بعد التدريب يُعمل غالباً في المؤسسة."),
        ],
        [("der Ausbildungsbetrieb", "مؤسسة التدريب المهني"), ("die Lehrwerkstatt", "ورشة التدريب"), ("der Betrieb", "المؤسسة (مكان العمل)"), ("die Berufsschule", "مدرسة المهنة")], [], SRC,
    ),
    "a2-landeskunde-u12": (
        "Noten und Zeugnis", "الدرجات والشهادة",
        [
            ("Die Note eins ist sehr gut und die Note sechs ist nicht gut.", "الدرجة 1 ممتازة والدرجة 6 ليست جيدة."),
            ("Nach der Prüfung gibt es ein Zeugnis mit den Noten.", "بعد الامتحان توجد شهادة بالدرجات."),
            ("In der Schule gibt es viele Fächer: Mathematik, Deutsch und mehr.", "في المدرسة مواد كثيرة: رياضيات وألمانية وغيرها."),
        ],
        [("das Notensystem", "نظام الدرجات"), ("die Klassenarbeit", "الاختبار الصفّي")], [], SRC,
    ),
    "a2-landeskunde-u13": (
        "Urlaub und Feiertage", "العطل والأعياد",
        [
            ("Die Arbeiter haben im Jahr Urlaub: mindestens vier Wochen.", "العاملون لهم عطلة سنوية: أربعة أسابيع على الأقل (قانوني)."),
            ("Viele fahren im Sommer in den Urlaub: an See oder ins Ausland.", "كثيرون يسافرون في الصيف: إلى البحر أو الخارج."),
            ("An Feiertagen haben die Menschen frei: Weihnachten, Ostern und mehr.", "في الأعياد الناس أحرار: عيد الميلاد والفصح وغيرها."),
        ],
        [("der Urlaubsanspruch", "الحق في العطلة (قانوني)"), ("das Reiseziel", "وجهة السفر")], [], SRC,
    ),
    "a2-landeskunde-u14": (
        "Deutschland und seine Länder", "ألمانيا ولاياتها",
        [
            ("Deutschland hat sechzehn Bundesländer.", "ألمانيا لها ست عشرة ولاية."),
            ("Die Hauptstadt ist Berlin.", "العاصمة هي برلين."),
            ("Die größte Stadt ist Berlin: dann kommen Hamburg, München und Köln.", "أكبر مدينة برلين: ثم هامبورغ وميونخ وكولونيا."),
        ],
        [("die Bundesländer", "الولايات (الاتحادية)"), ("die Landeshauptstadt", "عاصمة الولاية"), ("der Bundeskanzler", "المستشار الاتحادي")],
        ["Berlin", "Hamburg", "München", "Köln"], SRC,
    ),
    # ───────── B1 (12 — u3 وu12 أُعيدت كتابتهما هنا) ─────────
    "b1-landeskunde-u1": (
        "Bus und Bahn in der Stadt", "الحافلة والقطار في المدينة",
        [
            ("In der Stadt fahren Bus, U-Bahn und S-Bahn.", "في المدينة تسير الحافلة والمترو وقطار المدينة."),
            ("Ein Ticket ist für alle Verkehrsmittel zusammen.", "التذكرة الواحدة لكل وسائل المواصلات معاً."),
            ("Wenn ein Zug ausfällt, gibt es eine Information am Gleis oder online.", "عند إلغاء قطار توجد معلومات على الرصيف أو عبر الإنترنت."),
        ],
        [("die Fahrgastinformation", "معلومات المسافرين"), ("der Schienenersatzverkehr", "نقل بديل عن القطار"), ("die Monatskarte", "بطاقة الشهر")], [], SRC,
    ),
    "b1-landeskunde-u2": (
        "Eine Wohnung mieten", "استئجار شقة",
        [
            ("Für eine Wohnung zahlt man eine Kaution: bis zu drei Mieten.", "لشقة يُدفع عربون: حتى ثلاث إيجارات (قانوني)."),
            ("Der Vertrag ist schriftlich und steht auf Deutsch.", "العقد مكتوب وبالألمانية."),
            ("Die Miete zahlt man jeden Monat: oft am ersten Tag.", "الإيجار يُدفع كل شهر: غالباً في اليوم الأول."),
        ],
        [("die Kaution", "العربون"), ("der Mietvertrag", "عقد الإيجار"), ("die Nebenkosten", "المصاريف الإضافية")], [], SRC,
    ),
    "b1-landeskunde-u3": (
        "Die Krankenkasse in Deutschland", "التأمين الصحي في ألمانيا",
        [
            ("In Deutschland ist die Krankenkasse Pflicht: alle Menschen müssen versichert sein.", "في ألمانيا التأمين الصحي إلزامي: على الجميع التأمين."),
            ("Den Beitrag zahlt man jeden Monat: er kommt vom Einkommen.", "الاشتراك يُدفع شهرياً: يأتي من الدخل."),
            ("Die Kasse bezahlt die Medizin und den Arzt.", "الصندوق يدفع الدواء والطبيب."),
            ("Man wählt eine Kasse: die Wahl ist frei.", "يُختار صندوقاً: الاختيار حر."),
        ],
        [("die Krankenversicherung", "التأمين الصحي"), ("die Versicherungspflicht", "إلزام التأمين")], [], SRC,
    ),
    "b1-landeskunde-u4": (
        "Studieren in Deutschland", "الدراسة الجامعية في ألمانيا",
        [
            ("Nach dem Abitur kann man an einer Universität studieren.", "بعد البكالوريا يمكن الدراسة في جامعة."),
            ("Ein Studium dauert oft drei oder vier Jahre.", "الدراسة الجامعية غالباً ثلاث أو أربع سنوات."),
            ("Die Abschlüsse heißen Bachelor und Master.", "الشهادات تُسمى بكالوريوس وماجستير."),
        ],
        [("die Fachhochschule", "الجامعة التطبيقية"), ("der Studiengang", "المسار الدراسي")],
        ["Bachelor", "Master"], SRC,
    ),
    "b1-landeskunde-u5": (
        "Nachrichten und Quellen", "الأخبار ومصادرها",
        [
            ("Die Tagesschau im Fernsehen zeigt jeden Abend die Nachrichten.", "نشرة الأخبار بالتلفاز كل مساء."),
            ("Die Nachrichten gibt es auch im Radio und im Internet.", "الأخبار موجودة في الراديو والإنترنت أيضاً."),
            ("Wichtig ist immer die Quelle: wer schreibt die Nachricht?", "المصدر مهم دائماً: من يكتب الخبر؟"),
        ],
        [("die Nachrichtensendung", "نشرة الأخبار"), ("die Pressefreiheit", "حرية الصحافة")],
        ["Tagesschau"], SRC,
    ),
    "b1-landeskunde-u6": (
        "Wandern und Berge", "المشي والجبال",
        [
            ("Im Süden von Deutschland sind die Alpen.", "في جنوب ألمانيا جبال الألب."),
            ("Ein Ausflug ins Tal ist schön für die ganze Familie.", "نزهة إلى الوادي جميلة للعائلة كلها."),
            ("Es gibt viele Wege: sie haben Farben an den Bäumen.", "طرق كثيرة: لها ألوان على الأشجار."),
        ],
        [("die Bergwanderung", "المشي الجبلي"), ("die Bergbahn", "القطار الجبلي")],
        ["Alpen"], SRC,
    ),
    "b1-landeskunde-u7": (
        "Müll trennen", "فرز النفايات",
        [
            ("In Deutschland trennt man den Müll: Papier, Glas und Plastik.", "في ألمانيا تُفرز النفايات: ورق وزجاج وبلاستيك."),
            ("Der Gelbe Sack ist für die Verpackung.", "الكيس الأصفر للعبوات."),
            ("Biomüll kommt in die braune Tonne.", "النفايات العضوية في الحاوية البنية."),
        ],
        [("der Biomüll", "النفايات العضوية"), ("die Mülltonne", "حاوية القمامة"), ("die Tonne", "الحاوية"), ("der Wertstoffhof", "مركز المواد القابلة للتدوير")], [], SRC,
    ),
    "b1-landeskunde-u8": (
        "Eine Lehrstelle finden", "العثور على مكان تدريب",
        [
            ("Eine Lehrstelle findet man im Betrieb: dort lernt man die Arbeit.", "مكان التدريب في المؤسسة: هناك تُتعلّم المهنة."),
            ("Die Bewerbung hat einen Lebenslauf und ein Anschreiben.", "ملف الترشيح فيه سيرة ذاتية ورسالة تعريفية."),
            ("Im Betrieb und in der Schule lernt man beides: Arbeit und Wissen.", "في المؤسسة والمدرسة يُتعلّم الاثنان: العمل والمعرفة."),
        ],
        [("das Bewerbungsgespräch", "مقابلة التوظيف"), ("der Ausbildungsvertrag", "عقد التدريب"), ("das Anschreiben", "رسالة الترشيح")], [], SRC,
    ),
    "b1-landeskunde-u9": (
        "Direkt sprechen", "التواصل المباشر",
        [
            ("Deutsche sprechen oft direkt.", "الألمان يتحدثون غالباً بوضوح."),
            ("Man sagt «Sie» — bis der andere «du» anbietet.", "يُقال «Sie» — حتى يعرض الطرف الآخر «du»."),
            ("Nachfragen ist wichtig: «Können Sie das wiederholen?»", "الاستفسار مهم: «هل يمكنكم التكرار؟»"),
        ],
        [("die Gesprächskultur", "ثقافة الحوار")], [], SRC,
    ),
    "b1-landeskunde-u10": (
        "Steuern", "الضرائب",
        [
            ("Vom Lohn geht jeden Monat die Steuer ab.", "من الأجر تُخصم الضرائب شهرياً."),
            ("Im Frühling macht man oft die Steuererklärung.", "في الربيع غالباً يُملأ إقرار الضريبة."),
            ("Manchmal bekommt man Geld zurück.", "أحياناً يُستردّ مبلغ."),
        ],
        [("die Steuererklärung", "إقرار الضريبة"), ("die Lohnsteuer", "ضريبة الأجر"), ("der Steuerbescheid", "قرار الضريبة")], [], SRC,
    ),
    "b1-landeskunde-u11": (
        "Die Bibliothek", "المكتبة",
        [
            ("In der Bibliothek kann man Bücher ausleihen und wieder zurückgeben.", "في المكتبة تُستعار الكتب وتُعاد."),
            ("Der Ausweis für die Bibliothek ist oft kostenlos.", "بطاقة المكتبة غالباً مجانية."),
            ("Es gibt auch Hörbücher und Bücher für das Internet.", "توجد كتب مسموعة وكتب للإنترنت أيضاً."),
        ],
        [("die Bücherei", "المكتبة (العامة)"), ("der Lesesaal", "قاعة القراءة"), ("das Hörbuch", "الكتاب المسموع")], [], SRC,
    ),
    "b1-landeskunde-u12": (
        "Die Prüfung B1: Goethe-Institut und ÖSD", "امتحان B1: معهد غوته والنمساوي",
        [
            ("Das Goethe-Institut hat Prüfungen für das Niveau B1.", "معهد غوته له امتحانات للمستوى B1."),
            ("ÖSD hat auch Prüfungen für B1: der Nachweis ist offiziell.", "للشهادة النمساوية امتحانات أيضاً: الإثبات رسمي."),
            ("Die Anerkennung ist wichtig und international.", "الاعتراف مهم ودولي."),
            ("Die Noten zeigen das Niveau: die Prüfung hat eine Note.", "الدرجات تبيّن المستوى: للامتحان درجة."),
        ],
        [("die Zulassung", "القبول (الترشيح)"), ("das Sprachdiplom", "دبلوم اللغة"), ("die Prüfungsordnung", "نظام الامتحان")],
        ["Goethe-Institut", "ÖSD"], SRC,
    ),
    "b1-landeskunde-u13": (
        "Der Arbeitsvertrag", "عقد العمل",
        [
            ("Der Arbeitsvertrag ist schriftlich.", "عقد العمل مكتوب."),
            ("Der Urlaub im Jahr ist mindestens vier Wochen.", "العطلة السنوية أربعة أسابيع على الأقل (قانوني)."),
            ("Wenn man krank ist, bleibt man zu Hause und ruft an.", "عند المرض يُبقى في البيت ويُتصل."),
        ],
        [("der Arbeitsvertrag", "عقد العمل"), ("die Kündigungsfrist", "مهلة الإنهاء"), ("der Urlaubsanspruch", "الحق في العطلة")], [], SRC,
    ),
    "b1-landeskunde-u14": (
        "Das Niveau der Sprache: A1 bis C2", "مستوى اللغة: من A1 إلى C2",
        [
            ("Die Niveaus sind sechs: A1, A2, B1, B2, C1 und C2.", "المستويات ستة."),
            ("Mit B2 kann man viel sprechen und verstehen.", "بـB2 يمكن التحدث والفهم كثيراً."),
            ("Jedes Niveau hat Prüfungen beim Goethe-Institut oder bei ÖSD.", "لكل مستوى امتحانات عند معهد غوته أو الشهادة النمساوية."),
        ],
        [("das Sprachzertifikat", "شهادة اللغة"), ("die Prüfungsstufe", "مرحلة الامتحان")],
        ["Goethe-Institut", "ÖSD"], SRC,
    ),
    # ───────── B2 (6) ─────────
    "b2-landeskunde-u1": (
        "Ehrenamt und Toleranz", "العمل التطوعي والتسامح",
        [
            ("Viele Menschen engagieren sich freiwillig: in Vereinen, Schulen oder bei der Feuerwehr.", "كثير من الناس يعملون تطوعياً: في الجمعيات والمدارس والإطفاء."),
            ("Toleranz bedeutet: Jeder darf anders denken und leben.", "التسامح يعني: لكل أن يفكر ويعيش بشكل مختلف."),
            ("In Deutschland leben Menschen aus vielen Ländern: viele Sprachen zusammen.", "في ألمانيا يعيش ناس من بلدان كثيرة: لغات عديدة معاً."),
        ],
        [("die Freiwilligenarbeit", "العمل التطوعي"), ("der Integrationskurs", "دورة الاندماج")], [], SRC,
    ),
    "b2-landeskunde-u2": (
        "Umwelt und Nachhaltigkeit", "البيئة والاستدامة",
        [
            ("Recycling ist wichtig: Glas und Papier kommen an verschiedene Stellen.", "إعادة التدوير مهمة: الزجاج والورق إلى أماكن مختلفة."),
            ("Die Energiewende bedeutet: mehr Wind und Sonne.", "تحوّل الطاقة يعني: رياح وشمس أكثر."),
            ("Viele fahren mit dem Rad: für die Umwelt und für die Gesundheit.", "كثيرون يركبون الدراجة: للبيئة والصحة."),
        ],
        [("das Recycling", "إعادة التدوير"), ("die Windenergie", "طاقة الرياح"), ("die Energiewende", "تحوّل الطاقة")], [], SRC,
    ),
    "b2-landeskunde-u3": (
        "Bildung und Digitalisierung", "التعليم والرقمنة",
        [
            ("Die Schule ist Sache der Länder: jedes Land entscheidet selbst.", "التعليم مسؤولية الولايات: كل ولاية تقرر بنفسها."),
            ("An den Hochschulen gibt es die Abschlüsse Bachelor und Master.", "في الجامعات شهادتا البكالوريوس والماجستير."),
            ("Digitalisierung: Tablets und Internet werden im Unterricht wichtig.", "الرقمنة: الأجهزة والإنترنت يصبحان مهمَّين في الدرس."),
        ],
        [("das Studienfach", "التخصص الدراسي"), ("der Bildungsweg", "المسار التعليمي")],
        ["Bachelor", "Master"], SRC,
    ),
    "b2-landeskunde-u4": (
        "Medien und Rundfunk", "الإعلام والإذاعة",
        [
            ("ARD und ZDF zeigen Nachrichten und Filme: dafür zahlt jeder Haushalt jeden Monat.", "ARD وZDF يعرضان الأخبار والأفلام: لذلك يدفع كل بيت شهرياً."),
            ("Private Sender leben von der Werbung.", "القنوات الخاصة تعيش من الإعلانات."),
            ("Die Tagesschau läuft seit mehr als siebzig Jahren.", "نشرة الأخبار تبث منذ أكثر من سبعين سنة."),
        ],
        [("der Rundfunk", "الإذاعة (البث)"), ("der Rundfunkbeitrag", "رسم البث"), ("der Privatsender", "القناة الخاصة")],
        ["ARD", "ZDF", "Tagesschau"], SRC,
    ),
    "b2-landeskunde-u5": (
        "Wirtschaft und Markt", "الاقتصاد والسوق",
        [
            ("Die Wirtschaft in Deutschland ist eine soziale Marktwirtschaft.", "الاقتصاد في ألمانيا سوق اجتماعي."),
            ("Kleine Firmen sind wichtig: zusammen heißen sie Mittelstand.", "الشركات الصغيرة مهمة: معاً تُسمى القطاع المتوسط."),
            ("Der Export ist ein großer Teil der Wirtschaft.", "التصدير جزء كبير من الاقتصاد."),
        ],
        [("die Marktwirtschaft", "السوق الاقتصادي"), ("der Mittelstand", "القطاع الاقتصادي المتوسط"), ("der Export", "التصدير")], [], SRC,
    ),
    "b2-landeskunde-u6": (
        "Gesundheit und Vorsorge", "الصحة والوقاية",
        [
            ("Die Vorsorge hilft: Untersuchungen finden Probleme früh.", "الوقاية تساعد: الفحوصات تكتشف المشاكل مبكراً."),
            ("In der Apotheke gibt es Medikamente — manche nur mit Rezept.", "في الصيدلية أدوية — بعضها بوصفة فقط."),
            ("Beim Arzt braucht man die Versichertenkarte.", "عند الطبيب تُلزم بطاقة التأمين."),
        ],
        [("die Vorsorgeuntersuchung", "فحص الوقاية"), ("der Gesundheitscheck", "فحص الصحة")], [], SRC,
    ),
}


def main() -> int:
    written = 0
    for cid, (tde, tar, facts, gloss, props, note) in CARDS.items():
        level = cid.split("-")[0].upper()
        unit = int(cid.rsplit("-u", 1)[1])
        card = {
            "schemaVersion": "1.0.0",
            "id": cid,
            "level": level,
            "unit": unit,
            **({"properNouns": props} if props else {}),
            "title": {"de": tde, "ar": tar},
            "facts": [{"de": d, "ar": a} for d, a in facts],
            "glossary": [{"de": d, "ar": a} for d, a in gloss],
            "sourceNote": note,
        }
        if not DRY:
            with open(OUT / f"{cid}.json", "w", encoding="utf-8") as fh:
                json.dump(card, fh, ensure_ascii=False, indent=2)
                fh.write("\n")
        written += 1
    print(f"{'DRY ' if DRY else ''}كُتبت {written} بطاقة في {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
