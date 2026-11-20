// tests/shadowing.test.ts — D280: اختيار حوار الظل (أحدث متقن له سكربت مباشر)
// D566: لكل درس حوار مباشر الآن — فالاختبارات تعكس العالم الجديد (لا درس بلا سكربت).
import { describe, it, expect } from "vitest";
import { hasDirectScript, shadowingLessonId } from "../src/lesson-packs.js";

describe("D280: حوار الظل", () => {
  it("hasDirectScript يطابق الملفات الحقيقية", () => {
    expect(hasDirectScript("a1-u1-d3")).toBe(true); // a1-u1-d3-anmeldung.json
    expect(hasDirectScript("a1-u1-d1")).toBe(true); // D566: a1-u1-d1-hallo-ich-heisse-yusuf.json — لا درس بلا سكربت بعد الآن
    expect(hasDirectScript("a9-u9-d9")).toBe(false); // درس غير موجود = بلا سكربت
  });

  it("shadowingLessonId: الأحدث المكتمل ممن له سكربت", () => {
    expect(shadowingLessonId(["a1-u1-d1", "a1-u1-d3"])).toBe("a1-u1-d3");
    // D566: a1-u1-d1 صار له سكربت — فلا يُتخطى بعد الآن
    expect(shadowingLessonId(["a1-u1-d3", "a1-u1-d1"])).toBe("a1-u1-d1");
    expect(shadowingLessonId(["a1-u1-d1"])).toBe("a1-u1-d1");
    expect(shadowingLessonId([])).toBeUndefined();
  });
});
