const CACHE_NAME = 'Informe-Tecnico-Beta-1.0';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// Install: Cache all core files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('Caching assets...');
      for (const asset of ASSETS) {
        try {
          await cache.add(asset);
          console.log('Cached:', asset);
        } catch (e) {
          console.error('Failed to cache:', asset, e);
        }
      }
      return cache;
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('Deleting old cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => {
      console.log('Now controlling clients');
      return self.clients.claim();
    })
  );
});

// Fetch: Try cache first for static assets, network first for others
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle HTML navigation requests specially
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(response => {
        if (response) {
          console.log('Serving index.html from cache');
          return response;
        }
        return fetch(event.request);
      })
    );
    return;
  }
  
  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        console.log('Serving from cache:', event.request.url);
        return cachedResponse;
      }
      console.log('Fetching from network:', event.request.url);
      return fetch(event.request).then(networkResponse => {
        // Cache successful responses for future offline use
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If both cache and network fail, return a fallback
        if (event.request.destination === 'image') {
          return new Response('', { status: 404, statusText: 'Image not found' });
        }
        return new Response('Offline - content not available', { status: 503 });
      });
    })
  );
});
