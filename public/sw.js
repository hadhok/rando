const TILE_CACHE = 'gr10-ign-tiles-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== TILE_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((c) => c.navigate(c.url)))
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Tuiles IGN uniquement → cache offline
  if (url.hostname.includes('geopf.fr')) {
    e.respondWith(
      caches.open(TILE_CACHE).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        return fetch(e.request).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  // Tout le reste (JS, HTML, API) → réseau direct, jamais mis en cache
  e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
});
