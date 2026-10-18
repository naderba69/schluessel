// tools/dev/gate.ts — البوابة الواحدة (D187 · قرار المالك 2026-10-18: «أتمتة التحقق بسكريبتات تبنيها»)
// تشغّل كل بوابات المشروع بأمر واحد، تجمع أرقامها آلياً (لا نقل يدوي)، وتطبع تقرير الأسطر الثلاثة بالعربية
// (ما نُفّذ · البوابة · ما ينكسر) وتكتب `.dev-cache/gate.json`. رمز الخروج ≠0 عند أي خلل صلب.
//
//   npm run gate                 البوابة كاملة (vitest · tsc · validate-content · build · docs-sync · notes · pronunciation-audit · lexicon-sync · speech-rate)
//   npm run gate -- --quick      بلا vitest وبلا build (فحص سريع أثناء العمل — ليس بديلاً قبل الدفع)
//   npm run gate -- --did "…"    السطر الأول من التقرير (وإلا يُؤخذ عنوان آخر قرار مهيكل من DECISIONS.md)
//   npm run gate -- --json       يطبع JSON فقط
//
// الحارس الناعم: speech-rate فوق 200 كلمة/دقيقة يُبلَّغ ولا يُسقط البوابة (قانون 11 — الحكم للأذن قبل الإطلاق).
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const args = process.argv.slice(2);
const flag = (f: string) => args.includes(f);
const opt = (f: string) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const QUICK = flag("--quick");

type Step = { id: string; label: string; cmd: string; argv: string[]; soft?: boolean; parse: (out: string) => { ok: boolean; summary: string; numbers?: Record<string, number> } };
type Result = { id: string; label: string; ok: boolean; soft: boolean; summary: string; numbers: Record<string, number>; ms: number; exit: number | null; tail?: string };

const num = (re: RegExp, s: string, g = 1) => { const m = re.exec(s); return m ? Number(m[g]) : NaN; };
const strip = (s: string) => s.replace(/\u001b\[[0-9;]*m/g, "");

const STEPS: Step[] = [
  {
    id: "vitest", label: "vitest", cmd: "npx", argv: ["vitest", "run"],
    parse: (o) => {
      const s = strip(o);
      const testsLine = /Tests\s+([^\n]*)/u.exec(s)?.[1] ?? "";
      const passed = num(/(\d+) passed/u, testsLine), total = num(/\((\d+)\)/u, testsLine), files = num(/Test Files\s+(\d+) passed/u, s);
      const failed = num(/(\d+) failed/u, testsLine);
      const ok = Number.isFinite(passed) && passed === total && !Number.isFinite(failed);
      return { ok, summary: ok ? `${passed}/${total} (${files} ملفاً)` : `فشل ${Number.isFinite(failed) ? failed : "?"} · نجح ${passed}/${total}`, numbers: { passed, total, files } };
    },
  },
  { id: "tsc", label: "tsc", cmd: "npx", argv: ["tsc", "--noEmit", "-p", "."], parse: (o) => { const n = o.split("\n").filter((l) => /error TS\d+/.test(l)).length; return { ok: n === 0, summary: `${n} خطأ`, numbers: { errors: n } }; } },
  {
    id: "validate", label: "validate-content", cmd: "npx", argv: ["tsx", "tools/validate-content.ts"],
    parse: (o) => { const files = num(/files: (\d+)/u, o), errors = num(/errors: (\d+)/u, o), warnings = num(/warnings: (\d+)/u, o); return { ok: errors === 0 && warnings === 0, summary: `${files}/${errors}/${warnings}`, numbers: { files, errors, warnings } }; },
  },
  { id: "build", label: "build", cmd: "npm", argv: ["run", "build"], parse: (o) => ({ ok: /built in/.test(o) && !/error/i.test(strip(o).replace(/\d+ modules/g, "")), summary: /built in ([\d.]+m?s)/.exec(o)?.[1] ?? "؟" }) },
  { id: "docs", label: "docs-sync --check", cmd: "python3", argv: ["tools/dev/docs-sync.py", "--check"], parse: (o) => ({ ok: /محدَّث/.test(o), summary: /\((.*?)\)/u.exec(o)?.[1] ?? o.trim().slice(0, 80) }) },
  { id: "notes", label: "notes check", cmd: "python3", argv: ["tools/dev/notes.py", "check"], parse: (o) => { const m = /بانتظار المالك (\d+) · مفتوحة (\d+) · مغلقة (\d+) · المجموع (\d+)/u.exec(o); return { ok: /سليم/.test(o), summary: m ? `${m[1]}/${m[2]}/${m[3]} (${m[4]})` : o.trim().slice(0, 80), numbers: m ? { owner: +m[1]!, open: +m[2]!, closed: +m[3]!, total: +m[4]! } : {} }; } },
  { id: "audit", label: "pronunciation-audit", cmd: "python3", argv: ["tools/pronunciation-audit.py"], parse: (o) => { const bad = num(/مخالفة بلا قرار: (\d+)/u, o), old = num(/مقتطف قديم: (\d+)/u, o), chg = num(/مراجَع تغيّر نطقه: (\d+)/u, o); return { ok: bad === 0 && old === 0 && chg === 0, summary: `بلا قرار ${bad} · قديم ${old} · تغيّر ${chg}`, numbers: { bad, old, chg } }; } },
  { id: "lexicon", label: "lexicon-sync --check", cmd: "python3", argv: ["tools/dev/lexicon-sync.py", "--check"], parse: (o) => { const m = /ناقص (\d+) · زائد (\d+) · مدخلات (\d+)/u.exec(o); return { ok: /متزامن —/.test(o) && !/غير متزامن/.test(o), summary: m ? `ناقص ${m[1]} · زائد ${m[2]} · مدخلات ${m[3]}` : o.trim().slice(0, 80), numbers: m ? { missing: +m[1]!, extra: +m[2]!, entries: +m[3]! } : {} }; } },
  { id: "speech", label: "speech-rate (ناعم)", cmd: "python3", argv: ["tools/dev/speech-rate.py", "--json"], soft: true, parse: (o) => { const j = JSON.parse(o) as { measured: number; flagged: unknown[]; threshold: number }; return { ok: j.flagged.length === 0, summary: `${j.flagged.length} فوق ${j.threshold} من ${j.measured}`, numbers: { flagged: j.flagged.length, measured: j.measured } }; } },
];

function run(step: Step): Result {
  const t = Date.now();
  const r = spawnSync(step.cmd, step.argv, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: { ...process.env, CI: "1", FORCE_COLOR: "0" } });
  const out = (r.stdout ?? "") + "\n" + (r.stderr ?? "");
  let p: ReturnType<Step["parse"]>;
  try { p = step.parse(out); } catch (e) { p = { ok: false, summary: `تعذّر قراءة المخرج: ${(e as Error).message}` }; }
  const ok = p.ok && (step.soft || r.status === 0);
  return { id: step.id, label: step.label, ok, soft: !!step.soft, summary: p.summary, numbers: p.numbers ?? {}, ms: Date.now() - t, exit: r.status, ...(ok ? {} : { tail: strip(out).trim().split("\n").slice(-25).join("\n") }) };
}

function git(...a: string[]) { return spawnSync("git", a, { cwd: ROOT, encoding: "utf8" }).stdout.trim(); }

function lastDecision(): { id: string; title: string } | null {
  const r = spawnSync("python3", ["tools/dev/docs-sync.py", "--json"], { cwd: ROOT, encoding: "utf8" });
  try { const j = JSON.parse(r.stdout) as { decisions: { d: number; title: string }[] }; const x = j.decisions.at(-1); return x ? { id: `D${x.d}`, title: x.title } : null; } catch { return null; }
}

const steps = QUICK ? STEPS.filter((s) => s.id !== "vitest" && s.id !== "build") : STEPS;
const results = steps.map(run);
const hard = results.filter((r) => !r.ok && !r.soft);
const soft = results.filter((r) => !r.ok && r.soft);
const head = git("rev-parse", "--short", "HEAD");
const dirty = git("status", "--porcelain").split("\n").filter(Boolean).length;
const branch = git("rev-parse", "--abbrev-ref", "HEAD");
const dec = lastDecision();
const did = opt("--did") ?? (dec ? `${dec.id} — ${dec.title}` : "(لا قرار مهيكل)");

const line2 = results.map((r) => `${r.label} ${r.ok ? "✓" : r.soft ? "⚠" : "✗"} ${r.summary}`).join(" · ");
const line3 = hard.length ? `ينكسر: ${hard.map((r) => `${r.label} (${r.summary})`).join(" · ")}` : soft.length ? `لا شيء ينكسر · تنبيه ناعم: ${soft.map((r) => `${r.label} ${r.summary}`).join(" · ")}` : "لا شيء ينكسر.";
const report = [`1. **ما نُفّذ:** ${did}`, `2. **البوابة${QUICK ? " (سريعة — بلا vitest/build)" : ""}:** ${line2} · ${branch}@${head}${dirty ? ` (+${dirty} ملفاً غير ملتزَم)` : ""}`, `3. **ما ينكسر:** ${line3}`].join("\n");

const payload = { date: new Date().toISOString(), branch, head, dirty, quick: QUICK, ok: hard.length === 0, results, report };
mkdirSync(join(ROOT, ".dev-cache"), { recursive: true });
writeFileSync(join(ROOT, ".dev-cache", "gate.json"), JSON.stringify(payload, null, 1));

if (flag("--json")) console.log(JSON.stringify(payload, null, 1));
else {
  for (const r of results) console.log(`${r.ok ? "✓" : r.soft ? "⚠" : "✗"} ${r.label.padEnd(22)} ${r.summary}  (${(r.ms / 1000).toFixed(1)}s)`);
  for (const r of hard) console.log(`\n--- ${r.label} (exit ${r.exit}) ---\n${r.tail}`);
  console.log("\n" + report);
}
process.exit(hard.length ? 1 : 0);
