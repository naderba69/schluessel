// tests/struck-text.test.tsx — الخطأ المشطوب يُرسم شطباً حقيقياً (D128): «~~Strasse~~» ← <del>Strasse</del>
// كان المُشغِّل يعرض العلامتين خاماً في بطاقات المصائد (79 درساً) وأسئلة «صحّح: ~~…~~» — والحارس D128 يقبل الخطأ
// المقصود المعلن داخل ~~ وحدها، فيجب أن يراه المتعلم مشطوباً فعلاً.
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { splitStruck, visibleText } from "../src/lib/struck-text.js";
import { BorrowedProvider, BorrowedWordsBox, StruckText } from "../src/components/StruckText.js";
import { CloseStation } from "../src/components/LessonContent.js";
import { planLessonStations } from "../src/lib/lesson-runner.js";
import { ALL_LESSONS, ALL_WORDS } from "../src/lesson-packs.js";

describe("D128 — splitStruck / visibleText", () => {
  it("الزوج المغلق وحده يُشطب — بالترتيب، والعربية حوله كما هي", () => {
    expect(splitStruck("صحّح: ~~Strasse~~ ← Straße")).toEqual([
      { text: "صحّح: ", struck: false },
      { text: "Strasse", struck: true },
      { text: " ← Straße", struck: false },
    ]);
    expect(splitStruck("~~der Zentrum~~ / ~~die Zentrum~~").filter((p) => p.struck).map((p) => p.text)).toEqual(["der Zentrum", "die Zentrum"]);
    expect(splitStruck("بلا شطب")).toEqual([{ text: "بلا شطب", struck: false }]);
    expect(splitStruck("")).toEqual([]);
  });
  it("«~~» وحيدة تبقى نصاً ولا تبتلع ما بعدها", () => {
    expect(splitStruck("a ~~ b")).toEqual([{ text: "a ~~ b", struck: false }]);
    expect(visibleText("~~x~~ y ~~")).toBe("x y ~~");
  });
});

describe("D128 — الرسم", () => {
  it("StruckText: <del> للمقطع المشطوب ولا علامة ~~ في المرسوم", () => {
    const html = renderToStaticMarkup(<StruckText text="صحّح: ~~Ich Yusuf~~" />);
    expect(html).toContain('<del data-testid="struck">Ich Yusuf</del>');
    expect(html).not.toContain("~~");
  });
  it("بطاقات المصائد في الخلاصة — كل درس حقيقي: الخطأ مشطوب و«~~» لا تظهر أبداً", () => {
    let struck = 0;
    for (const lesson of ALL_LESSONS) {
      const plan = planLessonStations(lesson, [...ALL_WORDS]); // الخلاصة وحدها تُفحص هنا
      const html = renderToStaticMarkup(<CloseStation data={plan.close} report="" preview="" muellerLine="" />);
      expect(html, lesson.id).not.toContain("~~");
      struck += (html.match(/<del /g) ?? []).length;
    }
    expect(struck).toBeGreaterThan(ALL_LESSONS.length); // كل بطاقة مصيدة تحمل خطأها بين ~~ (tests/content-units)
  });
});

describe("D188 — الكلمة المستعارة تصل إلى المتعلم: ترجمة على الكلمة + صندوق قبل التدريب", () => {
  const borrowed = [{ form: "fragt", wordId: "fragen", ar: "يسأل", whyAr: "تتعلّم fragen في a1-u10-d3." }];
  it("StruckText داخل BorrowedProvider يرسم <abbr title=…> حول fragt وحدها (كلمة كاملة — لا داخل gefragt)", () => {
    const html = renderToStaticMarkup(
      <BorrowedProvider words={borrowed}>
        <StruckText text="Der Verkäufer fragt den Kunden. ~~gefragt~~ fragt." />
      </BorrowedProvider>,
    );
    expect(html.match(/data-testid="borrowed"/g)).toHaveLength(2);
    expect(html).toContain('title="يسأل — كلمة مستعارة من درس قادم"');
    expect(html).toContain('<del data-testid="struck">gefragt</del>');
  });
  it("بلا مزوّد: لا تلميح — النص كما كان (الدروس بلا مستعارات لا تتغير)", () => {
    expect(renderToStaticMarkup(<StruckText text="Der Verkäufer fragt den Kunden." />)).not.toContain("borrowed");
    expect(splitStruck("a fragt b", new Map([["fragt", "x"]])).map((p) => [p.text, p.gloss ?? null])).toEqual([["a ", null], ["fragt", "x"], [" b", null]]);
  });
  it("BorrowedWordsBox: الصيغة = المعنى — السبب", () => {
    const html = renderToStaticMarkup(<BorrowedWordsBox words={borrowed} />);
    expect(html).toContain('data-testid="borrowed-words"');
    expect(html).toContain("fragt");
    expect(html).toContain("يسأل");
    expect(renderToStaticMarkup(<BorrowedWordsBox words={[]} />)).toBe("");
  });
});
