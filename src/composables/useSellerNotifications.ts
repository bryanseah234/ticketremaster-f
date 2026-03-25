import { ref, watch } from 'vue'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'

export interface SellerNotification {
  transferId: string
  creditAmount: number
  createdAt: string
}

const notifications = ref<SellerNotification[]>([])
const seen = ref<Set<string>>(new Set())
let timer: number | undefined
let initialized = false

async function poll() {
  const auth = useAuthStore()
  if (!auth.isLoggedIn) return
  try {
    const { data } = await api.get('/transfer/pending')
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
  } catch {
    // silent
  }
}

function startPolling() {
  clearInterval(timer)
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
