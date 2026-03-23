const CACHE_NAME = 'cd17-v2';
const urlsToCache = [
  '/Informe-Tecnico-CD17-Beta-1.0/',
  '/Informe-Tecnico-CD17-Beta-1.0/index.html',
  '/Informe-Tecnico-CD17-Beta-1.0/manifest.json',
  '/Informe-Tecnico-CD17-Beta-1.0/icon-192.png',
  '/Informe-Tecnico-CD17-Beta-1.0/icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// Install: Cache all required files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching files...');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Now controlling all clients');
      return self.clients.claim();
    })
  );
});

// Fetch: Serve from cache first, then network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // For navigation (HTML pages) - always serve from cache first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/Informe-Tecnico-CD17-Beta-1.0/index.html').then((response) => {
        if (response) {
          console.log('Serving index.html from cache');
          return response;
        }
        // If not in cache, fetch from network
        return fetch(event.request).then((networkResponse) => {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('/Informe-Tecnico-CD17-Beta-1.0/index.html', responseToCache);
          });
          return networkResponse;
        });
      }).catch(() => {
        return new Response('Offline - please connect to internet to load the app', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
    );
    return;
  }
  
  // For other requests (images, JS, CDN) - try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log('Serving from cache:', event.request.url);
        return response;
      }
      console.log('Fetching from network:', event.request.url);
      return fetch(event.request).then((networkResponse) => {
        // Cache successful responses for offline use
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
