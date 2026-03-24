<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const seats = ref<any[]>([])
const selectedSeat = ref<any | null>(null)
const holdSeconds = ref(0)
const orderId = ref('')
const loading = ref(false)
const usingFallback = ref(false)
let timer: number | undefined

const holdDisplay = computed(() => {
  const m = Math.floor(holdSeconds.value / 60)
  const s = holdSeconds.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

const loadSeats = async () => {
  loading.value = true
  usingFallback.value = false
  toast.push('Loading seats...', 'info', 1600)
  try {
    const { data } = await api.get(`/events/${route.params.eventId}/seats`)
    const raw = data?.data?.seats || []
    seats.value = raw.map((s: any) => ({
      inventoryId: s.inventoryId || s.inventory_id,
      seatId: s.seatId || s.seat_id,
      rowNumber: s.rowNumber || s.row_number,
      seatNumber: s.seatNumber || s.seat_number,
      status: (s.status || 'available').toUpperCase(),
      category: s.category || 'GA',
      price: s.price || 0,
      heldUntil: s.heldUntil || s.held_until,
    }))
  } catch {
    seats.value = Array.from({ length: 120 }).map((_, index) => ({
      inventoryId: `demo-inv-${index + 1}`,
      seatId: `demo-seat-${index + 1}`,
      rowNumber: String.fromCharCode(65 + Math.floor(index / 10)),
      seatNumber: (index % 10) + 1,
      status: index % 8 === 0 ? 'HELD' : index % 6 === 0 ? 'SOLD' : 'AVAILABLE',
      category: 'GA',
      price: 59,
    }))
    usingFallback.value = true
    toast.push('Backend unavailable. Showing limited demo data. Actions are limited.', 'info', 3200)
  } finally {
    loading.value = false
  }
}

const reserveSeat = async () => {
  if (usingFallback.value) {
    toast.push('Reservations are disabled in demo mode.', 'error', 3200)
    return
  }
  if (!selectedSeat.value || !auth.state.user) return
  try {
    const inventoryId = selectedSeat.value.inventoryId
    const { data } = await api.post(`/purchase/hold/${inventoryId}`)
    const heldUntil = data?.data?.heldUntil || data?.data?.held_until
    holdSeconds.value = heldUntil
      ? Math.max(0, Math.floor((new Date(heldUntil).getTime() - Date.now()) / 1000))
      : 300
    if (timer) clearInterval(timer)
    timer = window.setInterval(() => { holdSeconds.value = Math.max(0, holdSeconds.value - 1) }, 1000)
    orderId.value = data?.data?.inventoryId || data?.data?.inventory_id || inventoryId
    const pending = {
      orderId: orderId.value,
      inventoryId: orderId.value,
      holdToken: data?.data?.holdToken || data?.data?.hold_token || '',
      eventId: route.params.eventId,
      seat: {
        seatId: selectedSeat.value.seatId,
        rowNumber: selectedSeat.value.rowNumber,
        seatNumber: selectedSeat.value.seatNumber,
        category: selectedSeat.value.category,
        price: selectedSeat.value.price,
      },
    }
    localStorage.setItem('pendingOrder', JSON.stringify(pending))
    toast.push('Seat held for 5 minutes.', 'success', 3200)
  } catch (e: any) {
    const code = e?.response?.data?.error?.code || e?.response?.data?.error_code
    const status = e?.response?.status
    const message = code === 'SEAT_UNAVAILABLE' || code === 'SEAT_ALREADY_SOLD' ? 'Seat unavailable, please choose another.' :
      code === 'SEAT_NOT_FOUND' ? 'Seat not found.' :
        code === 'EVENT_ENDED' ? 'Event ended.' :
          status === 409 ? 'Seat unavailable, please choose another.' :
            status === 410 ? 'Event ended or hold expired.' :
              'Reserve failed.'
    toast.push(message, 'error', 3200)
  }
}

onMounted(loadSeats)
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <section class="page">
    <h1 class="section-title">Seat Selection</h1>
    <p class="section-subtitle">Select an AVAILABLE seat to reserve it for 5 minutes.</p>

    <article class="glass" style="padding:1rem;">
      <div class="grid-4" style="margin-top:.7rem;">
        <button
          v-for="seat in seats.slice(0,120)"
          :key="seat.seatId"
          class="secondary"
          :disabled="seat.status !== 'AVAILABLE'"
          :style="{ borderColor: seat.status === 'AVAILABLE' ? 'var(--success)' : seat.status === 'HELD' ? 'var(--warning)' : 'var(--disabled)' }"
          @click="selectedSeat = seat"
        >
          {{ seat.rowNumber }}-{{ seat.seatNumber }}
        </button>
      </div>

      <div class="row" style="margin-top:1rem;flex-wrap:wrap;gap:.6rem;">
        <span class="badge">Selected: {{ selectedSeat ? `${selectedSeat.rowNumber}-${selectedSeat.seatNumber}` : 'None' }}</span>
        <span v-if="holdSeconds>0" class="badge">Hold: {{ holdDisplay }}</span>
        <button :disabled="!selectedSeat || usingFallback" @click="reserveSeat">Reserve</button>
        <button v-if="orderId" class="secondary" :disabled="usingFallback" @click="router.push(`/checkout/${orderId}`)">Proceed to Checkout</button>
      </div>
    </article>
  </section>
</template>
