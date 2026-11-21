// src/lib/suspect-queue.ts — القانون 27: زر «أشك أن هذا خطأ» في كل تمرين → طابور G1 فوراً
// طابور محلي (تكلفة صفر · بلا رفع) — يُراجَع بأدوات G1 الحتمية.
export interface SuspectEntry {
  /** مصدر الشك: lesson/practice-s2-i3 أو quiz-u3-d5-q4 */
  source: string;
  /** ما اشتبه به المتعلم: نص الإجابة أو الجملة */
  text: string;
  at: string; // ISO
}

const KEY = "schluessel.g1-suspects";

export function loadSuspects(): SuspectEntry[] {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    return raw ? (JSON.parse(raw) as SuspectEntry[]) : [];
  } catch {
    return [];
  }
}

export function addSuspect(source: string, text: string): number {
  const all = loadSuspects();
  all.push({ source, text, at: new Date().toISOString() });
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(all));
  } catch {
    /* بلا تخزين — الشك يبقى في الجلسة ولا يُفقد بصمت */
  }
  return all.length;
}
