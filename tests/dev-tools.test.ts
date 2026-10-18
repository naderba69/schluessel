// tests/dev-tools.test.ts — أدوات الفحص داخل المستودع (N-104) + بوابة سرعة الكلام (قرار المالك على N-015 — D182)
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");

describe("tools/dev — N-104: أدوات الفحص لا تضيع مع الصندوق", () => {
  it("الملفات الأربعة موجودة ومذكورة في README · .dev-cache في .gitignore", () => {
    for (const f of ["fetch-official.sh", "check-lesson.ts", "speech-rate.py", "owner-review.py", "README.md"])
      expect(existsSync(join(ROOT, "tools/dev", f)), f).toBe(true);
    const readme = readFileSync(join(ROOT, "tools/dev/README.md"), "utf8");
    for (const f of ["fetch-official.sh", "check-lesson.ts", "speech-rate.py", "owner-review.py"]) expect(readme).toContain(f);
    expect(readFileSync(join(ROOT, ".gitignore"), "utf8")).toMatch(/^\.dev-cache\/$/m);
  });

  it("fetch-official.sh يقرأ البصمات من ملفات القوائم المثبَّتة لا من ثوابت مكتوبة", () => {
    const sh = readFileSync(join(ROOT, "tools/dev/fetch-official.sh"), "utf8");
    expect(sh).toContain("content/wordlists/goethe-a1-sd1.json");
    expect(sh).toContain("content/wordlists/goethe-a2.json");
    expect(sh).toContain("tools/pronunciation-reference.de.json");
    expect(sh).toContain("sha256sum");
    expect(sh).not.toMatch(/\b[0-9a-f]{40}\b/); // لا blob مكتوب يدوياً
  });

  it("check-lesson.ts يعمل على درس حقيقي ويعلن إن كانت المقارنة الرسمية متاحة", () => {
    const out = execFileSync("npx", ["tsx", "tools/dev/check-lesson.ts", "a1-u12-d5", "--json"], { cwd: ROOT, encoding: "utf8", timeout: 120_000 });
    const r = JSON.parse(out) as { summary: { lessonId: string; lines: number; names: string[]; officialAvailable: boolean }; hits: { line: string }[] };
    expect(r.summary.lessonId).toBe("a1-u12-d5");
    expect(r.summary.lines).toBeGreaterThan(100);
    expect(r.summary.names).toContain("Yusuf"); // من properNouns في ملف الترقية
    expect(typeof r.summary.officialAvailable).toBe("boolean");
    expect(r.hits.some((h) => h.line.includes("Thema"))).toBe(true);
  });
});

describe("D182 — سرعة الكلام: لا سطر منشور فوق 200 كلمة/دقيقة (≥3 كلمات)", () => {
  it("speech-rate.py --json: المقيس كل المسارات ذات النص · المعلَّم صفر", () => {
    const out = execFileSync("python3", ["tools/dev/speech-rate.py", "--json"], { cwd: ROOT, encoding: "utf8" });
    const r = JSON.parse(out) as { threshold: number; minWords: number; measured: number; flagged: { id: string; wpm: number }[]; byRole: Record<string, { tracks: number; meanWpm: number; max: number }> };
    expect(r.threshold).toBe(200);
    expect(r.minWords).toBe(3);
    expect(r.measured).toBeGreaterThan(2000);
    expect(r.flagged.map((f) => `${f.id} ${f.wpm}`)).toEqual([]);
    expect(r.byRole.dialogue!.tracks).toBeGreaterThan(1000);
    expect(r.byRole.dialogue!.max).toBeLessThanOrEqual(200);
    expect(r.byRole.word!.max).toBeLessThanOrEqual(200);
  });

  it("الأسطر المُبطَأة بـlengthScale خاص بالسطر مسجَّلة في المانيفست بالقيمة نفسها — ولا سطر أسرع من سكربته", () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, "content/manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; voiceParams: { lengthScale?: number } }[] };
    const byId = new Map(manifest.tracks.map((t) => [t.id, t]));
    let perLine = 0;
    for (const f of readdirSync(join(ROOT, "content/audio-scripts"))) {
      if (!f.endsWith(".json")) continue;
      const s = JSON.parse(readFileSync(join(ROOT, "content/audio-scripts", f), "utf8")) as { lengthScale: number; lines: { id: string; lengthScale?: number }[] };
      for (const l of s.lines) {
        if (l.lengthScale === undefined) continue;
        perLine++;
        expect(l.lengthScale, l.id).toBeGreaterThanOrEqual(s.lengthScale);
        expect(byId.get(l.id)?.voiceParams.lengthScale, l.id).toBe(l.lengthScale);
      }
    }
    expect(perLine).toBe(20); // 19 سطراً قاسها speech-rate فوق 200 في D182 + ki-6 (إملاء ≤132 بعد إعادة صياغته — D183)
  });
});
