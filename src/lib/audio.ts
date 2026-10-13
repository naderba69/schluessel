// src/lib/audio.ts — هوية الصوت المثبتة (D20 — استقرار الأصوات عبر الجلسات)
/** صوت Piper الوحيد المثبّت — كل المسارات (الشخصيات الثمانية + الكلمات) تشير إليه دائماً */
export const VOICE_ID = "de_DE-thorsten-medium";
/** D98: الصوت الأنثوي المثبَّت للحوارات/الضيوف (kerstin — MIT) — لا تذبذب: دوران محددة فقط */
export const VOICE_ID_FEMALE = "de_DE-kerstin-low";
/** D20+D98: الأصوات المسموحة حصراً (مثبَّتان عبر الجلسات) */
export const PINNED_VOICES = [VOICE_ID, VOICE_ID_FEMALE] as const;
/** D98: الأدوار المسموحة للصوت الأنثوي (بقية الأدوار = الصوت الرئيسي) */
export const FEMALE_ROLES = ["character", "guest", "dialogue"] as const;
/** محرك التوليد المحلي — لا API، لا اشتراك (D20) */
export const AUDIO_ENGINE = "piper-tts-local" as const;
/** رخصة صوت Thorsten الموثقة من MODEL_CARD */
export const VOICE_LICENSE = "CC0 (Thorsten-Voice)";
/** حدود مقاطع الكلم (مواصفات الصوت): ≤1.5s وRMS داخل [-20..-14] dB */
export const WORD_CLIP_MAX_SEC = 1.5;
export const RMS_WINDOW_DB: readonly [number, number] = [-20, -14];
