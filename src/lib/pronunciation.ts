// pronunciation.ts — E10 محرك النطق | M2-أ
// المصادر: D18 (مادة علاج النطق — مخارج موثّقة حرفياً) + DaF-Phonetik — «مراجعة مخارج كل صوت قبل النشر (لا تخمين)»
// الوظيفة: خرائط الفم + دورة تدريب r/ch/ü + تسجيل قبل/بعد — **بلا نقاط ولا تصحيح آلي للنطق**
// (D16: لا نُقّم النطق آلياً — التسجيل «لأذنك أنت»).

export type SoundCard = {
  id: "r" | "ch" | "ue";
  de: string;
  arName: string;
  /** وصف المخرج كما ورد في D18 حرفياً — لا نخترع وصفاً */
  articulationDe: string;
  articulationAr: string;
  source: "D18";
  drillWords: readonly string[];
};

/** البطاقات الثلاث — النص الألماني مقتبس من D18 (أوراق العلاج) */
export const SOUND_CARDS: readonly SoundCard[] = Object.freeze([
  {
    id: "r",
    de: "r",
    arName: "الراء الألمانية",
    articulationDe: "Zungenspitze an der unteren Schneidezähne — Zunge runter!",
    articulationAr: "طرف اللسان عند الأسنان الأمامية السفلية — اللسان للأسفل!",
    source: "D18",
    drillWords: Object.freeze(["Rad", "Rabe", "riecht", "rollen"]),
  },
  {
    id: "ch",
    de: "ch",
    arName: "الخاء الألمانية (ich-Laut)",
    articulationDe: "Zunge hinter den unteren Schneidezähnen",
    articulationAr: "اللسان خلف الأسنان الأمامية السفلية (قرب الحنك — بلا احتكاك عربي)",
    source: "D18",
    drillWords: Object.freeze(["Kirche", "Küche", "Milch", "Märchen"]),
  },
  {
    id: "ue",
    de: "ü",
    arName: "الأوملاوت ü",
    articulationDe: "Lippen wie bei einem u, aber die Zunge nimmt die Position des i ein",
    articulationAr: "الشفتان كأنك تنطق u، واللسان يأخذ وضع i",
    source: "D18",
    drillWords: Object.freeze(["Tür", "müde", "Müller"]),
  },
]);

export type DrillStep = {
  order: number;
  kind: "hoeren" | "muenzkarte" | "nachsprechen" | "aufnehmen-vorher" | "aufnehmen-nachher" | "selbstvergleich";
  labelAr: string;
};

/** دورة التدريب: استمع ← تحقّق من خريطة الفم ← كرّر ← سجّل قبل ← تدرب ← سجّل بعد ← قارن بسمعك */
export function drillCycle(soundId: SoundCard["id"]): DrillStep[] {
  const card = SOUND_CARDS.find((c) => c.id === soundId);
  if (!card) throw new Error(`صوت غير معروف: ${soundId}`);
  return [
    { order: 1, kind: "hoeren", labelAr: `اسمع ${card.de} ثم ${card.drillWords[0]}` },
    { order: 2, kind: "muenzkarte", labelAr: `خريطة الفم: ${card.articulationAr}` },
    { order: 3, kind: "aufnehmen-vorher", labelAr: "سجّل قبل التدريب (لأذنك أنت)" },
    { order: 4, kind: "nachsprechen", labelAr: "كرّر الكلمات ببطء أمام المرآة" },
    { order: 5, kind: "aufnehmen-nachher", labelAr: "سجّل بعد التدريب" },
    { order: 6, kind: "selbstvergleich", labelAr: "قارن التسجيلين بسمعك أنت — بلا درجات" },
  ];
}

export function buildPronunciationSession(soundIds?: readonly SoundCard["id"][]): {
  sounds: SoundCard[];
  cycles: { soundId: SoundCard["id"]; steps: DrillStep[] }[];
} {
  const ids = soundIds ?? SOUND_CARDS.map((c) => c.id);
  const sounds = ids.map((id) => {
    const c = SOUND_CARDS.find((x) => x.id === id);
    if (!c) throw new Error(`صوت غير معروف: ${id}`);
    return c;
  });
  return { sounds, cycles: ids.map((id) => ({ soundId: id, steps: drillCycle(id) })) };
}

/** المقارنة قبل/بعد = ملاحظاتك أنت فقط — لا درجة ولا نسبة (قاعدة D16) */
export function selfCompare(beforeNote: string, afterNote: string): {
  noteAr: string;
  before: string;
  after: string;
  score: null;
} {
  return {
    noteAr: "أنت الحكم الوحيد هنا — التسجيل لأذنك. لا نُعطي درجات للنطق.",
    before: beforeNote,
    after: afterNote,
    score: null,
  };
}
