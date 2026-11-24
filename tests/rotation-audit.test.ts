// tests/rotation-audit.test.ts — D575: عدّاد التدوير الإجباري (§7 قواعد المركز + §17 G1 كشف الخلل)
// «كل نص جديد يُفحص بعدّاد التدوير (≥7 مواجهات لكل كلمة)» — والعدّاد أداة تشغيل حقيقية تُنفَّذ لا تُفترض.
import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";

type RotationReport = {
  threshold: number;
  words: number;
  textsScanned: number;
  ok: number;
  deficient: number;
  worst: { id: string; de: string; count: number }[];
};

function run(): RotationReport {
  const out = execFileSync("python3", ["tools/dev/rotation-audit.py", "--json"], { encoding: "utf-8", maxBuffer: 1 << 24 });
  return JSON.parse(out) as RotationReport;
}

describe("D575 — عدّاد التدوير ≥7 (§7): الأداة تُنفَّذ وتُحسِب بصدق", () => {
  it("الحدّ الدستوري 7 والتقرير متسق (ok + deficient = words)", () => {
    const r = run();
    expect(r.threshold).toBe(7); // §7: ≥7 مواجهات لكل كلمة
    expect(r.words).toBeGreaterThan(2000); // المخزون كله يُحسب
    expect(r.textsScanned).toBeGreaterThan(10000); // نصوص المحتوى كلها تُفحص
    expect(r.ok + r.deficient).toBe(r.words);
  });

  it("كشف الحقن: الناقص تحت الحدّ ومرتّب بالعجز — وكلمة ≥7 لا تظهر فيه", () => {
    const r = run();
    for (const w of r.worst) expect(w.count).toBeLessThan(r.threshold);
    for (let i = 1; i < r.worst.length; i++) expect(r.worst[i]!.count).toBeGreaterThanOrEqual(r.worst[i - 1]!.count);
    // الحالة الحالية المعلنة صراحة: 13 كلمة ناقصة (5 منها صيغ sein المفصول لا تُعدّ في النصوص)
    expect(r.deficient).toBeLessThanOrEqual(20);
    expect(r.deficient).toBeGreaterThan(0); // لا ادّعاء اكتمال زائف — القائمة قائمة والحقن قادم
  });
});
