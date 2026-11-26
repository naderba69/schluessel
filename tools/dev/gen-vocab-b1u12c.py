#!/usr/bin/env python3
# tools/dev/gen-vocab-b1u12c.py — إكمال b1-u12 — المجموعة الثالثة (D588 · +21 كلمة → 80/80!).
# نفس آلة D586/D587: specs → tools/word-entry-generator.ts (IPA/أعلام/صوت/goetheList) + ترقيع الدروس.
# التوزيع: d1-d3 +4 · d4-d6 +3 = 14/14/14/13/13/12 = 80/80 (اكتمال الوحدة!).
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORDS = [
  # ═══ d1 «الناس والمجتمع» — Integration ═══
  dict(id="buerger", day=1, wordClass="noun", de="der Bürger", article="der", gender="der",
       plural="die Bürger",
       pluralRuleNote="مذكّر (der!) وجمعه die Bürger (بلا تغيير!).",
       ar=["المواطن"],
       sample=("Der Bürger wohnt hier.", "المواطن يسكن هنا."),
       gap=("Der ___ wohnt hier. (المواطن!)", "Bürger"),
       hunt=("~~die Bürger wohnt hier~~", "der Bürger wohnt hier"),
       hunt_why="الألمانية: der Bürger (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="bevoelkerung", day=1, wordClass="noun", de="die Bevölkerung", article="die", gender="die",
       plural="-",
       pluralRuleNote="تُستعمل عادةً بلا جمع: die Bevölkerung.",
       ar=["السكان"],
       sample=("Die Bevölkerung ist groß.", "السكان كثيرون."),
       gap=("Die ___ ist groß. (السكان!)", "Bevölkerung"),
       hunt=("~~der Bevölkerung ist groß~~", "die Bevölkerung ist groß"),
       hunt_why="الألمانية: die Bevölkerung (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="migration", day=1, wordClass="noun", de="die Migration", article="die", gender="die",
       plural="die Migrationen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Migrationen.",
       ar=["الهجرة"],
       sample=("Die Migration ist wichtig.", "الهجرة مهمة."),
       gap=("Die ___ ist wichtig. (الهجرة!)", "Migration"),
       hunt=("~~das Migration ist wichtig~~", "die Migration ist wichtig"),
       hunt_why="الألمانية: die Migration (die!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="migrant", day=1, wordClass="noun", de="der Migrant", article="der", gender="der",
       plural="die Migranten",
       pluralRuleNote="اسم n-Deklination! (der Migrant! نظير der Student!) وجمعه die Migranten.",
       ar=["المهاجر"],
       sample=("Der Migrant lernt Deutsch.", "المهاجر يتعلّم الألمانية."),
       gap=("Der ___ lernt Deutsch. (المهاجر!)", "Migrant"),
       hunt=("~~die Migrant lernt Deutsch~~", "der Migrant lernt Deutsch"),
       hunt_why="الألمانية: der Migrant (der! n-Deklination!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  # ═══ d2 «العمل» ═══
  dict(id="arbeitsstelle", day=2, wordClass="noun", de="die Arbeitsstelle", article="die", gender="die",
       plural="die Arbeitsstellen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Arbeitsstellen.",
       ar=["مكان العمل · الوظيفة"],
       sample=("Die Arbeitsstelle ist gut.", "مكان العمل جيد."),
       gap=("Die ___ ist gut. (مكان العمل!)", "Arbeitsstelle"),
       hunt=("~~der Arbeitsstelle ist gut~~", "die Arbeitsstelle ist gut"),
       hunt_why="الألمانية: die Arbeitsstelle (die! مركّبة مؤنثة!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="anwalt", day=2, wordClass="noun", de="der Anwalt", article="der", gender="der",
       plural="die Anwälte",
       pluralRuleNote="مذكّر (der!) وجمعه die Anwälte (تقلب a→ä!).",
       ar=["المحامي"],
       sample=("Der Anwalt hilft.", "المحامي يساعد."),
       gap=("Der ___ hilft. (المحامي!)", "Anwalt"),
       hunt=("~~die Anwalt hilft~~", "der Anwalt hilft"),
       hunt_why="الألمانية: der Anwalt (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="verwaltung", day=2, wordClass="noun", de="die Verwaltung", article="die", gender="die",
       plural="die Verwaltungen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Verwaltungen.",
       ar=["الإدارة · السلطة الإدارية"],
       sample=("Die Verwaltung ist wichtig.", "الإدارة مهمة."),
       gap=("Die ___ ist wichtig. (الإدارة!)", "Verwaltung"),
       hunt=("~~das Verwaltung ist wichtig~~", "die Verwaltung ist wichtig"),
       hunt_why="الألمانية: die Verwaltung (die! -ung مؤنثة!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="kantine", day=2, wordClass="noun", de="die Kantine", article="die", gender="die",
       plural="die Kantinen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Kantinen.",
       ar=["المطعم (في العمل أو المدرسة)"],
       sample=("Die Kantine ist offen.", "المطعم مفتوح."),
       gap=("Die ___ ist offen. (المطعم!)", "Kantine"),
       hunt=("~~der Kantine ist offen~~", "die Kantine ist offen"),
       hunt_why="الألمانية: die Kantine (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  # ═══ d3 «التواصل والآراء» ═══
  dict(id="kommunikation", day=3, wordClass="noun", de="die Kommunikation", article="die", gender="die",
       plural="die Kommunikationen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Kommunikationen.",
       ar=["التواصل"],
       sample=("Die Kommunikation ist wichtig.", "التواصل مهم."),
       gap=("Die ___ ist wichtig. (التواصل!)", "Kommunikation"),
       hunt=("~~der Kommunikation ist wichtig~~", "die Kommunikation ist wichtig"),
       hunt_why="الألمانية: die Kommunikation (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="konferenz", day=3, wordClass="noun", de="die Konferenz", article="die", gender="die",
       plural="die Konferenzen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Konferenzen.",
       ar=["المؤتمّر · الاجتماع الكبير"],
       sample=("Die Konferenz ist heute.", "المؤتمّر اليوم."),
       gap=("Die ___ ist heute. (المؤتمّر!)", "Konferenz"),
       hunt=("~~der Konferenz ist heute~~", "die Konferenz ist heute"),
       hunt_why="الألمانية: die Konferenz (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="reaktion", day=3, wordClass="noun", de="die Reaktion", article="die", gender="die",
       plural="die Reaktionen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Reaktionen.",
       ar=["الاستجابة · الردّ الفوري"],
       sample=("Die Reaktion ist positiv.", "الاستجابة إيجابية."),
       gap=("Die ___ ist positiv. (الاستجابة!)", "Reaktion"),
       hunt=("~~das Reaktion ist positiv~~", "die Reaktion ist positiv"),
       hunt_why="الألمانية: die Reaktion (die!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="referat", day=3, wordClass="noun", de="das Referat", article="das", gender="das",
       plural="die Referate",
       pluralRuleNote="محايد (das!) وجمعه die Referate.",
       ar=["العرض (المحاضرة القصيرة)"],
       sample=("Das Referat ist fertig.", "العرض جاهز."),
       gap=("Das ___ ist fertig. (العرض!)", "Referat"),
       hunt=("~~der Referat ist fertig~~", "das Referat ist fertig"),
       hunt_why="الألمانية: das Referat (das!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  # ═══ d4 «الإعلام والمعلومات» ═══
  dict(id="wetterbericht", day=4, wordClass="noun", de="der Wetterbericht", article="der", gender="der",
       plural="die Wetterberichte",
       pluralRuleNote="مركّب (Wetter+Bericht) مذكّر (der!) وجمعه die Wetterberichte.",
       ar=["نشرة الطقس"],
       sample=("Der Wetterbericht kommt um acht.", "نشرة الطقس تأتي في الثامنة."),
       gap=("Der ___ kommt um acht. (نشرة الطقس!)", "Wetterbericht"),
       hunt=("~~die Wetterbericht kommt um acht~~", "der Wetterbericht kommt um acht"),
       hunt_why="الألمانية: der Wetterbericht (der! مركّب مذكّر!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="reportage", day=4, wordClass="noun", de="die Reportage", article="die", gender="die",
       plural="die Reportagen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Reportagen.",
       ar=["التقرير (الصحفي)"],
       sample=("Die Reportage ist spannend.", "التقرير مشوّق."),
       gap=("Die ___ ist spannend. (التقرير!)", "Reportage"),
       hunt=("~~der Reportage ist spannend~~", "die Reportage ist spannend"),
       hunt_why="الألمانية: die Reportage (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="recherche", day=4, wordClass="noun", de="die Recherche", article="die", gender="die",
       plural="die Recherchen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Recherchen.",
       ar=["البحث والتحقيق"],
       sample=("Die Recherche braucht Zeit.", "البحث يحتاج وقتاً."),
       gap=("Die ___ braucht Zeit. (البحث!)", "Recherche"),
       hunt=("~~der Recherche braucht Zeit~~", "die Recherche braucht Zeit"),
       hunt_why="الألمانية: die Recherche (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  # ═══ d5 «الصحة والمشاعر» ═══
  dict(id="infektion", day=5, wordClass="noun", de="die Infektion", article="die", gender="die",
       plural="die Infektionen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Infektionen.",
       ar=["العدوى"],
       sample=("Die Infektion ist schlimm.", "العدوى سيئة."),
       gap=("Die ___ ist schlimm. (العدوى!)", "Infektion"),
       hunt=("~~der Infektion ist schlimm~~", "die Infektion ist schlimm"),
       hunt_why="الألمانية: die Infektion (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="temperatur", day=5, wordClass="noun", de="die Temperatur", article="die", gender="die",
       plural="die Temperaturen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Temperaturen.",
       ar=["درجة الحرارة"],
       sample=("Die Temperatur ist hoch.", "درجة الحرارة مرتفعة."),
       gap=("Die ___ ist hoch. (درجة الحرارة!)", "Temperatur"),
       hunt=("~~der Temperatur ist hoch~~", "die Temperatur ist hoch"),
       hunt_why="الألمانية: die Temperatur (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="langeweile", day=5, wordClass="noun", de="die Langeweile", article="die", gender="die",
       plural="-",
       pluralRuleNote="تُستعمل عادةً بلا جمع: die Langeweile.",
       ar=["الملل"],
       sample=("Ich habe Langeweile.", "أشعر بالملل."),
       gap=("Ich habe ___. (أشعر بالملل!)", "Langeweile"),
       hunt=("~~ich habe der Langeweile~~", "Ich habe Langeweile."),
       hunt_why="haben + نصب بلا أداة: Langeweile (لا der Langeweile!) (خريطة التداخل 10-ي!)"),
  # ═══ d6 «المفاجآت والتغيير» ═══
  dict(id="ueberraschung", day=6, wordClass="noun", de="die Überraschung", article="die", gender="die",
       plural="die Überraschungen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Überraschungen.",
       ar=["المفاجأة"],
       sample=("Die Überraschung ist schön.", "المفاجأة جميلة."),
       gap=("Die ___ ist schön. (المفاجأة!)", "Überraschung"),
       hunt=("~~der Überraschung ist schön~~", "die Überraschung ist schön"),
       hunt_why="الألمانية: die Überraschung (die! -ung مؤنثة!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="zufall", day=6, wordClass="noun", de="der Zufall", article="der", gender="der",
       plural="die Zufälle",
       pluralRuleNote="مذكّر (der!) وجمعه die Zufälle (تقلب a→ä!).",
       ar=["الصدفة"],
       sample=("Das ist ein Zufall.", "هذه صدفة."),
       gap=("Das ist ein ___. (صدفة!)", "Zufall"),
       hunt=("~~Das ist eine Zufall.~~", "Das ist ein Zufall."),
       hunt_why="der Zufall = مذكّر: ein Zufall (لا eine!) (خريطة التداخل 10-ي!)"),
  dict(id="veraendern", day=6, wordClass="verb", de="verändern",
       ar=["يتغيّر · يُغيّر"],
       forms=dict(praesens3s="verändert", praeteritum="veränderte", perfekt="hat verändert", imperative="verändere"),
       sample=("Die Stadt verändert sich.", "المدينة تتغيّر."),
       gap=("Die Stadt ___ sich. (تتغيّر!)", "verändert"),
       hunt=("~~Die Stadt verändere sich.~~", "Die Stadt verändert sich."),
       hunt_why="الفعل مُصرَّف مع sich: verändert (لا verändere!) (خريطة التداخل 10-ي!)"),
]
SPEAK_MODEL = {
  1: "Die Bürger wohnen hier. Die Bevölkerung ist groß, und die Migration ist wichtig. Der Migrant lernt Deutsch.",
  2: "Die Arbeitsstelle ist gut. Der Anwalt hilft, und die Verwaltung hilft auch. Die Kantine ist offen.",
  3: "Die Kommunikation ist wichtig. Die Konferenz ist heute, und die Reaktion ist positiv. Das Referat ist fertig.",
  4: "Der Wetterbericht kommt um acht. Die Reportage ist spannend, und die Recherche braucht Zeit.",
  5: "Die Infektion ist schlimm. Die Temperatur ist hoch, und ich habe Langeweile.",
  6: "Die Überraschung ist schön. Das ist ein Zufall — und die Stadt verändert sich.",
}
THEMA = "Integration"  # موضوع b1-u12 (التكامل) كما في كلمات اليوم الأصلية


def clip_text(w: dict) -> str:
    return f'{w["de"]}.'


def make_specs() -> list[dict]:
    out = []
    for w in WORDS:
        spec = dict(de=w["de"], ar=w["ar"], wordClass=w["wordClass"], level="B1", unit=12,
                    lesson=f"b1-u12-d{w['day']}", thema=THEMA,
                    sample=dict(de=w["sample"][0], ar=w["sample"][1]))
        if w["wordClass"] == "noun":
            spec["plural"] = w["plural"]
            spec["pluralRuleNote"] = w["pluralRuleNote"]
        if "forms" in w:
            spec["forms"] = w["forms"]
        out.append(spec)
    return out


def why_for(w: dict) -> str:
    if w["wordClass"] == "noun":
        return f'{w["de"]} {w["ar"][0]} ({w["gender"]}! {w["pluralRuleNote"]}) — {w["sample"][0]}'
    return f'{w["de"]} {w["ar"][0]} — {w["sample"][0]}'


def patch_lessons() -> None:
    by_day: dict[int, list[dict]] = {}
    for w in WORDS:
        by_day.setdefault(w["day"], []).append(w)
    for day, ws in by_day.items():
        p = ROOT / f"content/lessons/b1/b1-u12-d{day}.json"
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
        stations["match"]["items"].append(dict(
            pairs=[dict(ar=w["ar"][0], de=w["de"].split(",")[0]) for w in ws],
            why=" · ".join(f'{w["de"].split(",")[0]} {w["ar"][0]}' for w in ws) + " (خريطة التداخل 10-ي!)"))
        for w in ws:
            stations["gap-fill"]["items"].append(dict(
                q=w["gap"][0], a=w["gap"][1], why=why_for(w)))
            stations["error-hunt"]["items"].append(dict(
                q=w["hunt"][0], a=w["hunt"][1], why=w["hunt_why"]))
            clip = clip_text(w)
            stations["listening"]["items"].append(dict(
                audioId=f'word-{w["id"]}', speakText=clip,
                q="استمع: ماذا تعني الكلمة؟",
                choices=[w["ar"][0], ws[(ws.index(w) + 1) % len(ws)]["ar"][0], ws[(ws.index(w) + 2) % len(ws)]["ar"][0]],
                a=w["ar"][0],
                why=f'الصوت يقول «{clip[:-1]}» — معناها «{w["ar"][0]}». ركّز!'))
            stations["dictation"]["items"].append(dict(
                audioId=f'word-{w["id"]}', speakText=clip,
                a=w["de"].split(",")[0],
                why=f'اكتب ما تسمعه حرفياً: «{clip[:-1]}» تعني «{w["ar"][0]}». انتبه للحروف الكبيرة!'))
        stations["speaking"]["items"].append(dict(
            q=f'تكلّم عن يومك! (جملتان! استعمل كلمات اليوم الجديدة: {" · ".join(w["de"].split(",")[0] for w in ws)})',
            a=SPEAK_MODEL[day],
            why="المراجعة بالكلام! كلمات اليوم الجديدة كلها في الجُمل."))
        for v in d["quiz"]["variants"]:
            for w in ws:
                v["items"].append(dict(q=w["gap"][0], a=w["gap"][1], why=why_for(w)))
        s = d["zusammenfassung"]["summary"]
        s["de"] = s["de"].rstrip() + " " + " ".join(w["sample"][0] for w in ws)
        s["ar"] = s["ar"].rstrip() + " " + " ".join(w["sample"][1] for w in ws)
        task = d["uebung"]["communicativeTask"]
        task["goal"]["de"] = task["goal"]["de"].rstrip() + " " + SPEAK_MODEL[day]
        task["successCriteria"] = [x.replace("كلمات اليوم الست", "كلمات اليوم الجديدة")
                                   .replace("كلمات اليوم الثلاث", "كلمات اليوم الجديدة")
                                   .replace("كلمات اليوم العشر", "كلمات اليوم الجديدة")
                                   for x in task["successCriteria"]]
        p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"patched b1-u12-d{day}: +{len(ids)} كلمات")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "specs"
    if mode == "specs":
        out = ROOT / "tools/dev/.vocab-b1u12c-specs.json"
        out.write_text(json.dumps(make_specs(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"specs: {len(WORDS)} → {out}")
    else:
        patch_lessons()
