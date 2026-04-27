// 온마음 Service Worker — cache-first + dynamic GET fallback
const CACHE_NAME = 'onmaum-v1'

const PRECACHE_URLS = [
  '/',
  '/stats',
  '/manifest.json',
  '/icon.svg',
  '/icon-maskable.svg',
  '/models/ssd_mobilenetv1_model-weights_manifest.json',
  '/models/ssd_mobilenetv1_model-shard1',
  '/models/ssd_mobilenetv1_model-shard2',
  '/models/face_landmark_68_model-weights_manifest.json',
  '/models/face_landmark_68_model-shard1',
  '/models/face_expression_model-weights_manifest.json',
  '/models/face_expression_model-shard1',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => console.error('[SW] precache 실패:', err)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  // Next.js HMR / dev resources는 SW가 가로채지 않음 (개발 충돌 방지)
  const url = new URL(event.request.url)
  if (url.pathname.startsWith('/_next/webpack-hmr')) return
  if (url.pathname.startsWith('/_next/static/development')) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request)
        .then((response) => {
          // 정상 응답만 캐시 (opaque/error 제외)
          if (!response.ok || response.type === 'opaque') return response
          const clone = response.clone()
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone))
            .catch(() => {})
          return response
        })
        .catch(() => {
          // 네트워크 실패 시 fallback (오프라인)
          if (event.request.destination === 'document') {
            return caches.match('/')
          }
          return new Response('', { status: 504 })
        })
    }),
  )
})
