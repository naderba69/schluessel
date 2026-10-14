// grammar-discovery.ts — E13 محرك القواعد (اكتشاف موجّه) | M2-ب
// المصادر: guided discovery (اكتشاف موجّه) · §2.5 (المحاولة قبل الكشف) · F121 (الاسترجاع قبل الشرح)
// القاعدة الحديدية: **القاعدة لا تظهر قبل المثال والمحاولة** — قفل صارم في الكود.
// D115: القواعد صارت محتوى (content/arsenal/grammar/*.json — kind=shufra) يعرضها المُشغِّل في محطة «الجديد»؛
// A1_RULES الثلاث تبقى لمختبر المهارات فقط (خارج المسار) حتى تنتقل إلى المحتوى مع ترقية دروسها.
import type { GrammarRuleFile } from "../../content/schemas/index.js";

export type GrammarRule = {
  id: string;
  topicAr: string;
  /** أمثلة أولاً — نص ألماني مع ترجمته */
  examples: readonly { de: string; ar: string }[];
  inferencePromptAr: string;
  ruleDe: string;
  ruleAr: string;
  /** مقارنة عربية — سمة إلزامية (لا قاعدة بلا مقارنة) */
  contrastAr: string;
  /** حبّات الجملة — الترتيب الصحيح هو محتوى المصفوفة */
  beads: readonly string[];
  /** D115: المشهد الذي تأتي منه الأمثلة (قصة الشفرة) */
  sceneAr?: string;
  /** D115: ما لا تغطيه القاعدة اليوم — يُكشف مع القاعدة */
  limitsAr?: readonly string[];
};

/** ملف القاعدة (بعد تحقق zod) ← قاعدة المحرك — بلا إعادة صياغة: المحتوى يُعرض كما كُتب */
export function ruleFromShufra(file: GrammarRuleFile): GrammarRule {
  const p = file.payload;
  return {
    id: file.id, topicAr: p.topicAr, sceneAr: p.sceneAr, examples: p.examples, inferencePromptAr: p.inferencePromptAr,
    ruleDe: p.ruleDe, ruleAr: p.ruleAr, contrastAr: p.contrastAr, limitsAr: p.limitsAr, beads: p.beads,
  };
}

/** قواعد الوحدة الأولى — نفس مصائد الدرس a1-u1-d1 (D39) */
export const A1_RULES: readonly GrammarRule[] = Object.freeze([
  {
    id: "v2-position",
    topicAr: "مكان الفعل",
    examples: Object.freeze([
      { de: "Ich komme aus Tunesien.", ar: "أنا آتي من تونس." },
      { de: "Heute lerne ich Deutsch.", ar: "اليوم أتعلّم الألمانية." },
      { de: "Am Abend wohne ich zu Hause.", ar: "في المساء أكون في البيت." },
    ]),
    inferencePromptAr: "أين يقف الفعل (komme/lerne/wohne) في الجملة؟ عدّ مواضع الكلمات.",
    ruleDe: "Das Verb steht an Position 2.",
    ruleAr: "الفعل دائماً في المرتبة الثانية — مهما بدأت الجملة (اسم، ظرف، سؤال).",
    contrastAr: "العربية تحرّك الفعل بالسياق والتقدمة («آتي أنا» / «أنا آتي»)؛ الألمانية تثبّته في المرتبة 2.",
    beads: Object.freeze(["Heute", "lerne", "ich", "Deutsch"]),
  },
  {
    id: "aus-vs-von",
    topicAr: "«من»: aus أم von؟",
    examples: Object.freeze([
      { de: "Ich komme aus Tunesien.", ar: "أنا من تونس (المنشأ)." },
      { de: "Ich komme von der Arbeit.", ar: "آتي من العمل (المكان قادم منه)." },
      { de: "Das ist von Yusuf.", ar: "هذا ليوسف (امتلاك/جهة)." },
    ]),
    inferencePromptAr: "متى تقول aus ومتى von؟ قارن الأمثلة الثلاثة.",
    ruleDe: "aus = Herkunft (Land/Stadt) · von = Richtung/Quelle/Person",
    ruleAr: "aus للمنشأ والانتماء (البلد/المدينة)، وvon للجهة والاتجاه والامتلاك.",
    contrastAr: "العربية تقول «من» للحالتين؛ لذلك الخطأ الشائع «Ich komme von Tunesien».",
    beads: Object.freeze(["Ich", "komme", "aus", "Tunesien"]),
  },
  {
    id: "heissen-du",
    topicAr: "تصريف heißen مع du",
    examples: Object.freeze([
      { de: "Ich heiße Yusuf.", ar: "اسمي يوسف." },
      { de: "Wie heißt du?", ar: "ما اسمك؟" },
      { de: "Er heißt Ahmad.", ar: "اسمه أحمد." },
    ]),
    inferencePromptAr: "لاحظ: heiße / heißt / heißt — ماذا يجري مع du وer؟",
    ruleDe: "ich heiße · du heißt · er/sie/es heißt",
    ruleAr: "مع du وer/es يصبح heißen إلى heißt (heiß + t) — لا heiße.",
    contrastAr: "العربية: «اسمي/اسمه» بلا تصريف؛ الألمانية تصرّف الفعل مع كل ضمير.",
    beads: Object.freeze(["Wie", "heißt", "du"]),
  },
]);

export type DiscoverySession = {
  ruleId: string;
  examplesViewed: boolean;
  inference: string | null;
  revealed: boolean;
};

/** بدء الاكتشاف: بقاعدة محتوى (كائن) أو بمعرّف من A1_RULES (مختبر المهارات) */
export function startDiscovery(rule: string | GrammarRule): DiscoverySession {
  if (typeof rule !== "string") return { ruleId: rule.id, examplesViewed: false, inference: null, revealed: false };
  if (!A1_RULES.some((r) => r.id === rule)) throw new Error(`قاعدة غير معروفة: ${rule}`);
  return { ruleId: rule, examplesViewed: false, inference: null, revealed: false };
}

/** الخطوة 1: الأمثلة — لا يُطلب من المتعلّم استنتاج قبل رؤيتها */
export function viewExamples(s: DiscoverySession, rule: GrammarRule = requireRule(s)): { examples: readonly { de: string; ar: string }[]; promptAr: string } {
  s.examplesViewed = true;
  return { examples: rule.examples, promptAr: rule.inferencePromptAr };
}

/** الخطوة 2: استنتاج المتعلّم — لا يُقبل قبل رؤية الأمثلة (F121) */
export function submitInference(s: DiscoverySession, text: string): { ok: boolean; feedbackAr: string } {
  if (!s.examplesViewed) throw new Error("لا استنتاج قبل الأمثلة (F121)");
  if (!text.trim()) throw new Error("استنتاج فارغ = لم تُحاول بعد");
  s.inference = text;
  return { ok: true, feedbackAr: "استنتاج مسجَّل — لن تُكشف القاعدة إلا باختيارك أنت." };
}

/** الخطوة 3: كشف القاعدة — **مغلقة** قبل رؤية الأمثلة والمحاولة معاً */
export function revealRule(
  s: DiscoverySession,
  rule: GrammarRule = requireRule(s),
): { ruleDe: string; ruleAr: string; contrastAr: string; limitsAr: readonly string[] } {
  if (!s.examplesViewed) throw new Error("القاعدة لا تظهر قبل المثال (قفل)");
  if (s.inference === null) throw new Error("القاعدة لا تظهر قبل محاولتك (§2.5)");
  s.revealed = true;
  return { ruleDe: rule.ruleDe, ruleAr: rule.ruleAr, contrastAr: rule.contrastAr, limitsAr: rule.limitsAr ?? [] };
}

export function grammarFlow(): { order: number; kind: "examples" | "inference" | "reveal" | "beads"; labelAr: string }[] {
  return [
    { order: 1, kind: "examples", labelAr: "اقرأ الأمثلة ولاحظ" },
    { order: 2, kind: "inference", labelAr: "استنتج القاعدة بكلماتك" },
    { order: 3, kind: "reveal", labelAr: "الآن تُكشف القاعدة + المقارنة العربية" },
    { order: 4, kind: "beads", labelAr: "حبّات الجملة: رتّبها" },
  ];
}

/** حبّات الجملة — ترتيب حتمي (الحل هو مصفوفة rule.beads) */
export function shuffledBeads(rule: GrammarRule, seed = 0): string[] {
  const arr = [...rule.beads];
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    const j = (i + seed + 1) % n;
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function checkBeads(rule: GrammarRule, order: readonly string[]): boolean {
  return order.length === rule.beads.length && order.every((t, i) => t === rule.beads[i]);
}

function requireRule(s: DiscoverySession): GrammarRule {
  const rule = A1_RULES.find((r) => r.id === s.ruleId);
  if (!rule) throw new Error(`قاعدة غير معروفة: ${s.ruleId}`);
  return rule;
}
