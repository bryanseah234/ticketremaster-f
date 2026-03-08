<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let raf = 0
let rotation = 0
let lastTime = 0
const rotationSpeed = 26
const earthTexture = new Image()
earthTexture.crossOrigin = 'anonymous'
earthTexture.src = 'https://upload.wikimedia.org/wikipedia/commons/8/80/Equirectangular-projection.jpg'

const locations = [
  { lat: 1.3521, lon: 103.8198 },
  { lat: -33.8688, lon: 151.2093 },
  { lat: 34.0522, lon: -118.2437 },
  { lat: 51.5074, lon: -0.1278 },
  { lat: 40.7128, lon: -74.006 },
  { lat: 41.8781, lon: -87.6298 },
  { lat: 6.5244, lon: 3.3792 },
  { lat: 37.5665, lon: 126.978 },
  { lat: 48.8566, lon: 2.3522 },
  { lat: -8.4095, lon: 115.1889 },
  { lat: 40.4168, lon: -3.7038 },
  { lat: 37.9838, lon: 23.7275 },
  { lat: 43.6532, lon: -79.3832 },
  { lat: 25.2854, lon: 51.531 },
  { lat: 49.2827, lon: -123.1207 },
]

const resizeCanvas = () => {
  const c = canvasRef.value
  if (!c) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const nextWidth = Math.max(1, Math.floor(c.clientWidth * dpr))
  const nextHeight = Math.max(1, Math.floor(c.clientHeight * dpr))
  if (c.width !== nextWidth || c.height !== nextHeight) {
    c.width = nextWidth
    c.height = nextHeight
  }
}

const draw = (time: number) => {
  const c = canvasRef.value
  if (!c || !earthTexture.complete) {
    raf = requestAnimationFrame(draw)
    return
  }

  const ctx = c.getContext('2d')
  if (!ctx) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const w = c.width / dpr
  const h = c.height / dpr
  const r = Math.min(w, h) * 0.34
  const cx = w / 2
  const cy = h / 2

  ctx.clearRect(0, 0, w, h)

  const glow = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.2, cx, cy, r * 1.4)
  glow.addColorStop(0, 'rgba(145, 214, 255, 0.25)')
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(cx, cy, r * 1.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  const patternWidth = r * 2.8
  const patternHeight = r * 2
  const offset = (rotation % (patternWidth / 2))
  ctx.drawImage(earthTexture, -offset + cx - patternWidth / 2, cy - patternHeight / 2, patternWidth, patternHeight)
  ctx.drawImage(earthTexture, -offset + cx, cy - patternHeight / 2, patternWidth, patternHeight)

  const shading = ctx.createRadialGradient(cx - r * 0.36, cy - r * 0.3, r * 0.2, cx, cy, r)
  shading.addColorStop(0, 'rgba(255,255,255,0.32)')
  shading.addColorStop(1, 'rgba(0,0,0,0.38)')
  ctx.fillStyle = shading
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  ctx.restore()

  ctx.strokeStyle = 'rgba(255,255,255,.2)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  const rotationAngle = (rotation / (patternWidth / 2)) * Math.PI
  locations.forEach((location) => {
    const lat = (location.lat * Math.PI) / 180
    const lon = (location.lon * Math.PI) / 180
    const x = Math.cos(lat) * Math.cos(lon)
    const y = Math.sin(lat)
    const z = Math.cos(lat) * Math.sin(lon)
    const cosA = Math.cos(rotationAngle)
    const sinA = Math.sin(rotationAngle)
    const xr = x * cosA + z * sinA
    const zr = -x * sinA + z * cosA
    if (zr < 0) return
    const px = cx + xr * r
    const py = cy - y * r
    const depth = Math.min(1, Math.max(0, (zr + 0.15) / 1.15))
    const size = 2.2 + depth * 2.2
    ctx.beginPath()
    ctx.fillStyle = `rgba(255, 186, 126, ${0.28 + depth * 0.45})`
    ctx.arc(px, py, size, 0, Math.PI * 2)
    ctx.fill()
  })

  if (!lastTime) lastTime = time
  const delta = Math.min(48, time - lastTime)
  rotation += (delta / 1000) * rotationSpeed
  lastTime = time
  raf = requestAnimationFrame(draw)
}

onMounted(() => {
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  raf = requestAnimationFrame(draw)
})
onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  cancelAnimationFrame(raf)
})
</script>

<template>
  <section class="page" style="padding-top:.8rem;padding-bottom:4rem;">
    <div class="grid-2">
      <canvas ref="canvasRef" class="glass globe"></canvas>
      <article class="glass cta">
        <h2 class="section-title">Host your event with TicketRemaster</h2>
        <p class="section-subtitle">Launch, sell, and manage verified resale with one organizer dashboard trusted across global venues.</p>
        <button class="list-btn">List your event</button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.globe{width:100%;height:440px}
.cta{padding:1.2rem;display:grid;align-content:center;justify-items:start;gap:.75rem}
.list-btn{width:auto}
@media (max-width:920px){.globe{height:320px}}
</style>
