import { onMounted, onUnmounted, ref } from 'vue'

const readOfflineState = () => Boolean((window as unknown as Record<string, unknown>).__apiOffline)

export const useApiOffline = () => {
  const offline = ref(readOfflineState())

  const handleOffline = () => {
    offline.value = true
  }

  const handleOnline = () => {
    offline.value = false
  }

  onMounted(() => {
    offline.value = readOfflineState()
    window.addEventListener('api:offline', handleOffline)
    window.addEventListener('api:online', handleOnline)
  })

  onUnmounted(() => {
    window.removeEventListener('api:offline', handleOffline)
    window.removeEventListener('api:online', handleOnline)
  })

  return offline
}
