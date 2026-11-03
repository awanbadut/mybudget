const CACHE_NAME = 'mybudget-v11';
const STATIC_ASSETS = [
  '/manifest.json',
  '/brand/mybudget-symbol-light.svg',
  '/brand/mybudget-symbol-dark.svg',
  '/brand/mybudget-app-tile.svg',
  '/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // ONLY serve explicitly whitelisted static assets (manifest, brand logos, icons)
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
    return;
  }

  // ALL OTHER REQUESTS (Next.js pages, RSC streams, chunks, API, server actions):
  // DO NOT INTERCEPT! Let browser handle network & native HTTP cache directly.
  return;
});
