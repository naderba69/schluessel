// system-lab.test.tsx — واجهات M3: حدود الصدق ظاهرة · لا أرقام من العدم · بلا لوم · بصمة سلامة · WCAG AA
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SystemLab,
  GateScreen,
  ProgressScreen,
  AdaptationScreen,
  PlayScreen,
  DataScreen,
  SettingsScreen,
  PathScreen,
} from "../src/components/SystemLab.js";
import { createInitialState } from "../src/lib/state-factory.js";
import { BLAME_WORDS } from "../src/lib/warmth-engine.js";
import { loadFirstSession } from "../src/lesson-packs.js";

const FIRST_WORDS = (await loadFirstSession()).direct;

describe("الصدفة — لوحة النظام بست شاشات", () => {
  it("التبويبات الستة ظاهرة (E17–E22)", () => {
    const html = renderToStaticMarkup(<SystemLab words={FIRST_WORDS} />);
    expect(html).toContain('data-testid="system-lab"');
    for (const t of ["gate", "progress", "adapt", "play", "data", "settings"]) {
      expect(html).toContain(`stab-${t}`);
    }
    expect(html).toContain("البوابات"); // الشاشة الافتراضية
  });
});

describe("E17 — شاشة البوابات", () => {
  it("تحذير صيغة Goethe ظاهر دائماً — والبوابة تظهر في أسبوع البوابة", () => {
    const html = renderToStaticMarkup(<GateScreen week={6} />);
    expect(html).toContain("متحقق منها من وثائق Goethe الرسمية");
    expect(html).toContain('data-testid="gate-view"');
    expect(html).toContain('data-format="goethe-verifiziert"');
    expect(html).toContain("عتبتنا الداخلية"); // العتبة معلنة لا مخفية
  });

  it("الأسبوع العادي: لا بوابة + البوابات القادمة معلنة", () => {
    const html = renderToStaticMarkup(<GateScreen week={7} />);
    expect(html).toContain('data-testid="not-gate-week"');
    expect(html).toContain("12, 18, 24"); // gateSchedule(8, 25)
  });
});

describe("E18 — شاشة التقدم", () => {
  it("بلا بيانات = «لا أرقام من العدم» — وببيانات حقيقية تظهر النسبة", () => {
    const empty = renderToStaticMarkup(<ProgressScreen />);
    expect(empty).toContain("لا أرقام من العدم");
    expect(empty).toContain('data-testid="no-fake-numbers"');
    const withData = renderToStaticMarkup(
      <ProgressScreen stats={[{ skill: "hoeren", minutes: 30, itemsDone: 10, itemsCorrect: 8 }]} reviews={5} minutes={20} />,
    );
    expect(withData).toContain("80%");
    expect(withData).not.toContain("no-fake-numbers");
    expect(withData).toContain("منحنى النسيان");
  });
});

describe("E19 — شاشة التكيّف", () => {
  it("أزرار الأسباب الخمسة + شرح الحفظ — بلا لوم في الشاشة", () => {
    const html = renderToStaticMarkup(<AdaptationScreen />);
    for (const r of ["krank", "ramadan", "reise", "pruefung", "family"]) {
      expect(html).toContain(`freeze-${r}`);
    }
    expect(html).toContain("يُحفظ كما هو");
    for (const w of BLAME_WORDS) expect(html).not.toContain(w);
  });
});

describe("E20 — شاشة اللعب", () => {
  it("القواعد بلا ضغط + الكلمة من مفرداتي", () => {
    const html = renderToStaticMarkup(<PlayScreen words={FIRST_WORDS} />);
    expect(html).toContain("بلا مؤقت");
    expect(html).toContain("من مفرداتك المدروسة أنت");
    for (const w of ["أسرع", "سريع", "عاجل"]) expect(html).not.toContain(w);
    expect(html).toContain("Wordle اليوم");
  });
});

describe("E21 — شاشة النسخ الاحتياطي", () => {
  it("زر الاستعادة وزر التجربة المزوّرة — والرسائل معلَمة data-ok", () => {
    const html = renderToStaticMarkup(<DataScreen />);
    expect(html).toContain('data-testid="do-backup"');
    expect(html).toContain('data-testid="do-tamper"');
    expect(html).toContain("لا استعادة عمياء");
    expect(html).not.toContain('data-testid="data-msg"'); // لا رسالة قبل الإجراء
  });
});

describe("E22 — شاشة الإعدادات", () => {
  it("RTL ثابت + كل أزواج التباين تجتاز AA", () => {
    const html = renderToStaticMarkup(<SettingsScreen />);
    expect(html).toContain("ثابت في كل الشاشات");
    expect(html).toContain('data-testid="contrast-audit"');
    expect(html).not.toContain('data-pass="fail"');
    expect(html).toContain('data-pass="aa"');
    expect(html).toContain("WCAG AA");
  });
});

describe("تبويب المسار الكامل (N-149 · D249)", () => {
  it("يعرض العدّاد والقائمة الـ91 بحالاتها (من التطبيق)", () => {
    const html = renderToStaticMarkup(<PathScreen progress={createInitialState("س").progress} />);
    expect(html).toContain('data-testid="path-list"');
    expect(html).toContain("أكملت 0 من 91 درساً منشوراً");
    expect(html).toContain("a1-u1-d1");
    expect(html).toContain("● الدرس الحالي");
    expect(html).toContain("🔒 مقفل");
    expect(html.match(/data-lesson-id=/g)!.length).toBe(91);
  });

  it("بلا حالة: رسالة صريحة لا قائمة فارغة", () => {
    const html = renderToStaticMarkup(<PathScreen progress={null} />);
    expect(html).toContain('data-testid="path-needs-state"');
    expect(html).not.toContain('data-testid="path-list"');
  });

  it("تبويب المسار ظاهر في اللوحة", () => {
    const html = renderToStaticMarkup(<SystemLab words={FIRST_WORDS} />);
    expect(html).toContain("stab-path");
  });
});
