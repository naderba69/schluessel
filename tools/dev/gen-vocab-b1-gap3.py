#!/usr/bin/env python3
# tools/dev/gen-vocab-b1-gap3.py — إغلاق فجوات B1 — الدفعة الثالثة (D591 · +19 كلمة في وحدتين!).
# u1 «الوصول إلى العمل» (71→80) + u4 «التكوين والدراسة» (75→85) — أهداف الدستور §3-ج!
# نفس آلة D586–D590: specs → tools/word-entry-generator.ts + ترقيع الدروس (قواعد الدفعات الصغيرة مدمجة).
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORDS = [
  # ═══ u1 «الوصول إلى العمل» (71→80): d1 +2 · d2 +2 · d3 +1 · d4 +1 · d5 +1 · d6 +2 ═══
  dict(id="strafzettel", unit=1, day=1, wordClass="noun", de="der Strafzettel", article="der", gender="der",
       plural="die Strafzettel",
       pluralRuleNote="مركّب (Strafe+Zettel) مذكّر (der!) وجمعه die Strafzettel (بلا تغيير!).",
       ar=["الغرامة (المرورية)"],
       sample=("Der Strafzettel ist teuer.", "الغرامة غالية."),
       gap=("Der ___ ist teuer. (الغرامة!)", "Strafzettel"),
       hunt=("~~die Strafzettel ist teuer~~", "der Strafzettel ist teuer"),
       hunt_why="الألمانية: der Strafzettel (der! مركّب مذكّر!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="vorfahrt", unit=1, day=1, wordClass="noun", de="die Vorfahrt", article="die", gender="die",
       plural="-",
       pluralRuleNote="تُستعمل عادةً بلا جمع: die Vorfahrt (الأسبقية في المرور).",
       ar=["الأسبقية (في المرور)"],
       sample=("Die Vorfahrt ist wichtig.", "الأسبقية مهمة."),
       gap=("Die ___ ist wichtig. (الأسبقية!)", "Vorfahrt"),
       hunt=("~~der Vorfahrt ist wichtig~~", "die Vorfahrt ist wichtig"),
       hunt_why="الألمانية: die Vorfahrt (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="fahrzeug", unit=1, day=2, wordClass="noun", de="das Fahrzeug", article="das", gender="das",
       plural="die Fahrzeuge",
       pluralRuleNote="محايد (das!) وجمعه die Fahrzeuge.",
       ar=["المركبة"],
       sample=("Das Fahrzeug ist neu.", "المركبة جديدة."),
       gap=("Das ___ ist neu. (المركبة!)", "Fahrzeug"),
       hunt=("~~der Fahrzeug ist neu~~", "das Fahrzeug ist neu"),
       hunt_why="الألمانية: das Fahrzeug (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="fussgaenger", unit=1, day=2, wordClass="noun", de="der Fußgänger", article="der", gender="der",
       plural="die Fußgänger",
       pluralRuleNote="مذكّر (der!) وجمعه die Fußgänger (بلا تغيير!) — والمؤنث die Fußgängerin.",
       ar=["الراجل (المشاة)"],
       sample=("Der Fußgänger geht langsam.", "الراجل يمشي ببطء."),
       gap=("Der ___ geht langsam. (الراجل!)", "Fußgänger"),
       hunt=("~~die Fußgänger geht langsam~~", "der Fußgänger geht langsam"),
       hunt_why="الألمانية: der Fußgänger (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="gehsteig", unit=1, day=3, wordClass="noun", de="der Gehsteig", article="der", gender="der",
       plural="die Gehsteige",
       pluralRuleNote="مركّب (Gehen+Steig) مذكّر (der!) وجمعه die Gehsteige — وفي سويسرا: das Trottoir.",
       ar=["الرصيف"],
       sample=("Der Gehsteig ist breit.", "الرصيف عريض."),
       gap=("Der ___ ist breit. (الرصيف!)", "Gehsteig"),
       hunt=("~~die Gehsteig ist breit~~", "der Gehsteig ist breit"),
       hunt_why="الألمانية: der Gehsteig (der! مركّب مذكّر!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="einfahrt", unit=1, day=4, wordClass="noun", de="die Einfahrt", article="die", gender="die",
       plural="die Einfahrten",
       pluralRuleNote="مؤنثة (die!) وجمعها die Einfahrten — والنظير die Ausfahrt (المخرج!).",
       ar=["مدخل السيارات"],
       sample=("Die Einfahrt ist frei.", "مدخل السيارات فارغ."),
       gap=("Die ___ ist frei. (مدخل السيارات!)", "Einfahrt"),
       hunt=("~~der Einfahrt ist frei~~", "die Einfahrt ist frei"),
       hunt_why="الألمانية: die Einfahrt (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="tankstelle", unit=1, day=5, wordClass="noun", de="die Tankstelle", article="die", gender="die",
       plural="die Tankstellen",
       pluralRuleNote="مركّبة (Tank+Stelle) مؤنثة (die!) وجمعها die Tankstellen.",
       ar=["محطة البنزين"],
       sample=("Die Tankstelle ist offen.", "محطة البنزين مفتوحة."),
       gap=("Die ___ ist offen. (محطة البنزين!)", "Tankstelle"),
       hunt=("~~der Tankstelle ist offen~~", "die Tankstelle ist offen"),
       hunt_why="الألمانية: die Tankstelle (die! مركّبة مؤنثة!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="einbahnstrasse", unit=1, day=6, wordClass="noun", de="die Einbahnstraße", article="die", gender="die",
       plural="die Einbahnstraßen",
       pluralRuleNote="مركّبة (Einbahn+Straße) مؤنثة (die!) وجمعها die Einbahnstraßen (ß→ss مع الـen!).",
       ar=["الشارع أحادي الاتجاه"],
       sample=("Die Einbahnstraße ist lang.", "الشارع أحادي الاتجاه طويل."),
       gap=("Die ___ ist lang. (الشارع أحادي الاتجاه!)", "Einbahnstraße"),
       hunt=("~~der Einbahnstraße ist lang~~", "die Einbahnstraße ist lang"),
       hunt_why="الألمانية: die Einbahnstraße (die! مركّبة مؤنثة!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="ausfahrt", unit=1, day=6, wordClass="noun", de="die Ausfahrt", article="die", gender="die",
       plural="die Ausfahrten",
       pluralRuleNote="مؤنثة (die!) وجمعها die Ausfahrten — والنظير die Einfahrt (المدخل!).",
       ar=["مخرج السيارات"],
       sample=("Die Ausfahrt ist dort.", "مخرج السيارات هناك."),
       gap=("Die ___ ist dort. (مخرج السيارات!)", "Ausfahrt"),
       hunt=("~~der Ausfahrt ist dort~~", "die Ausfahrt ist dort"),
       hunt_why="الألمانية: die Ausfahrt (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  # ═══ u4 «التكوين والدراسة» (75→85): d2 +2 · d3 +1 · d4 +2 · d5 +2 · d6 +3 ═══
  dict(id="lexikon", unit=4, day=2, wordClass="noun", de="das Lexikon", article="das", gender="das",
       plural="die Lexika",
       pluralRuleNote="محايد (das!) وجمعه الشاذّ die Lexika (لا Lexikons!).",
       ar=["المعجم"],
       sample=("Das Lexikon ist dick.", "المعجم سميك."),
       gap=("Das ___ ist dick. (المعجم!)", "Lexikon"),
       hunt=("~~der Lexikon ist dick~~", "das Lexikon ist dick"),
       hunt_why="الألمانية: das Lexikon (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="kuli", unit=4, day=2, wordClass="noun", de="der Kuli", article="der", gender="der",
       plural="die Kulis",
       pluralRuleNote="مذكّر (der!) وجمعه die Kulis (-s!) — اختصار Kugelschreiber.",
       ar=["القلم (الجرافيتي)"],
       sample=("Der Kuli ist blau.", "القلم أزرق."),
       gap=("Der ___ ist blau. (القلم!)", "Kuli"),
       hunt=("~~die Kuli ist blau~~", "der Kuli ist blau"),
       hunt_why="الألمانية: der Kuli (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="intelligenz", unit=4, day=3, wordClass="noun", de="die Intelligenz", article="die", gender="die",
       plural="-",
       pluralRuleNote="تُستعمل عادةً بلا جمع: die Intelligenz.",
       ar=["الذكاء"],
       sample=("Die Intelligenz ist wichtig.", "الذكاء مهم."),
       gap=("Die ___ ist wichtig. (الذكاء!)", "Intelligenz"),
       hunt=("~~der Intelligenz ist wichtig~~", "die Intelligenz ist wichtig"),
       hunt_why="الألمانية: die Intelligenz (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="kandidat", unit=4, day=4, wordClass="noun", de="der Kandidat", article="der", gender="der",
       plural="die Kandidaten",
       pluralRuleNote="اسم n-Deklination! (der Kandidat! نظير der Student!) وجمعه die Kandidaten.",
       ar=["المرشّح (للامتحان)"],
       sample=("Der Kandidat lernt viel.", "المرشّح يتعلّم كثيراً."),
       gap=("Der ___ lernt viel. (المرشّح!)", "Kandidat"),
       hunt=("~~die Kandidat lernt viel~~", "der Kandidat lernt viel"),
       hunt_why="الألمانية: der Kandidat (der! n-Deklination!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="nachhilfe", unit=4, day=4, wordClass="noun", de="die Nachhilfe", article="die", gender="die",
       plural="die Nachhilfen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Nachhilfen وفق علامة القائمة (-n!) — والاستعمال الفعلي غالباً بلا جمع.",
       ar=["الدروس الخصوصية"],
       sample=("Die Nachhilfe hilft mir.", "الدروس الخصوصية تساعدني."),
       gap=("Die ___ hilft mir. (الدروس الخصوصية!)", "Nachhilfe"),
       hunt=("~~der Nachhilfe hilft mir~~", "die Nachhilfe hilft mir"),
       hunt_why="الألمانية: die Nachhilfe (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="intensivkurs", unit=4, day=5, wordClass="noun", de="der Intensivkurs", article="der", gender="der",
       plural="die Intensivkurse",
       pluralRuleNote="مركّب (Intensiv+Kurs) مذكّر (der!) وجمعه die Intensivkurse.",
       ar=["الدورة المكثّفة"],
       sample=("Der Intensivkurs beginnt morgen.", "الدورة المكثّفة تبدأ غداً."),
       gap=("Der ___ beginnt morgen. (الدورة المكثّفة!)", "Intensivkurs"),
       hunt=("~~die Intensivkurs beginnt morgen~~", "der Intensivkurs beginnt morgen"),
       hunt_why="الألمانية: der Intensivkurs (der! مركّب مذكّر!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="wissenschaftler", unit=4, day=5, wordClass="noun", de="der Wissenschaftler", article="der", gender="der",
       plural="die Wissenschaftler",
       pluralRuleNote="مذكّر (der!) وجمعه die Wissenschaftler (بلا تغيير!) — والمؤنث die Wissenschaftlerin.",
       ar=["العالم (الباحث)"],
       sample=("Der Wissenschaftler arbeitet hier.", "العالم يعمل هنا."),
       gap=("Der ___ arbeitet hier. (العالم!)", "Wissenschaftler"),
       hunt=("~~die Wissenschaftler arbeitet hier~~", "der Wissenschaftler arbeitet hier"),
       hunt_why="الألمانية: der Wissenschaftler (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="mensa", unit=4, day=6, wordClass="noun", de="die Mensa", article="die", gender="die",
       plural="die Mensen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Mensen — المطعم الجامعي! (قرض لاتيني mensa!).",
       ar=["المطعم الجامعي"],
       sample=("Die Mensa ist groß.", "المطعم الجامعي كبير."),
       gap=("Die ___ ist groß. (المطعم الجامعي!)", "Mensa"),
       hunt=("~~der Mensa ist groß~~", "die Mensa ist groß"),
       hunt_why="الألمانية: die Mensa (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="gymnastik", unit=4, day=6, wordClass="noun", de="die Gymnastik", article="die", gender="die",
       plural="-",
       pluralRuleNote="تُستعمل عادةً بلا جمع: die Gymnastik.",
       ar=["الجمباز · التمارين الرياضية"],
       sample=("Die Gymnastik macht Spaß.", "الجمباز ممتع."),
       gap=("Die ___ macht Spaß. (الجمباز!)", "Gymnastik"),
       hunt=("~~der Gymnastik macht Spaß~~", "die Gymnastik macht Spaß"),
       hunt_why="الألمانية: die Gymnastik (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="orchester", unit=4, day=6, wordClass="noun", de="das Orchester", article="das", gender="das",
       plural="die Orchester",
       pluralRuleNote="محايد (das!) وجمعه die Orchester (بلا تغيير!) — قرض لاتيني.",
       ar=["الأوركسترا"],
       sample=("Das Orchester spielt heute.", "الأوركسترا تعزف اليوم."),
       gap=("Das ___ spielt heute. (الأوركسترا!)", "Orchester"),
       hunt=("~~der Orchester spielt heute~~", "das Orchester spielt heute"),
       hunt_why="الألمانية: das Orchester (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
]
SPEAK_MODEL = {
  (1, 1): "Der Strafzettel ist teuer. Die Vorfahrt ist wichtig.",
  (1, 2): "Das Fahrzeug ist neu. Der Fußgänger geht langsam.",
  (1, 3): "Der Gehsteig ist breit.",
  (1, 4): "Die Einfahrt ist frei.",
  (1, 5): "Die Tankstelle ist offen.",
  (1, 6): "Die Einbahnstraße ist lang. Die Ausfahrt ist dort.",
  (4, 2): "Das Lexikon ist dick. Der Kuli ist blau.",
  (4, 3): "Die Intelligenz ist wichtig.",
  (4, 4): "Der Kandidat lernt viel. Die Nachhilfe hilft mir.",
  (4, 5): "Der Intensivkurs beginnt morgen. Der Wissenschaftler arbeitet hier.",
  (4, 6): "Die Mensa ist groß. Die Gymnastik macht Spaß, und das Orchester spielt heute.",
}
THEMA = {1: "الوصول إلى العمل", 4: "التكوين والدراسة"}
CRITERIA_FIX = {
  "b1-u4-d2": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الخمس عشرة")],
  "b1-u4-d3": [("كلمات اليوم الخمس عشرة", "كلمات اليوم الست عشرة")],
  "b1-u4-d5": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الخمس عشرة")],
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
        out = ROOT / "tools/dev/.vocab-b1-gap3-specs.json"
        out.write_text(json.dumps(make_specs(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"specs: {len(WORDS)} → {out}")
    else:
        patch_lessons()
