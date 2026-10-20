#!/usr/bin/env python3
"""tools/dev/check-duden-links.py — فحص حيوية روابط Duden في gReferences (N-028 · D234 · قُسّي D235).

يجمع روابط https://www.duden.de فريدةً من content/**/*.json ويفحصها (HEAD ثم GET عند الحاجة).
  - رابط الضبط (صفحة Duden الرئيسية) لا يُفتح بعد 3 محاولات ⇒ لا وصول ⇒ «تُخطّي» ورمز 0
    (الصندوق المحلي بلا إنترنت؛ بوابة CI على GitHub تملك الوصول فتُنفّذ الفحص فعلاً).
  - 404 ⇒ مكسور (رمز خروج 1 + سرد الروابط). غير ذلك (403/429/5xx/مهلة) ⇒ «غير مؤكد» يُبلَّغ ولا يُسقط.
  - --collect-only: يطبع الروابط بلا شبكة (للفحص السريع والاختبار).
  - DUDEN_LINKS=skip: تخطٍّ صريح بلا شبكة (اختبار vitest يختبر التوصيل لا الشبكة —
    الفحص الحقيقي خطوةُ البوابة وحدها، وإلا ضُرب الموقع مرتين في كل تشغيل CI).

مكتبة قياسية فقط (urllib) — بلا اعتماد جديد.
D235: سلاسل Duden القياسية ASCII مطوية (Maedchen لا M%C3%A4dchen — المشفّر يعيد 404 مؤكداً).
"""
from __future__ import annotations

import json
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


def collect() -> list[str]:
    urls: set[str] = set()
    for p in sorted((ROOT / "content").rglob("*.json")):
        try:
            urls.update(URL_RE.findall(p.read_text(encoding="utf-8")))
        except OSError:
            continue
    return sorted(urls)


def fetch(url: str, method: str) -> int | str:
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
    st2 = fetch(url, "GET")
    if st2 == 200:
        return (url, "ok", "")
    if st2 == 404:
        return (url, "broken", "404")
    return (url, "unknown", str(st2)[:100])


def main(argv: list[str]) -> int:
    urls = collect()
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
    ok = [u for u, s, _ in results if s == "ok"]
    broken = [(u, w) for u, s, w in results if s == "broken"]
    unknown = [(u, w) for u, s, w in results if s == "unknown"]
    print(f"duden-links: سليم {len(ok)} · مكسور {len(broken)} · غير مؤكد {len(unknown)} (المجموع {len(urls)})")
    for u, w in broken:
        print(f"  مكسور: {u} ({w})")
    for u, w in unknown:
        print(f"  غير مؤكد: {u} ({w})")
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
