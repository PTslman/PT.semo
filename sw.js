// =====================================================
// SP Studio - Advanced Service Worker
// الإصدار: 3.0.0
// الميزات: Cache First, Network First, Stale While Revalidate
// =====================================================

const CACHE_NAME = 'sp-studio-v3';
const BASE_PATH = '/PT.semo/';

// ========== 1. قائمة الملفات المطلوب تخزينها مؤقتاً (Cache First) ==========
const STATIC_CACHE_URLS = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'manifest.json',
  BASE_PATH + 'sw.js',
  BASE_PATH + 'offline.html',
  BASE_PATH + 'icons/icon-72.png',
  BASE_PATH + 'icons/icon-96.png',
  BASE_PATH + 'icons/icon-128.png',
  BASE_PATH + 'icons/icon-144.png',
  BASE_PATH + 'icons/icon-152.png',
  BASE_PATH + 'icons/icon-192.png',
  BASE_PATH + 'icons/icon-384.png',
  BASE_PATH + 'icons/icon-512.png'
];

// ========== 2. المصادر الخارجية المطلوب تخزينها ==========
const EXTERNAL_CACHE_URLS = [
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800;900&family=Tajawal:wght@400;500;700;800&family=Noto+Kufi+Arabic:wght@400;600;800&family=Amiri:wght@400;700&family=Almarai:wght@400;700;800&family=El+Messiri:wght@400;600;700&family=Reem+Kufi:wght@400;600;700&family=Changa:wght@400;600;800&display=swap',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
];

// ========== 3. ملفات API (للتخزين المؤقت بشبكة أولاً) ==========
const API_CACHE_URLS = [
  // أضف روابط API الخاصة بك هنا إذا وجدت
];

// ========== حدث التثبيت (Install Event) ==========
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    Promise.all([
      // تخزين الملفات الثابتة
      caches.open(CACHE_NAME).then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      }),
      // تخزين المصادر الخارجية
      caches.open(CACHE_NAME + '-external').then(cache => {
        console.log('[Service Worker] Caching external assets');
        return cache.addAll(EXTERNAL_CACHE_URLS);
      })
    ]).catch(err => console.warn('[Service Worker] Cache addAll error:', err))
  );
  
  // تنشيط الـ Service Worker فوراً
  self.skipWaiting();
});

// ========== حدث الجلب (Fetch Event) - استراتيجيات متعددة ==========
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const request = event.request;
  
  // استراتيجية 1: Cache First للملفات الثابتة
  if (STATIC_CACHE_URLS.some(staticUrl => url.pathname.includes(staticUrl))) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            console.log('[Service Worker] Cache hit:', url.pathname);
            return response;
          }
          console.log('[Service Worker] Cache miss, fetching:', url.pathname);
          return fetch(request).then(fetchResponse => {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
            });
          });
        })
        .catch(() => caches.match(BASE_PATH + 'offline.html'))
    );
    return;
  }
  
  // استراتيجية 2: Network First للـ API والمحتوى الديناميكي
  if (API_CACHE_URLS.some(apiUrl => url.pathname.includes(apiUrl))) {
    event.respondWith(
      fetch(request)
        .then(fetchResponse => {
          return caches.open(CACHE_NAME + '-api').then(cache => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }
  
  // استراتيجية 3: Stale While Revalidate للمصادر الخارجية
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(fetchResponse => {
          return caches.open(CACHE_NAME + '-external').then(cache => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
  
  // استراتيجية 4: Cache Only للملفات التي يجب أن تكون موجودة دائماً
  if (request.destination === 'document' && url.pathname === BASE_PATH) {
    event.respondWith(
      caches.match(BASE_PATH + 'index.html')
        .then(response => response || fetch(request))
        .catch(() => caches.match(BASE_PATH + 'offline.html'))
    );
    return;
  }
  
  // استراتيجية 5: الوضع الافتراضي (Cache First ثم الشبكة)
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then(fetchResponse => {
        if (fetchResponse && fetchResponse.status === 200) {
          return caches.open(CACHE_NAME + '-dynamic').then(cache => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        }
        return fetchResponse;
      }).catch(() => {
        if (request.destination === 'document') {
          return caches.match(BASE_PATH + 'offline.html');
        }
        return new Response('❌ غير متصل بالإنترنت', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});

// ========== حدث التفعيل (Activate Event) ==========
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // حذف الكاشات القديمة فقط (وليس الكاش الحالي)
          if (cacheName !== CACHE_NAME && 
              cacheName !== CACHE_NAME + '-external' && 
              cacheName !== CACHE_NAME + '-api' && 
              cacheName !== CACHE_NAME + '-dynamic') {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // السيطرة على الصفحات المفتوحة فوراً
  self.clients.claim();
});

// ========== حدث الرسائل (Message Event) - للتواصل مع الصفحة ==========
self.addEventListener('message', event => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
  }
});

// ========== حدث الدفع (Push Event) - للإشعارات (اختياري) ==========
self.addEventListener('push', event => {
  console.log('[Service Worker] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'لديك تحديث جديد في SP Studio',
    icon: BASE_PATH + 'icons/icon-192.png',
    badge: BASE_PATH + 'icons/icon-96.png',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'فتح التطبيق' },
      { action: 'dismiss', title: 'إغلاق' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('SP Studio', options)
  );
});

// ========== حدث النقر على الإشعار ==========
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow(BASE_PATH);
      })
    );
  }
});

// ========== حدث المزامنة في الخلفية (Background Sync) ==========
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // أضف منطق مزامنة البيانات هنا
      fetch(BASE_PATH + 'api/sync').catch(err => console.warn(err))
    );
  }
});

// ========== حدث جلب البيانات في الخلفية (Background Fetch) ==========
self.addEventListener('backgroundfetchsuccess', event => {
  console.log('[Service Worker] Background fetch success:', event);
  event.waitUntil(
    event.registration.matchAll().then(records => {
      const cache = caches.open(CACHE_NAME + '-background');
      records.forEach(record => {
        cache.put(record.request, record.responseReady);
      });
    })
  );
});

// ========== دوال مساعدة ==========
function log(message, data) {
  console.log(`[Service Worker] ${message}`, data || '');
}
