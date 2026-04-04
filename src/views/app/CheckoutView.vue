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

const seatPrice = computed(() => order.value?.seat?.price || 0)
const hasEnoughCredits = computed(() => balance.value >= seatPrice.value)

const holdDisplay = computed(() => {
  const m = Math.floor(holdSeconds.value / 60)
  const s = holdSeconds.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
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

  // In demo mode, look up from mock data
  if (isDemoMode()) {
    const found = mockEvents.find(e => e.eventId === order.value.eventId)
    eventName.value = found?.name || 'Demo Event'
    return
  }

  // Try fetching from API
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
  } catch (e) {
    console.error('Failed to release hold:', e)
    try {
      const parsed = JSON.parse(raw)
      const inventoryId = parsed?.inventoryId || route.params.orderId
      const holdToken = parsed?.holdToken || ''
      await new Promise(resolve => setTimeout(resolve, 500))
      await api.delete(`/purchase/hold/${inventoryId}`, { data: { holdToken } })
    } catch (retryErr) {
      console.error('Retry release hold failed:', retryErr)
    }
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
    // Demo mode: simulate successful purchase after 1.5s
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      localStorage.removeItem('pendingOrder')
      if (holdTimer) clearInterval(holdTimer)
      // Deduct from demo balance
      const currentBalance = parseFloat(sessionStorage.getItem('demo_balance') || '500')
      sessionStorage.setItem('demo_balance', String(Math.max(0, currentBalance - seatPrice.value)))
      ticket.value = {
        ticketId: `demo-ticket-${Date.now()}`,
        eventId: order.value?.eventId || '',
        inventoryId: order.value?.inventoryId || '',
        price: seatPrice.value,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      return
    }

    const inventoryId = order.value?.inventoryId || route.params.orderId
    const { data } = await api.post(
      `/purchase/confirm/${inventoryId}`,
      {
        holdToken: order.value?.holdToken || '',
        eventId: order.value?.eventId || '',
      },
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      }
    )
    localStorage.removeItem('pendingOrder')
    if (holdTimer) clearInterval(holdTimer)
    ticket.value = data?.data
  } catch (e: any) {
    const errorCode = e?.response?.data?.error?.code || e?.response?.data?.error_code
    const status = e?.response?.status
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

// Release hold if user navigates away without completing purchase
onBeforeRouteLeave(async (_to, _from, next) => {
  if (!ticket.value) {
    await releaseHold()
  }
  if (holdTimer) clearInterval(holdTimer)
  next()
})

onMounted(async () => {
  loadOrder()
  await Promise.all([loadBalance(), loadEventName()])
})

onUnmounted(() => { if (holdTimer) clearInterval(holdTimer) })
</script>

<template>
  <section class="page" style="max-width:760px;">
    <article class="glass" style="padding:1rem;display:grid;gap:.8rem;">

      <!-- Success overlay -->
      <template v-if="ticket">
        <div class="success-icon">✓</div>
        <h1 class="section-title" style="text-align:center;">Purchase Successful!</h1>
        <article class="panel" style="padding:1rem;display:grid;gap:.55rem;">
          <p class="small" style="opacity:.6;">Ticket Details</p>
          <p><strong>{{ eventName || order?.event?.name || 'Your Event' }}</strong></p>
          <p v-if="order?.event?.eventDate" class="small">{{ new Date(order.event.eventDate).toLocaleString() }}</p>
          <p v-if="order?.seat" class="small">Seat {{ order.seat.rowNumber }}-{{ order.seat.seatNumber }}</p>
          <p class="small">Price paid: <strong>SGD {{ (ticket.price ?? order?.seat?.price ?? 0).toFixed(2) }}</strong></p>
          <p class="small">Ticket ID: <span style="opacity:.5;font-size:.75rem;">{{ ticket.ticketId }}</span></p>
          <span class="badge" style="width:fit-content;">{{ ticket.status?.toUpperCase() || 'ACTIVE' }}</span>
        </article>
        <div class="row">
          <RouterLink :to="`/tickets/${ticket.ticketId}`"><button>Show QR Code</button></RouterLink>
          <RouterLink to="/tickets"><button class="secondary">My Tickets</button></RouterLink>
        </div>
      </template>

      <!-- Checkout form -->
      <template v-else>
        <h1 class="section-title">Checkout</h1>

        <article class="panel" style="padding:.8rem;display:grid;gap:.45rem;">
          <p class="small">Order Summary</p>
          <p v-if="eventName || order?.event?.name">
            <strong>{{ eventName || order.event.name }}</strong>
          </p>
          <p v-if="order?.event?.eventDate" class="small">{{ new Date(order.event.eventDate).toLocaleString() }}</p>
          <p v-if="order?.seat" class="small">
            Seat {{ order.seat.rowNumber }}-{{ order.seat.seatNumber }}
          </p>
          <p v-if="order?.seat?.price" class="small">
            Price: <strong>SGD {{ Number(order.seat.price).toFixed(2) }}</strong>
          </p>
          <p v-if="!order" class="small">Order details unavailable.</p>
        </article>

        <p class="small">
          Credits balance: <strong>SGD {{ Number(balance).toFixed(2) }}</strong>
        </p>
        <p v-if="seatPrice && !hasEnoughCredits" class="small" style="color:var(--accent);">
          Insufficient credits. You need SGD {{ Number(seatPrice).toFixed(2) }} but have SGD {{ Number(balance).toFixed(2) }}.
          <RouterLink to="/credits/topup">Top up →</RouterLink>
        </p>

        <div
          v-if="holdSeconds > 0"
          class="small hold-timer"
          :class="{ 'hold-warning': holdWarning }"
        >
          ⏱ Seat held for: <strong>{{ holdDisplay }}</strong>
        </div>
        <p v-else-if="order" class="small" style="color:var(--accent);">Hold may have expired. Payment may fail.</p>

        <button :disabled="loading || !hasEnoughCredits" @click="pay">
          {{ loading ? 'Processing...' : 'Confirm Purchase' }}
        </button>
        <button class="secondary" @click="cancel">Cancel</button>
      </template>

    </article>
  </section>
</template>

<style scoped>
.success-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--success);
  color: #fff;
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.hold-timer {
  color: var(--success);
  transition: color 0.3s ease;
}

.hold-timer.hold-warning {
  color: var(--accent);
}
</style>
