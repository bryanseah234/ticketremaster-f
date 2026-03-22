<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import StepBar from './StepBar.vue'
import CalendarGrid from './CalendarGrid.vue'
import SeatGrid from './SeatGrid.vue'

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

const emit = defineEmits<{
  'seat-selected': [seatId: string, date: string]
  'purchase': [seatId: string, date: string]
}>()

const selectedDate = ref<string | null>(null)
const showSeats = ref(false)
const selectedSeat = ref<string | null>(null)

const currentStep = computed(() => {
  if (!showSeats.value) return 1
  if (!selectedSeat.value) return 2
  return 3
})

const footerLabel = computed(() => {
  if (!selectedDate.value) return 'Select a date to continue'
  return `${dayjs(selectedDate.value).format('MMMM D, YYYY')} selected`
})

const onDateChange = (date: string) => {
  selectedDate.value = date
  showSeats.value = false
  selectedSeat.value = null
}

const onSeatChange = (seatId: string) => {
  selectedSeat.value = seatId
  emit('seat-selected', seatId, selectedDate.value!)
}

const goToSeats = () => {
  if (!selectedDate.value) return
  showSeats.value = true
  selectedSeat.value = null
}

const confirmPurchase = () => {
  if (!selectedSeat.value || !selectedDate.value) return
  emit('purchase', selectedSeat.value, selectedDate.value)
}
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
    <div class="glass cal-panel">
      <h2 class="panel-title">Pick a date</h2>
      <CalendarGrid
        :available-dates="event.availableDates"
        :model-value="selectedDate"
        @update:model-value="onDateChange"
      />

      <!-- Footer -->
      <div class="cal-footer">
        <span class="footer-label">{{ footerLabel }}</span>
        <button
          class="cta-btn"
          :disabled="!selectedDate"
          @click="goToSeats"
        >
          Select seats &rarr;
        </button>
      </div>
    </div>

    <!-- Seat selection panel -->
    <div v-if="showSeats" class="glass seat-panel">
      <h2 class="panel-title">
        Select a seat
        <span class="panel-sub">{{ dayjs(selectedDate!).format('MMMM D, YYYY') }}</span>
      </h2>
      <SeatGrid
        :event-id="event.eventId"
        :date="selectedDate!"
        :model-value="selectedSeat"
        @update:model-value="onSeatChange"
      />
      <div v-if="selectedSeat" class="confirm-row">
        <span class="sel-summary">Seat <strong>{{ selectedSeat }}</strong> selected</span>
        <button class="cta-btn" @click="confirmPurchase">Confirm purchase &rarr;</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.edp {
  display: grid;
  gap: 1rem;
  max-width: 680px;
  width: 100%;
}

/* Event header */
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

/* Panels */
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

/* Footer */
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

/* Confirm row */
.confirm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: .5rem;
  border-top: 1px solid rgba(255,255,255,.07);
  flex-wrap: wrap;
  gap: .75rem;
}

.sel-summary { font-size: .85rem; opacity: .7; }
</style>
