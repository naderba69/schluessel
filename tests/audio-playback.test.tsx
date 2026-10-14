// tests/audio-playback.test.tsx — D104: الصوت يصل إلى المتعلم فعلاً
// قبل D104: 772 مقطعاً مُولَّداً ومُختبراً — وصفر مقطع في dist وصفر سطر تشغيل في src.
import { describe, it, expect, afterEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { clipUrl, clipUrlForFile, CLIP_FILE_COUNT, CLIP_ID_COUNT } from "../src/lib/audio-assets.js";
import { createAudioPlayer, setAudioPlayer, type AudioBackend, type AudioPlayer } from "../src/lib/audio-player.js";
import { ALL_LESSONS, wordsForLesson, runtimeWordsForLesson, firstLesson, firstLessonWords } from "../src/lesson-packs.js";
import { planLessonStations, fullForm } from "../src/lib/lesson-runner.js";
import { LearnStation, RecallStation } from "../src/components/LessonContent.js";

const CONTENT = join(process.cwd(), "content");
const manifest = JSON.parse(readFileSync(join(CONTENT, "manifests/audio-manifest.a1-u1.json"), "utf8")) as {
  tracks: { id: string; file: string }[];
};

function opusFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? opusFiles(p) : n.endsWith(".opus") ? [p] : [];
  });
}

describe("D104 — كل مقطع ملتزم يُضمَّن في البناء ويُعثر عليه بمعرّفه", () => {
  it("عدد المقاطع المضمَّنة = عدد ملفات .opus في content/ — والمعرّفات فريدة", () => {
    expect(CLIP_FILE_COUNT).toBe(opusFiles(CONTENT).length);
    expect(CLIP_ID_COUNT).toBe(CLIP_FILE_COUNT);
  });

  it("كل مسار في المانيفست له رابط (بالمعرّف وبالملف) — لا مسار صامت", () => {
    expect(manifest.tracks.length).toBeGreaterThan(700);
    for (const t of manifest.tracks) {
      expect(clipUrl(t.id), t.id).toBeTruthy();
      expect(clipUrlForFile(t.file), t.file).toBe(clipUrl(t.id));
    }
  });

  it("كل كلمة في كل درس لها مقطعها — المتعلم لا يرى كلمة بلا صوت", () => {
    for (const l of ALL_LESSONS)
      for (const w of runtimeWordsForLesson(l)) expect(clipUrl(`word-${w.id}`), `${l.id}/${w.id}`).toBeTruthy();
  });
});

describe("D104 — المشغّل: المقطع أولاً ← Web Speech احتياطاً (القانون 11) ← بلا صمت كاذب", () => {
  function fake(opts: { failClip?: boolean; speech?: boolean; failSpeech?: boolean } = {}) {
    const log: string[] = [];
    const backend: AudioBackend = {
      async playUrl(url, rate) {
        log.push(`clip:${url}@${rate}`);
        if (opts.failClip) throw new Error("autoplay blocked");
      },
      async speak(text, rate) {
        log.push(`speech:${text}@${rate}`);
        if (opts.failSpeech) throw new Error("no voice");
      },
      canSpeak: () => opts.speech ?? true,
    };
    return { backend, log };
  }
  const resolve = (id: string) => (id === "word-licht" ? "/a/word-licht.opus" : undefined);

  it("مقطع موجود ← يُشغَّل بالسرعة المطلوبة", async () => {
    const { backend, log } = fake();
    expect(await createAudioPlayer(backend, resolve).play({ trackId: "word-licht", text: "das Licht", speed: 0.75 })).toBe("clip");
    expect(log).toEqual(["clip:/a/word-licht.opus@0.75"]);
  });

  it("لا مقطع ← Web Speech بالنص الكامل", async () => {
    const { backend, log } = fake();
    expect(await createAudioPlayer(backend, resolve).play({ trackId: "word-ghost", text: "das Gespenst" })).toBe("speech");
    expect(log).toEqual(["speech:das Gespenst@1"]);
  });

  it("المقطع فشل (حظر تشغيل/ملف تالف) ← Web Speech لا صمت", async () => {
    const { backend, log } = fake({ failClip: true });
    expect(await createAudioPlayer(backend, resolve).play({ trackId: "word-licht", text: "das Licht" })).toBe("speech");
    expect(log).toEqual(["clip:/a/word-licht.opus@1", "speech:das Licht@1"]);
  });

  it("لا مقطع ولا Web Speech ← none (معلن، لا ادعاء تشغيل)", async () => {
    expect(await createAudioPlayer(fake({ speech: false }).backend, resolve).play({ text: "x" })).toBe("none");
    expect(await createAudioPlayer(fake({ failSpeech: true }).backend, resolve).play({ text: "x" })).toBe("none");
  });

  it("F044: سرعة خارج 0.75/1/1.25 مرفوضة قبل أي تشغيل", async () => {
    const { backend, log } = fake();
    expect(await createAudioPlayer(backend, resolve).play({ trackId: "word-licht", text: "das Licht", speed: 2 })).toBe("rejected");
    expect(log).toEqual([]);
  });
});

describe("D104 — البطاقات تحمل هوية صوتها والواجهة تعرض زر الاستماع", () => {
  afterEach(() => setAudioPlayer(null));

  it("بطاقات الجديد والاسترجاع: audioId = word-<id> وspeakText = الشكل الكامل (الأداة مرة واحدة)", () => {
    for (const l of ALL_LESSONS) {
      const plan = planLessonStations(l, runtimeWordsForLesson(l));
      const words = new Map(runtimeWordsForLesson(l).map((w) => [w.id, w]));
      for (const c of plan.learn) {
        expect(c.audioId).toBe(`word-${c.wordId}`);
        expect(c.speakText).toBe(fullForm(words.get(c.wordId)!));
      }
      for (const c of plan.recall) expect(c.audioId).toBe(`word-${c.id}`);
    }
    expect(wordsForLesson(firstLesson).length).toBeGreaterThan(0);
  });

  it("محطة الجديد والاسترجاع تعرضان 🔊 بمعرّف المقطع الصحيح", () => {
    const calls: string[] = [];
    const spy: AudioPlayer = { play: async (r) => (calls.push(r.trackId ?? r.text), "clip") };
    setAudioPlayer(spy);
    const plan = planLessonStations(firstLesson, firstLessonWords);
    const learn = renderToStaticMarkup(<LearnStation cards={plan.learn} />);
    expect(learn).toContain('data-testid="play-audio"');
    expect(learn).toContain(`data-audio-id="${plan.learn[0]!.audioId}"`);
    const recall = renderToStaticMarkup(<RecallStation cards={plan.recall} />);
    expect(recall).toContain(`data-audio-id="${plan.recall[0]!.audioId}"`);
  });
});

describe("D104 — عامل الخدمة: اسم المنتج + GET فقط", () => {
  const sw = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
  it("لا اسم داخلي في الأصل المنشور (D31) + الإصدار رُفع + لا تخزين لغير GET", () => {
    expect(sw).not.toMatch(/reise-yusuf/i);
    expect(sw).toContain('const CACHE = "schluessel-v2"');
    expect(sw).toContain('req.method !== "GET"');
  });
});
