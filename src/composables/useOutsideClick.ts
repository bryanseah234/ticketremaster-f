import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export function useOutsideClick(
  handler: () => void
): { ref: Ref<HTMLElement | null> } {
  const elementRef = ref<HTMLElement | null>(null)

  const handleClickOutside = (event: MouseEvent) => {
    if (
      elementRef.value &&
      !elementRef.value.contains(event.target as Node)
    ) {
      handler()
    }
  }

  onMounted(() => {
    document.addEventListener('mousedown', handleClickOutside)
  })

  onUnmounted(() => {
    document.removeEventListener('mousedown', handleClickOutside)
  })

  return { ref: elementRef }
}
