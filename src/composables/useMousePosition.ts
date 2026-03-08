import { onMounted, onUnmounted, ref, type Ref } from 'vue'

export function useMousePosition(containerRef?: Ref<HTMLElement | null>) {
  const x = ref(0)
  const y = ref(0)

  const updatePosition = (clientX: number, clientY: number) => {
    const container = containerRef?.value
    if (container) {
      const rect = container.getBoundingClientRect()
      x.value = clientX - rect.left - rect.width / 2
      y.value = clientY - rect.top - rect.height / 2
    } else {
      x.value = clientX
      y.value = clientY
    }
  }

  const onMove = (ev: MouseEvent) => updatePosition(ev.clientX, ev.clientY)
  const onTouch = (ev: TouchEvent) => {
    const touch = ev.touches[0]
    if (touch) updatePosition(touch.clientX, touch.clientY)
  }

  onMounted(() => {
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onTouch, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('touchmove', onTouch)
  })

  return { x, y }
}
