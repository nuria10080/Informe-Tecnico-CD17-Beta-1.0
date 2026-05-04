// sw.js - Service Worker for offline support

const CACHE_NAME = 'Iniciativa de Voluntariado-Informe-Tecnico-v1.1.8
    '; // 🔥 CHANGE THIS on every deploy

const urlsToCache = [
    './',
    './index.html',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jsqr/1.4.0/jsQR.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// 🔧 INSTALL - cache core files
self.addEventListener('install', event => {
    console.log('[Service Worker] Installing...');
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.log('[Service Worker] Cache error:', err))
    );
});

// 🔧 ACTIVATE - delete old caches
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );

    return self.clients.claim();
});

// 🔥 FETCH - smart caching strategy
self.addEventListener('fetch', event => {
    const request = event.request;

    // ✅ NETWORK-FIRST for HTML (ensures updates show)
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => caches.match(request)) // offline fallback
        );
        return;
    }

    // 📦 CACHE-FIRST for assets (fast + offline)
    event.respondWith(
        caches.match(request).then(response => {
            if (response) return response;

            return fetch(request).then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }

                const responseClone = networkResponse.clone();

                caches.open(CACHE_NAME).then(cache => {
                    cache.put(request, responseClone);
                });

                return networkResponse;
            });
        })
    );
});
// 🔥 Listen for update trigger from UI
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
