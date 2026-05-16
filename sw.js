const CACHE = 'hebran-v1';

const PRECACHE = [
  './',
  './index.html',
  './css/styles.css',
  './js/script.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/icon-maskable.svg',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Same-origin: cache-first, update in background
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(request);
        const networkPromise = fetch(request).then(res => {
          cache.put(request, res.clone());
          return res;
        }).catch(() => null);
        return cached || networkPromise;
      })
    );
    return;
  }

  // External (fonts, CDN xlsx): network-first, fallback to cache
  event.respondWith(
    fetch(request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(request, clone));
        return res;
      })
      .catch(() => caches.match(request))
  );
});
