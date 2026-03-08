<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/client'

const route = useRoute()
const loading = ref(false)
const data = ref<any>(null)

const occupancyRate = computed(() => {
  if (!data.value) return 0
  const sold = Number(data.value.seats_sold || 0)
  const held = Number(data.value.seats_held || 0)
  const available = Number(data.value.seats_available || 0)
  const total = sold + held + available
  return total ? Math.round(((sold + held) / total) * 100) : 0
})

const load = async () => {
  loading.value = true
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

    <p v-if="loading" class="small">Loading dashboard...</p>

    <div v-if="data" class="grid-4" style="margin:1rem 0;">
      <article class="glass metric"><p class="small">Seats sold</p><h3>{{ data.seats_sold }}</h3></article>
      <article class="glass metric"><p class="small">Seats held</p><h3>{{ data.seats_held }}</h3></article>
      <article class="glass metric"><p class="small">Seats available</p><h3>{{ data.seats_available }}</h3></article>
      <article class="glass metric"><p class="small">Occupancy</p><h3>{{ occupancyRate }}%</h3></article>
    </div>

    <article class="glass table-wrap">
      <table>
        <thead>
          <tr><th>Seat</th><th>Status</th><th>Price</th></tr>
        </thead>
        <tbody>
          <tr v-for="seat in (data?.seats_detail || [])" :key="seat.seat_id">
            <td>{{ seat.row }}-{{ seat.seat_number }}</td>
            <td><span class="badge">{{ seat.status }}</span></td>
            <td>${{ seat.price }}</td>
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
