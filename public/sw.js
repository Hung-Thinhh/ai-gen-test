// Service Worker DISABLED - causing white screen on reload
// To re-enable: rename this file back to sw.js

// Service Worker for PWA
const CACHE_NAME = 'duky-ai-disabled';
const urlsToCache = [
    // REMOVED: Vite artifacts that were causing white screen
    // '/',
    // '/index.html',
    // '/index.css',
    '/offline.html'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // DELETE ALL old caches to fix white screen
                    console.log('[SW] Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - NETWORK FIRST strategy (no more cache issues)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Only cache successful responses
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache only if network fails
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        return cachedResponse || caches.match('/offline.html');
                    });
            })
    );
});
