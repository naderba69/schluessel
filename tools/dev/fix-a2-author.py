#!/usr/bin/env python3
"""D565: إصلاحات A2-المؤلف — اللغة المعدنية في النصوص الوصفية تُصاغ بكلمات مُدرَّسة ·
الصيغ الخاطئة تُشطب وتُعلَّن (misspellings) · نقل الترتيبيات a2-u13-d2 ← a2-u7-d2 ·
forms للبطاقة sein · أسماء علم Berlin · إصلاحات بنود مفردة. يُشغَّل مرة واحدة على ناتج المولّد.

Usage: python3 tools/dev/fix-a2-author.py  (asserts every replacement; exits 1 on any miss)
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LESSONS = ROOT / "content/lessons/a2"
WORDS = ROOT / "content/words"
PLAN = ROOT / "content/upgrades/a2-lesson-upgrade.json"

errors: list[str] = []


def load(p: Path):
    return json.loads(p.read_text())


def save(p: Path, d) -> None:
    p.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n")


def replace_in(obj, old: str, new: str, where: str, count: list[int], skip_why: bool = True) -> None:
    """يبدّل old→new في كل النصوص (عدا why) ويتحقق من وقوع الاستبدال"""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if skip_why and k == "why":
                continue
            replace_in(v, old, new, where, count, skip_why)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            replace_in(v, old, new, where, count, skip_why)
    elif isinstance(obj, str) and old in obj:
        count[0] += 1


def apply_replace(obj, old: str, new: str, skip_why: bool = True) -> int:
    n = [0]

    def go(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if skip_why and k == "why":
                    continue
                go(v)
        elif isinstance(o, list):
            for v in o:
                go(v)
        elif isinstance(o, str) and old in o:
            n[0] += 1

    def put(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if skip_why and k == "why":
                    continue
                if isinstance(v, str) and old in v:
                    o[k] = v.replace(old, new)
                else:
                    put(v)
        elif isinstance(o, list):
            for i, v in enumerate(o):
                if isinstance(v, str) and old in v:
                    o[i] = v.replace(old, new)
                else:
                    put(v)

    go(o=obj)
    put(obj)
    return n[0]


def repl(lid: str, pairs: list[tuple[str, str]]) -> None:
    p = LESSONS / f"{lid}.json"
    L = load(p)
    for old, new in pairs:
        n = apply_replace(L, old, new)
        if n == 0:
            errors.append(f"{lid}: لم يُعثر على «{old[:60]}»")
    save(p, L)


# ---------- 1) sein: صيغ مسجّلة (ist/war/ist gewesen) ----------
sein = load(WORDS / "sein.json")
sein["forms"] = {"praesens3s": "ist", "praeteritum": "war", "perfekt": "ist gewesen"}
save(WORDS / "sein.json", sein)

# ---------- 2) نصوص وصفية (ziel/goal/situation/summary) — ألمانية بكلمات مُدرَّسة ----------
META: dict[str, list[tuple[str, str]]] = {
    "a2-u1-d1": [
        ("Du kannst deinen gestrigen Morgen erzählen — mit dem Perfekt-System: gelacht · gefallen · angemacht · vergessen · passiert.",
         "Du kannst deinen Morgen von gestern erzählen — mit haben und sein: gelacht · gefallen · angemacht · vergessen · passiert."),
        ("Den gestrigen Morgen erzählen", "Den Morgen von gestern erzählen"),
        ("Dann ist etwas passiert", "Dann ist es passiert"),
        ("Das System: gelacht · gefallen · angemacht · vergessen · passiert.",
         "So war es: gelacht · gefallen · angemacht · vergessen · passiert."),
    ],
    "a2-u1-d2": [
        ("Du kannst deinen ganzen Tag erzählen — mit der haben/sein-Entscheidung: weggeworfen ↔ weggegangen.",
         "Du kannst deinen Tag erzählen — mit haben und sein: weggeworfen ↔ weggegangen."),
        ("Den ganzen Tag erzählen", "Den Tag erzählen"),
        ("Das System: weggeworfen (haben) ↔ weggegangen (sein).",
         "So: weggeworfen (haben) ↔ weggegangen (sein)."),
    ],
    "a2-u1-d3": [
        ("Du kannst deinen Urlaub in 6 Sätzen erzählen — mit Reflexiv-Perfekt (hat sich …), Konnektoren (sogar · außerdem) und ist geritten.",
         "Du kannst deinen Urlaub in 6 Sätzen erzählen — mit haben und sein (hat sich …), sogar · außerdem und ist geritten."),
        ("Das System: hat sich (Reflexiv) · ist geritten (sein) · sogar/außerdem (Konnektoren).",
         "So: hat sich · ist geritten (sein) · sogar/außerdem."),
    ],
    "a2-u1-d4": [
        ("Du kannst 6 Tagebuch-Sätze schreiben — Perfekt für Ereignisse, war/hatte für Zustände.",
         "Du kannst 6 Sätze über deine Ferien schreiben — mit haben/sein und war/hatte."),
        ("6 Tagebuch-Sätze schreiben", "6 Sätze über die Ferien schreiben"),
        ("Dein Heft liegt offen:", "Dein Heft liegt auf dem Tisch:"),
        ("3 mit Perfekt, 3 mit war/hatte.", "3 mit haben/sein, 3 mit war/hatte."),
        ("Das System: Perfekt (Ereignis) · war/hatte (Zustand) · sich erinnert/gestritten (Reflexiv).",
         "So: haben/sein · war/hatte · sich erinnert/gestritten."),
    ],
    "a2-u1-d5": [
        ("Du kannst eine gemischte Geschichte erzählen — haben/sein/sich und stark/schwach richtig wählen.",
         "Du kannst eine Geschichte von der Feier erzählen — mit haben, sein und sich."),
        ("Eine gemischte Geschichte erzählen", "Eine Geschichte von der Feier erzählen"),
        ("Das System: sein (verreist) · stark (gesungen/geschnitten) · sich (verliebt/merkt/verletzt) · erst/fast/ganz.",
         "So: sein (verreist) · haben (gesungen) · sich (verliebt/verletzt) · erst/fast/ganz."),
    ],
    "a2-u1-d6": [
        ("Du kannst dein Wochenzeugnis schreiben: Perfekt aus fünf Tagen — haben/sein/sich, stark/schwach, war/hatte.",
         "Du kannst über fünf Tage schreiben: was war — mit haben, sein und sich."),
        ("Dein Wochenzeugnis schreiben", "Deine Woche beschreiben"),
        ("Das Wochenzeugnis: Erst sind wir verreist.", "Meine Woche: Erst sind wir verreist."),
        ("Das System der Woche: sein (Bewegung) · stark (Trios) · sich (mich/mir/uns) · war/hatte (Zustand) · erst/fast/ganz.",
         "So war die Woche: sein (gegangen) · haben (gesungen) · sich (mich/mir/uns) · war/hatte · erst/fast/ganz."),
    ],
    "a2-u2-d1": [
        ("Du kannst deine Aufgaben beschreiben: müssen oder sollen — Pflicht oder Rat.",
         "Du kannst deine Aufgaben beschreiben: müssen oder sollen."),
        ("Das System: müssen (Pflicht) · sollen (Rat) · Modal 2., Infinitiv Ende, nie zu.",
         "So: müssen · sollen — das zweite Wort kommt ans Ende, nie zu."),
    ],
    "a2-u2-d2": [
        ("dass-Sätze nach Meinung und Gefühl — Verb am Ende.",
         "dass-Sätze nach Meinung und Gefühl — und das zweite Wort kommt ans Ende."),
        ("Das System: dass nach Meinung/Sagen/Gefühl · Verb am Ende · Komma vor dass · dass ≠ das.",
         "So: dass nach Meinung/Sagen/Gefühl · das zweite Wort am Ende · Pause vor dass · dass ≠ das."),
    ],
    "a2-u2-d3": [
        ("Du kannst ein Gespräch führen: antworten · nennen · begründen — und vom Vertrag sprechen.",
         "Du kannst ein Gespräch haben: antworten · nennen · begründen — und vom Vertrag sprechen."),
        ("Ein Gespräch führen", "Ein Gespräch haben"),
        ("Das System: trennbar (statt … findet) · reflexiv (informiere mich) · be- ohne ge- (beantwortet) · Kenntnisse nur Plural.",
         "So: findet … statt · informiere mich · beantwortet (ohne ge-) · Antworten gibt es viele."),
    ],
    "a2-u2-d4": [
        ("Du kannst eine formelle E-Mail schreiben: bitten (Bestätigen Sie …) + hoffen/leidtun (dass …) — und den Termin bestätigen.",
         "Du kannst eine E-Mail an den Chef schreiben: bitten (Bestätigen Sie …) + hoffen/leidtun (dass …) — und den Termin bestätigen."),
        ("Das System: Sie-Imperativ (Bestätigen Sie!) · dass (spät komme) · ver- ohne ge- (versucht) · trennbar (tut … leid).",
         "So: Bestätigen Sie! (mit Sie) · dass (spät komme) · versucht (ohne ge-) · tut … leid."),
    ],
    "a2-u2-d5": [
        ("Du kannst Verbot und Nicht-Müssen unterscheiden: Du darfst nicht rauchen, aber du musst nicht lange bleiben.",
         "Du kannst sagen: Du darfst nicht rauchen, aber du musst nicht lange bleiben."),
        ("Meine Regeln: Du darfst nicht rauchen.", "So ist es: Du darfst nicht rauchen."),
        ("Das System: darf-nicht (Verbot) · muss-nicht (kein Muss) · trennbar (mach … auf) · ge- in der Mitte (aufgemacht) · nicht vor dem Adjektiv.",
         "So: darf-nicht · muss-nicht · mach … auf · aufgemacht (in der Mitte) · nicht vor dem Wort."),
    ],
    "a2-u2-d6": [
        ("Der Wochenbericht: Ich habe eine Bewerbung.", "Meine Woche: Ich habe eine Bewerbung."),
        ("Das System der Einheit: dass (Verb zuletzt) · darf-nicht (Verbot) · muss-nicht (kein Muss) · berate dich ≠ rate dir · trennbar · be-/ver- ohne ge-.",
         "So: dass (das Wort kommt zuletzt) · darf-nicht · muss-nicht · berate dich ≠ rate dir · beantwortet/versucht (ohne ge-)."),
    ],
    "a2-u3-d1": [
        ("Das System: mich/dich/sich/uns/euch/sich — immer nach dem Verb.",
         "So: mich/dich/sich/uns/euch/sich — immer danach."),
    ],
    "a2-u3-d2": [
        ("Deine Routine beschreiben", "Deinen Tag beschreiben"),
        ("Meine Routine: Ich wasche morgens", "Mein Tag: Ich wasche morgens"),
        ("Das System: mit Teil → mir/dir/sich/uns/euch/sich — nach dem Verb.",
         "So: mit Teil → mir/dir/sich/uns/euch/sich — immer danach."),
    ],
    "a2-u3-d3": [
        ("Das System: trennbar (trag…ein) + reflexiv (mich/sich).",
         "So: trag … ein + mich/sich."),
    ],
}
for lid, pairs in META.items():
    repl(lid, pairs)

# ---------- 3) بنود التدريب/المصائد/Quiz — صيغ خاطئة مشطوبة + معدنية ----------
ITEMS: dict[str, list[tuple[str, str]]] = {
    "a2-u1-d1": [
        ("Ich habe meinen Schlüssel gevergessen.", "Ich habe vergessen meinen Schlüssel."),
        ("Es hat gebeginnt", "Es hat gebegonnen"),
        ("Ich habe meine Brille geverloren.", "~~Ich habe meine Brille geverloren.~~"),
        ("Das Spiel hat schon gebeginnt.", "~~Das Spiel hat schon gebegonnen.~~"),
    ],
    "a2-u1-d2": [
        ("Ich bin schon um acht gewegegangen.", "~~Ich bin schon um acht geweggegangen.~~"),
    ],
    "a2-u1-d3": [
        ("Ich habe am Strand gereitet.", "~~Ich habe am Strand geriten.~~"),
    ],
    "a2-u1-d4": [
        ("Ich habe traurig gehabt.", "Ich habe traurig gewesen."),
        ("Gestern haben wir uns gestreitet.", "~~Gestern haben wir uns gestriten.~~"),
    ],
    "a2-u1-d5": [
        ("verreisen ← Wir ___ verreist. (ver- + حركة = ؟)",
         "verreisen ← Wir ___ verreist. (البادئة الملتصقة + حركة = ؟)"),
        ("sich merken ← Ich ___ es mir gemerkt. (sich + Dat!)",
         "sich merken ← Ich ___ es mir gemerkt. (sich + mir!)"),
    ],
    "a2-u1-d6": [
        ("vergessen ← Ich ___ es vergessen. (قوي ver-!)", "vergessen ← Ich ___ es vergessen. (قوي: البادئة!)"),
        ("(sonst/ausserdem + war + الماضي التام)", "(sonst + war + الماضي التام)"),
        ("Ausserdem war das Wetter schön.", "Danach war das Wetter schön."),
    ],
    "a2-u2-d1": [
        ("Er hat sich ___. Die Bewerbung ist fertig. (bewerben←Partizip II)",
         "Er hat sich ___. Die Bewerbung ist fertig. (bewerben — التصريف الثاني)"),
    ],
    "a2-u2-d3": [
        ("Ich habe die Fragen gebeantwortet.", "~~Ich habe die Fragen gebeantwortet.~~"),
        ("Mein Kenntnis ist gut.", "Meine Antworten ist gut."),
        ("Meine Kenntnisse sind gut", "Meine Antworten sind gut"),
        ("(Kenntnisse)", "(Antworten)"),
        ("die Kenntnisse (Pl.)", "die Antworten"),
    ],
    "a2-u2-d4": [
        ("Ich habe es geversucht.", "~~Ich habe es geversucht.~~"),
    ],
    "a2-u2-d5": [
        ("Ich habe das Fenster geaufmacht.", "~~Ich habe das Fenster geaufgemacht.~~"),
        ("(aufmachen←Partizip II)", "(aufmachen — التصريف الثاني)"),
    ],
    "a2-u2-d6": [
        ("Ich habe es geversucht.", "~~Ich habe es geversucht.~~"),
    ],
    "a2-u3-d1": [
        ("Ich freue ___. (Akk!)", "Ich freue ___. (المنصوب!)"),
    ],
    "a2-u14-d4": [
        ("Zum Vergleich: klug → ___ (الدرجة الثانية!)", "للمقارنة: klug → ___ (الدرجة الثانية!)"),
    ],
    "a2-u14-d5": [
        ("en / s", "‑en / s"),
        ("s / en", "s / ‑en"),
    ],
}
for lid, pairs in ITEMS.items():
    repl(lid, pairs)

# بند كويز u3-d1 (a=«übe») — إعادة صياغة كاملة
p = LESSONS / "a2-u3-d1.json"
L = load(p)
fixed = 0
for v in L["quiz"]["variants"]:
    for i, it in enumerate(v["items"]):
        if it.get("a") == "übe":
            v["items"][i] = {
                "q": "ما معنى «der Magen»؟",
                "choices": ["der Magen", "das Knie", "der Kopf"],
                "a": "der Magen",
                "why": "«der Magen» تعني «المعدة» — لا تخلطها بالخيارات الأخرى!",
            }
            fixed += 1
if fixed == 0:
    errors.append("a2-u3-d1: بند كويز «übe» غير موجود")
save(p, L)

# ---------- 4) نقل الترتيبيات zweite/dritte/vierte: a2-u13-d2 ← a2-u7-d2 ----------
p132 = LESSONS / "a2-u13-d2.json"
p72 = LESSONS / "a2-u7-d2.json"
L132, L72 = load(p132), load(p72)
MOVE = ["zweite", "dritte", "vierte"]
wi = L132["praesentation"]["wordIds"]
mi = [wi.index(m) for m in MOVE if m in wi]
if len(mi) != 3:
    errors.append(f"a2-u13-d2: الترتيبيات ليست كلها في wordIds: {wi}")
else:
    refs = L132["praesentation"].get("audioManifestRefs", [])
    for idx in sorted(mi, reverse=True):
        wi.pop(idx)
        if idx < len(refs):
            refs.pop(idx)
    # u7-d2: أضف الثلاثية مع مراجعها الصوتية (بلا تكرار)
    for m in MOVE:
        if m not in L72["praesentation"]["wordIds"]:
            L72["praesentation"]["wordIds"].append(m)
            L72["praesentation"].setdefault("audioManifestRefs", []).append(m)
    ol = L72["praesentation"].setdefault("curriculumRef", {}).setdefault("goetheWordListOverlap", [])
    for m in ("zweite", "dritte", "vierte", "erste", "viertel"):
        if m not in ol and m in ("zweite", "dritte", "vierte"):
            ol.append(m)
save(p132, L132)
save(p72, L72)

# بطاقات الكلمات: مستوى/وحدة/استعمال
for cid, extra in (("zweite", ["a2-u14-d2"]), ("dritte", ["a2-u14-d3"]), ("vierte", ["a2-u14-d4"])):
    p = WORDS / f"{cid}.json"
    w = load(p)
    w["level"] = "A2"
    w["unit"] = 7
    uil = w.setdefault("usedInLessons", [])
    for lid in ["a2-u7-d2", "a2-u13-d2"] + extra:
        if lid not in uil:
            uil.append(lid)
    save(p, w)

# ---------- 5) الخطة: misspellings + properNouns ----------
plan = load(PLAN)
DECL = {
    "a2-u1-d1": [("gebegonnen", "begonnen"), ("gevergessen", "vergessen"), ("geverloren", "verloren"), ("gepassiert", "passiert")],
    "a2-u1-d2": [("geweggegangen", "weggegangen"), ("geverschoben", "verschoben")],
    "a2-u1-d3": [("geriten", "geritten")],
    "a2-u1-d4": [("gestriten", "gestritten")],
    "a2-u2-d3": [("gebeantwortet", "beantwortet")],
    "a2-u2-d4": [("geversucht", "versucht")],
    "a2-u2-d5": [("geaufgemacht", "aufgemacht")],
    "a2-u2-d6": [("geversucht", "versucht")],
}
by_id = {e["lessonId"]: e for e in plan["lessons"]}
for lid, pairs in DECL.items():
    e = by_id.get(lid)
    if e is None:
        errors.append(f"الخطة: لا بند لـ{lid}")
        continue
    e["misspellings"] = [{"wrong": w, "right": r} for w, r in pairs]
for lid in ("a2-u4-d1", "a2-u4-d2", "a2-u4-d3"):
    e = by_id.get(lid)
    if e is None:
        errors.append(f"الخطة: لا بند لـ{lid}")
        continue
    e["properNouns"] = ["Berlin"]
save(PLAN, plan)

if errors:
    print("فشل:", *errors, sep="\n  ")
    sys.exit(1)
print("D565 اكتمل: sein forms · 16 نصاً وصفياً · بنود مفردة · الترتيبيات u13-d2←u7-d2 · 8 إعلانات · Berlin")
