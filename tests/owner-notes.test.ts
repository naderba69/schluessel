/**
 * D124 — سجل ملاحظاتي للمالك يُجمع حتى نهاية المشروع · D129 — صار في البرومت الاحترافي نفسه (§10 بين علامتين)
 * بأمر المالك «جميع ملاحظاتك احفظها في البرومت الاحترافي لنتناقش فيها عند انتهاء المشروع» — مصدر واحد:
 * docs/OWNER_NOTES_AR.md مؤشر بلا ملاحظات.
 * الحارس يضمن أن السجل لا يتآكل بصمت: معرّفات ثابتة متتابعة لا تُحذف ·
 * كل ملاحظة لها مصدر موجود في DECISIONS.md · المغلقة تشير إلى قرار إغلاق موجود ·
 * غير المغلقة تقول «المطلوب» · سطر العدد يطابق الملاحظات.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");
const PROMPT = readFileSync(join(ROOT, "docs", "PROFESSIONAL_CONTINUATION_PROMPT_AR.md"), "utf8");
const POINTER = readFileSync(join(ROOT, "docs", "OWNER_NOTES_AR.md"), "utf8");
const START = "<!-- owner-notes:start -->";
const END = "<!-- owner-notes:end -->";
/** باب السجل في البرومت: ما بين العلامتين (فارغ إن غابتا — فتسقط الاختبارات كلها) */
const LEDGER = PROMPT.includes(START) && PROMPT.includes(END) ? PROMPT.slice(PROMPT.indexOf(START), PROMPT.indexOf(END)) : "";
const DECISIONS = readFileSync(join(ROOT, "DECISIONS.md"), "utf8");

type Status = "مفتوحة" | "بانتظار المالك" | "مغلقة";
type Note = { n: number; status: Status; closedBy?: string; sources: string[]; text: string; line: string };

const NOTE_LINE = /^- \*\*N-(\d{3})\*\* · \[(مفتوحة|بانتظار المالك|مغلقة ← (D\d+))\] · (D\d+(?:، D\d+)*) · (.+)$/u;

function parseLedger(md: string): { notes: Note[]; malformed: string[]; counts: Record<string, number> | null } {
  const notes: Note[] = [];
  const malformed: string[] = [];
  for (const line of md.split("\n")) {
    if (!line.startsWith("- **N-")) continue;
    const m = NOTE_LINE.exec(line);
    if (!m) { malformed.push(line.slice(0, 80)); continue; }
    const status: Status = m[3] ? "مغلقة" : (m[2] as Status);
    notes.push({ n: Number(m[1]), status, closedBy: m[3], sources: m[4]!.split("، "), text: m[5]!, line });
  }
  const c = /\*\*العدد:\*\* بانتظار المالك (\d+) · مفتوحة (\d+) · مغلقة (\d+) · المجموع (\d+)/u.exec(md);
  const counts = c ? { owner: Number(c[1]), open: Number(c[2]), closed: Number(c[3]), total: Number(c[4]) } : null;
  return { notes, malformed, counts };
}

/** القرارات بثلاث صيغ تاريخية: D1–D28 بنود «**Dn**» في رأس الملف · D29–D46 «### Dn —» · D47 فما بعد «## Dn (» */
const HEADING = /^#{2,3} (D\d+)\b/gmu;
const HEAD = DECISIONS.slice(0, DECISIONS.search(/^#{2,3} D\d+\b/mu));
const DECISION_IDS = new Set([
  ...[...DECISIONS.matchAll(HEADING)].map((m) => m[1]!),
  ...[...HEAD.matchAll(/\*\*(D\d+)\b/gu)].map((m) => m[1]!),
]);

describe("D124 — سجل ملاحظات المالك", () => {
  const { notes, malformed, counts } = parseLedger(LEDGER);

  it("D129: السجل في البرومت الاحترافي (§10) بين علامتين مرة واحدة · والملف القديم مؤشر بلا ملاحظة (مصدر واحد)", () => {
    expect(PROMPT.split(START).length - 1).toBe(1);
    expect(PROMPT.split(END).length - 1).toBe(1);
    expect(PROMPT.indexOf(START)).toBeLessThan(PROMPT.indexOf(END));
    expect(PROMPT.slice(0, PROMPT.indexOf(START))).toMatch(/## 10\. سجل ملاحظاتي للمالك[^\n]*\n$/u);
    // لا ملاحظة خارج الباب (لا نسخة ثانية في البرومت نفسه) ولا في الملف القديم
    const outside = PROMPT.slice(0, PROMPT.indexOf(START)) + PROMPT.slice(PROMPT.indexOf(END));
    expect(outside.split("\n").filter((l) => l.startsWith("- **N-"))).toEqual([]);
    expect(POINTER.split("\n").filter((l) => l.startsWith("- **N-"))).toEqual([]);
    expect(POINTER).toContain("§10 من `docs/PROFESSIONAL_CONTINUATION_PROMPT_AR.md`");
  });

  it("كل سطر يبدأ بـN- بالصيغة المقررة (لا ملاحظة مشوّهة تفلت من العدّ)", () => {
    expect(malformed).toEqual([]);
    expect(notes.length).toBeGreaterThan(0);
  });

  it("المعرّفات فريدة ومتتابعة من N-001 — لا ملاحظة تُحذف (المحلولة تُغلق ولا تُمحى)", () => {
    expect(notes.map((x) => x.n)).toEqual(notes.map((_, i) => i + 1));
  });

  it("كل مصدر وكل قرار إغلاق موجود عنواناً في DECISIONS.md", () => {
    expect(DECISION_IDS.size).toBeGreaterThanOrEqual(123);
    const missing = notes.flatMap((x) => [...x.sources, ...(x.closedBy ? [x.closedBy] : [])].filter((d) => !DECISION_IDS.has(d)).map((d) => `N-${x.n}:${d}`));
    expect(missing).toEqual([]);
  });

  it("غير المغلقة تقول «المطلوب:» والمغلقة تقول «أُغلقت:» — كل ملاحظة قابلة للتنفيذ أو مسبَّبة", () => {
    const bad = notes.filter((x) => (x.status === "مغلقة" ? !x.text.includes("— أُغلقت:") : !x.text.includes("— المطلوب:")));
    expect(bad.map((x) => x.n)).toEqual([]);
  });

  it("سطر العدد في الرأس يطابق الملاحظات", () => {
    expect(counts).not.toBeNull();
    const by = (s: Status) => notes.filter((x) => x.status === s).length;
    expect(counts).toEqual({ owner: by("بانتظار المالك"), open: by("مفتوحة"), closed: by("مغلقة"), total: notes.length });
  });

  it("المحلّل نفسه يرفض الصيغ الخاطئة (فحص الحارس)", () => {
    const sample = [
      "**العدد:** بانتظار المالك 0 · مفتوحة 1 · مغلقة 1 · المجموع 2",
      "- **N-001** · [مفتوحة] · D1 · نص — المطلوب: شيء.",
      "- **N-002** · [مغلقة ← D2] · D1 · نص — أُغلقت: سبب.",
      "- **N-3** · [مفتوحة] · D1 · معرّف بلا أصفار",
      "- **N-004** · [مؤجلة] · D1 · حالة غير مقررة",
    ].join("\n");
    const r = parseLedger(sample);
    expect(r.notes.map((x) => [x.n, x.status, x.closedBy ?? null])).toEqual([[1, "مفتوحة", null], [2, "مغلقة", "D2"]]);
    expect(r.malformed).toHaveLength(2);
    expect(r.counts).toEqual({ owner: 0, open: 1, closed: 1, total: 2 });
  });
});
