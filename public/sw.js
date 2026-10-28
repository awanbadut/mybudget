const CACHE_NAME = 'mybudget-v10';
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
  const url = new URL(event.request.url);

  // CRITICAL: NEVER intercept or cache Next.js internal bundles (_next/).
  // Next.js handles static chunk hashing and HTTP caching natively.
  // Intercepting _next/ with SW causes fatal Webpack chunk mismatches across deploys!
  if (url.pathname.startsWith('/_next/')) {
    return;
  }
  
  // Network-first for API and pages (always fresh)
  if (url.pathname.startsWith('/api') || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static branding/manifest assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
