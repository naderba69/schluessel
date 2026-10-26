// tests/unit1-proof.test.ts — إثبات الوحدة 1 عمودياً (D253 — بقرار المالك): 6 دروس تُلعَب آلياً عبر المساعد المشترك.
import { proveUnit } from "./unit-proof.js";

await proveUnit({
  unit: "الوحدة 1",
  ids: ["a1-u1-d1", "a1-u1-d2", "a1-u1-d3", "a1-u1-d4", "a1-u1-d5", "a1-u1-d6"],
  nextId: "a1-u2-d1",
  prefixIds: [],
});
