// backup.test.ts — S0.5 | test-dexie-roundtrip / test-backup-restore / test-backup-integrity
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { openDb, saveLearnerState, loadLearnerState, YusufDB } from "../src/stores/db.js";
import { exportSnapshot, verifySnapshot, checksumOf, canonicalJson } from "../src/stores/backup.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { LearnerState as LS, type LearnerState } from "../content/schemas/index.js";

let db: YusufDB;
let seq = 0;
const freshDb = () => openDb(`reise-test-${++seq}`);

beforeEach(() => {
  db = freshDb();
});

function enrichedState(): LearnerState {
  const s = createInitialState("يوسف", new Date("2026-10-09"));
  s.srsCards.push({
    cardId: "wohnung", due: "2026-10-10", stability: 12, difficulty: 5,
    elapsed_days: 1, scheduled_days: 1, reps: 2, lapses: 0, state: "Review",
    masteryLevel: "L2",
  });
  s.sessions.push({
    date: "2026-10-09", dose: "ideal-120", durationMinutes: 120,
    canDoTicks: [{ statement: "يحيي", done: true }],
    wordsNew: 12, wordsPlanned: 12, srsMinutes: 10, srsDueRemaining: 3,
    listeningMinutes: 10, shadowingMinutes: 5,
    readingMinutes: 0,
    reflection: { learned: "الأرقام", tomorrow: "الوقت" },
  });
  s.errors.push({
    id: "err-1", kind: "systematic", skill: "grammar",
    payload: { wrong: "Ich habe nicht ein Buch", correct: "Ich habe kein Buch", explanation: "kein/نicht", source: "a1-u5-d4" },
    srsCardId: "kein-buch", remedialExercises: ["ex-1"], occurrences: 1, resolved: false,
    createdAt: "2026-10-09",
  });
  s.profile.calibration.push({ date: "2026-10-09", predicted: 70, actual: 85 });
  return LS.parse(s);
}

describe("Dexie (test-dexie-roundtrip)", () => {
  it("حفظ ثم قراءة = تطابق تام", async () => {
    const state = enrichedState();
    await saveLearnerState(db, state);
    const loaded = await loadLearnerState(db);
    expect(loaded).not.toBeNull();
    expect(canonicalJson(loaded)).toBe(canonicalJson(state));
  });

  it("قاعدة فارغة تعيد null (لا وهم استعادة)", async () => {
    expect(await loadLearnerState(db)).toBeNull();
  });
});

describe("النسخ والاستعادة (test-backup-restore)", () => {
  it("snapshot → استعادة في قاعدة جديدة → الحالة مطابقة", async () => {
    const state = enrichedState();
    const snapshot = exportSnapshot(state);

    const db2 = freshDb();
    const verified = verifySnapshot(JSON.parse(JSON.stringify(snapshot)));
    expect(verified.ok).toBe(true);
    if (verified.ok) await saveLearnerState(db2, verified.state);
    const restored = await loadLearnerState(db2);
    expect(canonicalJson(restored)).toBe(canonicalJson(state));
  });
});

describe("فحص السلامة (test-backup-integrity)", () => {
  it("يلتقط أي تعديل على البيانات (checksum)", () => {
    const snapshot = exportSnapshot(enrichedState());
    const tampered = JSON.parse(JSON.stringify(snapshot));
    (tampered.learnerState as LearnerState).profile.name = "مهاكر";
    const result = verifySnapshot(tampered);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("checksum");
  });

  it("يرفض snapshot بلا حقول أساسية", () => {
    expect(verifySnapshot({}).ok).toBe(false);
    expect(verifySnapshot(null).ok).toBe(false);
    expect(verifySnapshot({ snapshotVersion: "1.0.0", exportedAt: "x", checksum: "y", learnerState: { bad: true } }).ok).toBe(false);
  });

  it("يرفض حالة تالفة رغم checksum صحيح (المخطط يرفضها)", () => {
    const state = enrichedState();
    const snapshot = exportSnapshot(state);
    const corrupted = JSON.parse(JSON.stringify(snapshot));
    // تلف يكسر المخطط ثم إعادة حساب checksum للتغلب على المقارنة — يجب أن يرفضها zod
    corrupted.learnerState.profile.streak.freezesUsedThisMonth = 9;
    corrupted.checksum = checksumOf(corrupted.learnerState);
    const result = verifySnapshot(corrupted);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("zod");
  });

  it("checksum مستقر مهما ترتبت الحقول (canonicalJson)", () => {
    const a = { x: 1, y: { b: 2, a: 1 } };
    const b = { y: { a: 1, b: 2 }, x: 1 };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
    expect(checksumOf(a)).toBe(checksumOf(b));
  });
});
