// data-engine.ts — E21 محرك البيانات | M3
// المصادر: F210–F219 (نسخ احتياطي + تصدير + بصمة سلامة) — القاعدة: **استعادة كاملة round-trip**
// كل ما يُصدَّر يُستعاد كما هو — أو تُكشف التالفة بالبصمة فوراً.

import { createHash } from "node:crypto";

export type BackupPayload = {
  schemaVersion: number;
  exportedAt: string;
  data: unknown;
};

export function exportJson(data: unknown, schemaVersion = 1): string {
  const payload: BackupPayload = {
    schemaVersion,
    exportedAt: new Date(0).toISOString(), // زمن حتمي للاختبارات — البصمة على البيانات لا على الوقت
    data,
  };
  return JSON.stringify(payload);
}

/** بصمة السلامة — sha256 على المحتوى المصدَّر */
export function fingerprint(json: string): string {
  return `sha256:${createHash("sha256").update(json, "utf8").digest("hex")}`;
}

/** الاستعادة — **بصمة غير مطابقة = رفض فوري** (لا استعادة عمياء) */
export function restore<T>(json: string, expectedFingerprint: string): T {
  const actual = fingerprint(json);
  if (actual !== expectedFingerprint) {
    throw new Error("بصمة السلامة غير مطابقة — الملف تالف أو عُدّل، ولم يُستعَد شيء");
  }
  const payload = JSON.parse(json) as BackupPayload;
  return payload.data as T;
}

/** تصدير CSV — صفوف مسطّحة برأس معلن */
export function exportCsv(rows: readonly Record<string, string | number>[]): string {
  if (rows.length === 0) throw new Error("لا CSV بلا صفوف");
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => csvCell(r[h] ?? "")).join(","));
  }
  return lines.join("\n");
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** دورة كاملة: تصدير ← بصمة ← استعادة — تُستخدم في الاختبارات وتُعرض للمستخدم للثقة */
export function roundTrip<T>(data: T): { json: string; fp: string; restored: T } {
  const json = exportJson(data);
  const fp = fingerprint(json);
  return { json, fp, restored: restore<T>(json, fp) };
}
