// src/lib/training-tools.ts — الأدوات الخمس نصف المكتملة (D579 — D573 البند 5)
// مواصفة D573/الدستور §7: توقيت الامتحان التدريجي 50/75/100% · مفكك الديناصورات ·
// وضع مراجعة القصر · بنّاء العرض كأداة · مدرب المناقشة كأداة.
// المحركات والمحتوى قائم (exam-formats دقائق رسمية · vocab-network memoryPalace ·
// ars-vortrag/ars-meinung-gruende) — هنا النماذج الحتمية للواجهة فقط.
// كل المحتوى التعليمي من الخزانة (D126) — الهياكل هنا عناوين حصص لا تدريس.

/** أ) التوقيت التدريجي — §13: تدريب على 50% ثم 75% ثم 100% من الزمن الرسمي (exam-formats/goethe-*.json) */
export const TIMING_RATIOS = [50, 75, 100] as const;
export type TimingRatio = (typeof TIMING_RATIOS)[number];

export function scaledMinutes(officialMinutes: number, ratio: TimingRatio): number {
  return Math.round((officialMinutes * ratio) / 100);
}

/** دقائق رسمية موثّقة (exam-formats/goethe-*.json — أرقام مصدَّرة لا مُختلَقة) */
export const OFFICIAL_MINUTES: Record<string, Record<string, number>> = {
  A1: { hoeren: 20, lesen: 25, schreiben: 20, sprechen: 15 },
  A2: { hoeren: 30, lesen: 30, schreiben: 30, sprechen: 15 },
  B1: { hoeren: 40, lesen: 65, schreiben: 60, sprechen: 15 },
  B2: { hoeren: 40, lesen: 65, schreiben: 75, sprechen: 15 },
};

/** ب) مفكك الديناصورات — تفكيك الكلمات المركّبة الطويلة إلى أجزاء معروفة من المخزون */
export function dinoDecompose(word: string, knownForms: ReadonlySet<string>): string[] | null {
  const clean = word.trim().replace(/\s+/g, "");
  if (clean.length < 6) return null;
  const norm = (s: string) => s.toLowerCase();
  const parts: string[] = [];
  let rest = clean;
  while (rest.length > 0) {
    if (knownForms.has(norm(rest))) {
      parts.push(rest);
      return parts;
    }
    let found = -1;
    for (let i = rest.length - 3; i >= 3; i--) {
      const head = rest.slice(0, i);
      // حذف الفوغن-إس بين أجزاء المركّب: «Arbeit(s)platz»
      for (const h of [head, head.replace(/s$/, "")]) {
        if (knownForms.has(norm(h))) {
          found = i;
          break;
        }
      }
      if (found >= 0) break;
    }
    if (found < 0) return parts.length >= 1 ? [...parts, rest] : null;
    parts.push(rest.slice(0, found));
    rest = rest.slice(found);
  }
  return parts.length >= 2 ? parts : null;
}

/** أطول كلمة في المخزون — الديناصور الافتراضي (حتميّ) */
export function longestWord(forms: readonly string[]): string {
  return forms.reduce((a, b) => (b.length > a.length ? b : a), "");
}

/** ج) مراجعة القصر — مسار غرفة×3 خطوات (شبكة المفردات + قصر الذاكرة) */
export function palaceReviewPlan(
  stations: readonly { room: string; wordIds: readonly string[] }[],
  flow: readonly { order: number; kind: string; labelAr: string }[],
): { room: string; step: { order: number; kind: string; labelAr: string }; wordIds: readonly string[] }[] {
  const out: { room: string; step: { order: number; kind: string; labelAr: string }; wordIds: readonly string[] }[] = [];
  for (const st of stations) {
    for (const step of flow) {
      out.push({ room: st.room, step, wordIds: st.wordIds });
    }
  }
  return out;
}

/** د) بنّاء العرض — هيكل من ثلاث محطات (عناوين حصص — التدريس من ars-vortrag في الواجهة) */
export function presentationOutline(): { slot: string; slotAr: string; promptAr: string }[] {
  return [
    { slot: "einleitung", slotAr: "المقدمة", promptAr: "عرّف بنفسك وذكر موضوع العرض في جملة" },
    { slot: "hauptteil", slotAr: "الجسم", promptAr: "٢–٣ نقاط — كل نقطة جملة ومثال" },
    { slot: "schluss", slotAr: "الخاتمة", promptAr: "لخّص الفكرة وادعُ للحوار أو اشكر السامعين" },
  ];
}

/** هـ) مدرب المناقشة — إطار الرأي/الأسباب/الضد (التدريس من ars-meinung-gruende في الواجهة) */
export function discussionFrames(): { slot: string; slotAr: string; promptAr: string }[] {
  return [
    { slot: "meinung", slotAr: "الرأي", promptAr: "أنا أرى أن… / رأيي أن…" },
    { slot: "gruende", slotAr: "الأسباب", promptAr: "أولًا… ثانيًا… — لأنّ…" },
    { slot: "gegenargument", slotAr: "الضد", promptAr: "أفهم أن… ومع ذلك… (ردّ مهذّب)" },
  ];
}

/** بوابات المعالم (الدستور §7: المعلم 3=A2 الكامل يضم الديناصورات · 4=B1 يضم بنّاء العرض · 5=B2 يضم مدرب المناقشة) */
export function toolUnlocked(
  tool: "dino" | "presentation" | "discussion" | "timing" | "palace",
  currentIndex: number,
  lessonOrder: readonly string[],
  studiedWordCount: number,
): boolean {
  const idxOf = (prefix: string) => lessonOrder.findIndex((id) => id.startsWith(prefix));
  switch (tool) {
    case "timing":
      return true;
    case "palace":
      return studiedWordCount >= 3;
    case "dino":
      return currentIndex >= idxOf("a2-");
    case "presentation":
      return currentIndex >= idxOf("b1-");
    case "discussion":
      return currentIndex >= idxOf("b2-");
    default:
      return false;
  }
}
