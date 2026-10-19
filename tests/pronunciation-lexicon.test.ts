// tests/pronunciation-lexicon.test.ts — معجم النطق (D121 · D122): أخطاء espeak-ng المقيسة تُصحَّح قبل النموذج
// الضمانات: (1) كل صيغة ما زالت لازمة (espeak الخام ما زال يخطئ — وإلا تُحذف لا تبقى رقعة ميتة) ومُختبَرة بسياق
// (2) يُطبَّق في كل سياق معلن ولا يتغير في الجملة شيء غيره (3) لا يمس كلمة قريبة (حد الكلمة)
// (4) المسارات المنشورة التي يمسّها المعجم فعلاً (بمطابقة التوليد نفسها لا ببحث نصي) = المعاد توليدها تماماً
// (5) كلمة من المعجم تُنطق في مسار بصيغة لا يعرفها المعجم = فشل (صيغة سياق جديدة لم تُصحَّح)
// (6) المعجم قبل ملاءمة الخريطة: التصحيح يصل الصوتين كليهما حتى في كلمات ç (vierzig) — وبرموز تعرفها خريطتاهما.
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { COMPOUND_NUMBER, HUNDREDS_NUMBER } from "../tools/lib/vocab-forms.js";

const ROOT = join(__dirname, "..");

const Form = z
  .object({ espeak: z.string().min(2), ipa: z.string().min(2) })
  .strict()
  .refine((f) => f.ipa !== f.espeak, "ipa = espeak — صيغة بلا تصحيح");
const Entry = z
  .object({
    word: z.string().regex(/^\p{L}+$/u),
    forms: z.array(Form).min(1),
    referenceIpa: z.string().regex(/^\/.+\/$/),
    referenceNote: z.string().min(10).optional(),
    analogy: z.string().min(10),
    contexts: z.array(z.string().min(1)).min(2),
    regeneratedTracks: z.array(z.string().min(1)).min(1),
    earReview: z.literal("تحت التحقق السمعي").optional(), // D189 (N-101 · Q24): مقيس بالمرجع، والأذن لم تحكم بعد
  })
  .strict();
const Reviewed = z
  .object({
    word: z.string().regex(/^\p{L}+$/u),
    verdict: z.enum(["variant", "weak-form", "artifact", "ambiguous", "no-reference"]),
    espeak: z.string().min(1),
    note: z.string().min(20),
  })
  .strict();
const Lexicon = z
  .object({
    schemaVersion: z.literal("2.0.0"),
    decision: z.string().regex(/^D\d+$/),
    about: z.string().min(20),
    reference: z
      .object({
        name: z.string(),
        license: z.string(),
        licenseNote: z.string().min(20),
        gitBlob: z.string().regex(/^[0-9a-f]{40}$/),
        url: z.string().url(),
        attribution: z.string().url(),
      })
      .strict(),
    entries: z.array(Entry).min(1),
    reviewed: z.array(Reviewed),
  })
  .strict();

const lex = Lexicon.parse(JSON.parse(readFileSync(join(ROOT, "tools/pronunciation-lexicon.json"), "utf8")));
const nfd = (s: string) => s.normalize("NFD"); // espeak الخام يُخرج العلامات مفككة (ç = c + U+0327)

const run = (args: string[]): unknown =>
  JSON.parse(execFileSync("python3", [join(ROOT, "tools/phonemize.py"), ...args], { encoding: "utf8", timeout: 120_000, maxBuffer: 64 * 1024 * 1024 }));
const phonemize = (texts: string[], raw = false): string[] => (run([...(raw ? ["--raw"] : []), ...texts]) as { ipa: string }[]).map((r) => r.ipa);

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

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** حدّ الكلمة في IPA كما في apply_lexicon (gen-audio.py: _IPA_EDGE) — مسافة/ترقيم/طرف */
const wholeForm = (espeak: string) => new RegExp(`(?<![^\\s.,;:!?])${esc(nfd(espeak))}(?![^\\s.,;:!?])`, "gu");
const wholeWordCI = (word: string) => new RegExp(`(?<![\\p{L}])${word}(?![\\p{L}])`, "iu");
/** (5) مسارات تذكر الكلمة نصاً ولا يمسّها المعجم = الكلمة تُنطق فيها بصيغة لا يعرفها المعجم (تبقى خاطئة بصمت) */
const unknownForm = (word: string, tracks: { id: string; textDe: string }[], touched: readonly string[]) =>
  tracks.filter((t) => wholeWordCI(word).test(t.textDe) && !touched.includes(t.id)).map((t) => t.id).sort();

describe("D121/D122 — معجم النطق", () => {
  it("المخطط: كلمات فريدة لا تجمع تصحيحاً ومراجعة · كل سياق يحوي كلمته · الترخيص الصحيح للمرجع الألماني", () => {
    const ws = lex.entries.map((e) => e.word.toLowerCase());
    expect(new Set(ws).size).toBe(ws.length);
    const rv = lex.reviewed.map((r) => r.word.toLowerCase());
    expect(new Set(rv).size).toBe(rv.length);
    expect(ws.filter((w) => rv.includes(w))).toEqual([]);
    for (const e of lex.entries) for (const c of e.contexts) expect(c, `${e.word} ∉ «${c}»`).toMatch(wholeWordCI(e.word));
    // D122: بيانات ipa-dict الألمانية من german-ipa-dict ← Wiktionary ⇒ CC-BY-SA (سجل D121 قال MIT خطأً)
    expect(lex.reference.license).toBe("CC-BY-SA");
    expect(lex.reference.attribution).toContain("german-ipa-dict");
  });

  it("كل صيغة ما زالت لازمة ومُختبَرة بسياق — والتصحيح لا يغيّر في الجملة إلا الكلمة نفسها", () => {
    const ctx = lex.entries.flatMap((e) => e.contexts.map((c) => ({ e, c })));
    const raw = phonemize(ctx.map((x) => x.c), true);
    const fixed = phonemize(ctx.map((x) => x.c));
    const exercised = new Set<string>();
    ctx.forEach(({ e, c }, i) => {
      const present = e.forms.filter((f) => raw[i]!.includes(nfd(f.espeak)));
      expect(present.length, `espeak لم يعد يخطئ في «${c}» — احذف الصيغة أو المدخل ${e.word}`).toBeGreaterThan(0);
      present.forEach((f) => exercised.add(`${e.word}|${f.espeak}`));
      let expected = raw[i]!; // لا يتغير في الجملة إلا كلمات المعجم (سياق Bahnsteig يحوي Flughafen — مدخل آخر منذ D189)
      for (const f of lex.entries.flatMap((x) => x.forms)) expected = expected.replace(wholeForm(f.espeak), nfd(f.ipa));
      expect(fixed[i], c).toBe(expected);
      for (const f of e.forms) expect(fixed[i]).not.toContain(nfd(f.espeak));
    });
    for (const e of lex.entries) for (const f of e.forms) expect(exercised.has(`${e.word}|${f.espeak}`), `صيغة ميتة: ${e.word} ${f.espeak}`).toBe(true);
  });

  it("حد الكلمة: الكلمات القريبة لا تُمس (Kurse · vier · Not · nach · Fuß · Stadt · Kredit · wieder …)", () => {
    const near = [
      "Kurse.", "kurz.", "Kur.", "vier.", "Telefon.", "Nummer.", "Urlaub.", "Name.", "Geburtstag.", "Wurm.", "Vorort.",
      "Not.", "nach.", "Nacht.", "Fuß.", "Ball.", "Stadt.", "Plan.", "Kredit.", "wieder.", "hin.", "los.", "vorher.", "Hotels.",
      "leise.", "Reise.", // D130: Ayşe [ˈaɪzə] كلمة كاملة — lˈaɪzə وrˈaɪzə لا تُمسّان
    ];
    expect(phonemize(near)).toEqual(phonemize(near, true));
  });

  it("apply_lexicon: كلمة كاملة فقط · كل صيغ الكلمة · القائمة نفسها حين لا مطابقة · عدد التصحيحات صحيح", () => {
    const r = py(
      [
        'E = [{"word": "vor", "forms": [{"espeak": "fˈɔɾ", "ipa": "fˈoːɾ"}, {"espeak": "fˌɔɾ", "ipa": "fˌoːɾ"}]}]',
        "def run(s):",
        "    ph = list(s); out, n = ga.apply_lexicon(ph, E)",
        '    return {"out": "".join(out), "n": n, "same": out is ph, "hits": ga.lexicon_hits(ph, E)}',
        'print(json.dumps({k: run(v) for k, v in {"alone": "fˈɔɾ.", "ctx": "vˈaɾtə fˌɔɾ deːm", "both": "fˈɔɾ fˌɔɾ", "prefix": "afˈɔɾ", "suffix": "fˈɔɾə", "none": "nˈʊl"}.items()}, ensure_ascii=False))',
      ].join("\n"),
    ) as Record<string, { out: string; n: number; same: boolean; hits: string[] }>;
    expect(r.alone).toEqual({ out: "fˈoːɾ.", n: 1, same: false, hits: ["vor"] });
    expect(r.ctx).toEqual({ out: "vˈaɾtə fˌoːɾ deːm", n: 1, same: false, hits: ["vor"] });
    expect(r.both).toEqual({ out: "fˈoːɾ fˌoːɾ", n: 2, same: false, hits: ["vor"] });
    expect(r.prefix).toEqual({ out: "afˈɔɾ", n: 0, same: true, hits: [] });
    expect(r.suffix).toEqual({ out: "fˈɔɾə", n: 0, same: true, hits: [] });
    expect(r.none).toEqual({ out: "nˈʊl", n: 0, same: true, hits: [] });
  });

  it("D122: المعجم قبل الملاءمة — vierzig (فيها ç) تُصحَّح في الصوتين وكلٌّ برمز ç الذي تعرفه خريطته", () => {
    const r = py(
      [
        "out = {}",
        "for vid, onnx in ga.VOICES.items():",
        "    v = ga.load_phonemizer(onnx); m = v.config.phoneme_id_map",
        "    s = ''.join(''.join(x) for x in ga.synth_phonemes(v, 'Er ist vierzig.'))",
        "    out[vid] = {'ipa': s, 'missing': sorted({c for c in s if c not in m})}",
        "print(json.dumps(out, ensure_ascii=False))",
      ].join("\n"),
    ) as Record<string, { ipa: string; missing: string[] }>;
    expect(Object.keys(r)).toHaveLength(2);
    for (const [voice, { ipa, missing }] of Object.entries(r)) {
      expect(ipa.normalize("NFC"), voice).toContain("fˈɪɾtsɪç");
      expect(ipa.normalize("NFC"), voice).not.toContain("fˈiːɾtsɪç");
      expect(missing, voice).toEqual([]);
    }
    // الصوتان يختلفان في ترميز ç نفسه — ولهذا يعمل المعجم قبل الملاءمة لا بعدها
    expect(new Set(Object.values(r).map((x) => x.ipa)).size).toBe(2);
  });

  it("المسارات التي يمسّها المعجم فعلاً (مطابقة التوليد نفسها) = المعاد توليدها لكل كلمة — لا أقل ولا أكثر", () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, "content/manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { id: string; textDe: string }[] };
    const texts = [...new Set(manifest.tracks.map((t) => t.textDe))];
    const hits = new Map((run(["--lexicon-hits", ...texts]) as { text: string; hits: string[] }[]).map((h) => [h.text, h.hits] as const));
    for (const e of lex.entries) {
      const touched = manifest.tracks.filter((t) => hits.get(t.textDe)!.includes(e.word)).map((t) => t.id).sort();
      expect(touched, `مسارات «${e.word}»`).toEqual([...e.regeneratedTracks].sort());
      // (5) كل مسار يذكر الكلمة نصاً يحويها بصيغة يعرفها المعجم — وإلا فصيغة سياق جديدة تُنطق خطأً بصمت
      expect(unknownForm(e.word, manifest.tracks, touched), `«${e.word}» بصيغة غير معروفة`).toEqual([]);
    }
  }, 120_000); // D208: فونمة 2600+ نص في عملية واحدة — مهلة vitest الافتراضية (5s) انفجرت على CI (فشل مؤقت لا ادعاء)

  it("D131 · D132: كل عدد من كلمة واحدة في مسار منشور يُنطق صحيحاً — v في ‑vierzig [f] وie قصيرة · لا نبر ثانوي على ‑zig (sieben‑) · h في achthundert", () => {
    // قياس D131 على الصيغ الاثنتين والسبعين: espeak يقرأ ‑undvierzig بـ[v] وiː طويلة (9/9) ويضع نبر sieben‑ الثانوي على ‑zig (8/8)
    // · وقياس D132: يُسقط h من achthundert [ˈaxtʊndɜt] — والتدقيق (D122) لا يفحص الصوامت ولا النبر الثانوي (N-013)،
    // فكل عدد من كلمة واحدة يدخل مساراً منشوراً (21–99 والمئات حتى الألف) يُفحص هنا بعد المعجم.
    const manifest = JSON.parse(readFileSync(join(ROOT, "content/manifests/audio-manifest.a1-u1.json"), "utf8")) as { tracks: { textDe: string }[] };
    const isNumber = (w: string) => COMPOUND_NUMBER.test(w) || (HUNDREDS_NUMBER.test(w) && w !== "hundert" && w !== "tausend");
    const numbers = [...new Set(manifest.tracks.flatMap((t) => (t.textDe.toLowerCase().match(/\p{L}+/gu) ?? []).filter(isNumber)))].sort();
    expect(numbers).toEqual(expect.arrayContaining(["zweiundvierzig", "siebenundzwanzig", "neunhundertneunundneunzig", "zweihundertneunundsiebzig"]));
    const ipa = phonemize(numbers.map((w) => `${w}.`)).map((x) => x.normalize("NFC"));
    const wrong = (w: string, p: string) =>
      (/vierzig$/.test(w) && !/f[ˌˈ]?ɪɾtsɪç/u.test(p)) || /tsˌɪç\.?$/u.test(p) || (w.includes("achthundert") && !/axt[ˌˈ]?h/u.test(p));
    const bad = numbers.filter((w, i) => wrong(w, ipa[i]!));
    expect(bad, "عدد يُنطق خطأً — أضف مدخل معجم بمرجعه").toEqual([]);
    // والكاشف نفسه يلتقط الخطأ الخام (لا فحص أعمى)
    const raw = phonemize(["dreiundvierzig.", "siebenundsechzig.", "achthundert."], true).map((x) => x.normalize("NFC"));
    expect(wrong("dreiundvierzig", raw[0]!)).toBe(true);
    expect(wrong("siebenundsechzig", raw[1]!)).toBe(true);
    expect(wrong("achthundert", raw[2]!)).toBe(true);
  });
  it("(5) يلتقط الصيغة غير المعروفة: vor بصيغتها المعزولة وحدها ← «…warte vor dem Kino» (نبر ثانوي) يُكشف", () => {
    const tracks = [
      { id: "iso", textDe: "vor." },
      { id: "ctx", textDe: "Ich warte vor dem Kino auf dich." },
    ];
    const hits = py(
      [
        "import tempfile, pathlib",
        "lex = json.loads(ga.PRON_LEXICON.read_text(encoding='utf-8'))",
        "for e in lex['entries']:",
        "    if e['word'] == 'vor': e['forms'] = e['forms'][:1]",
        "p = pathlib.Path(tempfile.mkdtemp()) / 'lex.json'; p.write_text(json.dumps(lex, ensure_ascii=False), encoding='utf-8')",
        "ga.PRON_LEXICON = p; ga._LEXICON = None",
        "v = ga.load_phonemizer(ga.VOICE_ONNX)",
        `print(json.dumps({t: sorted({w for s in v.phonemize(t) for w in ga.lexicon_hits(s)}) for t in ${JSON.stringify(tracks.map((t) => t.textDe))}}))`,
      ].join("\n"),
    ) as Record<string, string[]>;
    const touched = tracks.filter((t) => hits[t.textDe]!.includes("vor")).map((t) => t.id);
    expect(touched).toEqual(["iso"]);
    expect(unknownForm("vor", tracks, touched)).toEqual(["ctx"]);
  });

  it("رموز التصحيح بعد الملاءمة معروفة لخريطتي الصوتين المثبَّتين (لا رمز يُسقطه Piper صامتاً)", () => {
    const missing = py(
      [
        "import unicodedata",
        "lex = json.load(open(ga.PRON_LEXICON, encoding='utf-8'))['entries']",
        "out = {}",
        "for vid, onnx in ga.VOICES.items():",
        "    m = ga.load_phonemizer(onnx).config.phoneme_id_map",
        "    out[vid] = sorted({ch for e in lex for f in ga.lexicon_forms(e) for ch in ga.fit_phonemes(list(f['ipa']), m)[0] if ch not in m})",
        "print(json.dumps(out, ensure_ascii=False))",
      ].join("\n"),
    ) as Record<string, string[]>;
    expect(Object.keys(missing)).toHaveLength(2);
    for (const [voice, chars] of Object.entries(missing)) expect(chars, voice).toEqual([]);
  });
  it("D189 (N-101): قائمة «تحت التحقق السمعي» معلنة ومثبَّتة — إجهار النهاية داخل المركّبات + Bäckerei (‑erei)", () => {
    // الأحد عشر مدخلاً مقيسة بالمرجع (كاشف devoicing في pronunciation-audit.py) لا بالأذن؛ المالك يحكم قبل الإطلاق
    // (Q24). تغيير القائمة (حكم سمعي · مدخل جديد من الكاشف) يغيّر هذا الاختبار عمداً — لا قبول صامت.
    const pending = lex.entries.filter((e) => e.earReview).map((e) => e.word).sort();
    expect(pending).toEqual(
      ["Bäckerei", "Ergebnis", "Flughafen", "Freundschaft", "Landschaft", "Mädchen", "dreiundsechzig", "dreiundsiebzig", "neunhundertneunundneunzig", "neunundneunzig", "zweihundertneunundsiebzig"].sort(),
    );
    // كل مدخل منها يهمس صامتاً واحداً (b/d/ɡ ← p/t/k) أو يعيد شوا ‑erei (eː ← ə) — لا يغيّر شيئاً آخر في الكلمة
    const dev: Record<string, string> = { b: "p", d: "t", "\u0261": "k" };
    for (const e of lex.entries.filter((x) => x.earReview))
      for (const f of e.forms) {
        if (e.word === "Bäckerei") {
          expect(f.ipa).toBe(f.espeak.replace("eː", "ə"));
          continue;
        }
        const a = [...nfd(f.espeak)], b = [...nfd(f.ipa)];
        expect(b.length, e.word).toBe(a.length);
        const diff = a.map((c, i) => [c, b[i]!] as const).filter(([x, y]) => x !== y);
        expect(diff.length, `${e.word}: صامت واحد فقط`).toBe(1);
        expect(dev[diff[0]![0]], e.word).toBe(diff[0]![1]);
      }
  });
});
