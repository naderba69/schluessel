// lesson.ts — مخطط الدرس | تشريح الدرس الثابت (§3) + الأهداف اليومية (study-plan v6.1)
import { z } from "zod";
import { ArText, DeText, Level, SchemaVersioned, Slug, UnitNumber } from "./common.js";

/** أنواع محطات Übung (§3 — 3–4 محطات + مهمة تواصلية ختامية) */
export const StationType = z.enum([
  "choice", "gap-fill", "build-sentence", "match", "dictation",
  "gender-drill", "case-drill", "verb-bank", "error-hunt", "mini-pronunciation",
  "listening", "reading", "writing", "speaking",
]);
export type StationType = z.infer<typeof StationType>;

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

/** شرح «لماذا» بالعربية بعد المحاولة (§3: تصحيح فوري تفسيري — لا «خطأ» فقط) */
export const WhyAr = z
  .string()
  .min(12, { message: "شرح why أقصر من أن يشرح (≥12 حرفاً)" })
  .regex(/[\u0600-\u06FF]/, { message: "شرح why يُكتب بالعربية" });
const ItemText = z.string().min(1);
const distinct = (xs: readonly string[]) => new Set(xs).size === xs.length;

/**
 * بند Quiz مُنمَّط: سؤال + إجابة (+ خيارات تضم الإجابة) + why اختياري يُعرض بعد التصحيح.
 * D117: صار شكل **كل** بنود الـQuiz في **كل** درس (لا الدروس المُرقّاة فقط) — فالـQuiz بوابة تقفل المسار (≥75%)
 * وبند لا يُصحَّح (إجابة خارج خياراتها) يُسقط متعلماً أجاب صواباً. accept = صيغ صحيحة أخرى للإجابة المفتوحة.
 */
export const QuizItem = z
  .object({
    q: ItemText,
    a: ItemText,
    choices: z.array(ItemText).min(2).max(5).optional(),
    accept: z.array(ItemText).min(1).optional(),
    why: WhyAr.optional(),
  })
  .strict()
  .refine((i) => !i.choices || i.choices.includes(i.a), { message: "الإجابة ليست بين الخيارات" })
  .refine((i) => !i.choices || distinct(i.choices), { message: "خيارات مكررة" })
  .refine((i) => !(i.choices && i.accept), { message: "accept للإجابة المفتوحة فقط — مع الخيارات الإجابة واحدة" })
  .refine((i) => !i.accept || distinct([i.a, ...i.accept]), { message: "accept يكرر الإجابة أو يكرر نفسه" });
export type QuizItem = z.infer<typeof QuizItem>;

export const QuizVariant = z.object({
  items: z.array(QuizItem).min(3),
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
    /**
     * D188 (قرار المالك 2026-10-18 — «الأمانة قبل الطبيعية»): كلمة مستعارة من درس لاحق تُعلَن للمتعلم بدل ليّ الجملة.
     * تصل إلى الشاشة (ترجمة على الكلمة + صندوق «كلمات مستعارة» قبل التدريب) ويقبلها حارس الجبهة بصيغتها هذه وحدها.
     * ≤2 لكل درس — والحارس يرفض المستعارة غير المستعملة أو المدروسة أصلاً أو التي ليست صيغة للكلمة المذكورة.
     */
    borrowedWords: z.array(z.object({
      /** الصيغة كما تظهر في النص (fragt) */
      form: z.string().regex(/^\p{L}+$/u),
      /** معرّف بطاقة الكلمة التي تُدرَّس لاحقاً (fragen) */
      wordId: Slug,
      ar: ArText,
      /** لماذا استُعيرت هنا — للمتعلم بالعربية */
      whyAr: ArText,
    })).max(2).default([]),
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

// ——— D115: بنود التدريب المُنمَّطة (حارس الترقية — D114) ———
// مخطط الدرس العام يبقى مرناً (المحتوى القديم صالح كما هو)؛ هذه الأشكال يفرضها حارس الترقية
// (tools/lib/lesson-upgrade.ts) على كل درس عُلِّم تدريبه done في خطة الترقية — ويقرؤها المُشغِّل للتصحيح التفسيري.

const AudioId = z.string().regex(/^[a-z0-9-]+$/, { message: "معرّف مسار صوتي من المانيفست" });

/** كلمات الجملة كما تُعرض بطاقاتٍ للترتيب — علامة الترقيم تبقى ملتصقة بكلمتها */
export const sentenceTokens = (s: string): string[] => s.trim().split(/\s+/).filter(Boolean);
/** صيغة المقارنة في الإملاء: بلا علامة ترقيم نهائية ولا فراغات زائدة — الحرف الكبير جزء من التهجئة */
export const dictationForm = (s: string): string => s.trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "");
/** حرف كبير يحفظ ß (‎"ß".toUpperCase() = "SS" في JS ← كانت «Strasse» ستطابق «Straße» المتهجّاة) */
const upperKeepSz = (s: string): string => [...s].map((c) => (c === "ß" ? c : c.toUpperCase())).join("");
/**
 * حروف التهجئة المسموعة مجموعةً (D120): «M, Ü, L, L, E, R.» ← «MÜLLER» · null إن لم يكن النص حرفين مفردين فأكثر
 * بفواصل أو شرطات (لا كلمة ولا اسم قبل الحروف).
 */
export const spelledLetters = (s: string): string | null => {
  const parts = s.trim().replace(/[.!?]+$/, "").split(/\s*[,–-]\s*/).filter(Boolean);
  return parts.length >= 2 && parts.every((p) => /^\p{L}$/u.test(p)) ? upperKeepSz(parts.join("")) : null;
};
const sameMultiset = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && [...a].sort().join("\u0000") === [...b].sort().join("\u0000");

/** اختيار: الإجابة من الخيارات · بلا تكرار (choice · gender-drill · case-drill) */
export const ChoiceItem = z
  .object({ q: ItemText, choices: z.array(ItemText).min(2).max(5), a: ItemText, why: WhyAr })
  .strict()
  .refine((i) => i.choices.includes(i.a), { message: "الإجابة ليست بين الخيارات" })
  .refine((i) => distinct(i.choices), { message: "خيارات مكررة" });

/** ملء الفراغ: السؤال يحمل ___ · accept صيغ صحيحة بديلة (gap-fill · verb-bank) */
export const GapFillItem = z
  .object({ q: ItemText.refine((s) => s.includes("___"), { message: "بند فراغ بلا ___" }), a: ItemText, accept: z.array(ItemText).optional(), why: WhyAr })
  .strict();

/** ترتيب الجملة: البطاقات هي كلمات الإجابة نفسها وليست مرتبة سلفاً */
export const BuildSentenceItem = z
  .object({ q: ItemText.optional(), tokens: z.array(ItemText).min(3).max(10), a: ItemText, why: WhyAr })
  .strict()
  .refine((i) => sameMultiset(i.tokens, sentenceTokens(i.a)), { message: "بطاقات الترتيب ليست كلمات الإجابة نفسها" })
  .refine((i) => i.tokens.join(" ") !== sentenceTokens(i.a).join(" "), { message: "البطاقات مرتبة سلفاً — لا تمرين" });

/** صيد الخطأ: جملة خاطئة ← تصحيحها (q ≠ a) */
export const ErrorHuntItem = z
  .object({ q: ItemText, a: ItemText, accept: z.array(ItemText).optional(), why: WhyAr })
  .strict()
  .refine((i) => i.q.trim() !== i.a.trim(), { message: "الجملة الخاطئة هي الصحيحة نفسها" });

/** إنتاج حر (speaking · writing): مهمة + نموذج إجابة — تقييم ذاتي، فالتعرّف الآلي لا يحكم (قانون ASR) */
export const ProductionItem = z.object({ q: ItemText, a: ItemText, why: WhyAr }).strict();

/** استماع: مسار صوتي موجود + نصه المنطوق (للاحتياطي) ← اختيار (listening · mini-pronunciation) */
export const ListeningItem = z
  .object({ audioId: AudioId, speakText: DeText, q: ItemText, choices: z.array(ItemText).min(2).max(5), a: ItemText, why: WhyAr })
  .strict()
  .refine((i) => i.choices.includes(i.a), { message: "الإجابة ليست بين الخيارات" })
  .refine((i) => distinct(i.choices), { message: "خيارات مكررة" });

/**
 * إملاء: ما يُكتب هو ما يُسمع حرفياً (عدا علامة الترقيم الأخيرة).
 * spelled (D120 — إملاء الحروف): المسموع حروف متهجّاة والإجابة الكلمة نفسها مجموعةً («L, E, N, A.» ← Lena)
 * — مهارة A1 (تهجئة الاسم عند التسجيل)؛ والقاعدة قابلة للتحقق: الحروف المجموعة = الإجابة (بلا اعتبار لحالة الحرف).
 */
export const DictationItem = z
  .object({ audioId: AudioId, speakText: DeText, a: ItemText, spelled: z.literal(true).optional(), why: WhyAr })
  .strict()
  .refine(
    (i) =>
      i.spelled
        ? spelledLetters(i.speakText) !== null && spelledLetters(i.speakText) === upperKeepSz(dictationForm(i.a))
        : dictationForm(i.a) === dictationForm(i.speakText),
    { message: "إجابة الإملاء ليست النص المسموع (ولا حروفه المتهجّاة مجموعةً مع spelled)" },
  );

/** توصيل: أزواج ألماني↔عربي بلا تكرار في أي طرف */
export const MatchItem = z
  .object({ q: ItemText.optional(), pairs: z.array(z.object({ de: DeText, ar: ArText }).strict()).min(3).max(6), why: WhyAr })
  .strict()
  .refine((i) => distinct(i.pairs.map((p) => p.de)) && distinct(i.pairs.map((p) => p.ar)), { message: "أزواج توصيل مكررة" });

/** قراءة: نص قصير ← سؤال (اختيار أو إجابة قصيرة) */
export const ReadingItem = z
  .object({ text: DeText, q: ItemText, choices: z.array(ItemText).min(2).max(5).optional(), a: ItemText, why: WhyAr })
  .strict()
  .refine((i) => !i.choices || i.choices.includes(i.a), { message: "الإجابة ليست بين الخيارات" });

/** شكل البند لكل نوع محطة — كل الأنواع الأربعة عشر مغطاة (لا نوع بلا شكل) */
export const PRACTICE_ITEM_SHAPES = {
  choice: ChoiceItem,
  "gender-drill": ChoiceItem,
  "case-drill": ChoiceItem,
  "gap-fill": GapFillItem,
  "verb-bank": GapFillItem,
  "build-sentence": BuildSentenceItem,
  "error-hunt": ErrorHuntItem,
  speaking: ProductionItem,
  writing: ProductionItem,
  listening: ListeningItem,
  "mini-pronunciation": ListeningItem,
  dictation: DictationItem,
  match: MatchItem,
  reading: ReadingItem,
} as const satisfies Record<StationType, z.ZodType>;

/** محطات الصوت: تشير إلى مسار موجود في المانيفست (D114: «الاستماع بالصوت الموجود والإملاء») */
export const AUDIO_STATION_TYPES = ["listening", "mini-pronunciation", "dictation"] as const;

