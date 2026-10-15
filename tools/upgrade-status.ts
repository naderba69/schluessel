// tools/upgrade-status.ts — حالة ترقية الدروس (D114 → حارس D115): ما رُقّي وما بقي وما ينقص بالضبط
// التشغيل:
//   npx tsx tools/upgrade-status.ts                      ملخص كل خطة + الدرس التالي + أخطاء الحارس
//   npx tsx tools/upgrade-status.ts --lesson a1-u1-d1    ما ينقص كل جزء ليصير done (قائمة عمل المنتِج)
// سريع (بلا تجزئة الصوت) — المدقِّق الكامل يشغّل الفحوص نفسها: npm run validate:content
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadAudioTracks, loadGrammarRules, loadLessons, loadUpgradePlans, loadWords } from "./lib/content-disk.js";
import {
  PRACTICE_ITEMS_MIN, PRACTICE_TYPES_MIN, QUIZ_ITEMS_MIN, REQUIRED_STATION_TYPES,
  checkGrammarRules, checkUpgrade, upgradeStatus, type UpgradeContext,
} from "./lib/lesson-upgrade.js";

const mark = (s: string) => (s === "done" ? "✓" : "·");

function main() {
  const args = process.argv.slice(2);
  const content = join(resolve(dirname(fileURLToPath(import.meta.url)), ".."), "content");
  const ctx: UpgradeContext = {
    lessons: loadLessons(content), words: loadWords(content), rules: loadGrammarRules(content), tracks: loadAudioTracks(content),
  };
  const li = args.indexOf("--lesson");
  let errors = checkGrammarRules(ctx).filter((i) => i.level === "error").length;
  for (const plan of loadUpgradePlans(content)) {
    const st = upgradeStatus(plan, ctx);
    if (li >= 0) {
      const s = st.find((x) => x.lessonId === args[li + 1]);
      if (!s) continue;
      console.log(`${s.lessonId} — قاعدة ${mark(s.rule)} ${s.rule} · تطبيق ${mark(s.practice)} ${s.practice} · Quiz ${mark(s.quiz)} ${s.quiz}`);
      const r = s.report;
      if (!r) { console.log("  الدرس غير موجود"); process.exit(1); }
      console.log(`  التطبيق الآن: ${r.practiceItems} بنداً (≥${PRACTICE_ITEMS_MIN}) · الأنواع: ${r.practiceTypes.join("، ")} (≥${PRACTICE_TYPES_MIN}، منها ${REQUIRED_STATION_TYPES.join(" و")}) · أقل نسخة Quiz: ${r.quizMin} (≥${QUIZ_ITEMS_MIN})`);
      for (const part of ["rule", "practice", "quiz", "coverage", "misspellings"] as const) {
        const issues = r[part];
        console.log(`  ${part}: ${issues.length === 0 ? "يستوفي معايير done ✓" : `${issues.length} نقص`}`);
        for (const i of issues.slice(0, 12)) console.log(`    - [${i.code}] ${i.message}`);
        if (issues.length > 12) console.log(`    … و${issues.length - 12} أخرى`);
      }
      return;
    }
    const count = (k: "rule" | "practice" | "quiz") => st.filter((s) => s[k] === "done").length;
    const full = st.filter((s) => s.rule === "done" && s.practice === "done" && s.quiz === "done").length;
    const next = st.find((s) => !(s.rule === "done" && s.practice === "done" && s.quiz === "done"));
    console.log(`${plan.id} (${plan.decision}) — ${st.length} درس محتوى · الوحدات ${plan.scope.fromUnit}–${plan.scope.toUnit}`);
    console.log(`  القاعدة ${count("rule")}/${st.length} · التطبيق ${count("practice")}/${st.length} · Quiz ${count("quiz")}/${st.length} · مكتمل ${full}/${st.length}`);
    if (next) console.log(`  التالي: ${next.lessonId} (npx tsx tools/upgrade-status.ts --lesson ${next.lessonId})`);
    const issues = checkUpgrade(plan, ctx);
    const errs = issues.filter((i) => i.level === "error");
    errors += errs.length;
    for (const i of issues.slice(0, 20)) console.log(`  ${i.level === "error" ? "✗" : "!"} [${i.code}] ${i.message}`);
    if (issues.length > 20) console.log(`  … و${issues.length - 20} أخرى`);
  }
  if (li >= 0) { console.error(`لا درس في خطط الترقية: ${args[li + 1]}`); process.exit(1); }
  for (const i of checkGrammarRules(ctx)) console.log(`  ${i.level === "error" ? "✗" : "!"} [${i.code}] ${i.message}`);
  console.log(`قواعد اليوم المكتوبة: ${ctx.rules.size}`);
  if (errors > 0) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
