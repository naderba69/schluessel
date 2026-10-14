// tools/regen-track.ts — إعادة توليد مقطع كلمة منشور بالنص والصوت نفسيهما + تحديث قياساته في المانيفست (D121)
// الاستخدام: npx tsx tools/regen-track.ts <trackId>... [--dry-run]
// متى: حين يتغيّر مسار التوليد لا النص — معجم النطق (D121) صحّح فونيمات كلمة فصار مقطعها القديم خاطئاً.
// المانيفست ليس JSON قانونياً (تنسيقه يدوي جزئياً) ⇒ تعديل نصي داخل كائن المسار وحده، ثم برهان بالتحليل والمقارنة:
// لا يتغير إلا الحقول الخمسة المقيسة لهذا المسار (القانون 7: والإعلان في DECISIONS).
// حدود معلنة: مسارات role=word بالصوت الرئيسي فقط — أسطر السكربتات تُعاد بـ dialogue-splitter --force.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { VOICE_ID, WORD_CLIP_MAX_SEC } from "../src/lib/audio.js";
import { piperClip, type GenerateClip } from "./word-entry-generator.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_REL = "content/manifests/audio-manifest.a1-u1.json";

export type Measures = { durationMs: number; sizeBytes: number; hash: string; pcmSha256: string; rmsDb: number };
const FIELDS = ["durationMs", "sizeBytes", "hash", "pcmSha256", "rmsDb"] as const;

type Track = { id: string; role: string; file: string; textDe: string; voiceParams: { speaker: string; lengthScale?: number } } & Record<string, unknown>;

/** حدود كائن المسار في النص: من «{» الذي يليه "id" مباشرة إلى قوسه المطابق (السلاسل تُتخطّى) */
function trackBounds(text: string, trackId: string): { start: number; end: number } {
  const key = `"id": ${JSON.stringify(trackId)}`;
  const at = text.indexOf(key);
  if (at < 0) throw new Error(`المسار ${trackId} غير موجود في المانيفست`);
  if (text.indexOf(key, at + key.length) >= 0) throw new Error(`المسار ${trackId} مكرر في المانيفست`);
  const start = text.lastIndexOf("{", at);
  if (start < 0 || text.slice(start + 1, at).trim() !== "") throw new Error(`"id" ليس أول مفتاح في كائن ${trackId} — لا أحدد حدوده تخميناً`);
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      for (i++; text[i] !== '"'; i++) if (text[i] === "\\") i++;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return { start, end: i };
  }
  throw new Error(`كائن ${trackId} غير مغلق`);
}

/**
 * يستبدل الحقول الخمسة المقيسة لمسار واحد نصياً ويُبقي كل بايت آخر كما هو.
 * القيمة المساوية رقمياً تبقى بنصها القديم (‎-17.0 لا تصير ‎-17) — فالتطبيق بالقياسات نفسها لا يغيّر شيئاً.
 * البرهان داخل الدالة: بعد التحليل لا يختلف إلا هذا المسار وفي هذه الحقول فقط، وإلا يُرمى خطأ.
 */
export function patchTrackMeasures(text: string, trackId: string, m: Measures): string {
  const { start, end } = trackBounds(text, trackId);
  let block = text.slice(start, end + 1);
  for (const f of FIELDS) {
    const re = new RegExp(`("${f}":\\s*)("(?:[^"\\\\]|\\\\.)*"|-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)`);
    const hit = block.match(re);
    if (!hit) throw new Error(`الحقل ${f} غائب في المسار ${trackId}`);
    if (JSON.parse(hit[2]!) === m[f]) continue;
    block = block.replace(re, (_all, lead: string) => lead + JSON.stringify(m[f]));
  }
  const out = text.slice(0, start) + block + text.slice(end + 1);

  const before = JSON.parse(text) as { tracks: Track[] } & Record<string, unknown>;
  const after = JSON.parse(out) as { tracks: Track[] } & Record<string, unknown>;
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const { tracks: bt, ...bRest } = before;
  const { tracks: at, ...aRest } = after;
  if (!same(bRest, aRest) || bt.length !== at.length) throw new Error("تغيّر شيء خارج المسار — مرفوض");
  bt.forEach((t, i) => {
    const expected = t.id === trackId ? { ...t, ...m } : t;
    if (!same(expected, at[i])) throw new Error(`تغيّر المسار ${at[i]!.id} بغير الحقول المقيسة — مرفوض`);
  });
  return out;
}

export type RegenRow = { id: string; textDe: string; before: Measures; after: Measures; attempts: number };

/** يعيد توليد مسارات الكلمات المطلوبة ويُرجع النص الجديد للمانيفست (لا يكتب شيئاً بنفسه) */
export function regenTracks(opts: { ids: string[]; manifestText: string; contentRoot: string; clip?: GenerateClip; dryRun?: boolean }): { text: string; rows: RegenRow[] } {
  const clip = opts.clip ?? piperClip;
  const tracks = (JSON.parse(opts.manifestText) as { tracks: Track[] }).tracks;
  let text = opts.manifestText;
  const rows: RegenRow[] = [];
  for (const id of opts.ids) {
    const t = tracks.find((x) => x.id === id);
    if (!t) throw new Error(`المسار ${id} غير موجود في المانيفست`);
    if (t.role !== "word") throw new Error(`المسار ${id} دوره ${t.role} — أسطر السكربتات تُعاد بـ dialogue-splitter --force`);
    if (t.voiceParams.speaker !== VOICE_ID || t.voiceParams.lengthScale !== undefined)
      throw new Error(`المسار ${id} ليس بالصوت الرئيسي وسرعته الافتراضية — خارج حدود هذه الأداة`);
    const before = Object.fromEntries(FIELDS.map((f) => [f, t[f]])) as Measures;
    if (opts.dryRun) {
      rows.push({ id, textDe: t.textDe, before, after: before, attempts: 0 });
      continue;
    }
    const abs = join(opts.contentRoot, t.file);
    let m = clip(t.textDe, abs);
    let attempts = 1;
    for (; attempts < 3 && m.durationMs > WORD_CLIP_MAX_SEC * 1000; attempts++) m = clip(t.textDe, abs);
    if (m.durationMs > WORD_CLIP_MAX_SEC * 1000) throw new Error(`مقطع ${id} أطول من ${WORD_CLIP_MAX_SEC}s بعد 3 محاولات`);
    const after: Measures = { durationMs: m.durationMs, sizeBytes: m.sizeBytes, hash: m.hash, pcmSha256: m.pcmSha256, rmsDb: m.rmsDb };
    text = patchTrackMeasures(text, id, after);
    rows.push({ id, textDe: t.textDe, before, after, attempts });
  }
  return { text, rows };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const ids = args.filter((a) => !a.startsWith("--"));
  if (ids.length === 0) {
    console.error("الاستخدام: npx tsx tools/regen-track.ts <trackId>... [--dry-run]");
    process.exit(2);
  }
  const path = join(ROOT, MANIFEST_REL);
  const { text, rows } = regenTracks({ ids, manifestText: readFileSync(path, "utf8"), contentRoot: join(ROOT, "content"), dryRun });
  for (const r of rows)
    console.log(`${dryRun ? "·" : "↻"} ${r.id} «${r.textDe}» ${r.before.durationMs}ms → ${r.after.durationMs}ms${r.attempts > 1 ? ` (${r.attempts} محاولات)` : ""}`);
  if (!dryRun) writeFileSync(path, text);
  console.log(dryRun ? "(تشغيل تجريبي — لم يُكتب شيء)" : `✓ ${rows.length} مسار — المانيفست محدَّث`);
}
