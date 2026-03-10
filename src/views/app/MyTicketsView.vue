<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'

const tickets = ref<any[]>([])
const loading = ref(false)
const toast = useToast()

const fallbackTickets = [
  { seat_id: 'demo-101', status: 'ACTIVE', event: { name: 'Neon Skyline Festival', event_date: '2026-04-12T20:00:00Z' }, row_number: 'B', seat_number: '18' },
  { seat_id: 'demo-102', status: 'ACTIVE', event: { name: 'Midnight Bass District', event_date: '2026-05-03T19:30:00Z' }, row_number: 'D', seat_number: '9' },
]

const load = async () => {
  loading.value = true
  toast.push('Loading tickets...', 'info', 1600)
  try {
    const { data } = await api.get('/tickets')
    tickets.value = data?.data || []
  } catch {
    tickets.value = fallbackTickets
    toast.push('Demo mode enabled for ticket data.', 'info', 3200)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch([loading, tickets], ([isLoading, items]) => {
  if (!isLoading && items.length === 0) toast.push('No tickets yet.', 'info', 2400)
})
</script>

<template>
  <section class="page">
    <h1 class="section-title">My Tickets</h1>
    <p class="section-subtitle">Manage ownership, QR entry pass, and transfer actions.</p>

    <div class="grid-3">
      <article v-for="t in tickets" :key="t.seat_id" class="glass" style="padding:1rem;display:grid;gap:.45rem;">
        <span class="badge">{{ t.status || 'ACTIVE' }}</span>
        <h3>{{ t.event?.name }}</h3>
        <p class="small">{{ t.event?.event_date }}</p>
        <p class="small">Row {{ t.row_number }} · Seat {{ t.seat_number }}</p>
        <div class="row">
          <RouterLink :to="`/tickets/${t.seat_id}`"><button>Show QR</button></RouterLink>
          <RouterLink :to="`/tickets/${t.seat_id}/transfer`"><button class="secondary">Transfer</button></RouterLink>
        </div>
      </article>
    </div>

  </section>
</template>
