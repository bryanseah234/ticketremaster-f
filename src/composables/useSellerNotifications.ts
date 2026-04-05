import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { isDemoMode, mockTransfers } from '@/services/mockData'

interface NotificationItem {
  transferId: string
  creditAmount: number
  createdAt: string
}

interface NotificationState {
  loading: boolean
  error: string | null
  lastChecked: Date | null
  notifications: NotificationItem[]
}

export function useSellerNotifications() {
  const auth = useAuthStore()
  const state = ref<NotificationState>({
    loading: false,
    error: null,
    lastChecked: null,
    notifications: [],
  })

  const checkNotifications = async () => {
    if (!auth.state.accessToken) return

    state.value.loading = true
    state.value.error = null

    try {
      if (isDemoMode()) {
        state.value.notifications = auth.isStaff
          ? []
          : mockTransfers.map((t) => ({
              transferId: t.transferId,
              creditAmount: 180,
              createdAt: t.createdAt,
            }))
        state.value.lastChecked = new Date()
        return
      }

      // Check for pending transfers
      const response = await api.get('/transfer/pending')
      const pendingTransfers = response.data?.data?.transfers ?? response.data?.data ?? []

      if (pendingTransfers.length > 0) {
        state.value.notifications = pendingTransfers.map((t: any) => ({
          transferId: t.transferId,
          creditAmount: t.creditAmount || 0,
          createdAt: t.createdAt,
        }))

        // Dispatch custom event for UI notification
        window.dispatchEvent(
          new CustomEvent('seller:notifications', {
            detail: { pendingTransfers: pendingTransfers.length },
          })
        )
      } else {
        state.value.notifications = []
      }

      state.value.lastChecked = new Date()
    } catch (error) {
      state.value.error =
        error instanceof Error ? error.message : 'Failed to check notifications'
    } finally {
      state.value.loading = false
    }
  }

  const dismiss = (transferId: string) => {
    state.value.notifications = state.value.notifications.filter(n => n.transferId !== transferId)
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
    notifications: computed(() => state.value.notifications),
    checkNotifications,
    dismiss,
  }
}
