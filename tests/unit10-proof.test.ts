// tests/unit10-proof.test.ts — إثبات الوحدة 10 عمودياً (D262 — طور التثبيت): 6 دروس تُلعَب آلياً عبر المساعد المشترك.
import { proveUnit } from "./unit-proof.js";

await proveUnit({
  unit: "الوحدة 10",
  ids: ["a1-u10-d1", "a1-u10-d2", "a1-u10-d3", "a1-u10-d4", "a1-u10-d5", "a1-u10-d6"],
  nextId: "a1-u11-d1",
  prefixIds: [
    "a1-u1-d1", "a1-u1-d2", "a1-u1-d3", "a1-u1-d4", "a1-u1-d5", "a1-u1-d6",
    "a1-u2-d1", "a1-u2-d2", "a1-u2-d3", "a1-u2-d4", "a1-u2-d5", "a1-u2-d6",
    "a1-u3-d1", "a1-u3-d2", "a1-u3-d3", "a1-u3-d4", "a1-u3-d5", "a1-u3-d6",
    "a1-u4-d1", "a1-u4-d2", "a1-u4-d3", "a1-u4-d4", "a1-u4-d5", "a1-u4-d6",
    "a1-u5-d1", "a1-u5-d2", "a1-u5-d3", "a1-u5-d4", "a1-u5-d5", "a1-u5-d6",
    "a1-u6-d1", "a1-u6-d2", "a1-u6-d3", "a1-u6-d4", "a1-u6-d5", "a1-u6-d6",
    "a1-u7-d1", "a1-u7-d2", "a1-u7-d3", "a1-u7-d4", "a1-u7-d5", "a1-u7-d6",
    "a1-u8-d1", "a1-u8-d2", "a1-u8-d3", "a1-u8-d4", "a1-u8-d5", "a1-u8-d6",
    "a1-u9-d1", "a1-u9-d2", "a1-u9-d3", "a1-u9-d4", "a1-u9-d5", "a1-u9-d6",
  ],
});
