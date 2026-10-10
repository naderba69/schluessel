// ui-accessibility.test.ts — E22: WCAG تباين AA + RTL + ليلي/تكبير/تركيز
import { describe, it, expect } from "vitest";
import {
  DEFAULT_PREFS,
  ZOOM_STEPS,
  toggleMode,
  setZoom,
  toggleFocus,
  PALETTE,
  contrastRatio,
  meetsAA,
  auditPalette,
} from "../src/lib/ui-accessibility.js";

describe("E22 — التفضيلات: ليلي · تكبير · تركيز · RTL", () => {
  it("الافتراضيات: RTL في كل شاشة — والتكبير بخطوات مسموحة فقط", () => {
    expect(DEFAULT_PREFS.dir).toBe("rtl");
    expect(ZOOM_STEPS).toEqual([1, 1.25, 1.5, 2]);
    expect(() => setZoom(DEFAULT_PREFS, 1.3 as never)).toThrow();
    expect(setZoom(DEFAULT_PREFS, 1.5).zoom).toBe(1.5);
  });

  it("الوضع الليلي والتركيز يتقلبان — والاتجاه لا يتغير أبداً", () => {
    const dark = toggleMode(DEFAULT_PREFS);
    expect(dark.mode).toBe("dark");
    expect(toggleMode(dark).mode).toBe("light");
    const focus = toggleFocus(DEFAULT_PREFS);
    expect(focus.focusMode).toBe(true);
    expect(focus.dir).toBe("rtl");
  });
});

describe("E22 — تباين الألوان WCAG AA", () => {
  it("أسود/أبيض = 21 — والحساب وفق الصيغة القياسية", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
    expect(meetsAA(4.5)).toBe(true);
    expect(meetsAA(4.4)).toBe(false);
    expect(() => contrastRatio("nope", "#FFFFFF")).toThrow();
  });

  it("لوحتا الوضعين تجتازان AA في كل أزواج النص/الخلفية", () => {
    const audit = auditPalette();
    expect(audit).toHaveLength(6); // 3 أزواج × وضعان
    for (const row of audit) {
      expect(row.pass, `${row.mode}/${row.pair} = ${row.ratio}`).toBe(true);
    }
    expect(Object.keys(PALETTE).sort()).toEqual(["dark", "light"]);
  });
});
