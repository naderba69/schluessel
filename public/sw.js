// public/sw.js — PWA: offline بالكامل (قانون 25) — cache-first للقشرة والأصول (والمقاطع الصوتية عند أول تشغيل)
// D104: اسم الذاكرة باسم المنتج (لا الاسم الداخلي — D31) + الإصدار يُرفع ليُفعَّل العامل الجديد ويُحذف القديم.
const CACHE = "schluessel-v2";
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

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // GET من نفس الأصل فقط — طلبات أخرى (POST/خارجية) تمر بلا تخزين (Cache API لا يقبل غير GET)
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
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
