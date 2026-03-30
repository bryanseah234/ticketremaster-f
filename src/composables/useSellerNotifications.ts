import { ref, onMounted, onUnmounted } from 'vue'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types'

interface NotificationState {
  loading: boolean
  error: string | null
  lastChecked: Date | null
}

export function useSellerNotifications() {
  const auth = useAuthStore()
  const state = ref<NotificationState>({
    loading: false,
    error: null,
    lastChecked: null,
  })

  const checkNotifications = async () => {
    if (!auth.state.accessToken) return

    state.value.loading = true
    state.value.error = null

    try {
      // Check for pending transfers
      const response = await api.get('/transfers/pending')
      const pendingCount = response.data?.count || 0

      if (pendingCount > 0) {
        // Dispatch custom event for UI notification
        window.dispatchEvent(
          new CustomEvent('seller:notifications', {
            detail: { pendingTransfers: pendingCount },
          })
        )
      }

      state.value.lastChecked = new Date()
    } catch (error) {
      state.value.error =
        error instanceof Error ? error.message : 'Failed to check notifications'
    } finally {
      state.value.loading = false
    }
  }

  let pollInterval: number | undefined

  onMounted(() => {
    // Poll every 30 seconds when component is mounted
    pollInterval = window.setInterval(checkNotifications, 30000)
    checkNotifications() // Initial check
  })

  onUnmounted(() => {
    if (pollInterval) {
      window.clearInterval(pollInterval)
    }
  })

  return {
    state: state.value,
    checkNotifications,
  }
}
