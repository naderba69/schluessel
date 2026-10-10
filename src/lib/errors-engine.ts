// src/lib/errors-engine.ts — محرك الأخطاء E04: دفتر الأخطاء الذهبية + الجولة الإلزامية + «الخطأ العابر»
// المصادر: الدستور §4 (دورة الخطأ الثلاثية — إجبارية) · F112 · F038 (قاعدة الدقائق الثلاث) · §2.7
// الحارس: كل خطأ → قيد دفتر + جولة إلزامية؛ الهفوة لا تُنشئ بطاقة SRS (§4 — الدستور أرقى)
import type { ErrorEntry, ErrorKind } from "../../content/schemas/index.js";

export const FOSSILIZED_AFTER_REPETITIONS = 3; // ≥3 تكرارات لنفس الخطأ بعد تصحيحه = متحجر (§4)
export const SYSTEMATIC_REMEDIAL_EXERCISES = 3; // خطأ نظامي: 3 تمارين علاجية مستهدفة (§4)
export const SLIP_REMEDIAL_EXERCISES = 1; // هفوة: تمرين واحد فقط (§4)
export const ERROR_RESHOW_GAP_MIN = 3; // قاعدة الدقائق الثلاث (F038) — فجوة التذكر

export type ErrorSkill = ErrorEntry["skill"];

export type ClassifyHints = {
  /** كم مرة تكرر الخطأ بعد تصحيحه؟ */
  repeats?: number;
  /** هل القاعدة/الكلمة مُتقنة سابقاً؟ */
  wasMastered?: boolean;
};

/**
 * التصنيف الآلي (تيليمتري §4): متحجر ← هفوة ← نظامي، مع زر تبديل يدوي في `captureError`.
 * - متحجر: ≥3 تكرارات لنفس الخطأ بعد تصحيحه (يعرف القاعدة لكنها صارت عادة)
 * - هفوة (Flüchtigkeit — «الخطأ العابر»): قاعدة مُتقنة + خطأ سريع/تحت التعب
 * - نظامي: يجهل القاعدة/التمييز
 */
export function autoClassify(hints: ClassifyHints): ErrorKind {
  if ((hints.repeats ?? 0) >= FOSSILIZED_AFTER_REPETITIONS) return "fossilized";
  if (hints.wasMastered) return "slip";
  return "systematic";
}

export type ErrorProcessing = {
  /** بطاقة SRS جديدة؟ (§4: للنظامي فقط — الهفوة والمتحجر لا) */
  createSrsCard: boolean;
  /** عدد التمارين العلاجية المستهدفة */
  remedialExercises: number;
  /** ظهور متباعد للمعالجة */
  spacedReappearance: boolean;
  /** Contrast Drills مكثفة (أزواج متقابلة) */
  contrastDrills: boolean;
  /** إشعار مولر الهادئ */
  mullerNotice: boolean;
  /** متابعة أسبوعية حتى انعدام التكرار */
  weeklyFollowUp: boolean;
};

/** المعالجة حسب النوع (جدول §4 — إجبارية، لا معالجة واحدة للكل) */
export function processingFor(kind: ErrorKind): ErrorProcessing {
  switch (kind) {
    case "systematic":
      return {
        createSrsCard: true,
        remedialExercises: SYSTEMATIC_REMEDIAL_EXERCISES,
        spacedReappearance: true,
        contrastDrills: false,
        mullerNotice: false,
        weeklyFollowUp: false,
      };
    case "slip":
      // «الخطأ العابر»: لا بطاقة SRS — ملاحظة في الدفتر + تمرين واحد فقط
      return {
        createSrsCard: false,
        remedialExercises: SLIP_REMEDIAL_EXERCISES,
        spacedReappearance: false,
        contrastDrills: false,
        mullerNotice: false,
        weeklyFollowUp: false,
      };
    case "fossilized":
      return {
        createSrsCard: false,
        remedialExercises: 0,
        spacedReappearance: false,
        contrastDrills: true,
        mullerNotice: true,
        weeklyFollowUp: true,
      };
  }
}

/** «الخطأ العابر» = الهفوة (F008) — يمر مروراً خفيفاً، بلا سلاسل ضغط (D23) */
export function isTransient(kind: ErrorKind): boolean {
  return kind === "slip";
}

export type CaptureErrorInput = {
  id: string;
  skill: ErrorSkill;
  wrong: string;
  correct: string;
  /** لماذا أخطأه الناطق بالعربية تحديداً (§2.7) */
  explanation: string;
  /** lessonId / exerciseId */
  source: string;
  /** مدخلات التصنيف الآلي (تيليمتري) */
  hints?: ClassifyHints;
  /** زر التبديل اليدوي (§4) — يُلغي التصنيف الآلي إن وُجد */
  kind?: ErrorKind;
  srsCardId?: string;
  createdAt?: string;
};

/**
 * كل خطأ → قيد دفتر (بطاقة) + موضع في الجولة الإلزامية (F112 — «أخطاؤك هي كنزك»).
 * القيد يحمل المعالجة الجاهزة حسب النوع (تمارين علاجية مولَّدة).
 */
export function captureError(input: CaptureErrorInput): ErrorEntry {
  const kind = input.kind ?? autoClassify(input.hints ?? {});
  const processing = processingFor(kind);
  return {
    id: input.id,
    kind,
    skill: input.skill,
    payload: {
      wrong: input.wrong,
      correct: input.correct,
      explanation: input.explanation,
      source: input.source,
    },
    // بطاقة SRS للنظامي فقط (§4) — تُربط برأسها إن مرّرتها الواجهة
    ...(processing.createSrsCard && input.srsCardId ? { srsCardId: input.srsCardId } : {}),
    remedialExercises: Array.from(
      { length: processing.remedialExercises },
      (_, i) => `remedial-${i + 1}`,
    ),
    occurrences: 1,
    resolved: false,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

/** «كل خطأ → بطاقة» (E04): بطاقة SRS للمخطئ النظامي فقط — الهفوة والمُتَجذِّر بلا بطاقة (§4) */
export function srsCardIdFor(entry: ErrorEntry): string | null {
  return processingFor(entry.kind).createSrsCard ? `err-${entry.id}` : null;
}

/**
 * تسجيل تكرار بعد تصحيح سابق: التكرار الثالث (occurrences ≥ 3) = تصلّب (§4).
 * الخطأ العائد يعود «غير محلول» فيدخل الجولة من جديد — بلا لوم (D23).
 */
export function registerRecurrence(
  entry: ErrorEntry,
  opts: { correctedBefore: boolean },
): ErrorEntry {
  const occurrences = entry.occurrences + 1;
  const fossilized = opts.correctedBefore && occurrences >= FOSSILIZED_AFTER_REPETITIONS;
  return {
    ...entry,
    occurrences,
    kind: fossilized ? "fossilized" : entry.kind,
    resolved: false,
  };
}

/**
 * الجولة الإلزامية (§2.7): كل الأخطاء غير المحلولة، الأقدم التقاطاً أولاً —
 * تُجرى في بداية كل جلسة (المحطة 1 — ربط E06/E03).
 */
export function buildErrorRound(entries: ErrorEntry[]): ErrorEntry[] {
  return entries
    .filter((e) => !e.resolved)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** هل الجولة إلزامية اليوم؟ (ما دام هناك خطأ غير محلول — لا تُتخطى) */
export function errorRoundRequired(entries: ErrorEntry[]): boolean {
  return entries.some((e) => !e.resolved);
}

/** حارس الجولة الإلزامية: كل الأخطاء غير المحلولة يجب أن تكون في جولة الجلسة */
export function sessionIncludesMandatoryRound(
  entries: ErrorEntry[],
  roundIds: string[],
): boolean {
  if (!errorRoundRequired(entries)) return true; // لا جولة مطلوبة = لا حرج
  return buildErrorRound(entries).every((e) => roundIds.includes(e.id));
}

/**
 * F038 — قاعدة الدقائق الثلاث: بعد أي خطأ، إعادة العرض بعد 3 دقائق لا فوراً
 * (فجوة التذكر — الاسترجاع بعد نسيان جزئي أعمق أثراً).
 */
export function reshowAt(erroredAt: Date): Date {
  return new Date(erroredAt.getTime() + ERROR_RESHOW_GAP_MIN * 60_000);
}

export function canReshow(erroredAt: Date, now: Date): boolean {
  return now.getTime() >= reshowAt(erroredAt).getTime();
}
