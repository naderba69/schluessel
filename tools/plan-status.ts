// tools/plan-status.ts — حالة خطط التوزيع المنهجية (D112): ما أُنتج وما بقي ومن أين يبدأ الدرس القادم
// التشغيل:
//   npx tsx tools/plan-status.ts                      ملخص كل خطة + الدرس التالي بكلماته المخططة
//   npx tsx tools/plan-status.ts --lesson a1-u1-d2    كلمات درس واحد — نواة أو تكملة (نقطة بداية مواصفات المولِّد)
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CurriculumPlan, type CurriculumPlan as PlanT } from "../content/schemas/index.js";
import { loadLessons, loadWordlists, loadWords } from "./lib/content-disk.js";
import { coreStatus, planStatus } from "./lib/curriculum-plan.js";

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
    const cs = coreStatus(plan, ctx);
    const fixes = plan.core?.textFixes ?? [];
    if (li >= 0) {
      const c = cs.find((x) => x.lessonId === args[li + 1]);
      if (c) {
        console.log(`${c.lessonId} (نواة ${plan.decision} · ${c.status} · ${c.size} كلمة الآن → ${c.size + (c.status === "done" ? 0 : c.missing.length)}) — كلمات رئيسية من ${plan.sourceList}:`);
        for (const h of c.headwords) console.log(`  ${c.missing.includes(h) ? "○" : "●"} ${h}`);
        for (const f of fixes.filter((f) => c.headwords.includes(f.headword))) console.log(`  ✎ إصلاح نص (${f.status}): ${f.source} — ${f.reason}`);
        return;
      }
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
    if (cs.length) {
      const coreWords = cs.reduce((n, c) => n + c.headwords.length, 0);
      const coreTaught = cs.reduce((n, c) => n + c.headwords.length - c.missing.length, 0);
      console.log(`  النواة داخل الدروس القائمة: ${cs.filter((c) => c.status === "done").length}/${cs.length} إسناداً done · ${coreTaught}/${coreWords} كلمة مُعلَّمة · إصلاحات النص: ${fixes.filter((f) => f.status === "done").length}/${fixes.length}`);
      const nextCore = cs.find((c) => c.status === "pending");
      if (nextCore) console.log(`  التالي (نواة): ${nextCore.lessonId} — ${nextCore.headwords.join(" · ")}`);
    }
    console.log(`  التكملة (${plan.supplementMode === "receptive" ? "للفهم" : "إنتاجية"}) — دروس المحتوى: ${done.length}/${content_.length} · التوليف: ${st.filter((s) => s.kind === "integration" && s.produced).length}/${st.length - content_.length} · الكلمات الرئيسية المُعلَّمة: ${taught}/${words}`);
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
