const CACHE_NAME = 'nutritrack-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
]

// Install: cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  )
})

// Activate: remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only handle same-origin or API requests
  if (event.request.method !== 'GET') return

  // API requests: network-first, fall back to cached response
  if (url.pathname.startsWith('/api/') || url.port === '3001') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return res
        })
        .catch(() => caches.match(event.request))
    )
    return
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((res) => {
        if (res.ok && event.request.url.startsWith(self.location.origin)) {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, res.clone()))
        }
        return res
      })
    })
  )
})

// Background sync for queued mutations
self.addEventListener('sync', (event) => {
  if (event.tag === 'nutritrack-sync') {
    event.waitUntil(processSyncQueue())
  }
})

async function processSyncQueue() {
  // Sync queue processing is handled client-side via the SyncQueue module
  const clients = await self.clients.matchAll()
  for (const client of clients) {
    client.postMessage({ type: 'SYNC_REQUESTED' })
  }
}
