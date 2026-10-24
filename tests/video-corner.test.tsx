// @vitest-environment happy-dom
// tests/video-corner.test.tsx — D308 · N-156/11: ركن الفيديو أوفلاين-أولاً (§2.12 + §34)
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { VideoEntry, VideoShelf } from "../content/schemas/index.js";
import { ALL_VIDEO } from "../src/lesson-packs.js";
import {
  VIDEO_COMING_AR,
  VIDEO_INTERNET_NOTE_AR,
  VIDEO_OFFLINE_AR,
  comingVideos,
  verifiedVideos,
  videoOfDay,
} from "../src/lib/video-corner.js";
import { VideoCorner } from "../src/components/VideoCorner.js";
import { BLAME_WORDS } from "../src/lib/coach-engine.js";
import { hasBlame } from "../src/lib/warmth-engine.js";

const entry = (over: Partial<VideoEntry> & { id: string }): VideoEntry => ({
  titleDe: `T-${over.id}`,
  titleAr: `ع-${over.id}`,
  source: "DW",
  url: null,
  level: "A1",
  minutes: 5,
  fixation: { q: "سؤال؟", a: "توجيه." },
  verified: false,
  ...over,
});
const shelfOf = (entries: VideoEntry[]): VideoShelf => ({
  schemaVersion: "1.0.0",
  id: "shelf-test",
  level: "A1",
  entries,
});

describe("D308 — محرك الركن: المتحقق وحده معروض", () => {
  const v1 = entry({ id: "v1", url: "https://example.com/1", verified: true });
  const v2 = entry({ id: "v2", url: "https://example.com/2", verified: true });
  const c1 = entry({ id: "c1" });

  it("التقسيم: متحقق برابط ← عرض · غير متحقق ← قادم", () => {
    const shelf = shelfOf([v1, c1]);
    expect(verifiedVideos(shelf).map((e) => e.id)).toEqual(["v1"]);
    expect(comingVideos(shelf).map((e) => e.id)).toEqual(["c1"]);
  });

  it("فيديو اليوم: تناوب حتمي على المتحقق — وفارغ ← null", () => {
    expect(videoOfDay(0, [v1, v2])!.id).toBe("v1");
    expect(videoOfDay(1, [v1, v2])!.id).toBe("v2");
    expect(videoOfDay(2, [v1, v2])!.id).toBe("v1");
    expect(videoOfDay(0, [])).toBeNull();
  });

  it("رف A1 الحقيقي: بنود موجودة، والرابط والتحقق متلازمان دائماً (§34)", () => {
    const shelf = ALL_VIDEO.find((s) => s.level === "A1")!;
    expect(shelf.entries.length).toBeGreaterThan(0);
    for (const e of shelf.entries) expect(e.url !== null).toBe(e.verified);
  });

  it("نصوص الركن بلا لوم في القائمتين (D23)", () => {
    const all = `${VIDEO_COMING_AR} ${VIDEO_INTERNET_NOTE_AR} ${VIDEO_OFFLINE_AR}`;
    expect(hasBlame(all)).toBe(false);
    for (const w of BLAME_WORDS) expect(all).not.toContain(w);
  });
});

describe("D308 — عرض الركن", () => {
  it("بلا متحقق: «قادم» بلا روابط + ملاحظة الإنترنت + البديل الأوفلاين", () => {
    const html = renderToStaticMarkup(<VideoCorner shelf={shelfOf([entry({ id: "c1" }), entry({ id: "c2" })])} />);
    expect(html).toContain('data-testid="video-corner"');
    expect(html).toContain('data-testid="video-coming"');
    expect(html).toContain("قادم — يُتحقق رابطه قبل الإطلاق");
    expect(html).not.toContain("video-day-link");
    expect(html).not.toContain("<a ");
    expect(html).toContain("يحتاج إنترنت");
    expect(html).toContain("بلا إنترنت؟");
  });

  it("مع متحقق: فيديو اليوم برابط https + سؤال التثبيت", () => {
    const html = renderToStaticMarkup(
      <VideoCorner shelf={shelfOf([entry({ id: "v1", url: "https://example.com/1", verified: true })])} />,
    );
    expect(html).toContain('data-testid="video-of-day"');
    expect(html).toContain('href="https://example.com/1"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain("سؤال التثبيت");
    expect(html).toContain("أظهر التوجيه");
  });

  it("الرف الحقيقي يُعرض: 3 قادم ولا رابط (حالة الريادة)", () => {
    const html = renderToStaticMarkup(<VideoCorner />);
    expect(html.match(/data-video-id=/g)).toHaveLength(3);
    expect(html).not.toContain("<a ");
  });
});
