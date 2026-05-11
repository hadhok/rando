const CACHE = 'gr10-offline-v1';

// Installation : mise en cache du shell applicatif
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(['/', '/index.html'])
    )
  );
});

// Activation : suppression des anciens caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Tuiles IGN, météo, CDN externes → réseau direct (pas de cache)
  if (
    url.hostname.includes('geopf.fr') ||
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
