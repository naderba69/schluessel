// skills-lab.test.tsx — واجهات M2: كل شاشة تعكس قواعد محركها (القفل · الهدف أولاً · المصدر · بلا لوم)
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SkillsLab,
  ListeningLab,
  PronunciationLab,
  ReadingLab,
  WritingLab,
  GrammarLab,
  NetworkLab,
  TasksLab,
  CultureLab,
  DEMO_TEXT,
} from "../src/components/SkillsLab.js";
import { BLAME_WORDS } from "../src/lib/warmth-engine.js";
import { loadFirstSession } from "../src/lesson-packs.js";

const FIRST_WORDS = (await loadFirstSession()).direct;
import { A1_RULES } from "../src/lib/grammar-discovery.js";

describe("الصدفة — مختبر المهارات بثماني محطات", () => {
  it("التبويبات الثمانية كلها ظاهرة (E09–E16)", () => {
    const html = renderToStaticMarkup(<SkillsLab words={FIRST_WORDS} />);
    expect(html).toContain('data-testid="skills-lab"');
    for (const t of ["hoeren", "sprechen", "lesen", "schreiben", "grammatik", "netzwerk", "aufgaben", "kultur"]) {
      expect(html).toContain(`tab-${t}`);
    }
    expect(html).toContain("الاستماع المتقدم"); // المحطة الافتراضية
  });
});

describe("E09 — شاشة الاستماع", () => {
  it("الأزواج الثلاث + سلال الضجيج + النص المكتوب أخيراً", () => {
    const html = renderToStaticMarkup(<ListeningLab />);
    expect(html).toContain("paar-baer-bett");
    expect(html).toContain("paar-kirche-kirsche");
    expect(html).toContain("paar-tier-tuer");
    expect(html).toContain("مرحلة الضجيج الحالية");
    // النص المكتوب (transkript) يأتي بعد كل الاستماعات في الترتيب
    expect(html.indexOf("الآن اكشف النص")).toBeGreaterThan(html.lastIndexOf("بلا نص"));
  });
});

describe("E10 — شاشة النطق", () => {
  it("مخرج D18 ظاهر + تحذير «لا درجات» + خطوات الدورة بالترتيب", () => {
    const html = renderToStaticMarkup(<PronunciationLab />);
    expect(html).toContain("Zungenspitze an der unteren Schneidezähne");
    expect(html).toContain("لا نُعطي درجات");
    const kinds = ["hoeren", "muenzkarte", "aufnehmen-vorher", "nachsprechen", "aufnehmen-nachher", "selbstvergleich"];
    let last = -1;
    for (const k of kinds) {
      const i = html.indexOf(`data-kind="${k}"`);
      expect(i).toBeGreaterThan(last);
      last = i;
    }
  });
});

describe("E11 — شاشة القراءة: الترجمة مقفلة قبل المحاولة", () => {
  it("الترجمة مغلقة أولاً (data-locked=true) — ودعوة القراءة أولاً", () => {
    const html = renderToStaticMarkup(<ReadingLab text={DEMO_TEXT} />);
    expect(html).toContain("لا تُترجم بعد");
    expect(html).toContain('data-testid="translate-r1" data-locked="true"');
  });
});

describe("E12 — شاشة الكتابة", () => {
  it("جملة اليوم + اليوميات + التصحيح يشرح «لماذا» — بلا لوم", () => {
    const html = renderToStaticMarkup(<WritingLab initialText="Ich komme von Tunesien." words={FIRST_WORDS} />);
    expect(html).toContain("Heute:");
    expect(html).toContain("Mein Tag");
    expect(html).toContain("Ich komme aus Tunesien.");
    expect(html).toContain("اقتربت"); // العبارات اللطيفة
    expect(html).toContain("aus"); // التصحيح: von → aus
    for (const w of BLAME_WORDS) expect(html).not.toContain(w);
  });
});

describe("E13 — شاشة القواعد: القفل قبل المحاولة", () => {
  it("الأمثلة ظاهرة — والقاعدة مخفية والكشف مقفل في الحالة الأولى", () => {
    const html = renderToStaticMarkup(<GrammarLab />);
    expect(html).toContain("Hier wohne ich."); // N-009: مثال v2 الجديد عند a1-u2-d1
    expect(html).toContain("استنتج القاعدة");
    expect(html).toContain('data-testid="reveal-rule" data-locked="true"');
    // نص القاعدة نفسه لا يظهر في الحالة الأولى (لا كشف قبل المحاولة)
    expect(html).not.toContain(A1_RULES[0]!.ruleAr);
  });

  it("N-009: بلا تقدّم معلوم — القواعد الثلاث متاحة والافتراضي أولها", () => {
    const html = renderToStaticMarkup(<GrammarLab />);
    expect(html).toContain('data-testid="rule-v2-position"');
    expect(html).toContain('data-testid="rule-aus-vs-von"');
    expect(html).toContain('data-testid="rule-heissen-du"');
  });

  it("N-009: البوابة — تلميذ u1-d1 لا يرى إلا heißen (لا v2 ولا aus/von)", () => {
    const html = renderToStaticMarkup(<GrammarLab currentLessonId="a1-u1-d1" />);
    expect(html).toContain('data-testid="rule-heissen-du"');
    expect(html).not.toContain('data-testid="rule-v2-position"');
    expect(html).not.toContain('data-testid="rule-aus-vs-von"');
    expect(html).toContain("Er heißt Yusuf.");
  });

  it("N-009: البوابة — تلميذ u2-d1 يرى قاعدتين مرتبتين (heißen أولاً) ولا يرى aus/von", () => {
    const html = renderToStaticMarkup(<GrammarLab currentLessonId="a1-u2-d1" />);
    expect(html).toContain('data-testid="rule-heissen-du"');
    expect(html).toContain('data-testid="rule-v2-position"');
    expect(html).not.toContain('data-testid="rule-aus-vs-von"');
    expect(html.indexOf("rule-heissen-du")).toBeLessThan(html.indexOf("rule-v2-position"));
  });

  it("N-009: البوابة — معرّف مجهول يُغلق (fail-closed) لا يُظهر شيئاً", () => {
    const html = renderToStaticMarkup(<GrammarLab currentLessonId="nope" />);
    expect(html).toContain("لا قواعد متاحة بعد");
  });
});

describe("E14 — شاشة الشبكة", () => {
  it("العارات والكبائش في الشاشة + القصر بغرفه", () => {
    const html = renderToStaticMarkup(<NetworkLab words={FIRST_WORDS} />);
    expect(html).toContain('data-testid="kol-kommen"');
    expect(html).toContain("aus Tunesien kommen");
    expect(html).toContain("المدخل");
    expect(html).toContain("استدعي العائلة كاملة");
  });
});

describe("E15 — شاشة المهام: الهدف أولاً", () => {
  it("الهدف يظهر قبل دعوة المحاولة — والحوار النموذجي مخفي أولاً", () => {
    const html = renderToStaticMarkup(<TasksLab />);
    expect(html.indexOf("الهدف:")).toBeGreaterThan(-1);
    expect(html.indexOf("الهدف:")).toBeLessThan(html.indexOf("حاول وحدك أولاً"));
    expect(html).not.toContain("data-testid=\"model-dialogue\""); // لا نموذج قبل المحاولة (§2.5)
    expect(html).toContain("task-criteria");
  });
});

describe("E16 — شاشة الثقافة", () => {
  it("كل حقيقة بمصدرها + علم تحقق ويب للمواعيد السنوية + أغنية ملكية عامة", () => {
    const html = renderToStaticMarkup(<CultureLab />);
    expect(html).toContain("المصدر:");
    expect(html).toContain('data-testid="verify-oktoberfest"');
    expect(html).toContain("ملكية عامة");
    for (const w of BLAME_WORDS) expect(html).not.toContain(w);
  });
});
