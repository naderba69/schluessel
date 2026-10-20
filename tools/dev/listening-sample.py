#!/usr/bin/env python3
"""tools/dev/listening-sample.py — عينة الحكم السمعي قبل الإطلاق (N-011 · N-122 · D234).

يشتق 20 مقطعاً حتمياً من مصادرها (لا اختيار يدوي):
  أ. الأحد عشر مدخلاً «تحت التحقق السمعي» في معجم النطق (كاشف devoicing + Bäckerei — Q24).
  ب. الثلاثة المصحّحة يقيناً (circa · Abteilung · holt — الفونيم/النبر/الطول كان خطأً فيُنطق خطأً).
  ج. المعلَّم فوق عتبة السرعة (fc-11 — N-122).
  د. أسرع 5 أسطر حوار بعده (السرعة والطبيعية).
المقطع الممثّل للكلمة: word-* أولاً ثم num-* ثم الأول أبجدياً. يكتب docs/reports/listening-sample.md.
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LEXICON = ROOT / "tools/pronunciation-lexicon.json"
OUT = ROOT / "docs/reports/listening-sample.md"

_spec = importlib.util.spec_from_file_location("speech_rate", ROOT / "tools/dev/speech-rate.py")
assert _spec and _spec.loader
_speech = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_speech)

TRIO = ("circa", "Abteilung", "holt")
TRIO_Q = {
    "circa": "هل أولها ts (تْس) كما في zirka لا k؟",
    "Abteilung": "هل النبر على المقطع الثاني (-tei-) لا الأول؟",
    "holt": "هل o طويلة (hohlt) لا قصيرة (Holz)؟",
}


def rep_track(tracks: list[str]) -> str:
    for pref in ("word-", "num-"):
        c = sorted(t for t in tracks if t.startswith(pref))
        if c:
            return c[0]
    return sorted(tracks)[0]


def main() -> int:
    lex = json.loads(LEXICON.read_text(encoding="utf-8"))["entries"]
    rows = {r["id"]: r for r in _speech.measure()}
    sample: list[dict] = []

    ear = sorted((e for e in lex if e.get("earReview")), key=lambda e: e["word"])
    assert len(ear) == 11, f"earReview = {len(ear)} لا 11 — حدّث الاختبار المثبّت أولاً"
    for e in ear:
        t = rep_track(e["regeneratedTracks"])
        r = rows[t]
        if e["word"] == "Bäckerei":
            q = "هل الحركة قبل r قصيرة (bäckeREI) لا طويلة؟"
        else:
            q = f"هل الصامت المصحّح مهموس في السمع؟ (المرجع {e.get('referenceIpa', '')})"
        sample.append({"id": t, "word": e["word"], "why": "تحت التحقق السمعي (Q24)", "q": q,
                       "text": r["textDe"], "wpm": r["wpm"], "lesson": (r["lessonRefs"] or ["—"])[0]})

    trio = {e["word"]: e for e in lex if e["word"] in TRIO}
    assert set(trio) == set(TRIO), "الثلاثي المصحّح ناقص من المعجم"
    for w in TRIO:
        t = rep_track(trio[w]["regeneratedTracks"])
        r = rows[t]
        sample.append({"id": t, "word": w, "why": "تصحيح يقيني (فونيم/نبر/طول)", "q": TRIO_Q[w],
                       "text": r["textDe"], "wpm": r["wpm"], "lesson": (r["lessonRefs"] or ["—"])[0]})

    flagged = [r for r in rows.values() if r["wpm"] > 200.0 and r["words"] >= 3]
    assert len(flagged) == 1 and flagged[0]["id"] == "fc-11", "المعلَّم تغيّر — راجع N-122"
    f = flagged[0]
    sample.append({"id": "fc-11", "word": "—", "why": f"فوق العتبة: {f['wpm']} كلمة/دقيقة (N-122)",
                   "q": "هل يُفهم من أول استماع؟ إن بدا سريعاً يُعاد بصياغة أطول لا بضبط السرعة.",
                   "text": f["textDe"], "wpm": f["wpm"], "lesson": (f["lessonRefs"] or ["—"])[0]})

    taken = {s["id"] for s in sample}
    fast = sorted((r for r in rows.values() if r["role"] == "dialogue" and r["id"] not in taken),
                  key=lambda r: -r["wpm"])[:5]
    for r in fast:
        sample.append({"id": r["id"], "word": "—", "why": f"من أسرع الحوارات: {r['wpm']} كلمة/دقيقة",
                       "q": "هل السرعة طبيعية والنطق واضح؟", "text": r["textDe"], "wpm": r["wpm"],
                       "lesson": (r["lessonRefs"] or ["—"])[0]})

    assert len(sample) == 20, f"العينة = {len(sample)} لا 20"
    for i, s in enumerate(sample, 1):
        print(f"{i:>2}. {s['id']:<18} «{s['text']}» — {s['why']}")

    lines = ["# عينة الحكم السمعي قبل الإطلاق (20 مقطعاً)",
             "",
             "أُعدّت آلياً بتاريخ 2026-10-20 من: معجم النطق (الأحد عشر «تحت التحقق السمعي» + الثلاثة المصحّحة) + مقياس السرعة (المعلَّم fc-11 + أسرع 5 حوارات).",
             "حكمك هنا يُغلق N-011 (جودة النطق) وN-122 (سرعة fc-11). لا شيء يُعاد توليده قبل حكمك.",
             "",
             "## كيف تستمع",
             "",
             "- سطر الحوار: افتح درسه في التطبيق واضغط زر الصوت عند السطر (عمود الدرس يدلّك عليه).",
             "- مقطع الكلمة (word-*): من بطاقة الكلمة في درسها.",
             "- أو اطلب مني توليد الملفات العشرين دفعة واحدة بصوتها المسجّل نفسه.",
             "",
             "| # | المقطع | النص | لماذا هذا المقطع | ماذا تحكم | الحكم |",
             "|---|---|---|---|---|---|"]
    for i, s in enumerate(sample, 1):
        lines.append(f"| {i} | `{s['id']}` ({s['lesson']}) | «{s['text']}» | {s['why']} | {s['q']} | ☐ سليم · ☐ أعد |")
    lines += ["",
              "## بعد الحكم",
              "",
              "- «سليم» على الأحد عشر ⇒ تُرفع علامة «تحت التحقق السمعي» وتُغلق N-011.",
              "- «سليم» على fc-11 ⇒ تُغلق N-122. «أعد» ⇒ يُعاد بصياغة أطول (قرار D185: لا ضبط سرعة).",
              "- أي «أعد» ⇒ يُصحَّح المعجم/المقطع وتُعاد المسارات ثم تُعرض عليك ثانية.",
              ""]
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nكُتبت: {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
