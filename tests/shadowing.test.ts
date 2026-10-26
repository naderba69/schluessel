// tests/shadowing.test.ts — D280: اختيار حوار الظل (أحدث متقن له سكربت مباشر)
import { describe, it, expect } from "vitest";
import { hasDirectScript, shadowingLessonId } from "../src/lesson-packs.js";

describe("D280: حوار الظل", () => {
  it("hasDirectScript يطابق الملفات الحقيقية", () => {
    expect(hasDirectScript("a1-u1-d3")).toBe(true); // a1-u1-d3-anmeldung.json
    expect(hasDirectScript("a1-u1-d1")).toBe(false); // بلا سكربت مباشر
  });

  it("shadowingLessonId: الأحدث المكتمل ممن له سكربت", () => {
    expect(shadowingLessonId(["a1-u1-d1", "a1-u1-d3"])).toBe("a1-u1-d3");
    expect(shadowingLessonId(["a1-u1-d3", "a1-u1-d1"])).toBe("a1-u1-d3"); // الأحدث بلا سكربت فيُتخطى
    expect(shadowingLessonId(["a1-u1-d1"])).toBeUndefined();
    expect(shadowingLessonId([])).toBeUndefined();
  });
});
