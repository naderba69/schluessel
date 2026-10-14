// src/lib/audio-player.ts — تشغيل الصوت للمتعلم (D104)
// القانون 11: المقطع الملتزم (Piper) أولاً ← Web Speech احتياطاً شاملاً (كل كلمة قابلة للسماع دائماً)
// F044: السرعات المسموحة فقط (0.75/1/1.25) — والإعادة بلا سقف ولا عقوبة (D23).
import { planPlayback } from "./audio-engine.js";
import { clipUrl } from "./audio-assets.js";

/** clip = المقطع الملتزم · speech = Web Speech · none = لا وسيلة متاحة · rejected = سرعة غير مسموحة */
export type PlayOutcome = "clip" | "speech" | "none" | "rejected";

export interface AudioBackend {
  playUrl(url: string, rate: number): Promise<void>;
  speak(text: string, rate: number): Promise<void>;
  canSpeak(): boolean;
}

export type PlayRequest = { trackId?: string; text: string; speed?: number };

export interface AudioPlayer {
  play(req: PlayRequest): Promise<PlayOutcome>;
}

/** المتصفح الحقيقي: HTMLAudioElement للمقطع + speechSynthesis بلغة de-DE */
export function browserBackend(): AudioBackend {
  let current: HTMLAudioElement | null = null;
  return {
    async playUrl(url, rate) {
      current?.pause(); // مقطع واحد في كل لحظة
      current = new Audio(url);
      current.playbackRate = rate;
      await current.play();
    },
    async speak(text, rate) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "de-DE";
      u.rate = rate;
      const de = window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("de"));
      if (de) u.voice = de;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    },
    canSpeak() {
      return typeof window !== "undefined" && "speechSynthesis" in window;
    },
  };
}

export function createAudioPlayer(
  backend: AudioBackend,
  resolve: (trackId: string) => string | undefined = clipUrl,
): AudioPlayer {
  return {
    async play(req) {
      const planned = planPlayback(req.trackId ?? req.text, req.speed ?? 1);
      if (!planned.ok) return "rejected";
      const rate = planned.plan.speed;
      const url = req.trackId ? resolve(req.trackId) : undefined;
      if (url) {
        try {
          await backend.playUrl(url, rate);
          return "clip";
        } catch {
          // حظر التشغيل التلقائي/ملف تالف → الاحتياطي (لا صمت)
        }
      }
      if (!backend.canSpeak()) return "none";
      try {
        await backend.speak(req.text, rate);
        return "speech";
      } catch {
        return "none";
      }
    },
  };
}

let shared: AudioPlayer | null = null;

/** المشغّل المشترك للواجهة (يُنشأ عند أول استخدام — لا window في الاختبارات) */
export function audioPlayer(): AudioPlayer {
  return (shared ??= createAudioPlayer(browserBackend()));
}

/** للاختبارات: حقن مشغّل وهمي */
export function setAudioPlayer(p: AudioPlayer | null): void {
  shared = p;
}
