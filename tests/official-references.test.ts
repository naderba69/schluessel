// tests/official-references.test.ts — D108: المراجع الرسمية بيانات في المستودع + قياس الامتحان التجريبي عليها
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ExamFormat, CurriculumReference, Lesson } from "../content/schemas/index.js";
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

describe("D108 — المدقِّق يقيس كل امتحان تجريبي على صيغة مستواه", () => {
  const section = (skill: string, minutes: number, counts: number[]) => ({
    skill, timeBudgetMin: minutes, instructions: { de: "x", ar: "س" },
    parts: counts.map((n, i) => ({
      id: `${skill}-${i + 1}`, prompt: { de: "x", ar: "س" },
      ...(skill === "hoeren" ? { audioScriptRef: "s" } : {}),
      items: Array.from({ length: n }, () => ({ q: "q", a: "a", ...(skill === "hoeren" ? { audioRefs: ["l"] } : {}) })),
    })),
  });
  const mt = (hoeren: number[], lesen: number[]) => ({
    path: "modelltest/mt-x.json",
    data: {
      schemaVersion: "1.0.0", id: "mt-x", level: "A1", title: { de: "T", ar: "ت" }, passingScore: 0.6, sourceNote: "s",
      sections: [section("hoeren", 20, hoeren), section("lesen", 25, lesen), section("schreiben", 20, [5, 1]), section("sprechen", 15, [1, 1, 1])],
    },
  });
  const fmt = { path: "exam-formats/goethe-a1-sd1.json", data: read("exam-formats/goethe-a1-sd1.json") };
  const warn = (e: { path: string; data: unknown }[]) => validateContentTree(e).warnings.filter((w) => w.code === "w-modelltest-format");

  it("امتحان مطابق للصيغة = لا تحذير", () => {
    expect(warn([fmt, mt([6, 4, 5], [5, 5, 5])])).toEqual([]);
  });
  it("بنود ناقصة = تحذير يسمّي الجزء والعددين", () => {
    const w = warn([fmt, mt([4, 3, 2], [5, 5, 5])]);
    expect(w).toHaveLength(1);
    expect(w[0]!.message).toContain("الجزء 1: 4 بنود والرسمي 6");
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
