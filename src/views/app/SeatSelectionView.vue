<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

/* ── State ─────────────────────────────────────────────────────────────── */
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
  let n = 0
  rows.value.forEach(seats => seats.forEach(s => { if (s.status === 'AVAILABLE') n++ }))
  return n
})

/* ── Load ──────────────────────────────────────────────────────────────── */
const loadSeats = async () => {
  loading.value = true
  toast.push('Loading seat map…', 'info', 1600)
  try {
    const eventId = route.params.eventId as string

    // Single enriched call — event-orchestrator now joins inventory + seat metadata server-side
    const { data } = await api.get(`/events/${eventId}/seats`)
    const rawSeats: any[] = data?.data?.seats || []

    const rowMap = new Map<string, Seat[]>()
    for (const s of rawSeats) {
      const row = s.rowNumber ?? 'GA'
      const merged: Seat = {
        inventoryId: s.inventoryId,
        seatId:      s.seatId,
        rowNumber:   row,
        seatNumber:  s.seatNumber ?? s.inventoryId.slice(-4),
        status:      (s.status ?? 'available').toUpperCase() as Seat['status'],
        heldUntil:   s.heldUntil,
      }
      if (!rowMap.has(row)) rowMap.set(row, [])
      rowMap.get(row)!.push(merged)
    }

    rows.value = new Map(
      [...rowMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([r, seats]) => [
          r,
          seats.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true })),
        ])
    )
  } catch (e) {
    console.error(e)
    toast.push('Failed to load seat map.', 'error', 3200)
  } finally {
    loading.value = false
  }
}

/* ── Reserve ───────────────────────────────────────────────────────────── */
const reserveSeat = async () => {
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
    toast.push('Seat held! You have 5 minutes to complete checkout.', 'success', 3200)
  } catch (e: any) {
    const code = e?.response?.data?.error?.code
    const status = e?.response?.status
    const msg = code === 'SEAT_UNAVAILABLE' || status === 409 ? 'Seat is no longer available.' :
      code === 'EVENT_ENDED' || status === 410 ? 'Event has ended.' :
      'Unable to reserve seat.'
    toast.push(msg, 'error', 3200)
  }
}

onMounted(loadSeats)
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <section class="page">
    <h1 class="section-title">Seat Selection</h1>
    <p class="section-subtitle">Choose an available seat to reserve it for 5 minutes.</p>

    <!-- Legend -->
    <div class="legend">
      <span class="dot available"></span> Available ({{ totalAvailable }})
      <span class="dot held"></span> Held
      <span class="dot sold"></span> Sold
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading seat map…</p>
    </div>

    <!-- Seat map -->
    <article v-else class="glass seat-map">
      <!-- Stage indicator -->
      <div class="stage">
        <span>STAGE</span>
      </div>

      <div v-if="rows.size === 0" class="empty-state">No seats available for this event.</div>

      <div v-for="[rowLabel, seats] in rows" :key="rowLabel" class="seat-row">
        <span class="row-label">{{ rowLabel }}</span>
        <div class="seats">
          <button
            v-for="seat in seats"
            :key="seat.inventoryId"
            class="seat-btn"
            :class="{
              available: seat.status === 'AVAILABLE',
              held: seat.status === 'HELD',
              sold: seat.status === 'SOLD',
              selected: selectedSeat?.inventoryId === seat.inventoryId
            }"
            :disabled="seat.status !== 'AVAILABLE'"
            :title="`Row ${seat.rowNumber} · Seat ${seat.seatNumber} · ${seat.status}`"
            @click="selectedSeat = seat"
          >
            {{ seat.seatNumber }}
          </button>
        </div>
      </div>
    </article>

    <!-- Action bar -->
    <article class="glass action-bar">
      <div class="selection-info">
        <template v-if="selectedSeat">
          <span class="badge">Row {{ selectedSeat.rowNumber }}, Seat {{ selectedSeat.seatNumber }}</span>
          <span v-if="holdSeconds > 0" class="badge warning">⏱ {{ holdDisplay }} remaining</span>
        </template>
        <span v-else class="muted">No seat selected</span>
      </div>
      <div class="actions">
        <button :disabled="!selectedSeat || holdSeconds > 0" @click="reserveSeat">
          {{ holdSeconds > 0 ? 'Seat Reserved ✓' : 'Reserve Seat' }}
        </button>
        <button v-if="orderId" class="secondary" @click="router.push(`/checkout/${orderId}`)">
          Proceed to Checkout →
        </button>
      </div>
    </article>
  </section>
</template>

<style scoped>
.legend {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 1rem;
  font-size: .85rem;
  color: var(--text-muted, #a1a1aa);
}
.dot {
  display: inline-block;
  width: .75rem;
  height: .75rem;
  border-radius: 50%;
  margin-right: .3rem;
}
.dot.available { background: #22c55e; }
.dot.held      { background: #f59e0b; }
.dot.sold      { background: #52525b; }

/* Stage */
.stage {
  text-align: center;
  margin-bottom: 1.5rem;
  padding: .4rem 2rem;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.1), transparent);
  border-radius: .4rem;
  font-size: .75rem;
  letter-spacing: .2em;
  color: #a1a1aa;
}

/* Map container */
.seat-map {
  padding: 1.5rem 1rem;
  overflow-x: auto;
  display: flex;
  flex-direction: column;
  gap: .45rem;
  max-height: 65vh;
  overflow-y: auto;
}

/* Row */
.seat-row {
  display: flex;
  align-items: center;
  gap: .5rem;
}
.row-label {
  width: 2rem;
  text-align: center;
  font-size: .72rem;
  font-weight: 600;
  color: #71717a;
  flex-shrink: 0;
}
.seats {
  display: flex;
  flex-wrap: nowrap;
  gap: .25rem;
}

/* Seat button */
.seat-btn {
  width: 2rem;
  height: 2rem;
  border-radius: .3rem;
  border: 1px solid transparent;
  font-size: .65rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform .12s ease, box-shadow .12s ease;
  flex-shrink: 0;
  padding: 0;
  display: grid;
  place-items: center;
}
.seat-btn.available {
  background: rgba(34,197,94,.18);
  border-color: #22c55e;
  color: #86efac;
}
.seat-btn.available:hover {
  background: rgba(34,197,94,.35);
  transform: scale(1.15);
}
.seat-btn.held {
  background: rgba(245,158,11,.14);
  border-color: #f59e0b;
  color: #fcd34d;
  cursor: not-allowed;
}
.seat-btn.sold {
  background: rgba(82,82,91,.2);
  border-color: #3f3f46;
  color: #52525b;
  cursor: not-allowed;
}
.seat-btn.selected {
  background: rgba(249,115,22,.35) !important;
  border-color: #f97316 !important;
  color: #fed7aa !important;
  box-shadow: 0 0 0 2px #f97316;
  transform: scale(1.2);
}

/* Action bar */
.action-bar {
  margin-top: 1rem;
  padding: .9rem 1.2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.selection-info {
  display: flex;
  align-items: center;
  gap: .6rem;
  flex-wrap: wrap;
}
.actions {
  display: flex;
  gap: .6rem;
}
.badge.warning {
  background: rgba(245,158,11,.2);
  border-color: #f59e0b;
  color: #fcd34d;
}
.muted { color: #71717a; font-size: .9rem; }

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
  gap: 1rem;
  color: #a1a1aa;
}
.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid rgba(255,255,255,.1);
  border-top-color: #f97316;
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #71717a;
}
</style>
