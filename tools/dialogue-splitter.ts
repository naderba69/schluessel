// tools/dialogue-splitter.ts — مقسِّم الحوار (D103): سكربت صوتي ← مسار لكل سطر بصوت متحدثه الثابت
// التشغيل:  npx tsx tools/dialogue-splitter.ts --all              (كل content/audio-scripts/)
//           npx tsx tools/dialogue-splitter.ts <script.json>...  [--force] [--dry-run]
//           npx tsx tools/dialogue-splitter.ts <script.json>... --lines <lineId,...>   (D122: أسطر بعينها فقط)
// المبادئ: (1) المانيفست مصدر الحقيقة لصوت كل شخصية (القانون 11) · (2) لا إعادة توليد لسطر لم يتغير
// (VITS عشوائي — فخ موثَّق) · (3) أسطر محذوفة من السكربت ← مساراتها وملفاتها تُزال · (4) المانيفست
// يُتحقق منه بـzod قبل الكتابة — لا يُكتب مانيفست مكسور أبداً · (5) القياسات كلها من الملف الفعلي.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { AudioManifest, AudioScript, lineLengthScale } from "../content/schemas/index.js";
import {
  buildTrack, expectedVoice, planScript, scriptTrackFile,
  type ClipMeasurement, type TrackLike,
} from "./lib/script-audio.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_REL = "manifests/audio-manifest.a1-u1.json";

export type Generate = (voice: string, text: string, outAbs: string, lengthScale: number) => ClipMeasurement;

/** المولِّد الحقيقي: gen-audio.py one-voice (Piper محلي → RMS −17dB → Opus 24k → قياسات من الملف) */
export const piperGenerate: Generate = (voice, text, outAbs, lengthScale) => {
  const args = [join(ROOT, "tools/gen-audio.py"), "one-voice", voice, text, outAbs, "--length-scale", String(lengthScale)];
  const out = execFileSync("python3", args, {
    encoding: "utf8", timeout: 180_000,
  });
  const m = JSON.parse(out.trim().split("\n").at(-1)!) as ClipMeasurement & { speaker: string };
  if (m.speaker !== voice) throw new Error(`المولِّد استخدم ${m.speaker} بدل ${voice} — رفض`);
  const { speaker: _speaker, ...measured } = m;
  return measured;
};

export type SplitReport = { generated: string[]; kept: string[]; pruned: string[]; written: boolean };

function sha256File(f: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(f)).digest("hex")}`;
}

/** كل ملفات السكربتات في content/audio-scripts/ */
export function allScriptFiles(contentRoot: string): string[] {
  const dir = join(contentRoot, "audio-scripts");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => join(dir, f));
}

export function runSplitter(opts: {
  scriptFiles: string[];
  contentRoot?: string;
  force?: boolean;
  /** D122: أسطر بعينها تُعاد قسراً (معجم النطق صحّح كلمة فيها) — وبقية السكربت على خطته العادية، فلا يتغير مقطع منشور بلا سبب */
  lines?: string[];
  dryRun?: boolean;
  generate?: Generate;
}): SplitReport {
  const contentRoot = opts.contentRoot ?? join(ROOT, "content");
  const generate = opts.generate ?? piperGenerate;
  const manifestPath = join(contentRoot, MANIFEST_REL);
  const rawText = readFileSync(manifestPath, "utf8");
  // نكتب الكائن الخام (يحفظ pcmSha256/rmsDb وغيرها) — zod للتحقق فقط
  const raw = JSON.parse(rawText) as { tracks: (TrackLike & Record<string, unknown>)[]; characterVoices: Record<string, string> };
  AudioManifest.parse(raw);

  const report: SplitReport = { generated: [], kept: [], pruned: [], written: false };
  const tracksById = () => new Map(raw.tracks.map((t) => [t.id, t] as const));
  const fileHashOk = (t: TrackLike) => {
    const f = join(contentRoot, t.file);
    return existsSync(f) && (!t.hash || t.hash === sha256File(f));
  };

  const scripts = opts.scriptFiles.map((file) => AudioScript.parse(JSON.parse(readFileSync(file, "utf8"))));
  const wanted = new Set(opts.lines ?? []);
  const known = new Set(scripts.flatMap((s) => s.lines.map((l) => l.id)));
  const unknown = [...wanted].filter((id) => !known.has(id));
  if (unknown.length > 0) throw new Error(`أسطر غير موجودة في السكربتات المعطاة: ${unknown.join(", ")} — لا تجاهل صامت`);

  for (const script of scripts) {
    // D196: معرّف سطر يملكه سكربت آخر (بادئة مكرّرة — ws-/wf- في u8-d2/u9-d3) يُرفض قبل أي توليد؛ وإلا استُبدلت مسارات درس آخر صامتةً
    const dir = scriptTrackFile(script.id, "x").replace(/x\.opus$/, "");
    const byId = tracksById();
    const stolen = script.lines.map((l) => byId.get(l.id)).filter((t): t is TrackLike => !!t && !t.file.startsWith(dir));
    if (stolen.length > 0) throw new Error(`بادئة مكرّرة: ${stolen.map((t) => `${t.id} ← ${t.file}`).slice(0, 3).join(" · ")} — اختر بادئة أسطر أخرى للسكربت ${script.id}`);
    const base = opts.force
      ? { generate: script.lines, keep: [] }
      : planScript(script, tracksById(), raw.characterVoices, fileHashOk);
    const plan = {
      generate: script.lines.filter((l) => base.generate.includes(l) || wanted.has(l.id)),
      keep: base.keep.filter((l) => !wanted.has(l.id)),
    };
    report.kept.push(...plan.keep.map((l) => l.id));

    for (const line of plan.generate) {
      const voice = expectedVoice(line.speaker, raw.characterVoices);
      report.generated.push(line.id);
      if (opts.dryRun) continue;
      const m = generate(voice, line.text, join(contentRoot, scriptTrackFile(script.id, line.id)), lineLengthScale(script, line));
      const track = buildTrack(script, line, voice, m);
      const i = raw.tracks.findIndex((t) => t.id === line.id);
      if (i >= 0) raw.tracks[i] = track;
      else raw.tracks.push(track);
    }

    // أسطر حُذفت من السكربت: مساراتها وملفاتها تُزال (لا مسارات يتيمة)
    const prefix = `audio/scripts/${script.id}/`;
    const live = new Set(script.lines.map((l) => l.id));
    for (const t of raw.tracks.filter((x) => x.file.startsWith(prefix) && !live.has(x.id))) {
      report.pruned.push(t.id);
      if (opts.dryRun) continue;
      rmSync(join(contentRoot, t.file), { force: true });
    }
    if (!opts.dryRun) raw.tracks = raw.tracks.filter((x) => !(x.file.startsWith(prefix) && !live.has(x.id)));
  }

  if (!opts.dryRun && (report.generated.length > 0 || report.pruned.length > 0)) {
    AudioManifest.parse(raw); // لا يُكتب مانيفست مكسور أبداً
    writeFileSync(manifestPath, JSON.stringify(raw, null, 2) + (rawText.endsWith("\n") ? "\n" : ""), "utf8");
    report.written = true;
  }
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const contentRoot = join(ROOT, "content");
  const li = args.indexOf("--lines");
  const lines = li >= 0 ? (args[li + 1] ?? "").split(",").filter(Boolean) : undefined;
  const positional = args.filter((a, i) => !a.startsWith("--") && !(li >= 0 && i === li + 1));
  const files = args.includes("--all") ? allScriptFiles(contentRoot) : positional.map((a) => resolve(a));
  if (files.length === 0 || (li >= 0 && (lines ?? []).length === 0)) {
    console.error("الاستخدام: npx tsx tools/dialogue-splitter.ts --all | <script.json>... [--force] [--dry-run] [--lines <lineId,...>]");
    process.exit(2);
  }
  let r: SplitReport;
  try {
    r = runSplitter({ scriptFiles: files, contentRoot, force: args.includes("--force"), lines, dryRun: args.includes("--dry-run") });
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`); // المانيفست لا يُكتب قبل نجاح كل شيء
    process.exit(1);
  }
  console.log(`سكربتات: ${files.length} | وُلّد: ${r.generated.length} | بقي كما هو: ${r.kept.length} | أُزيل: ${r.pruned.length}${r.written ? " | المانيفست حُدِّث" : ""}`);
  for (const id of r.generated) console.log(`  + ${id}`);
  for (const id of r.pruned) console.log(`  − ${id}`);
  // D197: ما كان يُنسى بعد كل حوار جديد (N-099) يجري هنا آلياً — مزامنة معجم النطق ودفتر القصة؛ فشلهما يُرى لا يُبلع
  if (r.written) {
    for (const [cmd, argv] of [["python3", ["tools/dev/lexicon-sync.py", "--write"]], ["npx", ["tsx", "tools/dev/story-sentences.ts", "--write"]]] as const) {
      const p = spawnSync(cmd, [...argv], { cwd: ROOT, encoding: "utf8" });
      const last = (p.stdout + p.stderr).trim().split("\n").filter(Boolean).pop() ?? "";
      console.log(`  ${p.status === 0 ? "↻" : "✗"} ${last}`);
      if (p.status !== 0) process.exitCode = 1;
    }
  }
}
