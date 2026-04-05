<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { isDemoMode, mockEvents } from '@/services/mockData'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const balance = ref(0)
const order = ref<any>(null)
const loading = ref(false)
const holdSeconds = ref(0)
const ticket = ref<any>(null)
const eventName = ref('')
let holdTimer: number | undefined

const seatPrice = computed(() => Number(order.value?.seat?.price || 0))
const serviceFee = computed(() => Number((seatPrice.value * 0.098).toFixed(2)))
const processingFee = computed(() => (seatPrice.value ? 4.2 : 0))
const totalAmount = computed(() => Number((seatPrice.value + serviceFee.value + processingFee.value).toFixed(2)))
const hasEnoughCredits = computed(() => balance.value >= totalAmount.value)
const remainingBalance = computed(() => Math.max(0, balance.value - totalAmount.value))

const holdDisplay = computed(() => {
  const m = Math.floor(holdSeconds.value / 60)
  const s = holdSeconds.value % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const holdWarning = computed(() => holdSeconds.value > 0 && holdSeconds.value < 60)

const loadOrder = () => {
  const raw = localStorage.getItem('pendingOrder')
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.orderId === route.params.orderId) {
      order.value = parsed
      const heldUntil = parsed?.heldUntil
      if (heldUntil) {
        holdSeconds.value = Math.max(0, Math.floor((new Date(heldUntil).getTime() - Date.now()) / 1000))
        holdTimer = window.setInterval(() => {
          holdSeconds.value = Math.max(0, holdSeconds.value - 1)
        }, 1000)
      }
    }
  } catch {
    order.value = null
  }
}

const loadEventName = async () => {
  if (!order.value?.eventId) return
  if (isDemoMode()) {
    const found = mockEvents.find((event) => event.eventId === order.value.eventId)
    eventName.value = found?.name || 'Demo Event'
    return
  }
  try {
    const { data } = await api.get(`/events/${order.value.eventId}`)
    eventName.value = data?.data?.name || data?.name || ''
  } catch {
    eventName.value = ''
  }
}

const loadBalance = async () => {
  if (isDemoMode()) {
    const stored = sessionStorage.getItem('demo_balance')
    balance.value = stored !== null ? parseFloat(stored) : 500
    return
  }
  try {
    const { data } = await api.get('/credits/balance')
    balance.value = data?.data?.creditBalance || 0
  } catch {
    balance.value = 0
  }
}

const releaseHold = async () => {
  if (isDemoMode()) {
    localStorage.removeItem('pendingOrder')
    return
  }
  const raw = localStorage.getItem('pendingOrder')
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    const inventoryId = parsed?.inventoryId || route.params.orderId
    const holdToken = parsed?.holdToken || ''
    await api.delete(`/purchase/hold/${inventoryId}`, { data: { holdToken } })
  } catch (error) {
    console.error('Failed to release hold:', error)
  }
  localStorage.removeItem('pendingOrder')
}

const cancel = async () => {
  await releaseHold()
  if (holdTimer) clearInterval(holdTimer)
  router.push(order.value?.eventId ? `/events/${order.value.eventId}` : '/events')
}

const pay = async () => {
  loading.value = true
  try {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 1400))
      localStorage.removeItem('pendingOrder')
      if (holdTimer) clearInterval(holdTimer)
      const currentBalance = parseFloat(sessionStorage.getItem('demo_balance') || '500')
      sessionStorage.setItem('demo_balance', String(Math.max(0, currentBalance - totalAmount.value)))
      ticket.value = {
        ticketId: `demo-ticket-${Date.now()}`,
        eventId: order.value?.eventId || '',
        inventoryId: order.value?.inventoryId || '',
        price: totalAmount.value,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      return
    }

    const inventoryId = order.value?.inventoryId || route.params.orderId
    const { data } = await api.post(
      `/purchase/confirm/${inventoryId}`,
      { holdToken: order.value?.holdToken || '', eventId: order.value?.eventId || '' },
      { headers: { 'Idempotency-Key': crypto.randomUUID() } },
    )
    localStorage.removeItem('pendingOrder')
    if (holdTimer) clearInterval(holdTimer)
    ticket.value = data?.data
  } catch (error: any) {
    const errorCode = error?.response?.data?.error?.code || error?.response?.data?.error_code
    const status = error?.response?.status
    if (errorCode === 'INSUFFICIENT_CREDITS' || status === 402) {
      toast.push('Not enough credits. Redirecting to top up.', 'error', 3200)
      router.push('/credits/topup')
    } else if (errorCode === 'PAYMENT_HOLD_EXPIRED' || status === 410) {
      toast.push('Seat hold expired. Please select a seat again.', 'error', 3200)
      localStorage.removeItem('pendingOrder')
      router.push(`/events/${order.value?.eventId}`)
    } else if (errorCode === 'SEAT_UNAVAILABLE' || status === 409) {
      toast.push('Seat no longer available. Please select another.', 'error', 3200)
      router.push(`/events/${order.value?.eventId}`)
    } else if (errorCode === 'VALIDATION_ERROR' || status === 400) {
      toast.push('Invalid request. Please try again.', 'error', 3200)
    } else {
      toast.push('Payment failed. Please try again.', 'error', 3200)
    }
  } finally {
    loading.value = false
  }
}

onBeforeRouteLeave(async (_to, _from, next) => {
  if (!ticket.value) await releaseHold()
  if (holdTimer) clearInterval(holdTimer)
  next()
})

onMounted(async () => {
  loadOrder()
  await Promise.all([loadBalance(), loadEventName()])
})

onUnmounted(() => {
  if (holdTimer) clearInterval(holdTimer)
})
</script>

<template>
  <section class="checkout-page">
    <template v-if="ticket">
      <article class="success-shell panel">
        <span class="eyebrow">Purchase Complete</span>
        <h1>Ticket secured.</h1>
        <p>Your order for {{ eventName || order?.event?.name || 'this event' }} has been confirmed and moved into your wallet.</p>
        <div class="success-grid">
          <div><span class="meta-label">Ticket ID</span><strong>{{ ticket.ticketId }}</strong></div>
          <div><span class="meta-label">Status</span><strong>{{ ticket.status?.toUpperCase() || 'ACTIVE' }}</strong></div>
          <div><span class="meta-label">Price Paid</span><strong>SGD {{ Number(ticket.price ?? totalAmount).toFixed(2) }}</strong></div>
          <div><span class="meta-label">Seat</span><strong>{{ order?.seat ? `${order.seat.rowNumber}-${order.seat.seatNumber}` : 'Assigned' }}</strong></div>
        </div>
        <div class="hero-actions">
          <RouterLink :to="`/tickets/${ticket.ticketId}`"><button>Show QR Code</button></RouterLink>
          <RouterLink to="/tickets"><button class="secondary">My Tickets</button></RouterLink>
        </div>
      </article>
    </template>

    <template v-else>
      <header class="checkout-header">
        <span class="eyebrow">Finalize Order</span>
        <h1>{{ eventName || order?.event?.name || 'Checkout' }}</h1>
        <p>Confirm the held seat, review your balance, and complete the credit purchase before the reservation window closes.</p>
      </header>

      <div class="checkout-grid">
        <section class="payment-column">
          <article class="payment-card panel">
            <h2>Pay with Credits</h2>
            <div class="wallet-panel">
              <div><span class="meta-label">Available Balance</span><strong>SGD {{ balance.toFixed(2) }}</strong></div>
              <div><span class="meta-label">Remaining Balance</span><strong :class="{ warning: !hasEnoughCredits }">SGD {{ remainingBalance.toFixed(2) }}</strong></div>
            </div>

            <div class="summary-lines">
              <div><span>Seat price</span><strong>SGD {{ seatPrice.toFixed(2) }}</strong></div>
              <div><span>Service fee</span><strong>SGD {{ serviceFee.toFixed(2) }}</strong></div>
              <div><span>Processing</span><strong>SGD {{ processingFee.toFixed(2) }}</strong></div>
              <div class="summary-total"><span>Total amount</span><strong>SGD {{ totalAmount.toFixed(2) }}</strong></div>
            </div>

            <p v-if="!hasEnoughCredits" class="warning-copy">Insufficient credits. Top up before this hold expires.</p>

            <div class="hero-actions">
              <button :disabled="loading || !hasEnoughCredits" @click="pay">{{ loading ? 'Processing...' : 'Confirm Purchase' }}</button>
              <button class="secondary" @click="cancel">Cancel</button>
            </div>
          </article>
        </section>

        <aside class="summary-column">
          <article class="timer-card panel" :class="{ warning: holdWarning }">
            <div><span class="meta-label">Time Remaining</span><strong>{{ holdSeconds > 0 ? holdDisplay : 'Expired' }}</strong></div>
            <span class="status-pill">{{ holdSeconds > 0 ? 'Reserved' : 'Expired' }}</span>
          </article>

          <article class="order-card panel">
            <h2>Order Summary</h2>
            <div class="order-card-top">
              <img v-if="order?.event?.image" :src="order.event.image" :alt="order.event.name" />
              <div>
                <strong>{{ eventName || order?.event?.name || 'Held seat' }}</strong>
                <p>{{ order?.seat ? `Seat ${order.seat.rowNumber}-${order.seat.seatNumber}` : 'Seat pending' }}</p>
                <p>{{ order?.event?.eventDate ? new Date(order.event.eventDate).toLocaleString() : 'Date TBA' }}</p>
              </div>
            </div>
            <p class="security-copy">Secure credit transaction • Instant fulfillment • Final sale</p>
          </article>
        </aside>
      </div>
    </template>
  </section>
</template>

<style scoped>
.checkout-page, .checkout-header, .success-shell, .payment-card, .order-card { display: grid; gap: 1rem; }
.checkout-header h1, .success-shell h1 {
  margin: 0; font-family: var(--font-display); font-size: clamp(2.6rem, 6vw, 4.8rem); line-height: .95; letter-spacing: -.05em;
}
.checkout-header p, .success-shell p { margin: 0; color: var(--text-muted); max-width: 44rem; line-height: 1.7; }
.eyebrow, .meta-label { font-size: .7rem; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; }
.eyebrow { color: var(--primary); }
.meta-label { color: var(--text-dim); }
.checkout-grid { display: grid; grid-template-columns: minmax(0,1.3fr) minmax(20rem,.85fr); gap: 1.25rem; align-items: start; }
.payment-card { padding: 1.5rem; }
.payment-card h2, .order-card h2 { margin: 0; font-size: 1.3rem; }
.wallet-panel {
  display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1rem; padding: 1.2rem;
  border-radius: var(--radius-md); background: rgba(249,115,22,.08); border: 1px solid rgba(249,115,22,.18);
}
.wallet-panel strong, .timer-card strong { display: block; margin-top: .3rem; font-size: 1.8rem; line-height: 1; }
.summary-lines { display: grid; gap: .7rem; }
.summary-lines > div { display: flex; justify-content: space-between; gap: 1rem; }
.summary-lines span { color: var(--text-muted); }
.summary-total { padding-top: .8rem; border-top: 1px solid rgba(255,255,255,.06); }
.summary-total strong { color: var(--primary); }
.warning, .warning-copy { color: #f6a94d; }
.hero-actions { display: flex; gap: .8rem; flex-wrap: wrap; }
.summary-column { display: grid; gap: 1rem; }
.timer-card, .order-card { padding: 1.2rem; }
.timer-card { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
.status-pill {
  padding: .45rem .7rem; border-radius: 999px; background: rgba(249,115,22,.14); color: var(--primary);
  font-size: .7rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase;
}
.order-card-top { display: grid; grid-template-columns: 5rem minmax(0,1fr); gap: 1rem; }
.order-card-top img { width: 100%; aspect-ratio: 1 / 1; border-radius: 1rem; object-fit: cover; }
.order-card-top strong { display: block; margin-bottom: .35rem; }
.order-card-top p, .security-copy { margin: 0; color: var(--text-muted); line-height: 1.6; }
.success-shell { padding: 1.75rem; max-width: 52rem; }
.success-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1rem; padding: 1rem 0; }
.success-grid strong { display: block; margin-top: .35rem; }
@media (max-width: 900px) {
  .checkout-grid, .wallet-panel, .success-grid { grid-template-columns: 1fr; }
}
</style>
