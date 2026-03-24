<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const loading = ref(false)
const data = ref<any>(null)
const toast = useToast()

const occupancyRate = computed(() => {
  if (!data.value?.stats) return 0
  const sold = Number(data.value.stats.seatsSold ?? data.value.stats.seats_sold ?? 0)
  const total = Number(data.value.stats.totalSeats ?? data.value.stats.total_seats ?? 0)
  return total ? Math.round((sold / total) * 100) : 0
})

const load = async () => {
  loading.value = true
  toast.push('Loading dashboard...', 'info', 1600)
  try {
    const res = await api.get(`/admin/events/${route.params.eventId}/dashboard`)
    data.value = res.data?.data
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="page">
    <div class="row" style="justify-content:space-between;align-items:flex-start;">
      <div>
        <span class="badge">Admin Dashboard</span>
        <h1 class="section-title">Inventory Overview — {{ route.params.eventId }}</h1>
        <p class="small">Live data from <code>GET /admin/events/{event_id}/dashboard</code>.</p>
      </div>
      <button class="secondary" @click="load">Refresh</button>
    </div>

    <div v-if="data?.stats" class="grid-4" style="margin:1rem 0;">
      <article class="glass metric"><p class="small">Seats sold</p><h3>{{ data.stats.seatsSold ?? data.stats.seats_sold }}</h3></article>
      <article class="glass metric"><p class="small">Total seats</p><h3>{{ data.stats.totalSeats ?? data.stats.total_seats }}</h3></article>
      <article class="glass metric"><p class="small">Revenue</p><h3>${{ data.stats.revenue?.toLocaleString() || 0 }}</h3></article>
      <article class="glass metric"><p class="small">Occupancy</p><h3>{{ occupancyRate }}%</h3></article>
    </div>

    <article class="glass table-wrap">
      <table>
        <thead>
          <tr><th>Seat</th><th>Status</th><th>Attendee Email</th></tr>
        </thead>
        <tbody>
          <tr v-for="attendee in (data?.attendees || [])" :key="attendee.seatId || attendee.seat_id">
            <td>{{ attendee.rowNumber || attendee.row_number }}-{{ attendee.seatNumber || attendee.seat_number }}</td>
            <td><span class="badge">SOLD</span></td>
            <td>{{ attendee.email }}</td>
          </tr>
        </tbody>
      </table>
    </article>
  </section>
</template>

<style scoped>
.metric{padding:1rem}
.table-wrap{padding:1rem;overflow:auto}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:.55rem .15rem;border-bottom:1px solid var(--border)}
code{font-family:ui-monospace, SFMono-Regular, Menlo, monospace;color:#fed7aa}
</style>
