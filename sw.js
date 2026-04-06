const CACHE_NAME = 'menu-pwa-v1';
const urlsToCache = [
      './index.html',
      './manifest.json'
    ];

// Installazione SW
self.addEventListener('install', event => {
      event.waitUntil(
              caches.open(CACHE_NAME)
                .then(cache => {
                            return cache.addAll(urlsToCache);
                })
            );
});

// Intercettazione richieste di rete
self.addEventListener('fetch', event => {
      event.respondWith(
              caches.match(event.request)
                .then(response => {
                            // Ritorna la cache se trovata, altrimenti fai la richiesta di rete
                              return response || fetch(event.request);
                })
            );
});
