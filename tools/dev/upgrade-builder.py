#!/usr/bin/env python3
# tools/dev/.tmp-upgrade-builder.py — D564: مولّد ترقية الدروس (B1/B2 ثم A2 لاحقاً)
# يضيف لكل درس: محطة استماع + محطة إملاء (بمقاطع الكلمات الموجودة) · إصلاحات الاستدعاء المعلن
# (match/gap-fill/error-hunt/speaking) · +2 بند Quiz لكل نسخة · ويغطي الكلمات غير المُدرَّبة.
# الاستخدام: python3 tools/dev/.tmp-upgrade-builder.py [b1 b2 ...] [--write]
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "content"

# ——— نسخ طبق الأصل من tools/lib/vocab-forms.ts ———
CLOSED = set("""der die das den dem des ein eine einen einem einer eines kein keine keinen keinem keiner
ich du er sie es wir ihr mich dich ihn uns euch mir dir ihm ihnen sich man mein meine meinen meinem meiner dein deine deinen deinem
sein seine seinen seinem ihre ihren ihrem unser unsere euer eure bin bist ist sind seid war warst wart waren habe hast hat haben habt hatte hattest hattet hatten
werde wirst wird werden kann kannst können könnt muss musst müssen will willst wollen möchte möchtest möchten darf darfst dürfen
soll sollst sollen musste musstest musstet mussten in im ins an am ans auf aus bei mit nach von vom zu zum zur für um ohne gegen durch bis seit über unter vor
hinter neben zwischen beim und oder aber denn sondern weil dass wenn als ob nicht auch noch schon nur sehr ja nein doch mal so wie was
wer wo wann warum welche welcher welches null eins zwei drei vier fünf sechs sieben acht neun zehn elf zwölf
dreizehn vierzehn fünfzehn sechzehn siebzehn achtzehn neunzehn zwanzig hundert es gibt""".split())
AUX = {"hat", "ist", "sich", "sind", "haben"}
SUFFIXES = ["en", "st", "et", "te", "ten", "e", "t", "n", "s", "er", "es"]


def content_tokens(text: str) -> list[str]:
    t = text.lower()
    t = re.sub(r"'s\b", "", t)
    t = "".join(ch if (ch.isalpha() or ch.isspace()) else " " for ch in t)
    return [x for x in t.split() if len(x) > 1]


def deumlaut(s: str) -> str:
    return s.replace("ä", "a").replace("ö", "o").replace("ü", "u")


def without_gloss(de: str) -> str:
    return re.sub(r"\s*\([^)]*\)\s*", " ", de).strip()


def stem(t: str) -> set[str]:
    out = {t}
    for suf in SUFFIXES:
        if len(t) - len(suf) >= 3 and t.endswith(suf):
            out.add(t[: -len(suf)])
    return out


def known_forms(w: dict) -> list[str]:
    base = re.sub(r"^(der|die|das) ", "", w["de"])
    base = re.sub(r"^sich ", "", base).lower()
    parts = [base]
    if w.get("plural"):
        parts.append(re.sub(r"^die ", "", w["plural"]))
    f = w.get("forms") or {}
    for k in ("praesens3s", "perfekt", "praeteritum", "imperative"):
        if f.get(k):
            parts.append(f[k])
    parts += f.get("declined") or []
    out: list[str] = []
    for p in parts:
        out += content_tokens(p)
    return out


def word_appears(w: dict, toks: set[str]) -> bool:
    """نسخ wordAppears — هل تظهر الكلمة في الرموز؟"""
    base = [deumlaut(t) for t in content_tokens(
        without_gloss(w["de"]).replace("sich ", "", 1) if w["de"].startswith("sich ") else without_gloss(w["de"])
    )]
    base = [re.sub(r"^(der|die|das) ", "", t) for t in base]  # لا يؤثر عملياً (التقطيع بعد الإزالة)
    open_ = [t for t in base if t not in CLOSED]
    need = open_ or base
    stems_of = [stem(t) for t in toks]
    for nt in need:
        mine = stem(nt)
        if not any(mine & ss for ss in stems_of):
            return False
    return True


def interleave_present(w: dict, toks: set[str]) -> bool:
    """نسخ الفرع الأول من interleaveSupported (جذعياً — أي زيادة إصلاحات harmless)"""
    forms = [deumlaut(f) for f in known_forms(w) if deumlaut(f) not in CLOSED and deumlaut(f) not in AUX]
    return any(f in toks for f in forms)


GAP = re.compile(r"_{2,}")


def fill_in_word_gap(q: str, a: str) -> str:
    gaps = list(GAP.finditer(q))
    if len(gaps) != 1:
        return q
    m = gaps[0]
    s, e = m.start(), m.end()
    touches = (s > 0 and q[s - 1].isalpha()) or (e < len(q) and q[e].isalpha())
    return q[:s] + a + q[e:] if touches else q


def item_texts(item) -> list[str]:
    out: list[str] = []
    def walk(v, key=None):
        if key in ("why", "audioId"):
            return
        if isinstance(v, str):
            out.append(v)
        elif isinstance(v, list):
            for x in v:
                walk(x)
        elif isinstance(v, dict):
            for k, x in v.items():
                walk(x, k)
    it = item
    if isinstance(it, dict) and isinstance(it.get("q"), str) and isinstance(it.get("a"), str):
        it = {**it, "q": fill_in_word_gap(it["q"], it["a"])}
    walk(it)
    return out


def toks_of(texts: list[str]) -> set[str]:
    return {deumlaut(t) for t in content_tokens("\n".join(texts))}


# ——— بيانات الكلمات والمقاطع ———
def load_words() -> dict[str, dict]:
    out = {}
    for f in (CONTENT / "words").glob("*.json"):
        w = json.loads(f.read_text())
        out[w["id"]] = w
    return out


def load_tracks() -> dict[str, str]:
    out = {}
    for f in (CONTENT / "manifests").glob("audio-manifest*.json"):
        m = json.loads(f.read_text())
        for t in m["tracks"]:
            out[t["id"]] = t["textDe"]
    return out


def display_of(w: dict, tracks: dict[str, str]) -> str:
    """صيغة العرض: نص المقطع بلا علامة الترقيم الأخيرة (أو de بلا الشرح)"""
    txt = tracks.get(f"word-{w['id']}", "")
    if txt:
        return re.sub(r"[.!?]+$", "", txt).strip()
    return without_gloss(w["de"])


def ar0(w: dict) -> str:
    ar = w.get("ar") or ["—"]
    return ar[0] if isinstance(ar, list) else str(ar)


# ——— قوالب البنود ———
Q_LISTEN_FORM = ["استمع: أي كلمة سمعت؟", "استمع جيداً: ما الكلمة؟", "استمع: ماذا تسمع؟"]
Q_LISTEN_MEAN = ["استمع: ماذا تعني الكلمة؟", "استمع ثم اختر المعنى الصحيح.", "استمع: أي معنى صحيح؟"]


def make_listening(w, words, tracks, i, extra_q=None):
    d = display_of(w, tracks)
    ar = ar0(w)
    spoken = tracks[f"word-{w['id']}"]
    others = [x for x in words if x["id"] != w["id"]]
    if i % 2 == 0:  # معنى (خيارات عربية) — خيارات مميزة دائماً
        distr: list[str] = []
        for x in others:
            a = ar0(x)
            if a != ar and a not in distr:
                distr.append(a)
            if len(distr) >= 2:
                break
        if len(distr) < 2:  # لا خيارات كافية → تعرّف الشكل
            dd: list[str] = []
            for x in others:
                v = display_of(x, tracks)
                if v != d and v not in dd:
                    dd.append(v)
                if len(dd) >= 2:
                    break
            return {"audioId": f"word-{w['id']}", "speakText": spoken,
                    "q": Q_LISTEN_FORM[i % len(Q_LISTEN_FORM)], "choices": [d] + dd, "a": d,
                    "why": f"الكلمة المسموعة «{d}» تعني «{ar}». قارنها بالخيارات الأخرى صوتياً."}
        choices = [ar] + distr
        q = extra_q or Q_LISTEN_MEAN[i % len(Q_LISTEN_MEAN)]
        a = ar
        why = f"الصوت يقول «{d}» — معناها «{ar}». ركّز على الصوت لا على الشكل!"
    else:  # تعرّف على الشكل (خيارات ألمانية)
        dd = []
        for x in others:
            v = display_of(x, tracks)
            if v != d and v not in dd:
                dd.append(v)
            if len(dd) >= 2:
                break
        choices = [d] + dd
        q = extra_q or Q_LISTEN_FORM[i % len(Q_LISTEN_FORM)]
        a = d
        why = f"الكلمة المسموعة «{d}» تعني «{ar}». قارنها بالخيارات الأخرى صوتياً."
    return {"audioId": f"word-{w['id']}", "speakText": spoken, "q": q, "choices": choices, "a": a, "why": why}


def make_dictation(w, tracks, i):
    d = display_of(w, tracks)
    ar = ar0(w)
    spoken = tracks[f"word-{w['id']}"]
    hints = [
        f"اكتب ما تسمعه حرفياً: «{d}» تعني «{ar}». انتبه للحروف الكبيرة!",
        f"الإملاء: ما تسمعه هو ما تكتب. الكلمة «{d}» («{ar}»).",
        f"اكتب المسموع بدقة: {d} — ركّز على نهاية الكلمة!",
    ]
    return {"audioId": f"word-{w['id']}", "speakText": spoken, "a": d, "why": hints[i % len(hints)]}


def make_match(pairs_w, tracks, lesson_words=None):
    pairs = [{"ar": ar0(w), "de": display_of(w, tracks)} for w in pairs_w]
    # إكمال إلى ≥3 أزواج (zod) بكلمات الدرس غير المستعملة
    if lesson_words:
        used = {p["de"] for p in pairs} | {p["ar"] for p in pairs}
        for w in lesson_words:
            if len(pairs) >= 3:
                break
            d, a = display_of(w, tracks), ar0(w)
            if d not in used and a not in used:
                pairs.append({"ar": a, "de": d})
                used.add(d)
                used.add(a)
    why = "صِل كل كلمة بمعناها الصحيح: " + " · ".join(f"{p['de']} = «{p['ar']}»" for p in pairs)
    return {"pairs": pairs, "why": why}


def make_gap(w, tracks, variant=0):
    """فجوة من جملة المثال إن وُجدت صيغة فيها، وإلا فجوة تعريفية (3 صيغ لتفادي التكرار)"""
    sample = (w.get("sampleSentence") or {}).get("de") or ""
    d = display_of(w, tracks)
    ar = ar0(w)
    forms = sorted(set(known_forms(w)) - CLOSED - AUX, key=len, reverse=True)
    if variant == 0:
        for f in forms:
            m = re.search(r"\b" + re.escape(f) + r"\b", sample, flags=re.IGNORECASE)
            if m:
                surface = sample[m.start():m.end()]
                q = sample[: m.start()] + "___" + sample[m.end():]
                return {"q": q, "a": surface, "why": f"الكلمة الناقصة «{surface}» تعني «{ar}» — تذكر صيغتها في السياق."}
    if variant <= 1 and sample:
        return {"q": f"«{sample}» — اكتب الكلمة التي تعني «{ar}»: ___", "a": d,
                "why": f"الكلمة «{d}» تعني «{ar}» — اكتبها كما تُقال في الجملة."}
    return {"q": f"استرجع الكلمة التي تعني «{ar}» من درس سابق واكتبها: ___", "a": d,
            "why": f"«{d}» تعني «{ar}» — استرجاع مُعلن: اكتبها من الذاكرة."}


def make_error_hunt(w, tracks):
    """خطأ صيغة/رسم: أحرف كبيرة مقلوبة للخطأ (خطأ ألماني أكيد 100%) أو حذف كلمة"""
    sample = (w.get("sampleSentence") or {}).get("de") or ""
    d = display_of(w, tracks)
    ar = ar0(w)
    forms = sorted(set(known_forms(w)) - CLOSED - AUX, key=len, reverse=True)
    for f in forms:
        m = re.search(r"\b" + re.escape(f) + r"\b", sample, flags=re.IGNORECASE)
        if m:
            surface = sample[m.start():m.end()]
            flipped = surface[0].swapcase() + surface[1:]
            if flipped == surface:
                continue
            wrong = sample[: m.start()] + flipped + sample[m.end():]
            return {"q": f"~~{wrong}~~", "a": sample,
                    "why": f"الخطأ في «{flipped}»! الصواب «{surface}» — راجع القاعدة ({ar})."}
    # بديل: خطأ حذف (الكلمة تظهر في الإجابة)
    if sample:
        wrong = re.sub(r"\b" + re.escape(d.split()[-1]) + r"\b", "…", sample, count=1)
        if wrong != sample:
            return {"q": f"~~{wrong}~~", "a": sample, "why": f"كلمة ناقصة! الصواب يشمل «{d}» ({ar})."}
        return {"q": f"~~{sample}~~ (ناقصة: {d})", "a": f"{sample} {d}.".strip(),
                "why": f"الجملة تفتقد «{d}» ({ar}) — أكملها بالكلمة الصحيحة."}
    return {"q": f"~~{d[0].swapcase() + d[1:] if d else d}~~", "a": d,
            "why": f"الخطأ رسم الكلمة! الصواب «{d}» ({ar}) — انتبه للحروف الكبيرة."}


def make_speaking(w, tracks):
    d = display_of(w, tracks)
    ar = ar0(w)
    sample = (w.get("sampleSentence") or {}).get("de") or d
    return {"q": f"كوّن جملة فيها «{d}» («{ar}») ثم تحدّث بها.", "a": sample,
            "why": f"استعمل «{d}» («{ar}») في جملة كاملة — الجملة النموذجية توضح الاستعمال."}


def make_quiz(w, tracks, variant_qs: set[str]):
    d = display_of(w, tracks)
    ars = w.get("ar") or ["—"]
    for ar in ars:
        q = f"«{ar}»؟"
        if q not in variant_qs:
            return {"q": q, "a": d}
    sample = (w.get("sampleSentence") or {})
    if sample.get("ar") and sample.get("de"):
        q = f"«{sample['ar']}»؟"
        if q not in variant_qs:
            return {"q": q, "a": sample["de"]}
    return None


# ——— المعالجة الرئيسية ———
_ORDER = {"A1": 0, "A2": 1, "B1": 2, "B2": 3}
_PATH_CACHE: list[tuple[int, list[str]]] | None = None


def path_index() -> list[tuple[int, list[str]]]:
    global _PATH_CACHE
    if _PATH_CACHE is None:
        out = []
        for f in (CONTENT / "lessons").glob("*/*.json"):
            L2 = json.loads(f.read_text())
            po = _ORDER[L2["level"]] * 10000 + L2["unit"] * 100 + L2["day"]
            out.append((po, L2["praesentation"]["wordIds"]))
        out.sort(key=lambda x: x[0])
        _PATH_CACHE = out
    return _PATH_CACHE


def before_and_nearest(L: dict) -> tuple[set[str], list[str]]:
    po1 = _ORDER[L["level"]] * 10000 + L["unit"] * 100 + L["day"]
    before: set[str] = set()
    nearest: list[str] = []
    for po, ids in path_index():
        if po < po1:
            before |= set(ids)
            nearest = ids
        else:
            break
    return before, list(nearest)


def process_lesson(path: Path, words: dict, tracks: dict, log: list[str]) -> bool:
    L = json.loads(path.read_text())
    lid = L["id"]
    word_ids = L["praesentation"]["wordIds"]
    lesson_words = [words[x] for x in word_ids if x in words]
    stations = L["uebung"]["stations"]

    # 1) نصوص المحطات الحالية + رموزها
    st_texts = []
    st_toks = []
    for st in stations:
        texts = []
        for it in st["items"]:
            texts += item_texts(it)
        st_texts.append(texts)
        st_toks.append(toks_of(texts))

    # 2) إصلاحات الاستدعاء المعلن (بند لكل كلمة ناقصة داخل محطتها) — وإسقاط الإعلانات الخاطئة (كلمة الدرس نفسه/لاحقة)
    # F121: الاستدعاء لما سبق تعلمه فقط
    before, nearest_ids = before_and_nearest(L)
    if before:  # أول درس في المسار مستثنى (لا شيء قبله)
        wc = L["warmup"]["cardIds"]
        kept = [c for c in wc if c in before]
        dropped = [c for c in wc if c not in before]
        if dropped:
            for c in nearest_ids[::-1]:  # plerئة من أقرب درس سابق حتى 3 بطاقات
                if len(kept) >= max(3, len(wc) - len(dropped)):
                    break
                if c not in kept:
                    kept.append(c)
            while len(kept) < 2 and nearest_ids:
                c = nearest_ids.pop()
                if c not in kept:
                    kept.append(c)
            L["warmup"]["cardIds"] = kept
            log.append(f"  {lid}: دفء — أُسقطت بطاقات لم تُدرَّس بعد: {dropped} ← plerئت {kept}")

    moved: list[dict] = []  # كلمات تُنقل لمحطة الاستماع الجديدة (احتياط)
    lesson_keys: set[str] = set()  # بصمات كل بنود الدرس (منع التكرار عبر المحطات)
    for st in stations:
        for it in st.get("items", []):
            lesson_keys.add(json.dumps(item_texts(it), ensure_ascii=False))

    def push_item(st, mk, words, tracks) -> bool:
        """يولّد بنداً فريداً (3 صيغ) ويضيفه؛ False إن تعذّر"""
        for variant in (0, 1, 2):
            item = mk(variant)
            if item is None:
                continue
            k = json.dumps(item_texts(item), ensure_ascii=False)
            if k in lesson_keys:
                continue
            lesson_keys.add(k)
            st["items"].append(item)
            return True
        return False

    for si, st in enumerate(stations):
        iw = list(dict.fromkeys(st.get("interleavedWith", [])))  # بلا تكرار
        st["interleavedWith"] = iw
        bad = [r for r in iw if before and r not in before]
        if bad:
            st["interleavedWith"] = [r for r in iw if r not in bad]
            log.append(f"  {lid} محطة {si + 1}: إعلانات ليست من درس سابق أُسقطت: {bad}")
        missing = []
        for ref in st.get("interleavedWith", []):
            w = words.get(ref)
            if w is None:
                continue
            if not interleave_present(w, st_toks[si]):
                missing.append(w)
        if not missing:
            continue
        t = st["type"]
        keep = []
        if t == "match":
            for i in range(0, len(missing), 6):
                chunk = missing[i:i + 6]
                push_item(st, lambda v, chunk=chunk: make_match(chunk, tracks, lesson_words) if v == 0 else None, words, tracks)
        elif t in ("gap-fill", "verb-bank"):
            for w in missing:
                push_item(st, lambda v, w=w: make_gap(w, tracks, v), words, tracks)
        elif t == "error-hunt":
            for w in missing:
                push_item(st, lambda v, w=w: make_error_hunt(w, tracks) if v == 0 else None, words, tracks)
        elif t in ("speaking", "writing"):
            for w in missing:
                push_item(st, lambda v, w=w: make_speaking(w, tracks) if v == 0 else None, words, tracks)
        elif t in ("choice", "gender-drill", "case-drill"):
            for w in missing:
                d = display_of(w, tracks)
                others = [display_of(x, tracks) for x in lesson_words if x["id"] != w["id"]][:2]
                push_item(st, lambda v, w=w, d=d, others=others: {"q": f"اختر الكلمة الصحيحة التي تعني «{ar0(w)}».", "choices": [d] + others,
                                    "a": d, "why": f"«{d}» تعني «{ar0(w)}» — لا تخلطها بالخيارات الأخرى."} if v == 0 else None, words, tracks)
        else:
            moved += missing
            continue
        # تحقق: إذا بقيت كلمة غير ظاهرة في نصوص المحطة بعد الإضافة → أضف ذكرها في بند مطابقة صغير
        texts2 = []
        for it in st["items"]:
            texts2 += item_texts(it)
        toks2 = toks_of(texts2)
        for w in missing:
            if not interleave_present(w, toks2):
                keep.append(w)
        if keep:
            # احتياط ثانٍ: نقل إلى محطة الاستماع الجديدة
            moved += keep
            st["interleavedWith"] = [r for r in st.get("interleavedWith", []) if r not in {x["id"] for x in keep}]

    # 2.5) خلفية الإخلال: كل محطة في A2+ تخلط ≥1 كلمة سابقة (G1 e-interleaving) — بند من نوع المحطة يضمها
    for si, st in enumerate(stations):
        if st.get("interleavedWith") or not before:
            continue
        t = st["type"]
        added_refs = []
        for c in nearest_ids[::-1]:
            if len(added_refs) >= 2:
                break
            w = words.get(c)
            if w is None or c in added_refs:
                continue
            if t == "match":
                push_item(st, lambda v, w=w: make_match([w], tracks, lesson_words) if v == 0 else None, words, tracks)
            elif t in ("gap-fill", "verb-bank"):
                push_item(st, lambda v, w=w: make_gap(w, tracks, v), words, tracks)
            elif t == "error-hunt":
                push_item(st, lambda v, w=w: make_error_hunt(w, tracks) if v == 0 else None, words, tracks)
            elif t in ("speaking", "writing"):
                push_item(st, lambda v, w=w: make_speaking(w, tracks) if v == 0 else None, words, tracks)
            elif t in ("choice", "gender-drill", "case-drill"):
                d = display_of(w, tracks)
                others = [display_of(x, tracks) for x in lesson_words if x["id"] != w["id"]][:2]
                push_item(st, lambda v, w=w, d=d, others=others: {"q": f"اختر الكلمة الصحيحة التي تعني «{ar0(w)}».", "choices": [d] + others,
                                    "a": d, "why": f"«{d}» تعني «{ar0(w)}» — استرجاع من درس سابق."} if v == 0 else None, words, tracks)
            else:
                continue
            added_refs.append(c)
        st["interleavedWith"] = added_refs
        if added_refs:
            log.append(f"  {lid} محطة {si + 1}: خُلِّطت بكلمات أقرب درس سابق: {added_refs}")

    # 3) الكلمات الجديدة غير المُدرَّبة (تغطية) — فحص محافظ
    all_texts = []
    for st in stations:
        for it in st["items"]:
            all_texts += item_texts(it)
    for v in L["quiz"]["variants"]:
        for it in v["items"]:
            all_texts += item_texts(it)
    all_toks = toks_of(all_texts)
    missing_cov = [w for w in lesson_words if not word_appears(w, all_toks)]

    # 4) محطتا الاستماع والإملاء (تغطية أولاً)
    need = list(missing_cov)
    rest = [w for w in lesson_words if w not in need]
    order = need + rest
    l_words = order[:3]
    d_words = order[3:6] or order[:3]
    l_items = [make_listening(w, order, tracks, i) for i, w in enumerate(l_words)]
    # الكلمات المنقولة (استدعاء) — بنود استماع إضافية على كلمات سابقة
    moved_ids = []
    for w in moved:
        if w["id"] in moved_ids:
            continue
        moved_ids.append(w["id"])
        l_items.append(make_listening(w, order, tracks, len(l_items), extra_q="استمع: الكلمة المسترجَعة من درس سابق — ما هي؟"))
    l_station = {"type": "listening", "explanationRequired": True, "interleavedWith": moved_ids, "items": l_items}
    d_items = [make_dictation(w, tracks, i) for i, w in enumerate(d_words)]
    d_refs: list[str] = []
    # كل محطة تخلط ≥1 كلمة سابقة (G1): إن لم تكن هناك كلمات منقولة، خُلِّط بكلمات أقرب درس سابق
    if before and not moved_ids:
        for c in nearest_ids[::-1]:
            w = words.get(c)
            if w is None:
                continue
            l_items.append(make_listening(w, order, tracks, len(l_items), extra_q="استمع: كلمة من درس سابق — استرجعها!"))
            moved_ids.append(c)
            break
        l_station["interleavedWith"] = moved_ids
    if before:
        for c in nearest_ids[::-1]:
            w = words.get(c)
            if w is None or c in moved_ids:
                continue
            d_items.append(make_dictation(w, tracks, len(d_items)))
            d_refs.append(c)
            break
    d_station = {"type": "dictation", "explanationRequired": True, "interleavedWith": d_refs, "items": d_items}
    stations.append(l_station)
    stations.append(d_station)

    # 5) Quiz: +2 بند لكل نسخة على كلمات غير مغطاة أولاً
    for v in L["quiz"]["variants"]:
        v_qs = {it["q"] for it in v["items"]}
        used = {it["a"] for it in v["items"]}
        added = 0
        pool = [w for w in order if display_of(w, tracks) not in used] + [w for w in order]
        for w in pool:
            if added >= 2:
                break
            item = make_quiz(w, tracks, v_qs)
            if item is None:
                continue
            v["items"].append(item)
            v_qs.add(item["q"])
            added += 1
    # ضمان: لا سؤال مكرر في أي نسخة (احتياط أخير) + إعادة التغذية إن نقص العدد
    for v in L["quiz"]["variants"]:
        seen_q: set[str] = set()
        uniq = []
        for it in v["items"]:
            if it["q"] in seen_q:
                continue
            seen_q.add(it["q"])
            uniq.append(it)
        v["items"] = uniq
    for vi, v in enumerate(L["quiz"]["variants"]):
        v_qs = {it["q"] for it in v["items"]}
        guard = len(v["items"])
        pool = [w for w in order] * 3
        tries = 0
        while len(v["items"]) < max(6, guard) and tries < len(pool):
            w = pool[tries]
            tries += 1
            item = make_quiz(w, tracks, v_qs)
            if item is None or item["q"] in v_qs:
                continue
            v_qs.add(item["q"])
            v["items"].append(item)

    # 6) تغطية أخيرة: إن بقيت كلمة غير مغطاة → بند إملاء إضافي
    texts_all = []
    for st in stations:
        for it in st["items"]:
            texts_all += item_texts(it)
    for v in L["quiz"]["variants"]:
        for it in v["items"]:
            texts_all += item_texts(it)
    toks_all = toks_of(texts_all)
    still = [w for w in lesson_words if not word_appears(w, toks_all)]
    for w in still:
        d_station["items"].append(make_dictation(w, tracks, len(d_station["items"])))
        toks_all |= toks_of(item_texts(d_station["items"][-1]))
    still2 = [w for w in lesson_words if not word_appears(w, toks_all)]
    if still2:
        log.append(f"✗ {lid}: تغطية ناقصة حتى بعد الإضافة: {[w['id'] for w in still2]}")
        return False

    # 6.5) تنظيف نصوص البنود: مصطلحات لاتينية ← عربية (قانون الجبهة) — عدا why
    LATIN = {
        "Genitiv": "بالجرّ", "Akkusativ": "بالنصب", "Dativ": "بالحالة الثالثة", "Nominativ": "بالحالة الأولى",
        "Perfekt": "الماضي التام", "Präteritum": "الماضي البسيط", "Imperfekt": "الماضي البسيط",
        "Imperativ": "صيغة الأمر", "Konjunktiv": "صيغة التمني", "Futur": "المستقبل",
        "Plural": "الجمع", "Singular": "المفرد", "Verb": "الفعل", "Nomen": "الاسم", "Adjektiv": "النعت",
    }
    pat = re.compile(r"\b(" + "|".join(LATIN) + r")\b")

    def clean_texts(v, key=None):
        if key == "why":
            return v
        if isinstance(v, str):
            return pat.sub(lambda m: LATIN[m.group(1)], v)
        if isinstance(v, list):
            return [clean_texts(x) for x in v]
        if isinstance(v, dict):
            return {k: clean_texts(x, k) for k, x in v.items()}
        return v

    for st in stations:
        st["items"] = [clean_texts(it) for it in st["items"]]

    # 6.6) إصلاحات meta معلنة (D564) — نصوص هدف/مهمة/خلاصة بكلمات غير مدروسة
    META_FIX = {
        ("b1-u1-d5", "situation"): ("Diskussion: Warum? Obwohl? Trotzdem? — und wo steht das Verb?", "Warum? Obwohl? Trotzdem? — und wo steht das Wort?"),
        ("b1-u1-d6", "situation"): ("Wochenabschluss: Was war? Was kommt?", "Das Ende der Woche: Was war? Was kommt?"),
    }
    ct = L["uebung"]["communicativeTask"]
    for field in ("situation", "goal"):
        fix = META_FIX.get((lid, field))
        holder = ct.get(field) or {}
        if fix and holder.get("de") == fix[0]:
            holder["de"] = fix[1]
    zfix = META_FIX.get((lid, "ziel"))
    if zfix and L["ziel"].get("de") == zfix[0]:
        L["ziel"]["de"] = zfix[1]
    sfix = META_FIX.get((lid, "summary"))
    if sfix and L["zusammenfassung"]["summary"].get("de") == sfix[0]:
        L["zusammenfassung"]["summary"]["de"] = sfix[1]

    path.write_text(json.dumps(L, ensure_ascii=False, indent=2) + "\n")
    log.append(f"✓ {lid}: استماع {len(l_items)} · إملاء {len(d_station['items'])} · استدعاءات منقولة {len(moved_ids)} · تغطية مُصلَّحة {len(missing_cov)}")
    return True


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    write = "--write" in sys.argv
    levels = args or ["b1", "b2"]
    words = load_words()
    tracks = load_tracks()
    log: list[str] = []
    ok = True
    for lv in levels:
        files = sorted((CONTENT / "lessons" / lv).glob("*.json"))
        for f in files:
            if write:
                ok = process_lesson(f, words, tracks, log) and ok
            else:
                log.append(f"(dry) {f.name}")
    for line in log:
        print(line)
    print(f"levels={levels} write={write} ok={ok}")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
