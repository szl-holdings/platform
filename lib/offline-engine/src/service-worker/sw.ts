/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `szl-static-${CACHE_VERSION}`;
const API_CACHE = `szl-api-${CACHE_VERSION}`;
const DASHBOARD_CACHE = `szl-dashboard-${CACHE_VERSION}`;

const STATIC_ASSET_PATTERNS = [/\.(js|css|woff2?|png|jpg|jpeg|svg|ico|webp)$/];

const API_PATH_PATTERNS = [/\/api\//];

const DASHBOARD_PATTERNS = [/\/api\/.*\/(incidents|vessels|signals|fleets|assessments)(\?.*)?$/];

function isStaticAsset(url: string): boolean {
  return STATIC_ASSET_PATTERNS.some((p) => p.test(url));
}

function isApiRequest(url: string): boolean {
  return API_PATH_PATTERNS.some((p) => p.test(url));
}

function isDashboardView(url: string): boolean {
  return DASHBOARD_PATTERNS.some((p) => p.test(url));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE),
      caches.open(API_CACHE),
      caches.open(DASHBOARD_CACHE),
    ]).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== API_CACHE && key !== DASHBOARD_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  // Origin check: only accept messages from same-origin clients (defense-in-depth
  // against postMessage-based attacks even though SW already runs in same origin).
  const sourceUrl = (event.source as Client | null)?.url;
  if (sourceUrl) {
    try {
      if (new URL(sourceUrl).origin !== self.location.origin) return;
    } catch {
      return;
    }
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = request.url;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (isDashboardView(url)) {
    event.respondWith(staleWhileRevalidate(request, DASHBOARD_CACHE));
    return;
  }

  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  event.respondWith(networkFirst(request, API_CACHE));
});

async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline', message: 'No cached data available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'X-Offline': 'true' },
    });
  }
}

async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  return cached ?? networkPromise;
}

export {};
