// tests/official-references.test.ts — D108: المراجع الرسمية بيانات في المستودع + قياس الامتحان التجريبي عليها
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ExamFormat, CurriculumReference, Lesson, taskTypeKind } from "../content/schemas/index.js";
import { validateContentTree } from "../tools/validate-content.js";

const C = join(process.cwd(), "content");
const read = (p: string) => JSON.parse(readFileSync(join(C, p), "utf8"));
const A1 = ExamFormat.parse(read("exam-formats/goethe-a1-sd1.json"));
const A2 = ExamFormat.parse(read("exam-formats/goethe-a2.json"));
const items = (f: ExamFormat, skill: string) => f.skills.find((s) => s.skill === skill)!.parts.map((p) => p.items);

describe("D108 — الصيغة الرسمية: أرقام وثائق Goethe حرفياً", () => {
  it("A1 Start Deutsch 1: الاستماع 6/4/5 (سماع 2/1/2) · القراءة 5/5/5 · 20/25/20/15 دقيقة · النجاح 60/100", () => {
    expect(items(A1, "hoeren")).toEqual([6, 4, 5]);
    expect(A1.skills.find((s) => s.skill === "hoeren")!.parts.map((p) => p.playCount)).toEqual([2, 1, 2]);
    expect(items(A1, "lesen")).toEqual([5, 5, 5]);
    expect(A1.skills.map((s) => [s.skill, s.minutes])).toEqual([["hoeren", 20], ["lesen", 25], ["schreiben", 20], ["sprechen", 15]]);
    expect(A1.passRule).toMatchObject({ totalPoints: 100, passAt: 60 });
    expect(A1.passRule.writtenMin).toBeUndefined(); // A1 غير مُجزّأ: لا عتبة منفصلة
  });

  it("A2: القراءة 4×5 · الاستماع 4×5 (سماع 2/1/1/2) · عتبتان: كتابي ≥45/75 وشفهي ≥15/25", () => {
    expect(items(A2, "lesen")).toEqual([5, 5, 5, 5]);
    expect(items(A2, "hoeren")).toEqual([5, 5, 5, 5]);
    expect(A2.skills.find((s) => s.skill === "hoeren")!.parts.map((p) => p.playCount)).toEqual([2, 1, 1, 2]);
    expect(A2.passRule).toMatchObject({ totalPoints: 100, passAt: 60, writtenMin: 45, oralMin: 15 });
  });

  it("المصادر وثائق Goethe الرسمية المجانية فقط (لا كتب تجارية)", () => {
    for (const f of [A1, A2]) for (const s of f.sources) expect(new URL(s.url).hostname).toBe("www.goethe.de");
  });
});

describe("D108 + D109 — المدقِّق يقيس كل امتحان تجريبي على صيغة مستواه (خطأ لا تحذير منذ D109)", () => {
  // بنود صالحة للمخطط لكل نوع مهمة — فلا يقيس الاختبار إلا الصيغة (البنود · المهمة · السماع · المدة)
  const RF = ["Richtig", "Falsch"];
  const HOEREN_ITEM: Record<string, unknown> = {
    mc3: { q: "Was trinkt sie?", a: "Wasser", choices: ["Kaffee", "Wasser", "Milch"], audioRefs: ["l"], evidence: "x" },
    "richtig-falsch": { q: "Sie trinkt Wasser.", a: "Falsch", choices: RF, audioRefs: ["l"], evidence: "x" },
  };
  const LESEN: Record<string, { texts: unknown[]; item: unknown }> = {
    "richtig-falsch": {
      texts: [{ id: "t", kind: "schild", de: "Montag geschlossen." }],
      item: { q: "Am Montag ist offen.", a: "Falsch", choices: RF, textRefs: ["t"], evidence: "Montag geschlossen" },
    },
    "a-b": {
      texts: [{ id: "a1", kind: "anzeige", de: "Sonntag offen." }, { id: "b1", kind: "anzeige", de: "Sonntag geschlossen." }],
      item: { q: "Sie möchten am Sonntag einkaufen.", a: "a", choices: ["a", "b"], textRefs: ["a1", "b1"], evidence: "Sonntag offen" },
    },
  };
  type Spec = { task: string; n: number; plays?: number };
  const SD1_HOEREN: Spec[] = [{ task: "mc3", n: 6, plays: 2 }, { task: "richtig-falsch", n: 4, plays: 1 }, { task: "mc3", n: 5, plays: 2 }];
  const SD1_LESEN: Spec[] = [{ task: "richtig-falsch", n: 5 }, { task: "a-b", n: 5 }, { task: "richtig-falsch", n: 5 }];
  const patch = (specs: Spec[], i: number, p: Partial<Spec>) => specs.map((s, j) => (j === i ? { ...s, ...p } : s));
  const prompt = { de: "x", ar: "س" };
  const exam = (hoeren = SD1_HOEREN, lesen = SD1_LESEN, hoerenMinutes = 20) => ({
    path: "modelltest/mt-x.json",
    data: {
      schemaVersion: "1.0.0", id: "mt-x", level: "A1", title: { de: "T", ar: "ت" }, passingScore: 0.6, sourceNote: "s",
      sections: [
        { skill: "hoeren", timeBudgetMin: hoerenMinutes, instructions: prompt, parts: hoeren.map((p, i) => ({
          id: `hoeren-${i + 1}`, prompt, taskType: p.task, playCount: p.plays, audioScriptRef: "s",
          items: Array.from({ length: p.n }, () => HOEREN_ITEM[p.task]),
        })) },
        { skill: "lesen", timeBudgetMin: 25, instructions: prompt, parts: lesen.map((p, i) => ({
          id: `lesen-${i + 1}`, prompt, taskType: p.task, texts: LESEN[p.task]!.texts,
          items: Array.from({ length: p.n }, () => LESEN[p.task]!.item),
        })) },
        { skill: "schreiben", timeBudgetMin: 20, instructions: prompt, parts: [
          { id: "schreiben-1", prompt, taskType: "formular", texts: [{ id: "s", kind: "situation", de: "Er heißt Karim." }],
            items: Array.from({ length: 5 }, () => ({ q: "Vorname:", a: "Karim", textRefs: ["s"], evidence: "Er heißt Karim" })) },
          { id: "schreiben-2", prompt, taskType: "freies-schreiben", items: [{ q: "q", a: "a" }] },
        ] },
        { skill: "sprechen", timeBudgetMin: 15, instructions: prompt, parts: [1, 2, 3].map((i) => ({
          id: `sprechen-${i}`, prompt, taskType: "freies-sprechen", items: [{ q: "q", a: "a" }],
        })) },
      ],
    },
  });
  const fmt = { path: "exam-formats/goethe-a1-sd1.json", data: read("exam-formats/goethe-a1-sd1.json") };
  const errs = (e: { path: string; data: unknown }[], code: string) => validateContentTree(e).errors.filter((w) => w.code === code);
  const formatMsg = (m: ReturnType<typeof exam>) => errs([fmt, m], "e-modelltest-format").map((e) => e.message).join(" | ");

  it("امتحان مطابق للصيغة (البنود · المهام · مرات السماع · المدة) = صالح للمخطط ولا خطأ صيغة", () => {
    expect(errs([fmt, exam()], "e-schema")).toEqual([]);
    expect(errs([fmt, exam()], "e-modelltest-format")).toEqual([]);
  });
  it("بنود ناقصة = خطأ واحد يسمّي الجزء والعددين", () => {
    const e = errs([fmt, exam(patch(SD1_HOEREN, 0, { n: 4 }))], "e-modelltest-format");
    expect(e).toHaveLength(1);
    expect(e[0]!.message).toContain("الجزء 1: 4 بنود والرسمي 6");
  });
  it("D109: نوع مهمة مخالف · مرات سماع مخالفة · مدة مخالفة = خطأ يسمّي الفرق", () => {
    expect(formatMsg(exam(patch(SD1_HOEREN, 1, { task: "mc3" })))).toContain("الجزء 2: المهمة mc3 والرسمية richtig-falsch");
    expect(formatMsg(exam(patch(SD1_HOEREN, 1, { plays: 2 })))).toContain("الجزء 2: السماع 2× والرسمي 1×");
    expect(formatMsg(exam(SD1_HOEREN, patch(SD1_LESEN, 1, { task: "richtig-falsch" })))).toContain("الجزء 2: المهمة richtig-falsch والرسمية a-b");
    expect(formatMsg(exam(SD1_HOEREN, SD1_LESEN, 30))).toContain("المدة 30 والرسمية 20 د");
  });
});

describe("D109 — نوع المهمة في الصيغة الرسمية = تصنيف عبارتها الألمانية حرفياً", () => {
  it("كل جزء في الصيغتين: kind يطابق taskTypeKind(taskType)", () => {
    for (const f of [A1, A2]) for (const s of f.skills) for (const p of s.parts) expect(taskTypeKind(p.taskType), `${f.id}/${s.skill}/${p.part}`).toBe(p.kind);
    expect(A1.skills.map((s) => s.parts.map((p) => p.kind))).toEqual([
      ["mc3", "richtig-falsch", "mc3"], ["richtig-falsch", "a-b", "richtig-falsch"], ["formular", "freies-schreiben"],
      ["freies-sprechen", "freies-sprechen", "freies-sprechen"],
    ]);
  });
  it("kind يناقض العبارة = رفض المخطط", () => {
    const bad = read("exam-formats/goethe-a1-sd1.json");
    bad.skills[0].parts[1].kind = "mc3"; // العبارة «Richtig/Falsch»
    expect(() => ExamFormat.parse(bad)).toThrow(/يناقض عبارة الوثيقة/);
  });
});

describe("D108 — Netzwerk neu A2: عناوين الفصول من فهرس Klett الرسمي", () => {
  const ref = CurriculumReference.parse(read("arsenal/curriculum-reference.json"));
  it("12 فصلاً بالعناوين الرسمية حرفياً + مصدر مُعلن + تسلسل المتطلبات", () => {
    const a2 = ref.levels.A2!;
    expect(a2.chapters.map((c) => c.title)).toEqual([
      "Und was machst du?", "Nach der Schulzeit", "Immer online?", "Große und kleine Gefühle", "Leben in der Stadt",
      "Arbeitswelten", "Ganz schön mobil", "Gelernt ist gelernt!", "Sportlich, sportlich", "Zusammen leben",
      "Wie die Zeit vergeht!", "Gute Unterhaltung!",
    ]);
    expect(a2.source).toContain("Klett");
    expect(a2.chapters[0]!.requiresPrevious).toEqual([]);
    expect(a2.chapters[11]!.requiresPrevious).toEqual(["k11"]);
    expect(a2.chapters.every((c) => c.grammarPoints.length === 0)).toBe(true); // لم تُتحقق بعد — لا تخمين
  });
  it("a2-u1-d1 يشير إلى الفصل 1 المتحقَّق منه — بلا needs-web-verify", () => {
    const l = Lesson.parse(read("lessons/a2/a2-u1-d1.json"));
    expect(l.curriculumRef.netzwerkChapter).toContain("Kapitel 1 «Und was machst du?»");
    expect(l.curriculumRef.netzwerkChapter).not.toContain("needs-web-verify");
  });
});
