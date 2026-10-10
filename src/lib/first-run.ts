// src/lib/first-run.ts — أول تشغيل (§16): مولر → اسم → الوحدة صفر (4) → أول درس | بلا تموضع أبداً (D24)
import type { LearnerState } from "../../content/schemas/index.js";
import { createInitialState } from "./state-factory.js";
import { dayOneCards, loadUnit0Deck } from "./unit0.js";

export const FIRST_RUN_STEPS = ["welcome", "ask-name", "unit0-day1", "first-lesson"] as const;
export type FirstRunStep = (typeof FIRST_RUN_STEPS)[number];

/** آلة الخطوات — القائمة كاملة لا تحوي أي اختبار تموضع (اختبار صريح في test-first-run-flow) */
export function firstRunNext(step: FirstRunStep): FirstRunStep | null {
  const i = FIRST_RUN_STEPS.indexOf(step);
  return i === -1 || i === FIRST_RUN_STEPS.length - 1 ? null : FIRST_RUN_STEPS[i + 1];
}

/** إتمام أول تشغيل: اسم المتعلم + إظهار بطاقات اليوم الأول الأربع */
export function completeFirstRun(name: string): LearnerState {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("اسم المتعلم مطلوب قبل البدء (§16)");
  const state = createInitialState(trimmed);
  const day1 = dayOneCards(loadUnit0Deck());
  state.profile.unit0Shown = day1.map((c) => c.id);
  return state;
}
