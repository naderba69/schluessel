// tests/move-unit.test.ts — نقل وحدة دروس مع كل إشاراتها (D112: أسبوع الامتحان 13 → 17)
import { describe, it, expect } from "vitest";
import { planUnitMove } from "../tools/move-unit.js";

// تنسيق غير قياسي عمداً (مصفوفة في سطر واحد) — 326 ملف محتوى ليست JSON قياسياً: الأداة يجب ألا تعيد تنسيقها
const lesson = (id: string, unit: number, day: number) =>
  `{\n  "schemaVersion": "1.0.0",\n  "id": "${id}",\n  "level": "A1",\n  "unit": ${unit},\n  "day": ${day},\n  "kind": "integration",\n  "quiz": { "items": [ { "unit": ${unit}, "q": "x" } ] },\n  "praesentation": { "wordIds": ["hallo"] }\n}\n`;

function fixture(): Map<string, string> {
  return new Map([
    ["lessons/a1/a1-u12-d6.json", lesson("a1-u12-d6", 12, 6)],
    ["lessons/a1/a1-u13-d1.json", lesson("a1-u13-d1", 13, 1)],
    ["lessons/a1/a1-u13-d2.json", lesson("a1-u13-d2", 13, 2)],
    ["words/hallo.json", `{\n  "id": "hallo",\n  "note": "راجع a1-u13-d1 لاحقاً",\n  "usedInLessons": ["a1-u12-d6", "a1-u13-d1", "a1-u13-d2"]\n}\n`],
    ["plans/p.json", `{\n  "units": [ { "contentLessons": [ { "lessonId": "a1-u13-d1" } ], "integrationLessonId": "a1-u13-d2" } ]\n}\n`],
    ["lessons/a2/a2-u13-d1.json", lesson("a2-u13-d1", 13, 1).replace('"A1"', '"A2"')],
  ]);
}

describe("D112 — move-unit: نقل وحدة دروس بلا كسر إشارة ولا تنسيق", () => {
  it("ينقل الدروس (الملف والمعرّف وحقل unit الأعلى وحده) ويحدّث usedInLessons — والتنسيق محفوظ حرفياً", () => {
    const edits = planUnitMove(fixture(), { level: "a1", from: 13, to: 17 });
    const by = new Map(edits.map((e) => [e.path, e]));
    expect([...by.keys()].sort()).toEqual(["lessons/a1/a1-u13-d1.json", "lessons/a1/a1-u13-d2.json", "words/hallo.json"]);
    const d1 = by.get("lessons/a1/a1-u13-d1.json")!;
    expect(d1.newPath).toBe("lessons/a1/a1-u17-d1.json");
    expect(d1.after).toBe(lesson("a1-u17-d1", 17, 1).replace('"unit": 17, "q"', '"unit": 13, "q"')); // المتداخل لا يتغير
    const w = by.get("words/hallo.json")!;
    expect(w.newPath).toBe("words/hallo.json");
    expect(JSON.parse(w.after).usedInLessons).toEqual(["a1-u12-d6", "a1-u17-d1", "a1-u17-d2"]);
    expect(JSON.parse(w.after).note).toBe("راجع a1-u13-d1 لاحقاً"); // نصّ نثري ليس إشارة: لا يُمَس
    expect(w.after.split("\n")[3]).toBe('  "usedInLessons": ["a1-u12-d6", "a1-u17-d1", "a1-u17-d2"]'); // السطر نفسه بتنسيقه
  });

  it("خطط التوزيع (plans/) لا تُمَس: تسمّي خانات دروس مستقبلية — خطة D112 تخطط a1-u13-* جديدة حيث كان الامتحان", () => {
    const edits = planUnitMove(fixture(), { level: "a1", from: 13, to: 17 });
    expect(edits.some((e) => e.path.startsWith("plans/"))).toBe(false);
  });

  it("المستوى الآخر لا يُمَس (a2-u13-d1 يبقى)", () => {
    const edits = planUnitMove(fixture(), { level: "a1", from: 13, to: 17 });
    expect(edits.some((e) => e.path.includes("a2-"))).toBe(false);
  });

  it("يرفض: وحدة هدف مشغولة · وحدة مصدر فارغة · مسار يخالف الاصطلاح · مواصفة غير صالحة", () => {
    const busy = fixture();
    busy.set("lessons/a1/a1-u17-d1.json", lesson("a1-u17-d1", 17, 1));
    expect(() => planUnitMove(busy, { level: "a1", from: 13, to: 17 })).toThrow(/مشغولة/);
    expect(() => planUnitMove(fixture(), { level: "a1", from: 9, to: 17 })).toThrow(/لا دروس/);
    const odd = fixture();
    odd.set("lessons/a1/extra.json", lesson("a1-u13-d3", 13, 3));
    expect(() => planUnitMove(odd, { level: "a1", from: 13, to: 17 })).toThrow(/اصطلاح/);
    expect(() => planUnitMove(fixture(), { level: "a1", from: 13, to: 13 })).toThrow(/غير صالحة/);
  });

  it("البرهان يوقف أي استبدال يغيّر أكثر من المعرّفات (معرّف استُعمل مفتاحاً لا قيمة)", () => {
    const f = fixture();
    f.set("words/keyed.json", `{\n  "a1-u13-d1": true\n}\n`);
    expect(() => planUnitMove(f, { level: "a1", from: 13, to: 17 })).toThrow(/أكثر من المعرّفات/);
  });
});
