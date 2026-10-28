'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
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
