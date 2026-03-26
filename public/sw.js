const CACHE_NAME = 'ticketremaster-v1'
const ASSETS = ['/', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)))
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  // Let browser handle SPA navigations — only cache static assets
  if (event.request.mode === 'navigate') return
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).catch(() => new Response('', { status: 408 }))
    })
  )
})
