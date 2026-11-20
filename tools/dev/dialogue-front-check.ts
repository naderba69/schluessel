// أداة D566: فحص قانون الجبهة على نصوص الحوارات الجديدة قبل توليدها (e-dialogue-front بلا محطة)
// npx tsx tools/dev/dialogue-front-check.ts <script.json>...
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadAudioTracks, loadGrammarRules, loadLessons, loadWords } from "../lib/content-disk.js";
import { frontViolations, pathOrder, taughtUpTo, type UpgradeContext } from "../lib/lesson-upgrade.js";
import { knownStems } from "../lib/vocab-forms.js";
import { AudioScript } from "../../content/schemas/index.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const content = join(ROOT, "content");
const ctx: UpgradeContext = {
  lessons: loadLessons(content), words: loadWords(content), rules: loadGrammarRules(content), tracks: loadAudioTracks(content),
};
let bad = 0;
const proper = ["berlin", "deutschland", "koeln", "muenchen", "hamburg", "bayern", "bremen", "dortmund", "hannover", "ruhrgebiet", "frankfurt", "bonn", "ruhrpott", "harz", "ostsee", "nordsee", "alpen", "wien", "zuerich", "spreewald", "mecklenburg", "vorruhestand", "betriebsrat", "arbeitszeugnis", "schweiz", "franken", "köln", "münchen", "zürich", "yusuf", "lena", "ayse", "thomas", "mueller", "berg", "schmidt", "weber"];
const allow = new Set([...proper, ...proper.map((x) => x.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue"))]);
for (const f of process.argv.slice(2)) {
  const sc = AudioScript.parse(JSON.parse(readFileSync(f, "utf8")));
  const lesson = ctx.lessons.find((l) => sc.usedIn.includes(l.id));
  if (!lesson) { console.error(`${f}: usedIn بلا درس`); bad++; continue; }
  const stems = knownStems(taughtUpTo(lesson, ctx.lessons, ctx.words));
  for (const ln of sc.lines) {
    const u = frontViolations([ln.text], stems, allow);
    if (u.length) { console.log(`${sc.id} · ${ln.id} · «${ln.text}» ← ${u.join("، ")}`); bad++; }
  }
}
console.log(bad === 0 ? "CLEAN" : `مخالفات: ${bad}`);
process.exit(bad === 0 ? 0 : 1);
