// tests/gender-drill-content.test.ts — D582: توسيع محتوى مدرّب الجنس (§7 محرك 3)
// الترميز المزدوج يرافق البنود · الاستدعاء المعلن يظهر في البنود · «خمّن الجمع» من درس شفرة الجمع.
import { describe, expect, it } from "vitest";
import { loadAllLessons } from "../src/lesson-packs.js";
import { ChoiceItem } from "../content/schemas/index.js";

const ALL_LESSONS = await loadAllLessons();

type DrillStation = { type: string; items: unknown[]; interleavedWith?: string[] };

describe("D582 — مدرّب الجنس: المحتوى ممتد وصادق", () => {
  const drills = ALL_LESSONS.flatMap((l) =>
    ((l as unknown as { uebung: { stations: DrillStation[] } }).uebung?.stations ?? [])
      .filter((s) => s.type === "gender-drill")
      .map((s) => ({ lesson: l.id, station: s })),
  );

  it("امتداد حقيقي: ≥40 درساً فيها محطة مدرّب الجنس", () => {
    expect(drills.length).toBeGreaterThanOrEqual(40);
  });

  it("كل بند يمرّ بمخطط الاختبار ويحمل شارة جنس مطابقة للإجابة (§15-هـ)", () => {
    for (const { lesson, station } of drills) {
      expect(station.items.length, lesson).toBeGreaterThanOrEqual(1);
      for (const raw of station.items) {
        const r = ChoiceItem.safeParse(raw);
        expect(r.success, `${lesson}: ${JSON.stringify(raw).slice(0, 80)}`).toBe(true);
        if (!r.success) continue;
        const genderItems = r.data.gender != null;
        expect(genderItems, lesson).toBe(true);
        if (r.data.choices.join(",") === "der,die,das") {
          expect(r.data.a).toBe(r.data.gender); // الشارة لا تكذب
        }
      }
    }
  });

  it("الاستدعاء المعلن يظهر في البنود كلمةً كاملة (N-102/N-110) — لا وعود فارغة", () => {
    // المعرّفات slug (ä→ae) والنص ألماني (ä) — نطوي الأصوات للمقارنة كما يفعل الحارس
    const fold = (s: string) => s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
    for (const { lesson, station } of drills) {
      const text = fold(JSON.stringify(station.items));
      for (const id of station.interleavedWith ?? []) {
        expect(text, `${lesson}: ${id}`).toContain(id.split("-")[0]!);
      }
    }
  });

  it("«خمّن الجمع» موجود من درس شفرة الجمع (a1-u6-d1) فما بعد", () => {
    const pluralDrills = drills.filter(
      (d) => d.lesson >= "a1-u6-d1" && d.lesson <= "a1-u9-d5" && JSON.stringify(d.station.items).includes("خمّن الجمع"),
    );
    expect(pluralDrills.length).toBeGreaterThanOrEqual(10);
  });
});
