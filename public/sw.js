const CACHE_NAME = 'ticketremaster-v3'
const ASSETS = ['/', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  // Activate immediately to take over the old sw.js
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
})

self.addEventListener('activate', (event) => {
  // Wipe out the old ticketremaster-v1 cache to unfreeze the frontend!
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key)
        })
      )
    }).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  const isSameOrigin = url.origin === self.location.origin
  const isApiPath = url.pathname.includes('/api/') || url.pathname.includes('/proxy/')

  // NEVER intercept: non-GET requests, cross-origin API calls (direct orchestrator ports), or known API paths
  if (event.request.method !== 'GET' || !isSameOrigin || isApiPath) {
    // Pass through directly — do NOT return a fallback 408 response on failure
    return
  }

  // Network First for all other requests (so JS bundles always update!)
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const resClone = res.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone))
        return res
      })
      .catch(() => caches.match(event.request))
  )
})
