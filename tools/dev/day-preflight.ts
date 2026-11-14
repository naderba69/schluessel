// tools/dev/day-preflight.ts — الفحص المسبق ليوم الإنتاج (D517 — تطوير!)
// يُشفّر فخاخ N-333→N-342 كلها في أداة واحدة تُشغَّل قبل البوابة على درس جديد:
//   npx tsx tools/dev/day-preflight.ts <lesson-id>   (مثال: b2-u1-d1)
// الفحوص (كلها من حوادث حقيقية مسجّلة في §10):
//   P1  كثافة البنود ≥12 (N-342)
//   P2  بطاقات الإنذار = 3 بالضبط وكلها تحوي «10» (خريطة التداخل — اختبار المحتوى)
//   P3  بند المطابقة الأول ≥3 أزواج (N-333/N-337 — تكرر ثلاث مرات!)
//   P4  اختبارات ≥3 متغيرات
//   P5  كل كلمة مستدعاة (interleavedWith / warmup) موجودة فعلاً في content/words (تطبيع ae/oe/ue — N-309/N-340)
//   P6  بنود الخطأ: مشطوبة ~~…~~ + تصحيح + سبب
//   P7  روابط duden ≥ عدد كلمات الدرس وبنمط rechtschreibung
//   P8  ملفات الكلمات: kollocation ⇔ srsCardTypes · جمع للجمع · تصريف للفعل
//   P9  مراجع الصوت = word-<id> ومسارها موجود في المانيفست
//   P10 قيد الترقية: fixedPhrases ≤2 (المخطط يفرضه هنا مبكراً)
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const CONTENT = join(ROOT, "content");
const problems: string[] = [];
const oks: string[] = [];

const norm = (w: string) => w.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");

function taughtIds(): Set<string> {
  const s = new Set<string>();
  for (const f of readdirSync(join(CONTENT, "words"))) if (f.endsWith(".json")) s.add(norm(f.replace(/\.json$/, "")));
  return s;
}

function main(): void {
  const id = process.argv[2];
  if (!id) { console.log("الاستعمال: npx tsx tools/dev/day-preflight.ts <lesson-id>"); process.exit(2); }
  const level = id.slice(0, 2);
  const path = join(CONTENT, "lessons", level, `${id}.json`);
  if (!existsSync(path)) { console.log(`✗ لا درس بالمعرّف ${id}`); process.exit(2); }
  const L = JSON.parse(readFileSync(path, "utf8"));
  const words: Record<string, unknown>[] = (L.praesentation?.wordIds ?? []).map((w: string) =>
    JSON.parse(readFileSync(join(CONTENT, "words", `${w}.json`), "utf8")));
  const taught = taughtIds();

  // P1 كثافة البنود
  const items = (L.uebung?.stations ?? []).flatMap((s: { items: unknown[] }) => s.items);
  if (items.length >= 12) oks.push(`P1 الكثافة: ${items.length} بنداً (≥12)`); else problems.push(`P1 الكثافة: ${items.length} بنداً فقط — الحد 12 (N-342)`);

  // P2 بطاقات الإنذار
  const wc = L.zusammenfassung?.warningCards ?? [];
  if (wc.length === 3 && wc.every((c: { whyArabicSpeakerFails: string }) => String(c.whyArabicSpeakerFails).includes("10")))
    oks.push("P2 الإنذار: 3 بطاقات وكلها تحوي «10»"); else problems.push(`P2 الإنذار: ${wc.length} بطاقة أو بطاقة بلا «10»`);

  // P3 المطابقة
  const match = (L.uebung?.stations ?? []).find((s: { type: string }) => s.type === "match");
  const firstPairs = match?.items?.[0]?.pairs?.length ?? 0;
  if (firstPairs >= 3) oks.push(`P3 المطابقة: البند الأول ${firstPairs} أزواج (≥3)`); else problems.push(`P3 المطابقة: البند الأول ${firstPairs} أزواج — الحد 3 (N-333/N-337)`);

  // P4 الاختبارات
  const variants = L.quiz?.variants?.length ?? 0;
  if (variants >= 3) oks.push(`P4 الاختبار: ${variants} متغيرات`); else problems.push(`P4 الاختبار: ${variants} متغيرات فقط`);

  // P5 الكلمات المستدعاة موجودة
  const called: string[] = [
    ...(L.warmup?.cardIds ?? []),
    ...((L.uebung?.stations ?? []).flatMap((s: { interleavedWith?: string[] }) => s.interleavedWith ?? [])),
  ];
  const missing = [...new Set(called)].filter((w) => !taught.has(norm(w)));
  if (missing.length === 0) oks.push(`P5 الاستدعاء: ${new Set(called).size} كلمة مستدعاة كلها موجودة`); else problems.push(`P5 الاستدعاء: غير موجودة: ${missing.join(" · ")} (N-305!)`);

  // P6 بنود الخطأ
  const errs = (L.uebung?.stations ?? []).filter((s: { type: string }) => s.type === "error-hunt").flatMap((s: { items: { q: string; a: string; why: string }[] }) => s.items);
  const badErr = errs.filter((e: { q: string; a: string; why: string }) => !String(e.q).includes("~~") || !e.a || !e.why);
  if (errs.length > 0 && badErr.length === 0) oks.push(`P6 الخطأ: ${errs.length} بنداً مشطوبة مكتملة`); else problems.push(`P6 الخطأ: ${badErr.length} بند ناقص (شطب/تصحيح/سبب)`);

  // P7 روابط duden
  const duden: string[] = L.gReferences?.duden ?? [];
  const wordCount = (L.praesentation?.wordIds ?? []).length;
  const badLinks = duden.filter((u) => !/^https:\/\/www\.duden\.de\/rechtschreibung\//.test(u));
  if (duden.length >= wordCount && badLinks.length === 0) oks.push(`P7 duden: ${duden.length} رابطاً سليماً`); else problems.push(`P7 duden: ${duden.length} رابطاً لكلمات ${wordCount} أو نمط خاطئ`);

  // P8 ملفات الكلمات
  for (const w of words) {
    const hasKol = !!(w as { kollocation?: unknown }).kollocation;
    const cards: string[] = (w as { srsCardTypes?: string[] }).srsCardTypes ?? [];
    const wc2 = (w as { wordClass?: string }).wordClass;
    const idw = (w as { id?: string }).id;
    if (hasKol !== cards.includes("kollocation")) problems.push(`P8 ${idw}: kollocation ⇔ srsCardTypes غير متطابقين`);
    if (wc2 === "noun" && !(w as { plural?: string }).plural) problems.push(`P8 ${idw}: اسم بلا plural`);
    if (wc2 === "verb" && !(w as { forms?: unknown }).forms) problems.push(`P8 ${idw}: فعل بلا forms`);
    if (wc2 === "noun" && (w as { article?: string }).article && !(w as { gender?: string }).gender) problems.push(`P8 ${idw}: اسم بأداة بلا gender`);
  }
  if (!problems.some((p) => p.startsWith("P8"))) oks.push(`P8 الكلمات: ${words.length} ملفات متسقة`);

  // P9 مراجع الصوت
  const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8"));
  const trackIds = new Set<string>(manifest.tracks.map((t: { id: string }) => t.id));
  const refs: string[] = L.audioManifestRefs ?? [];
  const badRefs = refs.filter((r) => !trackIds.has(r));
  if (refs.length === wordCount && badRefs.length === 0) oks.push(`P9 الصوت: ${refs.length} مرجعاً كلها في المانيفست`); else problems.push(`P9 الصوت: مراجع ناقصة أو غير موجودة: ${badRefs.join(" · ")}`);

  // P10 قيد الترقية
  const upDir = join(CONTENT, "upgrades");
  let entry: { fixedPhrases?: unknown[] } | undefined;
  for (const f of readdirSync(upDir)) {
    if (!f.endsWith(".json")) continue;
    const u = JSON.parse(readFileSync(join(upDir, f), "utf8"));
    entry = (u.lessons ?? []).find((e: { lessonId: string }) => e.lessonId === id);
    if (entry) break;
  }
  if (!entry) problems.push(`P10 الترقية: لا قيد لهذا الدرس في content/upgrades/`);
  else if ((entry.fixedPhrases?.length ?? 0) > 2) problems.push(`P10 الترقية: fixedPhrases ${(entry.fixedPhrases?.length)} > 2`);
  else oks.push("P10 الترقية: القيد موجود وfixedPhrases ≤2");

  for (const o of oks) console.log("✓", o);
  for (const p of problems) console.log("✗", p);
  console.log(problems.length === 0 ? `preflight ${id}: نظيف (${oks.length} فحوصات)` : `preflight ${id}: ${problems.length} مشكلة`);
  process.exit(problems.length === 0 ? 0 : 1);
}

main();
