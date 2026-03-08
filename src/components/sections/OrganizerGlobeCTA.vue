<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let raf = 0
let rotation = 0
const earthTexture = new Image()
earthTexture.crossOrigin = 'anonymous'
earthTexture.src = 'https://upload.wikimedia.org/wikipedia/commons/8/80/Equirectangular-projection.jpg'

const draw = () => {
  const c = canvasRef.value
  if (!c || !earthTexture.complete) {
    raf = requestAnimationFrame(draw)
    return
  }

  const ctx = c.getContext('2d')
  if (!ctx) return

  const w = c.width
  const h = c.height
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

  rotation += 0.35
  raf = requestAnimationFrame(draw)
}

onMounted(() => {
  const c = canvasRef.value
  if (!c) return
  c.width = c.clientWidth
  c.height = c.clientHeight
  raf = requestAnimationFrame(draw)
})
onUnmounted(() => cancelAnimationFrame(raf))
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
