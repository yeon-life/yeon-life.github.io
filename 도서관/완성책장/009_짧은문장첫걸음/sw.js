const CACHE_NAME = 'omuri-cache-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/cover.webp',
  '/images/icon-192.png',
  '/images/icon-512.webp',
  '/print/오므리_색칠.png',
  '/print/오므리_종이접기.png',
  '/print/오므리_종이인형.png'
];

// 17개 본문 이미지 precache 목록에 추가
for(let i=1; i<=17; i++) {
  const pName = i < 10 ? 'p0' + i : 'p' + i;
  ASSETS.push(`/images/${pName}.png`);
}

// 서비스워커 설치 시 자산 즉시 프리캐싱 및 강제 활성화
self.addEventListener('install', e => {
  self.skipWaiting(); // 이전 서비스워커 대기 상태를 건너뛰고 즉시 활성화
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Precaching all assets');
      return cache.addAll(ASSETS);
    })
  );
});

// 활성화 시 기존 캐시 삭제 및 즉시 클라이언트 제어권 획득
self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      self.clients.claim(), // 현재 열려있는 모든 클라이언트(탭)들을 즉시 제어
      caches.keys().then(keys => {
        return Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME) {
              console.log('[Service Worker] Removing old cache', key);
              return caches.delete(key);
            }
          })
        );
      })
    ])
  );
});

// 캐시우선 + 네트워크폴백 전략 적용 (ERR_FAILED 방지)
self.addEventListener('fetch', e => {
  // api/chat 요청은 캐시하지 않고 무조건 네트워크로 통과
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      // 1. 캐시에 있으면 즉시 반환 (오프라인 상태 및 빠른 로딩)
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // 2. 캐시에 없으면 네트워크에서 가져옴
      return fetch(e.request).then(networkResponse => {
        // 유효한 응답이면 캐시에 추가
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(err => {
        console.error('[Service Worker] Fetch failed; returning offline fallback', err);
        // 네트워크마저 실패하고 캐시도 없을 경우, HTML 요청이면 index.html를 폴백으로 반환
        if (e.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
