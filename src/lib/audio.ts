// src/lib/audio.ts — هوية الصوت المثبتة (D20 — استقرار الأصوات عبر الجلسات)
/** صوت Piper الوحيد المثبّت — كل المسارات (الشخصيات الثمانية + الكلمات) تشير إليه دائماً */
export const VOICE_ID = "de_DE-thorsten-medium";
/** محرك التوليد المحلي — لا API، لا اشتراك (D20) */
export const AUDIO_ENGINE = "piper-tts-local" as const;
/** رخصة صوت Thorsten الموثقة من MODEL_CARD */
export const VOICE_LICENSE = "CC0 (Thorsten-Voice)";
/** حدود مقاطع الكلم (مواصفات الصوت): ≤1.5s وRMS داخل [-20..-14] dB */
export const WORD_CLIP_MAX_SEC = 1.5;
export const RMS_WINDOW_DB: readonly [number, number] = [-20, -14];
