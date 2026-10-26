import type { WeeklyGoalState } from "../lib/day-engine.js";

/**
 * D279: بطاقة الهدف الأسبوعي (ب-18) — تُعلَن مساء الاثنين وتُقاس في معركة السبت:
 * إعلان · تذكير · قياس · تحقق. النص = canDo الأول لاختبار السادس (من المحتوى نفسه).
 */
export function WeeklyGoalCard({ goal, state }: { goal: string; state: Exclude<WeeklyGoalState, "hidden"> }) {
  return (
    <section data-testid="weekly-goal" data-state={state}>
      {state === "announce" && (
        <p>هدف هذا الأسبوع 🎯 — {goal} <span>يُقاس في معركة السبت.</span></p>
      )}
      {state === "reminder" && (
        <p>هدف الأسبوع 🎯 — {goal} <span>كل يوم يقرّبك منه.</span></p>
      )}
      {state === "measure" && (
        <p>هدف الأسبوع يُقاس اليوم ⚔️ — {goal}</p>
      )}
      {state === "achieved" && (
        <p>هدف الأسبوع تحقق ✓ — {goal} 🎉</p>
      )}
    </section>
  );
}
