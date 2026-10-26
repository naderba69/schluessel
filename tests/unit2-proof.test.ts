// tests/unit2-proof.test.ts — إثبات الوحدة 2 عمودياً (D254 — طور التثبيت): 6 دروس تُلعَب آلياً عبر المساعد المشترك.
import { proveUnit } from "./unit-proof.js";

await proveUnit({
  unit: "الوحدة 2",
  ids: ["a1-u2-d1", "a1-u2-d2", "a1-u2-d3", "a1-u2-d4", "a1-u2-d5", "a1-u2-d6"],
  nextId: "a1-u3-d1",
  prefixIds: ["a1-u1-d1", "a1-u1-d2", "a1-u1-d3", "a1-u1-d4", "a1-u1-d5", "a1-u1-d6"],
});
