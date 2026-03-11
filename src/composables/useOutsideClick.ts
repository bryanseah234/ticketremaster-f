import { onMounted, onUnmounted, type Ref } from 'vue'

export function useOutsideClick(targetRef: Ref<HTMLElement | null>, callback: () => void) {
  const listener = (event: Event) => {
    const target = targetRef.value
    if (!target || target.contains(event.target as Node)) return
    callback()
  }

  onMounted(() => {
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
  })

  onUnmounted(() => {
    document.removeEventListener('mousedown', listener)
    document.removeEventListener('touchstart', listener)
  })
}
