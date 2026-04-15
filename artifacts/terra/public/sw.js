const CACHE_VERSION = "terra-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;

function isStaticAsset(url) {
  return /\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp|json)$/.test(url)
    && !url.includes("/api/");
}

function isApiRequest(url) {
  return url.includes("/api/");
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([caches.open(STATIC_CACHE), caches.open(API_CACHE)]).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = request.url;
  if (isStaticAsset(url)) { event.respondWith(cacheFirst(request, STATIC_CACHE)); return; }
  if (isApiRequest(url)) { event.respondWith(networkFirst(request, API_CACHE)); return; }
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { return; }
  const title = payload.title || "Terra Real Estate";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/favicon.svg",
    badge: payload.badge || "/favicon.svg",
    tag: payload.tag || "terra-alert",
    data: payload.data || {},
    requireInteraction: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const actionUrl = event.notification.data?.actionUrl || "/terra/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) { client.focus(); if ("navigate" in client) client.navigate(actionUrl); return; }
      }
      return clients.openWindow(actionUrl);
    })
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try { const r = await fetch(request); if (r.ok) cache.put(request, r.clone()); return r; } catch { return new Response("", { status: 503 }); }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try { const r = await fetch(request); if (r.ok) cache.put(request, r.clone()); return r; } catch {
    const cached = await cache.match(request);
    return cached || new Response(JSON.stringify({ error: "offline" }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
}
