// @vitest-environment happy-dom
// tests/self-record.test.tsx — D307 · N-156/10: التسجيل الذاتي للمقارنة في الشادوينغ (F005)
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { LineRecorder, ShadowingRun } from "../src/components/ShadowingRun.js";
import { SelfRecorder, blobUrlOf, recordingSupported, revokeBlobUrl } from "../src/lib/self-record.js";
import type { AudioScript } from "../content/schemas/index.js";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** مسجّل وهمي: start يبث مقطعاً واحداً، وstop ينهي */
class FakeRecorder {
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  mimeType = "audio/webm";
  constructor(public stream: unknown) {}
  start() {
    this.ondataavailable?.({ data: new Blob(["snd"]) });
  }
  stop() {
    this.onstop?.();
  }
}

const stoppedTracks: string[] = [];
const fakeStream = () => ({ getTracks: () => [{ stop: () => void stoppedTracks.push("t") }] });

function mockMic(getUserMedia: (c: unknown) => Promise<unknown>) {
  Object.defineProperty(globalThis.navigator, "mediaDevices", { value: { getUserMedia }, configurable: true });
  (globalThis as Record<string, unknown>).MediaRecorder = FakeRecorder;
}

function unmockMic() {
  delete (globalThis.navigator as unknown as Record<string, unknown>).mediaDevices;
  delete (globalThis as Record<string, unknown>).MediaRecorder;
}

describe("D307 — محرك التسجيل الذاتي", () => {
  afterEach(() => {
    unmockMic();
    stoppedTracks.length = 0;
  });

  it("بلا ميكروفون في البيئة ← غير مدعوم", () => {
    unmockMic();
    expect(recordingSupported()).toBe(false);
  });

  it("رفض الميكروفون ← denied (يُحترَم)", async () => {
    mockMic(async () => {
      throw new Error("denied");
    });
    expect(recordingSupported()).toBe(true);
    expect(await new SelfRecorder().start()).toBe("denied");
  });

  it("بدء ← إيقاف ← Blob صوتي والتيار يُغلَق", async () => {
    mockMic(async () => fakeStream());
    const r = new SelfRecorder();
    expect(await r.start()).toBe("recording");
    const blob = await r.stop();
    expect(blob.size).toBeGreaterThan(0);
    expect(stoppedTracks).toEqual(["t"]); // الميكروفون أُغلِق فور الإيقاف
  });

  it("إيقاف بلا بدء ← Blob فارغ (لا كسر)", async () => {
    const blob = await new SelfRecorder().stop();
    expect(blob.size).toBe(0);
  });

  it("روابط الـBlob: إنشاء ومسح آمنان", () => {
    const realCreate = URL.createObjectURL;
    const realRevoke = URL.revokeObjectURL;
    const revoked: string[] = [];
    URL.createObjectURL = (() => "blob:fake") as typeof URL.createObjectURL;
    URL.revokeObjectURL = ((u: string) => void revoked.push(u)) as typeof URL.revokeObjectURL;
    try {
      expect(blobUrlOf(new Blob(["x"]))).toBe("blob:fake");
      revokeBlobUrl("blob:fake");
      expect(revoked).toEqual(["blob:fake"]);
    } finally {
      URL.createObjectURL = realCreate;
      URL.revokeObjectURL = realRevoke;
    }
  });
});

describe("D307 — مسجّل السطر في الواجهة", () => {
  let container: HTMLElement;
  let root: Root | null = null;
  const q = (id: string) => container.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const FAKE = {
    id: "t-rec",
    kind: "dialogue",
    level: "A1",
    title: { de: "T", ar: "ت" },
    usedIn: ["a1-u1-d3"],
    lines: [
      { id: "l1", speaker: "muller", text: "Guten Tag!" },
      { id: "l2", speaker: "yusuf", text: "Hallo!" },
    ],
  } as unknown as AudioScript;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });
  afterEach(async () => {
    if (root) await act(async () => root!.unmount());
    root = null;
    container.remove();
    unmockMic();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function mountRec() {
    root = createRoot(container);
    await act(async () => root!.render(<LineRecorder />));
  }

  async function clickWaited(el: Element | null, what: string) {
    if (!el) throw new Error(`${what} غير موجود`);
    await act(async () => {
      (el as HTMLElement).click();
      await new Promise((r) => setTimeout(r, 0));
    });
  }

  it("غير مدعوم ← ملاحظة لطيفة بلا زر تسجيل", async () => {
    unmockMic();
    await mountRec();
    expect(q("rec-note")!.textContent).toContain("يكفي تماماً");
    expect(q("rec-start")).toBeNull();
  });

  it("مرفوض ← ملاحظة احترام بلا لوم", async () => {
    mockMic(async () => {
      throw new Error("denied");
    });
    await mountRec();
    await clickWaited(q("rec-start"), "سجّل نفسك");
    expect(q("rec-note")!.textContent).toContain("لا بأس إطلاقاً");
  });

  it("التدفق الكامل: سجّل ← أوقف ← اسمع نفسك ← سجّل من جديد", async () => {
    mockMic(async () => fakeStream());
    const realCreate = URL.createObjectURL;
    URL.createObjectURL = (() => "blob:fake") as typeof URL.createObjectURL;
    const played: string[] = [];
    vi.stubGlobal("Audio", class {
      constructor(public src: string) {}
      play() {
        played.push(this.src);
        return Promise.resolve();
      }
    });
    try {
      await mountRec();
      expect(q("line-recorder")!.textContent).toContain("لا نقيّم نطقك آلياً");
      await clickWaited(q("rec-start"), "سجّل نفسك");
      expect(q("rec-live")!.textContent).toContain("يسجّل");
      await clickWaited(q("rec-stop"), "أوقف");
      expect(q("rec-play-mine")).not.toBeNull();
      expect(q("line-recorder")!.textContent).toContain("على جهازك وحده");
      await clickWaited(q("rec-play-mine"), "اسمع نفسك");
      expect(played).toEqual(["blob:fake"]);
      await clickWaited(q("rec-again"), "من جديد");
      expect(q("rec-start")).not.toBeNull();
    } finally {
      URL.createObjectURL = realCreate;
    }
  });

  it("مغادرة السطر تمسح التسجيل (لا بقاء)", async () => {
    mockMic(async () => fakeStream());
    const realCreate = URL.createObjectURL;
    const realRevoke = URL.revokeObjectURL;
    const revoked: string[] = [];
    URL.createObjectURL = (() => "blob:fake") as typeof URL.createObjectURL;
    URL.revokeObjectURL = ((u: string) => void revoked.push(u)) as typeof URL.revokeObjectURL;
    try {
      root = createRoot(container);
      await act(async () => root!.render(<ShadowingRun script={FAKE} onFinish={() => {}} />));
      await clickWaited(q("rec-start"), "سجّل نفسك");
      await clickWaited(q("rec-stop"), "أوقف");
      expect(q("rec-play-mine")).not.toBeNull();
      await clickWaited(q("shadow-said"), "ردّدت");
      expect(q("shadow-counter")!.textContent).toContain("سطر 2 من 2");
      expect(revoked).toEqual(["blob:fake"]); // مفتاح السطر بدّل المكوّن ← مسح تلقائي
    } finally {
      URL.createObjectURL = realCreate;
      URL.revokeObjectURL = realRevoke;
    }
  });

  it("«ردّدت» تعمل دائماً بلا تسجيل (التسجيل اختياري صرف)", async () => {
    unmockMic();
    root = createRoot(container);
    let finished = 0;
    await act(async () => root!.render(<ShadowingRun script={FAKE} onFinish={() => finished++} />));
    await clickWaited(q("shadow-said"), "ردّدت 1");
    await clickWaited(q("shadow-said"), "ردّدت 2");
    await clickWaited(q("shadow-finish"), "سجّل");
    expect(finished).toBe(1);
  });
});
