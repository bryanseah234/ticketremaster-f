<script setup lang="ts">
import { computed } from 'vue'

interface Seat {
  seatId: string
  rowNumber: string
  seatNumber: number
  status: 'AVAILABLE' | 'HELD' | 'SOLD'
}

const props = defineProps<{
  eventId: string
  date: string
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [seatId: string]
}>()

// Mock seat inventory — replace with API call to Seat Inventory Service
const seats = computed<Seat[]>(() => {
  const rows = ['A', 'B', 'C', 'D', 'E']
  const pattern: Seat['status'][] = [
    'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'HELD',
    'AVAILABLE', 'SOLD', 'AVAILABLE', 'AVAILABLE', 'HELD', 'AVAILABLE',
  ]
  return rows.flatMap((row, ri) =>
    Array.from({ length: 10 }, (_, ci) => ({
      seatId: `${row}-${ci + 1}`,
      rowNumber: row,
      seatNumber: ci + 1,
      status: pattern[(ri * 3 + ci) % pattern.length],
    }))
  )
})

const select = (seat: Seat) => {
  if (seat.status !== 'AVAILABLE') return
  emit('update:modelValue', seat.seatId)
}

const cellClass = (seat: Seat) => ({
  available: seat.status === 'AVAILABLE',
  held: seat.status === 'HELD',
  sold: seat.status === 'SOLD',
  picked: props.modelValue === seat.seatId,
})
</script>

<template>
  <div class="seat-section">
    <div class="stage-bar">STAGE</div>

    <div class="seat-grid">
      <div
        v-for="seat in seats"
        :key="seat.seatId"
        class="seat-card"
        :class="cellClass(seat)"
        @click="select(seat)"
      >
        <span class="seat-id">{{ seat.seatId }}</span>
        <span class="seat-status">{{ seat.status === 'AVAILABLE' ? 'Open' : seat.status === 'HELD' ? 'Held' : 'Sold' }}</span>
      </div>
    </div>

    <div class="legend">
      <span class="legend-item available-l"><span class="dot" />Available</span>
      <span class="legend-item held-l"><span class="dot" />Held</span>
      <span class="legend-item sold-l"><span class="dot" />Sold</span>
      <span class="legend-item picked-l"><span class="dot" />Your pick</span>
    </div>
  </div>
</template>

<style scoped>
.seat-section { display: grid; gap: .75rem; }

.stage-bar {
  text-align: center;
  padding: .35rem;
  background: rgba(255,255,255,.07);
  border-radius: .4rem;
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: .1em;
  opacity: .5;
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

@media (max-width: 480px) {
  .seat-grid { grid-template-columns: repeat(4, 1fr); }
}

.seat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: .45rem .3rem;
  border-radius: .35rem;
  border: 1.5px solid rgba(255,255,255,.1);
  cursor: default;
  transition: border-color .15s, background .15s;
}

.seat-id {
  font-size: .78rem;
  font-weight: 600;
  line-height: 1;
}

.seat-status {
  font-size: .62rem;
  opacity: .6;
}

/* Available */
.seat-card.available {
  border-color: #22c55e;
  cursor: pointer;
}
.seat-card.available:hover { background: rgba(34,197,94,.12); }
.seat-card.available .seat-status { color: #86efac; }

/* Held */
.seat-card.held {
  border-color: #eab308;
  opacity: .7;
}
.seat-card.held .seat-status { color: #fde047; }

/* Sold */
.seat-card.sold {
  border-color: rgba(255,255,255,.08);
  opacity: .35;
}

/* Selected by user */
.seat-card.picked {
  border-color: #2563eb;
  background: rgba(37,99,235,.25);
}
.seat-card.picked .seat-id { color: #93c5fd; }

/* Legend */
.legend {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: .75rem;
  opacity: .7;
}

.legend-item { display: flex; align-items: center; gap: .35rem; }

.dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  border: 1.5px solid;
}

.available-l .dot { border-color: #22c55e; }
.held-l .dot { border-color: #eab308; }
.sold-l .dot { border-color: rgba(255,255,255,.2); background: rgba(255,255,255,.05); }
.picked-l .dot { border-color: #2563eb; background: rgba(37,99,235,.3); }
</style>
