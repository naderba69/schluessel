// tests/unit4-proof.test.ts — إثبات الوحدة 4 عمودياً (D256 — طور التثبيت): 6 دروس تُلعَب آلياً عبر المساعد المشترك.
import { proveUnit } from "./unit-proof.js";

await proveUnit({
  unit: "الوحدة 4",
  ids: ["a1-u4-d1", "a1-u4-d2", "a1-u4-d3", "a1-u4-d4", "a1-u4-d5", "a1-u4-d6"],
  nextId: "a1-u5-d1",
  prefixIds: [
    "a1-u1-d1", "a1-u1-d2", "a1-u1-d3", "a1-u1-d4", "a1-u1-d5", "a1-u1-d6",
    "a1-u2-d1", "a1-u2-d2", "a1-u2-d3", "a1-u2-d4", "a1-u2-d5", "a1-u2-d6",
    "a1-u3-d1", "a1-u3-d2", "a1-u3-d3", "a1-u3-d4", "a1-u3-d5", "a1-u3-d6",
  ],
});
