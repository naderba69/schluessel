// lesson.ts — مخطط الدرس | تشريح الدرس الثابت (§3) + الأهداف اليومية (study-plan v6.1)
import { z } from "zod";
import { ArText, DeText, Level, SchemaVersioned, Slug, UnitNumber } from "./common.js";

/** أنواع محطات Übung (§3 — 3–4 محطات + مهمة تواصلية ختامية) */
export const StationType = z.enum([
  "choice", "gap-fill", "build-sentence", "match", "dictation",
  "gender-drill", "case-drill", "verb-bank", "error-hunt", "mini-pronunciation",
  "listening", "reading", "writing", "speaking",
]);

export const CommunicativeTask = z.object({
  /** مهمة تواصلية حقيقية بإنجاز غرض (CLT — د‑01) */
  goal: z.object({ de: DeText, ar: ArText }),
  situation: z.object({ de: DeText, ar: ArText }),
  successCriteria: z.array(z.string()).min(1),
});

export const UebungStation = z.object({
  type: StationType,
  items: z.array(z.record(z.string(), z.unknown())).min(1),
  /** بنيات سابقة تُخلط معها (Interleaving — من الدرس الثالث، §3) */
  interleavedWith: z.array(z.string()).default([]),
  hints: z.array(z.string()).max(3).optional(),
  /** تصحيح فوري تفسيري: لماذا الخطأ لا «خطأ» فقط */
  explanationRequired: z.boolean().default(true),
});

export const PretestItem = z.object({
  /** تخمين انتقائي 1–2 عنصران محوريان فقط (القانون 21) */
  prompt: z.object({ de: DeText.optional(), ar: ArText.optional() }),
  choices: z.array(z.string()).optional(),
  answer: z.string(),
  /** الكشف مؤجَّل إلى جلسة الغد (لا كشف فوري) */
  revealNextSession: z.literal(true),
});

export const QuizVariant = z.object({
  items: z.array(z.record(z.string(), z.unknown())).min(3),
  passingScore: z.number().min(0.75).max(1).default(0.75),
});

export const WarningCard = z.object({
  /** الخطأ الشائع ← لماذا يقع فيه العربي ← الصحيح + تمرينه */
  commonError: z.object({ de: DeText, ar: ArText }),
  whyArabicSpeakerFails: z.string(),
  correct: z.object({ de: DeText, ar: ArText }),
  exercise: z.record(z.string(), z.unknown()),
});

export const Lesson = SchemaVersioned.extend({
  id: Slug, // مثال: a1-u3-d2
  level: Level,
  unit: UnitNumber, // A1: 1–12 الخطة · 13–14 تكملة SD1 للفهم (D113) · 15 أسبوع التثبيت والامتحان (D92 → D112 → D113)
  day: z.number().int().min(1).max(8), // D1..D7 (+D8 للأسبوع المرن)
  kind: z.enum(["content", "integration"]).default("content"), // D6 = integration (درس التوليف)
  /** 1. Ziel — هدف سلوكي قابل للقياس بصوت المعلم */
  ziel: z.object({ de: DeText, ar: ArText }),
  /** Can‑do يومي (1–2 سلوكية) — تُوقَّع في التفريغ (study-plan §3‑أ) */
  canDoDaily: z.array(z.string()).min(1).max(2),
  /** 2. الدفء (MR2 الجديد) */
  warmup: z.object({ cardIds: z.array(Slug).min(2).max(3) }),
  /** 3. Einstieg — تخمين انتقائي + استرجاع موجَّه */
  einstieg: z.object({
    pretestItems: z.array(PretestItem).min(1).max(2),
    guidedRetrieval: z.array(z.string()).default([]),
  }),
  /** 4. Präsentation — طقس أول لقاء */
  praesentation: z.object({
    wordIds: z.array(Slug).min(1),
    grammarArsenalIds: z.array(z.string()).default([]),
    storySentenceIds: z.array(z.string()).default([]),
    dualCodingRequired: z.literal(true), // §15‑هـ إلزامي
    riskFlagsShown: z.array(z.string()).default([]),
  }),
  /** 5. Übung — محطات + خلط + مهمة تواصلية ختامية */
  uebung: z.object({
    stations: z.array(UebungStation).min(3).max(4),
    communicativeTask: CommunicativeTask,
  }),
  /** 6. Slider — توقّع الدرجة + معايرة فورية (§14) */
  slider: z.object({ questionDe: DeText, questionAr: ArText, min: z.number(), max: z.number() }),
  /** 7. Quiz — 3 نسخ تتبادل تلقائياً (قانون 21/§3) */
  quiz: z.object({
    variants: z.tuple([QuizVariant, QuizVariant, QuizVariant]),
  }),
  /** 8. Zusammenfassung + حزمة SRS */
  zusammenfassung: z.object({
    summary: z.object({ de: DeText, ar: ArText }),
    warningCards: z.array(WarningCard).default([]),
    srsBundleWordIds: z.array(Slug).min(1),
  }),
  /** منطقة التحدي (§12‑ب) — ≤5% اختيارية بالكامل */
  challengeZone: z
    .object({
      grammarRef: z.string(),
      items: z.array(z.record(z.string(), z.unknown())),
      badge: z.literal("🚧 فوق مستواك الحالي — تحدٍّ اختياري"),
    })
    .optional(),
  /** أدلة G2 (روابط موثقة) */
  gReferences: z.object({
    duden: z.array(z.string().url()).default([]),
    wiktionary: z.array(z.string().url()).default([]),
    goethe: z.array(z.string().url()).default([]),
  }),
  /** ملفات الخزانة المستهلكة (تحدّث 10‑ح تلقائياً) */
  usedArsenalIds: z.array(z.string()).default([]),
  audioManifestRefs: z.array(z.string()).default([]),
  imageManifestRefs: z.array(z.string()).default([]),
  /** مطابقة المنهج المرجعي (D15 — §10‑ط) */
  curriculumRef: z.object({
    netzwerkChapter: z.string(),
    goetheWordListOverlap: z.array(Slug).default([]),
  }),
});
export type Lesson = z.infer<typeof Lesson>;
