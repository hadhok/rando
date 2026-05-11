const CACHE = 'gr10-offline-v1';
const TILE_CACHE = 'gr10-ign-tiles-v1';

// Installation : mise en cache du shell applicatif
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(['/', '/index.html'])
    )
  );
});

// Activation : suppression des anciens caches (sauf tile cache)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== TILE_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Tuiles IGN → cache pré-téléchargé en premier, sinon réseau
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

  // Autres externes (météo, CDN) → réseau direct, pas de cache
  if (
    url.hostname.includes('open-meteo.com') ||
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('githubusercontent.com') ||
    url.hostname.includes('openstreetmap.org')
  ) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Shell applicatif → cache en premier, mise à jour réseau en arrière-plan
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const networkFetch = fetch(e.request).then((response) => {
        if (response.ok && e.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || networkFetch;
    })
  );
});
