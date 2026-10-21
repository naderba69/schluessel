// src/lib/state-factory.ts — مصنع الحالة الأولية (أول تشغيل — §16: بلا تموضع)
import type { LearnerState, Level } from "../../content/schemas/index.js";
import { SCHEMA_VERSION } from "../../content/schemas/index.js";

export function createInitialState(name: string, today = new Date()): LearnerState {
  const iso = today.toISOString().slice(0, 10);
  return {
    schemaVersion: SCHEMA_VERSION,
    profile: {
      schemaVersion: SCHEMA_VERSION,
      name,
      createdAt: iso,
      level: "A1" as Level,
      unit0Shown: [],
      journeyName: "",
      coachWindows: ["midday", "afternoon", "evening"],
      streak: { current: 0, freezesUsedThisMonth: 0 },
      calibration: [],
    },
    progress: {
      schemaVersion: SCHEMA_VERSION,
      completedLessons: [],
      availableLessons: ["a1-u1-d1"], // أول درس متاح فوراً (§16)
      lockedLessons: [],
      gateResults: [],
      currentUnit: { level: "A1" as Level, unit: 1 },
      levelExams: {},
    },
    srsCards: [],
    sessions: [],
    errors: [],
    telemetry: [],
    backup: {},
  };
}
