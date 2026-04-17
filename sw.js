const CACHE_NAME = 'menu-pwa-vault-v1';

// File statici da salvare immediatamente all'installazione
const CORE_ASSETS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
];

// 1. INSTALLAZIONE: Salva i file core nella cache
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Forza l'aggiornamento immediato del service worker
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            console.log('[Service Worker] Caching core assets');
            return cache.addAll(CORE_ASSETS);
        })
    );
});

// 2. ATTIVAZIONE: Pulisce le vecchie cache se cambi versione
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. INTERCETTAZIONE RICHIESTE (La magia dell'Offline)
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // STRATEGIA A: Per i dati di Google Sheets (Il CSV del Menu) -> Network First, Fallback to Cache
    // Cerca sempre di avere il menu aggiornato. Se non c'è rete, usa quello in memoria.
    if (requestUrl.hostname === 'docs.google.com') {
        event.respondWith(
            fetch(event.request)
            .then((response) => {
                // Se la rete funziona, salva la nuova versione in cache e restituiscila
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                return response;
            })
            .catch(() => {
                // Se sei offline, pesca la versione salvata
                return caches.match(event.request);
            })
        );
        return;
    }

    // STRATEGIA B: Per Immagini (Foto Piatti) -> Stale-While-Revalidate
    // Mostra subito la foto in memoria (velocissimo), ma intanto scarica la nuova in background
    if (event.request.destination === 'image' || requestUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const networkFetch = fetch(event.request).then((response) => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    return response;
                }).catch(() => cachedResponse); // Se fallisce rete, ignora
                
                return cachedResponse || networkFetch; // Ritorna cache se c'è, sennò aspetta rete
            })
        );
        return;
    }

    // STRATEGIA C: Per i file dell'App (HTML, CSS, JS) -> Cache First, Fallback to Network
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') return response;
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                return response;
            });
        })
    );
});
