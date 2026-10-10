// src/lib/asr-gate.ts — بوابة النطق (D16 — القانون 11): قرار الاختبار المحلي ملزم ولا يُتجاوز
// نتيجة الاختبار 2026-10-09: قبول مرفوض زيفاً 0% لكن رفض مقبول زيفاً 44.4% → البديل مُفعَّل
import report from "../../docs/dos/d16-asr-report.json";

export interface AsrDecision {
  mode: "hybrid-gate" | "fallback-listening-ladder";
  hybrid: boolean;
  reason: string;
}

function parseDecision(d: { mode: string; hybrid: boolean; reason: string }): AsrDecision {
  if (d.mode !== "hybrid-gate" && d.mode !== "fallback-listening-ladder")
    throw new Error(`وضع ASR غير معروف: ${d.mode}`);
  return d as AsrDecision;
}

/** قرار D16 المُقفل من التقرير الفعلي — لا يُغيَّر يدوياً */
export const ASR_DECISION: AsrDecision = parseDecision(report.decision);
export const ASR_THRESHOLDS = report.thresholds;
export const ASR_AGGREGATES = report.aggregates;

/** هل بوابة ASR معتمدة؟ (لا إن لم تجتز العتبات الثلاث) */
export const ASR_GATE_ENABLED = ASR_DECISION.mode === "hybrid-gate";
/** البديل المُفعَّل: السلم السمعي التلقائي الكامل (D16 — المسار المصمم مسبقاً) */
export const LISTENING_LADDER_FALLBACK = !ASR_GATE_ENABLED;

const UMLAUT: Record<string, string> = { ä: "a", ö: "o", ü: "u", ß: "ss" };

export function normWord(s: string): string {
  let out = s.toLowerCase();
  for (const [k, v] of Object.entries(UMLAUT)) out = out.split(k).join(v);
  return [...out].filter((c) => /[a-z0-9]/.test(c)).join("");
}

export function wordsNorm(s: string): string[] {
  return s.split(/\s+/).map(normWord).filter(Boolean);
}

/** مطابقة صارمة: سلسلة كلمات الهدف داخل التفريغ (لا تساهل يبتلع الأزواج المتناهية) */
export function transcriptMatches(target: string, transcript: string): boolean {
  const t = wordsNorm(target);
  const w = wordsNorm(transcript);
  if (t.length === 0) return false;
  for (let i = 0; i + t.length <= w.length; i++) {
    if (t.every((tw, k) => w[i + k] === tw)) return true;
  }
  return false;
}

/** مطابقة متسامحة بفارق حرف واحد — للعرض على مولر فقط، لا تقبل البوابة بها */
export function transcriptMatchesLenient(target: string, transcript: string): boolean {
  const t = wordsNorm(target).join("");
  return wordsNorm(transcript).some((w) => w === t || editDistance1(w, t));
}

function editDistance1(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, diffs = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++diffs > 1) return false;
    if (a.length > b.length) i++;
    else if (a.length < b.length) j++;
    else { i++; j++; }
  }
  return diffs + (a.length - i) + (b.length - j) <= 1;
}

export type GateAction = "accept" | "review" | "reject";

/**
 * قرار البوابة لمحاولة نطق:
 * - وضع الهجنة: مطابقة صارمة = قبول | متسامحة فقط = مراجعة مولر | لا شيء = رفض ولوج للسلم السمعي.
 * - البديل (الحالة الحالية): ASR إرشادي فقط — النتيجة الحاسمة للسلم السمعي/مولر.
 */
export function pronunciationGate(target: string, transcript: string): GateAction {
  if (transcriptMatches(target, transcript)) return ASR_GATE_ENABLED ? "accept" : "review";
  if (ASR_GATE_ENABLED && transcriptMatchesLenient(target, transcript)) return "review";
  return "reject";
}
