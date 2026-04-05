const CACHE_NAME = 'master-engine-v' + Date.now();

self.addEventListener('install', e => {
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
});

self.addEventListener('fetch', e => {
    // Non cachare i CSV per permettere aggiornamenti istantanei dal foglio Google
    if (e.request.url.includes('docs.google.com')) {
        return fetch(e.request);
    }
    e.respondWith(
        caches.match(e.request).then(res => res || fetch(e.request))
    );
});
