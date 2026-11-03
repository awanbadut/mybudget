'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    // Proactively purge any stale caches from previous versions (v1-v10)
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches
        .keys()
        .then((keys) => {
          keys.forEach((key) => {
            if (key !== 'mybudget-v11') {
              caches.delete(key);
            }
          });
        })
        .catch(() => {});
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => {
          // Immediately check for updates
          registration.update().catch(() => {});
        })
        .catch(() => {
          // Silent fail: SW is optional
        });
    }
  }, []);
  return null;
}
