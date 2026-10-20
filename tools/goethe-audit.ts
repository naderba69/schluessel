// tools/goethe-audit.ts — تدقيق goetheList مقابل قوائم Goethe الرسمية (D110)
// التشغيل:
//   npx tsx tools/goethe-audit.ts                 ملخص: ما يتغير لكل كلمة + تغطية كل قائمة
//   npx tsx tools/goethe-audit.ts --apply         يكتب goetheList المشتقة (الحقل وحده — لا شيء آخر)
//   npx tsx tools/goethe-audit.ts --uncovered goethe-a1-sd1   الكلمات الرسمية التي لم يعلّمها المنهج بعد
//   npx tsx tools/goethe-audit.ts --word <id>     دليل كلمة واحدة
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Word, type Word as WordT, type OfficialWordlist, type WordlistEntry } from "../content/schemas/index.js";
import { loadWordlists } from "./lib/content-disk.js";
import { CLOSED } from "./lib/vocab-forms.js";
import {
  deriveGoetheList, describeEvidence, evidenceFor, indexWordlists, lemmaFor, pluralsFor, sameLevels, type Evidence, type ListIndex,
} from "./lib/goethe-lists.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export type AuditChange = { id: string; de: string; level: string; old: string[]; derived: string[]; evidence: Evidence[] };
/** جمعنا مقابل الجمع المطبوع في القائمة (معلوماتي — لا يغيّر شيئاً) */
export type PluralCheck = { id: string; de: string; ours: string; official: string[]; list: string; headword: string; page: number };
export type ListCoverage = {
  id: string; level: string; main: number; mainCovered: number; mainClosed: number;
  sub: number; subCovered: number; group: number; groupCovered: number;
};

/** مدخل تغطيه الكلمات الوظيفية المغلقة (vocab-forms CLOSED — تُعرف دون درس: ich · nicht · können …) */
export function closedCovers(e: WordlistEntry): boolean {
  return e.lemmas.some((l) => {
    const low = l.toLowerCase();
    if (low.endsWith("-")) return ["", "e", "er", "es", "en", "em"].some((end) => CLOSED.has(low.slice(0, -1) + end));
    return CLOSED.has(low);
  });
}

/** الكلمات + تغيّراتها + تغطية كل قائمة (ما علّمه المنهج من كل قائمة رسمية) */
export function auditGoethe(words: WordT[], lists: OfficialWordlist[]): { changes: AuditChange[]; coverage: ListCoverage[]; uncovered: Map<string, WordlistEntry[]>; byKind: Record<string, number>; plurals: PluralCheck[] } {
  const ixs: ListIndex[] = indexWordlists(lists);
  const changes: AuditChange[] = [];
  const hitHeadwords = new Map<string, Set<string>>(lists.map((l) => [l.id, new Set<string>()]));
  const byKind: Record<string, number> = {};
  const entryAt = new Map<string, WordlistEntry>();
  for (const l of lists) for (const e of l.entries) entryAt.set(`${l.id}|${e.page}|${e.headword}`, e);
  const plurals: PluralCheck[] = [];
  for (const w of words) {
    const evidence = evidenceFor(w, ixs);
    if (w.wordClass === "noun" && w.plural) {
      const ours = w.plural.replace(/^die\s+/, "").trim();
      for (const e of evidence.filter((x) => ["entry", "sub", "group"].includes(x.kind))) {
        const entry = entryAt.get(`${e.list}|${e.page}|${e.headword}`);
        const official = entry ? pluralsFor(entry, lemmaFor(w)) : [];
        if (official.length && !official.includes(ours))
          plurals.push({ id: w.id, de: w.de, ours: w.plural, official, list: e.list, headword: e.headword, page: e.page });
      }
    }
    for (const e of evidence) {
      byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
      if (e.kind !== "herkunft") hitHeadwords.get(e.list)!.add(`${e.page}|${e.headword}`);
      if (e.kind === "composed" && e.via) for (const h of e.via.split(" + ")) hitHeadwords.get(e.list)!.add(`*|${h}`);
    }
    const derived = deriveGoetheList(w, ixs);
    if (!sameLevels(w.goetheList, derived)) changes.push({ id: w.id, de: w.de, level: w.level, old: w.goetheList, derived, evidence });
  }
  const coverage: ListCoverage[] = [];
  const uncovered = new Map<string, WordlistEntry[]>();
  for (const l of lists) {
    const hit = hitHeadwords.get(l.id)!;
    const isHit = (e: WordlistEntry) => hit.has(`${e.page}|${e.headword}`) || hit.has(`*|${e.headword}`);
    const of = (k: WordlistEntry["kind"]) => l.entries.filter((e) => e.kind === k);
    coverage.push({
      id: l.id, level: l.level,
      main: of("main").length, mainCovered: of("main").filter(isHit).length,
      mainClosed: of("main").filter((e) => !isHit(e) && closedCovers(e)).length,
      sub: of("sub").length, subCovered: of("sub").filter(isHit).length,
      group: of("group").length, groupCovered: of("group").filter(isHit).length,
    });
    uncovered.set(l.id, l.entries.filter((e) => e.kind !== "group" && !isHit(e) && !closedCovers(e)));
  }
  return { changes, coverage, uncovered, byKind, plurals };
}

/** يكتب goetheList المشتقة في ملفات الكلمات (الحقل وحده؛ ترتيب المفاتيح والتنسيق محفوظان) */
export function applyGoethe(contentRoot: string, lists: OfficialWordlist[]): number {
  const ixs = indexWordlists(lists);
  const dir = join(contentRoot, "words");
  let n = 0;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
    const raw = readFileSync(join(dir, f), "utf8");
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const w = Word.parse(obj);
    const derived = deriveGoetheList(w, ixs);
    if (sameLevels(w.goetheList, derived)) continue;
    obj.goetheList = derived;
    Word.parse(obj); // لا ملف غير صالح أبداً
    writeFileSync(join(dir, f), JSON.stringify(obj, null, 2) + (raw.endsWith("\n") ? "\n" : ""), "utf8");
    n++;
  }
  return n;
}

function main() {
  const args = process.argv.slice(2);
  const content = join(ROOT, "content");
  const lists = loadWordlists(content);
  if (lists.length === 0) {
    console.error("لا فهارس في content/wordlists — شغّل tools/goethe-wordlist.py أولاً");
    process.exit(1);
  }
  const dir = join(content, "words");
  const words = readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => Word.parse(JSON.parse(readFileSync(join(dir, f), "utf8"))));
  const wi = args.indexOf("--word");
  if (wi >= 0) {
    const w = words.find((x) => x.id === args[wi + 1]);
    if (!w) { console.error(`لا كلمة: ${args[wi + 1]}`); process.exit(1); }
    const evs = evidenceFor(w, indexWordlists(lists));
    console.log(`${w.id} «${w.de}» goetheList=${JSON.stringify(w.goetheList)} → ${JSON.stringify(deriveGoetheList(w, indexWordlists(lists)))}\n  ${describeEvidence(evs)}`);
    return;
  }
  const { changes, coverage, uncovered, byKind, plurals } = auditGoethe(words, lists);
  if (args.includes("--plurals")) {
    console.log(`جمعٌ يخالف علامة القائمة الرسمية: ${new Set(plurals.map((p) => p.id)).size} كلمة`);
    for (const p of plurals) console.log(`  ${p.id} «${p.de}» عندنا «${p.ours}» ↔ ${p.list} «${p.headword}» ص${p.page} ⇒ ${p.official.join("/")}`);
    return;
  }
  const ui = args.indexOf("--uncovered");
  if (ui >= 0) {
    const id = args[ui + 1] ?? "";
    const u = uncovered.get(id);
    if (!u) { console.error(`لا قائمة: ${id} (${[...uncovered.keys()].join(" / ")})`); process.exit(1); }
    console.log(`${id}: ${u.length} كلمة رئيسية لم يعلّمها المنهج بعد (لا مدخل كلمة ولا من الوظيفية المغلقة)`);
    for (const e of u) console.log(`  ص${e.page} ${e.kind === "sub" ? "  " : ""}${e.headword}`);
    return;
  }
  const key = (c: AuditChange) => `${JSON.stringify(c.old)} → ${JSON.stringify(c.derived)}`;
  const groups = new Map<string, AuditChange[]>();
  for (const c of changes) groups.set(key(c), [...(groups.get(key(c)) ?? []), c]);
  console.log(`كلمات: ${words.length} | تتغير goetheList: ${changes.length}`);
  for (const [k, cs] of [...groups.entries()].sort((a, b) => b[1].length - a[1].length))
    console.log(`  ${k}: ${cs.length}`);
  console.log(`أنواع الدليل: ${Object.entries(byKind).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(" ")}`);
  for (const c of coverage)
    console.log(`تغطية ${c.id} (${c.level}): رئيسية ${c.mainCovered}/${c.main} (${Math.round((100 * c.mainCovered) / c.main)}%) + وظيفية مغلقة ${c.mainClosed}` +
      ` = ${Math.round((100 * (c.mainCovered + c.mainClosed)) / c.main)}%` +
      (c.sub ? ` · فرعية ${c.subCovered}/${c.sub}` : "") + ` · مجموعات ${c.groupCovered}/${c.group}`);
  if (args.includes("--verbose"))
    for (const c of changes) console.log(`  ${c.id} «${c.de}» ${JSON.stringify(c.old)} → ${JSON.stringify(c.derived)} | ${describeEvidence(c.evidence)}`);
  if (args.includes("--apply")) console.log(`كُتب: ${applyGoethe(content, lists)} ملف`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
