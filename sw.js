// ========== Service Worker متطور مع استراتيجيات متعددة ==========
const CACHE_NAME = 'sp-studio-v2';
const OFFLINE_URL = '/PT.semo/offline.html';
const BASE_PATH = '/PT.semo/';

// استراتيجيات التخزين المؤقت المختلفة
const STRATEGIES = {
    // استراتيجية Cache First (للملفات الثابتة)
    CACHE_FIRST: ['/icons/', '.png', '.jpg', '.woff2', '.css'],
    // استراتيجية Network First (لواجهات API)
    NETWORK_FIRST: ['/api/', '/updates.json'],
    // استراتيجية Stale While Revalidate (للملفات المتوسطة)
    STALE_WHILE_REVALIDATE: ['.js', '.json', '.html']
};

// الملفات المطلوب تخزينها مسبقاً
const PRECACHE_URLS = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'manifest.json',
    BASE_PATH + 'offline.html',
    BASE_PATH + 'analytics.js',
    BASE_PATH + 'icons/icon-72.png',
    BASE_PATH + 'icons/icon-96.png',
    BASE_PATH + 'icons/icon-128.png',
    BASE_PATH + 'icons/icon-144.png',
    BASE_PATH + 'icons/icon-152.png',
    BASE_PATH + 'icons/icon-192.png',
    BASE_PATH + 'icons/icon-384.png',
    BASE_PATH + 'icons/icon-512.png'
];

// تثبيت الـ Service Worker
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching preloaded assets');
                return cache.addAll(PRECACHE_URLS);
            })
            .catch(err => console.error('[SW] Precache error:', err))
    );
    self.skipWaiting();
});

// استراتيجية التخزين المؤقت حسب نوع الملف
function getStrategy(url) {
    if (STRATEGIES.CACHE_FIRST.some(pattern => url.includes(pattern))) {
        return 'CACHE_FIRST';
    }
    if (STRATEGIES.NETWORK_FIRST.some(pattern => url.includes(pattern))) {
        return 'NETWORK_FIRST';
    }
    if (STRATEGIES.STALE_WHILE_REVALIDATE.some(pattern => url.includes(pattern))) {
        return 'STALE_WHILE_REVALIDATE';
    }
    return 'CACHE_FIRST';
}

// استراتيجية Cache First
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) {
        console.log('[SW] Cache hit:', request.url);
        return cached;
    }
    try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        console.error('[SW] Network error:', error);
        return caches.match(OFFLINE_URL);
    }
}

// استراتيجية Network First
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        console.log('[SW] Network failed, using cache:', request.url);
        const cached = await caches.match(request);
        if (cached) return cached;
        return caches.match(OFFLINE_URL);
    }
}

// استراتيجية Stale While Revalidate
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request).then(response => {
        cache.put(request, response.clone());
        return response;
    }).catch(() => null);
    
    if (cached) {
        fetchPromise.catch(() => {});
        return cached;
    }
    return fetchPromise;
}

// معالجة الطلبات
self.addEventListener('fetch', event => {
    const url = event.request.url;
    const strategy = getStrategy(url);
    
    if (strategy === 'CACHE_FIRST') {
        event.respondWith(cacheFirst(event.request));
    } else if (strategy === 'NETWORK_FIRST') {
        event.respondWith(networkFirst(event.request));
    } else {
        event.respondWith(staleWhileRevalidate(event.request));
    }
});

// تفعيل الـ Service Worker
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// إشعارات الدفع (Push Notifications)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'تحديث جديد في SP Studio',
        icon: BASE_PATH + 'icons/icon-192.png',
        badge: BASE_PATH + 'icons/icon-96.png',
        vibrate: [200, 100, 200],
        data: { url: BASE_PATH }
    };
    
    event.waitUntil(
        self.registration.showNotification('SP Studio', options)
    );
});

// التعامل مع النقر على الإشعارات
self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || BASE_PATH)
    );
});

// مزامنة الخلفية (Background Sync)
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(
            fetch(BASE_PATH + 'api/sync').catch(() => {})
        );
    }
});
