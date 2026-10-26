// tests/unit-proof.ts — مساعد التثبيت العمودي (D254): يلعب أي وحدة درساً درساً عبر المحركات الحقيقية.
// لا يُلتقط كمجموعة اختبار (بلا .test.) — تستدعيه ملفات unitN-proof thin.
import { describe, it, expect } from "vitest";
import { loadSessionBundle, PATH, type SessionBundle } from "../src/lesson-packs.js";
import { planLessonStations } from "../src/lib/lesson-runner.js";
import { toTypedItem, checkAttempt, type TypedItem } from "../src/lib/practice-session.js";
import {
  startQuizAttempt, predictScore, answerQuizItem, judgeQuizItem, advanceQuiz,
  quizOutcome, needsJudgment, type QuizOutcome,
} from "../src/lib/quiz-session.js";
import { clipUrl } from "../src/lib/audio-assets.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { reconcileState, recordQuizAttempt, currentLessonId } from "../src/lib/lesson-path.js";

function correctAttempt(item: TypedItem): string | readonly string[] | Readonly<Record<string, string>> {
  switch (item.kind) {
    case "choice":
    case "input":
      return item.answer;
    case "order":
      return item.answer.split(" ");
    case "match":
      return Object.fromEntries(item.pairs.map((p) => [p.de, p.ar]));
    case "production":
      return "إنتاجي — الحكم لي";
  }
}

/** محاولة خاطئة حتماً — أو null حين لا يُتصوَّر الخطأ (إنتاج حر · ترتيب متناظر · أزواج متماثلة) */
function wrongAttempt(item: TypedItem): string | readonly string[] | Readonly<Record<string, string>> | null {
  switch (item.kind) {
    case "choice":
      return item.choices.find((c) => c !== item.answer) ?? null;
    case "input":
      return "خطأ مؤكد ؟؟";
    case "order": {
      const rev = [...item.tokens].reverse();
      return rev.join(" ") === item.answer.trim() ? null : rev;
    }
    case "match": {
      const ars = item.pairs.map((p) => p.ar);
      const shifted = Object.fromEntries(item.pairs.map((p, i) => [p.de, ars[(i + 1) % ars.length]!]));
      return item.pairs.every((p) => shifted[p.de] === p.ar) ? null : shifted;
    }
    case "production":
      return null;
  }
}

export async function proveUnit(opts: { unit: string; ids: readonly string[]; nextId: string | null; prefixIds: readonly string[] }) {
  const { unit, ids, nextId, prefixIds } = opts;
  const bundles: SessionBundle[] = [];
  for (const id of [...prefixIds, ...ids]) bundles.push(await loadSessionBundle(id));
  const byId = new Map(bundles.map((b) => [b.lesson.id, b]));
  const planOf = (id: string) => {
    const b = byId.get(id)!;
    return planLessonStations(b.lesson, b.words, b.rules, b.story, b.scripts);
  };
  const playQuizPerfect = (id: string, variant: number): QuizOutcome => {
    const lesson = byId.get(id)!.lesson;
    let a = predictScore(startQuizAttempt(lesson, variant), 100);
    for (const item of a.items) {
      a = answerQuizItem(a, item.a);
      if (needsJudgment(a)) a = judgeQuizItem(a, true);
      a = advanceQuiz(a);
    }
    return quizOutcome(a);
  };

  describe(`${unit} — التخطيط: المحطات الأربع حية لكل درس`, () => {
    for (const id of ids) {
      it(`${id}: استرجاع + تعلّم يغطي الكلمات + تدريب + إغلاق`, () => {
        const b = byId.get(id)!;
        const plan = planOf(id);
        expect(plan.recall.length).toBeGreaterThan(0);
        expect(plan.learn.length).toBe(b.lesson.praesentation.wordIds.length);
        expect(plan.learn.map((c) => c.wordId).sort()).toEqual([...b.lesson.praesentation.wordIds].sort());
        expect(plan.practice.stations.length).toBeGreaterThanOrEqual(3);
        expect(plan.practice.communicativeTask).toBeTruthy();
        expect(plan.rules.length, "كل قاعدة معلنة لها ملفها (لا دَين صامت)").toBe(
          b.lesson.praesentation.grammarArsenalIds.length,
        );
        expect(plan.close).toBeTruthy();
      });
    }
  });

  describe(`${unit} — التدريب: كل بند يُنمَّط ويُصحَّح في الاتجاهين`, () => {
    for (const id of ids) {
      it(`${id}: صحيح ⇒ صحيح · خاطئ ⇒ أعد المحاولة (لا بند ميت ولا قديم)`, () => {
        const b = byId.get(id)!;
        let n = 0;
        b.lesson.uebung.stations.forEach((st, si) => {
          st.items.forEach((raw, ii) => {
            const where = `${id} s${si}-i${ii} (${st.type})`;
            const item = toTypedItem(st.type, raw);
            expect(item, `${where}: يُنمَّط (لا مسار قديم)`).not.toBeNull();
            const verdict = checkAttempt(item!, correctAttempt(item!));
            expect(verdict.status, `${where}: الإجابة الصحيحة مقبولة`).toBe(item!.kind === "production" ? "self" : "correct");
            const wrong = wrongAttempt(item!);
            if (wrong !== null) {
              expect(checkAttempt(item!, wrong).status, `${where}: الإجابة الخاطئة مرفوضة`).toBe("retry");
            }
            n++;
          });
        });
        expect(n).toBeGreaterThanOrEqual(12);
      });
    }
  });

  describe(`${unit} — الاختبار: النسخ الثلاث تُجتاز بالكمال`, () => {
    for (const id of ids) {
      it(`${id}: 3 نسخ × علامة كاملة ⇒ نجاح بلا بنود ضعيفة`, () => {
        for (let v = 0; v < 3; v++) {
          const o = playQuizPerfect(id, v);
          expect(o.variantIndex).toBe(v);
          expect(o.passed).toBe(true);
          expect(o.score).toBe(1);
          expect(o.weakItems).toEqual([]);
        }
      });
    }
  });

  describe(`${unit} — المسار: إكمالها يفتح التالي`, () => {
    it(`${ids[0]} ← ${ids[ids.length - 1]} ثم ${nextId} — والترتيب مقفل`, () => {
      let state = reconcileState(createInitialState("برهان"), PATH);
      expect(currentLessonId(state.progress, PATH)).toBe(prefixIds[0] ?? ids[0]);
      for (const id of [...prefixIds, ...ids]) {
        state = recordQuizAttempt(state, playQuizPerfect(id, 0), PATH, "2026-10-21", []);
        expect(state.progress.completedLessons).toContain(id);
      }
      expect(state.progress.completedLessons).toHaveLength(prefixIds.length + ids.length);
      expect(currentLessonId(state.progress, PATH)).toBe(nextId);
    });
  });

  describe(`${unit} — الصوت: كل ما يُطلب سماعه له مقطعه`, () => {
    it("بنود التدريب + بطاقات الخطة — لا زر صوت صامت", () => {
      const trackIds = new Set<string>();
      for (const id of ids) {
        const b = byId.get(id)!;
        for (const st of b.lesson.uebung.stations) {
          for (const raw of st.items) {
            const item = toTypedItem(st.type, raw)!;
            if ((item.kind === "choice" || item.kind === "input") && item.audio) trackIds.add(item.audio.audioId);
          }
        }
        const plan = planOf(id);
        for (const c of [...plan.recall, ...plan.learn]) if (c.audioId) trackIds.add(c.audioId);
      }
      expect(trackIds.size).toBeGreaterThan(0);
      for (const trackId of trackIds) expect(clipUrl(trackId), trackId).toBeTruthy();
    });
  });
}
