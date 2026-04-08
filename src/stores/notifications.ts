/**
 * Shared notification center store
 * Manages seller pending, buyer pending, and ephemeral completion notifications
 * Integrates with WebSocket for real-time updates and HTTP polling as fallback
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { NotificationCenterItem, NotificationItemType } from '@/types'
import api from '@/api/client'
import { useAuthStore } from './auth'
import { isDemoMode } from '@/services/mockData'

const SESSION_CACHE_KEY = 'notification_ephemeral_cache'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const POLL_INTERVAL_MS = 30 * 1000

interface CachedNotification extends NotificationCenterItem {
  expiresAt: string
}

function loadEphemeralCache(): NotificationCenterItem[] {
  const raw = sessionStorage.getItem(SESSION_CACHE_KEY)
  if (!raw) return []

  try {
    const cached = JSON.parse(raw) as CachedNotification[]
    const now = new Date()

    const valid = cached.filter(item => new Date(item.expiresAt) > now)

    if (valid.length !== cached.length) {
      saveEphemeralCache(valid)
    }

    return valid
  } catch {
    sessionStorage.removeItem(SESSION_CACHE_KEY)
    return []
  }
}

function saveEphemeralCache(items: NotificationCenterItem[]): void {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MS).toISOString()

  const cached: CachedNotification[] = items.map(item => ({
    ...item,
    expiresAt,
  }))

  sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cached))
}

function readTransfers(responseData: any): any[] {
  if (Array.isArray(responseData?.data?.transfers)) return responseData.data.transfers
  if (Array.isArray(responseData?.data)) return responseData.data
  if (Array.isArray(responseData?.transfers)) return responseData.transfers
  if (Array.isArray(responseData)) return responseData
  return []
}

function toIsoDate(value: any): string {
  if (typeof value === 'string' && value.trim()) return value
  return new Date().toISOString()
}

function transferIdOf(transfer: any): string {
  return transfer?.transferId || transfer?.transfer_id || transfer?.id || ''
}

function eventNameOf(transfer: any): string {
  return transfer?.event?.name || transfer?.eventName || transfer?.event_name || 'your ticket'
}

function seatLabelOf(transfer: any): string {
  const section = transfer?.seat?.section || transfer?.seatSection
  const row = transfer?.seat?.rowNumber || transfer?.seat?.row || transfer?.seatRow
  const seat = transfer?.seat?.seatNumber || transfer?.seat?.seat || transfer?.seatNumber

  const parts = [section ? `Section ${section}` : '', row ? `Row ${row}` : '', seat ? `Seat ${seat}` : '']
    .filter(Boolean)
  return parts.join(' · ')
}

function mapSellerPendingTransfer(transfer: any): NotificationCenterItem {
  const transferId = transferIdOf(transfer)
  const eventName = eventNameOf(transfer)
  const seatLabel = seatLabelOf(transfer)
  const buyerName = transfer?.buyerName || transfer?.buyer?.name || 'A buyer'

  return {
    id: `seller-pending:${transferId || transfer?.listingId || Date.now()}`,
    type: 'seller_pending_acceptance' as NotificationItemType,
    title: 'Transfer Request',
    body: `${buyerName} requested ${eventName}${seatLabel ? ` (${seatLabel})` : ''}.`,
    createdAt: toIsoDate(transfer?.createdAt || transfer?.created_at),
    primaryTo: transferId ? `/transfer/${transferId}` : '/notifications',
    transferId: transferId || undefined,
  }
}

function mapBuyerPendingTransfer(transfer: any): NotificationCenterItem {
  const transferId = transferIdOf(transfer)
  const eventName = eventNameOf(transfer)
  const seatLabel = seatLabelOf(transfer)

  return {
    id: `buyer-pending:${transferId || transfer?.listingId || Date.now()}`,
    type: 'buyer_pending_otp' as NotificationItemType,
    title: 'OTP Required',
    body: `Complete OTP verification for ${eventName}${seatLabel ? ` (${seatLabel})` : ''}.`,
    createdAt: toIsoDate(transfer?.createdAt || transfer?.created_at),
    primaryTo: transferId ? `/transfer/${transferId}` : '/notifications',
    transferId: transferId || undefined,
  }
}

export const useNotificationStore = defineStore('notifications', () => {
  const auth = useAuthStore()

  const sellerPending = ref<NotificationCenterItem[]>([])
  const buyerPending = ref<NotificationCenterItem[]>([])
  const ephemeral = ref<NotificationCenterItem[]>(loadEphemeralCache())
  const loading = ref(false)
  const lastFetch = ref<Date | null>(null)
  const initialized = ref(false)
  const realtimeConnected = ref(false)
  let pollTimer: number | undefined

  const allNotifications = computed(() => {
    const merged = [...sellerPending.value, ...buyerPending.value, ...ephemeral.value]
    const deduped = Array.from(new Map(merged.map(item => [item.id, item])).values())
    return deduped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })

  const unreadCount = computed(() => allNotifications.value.length)

  function startPolling(): void {
    if (pollTimer) return
    if (!auth.state.accessToken || auth.isStaff || auth.isAdmin || isDemoMode() || realtimeConnected.value) return

    pollTimer = window.setInterval(() => {
      void fetchAll()
    }, POLL_INTERVAL_MS)
  }

  function stopPolling(): void {
    if (pollTimer) {
      window.clearInterval(pollTimer)
      pollTimer = undefined
    }
  }

  function setRealtimeConnected(connected: boolean): void {
    realtimeConnected.value = connected
    if (connected) {
      stopPolling()
      return
    }
    startPolling()
  }

  function initialize(): void {
    if (initialized.value) return
    initialized.value = true
    void fetchAll()
    startPolling()
  }

  async function fetchSellerPending(): Promise<void> {
    if (!auth.state.accessToken || auth.isStaff || auth.isAdmin) {
      sellerPending.value = []
      return
    }

    try {
      const response = await api.get('/transfer/pending')
      sellerPending.value = readTransfers(response.data).map(mapSellerPendingTransfer)
    } catch (error) {
      console.error('[Notifications] Failed to fetch seller pending:', error)
      sellerPending.value = []
    }
  }

  async function fetchBuyerPending(): Promise<void> {
    if (!auth.state.accessToken || auth.isStaff || auth.isAdmin) {
      buyerPending.value = []
      return
    }

    try {
      const response = await api.get('/transfer/my-pending')
      buyerPending.value = readTransfers(response.data).map(mapBuyerPendingTransfer)
    } catch (error) {
      console.warn('[Notifications] Buyer pending endpoint not available:', error)
      buyerPending.value = []
    }
  }

  function addEphemeral(item: Omit<NotificationCenterItem, 'id'>): void {
    const id = `${item.type}:${item.transferId || item.ticketId || Date.now()}`
    if (ephemeral.value.some(n => n.id === id)) return

    const notification: NotificationCenterItem = {
      ...item,
      id,
    }

    ephemeral.value = [notification, ...ephemeral.value]
    saveEphemeralCache(ephemeral.value)
  }

  function dismiss(id: string): void {
    sellerPending.value = sellerPending.value.filter(n => n.id !== id)
    buyerPending.value = buyerPending.value.filter(n => n.id !== id)
    ephemeral.value = ephemeral.value.filter(n => n.id !== id)
    saveEphemeralCache(ephemeral.value)
  }

  async function fetchAll(): Promise<void> {
    if (!auth.state.accessToken || auth.isStaff || auth.isAdmin || isDemoMode()) {
      sellerPending.value = []
      buyerPending.value = []
      return
    }

    loading.value = true
    try {
      await Promise.all([
        fetchSellerPending(),
        fetchBuyerPending(),
      ])
      lastFetch.value = new Date()
    } finally {
      loading.value = false
    }
  }

  function handleTransferUpdate(payload: any): void {
    const transfer = payload?.transfer || payload || {}
    const status = transfer?.status
    const transferId = transferIdOf(transfer)
    const userId = auth.state.user?.userId

    if (!userId) return
    const isBuyer = transfer?.buyerId === userId
    const isSeller = transfer?.sellerId === userId
    const eventName = eventNameOf(transfer)

    if (status === 'completed' && (isBuyer || isSeller)) {
      if (isBuyer) {
        addEphemeral({
          type: 'transfer_completed',
          title: 'Transfer Complete',
          body: `Your transfer for ${eventName} is complete.`,
          createdAt: toIsoDate(transfer?.completedAt),
          primaryTo: '/tickets',
          transferId: transferId || undefined,
        })
      }
      if (isSeller) {
        addEphemeral({
          type: 'transfer_completed',
          title: 'Transfer Complete',
          body: `Your transfer of ${eventName} is complete.`,
          createdAt: toIsoDate(transfer?.completedAt),
          primaryTo: '/marketplace',
          transferId: transferId || undefined,
        })
      }

      sellerPending.value = sellerPending.value.filter(n => n.transferId !== transferId)
      buyerPending.value = buyerPending.value.filter(n => n.transferId !== transferId)
    }

    if (isBuyer || isSeller) {
      void fetchAll()
    }
  }

  function handleTicketUpdate(payload: any): void {
    const ticketId = payload?.ticketId
    const ownerId = payload?.ownerId || payload?.newOwnerId
    const userId = auth.state.user?.userId

    if (!userId || ownerId !== userId || !ticketId) return

    addEphemeral({
      type: 'ticket_update',
      title: 'Ticket Updated',
      body: payload?.eventName
        ? `${payload.eventName} is now available in your tickets.`
        : 'A ticket was updated in your account.',
      createdAt: new Date().toISOString(),
      primaryTo: '/tickets',
      ticketId,
      transferId: payload?.transferId,
    })
  }

  function clearAll(): void {
    sellerPending.value = []
    buyerPending.value = []
    ephemeral.value = []
    initialized.value = false
    realtimeConnected.value = false
    stopPolling()
    saveEphemeralCache([])
  }

  return {
    sellerPending,
    buyerPending,
    ephemeral,
    loading,
    lastFetch,
    initialized,
    realtimeConnected,

    allNotifications,
    unreadCount,

    initialize,
    setRealtimeConnected,
    fetchAll,
    fetchSellerPending,
    fetchBuyerPending,
    addEphemeral,
    dismiss,
    handleTransferUpdate,
    handleTicketUpdate,
    startPolling,
    stopPolling,
    clearAll,
  }
})
