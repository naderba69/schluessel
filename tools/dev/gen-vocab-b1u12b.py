#!/usr/bin/env python3
# tools/dev/gen-vocab-b1u12b.py — إغناء b1-u12 — المجموعة الثانية (D587 · +24 كلمة من قائمة جوته B1).
# نفس آلة D586: specs → tools/word-entry-generator.ts (IPA/أعلام/صوت/goetheList) + ترقيع الدروس.
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORDS = [
  # ═══ d1 «Wortschatz/Zertifikat/Konzentration» — التعلّم ═══
  dict(id="gedanke", day=1, wordClass="noun", de="der Gedanke", article="der", gender="der",
       plural="die Gedanken",
       pluralRuleNote="اسم -e مذكّر n-Deklination! (der Gedanke!) وجمعه die Gedanken.",
       ar=["الفكرة"],
       sample=("Der Gedanke ist klar.", "الفكرة واضحة."),
       gap=("Der ___ ist klar. (الفكرة!)", "Gedanke"),
       hunt=("~~die Gedanke ist klar~~", "der Gedanke ist klar"),
       hunt_why="الألمانية: der Gedanke (der! n-Deklination!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="erziehung", day=1, wordClass="noun", de="die Erziehung", article="die", gender="die",
       plural="die Erziehungen",
       pluralRuleNote="-ung مؤنثة دائماً (die!) وجمعها -ungen.",
       ar=["التربية"],
       sample=("Die Erziehung ist wichtig.", "التربية مهمة."),
       gap=("Die ___ ist wichtig. (التربية!)", "Erziehung"),
       hunt=("~~das Erziehung ist wichtig~~", "die Erziehung ist wichtig"),
       hunt_why="الألمانية: die Erziehung (die! -ung مؤنثة دائماً!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="kursleiter", day=1, wordClass="noun", de="der Kursleiter", article="der", gender="der",
       plural="die Kursleiter",
       pluralRuleNote="مركّب (Kurs+Leiter) مذكّر (der!) وجمعه die Kursleiter.",
       ar=["قائد الدورة (المدرّب)"],
       sample=("Der Kursleiter hilft.", "قائد الدورة يساعد."),
       gap=("Der ___ hilft. (قائد الدورة!)", "Kursleiter"),
       hunt=("~~die Kursleiter hilft~~", "der Kursleiter hilft"),
       hunt_why="الألمانية: der Kursleiter (der! مركّب مذكّر!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="lerner", day=1, wordClass="noun", de="der Lerner", article="der", gender="der",
       plural="die Lerner",
       pluralRuleNote="مذكّر (der!) وجمعه die Lerner (بلا تغيير!).",
       ar=["المتعلّم"],
       sample=("Der Lerner liest.", "المتعلّم يقرأ."),
       gap=("Der ___ liest. (المتعلّم!)", "Lerner"),
       hunt=("~~die Lerner liest~~", "der Lerner liest"),
       hunt_why="الألمانية: der Lerner (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  # ═══ d2 «Zeitplan/Disziplin» — الانضباط ═══
  dict(id="gewohnheit", day=2, wordClass="noun", de="die Gewohnheit", article="die", gender="die",
       plural="die Gewohnheiten",
       pluralRuleNote="مؤنثة (die!) وجمعها die Gewohnheiten.",
       ar=["العادة"],
       sample=("Die Gewohnheit ist gut.", "العادة جيدة."),
       gap=("Die ___ ist gut. (العادة!)", "Gewohnheit"),
       hunt=("~~das Gewohnheit ist gut~~", "die Gewohnheit ist gut"),
       hunt_why="الألمانية: die Gewohnheit (die!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="eile", day=2, wordClass="noun", de="die Eile", article="die", gender="die",
       plural="-",
       pluralRuleNote="تُستعمل عادةً بلا جمع: die Eile.",
       ar=["العجلة"],
       sample=("Die Eile ist nicht gut.", "العجلة ليست جيدة."),
       gap=("Die ___ ist nicht gut. (العجلة!)", "Eile"),
       hunt=("~~der Eile ist nicht gut~~", "die Eile ist nicht gut"),
       hunt_why="الألمانية: die Eile (die! مؤنثة!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="dauernd", day=2, wordClass="adjective", de="dauernd",
       ar=["دائماً · مستمرّ"],
       sample=("Das Wetter ist dauernd schlecht.", "الطقس سيئ دائماً."),
       gap=("Das Wetter ist ___ schlecht. (دائماً!)", "dauernd"),
       hunt=("~~Das Wetter ist dauernde schlecht.~~", "Das Wetter ist dauernd schlecht."),
       hunt_why="dauernd ظرف/صفة ثابتة الشكل! (لا dauernde!) (خريطة التداخل 10-ي!)"),
  dict(id="entspannend", day=2, wordClass="adjective", de="entspannend",
       ar=["مُريح · مُرخٍ"],
       sample=("Der Abend ist entspannend.", "المساء مريح."),
       gap=("Der Abend ist ___. (مريح!)", "entspannend"),
       hunt=("~~Der Abend ist entspannende.~~", "Der Abend ist entspannend."),
       hunt_why="entspannend صفة بعد ist بلا لاحقة! (لا entspannende!) (خريطة التداخل 10-ي!)"),
  # ═══ d3 «Aussprache/fließend» — التكلم ═══
  dict(id="rede", day=3, wordClass="noun", de="die Rede", article="die", gender="die",
       plural="die Reden",
       pluralRuleNote="مؤنثة (die!) وجمعها die Reden.",
       ar=["الكلام · الخطاب"],
       sample=("Die Rede ist lang.", "الخطاب طويل."),
       gap=("Die ___ ist lang. (الخطاب!)", "Rede"),
       hunt=("~~der Rede ist lang~~", "die Rede ist lang"),
       hunt_why="الألمانية: die Rede (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="dialekt", day=3, wordClass="noun", de="der Dialekt", article="der", gender="der",
       plural="die Dialekte",
       pluralRuleNote="مذكّر (der!) وجمعه die Dialekte.",
       ar=["اللهجة"],
       sample=("Der Dialekt ist schwer.", "اللهجة صعبة."),
       gap=("Der ___ ist schwer. (اللهجة!)", "Dialekt"),
       hunt=("~~die Dialekt ist schwer~~", "der Dialekt ist schwer"),
       hunt_why="الألمانية: der Dialekt (der!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="duzen", day=3, wordClass="verb", de="duzen",
       ar=["يخاطب بـ«du» (بلا احترام رسمي)"],
       forms=dict(praesens3s="duzt", praeteritum="duzte", perfekt="hat geduzt", imperative="duz"),
       sample=("Wir duzen ihn.", "نخاطبه بـ«du»."),
       gap=("Wir ___ ihn. (نخاطبه بـdu!)", "duzen"),
       hunt=("~~Wir duzen ihm.~~", "Wir duzen ihn."),
       hunt_why="duzen يتعدى بالنصب: duzen ihn (لا ihm!) (خريطة التداخل 10-ي!)"),
  dict(id="botschaft", day=3, wordClass="noun", de="die Botschaft", article="die", gender="die",
       plural="die Botschaften",
       pluralRuleNote="مؤنثة (die!) وجمعها die Botschaften.",
       ar=["الرسالة (الجوهرية)"],
       sample=("Die Botschaft ist klar.", "الرسالة واضحة."),
       gap=("Die ___ ist klar. (الرسالة!)", "Botschaft"),
       hunt=("~~das Botschaft ist klar~~", "die Botschaft ist klar"),
       hunt_why="الألمانية: die Botschaft (die!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
  # ═══ d4 «Rechtschreibung/Stil» — الكتابة ═══
  dict(id="form", day=4, wordClass="noun", de="die Form", article="die", gender="die",
       plural="die Formen",
       pluralRuleNote="مؤنثة (die!) وجمعها die Formen.",
       ar=["الشكل · الاستمارة"],
       sample=("Die Form ist wichtig.", "الشكل مهم."),
       gap=("Die ___ ist wichtig. (الشكل!)", "Form"),
       hunt=("~~der Form ist wichtig~~", "die Form ist wichtig"),
       hunt_why="الألمانية: die Form (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="fortsetzung", day=4, wordClass="noun", de="die Fortsetzung", article="die", gender="die",
       plural="die Fortsetzungen",
       pluralRuleNote="-ung مؤنثة دائماً (die!) وجمعها -ungen.",
       ar=["التتمة · التكملة"],
       sample=("Die Fortsetzung kommt.", "التتمة تأتي."),
       gap=("Die ___ kommt. (التتمة!)", "Fortsetzung"),
       hunt=("~~das Fortsetzung kommt~~", "die Fortsetzung kommt"),
       hunt_why="الألمانية: die Fortsetzung (die! -ung مؤنثة دائماً!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="doppelt", day=4, wordClass="adjective", de="doppelt",
       ar=["مزدوج · مرّتين"],
       sample=("Das ist doppelt.", "هذا مزدوج."),
       gap=("Das ist ___. (مزدوج!)", "doppelt"),
       hunt=("~~Das ist doppelte.~~", "Das ist doppelt."),
       hunt_why="doppelt صفة بعد ist بلا لاحقة! (لا doppelte!) (خريطة التداخل 10-ي!)"),
  dict(id="einfuehrung", day=4, wordClass="noun", de="die Einführung", article="die", gender="die",
       plural="die Einführungen",
       pluralRuleNote="-ung مؤنثة دائماً (die!) وجمعها -ungen.",
       ar=["المقدمة (التعريفية)"],
       sample=("Die Einführung ist kurz.", "المقدمة قصيرة."),
       gap=("Die ___ ist kurz. (المقدمة!)", "Einführung"),
       hunt=("~~das Einführung ist kurz~~", "die Einführung ist kurz"),
       hunt_why="الألمانية: die Einführung (die! -ung مؤنثة دائماً!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
  # ═══ d5 «Anerkennung/Niveau» — التقدير ═══
  dict(id="experte", day=5, wordClass="noun", de="der Experte", article="der", gender="der",
       plural="die Experten",
       pluralRuleNote="اسم -e مذكّر n-Deklination! (der Experte!) وجمعه die Experten.",
       ar=["الخبير"],
       sample=("Der Experte ist da.", "الخبير حاضر."),
       gap=("Der ___ ist da. (الخبير!)", "Experte"),
       hunt=("~~die Experte ist da~~", "der Experte ist da"),
       hunt_why="الألمانية: der Experte (der! n-Deklination!) — لا die أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="erhoehung", day=5, wordClass="noun", de="die Erhöhung", article="die", gender="die",
       plural="die Erhöhungen",
       pluralRuleNote="-ung مؤنثة دائماً (die!) وجمعها -ungen.",
       ar=["الزيادة · الرفع"],
       sample=("Die Erhöhung kommt.", "الزيادة تأتي."),
       gap=("Die ___ kommt. (الزيادة!)", "Erhöhung"),
       hunt=("~~das Erhöhung kommt~~", "die Erhöhung kommt"),
       hunt_why="الألمانية: die Erhöhung (die! -ung مؤنثة دائماً!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="faellig", day=5, wordClass="adjective", de="fällig",
       ar=["مستحقّ (الأداء)"],
       sample=("Das ist fällig.", "هذا مستحق."),
       gap=("Das ist ___. (مستحق!)", "fällig"),
       hunt=("~~Das ist fällige.~~", "Das ist fällig."),
       hunt_why="fällig صفة بعد ist بلا لاحقة! (لا fällige!) (خريطة التداخل 10-ي!)"),
  dict(id="broschuere", day=5, wordClass="noun", de="die Broschüre", article="die", gender="die",
       plural="die Broschüren",
       pluralRuleNote="مؤنثة (die!) وجمعها die Broschüren.",
       ar=["الكتيب (الدعاوي)"],
       sample=("Die Broschüre ist neu.", "الكتيب جديد."),
       gap=("Die ___ ist neu. (الكتيب!)", "Broschüre"),
       hunt=("~~der Broschüre ist neu~~", "die Broschüre ist neu"),
       hunt_why="الألمانية: die Broschüre (die!) — لا der أبداً! (خريطة التداخل 10-ي!)"),
  # ═══ d6 «Rückblick/Ausblick» — الخاتمة ═══
  dict(id="feststellen", day=6, wordClass="verb", de="feststellen",
       ar=["يلاحظ · يُثبت"],
       forms=dict(praesens3s="stellt fest", praeteritum="stellte fest", perfekt="hat festgestellt", imperative="stell fest"),
       sample=("Ich stelle das fest.", "ألاحظ ذلك."),
       gap=("Ich stelle das ___. (ألاحظ!)", "fest"),
       hunt=("~~Ich feststelle das.~~", "Ich stelle das fest."),
       hunt_why="feststellen فعل منفصل: الفعل في نهاية الجملة! (خريطة التداخل 10-ي!)"),
  dict(id="entstehen", day=6, wordClass="verb", de="entstehen",
       ar=["ينشأ · يظهر"],
       forms=dict(praesens3s="entsteht", praeteritum="entstand", perfekt="ist entstanden"),
       sample=("Da entsteht ein Plan.", "هنا ينشأ خطة."),
       gap=("Da ___ ein Plan. (ينشأ!)", "entsteht"),
       hunt=("~~Da entsteht ein Plan ab.~~", "Da entsteht ein Plan."),
       hunt_why="entstehen فعل غير منفصل ولا يحتاج أداة! (خريطة التداخل 10-ي!)"),
  dict(id="eroeffnung", day=6, wordClass="noun", de="die Eröffnung", article="die", gender="die",
       plural="die Eröffnungen",
       pluralRuleNote="-ung مؤنثة دائماً (die!) وجمعها -ungen.",
       ar=["الافتتاح"],
       sample=("Die Eröffnung ist morgen.", "الافتتاح غداً."),
       gap=("Die ___ ist morgen. (الافتتاح!)", "Eröffnung"),
       hunt=("~~das Eröffnung ist morgen~~", "die Eröffnung ist morgen"),
       hunt_why="الألمانية: die Eröffnung (die! -ung مؤنثة دائماً!) — لا das أبداً! (خريطة التداخل 10-ي!)"),
  dict(id="ewig", day=6, wordClass="adjective", de="ewig",
       ar=["أبدي · طويل جداً"],
       sample=("Das ist ewig.", "هذا أبدي (طويل جداً)."),
       gap=("Das ist ___. (أبدي!)", "ewig"),
       hunt=("~~Das ist ewige.~~", "Das ist ewig."),
       hunt_why="ewig صفة بعد ist بلا لاحقة! (لا ewige!) (خريطة التداخل 10-ي!)"),
]
SPEAK_MODEL = {
  1: "Der Gedanke ist klar. Die Erziehung ist wichtig. Der Kursleiter hilft — und der Lerner liest.",
  2: "Die Gewohnheit ist gut, aber die Eile ist nicht gut. Der Abend ist dauernd entspannend.",
  3: "Die Botschaft ist klar. Die Rede ist lang, und der Dialekt ist schwer. Wir duzen ihn.",
  4: "Die Form ist wichtig. Die Einführung ist kurz, und die Fortsetzung kommt. Das ist doppelt.",
  5: "Der Experte ist da. Die Erhöhung kommt, und das ist fällig. Die Broschüre ist neu.",
  6: "Ich stelle das fest: Da entsteht ein Plan! Die Eröffnung ist morgen — und das ist nicht ewig.",
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
                choices=[w["ar"][0], ws[(ws.index(w) + 1) % 4]["ar"][0], ws[(ws.index(w) + 2) % 4]["ar"][0]],
                a=w["ar"][0],
                why=f'الصوت يقول «{clip[:-1]}» — معناها «{w["ar"][0]}». ركّز!'))
            stations["dictation"]["items"].append(dict(
                audioId=f'word-{w["id"]}', speakText=clip,
                a=w["de"].split(",")[0],
                why=f'اكتب ما تسمعه حرفياً: «{clip[:-1]}» تعني «{w["ar"][0]}». انتبه للحروف الكبيرة!'))
        stations["speaking"]["items"].append(dict(
            q=f'تكلّم عن يومك! (جملتان! استعمل كلمات اليوم الجديدة: {" · ".join(w["de"].split(",")[0] for w in ws)})',
            a=SPEAK_MODEL[day],
            why="المراجعة بالكلام! كلمات اليوم العشر كلها في الجُمل."))
        for v in d["quiz"]["variants"]:
            for w in ws:
                v["items"].append(dict(q=w["gap"][0], a=w["gap"][1], why=why_for(w)))
        s = d["zusammenfassung"]["summary"]
        s["de"] = s["de"].rstrip() + " " + " ".join(w["sample"][0] for w in ws)
        s["ar"] = s["ar"].rstrip() + " " + " ".join(w["sample"][1] for w in ws)
        task = d["uebung"]["communicativeTask"]
        task["goal"]["de"] = task["goal"]["de"].rstrip() + " " + SPEAK_MODEL[day]
        task["successCriteria"] = [x.replace("كلمات اليوم الست", "كلمات اليوم العشر").replace("كلمات اليوم الثلاث", "كلمات اليوم العشر")
                                   for x in task["successCriteria"]]
        p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"patched b1-u12-d{day}: +{len(ids)} كلمات")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "specs"
    if mode == "specs":
        out = ROOT / "tools/dev/.vocab-b1u12b-specs.json"
        out.write_text(json.dumps(make_specs(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"specs: {len(WORDS)} → {out}")
    else:
        patch_lessons()
