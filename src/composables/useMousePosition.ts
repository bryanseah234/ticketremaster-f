import { ref, onUnmounted, type Ref } from 'vue'

interface MousePosition {
  x: number
  y: number
}

export function useMousePosition(): { position: Ref<MousePosition> } {
  const position = ref<MousePosition>({ x: 0, y: 0 })

  // Throttle mousemove to ~60fps using rAF to avoid excessive reactive updates
  let rafPending = false
  let latestX = 0
  let latestY = 0

  const updatePosition = (event: MouseEvent) => {
    latestX = event.clientX
    latestY = event.clientY
    if (!rafPending) {
      rafPending = true
      requestAnimationFrame(() => {
        position.value = { x: latestX, y: latestY }
        rafPending = false
      })
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', updatePosition, { passive: true })
  }

  // Properly clean up the listener when the composable owner unmounts
  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', updatePosition)
    }
  })

  return { position }
}
