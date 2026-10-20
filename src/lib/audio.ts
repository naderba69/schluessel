// src/lib/audio.ts — هوية الأصوات المثبتة (D20 — استقرار الأصوات عبر الجلسات · D98/D103 — صوتان)
/** الصوت الرئيسي المثبّت — الكلمات والإعلانات والشخصيات الذكور */
export const VOICE_ID = "de_DE-thorsten-medium";
/** D98/D103: الصوت الأنثوي المثبَّت في git — للشخصيات الإناث في الحوار فقط (لا تذبذب: أدوار محددة) */
export const VOICE_ID_FEMALE = "de_DE-kerstin-low";
/** D20+D98: الأصوات المسموحة حصراً (مثبَّتان عبر الجلسات) */
export const PINNED_VOICES = [VOICE_ID, VOICE_ID_FEMALE] as const;
export type PinnedVoice = (typeof PINNED_VOICES)[number];
/** D98: الأدوار المسموحة للصوت الأنثوي (بقية الأدوار = الصوت الرئيسي) */
export const FEMALE_ROLES = ["character", "guest", "dialogue"] as const;

/**
 * D28/D37/D103: البصمات الدائمة لملفي الصوت الملتزمين في git (`tools/piper-voices/`) — مقفولة باختبار.
 * thorsten: مُثبَّت بقرار المالك (D37). kerstin: md5 يطابق الفهرس الرسمي rhasspy/piper (voices.json)
 * حرفياً `1d5e5788cfddb04cbb34418f2841931e` — جُلب بالتحقق في D103 (أمر المالك 2026-10-14).
 */
export const VOICE_PINS: Readonly<Record<PinnedVoice, { sha256: string; bytes: number; license: string }>> = {
  "de_DE-thorsten-medium": {
    sha256: "7e64762d8e5118bb578f2eea6207e1a35a8e0c30595010b666f983fc87bb7819",
    bytes: 63_201_294,
    license: "CC0 (Thorsten-Voice — MODEL_CARD)",
  },
  "de_DE-kerstin-low": {
    sha256: "d352a7641892cebf2903859af94e9ba81a141110215fe3943bcda7f7da401b7a",
    bytes: 63_104_526,
    license: "CC0 (dataset rhasspy/dataset-voice-kerstin — MODEL_CARD)",
  },
};

/** محرك التوليد المحلي — لا API، لا اشتراك (D20) */
export const AUDIO_ENGINE = "piper-tts-local" as const;
/** رخصة الصوتين الموثقة من MODEL_CARD لكل منهما (D103) */
export const VOICE_LICENSE = "CC0 (Thorsten-Voice) + CC0 (dataset-voice-kerstin)";
/** حدود مقاطع الكلم (مواصفات الصوت): ≤1.5s وRMS داخل [-20..-14] dB */
export const WORD_CLIP_MAX_SEC = 1.5;
export const RMS_WINDOW_DB: readonly [number, number] = [-20, -14];
