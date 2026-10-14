// content/schemas/wordlist.ts — فهرس قوائم Goethe الرسمية (D110)
// الكلمات الرئيسية فقط (الكلمة + الأداة + علامة الجمع/التصريف كما طُبعت) وبنود Wortgruppen —
// لا جمل أمثلة أبداً (حقوق النشر؛ المستودع عام). المولِّد: tools/goethe-wordlist.py
// المطابقة مع كلماتنا (goetheList = دليل لا رأي): tools/lib/goethe-lists.ts
import { z } from "zod";
import { Level, SchemaVersioned, Slug } from "./common.js";

export const WordlistEntry = z.object({
  /** عمود الكلمة الرئيسية كما طُبع (مع علامة الجمع/الصيغ) — لا جملة: 3 كلمات فأكثر بعلامة نهاية = جملة مثال */
  headword: z.string().min(1).max(120).refine(
    (s) => !(/[.?!]\s*$/.test(s) && s.trim().split(/\s+/).length >= 3) || /(z\. B\.|ca\.|usw\.|d\.h\.)$/.test(s),
    { message: "يشبه جملة مثال — الفهرس للكلمات الرئيسية فقط" },
  ),
  /** الصيغ القابلة للمطابقة (بلا أداة) — Abfahrt · abfahren · auf sein · all- (جذع) */
  lemmas: z.array(z.string().min(1)).min(1),
  /** der · die · das · der/die · das/der/die … كما طُبع */
  article: z.string().regex(/^(der|die|das)(\/(der|die|das))*$/).optional(),
  page: z.number().int().positive(),
  /** main = مدخل رئيسي · sub = مدخل فرعي مُزاح (eingerückter Nebeneintrag) · group = بند Wortgruppe */
  kind: z.enum(["main", "sub", "group"]),
  group: z.string().min(1).optional(),
}).strict();
export type WordlistEntry = z.infer<typeof WordlistEntry>;

export const OfficialWordlist = SchemaVersioned.extend({
  id: Slug,
  level: Level,
  exam: z.string().min(1),
  title: z.string().min(1),
  publisher: z.literal("Goethe-Institut"),
  officialUrl: z.string().url(),
  /** ما تقوله الوثيقة عن حجمها (circa 650 Einträge …) أو null */
  statedEntries: z.string().nullable(),
  source: z.object({
    /** pdf-extract = استخراج آلي بالإحداثيات · manual-transcription = نسخ يدوي معلن (Fit1) */
    method: z.enum(["pdf-extract", "manual-transcription"]),
    file: z.string().min(1),
    sha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
    gitBlob: z.string().regex(/^[0-9a-f]{40}$/).optional(),
    bytes: z.number().int().positive().optional(),
    pages: z.number().int().positive(),
    pdfTitle: z.string().nullable().optional(),
    pdfModDate: z.string().nullable().optional(),
    pdfCreationDate: z.string().nullable().optional(),
    transcript: z.string().optional(),
    transcriptSha256: z.string().regex(/^[0-9a-f]{64}$/).optional(),
    extractor: z.string().min(1),
    /** كيف وصل الملف (المضيف الرسمي محجوب في بيئة البناء) */
    obtainedVia: z.string().min(1),
    /** ما قورن بالوثيقة الرسمية الحية على goethe.de */
    verifiedAgainst: z.string().min(1),
  }).strict(),
  /** فئات مفتوحة تذكرها الوثيقة بلا قائمة مغلقة (SD1/Fit1: «Angabe der eigenen Herkunft oder Nationalität») */
  openCategories: z.array(z.object({
    id: z.enum(["herkunft"]),
    group: z.string().min(1),
    page: z.number().int().positive(),
    note: z.string().min(1),
  })).default([]),
  counts: z.object({ main: z.number().int(), sub: z.number().int(), group: z.number().int() }),
  entries: z.array(WordlistEntry).min(100),
}).superRefine((l, ctx) => {
  const c = { main: 0, sub: 0, group: 0 };
  for (const e of l.entries) c[e.kind]++;
  if (c.main !== l.counts.main || c.sub !== l.counts.sub || c.group !== l.counts.group)
    ctx.addIssue({ code: "custom", message: `counts لا يطابق المداخل (${c.main}/${c.sub}/${c.group})` });
  if (l.source.method === "pdf-extract" && (!l.source.sha256 || !l.source.gitBlob))
    ctx.addIssue({ code: "custom", message: "استخراج PDF بلا بصمة الملف (sha256 + gitBlob)" });
  if (l.source.method === "manual-transcription" && !l.source.transcript)
    ctx.addIssue({ code: "custom", message: "نسخ يدوي بلا مسار ملف النسخ" });
});
export type OfficialWordlist = z.infer<typeof OfficialWordlist>;
