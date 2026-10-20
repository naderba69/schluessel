// tools/move-unit.ts — نقل وحدة دروس كاملة إلى رقم آخر مع كل الإشارات إليها (D112)
// التشغيل:
//   npx tsx tools/move-unit.ts --level a1 --from 13 --to 17 --dry-run   يعرض ما سيتغير
//   npx tsx tools/move-unit.ts --level a1 --from 13 --to 17             ينفّذ
// لماذا أداة لا استبدال يدوي: المعرّف يظهر في ملفات الدروس وفي usedInLessons لعشرات الكلمات، و326 ملف محتوى
// ليست JSON قياسياً — فإعادة التسلسل تغيّر تنسيقها. الأداة تستبدل **نصياً** المعرّف المقتبس بالضبط وحقل unit
// الأعلى في الدرس المنقول، ثم **تثبت** لكل ملف أن JSON بعد = JSON قبل مع تطبيق خريطة المعرّفات وحدها (وإلا توقف).
import { readdirSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

export interface MoveSpec { level: string; from: number; to: number }
export interface FileEdit { path: string; newPath: string; before: string; after: string; replacements: number }

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PLAN_DIR = /^plans\//;

/** يطبّق خريطة المعرّفات على كل قيمة نصية تساوي معرّفاً بالضبط (للتحقق لا للكتابة) */
function mapIds(v: unknown, ids: Map<string, string>): unknown {
  if (typeof v === "string") return ids.get(v) ?? v;
  if (Array.isArray(v)) return v.map((x) => mapIds(x, ids));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, mapIds(x, ids)]));
  return v;
}

/** الخطة الكاملة للنقل — دالة نقية على نصوص الملفات (المسار نسبي عن content/) */
export function planUnitMove(files: Map<string, string>, spec: MoveSpec): FileEdit[] {
  const lv = spec.level.toLowerCase();
  const LV = spec.level.toUpperCase();
  if (!Number.isInteger(spec.from) || !Number.isInteger(spec.to) || spec.from < 1 || spec.to < 1 || spec.from === spec.to)
    throw new Error(`مواصفة نقل غير صالحة: ${JSON.stringify(spec)}`);
  const lessonDir = `lessons/${lv}/`;
  const ids = new Map<string, string>();
  const movedPaths = new Set<string>();
  for (const [path, text] of files) {
    if (!path.startsWith(lessonDir) || !path.endsWith(".json")) continue;
    const j = JSON.parse(text) as { id?: string; level?: string; unit?: number; day?: number };
    if (j.level !== LV) continue;
    if (j.unit === spec.to) throw new Error(`الوحدة ${spec.to} مشغولة: ${j.id} — لا نقل فوق دروس موجودة`);
    if (j.unit !== spec.from) continue;
    const expected = `${lv}-u${spec.from}-d${j.day}`;
    if (j.id !== expected || path !== `${lessonDir}${expected}.json`)
      throw new Error(`درس لا يتبع اصطلاح المعرّف/المسار: ${path} (${j.id}) — المتوقع ${expected}`);
    ids.set(expected, `${lv}-u${spec.to}-d${j.day}`);
    movedPaths.add(path);
  }
  if (ids.size === 0) throw new Error(`لا دروس ${LV} في الوحدة ${spec.from}`);

  const edits: FileEdit[] = [];
  for (const [path, before] of files) {
    if (!path.endsWith(".json")) continue;
    // خطط التوزيع (plans/) تسمّي خانات دروس **مستقبلية** لا إشارات إلى دروس موجودة: خطة D112 تخطط a1-u13-d1..d6
    // جديدة بالضبط حيث كان أسبوع الامتحان — إعادة كتابتها كانت ستنقل الخطة مع الامتحان. المدقِّق يتحقق من اتساقها.
    if (PLAN_DIR.test(path)) continue;
    let after = before;
    let replacements = 0;
    for (const [oldId, newId] of ids) {
      const re = new RegExp(`"${escape(oldId)}"`, "g");
      after = after.replace(re, () => { replacements++; return `"${newId}"`; });
    }
    const moved = movedPaths.has(path);
    if (moved) {
      const re = new RegExp(`^(  "unit":\\s*)${spec.from}(,?)$`, "m"); // الحقل الأعلى وحده (إزاحة مسافتين)
      if (!re.test(after)) throw new Error(`${path}: لم يُعثر على حقل unit الأعلى`);
      after = after.replace(re, `$1${spec.to}$2`);
      replacements++;
    }
    if (after === before) continue;
    // البرهان: لا تغيّر سوى المعرّفات (وحقل unit في الدرس المنقول)
    const expected = mapIds(JSON.parse(before), ids) as Record<string, unknown>;
    if (moved) expected.unit = spec.to;
    if (!isDeepStrictEqual(JSON.parse(after), expected)) throw new Error(`${path}: الاستبدال النصي غيّر أكثر من المعرّفات — توقف`);
    const newPath = moved ? `${lessonDir}${ids.get(path.slice(lessonDir.length, -".json".length))!}.json` : path;
    edits.push({ path, newPath, before, after, replacements });
  }
  // لا إشارة متبقية إلى معرّف قديم في أي ملف
  const touched = new Map(edits.map((e) => [e.path, e.after]));
  for (const [path, text] of files)
    if (!PLAN_DIR.test(path)) for (const oldId of ids.keys())
      if ((touched.get(path) ?? text).includes(`"${oldId}"`)) throw new Error(`${path}: إشارة متبقية إلى ${oldId}`);
  return edits;
}

function loadJsonTree(root: string): Map<string, string> {
  const out = new Map<string, string>();
  const walk = (dir: string) => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith(".json")) out.set(relative(root, full).replace(/\\/g, "/"), readFileSync(full, "utf8"));
    }
  };
  walk(root);
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const val = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const level = val("--level"), from = Number(val("--from")), to = Number(val("--to"));
  if (!level || !from || !to) {
    console.error("الاستعمال: npx tsx tools/move-unit.ts --level a1 --from 13 --to 17 [--dry-run]");
    process.exit(2);
  }
  const root = join(resolve(dirname(fileURLToPath(import.meta.url)), ".."), "content");
  const edits = planUnitMove(loadJsonTree(root), { level, from, to });
  const renames = edits.filter((e) => e.newPath !== e.path);
  console.log(`${edits.length} ملفاً · ${renames.length} درساً يُنقل · ${edits.reduce((n, e) => n + e.replacements, 0)} استبدالاً`);
  for (const e of renames) console.log(`  ${e.path} → ${e.newPath}`);
  if (args.includes("--dry-run")) return;
  for (const e of edits) {
    writeFileSync(join(root, e.path), e.after, "utf8");
    if (e.newPath !== e.path) renameSync(join(root, e.path), join(root, e.newPath));
  }
  console.log("نُفِّذ — شغّل المدقِّق والاختبارات");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
