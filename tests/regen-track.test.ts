// tests/regen-track.test.ts — إعادة توليد مقطع كلمة منشور (D121): التعديل النصي للمانيفست لا يمس إلا قياسات مساره
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { VOICE_ID } from "../src/lib/audio.js";
import { MANIFEST_REL, patchTrackMeasures, regenTracks, type Measures } from "../tools/regen-track.js";

const ROOT = join(__dirname, "..");

/** مانيفست مصغّر بتنسيق غير قانوني عمداً (سطر مضغوط + مسافات غير منتظمة) — يجب أن يبقى كل بايت خارج الحقول */
const SAMPLE = `{
  "schemaVersion": "1.0.0",
  "characterVoices": { "lena": "de_DE-kerstin-low" },
  "tracks": [
    {
      "id": "word-a",
      "file": "words/audio/de-DE/word-a.opus",
      "role": "word",
      "voiceParams": { "speaker": "${VOICE_ID}", "speedWpm": 110 },
      "durationMs": 700,   "sizeBytes": 3000,
      "hash": "sha256:aaa", "pcmSha256": "bbb", "rmsDb": -17.0,
      "textDe": "A. \\"zitiert\\" {nicht} }"
    },
    { "id": "word-b", "file": "words/audio/de-DE/word-b.opus", "role": "word", "voiceParams": { "speaker": "${VOICE_ID}", "speedWpm": 110 }, "durationMs": 800, "sizeBytes": 3100, "hash": "sha256:ccc", "pcmSha256": "ddd", "rmsDb": -16.9, "textDe": "B." },
    { "id": "ann-1", "file": "audio/characters/ann-1.opus", "role": "announcement", "characterId": "mueller", "voiceParams": { "speaker": "${VOICE_ID}", "speedWpm": 130 }, "durationMs": 4000, "sizeBytes": 9000, "hash": "sha256:ggg", "pcmSha256": "hhh", "rmsDb": -17.2, "textDe": "Hallo! Ich bin Müller." },
    { "id": "dlg-1", "file": "audio/scripts/x/dlg-1.opus", "role": "character", "characterId": "lena", "voiceParams": { "speaker": "de_DE-kerstin-low", "speedWpm": 90, "lengthScale": 1.32 }, "durationMs": 900, "sizeBytes": 3200, "hash": "sha256:eee", "pcmSha256": "fff", "rmsDb": -17.1, "textDe": "Hallo." }
  ]
}
`;
const M: Measures = { durationMs: 650, sizeBytes: 2900, hash: "sha256:new", pcmSha256: "pcmnew", rmsDb: -17.05 };

describe("D121 — patchTrackMeasures", () => {
  it("يغيّر الحقول الخمسة لمسار واحد فقط — وكل بايت قبله وبعده كما هو (حتى «}» داخل نص مقتبس)", () => {
    const out = patchTrackMeasures(SAMPLE, "word-a", M);
    const a = JSON.parse(out).tracks[0];
    expect(a).toMatchObject(M);
    expect(a.textDe).toBe('A. "zitiert" {nicht} }');
    const start = SAMPLE.indexOf('"id": "word-a"');
    const end = SAMPLE.indexOf('{ "id": "word-b"');
    expect(out.slice(0, start)).toBe(SAMPLE.slice(0, start));
    expect(out.slice(out.indexOf('{ "id": "word-b"'))).toBe(SAMPLE.slice(end));
    expect(out).toContain('"durationMs": 650,   "sizeBytes": 2900,'); // المسافات اليدوية محفوظة
    expect(JSON.parse(out).tracks.slice(1)).toEqual(JSON.parse(SAMPLE).tracks.slice(1));
  });

  it("حدود الكائن تتخطى الأقواس داخل السلاسل أينما وقعت — حتى نص فيه «} {» قبل الحقول المقيسة", () => {
    const early = SAMPLE.replace(
      '{ "id": "word-b", "file": "words/audio/de-DE/word-b.opus",',
      '{ "id": "word-b", "textNote": "} { \\"}\\" {", "file": "words/audio/de-DE/word-b.opus",',
    );
    const out = patchTrackMeasures(early, "word-b", M);
    expect(JSON.parse(out).tracks[1]).toMatchObject({ ...M, textNote: '} { "}" {' });
    expect(JSON.parse(out).tracks[0]).toEqual(JSON.parse(early).tracks[0]);
  });

  it("القياسات نفسها ⇒ النص نفسه بايتاً ببايت (‎-17.0 تبقى ‎-17.0 لا ‎-17)", () => {
    const same = { durationMs: 700, sizeBytes: 3000, hash: "sha256:aaa", pcmSha256: "bbb", rmsDb: -17 };
    expect(patchTrackMeasures(SAMPLE, "word-a", same)).toBe(SAMPLE);
  });

  it("يرفض: مساراً غائباً · مكرراً · كائناً ليس id أول مفاتيحه (لا تحديد حدود بالتخمين)", () => {
    expect(() => patchTrackMeasures(SAMPLE, "word-x", M)).toThrow(/غير موجود/);
    const dup = SAMPLE.replace('"id": "word-b"', '"id": "word-a"');
    expect(() => patchTrackMeasures(dup, "word-a", M)).toThrow(/مكرر/);
    const notFirst = SAMPLE.replace('{ "id": "word-b", "file": "words/audio/de-DE/word-b.opus",', '{ "file": "words/audio/de-DE/word-b.opus", "id": "word-b",');
    expect(() => patchTrackMeasures(notFirst, "word-b", M)).toThrow(/أول مفتاح/);
  });

  it("المانيفست الحقيقي: التطبيق بالقياسات الحالية لا يغيّر بايتاً واحداً (word-durst · word-kurs · num-14)", () => {
    const text = readFileSync(join(ROOT, MANIFEST_REL), "utf8");
    const tracks = (JSON.parse(text) as { tracks: (Measures & { id: string })[] }).tracks;
    for (const id of ["word-durst", "word-kurs", "num-14"]) {
      const t = tracks.find((x) => x.id === id)!;
      const m: Measures = { durationMs: t.durationMs, sizeBytes: t.sizeBytes, hash: t.hash, pcmSha256: t.pcmSha256, rmsDb: t.rmsDb };
      expect(patchTrackMeasures(text, id, m)).toBe(text);
    }
  });
});

describe("D121 — regenTracks", () => {
  it("يعيد التوليد بالنص نفسه ويكتب القياسات · يعيد المحاولة إن طال المقطع · التجريبي لا يولّد شيئاً", () => {
    const calls: string[] = [];
    let n = 0;
    const clip = (text: string) => {
      calls.push(text);
      n++;
      return { ...M, durationMs: n === 1 ? 99_000 : 640 }; // الأولى أطول من السقف ⇒ محاولة ثانية
    };
    const { text, rows } = regenTracks({ ids: ["word-a"], manifestText: SAMPLE, contentRoot: "/nonexistent", clip });
    expect(calls).toEqual(['A. "zitiert" {nicht} }', 'A. "zitiert" {nicht} }']);
    expect(rows[0]).toMatchObject({ id: "word-a", attempts: 2, before: { durationMs: 700 }, after: { durationMs: 640 } });
    expect(JSON.parse(text).tracks[0].durationMs).toBe(640);
    const dry = regenTracks({ ids: ["word-b"], manifestText: SAMPLE, contentRoot: "/nonexistent", clip: () => { throw new Error("لا توليد في التجريبي"); }, dryRun: true });
    expect(dry.text).toBe(SAMPLE);
  });

  it("يرفض أسطر السكربتات (← dialogue-splitter --lines باسم السطر) والمسارات الغائبة", () => {
    const clip = () => M;
    expect(() => regenTracks({ ids: ["dlg-1"], manifestText: SAMPLE, contentRoot: "/x", clip })).toThrow(/dialogue-splitter .*--lines dlg-1/);
    expect(() => regenTracks({ ids: ["nope"], manifestText: SAMPLE, contentRoot: "/x", clip })).toThrow(/غير موجود/);
  });

  it("D122: إعلان شخصية بالصوت الرئيسي خارج السكربتات يُعاد — بلا سقف مدة المقطع (الإعلان جملٌ لا كلمة)", () => {
    const calls: string[] = [];
    const clip = (text: string) => (calls.push(text), { ...M, durationMs: 4200 });
    const { text, rows } = regenTracks({ ids: ["ann-1"], manifestText: SAMPLE, contentRoot: "/x", clip });
    expect(calls).toEqual(["Hallo! Ich bin Müller."]); // محاولة واحدة: 4.2s مقبولة للإعلان
    expect(rows[0]).toMatchObject({ id: "ann-1", attempts: 1, after: { durationMs: 4200 } });
    const parsed = JSON.parse(text).tracks;
    expect(parsed[2]).toMatchObject({ id: "ann-1", durationMs: 4200, voiceParams: { speedWpm: 130 } });
    expect(parsed.filter((x: { id: string }) => x.id !== "ann-1")).toEqual(JSON.parse(SAMPLE).tracks.filter((x: { id: string }) => x.id !== "ann-1"));
    const other = SAMPLE.replace('"role": "announcement"', '"role": "narration"');
    expect(() => regenTracks({ ids: ["ann-1"], manifestText: other, contentRoot: "/x", clip })).toThrow(/narration — خارج حدود/);
  });
});
