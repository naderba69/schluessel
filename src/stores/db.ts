// src/stores/db.ts — تخزين المتعلم (Dexie/IndexedDB) | S0.5 — مطابق لـlearner-state.ts (قانون 32)
import Dexie, { type Table } from "dexie";
import type {
  LearnerProfile, LearnerProgress, LearnerState, SrsCardState,
  SessionLog, ErrorEntry, TelemetryCounter, BackupMeta,
} from "../../content/schemas/index.js";

export type Row<T> = T & { key: string };
export const SINGLETON = "singleton";

export class YusufDB extends Dexie {
  profile!: Table<Row<LearnerProfile>, string>;
  progress!: Table<Row<LearnerProgress>, string>;
  srsCards!: Table<SrsCardState, string>; // مفتاح cardId
  sessions!: Table<SessionLog, string>; // مفتاح date (جلسة/يوم)
  errors!: Table<ErrorEntry, string>; // مفتاح id
  telemetry!: Table<TelemetryCounter, string>; // مفتاح skill
  backupMeta!: Table<Row<BackupMeta>, string>;

  constructor(name = "reise-yusuf-test") {
    super(name);
    this.version(1).stores({
      profile: "key",
      progress: "key",
      srsCards: "cardId",
      sessions: "date",
      errors: "id",
      telemetry: "skill",
      backupMeta: "key",
    });
  }
}

export function openDb(name?: string): YusufDB {
  return new YusufDB(name);
}

/** حفظ حالة كاملة (يُفترض أنها نجحت في LearnerState.parse قبل النداء) */
export async function saveLearnerState(db: YusufDB, state: LearnerState): Promise<void> {
  await db.transaction("rw", db.tables, async () => {
    await db.profile.put({ ...state.profile, key: SINGLETON });
    await db.progress.put({ ...state.progress, key: SINGLETON });
    await db.srsCards.clear();
    await db.srsCards.bulkPut(state.srsCards);
    await db.sessions.clear();
    await db.sessions.bulkPut(state.sessions);
    await db.errors.clear();
    await db.errors.bulkPut(state.errors);
    await db.telemetry.clear();
    await db.telemetry.bulkPut(state.telemetry);
    await db.backupMeta.put({ ...state.backup, key: SINGLETON });
  });
}

/** قراءة الحالة كاملة (فحص السلامة عبر zod — رفض أي صف تالف) */
export async function loadLearnerState(db: YusufDB): Promise<LearnerState | null> {
  const profile = await db.profile.get(SINGLETON);
  if (!profile) return null;
  const progress = await db.progress.get(SINGLETON);
  const backup = await db.backupMeta.get(SINGLETON);
  const { key: _p, ...profileData } = profile;
  const { key: _pr, ...progressData } = progress!;
  const { key: _b, ...backupData } = backup ?? { key: SINGLETON };
  const raw = {
    schemaVersion: profileData.schemaVersion,
    profile: profileData,
    progress: progressData,
    srsCards: await db.srsCards.toArray(),
    sessions: await db.sessions.toArray(),
    errors: await db.errors.toArray(),
    telemetry: await db.telemetry.toArray(),
    backup: backupData,
  };
  // parse يرمي إذا تالف أي صف (اختبار النزاهة)
  const { LearnerState: LS } = await import("../../content/schemas/index.js");
  return LS.parse(raw);
}
