// tools/lib/content-disk.ts — تحميل المحتوى من القرص للأدوات (D107)
// src/lesson-packs.ts يستعمل import.meta.glob (Vite/Vitest فقط) — الأدوات تعمل بـtsx عارياً،
// فتقرأ الملفات نفسها بالمخططات نفسها وبترتيب المسار نفسه (LEVEL_ORDER ثم الوحدة ثم اليوم).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ArsenalFile, AudioManifest, GrammarRuleFile, Lesson, LessonUpgradePlan, OfficialWordlist, Word,
  type GrammarRuleFile as RuleT, type Lesson as LessonT, type LessonUpgradePlan as UpgradeT, type OfficialWordlist as WordlistT, type Word as WordT,
} from "../../content/schemas/index.js";

const LEVEL_ORDER: Record<string, number> = { A1: 0, A2: 1, B1: 2, B2: 3 };

/**
 * D197: خطأ مخطط في ملف واحد (why بلا عربية · canDoDaily > 2 …) كان يُسقط كل الأدوات بتتبّع Zod خام بلا اسم ملف.
 * هنا: اسم الملف + المسار داخل JSON + الرسالة — في سطر واحد لكل خلل، ثم إيقاف (لا تجاهل صامت).
 */
export function parseFile<T>(schema: { safeParse: (d: unknown) => { success: true; data: T } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } } }, path: string, data: unknown): T {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  const rel = path.replace(/^.*?content\//, "content/");
  const lines = r.error.issues.slice(0, 12).map((i) => `  • ${i.path.map(String).join(".") || "(الجذر)"}: ${i.message}`);
  throw new Error(`مخطط غير صالح — ${rel} (${r.error.issues.length} خلل):\n${lines.join("\n")}${r.error.issues.length > 12 ? "\n  …" : ""}`);
}

export function loadWords(contentRoot: string): WordT[] {
  const dir = join(contentRoot, "words");
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
    .map((f) => parseFile(Word, join(dir, f), JSON.parse(readFileSync(join(dir, f), "utf8"))));
}

export function loadLessons(contentRoot: string): LessonT[] {
  const root = join(contentRoot, "lessons");
  const out: LessonT[] = [];
  for (const lvl of readdirSync(root).sort()) {
    const dir = join(root, lvl);
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json")).sort())
      out.push(parseFile(Lesson, join(dir, f), JSON.parse(readFileSync(join(dir, f), "utf8"))));
  }
  return out.sort((a, b) => LEVEL_ORDER[a.level]! - LEVEL_ORDER[b.level]! || a.unit - b.unit || a.day - b.day);
}

/** D110: فهارس قوائم Goethe الرسمية (content/wordlists/*.json) — مرتبة بالمعرّف؛ [] إن غاب المجلد */
export function loadWordlists(contentRoot: string): WordlistT[] {
  const dir = join(contentRoot, "wordlists");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
    .map((f) => parseFile(OfficialWordlist, join(dir, f), JSON.parse(readFileSync(join(dir, f), "utf8"))));
}

const jsonFiles = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).sort() : []);
const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

/** D115: قواعد اليوم (content/arsenal/grammar/*.json — kind=shufra) بالمعرّف */
export function loadGrammarRules(contentRoot: string): Map<string, RuleT> {
  const dir = join(contentRoot, "arsenal", "grammar");
  const out = new Map<string, RuleT>();
  for (const f of jsonFiles(dir)) {
    const data = readJson(join(dir, f));
    if (ArsenalFile.parse(data).kind !== "shufra") continue;
    const r = parseFile(GrammarRuleFile, join(dir, f), data);
    out.set(r.id, r);
  }
  return out;
}

/** D115: خطط ترقية الدروس (content/upgrades/*.json) */
export function loadUpgradePlans(contentRoot: string): UpgradeT[] {
  const dir = join(contentRoot, "upgrades");
  return jsonFiles(dir).map((f) => parseFile(LessonUpgradePlan, join(dir, f), readJson(join(dir, f))));
}

/** مسارات المانيفستات الصوتية: المعرّف ← النص المنطوق (للتحقق من بنود الاستماع/الإملاء) */
export function loadAudioTracks(contentRoot: string): Map<string, { textDe: string }> {
  const dir = join(contentRoot, "manifests");
  const out = new Map<string, { textDe: string }>();
  for (const f of jsonFiles(dir).filter((x) => x.startsWith("audio-manifest")))
    for (const t of AudioManifest.parse(readJson(join(dir, f))).tracks) out.set(t.id, { textDe: t.textDe });
  return out;
}
