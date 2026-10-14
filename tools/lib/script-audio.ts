// tools/lib/script-audio.ts — منطق السكربت الصوتي المشترك (D103): المولِّد (dialogue-splitter) والمدقِّق
// يستخدمان الدوال نفسها — فلا ينحرف ما يُولَّد عمّا يُفحص. دوال نقية بلا قرص (مختبرة وحدةً وحدة).
import type { AudioScript, AudioScriptLine, ScriptKind, ScriptSpeaker } from "../../content/schemas/index.js";
import { VOICE_ID, PINNED_VOICES } from "../../src/lib/audio.js";

/** نوع السكربت ← دور المسار (القانون 11 + D98: الأنثوي مسموح في character/dialogue فقط من هذه) */
export const ROLE_FOR_KIND: Readonly<Record<ScriptKind, "dialogue" | "announcement" | "character">> = {
  dialogue: "dialogue",
  announcement: "announcement",
  words: "character",
};

/** القانون 11: P0 حوارات (ونصوص الاستماع) | P2 تمييز أصوات متقاربة (Gleis/Gruß/Größe) */
export const PRIORITY_FOR_KIND: Readonly<Record<ScriptKind, "P0" | "P2">> = {
  dialogue: "P0",
  announcement: "P0",
  words: "P2",
};

export type CharacterVoices = Readonly<Record<string, string>>;

/** صوت المتحدث الثابت: المذيع = الرئيسي · الشخصية = characterVoices (مصدر الحقيقة الوحيد — المانيفست) */
export function expectedVoice(speaker: ScriptSpeaker, characterVoices: CharacterVoices): string {
  if (speaker === "announcer") return VOICE_ID;
  const v = characterVoices[speaker];
  if (!v) throw new Error(`لا صوت مثبَّت للشخصية ${speaker} في characterVoices`);
  if (!(PINNED_VOICES as readonly string[]).includes(v)) throw new Error(`صوت الشخصية ${speaker} غير مثبَّت: ${v}`);
  return v;
}

/** مسار ملف السطر — نسبي عن content/ */
export function scriptTrackFile(scriptId: string, lineId: string): string {
  return `audio/scripts/${scriptId}/${lineId}.opus`;
}

/** السرعة الفعلية المقيسة (كلمات/دقيقة) من النص ومدة المقطع — لا قيمة اسمية مختلقة */
export function measuredWpm(text: string, durationMs: number): number {
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return Math.max(1, Math.round((words / Math.max(durationMs, 1)) * 60_000));
}

export type ClipMeasurement = { durationMs: number; sizeBytes: number; hash: string; pcmSha256: string; rmsDb: number };

const LESSON_ID = /^a[12]-u\d+-d\d+$|^b[12]-u\d+-d\d+$/;

/** المسار كما يُكتب في المانيفست (حقول القياس كلها من الملف الفعلي) */
export function buildTrack(script: AudioScript, line: AudioScriptLine, voice: string, m: ClipMeasurement) {
  return {
    id: line.id,
    file: scriptTrackFile(script.id, line.id),
    role: ROLE_FOR_KIND[script.kind],
    ...(line.speaker === "announcer" ? {} : { characterId: line.speaker }),
    isGuest: false,
    voiceParams: { speaker: voice, speedWpm: measuredWpm(line.text, m.durationMs), lengthScale: script.lengthScale },
    textDe: line.text,
    priority: PRIORITY_FOR_KIND[script.kind],
    lessonRefs: script.usedIn.filter((u) => LESSON_ID.test(u)),
    ...m,
  };
}

export type TrackLike = {
  id: string; file: string; role: string; characterId?: string; textDe: string;
  voiceParams: { speaker: string; lengthScale?: number }; hash?: string;
};

/**
 * خطة التوليد: السطر يُعاد توليده فقط إذا تغيّر نصه أو صوته أو دوره أو ملفه — VITS عشوائي،
 * فإعادة التوليد بلا سبب تغيّر البصمات بلا فائدة (فخ موثَّق). fileHashOk يُمرَّر من القرص.
 */
export function planScript(
  script: AudioScript,
  tracksById: ReadonlyMap<string, TrackLike>,
  characterVoices: CharacterVoices,
  fileHashOk: (t: TrackLike) => boolean = () => true,
): { generate: AudioScriptLine[]; keep: AudioScriptLine[] } {
  const generate: AudioScriptLine[] = [];
  const keep: AudioScriptLine[] = [];
  for (const line of script.lines) {
    const t = tracksById.get(line.id);
    const same =
      t !== undefined &&
      t.textDe === line.text &&
      t.voiceParams.speaker === expectedVoice(line.speaker, characterVoices) &&
      (t.voiceParams.lengthScale ?? 1) === script.lengthScale &&
      t.role === ROLE_FOR_KIND[script.kind] &&
      t.file === scriptTrackFile(script.id, line.id) &&
      (t.characterId ?? "announcer") === line.speaker &&
      fileHashOk(t);
    (same ? keep : generate).push(line);
  }
  return { generate, keep };
}

export type ScriptIssue = { code: string; message: string };

/** تطابق السكربت ↔ المانيفست (يستخدمه المدقِّق) */
export function checkScriptAgainstManifest(
  script: AudioScript,
  tracksById: ReadonlyMap<string, TrackLike>,
  characterVoices: CharacterVoices,
): ScriptIssue[] {
  const issues: ScriptIssue[] = [];
  for (const line of script.lines) {
    const t = tracksById.get(line.id);
    if (!t) {
      issues.push({ code: "e-audio-script-missing", message: `سطر بلا مسار صوتي: ${script.id}/${line.id} — شغّل dialogue-splitter` });
      continue;
    }
    if (t.textDe !== line.text)
      issues.push({ code: "e-audio-script-text", message: `نص المسار ${line.id} لا يطابق السكربت: «${t.textDe}» ≠ «${line.text}»` });
    if (t.role !== ROLE_FOR_KIND[script.kind])
      issues.push({ code: "e-audio-script-role", message: `دور ${line.id} = ${t.role} والمتوقع ${ROLE_FOR_KIND[script.kind]}` });
    if ((t.characterId ?? "announcer") !== line.speaker)
      issues.push({ code: "e-audio-script-speaker", message: `متحدث ${line.id} = ${t.characterId ?? "announcer"} والسكربت يقول ${line.speaker}` });
    let want: string | null = null;
    try {
      want = expectedVoice(line.speaker, characterVoices);
    } catch (e) {
      issues.push({ code: "e-audio-character-voice", message: (e as Error).message });
    }
    if (want && t.voiceParams.speaker !== want)
      issues.push({ code: "e-audio-character-voice", message: `صوت ${line.id} = ${t.voiceParams.speaker} والصوت الثابت لـ${line.speaker} = ${want}` });
  }
  return issues;
}

/** الأعداد المكتوبة ↔ الأرقام (الصوت يقول «acht» والجواب «8») */
const NUMBER_WORDS: Readonly<Record<string, string>> = {
  "0": "null", "1": "eins", "2": "zwei", "3": "drei", "4": "vier", "5": "fünf", "6": "sechs", "7": "sieben",
  "8": "acht", "9": "neun", "10": "zehn", "11": "elf", "12": "zwölf", "20": "zwanzig", "30": "dreißig",
};
const STOP = new Set(["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "um", "von", "bis", "am", "im", "in", "zu", "und"]);

function tokens(s: string): string[] {
  return s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
}

/**
 * هل الجواب مسموع فعلاً في النص المنطوق؟ كل كلمة محتوى في الجواب يجب أن تُنطق
 * (الرقم 8 يقبل «acht» أو «8»). يمنع سؤال استماع جوابه غير موجود في الصوت.
 */
export function answerSupported(answer: string, transcript: string): { ok: boolean; missing: string[] } {
  const heard = new Set(tokens(transcript));
  const missing = tokens(answer)
    .filter((t) => !STOP.has(t))
    .filter((t) => !(heard.has(t) || (NUMBER_WORDS[t] !== undefined && heard.has(NUMBER_WORDS[t]!))));
  return { ok: missing.length === 0, missing };
}
