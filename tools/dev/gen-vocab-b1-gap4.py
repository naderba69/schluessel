#!/usr/bin/env python3
# tools/dev/gen-vocab-b1-gap4.py — إغلاق فجوات B1 — الدفعة الرابعة (D592 · +29 كلمة في وحدتين!).
# u2 «البحث عن سكن» (69→80) + u6 «السفر والثقافة» (67→85) — أهداف الدستور §3-ج!
# نفس آلة D586–D591: specs → tools/word-entry-generator.ts + ترقيع الدروس.
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORDS = [
  # ═══ u2 «البحث عن سكن» (69→80): d1-d4 +2 · d5 +1 · d6 +2 ═══
  dict(id="terrasse", unit=2, day=1, wordClass="noun", de="die Terrasse", article="die", gender="die",
       plural="die Terrassen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Terrassen.",
       ar=["الشرفة (الواسعة)"],
       sample=("Die Terrasse ist schön.", "الشرفة جميلة."),
       gap=("Die ___ ist schön. (الشرفة!)", "Terrasse"),
       hunt=("~~der Terrasse ist schön~~", "die Terrasse ist schön"),
       hunt_why="الألمانية: die Terrasse (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="hausmeister", unit=2, day=1, wordClass="noun", de="der Hausmeister", article="der", gender="der",
       plural="die Hausmeister",
       pluralRuleNote="مركّب (Haus+Meister) مذكّر (der!) وجمعه die Hausmeister — والمؤنث die Hausmeisterin (وفي سويسرا: der Abwart!).",
       ar=["حارس العمارة"],
       sample=("Der Hausmeister hilft.", "حارس العمارة يساعد."),
       gap=("Der ___ hilft. (حارس العمارة!)", "Hausmeister"),
       hunt=("~~die Hausmeister hilft~~", "der Hausmeister hilft"),
       hunt_why="الألمانية: der Hausmeister (der! مركّب مذكّر!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="klingel", unit=2, day=2, wordClass="noun", de="die Klingel", article="die", gender="die",
       plural="die Klingeln",
       pluralRuleNote="مؤنثة (die!) وجمعها die Klingeln.",
       ar=["الجرس (الباب)"],
       sample=("Die Klingel ist laut.", "الجرس صاخب."),
       gap=("Die ___ ist laut. (الجرس!)", "Klingel"),
       hunt=("~~der Klingel ist laut~~", "die Klingel ist laut"),
       hunt_why="الألمانية: die Klingel (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="briefkasten", unit=2, day=2, wordClass="noun", de="der Briefkasten", article="der", gender="der",
       plural="die Briefkästen",
       pluralRuleNote="مركّب (Brief+Kasten) مذكّر (der!) وجمعه die Briefkästen (تقلب a→ä!).",
       ar=["صندوق البريد"],
       sample=("Der Briefkasten ist voll.", "صندوق البريد ممتلئ."),
       gap=("Der ___ ist voll. (صندوق البريد!)", "Briefkasten"),
       hunt=("~~die Briefkasten ist voll~~", "der Briefkasten ist voll"),
       hunt_why="الألمانية: der Briefkasten (der! مركّب مذكّر!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="stecker", unit=2, day=3, wordClass="noun", de="der Stecker", article="der", gender="der",
       plural="die Stecker",
       pluralRuleNote="مذكّر (der!) وجمعه die Stecker (بلا تغيير!).",
       ar=["القابس (الكهربائي)"],
       sample=("Der Stecker ist hier.", "القابس هنا."),
       gap=("Der ___ ist hier. (القابس!)", "Stecker"),
       hunt=("~~die Stecker ist hier~~", "der Stecker ist hier"),
       hunt_why="الألمانية: der Stecker (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="grundstueck", unit=2, day=3, wordClass="noun", de="das Grundstück", article="das", gender="das",
       plural="die Grundstücke",
       pluralRuleNote="مركّب (Grund+Stück) محايد (das!) وجمعه die Grundstücke.",
       ar=["القطعة الأرضية"],
       sample=("Das Grundstück ist groß.", "القطعة الأرضية كبيرة."),
       gap=("Das ___ ist groß. (القطعة الأرضية!)", "Grundstück"),
       hunt=("~~der Grundstück ist groß~~", "das Grundstück ist groß"),
       hunt_why="الألمانية: das Grundstück (das! مركّب محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="korridor", unit=2, day=4, wordClass="noun", de="der Korridor", article="der", gender="der",
       plural="die Korridore",
       pluralRuleNote="مذكّر (der!) وجمعه die Korridore — قرض إيطالي (والبديل الألماني: der Flur!).",
       ar=["الممر"],
       sample=("Der Korridor ist lang.", "الممر طويل."),
       gap=("Der ___ ist lang. (الممر!)", "Korridor"),
       hunt=("~~die Korridor ist lang~~", "der Korridor ist lang"),
       hunt_why="الألمانية: der Korridor (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="treppenhaus", unit=2, day=4, wordClass="noun", de="das Treppenhaus", article="das", gender="das",
       plural="die Treppenhäuser",
       pluralRuleNote="مركّب (Treppen+Haus) محايد (das!) وجمعه die Treppenhäuser (تقلب a→ä!).",
       ar=["الدرج (بيت الدرج)"],
       sample=("Das Treppenhaus ist hell.", "بيت الدرج مضيء."),
       gap=("Das ___ ist hell. (بيت الدرج!)", "Treppenhaus"),
       hunt=("~~der Treppenhaus ist hell~~", "das Treppenhaus ist hell"),
       hunt_why="الألمانية: das Treppenhaus (das! مركّب محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="mauer", unit=2, day=5, wordClass="noun", de="die Mauer", article="die", gender="die",
       plural="die Mauern",
       pluralRuleNote="مؤنثة (die!) وجمعها die Mauern.",
       ar=["الجدار"],
       sample=("Die Mauer ist hoch.", "الجدار مرتفع."),
       gap=("Die ___ ist hoch. (الجدار!)", "Mauer"),
       hunt=("~~der Mauer ist hoch~~", "die Mauer ist hoch"),
       hunt_why="الألمانية: die Mauer (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="abfalleimer", unit=2, day=6, wordClass="noun", de="der Abfalleimer", article="der", gender="der",
       plural="die Abfalleimer",
       pluralRuleNote="مركّب (Abfall+Eimer) مذكّر (der!) وجمعه die Abfalleimer (بلا تغيير!).",
       ar=["سلة المهملات"],
       sample=("Der Abfalleimer ist leer.", "سلة المهملات فارغة."),
       gap=("Der ___ ist leer. (سلة المهملات!)", "Abfalleimer"),
       hunt=("~~die Abfalleimer ist leer~~", "der Abfalleimer ist leer"),
       hunt_why="الألمانية: der Abfalleimer (der! مركّب مذكّر!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="garderobe", unit=2, day=6, wordClass="noun", de="die Garderobe", article="die", gender="die",
       plural="die Garderoben",
       pluralRuleNote="مؤنثة (die!) وجمعها die Garderoben — قرض فرنسي (المكان لتعليق المعاطف!).",
       ar=["معلّقة المعاطف"],
       sample=("Die Garderobe ist hier.", "معلّقة المعاطف هنا."),
       gap=("Die ___ ist hier. (معلّقة المعاطف!)", "Garderobe"),
       hunt=("~~der Garderobe ist hier~~", "die Garderobe ist hier"),
       hunt_why="الألمانية: die Garderobe (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  # ═══ u6 «السفر والثقافة» (67→85): d1-d5 +3 · d6 +3 ═══
  dict(id="rundfahrt", unit=6, day=1, wordClass="noun", de="die Rundfahrt", article="die", gender="die",
       plural="die Rundfahrten",
       pluralRuleNote="مركّبة (Rund+Fahrt) مؤنثة (die!) وجمعها die Rundfahrten.",
       ar=["الجولة (السياحية)"],
       sample=("Die Rundfahrt ist schön.", "الجولة جميلة."),
       gap=("Die ___ ist schön. (الجولة!)", "Rundfahrt"),
       hunt=("~~der Rundfahrt ist schön~~", "die Rundfahrt ist schön"),
       hunt_why="الألمانية: die Rundfahrt (die! مركّبة مؤنثة!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="gebirge", unit=6, day=1, wordClass="noun", de="das Gebirge", article="das", gender="das",
       plural="die Gebirge",
       pluralRuleNote="محايد (das!) وجمعه die Gebirge (بلا تغيير!) — اسم جماعي (der Berg = جبل واحد!).",
       ar=["الجبال (سلسلة)"],
       sample=("Das Gebirge ist hoch.", "الجبال مرتفعة."),
       gap=("Das ___ ist hoch. (الجبال!)", "Gebirge"),
       hunt=("~~der Gebirge ist hoch~~", "das Gebirge ist hoch"),
       hunt_why="الألمانية: das Gebirge (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="burg", unit=6, day=1, wordClass="noun", de="die Burg", article="die", gender="die",
       plural="die Burgen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Burgen — القلعة (der Schloss = القصر!).",
       ar=["القلعة"],
       sample=("Die Burg ist alt.", "القلعة قديمة."),
       gap=("Die ___ ist alt. (القلعة!)", "Burg"),
       hunt=("~~der Burg ist alt~~", "die Burg ist alt"),
       hunt_why="الألمانية: die Burg (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="kueste", unit=6, day=2, wordClass="noun", de="die Küste", article="die", gender="die",
       plural="die Küsten",
       pluralRuleNote="مؤنثة (die!) وجمعها die Küsten.",
       ar=["الساحل"],
       sample=("Die Küste ist lang.", "الساحل طويل."),
       gap=("Die ___ ist lang. (الساحل!)", "Küste"),
       hunt=("~~der Küste ist lang~~", "die Küste ist lang"),
       hunt_why="الألمانية: die Küste (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="ozean", unit=6, day=2, wordClass="noun", de="der Ozean", article="der", gender="der",
       plural="die Ozeane",
       pluralRuleNote="مذكّر (der!) وجمعه die Ozeane — قرض لاتيني (das Meer = البحر!).",
       ar=["المحيط"],
       sample=("Der Ozean ist blau.", "المحيط أزرق."),
       gap=("Der ___ ist blau. (المحيط!)", "Ozean"),
       hunt=("~~die Ozean ist blau~~", "der Ozean ist blau"),
       hunt_why="الألمانية: der Ozean (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="tourismus", unit=6, day=2, wordClass="noun", de="der Tourismus", article="der", gender="der",
       plural="-",
       pluralRuleNote="يُستعمل عادةً بلا جمع: der Tourismus.",
       ar=["السياحة"],
       sample=("Der Tourismus ist wichtig.", "السياحة مهمة."),
       gap=("Der ___ ist wichtig. (السياحة!)", "Tourismus"),
       hunt=("~~die Tourismus ist wichtig~~", "der Tourismus ist wichtig"),
       hunt_why="الألمانية: der Tourismus (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="kostuem", unit=6, day=3, wordClass="noun", de="das Kostüm", article="das", gender="das",
       plural="die Kostüme",
       pluralRuleNote="محايد (das!) وجمعه die Kostüme — قرض فرنسي.",
       ar=["الزي (التنكّري)"],
       sample=("Das Kostüm ist bunt.", "الزي ملوّن."),
       gap=("Das ___ ist bunt. (الزي!)", "Kostüm"),
       hunt=("~~der Kostüm ist bunt~~", "das Kostüm ist bunt"),
       hunt_why="الألمانية: das Kostüm (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="ballett", unit=6, day=3, wordClass="noun", de="das Ballett", article="das", gender="das",
       plural="die Ballette",
       pluralRuleNote="محايد (das!) وجمعه die Ballette — قرض فرنسي.",
       ar=["الباليه"],
       sample=("Das Ballett ist schön.", "الباليه جميل."),
       gap=("Das ___ ist schön. (الباليه!)", "Ballett"),
       hunt=("~~der Ballett ist schön~~", "das Ballett ist schön"),
       hunt_why="الألمانية: das Ballett (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="vergnuegen", unit=6, day=3, wordClass="noun", de="das Vergnügen", article="das", gender="das",
       plural="die Vergnügen",
       pluralRuleNote="محايد (das!) وجمعه die Vergnügen (نادر!).",
       ar=["المتعة"],
       sample=("Das Vergnügen ist groß.", "المتعة كبيرة."),
       gap=("Das ___ ist groß. (المتعة!)", "Vergnügen"),
       hunt=("~~der Vergnügen ist groß~~", "das Vergnügen ist groß"),
       hunt_why="الألمانية: das Vergnügen (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="buehne", unit=6, day=4, wordClass="noun", de="die Bühne", article="die", gender="die",
       plural="die Bühnen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Bühnen.",
       ar=["خشبة المسرح"],
       sample=("Die Bühne ist groß.", "خشبة المسرح كبيرة."),
       gap=("Die ___ ist groß. (خشبة المسرح!)", "Bühne"),
       hunt=("~~der Bühne ist groß~~", "die Bühne ist groß"),
       hunt_why="الألمانية: die Bühne (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="floete", unit=6, day=4, wordClass="noun", de="die Flöte", article="die", gender="die",
       plural="die Flöten",
       pluralRuleNote="مؤنثة (die!) وجمعها die Flöten.",
       ar=["الناي"],
       sample=("Die Flöte ist leise.", "الناي هادئ."),
       gap=("Die ___ ist leise. (الناي!)", "Flöte"),
       hunt=("~~der Flöte ist leise~~", "die Flöte ist leise"),
       hunt_why="الألمانية: die Flöte (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="oper", unit=6, day=4, wordClass="noun", de="die Oper", article="die", gender="die",
       plural="die Opern",
       pluralRuleNote="مؤنثة (die!) وجمعها die Opern — قرض إيطالي.",
       ar=["الأوبرا"],
       sample=("Die Oper ist heute.", "الأوبرا اليوم."),
       gap=("Die ___ ist heute. (الأوبرا!)", "Oper"),
       hunt=("~~der Oper ist heute~~", "die Oper ist heute"),
       hunt_why="الألمانية: die Oper (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="huegel", unit=6, day=5, wordClass="noun", de="der Hügel", article="der", gender="der",
       plural="die Hügel",
       pluralRuleNote="مذكّر (der!) وجمعه die Hügel (بلا تغيير!).",
       ar=["التل"],
       sample=("Der Hügel ist grün.", "التل أخضر."),
       gap=("Der ___ ist grün. (التل!)", "Hügel"),
       hunt=("~~die Hügel ist grün~~", "der Hügel ist grün"),
       hunt_why="الألمانية: der Hügel (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="landung", unit=6, day=5, wordClass="noun", de="die Landung", article="die", gender="die",
       plural="die Landungen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Landungen.",
       ar=["الهبوط (الطائرة)"],
       sample=("Die Landung ist gut.", "الهبوط جيد."),
       gap=("Die ___ ist gut. (الهبوط!)", "Landung"),
       hunt=("~~der Landung ist gut~~", "die Landung ist gut"),
       hunt_why="الألمانية: die Landung (die! -ung مؤنثة!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="metropole", unit=6, day=5, wordClass="noun", de="die Metropole", article="die", gender="die",
       plural="die Metropolen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Metropolen — قرض يوناني (المدينة الكبرى!).",
       ar=["المدينة الكبرى"],
       sample=("Die Metropole ist laut.", "المدينة الكبرى صاخبة."),
       gap=("Die ___ ist laut. (المدينة الكبرى!)", "Metropole"),
       hunt=("~~der Metropole ist laut~~", "die Metropole ist laut"),
       hunt_why="الألمانية: die Metropole (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="fasching", unit=6, day=6, wordClass="noun", de="der Fasching", article="der", gender="der",
       plural="die Fasching",
       pluralRuleNote="المطبوع: der Fasching, - ⇒ جمع مطابق: die Fasching (D110: المطبوع هو المرجع!). بديل: der Karneval، وسويسرا: die Fasnacht.",
       ar=["كرنفال الشتاء"],
       sample=("Der Fasching ist laut.", "كرنفال الشتاء صاخب."),
       gap=("Der ___ ist laut. (كرنفال الشتاء!)", "Fasching"),
       hunt=("~~die Fasching ist laut~~", "der Fasching ist laut"),
       hunt_why="الألمانية: der Fasching (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="auftritt", unit=6, day=6, wordClass="noun", de="der Auftritt", article="der", gender="der",
       plural="die Auftritte",
       pluralRuleNote="مذكّر (der!) وجمعه die Auftritte.",
       ar=["الظهور (على المسرح)"],
       sample=("Der Auftritt ist kurz.", "الظهور قصير."),
       gap=("Der ___ ist kurz. (الظهور!)", "Auftritt"),
       hunt=("~~die Auftritt ist kurz~~", "der Auftritt ist kurz"),
       hunt_why="الألمانية: der Auftritt (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="sand", unit=6, day=6, wordClass="noun", de="der Sand", article="der", gender="der",
       plural="-",
       pluralRuleNote="يُستعمل عادةً بلا جمع: der Sand.",
       ar=["الرمل"],
       sample=("Der Sand ist warm.", "الرمل دافئ."),
       gap=("Der ___ ist warm. (الرمل!)", "Sand"),
       hunt=("~~die Sand ist warm~~", "der Sand ist warm"),
       hunt_why="الألمانية: der Sand (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
]
SPEAK_MODEL = {
  (2, 1): "Die Terrasse ist schön. Der Hausmeister hilft.",
  (2, 2): "Die Klingel ist laut. Der Briefkasten ist voll.",
  (2, 3): "Der Stecker ist hier. Das Grundstück ist groß.",
  (2, 4): "Der Korridor ist lang. Das Treppenhaus ist hell.",
  (2, 5): "Die Mauer ist hoch.",
  (2, 6): "Der Abfalleimer ist leer. Die Garderobe ist hier.",
  (6, 1): "Die Rundfahrt ist schön. Das Gebirge ist hoch, und die Burg ist alt.",
  (6, 2): "Die Küste ist lang. Der Ozean ist blau, und der Tourismus ist wichtig.",
  (6, 3): "Das Kostüm ist bunt. Das Ballett ist schön, und das Vergnügen ist groß.",
  (6, 4): "Die Bühne ist groß. Die Flöte ist leise, und die Oper ist heute.",
  (6, 5): "Der Hügel ist grün. Die Landung ist gut, und die Metropole ist laut.",
  (6, 6): "Der Fasching ist laut. Der Auftritt ist kurz, und der Sand ist warm.",
}
THEMA = {2: "البحث عن سكن", 6: "السفر والثقافة"}
CRITERIA_FIX = {
  "b1-u2-d1": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الخمس عشرة")],
  "b1-u2-d2": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الخمس عشرة")],
  "b1-u2-d4": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الخمس عشرة")],
  "b1-u2-d5": [("كلمات اليوم الخمس عشرة", "كلمات اليوم الست عشرة")],
  "b1-u6-d1": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الست عشرة")],
  "b1-u6-d2": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الست عشرة")],
  "b1-u6-d3": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الست عشرة")],
  "b1-u6-d4": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الست عشرة")],
  "b1-u6-d5": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الست عشرة")],
  "b1-u6-d6": [("الكلمتان الجديدتان", "الكلمات الخمس")],
}


def clip_text(w: dict) -> str:
    return f'{w["de"]}.'


def load_word(word_id: str) -> dict:
    return json.loads((ROOT / f"content/words/{word_id}.json").read_text(encoding="utf-8"))


def pair_of(word_id: str) -> dict:
    w = load_word(word_id)
    return dict(ar=w["ar"][0], de=w["de"].split(",")[0])


def make_specs() -> list[dict]:
    out = []
    for w in WORDS:
        spec = dict(de=w["de"], ar=w["ar"], wordClass=w["wordClass"], level="B1", unit=w["unit"],
                    lesson=f"b1-u{w['unit']}-d{w['day']}", thema=THEMA[w["unit"]],
                    sample=dict(de=w["sample"][0], ar=w["sample"][1]))
        if w["wordClass"] == "noun":
            spec["plural"] = w["plural"]
            spec["pluralRuleNote"] = w["pluralRuleNote"]
        out.append(spec)
    return out


def why_for(w: dict) -> str:
    return f'{w["de"]} {w["ar"][0]} ({w["gender"]}! {w["pluralRuleNote"]}) — {w["sample"][0]}'


def patch_lessons() -> None:
    by_lesson: dict[tuple[int, int], list[dict]] = {}
    for w in WORDS:
        by_lesson.setdefault((w["unit"], w["day"]), []).append(w)
    for (unit, day), ws in sorted(by_lesson.items()):
        lid = f"b1-u{unit}-d{day}"
        p = ROOT / f"content/lessons/b1/{lid}.json"
        d = json.loads(p.read_text(encoding="utf-8"))
        ids = [w["id"] for w in ws]
        for wid in ids:
            if wid not in d["praesentation"]["wordIds"]:
                d["praesentation"]["wordIds"].append(wid)
            ref = f"word-{wid}"
            if ref not in d["audioManifestRefs"]:
                d["audioManifestRefs"].append(ref)
            if wid not in d["curriculumRef"].get("goetheWordListOverlap", []):
                d["curriculumRef"].setdefault("goetheWordListOverlap", []).append(wid)
        d["zusammenfassung"]["srsBundleWordIds"] = list(d["praesentation"]["wordIds"])
        stations = {s["type"]: s for s in d["uebung"]["stations"]}
        new_pairs = [dict(ar=w["ar"][0], de=w["de"].split(",")[0]) for w in ws]
        if len(new_pairs) < 3:
            old_ids = [x for x in d["praesentation"]["wordIds"] if x not in ids]
            for oid in reversed(old_ids):
                if len(new_pairs) >= 3:
                    break
                p_old = pair_of(oid)
                if all(p_old["de"] != p["de"] for p in new_pairs):
                    new_pairs.append(p_old)
        stations["match"]["items"].append(dict(
            pairs=new_pairs,
            why=" · ".join(f'{p["de"]} {p["ar"]}' for p in new_pairs) + " (خريطة التداخل 10-ي!)"))
        pool = [w["ar"][0] for w in ws]
        for oid in d["praesentation"]["wordIds"]:
            if oid not in ids:
                a = load_word(oid)["ar"][0]
                if a not in pool:
                    pool.append(a)
        for w in ws:
            stations["gap-fill"]["items"].append(dict(
                q=w["gap"][0], a=w["gap"][1], why=why_for(w)))
            stations["error-hunt"]["items"].append(dict(
                q=w["hunt"][0], a=w["hunt"][1], why=w["hunt_why"]))
            clip = clip_text(w)
            distractors = [a for a in pool if a != w["ar"][0]][:2]
            stations["listening"]["items"].append(dict(
                audioId=f'word-{w["id"]}', speakText=clip,
                q="استمع: ماذا تعني الكلمة؟",
                choices=[w["ar"][0]] + distractors,
                a=w["ar"][0],
                why=f'الصوت يقول «{clip[:-1]}» — معناها «{w["ar"][0]}». ركّز!'))
            stations["dictation"]["items"].append(dict(
                audioId=f'word-{w["id"]}', speakText=clip,
                a=w["de"].split(",")[0],
                why=f'اكتب ما تسمعه حرفياً: «{clip[:-1]}» تعني «{w["ar"][0]}». انتبه للحروف الكبيرة!'))
        speak = SPEAK_MODEL[(unit, day)]
        stations["speaking"]["items"].append(dict(
            q=f'تكلّم عن يومك! (جملتان! استعمل كلمات اليوم الجديدة: {" · ".join(w["de"].split(",")[0] for w in ws)})',
            a=speak,
            why="المراجعة بالكلام! كلمات اليوم الجديدة كلها في الجُمل."))
        for v in d["quiz"]["variants"]:
            for w in ws:
                v["items"].append(dict(q=w["gap"][0], a=w["gap"][1], why=why_for(w)))
        s = d["zusammenfassung"]["summary"]
        s["de"] = s["de"].rstrip() + " " + " ".join(w["sample"][0] for w in ws)
        s["ar"] = s["ar"].rstrip() + " " + " ".join(w["sample"][1] for w in ws)
        task = d["uebung"]["communicativeTask"]
        task["goal"]["de"] = task["goal"]["de"].rstrip() + " " + speak
        for old, new in CRITERIA_FIX.get(lid, []):
            task["successCriteria"] = [x.replace(old, new) for x in task["successCriteria"]]
        p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"patched {lid}: +{len(ids)} كلمات")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "specs"
    if mode == "specs":
        out = ROOT / "tools/dev/.vocab-b1-gap4-specs.json"
        out.write_text(json.dumps(make_specs(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"specs: {len(WORDS)} → {out}")
    else:
        patch_lessons()
