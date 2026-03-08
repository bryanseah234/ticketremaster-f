<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const seats = ref<any[]>([])
const selectedSeat = ref<any | null>(null)
const holdSeconds = ref(0)
const error = ref('')
const loading = ref(false)
let timer: number | undefined

const holdDisplay = computed(() => {
  const m = Math.floor(holdSeconds.value / 60)
  const s = holdSeconds.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

const loadSeats = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get(`/events/${route.params.eventId}`)
    seats.value = data?.data?.seats || []
  } catch {
    error.value = 'Unable to load seats.'
  } finally {
    loading.value = false
  }
}

const reserveSeat = async () => {
  if (!selectedSeat.value || !auth.state.user) return
  error.value = ''
  try {
    const { data } = await api.post('/reserve', { seat_id: selectedSeat.value.seat_id, user_id: auth.state.user.user_id })
    holdSeconds.value = data?.data?.ttl_seconds || 300
    if (timer) clearInterval(timer)
    timer = window.setInterval(() => { holdSeconds.value = Math.max(0, holdSeconds.value - 1) }, 1000)
    if (data?.data?.order_id) router.push(`/checkout/${data.data.order_id}`)
  } catch (e: any) {
    const status = e?.response?.status
    if (status === 409) error.value = 'Seat unavailable, please choose another.'
    else if (status === 410) error.value = 'Event ended or hold expired.'
    else error.value = 'Reserve failed.'
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
      <p v-if="loading" class="small">Loading seats...</p>
      <p v-if="error" class="small" style="color:#fca5a5">{{ error }}</p>

      <div class="grid-4" style="margin-top:.7rem;">
        <button
          v-for="seat in seats.slice(0,120)"
          :key="seat.seat_id"
          class="secondary"
          :disabled="seat.status !== 'AVAILABLE'"
          :style="{ borderColor: seat.status === 'AVAILABLE' ? 'var(--success)' : seat.status === 'HELD' ? 'var(--warning)' : 'var(--disabled)' }"
          @click="selectedSeat = seat"
        >
          {{ seat.row_number }}-{{ seat.seat_number }}
        </button>
      </div>

      <div class="row" style="margin-top:1rem;">
        <span class="badge">Selected: {{ selectedSeat ? `${selectedSeat.row_number}-${selectedSeat.seat_number}` : 'None' }}</span>
        <span v-if="holdSeconds>0" class="badge">Hold: {{ holdDisplay }}</span>
        <button :disabled="!selectedSeat" @click="reserveSeat">Reserve</button>
      </div>
    </article>
  </section>
</template>
