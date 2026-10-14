// tools/phrase-harvester.ts — حاصد العبارات (D107): تقرير بنك Redemittel من المحتوى
// التشغيل: npx tsx tools/phrase-harvester.ts [--json out.json]
// يطبع: حجم البنك ومصادره · تغطية الوظائف التواصلية (نهاية A1 والآن) مع فجوات بنك النجاة ·
// تقدير قفل المفردات (i+1): كلمات في العبارات لم تُدرَّس حتى درس ظهورها — تقدير معلن بحدوده (تصريف بسيط).
import { writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Word } from "../content/schemas/index.js";
import {
  harvestPhrases, functionCoverage, PHRASE_FUNCTIONS, FUNCTION_LABELS_AR, SURVIVAL_FUNCTIONS, type Phrase,
} from "../src/lib/phrase-bank.js";
import { loadLessons, loadWords } from "./lib/content-disk.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** الكلمات الوظيفية المغلقة (أدوات/ضمائر/مساعدة/جر/ربط/أعداد) — تُعرف دون درس */
const CLOSED = new Set(`der die das den dem des ein eine einen einem einer eines kein keine keinen keinem keiner
ich du er sie es wir ihr mich dich ihn uns euch mir dir ihm ihnen sich man mein meine meinen meinem meiner dein deine deinen deinem
sein seine seinen seinem ihre ihren ihrem unser unsere euer eure bin bist ist sind seid war waren habe hast hat haben habt hatte
werde wirst wird werden kann kannst können könnt muss musst müssen will willst wollen möchte möchtest möchten darf darfst dürfen
soll sollst sollen in im ins an am ans auf aus bei mit nach von vom zu zum zur für um ohne gegen durch bis seit über unter vor
hinter neben zwischen beim und oder aber denn sondern weil dass wenn als ob nicht auch noch schon nur sehr ja nein doch mal so wie was
wer wo wann warum welche welcher welches eins zwei drei vier fünf sechs sieben acht neun zehn elf zwölf zwanzig hundert es gibt`.split(/\s+/));
const NAMES = new Set(["yusuf", "lena", "ayse", "thomas", "mueller", "müller", "berg", "schmidt", "weber", "berlin", "hamburg", "münchen", "frau", "herr"]);

const deumlaut = (s: string) => s.replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u");

/** الصيغ المعروفة من كلمة مدروسة: الجذع + صيغ الفعل + الجمع — مع جذوع تصريف بسيطة */
function knownForms(w: Word): string[] {
  const base = w.de.replace(/^(der|die|das) /, "").replace(/^sich /, "").toLowerCase();
  const parts = [base, w.plural?.replace(/^die /, ""), w.forms?.praesens3s, w.forms?.perfekt, w.forms?.praeteritum, w.forms?.imperative]
    .filter((x): x is string => !!x).flatMap((x) => x.toLowerCase().split(/[\s/!.,]+/)).filter(Boolean);
  return parts;
}

function stem(t: string): string[] {
  const out = [t];
  for (const suf of ["en", "st", "et", "te", "ten", "e", "t", "n", "s", "er", "es"]) if (t.length > suf.length + 2 && t.endsWith(suf)) out.push(t.slice(0, -suf.length));
  return out;
}

export function vocabularyReport(phrases: Phrase[], lessonOrder: string[], words: Word[]) {
  const learnedAt = new Map<string, number>(); // form → أول درس يُعرف فيه
  for (const w of words) {
    const idx = Math.min(...w.usedInLessons.map((l) => lessonOrder.indexOf(l)).filter((i) => i >= 0));
    if (!Number.isFinite(idx)) continue;
    for (const f of knownForms(w)) for (const s of stem(deumlaut(f))) if (!learnedAt.has(s) || learnedAt.get(s)! > idx) learnedAt.set(s, idx);
  }
  const unknown = new Map<string, number>();
  let clean = 0;
  for (const p of phrases) {
    const at = lessonOrder.indexOf(p.firstLesson);
    const miss = p.de.toLowerCase().replace(/'s\b/g, "").replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter(Boolean)
      .filter((t) => !CLOSED.has(t) && !NAMES.has(t))
      .filter((t) => !stem(deumlaut(t)).some((s) => (learnedAt.get(s) ?? Infinity) <= at));
    if (miss.length === 0) clean++;
    for (const t of miss) unknown.set(t, (unknown.get(t) ?? 0) + 1);
  }
  return { clean, total: phrases.length, topUnknown: [...unknown.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const content = join(ROOT, "content");
  const lessons = loadLessons(content);
  const words = loadWords(content);
  const order = lessons.map((l) => l.id);
  const bank = harvestPhrases(lessons, words);
  const bySource: Record<string, number> = {};
  for (const p of bank) for (const s of p.sources) bySource[s] = (bySource[s] ?? 0) + 1;
  console.log(`عبارات: ${bank.length} (من ${lessons.length} درساً) | المصادر: ${Object.entries(bySource).map(([k, v]) => `${k}:${v}`).join(" ")}`);
  const lastA1 = [...lessons].reverse().find((l) => l.level === "A1")!.id;
  for (const [label, upTo] of [["نهاية A1", lastA1], ["الآن", order.at(-1)!]] as const) {
    const cov = functionCoverage(bank, order, upTo);
    console.log(`\nتغطية الوظائف — ${label} (${upTo}):`);
    console.log("  " + PHRASE_FUNCTIONS.map((f) => `${FUNCTION_LABELS_AR[f]}: ${cov[f]}`).join(" · "));
    const gaps = SURVIVAL_FUNCTIONS.filter((f) => cov[f] < 3);
    if (gaps.length) console.log(`  ⚠ بنك النجاة (§6) ضعيف/غائب: ${gaps.map((f) => `${FUNCTION_LABELS_AR[f]} (${cov[f]})`).join("، ")}`);
  }
  const v = vocabularyReport(bank, order, words);
  console.log(`\nقفل المفردات (تقدير — تصريف بسيط): ${v.clean}/${v.total} عبارة كل كلماتها مدروسة حتى درس ظهورها (${Math.round((100 * v.clean) / v.total)}%)`);
  console.log(`  أكثر الكلمات غير المدروسة: ${v.topUnknown.map(([t, n]) => `${t}×${n}`).join(" · ")}`);
  const jsonAt = process.argv.indexOf("--json");
  if (jsonAt > 0) {
    writeFileSync(resolve(process.argv[jsonAt + 1]!), JSON.stringify(bank, null, 2) + "\n", "utf8");
    console.log(`\n✓ البنك كُتب: ${process.argv[jsonAt + 1]}`);
  }
}
