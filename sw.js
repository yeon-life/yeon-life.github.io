/*
 * 연라이프 Service Worker
 * YLV-4 §24 PWA + §18 자동 업데이트 시스템
 * ───────────────────────────────────────────────────────────
 * 캐시 전략:
 *  · index.html, manifest.json, version.json → 네트워크 우선 + 폴백 캐시
 *  · 아이콘, CSS, 이미지 → 캐시 우선
 *  · 자동 발행 글 페이지 (오늘의_연라이프_*) → 네트워크 우선 (매일 갱신)
 *  · 외부 API (Gemini, Anthropic 등) → 캐시 안 함
 */

const CACHE_NAME = 'yeon-life-v4';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/apple-touch-icon.svg',
  '/시안_v4_홈페이지.html',
  '/블로그_AI작가기자_인덱스.html',
  '/data/personas.js',
  '/data/articles_today.js',
];

const NETWORK_FIRST_PATTERNS = [
  /\/index\.html$/,
  /\/manifest\.json$/,
  /\/version\.json$/,
  /\/오늘의_연라이프_.*\.html$/,
  /\/시안_v4_홈페이지\.html$/,
];

const CACHE_FIRST_PATTERNS = [
  /\.svg$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.webp$/,
  /\.css$/,
  /\.woff2?$/,
];

const NEVER_CACHE_PATTERNS = [
  /api\.y-life\.kr/,
  /generativelanguage\.googleapis\.com/,
  /api\.anthropic\.com/,
  /api\.openai\.com/,
  /\/api\//,
];

/* 설치 시 정적 자산 미리 캐싱 */
self.addEventListener('install', (event) => {
  console.log('[연라이프 SW] 설치 중…');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS).catch(e => console.warn('[연라이프 SW] 일부 자산 캐싱 실패', e)))
      .then(() => self.skipWaiting())
  );
});

/* 활성화 시 옛 캐시 정리 */
self.addEventListener('activate', (event) => {
  console.log('[연라이프 SW] 활성화');
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

/* fetch 전략 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 외부 API 는 캐시 안 함
  if (NEVER_CACHE_PATTERNS.some((re) => re.test(url.href))) {
    return; // 기본 네트워크 처리
  }

  // 네트워크 우선
  if (NETWORK_FIRST_PATTERNS.some((re) => re.test(url.pathname))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 캐시 우선
  if (CACHE_FIRST_PATTERNS.some((re) => re.test(url.pathname))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 기본: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (e) {
    const cached = await caches.match(request);
    return cached || new Response('오프라인입니다. 인터넷 연결을 확인해 주세요.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const fresh = await fetch(request);
    if (fresh.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (e) {
    return new Response('', { status: 504 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then((res) => {
    if (res.ok) cache.put(request, res.clone());
    return res;
  }).catch(() => cached);
  return cached || networkPromise;
}

/* 새 SW 활성화 메시지 처리 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
