// gate-engine.ts — E17 محرك البوابات | M3
// المصادر: Goethe-Institut (بنية المهارات الأربع Hören/Lesen/Schreiben/Sprechen) · §4 حدود الصدق
// ⚠️ حدود صدق صريحة (N-029 ← D234): صيغة Sprechen متحقق منها من وثائق Goethe الرسمية
// (Prüfungsziele/Testbeschreibung A1 SD1 ط4 ©2022 · Modellsatz · Übungssatz 01 · bfu.goethe.de — أكتوبر 2026):
// 3 أجزاء (التعارف · الأسئلة والأجوبة · صياغة طلب والرد عليه) في مجموعة ≤4 بلا تحضير — 15 دقيقة · 25 نقطة.
// تُعاد المراجعة عند النشر إن حدّث المعهد نماذجه. العتبة الداخلية (70%) ليست مقياس Goethe الرسمي (§4).

export const GATE_INTERVAL_WEEKS = 6;

export type Skill = "hoeren" | "lesen" | "schreiben" | "sprechen";

export type GateSection = {
  skill: Skill;
  labelDe: string;
  labelAr: string;
  /** مصدر الصيغة: بنية عامة مستقرة · متحقق من وثائق Goethe (N-029) · أم تفاصيله تُتحقق ويبياً */
  formatSource: "goethe-modell-general" | "goethe-verifiziert" | "needs-web-verify";
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
      { skill: "sprechen", labelDe: "Sprechen", labelAr: "التحدث", formatSource: "goethe-verifiziert", noteAr: "التحدث: 3 أجزاء (التعارف مع التهجية ورقم هاتف · أسئلة وأجوبة ببطاقات المواضيع · صياغة طلب والرد عليه ببطاقات الصور) — مجموعة ≤4 بلا تحضير · 15 دقيقة · 25 نقطة (وثائق Goethe الرسمية، أكتوبر 2026)." },
    ]),
    overallNoteAr:
      "⚠️ صيغة Sprechen متحقق منها (أكتوبر 2026) وتُعاد مراجعتها عند النشر إن حدّث المعهد نماذجه (§4) — والعتبة الداخلية ليست مقياس Goethe.",
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
