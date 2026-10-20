#!/data/data/com.termux/files/usr/bin/bash
# termux-upload-voice.sh — تثبيت صوت Piper (de_DE-thorsten-medium) في المستودع بقرار المالك (D28 — الهوية المثبّتة CC0)
# الاستخدام على جهازك في Termux (نفس أسلوب termux-push-github.sh — لا تكتب التوكن في أي مكان آخر):
#   PAT='github_pat_XXXX' bash termux-upload-voice.sh
# ما يفعله: يحمّل الملف من HuggingFace (أو يجده في التنزيلات) ← يتحقق من الحجم والبصمة ← يرفعه إلى main بلا force ← ينظّف المجلد المؤقت.
set -e

[ -n "$PAT" ] || { echo "❌ ضع الـ PAT داخل السطر"; exit 1; }

command -v git  >/dev/null || pkg install -y git
command -v curl >/dev/null || pkg install -y curl

WORK=~/schluessel-voice
rm -rf "$WORK"; mkdir -p "$WORK"; cd "$WORK"

ONNX=de_DE-thorsten-medium.onnx
JSON=de_DE-thorsten-medium.onnx.json
BASE="https://huggingface.co/Thorsten-Voice/Piper/resolve/main"

echo "── 1) تحميل الصوت..."
if curl -L --fail -o "$ONNX" "$BASE/$ONNX"; then
  curl -L --fail -o "$JSON" "$BASE/$JSON" || echo "   (لا يوجد ملف مرفق على HF — يكفي الموجود في المستودع)"
else
  echo "── التحميل فشل — أبحث في مجلد التنزيلات..."
  for d in ~/storage/downloads ~/downloads ~/Download ~/; do
    [ -f "$d/$ONNX" ] && cp "$d/$ONNX" . && { [ -f "$d/$JSON" ] && cp "$d/$JSON" .; true; } && break
  done
  [ -f "$ONNX" ] || { echo "❌ لم أجد الملف — نزّله من HuggingFace إلى التنزيلات ثم أعد التشغيل"; exit 1; }
fi

SIZE=$(stat -c %s "$ONNX")
[ "$SIZE" -ge 55000000 ] && [ "$SIZE" -le 75000000 ] || { echo "❌ الحجم $SIZE غير متوقع (المتوقع ~63 ميغا) — أوقفت"; exit 1; }
SUM=$(sha256sum "$ONNX" | cut -d" " -f1)
echo "── البصمة: $SUM"
[ "$SUM" = "7e64762d8e5118bb578f2eea6207e1a35a8e0c30595010b666f983fc87bb7819" ] && echo "── بصمة معروفة ✓" || echo "── بصمة جديدة — ستُثبَّت كهوية الصوت الدائمة"

echo "── 2) إضافة الملف إلى المستودع..."
git init -q
git config user.name  "naderba69"
git config user.email "naderba69@users.noreply.github.com"
git remote add origin "https://naderba69:$PAT@github.com/naderba69/schluessel.git"
git fetch -q --depth 1 origin main
git checkout -q -B main FETCH_HEAD
mkdir -p tools/piper-voices
cp "$ONNX" tools/piper-voices/
[ -f "$JSON" ] && cp "$JSON" tools/piper-voices/ || true
git add -f tools/piper-voices/
git commit -qm "Schlüssel — تثبيت صوت Piper de_DE-thorsten-medium في المستودع (D28 — الهوية المثبّتة CC0)"
git push -q origin HEAD:main

echo "── ✓ رُفع الصوت إلى main — البصمة المثبّتة: $SUM"
cd ~ && rm -rf "$WORK" && echo "── نُظّف المجلد المؤقت (بما فيه التوكن)"
