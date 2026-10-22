// @vitest-environment node
// tests/sw-range.test.ts — عامل الخدمة يخدِم طلبات المدى Range للمقاطع 206 صحيحة (N-154 · D268).
// يشغّل public/sw.js الحقيقي في بيئة وهمية (self/caches/fetch) ويرسل أحداث fetch مزيّفة.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SW_SRC = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
const ORIGIN = "https://app.test";
const CLIP = `${ORIGIN}/assets/word-hallo-abc123.opus`;
/** ملف صوتي مزيّف: 1000 بايت متتابعة (كل موضع = قيمته % 256) */
const BYTES = new Uint8Array(1000).map((_, i) => i % 256);

type CachesStub = {
  store: Map<string, Response>;
  match: (req: Request | string) => Promise<Response | undefined>;
  open: (name: string) => Promise<{ put: (req: Request | string, res: Response) => Promise<void> }>;
  keys: () => Promise<string[]>;
};

function loadSw(opts: { net: (req: Request) => Promise<Response> }) {
  const listeners: Record<string, (e: unknown) => void> = {};
  const store = new Map<string, Response>();
  const keyOf = (r: Request | string) => (typeof r === "string" ? r : r.url);
  const cachesStub: CachesStub = {
    store,
    match: async (r) => {
      const hit = store.get(keyOf(r));
      return hit ? hit.clone() : undefined;
    },
    open: async () => ({
      put: async (r, res) => {
        store.set(keyOf(r), res.clone());
      },
    }),
    keys: async () => [],
  };
  const fakeSelf = {
    location: { origin: ORIGIN },
    addEventListener: (t: string, fn: (e: unknown) => void) => {
      listeners[t] = fn;
    },
    skipWaiting: () => {},
    clients: { claim: () => {} },
  };
  new Function("self", "caches", "fetch", SW_SRC)(fakeSelf, cachesStub, opts.net);
  const dispatch = (req: Request): Promise<Response | undefined> => {
    let out: Promise<Response> | undefined;
    const onFetch = listeners["fetch"];
    if (!onFetch) throw new Error("no fetch listener");
    onFetch({ request: req, respondWith: (p: Promise<Response>) => (out = p) });
    return Promise.resolve(out);
  };
  return { dispatch, store };
}

const fullClip = () =>
  new Response(BYTES.slice(), { status: 200, headers: { "Content-Type": "audio/ogg" } });

describe("عامل الخدمة — طلبات المدى (N-154)", () => {
  it("GET عادي: من الشبكة ثم يُخزَّن كاملاً (200)", async () => {
    const { dispatch, store } = loadSw({ net: async () => fullClip() });
    const res = await dispatch(new Request(CLIP));
    expect(res!.status).toBe(200);
    expect(new Uint8Array(await res!.arrayBuffer())).toEqual(BYTES);
    expect(store.has(CLIP)).toBe(true);
  });

  it("طلب جزء بعد التخزين: 206 بالبايتات المطلوبة فقط (لا الملف كاملاً)", async () => {
    const { dispatch } = loadSw({ net: async () => fullClip() });
    await dispatch(new Request(CLIP)); // التخزين أولاً
    const res = await dispatch(new Request(CLIP, { headers: { Range: "bytes=100-199" } }));
    expect(res!.status).toBe(206);
    expect(res!.headers.get("Content-Range")).toBe("bytes 100-199/1000");
    expect(res!.headers.get("Content-Type")).toBe("audio/ogg");
    expect(new Uint8Array(await res!.arrayBuffer())).toEqual(BYTES.slice(100, 200));
  });

  it("مدى مفتوح النهاية: حتى آخر الملف", async () => {
    const { dispatch } = loadSw({ net: async () => fullClip() });
    await dispatch(new Request(CLIP));
    const res = await dispatch(new Request(CLIP, { headers: { Range: "bytes=990-" } }));
    expect(res!.status).toBe(206);
    expect(res!.headers.get("Content-Range")).toBe("bytes 990-999/1000");
    expect(new Uint8Array(await res!.arrayBuffer())).toEqual(BYTES.slice(990));
  });

  it("مدى خارج الملف: 416 (لا 200 مسموم)", async () => {
    const { dispatch } = loadSw({ net: async () => fullClip() });
    await dispatch(new Request(CLIP));
    const res = await dispatch(new Request(CLIP, { headers: { Range: "bytes=5000-6000" } }));
    expect(res!.status).toBe(416);
  });

  it("طلب جزء بلا تخزين: يمر للشبكة ولا يُخزَّن (206 لا تُخزَّن)", async () => {
    let netCalls = 0;
    const { dispatch, store } = loadSw({
      net: async () => {
        netCalls++;
        return new Response(BYTES.slice(0, 100), { status: 206 });
      },
    });
    const res = await dispatch(new Request(CLIP, { headers: { Range: "bytes=0-99" } }));
    expect(netCalls).toBe(1);
    expect(res!.status).toBe(206);
    expect(store.has(CLIP)).toBe(false);
  });

  it("طلب غير GET أو من أصل آخر: يُتجاهَل (بلا رد)", async () => {
    const { dispatch } = loadSw({ net: async () => fullClip() });
    expect(await dispatch(new Request(CLIP, { method: "POST" }))).toBeUndefined();
    expect(await dispatch(new Request("https://other.test/x.opus"))).toBeUndefined();
  });
});
