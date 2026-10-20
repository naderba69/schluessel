// src/lib/audio-engine.ts — محرك الصوت التفاعلي E05: تشغيل/سرعة/تسجيل shadowing/مقارنة
// المصادر: D16 (الاستماع يحسم لا النسخ — ASR استشاري فقط) · F005 (Shadowing) · F041 (السلم السمعي) · F044 (سرعة)
// الحارس الحاسم: لا حكم آلي على التسجيل أبداً — «التسجيل لأذنك أنت» (اختبار يقفله)

/** F044: أزرار السرعة — 0.75× / 1× / 1.25× فقط */
export const PLAYBACK_SPEEDS = [0.75, 1, 1.25] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export function isAllowedSpeed(speed: number): speed is PlaybackSpeed {
  return (PLAYBACK_SPEEDS as readonly number[]).includes(speed);
}

/** السلم السمعي (F041 — البديل المُفعَّل D16): تصعيد تدريجي: بطيء ← عادي ← ترديد ← مقارنة ذاتية */
export const LISTENING_LADDER = ["listen-slow", "listen-normal", "repeat-aloud", "self-compare"] as const;
export type LadderStep = (typeof LISTENING_LADDER)[number];

export function ladderNext(step: LadderStep): LadderStep | null {
  const i = LISTENING_LADDER.indexOf(step);
  return i === -1 || i === LISTENING_LADDER.length - 1 ? null : LISTENING_LADDER[i + 1];
}

/** دورة التكرار الحرفي shadowing (F005): تردّد ← تسجّل ← تقارن بنفسك */
export const SHADOWING_CYCLE = ["listen", "record", "compare"] as const;
export type ShadowingStep = (typeof SHADOWING_CYCLE)[number];

export function shadowingNext(step: ShadowingStep): ShadowingStep | null {
  const i = SHADOWING_CYCLE.indexOf(step);
  return i === -1 || i === SHADOWING_CYCLE.length - 1 ? null : SHADOWING_CYCLE[i + 1];
}

/** D16 (مقفل): لا حكم آلي على النطق — لا ASR ولا درجات في أي مسار */
export const AUTO_JUDGE_ENABLED = false as const;

export type FeedbackMode = "self" | "muller";
const FORBIDDEN_FEEDBACK_MODES = ["auto-score", "asr-judge", "grade", "exam"] as const;

/**
 * حارس D16: وضع التغذية الراجعة للتسجيل = ذاتي (أذنك أنت) أو استشارة مولر الاختيارية.
 * أي محاولة «تقييم آلي/درجة» مرفوضة صراحةً — لا نعدك بما لا نستطيع ضمانه (§2.6).
 */
export function validateFeedbackMode(mode: string): { ok: boolean; reason?: string } {
  if ((FORBIDDEN_FEEDBACK_MODES as readonly string[]).includes(mode))
    return {
      ok: false,
      reason: "D16: الحكم الآلي على النطق غير معتمد (FA 0% / FR 44%) — التسجيل لأذنك أنت",
    };
  if (mode !== "self" && mode !== "muller")
    return { ok: false, reason: "وضع التغذية الراجعة غير معروف" };
  return { ok: true };
}

/** التحذير الصريح الذي يرافق كل تسجيل (F005 + D16) */
export const RECORDING_DISCLAIMER_AR =
  "التسجيل لأذنك أنت 🎧 — لا نقيّم نطقك آلياً إطلاقاً. قارن صوتك بمولر بنفسك، وعند الحاجة اطلب مراجعة مولر.";

/** الخصوصية: التسجيلات لا تغادر جهازك أبداً */
export const RECORDING_LOCAL_ONLY = true as const;

export type PlaybackPlan = {
  clipId: string;
  speed: PlaybackSpeed;
  /** الإعادة بلا عقوبة ولا سقف (D23 — بلا ضغط) */
  replays: number;
};

/** خطة تشغيل مقطع — تُرفض أي سرعة خارج F044 */
export function planPlayback(
  clipId: string,
  speed: number = 1,
  replays = 0,
): { ok: true; plan: PlaybackPlan } | { ok: false; reason: string } {
  if (!isAllowedSpeed(speed))
    return { ok: false, reason: `السرعة المسموحة: ${PLAYBACK_SPEEDS.join(" · ")} فقط (F044)` };
  return { ok: true, plan: { clipId, speed, replays } };
}
