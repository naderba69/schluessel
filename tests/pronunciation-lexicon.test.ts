// tests/pronunciation-lexicon.test.ts — معجم النطق (D121): أخطاء espeak-ng المقيسة تُصحَّح قبل النموذج
// الضمانات: (1) كل مدخل ما زال لازماً (espeak الخام ما زال يخطئ — وإلا يُحذف المدخل لا يبقى رقعة ميتة)
// (2) يُطبَّق في كل سياق معلن ولا يتغير في الجملة شيء غيره (3) لا يمس كلمة قريبة (حد الكلمة)
// (4) كل مسار منشور فيه كلمة من المعجم أُعيد توليده بعد إضافتها (لا صوت قديم خاطئ يبقى صامتاً)
// (5) رموز التصحيح معروفة لخريطتي الصوتين المثبَّتين (لا يُسقطها Piper صامتاً).
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const ROOT = join(__dirname, "..");

const Entry = z
  .object({
    word: z.string().regex(/^\p{L}+$/u),
    espeak: z.string().min(2),
    ipa: z.string().min(2),
    referenceIpa: z.string().regex(/^\/.+\/$/),
    analogy: z.string().min(10),
    contexts: z.array(z.string().min(1)).min(2),
    regeneratedTracks: z.array(z.string().min(1)).min(1),
  })
  .strict()
  .refine((e) => e.ipa !== e.espeak, "ipa = espeak — مدخل بلا تصحيح");
const Lexicon = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    decision: z.string().regex(/^D\d+$/),
    about: z.string().min(20),
    reference: z.object({ name: z.string(), license: z.string(), gitBlob: z.string().regex(/^[0-9a-f]{40}$/), url: z.string().url() }).strict(),
    entries: z.array(Entry).min(1),
  })
  .strict();

const lex = Lexicon.parse(JSON.parse(readFileSync(join(ROOT, "tools/pronunciation-lexicon.json"), "utf8")));

const phonemize = (texts: string[], raw = false): string[] =>
  (
    JSON.parse(
      execFileSync("python3", [join(ROOT, "tools/phonemize.py"), ...(raw ? ["--raw"] : []), ...texts], { encoding: "utf8", timeout: 120_000 }),
    ) as { ipa: string }[]
  ).map((r) => r.ipa);

/** يحمّل tools/gen-audio.py وحدةً ويشغّل شيفرة Python عليها — الناتج JSON */
const py = (body: string): unknown =>
  JSON.parse(
    execFileSync(
      "python3",
      [
        "-c",
        [
          "import importlib.util, json, sys",
          `spec = importlib.util.spec_from_file_location("ga", ${JSON.stringify(join(ROOT, "tools/gen-audio.py"))})`,
          "ga = importlib.util.module_from_spec(spec); spec.loader.exec_module(ga)",
          body,
        ].join("\n"),
      ],
      { encoding: "utf8", timeout: 120_000 },
    ),
  );

const wholeWord = (word: string) => new RegExp(`(?<![\\p{L}])${word}(?![\\p{L}])`, "u");

describe("D121 — معجم النطق", () => {
  it("المخطط: كلمات فريدة · كل سياق يحوي كلمته كاملة · المرجع حر بإصدار مثبَّت", () => {
    const ws = lex.entries.map((e) => e.word);
    expect(new Set(ws).size).toBe(ws.length);
    for (const e of lex.entries) for (const c of e.contexts) expect(c, `${e.word} ∉ «${c}»`).toMatch(wholeWord(e.word));
    expect(lex.reference.license).toBe("MIT");
  });

  it("كل مدخل ما زال لازماً ويُطبَّق في كل سياق — ولا يتغير في الجملة إلا الكلمة نفسها", () => {
    const ctx = lex.entries.flatMap((e) => e.contexts.map((c) => ({ e, c })));
    const raw = phonemize(ctx.map((x) => x.c), true);
    const fixed = phonemize(ctx.map((x) => x.c));
    ctx.forEach(({ e, c }, i) => {
      expect(raw[i], `espeak لم يعد يخطئ في «${c}» — احذف مدخل ${e.word}`).toContain(e.espeak);
      expect(fixed[i]).toBe(raw[i]!.replaceAll(e.espeak, e.ipa));
      expect(fixed[i]).not.toContain(e.espeak);
    });
  });

  it("حد الكلمة: الكلمات القريبة لا تُمس (Kurse · kurz · Kur · vier · Telefon · Urlaub …)", () => {
    const near = ["Kurse.", "kurz.", "Kur.", "vier.", "Telefon.", "Nummer.", "Urlaub.", "Name.", "Geburtstag.", "Wurm.", "Vorort."];
    expect(phonemize(near)).toEqual(phonemize(near, true));
  });

  it("apply_lexicon: كلمة كاملة فقط · القائمة نفسها حين لا مطابقة · عدد التصحيحات صحيح", () => {
    const r = py(
      [
        'E = [{"espeak": "kˈuːɾs", "ipa": "kˈʊɐs"}]',
        "def run(s):",
        "    ph = list(s); out, n = ga.apply_lexicon(ph, E)",
        '    return {"out": "".join(out), "n": n, "same": out is ph}',
        'print(json.dumps({k: run(v) for k, v in {"alone": "kˈuːɾs.", "mid": "ɪm kˈuːɾs, ja", "twice": "kˈuːɾs kˈuːɾs", "prefix": "akˈuːɾs", "suffix": "kˈuːɾsə", "none": "nˈʊl"}.items()}, ensure_ascii=False))',
      ].join("\n"),
    ) as Record<string, { out: string; n: number; same: boolean }>;
    expect(r.alone).toEqual({ out: "kˈʊɐs.", n: 1, same: false });
    expect(r.mid).toEqual({ out: "ɪm kˈʊɐs, ja", n: 1, same: false });
    expect(r.twice).toEqual({ out: "kˈʊɐs kˈʊɐs", n: 2, same: false });
    expect(r.prefix).toEqual({ out: "akˈuːɾs", n: 0, same: true });
    expect(r.suffix).toEqual({ out: "kˈuːɾsə", n: 0, same: true });
    expect(r.none).toEqual({ out: "nˈʊl", n: 0, same: true });
  });

  it("كل مسار منشور فيه كلمة من المعجم أُعيد توليده بعد إضافتها — والقائمة لا تذكر مساراً غائباً", () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, "content/manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; textDe: string }[] };
    for (const e of lex.entries) {
      const containing = manifest.tracks.filter((t) => wholeWord(e.word).test(t.textDe)).map((t) => t.id).sort();
      expect(containing, `مسارات «${e.word}»`).toEqual([...e.regeneratedTracks].sort());
    }
  });

  it("رموز التصحيح معروفة لخريطتي الصوتين المثبَّتين (لا رمز يُسقطه Piper صامتاً)", () => {
    const missing = py(
      [
        "lex = json.load(open(ga.PRON_LEXICON, encoding='utf-8'))['entries']",
        "out = {}",
        "for vid, onnx in ga.VOICES.items():",
        "    m = ga.load_voice(onnx).config.phoneme_id_map",
        "    out[vid] = sorted({ch for e in lex for ch in e['ipa'] if ch not in m})",
        "print(json.dumps(out, ensure_ascii=False))",
      ].join("\n"),
    ) as Record<string, string[]>;
    expect(Object.keys(missing)).toHaveLength(2);
    for (const [voice, chars] of Object.entries(missing)) expect(chars, voice).toEqual([]);
  });
});
