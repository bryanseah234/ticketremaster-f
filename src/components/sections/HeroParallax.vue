<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import SearchBar from '@/components/ui/SearchBar.vue'
import { useMousePosition } from '@/composables/useMousePosition'

const rootRef = ref<HTMLElement | null>(null)
const { x, y } = useMousePosition(rootRef)

const layers = [
  { src: 'https://images.unsplash.com/photo-1503095396549-807759245b35?q=80&w=1200', top: '8%', left: '4%', depth: 0.015, width: '150px' },
  { src: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1200', top: '12%', left: '24%', depth: 0.02, width: '175px' },
  { src: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1200', top: '10%', left: '75%', depth: 0.024, width: '170px' },
  { src: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200', top: '56%', left: '8%', depth: 0.028, width: '185px' },
  { src: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=1200', top: '60%', left: '73%', depth: 0.027, width: '175px' },
  { src: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200', top: '67%', left: '42%', depth: 0.018, width: '160px' },
]

const pos = reactive(layers.map(() => ({ x: 0, y: 0 })))
let raf = 0
const animate = () => {
  layers.forEach((layer, i) => {
    const tx = x.value * layer.depth
    const ty = y.value * layer.depth
    pos[i].x += (tx - pos[i].x) * 0.07
    pos[i].y += (ty - pos[i].y) * 0.07
  })
  raf = requestAnimationFrame(animate)
}
onMounted(() => (raf = requestAnimationFrame(animate)))
onUnmounted(() => cancelAnimationFrame(raf))
</script>

<template>
  <section ref="rootRef" class="hero">
    <div class="noise"></div>

    <div
      v-for="(layer, i) in layers"
      :key="layer.src"
      class="floating"
      :style="{ top: layer.top, left: layer.left, width: layer.width, transform: `translate3d(${pos[i].x}px, ${pos[i].y}px, 0)` }"
    >
      <img :src="layer.src" alt="live event" />
    </div>

    <div class="center">
      <h1>An improved way to sell, buy and enjoy live events.</h1>
      <SearchBar />
    </div>
  </section>
</template>

<style scoped>
.hero{position:relative;min-height:85vh;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 30% -10%, #56240d 0%, #0f0f12 45%)}
.noise{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.22),rgba(0,0,0,.65));z-index:0}
.floating{position:absolute;z-index:1;aspect-ratio:4/5;border-radius:1rem;border:1px solid rgba(255,255,255,.2);overflow:hidden;box-shadow:0 20px 38px rgba(0,0,0,.45)}
.floating img{width:100%;height:100%;object-fit:cover}
.center{z-index:3;display:grid;gap:1rem;max-width:760px;width:calc(100% - 2rem);text-align:center}
h1{font-size:clamp(1.8rem, 4.5vw, 3.6rem);line-height:1.08;letter-spacing:-.02em}
@media (max-width:920px){.floating{display:none}.hero{min-height:72vh}}
</style>
