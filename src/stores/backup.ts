// src/stores/backup.ts — النسخ الاحتياطي والاستعادة بضغطة (S0.5 — القانونان 14 و26)
import type { LearnerState } from "../../content/schemas/index.js";
import { LearnerState as LearnerStateSchema, SCHEMA_VERSION } from "../../content/schemas/index.js";

export interface Snapshot {
  snapshotVersion: string; // إصدار صيغة الـsnapshot نفسها
  exportedAt: string; // ISO
  checksum: string; // FNV-1a 64 على JSON كنوني — كشف التلف لا الحماية الأمنية (مدوَّن في D28 إن لزم)
  learnerState: unknown;
}

/** تسلسل كنوني (المفاتيح مرتَّبة) — checksum ثابت لنفس البيانات مهما ترتيب الحقول */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`).join(",")}}`;
}

/** FNV-1a 64-bit (hex) — checksum خفيف موحّد المتصفح/الخادم */
export function fnv1a64(input: string): string {
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < input.length; i++) {
    h ^= BigInt(input.charCodeAt(i));
    h = (h * prime) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, "0");
}

export function checksumOf(state: unknown): string {
  return fnv1a64(canonicalJson(state));
}

/** تصدير snapshot (قبل التصدير: التحقق من صحة الحالة نفسها) */
export function exportSnapshot(state: LearnerState): Snapshot {
  const parsed = LearnerStateSchema.parse(state); // يرفض الحالة التالفة قبل التصدير
  return {
    snapshotVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    checksum: checksumOf(parsed),
    learnerState: parsed,
  };
}

export type VerifyResult =
  | { ok: true; snapshot: Snapshot; state: LearnerState }
  | { ok: false; reason: string };

/** فحص سلامة الـsnapshot (قانون 26): صيغة + مخطط + checksum */
export function verifySnapshot(raw: unknown): VerifyResult {
  if (typeof raw !== "object" || raw === null) return { ok: false, reason: "snapshot ليس كائناً" };
  const s = raw as Partial<Snapshot>;
  if (typeof s.snapshotVersion !== "string" || typeof s.exportedAt !== "string" || typeof s.checksum !== "string")
    return { ok: false, reason: "حقول snapshot أساسية مفقودة" };
  if (!s.learnerState) return { ok: false, reason: "learnerState مفقود" };
  let state: LearnerState;
  try {
    state = LearnerStateSchema.parse(s.learnerState);
  } catch (err) {
    return { ok: false, reason: `فشل مخطط zod: ${(err as Error).message.split("\n")[0]}` };
  }
  const actual = checksumOf(state);
  if (actual !== s.checksum) return { ok: false, reason: `checksum غير مطابق (متوقع ${s.checksum}، وُجد ${actual})` };
  return { ok: true, snapshot: { ...s as Snapshot, learnerState: state }, state };
}

/** الاستعادة بضغطة واحدة: فحص سلامة → إدخال → إرجاع الحالة */
export async function restoreFromSnapshot(
  db: { profile: unknown },
  raw: unknown,
  save: (state: LearnerState) => Promise<void>,
): Promise<VerifyResult> {
  const verified = verifySnapshot(raw);
  if (!verified.ok) return verified;
  await save(verified.state);
  return verified;
}
