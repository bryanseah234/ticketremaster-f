import { ref, type Ref } from 'vue'

interface MousePosition {
  x: number
  y: number
}

export function useMousePosition(): { position: Ref<MousePosition> } {
  const position = ref<MousePosition>({ x: 0, y: 0 })

  const updatePosition = (event: MouseEvent) => {
    position.value = { x: event.clientX, y: event.clientY }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', updatePosition)
  }

  return { position }
}
