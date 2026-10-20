// src/lib/story.ts — القصة المتصلة أمام المتعلم (D193 — N-003 · القانون 12)
// الجملة مولَّدة من أول سطر في حوار الدرس (content/story/*.json ← tools/dev/story-sentences.ts).
// تُعرض في محطة الخلاصة: «سطر القصة اليوم» + السطور السابقة (القصة حتى الآن) — تذكير بالخيط لا محتوى جديد.
import type { CharacterId, StoryBook, StorySentence } from "../../content/schemas/index.js";

/** أسماء الشخصيات الثمانية بالعربية كما تظهر على الشاشة (D20‑أ) */
export const CHARACTER_NAME_AR: Record<CharacterId, string> = {
  yusuf: "يوسف", mueller: "السيد مولر", lena: "لينا", ayse: "عائشة",
  "frau-berg": "السيدة بيرغ", thomas: "توماس", "frau-schmidt": "السيدة شميت", "dr-weber": "الدكتور فيبر",
};

export type StoryLine = { id: string; speakerAr: string; de: string; contextAr: string };

const toLine = (s: StorySentence): StoryLine => ({ id: s.id, speakerAr: CHARACTER_NAME_AR[s.speaker], de: s.de, contextAr: s.contextAr });

/** سطر قصة الدرس (أو null لدرس بلا حوار بعدُ — لا سطر مخترع) */
export function storyLineFor(lessonId: string, books: readonly StoryBook[]): StoryLine | null {
  for (const b of books) { const s = b.sentences.find((x) => x.lessonId === lessonId); if (s) return toLine(s); }
  return null;
}

/** القصة حتى هذا الدرس (بدونه) بترتيب الدفتر — آخر `limit` سطور */
export function storySoFar(lessonId: string, books: readonly StoryBook[], limit = 3): StoryLine[] {
  for (const b of books) {
    const i = b.sentences.findIndex((x) => x.lessonId === lessonId);
    if (i >= 0) return b.sentences.slice(Math.max(0, i - limit), i).map(toLine);
  }
  return [];
}
