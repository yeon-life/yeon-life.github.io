const CACHE_NAME = 'yeon-cache-007-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/data.js',
  '/images/cover.webp',
  '/images/icon-192.png',
  '/images/icon-512.webp',
  '/images/p01.webp',
  '/images/p02.webp',
  '/images/p03.webp'
];

// 서비스워커 설치 시 자산 즉시 프리캐싱 및 강제 활성화
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Precaching all assets safely');
      return Promise.allSettled(
        ASSETS.map(asset => {
          return cache.add(asset).catch(err => {
            console.warn(`[Service Worker] Caching failed for: ${asset}`, err);
          });
        })
      );
    })
  );
});

// 활성화 시 기존 캐시 삭제 및 즉시 클라이언트 제어권 획득
self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys => {
        return Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME && key.startsWith('yeon-cache-')) {
              console.log('[Service Worker] Removing old cache', key);
              return caches.delete(key);
            }
          })
        );
      })
    ])
  );
});

// 캐시우선 + 네트워크폴백 전략 적용
self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(e.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(err => {
        console.error('[Service Worker] Fetch failed; returning offline fallback', err);
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
