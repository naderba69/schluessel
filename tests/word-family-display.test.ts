// tests/word-family-display.test.ts — D118: عائلة الكلمة على بطاقة «الجديد» تُعرض بصيغتها الألمانية ومن المدروس وحده.
// كان المعرّف يُعرض كما هو (159 من 205 مرجعاً: «tuerkei» · «aegypten» · «wie-gehts» — رسم خاطئ أمام المتعلم)،
// و4 أعضاء لم يُدرَّسوا بعد يظهرون (3 منها في أول درس: wohnung · alt · viel) — خرق لقانون الجبهة 13.
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NetworkLab } from "../src/components/SkillsLab.js";
import { LESSON_ORDER, loadAllGrammarRules, loadAllLessons, loadAllWords, runtimeWordsForLesson, loadFirstSession } from "../src/lesson-packs.js";
const FIRST_WORDS = (await loadFirstSession()).direct;
const ALL_GRAMMAR_RULES = await loadAllGrammarRules();
const ALL_LESSONS = await loadAllLessons();
const ALL_WORDS = await loadAllWords();

import { familyForms, fullForm, planLessonStations } from "../src/lib/lesson-runner.js";

const byId = new Map(ALL_WORDS.map((w) => [w.id, w]));
const firstTaught = new Map<string, number>();
ALL_LESSONS.forEach((l, i) => l.praesentation.wordIds.forEach((id) => firstTaught.has(id) || firstTaught.set(id, i)));

describe("D118 — عائلة الكلمة كما يراها المتعلم", () => {
  it("الصيغة الألمانية الكاملة لا المعرّف · العضو غير المعروف لا يظهر", () => {
    const known = new Map([
      ["tuerkei", byId.get("tuerkei")!],
      ["wie-gehts", byId.get("wie-gehts")!],
    ]);
    expect(familyForms({ wordFamily: ["tuerkei", "wie-gehts", "gibt-es-nicht"] }, known)).toEqual(["die Türkei", "Wie geht's?"]);
    expect(familyForms({ wordFamily: [] }, known)).toEqual([]);
  });

  it("أول درس: wie viel ← «Wie geht's?» (تُدرَّس اليوم) تظهر و viel لا · neu بلا alt · wohnen ← kommen تظهر و Wohnung لا", async () => {
    const l = ALL_LESSONS[0]!;
    const plan = planLessonStations(l, await runtimeWordsForLesson(l), ALL_GRAMMAR_RULES);
    const card = (id: string) => plan.learn.find((c) => c.wordId === id)!.explanation;
    expect(card("wie-viel")).toContain("عائلة: Wie geht's?.");
    expect(card("wie-viel")).not.toContain("wie-gehts");
    expect(card("neu")).not.toContain("عائلة");
    expect(card("wohnen")).toContain("عائلة: kommen.");
    expect(card("wohnen")).not.toMatch(/wohnung/i);
  });

  it("كل الدروس: العائلة المعروضة = صيغ ألمانية لكلمات دُرست حتى الدرس بالضبط — لا معرّف ولا كلمة من المستقبل ولا نقص", async () => {
    let shown = 0;
    for (const [i, id] of LESSON_ORDER.entries()) {
      const l = ALL_LESSONS[i]!;
      const known = new Map((await runtimeWordsForLesson(l)).map((w) => [w.id, w]));
      const plan = planLessonStations(l, [...known.values()], ALL_GRAMMAR_RULES);
      for (const card of plan.learn) {
        const w = byId.get(card.wordId)!;
        const allowed = w.wordFamily.filter((f) => (firstTaught.get(f) ?? Infinity) <= i).map((f) => fullForm(byId.get(f)!));
        expect(familyForms(w, known), `${id}/${w.id}`).toEqual(allowed);
        if (allowed.length) expect(card.explanation, `${id}/${w.id}`).toContain(`عائلة: ${allowed.join("، ")}.`);
        else expect(card.explanation, `${id}/${w.id}`).not.toContain("عائلة:");
        shown += allowed.length;
      }
    }
    expect(shown).toBeGreaterThan(30); // ليس فراغاً: العائلة تظهر حين تكون مدروسة
  });

  it("مختبر المفردات الشبكية بالقاعدة نفسها: «Wie geht's?» لا «wie-gehts» · neu بلا alt", () => {
    const html = renderToStaticMarkup(createElement(NetworkLab, { words: FIRST_WORDS }));
    const node = (id: string) => html.match(new RegExp(`<li data-node="${id}"[^>]*>(.*?)</li>`))![1]!;
    expect(node("wie-viel")).toContain("عائلة: Wie geht&#x27;s?");
    expect(node("wie-viel")).not.toContain("wie-gehts");
    expect(node("neu")).toContain("عائلة: —");
  });
});
