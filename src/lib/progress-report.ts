// src/lib/progress-report.ts — تقارير التقدم (E18 + F159 + F160 + D23) | طبقة التقارير فوق progress-engine
// المصادر: E18 (أرقام حقيقية فقط — لا تقدير من العدم) · F159 (أشرطة المهارات الأربع)
// · F160 (تقدير الذات الشهري + المعايرة بالاختبار) · D23 (هادئ بلا لوم — يمر على BLAME_WORDS)
// · §2.8 شاشة الخريطة (أين أنت وخطوتك التالية — بلا أرقام مخيفة) · F157 («أيامك مع مولر» لا «سلسلة»)
import {
  skillBars,
  retention,
  monthlyEstimate,
  type SkillStat,
} from "./progress-engine.js";
import { hasBlame } from "./warmth-engine.js";

export type WeeklyInput = {
  /** أيام التعلّم هذا الأسبوع (0..7) — تُقال «أيامك مع مولر» لا «سلسلة» (F157) */
  daysWithMueller: number;
  /** بطاقات الاسترجاع الفعلية */
  reviewsDone: number;
  /** دقائق التعلّم الفعلية */
  minutesTotal: number;
  /** بطاقات استقرّت في ذاكرتك (S ≥ 21 يوماً) */
  wordsSecured: number;
  /** تركيز الأسبوع القادم — جملة قصيرة تُقال للمتعلم */
  nextFocusAr: string;
};

export type WeeklyReport = {
  daysLine: string;
  effortLine: string;
  securedLine: string;
  nextStepLine: string;
  /** لا بيانات إطلاقاً — التقرير يقولها بصراحة بدل اختراع أرقام */
  isEmpty: boolean;
  linesAr: readonly string[];
};

/** تقرير التقدم الأسبوعي — أرقام حقيقية فقط (E18) + نبرة هادئة (D23) */
export function weeklyReport(input: WeeklyInput): WeeklyReport {
  const { daysWithMueller, reviewsDone, minutesTotal, wordsSecured } = input;
  for (const [name, v] of [
    ["daysWithMueller", daysWithMueller],
    ["reviewsDone", reviewsDone],
    ["minutesTotal", minutesTotal],
    ["wordsSecured", wordsSecured],
  ] as const) {
    if (!Number.isInteger(v) || v < 0) throw new Error(`${name}: رقم غير منطق`);
  }
  if (daysWithMueller > 7) throw new Error("daysWithMueller: الأسبوع 7 أيام فقط");
  if (input.nextFocusAr.trim().length === 0) throw new Error("nextFocusAr: خطوتك التالية مطلوبة");

  const isEmpty = daysWithMueller === 0 && reviewsDone === 0 && minutesTotal === 0 && wordsSecured === 0;

  if (isEmpty) {
    const empty: WeeklyReport = {
      daysLine: "لا بيانات هذا الأسبوع بعد — التقرير يظهر أول ما تبدأ.",
      effortLine: "",
      securedLine: "",
      nextStepLine: `خطوتك التالية حين تبدأ: ${input.nextFocusAr}.`,
      isEmpty: true,
      linesAr: [
        "لا بيانات هذا الأسبوع بعد — التقرير يظهر أول ما تبدأ.",
        `خطوتك التالية حين تبدأ: ${input.nextFocusAr}.`,
      ],
    };
    assertCalm(empty.linesAr);
    return empty;
  }

  const daysLine =
    daysWithMueller === 0
      ? "هذا الأسبوع كان خفيفاً — ونكمّل من حيث توقفنا."
      : daysWithMueller === 7
        ? "أيامك مع مولر: 7 من 7 — أسبوع كامل."
        : `أيامك مع مولر: ${daysWithMueller} من 7.`;
  const effortLine = `استرجعتَ ${reviewsDone} بطاقة في ${minutesTotal} دقيقة — من نشاطك أنت.`;
  const securedLine =
    wordsSecured === 0
      ? "الكلمات المستقرة تظهر أول ما تستقر — لا استعجال."
      : `${wordsSecured} كلمة مستقرة في ذاكرتك الآن.`;
  const nextStepLine = `خطوتك التالية: ${input.nextFocusAr}.`;

  const linesAr = [daysLine, effortLine, securedLine, nextStepLine];
  assertCalm(linesAr);
  return { daysLine, effortLine, securedLine, nextStepLine, isEmpty: false, linesAr };
}

export type MonthlyInput = {
  reviewsThisMonth: number;
  minutesThisMonth: number;
  /** بيانات المهارات الفعلية — فارغة = لا أشرطة (E18) */
  stats: readonly SkillStat[];
  /** تقديرك لمستواك هذا الشهر بالمئة (F160) — null إن لم تُقدِّر بعد */
  selfEstimatePercent: number | null;
  /** نتيجتك الحقيقية في البوابة بالمئة — null إن لم تُجرَ بعد */
  gateResultPercent: number | null;
  /** لقطة منحنى النسيان — null إن لا مراجعة سابقة */
  retentionNow: { daysSinceReview: number; stabilityDays: number } | null;
};

export type MonthlyReport = {
  monthLine: string;
  skillsLine: string;
  calibrationLine: string;
  retentionLine: string;
  linesAr: readonly string[];
};

/** التقرير الشهري — معايرة تقدير الذات (F160) + أشرطة حقيقية (F159/E18) */
export function monthlyReport(input: MonthlyInput): MonthlyReport {
  const month = monthlyEstimate(input.reviewsThisMonth, input.minutesThisMonth);

  for (const [name, v] of [
    ["selfEstimatePercent", input.selfEstimatePercent],
    ["gateResultPercent", input.gateResultPercent],
  ] as const) {
    if (v !== null && (typeof v !== "number" || v < 0 || v > 100)) {
      throw new Error(`${name}: النسبة بين 0 و100`);
    }
  }

  let skillsLine: string;
  if (input.stats.length === 0) {
    skillsLine = "أشرطة المهارات تظهر أول ما تتدرّب — لا نسب من العدم.";
  } else {
    const bars = skillBars(input.stats);
    const best = bars.reduce((a, b) => (b.accuracy > a.accuracy ? b : a));
    const focus = bars.reduce((a, b) => (b.accuracy < a.accuracy ? b : a));
    skillsLine =
      best.skill === focus.skill
        ? `مهارتك الأقوى هذا الشهر: ${best.labelAr} — ونُبقي عليها.`
        : `مهارتك الأقوى هذا الشهر: ${best.labelAr}، ونُثبّت أكثر في ${focus.labelAr}.`;
  }

  const calibrationLine = calibration(input.selfEstimatePercent, input.gateResultPercent);

  let retentionLine: string;
  if (input.retentionNow === null) {
    retentionLine = "منحنى النسيان يبدأ مع أول مراجعة — ثم نقرأه معك كل شهر.";
  } else {
    const r = retention(input.retentionNow.daysSinceReview, input.retentionNow.stabilityDays);
    const percent = Math.round(r * 100);
    retentionLine = `ذاكرتك تحتفظ بنحو ${percent}% من آخر مراجعة — منحنى النسيان الطبيعي.`;
  }

  const linesAr = [month.noteAr, skillsLine, calibrationLine, retentionLine];
  assertCalm(linesAr);
  return { monthLine: month.noteAr, skillsLine, calibrationLine, retentionLine, linesAr };
}

/** معايرة تقدير الذات (F160) — تقارن التقديرك بنتيجتك الحقيقية، أو تقول بصراحة إن إحداهما ناقصة */
function calibration(self: number | null, gate: number | null): string {
  if (self === null && gate === null) {
    return "لم تُقدِّر مستواك بعد ولم تُجرِ البوابة — المعايرة تبدأ مع أولهما.";
  }
  if (gate === null) {
    return `تقديرك ${self}% جاهز — نقارنه بنتيجة البوابة حين تجريها.`;
  }
  if (self === null) {
    return `نتيجتك الحقيقية ${gate}% — قدّر مستواك الشهر القادم ونقارن.`;
  }
  const delta = Math.abs(self - gate);
  if (delta <= 5) return `تقديرك دقيق جداً — الفارق ${delta}% فقط بين تقديرك (${self}%) ونتيجتك (${gate}%).`;
  if (delta <= 15) return `تقديرك قريب — الفارق ${delta}% بين تقديرك (${self}%) ونتيجتك (${gate}%).`;
  return `الفارق ${delta}% بين تقديرك (${self}%) ونتيجتك (${gate}%) — وهذا طبيعي، والمعايرة تُضبط مع كل شهر.`;
}

/** سطر الخريطة (§2.8): أين أنت وخطوتك التالية — بلا أرقام مخيفة */
export function mapLine(input: { whereAr: string; nextStepAr: string }): string {
  if (input.whereAr.trim().length === 0 || input.nextStepAr.trim().length === 0) {
    throw new Error("سطر الخريطة يحتاج «أين أنت» و«خطوتك التالية»");
  }
  const line = `أنت الآن: ${input.whereAr}. خطوتك التالية: ${input.nextStepAr}.`;
  assertCalm([line]);
  return line;
}

/** حارس D23: كل نص مُولَّد يُمسح من اللوم قبل الخروج — يخترق الخطأ إن تسرب لوم */
function assertCalm(lines: readonly string[]): void {
  for (const line of lines) {
    if (line.length > 0 && hasBlame(line)) {
      throw new Error(`نص غير هادئ تسرب (D23): ${line}`);
    }
  }
}
