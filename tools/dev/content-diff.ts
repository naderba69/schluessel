// tools/dev/content-diff.ts — ماذا تغيّر في المحتوى بين مرجعين؟ (D187 — لتقييم المالك دفعات (ب) درسين درسين دون قراءة JSON)
// يقارن ملفات `content/` بين مرجع git وآخر (أو شجرة العمل) ويُخرج، لكل ملف، النصوص التي تغيّرت قبل/بعد
// (كل قيمة نصية في JSON — الألمانية والعربية — مع مسارها) + المسارات الصوتية المضافة/المحذوفة/المعاد توليدها من المانيفست.
//
//   npm run content:diff                      origin/<الفرع الحالي>  ←  شجرة العمل
//   npm run content:diff -- <from> [<to>]     مرجعان (commit · tag · branch)؛ <to> = WORKTREE افتراضاً
//   npm run content:diff -- <from> --json     JSON بدل Markdown
//   npm run content:diff -- <from> --lesson a1-u1-d6   حصر على درس (يشمل ملف الدرس ونصّه الصوتي ومانيفست وحدته)
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const pos = args.filter((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--lesson");
const lessonFilter = args[args.indexOf("--lesson") + 1 || -1];
const git = (...a: string[]) => spawnSync("git", a, { cwd: ROOT, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
const branch = git("rev-parse", "--abbrev-ref", "HEAD").stdout.trim();
const FROM = pos[0] ?? `origin/${branch}`;
const TO = pos[1] ?? "WORKTREE";

type Flat = Map<string, string>;
function flatten(v: unknown, path: string, out: Flat): Flat {
  if (typeof v === "string") out.set(path, v);
  else if (Array.isArray(v)) v.forEach((x, i) => flatten(x, `${path}[${i}]`, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) flatten(x, path ? `${path}.${k}` : k, out);
  return out;
}
function read(ref: string, file: string): string | null {
  if (ref === "WORKTREE") { const p = join(ROOT, file); return existsSync(p) ? readFileSync(p, "utf8") : null; }
  const r = git("show", `${ref}:${file}`);
  return r.status === 0 ? r.stdout : null;
}
function changedFiles(): string[] {
  const r = TO === "WORKTREE" ? git("diff", "--name-only", FROM, "--", "content/") : git("diff", "--name-only", FROM, TO, "--", "content/");
  if (r.status !== 0) { console.error(r.stderr.trim()); process.exit(2); }
  const extra = TO === "WORKTREE" ? git("ls-files", "--others", "--exclude-standard", "--", "content/").stdout : "";
  return [...new Set((r.stdout + extra).split("\n").filter(Boolean))].sort();
}

type TextChange = { path: string; before: string | null; after: string | null };
type FileReport = { file: string; kind: "json" | "audio" | "other"; status: "added" | "deleted" | "modified"; texts: TextChange[]; audio?: { added: string[]; removed: string[]; changed: string[] } };

const idOf = (file: string) => /content\/(?:lessons\/a\d\/|audio-scripts\/|audio\/scripts\/|manifests\/audio-manifest\.)([a-z0-9-]+)/.exec(file)?.[1] ?? "";
const belongs = (file: string) => !lessonFilter || idOf(file).startsWith(lessonFilter) || lessonFilter.startsWith(idOf(file)) && idOf(file).length >= 5;

const reports: FileReport[] = [];
for (const file of changedFiles()) {
  if (!belongs(file)) continue;
  const a = read(FROM, file), b = read(TO, file);
  const status: FileReport["status"] = a === null ? "added" : b === null ? "deleted" : "modified";
  if (/\.(wav|mp3|ogg|opus)$/.test(file)) { reports.push({ file, kind: "audio", status, texts: [] }); continue; }
  if (!file.endsWith(".json")) { reports.push({ file, kind: "other", status, texts: [] }); continue; }
  let fa: Flat = new Map(), fb: Flat = new Map();
  try { fa = a ? flatten(JSON.parse(a), "", new Map()) : fa; fb = b ? flatten(JSON.parse(b), "", new Map()) : fb; } catch { reports.push({ file, kind: "other", status, texts: [{ path: "(JSON غير صالح)", before: null, after: null }] }); continue; }
  const rep: FileReport = { file, kind: "json", status, texts: [] };
  if (file.includes("/manifests/")) {
    // مقارنة بمعرّف المسار لا بالفهرس — إعادة التوليد تغيّر durationMs/sha لا النص
    const byId = (f: Flat) => { const m = new Map<string, Map<string, string>>(); for (const [p, v] of f) { const mm = /^tracks\[(\d+)\]\.(.+)$/.exec(p); if (!mm) continue; const idx = mm[1]!; if (!m.has(idx)) m.set(idx, new Map()); m.get(idx)!.set(mm[2]!, v); } const out = new Map<string, Map<string, string>>(); for (const t of m.values()) out.set(t.get("id") ?? "?", t); return out; };
    const A = byId(fa), B = byId(fb);
    rep.audio = { added: [...B.keys()].filter((k) => !A.has(k)), removed: [...A.keys()].filter((k) => !B.has(k)), changed: [...B.keys()].filter((k) => A.has(k) && JSON.stringify([...A.get(k)!]) !== JSON.stringify([...B.get(k)!])) };
    for (const id of rep.audio.changed) { const ta = A.get(id)!.get("text"), tb = B.get(id)!.get("text"); if (ta !== tb) rep.texts.push({ path: `${id}.text`, before: ta ?? null, after: tb ?? null }); }
  } else {
    for (const [p, v] of fb) if (fa.get(p) !== v) rep.texts.push({ path: p, before: fa.get(p) ?? null, after: v });
    for (const [p, v] of fa) if (!fb.has(p)) rep.texts.push({ path: p, before: v, after: null });
  }
  reports.push(rep);
}

const summary = { from: FROM, to: TO, files: reports.length, texts: reports.reduce((n, r) => n + r.texts.length, 0), audio: reports.filter((r) => r.kind === "audio").length };
if (flags.has("--json")) {
  // لا process.exit بعد الكتابة: stdout إلى أنبوب غير متزامن في Node — الخروج الفوري يبتر المخرجات الكبيرة (ظهر في D194 عند 224 KB)
  process.stdout.write(JSON.stringify({ summary, reports }, null, 1) + "\n");
} else {

const q = (s: string | null) => (s === null ? "∅" : `«${s.replace(/\n/g, "⏎")}»`);
console.log(`# فرق المحتوى — ${FROM} ← ${TO}${lessonFilter ? ` · الدرس ${lessonFilter}` : ""}\n`);
console.log(`ملفات ${summary.files} · نصوص متغيّرة ${summary.texts} · ملفات صوت ${summary.audio}\n`);
for (const r of reports) {
  console.log(`## ${r.file} (${r.status === "added" ? "جديد" : r.status === "deleted" ? "محذوف" : "معدَّل"})`);
  if (r.audio) {
    if (r.audio.added.length) console.log(`- مسارات جديدة (${r.audio.added.length}): ${r.audio.added.join(" · ")}`);
    if (r.audio.removed.length) console.log(`- مسارات محذوفة (${r.audio.removed.length}): ${r.audio.removed.join(" · ")}`);
    if (r.audio.changed.length) console.log(`- مسارات أُعيد توليدها/تغيّرت (${r.audio.changed.length}): ${r.audio.changed.join(" · ")}`);
  }
  for (const t of r.texts) console.log(`- \`${t.path}\`\n  - قبل: ${q(t.before)}\n  - بعد: ${q(t.after)}`);
  if (r.kind === "audio") console.log(`- ملف صوتي ${r.status === "added" ? "جديد" : r.status === "deleted" ? "محذوف" : "أُعيد توليده"}`);
  console.log("");
}
}
