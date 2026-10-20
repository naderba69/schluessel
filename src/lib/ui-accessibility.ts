// ui-accessibility.ts — E22 محرك الواجهة/الوصولية | M3
// المصادر: WCAG (أساسيات الوصولية) · تباين الألوان AA ≥ 4.5 · RTL في كل شاشة (العربية أولاً)
// الوظائف: وضع ليلي · تكبير · وضع تركيز — كلها تفضيلات محفوظة بلا ضغط (D23).

export type ThemeMode = "light" | "dark";

export type ThemePrefs = {
  mode: ThemeMode;
  /** خطوات التكبير المسموحة فقط */
  zoom: 1 | 1.25 | 1.5 | 2;
  focusMode: boolean;
  /** اتجاه ثابت: العربية RTL في كل شاشة */
  dir: "rtl";
};

export const DEFAULT_PREFS: ThemePrefs = Object.freeze({
  mode: "light",
  zoom: 1,
  focusMode: false,
  dir: "rtl",
});

export const ZOOM_STEPS: readonly ThemePrefs["zoom"][] = Object.freeze([1, 1.25, 1.5, 2]);

export function toggleMode(p: ThemePrefs): ThemePrefs {
  return { ...p, mode: p.mode === "light" ? "dark" : "light" };
}

export function setZoom(p: ThemePrefs, zoom: ThemePrefs["zoom"]): ThemePrefs {
  if (!ZOOM_STEPS.includes(zoom)) throw new Error("خطوة تكبير غير مسموحة");
  return { ...p, zoom };
}

export function toggleFocus(p: ThemePrefs): ThemePrefs {
  return { ...p, focusMode: !p.focusMode };
}

/** لوحتا الألوان — تباين كل زوج نص/خلفية مُختبَر AA */
export const PALETTE: Record<ThemeMode, { bg: string; fg: string; muted: string; accentFg: string; accentBg: string }> = {
  light: { bg: "#FFFFFF", fg: "#1A1A1A", muted: "#4A4A4A", accentBg: "#0B5FFF", accentFg: "#FFFFFF" },
  dark: { bg: "#121212", fg: "#F5F5F5", muted: "#C9C9C9", accentBg: "#7EB2FF", accentFg: "#0B1B33" },
};

function luminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`لون غير صالح: ${hex}`);
  const n = parseInt(m[1]!, 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!;
}

/** نسبة التباين وفق WCAG — (L1+0.05)/(L2+0.05) */
export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function meetsAA(ratio: number): boolean {
  return ratio >= 4.5;
}

/** تدقيق كامل للوحة الألوان — كل أزواج النص/الخلفية في الوضعين */
export function auditPalette(): { mode: ThemeMode; pair: string; ratio: number; pass: boolean }[] {
  const out: { mode: ThemeMode; pair: string; ratio: number; pass: boolean }[] = [];
  for (const mode of ["light", "dark"] as const) {
    const p = PALETTE[mode];
    for (const [pair, fg, bg] of [
      ["fg-on-bg", p.fg, p.bg],
      ["muted-on-bg", p.muted, p.bg],
      ["accentFg-on-accentBg", p.accentFg, p.accentBg],
    ] as const) {
      const ratio = contrastRatio(fg, bg);
      out.push({ mode, pair, ratio, pass: meetsAA(ratio) });
    }
  }
  return out;
}
