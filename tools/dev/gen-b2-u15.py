# -*- coding: utf-8 -*-
"""D596 · بناء b2-u15 «الطريق بعد الامتحان: التثبيت والاستمرار» (الدستور §3-ج: B2 = 12 وحدة + 3 أسابيع تكثيف/امتحان!) — 6 دروس × 3 كلمات.
الأسبوع الثالث الأخير من أسابيع التكثيف/الامتحان الثلاثة (N-374! u13 = التكثيف D594! u14 = اليوم الحاسم D595! — تكتمل الثلاثة!).
يكتب: كلمات + حوارات (audio-scripts) + دروس + قصة + خطة الترقية + usedInLessons.
الصوت: كلمات (build_audio — الجديد فقط «القديم لم يُمس» D251/D578!) ثم node_modules/.bin/tsx tools/dialogue-splitter.ts --all (تدريجي!).
درس N-384/N-385: لا sed أعمى · تصادم case-insensitive · phoneticRisks فارغة ثم auditRisks({apply:true}) · أفعال المفردات الثابتة = مدروسة فقط (front!)."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
W = ROOT / "content/words"
LESSONS = ROOT / "content/lessons/b2"
SCRIPTS = ROOT / "content/audio-scripts"
UPGRADES = ROOT / "content/upgrades/b2-lesson-upgrade.json"
STORY = ROOT / "content/story/b2.json"

# ── الكلمات الثمانية عشر (3/يوم) — الطريق بعد الامتحان: التثبيت والاستمرار ──────
WORDS = {
    "festigung": dict(de="die Festigung", article="die", gender="die", plural="die Festigungen",
        pluralRuleNote="اسم مؤنث على -ung (die! -ung مؤنثة دائماً!) جمعه -en: die Festigungen.",
        ar=["التثبيت"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["festigen"], kollocation=("Festigung zeigen", "يُظهر تثبيتاً", "zeigen"),
        sample=("Die Festigung ist wichtig.", "التثبيت مهم.")),
    "bestaendigkeit": dict(de="die Beständigkeit", article="die", gender="die", plural="-",
        pluralRuleNote="اسم مؤنث على -keit (die!) تُستعمل عادةً بلا جمع: die Beständigkeit.",
        ar=["الاستمرارية (الثبات)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["bestaendig"], kollocation=("Beständigkeit zeigen", "يُظهر استمرارية", "zeigen"),
        sample=("Die Beständigkeit hilft.", "الاستمرارية تساعد.")),
    "kontinuitaet": dict(de="die Kontinuität", article="die", gender="die", plural="-",
        pluralRuleNote="اسم مؤنث على -ität (die!) تُستعمل عادةً بلا جمع: die Kontinuität.",
        ar=["الاستمرارية المتّصلة"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["kontinuierlich"], kollocation=("Kontinuität haben", "يملك استمرارية متّصلة", "haben"),
        sample=("Die Kontinuität ist stark.", "الاستمرارية المتّصلة قوية.")),
    "eifer": dict(de="der Eifer", article="der", gender="der", plural="-",
        pluralRuleNote="اسم مذكّر (der! Eifer) تُستعمل عادةً بلا جمع: der Eifer.",
        ar=["الجدّ (الحماس)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["eifrig"], kollocation=("Eifer zeigen", "يُظهر جدّاً", "zeigen"),
        sample=("Der Eifer ist groß.", "الجدّ كبير.")),
    "entschlossenheit": dict(de="die Entschlossenheit", article="die", gender="die", plural="-",
        pluralRuleNote="اسم مؤنث على -heit (die!) تُستعمل عادةً بلا جمع: die Entschlossenheit.",
        ar=["العزيمة"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["entschlossen"], kollocation=("Entschlossenheit haben", "يملك عزيمة", "haben"),
        sample=("Die Entschlossenheit ist stark.", "العزيمة قوية.")),
    "hartnaeckigkeit": dict(de="die Hartnäckigkeit", article="die", gender="die", plural="-",
        pluralRuleNote="اسم مؤنث على -keit (die!) تُستعمل عادةً بلا جمع: die Hartnäckigkeit.",
        ar=["المثابرة"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["hartnaeckig"], kollocation=("Hartnäckigkeit zeigen", "يُظهر مثابرة", "zeigen"),
        sample=("Die Hartnäckigkeit ist wichtig.", "المثابرة مهمة.")),
    "wirksamkeit": dict(de="die Wirksamkeit", article="die", gender="die", plural="-",
        pluralRuleNote="اسم مؤنث على -keit (die!) تُستعمل عادةً بلا جمع: die Wirksamkeit.",
        ar=["الفعالية"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["wirksam"], kollocation=("Wirksamkeit zeigen", "يُظهر فعالية", "zeigen"),
        sample=("Die Wirksamkeit ist klar.", "الفعالية واضحة.")),
    "effizienz": dict(de="die Effizienz", article="die", gender="die", plural="-",
        pluralRuleNote="اسم مؤنث (die! Effizienz) تُستعمل عادةً بلا جمع: die Effizienz.",
        ar=["الكفاءة (الفعالية الاقتصادية)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["effizient"], kollocation=("mit Effizienz arbeiten", "يعمل بكفاءة", "arbeiten"),
        sample=("Die Effizienz ist wichtig.", "الكفاءة مهمة.")),
    "verbesserung": dict(de="die Verbesserung", article="die", gender="die", plural="die Verbesserungen",
        pluralRuleNote="اسم مؤنث على -ung (die! -ung مؤنثة دائماً!) جمعه -en: die Verbesserungen.",
        ar=["التحسين"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["verbessern"], kollocation=("eine Verbesserung machen", "يجري تحسيناً", "machen"),
        sample=("Die Verbesserung ist gut.", "التحسين جيد.")),
    "aufbruch": dict(de="der Aufbruch", article="der", gender="der", plural="die Aufbrüche",
        pluralRuleNote="مركّب مذكّر (der! Auf+Bruch) جمعه مع umlaut: die Aufbrüche.",
        ar=["الانطلاق"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["aufbrechen"], kollocation=("den Aufbruch machen", "يبدأ الانطلاق", "machen"),
        sample=("Der Aufbruch ist bald.", "الانطلاق قريب.")),
    "wendepunkt": dict(de="der Wendepunkt", article="der", gender="der", plural="die Wendepunkte",
        pluralRuleNote="مركّب مذكّر (der! Wende+Punkt) جمعه die Wendepunkte.",
        ar=["نقطة التحوّل"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["wenden", "punkt"], kollocation=("ein Wendepunkt sein", "يكون نقطة تحوّل", "sein"),
        sample=("Der Wendepunkt ist wichtig.", "نقطة التحوّل مهمة.")),
    "meilenstein": dict(de="der Meilenstein", article="der", gender="der", plural="die Meilensteine",
        pluralRuleNote="مركّب مذكّر (der! Meilen+Stein) جمعه die Meilensteine.",
        ar=["المعلّم على الطريق (الإطار التأريخي)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["meile", "stein"], kollocation=("ein Meilenstein sein", "يكون معلّماً على الطريق", "sein"),
        sample=("Der Meilenstein ist wichtig.", "المعلّم على الطريق مهم.")),
    "wuerdigung": dict(de="die Würdigung", article="die", gender="die", plural="die Würdigungen",
        pluralRuleNote="اسم مؤنث على -ung (die! -ung مؤنثة دائماً!) جمعه -en: die Würdigungen.",
        ar=["التقدير"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["wuerdigen"], kollocation=("Würdigung bekommen", "يتلقّى تقديرًا", "bekommen"),
        sample=("Die Würdigung ist wichtig.", "التقدير مهم.")),
    "zeremonie": dict(de="die Zeremonie", article="die", gender="die", plural="die Zeremonien",
        pluralRuleNote="اسم مؤنث على -ie (die!) جمعه -n: die Zeremonien.",
        ar=["المراسم"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=[], kollocation=("eine Zeremonie machen", "يجري مراسم", "machen"),
        sample=("Die Zeremonie ist schön.", "المراسم جميلة.")),
    "ansporn": dict(de="der Ansporn", article="der", gender="der", plural="-",
        pluralRuleNote="مركّب مذكّر (der! An+Sporn) تُستعمل عادةً بلا جمع: der Ansporn.",
        ar=["الحافز"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["sporn"], kollocation=("Ansporn geben", "يعطي حافزاً", "geben"),
        sample=("Der Ansporn ist gut.", "الحافز جيد.")),
    "vorfreude": dict(de="die Vorfreude", article="die", gender="die", plural="-",
        pluralRuleNote="مركّبة مؤنثة (die! Vor+Freude على -e) تُستعمل عادةً بلا جمع: die Vorfreude.",
        ar=["الفرحة المتوقّعة"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["freude"], kollocation=("Vorfreude haben", "يملك فرحة متوقّعة", "haben"),
        sample=("Die Vorfreude ist groß.", "الفرحة المتوقّعة كبيرة.")),
    "selbststaendigkeit": dict(de="die Selbstständigkeit", article="die", gender="die", plural="-",
        pluralRuleNote="اسم مؤنث على -keit (die!) تُستعمل عادةً بلا جمع: die Selbstständigkeit.",
        ar=["الاستقلالية"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["selbststaendig"], kollocation=("Selbstständigkeit zeigen", "يُظهر استقلالية", "zeigen"),
        sample=("Die Selbstständigkeit ist wichtig.", "الاستقلالية مهمة.")),
    "lebensfreude": dict(de="die Lebensfreude", article="die", gender="die", plural="die Lebensfreuden",
        pluralRuleNote="مركّبة مؤنثة (die! Lebens+Freude على -e) جمعها die Lebensfreuden.",
        ar=["فرح الحياة (البهجة)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["leben", "freude"], kollocation=("Lebensfreude haben", "يملك فرح الحياة", "haben"),
        sample=("Die Lebensfreude ist groß.", "فرح الحياة كبير.")),
}

DAYS = {
    "b2-u15-d1": dict(inter=["wartezeit", "aufsicht", "pruefungsraum"], words=["festigung", "bestaendigkeit", "kontinuitaet"],
        slug="die-festigung", title_de="Die Festigung", title_ar="التثبيت",
        line1=("mueller", "Die Festigung ist der Anfang: mit Beständigkeit und Kontinuität bleibt alles!", "يوم التثبيت"),
        lines_rest=[
            ("yusuf", "Was ist die Festigung?", "استفسار"),
            ("mueller", "Die Festigung macht das Gelernte stark.", "تعريف"),
            ("yusuf", "Und die Beständigkeit?", "استفسار"),
            ("mueller", "Die Beständigkeit heißt: jeden Tag ein wenig.", "تفسير"),
            ("yusuf", "Und die Kontinuität?", "استفسار"),
            ("mueller", "Die Kontinuität verbindet die Tage.", "مبدأ"),
            ("yusuf", "Gut. Ich bleibe dran.", "إغلاق")],
        ziel_ar="اليوم الأول: التثبيت والاستمرارية والمتانة!",
        canDo=["يصف عملية التثبيت! (die Festigung!)", "يصف الاستمرارية! (die Beständigkeit! die Kontinuität!)"],
        warmup=["wartezeit", "aufsicht"],
        pretest=[("«التثبيت مهم.»؟", "festigung"), ("«الاستمرارية تساعد.»؟", "bestaendigkeit")],
        task_goal_de="Festigung, Beständigkeit, Kontinuität: Wir üben weiter!",
        task_goal_ar="اليوم الأول من الوحدة 15! (التثبيت! الاستمرارية! المتانة!)",
        task_sit_de="Festigung, Beständigkeit, Kontinuität — zusammen üben.",
        task_sit_ar="تثبيت! استمرارية! متانة! — نثبّت معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Festigung (die! -ung!) وdie Beständigkeit (die! على -keit!) وdie Kontinuität (die! اسم مؤنث!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: Festigung zeigen! Kontinuität haben!"],
        gap_extra=[("Die ___ ist lang.", "Wartezeit"), ("Die ___ ist streng.", "Aufsicht"), ("Der ___ ist groß.", "Prüfungsraum")],
        hunt_extra=[("~~der Festigung ist wichtig.~~", "Die Festigung ist wichtig.", "die Festigung (die! -ung!) لا der Festigung!"),
            ("~~das Beständigkeit hilft.~~", "Die Beständigkeit hilft.", "die Beständigkeit (die! على -keit!) لا das Beständigkeit!")],
        speak_extra=["wartezeit", "aufsicht", "pruefungsraum"],
        warn=[("der Festigung!", "~~der Festigung ist wichtig.~~", "die Festigung!", "Die Festigung ist wichtig.", "___ Festigung ist wichtig.", "die",
               "العربية: «التثبيت» مذكّر! والألمانية: die Festigung (die! -ung مؤنثة دائماً!) (خريطة التداخل 10-ي!)"),
              ("das Beständigkeit!", "~~das Beständigkeit hilft.~~", "die Beständigkeit!", "Die Beständigkeit hilft.", "___ Beständigkeit hilft.", "die",
               "الألمانية: die Beständigkeit (die! على -keit!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
              ("der Kontinuität!", "~~der Kontinuität ist stark.~~", "die Kontinuität!", "Die Kontinuität ist stark.", "___ Kontinuität ist stark.", "die",
               "الألمانية: die Kontinuität (die! اسم مؤنث!) — لا der أبداً! (خريطة التداخل 10-ي!)")]),
    "b2-u15-d2": dict(inter=["anweisung", "nervositaet", "sammlung"], words=["eifer", "entschlossenheit", "hartnaeckigkeit"],
        slug="der-eifer", title_de="Der Eifer", title_ar="الجدّ",
        line1=("lena", "Der Eifer am Morgen: mit Entschlossenheit und Hartnäckigkeit geht alles!", "يوم الجدّ"),
        lines_rest=[
            ("yusuf", "Was ist der Eifer?", "استفسار"),
            ("lena", "Der Eifer ist die Freude am Arbeiten.", "تعريف"),
            ("yusuf", "Und die Entschlossenheit?", "استفسار"),
            ("lena", "Die Entschlossenheit gibt Kraft.", "تفسير"),
            ("yusuf", "Und die Hartnäckigkeit?", "استفسار"),
            ("lena", "Die Hartnäckigkeit hält lange an.", "مبدأ"),
            ("yusuf", "Gut. Ich arbeite weiter.", "إغلاق")],
        ziel_ar="اليوم الثاني: الجدّ والعزيمة والمثابرة!",
        canDo=["يصف الجدّ في العمل! (der Eifer!)", "يصف العزيمة والمثابرة! (die Entschlossenheit! die Hartnäckigkeit!)"],
        warmup=["anweisung", "nervositaet"],
        pretest=[("«الجدّ كبير.»؟", "eifer"), ("«المثابرة مهمة.»؟", "hartnaeckigkeit")],
        task_goal_de="Eifer, Entschlossenheit, Hartnäckigkeit: Wir arbeiten mit Eifer!",
        task_goal_ar="اليوم الثاني من الوحدة 15! (الجدّ! العزيمة! المثابرة!)",
        task_sit_de="Eifer, Entschlossenheit, Hartnäckigkeit — zusammen arbeiten.",
        task_sit_ar="جدّ! عزيمة! مثابرة! — نعمل معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "der Eifer (der! اسم مذكّر!) وdie Entschlossenheit (die! على -heit!) وdie Hartnäckigkeit (die! على -keit!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: Eifer zeigen! Entschlossenheit haben!"],
        gap_extra=[("Die ___ ist klar.", "Anweisung"), ("Die ___ ist groß.", "Nervosität"), ("Die ___ hilft.", "Sammlung")],
        hunt_extra=[("~~der Eifer ist groß.~~", "Der Eifer ist groß.", "der Eifer (der! مذكّر!) — الكبيرة بداية الجملة!"),
            ("~~das Entschlossenheit ist stark.~~", "Die Entschlossenheit ist stark.", "die Entschlossenheit (die! على -heit!) لا das Entschlossenheit!")],
        speak_extra=["anweisung", "nervositaet", "sammlung"],
        warn=[("die Eifer!", "~~die Eifer ist groß.~~", "der Eifer!", "Der Eifer ist groß.", "___ Eifer ist groß.", "der",
               "العربية: «الجدّ» مؤنث! والألمانية: der Eifer (der! مذكّر!) (خريطة التداخل 10-ي!)"),
              ("das Entschlossenheit!", "~~das Entschlossenheit ist stark.~~", "die Entschlossenheit!", "Die Entschlossenheit ist stark.", "___ Entschlossenheit ist stark.", "die",
               "الألمانية: die Entschlossenheit (die! على -heit!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
              ("der Hartnäckigkeit!", "~~der Hartnäckigkeit ist wichtig.~~", "die Hartnäckigkeit!", "Die Hartnäckigkeit ist wichtig.", "___ Hartnäckigkeit ist wichtig.", "die",
               "الألمانية: die Hartnäckigkeit (die! على -keit!) — لا der أبداً! (خريطة التداخل 10-ي!)")]),
    "b2-u15-d3": dict(inter=["klarheit", "gruendlichkeit", "atempause"], words=["wirksamkeit", "effizienz", "verbesserung"],
        slug="die-wirksamkeit", title_de="Die Wirksamkeit", title_ar="الفعالية",
        line1=("mueller", "Die Wirksamkeit jeder Handlung: mit Effizienz arbeiten und die Verbesserung suchen!", "يوم الفعالية"),
        lines_rest=[
            ("yusuf", "Was ist die Wirksamkeit?", "استفسار"),
            ("mueller", "Die Wirksamkeit zeigt: die Handlung wirkt.", "تعريف"),
            ("yusuf", "Und die Effizienz?", "استفسار"),
            ("mueller", "Die Effizienz spart Zeit und Kraft.", "تفسير"),
            ("yusuf", "Und die Verbesserung?", "استفسار"),
            ("mueller", "Die Verbesserung kommt Schritt für Schritt.", "مبدأ"),
            ("yusuf", "Gut. Ich verbessere weiter.", "إغلاق")],
        ziel_ar="اليوم الثالث: الفعالية والكفاءة والتحسين!",
        canDo=["يصف فعالية العمل! (die Wirksamkeit!)", "يصف الكفاءة والتحسين! (die Effizienz! die Verbesserung!)"],
        warmup=["klarheit", "gruendlichkeit"],
        pretest=[("«الفعالية واضحة.»؟", "wirksamkeit"), ("«التحسين جيد.»؟", "verbesserung")],
        task_goal_de="Wirksamkeit, Effizienz, Verbesserung: Wir verbessern unsere Arbeit!",
        task_goal_ar="اليوم الثالث من الوحدة 15! (الفعالية! الكفاءة! التحسين!)",
        task_sit_de="Wirksamkeit, Effizienz, Verbesserung — zusammen verbessern.",
        task_sit_ar="فعالية! كفاءة! تحسين! — نحسّن معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Wirksamkeit (die! على -keit!) وdie Effizienz (die! اسم مؤنث!) وdie Verbesserung (die! -ung!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: Wirksamkeit zeigen! eine Verbesserung machen!"],
        gap_extra=[("Die ___ ist wichtig.", "Klarheit"), ("Die ___ ist wichtig.", "Gründlichkeit"), ("Die ___ ist kurz.", "Atempause")],
        hunt_extra=[("~~der Wirksamkeit ist klar.~~", "Die Wirksamkeit ist klar.", "die Wirksamkeit (die! على -keit!) لا der Wirksamkeit!"),
            ("~~das Verbesserung ist gut.~~", "Die Verbesserung ist gut.", "die Verbesserung (die! -ung!) لا das Verbesserung!")],
        speak_extra=["klarheit", "gruendlichkeit", "atempause"],
        warn=[("der Wirksamkeit!", "~~der Wirksamkeit ist klar.~~", "die Wirksamkeit!", "Die Wirksamkeit ist klar.", "___ Wirksamkeit ist klar.", "die",
               "الألمانية: die Wirksamkeit (die! على -keit!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
              ("das Effizienz!", "~~das Effizienz ist wichtig.~~", "die Effizienz!", "Die Effizienz ist wichtig.", "___ Effizienz ist wichtig.", "die",
               "العربية: «الكفاءة» مذكّرة! والألمانية: die Effizienz (die! اسم مؤنث!) (خريطة التداخل 10-ي!)"),
              ("der Verbesserung!", "~~der Verbesserung ist gut.~~", "die Verbesserung!", "Die Verbesserung ist gut.", "___ Verbesserung ist gut.", "die",
               "الألمانية: die Verbesserung (die! -ung مؤنثة دائماً!) — لا der أبداً! (خريطة التداخل 10-ي!)")]),
    "b2-u15-d4": dict(inter=["erleichterung", "ernuechterung", "seufzer"], words=["aufbruch", "wendepunkt", "meilenstein"],
        slug="der-aufbruch", title_de="Der Aufbruch", title_ar="الانطلاق",
        line1=("lena", "Der Aufbruch nach der Prüfung: der Wendepunkt ist da und der Meilenstein ist groß!", "يوم الانطلاق"),
        lines_rest=[
            ("yusuf", "Was ist der Aufbruch?", "استفسار"),
            ("lena", "Der Aufbruch ist der Start ins Neue.", "تعريف"),
            ("yusuf", "Und der Wendepunkt?", "استفسار"),
            ("lena", "Der Wendepunkt verändert den Weg.", "تفسير"),
            ("yusuf", "Und der Meilenstein?", "استفسار"),
            ("lena", "Der Meilenstein zeigt: wir sind weit gekommen.", "مبدأ"),
            ("yusuf", "Gut. Ich schaue nach vorn.", "إغلاق")],
        ziel_ar="اليوم الرابع: الانطلاق ونقطة التحوّل والمعلّم على الطريق!",
        canDo=["يصف الانطلاق الجديد! (der Aufbruch!)", "يصف نقطة التحوّل والمعلّم! (der Wendepunkt! der Meilenstein!)"],
        warmup=["erleichterung", "ernuechterung"],
        pretest=[("«الانطلاق قريب.»؟", "aufbruch"), ("«نقطة التحوّل مهمة.»؟", "wendepunkt")],
        task_goal_de="Aufbruch, Wendepunkt, Meilenstein: Wir starten das Neue!",
        task_goal_ar="اليوم الرابع من الوحدة 15! (الانطلاق! التحوّل! المعلّم!)",
        task_sit_de="Aufbruch, Wendepunkt, Meilenstein — zusammen starten.",
        task_sit_ar="انطلاق! تحوّل! معلّم! — ننطلق معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "der Aufbruch (der! مركّب!) وder Wendepunkt (der! مركّب!) وder Meilenstein (der! مركّب!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: den Aufbruch machen! ein Meilenstein sein!"],
        gap_extra=[("Die ___ ist groß.", "Erleichterung"), ("Die ___ ist schwer.", "Ernüchterung"), ("Der ___ ist lang.", "Seufzer")],
        hunt_extra=[("~~der Aufbruch ist bald.~~", "Der Aufbruch ist bald.", "der Aufbruch (der! مركّب!) — الكبيرة بداية الجملة!"),
            ("~~die Wendepunkt ist wichtig.~~", "Der Wendepunkt ist wichtig.", "der Wendepunkt (der! مركّب مذكّر!) لا die Wendepunkt!")],
        speak_extra=["erleichterung", "ernuechterung", "seufzer"],
        warn=[("die Aufbruch!", "~~die Aufbruch ist bald.~~", "der Aufbruch!", "Der Aufbruch ist bald.", "___ Aufbruch ist bald.", "der",
               "العربية: «الانطلاق» مؤنث! والألمانية: der Aufbruch (der! مركّب مذكّر!) (خريطة التداخل 10-ي!)"),
              ("die Wendepunkt!", "~~die Wendepunkt ist wichtig.~~", "der Wendepunkt!", "Der Wendepunkt ist wichtig.", "___ Wendepunkt ist wichtig.", "der",
               "الألمانية: der Wendepunkt (der! مركّب مذكّر!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
              ("das Meilenstein!", "~~das Meilenstein ist wichtig.~~", "der Meilenstein!", "Der Meilenstein ist wichtig.", "___ Meilenstein ist wichtig.", "der",
               "الألمانية: der Meilenstein (der! مركّب مذكّر!) — لا das أبداً! (خريطة التداخل 10-ي!)")]),
    "b2-u15-d5": dict(inter=["bewertung", "bescheinigung", "verlaengerung"], words=["wuerdigung", "zeremonie", "ansporn"],
        slug="die-wuerdigung", title_de="Die Würdigung", title_ar="التقدير",
        line1=("mueller", "Die Würdigung der Arbeit: eine Zeremonie für alle — und der Ansporn bleibt!", "يوم التقدير"),
        lines_rest=[
            ("yusuf", "Was ist die Würdigung?", "استفسار"),
            ("mueller", "Die Würdigung zeigt: die Arbeit zählt.", "تعريف"),
            ("yusuf", "Und die Zeremonie?", "استفسار"),
            ("mueller", "Die Zeremonie feiert den Weg.", "تفسير"),
            ("yusuf", "Und der Ansporn?", "استفسار"),
            ("mueller", "Der Ansporn treibt uns an.", "مبدأ"),
            ("yusuf", "Gut. Ich bleibe motiviert.", "إغلاق")],
        ziel_ar="اليوم الخامس: التقدير والمراسم والحافز!",
        canDo=["يصف التقدير للعمل! (die Würdigung!)", "يصف المراسم والحافز! (die Zeremonie! der Ansporn!)"],
        warmup=["bewertung", "bescheinigung"],
        pretest=[("«التقدير مهم.»؟", "wuerdigung"), ("«الحافز جيد.»؟", "ansporn")],
        task_goal_de="Würdigung, Zeremonie, Ansporn: Wir feiern den Weg!",
        task_goal_ar="اليوم الخامس من الوحدة 15! (التقدير! المراسم! الحافز!)",
        task_sit_de="Würdigung, Zeremonie, Ansporn — zusammen feiern.",
        task_sit_ar="تقدير! مراسم! حافز! — نحتفل معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Würdigung (die! -ung!) وdie Zeremonie (die! اسم مؤنث!) وder Ansporn (der! مركّب!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: Würdigung bekommen! Ansporn geben!"],
        gap_extra=[("Die ___ ist fair.", "Bewertung"), ("Die ___ ist wichtig.", "Bescheinigung"), ("Die ___ ist möglich.", "Verlängerung")],
        hunt_extra=[("~~der Würdigung ist wichtig.~~", "Die Würdigung ist wichtig.", "die Würdigung (die! -ung!) لا der Würdigung!"),
            ("~~die Ansporn ist gut.~~", "Der Ansporn ist gut.", "der Ansporn (der! مركّب مذكّر!) لا die Ansporn!")],
        speak_extra=["bewertung", "bescheinigung", "verlaengerung"],
        warn=[("der Würdigung!", "~~der Würdigung ist wichtig.~~", "die Würdigung!", "Die Würdigung ist wichtig.", "___ Würdigung ist wichtig.", "die",
               "الألمانية: die Würdigung (die! -ung مؤنثة دائماً!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
              ("das Zeremonie!", "~~das Zeremonie ist schön.~~", "die Zeremonie!", "Die Zeremonie ist schön.", "___ Zeremonie ist schön.", "die",
               "العربية: «المراسم» مذكّرة! والألمانية: die Zeremonie (die! اسم مؤنث!) (خريطة التداخل 10-ي!)"),
              ("die Ansporn!", "~~die Ansporn ist gut.~~", "der Ansporn!", "Der Ansporn ist gut.", "___ Ansporn ist gut.", "der",
               "الألمانية: der Ansporn (der! مركّب مذكّر!) — لا die أبداً! (خريطة التداخل 10-ي!)")]),
    "b2-u15-d6": dict(inter=["dankbarkeit", "jubel", "auszeit"], words=["vorfreude", "selbststaendigkeit", "lebensfreude"],
        slug="die-vorfreude", title_de="Die Vorfreude", title_ar="الفرحة المتوقّعة",
        line1=("mueller", "Die Vorfreude auf den Weg: mit Selbstständigkeit und Lebensfreude geht es weiter!", "يوم الفرح"),
        lines_rest=[
            ("yusuf", "Was ist die Vorfreude?", "استفسار"),
            ("mueller", "Die Vorfreude ist die Freude vor dem Kommen.", "تعريف"),
            ("yusuf", "Und die Selbstständigkeit?", "استفسار"),
            ("mueller", "Die Selbstständigkeit macht frei.", "تفسير"),
            ("yusuf", "Und die Lebensfreude?", "استفسار"),
            ("mueller", "Die Lebensfreude begleitet uns überall.", "مبدأ"),
            ("yusuf", "Gut. Ich freue mich auf den Weg!", "إغلاق")],
        ziel_ar="اليوم السادس: الفرح المتوقّع والاستقلالية وبهجة الحياة!",
        canDo=["يصف الفرح بالقادم! (die Vorfreude!)", "يصف الاستقلالية والبهجة! (die Selbstständigkeit! die Lebensfreude!)"],
        warmup=["dankbarkeit", "jubel"],
        pretest=[("«الفرحة المتوقّعة كبيرة.»؟", "vorfreude"), ("«الاستقلالية مهمة.»؟", "selbststaendigkeit")],
        task_goal_de="Vorfreude, Selbstständigkeit, Lebensfreude: Wir schließen die drei Wochen ab!",
        task_goal_ar="اليوم السادس من الوحدة 15! (الفرح! الاستقلالية! البهجة!)",
        task_sit_de="Vorfreude, Selbstständigkeit, Lebensfreude — zusammen freuen.",
        task_sit_ar="فرح! استقلالية! بهجة! — نفرح معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Vorfreude (die! مركّبة!) وdie Selbstständigkeit (die! على -keit!) وdie Lebensfreude (die! مركّبة!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: Vorfreude haben! Lebensfreude haben!"],
        gap_extra=[("Die ___ ist groß.", "Dankbarkeit"), ("Der ___ ist laut.", "Jubel"), ("Die ___ ist gut.", "Auszeit")],
        hunt_extra=[("~~der Vorfreude ist groß.~~", "Die Vorfreude ist groß.", "die Vorfreude (die! مركّبة على Freude!) لا der Vorfreude!"),
            ("~~das Selbstständigkeit ist wichtig.~~", "Die Selbstständigkeit ist wichtig.", "die Selbstständigkeit (die! على -keit!) لا das Selbstständigkeit!")],
        speak_extra=["dankbarkeit", "jubel", "auszeit"],
        warn=[("der Vorfreude!", "~~der Vorfreude ist groß.~~", "die Vorfreude!", "Die Vorfreude ist groß.", "___ Vorfreude ist groß.", "die",
               "الألمانية: die Vorfreude (die! مركّبة على Freude!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
              ("das Selbstständigkeit!", "~~das Selbstständigkeit ist wichtig.~~", "die Selbstständigkeit!", "Die Selbstständigkeit ist wichtig.", "___ Selbstständigkeit ist wichtig.", "die",
               "الألمانية: die Selbstständigkeit (die! على -keit!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
              ("der Lebensfreude!", "~~der Lebensfreude ist groß.~~", "die Lebensfreude!", "Die Lebensfreude ist groß.", "___ Lebensfreude ist groß.", "die",
               "العربية: «البهجة» مذكّر! والألمانية: die Lebensfreude (die! مركّبة على Freude!) (خريطة التداخل 10-ي!)")]),
}

UNIT_NAME = "الوحدة 15 (الطريق بعد الامتحان!)"

def duden(word_id, de):
    head = de.split(" ", 1)[1] if " " in de else de
    for a, b in (("ä", "ae"), ("ö", "oe"), ("ü", "ue"), ("ß", "ss"), ("é", "e")):
        head = head.replace(a, b)
    return f"https://www.duden.de/rechtschreibung/{head}"


def build_words():
    for wid, w in WORDS.items():
        day = next(d for d, v in DAYS.items() if wid in v["words"])
        doc = {
            "schemaVersion": "1.0.0", "id": wid, "de": w["de"],
        }
        if w.get("article"):
            doc["article"] = w["article"]
        doc["gender"] = w["gender"]
        if w.get("plural") is not None:
            doc["plural"] = w["plural"]
            doc["pluralRuleNote"] = w["pluralRuleNote"]
        doc["ar"] = w["ar"]
        doc["wordClass"] = w["wordClass"]
        doc["phoneticRisks"] = w["phoneticRisks"]
        doc["grammarRisks"] = w["grammarRisks"]
        doc["chunk"] = False
        doc["wordFamily"] = w["wordFamily"]
        doc["sampleSentence"] = {"de": w["sample"][0], "ar": w["sample"][1], "sourceLesson": day}
        doc["level"] = "B2"
        doc["unit"] = 15
        doc["goetheList"] = []
        doc["thema"] = "Festigung & Aufbruch"
        doc["isFunctionWord"] = False
        doc["usedInLessons"] = [day]
        doc["srsCardTypes"] = (["production", "comprehension", "gender", "kollocation"]
                               if w["wordClass"] == "noun" else ["production", "comprehension", "audio"])
        if w.get("kollocation"):
            de, ar, verb = w["kollocation"]
            doc["kollocation"] = {"de": de, "ar": ar, "verb": verb}
        (W / f"{wid}.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"words: {len(WORDS)}")


def build_dialogues():
    for lid, v in DAYS.items():
        lines = [v["line1"]] + v["lines_rest"]
        doc = {
            "schemaVersion": "1.0.0",
            "id": f"{lid}-{v['slug']}",
            "kind": "dialogue",
            "level": "B2",
            "title": {"de": v["title_de"], "ar": v["title_ar"]},
            "usedIn": [lid],
            "lengthScale": 1.1,
            "lines": [
                {"id": f"b2u15d{lid[-1]}-l{i+1}", "speaker": sp, "text": tx, "direction": dr}
                for i, (sp, tx, dr) in enumerate(lines)
            ],
        }
        (SCRIPTS / f"{lid}-{v['slug']}.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"dialogues: {len(DAYS)}")


def build_lessons():
    tpl = json.loads((ROOT / "content/lessons/b2/b2-u7-d1.json").read_text(encoding="utf-8"))
    for lid, v in DAYS.items():
        words = v["words"]
        d = json.loads(json.dumps(tpl))
        d["id"] = lid
        d["level"] = "B2"
        d["unit"] = 15
        d["day"] = int(lid[-1])
        line1_de = v["line1"][1]
        d["ziel"] = {"de": line1_de, "ar": f"{UNIT_NAME} {v['ziel_ar']}"}
        d["canDoDaily"] = v["canDo"]
        d["warmup"] = {"cardIds": v["inter"]}
        d["einstieg"] = {"pretestItems": [
            {"prompt": {"ar": q}, "choices": [
                sent_for(wid), wrong1_for(wid), wrong2_for(wid)], "answer": sent_for(wid), "revealNextSession": True}
            for q, wid in v["pretest"]]}
        d["praesentation"] = {
            "wordIds": words,
            "borrowedWords": [],
            "grammarArsenalIds": ["ars-praesentation", "ars-fragerunde"],
            "storySentenceIds": [f"story-b2-u15-s{d['day']}"],
            "dualCodingRequired": True,
            "riskFlagsShown": sorted({r for wid in words for r in WORDS[wid]["phoneticRisks"]}),
        }
        w3 = [WORDS[w] for w in words]
        gend = lambda w: w["de"]
        inter = v["inter"]
        d["uebung"] = {
            "communicativeTask": {
                "goal": {"de": v["task_goal_de"], "ar": v["task_goal_ar"]},
                "situation": {"de": v["task_sit_de"], "ar": v["task_sit_ar"]},
                "successCriteria": v["task_success"],
            },
            "stations": [
                {"type": "match", "explanationRequired": True, "hints": ["الأداة أولاً!", "المعنى بالعربية!"],
                 "interleavedWith": inter,
                 "items": [
                     {"pairs": [{"de": gend(w), "ar": w["ar"][0]} for w in w3],
                      "why": " · ".join(f"{gend(w)} {w['ar'][0]} ({w['article'] if 'article' in w else '—'}! {suffix_note(w)})" for w in w3)},
                     {"pairs": [{"de": old_de(o), "ar": old_ar(o)} for o in inter],
                      "why": "استدعاء سابق: " + " · ".join(f"{old_de(o)} {old_ar(o)}" for o in inter)},
                     {"pairs": [{"de": gend(w3[0]), "ar": w3[0]["ar"][0]}, {"de": old_de(inter[0]), "ar": old_ar(inter[0])}, {"de": gend(w3[1]), "ar": w3[1]["ar"][0]}],
                      "why": "خلط جديد وقديم: الجديد يُضاف إلى المحفوظ!"},
                 ]},
                {"type": "gap-fill", "explanationRequired": True, "hints": ["الأداة أولاً!", "المعنى بالعربية!"],
                 "interleavedWith": inter,
                 "items": gap_items(v, w3)},
                {"type": "error-hunt", "explanationRequired": True, "hints": ["الأداة أولاً!", "المعنى بالعربية!"],
                 "interleavedWith": inter,
                 "items": [{"q": f"~~{bad.strip(chr(126))}~~", "a": good, "why": why}
                           for bad, _ba, _ga, good, _q, _a, why in v["warn"]]
                         + hunt_inter_items(inter)},
                {"type": "speaking", "explanationRequired": True, "hints": ["الأداة أولاً!", "المعنى بالعربية!"],
                 "interleavedWith": inter,
                 "items": [
                     {"q": f"ابدأ بـ{WORDS[words[0]]['ar'][0]}! (جملتان!)", "a": f"{WORDS[words[0]]['sample'][0]} {WORDS[words[1]]['sample'][0]}", "why": f"{WORDS[words[0]]['ar'][0]} أولًا!"},
                     {"q": f"تحدّث عن {WORDS[words[1]]['ar'][0]}! (جملتان!)", "a": f"{WORDS[words[1]]['sample'][0]} Das ist gut.", "why": f"{WORDS[words[1]]['ar'][0]} — تحدّث بجملة كاملة!"},
                     {"q": f"تحدّث عن {WORDS[words[2]]['ar'][0]}! (جملتان!)", "a": f"{WORDS[words[2]]['sample'][0]} {WORDS[words[2]]['de']} hilft.", "why": f"{WORDS[words[2]]['ar'][0]} — تحدّث بجملة كاملة!"},
                 ] + [{"q": f"كوّن جملة فيها «{old_de(o)}» («{old_ar(o)}») ثم تحدّث بها.", "a": old_sample(o),
                       "why": f"استعمل «{old_de(o)}» («{old_ar(o)}») في جملة كاملة — الجملة النموذجية توضح الاستعمال."} for o in inter]},
                {"type": "listening", "explanationRequired": True, "interleavedWith": inter,
                 "items": [
                     {"audioId": f"word-{w}", "speakText": WORDS[w]["de"] + ".", "q": "استمع: ماذا تعني الكلمة؟",
                      "choices": [WORDS[w]["ar"][0], WORDS[words[(i + 1) % 3]]["ar"][0], WORDS[words[(i + 2) % 3]]["ar"][0]],
                      "a": WORDS[w]["ar"][0],
                      "why": f"الصوت يقول «{WORDS[w]['de']}» — معناها «{WORDS[w]['ar'][0]}». ركّز على الصوت لا على الشكل!"}
                     for i, w in enumerate(words)]
                 + [{"audioId": f"word-{o}", "speakText": old_de(o) + ".", "q": ("استمع: أي معنى صحيح؟" if i % 2 == 0 else "استمع جيداً: ما الكلمة؟"),
                     "choices": [old_ar(o), old_ar(inter[(i + 1) % len(inter)]), WORDS[words[i % 3]]["ar"][0]], "a": old_ar(o),
                     "why": f"الكلمة المسموعة «{old_de(o)}» تعني «{old_ar(o)}». قارنها بالخيارات الأخرى صوتياً."}
                    for i, o in enumerate([inter[0], inter[1], inter[2], inter[0]])]},
                {"type": "dictation", "explanationRequired": True, "interleavedWith": inter[:2],
                 "items": [
                     {"audioId": f"word-{w}", "speakText": WORDS[w]["de"] + ".", "a": WORDS[w]["de"],
                      "why": f"اكتب ما تسمعه حرفياً: «{WORDS[w]['de']}» تعني «{WORDS[w]['ar'][0]}». انتبه للحروف الكبيرة!"}
                     for w in words[:2]]
                 + [{"audioId": f"word-{o}", "speakText": old_de(o) + ".", "a": old_de(o),
                     "why": f"اكتب ما تسمعه حرفياً: «{old_de(o)}» تعني «{old_ar(o)}». انتبه للحروف الكبيرة!"}
                    for o in inter[:2]]},
            ],
        }
        d["quiz"] = {"variants": quiz_variants(v)}
        d["zusammenfassung"] = {
            "summary": {
                "de": zus_de(v),
                "ar": f"{UNIT_NAME} {v['ziel_ar']} نتعلّم اليوم: " + " و".join(WORDS[w]["ar"][0] for w in words) + "!",
            },
            "srsBundleWordIds": words,
            "warningCards": [
                {"commonError": {"ar": bad_ar, "de": bad_de}, "correct": {"ar": good_ar, "de": good_de},
                 "exercise": {"q": ex_q, "a": ex_a},
                 "whyArabicSpeakerFails": why}
                for bad_ar, bad_de, good_ar, good_de, ex_q, ex_a, why in v["warn"]
            ],
        }
        d["gReferences"] = {"duden": [duden(w, WORDS[w]["de"]) for w in words]}
        d["usedArsenalIds"] = ["ars-praesentation", "ars-fragerunde"]
        d["audioManifestRefs"] = [f"word-{w}" for w in words]
        d["imageManifestRefs"] = []
        d["curriculumRef"] = {
            "netzwerkChapter": f"Netzwerk neu B2 — needs-web-verify (D417: لا تخمين حتى مصدر مُتحقَّق!) — مسار B2: {UNIT_NAME} {v['title_ar']}",
            "goetheWordListOverlap": words,
        }
        (LESSONS / f"{lid}.json").write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"lessons: {len(DAYS)}")


def suffix_note(w):
    de = w["de"]
    if de.endswith("ung"):
        return "-ung مؤنثة!"
    if de.endswith("keit"):
        return "-keit مؤنثة!"
    if de.endswith("nis"):
        return "-nis محايد!"
    if de.endswith("e") and w["gender"] == "die":
        return "-e مؤنثة!"
    return f"{w.get('article', '—')}!"


def sent_for(wid):
    w = WORDS[wid]
    return w["sample"][0]


def wrong1_for(wid):
    w = WORDS[wid]
    art = w.get("article", "die")
    bad = {"die": "Der", "der": "Das", "das": "Die"}[art]
    rest = w["sample"][0].split(" ", 1)[1]
    return f"{bad} {rest}"


def wrong2_for(wid):
    w = WORDS[wid]
    art = w.get("article", "die")
    bad = {"die": "Das", "der": "Die", "das": "Der"}[art]
    rest = w["sample"][0].split(" ", 1)[1]
    return f"{bad} {rest}"


def old_de(oid):
    d = json.loads((W / f"{oid}.json").read_text(encoding="utf-8"))
    return d["de"]


def old_ar(oid):
    d = json.loads((W / f"{oid}.json").read_text(encoding="utf-8"))
    return d["ar"][0]


def gap_items(v, w3):
    words = [w for w in v["words"] if "article" in WORDS[w]]
    items = []
    for w in words:
        ww = WORDS[w]
        de = ww["de"]
        art = ww.get("article", "")
        rest = de.split(" ", 1)[1]
        items.append({"q": f"{art} ___ ist wichtig. ({ww['ar'][0]}!)", "a": rest,
                      "why": f"{de} {ww['ar'][0]} ({ww['article'] if 'article' in ww else '—'}! {suffix_note(ww)}) — {ww['sample'][0]}"})
    for o in v["inter"]:
        wdoc = json.loads((W / f"{o}.json").read_text(encoding="utf-8"))
        de = wdoc["de"]
        form = de.split(" ", 1)[1] if " " in de else de
        sample = wdoc["sampleSentence"]["de"]
        q = sample.replace(form, "___", 1) if form in sample else f"{de} ___"
        items.append({"q": q, "a": form,
                      "why": f"الكلمة الناقصة «{form}» تعني «{wdoc['ar'][0]}» — تذكر صيغتها في السياق."})
    return items


def hunt_inter_items(inter):
    items = []
    for o in inter:
        wdoc = json.loads((W / f"{o}.json").read_text(encoding="utf-8"))
        de = wdoc["de"]
        form = de.split(" ", 1)[1] if " " in de else de
        sample = wdoc["sampleSentence"]["de"]
        bad = sample.replace(form, form[0].lower() + form[1:], 1)
        items.append({"q": f"~~{bad}~~", "a": sample,
                      "why": f"الخطأ في «{form[0].lower() + form[1:]}»! الصواب «{form}» — راجع القاعدة ({wdoc['ar'][0]})."}) 
    return items


def old_sample(oid):
    d = json.loads((W / f"{oid}.json").read_text(encoding="utf-8"))
    return d["sampleSentence"]["de"]


def quiz_variants(v):
    words = v["words"]
    v0 = [{"q": f"«{WORDS[w]['ar'][0]}»؟", "a": WORDS[w]["de"]} for w in words] + \
         [{"q": f"«{WORDS[w]['sample'][1]}»؟", "a": WORDS[w]["sample"][0]} for w in words]
    v1 = [{"q": WORDS[w]["de"], "a": WORDS[w]["ar"][0]} for w in words] + \
         [{"q": f"«{WORDS[w]['sample'][1]}»؟", "a": WORDS[w]["sample"][0]} for w in reversed(words)]
    v2 = [{"q": f"«{WORDS[w]['ar'][0]}»؟", "a": WORDS[w]["de"]} for w in reversed(words)] + \
         [{"q": WORDS[w]["de"], "a": WORDS[w]["ar"][0]} for w in words]
    return [{"items": it} for it in (v0, v1, v2)]


def zus_de(v):
    words = v["words"]
    w0, w1, w2 = (WORDS[w] for w in words)
    return f"{w0['sample'][0]} {w1['sample'][0]} {w2['sample'][0]} Die Woche der Prüfung ist gut."


def build_story():
    s = json.loads(STORY.read_text(encoding="utf-8"))
    for lid, v in DAYS.items():
        d = int(lid[-1])
        s["sentences"].append({
            "id": f"story-b2-u15-s{d}", "lessonId": lid,
            "scriptId": f"{lid}-{v['slug']}", "lineId": f"b2u15d{d}-l1",
            "speaker": v["line1"][0], "de": v["line1"][1], "contextAr": v["line1"][2],
        })
    STORY.write_text(json.dumps(s, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("story +6")


def build_upgrades():
    u = json.loads(UPGRADES.read_text(encoding="utf-8"))
    for lid, v in DAYS.items():
        phrases = []
        for w in v["words"]:
            kol = WORDS[w].get("kollocation")
            if kol and len(phrases) < 2:
                phrases.append({"de": kol[0], "whyAr": f"المفردة الثابتة ليوم {lid}! (D596)"})
        u["lessons"].append({
            "lessonId": lid, "rule": "done", "practice": "done", "quiz": "done",
            "properNouns": [], "fixedPhrases": phrases,
        })
    UPGRADES.write_text(json.dumps(u, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("upgrades +6")


def patch_arsenal():
    for rid in ["ars-praesentation", "ars-fragerunde"]:
        p = ROOT / f"content/arsenal/grammar/{rid}.json"
        r = json.loads(p.read_text(encoding="utf-8"))
        for lid in DAYS:
            if lid not in r["usedInLessons"]:
                r["usedInLessons"].append(lid)
        p.write_text(json.dumps(r, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("arsenal usedInLessons +6×2")


def build_audio():
    """صوت الكلمات الـ18 — الجديد فقط (القديم لم يُمس أبداً — D251/D578) + قياسات make_clip.
    D593: المركّبات الطويلة (die Prüfungssimulation!) قد تتجاوز 1.5s — التسريع length_scale (النص الكامل يبقى — N-043!)."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("genaudio", ROOT / "tools/gen-audio.py")
    ga = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ga)
    content = ROOT / "content"
    mpath = content / "manifests/audio-manifest.a1-u1.json"
    manifest = json.loads(mpath.read_text(encoding="utf-8"))
    existing = {t["id"] for t in manifest["tracks"]}
    added = 0
    for wid, w in WORDS.items():
        tid = f"word-{wid}"
        rel = f"words/audio/de-DE/{tid}.opus"
        out = content / rel
        text = w["de"] + "."
        if not out.exists():
            m = ga.make_clip(text, out)
        else:
            m = None
        if tid not in existing:
            if m is None:
                m = ga.make_clip(text, out)
            ls = None
            attempt = 0
            while m["durationMs"] > 1500 and attempt < 3:
                ls = [0.85, 0.75, 0.7][attempt]
                m = ga.make_clip(text, out, length_scale=ls)
                attempt += 1
            assert m["durationMs"] <= 1500, f"{tid} أطول من 1.5s: {m['durationMs']}ms"
            vp = {"speaker": ga.VOICE_ID, "speedWpm": 110}
            if ls is not None:
                vp["lengthScale"] = ls
            manifest["tracks"].append({
                "id": tid, "file": rel, "role": "word", "isGuest": False,
                "voiceParams": vp,
                "textDe": text, "priority": "P2", "lessonRefs": [next(d for d, v in DAYS.items() if wid in v["words"])], **m,
            })
            added += 1
    mpath.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"word audio: +{added} (الجديد فقط — القديم لم يُمس!)")


if __name__ == "__main__":
    build_words()
    build_dialogues()
    build_lessons()
    build_story()
    build_upgrades()
    patch_arsenal()
    build_audio()
    print("B2-U15 generated. Next: npx tsx tools/dialogue-splitter.ts --all")
