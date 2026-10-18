#!/usr/bin/env python3
# tools/pronunciation-audit.py — تدقيق نطق كل ما يُنطق (D122) مقابل مرجع حر
# الاستخدام:
#   python3 tools/pronunciation-audit.py            → تقرير مقروء
#   python3 tools/pronunciation-audit.py --json     → {"words", "compared", "stale", "flagged", "reviewedStale", "reviewedDrift"}
#   python3 tools/pronunciation-audit.py --refresh-reference /tmp/ipa-de.txt
#       → يعيد بناء المقتطف tools/pronunciation-reference.de.json من المرجع الكامل بعد التحقق من بصمة git
#         (جلبه: gh api repos/open-dict-data/ipa-dict/git/blobs/<gitBlob> -H "Accept: application/vnd.github.raw")
# ما يُدقَّق: كل كلمة في نصوص المسارات المنشورة (المانيفست) وفي حقل de لكل كلمة — كما يقرؤها الصوت المثبَّت
# فعلاً بعد معجم النطق (synth_phonemes)، معزولةً. ثلاثة فحوص: طول الحركة المنبورة · موضع النبر (عدد النوى قبله)
# · إجهار النهاية داخل الكلمة (D189: b/d/ɡ مجهورة قبل صامت حيث يهمسها المرجع).
# الحكم: كلمة يخالف نطقُها المرجعَ في كل صيغه، أو لا مرجع لها، يجب أن تكون مصحَّحة في المعجم (entries)
# أو مفحوصة مقبولة بسبب مكتوب (reviewed) — وإلا تفشل البوابة (tests/pronunciation-audit.test.ts).
# حدود معلنة: الكلمة معزولةً لا في جملتها (صيغ السياق يحرسها اختبار المعجم) · لا فحص للصوامت (Familienname
# وجدها الفحص اليدوي) · المرجع صوتمي عريض لا يميّز كل فرق.
import hashlib
import importlib.util
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REFERENCE = ROOT / "tools/pronunciation-reference.de.json"
_spec = importlib.util.spec_from_file_location("gen_audio", ROOT / "tools" / "gen-audio.py")
ga = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ga)  # type: ignore[union-attr]

# D130: حروف لاتينية كاملة (Latin‑1 + Latin Extended‑A) لا الألمانية وحدها — اسم العلم Ayşe كلمة واحدة
# (كانت تُقطع «Ay» + «e» فتُدقَّق شظايا لا وجود لها)؛ والعربية (sein (ملكيته)) تبقى خارج التدقيق.
TOKEN = re.compile(r"[A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u017F]+")
VOWELS = "aeiouyøœɛɪʊɔəɐæɑʏɜ"
_NON_SYLLABIC = ("ɐ̯", "ɪ̯", "ʊ̯", "i̯", "u̯", "y̯", "o̯")


def content_words() -> list[str]:
    """كل كلمة تُنطق في مسار منشور + كل كلمة في حقل de لمفردات المحتوى (مرتبة، بلا تكرار، بحالتها)."""
    words: set[str] = set()
    manifest = json.loads((ROOT / "content/manifests/audio-manifest.a1-u1.json").read_text(encoding="utf-8"))
    for t in manifest["tracks"]:
        words.update(TOKEN.findall(t["textDe"]))
    for f in sorted((ROOT / "content/words").glob("*.json")):
        words.update(TOKEN.findall(json.loads(f.read_text(encoding="utf-8"))["de"]))
    return sorted(words)


def resolve(word: str, ref: dict) -> str | None:
    """مفتاح الكلمة في المرجع: بحالتها · بحرف صغير (أول الجملة) · بحرف كبير — أول ما يوجد."""
    for k in (word, word.lower(), word[:1].upper() + word[1:]):
        if k in ref:
            return k
    return None


def _norm(ipa: str) -> str:
    s = unicodedata.normalize("NFC", ipa)
    for g in _NON_SYLLABIC:
        s = s.replace(unicodedata.normalize("NFC", g), "")
    return re.sub(r"[ɐɜ](?=[\s.,!?]|$)", "ə", s)  # r المصوَّتة آخر الكلمة نواةٌ مخففة لا حركة مستقلة


def stress_index(ipa: str) -> int:
    """عدد النوى الصوتية قبل النبر الأولي (0 = النبر على الأول) — espeak يضع ˈ قبل الحركة والمرجع قبل المقطع."""
    s = _norm(ipa).replace("ˌ", "")
    i = s.find("ˈ")
    return 0 if i < 0 else len(re.findall(rf"[{VOWELS}]+", s[:i]))


def syllables(ipa: str) -> int:
    return len(re.findall(rf"[{VOWELS}]+", _norm(ipa).replace("ˈ", "").replace("ˌ", "")))


def stressed_long(ipa: str) -> bool | None:
    """هل الحركة المنبورة طويلة (ː)؟ بلا علامة نبر = أول حركة. None = لا حركة.
    أنصاف الحركات (i̯ في Portion /pɔʁˈt͡si̯oːn/) تُحذف أولاً — ليست نواة المقطع المنبور."""
    s = unicodedata.normalize("NFC", ipa)
    for g in _NON_SYLLABIC:
        s = s.replace(unicodedata.normalize("NFC", g), "")
    i = s.find("ˈ")
    if i < 0:
        m = re.search(rf"[{VOWELS}]", s)
        if not m:
            return None
        i = m.start() - 1
    m = re.search(rf"[{VOWELS}]+ː?", s[i + 1:])
    return None if not m else m.group(0).endswith("ː")


_DEVOICE = {"b": "p", "d": "t", "ɡ": "k"}
_C_NEXT = "ptkbdɡfvszʃçxhmnlrɾŋ"  # صامت يليه داخل الكلمة — لا حركة ولا علامة نبر ولا حدّ كلمة


def _devoice_norm(ipa: str) -> str:
    """تطبيع للمقارنة الصامتية فقط: رموز المرجع ← أعراف espeak (ʁ→r · t͡s→ts) وحذف النبر وʔ والعلامات غير المقطعية."""
    s = _norm(ipa).replace("t͡s", "ts").replace("ʁ", "r").replace("ʔ", "")
    return re.sub(r"[ˈˌ̩ˑ]", "", s).replace("ɾ", "r")


def devoicing_errors(espeak: str, refs: list[str]) -> list[str]:
    """D189 (N-101): إجهار النهاية داخل المركّبات وقبل اللواحق — espeak يُبقي b/d/ɡ مجهورةً قبل صامت
    (Flughafen [ɡh] · Mädchen [dç] · ‑undsechzig [ndz]) حيث المرجع يهمسها (k/t/t). المخالفة: الزوج المجهور+التالي
    غائب عن كل صيغ المرجع بينما نظيره المهموس (أو المهموس+المجهور، حين يدمج espeak الصامتَين: ‑unddreißig [ndr] ← [ntdr]) حاضر.
    يعود بالأزواج الخاطئة (مثل «ɡh») — فارغ = لا خطأ من هذا الصنف. لا يُحكم قبل حركة أو علامة نبر (وصل طبيعي: ‑undachtzig)."""
    e = _devoice_norm(espeak)
    rs = [_devoice_norm(r) for r in refs]
    if not rs:
        return []
    bad = []
    for m in re.finditer(rf"([bdɡ])(?=([{_C_NEXT}]))", e):
        v, nxt = m.group(1), m.group(2)
        voiced, devoiced = v + nxt, _DEVOICE[v] + nxt
        geminate = _DEVOICE[v] + v + nxt
        if all(voiced not in r for r in rs) and any(devoiced in r or geminate in r for r in rs):
            bad.append(voiced)
    return bad


def compare(espeak: str, refs: list[str]) -> list[str]:
    """أنواع المخالفة: length إن خالفت كلُّ صيغ المرجع طولَ الحركة المنبورة · stress إن خالفت كلُّها موضعَ النبر
    · devoicing (D189) إن أبقى espeak صامتاً مجهوراً قبل صامت حيث يهمسه المرجع في كل صيغه."""
    kinds = []
    if devoicing_errors(espeak, refs):
        kinds.append("devoicing")
    el = stressed_long(espeak)
    rl = [stressed_long(r) for r in refs]
    if el is not None and all(x is not None and x != el for x in rl):
        kinds.append("length")
    if syllables(espeak) >= 2 and all(stress_index(r) != stress_index(espeak) for r in refs):
        kinds.append("stress")
    return kinds


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def audit() -> dict:
    reference = load_json(REFERENCE)
    ref_words: dict = reference["words"]
    lex = load_json(ga.PRON_LEXICON)
    fixed = {e["word"].lower() for e in lex["entries"]}
    reviewed = {r["word"].lower(): r for r in lex.get("reviewed", [])}
    words = content_words()
    stale = [w for w in words if w not in ref_words]
    voice = ga.load_phonemizer(ga.VOICE_ONNX)
    rows: list[dict] = []
    compared = 0
    for w in words:
        if w in stale:
            continue
        refs = ref_words[w]["ipa"]
        espeak = unicodedata.normalize("NFC", "".join("".join(s) for s in ga.synth_phonemes(voice, w + "."))).rstrip(".")
        if refs:
            compared += 1
            kinds = compare(espeak, refs)
        else:
            kinds = [] if w.lower() in fixed else ["no-reference"]  # مدخل المعجم نفسه قرارٌ موثَّق (referenceNote)
        rows.append({"word": w, "kinds": kinds, "espeak": espeak, "reference": refs})
    flagged = [r for r in rows if r["kinds"] and r["word"].lower() not in reviewed]
    # مراجَع لا تخالف أيٌّ من صيغه الآن (أو غاب عن المحتوى) ← يُحذف: القائمة تبقى صادقة لا مقبرة قرارات
    still = {r["word"].lower() for r in rows if r["kinds"]}
    reviewed_stale = sorted(r["word"] for k, r in reviewed.items() if k not in still)
    # مراجَع تغيّر نطق espeak له بعد قراره ← القرار كان عن نطق آخر فيُعاد فحصه (لا قبول صامت)
    drift = sorted({r["word"] for r in rows if r["word"].lower() in reviewed
                    and r["espeak"] != unicodedata.normalize("NFC", reviewed[r["word"].lower()]["espeak"])})
    return {"words": len(words), "compared": compared, "stale": stale, "flagged": flagged,
            "reviewedStale": reviewed_stale, "reviewedDrift": drift}


def git_blob_sha(data: bytes) -> str:
    return hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest()


def refresh_reference(full_path: str) -> dict:
    """يبني المقتطف لكلمات المحتوى الحالية من المرجع الكامل — بعد التحقق من أنه النسخة المثبَّتة نفسها."""
    lex = load_json(ga.PRON_LEXICON)
    pinned = lex["reference"]["gitBlob"]
    data = Path(full_path).read_bytes()
    if git_blob_sha(data) != pinned:
        raise SystemExit(f"✗ بصمة المرجع {git_blob_sha(data)} ≠ المثبَّتة {pinned} — لا مقتطف من نسخة أخرى")
    ref: dict[str, list[str]] = {}
    for line in data.decode("utf-8").splitlines():
        w, _, p = line.partition("\t")
        ref[w] = [x.strip().strip("/") for x in p.split(",") if x.strip()]
    words = {}
    for w in content_words():
        k = resolve(w, ref)
        words[w] = {"key": k, "ipa": ref[k] if k else []}
    out = {
        "schemaVersion": "1.0.0",
        "decision": "D122",
        "about": "مقتطف من المرجع لكلمات المحتوى المنطوقة فقط — يُبنى آلياً بـ tools/pronunciation-audit.py --refresh-reference ولا يُحرَّر يدوياً. key = مفتاح الكلمة في المرجع (null = غائبة عنه).",
        "license": "CC-BY-SA",
        "attribution": "IPA from Wiktionary contributors (https://www.wiktionary.org/) via devio-at/german-ipa-dict (https://github.com/devio-at/german-ipa-dict) via open-dict-data/ipa-dict data/de.txt. هذا الملف مشتق منها فيبقى بترخيصها نفسه (ShareAlike).",
        "source": {"repo": "open-dict-data/ipa-dict", "path": "data/de.txt", "gitBlob": pinned},
        "words": words,
    }
    REFERENCE.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return {"words": len(words), "absent": sorted(w for w, v in words.items() if v["key"] is None)}


def main() -> None:
    args = sys.argv[1:]
    if args[:1] == ["--refresh-reference"]:
        print(json.dumps(refresh_reference(args[1]), ensure_ascii=False))
        return
    r = audit()
    if "--json" in args:
        print(json.dumps(r, ensure_ascii=False))
        return
    print(f"كلمات: {r['words']} | قورنت بالمرجع: {r['compared']} | مقتطف قديم: {len(r['stale'])} | مخالفة بلا قرار: {len(r['flagged'])} | مراجَع لم يعد لازماً: {len(r['reviewedStale'])} | مراجَع تغيّر نطقه: {len(r['reviewedDrift'])}")
    for w in r["stale"]:
        print(f"  ⟳ {w} — غائبة عن المقتطف: شغّل --refresh-reference")
    for f in r["flagged"]:
        print(f"  ✗ {f['word']:16} {'+'.join(f['kinds']):14} espeak {f['espeak']:24} مرجع {', '.join(f['reference']) or '—'}")
    for w in r["reviewedStale"]:
        print(f"  − {w} — في reviewed ولم يعد يخالف (أو غاب عن المحتوى): احذفه")
    for w in r["reviewedDrift"]:
        print(f"  ≠ {w} — نطق espeak تغيّر بعد قرار المراجعة: أعد الفحص")
    sys.exit(1 if (r["stale"] or r["flagged"] or r["reviewedStale"] or r["reviewedDrift"]) else 0)


if __name__ == "__main__":
    main()
