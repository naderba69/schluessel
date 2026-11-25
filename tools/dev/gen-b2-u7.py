# -*- coding: utf-8 -*-
"""D585 · بناء b2-u7 «النفس والصحة» (الدستور §3-ج: B2 وحدة 7) — 6 دروس × 3 كلمات.
يكتب: كلمات + حوارات (audio-scripts) + دروس + قصة + خطة الترقية + usedInLessons.
الصوت يولّده tools/gen-audio.py all بعدها. لا mp3/opus يُكتب يدوياً أبداً (D578)."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
W = ROOT / "content/words"
LESSONS = ROOT / "content/lessons/b2"
SCRIPTS = ROOT / "content/audio-scripts"
UPGRADES = ROOT / "content/upgrades/b2-lesson-upgrade.json"
STORY = ROOT / "content/story/b2.json"

# ── الكلمات الثمانية عشر (3/يوم) ──────────────────────────────────────────
WORDS = {
    "psyche": dict(de="die Psyche", article="die", gender="die", plural="die Psychen",
        pluralRuleNote="اسم مؤنث على -e (die!) جمعه -n: die Psychen.",
        ar=["النفس (الحالة النفسية)"], wordClass="noun", phoneticRisks=["ch-ich-laut"],
        grammarRisks=["needs-ein"], wordFamily=[], kollocation=("die Psyche zeigen", "يُظهر نفسيته", "zeigen"),
        sample=("Die Psyche ist wichtig.", "النفس مهمّة.")),
    "bewusstsein": dict(de="das Bewusstsein", article="das", gender="das", plural="-",
        pluralRuleNote="مركّب على -nis (das!) ويُستعمل بلا جمع: das Bewusstsein.",
        ar=["الوعي (الإدراك)"], wordClass="noun", phoneticRisks=["double-consonant", "sp-st-initial", "w-v"],
        grammarRisks=["needs-ein"], wordFamily=["bewusst"], kollocation=("das Bewusstsein haben", "يكون واعياً", "haben"),
        sample=("Das Bewusstsein ist klar.", "الوعي واضح.")),
    "trost": dict(de="der Trost", article="der", gender="der", plural="-",
        pluralRuleNote="اسم مذكّر (der!) ويُستعمل عادةً بلا جمع: der Trost.",
        ar=["المواساة (سلوى العزاء)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["troesten"], kollocation=("Trost finden", "يجد العزاء", "finden"),
        sample=("Der Trost hilft.", "المواساة تساعد.")),
    "druck": dict(de="der Druck", article="der", gender="der", plural="die Drücke",
        pluralRuleNote="اسم مذكّر (der!) جمعه مع umlaut: die Drücke.",
        ar=["الضغط"], wordClass="noun", phoneticRisks=["double-consonant"],
        grammarRisks=["needs-ein"], wordFamily=[], kollocation=("Druck haben", "يكون تحت الضغط", "haben"),
        sample=("Der Druck ist groß.", "الضغط كبير.")),
    "anspannung": dict(de="die Anspannung", article="die", gender="die", plural="die Anspannungen",
        pluralRuleNote="اسم مؤنث على -ung (die! -ung مؤنثة دائماً!) جمعه -en: die Anspannungen.",
        ar=["التوتر (الشدّ العصبي)"], wordClass="noun", phoneticRisks=["ng-velar", "double-consonant", "sp-st-initial"],
        grammarRisks=["needs-ein"], wordFamily=["spannen"], kollocation=("die Anspannung haben", "يكون متوتراً", "haben"),
        sample=("Die Anspannung ist schlimm.", "التوتر سيّئ.")),
    "ueberlastung": dict(de="die Überlastung", article="die", gender="die", plural="die Überlastungen",
        pluralRuleNote="اسم مؤنث على -ung (die!) جمعه -en: die Überlastungen.",
        ar=["الحمل الزائد (الإفراط في العمل)"], wordClass="noun", phoneticRisks=["ng-velar", "umlaut-u"],
        grammarRisks=["needs-ein"], wordFamily=["last"], kollocation=("die Überlastung haben", "يعمل فوق طاقته", "haben"),
        sample=("Die Überlastung ist ein Problem.", "الحمل الزائد مشكلة.")),
    "bewaeltigung": dict(de="die Bewältigung", article="die", gender="die", plural="die Bewältigungen",
        pluralRuleNote="اسم مؤنث على -ung (die!) جمعه -en: die Bewältigungen.",
        ar=["المواجهة (التغلّب على الصعوبات)"], wordClass="noun", phoneticRisks=["ng-velar", "umlaut-a", "w-v"],
        grammarRisks=["needs-ein"], wordFamily=["bewaeltigen"], kollocation=("die Bewältigung zeigen", "يُظهر القدرة على المواجهة", "zeigen"),
        sample=("Die Bewältigung geht.", "المواجهة ممكنة.")),
    "ausdauer": dict(de="die Ausdauer", article="die", gender="die", plural="-",
        pluralRuleNote="اسم مؤنث جامد — بلا جمع: die Ausdauer.",
        ar=["المثابرة (القدرة على التحمّل)"], wordClass="noun", phoneticRisks=["r-uvular"],
        grammarRisks=["needs-ein"], wordFamily=["dauern"], kollocation=("die Ausdauer haben", "يملك المثابرة", "haben"),
        sample=("Die Ausdauer ist stark.", "المثابرة قويّة.")),
    "resilienz": dict(de="die Resilienz", article="die", gender="die", plural="-",
        pluralRuleNote="اسم مؤنث على -enz (die!) ويُستعمل عادةً بلا جمع: die Resilienz.",
        ar=["الصلابة النفسية (القدرة على التعافي)"], wordClass="noun", phoneticRisks=["vowel-long-short", "z"],
        grammarRisks=["needs-ein"], wordFamily=[], kollocation=("die Resilienz zeigen", "يُظهر الصلابة النفسية", "zeigen"),
        sample=("Die Resilienz hilft.", "الصلابة النفسية تساعد.")),
    "nerv": dict(de="der Nerv", article="der", gender="der", plural="die Nerven",
        pluralRuleNote="اسم مذكّر (der!) جمعه -en: die Nerven.",
        ar=["العصب (الأعصاب)"], wordClass="noun", phoneticRisks=["v-f"],
        grammarRisks=["needs-ein"], wordFamily=[], kollocation=("die Nerven haben", "يملك الأعصاب القوية", "haben"),
        sample=("Die Nerven sind wichtig.", "الأعصاب مهمّة.")),
    "reiz": dict(de="der Reiz", article="der", gender="der", plural="die Reize",
        pluralRuleNote="اسم مذكّر (der!) جمعه جمع مذكّر سالم: die Reize.",
        ar=["المحفّز (المنبّه)"], wordClass="noun", phoneticRisks=["z"],
        grammarRisks=["needs-ein"], wordFamily=[], kollocation=("den Reiz haben", "يملك الجاذبية", "haben"),
        sample=("Der Reiz ist groß.", "المحفّز كبير.")),
    "empathie": dict(de="die Empathie", article="die", gender="die", plural="-",
        pluralRuleNote="اسم مؤنث على -ie (die!) ويُستعمل عادةً بلا جمع: die Empathie.",
        ar=["التعاطف (التقمّص الوجداني)"], wordClass="noun", phoneticRisks=["vowel-long-short"],
        grammarRisks=["needs-ein"], wordFamily=[], kollocation=("die Empathie zeigen", "يُظهر التعاطف", "zeigen"),
        sample=("Die Empathie hilft.", "التعاطف يساعد.")),
    "balance": dict(de="die Balance", article="die", gender="die", plural="die Balancen",
        pluralRuleNote="اسم مؤنث على -e (die!) جمعه -n: die Balancen.",
        ar=["التوازن"], wordClass="noun", phoneticRisks=["ng-velar"],
        grammarRisks=["needs-ein"], wordFamily=[], kollocation=("die Balance halten", "يحافظ على التوازن", "halten"),
        sample=("Die Balance ist wichtig.", "التوازن مهم.")),
    "ruhepause": dict(de="die Ruhepause", article="die", gender="die", plural="die Ruhepausen",
        pluralRuleNote="اسم مؤنث على -e (die!) جمعه -n: die Ruhepausen.",
        ar=["الراحة (استراحة قصيرة)"], wordClass="noun", phoneticRisks=["vowel-long-short"],
        grammarRisks=["needs-ein"], wordFamily=["ruhe"], kollocation=("eine Ruhepause machen", "يأخذ استراحة", "machen"),
        sample=("Die Ruhepause ist gut.", "الاستراحة جيّدة.")),
    "wille": dict(de="der Wille", article="der", gender="der", plural="die Willen",
        pluralRuleNote="اسم مذكّر (der!) جمعه -n: die Willen (يُستعمل عادةً المفرد).",
        ar=["الإرادة (عزيمة الإرادة)"], wordClass="noun", phoneticRisks=["double-consonant", "w-v"],
        grammarRisks=["needs-ein"], wordFamily=["wollen"], kollocation=("den Willen haben", "يملك الإرادة", "haben"),
        sample=("Der Wille ist stark.", "الإرادة قويّة.")),
    "achtsamkeit": dict(de="die Achtsamkeit", article="die", gender="die", plural="die Achtsamkeiten",
        pluralRuleNote="اسم مؤنث على -keit (die! -keit مؤنثة دائماً!) جمعه -en: die Achtsamkeiten.",
        ar=["الانتباه الواعي (اليقظة)"], wordClass="noun", phoneticRisks=["ch-ach-laut"],
        grammarRisks=["needs-ein"], wordFamily=["achtsam"], kollocation=("die Achtsamkeit zeigen", "يُظهر الانتباه الواعي", "zeigen"),
        sample=("Die Achtsamkeit ist wichtig.", "الانتباه الواعي مهم.")),
    "achtsam": dict(de="achtsam", gender="none", plural=None, pluralRuleNote=None,
        ar=["منتبه (واعٍ مُنتبه)"], wordClass="adjective", phoneticRisks=["ch-ach-laut"],
        grammarRisks=[], wordFamily=["achtsamkeit"], kollocation=None,
        sample=("Wir sind achtsam.", "نحن منتبهون.")),
    "selbstwert": dict(de="der Selbstwert", article="der", gender="der", plural="-",
        pluralRuleNote="مركّب مذكّر (der!) ويُستعمل عادةً بلا جمع: der Selbstwert.",
        ar=["تقدير الذات (قيمة الذات)"], wordClass="noun", phoneticRisks=["auslaut-b", "w-v"],
        grammarRisks=["needs-ein"], wordFamily=["wert"], kollocation=("der Selbstwert haben", "يملك تقدير الذات", "haben"),
        sample=("Der Selbstwert ist wichtig.", "تقدير الذات مهم.")),
}

DAYS = {
    "b2-u7-d1": dict(inter=["behandlung", "vorsorge", "diagnose"], words=["psyche", "bewusstsein", "trost"],
        slug="die-psyche", title_de="Die Psyche", title_ar="النفس",
        line1=("mueller", "Die Psyche ist wichtig, das Bewusstsein ist klar und der Trost hilft!", "النفس والوعي"),
        lines_rest=[
            ("yusuf", "Was ist die Psyche?", "استفسار"),
            ("mueller", "Die Psyche ist das Innere bei jedem Menschen.", "تعريف"),
            ("yusuf", "Und das Bewusstsein?", "استفسار"),
            ("mueller", "Bewusstsein heißt: wissen, was man denkt und tut.", "تفسير"),
            ("yusuf", "Und der Trost?", "استفسار"),
            ("mueller", "Der Trost hilft in schwierigen Zeiten.", "مبدأ"),
            ("yusuf", "Gut. Ich beginne heute.", "إغلاق")],
        ziel_ar="الوحدة 7 (النفس والصحة!): اليوم الأول: النفس والوعي والمواساة!",
        canDo=["يتحدّث عن النفس والوعي! (die Psyche! das Bewusstsein!)", "يصف المواساة! (der Trost hilft!)"],
        warmup=["behandlung", "vorsorge"],
        pretest=[("«النفس مهمّة.»؟", "psyche"), ("«المواساة تساعد.»؟", "trost")],
        task_goal_de="Psyche, Bewusstsein, Trost: Wir kümmern uns um die Psyche!",
        task_goal_ar="اليوم الأول من الوحدة 7! (النفس! الوعي! المواساة!)",
        task_sit_de="Psyche, Bewusstsein, Trost — zusammen lernen.",
        task_sit_ar="نفس! وعي! مواساة! — نتعلّم معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Psyche (die! -e!) وdas Bewusstsein أجنسي (das! -nis!) وder Trost (der! بلا جمع!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: Trost finden! die Psyche zeigen!"],
        gap_extra=[("Der ___ ist das Innere.", "Gedanke"), ("Wir ___ jeden Tag.", "achten"), ("Das ___ ist gut.", "Gefühl")],
        hunt_extra=[("~~Wir achten die psyche.~~", "Wir achten die Psyche.", "الخطأ في «psyche»! الصواب «Psyche» — راجع القاعدة."),
            ("~~das Gefühl haben ist gut.~~", "Das Gefühl haben ist gut.", "الخطأ في الحرف الكبير! «Das Gefühl» في أول الجملة."),
            ("~~der Gefühl ist gut.~~", "Das Gefühl ist gut.", "das Gefühl (das! ge-... das!) لا der Gefühl!")],
        speak_extra=["bewusstsein", "gefuehl", "psyche"],
        warn=[("die Psyche!", "~~der Psyche ist wichtig.~~", "die Psyche!", "Die Psyche ist wichtig.", "___ Psyche ist wichtig.", "die",
               "العربية: «النفس» مذكّر! والألمانية: die Psyche (die! -e مؤنثة!) (خريطة التداخل 10-ي!)"),
              ("das Bewusstsein!", "~~die Bewusstsein ist klar.~~", "das Bewusstsein!", "Das Bewusstsein ist klar.", "___ Bewusstsein ist klar.", "das",
               "الألمانية: das Bewusstsein (das! -nis محايد!) — والجمع: بلا جمع. (خريطة التداخل 10-ي!)"),
              ("die Trost!", "~~die Trost hilft.~~", "der Trost!", "Der Trost hilft.", "___ Trost hilft.", "der",
               "العربية: «المواساة» مؤنث! والألمانية: der Trost (der!) (خريطة التداخل 10-ي!)")]),
    "b2-u7-d2": dict(inter=["ernaehrung", "entspannung", "pflege"], words=["druck", "anspannung", "ueberlastung"],
        slug="druck-und-anspannung", title_de="Druck und Anspannung", title_ar="الضغط والتوتر",
        line1=("lena", "Der Druck ist groß, die Anspannung ist schlimm und die Überlastung ist ein Problem!", "الضغط والتوتر"),
        lines_rest=[
            ("yusuf", "Heute habe ich viel Druck.", "مشاركة"),
            ("lena", "Druck ist normal. Aber die Anspannung?", "اهتمام"),
            ("yusuf", "Die Anspannung ist auch da.", "إجابة"),
            ("lena", "Und die Überlastung? Die ist gefährlich.", "تحذير"),
            ("yusuf", "Was hilft dagegen?", "استفسار"),
            ("lena", "Eine Ruhepause. Und wieder atmen.", "نصيحة"),
            ("yusuf", "Gut. Ich mache jetzt eine Ruhepause.", "إغلاق")],
        ziel_ar="اليوم الثاني: الضغط والتوتر والحمل الزائد!",
        canDo=["يصف الضغط والتوتر! (der Druck! die Anspannung!)", "يتحذّر من الحمل الزائد! (die Überlastung!)"],
        warmup=["psyche", "bewusstsein"],
        pretest=[("«الضغط كبير.»؟", "druck"), ("«التوتر سيّئ.»؟", "anspannung")],
        task_goal_de="Druck, Anspannung, Überlastung: Wir reden über den Stress!",
        task_goal_ar="اليوم الثاني! (الضغط! التوتر! الحمل الزائد!)",
        task_sit_de="Druck, Anspannung, Überlastung — zusammen reden.",
        task_sit_ar="ضغط! توتر! حمل زائد! — نتحدّث معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "der Druck (der! جمعه die Drücke!) وdie Anspannung/die Überlastung (-ung مؤنثة دائماً!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: Druck haben! die Anspannung haben!"],
        gap_extra=[("Die ___ ist schlimm.", "Anspannung"), ("Der ___ ist groß.", "Druck"), ("Wir machen eine ___.", "Ruhepause")],
        hunt_extra=[("~~die Druck ist groß.~~", "Der Druck ist groß.", "der Druck (der!) لا die Druck!"),
            ("~~Der Überlastung ist ein Problem.~~", "Die Überlastung ist ein Problem.", "die Überlastung (die! -ung مؤنثة!)!"),
            ("~~Die Anspannungen ist schlimm.~~", "Die Anspannung ist schlimm.", "المفرد die Anspannung مع ist (الجمع die Anspannungen مع sind!)!")],
        speak_extra=["druck", "anspannung", "ueberlastung"],
        warn=[("die Druck!", "~~die Druck ist groß.~~", "der Druck!", "Der Druck ist groß.", "___ Druck ist groß.", "der",
               "العربية: «الضغط» مؤنث! والألمانية: der Druck (der!) (خريطة التداخل 10-ي!)"),
              ("das Anspannung!", "~~das Anspannung ist schlimm.~~", "die Anspannung!", "Die Anspannung ist schlimm.", "___ Anspannung ist schlimm.", "die",
               "الألمانية: die Anspannung (die! -ung مؤنثة دائماً!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
              ("die Überlastung!", "~~der Überlastung ist ein Problem.~~", "die Überlastung!", "Die Überlastung ist ein Problem.", "___ Überlastung ist ein Problem.", "die",
               "-ung مؤنثة دائماً! die Überlastung (خريطة التداخل 10-ي!)")]),
    "b2-u7-d3": dict(inter=["operation", "heilung", "symptom"], words=["bewaeltigung", "ausdauer", "resilienz"],
        slug="bewaeltigung-und-ausdauer", title_de="Bewältigung und Ausdauer", title_ar="المواجهة والمثابرة",
        line1=("mueller", "Die Bewältigung geht, die Ausdauer ist stark und die Resilienz hilft!", "المواجهة والمثابرة"),
        lines_rest=[
            ("yusuf", "Die Probleme sind groß.", "مشاركة"),
            ("mueller", "Aber die Bewältigung geht immer.", "تشجيع"),
            ("yusuf", "Wie? Ich bin müde.", "شكوى"),
            ("mueller", "Mit Ausdauer. Stück für Stück.", "نصيحة"),
            ("yusuf", "Und die Resilienz?", "استفسار"),
            ("mueller", "Die Resilienz hilft dir nach schwierigen Zeiten.", "تفسير"),
            ("yusuf", "Also: Ausdauer und Resilienz.", "تلخيص"),
            ("mueller", "Genau. Du schaffst das!", "إغلاق")],
        ziel_ar="اليوم الثالث: المواجهة والمثابرة والصلابة النفسية!",
        canDo=["يصف المواجهة والمثابرة! (die Bewältigung! die Ausdauer!)", "يتحدث عن الصلابة النفسية! (die Resilienz!)"],
        warmup=["druck", "anspannung"],
        pretest=[("«المواجهة ممكنة.»؟", "bewaeltigung"), ("«المثابرة قويّة.»؟", "ausdauer")],
        task_goal_de="Bewältigung, Ausdauer, Resilienz: Wir bleiben stark!",
        task_goal_ar="اليوم الثالث! (المواجهة! المثابرة! الصلابة النفسية!)",
        task_sit_de="Bewältigung, Ausdauer, Resilienz — zusammen stark sein.",
        task_sit_ar="مواجهة! مثابرة! صلابة! — نبقى أقوياء معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Bewältigung (-ung مؤنثة!) وdie Ausdauer/die Resilienz بلا جمع!",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: die Ausdauer haben! die Resilienz zeigen!"],
        gap_extra=[("Die ___ geht.", "Bewältigung"), ("Die ___ ist stark.", "Ausdauer"), ("Die ___ hilft.", "Resilienz")],
        hunt_extra=[("~~der Bewältigung geht.~~", "Die Bewältigung geht.", "die Bewältigung (die! -ung مؤنثة!)!"),
            ("~~die Resilienzen sind stark.~~", "Die Resilienz ist stark.", "die Resilienz عادةً بلا جمع! المفرد مع ist."),
            ("~~Das Ausdauer ist stark.~~", "Die Ausdauer ist stark.", "die Ausdauer (die!) لا das Ausdauer!")],
        speak_extra=["bewaeltigung", "ausdauer", "resilienz"],
        warn=[("der Bewältigung!", "~~der Bewältigung geht.~~", "die Bewältigung!", "Die Bewältigung geht.", "___ Bewältigung geht.", "die",
               "-ung مؤنثة دائماً! die Bewältigung (خريطة التداخل 10-ي!)"),
              ("das Ausdauer!", "~~das Ausdauer ist stark.~~", "die Ausdauer!", "Die Ausdauer ist stark.", "___ Ausdauer ist stark.", "die",
               "العربية: «المثابرة» محايد بالمعنى! والألمانية: die Ausdauer (die!) (خريطة التداخل 10-ي!)"),
              ("die Resilienz جمعها Resilienzen!", "~~die Resilienzen sind stark.~~", "die Resilienz بلا جمع!", "Die Resilienz ist stark.", "Die ___ ist stark.", "Resilienz",
               "die Resilienz تُستعمل عادةً بلا جمع — لا تجمعها! (خريطة التداخل 10-ي!)")]),
    "b2-u7-d4": dict(inter=["hygiene", "ansteckung", "immunsystem"], words=["nerv", "reiz", "empathie"],
        slug="nerv-und-empathie", title_de="Nerv und Empathie", title_ar="العصب والتعاطف",
        line1=("lena", "Die Nerven sind wichtig, der Reiz ist groß und die Empathie hilft!", "العصب والتعاطف"),
        lines_rest=[
            ("yusuf", "Meine Nerven sind heute schwach.", "مشاركة"),
            ("lena", "Zu viel Reiz?", "استفسار"),
            ("yusuf", "Ja. Lärm, Arbeit, alles zusammen.", "إجابة"),
            ("lena", "Dann brauchst du Empathie — für dich selbst.", "نصيحة"),
            ("yusuf", "Empathie für mich?", "تعجّب"),
            ("lena", "Ja. Verstehen, was du fühlst. Und Ruhe.", "تفسير"),
            ("yusuf", "Gut. Ich versuche das.", "إغلاق")],
        ziel_ar="اليوم الرابع: الأعصاب والمحفّزات والتعاطف!",
        canDo=["يتحدث عن الأعصاب والمحفّزات! (die Nerven! der Reiz!)", "يصف التعاطف! (die Empathie!)"],
        warmup=["bewaeltigung", "ausdauer"],
        pretest=[("«الأعصاب مهمّة.»؟", "nerv"), ("«التعاطف يساعد.»؟", "empathie")],
        task_goal_de="Nerv, Reiz, Empathie: Wir verstehen uns selbst!",
        task_goal_ar="اليوم الرابع! (الأعصاب! المحفّزات! التعاطف!)",
        task_sit_de="Nerv, Reiz, Empathie — zusammen verstehen.",
        task_sit_ar="عصب! محفّز! تعاطف! — نفهم بعضنا معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "der Nerv (der! جمعه die Nerven!) وder Reiz (der! die Reize!) وdie Empathie (die! بلا جمع!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: die Nerven haben! die Empathie zeigen!"],
        gap_extra=[("Die ___ sind wichtig.", "Nerven"), ("Der ___ ist groß.", "Reiz"), ("Die ___ hilft.", "Empathie")],
        hunt_extra=[("~~das Nerv ist wichtig.~~", "Der Nerv ist wichtig.", "der Nerv (der!) لا das Nerv!"),
            ("~~die Reiz ist groß.~~", "Der Reiz ist groß.", "der Reiz (der!) لا die Reiz!"),
            ("~~Die Empathien sind wichtig.~~", "Die Empathie ist wichtig.", "die Empathie عادةً بلا جمع! المفرد مع ist.")],
        speak_extra=["nerv", "reiz", "empathie"],
        warn=[("die Nerv!", "~~die Nerv ist wichtig.~~", "der Nerv!", "Der Nerv ist wichtig.", "___ Nerv ist wichtig.", "der",
               "العربية: «العصب» مؤنث! والألمانية: der Nerv (der!) (خريطة التداخل 10-ي!)"),
              ("das Reiz!", "~~das Reiz ist groß.~~", "der Reiz!", "Der Reiz ist groß.", "___ Reiz ist groß.", "der",
               "الألمانية: der Reiz (der!) — والجمع: die Reize (لا umlaut!) (خريطة التداخل 10-ي!)"),
              ("die Empathie جمعها Empathien!", "~~die Empathien sind wichtig.~~", "die Empathie بلا جمع!", "Die Empathie ist wichtig.", "Die ___ ist wichtig.", "Empathie",
               "die Empathie تُستعمل عادةً بلا جمع — المفرد مع ist. (خريطة التداخل 10-ي!)")]),
    "b2-u7-d5": dict(inter=["belastung", "genesung", "nahrungsmittel"], words=["balance", "ruhepause", "wille"],
        slug="balance-und-wille", title_de="Balance und Wille", title_ar="التوازن والإرادة",
        line1=("yusuf", "Die Balance ist wichtig, die Ruhepause ist gut und der Wille ist stark!", "التوازن والإرادة"),
        lines_rest=[
            ("lena", "Wie ist deine Balance?", "اهتمام"),
            ("yusuf", "Heute gut. Ich habe eine Ruhepause gemacht.", "إجابة"),
            ("lena", "Sehr gut! Und der Wille?", "استفسار"),
            ("yusuf", "Der Wille ist da.", "إجابة"),
            ("lena", "Balance heißt: Arbeit und Ruhe zusammen.", "مبدأ"),
            ("yusuf", "Nicht nur Arbeit. Auch die Ruhepause.", "تلخيص"),
            ("lena", "Genau. Mit Willen und Balance.", "إغلاق")],
        ziel_ar="اليوم الخامس: التوازن والاستراحة والإرادة!",
        canDo=["يصف التوازن والراحة! (die Balance! die Ruhepause!)", "يتحدث عن الإرادة! (der Wille ist stark!)"],
        warmup=["nerv", "reiz"],
        pretest=[("«التوازن مهم.»؟", "balance"), ("«الإرادة قويّة.»؟", "wille")],
        task_goal_de="Balance, Ruhepause, Wille: Wir finden die Mitte!",
        task_goal_ar="اليوم الخامس! (التوازن! الاستراحة! الإرادة!)",
        task_sit_de="Balance, Ruhepause, Wille — zusammen lernen.",
        task_sit_ar="توازن! استراحة! إرادة! — نتعلّم معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Balance (die! -e!) وdie Ruhepause (die! die Ruhepausen!) وder Wille (der! die Willen!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: die Balance halten! den Willen haben!"],
        gap_extra=[("Die ___ ist wichtig.", "Balance"), ("Die ___ ist gut.", "Ruhepause"), ("Das ___ ist wichtig.", "Wohlbefinden")],
        hunt_extra=[("~~der Balance ist wichtig.~~", "Die Balance ist wichtig.", "die Balance (die! -e مؤنثة!)!"),
            ("~~die Ruhepause machen ist gut.~~", "Eine Ruhepause machen ist gut.", "«eine Ruhepause machen» بالأداة eine!"),
            ("~~das Wohlbefinden sind wichtig.~~", "Das Wohlbefinden ist wichtig.", "das Wohlbefinden (das! بلا جمع!) مع ist!")],
        speak_extra=["balance", "ruhepause", "wohlbefinden"],
        warn=[("der Balance!", "~~der Balance ist wichtig.~~", "die Balance!", "Die Balance ist wichtig.", "___ Balance ist wichtig.", "die",
               "العربية: «التوازن» مذكّر! والألمانية: die Balance (die!) (خريطة التداخل 10-ي!)"),
              ("das Ruhepause!", "~~das Ruhepause ist gut.~~", "die Ruhepause!", "Die Ruhepause ist gut.", "___ Ruhepause ist gut.", "die",
               "الألمانية: die Ruhepause (die! -e مؤنثة!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
              ("die Wille!", "~~die Wille ist stark.~~", "der Wille!", "Der Wille ist stark.", "___ Wille ist stark.", "der",
               "العربية: «الإرادة» مؤنث! والألمانية: der Wille (der!) (خريطة التداخل 10-ي!)")]),
    "b2-u7-d6": dict(inter=["aktivitaet", "erschoepfung", "gesundheitswesen"], words=["achtsamkeit", "achtsam", "selbstwert"],
        slug="achtsamkeit-und-selbstwert", title_de="Achtsamkeit und Selbstwert", title_ar="الانتباه الواعي وتقدير الذات",
        line1=("mueller", "Die Achtsamkeit ist wichtig, achtsam sein ist gut und der Selbstwert hilft!", "الانتباه الواعي"),
        lines_rest=[
            ("yusuf", "Was ist Achtsamkeit genau?", "استفسار"),
            ("mueller", "Achtsam sein: hier und jetzt leben.", "تعريف"),
            ("yusuf", "Und der Selbstwert?", "استفسار"),
            ("mueller", "Der Selbstwert heißt: an sich selbst glauben.", "تفسير"),
            ("yusuf", "Achtsamkeit und Selbstwert zusammen.", "تلخيص"),
            ("mueller", "Ja. Das ist die Gesundheit der Psyche.", "خلاصة"),
            ("yusuf", "Danke! Die ganze Woche war stark.", "إغلاق")],
        ziel_ar="اليوم الأخير من الوحدة 7! الانتباه الواعي وتقدير الذات!",
        canDo=["يصف الانتباه الواعي! (die Achtsamkeit! achtsam sein!)", "يتحدث عن تقدير الذات! (der Selbstwert!)"],
        warmup=["balance", "wohlbefinden"],
        pretest=[("«الانتباه الواعي مهم.»؟", "achtsamkeit"), ("«تقدير الذات مهم.»؟", "selbstwert")],
        task_goal_de="Achtsamkeit, achtsam sein, Selbstwert: Die Woche der Psyche!",
        task_goal_ar="اليوم الأخير! (الانتباه الواعي! تقدير الذات!)",
        task_sit_de="Achtsamkeit und Selbstwert — zusammen die Woche schließen.",
        task_sit_ar="انتباه واعٍ وتقدير ذات! — نُغلق الأسبوع معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Achtsamkeit (-keit مؤنثة دائماً!) وachtsam (صفة!) وder Selbstwert (der! بلا جمع!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: achtsam sein! der Selbstwert haben!"],
        gap_extra=[("Die ___ ist wichtig.", "Achtsamkeit"), ("Wir sind ___.", "achtsam"), ("Der ___ ist wichtig.", "Selbstwert")],
        hunt_extra=[("~~das Achtsamkeit ist wichtig.~~", "Die Achtsamkeit ist wichtig.", "die Achtsamkeit (die! -keit مؤنثة!)!"),
            ("~~Wir sind achtsamkeit.~~", "Wir sind achtsam.", "achtsam صفة! achtsamkeit اسم!"),
            ("~~der Selbstwert haben ist gut.~~", "Der Selbstwert haben ist gut.", "«der Selbstwert haben» بالأداة der!")],
        speak_extra=["achtsamkeit", "achtsam", "selbstwert"],
        warn=[("das Achtsamkeit!", "~~das Achtsamkeit ist wichtig.~~", "die Achtsamkeit!", "Die Achtsamkeit ist wichtig.", "___ Achtsamkeit ist wichtig.", "die",
               "-keit مؤنثة دائماً! die Achtsamkeit (خريطة التداخل 10-ي!)"),
              ("achtsamkeit statt achtsam!", "~~Wir sind achtsamkeit.~~", "achtsam!", "Wir sind achtsam.", "Wir sind ___.", "achtsam",
               "achtsam صفة (منتبه) وachtsamkeit اسم (الانتباه)! لا تخلطهما! (خريطة التداخل 10-ي!)"),
              ("die Selbstwert!", "~~die Selbstwert ist wichtig.~~", "der Selbstwert!", "Der Selbstwert ist wichtig.", "___ Selbstwert ist wichtig.", "der",
               "العربية: «تقدير الذات» محايد! والألمانية: der Selbstwert (der!) (خريطة التداخل 10-ي!)")]),
}

UNIT_NAME = "الوحدة 7 (النفس والصحة!)"


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
        doc["unit"] = 7
        doc["goetheList"] = []
        doc["thema"] = "Psyche"
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
                {"id": f"b2u7d{lid[-1]}-l{i+1}", "speaker": sp, "text": tx, "direction": dr}
                for i, (sp, tx, dr) in enumerate(lines)
            ],
        }
        (SCRIPTS / f"{lid}-{v['slug']}.json").write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"dialogues: {len(DAYS)}")


def build_lessons():
    tpl = json.loads((ROOT / "content/lessons/b2/b2-u6-d1.json").read_text(encoding="utf-8"))
    for lid, v in DAYS.items():
        words = v["words"]
        d = json.loads(json.dumps(tpl))
        d["id"] = lid
        d["level"] = "B2"
        d["unit"] = 7
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
            "storySentenceIds": [f"story-b2-u7-s{d['day']}"],
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
                     {"q": f"تحدّث عن {WORDS[words[1]]['ar'][0]}! (جملتان!)", "a": f"{WORDS[words[1]]['sample'][0]} Das ist gut.", "why": f"{WORDS[words[1]]['ar'][0]}!"},
                     {"q": f"تحدّث عن {WORDS[words[2]]['ar'][0]}! (جملتان!)", "a": f"{WORDS[words[2]]['sample'][0]} {WORDS[words[2]]['de']} hilft.", "why": f"{WORDS[words[2]]['ar'][0]}!"},
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
                      "why": f"الخطأ في «{form[0].lower() + form[1:]}»! الصواب «{form}» — راجع القاعدة ({wdoc['ar'][0]})."} )
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
    return f"{w0['sample'][0]} {w1['sample'][0]} {w2['sample'][0]} Die Woche der Psyche ist gut."


def build_story():
    s = json.loads(STORY.read_text(encoding="utf-8"))
    for lid, v in DAYS.items():
        d = int(lid[-1])
        s["sentences"].append({
            "id": f"story-b2-u7-s{d}", "lessonId": lid,
            "scriptId": f"{lid}-{v['slug']}", "lineId": f"b2u7d{d}-l1",
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
                phrases.append({"de": kol[0], "whyAr": f"المفردة الثابتة ليوم {lid}! (D585)"})
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
    """صوت الكلمات الـ18 — الجديد فقط (القديم لا يُمس أبداً — D251/D578) + قياسات make_clip."""
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
                m = ga.make_clip(text, out)  # قياس فقط إن وُجد — لكن ملفاتنا جديدة أصلاً
            assert m["durationMs"] <= 1500, f"{tid} أطول من 1.5s: {m['durationMs']}ms"
            manifest["tracks"].append({
                "id": tid, "file": rel, "role": "word", "isGuest": False,
                "voiceParams": {"speaker": ga.VOICE_ID, "speedWpm": 110},
                "textDe": text, "priority": "P2", "lessonRefs": [next(d for d, v in DAYS.items() if wid in v["words"])], **m,
            })
            added += 1
    mpath.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"word audio: +{added} (القديم لم يُمس)")


if __name__ == "__main__":
    build_words()
    build_dialogues()
    build_lessons()
    build_story()
    build_upgrades()
    patch_arsenal()
    build_audio()
    print("B2-U7 generated. Next: npx tsx tools/dialogue-splitter.ts --all")
