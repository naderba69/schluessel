// tools/dev/culture-audit.ts — D568: تدقيق بطاقات الثقافة (Landeskunde)
// قواعد N-023 (D224): (1) الحقائق تحت قانون الجبهة — أفقها آخر درس في وحدة البطاقة
// (2) المسرد حيّ (لا بند ميت: كل كلماته معلومة عند الأفق) (3) كل علم مُعلن مستعمل في النصوص.
// Usage: npx tsx tools/dev/culture-audit.ts [cardId...]
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLessons, loadWords } from "../lib/content-disk.js";
import { taughtUpTo, frontViolations } from "../lib/lesson-upgrade.js";
import { CLOSED, contentTokens, knownForms, knownStems } from "../lib/vocab-forms.js";
import { CultureCard } from "../../content/schemas/index.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const content = join(root, "content");
const lessons = loadLessons(content);
const words = loadWords(content);
const INTERJECTIONS = new Set(["ah"]);

const lastOfUnit = (level: string, unit: number) =>
  lessons.filter((l) => l.level === level && l.unit === unit).sort((a, b) => a.day - b.day).at(-1)!;

function auditLK(file: string) {
  const d = CultureCard.parse(JSON.parse(readFileSync(file, "utf8")));
  const horizon = lastOfUnit(d.level, d.unit);
  const taught = taughtUpTo(horizon, lessons, words);
  const stems = new Set([
    ...knownStems(taught),
    ...d.glossary.flatMap((g) => [...knownStems([{ de: g.de, wordClass: "noun" } as never])]),
  ]);
  const allow = new Set([...(d.properNouns ?? []).flatMap((n) => contentTokens(n)), ...INTERJECTIONS]);
  const texts = [d.title.de, ...d.facts.map((f) => f.de)];
  const bad = frontViolations(texts, stems, allow);
  const horizonForms = new Set([...taught.flatMap((w) => knownForms(w as never)), ...CLOSED]);
  const dead = d.glossary.filter((g) => contentTokens(g.de).every((t) => horizonForms.has(t))).map((g) => g.de);
  const seen = new Set(contentTokens(texts.join("\n")));
  const unusedPropers = (d.properNouns ?? []).filter((n) => !contentTokens(n).every((t) => seen.has(t)));
  return { id: d.id, horizon: horizon.id, bad, dead, unusedPropers };
}

const files = readdirSync(join(content, "landeskunde"))
  .filter((f) => f.endsWith(".json"))
  .filter((f) => process.argv.slice(2).length === 0 || process.argv.slice(2).some((a) => f.startsWith(a)))
  .sort();
// npx tsx tools/dev/culture-audit.ts --probe <cardId> <كلمة>... — هل المرشح حيّ عند أفق البطاقة؟
if (process.argv[2] === "--probe") {
  const cardFile = readdirSync(join(content, "landeskunde")).find((f) => f.startsWith(process.argv[3]!))!;
  const d = CultureCard.parse(JSON.parse(readFileSync(join(content, "landeskunde", cardFile), "utf8")));
  const taught = taughtUpTo(lastOfUnit(d.level, d.unit), lessons, words);
  const horizonForms = new Set([...taught.flatMap((w) => knownForms(w as never)), ...CLOSED]);
  for (const cand of process.argv.slice(4)) {
    const alive = !contentTokens(cand).every((t) => horizonForms.has(t));
    console.log(`${alive ? "ALIVE" : "DEAD "} ${cand}`);
  }
  process.exit(0);
}
let dirty = 0;
for (const f of files) {
  const r = auditLK(join(content, "landeskunde", f));
  const ok = r.bad.length === 0 && r.dead.length === 0 && r.unusedPropers.length === 0;
  if (!ok) dirty++;
  console.log(
    `${ok ? "CLEAN" : "DIRTY"} ${r.id} (أفق ${r.horizon})` +
      (r.bad.length ? ` · جبهة: ${r.bad.join("، ")}` : "") +
      (r.dead.length ? ` · مسرد ميت: ${r.dead.join("، ")}` : "") +
      (r.unusedPropers.length ? ` · علم غير مستعمل: ${r.unusedPropers.join("، ")}` : ""),
  );
}
console.log(`---\n${files.length} بطاقة · ${dirty} DIRTY`);
process.exit(dirty > 0 ? 1 : 0);
