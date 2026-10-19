// scratch N-023 v3 (مؤقت): أنسب وحدة لكل نص (أول وحدة تغطي كل رموزه المحتوية)
import { join } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { loadWords, loadLessons } from "../lib/content-disk.js";
import { knownStems, contentTokens } from "../lib/vocab-forms.js";
import { taughtUpTo, frontViolations } from "../lib/lesson-upgrade.js";
const C = join(process.cwd(), "content");
const words = loadWords(C);
const lessons = loadLessons(C).filter((x) => x.level === "A1");
const lastOf = (u: number) => lessons.filter((l) => l.unit === u).sort((a, b) => a.day - b.day).at(-1)!;
const UNIT_WORDS = new Map<number, Set<string>>();
for (let u = 1; u <= 12; u++) UNIT_WORDS.set(u, knownStems(taughtUpTo(lastOf(u), lessons, words)));
for (const dir of ["content/lese", "content/landeskunde"]) {
  for (const f of readdirSync(join(process.cwd(), dir)).filter((x) => x.endsWith(".json")).sort()) {
    const d = JSON.parse(readFileSync(join(process.cwd(), dir, f), "utf8"));
    const texts: string[] = [d.title.de];
    if (d.facts) texts.push(...d.facts.map((x: { de: string }) => x.de));
    if (d.text) texts.push(d.text.de);
    if (d.questions) texts.push(...d.questions.flatMap((q: { q: string; a: string }) => [q.q, q.a]));
    const allow = new Set<string>();
    for (const g of d.glossary ?? []) for (const t of contentTokens(g.de)) allow.add(t);
    let fit = -1; let fitV: string[] = [];
    for (let u = 1; u <= 12; u++) {
      const v = frontViolations(texts, UNIT_WORDS.get(u)!, allow);
      if (fit === -1) { fit = u; fitV = v; }
      if (v.length === 0) { fit = u; fitV = []; break; }
      if (v.length < fitV.length) { fit = u; fitV = v; }
    }
    console.log(`${f} (وحدة ${d.unit}) → أنسب: u${fit} [بواقي: ${fitV.length}${fitV.length ? ": " + fitV.slice(0, 8).join("،") : ""}]`);
  }
}
