// content/schemas/modelltest.ts — الامتحان التجريبي الكامل (4 مهارات) — D95 · الاستماع بصوت حقيقي D103
// D109: الصيغة الرسمية بنداً بنداً — نوع المهمة لكل جزء (يُقاس على exam-formats/) · مرات السماع ·
// نصوص القراءة بيانات مستقلة · ودليل حرفي لكل جواب (مفتاح إجابة قابل للتحقق، لا ثقة عمياء).
import { z } from "zod";
import { Slug } from "./common.js";
import { ExamTaskType } from "./exam-format.js";
import { answerSupported, evidenceIn } from "./answer-key.js";

export const ExamSkill = z.enum(["hoeren", "lesen", "schreiben", "sprechen"]);
export type ExamSkill = z.infer<typeof ExamSkill>;

/** المهام الممكنة لكل مهارة (D109) — «Richtig/Falsch» في الكلام مثلاً خطأ بنيوي */
export const TASKS_FOR_SKILL: Readonly<Record<ExamSkill, readonly ExamTaskType[]>> = {
  hoeren: ["mc3", "richtig-falsch", "zuordnung"],
  lesen: ["mc3", "richtig-falsch", "a-b", "zuordnung"],
  schreiben: ["formular", "freies-schreiben"],
  sprechen: ["freies-sprechen"],
};

/** خيارا Richtig/Falsch بهذا الترتيب حرفياً (كورقة الإجابة الرسمية) */
export const RICHTIG_FALSCH = ["Richtig", "Falsch"] as const;
/** خيارا «أي النصين؟» — يشيران إلى textRefs[0] وtextRefs[1] */
export const A_B = ["a", "b"] as const;

/** نص مقروء في الامتحان (D109): رسالة · إعلان · لافتة · موقف الاستمارة */
export const ExamText = z.object({
  id: Slug,
  kind: z.enum(["email", "nachricht", "anzeige", "webseite", "schild", "aushang", "situation"]),
  /** عنوان فوق النص (اسم المحل/الموقع/المرسل) — اختياري */
  title: z.string().min(1).optional(),
  de: z.string().min(1),
});
export type ExamText = z.infer<typeof ExamText>;

export const ModelltestItem = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
  choices: z.array(z.string().min(1)).optional(),
  /** D103: أسطر السكربت التي يُسمع فيها الجواب (معرّفات مسارات المانيفست) — إلزامي في Hören */
  audioRefs: z.array(Slug).min(1).optional(),
  /** D109: نصوص الجزء التي يُجاب منها — إلزامي في Lesen والاستمارة؛ في a-b: [النص a, النص b] */
  textRefs: z.array(Slug).min(1).optional(),
  /**
   * D109: الدليل — اقتباس حرفي من الصوت/النص يحسم الجواب. إلزامي في الاستماع والقراءة والاستمارة:
   * المدقِّق يتحقق أنه منطوق فعلاً (Hören) والمخطط أنه مكتوب فعلاً (Lesen) — وتعرضه الواجهة بعد التصحيح.
   */
  evidence: z.string().min(1).optional(),
});
export type ModelltestItem = z.infer<typeof ModelltestItem>;

export const ModelltestPart = z.object({
  id: Slug,
  prompt: z.object({ de: z.string().min(1), ar: z.string().min(1) }),
  /** D109: نوع المهمة — يطابق kind الجزء المقابل في الصيغة الرسمية */
  taskType: ExamTaskType,
  /** D109: مرات السماع (Hören فقط — إلزامي هناك) — تفرضها الواجهة */
  playCount: z.number().int().min(1).max(2).optional(),
  /** D103: سكربت الصوت لهذا الجزء (content/audio-scripts/) — إلزامي في Hören */
  audioScriptRef: Slug.optional(),
  /** D109: نصوص القراءة/الموقف — إلزامية في Lesen والاستمارة */
  texts: z.array(ExamText).min(1).optional(),
  items: z.array(ModelltestItem).min(1),
});
export type ModelltestPart = z.infer<typeof ModelltestPart>;

const sameList = (a: readonly string[] | undefined, b: readonly string[]) =>
  !!a && a.length === b.length && a.every((x, i) => x === b[i]);

/** قسم من أقسام الامتحان (مهارة واحدة) */
export const ModelltestSection = z.object({
  skill: ExamSkill,
  timeBudgetMin: z.number().int().min(5).max(60),
  instructions: z.object({ de: z.string().min(1), ar: z.string().min(1) }),
  parts: z.array(ModelltestPart).min(1),
}).superRefine((s, ctx) => {
  for (const [pi, p] of s.parts.entries()) {
    const at = (...path: (string | number)[]) => ["parts", pi, ...path];
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: "custom", path, message });

    if (!TASKS_FOR_SKILL[s.skill].includes(p.taskType))
      issue(at("taskType"), `المهمة ${p.taskType} لا تصلح لمهارة ${s.skill} (${TASKS_FOR_SKILL[s.skill].join("/")})`);

    if (s.skill === "hoeren") {
      // D103: لا «Hören Sie» بلا صوت — كان القسم كله بلا ملف ولا نص يُسمع
      if (!p.audioScriptRef) issue(at("audioScriptRef"), `جزء استماع بلا سكربت صوتي: ${p.id}`);
      if (!p.playCount) issue(at("playCount"), `جزء استماع بلا مرات سماع: ${p.id}`);
    } else if (p.audioScriptRef || p.playCount) {
      issue(at("audioScriptRef"), `صوت في غير الاستماع: ${p.id}`);
    }

    // النصوص: معرّفات فريدة · كل نص يُستعمل · مطلوبة للقراءة والاستمارة
    const texts = new Map((p.texts ?? []).map((t) => [t.id, t] as const));
    if (texts.size !== (p.texts ?? []).length) issue(at("texts"), `معرّف نص مكرر في ${p.id}`);
    const needsTexts = s.skill === "lesen" || p.taskType === "formular";
    if (needsTexts && texts.size === 0) issue(at("texts"), `جزء بلا نصوص يُقرأ منها: ${p.id}`);
    const used = new Set(p.items.flatMap((it) => it.textRefs ?? []));
    for (const id of texts.keys()) if (!used.has(id)) issue(at("texts"), `نص لا يسأل عنه أي بند: ${p.id}/${id}`);

    for (const [ii, it] of p.items.entries()) {
      const tag = `${p.id}#${ii + 1}`;
      const ip = (field: string) => at("items", ii, field);

      if (s.skill === "hoeren" && !it.audioRefs?.length) issue(ip("audioRefs"), `سؤال استماع بلا مقطع صوتي: ${tag}`);
      if ((s.skill === "hoeren" || needsTexts) && !it.evidence) issue(ip("evidence"), `جواب بلا دليل حرفي: ${tag}`);

      // الخيارات حسب نوع المهمة
      if (p.taskType === "mc3") {
        if (it.choices?.length !== 3 || new Set(it.choices).size !== 3) issue(ip("choices"), `mc3 = ثلاثة خيارات مختلفة: ${tag}`);
      } else if (p.taskType === "richtig-falsch") {
        if (!sameList(it.choices, RICHTIG_FALSCH)) issue(ip("choices"), `Richtig/Falsch حرفياً وبهذا الترتيب: ${tag}`);
      } else if (p.taskType === "a-b") {
        if (!sameList(it.choices, A_B)) issue(ip("choices"), `a/b حرفياً: ${tag}`);
        if (it.textRefs?.length !== 2) issue(ip("textRefs"), `a-b = نصّان بالضبط [a, b]: ${tag}`);
      } else if (p.taskType === "zuordnung") {
        if (!it.choices || it.choices.length < 3) issue(ip("choices"), `المطابقة تحتاج 3 خيارات على الأقل: ${tag}`);
      }
      if (it.choices && !it.choices.includes(it.a)) issue(ip("a"), `الجواب «${it.a}» ليس بين الخيارات: ${tag}`);

      // القراءة والاستمارة: الإحالات موجودة والدليل مكتوب فعلاً في النص المُحال إليه
      if (!needsTexts) continue;
      const refs = it.textRefs ?? [];
      if (refs.length === 0) { issue(ip("textRefs"), `بند بلا نص يُقرأ منه: ${tag}`); continue; }
      const missing = refs.filter((r) => !texts.has(r));
      if (missing.length) { issue(ip("textRefs"), `إحالة إلى نص غير موجود: ${tag} → ${missing.join(", ")}`); continue; }
      if (!it.evidence) continue;
      // a-b: الدليل في النص المختار تحديداً — وإلا فالمفتاح يشير إلى النص الخطأ
      const scope = p.taskType === "a-b" && refs.length === 2 && (it.a === "a" || it.a === "b")
        ? [refs[it.a === "a" ? 0 : 1]!]
        : refs;
      if (!scope.some((r) => evidenceIn(it.evidence!, texts.get(r)!.de)))
        issue(ip("evidence"), `الدليل «${it.evidence}» ليس اقتباساً حرفياً من ${scope.join("/")}: ${tag}`);
      // الاستمارة: الجواب نفسه وارد في الدليل (لا استنتاج خارج النص)
      if (p.taskType === "formular") {
        const sup = answerSupported(it.a, it.evidence);
        if (!sup.ok) issue(ip("a"), `جواب الاستمارة «${it.a}» غير وارد في دليله (ينقص: ${sup.missing.join("، ")}): ${tag}`);
      }
    }
  }
});

/** امتحان تجريبي كامل — نموذج الصيغة الرسمية لمستواه (4 مهارات) */
export const Modelltest = z.object({
  schemaVersion: z.string().min(1),
  id: Slug,
  level: z.enum(["A1", "A2", "B1", "B2"]),
  title: z.object({ de: z.string().min(1), ar: z.string().min(1) }),
  passingScore: z.number().min(0).max(1),
  sections: z.array(ModelltestSection).length(4), // أربع مهارات دائماً
  /**
   * D109: أسماء العلم في نصوص الامتحان (أشخاص/مدن/محلات) — ليست مفردات تُدرَّس؛ تُستثنى من قفل
   * المفردات (قانون الجبهة 13) **صراحةً هنا** لا بقائمة خفية في الكود.
   */
  properNouns: z.array(z.string().regex(/^\p{Lu}/u, "اسم العلم يبدأ بحرف كبير")).default([]),
  sourceNote: z.string().min(1), // الصدق: ملاحظة المصدر/التحقق
}).superRefine((t, ctx) => {
  // معرّفات الأجزاء فريدة عبر الامتحان: usedIn في السكربتات يشير إليها بـ«<id>#<part>»
  const seen = new Set<string>();
  t.sections.forEach((s, si) => s.parts.forEach((p, pi) => {
    if (seen.has(p.id)) ctx.addIssue({ code: "custom", path: ["sections", si, "parts", pi, "id"], message: `معرّف جزء مكرر: ${p.id}` });
    seen.add(p.id);
  }));
  if (new Set(t.sections.map((s) => s.skill)).size !== 4)
    ctx.addIssue({ code: "custom", path: ["sections"], message: "المهارات الأربع مرة واحدة لكل منها" });
});
export type Modelltest = z.infer<typeof Modelltest>;
