// tests/dialogue-alphabet.test.tsx — N-010: الحوار الكامل قبل بنود الاستماع · N-008: جدول الأبجدية (D231)
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ALL_LESSONS, ALL_SCRIPTS, runtimeWordsForLesson } from "../src/lesson-packs.js";
import { planLessonStations } from "../src/lib/lesson-runner.js";
import { DialogueView, PracticeStation } from "../src/components/LessonContent.js";
import { AlphabetLab, SkillsLab } from "../src/components/SkillsLab.js";

const d3 = ALL_LESSONS.find((l) => l.id === "a1-u1-d3")!;
const anm = ALL_SCRIPTS.find((s) => s.id === "a1-u1-d3-anmeldung")!;

describe("N-010 (D231) — الحوار الكامل قبل بنود الاستماع", () => {
  it("المخطط يربط محطة الاستماع بحوارها (ومحطة مقاطع الكلمات وحدها بلا حوار)", () => {
    const plan = planLessonStations(d3, runtimeWordsForLesson(d3), [], [], ALL_SCRIPTS);
    expect(plan.practice.dialogues.map((d) => d.station)).toEqual([1]);
    expect(plan.practice.dialogues[0].script.id).toBe("a1-u1-d3-anmeldung");
    const d1 = ALL_LESSONS.find((l) => l.id === "a1-u1-d1")!;
    expect(planLessonStations(d1, runtimeWordsForLesson(d1), [], [], ALL_SCRIPTS).practice.dialogues).toEqual([]);
  });
  it("DialogueView: كل سطر بنصه واسم قائله وزر صوته المسجل", () => {
    const html = renderToStaticMarkup(DialogueView({ script: anm }));
    expect(html).toContain("Anmeldung, guten Tag!");
    expect(html).toContain("السيدة بيرغ");
    expect(html).toContain('data-audio-id="anm-1"');
    expect(html.match(/data-testid="play-audio"/g)).toHaveLength(anm.lines.length);
  });
  it("PracticeStation: الحوار قبل البند الأول من محطة الاستماع — ويختفي في البند الثاني", () => {
    const plan = planLessonStations(d3, runtimeWordsForLesson(d3), [], [], ALL_SCRIPTS);
    const first = renderToStaticMarkup(
      createElement(PracticeStation, { data: plan.practice, initial: { station: 1, item: 0 } }),
    );
    expect(first).toContain('data-testid="station-dialogue"');
    const second = renderToStaticMarkup(
      createElement(PracticeStation, { data: plan.practice, initial: { station: 1, item: 1 } }),
    );
    expect(second).not.toContain('data-testid="station-dialogue"');
  });
});

describe("N-008 (D231) — جدول الأبجدية في مختبر المهارات", () => {
  it("تبويب الأبجدية موجود وجدوله 30 حرفاً + 3 تهجيات بزر صوت لكل سطر", () => {
    const tabs = renderToStaticMarkup(createElement(SkillsLab, {}));
    expect(tabs).toContain('data-testid="tab-alphabet"');
    const html = renderToStaticMarkup(AlphabetLab());
    const letters = html.split('data-testid="alphabet-letters"')[1].split("</ol>")[0];
    expect(letters.match(/<li/g)).toHaveLength(30);
    expect(letters).toContain(">Ä<");
    expect(letters).toContain(">ß<");
    const spells = html.split('data-testid="alphabet-spells"')[1].split("</ul>")[0];
    expect(spells.match(/<li/g)).toHaveLength(3);
    expect(spells).toContain("M, Ü, L, L, E, R.");
    expect(html.match(/data-testid="play-audio"/g)).toHaveLength(33);
  });
});
