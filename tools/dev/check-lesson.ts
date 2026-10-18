// tools/dev/check-lesson.ts — فحص نصوص درس قبل الالتزام (N-104: كانت أداة خارج المستودع تضيع مع كل انقطاع)
// ثلاثة فحوص على كل جملة ألمانية:
//   front    — قانون الجبهة (الدستور 13): كلمة غير مدروسة حتى هذا الدرس (frontViolations من tools/lib/lesson-upgrade)
//   later    — تسرّب كلمة درسٍ لاحق (N-103 — D188: المنطق نفسه الذي في الحارس الرسمي: withLaterForms/laterWordLeak · لا منطق ثانٍ هنا)
//   official — تطابق حرفي مع نصوص SD1/A2 الرسمية (D108) — يتطلّب .dev-cache (bash tools/dev/fetch-official.sh)
// الاستعمال:
//   npx tsx tools/dev/check-lesson.ts a1-u12-d2                      ← نصوص الدرس نفسه (ziel/einstieg/uebung/quiz/zusammenfassung)
//   npx tsx tools/dev/check-lesson.ts a1-u12-d2 --names Yusuf,Lena   ← أعلام مسموحة (كما في properNouns)
//   npx tsx tools/dev/check-lesson.ts a1-u12-d2 --file lines.txt     ← سطر = جملة؛ يُتجاهل ما بعد «|»
//   npx tsx tools/dev/check-lesson.ts a1-u12-d2 --script             ← أسطر سكربت الصوت للدرس أيضاً
//   npx tsx tools/dev/check-lesson.ts a1-u12-d2 --json               ← مخرجات آلية
//   --only-hits                                                     ← لا يطبع إلا الأسطر التي فيها نتيجة
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadLessons, loadWords } from "../lib/content-disk.js";
import { frontViolations, taughtUpTo, pathOrder, germanOnly } from "../lib/lesson-upgrade.js";
import { FULL, LATER, knownForms, knownStems, contentTokens, deumlaut, laterWordLeak, withLaterForms } from "../lib/vocab-forms.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONTENT = resolve(ROOT, "content");
const CACHE = resolve(ROOT, ".dev-cache");

const argv = process.argv.slice(2);
const lessonId = argv.find((a) => !a.startsWith("--"));
const opt = (name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const flag = (name: string): boolean => argv.includes(`--${name}`);
if (!lessonId) {
  console.error("الاستعمال: npx tsx tools/dev/check-lesson.ts <lessonId> [--names A,B] [--file f.txt] [--script] [--json] [--only-hits]");
  process.exit(2);
}

const lessons = loadLessons(CONTENT);
const words = loadWords(CONTENT);
const lesson = lessons.find((l) => l.id === lessonId);
if (!lesson) {
  console.error(`لا درس بالمعرّف ${lessonId}`);
  process.exit(2);
}

// الأعلام المسموحة: من السطر أو من إدخال الترقية (properNouns)
const upgradeFile = resolve(CONTENT, "upgrades/a1-lesson-upgrade.json");
let autoNames: string[] = [];
let fixedPhrases: { de: string; whyAr: string }[] = [];
if (existsSync(upgradeFile)) {
  const up = JSON.parse(readFileSync(upgradeFile, "utf8")) as { lessons?: { lessonId: string; properNouns?: string[]; fixedPhrases?: { de: string; whyAr: string }[] }[] };
  const e = up.lessons?.find((x) => x.lessonId === lessonId);
  autoNames = e?.properNouns ?? [];
  fixedPhrases = e?.fixedPhrases ?? []; // D188: الصيغ الثابتة المعلنة من SD1 — تُسقط إصابة official المطابقة لها وحدها
}
const names = (opt("names") ?? autoNames.join(",")).split(",").map((s) => s.trim()).filter(Boolean);
const allow = new Set(names.flatMap((n) => contentTokens(n)));
const taughtWords = taughtUpTo(lesson, lessons, words);
// D188: المجموعة نفسها التي يستعملها الحارس الرسمي (inspectLesson): المدروس + صيغ اللاحق بعلامة «<» + المستعارات المعلنة
const taught = withLaterForms(knownStems(taughtWords), taughtWords, words);
for (const b of lesson.praesentation.borrowedWords) { const f = deumlaut(b.form.toLowerCase()); taught.add(f); taught.add(FULL + f); }
// صيغة لاحقة ← معرّف كلمتها (درس أول ظهورها) — للتسمية في المخرج فقط
const taughtIds = new Set(taughtWords.map((w) => w.id));
const firstLesson = new Map<string, (typeof lessons)[number]>();
for (const l of [...lessons].sort((a, b) => pathOrder(a) - pathOrder(b)))
  for (const id of l.praesentation.wordIds) if (!firstLesson.has(id)) firstLesson.set(id, l);
const laterOwner = new Map<string, string>();
for (const w of words) {
  if (taughtIds.has(w.id)) continue;
  const l = firstLesson.get(w.id);
  for (const f of knownForms(w)) { const d = deumlaut(f); if (!laterOwner.has(d)) laterOwner.set(d, `${w.id}(${(l?.id ?? "؟").replace("a1-", "")})`); }
}

// النصوص الرسمية (D108) — اختيارية
const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
const official: { src: string; text: string }[] = [];
let officialAvailable = false;
for (const [src, f] of [["SD1", resolve(CACHE, "sd1.txt")], ["A2", resolve(CACHE, "a2.txt")]] as const) {
  if (!existsSync(f)) continue;
  officialAvailable = true;
  for (const seg of readFileSync(f, "utf8").split(/\n|(?<=[.!?])\s+/)) {
    const t = seg.trim();
    if (t.split(/\s+/).length >= 3 && /[A-ZÄÖÜ]/.test(t[0] ?? "")) official.push({ src, text: norm(t) });
  }
}

// الأسطر المفحوصة
export function lessonGermanStrings(l: unknown): string[] {
  const out: string[] = [];
  // تُستثنى حقول الترجمة والتعليل (عربية) وحقول الربط (معرّفات · أنواع · مراجع) — الاختبار الحقيقي للمعرّفات عند المدقّق
  const skip = new Set(["why", "ar", "whyArabicSpeakerFails", "tokens", "speakText", "type", "kind", "station", "interleavedWith", "riskFlagsShown"]);
  const skipKey = (k: string): boolean => skip.has(k) || /Ids?$|Refs?$|^id$/.test(k);
  const walk = (x: unknown): void => {
    if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object") for (const [k, v] of Object.entries(x as Record<string, unknown>)) { if (!skipKey(k)) walk(v); }
    else if (typeof x === "string" && /[A-Za-zÄÖÜäöüß]{3}/.test(x) && !/^[a-z0-9]+(-[a-z0-9]+)+$/.test(x)) out.push(x);
  };
  const L = l as Record<string, unknown>;
  walk(Object.fromEntries(["ziel", "einstieg", "uebung", "quiz", "zusammenfassung"].filter((k) => k in L).map((k) => [k, L[k]])));
  return [...new Set(out)];
}
let lines: string[];
const file = opt("file");
if (file) lines = readFileSync(file, "utf8").split("\n").map((l) => l.split("|")[0]!.trim()).filter(Boolean);
else lines = lessonGermanStrings(JSON.parse(readFileSync(resolve(CONTENT, "lessons/a1", `${lessonId}.json`), "utf8")));
if (flag("script")) {
  const dir = resolve(CONTENT, "audio-scripts");
  for (const f of readdirSync(dir)) {
    if (!f.startsWith(`${lessonId}-`) || !f.endsWith(".json")) continue;
    const s = JSON.parse(readFileSync(resolve(dir, f), "utf8")) as { lines?: { textDe?: string; text?: string }[] };
    for (const ln of s.lines ?? []) { const t = ln.textDe ?? ln.text; if (t) lines.push(t); }
  }
}

type Hit = { line: string; front: string[]; later: string[]; official: string[] };
const hits: Hit[] = [];
for (const line of lines) {
  const de = germanOnly(line).replace(/~~/g, " ").replace(/___/g, " ");
  const front = frontViolations([de], taught, allow);
  const later = new Set<string>();
  for (const t of contentTokens(de)) {
    if (allow.has(t)) continue;
    const d = deumlaut(t);
    if (taught.has(LATER + d) && laterWordLeak(d, taught)) later.add(`${t}→${laterOwner.get(d) ?? "؟"}`);
  }
  const n = norm(de);
  const declared = fixedPhrases.some((p) => n === norm(p.de) || n.includes(norm(p.de)));
  const off = declared ? [] : official
    .filter((o) => n.length >= 12 && (o.text === n || o.text.includes(n) || (n.includes(o.text) && o.text.split(" ").length >= 4)))
    .slice(0, 2)
    .map((o) => `${o.src}«${o.text}»`);
  hits.push({ line, front, later: [...later], official: off });
}

const summary = {
  lessonId,
  names,
  officialAvailable,
  lines: hits.length,
  front: hits.filter((h) => h.front.length).length,
  later: hits.filter((h) => h.later.length).length,
  official: hits.filter((h) => h.official.length).length,
};
if (flag("json")) {
  console.log(JSON.stringify({ summary, hits }, null, 1));
} else {
  for (const h of hits) {
    const any = h.front.length || h.later.length || h.official.length;
    if (flag("only-hits") && !any) continue;
    console.log(h.line);
    console.log(`  front: ${h.front.length ? h.front.join(", ") : "-"} · later: ${h.later.length ? h.later.join(", ") : "-"} · official: ${h.official.length ? h.official.join(" / ") : officialAvailable ? "-" : "(لا .dev-cache — شغّل tools/dev/fetch-official.sh)"}`);
  }
  console.log(`\nالخلاصة: ${summary.lines} سطراً · front ${summary.front} · later ${summary.later} · official ${summary.official}${officialAvailable ? "" : " (لم يُفحص)"}`);
}
