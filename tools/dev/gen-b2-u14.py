# -*- coding: utf-8 -*-
"""D595 · بناء b2-u14 «اليوم الحاسم: الامتحان وما بعده» (الدستور §3-ج: B2 = 12 وحدة + 3 أسابيع تكثيف/امتحان!) — 6 دروس × 3 كلمات.
الأسبوع الثاني من أسابيع التكثيف/الامتحان الثلاثة (N-374! u13 = الأسبوع الأول «التكثيف والامتحان» D594!).
يكتب: كلمات + حوارات (audio-scripts) + دروس + قصة + خطة الترقية + usedInLessons.
الصوت: كلمات (build_audio — الجديد فقط «القديم لم يُمس» D251/D578!) ثم node_modules/.bin/tsx tools/dialogue-splitter.ts --all (تدريجي!).
درس N-384: لا sed أعمى · فحص التصادم case-insensitive قبل البناء · phoneticRisks فارغة ثم auditRisks({apply:true})."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
W = ROOT / "content/words"
LESSONS = ROOT / "content/lessons/b2"
SCRIPTS = ROOT / "content/audio-scripts"
UPGRADES = ROOT / "content/upgrades/b2-lesson-upgrade.json"
STORY = ROOT / "content/story/b2.json"

# ── الكلمات الثمانية عشر (3/يوم) — اليوم الحاسم: الامتحان وما بعده ──────────────
WORDS = {
    "wartezeit": dict(de="die Wartezeit", article="die", gender="die", plural="die Wartezeiten",
        pluralRuleNote="مركّبة مؤنثة (die! Warte+Zeit) جمعها die Wartezeiten.",
        ar=["فترة الانتظار"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["warten"], kollocation=("die Wartezeit haben", "يقضي وقت الانتظار", "haben"),
        sample=("Die Wartezeit ist lang.", "فترة الانتظار طويلة.")),
    "aufsicht": dict(de="die Aufsicht", article="die", gender="die", plural="die Aufsichten",
        pluralRuleNote="اسم مؤنث (die! Aufsicht) جمعه die Aufsichten (نادر).",
        ar=["الإشراف (مراقبة الامتحان)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["sehen"], kollocation=("unter Aufsicht stehen", "يكون تحت المراقبة", "stehen"),
        sample=("Die Aufsicht ist streng.", "المراقبة صارمة.")),
    "pruefungsraum": dict(de="der Prüfungsraum", article="der", gender="der", plural="die Prüfungsräume",
        pluralRuleNote="مركّب مذكّر (der! Prüfungs+Raum) جمعه مع umlaut: die Prüfungsräume.",
        ar=["قاعة الامتحان"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["pruefung", "raum"], kollocation=("in den Prüfungsraum gehen", "يذهب إلى قاعة الامتحان", "gehen"),
        sample=("Der Prüfungsraum ist groß.", "قاعة الامتحان كبيرة.")),
    "anweisung": dict(de="die Anweisung", article="die", gender="die", plural="die Anweisungen",
        pluralRuleNote="اسم مؤنث على -ung (die! -ung مؤنثة دائماً!) جمعه -en: die Anweisungen.",
        ar=["التعليمات (الأمر)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["anweisen"], kollocation=("die Anweisungen lesen", "يتبع التعليمات", "lesen"),
        sample=("Die Anweisung ist klar.", "التعليمات واضحة.")),
    "nervositaet": dict(de="die Nervosität", article="die", gender="die", plural="-",
        pluralRuleNote="اسم مؤنث على -ität (die!) تُستعمل عادةً بلا جمع: die Nervosität.",
        ar=["العصبية (التوتر)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["nervoes"], kollocation=("die Nervosität haben", "يشعر بالتوتر", "haben"),
        sample=("Die Nervosität ist groß.", "التوتر كبير.")),
    "sammlung": dict(de="die Sammlung", article="die", gender="die", plural="die Sammlungen",
        pluralRuleNote="اسم مؤنث على -ung (die! -ung مؤنثة دائماً!) جمعه -en: die Sammlungen.",
        ar=["الهدوء والتركيز (التجمّع)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["sammeln"], kollocation=("Sammlung bewahren", "يحفظ تركيزه", "bewahren"),
        sample=("Die Sammlung hilft.", "الهدوء والتركيز يساعدان.")),
    "klarheit": dict(de="die Klarheit", article="die", gender="die", plural="-",
        pluralRuleNote="اسم مؤنث على -heit (die!) تُستعمل عادةً بلا جمع: die Klarheit.",
        ar=["الوضوح"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["klar"], kollocation=("Klarheit schaffen", "يخلق الوضوح", "schaffen"),
        sample=("Die Klarheit ist wichtig.", "الوضوح مهم.")),
    "gruendlichkeit": dict(de="die Gründlichkeit", article="die", gender="die", plural="-",
        pluralRuleNote="اسم مؤنث على -keit (die!) تُستعمل عادةً بلا جمع: die Gründlichkeit.",
        ar=["الاستقصاء (الدقّة في العمل)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["gruendlich"], kollocation=("Gründlichkeit zeigen", "يُظهر استقصاءً", "zeigen"),
        sample=("Die Gründlichkeit ist wichtig.", "الاستقصاء مهم.")),
    "atempause": dict(de="die Atempause", article="die", gender="die", plural="die Atempausen",
        pluralRuleNote="مركّبة مؤنثة (die! Atem+Pause على -e) جمعها die Atempausen.",
        ar=["لحظة تنفّس (استراحة قصيرة)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["atem", "pause"], kollocation=("eine Atempause machen", "يأخذ لحظة تنفّس", "machen"),
        sample=("Die Atempause ist kurz.", "لحظة التنفّس قصيرة.")),
    "erleichterung": dict(de="die Erleichterung", article="die", gender="die", plural="die Erleichterungen",
        pluralRuleNote="اسم مؤنث على -ung (die! -ung مؤنثة دائماً!) جمعه -en: die Erleichterungen.",
        ar=["الارتياح"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["erleichtern"], kollocation=("Erleichterung zeigen", "يُظهر الارتياح", "zeigen"),
        sample=("Die Erleichterung ist groß.", "الارتياح كبير.")),
    "ernuechterung": dict(de="die Ernüchterung", article="die", gender="die", plural="-",
        pluralRuleNote="اسم مؤنث على -ung (die!) تُستعمل عادةً بلا جمع: die Ernüchterung.",
        ar=["الصحو المؤلم (خيبة التوقّع)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["ernuechtern"], kollocation=("Ernüchterung zeigen", "يُظهر خيبة التوقّع", "zeigen"),
        sample=("Die Ernüchterung ist schwer.", "خيبة التوقّع صعبة.")),
    "seufzer": dict(de="der Seufzer", article="der", gender="der", plural="die Seufzer",
        pluralRuleNote="اسم مذكّر (der! Seufzer) جمعه بلا تغيير: die Seufzer.",
        ar=["التنهّدة"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["seufzen"], kollocation=("einen Seufzer hören", "يُطلق تنهّدة", "hören"),
        sample=("Der Seufzer ist lang.", "التنهّدة طويلة.")),
    "bewertung": dict(de="die Bewertung", article="die", gender="die", plural="die Bewertungen",
        pluralRuleNote="اسم مؤنث على -ung (die! -ung مؤنثة دائماً!) جمعه -en: die Bewertungen.",
        ar=["التقييم (الدرجة)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["bewerten"], kollocation=("die Bewertung bekommen", "يتلقّى التقييم", "bekommen"),
        sample=("Die Bewertung ist fair.", "التقييم عادل.")),
    "bescheinigung": dict(de="die Bescheinigung", article="die", gender="die", plural="die Bescheinigungen",
        pluralRuleNote="اسم مؤنث على -ung (die! -ung مؤنثة دائماً!) جمعه -en: die Bescheinigungen.",
        ar=["الشهادة (الإفادة الرسمية)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["bescheinigen"], kollocation=("eine Bescheinigung bekommen", "يتلقّى شهادة", "bekommen"),
        sample=("Die Bescheinigung ist wichtig.", "الشهادة مهمة.")),
    "verlaengerung": dict(de="die Verlängerung", article="die", gender="die", plural="die Verlängerungen",
        pluralRuleNote="اسم مؤنث على -ung (die! -ung مؤنثة دائماً!) جمعه -en: die Verlängerungen.",
        ar=["التمديد"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["verlaengern"], kollocation=("eine Verlängerung beantragen", "يطلب تمديداً", "beantragen"),
        sample=("Die Verlängerung ist möglich.", "التمديد ممكن.")),
    "dankbarkeit": dict(de="die Dankbarkeit", article="die", gender="die", plural="-",
        pluralRuleNote="اسم مؤنث على -keit (die!) تُستعمل عادةً بلا جمع: die Dankbarkeit.",
        ar=["الامتنان"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["dankbar"], kollocation=("Dankbarkeit zeigen", "يُظهر الامتنان", "zeigen"),
        sample=("Die Dankbarkeit ist groß.", "الامتنان كبير.")),
    "jubel": dict(de="der Jubel", article="der", gender="der", plural="-",
        pluralRuleNote="اسم مذكّر (der! Jubel) تُستعمل عادةً بلا جمع: der Jubel.",
        ar=["الهتاف (الابتهاج)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["jubeln"], kollocation=("Jubel hören", "ينفجر هتافاً", "hören"),
        sample=("Der Jubel ist laut.", "الهتاف عالٍ.")),
    "auszeit": dict(de="die Auszeit", article="die", gender="die", plural="die Auszeiten",
        pluralRuleNote="مركّبة مؤنثة (die! Aus+Zeit) جمعها die Auszeiten.",
        ar=["استراحة (وقت للنفس)"], wordClass="noun", phoneticRisks=[],
        grammarRisks=["needs-ein"], wordFamily=["aus", "zeit"], kollocation=("eine Auszeit nehmen", "يأخذ استراحة", "nehmen"),
        sample=("Die Auszeit ist gut.", "الاستراحة جيدة.")),
}

DAYS = {
    "b2-u14-d1": dict(inter=["lernplan", "fertigkeit", "selbstkontrolle"], words=["wartezeit", "aufsicht", "pruefungsraum"],
        slug="die-wartezeit", title_de="Die Wartezeit", title_ar="فترة الانتظار",
        line1=("mueller", "Die Wartezeit vor dem Prüfungsraum: die Aufsicht ist streng und der Prüfungsraum ist groß!", "قبل الامتحان"),
        lines_rest=[
            ("yusuf", "Wie lang ist die Wartezeit?", "استفسار"),
            ("mueller", "Die Wartezeit ist lang, aber wir bleiben ruhig.", "تفسير"),
            ("yusuf", "Und die Aufsicht?", "استفسار"),
            ("mueller", "Die Aufsicht kontrolliert den Prüfungsraum.", "تعريف"),
            ("yusuf", "Und der Prüfungsraum?", "استفسار"),
            ("mueller", "Der Prüfungsraum ist groß und hell.", "تفسير"),
            ("yusuf", "Gut. Ich warte ruhig.", "إغلاق")],
        ziel_ar="اليوم الأول: فترة الانتظار والمراقبة وقاعة الامتحان!",
        canDo=["يصف وقت الانتظار قبل الامتحان! (die Wartezeit!)", "يصف المراقبة والقاعة! (die Aufsicht! der Prüfungsraum!)"],
        warmup=["lernplan", "fertigkeit"],
        pretest=[("«فترة الانتظار طويلة.»؟", "wartezeit"), ("«قاعة الامتحان كبيرة.»؟", "pruefungsraum")],
        task_goal_de="Wartezeit, Aufsicht, Prüfungsraum: Wir warten vor der Prüfung!",
        task_goal_ar="اليوم الأول من الوحدة 14! (الانتظار! المراقبة! القاعة!)",
        task_sit_de="Wartezeit, Aufsicht, Prüfungsraum — zusammen warten.",
        task_sit_ar="انتظار! مراقبة! قاعة! — ننتظر معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Wartezeit (die! مركّبة!) وdie Aufsicht (die!) وder Prüfungsraum (der! مركّب!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: unter Aufsicht stehen! in den Prüfungsraum gehen!"],
        gap_extra=[("Der ___ ist klar.", "Lernplan"), ("Die ___ ist wichtig.", "Fertigkeit"), ("Die ___ hilft.", "Selbstkontrolle")],
        hunt_extra=[("~~der Wartezeit ist lang.~~", "Die Wartezeit ist lang.", "die Wartezeit (die! مركّبة!) لا der Wartezeit!"),
            ("~~das Aufsicht ist streng.~~", "Die Aufsicht ist streng.", "die Aufsicht (die!) لا das Aufsicht!")],
        speak_extra=["lernplan", "fertigkeit", "selbstkontrolle"],
        warn=[("der Wartezeit!", "~~der Wartezeit ist lang.~~", "die Wartezeit!", "Die Wartezeit ist lang.", "___ Wartezeit ist lang.", "die",
               "العربية: «الانتظار» مذكّر! والألمانية: die Wartezeit (die! مركّبة على Zeit!) (خريطة التداخل 10-ي!)"),
              ("das Aufsicht!", "~~das Aufsicht ist streng.~~", "die Aufsicht!", "Die Aufsicht ist streng.", "___ Aufsicht ist streng.", "die",
               "الألمانية: die Aufsicht (die!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
              ("die Prüfungsraum!", "~~die Prüfungsraum ist groß.~~", "der Prüfungsraum!", "Der Prüfungsraum ist groß.", "___ Prüfungsraum ist groß.", "der",
               "العربية: «القاعة» مؤنثة! والألمانية: der Prüfungsraum (der! مركّب مذكّر!) (خريطة التداخل 10-ي!)")]),
    "b2-u14-d2": dict(inter=["pruefungssimulation", "gewichtung", "zeitfenster"], words=["anweisung", "nervositaet", "sammlung"],
        slug="die-anweisung", title_de="Die Anweisung", title_ar="التعليمات",
        line1=("lena", "Die Anweisung ist klar: keine Nervosität — nur Sammlung und Ruhe!", "قبل البدء"),
        lines_rest=[
            ("yusuf", "Was steht in der Anweisung?", "استفسار"),
            ("lena", "Die Anweisung sagt: Ruhe und Sammlung!", "تعريف"),
            ("yusuf", "Und die Nervosität?", "استفسار"),
            ("lena", "Die Nervosität ist normal — aber wir atmen tief.", "تفسير"),
            ("yusuf", "Und die Sammlung?", "استفسار"),
            ("lena", "Die Sammlung kommt mit der Ruhe.", "مبدأ"),
            ("yusuf", "Gut. Ich sammle mich.", "إغلاق")],
        ziel_ar="اليوم الثاني: التعليمات والتوتر والهدوء!",
        canDo=["يفهم تعليمات الامتحان! (die Anweisung!)", "يصف التوتر والهدوء! (die Nervosität! die Sammlung!)"],
        warmup=["pruefungssimulation", "gewichtung"],
        pretest=[("«التعليمات واضحة.»؟", "anweisung"), ("«الهدوء والتركيز يساعدان.»؟", "sammlung")],
        task_goal_de="Anweisung, Nervosität, Sammlung: Wir starten die Prüfung!",
        task_goal_ar="اليوم الثاني من الوحدة 14! (التعليمات! التوتر! الهدوء!)",
        task_sit_de="Anweisung, Nervosität, Sammlung — zusammen starten.",
        task_sit_ar="تعليمات! توتر! هدوء! — نبدأ معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Anweisung (die! -ung!) وdie Nervosität (die! اسم مؤنث!) وdie Sammlung (die! -ung!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: die Anweisungen lesen! Sammlung bewahren!"],
        gap_extra=[("Die ___ ist wichtig.", "Prüfungssimulation"), ("Die ___ ist klar.", "Gewichtung"), ("Das ___ ist kurz.", "Zeitfenster")],
        hunt_extra=[("~~das Anweisung ist klar.~~", "Die Anweisung ist klar.", "die Anweisung (die! -ung!) لا das Anweisung!"),
            ("~~der Nervosität ist groß.~~", "Die Nervosität ist groß.", "die Nervosität (die! اسم مؤنث!) لا der Nervosität!")],
        speak_extra=["pruefungssimulation", "gewichtung", "zeitfenster"],
        warn=[("das Anweisung!", "~~das Anweisung ist klar.~~", "die Anweisung!", "Die Anweisung ist klar.", "___ Anweisung ist klar.", "die",
               "الألمانية: die Anweisung (die! -ung مؤنثة دائماً!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
              ("der Nervosität!", "~~der Nervosität ist groß.~~", "die Nervosität!", "Die Nervosität ist groß.", "___ Nervosität ist groß.", "die",
               "الألمانية: die Nervosität (die! اسم مؤنث!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
              ("der Sammlung!", "~~der Sammlung hilft.~~", "die Sammlung!", "Die Sammlung hilft.", "___ Sammlung hilft.", "die",
               "العربية: «التركيز» مذكّر! والألمانية: die Sammlung (die! -ung!) (خريطة التداخل 10-ي!)")]),
    "b2-u14-d3": dict(inter=["pruefungsangst", "gelassenheit", "zuversicht"], words=["klarheit", "gruendlichkeit", "atempause"],
        slug="die-klarheit", title_de="Die Klarheit", title_ar="الوضوح",
        line1=("mueller", "Die Klarheit im Kopf: mit Gründlichkeit lösen — und eine Atempause nicht vergessen!", "أثناء الامتحان"),
        lines_rest=[
            ("yusuf", "Was ist die Klarheit?", "استفسار"),
            ("mueller", "Die Klarheit hilft beim Lesen und Denken.", "تعريف"),
            ("yusuf", "Und die Gründlichkeit?", "استفسار"),
            ("mueller", "Die Gründlichkeit verhindert Fehler.", "تفسير"),
            ("yusuf", "Und die Atempause?", "استفسار"),
            ("mueller", "Die Atempause ist kurz — und wichtig!", "مبدأ"),
            ("yusuf", "Gut. Ich bleibe klar.", "إغلاق")],
        ziel_ar="اليوم الثالث: الوضوح والاستقصاء ولحظة التنفّس!",
        canDo=["يبقى واضحاً أثناء الامتحان! (die Klarheit!)", "يصف الاستقصاء ولحظة التنفّس! (die Gründlichkeit! die Atempause!)"],
        warmup=["pruefungsangst", "gelassenheit"],
        pretest=[("«الوضوح مهم.»؟", "klarheit"), ("«لحظة التنفّس قصيرة.»؟", "atempause")],
        task_goal_de="Klarheit, Gründlichkeit, Atempause: Wir lösen die Aufgaben!",
        task_goal_ar="اليوم الثالث من الوحدة 14! (الوضوح! الاستقصاء! التنفّس!)",
        task_sit_de="Klarheit, Gründlichkeit, Atempause — zusammen lösen.",
        task_sit_ar="وضوح! استقصاء! تنفّس! — نحلّ معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Klarheit (die! على -heit!) وdie Gründlichkeit (die! على -keit!) وdie Atempause (die! مركّبة!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: Klarheit schaffen! eine Atempause machen!"],
        gap_extra=[("Die ___ ist groß.", "Prüfungsangst"), ("Die ___ hilft.", "Gelassenheit"), ("Die ___ ist stark.", "Zuversicht")],
        hunt_extra=[("~~der Klarheit ist wichtig.~~", "Die Klarheit ist wichtig.", "die Klarheit (die! على -heit!) لا der Klarheit!"),
            ("~~das Gründlichkeit ist wichtig.~~", "Die Gründlichkeit ist wichtig.", "die Gründlichkeit (die! على -keit!) لا das Gründlichkeit!")],
        speak_extra=["pruefungsangst", "gelassenheit", "zuversicht"],
        warn=[("der Klarheit!", "~~der Klarheit ist wichtig.~~", "die Klarheit!", "Die Klarheit ist wichtig.", "___ Klarheit ist wichtig.", "die",
               "الألمانية: die Klarheit (die! على -heit!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
              ("das Gründlichkeit!", "~~das Gründlichkeit ist wichtig.~~", "die Gründlichkeit!", "Die Gründlichkeit ist wichtig.", "___ Gründlichkeit ist wichtig.", "die",
               "الألمانية: die Gründlichkeit (die! على -keit!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
              ("der Atempause!", "~~der Atempause ist kurz.~~", "die Atempause!", "Die Atempause ist kurz.", "___ Atempause ist kurz.", "die",
               "العربية: «التنفّس» مذكّر! والألمانية: die Atempause (die! مركّبة على -e!) (خريطة التداخل 10-ي!)")]),
    "b2-u14-d4": dict(inter=["loesungsweg", "skizze", "fehlersuche"], words=["erleichterung", "ernuechterung", "seufzer"],
        slug="die-erleichterung", title_de="Die Erleichterung", title_ar="الارتياح",
        line1=("lena", "Die Erleichterung nach der Prüfung: ein langer Seufzer — und die Ernüchterung kommt später!", "بعد التسليم"),
        lines_rest=[
            ("yusuf", "Was ist die Erleichterung?", "استفسار"),
            ("lena", "Die Erleichterung ist das Gefühl nach der Prüfung.", "تعريف"),
            ("yusuf", "Und die Ernüchterung?", "استفسار"),
            ("lena", "Die Ernüchterung kommt, wenn etwas schwer war.", "تفسير"),
            ("yusuf", "Und der Seufzer?", "استفسار"),
            ("lena", "Der Seufzer zeigt: es ist vorbei!", "مبدأ"),
            ("yusuf", "Puh. Es ist vorbei!", "إغلاق")],
        ziel_ar="اليوم الرابع: الارتياح وخيبة التوقّع والتنهّدة!",
        canDo=["يصف الشعور بعد الامتحان! (die Erleichterung!)", "يصف خيبة التوقّع والتنهّدة! (die Ernüchterung! der Seufzer!)"],
        warmup=["loesungsweg", "skizze"],
        pretest=[("«الارتياح كبير.»؟", "erleichterung"), ("«التنهّدة طويلة.»؟", "seufzer")],
        task_goal_de="Erleichterung, Ernüchterung, Seufzer: Die Prüfung ist zu Ende!",
        task_goal_ar="اليوم الرابع من الوحدة 14! (الارتياح! الصحو! التنهّدة!)",
        task_sit_de="Erleichterung, Ernüchterung, Seufzer — zusammen da sein.",
        task_sit_ar="ارتياح! صحو! تنهّدة! — نتنفّس معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Erleichterung (die! -ung!) وdie Ernüchterung (die! -ung!) وder Seufzer (der! جمعه بلا تغيير!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: Erleichterung zeigen! einen Seufzer hören!"],
        gap_extra=[("Der ___ ist klar.", "Lösungsweg"), ("Die ___ ist kurz.", "Skizze"), ("Die ___ ist wichtig.", "Fehlersuche")],
        hunt_extra=[("~~das Erleichterung ist groß.~~", "Die Erleichterung ist groß.", "die Erleichterung (die! -ung!) لا das Erleichterung!"),
            ("~~die Seufzer ist lang.~~", "Der Seufzer ist lang.", "der Seufzer (der! مذكّر!) لا die Seufzer!")],
        speak_extra=["loesungsweg", "skizze", "fehlersuche"],
        warn=[("das Erleichterung!", "~~das Erleichterung ist groß.~~", "die Erleichterung!", "Die Erleichterung ist groß.", "___ Erleichterung ist groß.", "die",
               "الألمانية: die Erleichterung (die! -ung مؤنثة دائماً!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
              ("der Ernüchterung!", "~~der Ernüchterung ist schwer.~~", "die Ernüchterung!", "Die Ernüchterung ist schwer.", "___ Ernüchterung ist schwer.", "die",
               "الألمانية: die Ernüchterung (die! -ung!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
              ("die Seufzer!", "~~die Seufzer ist lang.~~", "der Seufzer!", "Der Seufzer ist lang.", "___ Seufzer ist lang.", "der",
               "العربية: «التنهّدة» مؤنثة! والألمانية: der Seufzer (der! مذكّر!) (خريطة التداخل 10-ي!)")]),
    "b2-u14-d5": dict(inter=["glaubwuerdigkeit", "korrektur", "durchgang"], words=["bewertung", "bescheinigung", "verlaengerung"],
        slug="die-bewertung", title_de="Die Bewertung", title_ar="التقييم",
        line1=("mueller", "Die Bewertung kommt: die Bescheinigung danach — und für später eine Verlängerung!", "يوم الحكم"),
        lines_rest=[
            ("yusuf", "Wann kommt die Bewertung?", "استفسار"),
            ("mueller", "Die Bewertung kommt nach zwei Wochen.", "تفسير"),
            ("yusuf", "Und die Bescheinigung?", "استفسار"),
            ("mueller", "Die Bescheinigung bekommst du per Post.", "تعريف"),
            ("yusuf", "Und die Verlängerung?", "استفسار"),
            ("mueller", "Die Verlängerung ist möglich — aber selten.", "مبدأ"),
            ("yusuf", "Gut. Ich warte ab.", "إغلاق")],
        ziel_ar="اليوم الخامس: التقييم والشهادة والتمديد!",
        canDo=["يفهم عملية التقييم! (die Bewertung!)", "يصف الشهادة والتمديد! (die Bescheinigung! die Verlängerung!)"],
        warmup=["glaubwuerdigkeit", "korrektur"],
        pretest=[("«التقييم عادل.»؟", "bewertung"), ("«التمديد ممكن.»؟", "verlaengerung")],
        task_goal_de="Bewertung, Bescheinigung, Verlängerung: Wir warten auf das Ergebnis!",
        task_goal_ar="اليوم الخامس من الوحدة 14! (التقييم! الشهادة! التمديد!)",
        task_sit_de="Bewertung, Bescheinigung, Verlängerung — zusammen warten.",
        task_sit_ar="تقييم! شهادة! تمديد! — ننتظر معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Bewertung (die! -ung!) وdie Bescheinigung (die! -ung!) وdie Verlängerung (die! -ung!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: die Bewertung bekommen! eine Verlängerung beantragen!"],
        gap_extra=[("Die ___ ist stark.", "Glaubwürdigkeit"), ("Die ___ ist wichtig.", "Korrektur"), ("Der ___ ist klar.", "Durchgang")],
        hunt_extra=[("~~der Bewertung ist fair.~~", "Die Bewertung ist fair.", "die Bewertung (die! -ung!) لا der Bewertung!"),
            ("~~das Bescheinigung ist wichtig.~~", "Die Bescheinigung ist wichtig.", "die Bescheinigung (die! -ung!) لا das Bescheinigung!")],
        speak_extra=["glaubwuerdigkeit", "korrektur", "durchgang"],
        warn=[("der Bewertung!", "~~der Bewertung ist fair.~~", "die Bewertung!", "Die Bewertung ist fair.", "___ Bewertung ist fair.", "die",
               "الألمانية: die Bewertung (die! -ung مؤنثة دائماً!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
              ("das Bescheinigung!", "~~das Bescheinigung ist wichtig.~~", "die Bescheinigung!", "Die Bescheinigung ist wichtig.", "___ Bescheinigung ist wichtig.", "die",
               "الألمانية: die Bescheinigung (die! -ung!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
              ("der Verlängerung!", "~~der Verlängerung ist möglich.~~", "die Verlängerung!", "Die Verlängerung ist möglich.", "___ Verlängerung ist möglich.", "die",
               "العربية: «التمديد» مذكّر! والألمانية: die Verlängerung (die! -ung!) (خريطة التداخل 10-ي!)")]),
    "b2-u14-d6": dict(inter=["selbsteinschaetzung", "pruefling", "erwartung"], words=["dankbarkeit", "jubel", "auszeit"],
        slug="die-dankbarkeit", title_de="Die Dankbarkeit", title_ar="الامتنان",
        line1=("mueller", "Die Dankbarkeit am Ende: Jubel mit allen — und dann eine gute Auszeit!", "ما بعد الامتحان"),
        lines_rest=[
            ("yusuf", "Warum die Dankbarkeit?", "استفسار"),
            ("mueller", "Die Dankbarkeit zeigt: jeder hat geholfen.", "تفسير"),
            ("yusuf", "Und der Jubel?", "استفسار"),
            ("mueller", "Der Jubel gehört zu den besten Momenten!", "تعريف"),
            ("yusuf", "Und die Auszeit?", "استفسار"),
            ("mueller", "Die Auszeit lädt die Batterien wieder auf.", "مبدأ"),
            ("yusuf", "Gut. Ich feiere und ruhe mich aus.", "إغلاق")],
        ziel_ar="اليوم السادس: الامتنان والهتاف والاستراحة!",
        canDo=["يُظهر الامتنان بعد الامتحان! (die Dankbarkeit!)", "يصف الابتهاج والاستراحة! (der Jubel! die Auszeit!)"],
        warmup=["selbsteinschaetzung", "pruefling"],
        pretest=[("«الامتنان كبير.»؟", "dankbarkeit"), ("«الاستراحة جيدة.»؟", "auszeit")],
        task_goal_de="Dankbarkeit, Jubel, Auszeit: Wir schließen die Woche ab!",
        task_goal_ar="اليوم السادس من الوحدة 14! (الامتنان! الهتاف! الاستراحة!)",
        task_sit_de="Dankbarkeit, Jubel, Auszeit — zusammen abschließen.",
        task_sit_ar="امتنان! هتاف! استراحة! — نختم معًا!",
        task_success=["كلمات اليوم الثلاث كلها في التدريب!",
            "die Dankbarkeit (die! على -keit!) وder Jubel (der!) وdie Auszeit (die! مركّبة!)",
            "الكلام أولًا ثم التقييم!",
            "المفردات الثابتة: Dankbarkeit zeigen! eine Auszeit nehmen!"],
        gap_extra=[("Die ___ ist klar.", "Selbsteinschätzung"), ("Der ___ ist wichtig.", "Prüfling"), ("Die ___ ist klar.", "Erwartung")],
        hunt_extra=[("~~das Dankbarkeit ist groß.~~", "Die Dankbarkeit ist groß.", "die Dankbarkeit (die! على -keit!) لا das Dankbarkeit!"),
            ("~~die Jubel ist laut.~~", "Der Jubel ist laut.", "der Jubel (der! مذكّر!) لا die Jubel!")],
        speak_extra=["selbsteinschaetzung", "pruefling", "erwartung"],
        warn=[("das Dankbarkeit!", "~~das Dankbarkeit ist groß.~~", "die Dankbarkeit!", "Die Dankbarkeit ist groß.", "___ Dankbarkeit ist groß.", "die",
               "الألمانية: die Dankbarkeit (die! على -keit!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
              ("die Jubel!", "~~die Jubel ist laut.~~", "der Jubel!", "Der Jubel ist laut.", "___ Jubel ist laut.", "der",
               "العربية: «الهتاف» مؤنث! والألمانية: der Jubel (der! مذكّر!) (خريطة التداخل 10-ي!)"),
              ("der Auszeit!", "~~der Auszeit ist gut.~~", "die Auszeit!", "Die Auszeit ist gut.", "___ Auszeit ist gut.", "die",
               "الألمانية: die Auszeit (die! مركّبة على Zeit!) — لا der أبداً! (خريطة التداخل 10-ي!)")]),
}

UNIT_NAME = "الوحدة 14 (اليوم الحاسم!)"

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
        doc["unit"] = 14
        doc["goetheList"] = []
        doc["thema"] = "Prüfungstag & Auszeit"
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
                {"id": f"b2u14d{lid[-1]}-l{i+1}", "speaker": sp, "text": tx, "direction": dr}
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
        d["unit"] = 14
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
            "storySentenceIds": [f"story-b2-u14-s{d['day']}"],
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
            "id": f"story-b2-u14-s{d}", "lessonId": lid,
            "scriptId": f"{lid}-{v['slug']}", "lineId": f"b2u14d{d}-l1",
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
                phrases.append({"de": kol[0], "whyAr": f"المفردة الثابتة ليوم {lid}! (D595)"})
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
    print("B2-U14 generated. Next: npx tsx tools/dialogue-splitter.ts --all")
