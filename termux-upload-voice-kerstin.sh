#!/data/data/com.termux/files/usr/bin/bash
# termux-upload-voice-kerstin.sh — تثبيت صوت المرأة Piper (de_DE-kerstin-low) في المستودع (D98 + تصحيح D100)
# الاستخدام على جهازك في Termux (نفس أسلوب termux-upload-voice.sh تماماً — لا تكتب التوكن في أي مكان آخر):
#   PAT='github_pat_XXXX' bash termux-upload-voice-kerstin.sh
# ما يفعله: يحمّل الملفات الثلاثة من HuggingFace (أو يجدها في التنزيلات) ← يتحقق من الحجم الدقيق + md5 الرسمي
#           ← يرفعها إلى main بلا force ← ينظّف المجلد المؤقت (بما فيه التوكن).
#
# D100 — تصحيح صادق لنسخة D98: الحجم الحقيقي للملف 63,104,526 بايت (≈63MB) لا «~16.8MB».
# النسخة السابقة كانت سترفض الملف الأصلي (بوابة 15–18MB) وتتوقف. القيم أدناه من الفهرس الرسمي
# rhasspy/piper → src/python_run/piper/voices.json (الفهرس نفسه يطابق ملف thorsten الملتزم بالبايت: 63,201,294).
set -e

[ -n "$PAT" ] || { echo "❌ ضع الـ PAT داخل السطر"; exit 1; }

command -v git     >/dev/null || pkg install -y git
command -v curl    >/dev/null || pkg install -y curl
command -v md5sum  >/dev/null || pkg install -y coreutils

WORK=~/schluessel-voice-kerstin
rm -rf "$WORK"; mkdir -p "$WORK"; cd "$WORK"

BASE="https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/kerstin/low"
ONNX=de_DE-kerstin-low.onnx
JSON=de_DE-kerstin-low.onnx.json
CARD=MODEL_CARD
# القيم الرسمية (voices.json) — الحجم بالبايت + md5
ONNX_SIZE=63104526; ONNX_MD5=1d5e5788cfddb04cbb34418f2841931e
JSON_SIZE=5952;     JSON_MD5=952af66f912007b6ec6b065b94072447
CARD_SIZE=272;      CARD_MD5=69ec1bc99fc7e19c9ddcdf712920a6c7

fetch() { # $1 = اسم الملف
  if curl -L --fail -o "$1" "$BASE/$1"; then return 0; fi
  echo "── تحميل $1 فشل — أبحث في مجلد التنزيلات..."
  for d in ~/storage/downloads ~/downloads ~/Download ~; do
    [ -f "$d/$1" ] && cp "$d/$1" . && return 0
  done
  echo "❌ لم أجد $1 — نزّله من: $BASE/$1 إلى التنزيلات ثم أعد التشغيل"; exit 1
}

check() { # $1 = الملف · $2 = الحجم المتوقع · $3 = md5 المتوقع
  SIZE=$(stat -c %s "$1")
  [ "$SIZE" = "$2" ] || { echo "❌ حجم $1 = $SIZE والمتوقع بالضبط $2 — أوقفت (ملف ناقص أو مختلف)"; exit 1; }
  SUM=$(md5sum "$1" | cut -d" " -f1)
  [ "$SUM" = "$3" ] || { echo "❌ بصمة md5 لـ $1 = $SUM والمتوقع $3 — أوقفت"; exit 1; }
  echo "── $1 ✓ (الحجم $SIZE · md5 مطابق للفهرس الرسمي)"
}

echo "── 1) تحميل صوت المرأة (kerstin) — 3 ملفات (~63 ميغا)..."
fetch "$ONNX"; fetch "$JSON"; fetch "$CARD"
check "$ONNX" "$ONNX_SIZE" "$ONNX_MD5"
check "$JSON" "$JSON_SIZE" "$JSON_MD5"
check "$CARD" "$CARD_SIZE" "$CARD_MD5"
SHA=$(sha256sum "$ONNX" | cut -d" " -f1)
echo "── sha256 (يُثبَّت كهوية صوت المرأة الدائمة عند الدمج — D28): $SHA"
echo "── بطاقة النموذج (الترخيص من المصدر نفسه):"; cat "$CARD"

echo "── 2) إضافة الملفات إلى المستودع..."
git init -q
git config user.name  "naderba69"
git config user.email "naderba69@users.noreply.github.com"
git remote add origin "https://naderba69:$PAT@github.com/naderba69/schluessel.git"
git fetch -q --depth 1 origin main
git checkout -q -B main FETCH_HEAD
mkdir -p tools/piper-voices
cp "$ONNX" "$JSON" tools/piper-voices/
cp "$CARD" tools/piper-voices/de_DE-kerstin-low.MODEL_CARD
git add -f tools/piper-voices/
git commit -qm "Schlüssel — تثبيت صوت المرأة Piper de_DE-kerstin-low في المستودع (D98/D100 — sha256 $SHA)"
git push -q origin HEAD:main

echo "── ✓ رُفع صوت المرأة إلى main — sha256: $SHA"
echo "── أخبر الفريق ليُدمجه في فرع العمل — gen-audio يوجّه الإناث إليه تلقائياً (D100)."
cd ~ && rm -rf "$WORK" && echo "── نُظّف المجلد المؤقت (بما فيه التوكن)"
