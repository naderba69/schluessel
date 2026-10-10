// audio-engine.test.ts — E05 محرك الصوت التفاعلي: سرعات + سلم سمعي + shadowing + حارس D16
import { describe, it, expect } from "vitest";
import {
  PLAYBACK_SPEEDS,
  isAllowedSpeed,
  LISTENING_LADDER,
  ladderNext,
  SHADOWING_CYCLE,
  shadowingNext,
  AUTO_JUDGE_ENABLED,
  validateFeedbackMode,
  RECORDING_DISCLAIMER_AR,
  RECORDING_LOCAL_ONLY,
  planPlayback,
} from "../src/lib/audio-engine.js";

describe("E05 — التشغيل والسرعة (F044)", () => {
  it("ثلاث سرعات فقط: 0.75× / 1× / 1.25×", () => {
    expect([...PLAYBACK_SPEEDS]).toEqual([0.75, 1, 1.25]);
    expect(isAllowedSpeed(1)).toBe(true);
    expect(isAllowedSpeed(1.5)).toBe(false);
    expect(isAllowedSpeed(2)).toBe(false);
    expect(isAllowedSpeed(0.5)).toBe(false);
  });

  it("خطة التشغيل ترفض أي سرعة أخرى (F044)", () => {
    const ok = planPlayback("clip-1", 0.75, 3);
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.plan.speed).toBe(0.75);
      expect(ok.plan.replays).toBe(3); // الإعادة بلا عقوبة ولا سقف (D23)
    }
    const bad = planPlayback("clip-1", 3);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toContain("F044");
  });
});

describe("E05 — السلم السمعي (F041 — البديل المُفعَّل D16)", () => {
  it("أربع درجات تصاعدية: بطيء ← عادي ← ترديد ← مقارنة ذاتية", () => {
    expect([...LISTENING_LADDER]).toEqual([
      "listen-slow",
      "listen-normal",
      "repeat-aloud",
      "self-compare",
    ]);
    expect(ladderNext("listen-slow")).toBe("listen-normal");
    expect(ladderNext("self-compare")).toBeNull();
  });

  it("دورة shadowing (F005): تردّد ← تسجّل ← تقارن بنفسك", () => {
    expect([...SHADOWING_CYCLE]).toEqual(["listen", "record", "compare"]);
    expect(shadowingNext("listen")).toBe("record");
    expect(shadowingNext("compare")).toBeNull();
  });
});

describe("E05 — حارس D16: لا حكم آلي على النطق أبداً", () => {
  it("الحكم الآلي معطّل بقرار ملزم (D16: FA 0% / FR 44%)", () => {
    expect(AUTO_JUDGE_ENABLED).toBe(false);
  });

  it("«تقييم آلي/درجة» مرفوض صراحة — والبديلان مقبولان", () => {
    for (const forbidden of ["auto-score", "asr-judge", "grade", "exam"]) {
      const r = validateFeedbackMode(forbidden);
      expect(r.ok).toBe(false);
      expect(r.reason).toContain("D16");
    }
    expect(validateFeedbackMode("self").ok).toBe(true);
    expect(validateFeedbackMode("muller").ok).toBe(true);
    expect(validateFeedbackMode("خام").ok).toBe(false);
  });

  it("التحذير الصريح: التسجيل «لأذنك أنت» يرافق كل تسجيل", () => {
    expect(RECORDING_DISCLAIMER_AR).toContain("أذنك أنت");
    expect(RECORDING_DISCLAIMER_AR).toContain("لا نقيّم");
    expect(RECORDING_LOCAL_ONLY).toBe(true); // التسجيلات لا تغادر الجهاز
  });
});
