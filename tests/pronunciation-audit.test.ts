// tests/pronunciation-audit.test.ts — بوابة النطق الدائمة (D122): كل كلمة تُنطق في مسار منشور أو في مفردات المحتوى
// تُقاس بالصوت المثبَّت (بعد معجم النطق) مقابل مرجع حر — المخالفة بلا قرار (تصحيح في المعجم أو مراجعة مكتوبة السبب)
// تُسقط البوابة. فكلمات الدروس القادمة تُدقَّق آلياً لحظة إضافتها، لا حين يتذكر أحد.
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");
const AUDIT = join(ROOT, "tools/pronunciation-audit.py");

type Report = {
  words: number;
  compared: number;
  stale: string[];
  flagged: { word: string; kinds: string[]; espeak: string; reference: string[] }[];
  reviewedStale: string[];
  reviewedDrift: string[];
};

/** يحمّل أداة التدقيق وحدةً (pa) ويشغّل شيفرة Python عليها — الناتج JSON */
const py = (body: string): unknown =>
  JSON.parse(
    execFileSync(
      "python3",
      [
        "-c",
        [
          "import importlib.util, json, sys, tempfile, pathlib",
          `spec = importlib.util.spec_from_file_location("pa", ${JSON.stringify(AUDIT)})`,
          "pa = importlib.util.module_from_spec(spec); spec.loader.exec_module(pa)",
          body,
        ].join("\n"),
      ],
      { encoding: "utf8", timeout: 180_000, maxBuffer: 64 * 1024 * 1024 },
    ),
  );

describe("D122 — بوابة تدقيق النطق", () => {
  it("المحتوى الحقيقي: صفر مخالفة بلا قرار · المقتطف يغطي كل كلمة · لا مراجعة ميتة ولا منحرفة", () => {
    const r = JSON.parse(execFileSync("python3", [AUDIT, "--json"], { encoding: "utf8", timeout: 180_000, maxBuffer: 64 * 1024 * 1024 })) as Report;
    expect(r.stale, "كلمات غائبة عن المقتطف — شغّل --refresh-reference").toEqual([]);
    expect(r.flagged, "مخالفة نطق بلا قرار — صحّحها في المعجم أو راجعها بسبب مكتوب").toEqual([]);
    expect(r.reviewedStale).toEqual([]);
    expect(r.reviewedDrift).toEqual([]);
    expect(r.words).toBeGreaterThan(900);
    expect(r.compared / r.words).toBeGreaterThan(0.99); // التدقيق يقارن فعلاً لا يتخطى
  });

  it("المقاييس: طول الحركة المنبورة وموضع النبر — وأنصاف الحركات والصيغ البديلة لا تُحتسب مخالفة", () => {
    const r = py(
      [
        "cases = {",
        "  'Kurs': ('kˈuːɾs', ['kʊʁs']),",
        "  'Hotel': ('hˈoːtəl', ['hoˈtɛl']),",
        "  'Hallo': ('hˈaloː', ['haˈloː']),",
        "  'der': ('dɛɾ', ['deːɐ̯']),",
        "  'Portion': ('pɔɾtsjˈoːn', ['pɔʁˈt͡si̯oːn']),",
        "  'Kreditkarte': ('kreːdˈɪtkˌaɾtə', ['kʁeˈdiːtˌkaʁtə', 'kʁeˈdɪtˌkaʁtə']),",
        "  'Tunesien': ('tˌuːneːzˈiːən', ['tuˈneːzi̯ən']),",
        "  'Tunesien-fixed': ('tuːnˈeːzɪʲən', ['tuˈneːzi̯ən']),",
        "}",
        "print(json.dumps({k: pa.compare(e, r) for k, (e, r) in cases.items()}))",
      ].join("\n"),
    ) as Record<string, string[]>;
    expect(r).toEqual({
      Kurs: ["length"],
      Hotel: ["length", "stress"], // انتقال النبر يجعل «الحركة المنبورة» حركةً أخرى: oː الطويلة عند espeak مقابل ɛ القصيرة
      Hallo: ["length", "stress"],
      der: ["length"],
      Portion: [], // i̯ نصف حركة لا نواة المقطع المنبور
      Kreditkarte: [], // يكفي أن توافق صيغةٌ واحدة من صيغ المرجع
      Tunesien: ["stress"],
      "Tunesien-fixed": [],
    });
  });

  it("البوابة تلتقط: حذف مدخل Tunesien ← مخالفة نبر · مراجعة بنطق قديم ← انحراف · مراجعة زائدة ← ميتة · كلمة غائبة عن المقتطف ← قديم", () => {
    const r = py(
      [
        "lex = json.loads(pa.ga.PRON_LEXICON.read_text(encoding='utf-8'))",
        "ref = json.loads(pa.REFERENCE.read_text(encoding='utf-8'))",
        "lex['entries'] = [e for e in lex['entries'] if e['word'] != 'Tunesien']",
        "for r in lex['reviewed']:",
        "    if r['word'] == 'Hallo': r['espeak'] = 'hˈaloː-alt'",
        "lex['reviewed'].append({'word': 'Kurs', 'verdict': 'variant', 'espeak': 'kˈʊɐs', 'note': 'مراجعة زائدة لاختبار البوابة فقط'})",
        "del ref['words']['Hotel']",
        "d = pathlib.Path(tempfile.mkdtemp())",
        "(d / 'lex.json').write_text(json.dumps(lex, ensure_ascii=False), encoding='utf-8')",
        "(d / 'ref.json').write_text(json.dumps(ref, ensure_ascii=False), encoding='utf-8')",
        "pa.ga.PRON_LEXICON = d / 'lex.json'; pa.ga._LEXICON = None; pa.REFERENCE = d / 'ref.json'",
        "out = pa.audit()",
        "print(json.dumps({k: out[k] for k in ('stale', 'reviewedStale', 'reviewedDrift')} | {'flagged': [(f['word'], f['kinds']) for f in out['flagged']]}, ensure_ascii=False))",
      ].join("\n"),
    ) as { stale: string[]; flagged: [string, string[]][]; reviewedStale: string[]; reviewedDrift: string[] };
    expect(r.flagged).toEqual([["Tunesien", ["stress"]]]);
    expect(r.reviewedDrift).toEqual(["Hallo"]);
    expect(r.reviewedStale).toEqual(["Kurs"]);
    expect(r.stale).toEqual(["Hotel"]);
  });

  it("المقتطف: الترخيص والإسناد ونسخة المرجع المثبَّتة · refresh يرفض نسخة ببصمة أخرى · بصمة git كما يحسبها git", () => {
    const ref = JSON.parse(readFileSync(join(ROOT, "tools/pronunciation-reference.de.json"), "utf8")) as {
      license: string; attribution: string; source: { gitBlob: string }; words: Record<string, { key: string | null; ipa: string[] }>;
    };
    const lex = JSON.parse(readFileSync(join(ROOT, "tools/pronunciation-lexicon.json"), "utf8")) as { reference: { gitBlob: string } };
    expect(ref.license).toBe("CC-BY-SA");
    expect(ref.attribution).toMatch(/Wiktionary/);
    expect(ref.attribution).toMatch(/german-ipa-dict/);
    expect(ref.source.gitBlob).toBe(lex.reference.gitBlob);
    for (const [w, v] of Object.entries(ref.words)) if (v.key === null) expect(v.ipa, w).toEqual([]);
    const r = py(
      [
        "d = pathlib.Path(tempfile.mkdtemp()); f = d / 'de.txt'; f.write_text('Hotel\\t/hoˈtɛl/\\n', encoding='utf-8')",
        "try:",
        "    pa.refresh_reference(str(f)); refused = None",
        "except SystemExit as e:",
        "    refused = str(e)",
        "print(json.dumps({'refused': refused, 'blob': pa.git_blob_sha(b'hello\\n')}, ensure_ascii=False))",
      ].join("\n"),
    ) as { refused: string | null; blob: string };
    expect(r.refused).toMatch(/≠ المثبَّتة/);
    expect(r.blob).toBe("ce013625030ba8dba906f756967f9e9ca394464a"); // git hash-object لـ "hello\n"
  });
});
