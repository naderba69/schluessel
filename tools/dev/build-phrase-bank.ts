// tools/dev/build-phrase-bank.ts — بنك Redemittel مُحصَد مسبقاً (N-050 · D242).
// الحصاد كان يجري في المتصفح من كل الدروس والكلمات (15MB) — الآن يُحصد هنا ويُحمَّل ملفه وحده عند الحصة.
// المصدر الوحيد: content/lessons + content/words — والاختبار يثبّت التزامن.
// الاستعمال: npx tsx tools/dev/build-phrase-bank.ts --write | --check
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLessons, loadWords } from "../lib/content-disk.js";
import { harvestPhrases } from "../../src/lib/phrase-bank.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "content", "manifests", "phrase-bank.json");

export function buildBank(): string {
  const lessons = loadLessons(join(ROOT, "content"));
  const words = loadWords(join(ROOT, "content"));
  return `${JSON.stringify(harvestPhrases(lessons, words), null, 2)}\n`;
}

const want = buildBank();
if (process.argv.includes("--write")) {
  writeFileSync(OUT, want);
  console.log(`phrase-bank: كُتب content/manifests/phrase-bank.json (${JSON.parse(want).length} عبارة)`);
} else if (process.argv.includes("--check")) {
  let cur = "";
  try {
    cur = readFileSync(OUT, "utf8");
  } catch {
    console.log("phrase-bank: الملف غائب — شغّل --write");
    process.exit(1);
  }
  if (cur !== want) {
    console.log("phrase-bank: الملف غير محدَّث — شغّل --write");
    process.exit(1);
  }
  console.log(`phrase-bank: محدَّث (${JSON.parse(want).length} عبارة)`);
} else {
  console.log("الاستعمال: npx tsx tools/dev/build-phrase-bank.ts --write | --check");
  process.exit(2);
}
