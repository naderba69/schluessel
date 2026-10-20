// gate-engine.ts — E17 محرك البوابات | M3
// المصادر: Goethe-Institut (بنية المهارات الأربع Hören/Lesen/Schreiben/Sprechen) · §4 حدود الصدق
// ⚠️ حدود صدق صريحة: **تفاصيل النسخ الحالية من نماذج Goethe (عدد الأجزاء/سلالم الدرجات) تُتحقق ويبياً عند النشر** —
// لا نُطلقها هنا كثوابت. البنية العامة فقط (4 مهارات + بوابة كل 6 أسابيع) هي المبنيّ عليها.

export const GATE_INTERVAL_WEEKS = 6;

export type Skill = "hoeren" | "lesen" | "schreiben" | "sprechen";

export type GateSection = {
  skill: Skill;
  labelDe: string;
  labelAr: string;
  /** مصدر الصيغة: عام (مستقر) أم تفاصيله تُتحقق ويبياً */
  formatSource: "goethe-modell-general" | "needs-web-verify";
  noteAr: string;
};

/** بوابة كل 6 أسابيع — أربع مهارات، صيغتها العامة مستقرة وتفاصيلها الدقيقة تحت تحقق ويب */
export function buildGate(week: number): {
  gateWeek: number;
  sections: readonly GateSection[];
  overallNoteAr: string;
} {
  if (!Number.isInteger(week) || week <= 0) throw new Error("أسبوع غير صالح");
  if (week % GATE_INTERVAL_WEEKS !== 0) {
    throw new Error(`البوابة كل ${GATE_INTERVAL_WEEKS} أسابيع — الأسبوع ${week} ليس أسبوع بوابة`);
  }
  return {
    gateWeek: week,
    sections: Object.freeze([
      { skill: "hoeren", labelDe: "Hören", labelAr: "الاستماع", formatSource: "goethe-modell-general", noteAr: "استماع وفهم — بنية عامة." },
      { skill: "lesen", labelDe: "Lesen", labelAr: "القراءة", formatSource: "goethe-modell-general", noteAr: "قراءة وفهم — بنية عامة." },
      { skill: "schreiben", labelDe: "Schreiben", labelAr: "الكتابة", formatSource: "goethe-modell-general", noteAr: "كتابة رسالة/رسالة قصيرة — بنية عامة." },
      { skill: "sprechen", labelDe: "Sprechen", labelAr: "التحدث", formatSource: "needs-web-verify", noteAr: "صيغة التحدث الدقيقة (أجزاء Introductions/Talk/Plan) تُتحقق من موقع Goethe عند النشر." },
    ]),
    overallNoteAr:
      "⚠️ تفاصيل النسخ الحالية (عدد الأجزاء، سلالم الدرجات، نسب النجاح) تُتحقق ويبياً عند البناء النهائي (§4) — لا تُؤخذ من هنا كمرجع.",
  };
}

export function isGateWeek(week: number): boolean {
  return Number.isInteger(week) && week > 0 && week % GATE_INTERVAL_WEEKS === 0;
}

/** جدول البوابات لفترة — بوابات فقط (لا اختبارات مفاجئة — D23) */
export function gateSchedule(startWeek: number, endWeek: number): number[] {
  if (startWeek > endWeek) throw new Error("نطاق أسابيع مقلوب");
  const out: number[] = [];
  for (let w = startWeek; w <= endWeek; w++) if (isGateWeek(w)) out.push(w);
  return out;
}

export type GateResult = { skill: Skill; percent: number };

export type GateEvaluation = {
  perSkill: { skill: Skill; passed: boolean; percent: number }[];
  overall: boolean;
  noteAr: string;
};

/** عتبة نجاح داخلية **معلنة** (70%) — ليست مقياس Goethe الرسمي (§4) */
export const INTERNAL_PASS_PERCENT = 70;

export function evaluateGate(results: readonly GateResult[]): GateEvaluation {
  const skills: Skill[] = ["hoeren", "lesen", "schreiben", "sprechen"];
  for (const s of skills) {
    if (!results.some((r) => r.skill === s)) throw new Error(`نتيجة ناقصة: ${s}`);
  }
  const perSkill = skills.map((s) => {
    const r = results.find((x) => x.skill === s)!;
    return { skill: s, passed: r.percent >= INTERNAL_PASS_PERCENT, percent: r.percent };
  });
  return {
    perSkill,
    overall: perSkill.every((p) => p.passed),
    noteAr: "العتبة هنا داخلية معلنة (70%) — النجاح الرسمي بمقاييس Goethe يُتحقق ويبياً عند النشر (§4).",
  };
}
