/**
 * Registers the service worker for offline play. Production builds only —
 * in `vite dev` a cached worker would fight hot-module reloading.
 */

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.warn('Service worker registration failed', err));
  });
}
