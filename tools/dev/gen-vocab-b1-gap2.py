#!/usr/bin/env python3
# tools/dev/gen-vocab-b1-gap2.py — إغلاق فجوات B1 — الدفعة الثانية (D590 · +22 كلمة في وحدتين!).
# u5 «الإعلام والرأي» (67→80) + u3 «الصحة والتأمين» (76→85) — أهداف الدستور §3-ج!
# نفس آلة D586–D589: specs → tools/word-entry-generator.ts + ترقيع الدروس (قواعد الدفعات الصغيرة مدمجة).
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORDS = [
  # ═══ u5 «الإعلام والرأي» (67→80): d1-d5 +2 · d6 +3 ═══
  dict(id="magazin", unit=5, day=1, wordClass="noun", de="das Magazin", article="das", gender="das",
       plural="die Magazine",
       pluralRuleNote="محايد (das!) وجمعه die Magazine.",
       ar=["المجلة"],
       sample=("Das Magazin ist neu.", "المجلة جديدة."),
       gap=("Das ___ ist neu. (المجلة!)", "Magazin"),
       hunt=("~~der Magazin ist neu~~", "das Magazin ist neu"),
       hunt_why="الألمانية: das Magazin (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="reklame", unit=5, day=1, wordClass="noun", de="die Reklame", article="die", gender="die",
       plural="die Reklamen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Reklamen.",
       ar=["الدعاية"],
       sample=("Die Reklame ist laut.", "الدعاية صاخبة."),
       gap=("Die ___ ist laut. (الدعاية!)", "Reklame"),
       hunt=("~~der Reklame ist laut~~", "die Reklame ist laut"),
       hunt_why="الألمانية: die Reklame (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="serie", unit=5, day=2, wordClass="noun", de="die Serie", article="die", gender="die",
       plural="die Serien",
       pluralRuleNote="مؤنثة (die!) وجمعها die Serien.",
       ar=["المسلسل · السلسلة"],
       sample=("Die Serie ist spannend.", "المسلسل مشوّق."),
       gap=("Die ___ ist spannend. (المسلسل!)", "Serie"),
       hunt=("~~der Serie ist spannend~~", "die Serie ist spannend"),
       hunt_why="الألمانية: die Serie (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="studio", unit=5, day=2, wordClass="noun", de="das Studio", article="das", gender="das",
       plural="die Studios",
       pluralRuleNote="محايد (das!) وجمعه die Studios (s!).",
       ar=["الاستوديو"],
       sample=("Das Studio ist groß.", "الاستوديو كبير."),
       gap=("Das ___ ist groß. (الاستوديو!)", "Studio"),
       hunt=("~~der Studio ist groß~~", "das Studio ist groß"),
       hunt_why="الألمانية: das Studio (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="kanal", unit=5, day=3, wordClass="noun", de="der Kanal", article="der", gender="der",
       plural="die Kanäle",
       pluralRuleNote="مذكّر (der!) وجمعه die Kanäle (تقلب a→ä!).",
       ar=["القناة"],
       sample=("Der Kanal zeigt Filme.", "القناة تعرض أفلاماً."),
       gap=("Der ___ zeigt Filme. (القناة!)", "Kanal"),
       hunt=("~~die Kanal zeigt Filme~~", "der Kanal zeigt Filme"),
       hunt_why="الألمانية: der Kanal (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="annonce", unit=5, day=3, wordClass="noun", de="die Annonce", article="die", gender="die",
       plural="die Annoncen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Annoncen — قرض فرنسي (الإعلان في الصحيفة).",
       ar=["الإعلان (في الصحيفة)"],
       sample=("Die Annonce ist kurz.", "الإعلان قصير."),
       gap=("Die ___ ist kurz. (الإعلان!)", "Annonce"),
       hunt=("~~der Annonce ist kurz~~", "die Annonce ist kurz"),
       hunt_why="الألمانية: die Annonce (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="kabel", unit=5, day=4, wordClass="noun", de="das Kabel", article="das", gender="das",
       plural="die Kabel",
       pluralRuleNote="محايد (das!) وجمعه die Kabel (بلا تغيير!).",
       ar=["الكابل · السلك"],
       sample=("Das Kabel ist lang.", "السلك طويل."),
       gap=("Das ___ ist lang. (السلك!)", "Kabel"),
       hunt=("~~der Kabel ist lang~~", "das Kabel ist lang"),
       hunt_why="الألمانية: das Kabel (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="lautsprecher", unit=5, day=4, wordClass="noun", de="der Lautsprecher", article="der", gender="der",
       plural="die Lautsprecher",
       pluralRuleNote="مركّب (Laut+Sprecher) مذكّر (der!) وجمعه die Lautsprecher.",
       ar=["مكبر الصوت"],
       sample=("Der Lautsprecher ist laut.", "مكبر الصوت صاخب."),
       gap=("Der ___ ist laut. (مكبر الصوت!)", "Lautsprecher"),
       hunt=("~~die Lautsprecher ist laut~~", "der Lautsprecher ist laut"),
       hunt_why="الألمانية: der Lautsprecher (der! مركّب مذكّر!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="video", unit=5, day=5, wordClass="noun", de="das Video", article="das", gender="das",
       plural="die Videos",
       pluralRuleNote="محايد (das!) وجمعه die Videos (s!).",
       ar=["الفيديو"],
       sample=("Das Video ist kurz.", "الفيديو قصير."),
       gap=("Das ___ ist kurz. (الفيديو!)", "Video"),
       hunt=("~~der Video ist kurz~~", "das Video ist kurz"),
       hunt_why="الألمانية: das Video (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="monitor", unit=5, day=5, wordClass="noun", de="der Monitor", article="der", gender="der",
       plural="die Monitore",
       pluralRuleNote="مذكّر (der!) وجمعه die Monitore.",
       ar=["الشاشة (الرقمية)"],
       sample=("Der Monitor ist groß.", "الشاشة كبيرة."),
       gap=("Der ___ ist groß. (الشاشة!)", "Monitor"),
       hunt=("~~die Monitor ist groß~~", "der Monitor ist groß"),
       hunt_why="الألمانية: der Monitor (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="fotografie", unit=5, day=6, wordClass="noun", de="die Fotografie", article="die", gender="die",
       plural="die Fotografien",
       pluralRuleNote="مؤنثة (die!) وجمعها die Fotografien (-ien!).",
       ar=["التصوير"],
       sample=("Die Fotografie ist schön.", "التصوير جميل."),
       gap=("Die ___ ist schön. (التصوير!)", "Fotografie"),
       hunt=("~~der Fotografie ist schön~~", "die Fotografie ist schön"),
       hunt_why="الألمانية: die Fotografie (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="kassette", unit=5, day=6, wordClass="noun", de="die Kassette", article="die", gender="die",
       plural="die Kassetten",
       pluralRuleNote="مؤنثة (die!) وجمعها die Kassetten.",
       ar=["الشريط (الصوتي)"],
       sample=("Die Kassette ist alt.", "الشريط قديم."),
       gap=("Die ___ ist alt. (الشريط!)", "Kassette"),
       hunt=("~~der Kassette ist alt~~", "die Kassette ist alt"),
       hunt_why="الألمانية: die Kassette (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="festplatte", unit=5, day=6, wordClass="noun", de="die Festplatte", article="die", gender="die",
       plural="die Festplatten",
       pluralRuleNote="مركّبة (Fest+Platte) مؤنثة (die!) وجمعها die Festplatten.",
       ar=["القرص الصلب"],
       sample=("Die Festplatte ist voll.", "القرص الصلب ممتلئ."),
       gap=("Die ___ ist voll. (القرص الصلب!)", "Festplatte"),
       hunt=("~~der Festplatte ist voll~~", "die Festplatte ist voll"),
       hunt_why="الألمانية: die Festplatte (die! مركّبة مؤنثة!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  # ═══ u3 «الصحة والتأمين» (76→85): d1 +2 · d2 +1 · d4 +1 · d5 +1 · d6 +4 ═══
  dict(id="schmerzmittel", unit=3, day=1, wordClass="noun", de="das Schmerzmittel", article="das", gender="das",
       plural="die Schmerzmittel",
       pluralRuleNote="مركّب (Schmerz+Mittel) محايد (das!) وجمعه die Schmerzmittel.",
       ar=["مسكّن الألم"],
       sample=("Das Schmerzmittel hilft.", "مسكّن الألم يساعد."),
       gap=("Das ___ hilft. (مسكّن الألم!)", "Schmerzmittel"),
       hunt=("~~der Schmerzmittel hilft~~", "das Schmerzmittel hilft"),
       hunt_why="الألمانية: das Schmerzmittel (das! مركّب محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="krankenpfleger", unit=3, day=1, wordClass="noun", de="der Krankenpfleger", article="der", gender="der",
       plural="die Krankenpfleger",
       pluralRuleNote="مركّب (Kranken+Pfleger) مذكّر (der!) وجمعه die Krankenpfleger — والمؤنث die Krankenpflegerin.",
       ar=["الممرض"],
       sample=("Der Krankenpfleger hilft mir.", "الممرض يساعدني."),
       gap=("Der ___ hilft mir. (الممرض!)", "Krankenpfleger"),
       hunt=("~~die Krankenpfleger hilft mir~~", "der Krankenpfleger hilft mir"),
       hunt_why="الألمانية: der Krankenpfleger (der! مركّب مذكّر!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="brust", unit=3, day=2, wordClass="noun", de="die Brust", article="die", gender="die",
       plural="die Brüste",
       pluralRuleNote="مؤنثة (die!) وجمعها die Brüste (تقلب u→ü!).",
       ar=["الصدر"],
       sample=("Die Brust tut weh.", "الصدر يألمن."),
       gap=("Die ___ tut weh. (الصدر!)", "Brust"),
       hunt=("~~der Brust tut weh~~", "die Brust tut weh"),
       hunt_why="الألمانية: die Brust (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="schwangerschaft", unit=3, day=4, wordClass="noun", de="die Schwangerschaft", article="die", gender="die",
       plural="die Schwangerschaften",
       pluralRuleNote="مؤنثة (die!) وجمعها die Schwangerschaften.",
       ar=["الحمل (الإنجابي)"],
       sample=("Die Schwangerschaft ist neun Monate lang.", "الحمل تسعة أشهر."),
       gap=("Die ___ ist wichtig. (الحمل!)", "Schwangerschaft"),
       hunt=("~~der Schwangerschaft ist wichtig~~", "die Schwangerschaft ist wichtig"),
       hunt_why="الألمانية: die Schwangerschaft (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="waerme", unit=3, day=5, wordClass="noun", de="die Wärme", article="die", gender="die",
       plural="-",
       pluralRuleNote="تُستعمل عادةً بلا جمع: die Wärme.",
       ar=["الدفء"],
       sample=("Die Wärme ist gut.", "الدفء جيد."),
       gap=("Die ___ ist gut. (الدفء!)", "Wärme"),
       hunt=("~~der Wärme ist gut~~", "die Wärme ist gut"),
       hunt_why="الألمانية: die Wärme (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="atem", unit=3, day=6, wordClass="noun", de="der Atem", article="der", gender="der",
       plural="-",
       pluralRuleNote="يُستعمل عادةً بلا جمع: der Atem.",
       ar=["النَّفَس"],
       sample=("Der Atem ist ruhig.", "النَّفَس هادئ."),
       gap=("Der ___ ist ruhig. (النَّفَس!)", "Atem"),
       hunt=("~~die Atem ist ruhig~~", "der Atem ist ruhig"),
       hunt_why="الألمانية: der Atem (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="vitamin", unit=3, day=6, wordClass="noun", de="das Vitamin", article="das", gender="das",
       plural="die Vitamine",
       pluralRuleNote="محايد (das!) وجمعه die Vitamine (-e!).",
       ar=["الفيتامين"],
       sample=("Das Vitamin ist wichtig.", "الفيتامين مهم."),
       gap=("Das ___ ist wichtig. (الفيتامين!)", "Vitamin"),
       hunt=("~~der Vitamin ist wichtig~~", "das Vitamin ist wichtig"),
       hunt_why="الألمانية: das Vitamin (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="zahnbuerste", unit=3, day=6, wordClass="noun", de="die Zahnbürste", article="die", gender="die",
       plural="die Zahnbürsten",
       pluralRuleNote="مركّبة (Zahn+Bürste) مؤنثة (die!) وجمعها die Zahnbürsten.",
       ar=["فرشاة الأسنان"],
       sample=("Die Zahnbürste ist neu.", "فرشاة الأسنان جديدة."),
       gap=("Die ___ ist neu. (فرشاة الأسنان!)", "Zahnbürste"),
       hunt=("~~der Zahnbürste ist neu~~", "die Zahnbürste ist neu"),
       hunt_why="الألمانية: die Zahnbürste (die! مركّبة مؤنثة!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="zahncreme", unit=3, day=6, wordClass="noun", de="die Zahncreme", article="die", gender="die",
       plural="die Zahncremes",
       pluralRuleNote="مؤنثة (die!) وجمعها die Zahncremes (-s!) — وتُكتب أيضاً Zahnpasta.",
       ar=["معجون الأسنان"],
       sample=("Die Zahncreme ist leer.", "معجون الأسنان فارغ."),
       gap=("Die ___ ist leer. (معجون الأسنان!)", "Zahncreme"),
       hunt=("~~der Zahncreme ist leer~~", "die Zahncreme ist leer"),
       hunt_why="الألمانية: die Zahncreme (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
]
SPEAK_MODEL = {
  (5, 1): "Das Magazin ist neu. Die Reklame ist laut.",
  (5, 2): "Die Serie ist spannend. Das Studio ist groß.",
  (5, 3): "Der Kanal zeigt Filme. Die Annonce ist kurz.",
  (5, 4): "Das Kabel ist lang. Der Lautsprecher ist laut.",
  (5, 5): "Das Video ist kurz. Der Monitor ist groß.",
  (5, 6): "Die Fotografie ist schön. Die Kassette ist alt, und die Festplatte ist voll.",
  (3, 1): "Das Schmerzmittel hilft. Der Krankenpfleger hilft mir.",
  (3, 2): "Die Brust tut weh. Das ist nicht schön.",
  (3, 4): "Die Schwangerschaft ist neun Monate lang.",
  (3, 5): "Die Wärme ist gut.",
  (3, 6): "Der Atem ist ruhig. Das Vitamin ist wichtig. Die Zahnbürste und die Zahncreme sind neu.",
}
THEMA = {3: "الصحة والتأمين", 5: "الإعلام والرأي"}
# نصوص المعايير المثبّتة بالأعداد → الأعداد الجديدة (u3-d5 نصّه «الست عشرة» = صحيح بعد الترقيع!)
CRITERIA_FIX = {
  "b1-u5-d1": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الخمس عشرة")],
  "b1-u5-d2": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الخمس عشرة")],
  "b1-u5-d3": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الخمس عشرة")],
  "b1-u5-d4": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الخمس عشرة")],
  "b1-u5-d5": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الخمس عشرة")],
  "b1-u3-d1": [("كلمات اليوم الثلاث عشرة", "كلمات اليوم الخمس عشرة")],
  "b1-u3-d2": [("كلمات اليوم الخمس عشرة", "كلمات اليوم الست عشرة")],
  "b1-u3-d4": [("كلمات اليوم الخمس عشرة", "كلمات اليوم الست عشرة")],
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
        # أزواج المطابقة: ≥3 إجباري! الدفعات الصغيرة تُكمَّل بكلمات اليوم القديمة (مراجعة!)
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
        # بنك المشتتات: كل كلمات اليوم (جديدة + قديمة) لاختيارات مسموعة متمايزة!
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
        out = ROOT / "tools/dev/.vocab-b1-gap2-specs.json"
        out.write_text(json.dumps(make_specs(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"specs: {len(WORDS)} → {out}")
    else:
        patch_lessons()
