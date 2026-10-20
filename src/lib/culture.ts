// culture.ts — E16 محرك الثقافة | M2-ب
// المصدر: Landeskunde (مكون قياسي في مناهج DaF) · §4 حدود الصدق (مواعيد سنوية = needsWebVerify) · D3 (بيانات)
// القاعدة الحديدية: **لا حقيقة ثقافية تُنشر بلا مصدر** — إلزامي في التسجيل.

export type CultureFact = {
  id: string;
  kind: "feiertag" | "tradition" | "song" | "alltag";
  titleDe: string;
  titleAr: string;
  /** نص «ألمانيا في 60 ثانية» — حزمة كلمات تُقرأ في دقيقة */
  bodyAr: string;
  scriptSeconds: number;
  /** المصدر — إلزامي غير فارغ */
  sourceAr: string;
  /** حدود الصدق §4: حقيقة بموعد سنوي متغيّر = تحتاج تحقق ويب عند النشر */
  needsWebVerify: boolean;
};

const MAX_SECONDS = 60;

/** حقائق ثقافية مستقرة — كل واحدة بمصدرها */
export const CULTURE_FACTS: readonly CultureFact[] = Object.freeze([
  {
    id: "tag-der-einheit",
    kind: "feiertag",
    titleDe: "Tag der Deutschen Einheit",
    titleAr: "يوم الوحدة الألمانية",
    bodyAr: "في الثالث من أكتوبر يحتفل الألمان بيوم الوحدة — ذكرى اتحاد الألمانيتين عام 1990. يوم عطلة رسمية في كل الولايات.",
    scriptSeconds: 25,
    sourceAr: "معاهدة الاتحاد الألماني (Einigungsvertrag 1990) — التاريخ ثابت دستورياً.",
    needsWebVerify: false,
  },
  {
    id: "weihnachten",
    kind: "feiertag",
    titleDe: "Weihnachten",
    titleAr: "عيد الميلاد",
    bodyAr: "عيد الميلاد في ألمانيا يومان رسميان: 25 و26 ديسمبر. العائلة تجتمع، والهدية تُقدَّم مساء 24 (العشرة).",
    scriptSeconds: 22,
    sourceAr: "أيام العطل الرسمية الثابتة في القانون الألماني (gesetzliche Feiertage).",
    needsWebVerify: false,
  },
  {
    id: "oktoberfest",
    kind: "tradition",
    titleDe: "Oktoberfest",
    titleAr: "مهرجان أكتوبر (الويزن)",
    bodyAr: "أكبر مهرجان شعبي في العالم يُقام في ميونخ من أواخر سبتمبر إلى أوائل أكتوبر — يُعرف محلياً بالويزن.",
    scriptSeconds: 20,
    sourceAr: "تقليد مدينة ميونخ (الويزن) — لكن التواريخ الدقيقة تختلف كل سنة.",
    needsWebVerify: true,
  },
  {
    id: "lied-woche",
    kind: "song",
    titleDe: "Alle Vögel sind schon da",
    titleAr: "كل الطيور ها هنا",
    bodyAr: "أغنية الربيع الشعبية الشهيرة — من التراث الألماني القديم، تُعلَّم للأطفال وتُغني في الأعياد المدرسية.",
    scriptSeconds: 18,
    sourceAr: "أغنية شعبية تراثية (Volkslied) — ملكية عامة (gemeinfrei).",
    needsWebVerify: false,
  },
]);

/** التسجيل: **لا حقيقة بلا مصدر** — ونسخة ≤ 60 ثانية */
export function registerFact(f: CultureFact): CultureFact {
  if (!f.sourceAr.trim()) throw new Error("حقيقة بلا مصدر مرفوضة (E16 — لا نشر بلا مراجعة)");
  if (f.scriptSeconds <= 0 || f.scriptSeconds > MAX_SECONDS) {
    throw new Error("نص «ألمانيا في 60 ثانية» يجب ألا يتجاوز 60 ثانية");
  }
  return f;
}

/** «ألمانيا في 60 ثانية» — اختيار حقيقة ونصها الجاهز */
export function sixtySeconds(id?: string): { fact: CultureFact; scriptAr: string } {
  const fact = id ? CULTURE_FACTS.find((f) => f.id === id) : CULTURE_FACTS[0];
  if (!fact) throw new Error(`حقيقة غير معروفة: ${id}`);
  registerFact(fact);
  return { fact, scriptAr: fact.bodyAr };
}

/** أغنية الأسبوع — **المصرّح بها فقط** (§4: مفتوحة المصدر/ملكية عامة) */
export function songOfTheWeek(): { title: string; license: "public-domain" | "cc"; reasonAr: string } {
  return {
    title: "Alle Vögel sind schon da",
    license: "public-domain",
    reasonAr: "أغنية تراثية ملكية عامة — بلا حقوق تمنع الاستخدام التعليمي.",
  };
}

/** تقويم الأعياد — عطل فقط */
export function holidayFacts(): CultureFact[] {
  return CULTURE_FACTS.filter((f) => f.kind === "feiertag").map((f) => (registerFact(f), f));
}

/** كل الحقائق المعلَنة بمصادرها — «لا تخمين» (لا نُخفي ما يحتاج تحقق ويب) */
export function factsNeedingWebVerify(): CultureFact[] {
  return CULTURE_FACTS.filter((f) => f.needsWebVerify);
}
