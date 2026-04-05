<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { isDemoMode } from '@/services/mockData'

const route = useRoute()
const toast = useToast()
const loading = ref(false)
const data = ref<any>(null)

const occupancyRate = computed(() => {
  if (!data.value?.stats) return 0
  const sold = Number(data.value.stats.seatsSold ?? data.value.stats.seats_sold ?? 0)
  const total = Number(data.value.stats.totalSeats ?? data.value.stats.total_seats ?? 0)
  return total ? Math.round((sold / total) * 100) : 0
})

const metrics = computed(() => {
  const stats = data.value?.stats || {}
  return [
    { label: 'Seats sold', value: stats.seatsSold ?? stats.seats_sold ?? 0 },
    { label: 'Total seats', value: stats.totalSeats ?? stats.total_seats ?? 0 },
    { label: 'Revenue', value: `$${(stats.revenue ?? 0).toLocaleString?.() || stats.revenue || 0}` },
    { label: 'Occupancy', value: `${occupancyRate.value}%` },
  ]
})

const load = async () => {
  loading.value = true
  try {
    if (isDemoMode()) {
      data.value = {
        stats: {
          seatsSold: 782,
          totalSeats: 1250,
          revenue: 116540,
        },
        attendees: [
          { seatId: 'demo-seat-001', rowNumber: 'A', seatNumber: '1', email: 'vip@ticketremaster.com' },
          { seatId: 'demo-seat-002', rowNumber: 'A', seatNumber: '2', email: 'fan@example.com' },
          { seatId: 'demo-seat-003', rowNumber: 'B', seatNumber: '4', email: 'guest@example.com' },
        ],
      }
      return
    }
    const response = await api.get(`/admin/events/${route.params.eventId}/dashboard`)
    data.value = response.data?.data
  } catch {
    toast.push('Failed to load dashboard.', 'error', 3200)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="page dashboard-page">
    <div class="dashboard-head">
      <div>
        <span class="badge">Admin Dashboard</span>
        <h1 class="section-title">Live inventory overview for {{ route.params.eventId }}</h1>
        <p class="section-subtitle">Track seat sales, occupancy, and attendee details from the current dashboard feed.</p>
      </div>
      <button class="secondary" @click="load">{{ loading ? 'Refreshing...' : 'Refresh' }}</button>
    </div>

    <div class="grid-4">
      <article v-for="metric in metrics" :key="metric.label" class="glass metric-card">
        <span class="badge">{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </article>
    </div>

    <article class="glass attendee-card">
      <div class="attendee-head">
        <span class="badge">Attendees</span>
        <p class="small muted">{{ (data?.attendees || []).length }} sold seat{{ (data?.attendees || []).length === 1 ? '' : 's' }}</p>
      </div>

      <div class="attendee-list" v-if="(data?.attendees || []).length">
        <div v-for="attendee in (data?.attendees || [])" :key="attendee.seatId || attendee.seat_id" class="attendee-row">
          <div>
            <strong>{{ attendee.rowNumber || attendee.row_number }}-{{ attendee.seatNumber || attendee.seat_number }}</strong>
            <p class="small muted">{{ attendee.email }}</p>
          </div>
          <span class="badge">Sold</span>
        </div>
      </div>

      <p v-else class="small muted">No attendee data yet.</p>
    </article>
  </section>
</template>

<style scoped>
.dashboard-page { display: grid; gap: 1rem; }
.dashboard-head, .attendee-head, .attendee-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}
.metric-card, .attendee-card { padding: 1.25rem; display: grid; gap: 0.8rem; }
.metric-card strong {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: 1.8rem;
  color: var(--primarySoft);
}
.attendee-list { display: grid; gap: 0.65rem; }
.attendee-row { padding: 0.9rem 0; border-bottom: 1px solid var(--outlineSoft); }
.attendee-row:last-child { border-bottom: 0; }
</style>
