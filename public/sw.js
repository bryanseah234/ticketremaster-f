const CACHE_NAME = 'ticketremaster-v2'
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
  // NEVER cache API or proxy routes!
  if (event.request.method !== 'GET' || event.request.url.includes('/api/') || event.request.url.includes('/proxy/')) {
    event.respondWith(
      fetch(event.request).catch(err => {
        console.error('Service Worker Fetch Failed:', err)
        return new Response(JSON.stringify({ error: { message: "Network Error" } }), {
          status: 408,
          headers: { 'Content-Type': 'application/json' }
        })
      })
    )
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
