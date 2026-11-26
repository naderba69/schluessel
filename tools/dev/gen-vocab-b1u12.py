#!/usr/bin/env python3
# tools/dev/gen-vocab-b1u12.py — إغناء b1-u12 بمواصفة D5xx (D586 · «موازنة المفردات»).
# المرحلة 1: specs → specs.json (تُغذّى tools/word-entry-generator.ts — هو يشتق IPA/الأعلام/الصوت/goetheList).
# المرحلة 2: patch — ترقيع الدروس الستة (wordIds + مراجع + بنود مكتوبة) + ملخّص/مهمة.
# القصّة والحوارات صوتية — لا تُمسّ! المواجهات من البنود المكتوبة.
from __future__ import annotations
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WORDS = [
  # ═══ d1 «Wortschatz/Zertifikat/Konzentration» — التعلّم والامتحانات ═══
  dict(id="abschreiben", day=1, wordClass="verb", de="abschreiben",
       ar=["ينسخ (من النصّ)", "يغشّ في الامتحان"],
       forms=dict(praesens3s="schreibt ab", praeteritum="schrieb ab", perfekt="hat abgeschrieben", imperative="schreib ab"),
       sample=("Abschreiben ist nicht erlaubt.", "النسخ (الغشّ) غير مسموح."),
       gap=("Er hat den Text ___. (ينسخ من النصّ!)", "abgeschrieben"),
       hunt=("~~Er schreibt den Text nicht ab.~~", "Er schreibt den Text ab."),
       hunt_why="abschreiben = ينسخ (يُلصق النصّ!) — النفي هنا يقلب المعنى! (خريطة التداخل 10-ي!)",
       pre_variants=["Er hat den Text abgeschrieben.", "Er hat den Text geschrieben.", "Er hat den Text angeschrieben."]),
  dict(id="aufforderung", day=1, wordClass="noun", de="die Aufforderung", article="die", gender="die",
       plural="die Aufforderungen",
       pluralRuleNote="-ung مؤنثة دائماً (die!) وجمعها -ungen.",
       ar=["الدعوة (إلى عمل ما)", "الطلب · التنبيه"],
       sample=("Die Aufforderung ist klar.", "الدعوة واضحة."),
       gap=("Die ___ ist klar. (الدعوة!)", "Aufforderung"),
       hunt=("~~das Aufforderung ist klar~~", "die Aufforderung ist klar"),
       hunt_why="الألمانية: die Aufforderung (die! -ung مؤنثة دائماً!) — لا das أبداً! (خريطة التداخل 10-ي!)",
       pre_variants=["Die Aufforderung ist klar.", "Das Aufforderung ist klar.", "Der Aufforderung ist klar."]),
  dict(id="akzeptieren", day=1, wordClass="verb", de="akzeptieren",
       ar=["يقبل (بشيء)", "يوافق على"],
       forms=dict(praesens3s="akzeptiert", praeteritum="akzeptierte", perfekt="hat akzeptiert", imperative="akzeptier"),
       sample=("Das akzeptieren wir.", "نحن نقبل ذلك."),
       gap=("Das ___ wir. (نقبل!)", "akzeptieren"),
       hunt=("~~Das akzeptieren ich.~~", "Das akzeptieren wir."),
       hunt_why="akzeptieren يوافق الفاعل: wir akzeptieren — لا «akzeptieren ich»! (خريطة التداخل 10-ي!)",
       pre_variants=["Das akzeptieren wir.", "Das akzeptieren ich.", "Das akzeptiert wir."]),
  # ═══ d2 «Zeitplan/Disziplin» — الانضباط الزمني ═══
  dict(id="anstrengend", day=2, wordClass="adjective", de="anstrengend",
       ar=["مرهق · شاقّ"],
       sample=("Der Tag ist anstrengend.", "اليوم مرهق."),
       gap=("Der Tag ist ___. (مرهق!)", "anstrengend"),
       hunt=("~~Der Tag ist anstrengende.~~", "Der Tag ist anstrengend."),
       hunt_why="anstrengend صفة بعد ist تبقى بلا لاحقة! (لا anstrengende!) (خريطة التداخل 10-ي!)",
       pre_variants=["Der Tag ist anstrengend.", "Der Tag ist anstrengende.", "Der Tag ist anstrengender."]),
  dict(id="augenblick", day=2, wordClass="noun", de="der Augenblick", article="der", gender="der",
       plural="die Augenblicke",
       pluralRuleNote="مذكّر (der!) وجمعه die Augenblicke (بلا تغيير الجذر!).",
       ar=["اللحظة"],
       sample=("Der Augenblick ist wichtig.", "اللحظة مهمة."),
       gap=("Der ___ ist wichtig. (اللحظة!)", "Augenblick"),
       hunt=("~~die Augenblick ist wichtig~~", "der Augenblick ist wichtig"),
       hunt_why="الألمانية: der Augenblick (der! -e مذكّر!) — لا die أبداً! (خريطة التداخل 10-ي!)",
       pre_variants=["Der Augenblick ist wichtig.", "Die Augenblick ist wichtig.", "Das Augenblick ist wichtig."]),
  dict(id="anfangs", day=2, wordClass="adverb", de="anfangs",
       ar=["في البداية · أول الأمر"],
       sample=("Anfangs war es schwer.", "في البداية كان الأمر صعباً."),
       gap=("___ war es schwer. (في البداية!)", "Anfangs"),
       hunt=("~~Anfang war es schwer.~~", "Anfangs war es schwer."),
       hunt_why="anfangs الظرف (في البداية!) بحرف s — لا «Anfang» (الاسم!) هنا! (خريطة التداخل 10-ي!)",
       pre_variants=["Anfangs war es schwer.", "Anfang war es schwer.", "Anfänge war es schwer."]),
  # ═══ d3 «Aussprache/fließend» — التكلم ═══
  dict(id="besprechen", day=3, wordClass="verb", de="besprechen",
       ar=["يناقش"],
       forms=dict(praesens3s="bespricht", praeteritum="besprach", perfekt="hat besprochen", imperative="besprich"),
       sample=("Wir besprechen den Text.", "نحن نناقش النصّ."),
       gap=("Wir ___ den Text. (نناقش!)", "besprechen"),
       hunt=("~~Wir bespricht den Text.~~", "Wir besprechen den Text."),
       hunt_why="besprechen مع wir: besprechen (لا bespricht — تلك لـer/sie/es!) (خريطة التداخل 10-ي!)",
       pre_variants=["Wir besprechen den Text.", "Wir bespricht den Text.", "Wir besprechen dem Text."]),
  dict(id="beruhigen", day=3, wordClass="verb", de="beruhigen",
       ar=["يهدّئ · يطمئن"],
       forms=dict(praesens3s="beruhigt", praeteritum="beruhigte", perfekt="hat beruhigt", imperative="beruhig"),
       sample=("Das beruhigt mich.", "هذا يهدّئني."),
       gap=("Das ___ mich. (يهدّئني!)", "beruhigt"),
       hunt=("~~Das beruhigen mich.~~", "Das beruhigt mich."),
       hunt_why="beruhigen مع das/es يحتاج لاحقة -t: beruhigt! (خريطة التداخل 10-ي!)",
       pre_variants=["Das beruhigt mich.", "Das beruhigen mich.", "Das beruhige mich."]),
  dict(id="begruessen", day=3, wordClass="verb", de="begrüßen",
       ar=["يُحيّي · يرحّب بـ"],
       forms=dict(praesens3s="begrüßt", praeteritum="begrüßte", perfekt="hat begrüßt", imperative="begrüß"),
       sample=("Ich begrüße Sie.", "أُحيّي سيادتكم (أهلاً!)."),
       gap=("Ich ___ Sie. (أُحيّي!)", "begrüße"),
       hunt=("~~Ich begrüße dich.~~", "Ich begrüße Sie."),
       hunt_why="begrüßen يخاطب Sie في الخطاب الرسمي (لا dich!) — «Ich begrüße Sie» (خريطة التداخل 10-ي!)",
       pre_variants=["Ich begrüße Sie.", "Ich begrüßen Sie.", "Ich begrüße Sie formal begrüßen."]),
  # ═══ d4 «Rechtschreibung/Stil» — الكتابة ═══
  dict(id="ausdrucken", day=4, wordClass="verb", de="ausdrucken",
       ar=["يطبع (على الورق)"],
       forms=dict(praesens3s="druckt aus", praeteritum="druckte aus", perfekt="hat ausgedruckt", imperative="druck aus"),
       sample=("Ich drucke den Text aus.", "أطبع النصّ."),
       gap=("Ich drucke den Text ___. (أطبع!)", "aus"),
       hunt=("~~Ich drucke aus den Text.~~", "Ich drucke den Text aus."),
       hunt_why="ausdrucken فعل منفصل: الجُملة القائلة tuckt الفعل في النهاية! (خريطة التداخل 10-ي!)",
       pre_variants=["Ich drucke den Text aus.", "Ich drucke aus den Text.", "Ich ausdrucke den Text."]),
  dict(id="abbildung", day=4, wordClass="noun", de="die Abbildung", article="die", gender="die",
       plural="die Abbildungen",
       pluralRuleNote="-ung مؤنثة دائماً (die!) وجمعها -ungen.",
       ar=["الصورة (الرسم التوضيحي)"],
       sample=("Die Abbildung ist klein.", "الصورة صغيرة."),
       gap=("Die ___ ist klein. (الصورة!)", "Abbildung"),
       hunt=("~~das Abbildung ist klein~~", "die Abbildung ist klein"),
       hunt_why="الألمانية: die Abbildung (die! -ung مؤنثة دائماً!) — لا das أبداً! (خريطة التداخل 10-ي!)",
       pre_variants=["Die Abbildung ist klein.", "Das Abbildung ist klein.", "Der Abbildung ist klein."]),
  dict(id="analysieren", day=4, wordClass="verb", de="analysieren",
       ar=["يحلّل"],
       forms=dict(praesens3s="analysiert", praeteritum="analysierte", perfekt="hat analysiert"),
       sample=("Wir analysieren den Text.", "نحن نحلّل النصّ."),
       gap=("Wir ___ den Text. (نحلّل!)", "analysieren"),
       hunt=("~~Wir analysiert den Text.~~", "Wir analysieren den Text."),
       hunt_why="analysieren مع wir: analysieren (لا analysiert!) (خريطة التداخل 10-ي!)",
       pre_variants=["Wir analysieren den Text.", "Wir analysiert den Text.", "Wir analysieren dem Text."]),
  # ═══ d5 «Anerkennung/Niveau» — التقدير ═══
  dict(id="ausgezeichnet", day=5, wordClass="adjective", de="ausgezeichnet",
       ar=["ممتاز"],
       sample=("Das Ergebnis ist ausgezeichnet.", "النتيجة ممتازة."),
       gap=("Das Ergebnis ist ___. (ممتاز!)", "ausgezeichnet"),
       hunt=("~~Das Ergebnis ist ausgezeichnetes.~~", "Das Ergebnis ist ausgezeichnet."),
       hunt_why="ausgezeichnet صفة الخبر بعد ist بلا لاحقة! (لا ausgezeichnetes!) (خريطة التداخل 10-ي!)",
       pre_variants=["Das Ergebnis ist ausgezeichnet.", "Das Ergebnis ist ausgezeichtnet.", "Das Ergebnis ist ausgezeichnete."]),
  dict(id="befriedigend", day=5, wordClass="adjective", de="befriedigend",
       ar=["مُرضٍ"],
       sample=("Das ist befriedigend.", "هذا مُرضٍ."),
       gap=("Das ist ___. (مُرضٍ!)", "befriedigend"),
       hunt=("~~Das ist befriedigende.~~", "Das ist befriedigend."),
       hunt_why="befriedigend صفة بعد ist تبقى بلا لاحقة! (لا befriedigende!) (خريطة التداخل 10-ي!)",
       pre_variants=["Das ist befriedigend.", "Das ist befriedigende.", "Das ist befriedigender."]),
  dict(id="benoetigen", day=5, wordClass="verb", de="benötigen",
       ar=["يحتاج إلى"],
       forms=dict(praesens3s="benötigt", praeteritum="benötigte", perfekt="hat benötigt"),
       sample=("Das benötigt Zeit.", "هذا يحتاج وقتاً."),
       gap=("Das ___ Zeit. (يحتاج!)", "benötigt"),
       hunt=("~~Das benötigen Zeit.~~", "Das benötigt Zeit."),
       hunt_why="benötigen مع das/es يحتاج لاحقة -t: benötigt! (خريطة التداخل 10-ي!)",
       pre_variants=["Das benötigt Zeit.", "Das benötigen Zeit.", "Das benötige Zeit."]),
  # ═══ d6 «Rückblick/Ausblick» — الخاتمة ═══
  dict(id="beschliessen", day=6, wordClass="verb", de="beschließen",
       ar=["يقرّر · يختم"],
       forms=dict(praesens3s="beschließt", praeteritum="beschloss", perfekt="hat beschlossen", imperative="beschließ"),
       sample=("Wir beschließen den Kurs.", "نختم الدورة (نقرّر ختامها)."),
       gap=("Wir ___ den Kurs. (نختم!)", "beschließen"),
       hunt=("~~Wir beschließen den Kurs ab.~~", "Wir beschließen den Kurs."),
       hunt_why="beschließen فعل غير منفصل (ب-م-ش)! لا «... ab» في النهاية! (خريطة التداخل 10-ي!)",
       pre_variants=["Wir beschließen den Kurs.", "Wir beschließen den Kurs ab.", "Wir beschloss den Kurs."]),
  dict(id="behalten", day=6, wordClass="verb", de="behalten",
       ar=["يحتفظ بـ · يُبقي"],
       forms=dict(praesens3s="behält", praeteritum="behielt", perfekt="hat behalten", imperative="behalt"),
       sample=("Ich behalte die Wörter.", "أحتفظ بالكلمات."),
       gap=("Ich ___ die Wörter. (أحتفظ!)", "behalte"),
       hunt=("~~Ich behalte die Wörter nicht.~~", "Ich behalte die Wörter."),
       hunt_why="behalten = يحتفظ (إيجابي!) — النفي هنا يقلب المعنى! (خريطة التداخل 10-ي!)",
       pre_variants=["Ich behalte die Wörter.", "Ich behalten die Wörter.", "Ich behalte dem Wörter."]),
  dict(id="alltaeglich", day=6, wordClass="adjective", de="alltäglich",
       ar=["يومي · مألوف"],
       sample=("Das ist alltäglich.", "هذا مألوف (يومي)."),
       gap=("Das ist ___. (مألوف!)", "alltäglich"),
       hunt=("~~Das ist alltägliche.~~", "Das ist alltäglich."),
       hunt_why="alltäglich صفة بعد ist تبقى بلا لاحقة! (لا alltägliche!) (خريطة التداخل 10-ي!)",
       pre_variants=["Das ist alltäglich.", "Das ist alltägliche.", "Das ist alltäglicher."]),
]
SPEAK_MODEL = {
  1: "Die Aufforderung ist klar, und ich akzeptiere sie. Abschreiben ist nicht erlaubt.",
  2: "Anfangs war der Tag anstrengend. Aber jeder Augenblick ist wichtig.",
  3: "Ich begrüße Sie und wir besprechen den Text. Das beruhigt mich.",
  4: "Die Abbildung ist klein. Ich drucke den Text aus und analysiere ihn.",
  5: "Das Ergebnis ist ausgezeichnet — und das ist befriedigend. Das benötigt Zeit.",
  6: "Ich behalte die Wörter und wir beschließen den Kurs. Das ist alltäglich.",
}
THEMA = "Integration"  # موضوع b1-u12 (التكامل) كما في كلمات اليوم الأصلية


def clip_text(w: dict) -> str:
    """الشكل المنطوق (D140): الأسماء بأداتها، والباقي كما هو — بنقطة."""
    de = w["de"]
    if w["wordClass"] == "noun":
        return f"{de}."
    return f"{de}."


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
        # 1) wordIds + مراجع
        for wid in ids:
            if wid not in d["praesentation"]["wordIds"]:
                d["praesentation"]["wordIds"].append(wid)
            ref = f"word-{wid}"
            if ref not in d["audioManifestRefs"]:
                d["audioManifestRefs"].append(ref)
            if wid not in d["curriculumRef"].get("goetheWordListOverlap", []):
                d["curriculumRef"].setdefault("goetheWordListOverlap", []).append(wid)
        d["zusammenfassung"]["srsBundleWordIds"] = list(d["praesentation"]["wordIds"])
        # 2) pretest: سقف المخطط بندان (≤2) — كلمات الجديدة تُغطّى بالمحطات (المواجهات ≥7 مضمونة)
        # 3) محطات مكتوبة
        stations = {s["type"]: s for s in d["uebung"]["stations"]}
        # match: بند واحد بأزواج الثلاثة
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
                choices=[w["ar"][0], ws[(ws.index(w) + 1) % 3]["ar"][0], ws[(ws.index(w) + 2) % 3]["ar"][0]],
                a=w["ar"][0],
                why=f'الصوت يقول «{clip[:-1]}» — معناها «{w["ar"][0]}». ركّز!'))
            stations["dictation"]["items"].append(dict(
                audioId=f'word-{w["id"]}', speakText=clip,
                a=w["de"].split(",")[0],
                why=f'اكتب ما تسمعه حرفياً: «{clip[:-1]}» تعني «{w["ar"][0]}». انتبه للحروف الكبيرة!'))
        stations["speaking"]["items"].append(dict(
            q=f'تكلّم عن يومك! (جملتان! استعمل كلمات اليوم: {" · ".join(w["de"].split(",")[0] for w in ws)})',
            a=SPEAK_MODEL[day],
            why="المراجعة بالكلام! كلمات اليوم الست كلها في الجُمل."))
        # quiz: بند لكل كلمة في كل متغيّر
        for v in d["quiz"]["variants"]:
            for w in ws:
                v["items"].append(dict(q=f'{w["gap"][0]}', a=w["gap"][1], why=why_for(w)))
        # 4) الملخّص والمهمة
        s = d["zusammenfassung"]["summary"]
        s["de"] = s["de"].rstrip() + " " + " ".join(w["sample"][0] for w in ws)
        s["ar"] = s["ar"].rstrip() + " " + " ".join(w["sample"][1] for w in ws)
        task = d["uebung"]["communicativeTask"]
        task["goal"]["de"] = task["goal"]["de"].rstrip() + " " + SPEAK_MODEL[day]
        task["successCriteria"] = [x.replace("كلمات اليوم الثلاث", "كلمات اليوم الست").replace("الثلاث كلها", "الست كلها")
                                   for x in task["successCriteria"]]
        p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"patched b1-u12-d{day}: +{len(ids)} كلمات")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "specs"
    if mode == "specs":
        out = ROOT / "tools/dev/.vocab-b1u12-specs.json"
        out.write_text(json.dumps(make_specs(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"specs: {len(WORDS)} → {out}")
    else:
        patch_lessons()
