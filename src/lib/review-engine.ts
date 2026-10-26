// src/lib/review-engine.ts — محرك المراجعة E03: ربط SRS بمحطة الاسترجاع (المحطة 1)
// المصادر: retrieval practice (Roediger & Karpicke 2006) · D6 (ts-fsrs بمعاملات افتراضية) · F121 · §2.5
// الحارس الحاسم: لا جلسة بلا استرجاع أولاً (اختبار يقفله) — الجديد لا يدخل محطة الاسترجاع أبداً
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card as FsrsCard,
} from "ts-fsrs";
import type { SrsCardState } from "../../content/schemas/index.js";

/** ts-fsrs: التقييم الفعلي (بلا Manual) — النوع غير مصدَّر من الحزمة */
type Grade = Exclude<Rating, Rating.Manual>;

export const RECALL_STATION_MINUTES = 15; // محطة 1 في E01 (15/40/50/15)

/** §2.5: أربعة تقييمات — نسيت | صعب | جيد | سهل */
export const RECALL_RATINGS = ["again", "hard", "good", "easy"] as const;
export type RecallRating = (typeof RECALL_RATINGS)[number];

export const RATING_LABELS_AR: Record<RecallRating, string> = {
  again: "نسيت",
  hard: "صعب",
  good: "جيد",
  easy: "سهل",
};

export const RATING_TO_FSRS: Record<RecallRating, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

/** FSRS بمعاملات افتراضية حرفياً (D6/D25) — لا تخصيص ولا تحسين قبل ≥1000 مراجعة */
const scheduler = fsrs(generatorParameters());

/** تحويل الحالة المخزَّنة إلى بطاقة ts-fsrs (الحقول كلها — لا فقد) */
export function toFsrsCard(s: SrsCardState): FsrsCard {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsed_days,
    scheduled_days: s.scheduled_days,
    learning_steps: s.learning_steps ?? 0,
    reps: s.reps,
    lapses: s.lapses,
    // ts-fsrs v5: state رقمي (enum) — الاسم النصي يُحوَّل لرقمه هنا
    state: State[s.state] as State,
    ...(s.last_review ? { last_review: new Date(s.last_review) } : {}),
  };
}

/** العكس: بطاقة ts-fsrs → حالة المتعلم (تُحفظ masteryLevel كما هي) */
export function fromFsrsCard(card: FsrsCard, prev: SrsCardState): SrsCardState {
  return {
    ...prev,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    // ts-fsrs v5: state رقمي — يُحوَّل لاسمه النصي (درس tests/mastery.test.ts)
    state: State[card.state] as SrsCardState["state"],
    last_review: card.last_review?.toISOString(),
  };
}

/**
 * §2.5: التقييم الذاتي بعد الكشف — والتطبيق يحسب الموعد القادم (FSRS) بدل المتعلم.
 * التقويم بمعاملات D6 الافتراضية؛ `.card` هو ناتج ts-fsrs v5.
 */
export function scheduleRecall(
  prev: SrsCardState,
  rating: RecallRating,
  now: Date = new Date(),
): SrsCardState {
  const result = scheduler.next(toFsrsCard(prev), now, RATING_TO_FSRS[rating]);
  return fromFsrsCard(result.card, prev);
}

/**
 * N-005 (D227 — دورة ربط SRS): حزمة الدرس تدخل مجموعة المراجعة عند النجاح.
 * البطاقة الجديدة = مصنع ts-fsrs نفسه (New · مستحقة الآن · معاملات D6 الافتراضية) + L0 — لا أرقام يدوية.
 * المعرّف المسجَّل لا يتكرر (خمولية صريحة).
 */
export function enrollSrsCards(existing: readonly SrsCardState[], wordIds: readonly string[], now: Date = new Date()): SrsCardState[] {
  const have = new Set(existing.map((c) => c.cardId));
  const fresh: SrsCardState[] = [];
  for (const id of wordIds) {
    if (have.has(id)) continue;
    have.add(id);
    fresh.push({ ...fromFsrsCard(createEmptyCard(now), { cardId: id } as SrsCardState), cardId: id, masteryLevel: "L0" });
  }
  return fresh;
}

/** عناصر محطة الاسترجاع — لا «new» هنا إطلاقاً (الجديد محطة 2 فقط) */
export const RECALL_ITEM_KINDS = ["error-round", "srs", "skill"] as const;
export type RecallItemKind = (typeof RECALL_ITEM_KINDS)[number];
export type RecallItem = { kind: RecallItemKind; id: string; due: string };

/** حدود الجولة (F112): الأخطاء الذهبية كلها تدخل الجولة، بلا سقف صارم — تُحسم في الواجهة */

export function buildRecallQueue(opts: {
  now: Date;
  /** بطاقات SRS المرشحة — يُنتقى منها المستحقة فقط (لا مستقبل ولا جديد) */
  dueCards: SrsCardState[];
  /** جولة الأخطاء الذهبية (E04) — الأقدم التقاطاً يمر أولاً */
  errorItems?: { id: string; capturedOn: string }[];
  /** مهارة اليوم (F007) — استرجاع مهارة مُتعلَّمة سابقاً فقط */
  skillOfDay?: string;
}): RecallItem[] {
  // 1) جولة الأخطاء الذهبية أولاً (أقدم أولاً — §12 + §2.7): أخطاؤك هي كنزك
  const errors: RecallItem[] = [...(opts.errorItems ?? [])]
    .sort((a, b) => a.capturedOn.localeCompare(b.capturedOn))
    .map((e) => ({ kind: "error-round" as const, id: e.id, due: e.capturedOn }));

  // 2) البطاقات المستحقة (الأقدم استحقاقاً أولاً) — الجديد والمتأخر مستبعدان
  const srs: RecallItem[] = opts.dueCards
    .filter((c) => c.state !== "New" && new Date(c.due) <= opts.now)
    .sort((a, b) => a.due.localeCompare(b.due))
    .map((c) => ({ kind: "srs" as const, id: c.cardId, due: c.due }));

  // 3) مهارة اليوم في الآخر (تثبيت مهارة مُتعلَّمة — لا محتوى جديد)
  const skill: RecallItem[] = opts.skillOfDay
    ? [{ kind: "skill" as const, id: opts.skillOfDay, due: opts.now.toISOString() }]
    : [];

  return [...errors, ...srs, ...skill];
}

/** أنواع كتل الجلسة (E01) — الاسترجاع أولاً دائماً */
export type SessionBlockKind = "recall" | "new" | "practice" | "close";
export type SessionBlock = { kind: SessionBlockKind };

/**
 * الحارس: لا جلسة بلا استرجاع أولاً (F121 — «اختبار يقفله»).
 * جلسة تبدأ بجديد/تدريب/خلاصة = مرفوضة؛ جلسة فارغة = مرفوضة.
 */
export function sessionStartsWithRecall(blocks: ReadonlyArray<SessionBlock>): boolean {
  return blocks.length > 0 && blocks[0].kind === "recall";
}

/**
 * مسار شاشة الاسترجاع §2.5: محاولة («أولاً: حاول تذكر!») ← كشف («أظهر الإجابة») ← تقييم.
 * كشف قبل محاولة = مرفوض (F121) · تقييم قبل كشف = مرفوض · محاولة بعد كشف = مرفوض.
 */
export type RecallStepKind = "attempt" | "reveal" | "rate";
export type RecallStep = { kind: RecallStepKind };

export function recallFlowValid(steps: ReadonlyArray<RecallStep>): boolean {
  let attempted = false;
  let revealed = false;
  let rated = false;
  for (const step of steps) {
    if (step.kind === "attempt") {
      if (revealed || rated) return false; // محاولة بعد الكشف = وهم استرجاع
      attempted = true;
    } else if (step.kind === "reveal") {
      if (!attempted || revealed || rated) return false; // كشف قبل محاولة = مرفوض
      revealed = true;
    } else {
      if (!revealed || rated) return false; // التقييم بعد الكشف فقط، مرة واحدة
      rated = true;
    }
  }
  return true;
}

/** N-147 (D247): عدد بطاقات SRS المستحقة اليوم أو قبله — لشاشة اليوم (§2.2) */
export function countDueSrs(cards: readonly SrsCardState[], todayDay: string): number {
  return cards.filter((c) => c.due.slice(0, 10) <= todayDay).length;
}

/* ══════════ D273 — إغلاق حلقة SRS: المستحق يُراجَع والتقييم يُحفَظ ══════════ */
/** أ-9: سقف SRS داخل الحصة ≈ 12 دقيقة — الفائض للجلسات المصغّرة (D274) */
export const MAX_DUE_PER_SESSION = 15;

/** البطاقات المستحقة الآن أو قبله — الأقدم استحقاقاً أولاً (تشمل New: أول مراجعة في جلسة الغد — ب-11) */
export function dueSrsCards(cards: readonly SrsCardState[], now: Date = new Date()): SrsCardState[] {
  return [...cards]
    .filter((c) => new Date(c.due) <= now)
    .sort((a, b) => a.due.localeCompare(b.due));
}

/** اتجاه السؤال بالتناوب على التكرارات (F039: تدوير مواضع السؤال — لا حفظ السؤال نفسه) */
export function srsDirection(card: Pick<SrsCardState, "reps">): "production" | "comprehension" {
  return card.reps % 2 === 0 ? "production" : "comprehension";
}

/** تطبيق تقييم واحد على الحالة — خالص للاختبار والواجهة */
export function applySrsRating(
  cards: readonly SrsCardState[],
  cardId: string,
  rating: RecallRating,
  now: Date = new Date(),
): SrsCardState[] {
  return cards.map((c) => (c.cardId === cardId ? scheduleRecall(c, rating, now) : c));
}
