/**
 * Shared notification center store
 * Manages seller pending, buyer pending, and ephemeral completion notifications
 * Integrates with WebSocket for real-time updates and HTTP polling as fallback
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NotificationCenterItem, NotificationItemType } from '@/types'
import api from '@/api/client'
import { useAuthStore } from './auth'
import { isDemoMode } from '@/services/mockData'

const SESSION_CACHE_KEY = 'notification_ephemeral_cache'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

interface CachedNotification extends NotificationCenterItem {
  expiresAt: string
}

/**
 * Load ephemeral notifications from sessionStorage
 */
function loadEphemeralCache(): NotificationCenterItem[] {
  const raw = sessionStorage.getItem(SESSION_CACHE_KEY)
  if (!raw) return []
  
  try {
    const cached = JSON.parse(raw) as CachedNotification[]
    const now = new Date()
    
    // Filter out expired entries
    const valid = cached.filter(item => new Date(item.expiresAt) > now)
    
    // Save back the filtered list
    if (valid.length !== cached.length) {
      saveEphemeralCache(valid)
    }
    
    return valid
  } catch {
    sessionStorage.removeItem(SESSION_CACHE_KEY)
    return []
  }
}

/**
 * Save ephemeral notifications to sessionStorage
 */
function saveEphemeralCache(items: NotificationCenterItem[]): void {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + CACHE_TTL_MS).toISOString()
  
  const cached: CachedNotification[] = items.map(item => ({
    ...item,
    expiresAt,
  }))
  
  sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cached))
}

export const useNotificationStore = defineStore('notifications', () => {
  const auth = useAuthStore()
  
  // State
  const sellerPending = ref<NotificationCenterItem[]>([])
  const buyerPending = ref<NotificationCenterItem[]>([])
  const ephemeral = ref<NotificationCenterItem[]>(loadEphemeralCache())
  const loading = ref(false)
  const lastFetch = ref<Date | null>(null)
  
  // Computed
  const allNotifications = computed(() => {
    const all = [...sellerPending.value, ...buyerPending.value, ...ephemeral.value]
    // Sort by createdAt descending
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  })
  
  const unreadCount = computed(() => allNotifications.value.length)
  
  /**
   * Fetch seller pending acceptance transfers
   */
  async function fetchSellerPending(): Promise<void> {
    if (!auth.state.accessToken || auth.isStaff) return
    
    try {
      const response = await api.get('/transfer/pending')
      const transfers = response.data?.data?.transfers ?? response.data?.data ?? []
      
      sellerPending.value = transfers.map((t: any) => ({
        id: `seller-pending:${t.transferId}`,
        type: 'seller_pending_acceptance' as NotificationItemType,
        title: 'Transfer Request',
        body: `Buyer wants to purchase your ticket for $${t.creditAmount || 0}`,
        createdAt: t.createdAt,
        primaryTo: t.sellerId || auth.state.user?.userId || '',
        transferId: t.transferId,
      }))
    } catch (error) {
      console.error('[Notifications] Failed to fetch seller pending:', error)
    }
  }
  
  /**
   * Fetch buyer pending OTP transfers
   */
  async function fetchBuyerPending(): Promise<void> {
    if (!auth.state.accessToken || auth.isStaff) return
    
    try {
      const response = await api.get('/transfer/my-pending')
      const transfers = response.data?.data?.transfers ?? []
      
      buyerPending.value = transfers.map((t: any) => ({
        id: `buyer-pending:${t.transferId}`,
        type: 'buyer_pending_otp' as NotificationItemType,
        title: 'Verify Transfer',
        body: `Complete OTP verification for ${t.event?.name || 'your ticket'}`,
        createdAt: t.createdAt,
        primaryTo: t.buyerId || auth.state.user?.userId || '',
        transferId: t.transferId,
      }))
    } catch (error) {
      // Endpoint might not exist yet, fail silently
      console.warn('[Notifications] Buyer pending endpoint not available:', error)
    }
  }
  
  /**
   * Add an ephemeral notification (transfer complete, ticket update)
   */
  function addEphemeral(item: Omit<NotificationCenterItem, 'id'>): void {
    const id = `${item.type}:${item.transferId || item.ticketId || Date.now()}`
    
    // Check if already exists
    if (ephemeral.value.some(n => n.id === id)) return
    
    const notification: NotificationCenterItem = {
      ...item,
      id,
    }
    
    ephemeral.value.push(notification)
    saveEphemeralCache(ephemeral.value)
  }
  
  /**
   * Dismiss a notification by ID
   */
  function dismiss(id: string): void {
    sellerPending.value = sellerPending.value.filter(n => n.id !== id)
    buyerPending.value = buyerPending.value.filter(n => n.id !== id)
    ephemeral.value = ephemeral.value.filter(n => n.id !== id)
    saveEphemeralCache(ephemeral.value)
  }
  
  /**
   * Fetch all notifications (seller + buyer pending)
   */
  async function fetchAll(): Promise<void> {
    if (!auth.state.accessToken || isDemoMode()) return
    
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
  
  /**
   * Handle WebSocket transfer update
   */
  function handleTransferUpdate(payload: any): void {
    const status = payload.status
    const transferId = payload.transferId
    const userId = auth.state.user?.userId
    
    if (!userId) return
    
    // If transfer completed, add ephemeral notification
    if (status === 'completed') {
      const isBuyer = payload.buyerId === userId
      const isSeller = payload.sellerId === userId
      
      if (isBuyer) {
        addEphemeral({
          type: 'transfer_completed',
          title: 'Transfer Complete',
          body: `You now own the ticket for ${payload.eventName || 'the event'}`,
          createdAt: payload.completedAt || new Date().toISOString(),
          primaryTo: userId,
          transferId,
        })
      } else if (isSeller) {
        addEphemeral({
          type: 'transfer_completed',
          title: 'Transfer Complete',
          body: `Your ticket has been transferred successfully`,
          createdAt: payload.completedAt || new Date().toISOString(),
          primaryTo: userId,
          transferId,
        })
      }
      
      // Remove from pending lists
      sellerPending.value = sellerPending.value.filter(n => n.transferId !== transferId)
      buyerPending.value = buyerPending.value.filter(n => n.transferId !== transferId)
    }
    
    // Refresh pending lists on status changes
    if (status === 'pending_seller_acceptance' || status === 'pending_buyer_otp') {
      fetchAll()
    }
  }
  
  /**
   * Handle WebSocket ticket update
   */
  function handleTicketUpdate(payload: any): void {
    const ticketId = payload.ticketId
    const ownerId = payload.ownerId
    const userId = auth.state.user?.userId
    
    if (!userId || ownerId !== userId) return
    
    // Add ephemeral notification for ticket ownership change
    if (payload.transferId) {
      addEphemeral({
        type: 'ticket_update',
        title: 'Ticket Updated',
        body: `Your ticket ownership has been updated`,
        createdAt: new Date().toISOString(),
        primaryTo: userId,
        ticketId,
        transferId: payload.transferId,
      })
    }
  }
  
  /**
   * Clear all notifications
   */
  function clearAll(): void {
    sellerPending.value = []
    buyerPending.value = []
    ephemeral.value = []
    saveEphemeralCache([])
  }
  
  return {
    // State
    sellerPending,
    buyerPending,
    ephemeral,
    loading,
    lastFetch,
    
    // Computed
    allNotifications,
    unreadCount,
    
    // Actions
    fetchAll,
    fetchSellerPending,
    fetchBuyerPending,
    addEphemeral,
    dismiss,
    handleTransferUpdate,
    handleTicketUpdate,
    clearAll,
  }
})
