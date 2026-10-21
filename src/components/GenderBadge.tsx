// src/components/GenderBadge.tsx — الترميز المزدوج للجنس (§15‑هـ): لون + شكل — لا اللون وحده
// der ▲ أزرق | die ● أحمر | das ■ أخضر | يُستخدم في كل مكان يظهر فيه جنس نحوي
import type { Gender } from "../../content/schemas/index.js";
import { GENDER_SHAPE } from "../../content/schemas/index.js";

export const GENDER_SHAPE_CHAR: Record<Gender, string> = {
  der: "▲",
  die: "●",
  das: "■",
  none: "",
};

export const GENDER_COLOR: Record<Gender, string> = {
  der: "#2980b9", // أزرق
  die: "#c0392b", // أحمر
  das: "#1e7e34", // أخضر داكن (N-146: تباين AA 4.53 — قرار المالك)
  none: "#555555",
};

/** خصائص العرض الآمنة (تُختبر في DOM: data-gender/data-shape + aria-label) */
export function genderBadgeProps(gender: Gender) {
  return {
    "data-gender": gender,
    "data-shape": GENDER_SHAPE[gender],
    "data-dual-coding": "color+shape", // إلزامي: لا لون وحده أبداً
    "aria-label": gender === "none" ? "بلا جنس نحوي" : `الجنس: ${gender} (${GENDER_SHAPE_CHAR[gender]})`,
    className: `gender-badge gender-${gender}`,
    style: { color: GENDER_COLOR[gender], fontWeight: 700 as const },
  };
}

export function GenderBadge({ gender, word }: { gender: Gender; word?: string }) {
  return (
    <span {...genderBadgeProps(gender)} dir="ltr">
      {gender !== "none" && <span className="gender-shape">{GENDER_SHAPE_CHAR[gender]} </span>}
      {gender !== "none" && <span className="gender-article">{gender} </span>}
      {word && <span className="gender-word">{word}</span>}
    </span>
  );
}
