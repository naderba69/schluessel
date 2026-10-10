PAT='github_pat_XXXX' bash -c '

set -e

[ -n "$PAT" ] || { echo "❌ ضع الـ PAT داخل السطر"; exit 1; }

command -v unzip >/dev/null || pkg install -y unzip
command -v git   >/dev/null || pkg install -y git
command -v curl  >/dev/null || pkg install -y curl

ZIP=""
for d in ~/storage/downloads ~/downloads ~/Download ~/; do
  [ -f "$d/schluessel-full.zip" ] && ZIP="$d/schluessel-full.zip" && break
done
[ -n "$ZIP" ] || { echo "❌ نزّل schluessel-full.zip إلى Downloads أولاً"; exit 1; }
echo "── الأرشيف: $ZIP"

SUM=$(sha256sum "$ZIP" | cut -d" " -f1)
if [ -f "$ZIP.sha256" ]; then
  EXP=$(cut -d" " -f1 < "$ZIP.sha256")
  [ "$SUM" = "$EXP" ] || { echo "❌ الأرشيف لا يطابق $ZIP.sha256"; echo "   المتوقع: $EXP"; echo "   الفعلي : $SUM"; exit 1; }
  echo "── البصمة مطابقة للملف المرافق ✓"
else
  echo "── تحذير: لا يوجد ملف بصمة مرافق — البصمة الفعلية: $SUM"
fi

rm -rf ~/schluessel
mkdir -p ~/schluessel
unzip -q "$ZIP" -d ~/schluessel
cd ~/schluessel

[ -f package.json ] && [ -f src/App.tsx ] || { echo "❌ الأرشيف ملفوف داخل مجلد — لا ترفعه"; exit 1; }
[ "$(ls src/lib/*engine*.ts 2>/dev/null | wc -l)" -ge 3 ] || { echo "❌ المحركات مفقودة — لا ترفع قوقعة فارغة"; exit 1; }
[ "$(ls tests/*.test.ts tests/*.test.tsx 2>/dev/null | wc -l)" -ge 13 ] || { echo "❌ الاختبارات مفقودة — لا ترفع"; exit 1; }
[ -f docs/PROFESSIONAL_CONTINUATION_PROMPT_AR.md ] || { echo "❌ برومت الاستمرارية مفقود — لا ترفع"; exit 1; }
echo "── مسطّح ✓ · $(ls src/lib/*.ts | wc -l) محرك/مكتبة · $(ls tests/*.test.* | wc -l) اختبار · $(ls docs/plans/*.md | wc -l) خطة"

git init -q -b main
git config user.name  "naderba69"
git config user.email "naderba69@users.noreply.github.com"
git add -A
git commit -qm "Schlüssel — D35: الاسم النهائي · المعلم 0 مغلق (64) + دفعة M1-أ (76/76 أخضر) · المحركات E01/E02/E06 · DECISIONS D1–D35 · خطة v1.3 + 270 فكرة + 29 محركاً + برومت الاستمرارية v1.2"
git push -f "https://naderba69:$PAT@github.com/naderba69/schluessel.git" main:main

echo "── ✓ رُفع إلى main بجذر مسطّح — Vercel: framework=vite · build=npm run build · output=dist (vercel.json مرفق)"

'
