#!/data/data/com.termux/files/usr/bin/bash
# termux-upload-voice-kerstin.sh — تثبيت صوت المرأة Piper (de_DE-kerstin-low) في المستودع (D98 — الترخيص MIT)
# الاستخدام على جهازك في Termux (نفس أسلوب termux-upload-voice.sh تماماً — لا تكتب التوكن في أي مكان آخر):
#   PAT='github_pat_XXXX' bash termux-upload-voice-kerstin.sh
# ما يفعله: يحمّل الملف من HuggingFace (أو يجده في التنزيلات) ← يتحقق من الحجم والبصمة ← يرفعه إلى main بلا force ← ينظّف المجلد المؤقت.
# بعد الرفع: يعمل صوت المرأة فوراً في المشروع — بلا أي كود إضافي (البنية جاهزة منذ D98).
set -e

[ -n "$PAT" ] || { echo "❌ ضع الـ PAT داخل السطر"; exit 1; }

command -v git  >/dev/null || pkg install -y git
command -v curl >/dev/null || pkg install -y curl

WORK=~/schluessel-voice-kerstin
rm -rf "$WORK"; mkdir -p "$WORK"; cd "$WORK"

ONNX=de_DE-kerstin-low.onnx
JSON=de_DE-kerstin-low.onnx.json
BASE="https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/kerstin/low"

echo "── 1) تحميل صوت المرأة (kerstin)..."
if curl -L --fail -o "$ONNX" "$BASE/$ONNX"; then
  curl -L --fail -o "$JSON" "$BASE/$JSON" || echo "   (لا يوجد ملف مرفق — يكفي الموجود في المستودع)"
else
  echo "── التحميل فشل — أبحث في مجلد التنزيلات..."
  for d in ~/storage/downloads ~/downloads ~/Download ~/; do
    [ -f "$d/$ONNX" ] && cp "$d/$ONNX" . && { [ -f "$d/$JSON" ] && cp "$d/$JSON" .; true; } && break
  done
  [ -f "$ONNX" ] || { echo "❌ لم أجد الملف — نزّله من HuggingFace إلى التنزيلات ثم أعد التشغيل"; exit 1; }
fi

SIZE=$(stat -c %s "$ONNX")
[ "$SIZE" -ge 15000000 ] && [ "$SIZE" -le 18000000 ] || { echo "❌ الحجم $SIZE غير متوقع (المتوقع ~16.8 ميغا) — أوقفت"; exit 1; }
SUM=$(sha256sum "$ONNX" | cut -d" " -f1)
echo "── البصمة: $SUM"
[ "$SUM" = "847543129bf7babb9f238f9a6803765e110d477c2190ca24398a18b21c86f734" ] && echo "── بصمة معروفة ✓" || echo "── بصمة جديدة — ستُثبَّت كهوية صوت المرأة الدائمة"

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
git commit -qm "Schlüssel — تثبيت صوت المرأة Piper de_DE-kerstin-low في المستودع (D98 — الترخيص MIT)"
git push -q origin HEAD:main

echo "── ✓ رُفع صوت المرأة إلى main — البصمة المثبّتة: $SUM"
echo "── أخبر الفريق ليُدمجه في فرع العمل فوراً — ثم يعمل الصوت."
cd ~ && rm -rf "$WORK" && echo "── نُظّف المجلد المؤقت (بما فيه التوكن)"
