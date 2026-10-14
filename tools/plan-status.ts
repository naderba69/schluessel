// tools/plan-status.ts — حالة خطط التوزيع المنهجية (D112): ما أُنتج وما بقي ومن أين يبدأ الدرس القادم
// التشغيل:
//   npx tsx tools/plan-status.ts                      ملخص كل خطة + الدرس التالي بكلماته المخططة
//   npx tsx tools/plan-status.ts --lesson a1-u13-d1   كلمات درس واحد (نقطة بداية مواصفات المولِّد)
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CurriculumPlan, type CurriculumPlan as PlanT } from "../content/schemas/index.js";
import { loadLessons, loadWordlists, loadWords } from "./lib/content-disk.js";
import { planStatus } from "./lib/curriculum-plan.js";

export function loadPlans(contentRoot: string): PlanT[] {
  const dir = join(contentRoot, "plans");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json")).sort()
    .map((f) => CurriculumPlan.parse(JSON.parse(readFileSync(join(dir, f), "utf8"))));
}

function main() {
  const args = process.argv.slice(2);
  const content = join(resolve(dirname(fileURLToPath(import.meta.url)), ".."), "content");
  const ctx = { words: loadWords(content), lessons: loadLessons(content), lists: loadWordlists(content) };
  const li = args.indexOf("--lesson");
  for (const plan of loadPlans(content)) {
    const st = planStatus(plan, ctx);
    if (li >= 0) {
      const s = st.find((x) => x.lessonId === args[li + 1]);
      if (!s) continue;
      console.log(`${s.lessonId} «${s.themeDe}» (${s.kind}${s.produced ? " · مُنتَج" : " · لم يُنتَج"}) — ${s.headwords.length} كلمة رئيسية من ${plan.sourceList}:`);
      for (const h of s.headwords) console.log(`  ${s.missing.includes(h) ? "○" : "●"} ${h}`);
      return;
    }
    const content_ = st.filter((s) => s.kind === "content");
    const done = content_.filter((s) => s.produced && s.missing.length === 0);
    const words = content_.reduce((n, s) => n + s.headwords.length, 0);
    const taught = content_.reduce((n, s) => n + (s.produced ? s.headwords.length - s.missing.length : 0), 0);
    console.log(`${plan.id} (${plan.decision}) — ${plan.title.ar}`);
    console.log(`  دروس المحتوى: ${done.length}/${content_.length} · التوليف: ${st.filter((s) => s.kind === "integration" && s.produced).length}/${st.length - content_.length} · الكلمات الرئيسية المُعلَّمة: ${taught}/${words}`);
    for (const u of plan.units) {
      const row = st.filter((s) => s.unit === u.unit).map((s) => `${s.produced ? (s.missing.length ? "◐" : "●") : "○"}d${s.day}`).join(" ");
      console.log(`  الوحدة ${u.unit} «${u.theme.de}»: ${row}`);
    }
    const next = st.find((s) => !s.produced);
    if (next) {
      console.log(`  التالي: ${next.lessonId} «${next.themeDe}»${next.headwords.length ? ` — ${next.headwords.join(" · ")}` : ""}`);
    } else console.log(`  الخطة مكتملة — أسبوع الامتحان: الوحدة ${plan.placement.examWeekUnit}`);
  }
  if (li >= 0) { console.error(`لا درس مخطط: ${args[li + 1]}`); process.exit(1); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
