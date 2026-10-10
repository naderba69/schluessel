// advanced-listening.ts — E09 محرك الاستماع المتقدم | M2-أ
// المصادر: تدريب الإدراك السمعي (Logan/Lively/Pisoni 1991) · أزواج D16 (Bär/Bett…) · D23 (بلا ضغط)
// الوظيفة: أزواج بديهة (minimal pairs) + ضجيج تدريجي + أخبار بطيئة — إدراك قبل نطق.

export type MinimalPair = {
  id: string;
  deA: string;
  deB: string;
  arA: string;
  arB: string;
  /** الخطر الصوتي المميِّز بين الطرفين (من خريطة 10.1) */
  risk: string;
  hintAr: string;
};

/** أزواج اختبار D16 نفسها (Bär/Bett · Kirche/Kirsche · Tier/Tür) — لا تُبدل */
export const D16_MINIMAL_PAIRS: readonly MinimalPair[] = Object.freeze([
  {
    id: "paar-baer-bett",
    deA: "Bär",
    deB: "Bett",
    arA: "دبّ",
    arB: "سرير",
    risk: "ä لا e",
    hintAr: "الـ ä في Bär أقصر وأماميّ؛ الـ e في Bett قصير ووسطي.",
  },
  {
    id: "paar-kirche-kirsche",
    deA: "Kirche",
    deB: "Kirsche",
    arA: "كنيسة",
    arB: "حبّة شيري",
    risk: "ch لا rsch",
    hintAr: "الـ ch هسيّ خلف الأسنان؛ Kirsche فيها راء ثم شين مفصولتان.",
  },
  {
    id: "paar-tier-tuer",
    deA: "Tier",
    deB: "Tür",
    arA: "حيوان",
    arB: "باب",
    risk: "ie لا ü",
    hintAr: "الـ ie ممدودة (تُنطق إي طويلاً)؛ الـ ü شفوي أمامي كما في müde.",
  },
]);

/** مراحل الضجيج التدريجي — تصعد بنسبة نجاح ≥ 80% فقط (صعوبات مرغوبة بلا ضغط) */
export const NOISE_STAGES = ["clean", "soft", "medium", "full"] as const;
export type NoiseStage = (typeof NOISE_STAGES)[number];

export type ListeningStep = {
  order: number;
  kind: "hoeren" | "unterscheiden" | "nachsprechen" | "transkript";
  pairId?: string;
  /** سرعة التشغيل لخطوات الاستماع (0.7 → 1.0) */
  speed?: number;
  labelAr: string;
};

export type ListeningSession = {
  sessionId: string;
  noise: NoiseStage;
  steps: ListeningStep[];
};

export function buildListeningSession(opts?: {
  pairs?: readonly MinimalPair[];
  noise?: NoiseStage;
  withSlowNews?: boolean;
}): ListeningSession {
  const pairs = opts?.pairs ?? D16_MINIMAL_PAIRS;
  const noise = opts?.noise ?? "clean";
  const steps: ListeningStep[] = [];
  let order = 1;
  for (const p of pairs) {
    steps.push({ order: order++, kind: "hoeren", pairId: p.id, speed: 1.0, labelAr: `اسمع ${p.deA} و${p.deB}` });
    steps.push({ order: order++, kind: "unterscheiden", pairId: p.id, labelAr: "أيّهما سمعت؟" });
    steps.push({ order: order++, kind: "nachsprechen", pairId: p.id, labelAr: "كرّر ببطء" });
  }
  if (opts?.withSlowNews) {
    // أخبار بطيئة: استماع أول بالسرعة 0.7 (الجوهر) ← 0.85 (التفاصيل) ← 1.0 — **النص المكتوب أخيراً**
    for (const speed of SLOW_SPEEDS) {
      steps.push({ order: order++, kind: "hoeren", speed, labelAr: `استماع بسرعة ${speed} — بلا نص` });
    }
    steps.push({ order: order++, kind: "transkript", labelAr: "الآن اكشف النص وتحقق" });
  }
  return { sessionId: `listen-${noise}-${pairs.length}`, noise, steps };
}

/** سرعات الأخبار البطيئة — ثابتة ومعلنة (لا تخفيض مفاجئ) */
export const SLOW_SPEEDS: readonly number[] = Object.freeze([0.7, 0.85, 1.0]);

/** بوابة الترقية: ≥ 80% تمييز صحيح = تقدّم مرحلة الضجيج، وإلا البقاء (بلا لوم) */
export function judgeDiscrimination(correct: number, total: number, current: NoiseStage = "clean"): {
  advance: boolean;
  nextNoise: NoiseStage;
  current: NoiseStage;
  noteAr: string;
} {
  if (total <= 0) throw new Error("لا جلسة بلا أسئلة");
  const rate = correct / total;
  const advance = rate >= 0.8;
  return {
    advance,
    nextNoise: advanceNoise(current, advance),
    current,
    noteAr: advance ? "تمييز ممتاز — تقدّمنا مرحلة." : "الإدراك ينمو بالتكرار — كرّر المرحلة نفسها.",
  };
}

/** ترقية الضجيج من مرحلة للي تليها (البقاء عند العتبة) */
export function advanceNoise(current: NoiseStage, advance: boolean): NoiseStage {
  const i = NOISE_STAGES.indexOf(current);
  if (!advance || i < 0 || i === NOISE_STAGES.length - 1) return current;
  return NOISE_STAGES[i + 1]!;
}

/** لا ترقية بلا نجاح — تحقق مغلق على النسب */
export function isTranscriptAfterListening(steps: ListeningStep[]): boolean {
  const firstTranscript = steps.findIndex((s) => s.kind === "transkript");
  if (firstTranscript === -1) return true;
  const lastHearing = steps.map((s) => s.kind).lastIndexOf("hoeren");
  return firstTranscript > lastHearing;
}
