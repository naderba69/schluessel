// learner-state.ts — حالة المتعلم (Dexie/IndexedDB) | قانون 32 + §14 + التيليمتري (§17)
import { z } from "zod";
import { Level, SchemaVersioned, Slug, UnitNumber } from "./common.js";
import { SrsCardState } from "./card.js";

/** جرعة اليوم (study-plan §3‑ب) */
export const DailyDose = z.enum(["minimum-45", "target-90", "ideal-120", "emergency-10"]);
export type DailyDose = z.infer<typeof DailyDose>;

/** التصنيف الثلاثي للأخطاء (§4 — دورة الخطأ) */
export const ErrorKind = z.enum(["systematic", "slip", "fossilized"]);
export type ErrorKind = z.infer<typeof ErrorKind>;

export const ErrorEntry = z.object({
  id: Slug,
  kind: ErrorKind,
  skill: z.enum(["hoeren", "lesen", "schreiben", "sprechen", "grammar", "vocab"]),
  payload: z.object({
    wrong: z.string(),
    correct: z.string(),
    explanation: z.string(),
    source: z.string(), // lessonId / exerciseId
  }),
  /** الهفوة لا تُنشئ بطاقة SRS (§4) */
  srsCardId: Slug.optional(),
  remedialExercises: z.array(z.string()).default([]),
  occurrences: z.number().int().min(1).default(1),
  resolved: z.boolean().default(false),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
});
export type ErrorEntry = z.infer<typeof ErrorEntry>;

/** سجل الجلسة اليومية (القياس اليومي — study-plan §14) */
export const SessionLog = z.object({
  date: z.string(), // ISO day
  dose: DailyDose,
  durationMinutes: z.number().nonnegative(),
  canDoTicks: z.array(z.object({ statement: z.string(), done: z.boolean() })).default([]),
  wordsNew: z.number().nonnegative().default(0),
  wordsPlanned: z.number().nonnegative().default(0),
  srsMinutes: z.number().nonnegative().default(0),
  srsDueRemaining: z.number().nonnegative().default(0),
  listeningMinutes: z.number().nonnegative().default(0),
  shadowingMinutes: z.number().nonnegative().default(0),
  /** سطر التأمل (Zimmerman — ب‑12) */
  reflection: z.object({ learned: z.string().optional(), tomorrow: z.string().optional() }).optional(),
});
export type SessionLog = z.infer<typeof SessionLog>;

/** معايرة التوقع (slider ↔ نتيجة — §14) */
export const CalibrationEntry = z.object({
  date: z.string(),
  predicted: z.number().min(0).max(100),
  actual: z.number().min(0).max(100),
  lessonId: z.string().optional(),
});
export type CalibrationEntry = z.infer<typeof CalibrationEntry>;

/** نتيجة بوابة (درس/وحدة/مستوى) */
export const GateResult = z.object({
  gateId: z.string(),
  kind: z.enum(["lesson-quiz", "unit-battle", "delayed-battle", "kurztest", "monthly", "level-exam"]),
  score: z.number().min(0).max(1),
  passed: z.boolean(),
  attempts: z.number().int().min(1),
  weakSections: z.array(z.string()).default([]),
  /** D117: بنود مفتوحة حكم المتعلم بصحتها بعد رؤية النموذج (صيغة صحيحة أخرى) — تُحتسب وتُعلَن في السجل، لا تُخفى */
  selfJudged: z.number().int().nonnegative().optional(),
  date: z.string(),
  /** المعركة المؤجلة: 20% سياقات جديدة (Transfer) */
  transferShare: z.number().min(0).max(1).optional(),
});
export type GateResult = z.infer<typeof GateResult>;

export const LearnerProfile = SchemaVersioned.extend({
  name: z.string().min(1),
  createdAt: z.string(),
  level: Level,
  /** الطقوس المكتملة (الوحدة صفر — Just-In-Time) */
  unit0Shown: z.array(z.string()).default([]),
  streak: z.object({
    current: z.number().nonnegative(),
    freezesUsedThisMonth: z.number().min(0).max(3), // 3 تجميدات/شهر (§14)
    lastDay: z.string().optional(),
  }),
  /** نوى الوعي المعرفي: سجل المعايرة */
  calibration: z.array(CalibrationEntry).default([]),
});
export type LearnerProfile = z.infer<typeof LearnerProfile>;

export const LearnerProgress = SchemaVersioned.extend({
  completedLessons: z.array(z.string()).default([]),
  availableLessons: z.array(z.string()).default([]),
  lockedLessons: z.array(z.string()).default([]),
  gateResults: z.array(GateResult).default([]),
  /** D112: كان max(12) فلم يكن ممكناً تمثيل متعلم في أسبوع الامتحان (الوحدة 13 آنذاك) — عيب كامن أُصلح */
  currentUnit: z.object({ level: Level, unit: UnitNumber }),
  /** نتيجة Niveauprüfung لكل مستوى */
  levelExams: z.record(z.string(), z.array(GateResult)).default({}),
});
export type LearnerProgress = z.infer<typeof LearnerProgress>;

export const TelemetryCounter = z.object({
  skill: z.string(),
  attempts: z.number().nonnegative(),
  errors: z.number().nonnegative(),
  meanErrorRate: z.number().min(0).max(1),
  /** قانون 27: ≥5 محاولات + انحراف ضعف المتوسط → SUSPECT */
  suspect: z.boolean().default(false),
});
export type TelemetryCounter = z.infer<typeof TelemetryCounter>;

export const BackupMeta = z.object({
  lastSnapshotAt: z.string().optional(),
  lastSnapshotRepo: z.string().optional(),
  lastZipExportAt: z.string().optional(),
  lastRestoreAt: z.string().optional(),
  lastIntegrityCheck: z.object({ ok: z.boolean(), at: z.string() }).optional(),
});
export type BackupMeta = z.infer<typeof BackupMeta>;

export const LearnerState = SchemaVersioned.extend({
  profile: LearnerProfile,
  progress: LearnerProgress,
  srsCards: z.array(SrsCardState).default([]),
  sessions: z.array(SessionLog).default([]),
  errors: z.array(ErrorEntry).default([]),
  telemetry: z.array(TelemetryCounter).default([]),
  backup: BackupMeta.default({}),
});
export type LearnerState = z.infer<typeof LearnerState>;
