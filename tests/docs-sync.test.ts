// tests/docs-sync.test.ts — D186: DECISIONS.md مصدر وحيد للتوثيق · الأقسام المولَّدة محدَّثة · سجل §10 سليم بأداته
import { describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const py = (args: string[]) => spawnSync("python3", args, { cwd: ROOT, encoding: "utf8" });

describe("D186 — docs-sync: المولَّد من DECISIONS.md مطابق للملفات", () => {
  it("كل كتلة ≥D186 مهيكلة (الدفعة · الموجّه · للقارئ · البوابة · التالي) · الدفعات متتابعة · الإصدار يتزايد", () => {
    const out = execFileSync("python3", ["tools/dev/docs-sync.py", "--json"], { cwd: ROOT, encoding: "utf8" });
    const r = JSON.parse(out) as { decisions: { d: number; batch: number; version: string; reader: string }[]; errors: string[] };
    expect(r.errors).toEqual([]);
    expect(r.decisions.length).toBeGreaterThanOrEqual(1);
    expect(r.decisions[0]!.d).toBe(186);
    expect(r.decisions[0]!.batch).toBe(141);
    for (const d of r.decisions) expect(d.reader.length, `D${d.d} للقارئ`).toBeGreaterThan(80);
  });

  it("--check أخضر: CHANGELOG/PROGRESS/STATE ورأس الموجّه مولَّدة من آخر قرار — لا تحرير يدوي", () => {
    const r = py(["tools/dev/docs-sync.py", "--check"]);
    expect(r.stdout + r.stderr, r.stdout).toContain("محدَّث");
    expect(r.status).toBe(0);
  });

  it("العلامتان في الملفات الأربعة مرة واحدة · التاريخ المجمَّد تحتهما معلَن", () => {
    for (const f of ["CHANGELOG.md", "PROGRESS.md", "STATE.md", "docs/PROFESSIONAL_CONTINUATION_PROMPT_AR.md"]) {
      const t = readFileSync(join(ROOT, f), "utf8");
      expect(t.split("<!-- docs-sync:start -->").length - 1, f).toBe(1);
      expect(t.split("<!-- docs-sync:end -->").length - 1, f).toBe(1);
    }
    expect(readFileSync(join(ROOT, "CHANGELOG.md"), "utf8")).toContain("التاريخ المجمَّد");
    const prompt = readFileSync(join(ROOT, "docs/PROFESSIONAL_CONTINUATION_PROMPT_AR.md"), "utf8");
    expect(prompt.split("<!-- docs-sync:current:start -->").length - 1).toBe(1);
    expect(prompt).toMatch(/^\*\*الإصدار الحالي:\*\* \d+\.\d+ \(/mu);
  });

  it("notes.py check سليم (نفس قواعد owner-notes.test.ts — أداة واحدة للكتابة)", () => {
    const r = py(["tools/dev/notes.py", "check"]);
    expect(r.stdout).toContain("notes: سليم");
    expect(r.status).toBe(0);
  });
});
