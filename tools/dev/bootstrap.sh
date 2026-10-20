#!/usr/bin/env bash
# tools/dev/bootstrap.sh — تهيئة صندوق جديد بأمر واحد (D197 · N-104)
# الصندوق يُعاد ضبطه بين الجلسات (node_modules · pip · /tmp · hooksPath · وأحياناً HEAD قديم) — كل جلسة كانت تكتشف ذلك
# بعد أول أمر فاشل. هنا كل الخطوات مرة واحدة، وما يفشل يُطبع صراحةً.
set -u
cd "$(dirname "$0")/../.."
ok() { printf '  ✓ %s\n' "$1"; }
bad() { printf '  ✗ %s\n' "$1"; FAIL=1; }
FAIL=0
BR=$(git rev-parse --abbrev-ref HEAD)
echo "bootstrap — الفرع: $BR"
git fetch -q origin && ok "git fetch" || bad "git fetch"
if git rev-parse --verify -q "origin/$BR" >/dev/null; then
  L=$(git rev-parse HEAD); R=$(git rev-parse "origin/$BR")
  if [ "$L" = "$R" ]; then ok "HEAD = origin/$BR ($(git log --oneline -1 | cut -c1-60))"
  else
    if [ -n "$(git status --porcelain)" ]; then bad "HEAD ≠ origin/$BR والشجرة غير نظيفة — لا إعادة ضبط آلية (احفظ عملك أو git stash ثم أعد التشغيل)"
    elif git merge-base --is-ancestor "$L" "$R"; then
      git -c advice.detachedHead=false reset -q --hard "origin/$BR" && git clean -fdq && ok "HEAD كان قديماً والشجرة نظيفة — أُعيد إلى origin/$BR ($(git log --oneline -1 | cut -c1-60))"
    else bad "HEAD يختلف عن origin/$BR ولا ينحدر منه — افحص يدوياً (git log HEAD..origin/$BR · origin/$BR..HEAD)"; fi
  fi
else bad "لا فرع origin/$BR"; fi
[ -d node_modules ] && [ -x node_modules/.bin/tsx ] && ok "node_modules" || { npm install --silent >/dev/null 2>&1 && ok "npm install" || bad "npm install"; }
pip3 install -q --break-system-packages -r tools/requirements.txt pdfplumber >/dev/null 2>&1 && ok "pip (tools/requirements.txt + pdfplumber)" || bad "pip install"
[ "$(git config core.hooksPath)" = "tools/dev/hooks" ] && ok "hooksPath" || { git config core.hooksPath tools/dev/hooks && ok "hooks:install"; }
command -v piper >/dev/null && ok "piper $(command -v piper)" || bad "piper غائب — الصوت لا يُولَّد"
python3 -c "import piper" 2>/dev/null && ok "python: piper" || bad "python: piper غائب"
[ -s .dev-cache/sd1.txt ] && [ -s .dev-cache/a2.txt ] && [ -s .dev-cache/ipa-de.txt ] && ok ".dev-cache جاهز" || { bash tools/dev/fetch-official.sh >/dev/null 2>&1 && ok "fetch-official" || bad "fetch-official (الفحص الرسمي في check-lesson سيُعلن أنه لم يُفحص)"; }
echo "bootstrap: $([ $FAIL = 0 ] && echo 'جاهز' || echo 'ناقص — انظر ✗')"
exit $FAIL
