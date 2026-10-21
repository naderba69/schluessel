// tests/spelled-dictation.test.ts — D120: إملاء الحروف (Buchstabendiktat) — تسمع «L, E, N, A.» وتكتب «Lena».
// الإملاء العادي يبقى «ما يُكتب هو ما يُسمع»؛ spelled يُسجَّل صراحة وقاعدته قابلة للتحقق: الحروف المجموعة = الإجابة.
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DictationItem, spelledLetters, type Lesson } from "../content/schemas/index.js";
import { checkAttempt, SPELLED_DICTATION_AR, toTypedItem } from "../src/lib/practice-session.js";
import { PracticeStation } from "../src/components/LessonContent.js";
import { loadAllLessons } from "../src/lesson-packs.js";
const ALL_LESSONS = await loadAllLessons();


const item = (speakText: string, a: string, spelled?: true) => ({ audioId: "abc-spell-lena", speakText, a, ...(spelled ? { spelled } : {}), why: "سبب واضح بما يكفي للبند." });

describe("D120 — إملاء الحروف", () => {
  it("spelledLetters: حروف مفردة بفواصل أو شرطات ← مجموعة بحرف كبير · غير ذلك null", () => {
    expect(spelledLetters("L, E, N, A.")).toBe("LENA");
    expect(spelledLetters("M – Ü – L – L – E – R")).toBe("MÜLLER");
    expect(spelledLetters("S, T, R, A, ß, E.")).toBe("STRAßE"); // ß لا تصير SS
    expect(spelledLetters("Haddad: H, A, D, D, A, D.")).toBeNull(); // كلمة قبل الحروف
    expect(spelledLetters("Hallo.")).toBeNull();
    expect(spelledLetters("A.")).toBeNull(); // حرف واحد ليس تهجئة
  });

  it("المخطط: spelled يقبل الكلمة المجموعة فقط · ß محفوظة · الإملاء العادي بلا تغيير", () => {
    expect(DictationItem.safeParse(item("L, E, N, A.", "Lena", true)).success).toBe(true);
    expect(DictationItem.safeParse(item("M, Ü, L, L, E, R.", "Müller", true)).success).toBe(true);
    expect(DictationItem.safeParse(item("L, E, N, A.", "Lina", true)).success).toBe(false); // حرف واحد خطأ
    expect(DictationItem.safeParse(item("S, T, R, A, ß, E.", "Straße", true)).success).toBe(true);
    expect(DictationItem.safeParse(item("S, T, R, A, ß, E.", "Strasse", true)).success).toBe(false);
    expect(DictationItem.safeParse(item("Hallo.", "Hallo", true)).success).toBe(false); // spelled بلا حروف متهجّاة
    expect(DictationItem.safeParse(item("L, E, N, A.", "Lena")).success).toBe(false); // بلا spelled: ما يُسمع حرفياً
    expect(DictationItem.safeParse(item("Hallo.", "Hallo")).success).toBe(true);
  });

  it("المُشغِّل: تعليمة خاصة لإملاء الحروف · التصحيح يقارن بالكلمة · Muller ليست Müller", () => {
    const spelled = toTypedItem("dictation", item("M, Ü, L, L, E, R.", "Müller", true))!;
    expect(spelled).toMatchObject({ kind: "input", mode: "dictation", prompt: SPELLED_DICTATION_AR, answer: "Müller" });
    expect(toTypedItem("dictation", item("Hallo.", "Hallo"))).toMatchObject({ prompt: "" });
    expect(checkAttempt(spelled, "Müller").status).toBe("correct");
    expect(checkAttempt(spelled, "Muller").status).not.toBe("correct");
  });

  it("الواجهة: بند إملاء الحروف يعرض تعليمته (لا «اكتب ما تسمعه بالضبط»)", () => {
    const d3 = ALL_LESSONS.find((l) => l.id === "a1-u1-d3")!;
    const station = d3.uebung.stations.find((s) => s.type === "dictation")!;
    const data = { stations: [station] as Lesson["uebung"]["stations"], communicativeTask: d3.uebung.communicativeTask, dialogues: [] };
    const html = renderToStaticMarkup(createElement(PracticeStation, { data }));
    expect(html).toContain(SPELLED_DICTATION_AR);
    expect(html).not.toContain("اكتب ما تسمعه بالضبط");
  });

  it("المحتوى الحقيقي: بنود الإملاء في a1-u1-d3 كلها إملاء حروف لأسماء معلنة", () => {
    const d3 = ALL_LESSONS.find((l) => l.id === "a1-u1-d3")!;
    const items = d3.uebung.stations.find((s) => s.type === "dictation")!.items as { a: string; spelled?: true }[];
    expect(items.map((i) => [i.a, i.spelled])).toEqual([["Lena", true], ["Müller", true], ["Haddad", true]]);
  });
});
