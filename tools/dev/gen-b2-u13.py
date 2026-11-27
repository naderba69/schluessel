# -*- coding: utf-8 -*-
"""D594 · بناء b2-u13 «وحدة التكثيف والامتحان» (الدستور §3-ج: B2 = 12 وحدة + 3 أسابيع تكثيف/امتحان!) — 6 دروس × 3 كلمات.
وحدة التثبيت/الامتحان المفقودة (N-374 · N-375 — المذكورة في «واصل الانتاج»)! على نهج b1-u13/u14 (الامتحان) وa2-u14 (أسبوع المراجعة).
يكتب: كلمات + حوارات (audio-scripts) + دروس + قصة + خطة الترقية + usedInLessons.
الصوت: كلمات (build_audio — الجديد فقط «القديم لم يُمس» D251/D578!) ثم npx tsx tools/dialogue-splitter.ts --all (تدريجي!)."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
W = ROOT / "content/words"
LESSONS = ROOT / "content/lessons/b2"
SCRIPTS = ROOT / "content/audio-scripts"
UPGRADES = ROOT / "content/upgrades/b2-lesson-upgrade.json"
STORY = ROOT / "content/story/b2.json"

# ── الكلمات الثمانية عشر (3/يوم) — التكثيف والامتحان ─────────────────────────
WORDS = {
    "lernplan": dict(de="der Lernplan", article="der", gender="der", plural="die Lernpläne",
        pluralRuleNote="مركّب مذكّر (der! Lern+Plan) جمعه مع umlaut: die Lernpläne.",
        ar=["خطة التعلّم"], wordClass="noun", phoneticRisks=["r-uvular", "sp-st-initial"],
        grammarRisks=["needs-ein"], wordFamily=["lernen"], kollocation=("einen Lernplan machen", "يضع خطة تعلّم", "machen"),
        sample=("Der Lernplan ist klar.", "خطة التعلّم واضحة.")),
    "fertigkeit": dict(de="die Fertigkeit", article="die", gender="die", plural="die Fertigkeiten",
        pluralRuleNote="اسم مؤنث على -keit (die!) جمعه -en: die Fertigkeiten.",
        ar=["المهارة"], wordClass="noun", phoneticRisks=["v-f", "r-uvular"],
        grammarRisks=["needs-ein"], wordFamily=["fertig"], kollocation=("eine Fertigkeit üben", "يتمرّن على مهارة", "üben"),
        sample=("Die Fertigkeit ist wichtig.", "المهارة مهمة.")),
    "selbstkontrolle": dict(de="die Selbstkontrolle", article="die", gender="die", plural="die Selbstkontrollen",
        pluralRuleNote="مركّبة مؤنثة (die! Selbst+Kontrolle على -e) جمعها die Selbstkontrollen.",
        ar=["ضبط النفس (المراقبة الذاتية)"], wordClass="noun", phoneticRisks=["double-consonant", "z"],
        grammarRisks=["needs-ein"], wordFamily=["kontrollieren"], kollocation=("Selbstkontrolle zeigen", "يُظهر ضبط النفس", "zeigen"),
        sample=("Die Selbstkontrolle hilft.", "ضبط النفس يساعد.")),
    "pruefungssimulation": dict(de="die Prüfungssimulation", article="die", gender="die", plural="die Prüfungssimulationen",
        pluralRuleNote="مركّبة مؤنثة (die! Prüfungs+Simulation) جمعها die Prüfungssimulationen.",
        ar=["محاكاة الامتحان"], wordClass="noun", phoneticRisks=["umlaut-u", "double-consonant", "vowel-long-short"],
        grammarRisks=["needs-ein"], wordFamily=["pruefung", "simulieren"], kollocation=("eine Prüfungssimulation machen", "يجري محاكاة الامتحان", "machen"),
        sample=("Die Prüfungssimulation ist wichtig.", "محاكاة الامتحان مهمة.")),
    "gewichtung": dict(de="die Gewichtung", article="die", gender="die", plural="die Gewichtungen",
        pluralRuleNote="اسم مؤنث على -ung (die! -ung مؤنثة دائماً!) جمعه -en: die Gewichtungen.",
        ar=["التوزيع (الوزن النسبي)"], wordClass="noun", phoneticRisks=["ch-ach-laut", "ng-velar", "w-v"],
        grammarRisks=["needs-ein"], wordFamily=["gewichten"], kollocation=("die Gewichtung kennen", "يعرف الوزن النسبي", "kennen"),
        sample=("Die Gewichtung ist klar.", "التوزيع واضح.")),
    "zeitfenster": dict(de="das Zeitfenster", article="das", gender="das", plural="die Zeitfenster",
        pluralRuleNote="مركّب محايد (das! Zeit+Fenster) جمعه die Zeitfenster (بلا تغيير!).",
        ar=["النافذة الزمنية (المدة)"], wordClass="noun", phoneticRisks=["z", "v-f"],
        grammarRisks=["needs-ein"], wordFamily=["zeit"], kollocation=("das Zeitfenster haben", "يملك مدة كافية", "haben"),
        sample=("Das Zeitfenster ist kurz.", "المدة قصيرة.")),
    "pruefungsangst": dict(de="die Prüfungsangst", article="die", gender="die", plural="die Prüfungsängste",
        pluralRuleNote="مركّبة مؤنثة (die! Prüfungs+Angst) جمعها مع umlaut: die Prüfungsängste.",
        ar=["قلق الامتحان"], wordClass="noun", phoneticRisks=["umlaut-a", "ng-velar"],
        grammarRisks=["needs-ein"], wordFamily=["angst"], kollocation=("Prüfungsangst haben", "يكون قلقاً من الامتحان", "haben"),
        sample=("Die Prüfungsangst ist groß.", "قلق الامتحان كبير.")),
    "gelassenheit": dict(de="die Gelassenheit", article="die", gender="die", plural="die Gelassenheiten",
        pluralRuleNote="اسم مؤنث على -heit (die!) جمعه -en (نادر): die Gelassenheiten.",
        ar=["الطمأنينة (رباطة الجأش)"], wordClass="noun", phoneticRisks=["double-consonant"],
        grammarRisks=["needs-ein"], wordFamily=["gelassen"], kollocation=("Gelassenheit bewahren", "يحفظ هدوءه", "bewahren"),
        sample=("Die Gelassenheit hilft.", "الطمأنينة تساعد.")),
    "zuversicht": dict(de="die Zuversicht", article="die", gender="die", plural="die Zuversichten",
        pluralRuleNote="مركّبة مؤنثة (die! Zu+versicht) جمعها die Zuversichten (نادر).",
        ar=["الثقة المتفائلة (اليقين)"], wordClass="noun", phoneticRisks=["v-f", "ch-ich-laut", "z"],
        grammarRisks=["needs-ein"], wordFamily=["sicht"], kollocation=("Zuversicht haben", "يكون واثقاً متفائلاً", "haben"),
        sample=("Die Zuversicht ist stark.", "الثقة المتفائلة قوية.")),
    "loesungsweg": dict(de="der Lösungsweg", article="der", gender="der", plural="die Lösungswege",
        pluralRuleNote="مركّب مذكّر (der! Lösungs+Weg) جمعه die Lösungswege.",
        ar=["مسار الحلّ"], wordClass="noun", phoneticRisks=["ng-velar", "w-v"],
        grammarRisks=["needs-ein"], wordFamily=["loesung", "weg"], kollocation=("den Lösungsweg finden", "يجد مسار الحلّ", "finden"),
        sample=("Der Lösungsweg ist klar.", "مسار الحلّ واضح.")),
    "skizze": dict(de="die Skizze", article="die", gender="die", plural="die Skizzen",
        pluralRuleNote="اسم مؤنث على -e (die!) جمعه -n: die Skizzen — قرض إيطالي.",
        ar=["المسودّة (الرسم التخطيطي)"], wordClass="noun", phoneticRisks=["z", "double-consonant"],
        grammarRisks=["needs-ein"], wordFamily=[], kollocation=("eine Skizze machen", "يرسم مسودّة", "machen"),
        sample=("Die Skizze ist kurz.", "المسودّة قصيرة.")),
    "fehlersuche": dict(de="die Fehlersuche", article="die", gender="die", plural="die Fehlersuchen",
        pluralRuleNote="مركّبة مؤنثة (die! Fehler+Suche) جمعها die Fehlersuchen (نادر).",
        ar=["البحث عن الأخطاء"], wordClass="noun", phoneticRisks=["ch-ach-laut", "v-f"],
        grammarRisks=["needs-ein"], wordFamily=["fehler", "suchen"], kollocation=("die Fehlersuche machen", "يبحث عن الأخطاء", "machen"),
        sample=("Die Fehlersuche ist wichtig.", "البحث عن الأخطاء مهم.")),
    "glaubwuerdigkeit": dict(de="die Glaubwürdigkeit", article="die", gender="die", plural="die Glaubwürdigkeiten",
        pluralRuleNote="اسم مؤنث على -keit (die!) جمعه -en (نادر): die Glaubwürdigkeiten.",
        ar=["المصداقية (الجدير بالتصديق)"], wordClass="noun", phoneticRisks=["umlaut-u", "w-v", "auslaut-b"],
        grammarRisks=["needs-ein"], wordFamily=["glaubwuerdig"], kollocation=("die Glaubwürdigkeit prüfen", "يتحقق من المصداقية", "pruefen"),
        sample=("Die Glaubwürdigkeit ist wichtig.", "المصداقية مهمة.")),
    "korrektur": dict(de="die Korrektur", article="die", gender="die", plural="die Korrekturen",
        pluralRuleNote="اسم مؤنث على -ur (die!) جمعه -en: die Korrekturen — قرض لاتيني.",
        ar=["التصحيح"], wordClass="noun", phoneticRisks=["r-uvular", "double-consonant"],
        grammarRisks=["needs-ein"], wordFamily=["korrigieren"], kollocation=("die Korrektur machen", "يقوم بالتصحيح", "machen"),
        sample=("Die Korrektur ist fertig.", "التصحيح جاهز.")),
    "durchgang": dict(de="der Durchgang", article="der", gender="der", plural="die Durchgänge",
        pluralRuleNote="مركّب مذكّر (der! Durch+Gang) جمعه مع umlaut: die Durchgänge.",
        ar=["الدور (الجولة في الامتحان)"], wordClass="noun", phoneticRisks=["ch-ach-laut", "ng-velar"],
        grammarRisks=["needs-ein"], wordFamily=["durch", "gehen"], kollocation=("einen Durchgang schaffen", "يجتاز دوراً", "schaffen"),
        sample=("Der Durchgang ist vorbei.", "الدور انتهى.")),
    "selbsteinschaetzung": dict(de="die Selbsteinschätzung", article="die", gender="die", plural="die Selbsteinschätzungen",
        pluralRuleNote="مركّبة مؤنثة (die! Selbst+einschätzung على -ung!) جمعها die Selbsteinschätzungen.",
        ar=["التقييم الذاتي"], wordClass="noun", phoneticRisks=["umlaut-a", "ng-velar", "z"],
        grammarRisks=["needs-ein"], wordFamily=["einschaetzen"], kollocation=("die Selbsteinschätzung machen", "يقيّم نفسه", "machen"),
        sample=("Die Selbsteinschätzung ist gut.", "التقييم الذاتي جيد.")),
    "pruefling": dict(de="der Prüfling", article="der", gender="der", plural="die Prüflinge",
        pluralRuleNote="اسم مذكّر على -ling (der!) جمعه -e: die Prüflinge.",
        ar=["الممتحَن (المترشّح)"], wordClass="noun", phoneticRisks=["umlaut-u", "ng-velar"],
        grammarRisks=["needs-ein"], wordFamily=["pruefung"], kollocation=("der Prüfling kommt", "يأتي المترشّح", "kommen"),
        sample=("Der Prüfling ist bereit.", "المترشّح جاهز.")),
    "erwartung": dict(de="die Erwartung", article="die", gender="die", plural="die Erwartungen",
        pluralRuleNote="اسم مؤنث على -ung (die! -ung مؤنثة دائماً!) جمعه -en: die Erwartungen.",
        ar=["التوقع"], wordClass="noun", phoneticRisks=["w-v", "ng-velar", "r-uvular"],
        grammarRisks=["needs-ein"], wordFamily=["erwarten"], kollocation=("die Erwartung erfüllen", "يحقق التوقعات", "erfüllen"),
        sample=("Die Erwartung ist klar.", "التوقع واضح.")),
}

DAYS = {
    "b2-u13-d1": dict(inter=["psyche", "trost", "ausdauer"], words=["lernplan", "fertigkeit", "selbstkontrolle"],
        slug="der-lernplan", title_de="Der Lernplan", title_ar="خطة التعلّم",
        line1=("mueller", "Der Lernplan ist klar: die Fertigkeit wächst, und die Selbstkontrolle hilft!", "خطة الأسبوع"),
        lines_rest=[
            ("yusuf", "Was ist der Lernplan?", "استفسار"),
            ("mueller", "Der Lernplan zeigt: heute wiederholen, morgen üben.", "تعريف"),
            ("yusuf", "Und die Fertigkeit?", "استفسار"),
            ("mueller", "Die Fertigkeit wächst mit jeder Übung.", "تفسير"),
            ("yusuf", "Und die Selbstkontrolle?", "استفسار"),
            ("mueller", "Die Selbstkontrolle hilft beim Lernen.", "مبدأ"),
            ("yusuf", "Gut. Ich beginne heute.", "إغلاق")],
        ziel_ar="اليوم الأول: خطة التعلّم والمهارات وضبط النفس!",
        canDo=["يضع خطة تعلّم! (der Lernplan!)", "يصف المهارة وضبط النفس! (die Fertigkeit! die Selbstkontrolle!)"],
        warmup=["psyche", "trost"],
        pretest=[("«خطة التعلّم واضحة.»؟", "lernplan"), ("&المهارة مهمة.»؟", "fertigkeit")],
        task_goal_de="Lernplan, Fertigkeit, Selbstkontrolle: Wir planen die Woche!",
        task_goal_ar="اليوم الأول من الوحدة 13! (الخطة! المهارة! ضبط النفس!)",
        task_sit_de="Lernplan, Fertigkeit, Selbstkontrolle — zusammen lernen.",
        task_sit_ar="خطة! مهارة! ضبط نفس! — نتعلّم معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "der Lernplan (der! مركّب!) وdie Fertigkeit (-keit!) وdie Selbstkontrolle (die! على -e!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: einen Lernplan machen! Selbstkontrolle zeigen!"],
        gap_extra=[("Der ___ ist das Innere.", "Gedanke"), ("&Wir ___ jeden Tag.»", "achten"), ("Das ___ ist gut.", "Gefühl")],
        hunt_extra=[("~~Wir achten die lernplan.~~", "Wir achten den Lernplan.", "الخطأ في «lernplan»! الصواب «Lernplan» — راجع القاعدة."),
            ("~~der Fertigkeit ist wichtig.~~", "Die Fertigkeit ist wichtig.", "der Fertigkeit (die! -keit!) لا der Fertigkeit!")],
        speak_extra=["psyche", "trost", "ausdauer"],
        warn=[("die Lernplan!", "~~die Lernplan ist klar.~~", "der Lernplan!", "Der Lernplan ist klar.", "___ Lernplan ist klar.", "der",
               "العربية: «الخطة» مؤنثة! والألمانية: der Lernplan (der! مركّب مذكّر!) (خريطة التداخل 10-ي!)"),
              ("der Fertigkeit!", "~~der Fertigkeit ist wichtig.~~", "die Fertigkeit!", "Die Fertigkeit ist wichtig.", "___ Fertigkeit ist wichtig.", "die",
               "الألمانية: die Fertigkeit (die! -keit مؤنثة!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
              ("das Selbstkontrolle!", "~~das Selbstkontrolle hilft.~~", "die Selbstkontrolle!", "Die Selbstkontrolle hilft.", "___ Selbstkontrolle hilft.", "die",
               "العربية: «الضبط» مذكّر! والألمانية: die Selbstkontrolle (die! على -e!) (خريطة التداخل 10-ي!)")]),
    "b2-u13-d2": dict(inter=["druck", "resilienz", "wille"], words=["pruefungssimulation", "gewichtung", "zeitfenster"],
        slug="die-pruefungssimulation", title_de="Die Prüfungssimulation", title_ar="محاكاة الامتحان",
        line1=("mueller", "Die Prüfungssimulation ist heute: die Gewichtung ist klar und das Zeitfenster ist kurz!", "يوم المحاكاة"),
        lines_rest=[
            ("yusuf", "Was ist die Prüfungssimulation?", "استفسار"),
            ("mueller", "Die Prüfungssimulation ist ein Test wie die echte Prüfung.", "تعريف"),
            ("yusuf", "Und die Gewichtung?", "استفسار"),
            ("mueller", "Die Gewichtung zeigt: welcher Teil ist wichtig.", "تفسير"),
            ("yusuf", "Und das Zeitfenster?", "استفسار"),
            ("mueller", "Das Zeitfenster ist kurz — aber wir schaffen das!", "مبدأ"),
            ("yusuf", "Ich übe weiter!", "إغلاق")],
        ziel_ar="اليوم الثاني: المحاكاة والتوزيع والمدة!",
        canDo=["يجري محاكاة الامتحان! (die Prüfungssimulation!)", "يصف التوزيع والمدة! (die Gewichtung! das Zeitfenster!)"],
        warmup=["druck", "resilienz"],
        pretest=[("«محاكاة الامتحان مهمة.»؟", "pruefungssimulation"), ("&المدة قصيرة.»؟", "zeitfenster")],
        task_goal_de="Prüfungssimulation, Gewichtung, Zeitfenster: Wir üben die Prüfung!",
        task_goal_ar="اليوم الثاني من الوحدة 13! (المحاكاة! التوزيع! المدة!)",
        task_sit_de="Prüfungssimulation, Gewichtung, Zeitfenster — zusammen üben.",
        task_sit_ar="محاكاة! توزيع! مدة! — نتمرّن معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Prüfungssimulation (die! مركّبة!) وdie Gewichtung (-ung!) وdas Zeitfenster (das! مركّب!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: eine Prüfungssimulation machen! die Gewichtung kennen!"],
        gap_extra=[("Der ___ ist groß.", "Druck"), ("Die ___ ist stark.", "Resilienz"), ("Der ___ ist gut.", "Wille")],
        hunt_extra=[("~~die Gewichtung ist klar.~~", "Die Gewichtung ist klar.", "die Gewichtung (die! -ung!) لا der Gewichtung!"),
            ("~~das Zeitfenster ist kurz.~~", "Das Zeitfenster ist kurz.", "das Zeitfenster (das! مركّب محايد!) لا der Zeitfenster!")],
        speak_extra=["druck", "resilienz", "wille"],
        warn=[("der Prüfungssimulation!", "~~der Prüfungssimulation ist wichtig.~~", "die Prüfungssimulation!", "Die Prüfungssimulation ist wichtig.", "___ Prüfungssimulation ist wichtig.", "die",
               "العربية: «المحاكاة» مذكّر! والألمانية: die Prüfungssimulation (die! مركّبة!) (خريطة التداخل 10-ي!)"),
              ("das Gewichtung!", "~~das Gewichtung ist klar.~~", "die Gewichtung!", "Die Gewichtung ist klar.", "___ Gewichtung ist klar.", "die",
               "الألمانية: die Gewichtung (die! -ung مؤنثة دائماً!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
              ("der Zeitfenster!", "~~der Zeitfenster ist kurz.~~", "das Zeitfenster!", "Das Zeitfenster ist kurz.", "___ Zeitfenster ist kurz.", "das",
               "العربية: «النافذة» مؤنثة! والألمانية: das Zeitfenster (das! مركّب محايد!) (خريطة التداخل 10-ي!)")]),
    "b2-u13-d3": dict(inter=["bewaeltigung", "balance", "ruhepause"], words=["pruefungsangst", "gelassenheit", "zuversicht"],
        slug="die-pruefungsangst", title_de="Die Prüfungsangst", title_ar="قلق الامتحان",
        line1=("lena", "Die Prüfungsangst ist weg: die Gelassenheit bleibt und die Zuversicht wächst!", "الأعصاب"),
        lines_rest=[
            ("yusuf", "Ich habe Prüfungsangst.", "شكوى"),
            ("lena", "Das ist normal. Die Gelassenheit hilft.", "مواساة"),
            ("yusuf", "Wie finde ich Gelassenheit?", "استفسار"),
            ("lena", "Atmen Sie tief — und denken Sie positiv.", "نصيحة"),
            ("yusuf", "Und die Zuversicht?", "استفسار"),
            ("lena", "Die Zuversicht wächst jeden Tag.", "مبدأ"),
            ("yusuf", "Danke! Das hilft.", "إغلاق")],
        ziel_ar="اليوم الثالث: القلق والطمأنينة والثقة!",
        canDo=["يعبّر عن قلق الامتحان! (die Prüfungsangst!)", "يصف الطمأنينة والثقة! (die Gelassenheit! die Zuversicht!)"],
        warmup=["bewaeltigung", "balance"],
        pretest=[("«قلق الامتحان كبير.»؟", "pruefungsangst"), ("&الطمأنينة تساعد.»؟", "gelassenheit")],
        task_goal_de="Prüfungsangst, Gelassenheit, Zuversicht: Wir bleiben ruhig!",
        task_goal_ar="اليوم الثالث من الوحدة 13! (القلق! الطمأنينة! الثقة!)",
        task_sit_de="Prüfungsangst, Gelassenheit, Zuversicht — zusammen sprechen.",
        task_sit_ar="قلق! طمأنينة! ثقة! — نتحدّث معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Prüfungsangst (die! مركّبة!) وdie Gelassenheit (-heit!) وdie Zuversicht (die! مركّبة!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: Prüfungsangst haben! Gelassenheit bewahren!"],
        gap_extra=[("Die ___ geht.", "Bewältigung"), ("Die ___ ist gut.", "Balance"), ("Die ___ hilft.", "Ruhepause")],
        hunt_extra=[("~~der Prüfungsangst ist groß.~~", "Die Prüfungsangst ist groß.", "die Prüfungsangst (die! مركّبة!) لا der Prüfungsangst!"),
            ("~~das Gelassenheit hilft.~~", "Die Gelassenheit hilft.", "die Gelassenheit (die! -heit!) لا das Gelassenheit!")],
        speak_extra=["pruefungsangst", "gelassenheit", "zuversicht"],
        warn=[("der Prüfungsangst!", "~~der Prüfungsangst ist groß.~~", "die Prüfungsangst!", "Die Prüfungsangst ist groß.", "___ Prüfungsangst ist groß.", "die",
               "العربية: «القلق» مذكّر! والألمانية: die Prüfungsangst (die! مركّبة مؤنثة!) (خريطة التداخل 10-ي!)"),
              ("das Gelassenheit!", "~~das Gelassenheit hilft.~~", "die Gelassenheit!", "Die Gelassenheit hilft.", "___ Gelassenheit hilft.", "die",
               "الألمانية: die Gelassenheit (die! -heit مؤنثة!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
              ("der Zuversicht!", "~~der Zuversicht ist stark.~~", "die Zuversicht!", "Die Zuversicht ist stark.", "___ Zuversicht ist stark.", "die",
               "العربية: «اليقين» مذكّر! والألمانية: die Zuversicht (die! مركّبة!) (خريطة التداخل 10-ي!)")]),
    "b2-u13-d4": dict(inter=["behandlung", "vorsorge", "diagnose"], words=["loesungsweg", "skizze", "fehlersuche"],
        slug="der-loesungsweg", title_de="Der Lösungsweg", title_ar="مسار الحلّ",
        line1=("mueller", "Der Lösungsweg ist klar: erst die Skizze, dann die Fehlersuche!", "الاستراتيجية"),
        lines_rest=[
            ("yusuf", "Was ist der Lösungsweg?", "استفسار"),
            ("mueller", "Der Lösungsweg zeigt den Weg zur Antwort.", "تعريف"),
            ("yusuf", "Und die Skizze?", "استفسار"),
            ("mueller", "Die Skizze ist ein kleiner Entwurf.", "تفسير"),
            ("yusuf", "Und die Fehlersuche?", "استفسار"),
            ("mueller", "In der Fehlersuche finden wir die Fehler.", "مبدأ"),
            ("yusuf", "Gut. Ich beginne mit der Skizze.", "إغلاق")],
        ziel_ar="اليوم الرابع: مسار الحلّ والمسودّة والبحث عن الأخطاء!",
        canDo=["يصف مسار الحلّ! (der Lösungsweg!)", "يستعمل المسودّة والبحث عن الأخطاء! (die Skizze! die Fehlersuche!)"],
        warmup=["behandlung", "vorsorge"],
        pretest=[("«مسار الحلّ واضح.»؟", "loesungsweg"), ("&المسودّة قصيرة.»؟", "skizze")],
        task_goal_de="Lösungsweg, Skizze, Fehlersuche: Wir lösen die Aufgabe!",
        task_goal_ar="اليوم الرابع من الوحدة 13! (الحلّ! المسودّة! الأخطاء!)",
        task_sit_de="Lösungsweg, Skizze, Fehlersuche — zusammen arbeiten.",
        task_sit_ar="حلّ! مسودّة! أخطاء! — نعمل معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "der Lösungsweg (der! مركّب!) وdie Skizze (die! على -e!) وdie Fehlersuche (die! مركّبة!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: den Lösungsweg finden! die Fehlersuche machen!"],
        gap_extra=[("Die ___ ist wichtig.", "Behandlung"), ("Die ___ ist gut.", "Vorsorge"), ("Die ___ ist klar.", "Diagnose")],
        hunt_extra=[("~~die Lösungsweg ist klar.~~", "Der Lösungsweg ist klar.", "der Lösungsweg (der! مركّب!) لا die Lösungsweg!"),
            ("~~der Skizze ist kurz.~~", "Die Skizze ist kurz.", "die Skizze (die! على -e!) لا der Skizze!")],
        speak_extra=["loesungsweg", "skizze", "fehlersuche"],
        warn=[("die Lösungsweg!", "~~die Lösungsweg ist klar.~~", "der Lösungsweg!", "Der Lösungsweg ist klar.", "___ Lösungsweg ist klar.", "der",
               "العربية: «المسار» مذكّر فعلاً! لكن المركّب: der Lösungsweg (der!) — والأداة تُخطئ كثيراً هنا! (خريطة التداخل 10-ي!)"),
              ("der Skizze!", "~~der Skizze ist kurz.~~", "die Skizze!", "Die Skizze ist kurz.", "___ Skizze ist kurz.", "die",
               "العربية: «المسودّة» مذكّر! والألمانية: die Skizze (die! على -e مؤنثة!) (خريطة التداخل 10-ي!)"),
              ("das Fehlersuche!", "~~das Fehlersuche ist wichtig.~~", "die Fehlersuche!", "Die Fehlersuche ist wichtig.", "___ Fehlersuche ist wichtig.", "die",
               "الألمانية: die Fehlersuche (die! مركّبة مؤنثة!) — لا das أبداً! (خريطة التداخل 10-ي!)")]),
    "b2-u13-d5": dict(inter=["hygiene", "ansteckung", "immunsystem"], words=["glaubwuerdigkeit", "korrektur", "durchgang"],
        slug="die-glaubwuerdigkeit", title_de="Die Glaubwürdigkeit", title_ar="المصداقية",
        line1=("mueller", "Die Glaubwürdigkeit ist wichtig: die Korrektur kommt und der Durchgang ist vorbei!", "المصداقية"),
        lines_rest=[
            ("yusuf", "Was ist die Glaubwürdigkeit?", "استفسار"),
            ("mueller", "Die Glaubwürdigkeit heißt: man kann dem Text glauben.", "تعريف"),
            ("yusuf", "Und die Korrektur?", "استفسار"),
            ("mueller", "Die Korrektur zeigt die Fehler und die guten Stellen.", "تفسير"),
            ("yusuf", "Und der Durchgang?", "استفسار"),
            ("mueller", "Jeder Durchgang macht uns besser.", "مبدأ"),
            ("yusuf", "Ich bleibe dran.", "إغلاق")],
        ziel_ar="اليوم الخامس: المصداقية والتصحيح والدور!",
        canDo=["يتحقق من المصداقية! (die Glaubwürdigkeit!)", "يصف التصحيح والدور! (die Korrektur! der Durchgang!)"],
        warmup=["hygiene", "ansteckung"],
        pretest=[("«المصداقية مهمة.»؟", "glaubwuerdigkeit"), ("&التصحيح جاهز.»؟", "korrektur")],
        task_goal_de="Glaubwürdigkeit, Korrektur, Durchgang: Wir prüfen den Text!",
        task_goal_ar="اليوم الخامس من الوحدة 13! (المصداقية! التصحيح! الدور!)",
        task_sit_de="Glaubwürdigkeit, Korrektur, Durchgang — zusammen prüfen.",
        task_sit_ar="مصداقية! تصحيح! دور! — نفحص معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Glaubwürdigkeit (die! -keit!) وdie Korrektur (die! على -ur!) وder Durchgang (der! مركّب!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: die Glaubwürdigkeit prüfen! die Korrektur machen!"],
        gap_extra=[("Die ___ ist wichtig.", "Hygiene"), ("Die ___ ist möglich.", "Ansteckung"), ("Das ___ ist stark.", "Immunsystem")],
        hunt_extra=[("~~der Glaubwürdigkeit ist wichtig.~~", "Die Glaubwürdigkeit ist wichtig.", "die Glaubwürdigkeit (die! -keit!) لا der Glaubwürdigkeit!"),
            ("~~die Durchgang ist vorbei.~~", "Der Durchgang ist vorbei.", "der Durchgang (der! مركّب!) لا die Durchgang!")],
        speak_extra=["glaubwuerdigkeit", "korrektur", "durchgang"],
        warn=[("der Glaubwürdigkeit!", "~~der Glaubwürdigkeit ist wichtig.~~", "die Glaubwürdigkeit!", "Die Glaubwürdigkeit ist wichtig.", "___ Glaubwürdigkeit ist wichtig.", "die",
               "العربية: «التصديق» مذكّر! والألمانية: die Glaubwürdigkeit (die! -keit مؤنثة!) (خريطة التداخل 10-ي!)"),
              ("der Korrektur!", "~~der Korrektur ist fertig.~~", "die Korrektur!", "Die Korrektur ist fertig.", "___ Korrektur ist fertig.", "die",
               "العربية: «التصحيح» مذكّر! والألمانية: die Korrektur (die! على -ur!) (خريطة التداخل 10-ي!)"),
              ("die Durchgang!", "~~die Durchgang ist vorbei.~~", "der Durchgang!", "Der Durchgang ist vorbei.", "___ Durchgang ist vorbei.", "der",
               "الألمانية: der Durchgang (der! مركّب مذكّر!) — لا die أبداً! (خريطة التداخل 10-ي!)")]),
    "b2-u13-d6": dict(inter=["psyche", "resilienz", "selbstwert"], words=["selbsteinschaetzung", "pruefling", "erwartung"],
        slug="die-selbsteinschaetzung", title_de="Die Selbsteinschätzung", title_ar="التقييم الذاتي",
        line1=("mueller", "Die Selbsteinschätzung ist ehrlich: der Prüfling ist bereit und die Erwartung ist klar!", "الختام"),
        lines_rest=[
            ("yusuf", "Was ist die Selbsteinschätzung?", "استفسار"),
            ("mueller", "Die Selbsteinschätzung heißt: ich weiß, was ich kann.", "تعريف"),
            ("yusuf", "Und der Prüfling?", "استفسار"),
            ("mueller", "Der Prüfling kommt morgen zur Prüfung.", "تفسير"),
            ("yusuf", "Und die Erwartung?", "استفسار"),
            ("mueller", "Die Erwartung ist klar — und du schaffst das!", "مبدأ"),
            ("yusuf", "Danke für alles!", "إغلاق")],
        ziel_ar="اليوم السادس: التقييم الذاتي والمترشّح والتوقع!",
        canDo=["يقيّم نفسه! (die Selbsteinschätzung!)", "يصف المترشّح والتوقع! (der Prüfling! die Erwartung!)"],
        warmup=["psyche", "resilienz"],
        pretest=[("«التقييم الذاتي جيد.»؟", "selbsteinschaetzung"), ("«التوقع واضح.»؟", "erwartung")],
        task_goal_de="Selbsteinschätzung, Prüfling, Erwartung: Wir schaffen die Prüfung!",
        task_goal_ar="اليوم السادس من الوحدة 13! (التقييم! المترشّح! التوقع!)",
        task_sit_de="Selbsteinschätzung, Prüfling, Erwartung — zusammen schaffen.",
        task_sit_ar="تقييم! مترشّح! توقع! — نجتاز معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Selbsteinschätzung (die! -ung!) وder Prüfling (der! على -ling!) وdie Erwartung (die! -ung!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: die Selbsteinschätzung machen! die Erwartung erfüllen!"],
        gap_extra=[("Die ___ ist wichtig.", "Psyche"), ("Die ___ ist stark.", "Resilienz"), ("Der ___ ist hoch.", "Selbstwert")],
        hunt_extra=[("~~der Selbsteinschätzung ist gut.~~", "Die Selbsteinschätzung ist gut.", "die Selbsteinschätzung (die! -ung!) لا der Selbsteinschätzung!"),
            ("~~die Prüfling ist bereit.~~", "Der Prüfling ist bereit.", "der Prüfling (der! على -ling!) لا die Prüfling!")],
        speak_extra=["selbsteinschaetzung", "pruefling", "erwartung"],
        warn=[("der Selbsteinschätzung!", "~~der Selbsteinschätzung ist gut.~~", "die Selbsteinschätzung!", "Die Selbsteinschätzung ist gut.", "___ Selbsteinschätzung ist gut.", "die",
               "العربية: «التقييم» مذكّر! والألمانية: die Selbsteinschätzung (die! -ung مؤنثة!) (خريطة التداخل 10-ي!)"),
              ("die Prüfling!", "~~die Prüfling ist bereit.~~", "der Prüfling!", "Der Prüfling ist bereit.", "___ Prüfling ist bereit.", "der",
               "العربية: «المترشّح» مذكّر فعلاً! والألمانية: der Prüfling (der! على -ling!) (خريطة التداخل 10-ي!)"),
              ("das Erwartung!", "~~das Erwartung ist klar.~~", "die Erwartung!", "Die Erwartung ist klar.", "___ Erwartung ist klar.", "die",
               "العربية: «التوقع» مذكّر! والألمانية: die Erwartung (die! -ung مؤنثة!) (خريطة التداخل 10-ي!)")]),
}

UNIT_NAME = "الوحدة 13 (التكثيف والامتحان!)"


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
        doc["unit"] = 13
        doc["goetheList"] = []
        doc["thema"] = "Prüfung & Konsolidierung"
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
                {"id": f"b2u13d{lid[-1]}-l{i+1}", "speaker": sp, "text": tx, "direction": dr}
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
        d["unit"] = 13
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
            "storySentenceIds": [f"story-b2-u13-s{d['day']}"],
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
            "id": f"story-b2-u13-s{d}", "lessonId": lid,
            "scriptId": f"{lid}-{v['slug']}", "lineId": f"b2u13d{d}-l1",
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
                phrases.append({"de": kol[0], "whyAr": f"المفردة الثابتة ليوم {lid}! (D594)"})
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
    print("B2-U13 generated. Next: npx tsx tools/dialogue-splitter.ts --all")
