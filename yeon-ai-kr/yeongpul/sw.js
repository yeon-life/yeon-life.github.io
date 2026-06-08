// 영풀 Service Worker — PWA 오프라인 + 설치 지원
const CACHE_NAME = 'yeongpul-v22-gallery';
const PRECACHE = [
  './',
  './app.html',
  './icon.svg',
  './manifest.webmanifest'
];

// 설치 시 핵심 파일 캐시
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// 활성화 시 이전 캐시 정리
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 네트워크 우선, 실패 시 캐시 (학습 데이터는 항상 최신)
self.addEventListener('fetch', function(e) {
  // API 요청은 캐시하지 않음
  if (e.request.url.includes('script.google.com') || e.request.url.includes('api')) {
    return;
  }
  e.respondWith(
    fetch(e.request).then(function(response) {
      // 성공 응답만 캐시
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(e.request);
    })
  );
});
