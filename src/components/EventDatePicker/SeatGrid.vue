<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import api from '@/api/client'

export interface SeatItem {
  inventoryId: string
  rowNumber: string
  seatNumber: number | string
  status: 'AVAILABLE' | 'HELD' | 'SOLD'
  price: number
}

const props = defineProps<{
  eventId: string
  date: string
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [seat: SeatItem]
}>()

const seats = ref<SeatItem[]>([])
const loading = ref(false)
const hovered = ref<{ seat: SeatItem; x: number; y: number } | null>(null)

const seatsByRow = computed(() => {
  const map = new Map<string, SeatItem[]>()
  for (const seat of seats.value) {
    const row = String(seat.rowNumber)
    if (!map.has(row)) map.set(row, [])
    map.get(row)!.push(seat)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([row, rowSeats]) => ({
      row,
      seats: rowSeats.sort((a, b) =>
        String(a.seatNumber).localeCompare(String(b.seatNumber), undefined, { numeric: true })
      ),
    }))
})

const load = async () => {
  loading.value = true
  try {
    const { data } = await api.get(`/events/${props.eventId}/seats`)
    const raw = data?.data?.seats || []
    seats.value = raw.map((s: any) => ({
      inventoryId: s.inventoryId || s.inventory_id,
      rowNumber: s.rowNumber || s.row_number,
      seatNumber: s.seatNumber || s.seat_number,
      status: (s.status || 'available').toUpperCase(),
      price: s.price || 0,
    }))
  } catch {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const pattern: SeatItem['status'][] = [
      'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'HELD',
      'AVAILABLE', 'SOLD', 'AVAILABLE', 'AVAILABLE', 'HELD', 'AVAILABLE',
    ]
    seats.value = rows.flatMap((row, ri) =>
      Array.from({ length: 10 }, (_, ci) => ({
        inventoryId: `demo-${row}-${ci + 1}`,
        rowNumber: row,
        seatNumber: ci + 1,
        status: pattern[(ri * 3 + ci) % pattern.length],
        price: 59,
      }))
    )
  } finally {
    loading.value = false
  }
}

const select = (seat: SeatItem) => {
  if (seat.status !== 'AVAILABLE') return
  emit('update:modelValue', seat)
}

const dotClass = (seat: SeatItem) => ({
  'dot-available': seat.status === 'AVAILABLE' && props.modelValue !== seat.inventoryId,
  'dot-held': seat.status === 'HELD',
  'dot-sold': seat.status === 'SOLD',
  'dot-picked': props.modelValue === seat.inventoryId,
})

const onMouseEnter = (seat: SeatItem, e: MouseEvent) => {
  const rect = (e.target as HTMLElement).getBoundingClientRect()
  hovered.value = { seat, x: rect.left + rect.width / 2, y: rect.top - 8 }
}

onMounted(load)
</script>

<template>
  <div class="seat-section">
    <div class="stage-bar">STAGE</div>

    <div v-if="loading" class="loading-msg">Loading seats...</div>

    <div v-else class="venue-wrap">
      <div v-for="{ row, seats: rowSeats } in seatsByRow" :key="row" class="seat-row">
        <span class="row-label">{{ row }}</span>
        <div class="dots-wrap">
          <div
            v-for="seat in rowSeats"
            :key="seat.inventoryId"
            class="dot"
            :class="dotClass(seat)"
            @click="select(seat)"
            @mouseenter="onMouseEnter(seat, $event)"
            @mouseleave="hovered = null"
          />
        </div>
        <span class="row-label">{{ row }}</span>
      </div>
    </div>

    <div class="legend">
      <span class="legend-item"><span class="dot-legend available-l" />Available</span>
      <span class="legend-item"><span class="dot-legend held-l" />Held</span>
      <span class="legend-item"><span class="dot-legend sold-l" />Sold</span>
      <span class="legend-item"><span class="dot-legend picked-l" />Your pick</span>
    </div>

    <Teleport to="body">
      <div
        v-if="hovered"
        class="seat-tooltip"
        :style="{ left: hovered.x + 'px', top: hovered.y + 'px' }"
      >
        <strong>Row {{ hovered.seat.rowNumber }} · Seat {{ hovered.seat.seatNumber }}</strong>
        <span class="tooltip-price">${{ hovered.seat.price }}</span>
        <span class="tooltip-status">{{ hovered.seat.status === 'AVAILABLE' ? 'Available' : hovered.seat.status === 'HELD' ? 'Held' : 'Sold' }}</span>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.seat-section {
  display: grid;
  gap: .75rem;
  user-select: none;
}

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

.loading-msg {
  text-align: center;
  opacity: .5;
  padding: 1rem;
  font-size: .85rem;
}

.venue-wrap {
  display: grid;
  gap: 6px;
  overflow-x: auto;
  padding: .25rem 0;
}

.seat-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.row-label {
  font-size: .7rem;
  font-weight: 700;
  color: rgba(255,255,255,.35);
  width: 1.4rem;
  text-align: center;
  flex-shrink: 0;
}

.dots-wrap {
  display: flex;
  gap: 6px;
  flex: 1;
  justify-content: space-between;
}

.dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  flex-shrink: 0;
  cursor: default;
  transition: transform .1s, opacity .1s;
}

.dot-available {
  background: #3b82f6;
  cursor: pointer;
}
.dot-available:hover {
  transform: scale(1.3);
  background: #60a5fa;
}

.dot-held {
  background: #eab308;
  opacity: .8;
}

.dot-sold {
  background: rgba(255,255,255,.15);
  opacity: .4;
}

.dot-picked {
  background: #22c55e;
  cursor: pointer;
  box-shadow: 0 0 0 2px rgba(34,197,94,.4);
  transform: scale(1.2);
}

.legend {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: .75rem;
  opacity: .65;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: .4rem;
}

.dot-legend {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.available-l { background: #3b82f6; }
.held-l { background: #eab308; }
.sold-l { background: rgba(255,255,255,.2); }
.picked-l { background: #22c55e; }
</style>

<style>
.seat-tooltip {
  position: fixed;
  transform: translate(-50%, -100%);
  background: #fff;
  color: #111;
  border-radius: .5rem;
  padding: .5rem .75rem;
  font-size: .8rem;
  pointer-events: none;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: .15rem;
  box-shadow: 0 8px 24px rgba(0,0,0,.25);
  white-space: nowrap;
}
.seat-tooltip strong { font-size: .85rem; }
.seat-tooltip .tooltip-price { font-weight: 700; color: #2563eb; }
.seat-tooltip .tooltip-status { font-size: .72rem; color: #6b7280; }
</style>
