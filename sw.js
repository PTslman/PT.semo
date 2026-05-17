const CACHE_NAME = 'sp-studio-v1';
const BASE_PATH = '/sp-studio/';

const urlsToCache = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'manifest.json',
    BASE_PATH + 'icons/icon-72.png',
    BASE_PATH + 'icons/icon-96.png',
    BASE_PATH + 'icons/icon-128.png',
    BASE_PATH + 'icons/icon-144.png',
    BASE_PATH + 'icons/icon-152.png',
    BASE_PATH + 'icons/icon-192.png',
    BASE_PATH + 'icons/icon-384.png',
    BASE_PATH + 'icons/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .catch(err => console.warn('فشل تخزين بعض الملفات:', err))
    );
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    let requestUrl = new URL(event.request.url);
    let pathname = requestUrl.pathname;
    
    // تعديل المسار إذا كان يبدأ بـ /sp-studio/
    if (pathname.startsWith(BASE_PATH)) {
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
                .catch(() => caches.match(BASE_PATH + 'index.html'))
        );
    } else {
        event.respondWith(
            caches.match(event.request)
                .then(response => response || fetch(event.request))
        );
    }
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
    self.clients.claim();
});