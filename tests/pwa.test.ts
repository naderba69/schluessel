// pwa.test.ts — S0.6 | test-pwa-manifest / test-route-lock
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { lessonStatus, isLessonUnlocked } from "../src/lib/routes.js";
import type { LearnerProgress } from "../content/schemas/index.js";

const progress: LearnerProgress = {
  schemaVersion: "1.0.0",
  completedLessons: ["a1-u1-d1"],
  availableLessons: ["a1-u1-d2"],
  lockedLessons: ["a1-u1-d3"],
  gateResults: [],
  currentUnit: { level: "A1", unit: 1 },
  levelExams: {},
};

describe("PWA (test-pwa-manifest)", () => {
  const manifest = JSON.parse(readFileSync(join(process.cwd(), "public/manifest.webmanifest"), "utf8"));

  it("مانيفست التثبيت مكتمل (قانون 25)", () => {
    expect(manifest.name).toContain("مفتاح");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.lang).toBe("ar");
    expect(manifest.dir).toBe("rtl");
    expect(manifest.icons?.length).toBeGreaterThan(0);
  });

  it("service worker موجود ويدعم offline shell", () => {
    const sw = readFileSync(join(process.cwd(), "public/sw.js"), "utf8");
    expect(sw).toContain("caches");
    expect(sw).toContain("index.html");
    expect(sw).toContain("addEventListener(\"install\"");
  });
});

describe("قفل المسار (test-route-lock)", () => {
  it("الحالات الثلاث: مكتمل/متاح/مقفل", () => {
    expect(lessonStatus("a1-u1-d1", progress)).toBe("completed");
    expect(lessonStatus("a1-u1-d2", progress)).toBe("available");
    expect(lessonStatus("a1-u1-d3", progress)).toBe("locked");
  });

  it("لا درس مقفل يُفتح (القانون 3)", () => {
    expect(isLessonUnlocked("a1-u1-d3", progress)).toBe(false);
    expect(isLessonUnlocked("a1-u9-d5", progress)).toBe(false); // غير معروف = مقفل
    expect(isLessonUnlocked("a1-u1-d2", progress)).toBe(true);
    expect(isLessonUnlocked("a1-u1-d1", progress)).toBe(true); // المكتمل يُراجَع
  });
});
