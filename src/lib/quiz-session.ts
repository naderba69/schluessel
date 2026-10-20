// src/lib/quiz-session.ts — بوابة Quiz الدرس (D117): توقّع ← إجابة ← تصحيح تفسيري ← نتيجة + معايرة
// §3/القانون 3: لا يُفتح الدرس التالي إلا بـ≥75% · قانون 21: 3 نسخ تتبادل · §14: Slider التوقّع قبل الاختبار ومعايرة فورية بعده
// F121: الإجابة لا تُكشف قبل المحاولة · D23: لا لوم — النتيجة دون الحدّ = «ليس بعد» + مراجعة + نسخة أخرى
//
// لماذا «احكم أنت» في البنود المفتوحة؟ 883 من 933 بنداً في الدروس مفتوحة، وكثير منها ترجمة لها أكثر من صيغة صحيحة
// («ترجم: اسمي يوسف» ← Ich heiße Yusuf. / Ich bin Yusuf.) أو إجابة بصيغة لا يعرفها المتعلم مسبقاً («يصل» ← ankommen → er kommt an.).
// المطابقة الحرفية وحدها تُسقط من أجاب صواباً — وبوابة تقفل المسار لا تُبنى على مصحِّح معروف الخطأ. فيرى المتعلم النموذج
// ويحكم (كحكم «self» في الإنتاج الحر — practice-session)، ويُحتسب حكمه ويُعلَن عدده في النتيجة وفي السجل (selfJudged).
import type { Lesson, QuizAnswer, QuizItem } from "../../content/schemas/index.js";
import { normalizeAnswer } from "./practice-session.js";

/** نصف درجة: الفرق في حالة الأحرف أو في كتابة ß/ä/ö/ü فقط — خطأ إملائي حقيقي في الألمانية لا يمحو المعرفة */
export const CLOSE_CREDIT = 0.5;

export type QuizVerdict =
  | "correct" // مطابقة آلية (بعد التطبيع) للإجابة أو لإحدى صيغ accept
  | "close" // قريب: الحرف الكبير/الصغير أو ß/ä/ö/ü فقط ← نصف درجة
  | "wrong" // خيار خاطئ أو لا إجابة
  | "judge" // مفتوحة لا تطابق: يرى المتعلم النموذج ويحكم
  | "self-correct" // حكم المتعلم: صيغة صحيحة أخرى ← درجة كاملة تُعلَن
  | "self-wrong"; // حكم المتعلم: أخطأت

export type CloseKind = "case" | "spelling";
export type Graded = { verdict: "correct" | "close" | "wrong" | "judge"; closeKind?: CloseKind };
// N-006 (D228): QuizAnswer مصدره المخطط (lesson.ts) — يُعاد تصدير النوع وحده ليتابع المستوردون
export type { QuizAnswer };

export type QuizAttempt = {
  readonly lessonId: string;
  readonly variantIndex: number;
  readonly items: readonly QuizItem[];
  readonly passingScore: number;
  /** §14: التوقّع (0–100) قبل أول إجابة — null = لم يُطلب بعد */
  readonly predicted: number | null;
  readonly answers: readonly QuizAnswer[];
  /** البند المعروض: answers.length = cursor (لم يُجَب) أو cursor+1 (يُعرض تصحيحه) */
  readonly cursor: number;
};

// ——— التصحيح ———

/** تطبيع المقارنة فقط (المعروض لا يتغيّر): علامات الاقتباس · الترقيم الأخير (ومنه «؟») · التشكيل والتطويل وصور الألف والياء والتاء المربوطة */
export function quizNormal(s: string): string {
  const t = normalizeAnswer(s.normalize("NFC").replace(/[«»"„“”]/g, ""))
    .replace(/[؟?!.،,;:]+$/, "")
    .trim();
  return t
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

const spellingFold = (s: string) =>
  s.toLowerCase().replace(/ß/g, "ss").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue");

/** حكم آلي لبند واحد — لا يعرف «self-*» (ذلك حكم المتعلم بعد رؤية النموذج) */
export function gradeQuizAnswer(item: QuizItem, given: string): Graded {
  if (item.choices) return { verdict: given === item.a ? "correct" : "wrong" };
  const got = quizNormal(given);
  if (!got) return { verdict: "wrong" };
  const targets = [item.a, ...(item.accept ?? [])].map(quizNormal);
  if (targets.includes(got)) return { verdict: "correct" };
  if (targets.some((t) => t.toLowerCase() === got.toLowerCase())) return { verdict: "close", closeKind: "case" };
  if (targets.some((t) => spellingFold(t) === spellingFold(got))) return { verdict: "close", closeKind: "spelling" };
  return { verdict: "judge" };
}

export const creditOf = (v: QuizVerdict): number =>
  v === "correct" || v === "self-correct" ? 1 : v === "close" ? CLOSE_CREDIT : 0;

// ——— مسار المحاولة ———

/** قانون 21: النسخ تتبادل — المحاولة رقم n (من 0) تأخذ النسخة n mod 3 */
export const variantFor = (priorAttempts: number, variantCount: number): number =>
  ((priorAttempts % variantCount) + variantCount) % variantCount;

export function startQuizAttempt(lesson: Pick<Lesson, "id" | "quiz">, priorAttempts: number): QuizAttempt {
  if (!Number.isInteger(priorAttempts) || priorAttempts < 0) throw new Error(`عدد محاولات غير صالح: ${priorAttempts}`);
  const variantIndex = variantFor(priorAttempts, lesson.quiz.variants.length);
  const v = lesson.quiz.variants[variantIndex]!;
  return { lessonId: lesson.id, variantIndex, items: v.items, passingScore: v.passingScore, predicted: null, answers: [], cursor: 0 };
}

/**
 * N-006 (D228): استعادة محاولة من لقطة الحصة المفتوحة — البنود تُشتق من النسخة المخزَّنة.
 * fail-safe: نسخة/بنود تغيّرت في المحتوى بعد الحفظ ← تقليم صامت للمؤشر والإجابات، ونسخة خارج النطاق ← محاولة جديدة (لا عطل أبداً).
 */
export function restoreQuizAttempt(
  lesson: Pick<Lesson, "id" | "quiz">,
  snap: { variantIndex: number; predicted: number | null; answers: readonly QuizAnswer[]; cursor: number },
): QuizAttempt {
  const v = lesson.quiz.variants[snap.variantIndex];
  if (!v) return startQuizAttempt(lesson, 0);
  const cursor = Math.max(0, Math.min(snap.cursor, v.items.length));
  const answers = snap.answers.slice(0, Math.min(cursor + 1, v.items.length));
  return {
    lessonId: lesson.id,
    variantIndex: snap.variantIndex,
    items: v.items,
    passingScore: v.passingScore,
    predicted: snap.predicted,
    answers,
    cursor,
  };
}

/** §14: التوقّع قبل الاختبار فقط — عدد صحيح 0–100 */
export function predictScore(a: QuizAttempt, percent: number): QuizAttempt {
  if (a.answers.length > 0) throw new Error("التوقّع قبل أول إجابة فقط (§14)");
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) throw new Error(`توقّع خارج 0–100: ${percent}`);
  return { ...a, predicted: percent };
}

export const needsJudgment = (a: QuizAttempt): boolean => a.answers[a.cursor]?.verdict === "judge";
export const isAnswered = (a: QuizAttempt): boolean => a.answers.length === a.cursor + 1;
export const isComplete = (a: QuizAttempt): boolean => a.cursor >= a.items.length;
/** البند المعروض الآن (أو null بعد آخر بند) */
export const currentQuizItem = (a: QuizAttempt): QuizItem | null => a.items[a.cursor] ?? null;

export function answerQuizItem(a: QuizAttempt, given: string): QuizAttempt {
  if (a.predicted === null) throw new Error("التوقّع أولاً (§14: Slider قبل الاختبار)");
  const item = currentQuizItem(a);
  if (!item) throw new Error("انتهت بنود هذه النسخة");
  if (a.answers.length !== a.cursor) throw new Error("أُجيب هذا البند — الإجابة الأولى هي المحتسبة");
  const g = gradeQuizAnswer(item, given);
  const answer: QuizAnswer = g.verdict === "close" ? { given, verdict: "close", closeKind: g.closeKind! } : { given, verdict: g.verdict };
  return { ...a, answers: [...a.answers, answer] };
}

/** حكم المتعلم بعد رؤية النموذج — للبند المفتوح غير المطابق فقط */
export function judgeQuizItem(a: QuizAttempt, claimCorrect: boolean): QuizAttempt {
  if (!needsJudgment(a)) throw new Error("لا بند ينتظر حكمك");
  const answers = [...a.answers];
  answers[a.cursor] = { given: answers[a.cursor]!.given, verdict: claimCorrect ? "self-correct" : "self-wrong" };
  return { ...a, answers };
}

/** التالي: لا قبل الإجابة (F121) ولا قبل الحكم */
export function advanceQuiz(a: QuizAttempt): QuizAttempt {
  if (!isAnswered(a)) throw new Error("لا انتقال قبل الإجابة (F121)");
  if (needsJudgment(a)) throw new Error("احكم على إجابتك أولاً");
  return { ...a, cursor: a.cursor + 1 };
}

// ——— النتيجة ———

export type QuizOutcome = {
  lessonId: string;
  variantIndex: number;
  total: number;
  credit: number;
  /** 0–1 (كما في GateResult.score) */
  score: number;
  percent: number;
  passed: boolean;
  passingScore: number;
  correct: number;
  close: number;
  wrong: number;
  selfCorrect: number;
  selfWrong: number;
  predicted: number | null;
  /** أسئلة البنود التي لم تنل درجة كاملة — للمراجعة قبل المحاولة التالية */
  weakItems: string[];
};

export function quizOutcome(a: QuizAttempt): QuizOutcome {
  if (!isComplete(a) || a.answers.length !== a.items.length) throw new Error("النتيجة بعد آخر بند فقط");
  const count = (v: QuizVerdict) => a.answers.filter((x) => x.verdict === v).length;
  const credit = a.answers.reduce((s, x) => s + creditOf(x.verdict), 0);
  const score = credit / a.items.length;
  return {
    lessonId: a.lessonId,
    variantIndex: a.variantIndex,
    total: a.items.length,
    credit,
    score,
    percent: Math.round(score * 100),
    passed: score >= a.passingScore - 1e-9,
    passingScore: a.passingScore,
    correct: count("correct"),
    close: count("close"),
    wrong: count("wrong"),
    selfCorrect: count("self-correct"),
    selfWrong: count("self-wrong"),
    predicted: a.predicted,
    weakItems: a.items.filter((_, i) => creditOf(a.answers[i]!.verdict) < 1).map((it) => it.q),
  };
}

/** قانون 21 داخل الحصة: لا تتكرر نسخة في الجلسة نفسها (حفظ الإجابات ≠ إتقان) — بعد النسخ الثلاث: المراجعة والحصة القادمة */
export const canRetryInSession = (attemptsThisSession: number, variantCount: number): boolean =>
  attemptsThisSession < variantCount;

// ——— نصوص الواجهة (عربية — بلا لوم D23) ———

export function verdictNoteAr(item: QuizItem, answer: QuizAnswer): string {
  switch (answer.verdict) {
    case "correct":
      return "✓ صحيح";
    case "close":
      return answer.closeKind === "case"
        ? `قريب جداً — الفرق في الحرف الكبير/الصغير فقط (نصف درجة). الصحيح: ${item.a}`
        : `قريب جداً — اكتب ß/ä/ö/ü كما هي، والأزرار تحت الحقل (نصف درجة). الصحيح: ${item.a}`;
    case "wrong":
      return answer.given.trim() ? `الصحيح: ${item.a}` : `لم تكتب إجابة — الصحيح: ${item.a}`;
    case "judge":
      return `إجابتك تختلف عن النموذج: ${item.a} — هل هي صحيحة بصيغة أخرى؟ احكم بصدق: حكمك يُحتسب ويُذكر في النتيجة.`;
    case "self-correct":
      return "احتُسبت صحيحة بحكمك — وتُذكر في النتيجة.";
    case "self-wrong":
      return `لا بأس — الصحيح: ${item.a}`;
  }
}

/** §14 معايرة فورية: مقارنة التوقّع بالنتيجة — ملاحظة لا حكم */
export function calibrationNoteAr(predicted: number | null, actualPercent: number): string {
  if (predicted === null) return "";
  const gap = predicted - actualPercent;
  if (Math.abs(gap) <= 10) return `توقّعت ${predicted}% والنتيجة ${actualPercent}% — توقّعك دقيق، وهذه مهارة بحد ذاتها.`;
  if (gap > 0)
    return `توقّعت ${predicted}% والنتيجة ${actualPercent}% — التوقّع أعلى من الأداء اليوم؛ هذا طبيعي في البدايات، والمراجعة القصيرة تقرّب الصورة.`;
  return `توقّعت ${predicted}% والنتيجة ${actualPercent}% — أنت أفضل مما تظن 🌟`;
}

export function outcomeHeadlineAr(o: QuizOutcome): string {
  const need = Math.round(o.passingScore * 100);
  const self = o.selfCorrect > 0 ? ` (منها ${o.selfCorrect} بحكمك)` : "";
  return o.passed
    ? `✓ نجحت: ${o.percent}% — المطلوب ${need}%. ${fmtCredit(o.credit)} من ${o.total}${self}.`
    : `ليس بعد: ${o.percent}% — المطلوب ${need}%. ${fmtCredit(o.credit)} من ${o.total}${self}. راجع البنود أدناه ثم جرّب نسخة أخرى.`;
}

const fmtCredit = (c: number) => (Number.isInteger(c) ? String(c) : c.toFixed(1));
