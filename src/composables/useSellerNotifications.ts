import { ref, watch } from 'vue'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

export interface SellerNotification {
  transferId: string
  creditAmount: number
  createdAt: string
}

const notifications = ref<SellerNotification[]>([])
const seen = ref<Set<string>>(new Set())
let timer: number | undefined
let initialized = false
let endpointVerified = false
let endpointAvailable = true

async function poll() {
  const auth = useAuthStore()
  if (!auth.isLoggedIn) return
  
  // Skip polling if endpoint is known to be unavailable
  if (!endpointAvailable) return
  
  try {
    const { data } = await api.get('/transfer/pending')
    endpointVerified = true
    endpointAvailable = true
    
    const transfers: any[] = data?.data?.transfers || []

    const fresh = transfers.filter((t) => !seen.value.has(t.transferId))
    if (fresh.length) {
      fresh.forEach((t) => seen.value.add(t.transferId))
      notifications.value = [
        ...fresh.map((t) => ({
          transferId: t.transferId,
          creditAmount: t.creditAmount,
          createdAt: t.createdAt,
        })),
        ...notifications.value,
      ]
    }

    const activeIds = new Set(transfers.map((t) => t.transferId))
    notifications.value = notifications.value.filter((n) => activeIds.has(n.transferId))
  } catch (e: any) {
    const status = e?.response?.status
    
    // If endpoint returns 404, it doesn't exist - stop polling
    if (status === 404 && !endpointVerified) {
      endpointAvailable = false
      console.warn('Transfer pending endpoint not available. Disabling notification polling.')
      return
    }
    
    // For other errors (401, 403, network), keep trying but don't spam
    if (status === 401 || status === 403) {
      endpointAvailable = false
      return
    }
    
    // Silent fail for transient errors - will retry on next poll
  }
}

function startPolling() {
  clearInterval(timer)
  endpointAvailable = true // Reset on start
  poll()
  timer = window.setInterval(poll, 8_000)
}

function stopPolling() {
  clearInterval(timer)
  timer = undefined
}

function initWatcher() {
  if (initialized) return
  initialized = true
  const auth = useAuthStore()
  watch(
    () => auth.isLoggedIn,
    (loggedIn) => {
      if (loggedIn) {
        startPolling()
      } else {
        stopPolling()
        notifications.value = []
        seen.value = new Set()
        endpointAvailable = true // Reset for next login
      }
    },
    { immediate: true },
  )
}

export function resetNotifications() {
  notifications.value = []
  seen.value = new Set()
}

export function useSellerNotifications() {
  initWatcher()

  const dismiss = (transferId: string) => {
    seen.value.add(transferId)
    notifications.value = notifications.value.filter((n) => n.transferId !== transferId)
  }

  const dismissAll = () => {
    notifications.value.forEach((n) => seen.value.add(n.transferId))
    notifications.value = []
  }

  return { notifications, dismiss, dismissAll }
}
