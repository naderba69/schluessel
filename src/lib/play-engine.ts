// play-engine.ts — E20 محرك الترفيه | M3
// المصادر: gamification هادئة (بلا ضغط — D23) · القاعدة: **الألعاب تعيد استخدام مفرداتك المدروسة فقط**
// لا مؤقتات ولا نقاط ضغط ولا «أسرع!» — اللعب تثبيت مقنّع.

export type LetterFeedback = "green" | "yellow" | "gray";

export const PLAY_RULES_AR: readonly string[] = Object.freeze([
  "بلا مؤقت — العب على راحتك.",
  "بلا نقاط ضغط ولا سلاسل (D23).",
  "كل كلمات اللعبة من مفرداتك المدروسة أنت.",
]);

const LETTERS = /^[a-zäöüß]{5}$/;

/** Wordle ألماني — الكلمة **من مفرداتك المدروسة فقط** (5 حروف) */
export function makeWordle(studiedWords: readonly string[]): { word: string; rulesAr: readonly string[] } {
  const pool = studiedWords.map((w) => w.toLowerCase()).filter((w) => LETTERS.test(w));
  if (pool.length === 0) throw new Error("لا Wordle بلا كلمات مدروسة مناسبة (5 حروف)");
  return { word: pool[0]!, rulesAr: PLAY_RULES_AR };
}

/** تغذية التخمين: green في مكانه · yellow موجود في مكان آخر · gray غير موجود */
export function guessFeedback(guess: string, target: string): LetterFeedback[] {
  const g = guess.toLowerCase();
  const t = target.toLowerCase();
  if (g.length !== t.length) throw new Error("الطول غير مطابق");
  const out: LetterFeedback[] = Array(g.length).fill("gray");
  const remaining = t.split("");
  for (let i = 0; i < g.length; i++) {
    if (g[i] === t[i]) {
      out[i] = "green";
      remaining[i] = " ";
    }
  }
  for (let i = 0; i < g.length; i++) {
    if (out[i] === "green") continue;
    const j = remaining.indexOf(g[i]!);
    if (j !== -1) {
      out[i] = "yellow";
      remaining[j] = " ";
    }
  }
  return out;
}

export type StoryBlank = { id: string; ar: string };

export type InteractiveStory = {
  id: string;
  titleAr: string;
  lines: readonly { textAr: string; blank?: StoryBlank }[];
  /** كل الكلمات المملوءة من مفرداتك — لا كلمة خارج المدروس */
  fillWords: readonly string[];
};

/** قصة تفاعلية — الكلمات المطلوب ملؤها من مفرداتك المدروسة فقط */
export function makeStory(
  studiedWords: readonly string[],
  titleAr: string,
  lines: readonly { textAr: string; blank?: StoryBlank }[],
): InteractiveStory {
  const fills = studiedWords.slice(0, lines.filter((l) => l.blank).length);
  const blanks = lines.filter((l) => l.blank).length;
  if (blanks > 0 && studiedWords.length < blanks) {
    throw new Error("لا قصة بلا مفردات مدرسة تكفي الفراغات");
  }
  return { id: `story-${titleAr}`, titleAr, lines: Object.freeze([...lines]), fillWords: Object.freeze([...fills]) };
}

/** الألغاز — كلماتك أنت (تشويش حرفي من مفرداتك) */
export function makeAnagram(studiedWords: readonly string[], index = 0): { scrambled: string; answer: string } {
  const pool = studiedWords.filter((w) => w.length >= 3);
  if (pool.length === 0) throw new Error("لا لغز بلا كلمات مدروسة");
  const answer = pool[index % pool.length]!;
  const scrambled = answer.split("").reverse().join("");
  return { scrambled, answer };
}

/** تحقق: هل الكلمة من المدروسة فعلاً؟ (حارس الألعاب) */
export function isStudied(word: string, studiedWords: readonly string[]): boolean {
  return studiedWords.some((w) => w.toLowerCase() === word.toLowerCase());
}
