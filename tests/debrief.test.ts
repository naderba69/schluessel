// tests/debrief.test.ts — D278: تفريغ الوحدة + تقرير المعايرة (محرك)
import { describe, it, expect } from "vitest";
import type { CalibrationEntry, ErrorEntry, GateResult } from "../content/schemas/index.js";
import { passedBattleUnits, unitBattleStats, unitDebrief } from "../src/lib/lesson-path.js";
import { BLAME_WORDS, calibrationReport } from "../src/lib/warmth-engine.js";

const battle = (unitKey: string, score: number, attempts = 1): GateResult => ({
  gateId: unitKey, kind: "unit-battle", score, passed: score >= 0.75, attempts, weakSections: [], date: "2026-10-17",
});
const delayed = (unitKey: string, score: number): GateResult => ({
  gateId: unitKey, kind: "delayed-battle", score, passed: score >= 0.75, attempts: 1, weakSections: [], date: "2026-10-19",
});
const err = (id: string, source: string, resolved: boolean): ErrorEntry => ({
  id, kind: "slip", skill: "vocab",
  payload: { wrong: "x", correct: "y", explanation: "ز", source },
  remedialExercises: [], occurrences: 1, resolved, createdAt: "2026-10-17",
});
const cal = (lessonId: string | undefined, predicted: number, actual: number): CalibrationEntry =>
  lessonId === undefined ? { date: "2026-10-17", predicted, actual } : { date: "2026-10-17", predicted, actual, lessonId };

const U1 = ["a1-u1-d1", "a1-u1-d2", "a1-u1-d3", "a1-u1-d4", "a1-u1-d5", "a1-u1-d6"];

describe("D278: وحدات مجتازة وإحصاء المعارك", () => {
  it("passedBattleUnits: مميزة بترتيب أول اجتياز — الراسبة خارجاً", () => {
    const progress = { gateResults: [battle("A1-u2", 0.8), battle("A1-u1", 0.5), battle("A1-u1", 0.9), battle("A1-u2", 0.85)] };
    expect(passedBattleUnits(progress)).toEqual(["A1-u2", "A1-u1"]);
  });

  it("unitBattleStats: العدد + الأفضل + أفضل مؤجلة", () => {
    const progress = { gateResults: [battle("A1-u1", 0.7, 1), battle("A1-u1", 0.85, 2), delayed("A1-u1", 0.9)] };
    expect(unitBattleStats(progress, "A1-u1")).toEqual({ battles: 2, best: 0.85, delayedBest: 0.9 });
  });

  it("وحدة بلا معارك: أصفار وnull", () => {
    expect(unitBattleStats({ gateResults: [] }, "A1-u9")).toEqual({ battles: 0, best: null, delayedBest: null });
  });
});

describe("D278: تفريغ الوحدة", () => {
  it("يجمع المعركة والمؤجلة والذهبية والمعايرة — من الوحدة وحدها", () => {
    const progress = { gateResults: [battle("A1-u1", 0.8), delayed("A1-u1", 0.9), battle("A1-u2", 0.8)] };
    const errors = [
      err("e1", "a1-u1-d1/quiz", false),
      err("e2", "a1-u1-d6/deferred", true),
      err("e3", "a1-u2-d1/quiz", false), // وحدة أخرى — خارجاً
    ];
    const calibration = [
      cal("a1-u1-d1", 70, 80), // bias -10
      cal("a1-u1-d2", 90, 80), // bias +10
      cal("a1-u2-d1", 50, 50), // وحدة أخرى — خارجاً
      cal(undefined, 0, 100), // بلا درس (مؤجلة) — خارجاً
    ];
    expect(unitDebrief(progress, errors, calibration, "A1-u1", U1)).toEqual({
      unitKey: "A1-u1",
      battles: 1,
      best: 0.8,
      delayedBest: 0.9,
      goldenOpen: 1,
      goldenResolved: 1,
      calibrations: 2,
      bias: 0,
    });
  });

  it("وحدة فارغة: أصفار وnull", () => {
    expect(unitDebrief({ gateResults: [] }, [], [], "A1-u9", [])).toEqual({
      unitKey: "A1-u9", battles: 0, best: null, delayedBest: null,
      goldenOpen: 0, goldenResolved: 0, calibrations: 0, bias: null,
    });
  });
});

describe("D278: تقرير المعايرة", () => {
  it("بلا توقعات: دعوة لطيفة", () => {
    const r = calibrationReport([]);
    expect(r.count).toBe(0);
    expect(r.verdict).toContain("لا توقعات بعد");
  });

  it("المتوسطات صحيحة: (70+90)/2=80 مقابل (80+80)/2=80", () => {
    const r = calibrationReport([
      { predicted: 70, actual: 80 },
      { predicted: 90, actual: 80 },
    ]);
    expect(r).toMatchObject({ count: 2, meanPred: 80, meanAct: 80, bias: 0 });
    expect(r.verdict).toContain("دقيق");
  });

  it("الحدود: ±10 دقيق · +11 طموح · −11 أفضل", () => {
    expect(calibrationReport([{ predicted: 80, actual: 70 }]).verdict).toContain("دقيق");
    expect(calibrationReport([{ predicted: 70, actual: 80 }]).verdict).toContain("دقيق");
    expect(calibrationReport([{ predicted: 81, actual: 70 }]).verdict).toContain("الطموح وقود");
    expect(calibrationReport([{ predicted: 70, actual: 81 }]).verdict).toContain("أفضل مما تظن");
  });

  it("كل الأحكام بلا كلمة لوم", () => {
    const verdicts = [
      calibrationReport([]).verdict,
      calibrationReport([{ predicted: 80, actual: 80 }]).verdict,
      calibrationReport([{ predicted: 90, actual: 50 }]).verdict,
      calibrationReport([{ predicted: 50, actual: 90 }]).verdict,
    ];
    for (const v of verdicts) for (const w of BLAME_WORDS) expect(v).not.toContain(w);
  });
});
