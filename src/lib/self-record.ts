// src/lib/self-record.ts — التسجيل الذاتي للمقارنة (D307 · N-156/10)
// الخطة F005: «تردّد على مولر، تسجّل صوتك، تقارن بنفسك» — والقيد الدستوري: الحكم
// الآلي على اللسان محظور (D16/5-ب) — التسجيل لأذن المتعلم وحده، بلا تقييم ولا رفع
// ولا تخزين: Blob مؤقت على الجهاز يُمسَح بمغادرة السطر.
export type RecState = "idle" | "recording" | "recorded" | "unsupported" | "denied";

/** هل يدعم هذا المتصفح التسجيل؟ (يُحسَب عند العرض — لا افتراضات) */
export function recordingSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  const md = (navigator as Navigator & { mediaDevices?: { getUserMedia?: unknown } }).mediaDevices;
  return typeof md?.getUserMedia === "function" && typeof MediaRecorder !== "undefined";
}

/** مسجّل لقطة واحدة: بدء ← إيقاف ← Blob — والتيار يُغلَق فور الإيقاف */
export class SelfRecorder {
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;

  /** بدء التسجيل — denied = رفض الميكروفون (يُحترَم بلا لوم) */
  async start(): Promise<"recording" | "denied"> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return "denied";
    }
    this.chunks = [];
    this.rec = new MediaRecorder(this.stream);
    this.rec.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.rec.start();
    return "recording";
  }

  /** إيقاف التسجيل — يُعيد الصوت المسجّل ويغلق الميكروفون فوراً */
  stop(): Promise<Blob> {
    const rec = this.rec;
    if (!rec) return Promise.resolve(new Blob([]));
    return new Promise<Blob>((resolve) => {
      rec.onstop = () => resolve(new Blob(this.chunks, { type: rec.mimeType || "audio/webm" }));
      rec.stop();
      this.stream?.getTracks().forEach((t) => t.stop());
      this.stream = null;
      this.rec = null;
    });
  }
}

/** رابط تشغيل مؤقت للـBlob — undefined في بيئة بلا URL.createObjectURL */
export function blobUrlOf(blob: Blob): string | undefined {
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return undefined;
  return URL.createObjectURL(blob);
}

export function revokeBlobUrl(url: string): void {
  if (typeof URL !== "undefined" && typeof URL.revokeObjectURL === "function") URL.revokeObjectURL(url);
}
