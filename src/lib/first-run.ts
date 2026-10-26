// src/lib/first-run.ts — أول تشغيل (§16 + §2.11): مولر → اسم → رحلة → نوافذ → الوحدة صفر (4) → أول درس | بلا تموضع أبداً (D24)
import type { CoachWindow, LearnerState } from "../../content/schemas/index.js";
import { COACH_WINDOWS, DEFAULT_WINDOWS } from "./coach-engine.js";
import { createInitialState } from "./state-factory.js";
import { dayOneCards, loadUnit0Deck } from "./unit0.js";

export const FIRST_RUN_STEPS = ["welcome", "ask-name", "journey-name", "coach-windows", "unit0-day1", "first-lesson"] as const;
export type FirstRunStep = (typeof FIRST_RUN_STEPS)[number];

/** آلة الخطوات — القائمة كاملة لا تحوي أي اختبار تموضع (اختبار صريح في test-first-run-flow) */
export function firstRunNext(step: FirstRunStep): FirstRunStep | null {
  const i = FIRST_RUN_STEPS.indexOf(step);
  return i === -1 || i === FIRST_RUN_STEPS.length - 1 ? null : FIRST_RUN_STEPS[i + 1];
}

/**
 * N-151 (D251): تطبيع النوافذ المختارة — ترتيب قانوني بلا تكرار؛ الأقل من نافذتين أو المؤجَّل (null) ⇒ الافتراضي (§2.11).
 */
export function normalizeWindows(pick: readonly CoachWindow[] | null | undefined): CoachWindow[] {
  if (!pick) return [...DEFAULT_WINDOWS];
  const order = new Map<CoachWindow, number>(COACH_WINDOWS.map((w, i) => [w, i]));
  const clean = [...new Set(pick)].filter((w) => order.has(w)).sort((a, b) => order.get(a)! - order.get(b)!);
  return clean.length >= 2 ? clean : [...DEFAULT_WINDOWS];
}

/** إتمام أول تشغيل: اسم المتعلم + اسم الرحلة (اختياري) + النوافذ + إظهار بطاقات اليوم الأول الأربع */
export function completeFirstRun(name: string, opts: { journeyName?: string; coachWindows?: readonly CoachWindow[] | null } = {}): LearnerState {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("اسم المتعلم مطلوب قبل البدء (§16)");
  const state = createInitialState(trimmed);
  state.profile.journeyName = opts.journeyName?.trim() ?? "";
  state.profile.coachWindows = normalizeWindows(opts.coachWindows);
  const day1 = dayOneCards(loadUnit0Deck());
  state.profile.unit0Shown = day1.map((c) => c.id);
  return state;
}
