#!/usr/bin/env python3
"""tools/dev/check-duden-links.py — فحص حيوية روابط Duden في gReferences (N-028 · D234 · قُسّي D235 · هُذّب D236).

يجمع روابط https://www.duden.de فريدةً من content/**/*.json ويفحصها.
  - رابط الضبط (صفحة Duden الرئيسية) لا يُفتح بعد 3 محاولات ⇒ لا وصول ⇒ «تُخطّي» ورمز 0.
  - 404 ⇒ مكسور (رمز خروج 1 + سرد الروابط مع ملفاتها). غير ذلك ⇒ «غير مؤكد» يُبلَّغ ولا يُسقط.
  - --collect-only: يطبع الروابط بلا شبكة. DUDEN_LINKS=skip: تخطٍّ صريح (اختبار التوصيل).
  - D236: تهذيب ضد تحديد المعدل (HEAD أولاً · GET فقط عند 5xx/مهلة · فاصل 0.2 ث · جولة ثانية
    للناجية بعد 20 ث) + المكسور يُطبَع أخيراً مع ملفاته (ذيل البوابة يكشفه دائماً).

مكتبة قياسية فقط (urllib) — بلا اعتماد جديد.
D235: سلاسل Duden القياسية ASCII مطوية (Maedchen لا M%C3%A4dchen — المشفّر يعيد 404 مؤكداً).
"""
from __future__ import annotations

import os
import re
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
URL_RE = re.compile(r"https://www\.duden\.de/[^\s\"']+")
CONTROL = "https://www.duden.de/"
UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) schluessel-linkcheck/1.0"}
TIMEOUT = 8
CONTROL_TRIES = 3
GAP = 0.2  # فاصل تهذيب بين الطلبات (تحديد المعدل عند Duden)


def collect() -> tuple[list[str], dict[str, list[str]]]:
    files: dict[str, list[str]] = {}
    for p in sorted((ROOT / "content").rglob("*.json")):
        try:
            found = URL_RE.findall(p.read_text(encoding="utf-8"))
        except OSError:
            continue
        for u in found:
            files.setdefault(u, []).append(str(p.relative_to(ROOT)))
    return sorted(files), files


def fetch(url: str, method: str) -> int | str:
    time.sleep(GAP)
    try:
        req = urllib.request.Request(url, headers=UA, method=method)
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return r.status
    except urllib.error.HTTPError as e:  # type: ignore[attr-defined]
        return e.code
    except Exception as e:
        return f"{type(e).__name__}: {e}"


def check(url: str) -> tuple[str, str, str]:
    st = fetch(url, "HEAD")
    if st == 200:
        return (url, "ok", "")
    if st == 404:
        return (url, "broken", "404")
    if st in (403, 429):
        return (url, "unknown", str(st))  # تحديد معدل — بلا إعادة فورية
    st2 = fetch(url, "GET")
    if st2 == 200:
        return (url, "ok", "")
    if st2 == 404:
        return (url, "broken", "404")
    return (url, "unknown", str(st2)[:60])


def main(argv: list[str]) -> int:
    urls, owners = collect()
    if "--collect-only" in argv:
        print(f"duden-links: {len(urls)} رابطاً فريداً (جمع فقط — بلا شبكة)")
        for u in urls:
            print(u)
        return 0
    if os.environ.get("DUDEN_LINKS") == "skip":
        print(f"duden-links: تُخطّي (تجربة توصيل — {len(urls)} رابطاً يفحصها CI)")
        return 0
    reason: int | str = "?"
    for i in range(CONTROL_TRIES):
        reason = fetch(CONTROL, "GET")
        if reason == 200:
            break
        if i < CONTROL_TRIES - 1:
            time.sleep(3)
    if reason != 200:
        print(f"duden-links: تُخطّي — لا وصول ({len(urls)} رابطاً مؤجلاً لـCI · الضبط: {str(reason)[:80]})")
        return 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        results = list(ex.map(check, urls))
    unknown_urls = [u for u, s, _ in results if s == "unknown"]
    if unknown_urls:  # جولة ثانية بعد تهدئة — كثير من 403 يزول
        time.sleep(20)
        with ThreadPoolExecutor(max_workers=2) as ex:
            second = dict(zip(unknown_urls, ex.map(check, unknown_urls)))
        results = [second[u] if s == "unknown" and second.get(u, ("", "unknown", ""))[1] != "unknown" else (u, s, w)
                   for u, s, w in results]
        left = sum(1 for _, s, _ in results if s == "unknown")
        print(f"(الجولة الثانية حسمت {len(unknown_urls) - left} من {len(unknown_urls)})")
    ok = [u for u, s, _ in results if s == "ok"]
    broken = [(u, w) for u, s, w in results if s == "broken"]
    unknown = [(u, w) for u, s, w in results if s == "unknown"]
    summary = f"duden-links: سليم {len(ok)} · مكسور {len(broken)} · غير مؤكد {len(unknown)} (المجموع {len(urls)})"
    print(summary)
    for u, w in unknown:
        print(f"  غير مؤكد: {u} ({w})")
    for u, w in broken:
        print(f"  مكسور: {u} ({w}) ← {', '.join(owners.get(u, []))}")
    print(summary + " — القائمة الكاملة أعلاه")
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
