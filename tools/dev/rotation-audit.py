#!/usr/bin/env python3
# tools/dev/rotation-audit.py — عدّاد التدوير الإجباري (D575 — §7 قواعد المركز + §17 G1)
# «كل نص جديد يُفحص بعدّاد التدوير (≥7 مواجهات لكل كلمة) وإن نقصت كلمة حُقنت في تمرين/نص لاحق».
# المنهجية (معلنة بصراحة): مواجهة الكلمة = ظهور جرمها أو صيغها المعلنة أو لواحقها المشروعة
# (e/en/er/es/em/n/s/te/ten/t/st/test — مع طيّ التشكيل ä→a للتماثل) في أي نص ألماني بالمحتوى:
# الحصص · حوارات audio-scripts · القصة · قراءة lese · بنك العبارات (manifests) · الاختبارات · جمل الكلمات المعتمدة.
# الحدّ الدستوري: THRESHOLD = 7. الناتج: تقرير + كشف حقن (الكلمات الناقصة مرتبة بالعجز).
import json, re, sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT = ROOT / "content"
THRESHOLD = 7
SUFFIXES = ("", "e", "en", "er", "es", "em", "n", "s", "te", "ten", "t", "st", "test")
ARABIC = re.compile(r"[\u0600-\u06FF]")
TOKEN = re.compile(r"[a-zäöüß]+(?:[-'][a-zäöüß]+)*")
STRIP_EDGE = " .,;:!?\u201e\u201c\u00bb\u00ab\"'"


def tokens_of(text: str) -> list[str]:
    """جرمات هجينة: t-shirt يبقى جرماً واحداً + جزآه t/shirt — لا تُفقد أي مطابقة سابقة."""
    toks = TOKEN.findall(fold(text))
    extra: list[str] = []
    for tk in toks:
        if "-" in tk or "'" in tk:
            extra.extend(p for p in re.split(r"[-']", tk) if p)
    return toks + extra


FOLD_MAP = str.maketrans({
    "ä": "a", "ö": "o", "ü": "u", "ß": "ss",
    "é": "e", "è": "e", "ê": "e", "ë": "e",
    "á": "a", "à": "a", "â": "a", "í": "i", "ì": "i", "î": "i",
    "ó": "o", "ò": "o", "ô": "o", "ú": "u", "ù": "u", "û": "u", "ç": "c",
})


def fold(s: str) -> str:
    return s.lower().translate(FOLD_MAP)


def lemma_forms(de: str) -> list[str]:
    de = re.sub(r"\([^)]*\)", "", de.lower()).strip().strip(STRIP_EDGE).strip()
    out: list[str] = []
    for part in [p.strip() for p in de.split("/") if p.strip()]:
        out.append(part)
        m = re.match(r"^(der|die|das)\s+(.+)$", part)
        if m:
            out.append(m.group(2))
    return out


def word_forms(w: dict) -> tuple[set[str], set[str]]:
    out: set[str] = set()
    prefixes: set[str] = set()
    de_raw = w["de"].strip()
    if de_raw.endswith("-"):
        for de in lemma_forms(de_raw.rstrip("-")):
            if de:
                prefixes.add(fold(de))
    for de in lemma_forms(w["de"]):
        out.add(fold(de))
    if w.get("plural"):
        for de in lemma_forms(w["plural"]):
            out.add(fold(de))
    f = w.get("forms") or {}
    for k in ("praesens3s", "praeteritum", "perfekt", "imperative", "konjunktivII"):
        v = f.get(k)
        if v:
            for tok in fold(v).split():
                if len(tok) > 2:
                    out.add(tok)
    kc = (w.get("kollocation") or {}).get("de")
    if kc:
        out.add(fold(kc))
    return {x for x in out if x}, prefixes


def scan_texts() -> list[str]:
    texts: list[str] = []

    def walk(o):
        if isinstance(o, dict):
            for v in o.values():
                walk(v)
        elif isinstance(o, list):
            for x in o:
                walk(x)
        elif isinstance(o, str):
            if len(o) >= 2 and not ARABIC.search(o) and re.search(r"[a-zA-ZäöüßÄÖÜ]", o):
                texts.append(o)

    for d in ("lessons", "audio-scripts", "story", "lese", "pruefungen", "modelltest", "transfer", "unit0", "manifests"):
        for p in sorted((CONTENT / d).rglob("*.json")):
            try:
                walk(json.loads(p.read_text(encoding="utf-8")))
            except Exception:
                pass
    for p in sorted((CONTENT / "words").glob("*.json")):
        try:
            w = json.loads(p.read_text(encoding="utf-8"))
            for key in ("sampleSentence", "kollocation"):
                s = (w.get(key) or {}).get("de")
                if isinstance(s, str):
                    texts.append(s)
        except Exception:
            pass
    return texts


def main() -> int:
    words = [json.loads(p.read_text(encoding="utf-8")) for p in sorted((CONTENT / "words").glob("*.json"))]
    texts = scan_texts()
    freq = Counter(tok for t in texts for tok in tokens_of(t))

    # خرائط الإسناد: صيغة تامة → كلمات · جذر → كلمات (بتقليم لاحق مسموح) · سوابق مقيّدة (Lieblings-)
    exact: dict[str, set[int]] = defaultdict(set)
    stems: dict[str, list[tuple[str, int]]] = defaultdict(list)
    prefixes: dict[str, list[int]] = defaultdict(list)
    all_forms: list[set[str]] = []
    for i, w in enumerate(words):
        fs, pfs = word_forms(w)
        all_forms.append(fs)
        for pf in pfs:
            prefixes[pf].append(i)
        for form in fs:
            exact[form].add(i)
            stem = re.sub(r"(?:en|n|e)$", "", form) if len(form) > 4 else form
            stems[form[:3] if len(form) >= 3 else form].append((stem, i))

    counts = [0] * len(words)
    # العبارات المتعددة الكلمات (chunks): عدّ n-grams على مستوى النص (لا تعبر النصوص)
    phrases: dict[str, list[tuple[tuple[str, ...], int]]] = defaultdict(list)
    for i in range(len(words)):
        for form in all_forms[i]:
            if " " in form:
                pt = tuple(TOKEN.findall(form))
                if len(pt) >= 2:
                    phrases[pt[0]].append((pt, i))
    for text in texts:
        toks = TOKEN.findall(fold(text))
        for pos, tok in enumerate(toks):
            for pt, i in phrases.get(tok, ()):
                if tuple(toks[pos:pos + len(pt)]) == pt:
                    counts[i] += 1  # كل وقوع مواجهة (اتساق مع عدّ المفردات)
    for tok, n in freq.items():
        hit: set[int] = set()
        hit |= exact.get(tok, set())
        # لواحق مشروعة: جذر + لاحقة
        for cut in range(3, min(len(tok), 14) + 1):
            prefix = tok[:cut]
            if tok[cut:] not in SUFFIXES:
                continue
            for stem, i in stems.get(prefix[:3], ()):
                if prefix == stem or (prefix.startswith(stem) and prefix[len(stem):] in SUFFIXES):
                    hit.add(i)
        for pf, ids in prefixes.items():
            if tok.startswith(pf):
                for i in ids:
                    hit.add(i)
        for i in hit:
            counts[i] += n

    deficient = [{"id": words[i]["id"], "de": words[i]["de"], "count": counts[i]} for i in range(len(words)) if counts[i] < THRESHOLD]
    deficient.sort(key=lambda x: x["count"])
    out = {
        "threshold": THRESHOLD,
        "words": len(words),
        "textsScanned": len(texts),
        "ok": len(words) - len(deficient),
        "deficient": len(deficient),
        "worst": deficient[:25],
    }
    if "--json" in sys.argv:
        print(json.dumps(out, ensure_ascii=False))
    else:
        print(f"rotation: {out['ok']}/{out['words']} كلمة ≥{THRESHOLD} مواجهة · ناقصة {out['deficient']} من {out['textsScanned']} نصاً")
        for d in deficient[:25]:
            print(f"  {d['count']:>2}  {d['id']} ({d['de']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
