// tests/design-coverage.test.ts — D309 · N-155/1: كل مكوّن جديد له نمطه (لا HTML عارياً)
// app.css لا يُحمَّل في الاختبارات — هذا الملف يقرؤه نصاً ويحرس التغطية.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CSS = readFileSync(join(process.cwd(), "src/app.css"), "utf8");

/** مكوّنات D298–D308: كل testid حاوية/زر رئيسي يجب أن يظهر في الأنماط */
const STYLED = [
  "lesson-illustration",
  "weekly-challenge",
  "challenge-praise",
  "skill-of-day",
  "minute-conversation",
  "convo-answer",
  "on-the-go",
  "go-progress",
  "recurring-error",
  "recurring-answer",
  "shadow-entry",
  "video-corner",
  "video-of-day",
  "video-day-link",
  "video-coming",
  "video-internet-note",
  "video-offline",
  "line-recorder",
  "rec-live",
  "rec-note",
  "rec-play-mine",
  "coach-pulse-task",
  "coach-evening-report",
  "coach-phrase",
];

const PRIMARY = [
  "go-start",
  "challenge-done",
  "shadow-entry-start",
  "convo-reveal",
  "recurring-reveal",
  "video-fix-reveal",
];

describe("D309 — تغطية الأنماط: لا مكوّن عارياً", () => {
  it("أقواس متوازنة (لا كسر بنيوي)", () => {
    const open = (CSS.match(/{/g) ?? []).length;
    const close = (CSS.match(/}/g) ?? []).length;
    expect(open).toBeGreaterThan(50);
    expect(close).toBe(open);
  });

  it("كل مكوّن جديد مذكور في الأنماط", () => {
    for (const t of STYLED) expect(CSS, t).toContain(`[data-testid="${t}"]`);
  });

  it("أزرار الدعوة الجديدة رئيسية (primary) — زر واحد بارز في كل بطاقة", () => {
    for (const t of PRIMARY) expect(CSS, t).toContain(`[data-testid="${t}"]`);
    const primaryBlock = CSS.slice(CSS.indexOf("أفعال الدعوة الجديدة"));
    for (const t of PRIMARY) expect(primaryBlock, t).toContain(t);
    expect(primaryBlock).toContain("var(--primary)");
  });

  it("لا ألوان خام خارج الرموز في القسم الجديد (مصدر واحد — قانون 30)", () => {
    const section = CSS.slice(CSS.indexOf("17 · أنماط المنسيين"));
    expect(section).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    expect(section).not.toMatch(/!important/);
  });
});
