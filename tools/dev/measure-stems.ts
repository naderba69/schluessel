// tools/dev/measure-stems.ts — الفحص الصارم لجذوع الجبهة (N-060 · D226)
// كل رمز في الدروس المُرقّاة يُقبل بجذع لا بصيغة مسجلة: ممن؟ (قطعة؟ مركّب؟ تصريف؟) وهل يمسكه laterWordLeak؟
// الاستعمال: npx tsx tools/dev/measure-stems.ts
import { readdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLessons, loadWords } from "../lib/content-disk.js";
import { taughtUpTo, lessonGermanStrings } from "../lib/lesson-upgrade.js";
import { knownStems, knownForms, contentTokens, deumlaut, stemKnown, laterWordLeak, withLaterForms, stripMorphemeNotation, stripGraphemeNotation, CLOSED } from "../lib/vocab-forms.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONTENT = resolve(ROOT, "content");
const words = loadWords(CONTENT);
const lessons = loadLessons(CONTENT);
const plan = (JSON.parse(readFileSync(resolve(CONTENT, "upgrades/a1-lesson-upgrade.json"), "utf8")) as { lessons: { lessonId: string; rule: string; properNouns?: string[] }[] }).lessons;
const doneIds = new Set(plan.filter((e) => e.rule === "done").map((e) => e.lessonId));
const wStems = new Map(words.map((w) => [w.id, knownStems([w])]));
const formOwner = new Map<string, string>();
for (const w of words) for (const f of knownForms(w)) { const d = deumlaut(f); if (!formOwner.has(d)) formOwner.set(d, w.id); }
type Agg = { lessons: Set<string>; via: Set<string>; chunk: Set<string>; substr: Set<string>; laterOf: string; leak: boolean; ex: string };
const agg = new Map<string, Agg>();
for (const l of lessons.filter((x) => doneIds.has(x.id))) {
  const e = plan.find((x) => x.lessonId === l.id);
  const allow = new Set((e?.properNouns ?? []).flatMap((n) => contentTokens(n)));
  const taught = taughtUpTo(l, lessons, words);
  const taughtIds = new Set(taught.map((w) => w.id));
  const horizon = knownStems(taught);
  const later = withLaterForms(horizon, taught, words);
  const direct = new Set([...taught.flatMap((w) => knownForms(w).map(deumlaut)), ...CLOSED, ...allow]);
  const lines = lessonGermanStrings(l);
  const dir = resolve(CONTENT, "audio-scripts");
  for (const f of readdirSync(dir)) {
    if (!f.startsWith(`${l.id}-`) || !f.endsWith(".json")) continue;
    const s = JSON.parse(readFileSync(resolve(dir, f), "utf8")) as { lines?: { textDe?: string; text?: string }[] };
    for (const ln of s.lines ?? []) { const t = ln.textDe ?? ln.text; if (t) lines.push(t); }
  }
  for (const line of lines) {
    const de = stripGraphemeNotation(stripMorphemeNotation(line.replace(/~~/g, " ")));
    for (const t of contentTokens(de)) {
      const d = deumlaut(t);
      if (direct.has(d) || !stemKnown(d, horizon)) continue;
      let a = agg.get(d);
      if (!a) { a = { lessons: new Set(), via: new Set(), chunk: new Set(), substr: new Set(), laterOf: "", leak: false, ex: "" }; agg.set(d, a); }
      a.lessons.add(l.id);
      if (!a.ex) a.ex = `${l.id}: ${line.slice(0, 80)}`;
      if (a.via.size >= 8) continue;
      for (const w of taught) {
        if (!stemKnown(d, wStems.get(w.id)!)) continue;
        a.via.add(w.id);
        if (w.chunk) a.chunk.add(w.id);
        const base = deumlaut(String(w.de)).replace(/^(der|die|das) /, "");
        if (base.includes(d) && base !== d) a.substr.add(w.id);
        if (a.via.size >= 8) break;
      }
      const owner = formOwner.get(d);
      if (owner && !taughtIds.has(owner)) { a.laterOf = owner; if (laterWordLeak(d, later)) a.leak = true; }
    }
  }
}
console.log(`upgraded: ${doneIds.size} · indirect tokens: ${agg.size}`);
for (const [d, a] of [...agg.entries()].sort((x, y) => y[1].lessons.size - x[1].lessons.size)) {
  const tag = a.chunk.size ? "CHUNK" : a.substr.size ? "SUBSTR" : "INFLECT";
  const hole = !a.laterOf ? "NO-OWNER" : a.leak ? "leak-caught" : "SILENT";
  console.log(`${tag} ${hole} n=${a.lessons.size} tok=${d} via=[${[...a.via].slice(0, 5).join("|")}] laterOf=${a.laterOf || "-"} :: ${a.ex.slice(0, 70)}`);
}
