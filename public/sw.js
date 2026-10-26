// public/sw.js — PWA: offline بالكامل (قانون 25) — cache-first للقشرة والأصول (والمقاطع الصوتية عند أول تشغيل)
// D104: اسم الذاكرة باسم المنتج (لا الاسم الداخلي — D31) + الإصدار يُرفع ليُفعَّل العامل الجديد ويُحذف القديم.
// N-154 (D268): طلبات المدى Range للمقاطع تُخدَم 206 مقطوعة من المخبأ — المطابقة المباشرة كانت ترد
// الملف كاملاً (200) على طلب جزء فيقطع المتصفح (أندرويد/كروم) التشغيل وسط الجملة: «كل الجمل ناقصة».
const CACHE = "schluessel-v3";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon.svg"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

/** طلب جزء من ملف مخبَّأ كاملاً ← 206 + Content-Range (لا مخبأ/لا فهم ← مرّر للشبكة ولا تخزّن) */
async function serveRange(req, rangeHeader) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
  if (!m || (m[1] === "" && m[2] === "")) return fetch(req);
  const cached = await caches.match(req.url);
  if (!cached || !cached.ok) return fetch(req);
  const buf = await cached.arrayBuffer();
  const total = buf.byteLength;
  if (total === 0) return fetch(req);
  const start = m[1] === "" ? Math.max(0, total - parseInt(m[2], 10)) : parseInt(m[1], 10);
  const end = m[2] === "" ? total - 1 : Math.min(parseInt(m[2], 10), total - 1);
  if (start >= total || end < start) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${total}` } });
  }
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      "Content-Type": cached.headers.get("Content-Type") || "application/octet-stream",
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Content-Length": String(end - start + 1),
      "Accept-Ranges": "bytes",
    },
  });
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // GET من نفس الأصل فقط — طلبات أخرى (POST/خارجية) تمر بلا تخزين (Cache API لا يقبل غير GET)
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  // طلبات المدى لا تُطابَق مع المخبأ مباشرة أبداً (انظر N-154 أعلاه)
  const rangeHeader = req.headers.get("range");
  if (rangeHeader) {
    e.respondWith(serveRange(req, rangeHeader));
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match("./index.html"))),
  );
});

/** D272 (F002): النقر على إشعار النافذة يفتح التطبيق على الشاشة — نافذة موجودة تُركَّز وإلا تُفتح */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      if (list.length > 0) return list[0].focus();
      if (self.clients.openWindow) return self.clients.openWindow("/");
    }),
  );
});
