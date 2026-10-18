// tools/dev/story-sentences.ts — مولِّد جمل القصة (D193 — N-003 · قرار المالك D182 Q3 أ)
// القصة المتصلة = أول سطر في حوار كل درس، مرتّباً بترتيب الدروس. لا نصّ يُكتب يدوياً:
//   npx tsx tools/dev/story-sentences.ts --write    يكتب content/story/<level>.json ويضبط praesentation.storySentenceIds في كل درس
//   npx tsx tools/dev/story-sentences.ts --check    يفشل (رمز 1) إن كان الملف أو حقول الدروس غير مطابقة للحوارات الحالية
// الحارس الدائم في validate-content (e-story-*) — هذا الأمر للكتابة وللفحص السريع.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { AudioScript, Lesson, StoryBook, type StorySentence } from "../../content/schemas/index.js";

const ROOT = join(import.meta.dirname, "..", "..");
const CONTENT = join(ROOT, "content");
const args = process.argv.slice(2);
const WRITE = args.includes("--write");

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf8")) as unknown;
const canon = (o: unknown) => JSON.stringify(o, null, 2) + "\n";

/** درس ← معرّف جملته: story-a1-u6-s4 (النمط القائم منذ D114 — لا يتغير) */
export const storyIdFor = (l: { level: string; unit: number; day: number }) => `story-${l.level.toLowerCase()}-u${l.unit}-s${l.day}`;

/** يبني دفاتر القصة من الحوارات — حوار واحد لكل درس (usedIn) · أول سطر */
export function buildStory(contentRoot: string): { books: Map<string, StoryBook>; lessonIds: Map<string, string[]>; lessonPaths: Map<string, string> } {
  const scripts = readdirSync(join(contentRoot, "audio-scripts")).filter((f) => f.endsWith(".json"))
    .map((f) => AudioScript.parse(readJson(join(contentRoot, "audio-scripts", f))))
    .filter((s) => s.kind === "dialogue");
  const byLesson = new Map<string, typeof scripts[number]>();
  for (const s of scripts) for (const u of s.usedIn) {
    if (byLesson.has(u)) throw new Error(`درس له حواران: ${u} (${byLesson.get(u)!.id} · ${s.id}) — القصة تأخذ حواراً واحداً`);
    byLesson.set(u, s);
  }
  const lessons: { path: string; lesson: Lesson }[] = [];
  for (const lvl of readdirSync(join(contentRoot, "lessons")).sort())
    for (const f of readdirSync(join(contentRoot, "lessons", lvl)).filter((x) => x.endsWith(".json")).sort()) {
      const path = join(contentRoot, "lessons", lvl, f);
      lessons.push({ path, lesson: Lesson.parse(readJson(path)) });
    }
  lessons.sort((a, b) => a.lesson.level.localeCompare(b.lesson.level) || a.lesson.unit - b.lesson.unit || a.lesson.day - b.lesson.day);

  const books = new Map<string, StoryBook>();
  const lessonIds = new Map<string, string[]>();
  const lessonPaths = new Map<string, string>();
  for (const { path, lesson } of lessons) {
    lessonPaths.set(lesson.id, path);
    const sc = byLesson.get(lesson.id);
    if (!sc) { lessonIds.set(lesson.id, []); continue; }
    const first = sc.lines[0]!;
    if (first.speaker === "announcer") throw new Error(`أول سطر في حوار ${sc.id} للمذيع — ليس جملة قصة`);
    const s: StorySentence = { id: storyIdFor(lesson), lessonId: lesson.id, scriptId: sc.id, lineId: first.id, speaker: first.speaker, de: first.text, contextAr: sc.title.ar };
    const key = lesson.level.toLowerCase();
    const book = books.get(key) ?? { schemaVersion: "1.0.0", id: `story-${key}`, level: lesson.level, sentences: [] };
    book.sentences.push(s);
    books.set(key, book);
    lessonIds.set(lesson.id, [s.id]);
  }
  for (const b of books.values()) StoryBook.parse(b);
  return { books, lessonIds, lessonPaths };
}

/** الفروق بين المشتق والموجود على القرص — فارغ = مطابق */
export function storyDrift(contentRoot: string): string[] {
  const { books, lessonIds, lessonPaths } = buildStory(contentRoot);
  const out: string[] = [];
  const dir = join(contentRoot, "story");
  const onDisk = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")) : [];
  for (const [key, book] of books) {
    const p = join(dir, `${key}.json`);
    if (!existsSync(p)) { out.push(`content/story/${key}.json مفقود`); continue; }
    if (readFileSync(p, "utf8") !== canon(book)) out.push(`content/story/${key}.json لا يطابق الحوارات الحالية — شغّل story-sentences --write`);
  }
  for (const f of onDisk) if (!books.has(f.replace(/\.json$/, ""))) out.push(`content/story/${f} بلا دروس`);
  for (const [id, ids] of lessonIds) {
    const raw = readJson(lessonPaths.get(id)!) as { praesentation: { storySentenceIds?: string[] } };
    const cur = raw.praesentation.storySentenceIds ?? [];
    if (JSON.stringify(cur) !== JSON.stringify(ids)) out.push(`${id}: storySentenceIds ${JSON.stringify(cur)} والمشتق ${JSON.stringify(ids)}`);
  }
  return out;
}

if (process.argv[1] && /story-sentences\.ts$/.test(process.argv[1])) {
  if (WRITE) {
    const { books, lessonIds, lessonPaths } = buildStory(CONTENT);
    mkdirSync(join(CONTENT, "story"), { recursive: true });
    let changedLessons = 0;
    for (const [key, book] of books) writeFileSync(join(CONTENT, "story", `${key}.json`), canon(book), "utf8");
    for (const [id, ids] of lessonIds) {
      const p = lessonPaths.get(id)!;
      const raw = readJson(p) as { praesentation: { storySentenceIds?: string[] } };
      if (JSON.stringify(raw.praesentation.storySentenceIds ?? []) === JSON.stringify(ids)) continue;
      raw.praesentation.storySentenceIds = ids;
      writeFileSync(p, canon(raw), "utf8");
      changedLessons++;
    }
    const n = [...books.values()].reduce((a, b) => a + b.sentences.length, 0);
    const empty = [...lessonIds.values()].filter((x) => x.length === 0).length;
    console.log(`story-sentences: ${n} جملة في ${books.size} دفتر · دروس عُدّلت ${changedLessons} · دروس بلا حوار بعدُ ${empty}`);
  } else {
    const drift = storyDrift(CONTENT);
    if (drift.length) { console.error(`story-sentences --check: ${drift.length} فرق\n  ` + drift.join("\n  ")); process.exit(1); }
    console.log("story-sentences --check: مطابق ✓");
  }
}
