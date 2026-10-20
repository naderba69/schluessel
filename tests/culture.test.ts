// culture.test.ts — E16: لا حقيقة بلا مصدر + «ألمانيا في 60 ثانية» + أغنية ملكية عامة فقط (§4)
import { describe, it, expect } from "vitest";
import {
  CULTURE_FACTS,
  registerFact,
  sixtySeconds,
  songOfTheWeek,
  holidayFacts,
  factsNeedingWebVerify,
  type CultureFact,
} from "../src/lib/culture.js";

describe("E16 — كل حقيقة ثقافية بمصدر (لا نشر بلا مراجعة)", () => {
  it("كل الحقائق الأربع مسجَّلة بمصادرها — والنسخ ≤ 60 ثانية", () => {
    for (const f of CULTURE_FACTS) {
      expect(() => registerFact(f)).not.toThrow();
      expect(f.sourceAr.trim()).not.toBe("");
      expect(f.scriptSeconds).toBeLessThanOrEqual(60);
    }
    expect(CULTURE_FACTS.length).toBe(4);
  });

  it("التسجيل مغلق: حقيقة بلا مصدر = مرفوضة — ونسخة >60 ثانية = مرفوضة", () => {
    const bare: CultureFact = { ...CULTURE_FACTS[0]!, sourceAr: " " };
    expect(() => registerFact(bare)).toThrow(/مصدر/);
    expect(() => registerFact({ ...CULTURE_FACTS[0]!, scriptSeconds: 61 })).toThrow(/60/);
  });

  it("«ألمانيا في 60 ثانية» تُعيد النص والمصدر معاً", () => {
    const { fact, scriptAr } = sixtySeconds("tag-der-einheit");
    expect(fact.titleDe).toBe("Tag der Deutschen Einheit");
    expect(scriptAr).toContain("الثالث من أكتوبر");
    expect(() => sixtySeconds("xx")).toThrow();
  });
});

describe("E16 — أغنية الأسبوع والأعياد وحدود الصدق", () => {
  it("الأغنية ملكية عامة فقط (§4 — بلا حقوق مانعة)", () => {
    const s = songOfTheWeek();
    expect(s.license).toBe("public-domain");
    expect(s.reasonAr).toContain("عامة");
  });

  it("تقويم الأعياد: يوم الوحدة + عيد الميلاد — والمواعيد السنوية تُصرَّح بحاجتها لتحقق ويب", () => {
    const holidays = holidayFacts();
    expect(holidays.map((f) => f.id).sort()).toEqual(["tag-der-einheit", "weihnachten"]);
    const web = factsNeedingWebVerify();
    expect(web.map((f) => f.id)).toEqual(["oktoberfest"]); // تواريخ الويزن تختلف كل سنة — لا نُطلقها كثابتة
  });
});
