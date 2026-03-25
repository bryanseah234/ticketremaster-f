<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter, onBeforeRouteLeave } from 'vue-router'
import dayjs from 'dayjs'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import StepBar from './StepBar.vue'
import CalendarGrid from './CalendarGrid.vue'
import SeatGrid, { type SeatItem } from './SeatGrid.vue'

interface EventDatePickerProps {
  event: {
    eventId: string
    name: string
    venue: string
    venueAddress: string
    type: string
    price: number
    image?: string
    availableDates: string[]
  }
}

const props = defineProps<EventDatePickerProps>()
const router = useRouter()
const toast = useToast()

const selectedDate = ref<string | null>(null)
const showSeats = ref(false)
const selectedSeat = ref<SeatItem | null>(null)
const selectedInventoryId = ref<string | null>(null)
const holdSeconds = ref(0)
const holding = ref(false)
let holdTimer: number | undefined
let proceedingToCheckout = false

const releaseCurrentHold = async () => {
  if (!selectedInventoryId.value) return
  const raw = localStorage.getItem('pendingOrder')
  const holdToken = raw ? (JSON.parse(raw).holdToken || '') : ''
  try {
    await api.delete(`/purchase/hold/${selectedInventoryId.value}`, { data: { holdToken } })
  } catch {
    // best-effort
  }
  selectedInventoryId.value = null
  selectedSeat.value = null
  holdSeconds.value = 0
  if (holdTimer) clearInterval(holdTimer)
  localStorage.removeItem('pendingOrder')
}

const currentStep = computed(() => {
  if (!showSeats.value) return 1
  if (!selectedSeat.value) return 2
  return 3
})

const footerLabel = computed(() => {
  if (!selectedDate.value) return 'Select a date to continue'
  return `${dayjs(selectedDate.value).format('MMMM D, YYYY')} selected`
})

const holdDisplay = computed(() => {
  const m = Math.floor(holdSeconds.value / 60)
  const s = holdSeconds.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

const onDateChange = (date: string) => {
  selectedDate.value = date
  showSeats.value = false
  selectedSeat.value = null
  selectedInventoryId.value = null
  holdSeconds.value = 0
  if (holdTimer) clearInterval(holdTimer)
}

const onSeatChange = async (seat: SeatItem) => {
  // Release any existing hold before grabbing a new one
  if (selectedInventoryId.value) {
    await releaseCurrentHold()
  }
  if (holdTimer) clearInterval(holdTimer)
  selectedSeat.value = seat
  selectedInventoryId.value = null
  holdSeconds.value = 0
  holding.value = true

  try {
    const { data } = await api.post(`/purchase/hold/${seat.inventoryId}`)
    const heldUntil = data?.data?.heldUntil
    const inventoryId = data?.data?.inventoryId || seat.inventoryId
    selectedInventoryId.value = inventoryId
    holdSeconds.value = heldUntil
      ? Math.max(0, Math.floor((new Date(heldUntil).getTime() - Date.now()) / 1000))
      : 300

    // store pending order for checkout
    localStorage.setItem('pendingOrder', JSON.stringify({
      orderId: inventoryId,
      inventoryId: inventoryId,
      holdToken: data?.data?.holdToken || '',
      heldUntil: data?.data?.heldUntil,
      eventId: props.event.eventId,
      seat: {
        rowNumber: seat.rowNumber,
        seatNumber: seat.seatNumber,
        price: seat.price,
      },
    }))

    holdTimer = window.setInterval(() => {
      holdSeconds.value = Math.max(0, holdSeconds.value - 1)
    }, 1000)
    toast.push('Seat held for 5 minutes.', 'success', 3200)
  } catch (e: any) {
    const code = e?.response?.data?.error?.code
    const msg = code === 'SEAT_UNAVAILABLE' || code === 'SEAT_ALREADY_SOLD'
      ? 'Seat unavailable, please choose another.'
      : 'Could not hold seat. Please try again.'
    toast.push(msg, 'error', 3200)
    selectedSeat.value = null
  } finally {
    holding.value = false
  }
}

const goToSeats = () => {
  if (!selectedDate.value) return
  showSeats.value = true
  selectedSeat.value = null
  selectedInventoryId.value = null
  holdSeconds.value = 0
}

const confirmPurchase = () => {
  if (!selectedInventoryId.value) return
  proceedingToCheckout = true
  router.push(`/checkout/${selectedInventoryId.value}`)
}

// Release hold if user navigates away without going to checkout
onBeforeRouteLeave(async (_to, _from, next) => {
  if (!proceedingToCheckout && selectedInventoryId.value) {
    await releaseCurrentHold()
  }
  next()
})

onUnmounted(() => { if (holdTimer) clearInterval(holdTimer) })
</script>

<template>
  <div class="edp">
    <!-- Event header -->
    <div class="event-header glass">
      <div class="event-img" :style="event.image ? `background-image:url(${event.image})` : ''" />
      <div class="event-meta">
        <span class="badge">{{ event.type }}</span>
        <h1 class="event-name">{{ event.name }}</h1>
        <p class="event-venue">{{ event.venue }} &middot; {{ event.venueAddress }}</p>
        <p class="event-price">From <strong>${{ event.price }}</strong></p>
      </div>
    </div>

    <!-- Step bar -->
    <StepBar :current-step="currentStep" />

    <!-- Calendar -->
    <div v-if="!showSeats" class="glass cal-panel">
      <h2 class="panel-title">Pick a date</h2>
      <CalendarGrid
        :available-dates="event.availableDates"
        :model-value="selectedDate"
        @update:model-value="onDateChange"
      />
      <div class="cal-footer">
        <span class="footer-label">{{ footerLabel }}</span>
        <button class="cta-btn" :disabled="!selectedDate" @click="goToSeats">
          Select seats &rarr;
        </button>
      </div>
    </div>

    <!-- Seat selection panel -->
    <div v-if="showSeats" class="glass seat-panel">
      <div class="seat-panel-header">
        <h2 class="panel-title">
          Select a seat
          <span class="panel-sub">{{ dayjs(selectedDate!).format('MMMM D, YYYY') }}</span>
        </h2>
        <button class="back-btn" @click="showSeats = false">&larr; Change date</button>
      </div>
      <SeatGrid
        :event-id="event.eventId"
        :date="selectedDate!"
        :model-value="selectedInventoryId"
        @update:model-value="onSeatChange"
      />

      <div v-if="holding" class="confirm-row">
        <span class="sel-summary">Holding seat...</span>
      </div>

      <div v-else-if="selectedSeat && selectedInventoryId" class="confirm-row">
        <span class="sel-summary">
          Seat <strong>{{ selectedSeat.rowNumber }}-{{ selectedSeat.seatNumber }}</strong> held
          <span class="hold-timer" :class="{ urgent: holdSeconds < 60 }">{{ holdDisplay }}</span>
        </span>
        <button class="cta-btn" @click="confirmPurchase">Confirm purchase &rarr;</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edp {
  display: grid;
  gap: 1rem;
  width: 100%;
}

.event-header {
  display: flex;
  gap: 1rem;
  padding: .85rem;
  align-items: center;
}

.event-img {
  width: 80px;
  height: 80px;
  border-radius: .45rem;
  background: rgba(37,99,235,.25) center/cover no-repeat;
  flex-shrink: 0;
}

.event-meta { display: grid; gap: .25rem; }
.event-name { font-size: 1.15rem; font-weight: 700; margin: 0; }
.event-venue { font-size: .82rem; opacity: .55; margin: 0; }
.event-price { font-size: .85rem; margin: 0; opacity: .7; }

.cal-panel,
.seat-panel {
  padding: .85rem;
  display: grid;
  gap: .85rem;
}

.panel-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: .6rem;
}

.panel-sub {
  font-size: .8rem;
  font-weight: 400;
  opacity: .5;
}

.cal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: .5rem;
  border-top: 1px solid rgba(255,255,255,.07);
  gap: .75rem;
  flex-wrap: wrap;
}

.footer-label {
  font-size: .85rem;
  opacity: .6;
}

.cta-btn {
  padding: .45rem 1.1rem;
  border-radius: .4rem;
  background: #2563eb;
  border: none;
  color: #fff;
  font-weight: 600;
  font-size: .875rem;
  cursor: pointer;
  transition: background .15s;
  white-space: nowrap;
}
.cta-btn:hover:not(:disabled) { background: #1d4ed8; }
.cta-btn:disabled { opacity: .35; cursor: default; }

.confirm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: .5rem;
  border-top: 1px solid rgba(255,255,255,.07);
  flex-wrap: wrap;
  gap: .75rem;
}

.sel-summary { font-size: .85rem; opacity: .7; display: flex; align-items: center; gap: .5rem; }

.seat-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: .5rem;
}

.back-btn {
  background: none;
  border: none;
  color: inherit;
  font-size: .8rem;
  opacity: .5;
  cursor: pointer;
  padding: 0;
}
.back-btn:hover { opacity: .9; }

.hold-timer {
  font-weight: 700;
  color: #22c55e;
  font-size: .85rem;
}
.hold-timer.urgent { color: #f97316; }
</style>
