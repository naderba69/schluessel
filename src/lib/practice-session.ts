// src/lib/practice-session.ts — منطق بند التدريب المُنمَّط (D115): محاولة ← تصحيح تفسيري (why) ← التالي
// خالص بلا واجهة (يُختبر كاملاً في Node) — مكوّن PracticeStation رقيق فوقه.
// F121: لا إجابة ولا شرح قبل المحاولة · D23: تغذية راجعة بلا لوم · قانون ASR: الإنتاج الشفهي تقييم ذاتي لا آلي.
import {
  BuildSentenceItem, ChoiceItem, DictationItem, ErrorHuntItem, GapFillItem, ListeningItem, MatchItem, ProductionItem,
  ReadingItem, dictationForm, type StationType,
} from "../../content/schemas/index.js";
import { compareDictation } from "./dictation-engine.js";

export type AudioRef = { audioId: string; speakText: string };

/** بند مُنمَّط جاهز للعرض — شكل واحد لكل طريقة تفاعل */
export type TypedItem =
  | { kind: "choice"; prompt: string; choices: string[]; answer: string; why: string; audio?: AudioRef; text?: string }
  | { kind: "input"; mode: "gap" | "correct" | "dictation" | "short"; prompt: string; answer: string; accept: string[]; why: string; audio?: AudioRef; text?: string }
  | { kind: "order"; prompt?: string; tokens: string[]; answer: string; why: string }
  | { kind: "production"; prompt: string; model: string; why: string }
  | { kind: "match"; prompt?: string; pairs: { de: string; ar: string }[]; why: string };

/**
 * بند المحتوى ← بند مُنمَّط، أو null للبند القديم (يبقى بسلوكه القديم: «أظهر الإجابة»).
 * التحقق بالمخططات نفسها التي يفرضها حارس الترقية — لا تعريف ثانٍ للشكل.
 */
/** تعليمة إملاء الحروف (D120): المسموع حروف — المطلوب الكلمة كاملة */
export const SPELLED_DICTATION_AR = "استمع إلى الحروف واكتب الكلمة التي تتهجّاها كاملة (الأسماء تبدأ بحرف كبير).";

export function toTypedItem(type: StationType, raw: unknown): TypedItem | null {
  switch (type) {
    case "choice":
    case "gender-drill":
    case "case-drill": {
      const r = ChoiceItem.safeParse(raw);
      return r.success ? { kind: "choice", prompt: r.data.q, choices: r.data.choices, answer: r.data.a, why: r.data.why } : null;
    }
    case "listening":
    case "mini-pronunciation": {
      const r = ListeningItem.safeParse(raw);
      return r.success
        ? { kind: "choice", prompt: r.data.q, choices: r.data.choices, answer: r.data.a, why: r.data.why, audio: { audioId: r.data.audioId, speakText: r.data.speakText } }
        : null;
    }
    case "reading": {
      const r = ReadingItem.safeParse(raw);
      if (!r.success) return null;
      const d = r.data;
      return d.choices
        ? { kind: "choice", prompt: d.q, choices: d.choices, answer: d.a, why: d.why, text: d.text }
        : { kind: "input", mode: "short", prompt: d.q, answer: d.a, accept: [], why: d.why, text: d.text };
    }
    case "gap-fill":
    case "verb-bank": {
      const r = GapFillItem.safeParse(raw);
      return r.success ? { kind: "input", mode: "gap", prompt: r.data.q, answer: r.data.a, accept: r.data.accept ?? [], why: r.data.why } : null;
    }
    case "error-hunt": {
      const r = ErrorHuntItem.safeParse(raw);
      return r.success ? { kind: "input", mode: "correct", prompt: r.data.q, answer: r.data.a, accept: r.data.accept ?? [], why: r.data.why } : null;
    }
    case "dictation": {
      const r = DictationItem.safeParse(raw);
      return r.success
        ? { kind: "input", mode: "dictation", prompt: r.data.spelled ? SPELLED_DICTATION_AR : "", answer: r.data.a, accept: [], why: r.data.why, audio: { audioId: r.data.audioId, speakText: r.data.speakText } }
        : null;
    }
    case "build-sentence": {
      const r = BuildSentenceItem.safeParse(raw);
      return r.success ? { kind: "order", prompt: r.data.q, tokens: r.data.tokens, answer: r.data.a, why: r.data.why } : null;
    }
    case "speaking":
    case "writing": {
      const r = ProductionItem.safeParse(raw);
      return r.success ? { kind: "production", prompt: r.data.q, model: r.data.a, why: r.data.why } : null;
    }
    case "match": {
      const r = MatchItem.safeParse(raw);
      return r.success ? { kind: "match", prompt: r.data.q, pairs: r.data.pairs, why: r.data.why } : null;
    }
  }
}

/** correct · close (قريب: حرف كبير/تهجئة) · retry (ليس بعد) · self (إنتاج حر: تقارن أنت بالنموذج) */
export type Verdict = { status: "correct" | "close" | "retry" | "self"; expected: string; why: string; noteAr: string };

/**
 * ترتيب عرض الخيارات (D117): المحتوى يكتب الإجابة الصحيحة أولاً في العادة (a1-u1-d1: 18 من 18 بنداً) —
 * عرضُها بترتيب التأليف يجعل «الزر الأول» دليلاً على الإجابة فيسقط صدق التدريب والبوابة معاً.
 * الخلط حتمي بالبذرة (FNV-1a ← mulberry32 ← Fisher–Yates): ثابت بين إعادات الرسم وقابل للاختبار، ومختلف بين البنود.
 */
export function displayOrder<T>(xs: readonly T[], seed: string): T[] {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 0x01000193);
  let t = h >>> 0;
  const rand = () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** مقارنة لطيفة: فراغات زائدة · علامة الترقيم الأخيرة · شكل الفاصلة العليا — لا تُحسب أخطاء */
export const normalizeAnswer = (s: string): string =>
  s.trim().replace(/\s+/g, " ").replace(/[’`´]/g, "'").replace(/[.!?]+$/, "");

export type Attempt = string | readonly string[] | Readonly<Record<string, string>>;

export function checkAttempt(item: TypedItem, attempt: Attempt): Verdict {
  const base = { why: item.why };
  switch (item.kind) {
    case "choice": {
      const ok = attempt === item.answer;
      return { ...base, status: ok ? "correct" : "retry", expected: item.answer, noteAr: ok ? "✓ صحيح" : `الصحيح: ${item.answer}` };
    }
    case "input": {
      const got = typeof attempt === "string" ? attempt : "";
      if (item.mode === "dictation") {
        const c = compareDictation(dictationForm(item.answer), dictationForm(got));
        return { ...base, status: c.status === "minor" ? "close" : c.status, expected: item.answer, noteAr: c.feedback };
      }
      const ok = [item.answer, ...item.accept].some((x) => normalizeAnswer(x) === normalizeAnswer(got));
      if (ok) return { ...base, status: "correct", expected: item.answer, noteAr: "✓ صحيح" };
      const caseOnly = [item.answer, ...item.accept].some((x) => normalizeAnswer(x).toLowerCase() === normalizeAnswer(got).toLowerCase());
      return caseOnly
        ? { ...base, status: "close", expected: item.answer, noteAr: "قريب جداً! الفرق في الحرف الكبير/الصغير فقط — الأسماء في الألمانية تبدأ بحرف كبير." }
        : { ...base, status: "retry", expected: item.answer, noteAr: `الصحيح: ${item.answer}` };
    }
    case "order": {
      const got = Array.isArray(attempt) ? attempt.join(" ") : "";
      const ok = got === item.answer.trim();
      return { ...base, status: ok ? "correct" : "retry", expected: item.answer, noteAr: ok ? "✓ ترتيب صحيح" : `الترتيب الصحيح: ${item.answer}` };
    }
    case "production":
      return { ...base, status: "self", expected: item.model, noteAr: "قارن جملتك بالنموذج — الحكم لك، فالتعرّف الآلي على الصوت لا يقرّر." };
    case "match": {
      const got = (typeof attempt === "object" && !Array.isArray(attempt) ? attempt : {}) as Readonly<Record<string, string>>;
      const right = item.pairs.filter((p) => got[p.de] === p.ar).length;
      const ok = right === item.pairs.length;
      const expected = item.pairs.map((p) => `${p.de} = ${p.ar}`).join(" · ");
      return { ...base, status: ok ? "correct" : "retry", expected, noteAr: ok ? "✓ كل الأزواج صحيحة" : `${right} من ${item.pairs.length} صحيحة — الصحيح: ${expected}` };
    }
  }
}

// ——— مسار المحطة: محاولة ← تصحيح ← التالي (F121: لا «التالي» قبل المحاولة) ———

export type PracticeState = { station: number; item: number; verdict: Verdict | null };
export const initialPractice = (): PracticeState => ({ station: 0, item: 0, verdict: null });

/** تسجيل المحاولة: مرة واحدة للبند — التصحيح لا يُعاد كتابته */
export function submitAttempt(state: PracticeState, item: TypedItem, attempt: Attempt): PracticeState {
  if (state.verdict) return state;
  return { ...state, verdict: checkAttempt(item, attempt) };
}

/** الانتقال: مقفل قبل المحاولة (يرمي) — ثم البند التالي أو أول بند في المحطة التالية */
export function nextItem(state: PracticeState, stations: readonly { items: readonly unknown[] }[]): PracticeState {
  if (!state.verdict) throw new Error("لا انتقال قبل المحاولة (F121)");
  const count = stations[state.station]?.items.length ?? 0;
  return state.item + 1 < count
    ? { station: state.station, item: state.item + 1, verdict: null }
    : { station: state.station + 1, item: 0, verdict: null };
}
