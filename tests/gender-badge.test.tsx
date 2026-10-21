// gender-badge.test.ts — S0.8 | test-gender-badge — الترميز المزدوج (§15‑هـ)
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GenderBadge, genderBadgeProps, GENDER_SHAPE_CHAR } from "../src/components/GenderBadge.js";

describe("GenderBadge (test-gender-badge)", () => {
  it("يعرض الترميز المزدوج: شكل + لون معاً (لا لون وحده)", () => {
    const html = renderToStaticMarkup(<GenderBadge gender="die" word="Wohnung" />);
    expect(html).toContain("data-gender=\"die\"");
    expect(html).toContain("data-shape=\"circle\"");
    expect(html).toContain("data-dual-coding=\"color+shape\"");
    expect(html).toContain("●"); // الشكل ثابت بمعزل عن اللون
    expect(html).toContain("color:#c0392b"); // الأحمر
    expect(html).toContain("dir=\"ltr\""); // قانون 29
  });

  it("der ▲ أزرق / das ■ أخضر — الإشارة تصل لعمى الألوان عبر الشكل", () => {
    const der = renderToStaticMarkup(<GenderBadge gender="der" word="Tisch" />);
    const das = renderToStaticMarkup(<GenderBadge gender="das" word="Kind" />);
    expect(der).toContain("▲");
    expect(der).toContain("color:#2980b9");
    expect(das).toContain("■");
    expect(das).toContain("color:#1e7e34"); // أخضر داكن AA (N-146)
    expect(GENDER_SHAPE_CHAR.die).toBe("●");
  });

  it("الوصول: aria-label يصف الجنس بالشكل", () => {
    const props = genderBadgeProps("das");
    expect(props["aria-label"]).toContain("das");
    expect(props["aria-label"]).toContain("■");
  });

  it("بلا جنس: لا شكل ولا article (none)", () => {
    const html = renderToStaticMarkup(<GenderBadge gender="none" />);
    expect(html).not.toContain("gender-shape");
    expect(html).toContain("data-gender=\"none\"");
  });
});
