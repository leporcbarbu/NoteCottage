// NoteCottage Service Worker
// Version: 1.0.9-fix1

const CACHE_NAME = 'notecottage-v1.0.9-fix1';
const STATIC_CACHE = 'notecottage-static-v1.0.9-fix1';
const DYNAMIC_CACHE = 'notecottage-dynamic-v1.0.9-fix1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/css/style.css',
  '/css/components/modal.css',
  '/css/components/emoji-picker.css',
  '/css/components/drag.css',
  '/css/components/context-menu.css',
  '/css/components/tag-autocomplete.css',
  '/css/components/wikilink-autocomplete.css',
  '/css/components/image-gallery.css',
  '/js/app.js',
  '/js/wikilink-extension.js',
  '/js/components/modal.js',
  '/js/components/emoji-picker.js',
  '/js/components/folder-form.js',
  '/js/components/drag-manager.js',
  '/js/components/context-menu.js',
  '/js/components/tag-autocomplete.js',
  '/js/components/wikilink-autocomplete.js',
  '/js/components/image-modal.js',
  '/js/components/image-upload.js'
  // Note: marked.min.js is loaded from CDN, can't cache cross-origin without CORS
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete old versions of our caches
            return cacheName.startsWith('notecottage-') &&
                   cacheName !== STATIC_CACHE &&
                   cacheName !== DYNAMIC_CACHE;
          })
          .map(cacheName => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
    .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', request.url);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache dynamic content (API responses, images)
            if (request.url.includes('/api/') ||
                request.url.includes('/uploads/') ||
                request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
              caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  cache.put(request, responseToCache);
                });
            }

            return response;
          })
          .catch(error => {
            console.log('[Service Worker] Fetch failed:', error);

            // Could return a custom offline page here
            // return caches.match('/offline.html');
          });
      })
  );
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
