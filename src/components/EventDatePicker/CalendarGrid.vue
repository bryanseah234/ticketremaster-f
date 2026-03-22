<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{
  availableDates: string[]
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [date: string]
}>()

const today = dayjs().startOf('day')
const todayStr = today.format('YYYY-MM-DD')

// Start on the month of the first available date if it's ahead of current month
const firstAvailable = [...props.availableDates].sort()[0]
const initialMonth = firstAvailable && dayjs(firstAvailable).isAfter(today)
  ? dayjs(firstAvailable).startOf('month')
  : dayjs().startOf('month')

const viewDate = ref(initialMonth)
const availableSet = computed(() => new Set(props.availableDates))

const monthLabel = computed(() => viewDate.value.format('MMMM YYYY'))
const canGoPrev = computed(() => viewDate.value.isAfter(dayjs().startOf('month')))

const prev = () => { if (canGoPrev.value) viewDate.value = viewDate.value.subtract(1, 'month') }
const next = () => { viewDate.value = viewDate.value.add(1, 'month') }

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const calendarCells = computed(() => {
  const firstDow = viewDate.value.startOf('month').day()
  const daysInMonth = viewDate.value.daysInMonth()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
})

const dateStr = (day: number) => viewDate.value.date(day).format('YYYY-MM-DD')
const isPast = (day: number) => dayjs(dateStr(day)).isBefore(today)
const isAvailable = (day: number) => availableSet.value.has(dateStr(day))
const isSelected = (day: number) => props.modelValue === dateStr(day)
const isToday = (day: number) => dateStr(day) === todayStr

const select = (day: number) => {
  if (isPast(day) || !isAvailable(day)) return
  emit('update:modelValue', dateStr(day))
}
</script>

<template>
  <div class="calendar">
    <!-- Month navigation -->
    <div class="cal-header">
      <button class="nav-btn" :disabled="!canGoPrev" @click="prev">&#8249;</button>
      <span class="month-label">{{ monthLabel }}</span>
      <button class="nav-btn" @click="next">&#8250;</button>
    </div>

    <!-- Weekday headers -->
    <div class="cal-grid">
      <div v-for="wd in weekdays" :key="wd" class="wd-header">{{ wd }}</div>

      <!-- Empty leading cells -->
      <template v-for="(cell, i) in calendarCells" :key="`cell-${i}`">
        <div v-if="cell === null" class="day-cell empty" />

        <div
          v-else
          class="day-cell"
          :class="{
            past: isPast(cell),
            available: !isPast(cell) && isAvailable(cell),
            selected: isSelected(cell),
            today: isToday(cell) && !isSelected(cell),
          }"
          @click="select(cell)"
        >
          <span class="day-num">{{ cell }}</span>
          <button
            class="sel-btn"
            :disabled="isPast(cell) || !isAvailable(cell)"
            @click.stop="select(cell)"
          >
            {{ isSelected(cell) ? 'Selected' : 'Select' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.calendar {
  width: 100%;
}

.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: .75rem;
}

.month-label {
  font-weight: 600;
  font-size: 1rem;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,.15);
  background: rgba(255,255,255,.06);
  cursor: pointer;
  font-size: 1.3rem;
  line-height: 1;
  color: inherit;
  display: grid;
  place-items: center;
  transition: background .15s;
}
.nav-btn:hover:not(:disabled) { background: rgba(255,255,255,.14); }
.nav-btn:disabled { opacity: .3; cursor: default; }

/* Grid */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.wd-header {
  text-align: center;
  font-size: .72rem;
  font-weight: 600;
  opacity: .45;
  padding: .3rem 0;
}

.day-cell {
  aspect-ratio: 1;
  border-radius: .4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: .3rem .2rem;
  cursor: default;
  transition: background .15s;
  border: 1px solid transparent;
}

.day-cell.empty { background: transparent; border: none; }

/* Past dates */
.day-cell.past .day-num { color: rgba(255,255,255,.2); }

/* Today highlight */
.day-cell.today { border-color: rgba(37,99,235,.5); }

/* Available dates */
.day-cell.available { cursor: pointer; }
.day-cell.available:hover { background: rgba(37,99,235,.12); }

/* Selected date */
.day-cell.selected {
  background: #2563eb;
  border-color: #2563eb;
}
.day-cell.selected .day-num { color: #fff; }

.day-num {
  font-size: .85rem;
  font-weight: 600;
  color: rgba(255,255,255,.75);
  line-height: 1;
}

/* Select button */
.sel-btn {
  font-size: .62rem;
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid rgba(37,99,235,.7);
  background: transparent;
  color: #60a5fa;
  cursor: pointer;
  white-space: nowrap;
  transition: background .15s, color .15s;
  line-height: 1.4;
}

.sel-btn:disabled {
  border-color: rgba(255,255,255,.1);
  color: rgba(255,255,255,.2);
  cursor: default;
}

.day-cell.available .sel-btn:hover {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

/* Selected state: invert button */
.day-cell.selected .sel-btn {
  background: #fff;
  border-color: #fff;
  color: #2563eb;
  font-weight: 600;
}

@media (max-width: 480px) {
  .sel-btn { display: none; }
  .day-num { font-size: .8rem; }
}
</style>
