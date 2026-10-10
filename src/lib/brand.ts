// src/lib/brand.ts — هوية المنتج (D32): «مفتاح — Schlüssel» | «رحلة يوسف» اسم تقني داخلي فقط
export const BRAND = {
  /** اسم المنتج المعروض للمستخدم */
  nameAr: "مفتاح",
  nameDe: "Schlüssel",
  full: "Schlüssel", // الاسم المعتمد (D35 — قرار المالك 2026-10-10)
  /** الشعار الرسمي (D32) */
  sloganAr: "اللغة مفتاحك",
  sloganDe: "Die Sprache ist dein Schlüssel",
  /** الاسم التقني الداخلي — لا يظهر للمستخدم أبداً (D31) */
  internalName: "reise-yusuf",
  accent: "#1e3a5f", // أزرق هادئ (قرار الألوان v1.3)
  accentSoft: "#2e7d64", // أخضر
} as const;
