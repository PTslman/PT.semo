const CACHE_NAME = 'sp-studio-v1';
const BASE_PATH = '/PT.semo/';

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
      .catch(err => console.warn('Cache addAll error:', err))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
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
