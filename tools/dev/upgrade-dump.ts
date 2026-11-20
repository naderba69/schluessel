// أداة مؤقتة (D564): فرز نتائج inspectLesson لكل الدروس إلى JSON — لبناء خطة A2 وترقية B1/B2
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { loadAudioTracks, loadGrammarRules, loadLessons, loadUpgradePlans, loadWords } from "../lib/content-disk.js";
import { inspectLesson, type UpgradeContext } from "../lib/lesson-upgrade.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const content = join(root, "content");
const ctx: UpgradeContext = {
  lessons: loadLessons(content), words: loadWords(content), rules: loadGrammarRules(content), tracks: loadAudioTracks(content),
};
const plans = loadUpgradePlans(content);
const entryBy = new Map<string, { properNouns: string[]; misspellings?: { wrong: string; right: string }[] }>();
for (const p of plans) for (const e of p.lessons) entryBy.set(e.lessonId, e as never);

const out: Record<string, unknown> = {};
for (const l of ctx.lessons) {
  const entry = entryBy.get(l.id) ?? { properNouns: [] };
  const r = inspectLesson(l, entry, ctx);
  out[l.id] = {
    level: l.level, unit: l.unit, day: l.day, kind: l.kind,
    rule: r.rule.map((i) => i.code), practice: r.practice.map((i) => i.code), quiz: r.quiz.map((i) => i.code),
    coverage: r.coverage.map((i) => i.code), meta: r.meta.map((i) => i.code), borrowed: r.borrowed.map((i) => i.code),
    misspellings: r.misspellings.map((i) => i.code),
    practiceItems: r.practiceItems, practiceTypes: r.practiceTypes, quizMin: r.quizMin,
    messages: [...r.rule, ...r.practice, ...r.quiz, ...r.coverage, ...r.meta].map((i) => i.message),
    wordIds: l.praesentation.wordIds,
  };
}
writeFileSync(join(root, ".dev-cache", "upgrade-dump.json"), JSON.stringify(out, null, 1));
console.log(`dumped ${Object.keys(out).length} lessons`);
