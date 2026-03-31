const CACHE_NAME = 'ticketremaster-v4'
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
  if (event.request.method !== 'GET') return
  if (event.request.mode === 'navigate') return
  event.respondWith(
    fetch(event.request)
      .then(res => {
        const resClone = res.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone))
        return res
      })
      .catch(() => caches.match(event.request).then(r => r || new Response('', { status: 408 })))
  )
})
