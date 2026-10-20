// real-tasks.ts — E15 محرك المهام الحقيقية | M2-ب
// المصدر: task-based language teaching (Ellis) · D31 (أسماء حيّة — A/B لا أسماء حقيقية) · §2.5
// القاعدة الحديدية: **كل مهمة لها هدف تواصلي معلن** — لا مهمة بلا هدف (إلزامي في التسجيل).

export type DialogueLine = { speaker: "A" | "B"; de: string; ar: string };

const D = (lines: DialogueLine[]): readonly DialogueLine[] => Object.freeze(lines);

export type RealTask = {
  id: string;
  setting: "kafee" | "bahnhof" | "apotheke" | "laden";
  titleAr: string;
  /** الهدف التواصلي المعلن — إلزامي غير فارغ */
  goalAr: string;
  sceneAr: string;
  dialogue: readonly DialogueLine[];
  successCriteriaAr: readonly string[];
};

/** مهام A1 الثلاث — حوارات مألفة (D31: A/B) على نسق دروس الوحدة */
export const A1_TASKS: readonly RealTask[] = Object.freeze([
  {
    id: "task-kafee",
    setting: "kafee",
    titleAr: "في المقهى",
    goalAr: "أن تطلب مشروباً وتفهم السؤال (كبير أم صغير).",
    sceneAr: "أنت في مقهى ألماني. النادل ينتظر طلبك.",
    dialogue: D([
      { speaker: "A", de: "Guten Tag! Was darf es sein?", ar: "مرحباً! ماذا تُحب؟" },
      { speaker: "B", de: "Einen Kaffee, bitte.", ar: "قهوة من فضلك." },
      { speaker: "A", de: "Groß oder klein?", ar: "كبيرة أم صغيرة؟" },
      { speaker: "B", de: "Groß, bitte. Danke!", ar: "كبيرة من فضلك. شكراً!" },
    ]),
    successCriteriaAr: Object.freeze([
      "طلبت مشروباً بصيغة Akkusativ (einen Kaffee).",
      "استخدمت bitte.",
      "فهمت السؤال groß أو klein وأجبت.",
    ]),
  },
  {
    id: "task-bahnhof",
    setting: "bahnhof",
    titleAr: "في محطة القطار",
    goalAr: "أن تسأل عن الرصيف وتفهم الإجابة.",
    sceneAr: "أنت في محطة قطار ألمانية وقطارك بعد دقائق.",
    dialogue: D([
      { speaker: "B", de: "Entschuldigung, wo ist Gleis drei?", ar: "عفواً، أين الرصيف 3؟" },
      { speaker: "A", de: "Dort geradeaus, dann rechts.", ar: "هناك إلى الأمام، ثم يميناً." },
      { speaker: "B", de: "Danke schön!", ar: "شكراً جزيلاً!" },
      { speaker: "A", de: "Gern geschehen!", ar: "على الرحب!" },
    ]),
    successCriteriaAr: Object.freeze([
      "سألت بـ wo ist…",
      "فهمت الاتجاهات (geradeaus/rechts).",
      "شكرتَ الطرف الآخر.",
    ]),
  },
  {
    id: "task-apotheke",
    setting: "apotheke",
    titleAr: "في الصيدلية",
    goalAr: "أن تصف ألاماً بسيطة وتفهم السؤال «منذ متى؟».",
    sceneAr: "أنت في صيدلية ألمانية. الصيدلي يساعدك.",
    dialogue: D([
      { speaker: "B", de: "Ich habe Kopfschmerzen.", ar: "عندي صداع." },
      { speaker: "A", de: "Seit wann?", ar: "منذ متى؟" },
      { speaker: "B", de: "Seit gestern.", ar: "منذ الأمس." },
      { speaker: "A", de: "Das hilft gut.", ar: "هذا يُفيد كثيراً." },
    ]),
    successCriteriaAr: Object.freeze([
      "وصفتَ ألاماً بـ ich habe + …schmerzen.",
      "فهمتَ seit wann وأجبت بـ seit gestern.",
    ]),
  },
]);

/** التسجيل: **الهدف معلن إلزاماً** — مهمة بلا هدف = مرفوضة */
export function registerTask(t: RealTask): RealTask {
  if (!t.goalAr.trim()) throw new Error("مهمة بلا هدف تواصلي معلن مرفوضة (Ellis)");
  if (t.dialogue.length === 0) throw new Error("مهمة بلا حوار مرفوضة");
  if (t.successCriteriaAr.length === 0) throw new Error("مهمة بلا معايير نجاح مرفوضة");
  return t;
}

export type TaskStep = {
  order: number;
  kind: "goal" | "attempt" | "model" | "retry";
  labelAr: string;
};

/** تدفق المهمة: الهدف يُعلن أولاً ← محاولتك ← الحوار النموذجي ← إعادة (§2.5) */
export function taskFlow(t: RealTask): TaskStep[] {
  return [
    { order: 1, kind: "goal", labelAr: `هدفك: ${t.goalAr}` },
    { order: 2, kind: "attempt", labelAr: "حاول وحدك أولاً — بلا نموذج" },
    { order: 3, kind: "model", labelAr: "الآن قارن بالحوار النموذجي" },
    { order: 4, kind: "retry", labelAr: "أعد المحاولة بصوت أوضح" },
  ];
}

/** تقييم المهمة — معايير النجاح المعلنة فقط (لا معايير مخفية) */
export function evaluateTask(t: RealTask, achieved: readonly string[]): {
  success: boolean;
  met: string[];
  missing: string[];
} {
  const met = t.successCriteriaAr.filter((c) => achieved.includes(c));
  const missing = t.successCriteriaAr.filter((c) => !achieved.includes(c));
  return { success: missing.length === 0, met, missing };
}
