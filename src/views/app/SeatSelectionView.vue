<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { isDemoMode, mockServices } from '@/services/mockData'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

interface Seat {
  inventoryId: string
  seatId: string
  rowNumber: string
  seatNumber: string
  status: 'AVAILABLE' | 'HELD' | 'SOLD'
  heldUntil?: string | null
}

const rows = ref<Map<string, Seat[]>>(new Map())
const selectedSeat = ref<Seat | null>(null)
const holdSeconds = ref(0)
const orderId = ref('')
const loading = ref(false)
let timer: number | undefined

const holdDisplay = computed(() => {
  const m = Math.floor(holdSeconds.value / 60)
  const s = holdSeconds.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

const totalAvailable = computed(() => {
  let count = 0
  rows.value.forEach(seats => seats.forEach(seat => { if (seat.status === 'AVAILABLE') count++ }))
  return count
})

const setRowsFromSeats = (rawSeats: any[]) => {
  const rowMap = new Map<string, Seat[]>()
  for (const s of rawSeats) {
    const row = s.rowNumber ?? 'GA'
    const merged: Seat = {
      inventoryId: s.inventoryId,
      seatId: s.seatId,
      rowNumber: row,
      seatNumber: s.seatNumber ?? s.inventoryId?.slice?.(-4) ?? '--',
      status: (s.status ?? 'available').toUpperCase() as Seat['status'],
      heldUntil: s.heldUntil,
    }
    if (!rowMap.has(row)) rowMap.set(row, [])
    rowMap.get(row)!.push(merged)
  }
  rows.value = new Map(
    [...rowMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([row, seats]) => [
        row,
        seats.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true })),
      ]),
  )
}

const loadSeats = async () => {
  loading.value = true
  try {
    if (isDemoMode()) {
      const result = await mockServices.getSeats(String(route.params.eventId))
      setRowsFromSeats(result.seats)
      return
    }
    const { data } = await api.get(`/events/${route.params.eventId}/seats`)
    const rawSeats: any[] = data?.data?.seats || []
    setRowsFromSeats(rawSeats)
  } catch (e) {
    try {
      const result = await mockServices.getSeats(String(route.params.eventId))
      setRowsFromSeats(result.seats)
      toast.push('Showing demo seat map.', 'info', 2800)
    } catch {
      console.error(e)
      toast.push('Failed to load seat map.', 'error', 3200)
    }
  } finally {
    loading.value = false
  }
}

const reserveSeat = async () => {
  if (!selectedSeat.value || !auth.state.user) return
  try {
    const inventoryId = selectedSeat.value.inventoryId
    if (isDemoMode()) {
      holdSeconds.value = 300
      if (timer) clearInterval(timer)
      timer = window.setInterval(() => {
        holdSeconds.value = Math.max(0, holdSeconds.value - 1)
      }, 1000)
      orderId.value = inventoryId
      localStorage.setItem('pendingOrder', JSON.stringify({
        orderId: orderId.value,
        inventoryId: orderId.value,
        holdToken: 'demo-hold-token',
        heldUntil: new Date(Date.now() + 300000).toISOString(),
        eventId: route.params.eventId,
        seat: {
          seatId: selectedSeat.value.seatId,
          rowNumber: selectedSeat.value.rowNumber,
          seatNumber: selectedSeat.value.seatNumber,
          price: 149.99,
        },
        event: {
          name: 'Taylor Swift - Eras Tour',
          image: '/hero-concert.jpeg',
          eventDate: '2025-06-15T19:30:00Z',
        },
      }))
      toast.push('Seat held. You have 5 minutes to finish checkout.', 'success', 3200)
      return
    }
    const { data } = await api.post(`/purchase/hold/${inventoryId}`)
    const heldUntil = data?.data?.heldUntil || data?.data?.held_until
    holdSeconds.value = heldUntil
      ? Math.max(0, Math.floor((new Date(heldUntil).getTime() - Date.now()) / 1000))
      : 300
    if (timer) clearInterval(timer)
    timer = window.setInterval(() => {
      holdSeconds.value = Math.max(0, holdSeconds.value - 1)
    }, 1000)
    orderId.value = data?.data?.inventoryId || inventoryId
    localStorage.setItem('pendingOrder', JSON.stringify({
      orderId: orderId.value,
      inventoryId: orderId.value,
      holdToken: data?.data?.holdToken || '',
      eventId: route.params.eventId,
      seat: {
        seatId: selectedSeat.value.seatId,
        rowNumber: selectedSeat.value.rowNumber,
        seatNumber: selectedSeat.value.seatNumber,
        price: 0,
      },
    }))
    toast.push('Seat held. You have 5 minutes to finish checkout.', 'success', 3200)
  } catch (e: any) {
    const code = e?.response?.data?.error?.code
    const status = e?.response?.status
    const message = code === 'SEAT_UNAVAILABLE' || status === 409
      ? 'Seat is no longer available.'
      : code === 'EVENT_ENDED' || status === 410
        ? 'Event has ended.'
        : 'Unable to reserve seat.'
    toast.push(message, 'error', 3200)
  }
}

onMounted(loadSeats)
onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <section class="page seat-page">
    <div class="seat-header">
      <div>
        <span class="badge">Seat Selection</span>
        <h1 class="section-title">Choose your spot before someone else does.</h1>
        <p class="section-subtitle">Reserve an available seat for five minutes, then continue into checkout.</p>
      </div>
      <div class="seat-legend">
        <span><i class="dot available"></i>Available</span>
        <span><i class="dot held"></i>Held</span>
        <span><i class="dot sold"></i>Sold</span>
      </div>
    </div>

    <article class="glass stage-card">
      <div class="stage">Stage</div>
      <p class="small muted">{{ totalAvailable }} seats currently available</p>
    </article>

    <article class="glass map-card" v-if="!loading">
      <div v-if="rows.size === 0" class="empty-map">No seats available for this event.</div>
      <div v-for="[rowLabel, seats] in rows" :key="rowLabel" class="seat-row">
        <span class="row-label">{{ rowLabel }}</span>
        <div class="seat-track">
          <button
            v-for="seat in seats"
            :key="seat.inventoryId"
            class="seat"
            :class="{
              available: seat.status === 'AVAILABLE',
              held: seat.status === 'HELD',
              sold: seat.status === 'SOLD',
              selected: selectedSeat?.inventoryId === seat.inventoryId
            }"
            :disabled="seat.status !== 'AVAILABLE'"
            @click="selectedSeat = seat"
          >
            {{ seat.seatNumber }}
          </button>
        </div>
      </div>
    </article>

    <article v-else class="glass map-card loading-card">
      <p class="small muted">Loading seat map...</p>
    </article>

    <article class="glass reserve-card">
      <div class="reserve-copy">
        <span class="badge" v-if="selectedSeat">Row {{ selectedSeat.rowNumber }} · Seat {{ selectedSeat.seatNumber }}</span>
        <p v-else class="small muted">Select a seat to reserve it.</p>
        <p v-if="holdSeconds > 0" class="small status-warning">Held for {{ holdDisplay }}</p>
      </div>
      <div class="reserve-actions">
        <button :disabled="!selectedSeat || holdSeconds > 0" @click="reserveSeat">
          {{ holdSeconds > 0 ? 'Seat Reserved' : 'Reserve Seat' }}
        </button>
        <button v-if="orderId" class="secondary" @click="router.push(`/checkout/${orderId}`)">Proceed to Checkout</button>
      </div>
    </article>
  </section>
</template>

<style scoped>
.seat-page { display: grid; gap: 1rem; }
.seat-header, .seat-legend, .reserve-card {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
}
.seat-legend { align-items: center; color: var(--textMuted); font-size: 0.85rem; }
.seat-legend span { display: inline-flex; align-items: center; gap: 0.35rem; }
.dot { width: 0.7rem; height: 0.7rem; border-radius: 50%; display: inline-block; }
.dot.available { background: var(--success); }
.dot.held { background: var(--warning); }
.dot.sold { background: var(--disabled); }
.stage-card, .map-card, .reserve-card { padding: 1.25rem; }
.stage {
  width: min(420px, 100%);
  margin: 0 auto 0.6rem;
  padding: 0.7rem;
  text-align: center;
  border-radius: var(--radius-pill);
  background: linear-gradient(90deg, transparent, rgba(249,115,22,.16), transparent);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--primarySoft);
}
.map-card { display: grid; gap: 0.7rem; overflow-x: auto; }
.seat-row { display: flex; align-items: center; gap: 0.7rem; }
.row-label { width: 2rem; color: var(--textMuted); text-align: center; font-size: 0.8rem; font-weight: 700; }
.seat-track { display: flex; gap: 0.35rem; min-width: max-content; }
.seat {
  width: 2.2rem;
  height: 2.2rem;
  padding: 0;
  border-radius: 0.7rem;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  background: rgba(60,51,49,.72);
  color: var(--text);
}
.seat.available { border-color: rgba(82,209,140,.35); background: rgba(82,209,140,.16); color: #d7ffe7; }
.seat.held { border-color: rgba(255,176,32,.34); background: rgba(255,176,32,.14); color: #ffe2a5; }
.seat.sold { border-color: rgba(109,93,87,.4); background: rgba(109,93,87,.22); color: #bca9a0; }
.seat.selected { border-color: rgba(249,115,22,.55); background: rgba(249,115,22,.22); color: var(--primarySoft); }
.reserve-copy { display: grid; gap: 0.45rem; }
.reserve-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.empty-map, .loading-card { text-align: center; }
</style>
