#!/usr/bin/env python3
# tools/dev/gen-vocab-b1-gap1.py — إغلاق فجوات B1 — الدفعة الأولى (D589 · +13 كلمة في 4 وحدات!).
# u10 +1 (79→80) · u11 +2 (78→80) · u9 +2 (78→80) · u8 +8 (77→85) — أهداف الدستور §3-ج!
# نفس آلة D586–D588: specs → tools/word-entry-generator.ts (IPA/أعلام/صوت/goetheList) + ترقيع الدروس.
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORDS = [
  # ═══ u8 «العمل والترشيح» (77→85): d1-d5 +1 · d6 +3 ═══
  dict(id="fachmann", unit=8, day=1, wordClass="noun", de="der Fachmann", article="der", gender="der",
       plural="die Fachleute",
       pluralRuleNote="مذكّر (der!) وجمعه الشاذّ die Fachleute (لا Fachmänner!). ونظيره المؤنث die Fachfrau.",
       ar=["الخبير · الفني"],
       sample=("Der Fachmann hilft.", "الخبير يساعد."),
       gap=("Der ___ hilft. (الخبير!)", "Fachmann"),
       hunt=("~~die Fachmann hilft~~", "der Fachmann hilft"),
       hunt_why="الألمانية: der Fachmann (der! مركّب مذكّر!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="personal", unit=8, day=2, wordClass="noun", de="das Personal", article="das", gender="das",
       plural="-",
       pluralRuleNote="محايد (das!) ويُستعمل عادةً بلا جمع: das Personal (الموظفون جماعة!).",
       ar=["الموظفون · الطاقم"],
       sample=("Das Personal ist freundlich.", "الموظفون ودودون."),
       gap=("Das ___ ist freundlich. (الموظفون!)", "Personal"),
       hunt=("~~der Personal ist freundlich~~", "das Personal ist freundlich"),
       hunt_why="الألمانية: das Personal (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="sekretaer", unit=8, day=3, wordClass="noun", de="der Sekretär", article="der", gender="der",
       plural="die Sekretäre",
       pluralRuleNote="اسم n-Deklination (der Sekretär!) وجمعه die Sekretäre — ونظيره المؤنث die Sekretärin.",
       ar=["السكرتير"],
       sample=("Der Sekretär arbeitet hier.", "السكرتير يعمل هنا."),
       gap=("Der ___ arbeitet hier. (السكرتير!)", "Sekretär"),
       hunt=("~~die Sekretär arbeitet hier~~", "der Sekretär arbeitet hier"),
       hunt_why="الألمانية: der Sekretär (der! n-Deklination!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="ordner", unit=8, day=4, wordClass="noun", de="der Ordner", article="der", gender="der",
       plural="die Ordner",
       pluralRuleNote="مذكّر (der!) وجمعه die Ordner (بلا تغيير!).",
       ar=["المجلّد"],
       sample=("Der Ordner ist neu.", "المجلّد جديد."),
       gap=("Der ___ ist neu. (المجلّد!)", "Ordner"),
       hunt=("~~die Ordner ist neu~~", "der Ordner ist neu"),
       hunt_why="الألمانية: der Ordner (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="vertreter", unit=8, day=5, wordClass="noun", de="der Vertreter", article="der", gender="der",
       plural="die Vertreter",
       pluralRuleNote="مذكّر (der!) وجمعه die Vertreter (بلا تغيير!) — والمؤنث die Vertreterin.",
       ar=["المندوب · الوكيل"],
       sample=("Der Vertreter kommt morgen.", "المندوب يأتي غداً."),
       gap=("Der ___ kommt morgen. (المندوب!)", "Vertreter"),
       hunt=("~~die Vertreter kommt morgen~~", "der Vertreter kommt morgen"),
       hunt_why="الألمانية: der Vertreter (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="entlassung", unit=8, day=6, wordClass="noun", de="die Entlassung", article="die", gender="die",
       plural="die Entlassungen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Entlassungen.",
       ar=["الطرد من العمل"],
       sample=("Die Entlassung ist schlimm.", "الطرد من العمل سيّئ."),
       gap=("Die ___ ist schlimm. (الطرد من العمل!)", "Entlassung"),
       hunt=("~~der Entlassung ist schlimm~~", "die Entlassung ist schlimm"),
       hunt_why="الألمانية: die Entlassung (die! -ung مؤنثة!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="vertretung", unit=8, day=6, wordClass="noun", de="die Vertretung", article="die", gender="die",
       plural="die Vertretungen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Vertretungen.",
       ar=["النيابة · التمثيل"],
       sample=("Die Vertretung kommt heute.", "النيابة تأتي اليوم."),
       gap=("Die ___ kommt heute. (النيابة!)", "Vertretung"),
       hunt=("~~der Vertretung kommt heute~~", "die Vertretung kommt heute"),
       hunt_why="الألمانية: die Vertretung (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="rente", unit=8, day=6, wordClass="noun", de="die Rente", article="die", gender="die",
       plural="die Renten",
       pluralRuleNote="مؤنثة (die!) وجمعها die Renten — وفي النمسا/سويسرا: die Pension.",
       ar=["المعاش التقاعدي"],
       sample=("Die Rente ist wichtig.", "المعاش التقاعدي مهم."),
       gap=("Die ___ ist wichtig. (المعاش التقاعدي!)", "Rente"),
       hunt=("~~der Rente ist wichtig~~", "die Rente ist wichtig"),
       hunt_why="الألمانية: die Rente (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  # ═══ u9 «النزاعات والحلول» (78→80): d6 +2 ═══
  dict(id="gegner", unit=9, day=6, wordClass="noun", de="der Gegner", article="der", gender="der",
       plural="die Gegner",
       pluralRuleNote="مذكّر (der!) وجمعه die Gegner (بلا تغيير!) — والمؤنث die Gegnerin.",
       ar=["الخصم"],
       sample=("Der Gegner ist stark.", "الخصم قويّ."),
       gap=("Der ___ ist stark. (الخصم!)", "Gegner"),
       hunt=("~~die Gegner ist stark~~", "der Gegner ist stark"),
       hunt_why="الألمانية: der Gegner (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="prozess", unit=9, day=6, wordClass="noun", de="der Prozess", article="der", gender="der",
       plural="die Prozesse",
       pluralRuleNote="مذكّر (der!) وجمعه die Prozesse — والكلمة قرض لاتيني (ss في المفرد!).",
       ar=["القضية · المحاكمة"],
       sample=("Der Prozess beginnt heute.", "القضية تبدأ اليوم."),
       gap=("Der ___ beginnt heute. (القضية!)", "Prozess"),
       hunt=("~~der Prozess beginne heute~~", "Der Prozess beginnt heute."),
       hunt_why="الضمير der Prozess يطلب الفعل المُصرَّف beginnt (لا beginne!) (خريطة التداخل 10-ي!)"),
  # ═══ u10 «الأرقام والإحصاء» (79→80): d6 +1 ═══
  dict(id="faktor", unit=10, day=6, wordClass="noun", de="der Faktor", article="der", gender="der",
       plural="die Faktoren",
       pluralRuleNote="مذكّر (der!) وجمعه die Faktoren (-en!) — قرض لاتيني.",
       ar=["العامل (الرقمي)"],
       sample=("Das ist ein Faktor.", "هذا عامل."),
       gap=("Das ist ein ___. (عامل!)", "Faktor"),
       hunt=("~~Das ist eine Faktor.~~", "Das ist ein Faktor."),
       hunt_why="der Faktor = مذكّر: ein Faktor (لا eine!) (خريطة التداخل 10-ي!)"),
  # ═══ u11 «الهوايات والمجتمع» (78→80): d6 +2 ═══
  dict(id="gedicht", unit=11, day=6, wordClass="noun", de="das Gedicht", article="das", gender="das",
       plural="die Gedichte",
       pluralRuleNote="محايد (das!) وجمعه die Gedichte.",
       ar=["القصيدة"],
       sample=("Das Gedicht ist schön.", "القصيدة جميلة."),
       gap=("Das ___ ist schön. (القصيدة!)", "Gedicht"),
       hunt=("~~der Gedicht ist schön~~", "das Gedicht ist schön"),
       hunt_why="الألمانية: das Gedicht (das! محايد!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="literatur", unit=11, day=6, wordClass="noun", de="die Literatur", article="die", gender="die",
       plural="-",
       pluralRuleNote="مؤنثة (die!) وتُستعمل عادةً بلا جمع: die Literatur.",
       ar=["الأدب"],
       sample=("Die Literatur ist spannend.", "الأدب مشوّق."),
       gap=("Die ___ ist spannend. (الأدب!)", "Literatur"),
       hunt=("~~der Literatur ist spannend~~", "die Literatur ist spannend"),
       hunt_why="الألمانية: die Literatur (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
]
SPEAK_MODEL = {
  (8, 1): "Der Fachmann arbeitet hier. Die Qualifikation ist wichtig.",
  (8, 2): "Das Personal ist freundlich. Die Nachfrage ist groß.",
  (8, 3): "Der Sekretär arbeitet hier. Die Arbeitszeit ist wichtig.",
  (8, 4): "Der Ordner ist neu. Die Daten sind wichtig.",
  (8, 5): "Der Vertreter kommt morgen. Der Auftrag ist wichtig.",
  (8, 6): "Die Entlassung ist schlimm. Die Vertretung hilft, und die Rente kommt später.",
  (9, 6): "Der Gegner ist stark. Der Prozess beginnt heute.",
  (10, 6): "Der Faktor ist wichtig. Die Zahlen sind klar.",
  (11, 6): "Das Gedicht ist schön. Die Literatur ist spannend.",
}
THEMA = {8: "العمل والترشيح", 9: "النزاعات والحلول", 10: "الأرقام والإحصاء", 11: "الهوايات والمجتمع"}
# نصوص المعايير المثبّتة بالأعداد → الأعداد الجديدة (كل درس يعالج نصّه!)
CRITERIA_FIX = {
  "b1-u8-d1": [("الكلمات الخمس عشرة", "الكلمات الست عشرة")],
  "b1-u8-d2": [("الكلمات الخمس عشرة", "الكلمات الست عشرة")],
  "b1-u8-d3": [("الكلمات الخمس عشرة", "الكلمات الست عشرة")],
  "b1-u8-d4": [("الكلمات الخمس عشرة", "الكلمات الست عشرة")],
  "b1-u8-d5": [("الكلمات الخمس عشرة", "الكلمات الست عشرة")],
  "b1-u8-d6": [("الكلمتان الجديدتان", "الكلمات الخمس")],
  "b1-u9-d6": [("كلمات اليوم الثلاث", "كلمات اليوم الخمس")],
  "b1-u10-d6": [("كلمات اليوم الثلاث", "كلمات اليوم الأربع")],
  "b1-u11-d6": [("كلمات اليوم الثلاث", "كلمات اليوم الخمس")],
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
        out = ROOT / "tools/dev/.vocab-b1-gap1-specs.json"
        out.write_text(json.dumps(make_specs(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"specs: {len(WORDS)} → {out}")
    else:
        patch_lessons()
