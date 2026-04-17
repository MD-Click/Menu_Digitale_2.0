/**
 * PWA Service Worker - Versione 11.6 "Cafe Iberico Vault"
 * Ottimizzato per Google Sheets Data e High-Speed Image Loading
 */

const CACHE_NAME = 'cafe-iberico-cache-v11.6';

// File vitali da memorizzare subito
const INITIAL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. INSTALLAZIONE: Salvataggio file core
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching file di sistema');
      return cache.addAll(INITIAL_ASSETS);
    })
  );
  self.skipWaiting(); // Forza l'attivazione immediata
});

// 2. ATTIVAZIONE: Pulizia vecchie versioni della cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Eliminazione vecchia cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH: Gestione intelligente delle richieste
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // --- STRATEGIA A: DATI GOOGLE SHEETS (Network First) ---
  // Vogliamo sempre il menu aggiornato. Se il server non risponde, usiamo la cache.
  if (url.hostname === 'docs.google.com') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // --- STRATEGIA B: IMMAGINI (Stale-While-Revalidate) ---
  // Mostra subito l'immagine salvata, ma controlla se ne esiste una nuova.
  if (event.request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    event.respondWith(
      caches.match(event.request).then((cachedRes) => {
        const fetchPromise = fetch(event.request).then((networkRes) => {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return networkRes;
        });
        return cachedRes || fetchPromise;
      })
    );
    return;
  }

  // --- STRATEGIA C: FILE APP (Cache First) ---
  // HTML, CSS, JS caricati istantaneamente dalla memoria.
  event.respondWith(
    caches.match(event.request).then((cachedRes) => {
      return cachedRes || fetch(event.request).then((networkRes) => {
        const resClone = networkRes.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return networkRes;
      });
    })
  );
});
