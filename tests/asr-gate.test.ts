// tests/asr-gate.test.ts — test-asr-gate: قرار D16 ملزم + منطق البوابة (القانون 11)
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ASR_DECISION, ASR_GATE_ENABLED, ASR_THRESHOLDS, ASR_AGGREGATES, LISTENING_LADDER_FALLBACK,
  transcriptMatches, transcriptMatchesLenient, pronunciationGate,
} from "../src/lib/asr-gate.js";

const report = JSON.parse(readFileSync(join(process.cwd(), "docs/dos/d16-asr-report.json"), "utf8"));

describe("بوابة النطق D16 (test-asr-gate)", () => {
  it("القرار يُعاد حسابه باستقلالية من المحاولات الفعلية — لا يد تلاعب", () => {
    const wrong = report.trials.filter((t: { expectedAccept: boolean }) => !t.expectedAccept);
    const correct = report.trials.filter((t: { expectedAccept: boolean }) => t.expectedAccept);
    const fa = wrong.filter((t: { accepted: boolean }) => t.accepted).length / wrong.length;
    const fr = correct.filter((t: { accepted: boolean }) => !t.accepted).length / correct.length;
    const lat = report.trials.reduce((s: number, t: { latencyMs: number }) => s + t.latencyMs, 0) / report.trials.length;
    expect(Math.abs(fa - ASR_AGGREGATES.falseAcceptRate)).toBeLessThan(1e-3);
    expect(Math.abs(fr - ASR_AGGREGATES.falseRejectRate)).toBeLessThan(1e-3);
    const passed = fa <= ASR_THRESHOLDS.falseAcceptMax && fr <= ASR_THRESHOLDS.falseRejectMax && lat <= ASR_THRESHOLDS.meanLatencyMsMax;
    expect(passed).toBe(ASR_DECISION.hybrid);
    expect(ASR_DECISION.mode).toBe(passed ? "hybrid-gate" : "fallback-listening-ladder");
  });

  it("النتيجة الحالية كما سُجِّلت فعلياً: رفض مقبول زيفاً فوق العتبة → البديل مُفعَّل", () => {
    expect(ASR_AGGREGATES.falseAcceptRate).toBeLessThanOrEqual(0.02); // لا يقبل الكلمة الشقيقة أبداً
    expect(ASR_GATE_ENABLED).toBe(false);
    expect(LISTENING_LADDER_FALLBACK).toBe(true);
    expect(ASR_DECISION.reason.length).toBeGreaterThan(10);
  });

  it("المطابقة الصارمة لا تبتلع الأزواج المتناهية", () => {
    expect(transcriptMatches("Kirche", "kirsche")).toBe(false); // زوج متناهٍ — لا تساهل
    expect(transcriptMatches("Kirche", "die kirche dort")).toBe(true);
    expect(transcriptMatches("Guten Tag", "guten tag")).toBe(true); // هدف متعدد الكلمات
    expect(transcriptMatches("Tür", "t")).toBe(false);
    expect(transcriptMatches("Wohnung", "wohnung")).toBe(true);
  });

  it("المطابقة المتسامحة للمراجعة فقط — لا تحسم قبولاً", () => {
    expect(transcriptMatchesLenient("Kirche", "kirsche")).toBe(true);
    expect(transcriptMatchesLenient("Bett", "weit")).toBe(false);
  });

  it("سلوك البوابة في وضع البديل: ASR إرشادي فقط (قبول → مراجعة، لا قبول آلي)", () => {
    expect(pronunciationGate("Wohnung", "wohnung")).toBe("review");
    expect(pronunciationGate("Wohnung", "total anders")).toBe("reject");
    expect(pronunciationGate("Kirche", "kirsche")).toBe("reject");
  });
});
