// tests/dev-tools.test.ts — أدوات الفحص داخل المستودع (N-104) + بوابة سرعة الكلام (قرار المالك على N-015 — D182)
import { describe, it, expect } from "vitest";
import { parseFile } from "../tools/lib/content-disk.js";
import { Lesson } from "../content/schemas/index.js";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");

describe("tools/dev — N-104: أدوات الفحص لا تضيع مع الصندوق", () => {
  it("أدوات tools/dev موجودة ومذكورة في README · .dev-cache في .gitignore", () => {
    const tools = ["fetch-official.sh", "check-lesson.ts", "speech-rate.py", "owner-review.py", "docs-sync.py", "notes.py", "gate.ts", "content-diff.ts", "hooks/pre-push", "lexicon-sync.py", "check-duden-links.py", "listening-sample.py", "bootstrap.sh", "content-index.py", "build-phrase-bank.ts"];
    for (const f of [...tools, "README.md"]) expect(existsSync(join(ROOT, "tools/dev", f)), f).toBe(true);
    const readme = readFileSync(join(ROOT, "tools/dev/README.md"), "utf8");
    for (const f of tools) expect(readme).toContain(f);
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

describe("D182/D214 — سرعة الكلام ناعمة (report-only): العتبة 200 تُبلَّغ ولا توقف — وكل معلَّم مذكور في DECISIONS.md", () => {
  it("speech-rate.py --json: المقيس كل المسارات ذات النص · المعلَّم يُطبَع ويُذكَر في القرارات (D214: ناعم بأمر المالك D185 — لا ضبط ولا إعادة)", () => {
    const out = execFileSync("python3", ["tools/dev/speech-rate.py", "--json"], { cwd: ROOT, encoding: "utf8" });
    const r = JSON.parse(out) as { threshold: number; minWords: number; measured: number; flagged: { id: string; wpm: number }[]; byRole: Record<string, { tracks: number; meanWpm: number; max: number }> };
    expect(r.threshold).toBe(200);
    expect(r.minWords).toBe(3);
    expect(r.measured).toBeGreaterThan(2000);
    expect(r.byRole.dialogue!.tracks).toBeGreaterThan(1000);
    console.log("flagged:", JSON.stringify(r.flagged.map((f) => `${f.id} ${f.wpm}`)));
    const log = readFileSync(join(ROOT, "DECISIONS.md"), "utf8");
    for (const f of r.flagged) expect(log, f.id).toContain(f.id);
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

describe("D187 — البوابة الواحدة وفرق المحتوى والخطّاف الحقيقي", () => {
  it("package.json: gate · content:diff · hooks:install — ولا husky ميّت", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string>; devDependencies: Record<string, string> };
    expect(pkg.scripts.gate).toBe("tsx tools/dev/gate.ts");
    expect(pkg.scripts["content:diff"]).toBe("tsx tools/dev/content-diff.ts");
    expect(pkg.scripts["hooks:install"]).toContain("core.hooksPath tools/dev/hooks");
    expect(existsSync(join(ROOT, ".husky"))).toBe(false);
    expect(pkg.devDependencies.husky).toBeUndefined();
  });

  it("خطّاف pre-push قابل للتنفيذ · يمنع main · يشغّل البوابة", () => {
    const p = join(ROOT, "tools/dev/hooks/pre-push");
    expect(existsSync(p)).toBe(true);
    expect(statSync(p).mode & 0o111).not.toBe(0);
    const sh = readFileSync(p, "utf8");
    expect(sh).toContain("refs/heads/main");
    expect(sh).toContain("tools/dev/gate.ts");
  });

  it("D197: خطأ مخطط في ملف محتوى يُقرأ — اسم الملف + المسار + الرسالة (لا تتبّع Zod خام)", () => {
    const lesson = JSON.parse(readFileSync(join(ROOT, "content/lessons/a1/a1-u6-d6.json"), "utf8")) as { canDoDaily: string[] };
    lesson.canDoDaily.push("ثالث");
    expect(() => parseFile(Lesson, "/x/content/lessons/a1/a1-u6-d6.json", lesson)).toThrow(/content\/lessons\/a1\/a1-u6-d6\.json \(1 خلل\):\n {2}• canDoDaily: /u);
    expect(parseFile(Lesson, "/x/content/lessons/a1/a1-u6-d6.json", JSON.parse(readFileSync(join(ROOT, "content/lessons/a1/a1-u6-d6.json"), "utf8"))).id).toBe("a1-u6-d6");
  });
  it("D197: lexicon-sync.py --check متزامن (N-099 آلية) · package.json فيه bootstrap", () => {
    const out = execFileSync("python3", ["tools/dev/lexicon-sync.py", "--check"], { cwd: ROOT, encoding: "utf8", timeout: 60_000 });
    expect(out).toMatch(/lexicon-sync: متزامن — ناقص 0 · زائد 0/u);
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts.bootstrap).toBe("bash tools/dev/bootstrap.sh");
  }, 60_000); // D216: مهلة صريحة كسائر اختبارات العمليات — الخادم البطيء كان يوقّت الـ5s الافتراضية (CI فشل 784/785)
  it("D242 (N-050): content-index.py --check + build-phrase-bank.ts --check متزامنان — الفهرس والبنك من المحتوى الحي", () => {
    const idx = execFileSync("python3", ["tools/dev/content-index.py", "--check"], { cwd: ROOT, encoding: "utf8", timeout: 60_000 });
    expect(idx).toMatch(/محدَّث/);
    const bank = execFileSync("npx", ["tsx", "tools/dev/build-phrase-bank.ts", "--check"], { cwd: ROOT, encoding: "utf8", timeout: 120_000 });
    expect(bank).toMatch(/محدَّث/);
  }, 180_000);
  it("gate.ts --quick --json: كل خطوة لها معرّف وملخّص ورقم · التقرير بثلاثة أسطر", () => {
    // D235: DUDEN_LINKS=skip — vitest يختبر التوصيل لا الشبكة (الفحص الحقيقي خطوة البوابة وحدها) · والفشل يرفق مخرج البوابة المتداخلة
    let out: string;
    try {
      out = execFileSync("npx", ["tsx", "tools/dev/gate.ts", "--quick", "--json", "--did", "اختبار"], { cwd: ROOT, encoding: "utf8", timeout: 300_000, env: { ...process.env, DUDEN_LINKS: "skip" } });
    } catch (e) {
      const err = e as { stdout?: unknown; stderr?: unknown; message?: string };
      throw new Error(`البوابة المتداخلة سقطت — مخرجها:\n${String(err.stdout ?? "")}\n--- stderr ---\n${String(err.stderr ?? err.message ?? e)}`);
    }
    const r = JSON.parse(out) as { ok: boolean; quick: boolean; results: { id: string; ok: boolean; soft: boolean; summary: string }[]; report: string };
    expect(r.quick).toBe(true);
    expect(r.results.map((x) => x.id)).toEqual(["tsc", "validate", "docs", "notes", "audit", "lexicon", "links", "speech"]); // lexicon من D197 · links من D234
    expect(r.results.filter((x) => !x.ok && !x.soft)).toEqual([]); // D214: الناعم (speech) يُبلَّغ ولا يوقف — كمنطق البوابة نفسها
    expect(r.report.split("\n")).toHaveLength(3);
    expect(r.report).toContain("1. **ما نُفّذ:** اختبار");
    expect(r.report).toContain("3. **ما ينكسر:**");
  }, 300_000);

  it("D234 (N-028): check-duden-links.py --collect-only يجمع الروابط الفريدة بلا شبكة — كلها بنمط rechtschreibung", () => {
    const out = execFileSync("python3", ["tools/dev/check-duden-links.py", "--collect-only"], { cwd: ROOT, encoding: "utf8", timeout: 60_000 });
    const lines = out.trim().split("\n");
    expect(lines[0]).toMatch(/duden-links: (\d+) رابطاً فريداً/u);
    const urls = lines.slice(1);
    expect(urls.length).toBe(319); // D339: +2 (Einkaufszentrum · Schloss — عارٍ حيّ، متحقق قبل الدفع) // D338: +2 (Flohmarkt · Bibliothek — عارٍ حيّ، متحقق قبل الدفع) // D335: +2 (modern_neu_modisch · einig — العاري 404 فالمشتق، متحقق حياً) // D334: +2 (Unterschied · Gegenteil — عارٍ حيّ، متحقق قبل الدفع) // D333: +2 (Mittel_Arznei · Menge — متحقق حياً قبل الدفع، بلا N مفتوحة) // D332: Orange ← Orange_Frucht (متحقق حياً: مؤنث · die Orangen — أمسكه CI) // D330: +3 (Sprechstunde · Krankenschwester · Orange — مشتق نمطياً، تحقق حيّ مؤجل N-190) // D329: Creme العاري 404 ← Creme_Salbe_Sueszspeise (متحقق حياً: مؤنث · die Cremes — أمسكه CI + قاعدة ß→sz في N-186) // D328: +3 (Creme · Parfuem · Kosmetik — تحققا حياً Parfuem/Kosmetik فأُغلقت N-185) // D327: +2 (Koerper · Magen — مشتق نمطياً، تحقق حيّ مؤجل N-183) // D324: +2 (berichten · beraten — مشتق نمطياً، تحقق حيّ مؤجل N-178) // D323: Zettel العاري 404 ← Zettel_Blatt_Papier_Notiz (متحقق حياً: مذكر · die Zettel — أمسكه CI) // D322: +3 (Krankheit · Fuehrerschein · Zettel — مشتق نمطياً، تحقق حيّ مؤجل N-175) // D321: +3 (versuchen · Passwort · Mailbox — مشتق نمطياً، تحقق حيّ مؤجل N-172 — Termin سقطت: مكررة من a1-u3-d4) // D320: +3 (Vertrag · Anzug · Interview — مشتق نمطياً، تحقق حيّ مؤجل N-171) // D319: +3 (Erlaubnis · Wettbewerb · Luege — مشتق نمطياً، تحقق حيّ مؤجل N-169) // D318: +3 (Bewerbung · Gehalt_Lohn · Buero — متحقق حياً) // D316: +2 (Stift_Schreibgeraet · Zeugnis — متحقق حياً) // D315: +3 (verreisen · singen · Witz — متحقق حياً) // D314: +3 (Ferien · streiten · Angst — متحقق حياً) // D313: +3 (Unterkunft · reiten · Zelt_Konstruktion) // D312: +3 (werden_Vollverb · weggehen · Erfahrung) // D238: 270 بعد حذف الميت — مثبت بدقة: أي رابط جديد يُحدّثه عمداً
    expect(new Set(urls).size).toBe(urls.length); // فريدة
    for (const u of urls) expect(u).toMatch(/^https:\/\/www\.duden\.de\/rechtschreibung\/(?:[A-Za-zÄÖÜäöüß_-]|%[0-9A-F]{2})+$/u);
  }, 60_000);

  it("D234 (N-011/N-122): listening-sample.py تشتق 29 مقطعاً حتمياً وتكتب وثيقة العينة", () => {
    const out = execFileSync("python3", ["tools/dev/listening-sample.py"], { cwd: ROOT, encoding: "utf8", timeout: 60_000 });
    expect(out.split("\n").filter((l) => /^\s*\d+\. \S+ /u.test(l))).toHaveLength(29); // D319: +Erlaubnis (العينة 29) // D318: +Projekt (العينة 28)
    expect(out).toContain("fc-11");
    expect(out).toContain("word-circa");
    expect(out).toContain("word-datum"); // D239: فئة الطول في العينة
    expect(out).toContain("word-job"); // D241: الإطباق النهائي في العينة
    const doc = readFileSync(join(ROOT, "docs/reports/listening-sample.md"), "utf8");
    expect(doc).toContain("fc-11");
    expect(doc.match(/☐ سليم/g)).toHaveLength(29); // D319: +Erlaubnis // D318: +Projekt
  }, 60_000);

  it("content-diff.ts --json بين التزامين: ملخّص + تقارير بنصوص قبل/بعد", () => {
    const out = execFileSync("npx", ["tsx", "tools/dev/content-diff.ts", "HEAD~1", "HEAD", "--json"], { cwd: ROOT, encoding: "utf8", timeout: 120_000 });
    const r = JSON.parse(out) as { summary: { from: string; to: string; files: number; texts: number }; reports: { file: string; texts: { path: string }[] }[] };
    expect(r.summary.from).toBe("HEAD~1");
    expect(r.reports.length).toBe(r.summary.files);
    for (const f of r.reports) expect(f.file.startsWith("content/"), f.file).toBe(true);
  }, 120_000);
});
