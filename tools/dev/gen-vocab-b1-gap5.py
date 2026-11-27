#!/usr/bin/env python3
# tools/dev/gen-vocab-b1-gap5.py — إغلاق الفجوة الأخيرة في B1 — الدفعة الخامسة (D593 · +23 كلمة!).
# u7 «البيئة والمجتمع» (62→85) — الوحدة الثانية عشرة! اكتمال B1 كاملاً بعدها!
# نفس آلة D586–D592: specs → tools/word-entry-generator.ts + ترقيع الدروس.
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORDS = [
  # ═══ u7 «البيئة والمجتمع» (62→85): d1 +2 · d2-d4 +5 · d5 +3 · d6 +3 ═══
  dict(id="umweltverschmutzung", unit=7, day=1, wordClass="noun", de="die Umweltverschmutzung", article="die", gender="die",
       plural="die Umweltverschmutzungen",
       pluralRuleNote="مركّبة (Umwelt+Verschmutzung) مؤنثة (die! -ung!) وجمعها die Umweltverschmutzungen.",
       ar=["تلّوث البيئة"],
       sample=("Die Umweltverschmutzung ist groß.", "التلوث كبير."),
       gap=("Die ___ ist groß. (تلّوث البيئة!)", "Umweltverschmutzung"),
       hunt=("~~der Umweltverschmutzung ist groß~~", "die Umweltverschmutzung ist groß"),
       hunt_why="الألمانية: die Umweltverschmutzung (die! -ung مؤنثة!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="kraftwerk", unit=7, day=1, wordClass="noun", de="das Kraftwerk", article="das", gender="das",
       plural="die Kraftwerke",
       pluralRuleNote="مركّب (Kraft+Werk) محايد (das!) وجمعه die Kraftwerke.",
       ar=["محطة الطاقة"],
       sample=("Das Kraftwerk ist hier.", "محطة الطاقة هنا."),
       gap=("Das ___ ist hier. (محطة الطاقة!)", "Kraftwerk"),
       hunt=("~~der Kraftwerk ist hier~~", "das Kraftwerk ist hier"),
       hunt_why="الألمانية: das Kraftwerk (das! مركّب محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="muellabfuhr", unit=7, day=2, wordClass="noun", de="die Müllabfuhr", article="die", gender="die",
       plural="die Müllabfuhren",
       pluralRuleNote="مركّبة (Müll+Abfuhr) مؤنثة (die!) وجمعها die Müllabfuhren (قياسي — المطبوع بلا علامة).",
       ar=["مصلحة القمّامة"],
       sample=("Die Müllabfuhr kommt.", "مصلحة القمّامة تأتي."),
       gap=("Die ___ kommt. (مصلحة القمّامة!)", "Müllabfuhr"),
       hunt=("~~der Müllabfuhr kommt~~", "die Müllabfuhr kommt"),
       hunt_why="الألمانية: die Müllabfuhr (die! مركّبة مؤنثة!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="gift", unit=7, day=2, wordClass="noun", de="das Gift", article="das", gender="das",
       plural="die Gifte",
       pluralRuleNote="محايد (das!) وجمعه die Gifte.",
       ar=["السمّ"],
       sample=("Das Gift ist gefährlich!", "السمّ خطير!"),
       gap=("Das ___ ist gefährlich! (السمّ!)", "Gift"),
       hunt=("~~der Gift ist gefährlich~~", "das Gift ist gefährlich"),
       hunt_why="الألمانية: das Gift (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="landwirtschaft", unit=7, day=2, wordClass="noun", de="die Landwirtschaft", article="die", gender="die",
       plural="die Landwirtschaften",
       pluralRuleNote="مركّبة (Land+Wirtschaft) مؤنثة (die!) وجمعها die Landwirtschaften (قياسي — المطبوع بلا علامة).",
       ar=["الفلاحة (الزراعة)"],
       sample=("Die Landwirtschaft ist wichtig.", "الفلاحة مهمة."),
       gap=("Die ___ ist wichtig. (الفلاحة!)", "Landwirtschaft"),
       hunt=("~~der Landwirtschaft ist wichtig~~", "die Landwirtschaft ist wichtig"),
       hunt_why="الألمانية: die Landwirtschaft (die! مركّبة مؤنثة!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="bauer", unit=7, day=2, wordClass="noun", de="der Bauer", article="der", gender="der",
       plural="die Bauern",
       pluralRuleNote="مذكّر (der!) وجمعه die Bauern (علامة -n!) — والمؤنث die Bäuerin.",
       ar=["الفلاح"],
       sample=("Der Bauer arbeitet.", "الفلاح يعمل."),
       gap=("Der ___ arbeitet. (الفلاح!)", "Bauer"),
       hunt=("~~die Bauer arbeitet~~", "der Bauer arbeitet"),
       hunt_why="الألمانية: der Bauer (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="ernte", unit=7, day=2, wordClass="noun", de="die Ernte", article="die", gender="die",
       plural="die Ernten",
       pluralRuleNote="مؤنثة (die!) وجمعها die Ernten.",
       ar=["الحصاد"],
       sample=("Die Ernte ist gut.", "الحصاد جيد."),
       gap=("Die ___ ist gut. (الحصاد!)", "Ernte"),
       hunt=("~~der Ernte ist gut~~", "die Ernte ist gut"),
       hunt_why="الألمانية: die Ernte (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="sturm", unit=7, day=3, wordClass="noun", de="der Sturm", article="der", gender="der",
       plural="die Stürme",
       pluralRuleNote="مذكّر (der!) وجمعه die Stürme (تقلب u→ü!).",
       ar=["العاصفة"],
       sample=("Der Sturm ist stark!", "العاصفة قوية!"),
       gap=("Der ___ ist stark! (العاصفة!)", "Sturm"),
       hunt=("~~die Sturm ist stark~~", "der Sturm ist stark"),
       hunt_why="الألمانية: der Sturm (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="fabrik", unit=7, day=3, wordClass="noun", de="die Fabrik", article="die", gender="die",
       plural="die Fabriken",
       pluralRuleNote="مؤنثة (die!) وجمعها die Fabriken (القاعدة: الفرعية المنتهية بـ-e تسقط قبل -en!).",
       ar=["المصنع"],
       sample=("Die Fabrik ist groß.", "المصنع كبير."),
       gap=("Die ___ ist groß. (المصنع!)", "Fabrik"),
       hunt=("~~der Fabrik ist groß~~", "die Fabrik ist groß"),
       hunt_why="الألمانية: die Fabrik (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="industrie", unit=7, day=3, wordClass="noun", de="die Industrie", article="die", gender="die",
       plural="die Industrien",
       pluralRuleNote="مؤنثة (die!) وجمعها die Industrien — قرض فرنسي.",
       ar=["الصناعة"],
       sample=("Die Industrie ist wichtig.", "الصناعة مهمة."),
       gap=("Die ___ ist wichtig. (الصناعة!)", "Industrie"),
       hunt=("~~der Industrie ist wichtig~~", "die Industrie ist wichtig"),
       hunt_why="الألمانية: die Industrie (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="benzin", unit=7, day=3, wordClass="noun", de="das Benzin", article="das", gender="das",
       plural="-",
       pluralRuleNote="يُستعمل عادةً بلا جمع: das Benzin.",
       ar=["البنزين"],
       sample=("Das Benzin ist teuer.", "البنزين غالٍ."),
       gap=("Das ___ ist teuer. (البنزين!)", "Benzin"),
       hunt=("~~der Benzin ist teuer~~", "das Benzin ist teuer"),
       hunt_why="الألمانية: das Benzin (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="krise", unit=7, day=3, wordClass="noun", de="die Krise", article="die", gender="die",
       plural="die Krisen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Krisen — قرض يوناني (الأزمة!).",
       ar=["الأزمة"],
       sample=("Die Krise ist schwer.", "الأزمة صعبة."),
       gap=("Die ___ ist schwer. (الأزمة!)", "Krise"),
       hunt=("~~der Krise ist schwer~~", "die Krise ist schwer"),
       hunt_why="الألمانية: die Krise (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="politik", unit=7, day=4, wordClass="noun", de="die Politik", article="die", gender="die",
       plural="die Politiken",
       pluralRuleNote="مؤنثة (die!) وجمعها die Politiken (نادر — المطبوع بلا علامة).",
       ar=["السياسة"],
       sample=("Die Politik ist wichtig.", "السياسة مهمة."),
       gap=("Die ___ ist wichtig. (السياسة!)", "Politik"),
       hunt=("~~der Politik ist wichtig~~", "die Politik ist wichtig"),
       hunt_why="الألمانية: die Politik (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="politisch", unit=7, day=4, wordClass="adjective", de="politisch", article=None, gender=None,
       plural=None,
       pluralRuleNote="صفة — بلا جمع.",
       ar=["سياسي"],
       sample=("Das Thema ist politisch.", "الموضوع سياسي."),
       gap=("Das Thema ist ___. (سياسي!)", "politisch"),
       hunt=("~~Das Thema ist Politik~~", "Das Thema ist politisch"),
       hunt_why="الصفة: politisch (بلا جمع!) — والاسم die Politik كلمة أخرى! (خريطة التداخل 10-ي!)"),
  dict(id="politiker", unit=7, day=4, wordClass="noun", de="der Politiker", article="der", gender="der",
       plural="die Politiker",
       pluralRuleNote="مذكّر (der!) وجمعه die Politiker (علامة «-» = مطابق!) — والمؤنث die Politikerin (وجمعها die Politikerinnen!).",
       ar=["السياسيّ (الرجل السياسي)"],
       sample=("Der Politiker spricht.", "السياسي يتكلّم."),
       gap=("Der ___ spricht. (السياسي!)", "Politiker"),
       hunt=("~~die Politiker spricht~~", "der Politiker spricht"),
       hunt_why="الألمانية: der Politiker (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="gewerkschaft", unit=7, day=4, wordClass="noun", de="die Gewerkschaft", article="die", gender="die",
       plural="die Gewerkschaften",
       pluralRuleNote="مركّبة (Gewerk+schaft!) مؤنثة (die! -schaft!) وجمعها die Gewerkschaften.",
       ar=["النقابة"],
       sample=("Die Gewerkschaft hilft.", "النقابة تساعد."),
       gap=("Die ___ hilft. (النقابة!)", "Gewerkschaft"),
       hunt=("~~der Gewerkschaft hilft~~", "die Gewerkschaft hilft"),
       hunt_why="الألمانية: die Gewerkschaft (die! -schaft مؤنثة!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="asyl", unit=7, day=4, wordClass="noun", de="das Asyl", article="das", gender="das",
       plural="die Asyle",
       pluralRuleNote="محايد (das!) وجمعه die Asyle (قياسي — المطبوع بلا علامة) — قرض لاتيني.",
       ar=["اللجوء (الحماية السياسية)"],
       sample=("Das Asyl ist wichtig.", "اللجوء مهم."),
       gap=("Das ___ ist wichtig. (اللجوء!)", "Asyl"),
       hunt=("~~der Asyl ist wichtig~~", "das Asyl ist wichtig"),
       hunt_why="الألمانية: das Asyl (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="jugend", unit=7, day=5, wordClass="noun", de="die Jugend", article="die", gender="die",
       plural="-",
       pluralRuleNote="تُستعمل عادةً بلا جمع: die Jugend (مرحلة الشباب!).",
       ar=["الشباب (مرحلة الشباب)"],
       sample=("Die Jugend ist schön.", "الشباب جميل."),
       gap=("Die ___ ist schön. (الشباب!)", "Jugend"),
       hunt=("~~der Jugend ist schön~~", "die Jugend ist schön"),
       hunt_why="الألمانية: die Jugend (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="senioren", unit=7, day=5, wordClass="noun", de="die Senioren", article="die", gender="die",
       plural="die Senioren",
       pluralRuleNote="كلمة جمع فقط (die Senioren (Pl.)!) — جمعها هي نفسها.",
       ar=["كبار السنّ"],
       sample=("Die Senioren sind hier.", "كبار السنّ هنا."),
       gap=("Die ___ sind hier. (كبار السنّ!)", "Senioren"),
       hunt=("~~der Senioren sind hier~~", "die Senioren sind hier"),
       hunt_why="الألمانية: die Senioren (die! كلمة جمع فقط!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="einwohner", unit=7, day=5, wordClass="noun", de="der Einwohner", article="der", gender="der",
       plural="die Einwohner",
       pluralRuleNote="مركّب (Ein+wohnen) مذكّر (der!) وجمعه die Einwohner (علامة «-» = مطابق!) — والمؤنث die Einwohnerin.",
       ar=["السكّان"],
       sample=("Der Einwohner wohnt hier.", "الساكن يسكن هنا."),
       gap=("Der ___ wohnt hier. (السكّان!)", "Einwohner"),
       hunt=("~~die Einwohner wohnt hier~~", "der Einwohner wohnt hier"),
       hunt_why="الألمانية: der Einwohner (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="risiko", unit=7, day=6, wordClass="noun", de="das Risiko", article="das", gender="das",
       plural="die Risiken",
       pluralRuleNote="محايد (das!) وجمعه die Risiken (المطبوع: das Risiko, Risiken!) — قرض إيطالي.",
       ar=["المخاطرة (الخطر)"],
       sample=("Das Risiko ist hoch.", "المخاطرة كبيرة."),
       gap=("Das ___ ist hoch. (المخاطرة!)", "Risiko"),
       hunt=("~~der Risiko ist hoch~~", "das Risiko ist hoch"),
       hunt_why="الألمانية: das Risiko (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="konsumieren", unit=7, day=6, wordClass="verb", de="konsumieren", article=None, gender=None,
       plural=None,
       pluralRuleNote="فعل (konsumiert, konsumierte, hat konsumiert) — بلا جمع.",
       ar=["يستهلك"],
       sample=("Wir konsumieren viel.", "نحن نستهلك كثيراً."),
       gap=("Wir ___ viel. (نستهلك!)", "konsumieren"),
       hunt=("~~Wir konsumierst viel~~", "Wir konsumieren viel"),
       hunt_why="الفعل konsumieren: ich konsumiere · du konsumierst · er/sie konsumiert — مع wir يبقى konsumieren! (خريطة التداخل 10-ي!)"),
  dict(id="konsum", unit=7, day=6, wordClass="noun", de="der Konsum", article="der", gender="der",
       plural="-",
       pluralRuleNote="يُستعمل عادةً بلا جمع: der Konsum.",
       ar=["الاستهلاك"],
       sample=("Der Konsum ist hoch.", "الاستهلاك مرتفع."),
       gap=("Der ___ ist hoch. (الاستهلاك!)", "Konsum"),
       hunt=("~~die Konsum ist hoch~~", "der Konsum ist hoch"),
       hunt_why="الألمانية: der Konsum (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
]
SPEAK_MODEL = {
  (7, 1): "Die Umweltverschmutzung ist groß, und das Kraftwerk ist hier.",
  (7, 2): "Die Müllabfuhr kommt. Das Gift ist gefährlich, und die Landwirtschaft ist wichtig.",
  (7, 3): "Der Sturm ist stark. Die Industrie ist wichtig, und die Krise ist schwer.",
  (7, 4): "Die Politik ist wichtig. Der Politiker spricht, und die Gewerkschaft hilft.",
  (7, 5): "Die Jugend ist schön. Die Senioren sind hier, und der Einwohner wohnt hier.",
  (7, 6): "Das Risiko ist hoch. Wir konsumieren viel, und der Konsum ist hoch.",
}
THEMA = {7: "البيئة والمجتمع"}
CRITERIA_FIX = {
  "b1-u7-d1": [("كلمات اليوم الاثنتا عشرة", "كلمات اليوم الست عشرة")],
  "b1-u7-d2": [("كلمات اليوم الإحدى عشرة", "كلمات اليوم الست عشرة")],
  "b1-u7-d3": [("كلمات اليوم الإحدى عشرة", "كلمات اليوم الست عشرة")],
  "b1-u7-d4": [("كلمات اليوم الإحدى عشرة", "كلمات اليوم الست عشرة")],
  "b1-u7-d5": [("كلمات اليوم العشر كلها", "كلمات اليوم الست عشرة كلها")],
  "b1-u7-d6": [("الكلمتان الجديدتان", "الكلمات الخمس")],
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
    gender = f'{w["gender"]}! ' if w["gender"] else ""
    return f'{w["de"]} {w["ar"][0]} ({gender}{w["pluralRuleNote"]}) — {w["sample"][0]}'


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
        out = ROOT / "tools/dev/.vocab-b1-gap5-specs.json"
        out.write_text(json.dumps(make_specs(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"specs: {len(WORDS)} → {out}")
    else:
        patch_lessons()
