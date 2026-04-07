const CACHE_NAME = 'smart-menu-v2';

self.addEventListener('install', (e) => self.skipWaiting());

self.addEventListener('fetch', (e) => {
  // Se la richiesta è per Google Sheets, bypassa la cache totalmente
  if (e.request.url.includes('google.com') || e.request.url.includes('tqx=out:csv')) {
    return e.respondWith(fetch(e.request));
  }
  // Altrimenti usa la rete e aggiorna
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
