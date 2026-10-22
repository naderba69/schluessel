// @vitest-environment node
// tests/sw-notify.test.ts — D272: النقر على إشعار النافذة يفتح التطبيق على الشاشة.
// يشغّل public/sw.js الحقيقي ويرسل حدث notificationclick مزيّفاً (النمط نفسه كـsw-range).
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

const SW_SRC = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const ORIGIN = "https://app.test";

function loadSw(clientList: { focus: () => unknown }[]) {
  const listeners: Record<string, (e: unknown) => void> = {};
  const opened: string[] = [];
  const fakeSelf = {
    location: { origin: ORIGIN },
    addEventListener: (t: string, fn: (e: unknown) => void) => {
      listeners[t] = fn;
    },
    skipWaiting: () => {},
    clients: {
      claim: () => {},
      matchAll: async () => clientList,
      openWindow: async (url: string) => {
        opened.push(url);
        return null;
      },
    },
  };
  new Function("self", "caches", "fetch", SW_SRC)(fakeSelf, {}, async () => new Response("x"));
  const click = () => {
    const onClick = listeners["notificationclick"];
    if (!onClick) throw new Error("no notificationclick listener");
    const close = vi.fn();
    let waited: Promise<unknown> | undefined;
    onClick({ notification: { close }, waitUntil: (p: Promise<unknown>) => (waited = p) });
    return { close, waited: Promise.resolve(waited) };
  };
  return { click, opened };
}

describe("عامل الخدمة — النقر على الإشعار (D272)", () => {
  it("يسجَّل معالج notificationclick ويُغلق الإشعار عند النقر", async () => {
    const { click } = loadSw([]);
    const { close, waited } = click();
    await waited;
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("نافذة مفتوحة = تُركَّز ولا تُفتح جديدة", async () => {
    const focus = vi.fn();
    const { click, opened } = loadSw([{ focus }]);
    await click().waited;
    expect(focus).toHaveBeenCalledTimes(1);
    expect(opened).toHaveLength(0);
  });

  it("لا نوافذ = تُفتح الجذر /", async () => {
    const { click, opened } = loadSw([]);
    await click().waited;
    expect(opened).toEqual(["/"]);
  });
});
