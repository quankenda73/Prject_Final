const CACHE_NAME = 'app-cache-v1';
const urlsToCache = [
    '/',
    '/css/styles.css',
    '/js/main.js',
    '/js/security.js',
    '/js/performance.js',
    '/images/logo.png',
    '/images/favicon.png',
    '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch Event Strategy (Cache First, then Network)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request)
                    .then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    });
            })
    );
});

// Background Sync
self.addEventListener('sync', event => {
    if (event.tag === 'sync-results') {
        event.waitUntil(syncResults());
    }
});

// Push Notifications
self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: '/images/icon-192x192.png',
        badge: '/images/badge.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Xem chi tiết'
            },
            {
                action: 'close',
                title: 'Đóng'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Thông báo mới', options)
    );
});

// Notification Click
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/notifications')
        );
    }
});

// Helper function for background sync
async function syncResults() {
    try {
        const results = await getResultsToSync();
        await sendResultsToServer(results);
    } catch (error) {
        console.error('Sync failed:', error);
    }
}

// Helper function to get results that need syncing
async function getResultsToSync() {
    const db = await openIndexedDB();
    return db.getAll('results');
}

// Helper function to send results to server
async function sendResultsToServer(results) {
    const response = await fetch('/api/sync-results', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(results)
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return response.json();
} 