#!/usr/bin/env bash
# tools/dev/fetch-official.sh — جلب النصوص الرسمية المثبَّتة (D108 · N-104) إلى .dev-cache/ (خارج git)
# المصدر: البصمات المثبَّتة في content/wordlists/goethe-a1-sd1.json وgoethe-a2.json وtools/pronunciation-reference.de.json
# لا تُلتزم ملفات PDF ولا نصوصها في المستودع (حقوق Goethe-Institut) — تُجلب عند الحاجة فقط.
# الاستعمال: bash tools/dev/fetch-official.sh        ← ينتج .dev-cache/sd1.txt · a2.txt · ipa-de.txt
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
CACHE="$ROOT/.dev-cache"; mkdir -p "$CACHE"
pin() { python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print(d['source'][sys.argv[2]])" "$1" "$2"; }
fetch_blob() { # repo blob out
  if [ -s "$3" ]; then echo "موجود: $3"; return; fi
  gh api "repos/$1/git/blobs/$2" -H "Accept: application/vnd.github.raw" > "$3.part"
  mv "$3.part" "$3"; echo "جُلب: $3"
}
check_sha() { # file expected
  local got; got="$(sha256sum "$1" | cut -d' ' -f1)"
  [ "$got" = "$2" ] || { echo "بصمة مختلفة لـ$1: $got ≠ $2" >&2; rm -f "$1"; exit 1; }
}
SD1_BLOB="$(pin "$ROOT/content/wordlists/goethe-a1-sd1.json" gitBlob)"; SD1_SHA="$(pin "$ROOT/content/wordlists/goethe-a1-sd1.json" sha256)"
A2_BLOB="$(pin "$ROOT/content/wordlists/goethe-a2.json" gitBlob)";      A2_SHA="$(pin "$ROOT/content/wordlists/goethe-a2.json" sha256)"
# المستودعات العامة التي تحمل الـblob نفسه (مذكورة في obtainedVia) — الـblob هو الهوية؛ المستودع مجرد ناقل
fetch_blob lincw/deutsch_a1 "$SD1_BLOB" "$CACHE/sd1.pdf";                 check_sha "$CACHE/sd1.pdf" "$SD1_SHA"
fetch_blob JuanOlaya/juanolaya.github.io "$A2_BLOB" "$CACHE/a2.pdf";       check_sha "$CACHE/a2.pdf" "$A2_SHA"
IPA_BLOB="$(python3 -c "import json; print(json.load(open('$ROOT/tools/pronunciation-reference.de.json'))['source']['gitBlob'])")"
fetch_blob open-dict-data/ipa-dict "$IPA_BLOB" "$CACHE/ipa-de.txt"
python3 - "$CACHE" <<'PY'
import sys, pdfplumber
from pathlib import Path
c = Path(sys.argv[1])
for name in ("sd1", "a2"):
    out = c / f"{name}.txt"
    if out.exists() and out.stat().st_size > 0: print("موجود:", out); continue
    with pdfplumber.open(c / f"{name}.pdf") as pdf:
        text = "\n".join((p.extract_text() or "") for p in pdf.pages)
    out.write_text(text, encoding="utf-8"); print("استُخرج:", out, len(text), "حرفاً")
PY
echo "تم — .dev-cache جاهز (sd1.txt · a2.txt · ipa-de.txt)"
