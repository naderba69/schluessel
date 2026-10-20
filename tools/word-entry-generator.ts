// tools/word-entry-generator.ts — مولِّد مدخل الكلمة (D105): مواصفة مختصرة ← ملف كلمة كامل + صوتها + مسارها
// التشغيل:  npx tsx tools/word-entry-generator.ts <specs.json> [--dry-run] [--no-audio]
// المبادئ: (1) أعلام الخطر من الرسم + النطق المقيس (phonemize.py — الصوت المثبَّت) لا التخمين — §5
// (2) zod قبل الكتابة: لا ملف كلمة غير صالح أبداً · (3) لا كتابة فوق كلمة موجودة · (4) الصوت بالشكل الكامل الحقيقي
// (D102: لا بدائل ASCII) ومقاطع الكلمات ≤1.5s (حتى 3 محاولات — VITS عشوائي) · (5) السجل تلقائي (D105 —
// import.meta.glob) فلا خطوة تسجيل · (6) كل شيء يُحسب ويُتحقق منه أولاً ثم يُكتب دفعة واحدة.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import { Word, WordClass, Level, AudioManifest } from "../content/schemas/index.js";
import { UNIT_MAX } from "../content/schemas/common.js";
import { VOICE_ID, WORD_CLIP_MAX_SEC } from "../src/lib/audio.js";
import { SRS_TARGETS } from "./validate-content.js";
import {
  slugify, nounGender, lemmaOf, detectPhoneticRisks, detectGrammarRisks, cardTypesFor,
  isFunctionWord, clipText, srsDistance, reannotate, citationForm,
} from "./lib/word-entry.js";
import { loadWordlists } from "./lib/content-disk.js";
import { deriveGoetheList, describeEvidence, evidenceFor, indexWordlists, sameLevels } from "./lib/goethe-lists.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const RiskList = Word.shape.grammarRisks;
const PhonList = Word.shape.phoneticRisks;

/** المواصفة المختصرة — ما يكتبه الإنسان فقط (الباقي يُستنتج) */
export const WordSpec = z.object({
  de: z.string().min(1),
  ar: z.array(z.string().min(1)).min(1),
  wordClass: WordClass,
  level: Level,
  /** D204: 1–12 الخطة الأساسية · 13–14 تكملة SD1 للفهم (D113) — لا كلمة جديدة في 15 */
  unit: z.number().int().min(1).max(UNIT_MAX),
  lesson: z.string().regex(/^[ab][12]-u\d+-d\d+$/),
  thema: z.string().min(1),
  sample: z.object({ de: z.string().min(1), ar: z.string().min(1) }),
  plural: z.string().optional(),
  pluralRuleNote: z.string().optional(),
  /** D136: كلمة جمع فقط (Eltern/Großeltern) — تُحفظ الصيغة من دون «needs-ein» المفردة. */
  pluralOnly: z.boolean().optional(),
  forms: Word.shape.forms,
  /** D110: يُشتق آلياً من فهارس Goethe الرسمية (content/wordlists) — إن كُتب فيجب أن يطابق الدليل */
  goetheList: z.array(Level).optional(),
  /** إضافات يدوية تحتاج معنى (feste-praep, dative-verb, needs-es-dummy…) — تُدمج مع المستنتج */
  grammarRisks: RiskList.optional(),
  phoneticRisks: PhonList.optional(),
  chunk: z.boolean().default(false),
  /**
   * D204: كلمة استقبالية (تكملة SD1 — الوحدتان 13–14، D113): بطاقة فهم بلا بطاقة إنتاج —
   * المتعلم يفهمها في اللافتة/الإعلان/الاستمارة ولا يُطالَب بإنتاجها (قاعدة e-plan-receptive).
   */
  receptive: z.boolean().default(false),
  functionWord: z.boolean().default(false),
  wordFamily: z.array(z.string()).default([]),
  /**
   * D126: معرّف صريح للمتجانسَين وحدهما (das Leben بجانب الفعل leben — المعرّف الآلي «leben» مأخوذ).
   * يُرفض إن ساوى الآلي، أو لم يحوِه (يبقى المعرّف قابلاً للبحث)، أو كان الآلي حراً (لا تسمية حرة تكسر الاصطلاح).
   */
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
}).strict();
export type WordSpec = z.infer<typeof WordSpec>;

export type Planned = { word: Word; ipa: string; clipText: string };

/** IPA لكل نص — استدعاء Python واحد للدفعة كلها */
export function phonemizeAll(texts: string[]): string[] {
  if (texts.length === 0) return [];
  const out = execFileSync("python3", [join(ROOT, "tools/phonemize.py"), ...texts], { encoding: "utf8", timeout: 120_000 });
  return (JSON.parse(out) as { ipa: string }[]).map((r) => r.ipa);
}

/**
 * D140: الشكل المنطوق من حقل de — بلا الشرح بين القوسين (اصطلاح المتجانسات: «sein (ملكيته)» · «ihr (ملكيتها)»).
 * منه وحده: النطق المقيس وأعلام الخطر ونص المقطع والمعرّف الآلي — كما يُسقط التدقيق (citationForm) واختبار D102
 * الشرحَ («بلا الشرح بين القوسين»). البدائل «/» تبقى كما كانت (المقطع ينطقها كلها). قبل D140 كان المولِّد يرسل
 * «ihr (ملكيتها)» كاملة إلى espeak وإلى نص المقطع.
 */
export const spokenForm = (de: string): string => de.replace(/\s*\(.*?\)\s*/g, " ").trim();

/** من المواصفة إلى كلمة كاملة صالحة (بلا قرص — مختبرة) */
export function planWord(spec: WordSpec, ipa: string): Planned {
  const g = nounGender(spec.de);
  if (spec.wordClass === "noun" && !g) throw new Error(`اسم بلا أداة: «${spec.de}» — اكتب der/die/das (D57)`);
  const spoken = spokenForm(spec.de);
  const forms = [spec.forms?.praesens3s, spec.forms?.perfekt, spec.forms?.praeteritum, spec.plural].filter((x): x is string => !!x);
  const phoneticRisks = [...new Set([...detectPhoneticRisks(spoken, ipa, forms), ...(spec.phoneticRisks ?? [])])].sort();
  const grammarRisks = [...new Set([...detectGrammarRisks(spec), ...(spec.grammarRisks ?? [])])].sort();
  // D136: pluralia tantum keep their article (article: die) but have no singular gender label or gender-only SRS card.
  const gender = spec.pluralOnly ? "none" : g?.gender ?? "none";
  const draft = {
    schemaVersion: "1.0.0",
    id: spec.id ?? slugify(spoken),
    de: spec.de,
    ...(g ? { article: g.article } : {}),
    gender,
    ...(spec.plural ? { plural: spec.plural } : {}),
    ...(spec.pluralRuleNote ? { pluralRuleNote: spec.pluralRuleNote } : {}),
    ar: spec.ar,
    wordClass: spec.wordClass,
    ...(spec.forms ? { forms: spec.forms } : {}),
    phoneticRisks,
    grammarRisks,
    chunk: spec.chunk,
    wordFamily: spec.wordFamily,
    sampleSentence: { de: spec.sample.de, ar: spec.sample.ar, sourceLesson: spec.lesson },
    level: spec.level,
    unit: spec.unit,
    goetheList: spec.goetheList ?? [],
    thema: spec.thema,
    isFunctionWord: isFunctionWord(spec.wordClass, spec.functionWord),
    usedInLessons: [spec.lesson],
    srsCardTypes: cardTypesFor({ wordClass: spec.wordClass, gender, chunk: spec.chunk, receptive: spec.receptive }, phoneticRisks),
  };
  return { word: Word.parse(draft), ipa, clipText: clipText(spoken) };
}

export type GenerateClip = (text: string, outAbs: string) => { durationMs: number; sizeBytes: number; hash: string; pcmSha256: string; rmsDb: number };

export const piperClip: GenerateClip = (text, outAbs) =>
  JSON.parse(execFileSync("python3", [join(ROOT, "tools/gen-audio.py"), "one", text, outAbs], { encoding: "utf8", timeout: 120_000 }).trim().split("\n").at(-1)!);

export type GenReport = { planned: Planned[]; written: boolean; srsDistanceByLevel: Record<string, number> };

export function runGenerator(opts: {
  specs: unknown[]; contentRoot?: string; dryRun?: boolean; noAudio?: boolean;
  phonemize?: (texts: string[]) => string[]; clip?: GenerateClip; genAudioPy?: string;
}): GenReport {
  const content = opts.contentRoot ?? join(ROOT, "content");
  const specs = opts.specs.map((s, i) => {
    const r = WordSpec.safeParse(s);
    if (!r.success) throw new Error(`مواصفة ${i + 1} غير صالحة: ${r.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join(" · ")}`);
    return r.data;
  });
  const ipas = (opts.phonemize ?? phonemizeAll)(specs.map((s) => lemmaOf(spokenForm(s.de))));
  const planned = specs.map((s, i) => planWord(s, ipas[i]!));

  // D110: goetheList من الدليل لا من الإنسان — المواصفة التي تكتبها تُقارَن بالدليل وتُرفض إن خالفته
  const lists = loadWordlists(content);
  if (lists.length > 0) {
    const ixs = indexWordlists(lists);
    for (const [i, p] of planned.entries()) {
      const derived = deriveGoetheList(p.word, ixs);
      const given = specs[i]!.goetheList;
      if (given && !sameLevels(given, derived))
        throw new Error(`goetheList للمواصفة ${i + 1} («${specs[i]!.de}») = ${JSON.stringify(given)} والدليل = ${JSON.stringify(derived)} — ${describeEvidence(evidenceFor(p.word, ixs))}. احذف الحقل: يُشتق آلياً (D110)`);
      p.word = Word.parse({ ...p.word, goetheList: derived });
    }
  }

  // D126: المعرّف الصريح للمتجانسات وحدها — بعد التحقق من أن الآلي مأخوذ فعلاً (ملفاً أو داخل الدفعة)
  for (const [i, s] of specs.entries()) {
    if (!s.id) continue;
    const auto = slugify(spokenForm(s.de));
    const where = `المواصفة ${i + 1} («${s.de}»)`;
    if (s.id === auto) throw new Error(`${where}: المعرّف الصريح «${s.id}» يساوي الآلي — احذفه`);
    if (!s.id.includes(auto)) throw new Error(`${where}: المعرّف الصريح «${s.id}» لا يحوي «${auto}» — اجعله مثل «das-${auto}» ليبقى قابلاً للبحث`);
    const taken = existsSync(join(content, `words/${auto}.json`)) || specs.some((o, j) => j !== i && (o.id ?? slugify(spokenForm(o.de))) === auto);
    if (!taken) throw new Error(`${where}: معرّف صريح بلا تجانس — «${auto}» حر، فاحذف id (D126)`);
  }

  // لا تكرار داخل الدفعة ولا كتابة فوق كلمة موجودة
  const seen = new Set<string>();
  for (const p of planned) {
    if (seen.has(p.word.id)) throw new Error(`معرّف مكرر في الدفعة: ${p.word.id}`);
    seen.add(p.word.id);
    if (existsSync(join(content, `words/${p.word.id}.json`))) throw new Error(`الكلمة موجودة: ${p.word.id} — لا كتابة فوقها`);
  }

  // w-srs-ratio بعد الإضافة لكل مستوى (نفس صيغة المدقِّق)
  const manifestPath = join(content, "manifests/audio-manifest.a1-u1.json");
  const wordsDir = join(content, "words");
  const existing: [string, string[]][] = existsSync(wordsDir)
    ? readdirSync(wordsDir).filter((f) => f.endsWith(".json")).map((f) => {
        const w = JSON.parse(readFileSync(join(wordsDir, f), "utf8")) as { level: string; srsCardTypes: string[] };
        return [w.level, w.srsCardTypes];
      })
    : [];
  const srsDistanceByLevel: Record<string, number> = {};
  for (const level of new Set(planned.map((p) => p.word.level))) {
    const lists = [...existing.filter(([l]) => l === level).map(([, c]) => c), ...planned.filter((p) => p.word.level === level).map((p) => p.word.srsCardTypes)];
    srsDistanceByLevel[level] = Math.round(srsDistance(lists, SRS_TARGETS[level]!) * 1000) / 1000;
  }
  if (opts.dryRun) return { planned, written: false, srsDistanceByLevel };

  // الصوت أولاً (قبل أي كتابة) — مقطع الكلمة ≤1.5s حتى 3 محاولات
  const rawText = readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(rawText) as { tracks: Record<string, unknown>[] };
  const newTracks: Record<string, unknown>[] = [];
  if (!opts.noAudio) {
    const clip = opts.clip ?? piperClip;
    for (const p of planned) {
      const rel = `words/audio/de-DE/word-${p.word.id}.opus`;
      let m = clip(p.clipText, join(content, rel));
      for (let attempt = 2; attempt <= 3 && m.durationMs > WORD_CLIP_MAX_SEC * 1000; attempt++) m = clip(p.clipText, join(content, rel));
      if (m.durationMs > WORD_CLIP_MAX_SEC * 1000) throw new Error(`مقطع ${p.word.id} أطول من ${WORD_CLIP_MAX_SEC}s بعد 3 محاولات — قصّر النص`);
      newTracks.push({
        id: `word-${p.word.id}`, file: rel, role: "word", isGuest: false,
        voiceParams: { speaker: VOICE_ID, speedWpm: 110 }, textDe: p.clipText, priority: "P2",
        lessonRefs: [p.word.usedInLessons[0]], ...m,
      });
    }
    // مسارات الكلمات متجاورة: قبل أول مسار غير كلمة (الإعلان/السكربتات)
    const firstNonWord = manifest.tracks.findIndex((t) => t.role !== "word");
    manifest.tracks.splice(firstNonWord === -1 ? manifest.tracks.length : firstNonWord, 0, ...newTracks);
    AudioManifest.parse(manifest); // لا مانيفست مكسور أبداً
  }

  // الكتابة دفعة واحدة
  for (const p of planned) writeFileSync(join(content, `words/${p.word.id}.json`), JSON.stringify(p.word, null, 2) + "\n", "utf8");
  if (!opts.noAudio) {
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + (rawText.endsWith("\n") ? "\n" : ""), "utf8");
    // قائمة gen-audio.py (مصدر إعادة البناء) تبقى متزامنة
    const py = opts.genAudioPy ?? join(ROOT, "tools/gen-audio.py");
    if (existsSync(py)) {
      const src = readFileSync(py, "utf8");
      const anchor = "    ]\n    char_tracks = [";
      if (!src.includes(anchor)) throw new Error("لم أجد نهاية قائمة word_tracks في gen-audio.py");
      const lines = planned.map((p) => `    ("word-${p.word.id}", ${JSON.stringify(p.clipText)}, "${p.word.id}", ["${p.word.usedInLessons[0]}"]),\n`).join("");
      writeFileSync(py, src.replace(anchor, lines + anchor), "utf8");
    }
  }
  return { planned, written: true, srsDistanceByLevel };
}

export type AuditRow = { id: string; de: string; ipa: string; old: string[]; risks: string[]; added: string[]; removed: string[] };

/** D106: تدقيق أعلام الخطر لكل الكلمات الموجودة (وإعادة وسمها عند apply) — كل شيء يُحسب ثم يُكتب */
export function auditRisks(opts: { contentRoot?: string; apply?: boolean; phonemize?: (t: string[]) => string[] } = {}): AuditRow[] {
  const dir = join(opts.contentRoot ?? join(ROOT, "content"), "words");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  const raws = files.map((f) => readFileSync(join(dir, f), "utf8"));
  const words = raws.map((r) => Word.parse(JSON.parse(r)));
  const ipas = (opts.phonemize ?? phonemizeAll)(words.map((w) => lemmaOf(citationForm(w.de))));
  const rows = words.map((w, i) => {
    const de = citationForm(w.de);
    const { risks, added, removed } = reannotate(w.phoneticRisks, detectPhoneticRisks(de, ipas[i]!), de, ipas[i]!);
    return { id: w.id, de: w.de, ipa: ipas[i]!, old: w.phoneticRisks, risks, added, removed };
  });
  if (opts.apply) {
    const updates = rows.map((r, i) => {
      if (r.added.length === 0 && r.removed.length === 0) return null;
      const obj = JSON.parse(raws[i]!) as Record<string, unknown>;
      obj.phoneticRisks = r.risks;
      Word.parse(obj); // لا ملف غير صالح
      return { file: join(dir, files[i]!), text: JSON.stringify(obj, null, 2) + (raws[i]!.endsWith("\n") ? "\n" : "") };
    });
    for (const u of updates) if (u) writeFileSync(u.file, u.text, "utf8");
  }
  return rows;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.includes("--audit") || args.includes("--reannotate")) {
    const rows = auditRisks({ apply: args.includes("--reannotate") });
    const changed = rows.filter((r) => r.added.length || r.removed.length);
    const tally = (k: "added" | "removed") => {
      const t: Record<string, number> = {};
      for (const r of rows) for (const x of r[k]) t[x] = (t[x] ?? 0) + 1;
      return Object.entries(t).sort((a, b) => b[1] - a[1]).map(([x, n]) => `${x}:${n}`).join(" ");
    };
    console.log(`كلمات: ${rows.length} | تتغير: ${changed.length}`);
    console.log(`أُضيف (مكتشَف بالقياس): ${tally("added") || "—"}`);
    console.log(`أُسقط (مستحيل رسماً/نطقاً): ${tally("removed") || "—"}`);
    for (const r of changed.slice(0, 12)) console.log(`  ${r.de} [${r.ipa}]  −${r.removed.join(",") || "∅"}  +${r.added.join(",") || "∅"}`);
    console.log(args.includes("--reannotate") ? "✓ كُتبت التعديلات" : "(تدقيق فقط — لم يُكتب شيء)");
    process.exit(0);
  }
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error("الاستخدام: npx tsx tools/word-entry-generator.ts <specs.json> [--dry-run] [--no-audio]");
    process.exit(2);
  }
  let r: GenReport;
  try {
    const specs = JSON.parse(readFileSync(resolve(file), "utf8")) as unknown[];
    r = runGenerator({ specs, dryRun: args.includes("--dry-run"), noAudio: args.includes("--no-audio") });
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`); // رسالة واضحة بلا أثر مكدس — ولا شيء كُتب
    process.exit(1);
  }
  for (const p of r.planned)
    console.log(`${r.written ? "✓" : "·"} ${p.word.id.padEnd(16)} [${p.ipa}]  صوتي: ${p.word.phoneticRisks.join(",") || "—"}  نحوي: ${p.word.grammarRisks.join(",") || "—"}  بطاقات: ${p.word.srsCardTypes.join(",")}`);
  for (const [lvl, d] of Object.entries(r.srsDistanceByLevel))
    console.log(`w-srs-ratio ${lvl}: المسافة ${d} ${d > 0.35 ? "⚠ تتجاوز 0.35" : "✓ ≤ 0.35"}`);
  if (!r.written) console.log("(تشغيل تجريبي — لم يُكتب شيء)");
}
