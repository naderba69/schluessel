// tools/lib/lesson-upgrade.ts — حارس ترقية الدروس (D114 → D115)
// خطة الترقية (content/upgrades/*.json) تعلن لكل درس محتوى: قاعدة اليوم · التدريب · Quiz = pending | done.
// «done» لا يُصدَّق بالكلام: يُتحقق منه هنا آلياً؛ «pending» دَين معلن يطبعه tools/upgrade-status.ts.
//
// الرموز (أخطاء e- · تنبيهات w-):
//   e-upgrade-lesson         درس الخطة غير موجود · ليس درس محتوى من المستوى · خارج نطاق الوحدات
//   e-upgrade-complete       درس محتوى داخل النطاق غائب عن الخطة (لا درس يُنسى)
//   e-upgrade-rule           rule=done: الدرس بلا معرّف قاعدة · أو المعرّف بلا ملف قاعدة صالح
//   e-upgrade-rule-index     rule=done: القاعدة لا تضم الدرس في usedInLessons · أو usedArsenalIds لا يضمها
//   e-upgrade-sample         rule=done (محطة «الجديد» كلها): كلمة جديدة بلا جملة مثال · أو مثالها فيه غير مدروس
//                            (البطاقة أول لقاء بالكلمة — قياس D115: 217/743 مثالاً في A1 فيها كلمة لم تُدرَّس بعد)
//   e-upgrade-item           practice=done: بند لا يطابق شكل نوع محطته (why عربي إلزامي في كل بند)
//   e-upgrade-item-dup       بندان متطابقان في تدريب الدرس
//   e-upgrade-practice       explanationRequired=false في درس مُرقّى
//   e-upgrade-practice-size  أقل من 12 بنداً · e-upgrade-practice-types أقل من 3 أنواع
//   e-upgrade-practice-audio محطة استماع/إملاء غائبة (D114: «الاستماع بالصوت الموجود والإملاء»)
//   e-upgrade-audio          مسار صوتي غير موجود في المانيفست · e-upgrade-audio-text النص المنطوق ≠ نص المسار
//   e-upgrade-quiz-size      نسخة Quiz بأقل من 6 بنود · e-upgrade-quiz-item شكل البند · e-upgrade-quiz-dup تكرار سؤال
//   e-upgrade-quiz-variants  نسختان متطابقتان (القانون 21: 3 نسخ تتبادل)
//   e-upgrade-front          كلمة ألمانية غير مدروسة حتى الدرس في تدريبه/مصائده/Quiz (قانون الجبهة 13)
//   e-upgrade-warmup         practice=done: بطاقة استدعاء (warmup) لم تُدرَّس قبل الدرس — الاستدعاء لما سبق تعلمه (F121)؛
//                            أول درس في المسار مستثنى (لا شيء قبله). قياس D121: 12 بطاقة في 8 دروس A1 تستدعي كلمة اليوم نفسه
//   e-upgrade-word-unpracticed  practice+quiz=done وكلمة جديدة من الدرس لا تظهر في أي بند (لا كلمة بلا استرجاع)
//   w-upgrade-mark-done      جزء pending يستوفي معايير done فعلاً — علِّمه done
//   w-upgrade-proper-noun    اسم علم معلن لا يظهر في نصوص الدرس المُرقّاة (باب خلفي)
//   e-upgrade-misspelling    D128: خطأ مقصود معلن غير صالح — تصحيحه غير مدروس · أو هو كلمة حقيقية في المقرر · أو يعرفه
//                            الحارس أصلاً · أو بعيد عن تصحيحه (> MISSPELLING_DISTANCE_MAX) · أو معلن مرتين
//   w-upgrade-misspelling    خطأ مقصود معلن لا يظهر مشطوباً (~~…~~) في نصوص الدرس المُرقّاة
//   e-rule-index · e-rule-level · e-rule-front · w-rule-proper-noun   فحوص ملفات القواعد نفسها (checkGrammarRules)
import {
  AUDIO_STATION_TYPES,
  PRACTICE_ITEM_SHAPES,
  QuizItem,
  dictationForm,
  type GrammarRuleFile,
  type Lesson,
  type LessonUpgradeEntry,
  type LessonUpgradePlan,
  type Word,
} from "../../content/schemas/index.js";
import {
  CLOSED, contentTokens, deumlaut, knownForms, knownStems, stem, stripGraphemeNotation, stripMorphemeNotation, unknownTokens,
} from "./vocab-forms.js";

export const PRACTICE_ITEMS_MIN = 12;
export const PRACTICE_TYPES_MIN = 3;
export const QUIZ_ITEMS_MIN = 6;
/** D128: أقصى مسافة تحرير بين الخطأ المقصود المعلن وتصحيحه — الخطأ الإملائي قريب من صوابه (Strasse ← Straße = 2) */
export const MISSPELLING_DISTANCE_MAX = 2;
/** D114 §3: «≥ 12 بنداً في ≥ 3 أنواع محطات (منها الاستماع بالصوت الموجود والإملاء)» */
export const REQUIRED_STATION_TYPES = ["listening", "dictation"] as const;

/** lessonId/ruleId: موضوع المشكلة — المدقِّق ينسبها لملف الدرس/القاعدة نفسه */
export type UpgradeIssue = { level: "error" | "warning"; code: string; message: string; lessonId?: string; ruleId?: string };
export type UpgradePart = "rule" | "practice" | "quiz";

export type UpgradeContext = {
  /** كل الدروس (أي ترتيب — يُرتَّب هنا بترتيب المسار) */
  lessons: readonly Lesson[];
  words: readonly Word[];
  /** ملفات القواعد (kind=shufra) بالمعرّف */
  rules: ReadonlyMap<string, GrammarRuleFile>;
  /** مسارات المانيفست الصوتي: المعرّف ← النص المنطوق */
  tracks: ReadonlyMap<string, { textDe: string }>;
};

const LEVEL_ORDER: Record<Lesson["level"], number> = { A1: 0, A2: 1, B1: 2, B2: 3 };
/** موضع الدرس في المسار (مستوى ← وحدة ← يوم) */
export const pathOrder = (l: Pick<Lesson, "level" | "unit" | "day">) => LEVEL_ORDER[l.level] * 10_000 + l.unit * 100 + l.day;

/** الكلمات المدروسة حتى الدرس ضمناً — بترتيب المسار (قانون الجبهة 13) */
export function taughtUpTo(lesson: Lesson, lessons: readonly Lesson[], words: readonly Word[]): Word[] {
  const ids = new Set<string>();
  for (const l of lessons) if (pathOrder(l) <= pathOrder(lesson)) for (const id of l.praesentation.wordIds) ids.add(id);
  return words.filter((w) => ids.has(w.id));
}

const ARABIC = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g;
/** الألماني فقط: التعليمات العربية خارج القفل (الاتفاقية نفسها في قفل الامتحان D109) */
export const germanOnly = (s: string): string => s.replace(ARABIC, " ");

const GAP = /_{2,}/g;
/**
 * D128: فجوة داخل كلمة («Stra___e» والإجابة ß): النص المفحوص هو الكلمة بعد ملء الفجوة بالإجابة — لا شظاياها
 * («stra» كلمة غير مدروسة) ولا إعفاءً لها: «Su___e» والإجابة pp تصير «Suppe» فتُفحص. بشروط معاً: فجوة واحدة فقط
 * في السؤال · ملتصقة بحرف من جهة على الأقل. فجوة الكلمة الكاملة («Ich ___ Yusuf.») لا تتغير، والإجابة تُفحص وحدها دائماً.
 */
export function fillInWordGap(q: string, a: string): string {
  const gaps = [...q.matchAll(GAP)];
  if (gaps.length !== 1) return q;
  const start = gaps[0]!.index ?? 0;
  const end = start + gaps[0]![0].length;
  const touches = /\p{L}/u.test(q[start - 1] ?? "") || /\p{L}/u.test(q[end] ?? "");
  return touches ? q.slice(0, start) + a + q.slice(end) : q;
}

const withFilledGap = (item: unknown): unknown => {
  if (!item || typeof item !== "object" || Array.isArray(item)) return item;
  const o = item as Record<string, unknown>;
  return typeof o.q === "string" && typeof o.a === "string" ? { ...o, q: fillInWordGap(o.q, o.a) } : item;
};

/** نصوص بند (كل القيم النصية عدا why ومعرّف المسار الصوتي) — والفجوة داخل الكلمة مملوءة بإجابتها (D128) */
export function itemTexts(item: unknown): string[] {
  const out: string[] = [];
  const walk = (v: unknown, key?: string) => {
    if (key === "why" || key === "audioId") return;
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) for (const x of v) walk(x);
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk(withFilledGap(item));
  return out;
}

const STRUCK = /~~([\s\S]+?)~~/g;
/**
 * D128: الصيغ الخاطئة المعلنة تسقط داخل ~~…~~ وحده — خارجه تبقى كلمات غير مدروسة فيمسكها الحارس
 * (الخطأ المقصود لا يُرى إلا مشطوباً). وما سواها داخل الشطب يُفحص كالعادة: ~~die heisse Suppe~~ تبقى «suppe» مخالفة.
 */
export const stripDeclaredMisspellings = (text: string, wrong: ReadonlySet<string>): string =>
  wrong.size === 0
    ? text
    : text.replace(STRUCK, (_m: string, inner: string) => inner.replace(/\p{L}+/gu, (t) => (wrong.has(t.toLowerCase()) ? " " : t)));

/** الرموز داخل ~~…~~ في نصوص (لفحص استعمال الأخطاء المعلنة) */
const struckTokens = (texts: readonly string[]) =>
  new Set(texts.flatMap((t) => [...t.matchAll(STRUCK)].flatMap((m) => contentTokens(m[1]!))));

/** مسافة التحرير (Damerau–Levenshtein بالمحاذاة المثلى): إدراج · حذف · استبدال · تبديل حرفين متجاورين */
export function editDistance(a: string, b: string): number {
  const A = [...a], B = [...b];
  const d: number[][] = Array.from({ length: A.length + 1 }, (_, i) => Array.from({ length: B.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= A.length; i++)
    for (let j = 1; j <= B.length; j++) {
      const cost = A[i - 1] === B[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && A[i - 1] === B[j - 2] && A[i - 2] === B[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
    }
  return d[A.length]![B.length]!;
}

/**
 * الكلمات غير المدروسة في نصوص (مرتبة بلا تكرار). العربية تُمحى أولاً ثم رموز اللواحق (D127) ورموز الحروف (D128)
 * — بهذا الترتيب: «بـ‑chen» و«بـss» تلتصق فيهما الرموز بحرف عربي (الكشيدة حرف) فلا تُعرف رموزاً إلا بعد محو العربية.
 * misspelled: الصيغ الخاطئة المعلنة للدرس (D128) — تسقط داخل ~~…~~ وحده.
 */
export function frontViolations(
  texts: readonly string[], stems: ReadonlySet<string>, allow: ReadonlySet<string>, misspelled: ReadonlySet<string> = new Set(),
): string[] {
  const text = stripDeclaredMisspellings(texts.join("\n"), misspelled);
  return unknownTokens(stripGraphemeNotation(stripMorphemeNotation(germanOnly(text))), stems, allow);
}

const allowSet = (names: readonly string[]) => new Set(names.flatMap((n) => contentTokens(n)));
const tokenSet = (texts: readonly string[]) => new Set(contentTokens(germanOnly(texts.join("\n"))).map(deumlaut));

/** هل تظهر الكلمة في النصوص؟ (رموز صيغتها الأساسية غير المغلقة كلها — بجذوع التصريف البسيطة) */
export function wordAppears(w: Word, tokens: ReadonlySet<string>): boolean {
  const base = contentTokens(w.de.replace(/^(der|die|das) /, "").replace(/^sich /, "")).map(deumlaut);
  const open = base.filter((t) => !CLOSED.has(t));
  const need = open.length ? open : base;
  const stemsOf = [...tokens].map((t) => stem(t));
  return need.every((t) => {
    const mine = new Set(stem(t));
    return stemsOf.some((ss) => ss.some((s) => mine.has(s)));
  });
}

const firstIssue = (e: { issues: { message: string; path: PropertyKey[] }[] }) => {
  const i = e.issues[0];
  return i ? `${i.path.length ? i.path.join(".") + ": " : ""}${i.message}` : "شكل غير صالح";
};

type PartResult = { issues: UpgradeIssue[]; texts: string[] };

function checkRulePart(lesson: Lesson, ctx: UpgradeContext, stems: ReadonlySet<string>, allow: ReadonlySet<string>): PartResult {
  const issues: UpgradeIssue[] = [];
  const err = (code: string, message: string) => issues.push({ level: "error", code, message, lessonId: lesson.id });
  const ids = lesson.praesentation.grammarArsenalIds;
  if (ids.length === 0) err("e-upgrade-rule", `${lesson.id}: لا معرّف لقاعدة اليوم (grammarArsenalIds فارغ)`);
  for (const id of ids) {
    const rule = ctx.rules.get(id);
    if (!rule) {
      err("e-upgrade-rule", `${lesson.id}: القاعدة ${id} بلا ملف content/arsenal/grammar/${id}.json صالح`);
      continue;
    }
    if (!rule.usedInLessons.includes(lesson.id))
      err("e-upgrade-rule-index", `${lesson.id}: ${id}.usedInLessons لا يضم الدرس (§10‑ح)`);
    if (!lesson.usedArsenalIds.includes(id))
      err("e-upgrade-rule-index", `${lesson.id}: usedArsenalIds لا يضم ${id}`);
  }
  // بطاقات الكلمات في المحطة نفسها: الجملة المثال أول ما يقرؤه المتعلم من الكلمة (promptDe في المُشغِّل)
  const texts: string[] = [];
  const byId = new Map(ctx.words.map((w) => [w.id, w]));
  for (const id of lesson.praesentation.wordIds) {
    const w = byId.get(id);
    if (!w) continue; // كلمة مفقودة: المدقِّق يخطئها (e-word-missing)
    if (!w.sampleSentence) {
      err("e-upgrade-sample", `${lesson.id}: الكلمة ${id} بلا جملة مثال (البطاقة تعرض الكلمة وحدها)`);
      continue;
    }
    texts.push(w.sampleSentence.de);
    const unknown = frontViolations([w.sampleSentence.de], stems, allow);
    if (unknown.length) err("e-upgrade-sample", `${lesson.id}: مثال ${id} «${w.sampleSentence.de}» — غير مدروسة حتى الدرس: ${unknown.join("، ")}`);
  }
  return { issues, texts };
}

function checkPracticePart(
  lesson: Lesson, ctx: UpgradeContext, stems: ReadonlySet<string>, allow: ReadonlySet<string>, wrong: ReadonlySet<string>,
): PartResult {
  const issues: UpgradeIssue[] = [];
  const err = (code: string, message: string) => issues.push({ level: "error", code, message, lessonId: lesson.id });
  const texts: string[] = [];
  const types = new Set<string>();
  const seen = new Set<string>();
  let total = 0;
  lesson.uebung.stations.forEach((st, si) => {
    types.add(st.type);
    if (!st.explanationRequired) err("e-upgrade-practice", `${lesson.id} محطة ${si + 1}: explanationRequired=false في درس مُرقّى`);
    const shape = PRACTICE_ITEM_SHAPES[st.type];
    st.items.forEach((item, ii) => {
      total++;
      const where = `${lesson.id} محطة ${si + 1} (${st.type}) بند ${ii + 1}`;
      const r = shape.safeParse(item);
      if (!r.success) err("e-upgrade-item", `${where}: ${firstIssue(r.error)}`);
      const key = JSON.stringify(itemTexts(item));
      if (seen.has(key)) err("e-upgrade-item-dup", `${where}: بند مكرر`);
      seen.add(key);
      texts.push(...itemTexts(item));
      if ((AUDIO_STATION_TYPES as readonly string[]).includes(st.type)) {
        const audioId = typeof item.audioId === "string" ? item.audioId : "";
        const track = ctx.tracks.get(audioId);
        if (!track) err("e-upgrade-audio", `${where}: المسار «${audioId}» غير موجود في المانيفست الصوتي`);
        else if (typeof item.speakText === "string" && dictationForm(item.speakText) !== dictationForm(track.textDe))
          err("e-upgrade-audio-text", `${where}: speakText «${item.speakText}» ≠ نص المسار «${track.textDe}»`);
      }
    });
  });
  if (total < PRACTICE_ITEMS_MIN) err("e-upgrade-practice-size", `${lesson.id}: ${total} بنداً < ${PRACTICE_ITEMS_MIN}`);
  if (types.size < PRACTICE_TYPES_MIN) err("e-upgrade-practice-types", `${lesson.id}: ${types.size} أنواع محطات < ${PRACTICE_TYPES_MIN}`);
  for (const t of REQUIRED_STATION_TYPES)
    if (!types.has(t)) err("e-upgrade-practice-audio", `${lesson.id}: لا محطة ${t} (D114: الاستماع بالصوت الموجود والإملاء)`);
  // المصائد جزء من التدريب المعروض (تمرين لكل بطاقة) — قانون الجبهة عليها أيضاً
  for (const c of lesson.zusammenfassung.warningCards) texts.push(c.commonError.de, c.correct.de, ...itemTexts(c.exercise));
  const unknown = frontViolations(texts, stems, allow, wrong);
  if (unknown.length) err("e-upgrade-front", `${lesson.id} (تدريب/مصائد): غير مدروسة حتى الدرس: ${unknown.join("، ")}`);
  // D121: الاستدعاء لما سبق تعلمه — بطاقة أول تدريسها اليوم (أو لاحقاً) ليست استدعاءً بل عرضٌ قبل الشرح
  const earlier = ctx.lessons.filter((l) => pathOrder(l) < pathOrder(lesson));
  if (earlier.length > 0) {
    const before = new Set(earlier.flatMap((l) => l.praesentation.wordIds));
    const notYet = lesson.warmup.cardIds.filter((id) => !before.has(id));
    if (notYet.length) err("e-upgrade-warmup", `${lesson.id}: بطاقات الاستدعاء لم تُدرَّس قبل هذا الدرس: ${notYet.join("، ")} — الاستدعاء لما سبق (F121)`);
  }
  return { issues, texts };
}

function checkQuizPart(lesson: Lesson, stems: ReadonlySet<string>, allow: ReadonlySet<string>, wrong: ReadonlySet<string>): PartResult {
  const issues: UpgradeIssue[] = [];
  const err = (code: string, message: string) => issues.push({ level: "error", code, message, lessonId: lesson.id });
  const texts: string[] = [];
  const signatures: string[] = [];
  lesson.quiz.variants.forEach((v, vi) => {
    if (v.items.length < QUIZ_ITEMS_MIN) err("e-upgrade-quiz-size", `${lesson.id} نسخة ${vi + 1}: ${v.items.length} بنود < ${QUIZ_ITEMS_MIN}`);
    const qs = new Set<string>();
    v.items.forEach((item, ii) => {
      const r = QuizItem.safeParse(item);
      if (!r.success) err("e-upgrade-quiz-item", `${lesson.id} نسخة ${vi + 1} بند ${ii + 1}: ${firstIssue(r.error)}`);
      const q = typeof item.q === "string" ? item.q.trim() : "";
      if (qs.has(q)) err("e-upgrade-quiz-dup", `${lesson.id} نسخة ${vi + 1}: سؤال مكرر «${q}»`);
      qs.add(q);
      texts.push(...itemTexts(item));
    });
    signatures.push([...qs].sort().join("\u0000"));
  });
  for (let i = 0; i < signatures.length; i++)
    for (let j = i + 1; j < signatures.length; j++)
      if (signatures[i] === signatures[j]) err("e-upgrade-quiz-variants", `${lesson.id}: النسختان ${i + 1} و${j + 1} متطابقتان`);
  const unknown = frontViolations(texts, stems, allow, wrong);
  if (unknown.length) err("e-upgrade-front", `${lesson.id} (Quiz): غير مدروسة حتى الدرس: ${unknown.join("، ")}`);
  return { issues, texts };
}

export type LessonPartsReport = Record<UpgradePart, UpgradeIssue[]> & {
  coverage: UpgradeIssue[]; practiceItems: number; practiceTypes: string[]; quizMin: number;
  /** D128: صلاحية الأخطاء المقصودة المعلنة (تُحتسب حين يكون التدريب أو Quiz done) */
  misspellings: UpgradeIssue[];
  /** نصوص كل جزء (لفحص استعمال أسماء العلم المعلنة) */
  texts: Record<UpgradePart, string[]>;
};

/**
 * D128: الخطأ المقصود المعلن (~~Strasse~~ ← Straße) يُقبل بشروط تُفحص هنا كلها: تصحيحه مدروس حتى الدرس (الخطأ يُعرض
 * مقابل صواب يعرفه المتعلم) · ليس صيغة أي كلمة في المقرر كله ولا كلمة مغلقة (Brot · Bus · weh لا تُعلن أخطاءً — قياس
 * D128: المطابقة الآلية بأقرب كلمة مدروسة كانت ستقبلها) · لا يعرفه الحارس أصلاً · قريب من تصحيحه · غير مكرر.
 */
function checkMisspellings(
  lesson: Lesson, declared: readonly { wrong: string; right: string }[], ctx: UpgradeContext,
  stems: ReadonlySet<string>, allow: ReadonlySet<string>,
): UpgradeIssue[] {
  const issues: UpgradeIssue[] = [];
  if (declared.length === 0) return issues;
  const err = (message: string) => issues.push({ level: "error", code: "e-upgrade-misspelling", lessonId: lesson.id, message: `${lesson.id}: ${message}` });
  const courseForms = new Set(ctx.words.flatMap((w) => knownForms(w)));
  const seen = new Set<string>();
  for (const { wrong, right } of declared) {
    const w = wrong.toLowerCase();
    const label = `الخطأ المعلن ~~${wrong}~~ ← ${right}`;
    if (seen.has(w)) err(`${label}: معلن مرتين`);
    seen.add(w);
    const rightUnknown = unknownTokens(right, stems, allow);
    if (rightUnknown.length) err(`${label}: التصحيح غير مدروس حتى الدرس (${rightUnknown.join("، ")}) — الخطأ يُعرض مقابل صواب يعرفه المتعلم`);
    if (CLOSED.has(w) || courseForms.has(w)) err(`${label}: «${wrong}» كلمة حقيقية في المقرر — لا تُعلن خطأً`);
    else if (unknownTokens(wrong, stems, allow).length === 0) err(`${label}: الحارس يعرف «${wrong}» أصلاً — الإعلان بلا معنى وقد تظهر بلا شطب`);
    const d = editDistance(w, right.toLowerCase());
    if (d > MISSPELLING_DISTANCE_MAX) err(`${label}: مسافة التحرير ${d} > ${MISSPELLING_DISTANCE_MAX} — الخطأ الإملائي قريب من صوابه`);
  }
  return issues;
}

/** كل فحوص الدرس كأن أجزاءه كلها done — أساس الحارس وأداة الحالة (ما الذي ينقص بالضبط) */
export function inspectLesson(
  lesson: Lesson, entry: Pick<LessonUpgradeEntry, "properNouns"> & Partial<Pick<LessonUpgradeEntry, "misspellings">>, ctx: UpgradeContext,
): LessonPartsReport {
  const stems = knownStems(taughtUpTo(lesson, ctx.lessons, ctx.words));
  const allow = allowSet(entry.properNouns);
  const declared = entry.misspellings ?? [];
  const wrong = new Set(declared.map((m) => m.wrong.toLowerCase()));
  const rule = checkRulePart(lesson, ctx, stems, allow);
  const practice = checkPracticePart(lesson, ctx, stems, allow, wrong);
  const quiz = checkQuizPart(lesson, stems, allow, wrong);
  const tokens = tokenSet([...practice.texts, ...quiz.texts]);
  const byId = new Map(ctx.words.map((w) => [w.id, w]));
  const unpracticed = lesson.praesentation.wordIds.filter((id) => {
    const w = byId.get(id);
    return w ? !wordAppears(w, tokens) : false;
  });
  const coverage: UpgradeIssue[] = unpracticed.length
    ? [{ level: "error", code: "e-upgrade-word-unpracticed", lessonId: lesson.id, message: `${lesson.id}: كلمات جديدة بلا أي بند تدريب/Quiz: ${unpracticed.join("، ")}` }]
    : [];
  return {
    rule: rule.issues,
    practice: practice.issues,
    quiz: quiz.issues,
    coverage,
    misspellings: checkMisspellings(lesson, declared, ctx, stems, allow),
    practiceItems: lesson.uebung.stations.reduce((n, s) => n + s.items.length, 0),
    practiceTypes: [...new Set(lesson.uebung.stations.map((s) => s.type))],
    quizMin: Math.min(...lesson.quiz.variants.map((v) => v.items.length)),
    texts: { rule: rule.texts, practice: practice.texts, quiz: quiz.texts },
  };
}

export type LessonUpgradeStatus = { lessonId: string; unit: number; day: number; exists: boolean } & Pick<LessonUpgradeEntry, "rule" | "practice" | "quiz"> & {
  report: LessonPartsReport | null;
};

/** حالة الخطة بترتيب المسار (للطباعة) */
export function upgradeStatus(plan: LessonUpgradePlan, ctx: UpgradeContext): LessonUpgradeStatus[] {
  const byId = new Map(ctx.lessons.map((l) => [l.id, l]));
  return plan.lessons
    .map((e) => {
      const lesson = byId.get(e.lessonId);
      return {
        lessonId: e.lessonId, unit: lesson?.unit ?? 0, day: lesson?.day ?? 0, exists: !!lesson,
        rule: e.rule, practice: e.practice, quiz: e.quiz, report: lesson ? inspectLesson(lesson, e, ctx) : null,
      };
    })
    .sort((a, b) => a.unit - b.unit || a.day - b.day);
}

export function checkUpgrade(plan: LessonUpgradePlan, ctx: UpgradeContext): UpgradeIssue[] {
  const issues: UpgradeIssue[] = [];
  const err = (code: string, message: string) => issues.push({ level: "error", code, message });
  const inScope = (l: Lesson) =>
    l.level === plan.level && l.kind === "content" && l.unit >= plan.scope.fromUnit && l.unit <= plan.scope.toUnit;
  const byId = new Map(ctx.lessons.map((l) => [l.id, l]));

  for (const e of plan.lessons) {
    const lesson = byId.get(e.lessonId);
    if (!lesson) err("e-upgrade-lesson", `${e.lessonId}: درس غير موجود`);
    else if (!inScope(lesson))
      err("e-upgrade-lesson", `${e.lessonId}: الخطة لدروس محتوى ${plan.level} في الوحدات ${plan.scope.fromUnit}–${plan.scope.toUnit} فقط`);
  }
  const listed = new Set(plan.lessons.map((e) => e.lessonId));
  const absent = ctx.lessons.filter((l) => inScope(l) && !listed.has(l.id)).map((l) => l.id);
  if (absent.length) err("e-upgrade-complete", `${absent.length} درس محتوى داخل النطاق غائب عن الخطة: ${absent.slice(0, 10).join("، ")}${absent.length > 10 ? "…" : ""}`);

  for (const s of upgradeStatus(plan, ctx)) {
    if (!s.report) continue;
    const r = s.report;
    for (const part of ["rule", "practice", "quiz"] as const) {
      if (s[part] === "done") issues.push(...r[part]);
      else if (r[part].length === 0)
        issues.push({ level: "warning", code: "w-upgrade-mark-done", lessonId: s.lessonId, message: `${s.lessonId}: ${part} (pending) يستوفي معايير done — علِّمه done` });
    }
    if (s.practice === "done" && s.quiz === "done") issues.push(...r.coverage);
    // أسماء العلم المعلنة يجب أن تُستعمل فعلاً في نصوص الدرس المُرقّاة (أمثلة البطاقات · التدريب والمصائد · Quiz)
    if (s.rule === "done" || s.practice === "done" || s.quiz === "done") {
      const entry = plan.lessons.find((e) => e.lessonId === s.lessonId)!;
      const texts = (["rule", "practice", "quiz"] as const).flatMap((p) => (s[p] === "done" ? r.texts[p] : []));
      const seen = new Set(contentTokens(germanOnly(texts.join("\n"))));
      for (const n of entry.properNouns)
        if (!contentTokens(n).every((t) => seen.has(t)))
          issues.push({ level: "warning", code: "w-upgrade-proper-noun", lessonId: s.lessonId, message: `${s.lessonId}: اسم علم معلن لا يظهر في نصوص الدرس المُرقّاة: ${n}` });
    }
    // D128: الأخطاء المقصودة المعلنة — صلاحيتها حين يُعرض التدريب أو Quiz · وكل خطأ معلن يجب أن يظهر مشطوباً فعلاً
    if (s.practice === "done" || s.quiz === "done") {
      issues.push(...r.misspellings);
      const entry = plan.lessons.find((e) => e.lessonId === s.lessonId)!;
      const struck = struckTokens((["practice", "quiz"] as const).flatMap((p) => (s[p] === "done" ? r.texts[p] : [])));
      for (const m of entry.misspellings)
        if (!struck.has(m.wrong.toLowerCase()))
          issues.push({ level: "warning", code: "w-upgrade-misspelling", lessonId: s.lessonId, message: `${s.lessonId}: خطأ مقصود معلن لا يظهر مشطوباً (~~…~~): ${m.wrong}` });
    }
  }
  return issues;
}

/**
 * فحوص ملفات القواعد نفسها (كل ملف shufra — مُرقّى درسه أم لا، فالمُشغِّل يعرض أي قاعدة تُحلّ):
 * الفهرس العكسي بالاتجاهين · مستوى أول درس · قانون الجبهة نسبةً لأول درس يشير إليها في المسار.
 */
export function checkGrammarRules(ctx: UpgradeContext): UpgradeIssue[] {
  const issues: UpgradeIssue[] = [];
  let current = "";
  const err = (code: string, message: string) => issues.push({ level: "error", code, message, ruleId: current });
  const sorted = [...ctx.lessons].sort((a, b) => pathOrder(a) - pathOrder(b));
  for (const rule of ctx.rules.values()) {
    current = rule.id;
    const refs = sorted.filter((l) => l.praesentation.grammarArsenalIds.includes(rule.id));
    for (const l of refs)
      if (!rule.usedInLessons.includes(l.id)) err("e-rule-index", `${rule.id}: الدرس ${l.id} يشير إليها وusedInLessons لا يضمه (§10‑ح)`);
    for (const id of rule.usedInLessons)
      if (!refs.some((l) => l.id === id)) err("e-rule-index", `${rule.id}: usedInLessons يضم ${id} والدرس لا يشير إليها`);
    const first = refs[0];
    if (!first) continue; // ملف بلا درس: المدقِّق ينبه w-arsenal-unused
    if (first.level !== rule.levelIntroduced)
      err("e-rule-level", `${rule.id}: levelIntroduced=${rule.levelIntroduced} وأول درس يستعملها ${first.id}`);
    const p = rule.payload;
    const texts = [...p.examples.map((x) => x.de), p.ruleDe, p.beads.join(" ")];
    const unknown = frontViolations(texts, knownStems(taughtUpTo(first, ctx.lessons, ctx.words)), allowSet(p.properNouns));
    if (unknown.length) err("e-rule-front", `${rule.id} (أول درس ${first.id}): غير مدروسة حتى الدرس: ${unknown.join("، ")}`);
    const seen = new Set(contentTokens(texts.join("\n")));
    for (const n of p.properNouns)
      if (!contentTokens(n).every((t) => seen.has(t)))
        issues.push({ level: "warning", code: "w-rule-proper-noun", ruleId: rule.id, message: `${rule.id}: اسم علم معلن لا يظهر في الأمثلة: ${n}` });
  }
  return issues;
}
