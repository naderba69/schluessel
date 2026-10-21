// coach-engine.test.ts — E02 محرك المدرب: الأفكار الـ12 + الحراس (تثبيت فقط/≤3د/≤20د/الأحد راحة/بلا لوم)
import { describe, it, expect } from "vitest";
import {
  COACH_TASK_KINDS, COACH_TASK_MAX_SEC, COACH_TASK_MIN_SEC, COACH_DAILY_CAP_MIN,
  DEFAULT_WINDOWS, WINDOW_LABELS_AR, dayIndexOfYear, pickCoachDrill, isValidTask, isRestDay, tasksForDay, applyDailyCap, type CoachTask,
} from "../src/lib/coach-engine.js";
import type { ErrorEntry } from "../content/schemas/index.js";

const task = (over: Partial<CoachTask> = {}): CoachTask => ({
  id: "t1", kind: "train-me", durationSec: 90, refsKnownContent: true, ...over,
});

describe("محرك المدرب E02 — الأفكار الـ12 كلها أنواع مهام", () => {
  it("12 نوع مهمة = الأفكار الـ12 (F001–F012)", () => {
    expect(COACH_TASK_KINDS.length).toBe(12);
  });

  it("حارس المدة: 30–180 ثانية فقط", () => {
    expect(isValidTask(task({ durationSec: 29 })).ok).toBe(false);
    expect(isValidTask(task({ durationSec: 181 })).ok).toBe(false);
    expect(isValidTask(task({ durationSec: 30 })).ok).toBe(true);
    expect(isValidTask(task({ durationSec: 180 })).ok).toBe(true);
    expect(COACH_TASK_MIN_SEC).toBe(30);
    expect(COACH_TASK_MAX_SEC).toBe(180);
  });

  it("حارس المحتوى: لا جديد خارج الحصة أبداً", () => {
    const bad = isValidTask(task({ refsKnownContent: false }));
    expect(bad.ok).toBe(false);
    expect(bad.reason).toContain("تثبيت");
  });
});

describe("حراس الجدولة", () => {
  it("الأحد = وضع الراحة: صفر مهام", () => {
    const sunday = new Date("2026-10-11T10:00:00"); // أحد
    expect(sunday.getDay()).toBe(0);
    expect(isRestDay(sunday)).toBe(true);
    expect(tasksForDay(sunday, DEFAULT_WINDOWS, [task()])).toEqual([]);
    const monday = new Date("2026-10-12T10:00:00");
    expect(isRestDay(monday)).toBe(false);
    expect(tasksForDay(monday, DEFAULT_WINDOWS, [task()]).length).toBe(1);
  });

  it("سقف اليوم 20 دقيقة — الزائد يُحذف ولا يُفرض", () => {
    const many = Array.from({ length: 20 }, (_, i) => task({ id: `t${i}`, durationSec: 180 }));
    const capped = applyDailyCap(many);
    const totalSec = capped.reduce((s, t) => s + t.durationSec, 0);
    expect(totalSec).toBeLessThanOrEqual(COACH_DAILY_CAP_MIN * 60);
    expect(capped.length).toBeLessThan(many.length);
  });
});

describe("حضور المدرب اليومي (N-148 · D248)", () => {
  const err = (id: string, createdAt: string, resolved = false): ErrorEntry => ({
    id, kind: "slip", skill: "vocab",
    payload: { wrong: "x", correct: "y", explanation: "ز", source: "a1-u1-d1" },
    remedialExercises: [], occurrences: 1, resolved, createdAt,
  });

  it("درّبني = أحدث خطأ غير محلول (المحلول يُتخطى)", () => {
    expect(pickCoachDrill([])).toBeNull();
    expect(pickCoachDrill([err("e-1", "2026-10-20", true)])).toBeNull();
    const drill = pickCoachDrill([err("e-old", "2026-10-18"), err("e-new", "2026-10-20")])!;
    expect(drill.id).toBe("e-new");
  });

  it("رقم اليوم في السنة: 1 يناير = 0 ويتقدم يوماً بيوم", () => {
    expect(dayIndexOfYear(new Date(2026, 0, 1))).toBe(0);
    expect(dayIndexOfYear(new Date(2026, 0, 2))).toBe(1);
    expect(dayIndexOfYear(new Date(2026, 11, 31))).toBe(364);
  });

  it("النوافذ الثلاث لها أسماء عربية", () => {
    expect(DEFAULT_WINDOWS.map((w) => WINDOW_LABELS_AR[w]).join(" · ")).toBe("ظهيرة · عصر · مساء");
  });
});
