<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/api/client'

const tickets = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const usingFallback = ref(false)

const fallbackTickets = [
  { seat_id: 'demo-101', status: 'ACTIVE', event: { name: 'Neon Skyline Festival', event_date: '2026-04-12T20:00:00Z' }, row_number: 'B', seat_number: '18' },
  { seat_id: 'demo-102', status: 'ACTIVE', event: { name: 'Midnight Bass District', event_date: '2026-05-03T19:30:00Z' }, row_number: 'D', seat_number: '9' },
]

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/tickets')
    tickets.value = data?.data || []
    usingFallback.value = false
  } catch {
    tickets.value = fallbackTickets
    usingFallback.value = true
    error.value = 'Backend unavailable. Showing demo tickets.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="page">
    <h1 class="section-title">My Tickets</h1>
    <p class="section-subtitle">Manage ownership, QR entry pass, and transfer actions.</p>
    <p v-if="usingFallback" class="small">Demo mode enabled for ticket data.</p>
    <p v-if="loading" class="small">Loading tickets...</p>
    <p v-if="error" class="small" style="color:#fca5a5">{{ error }}</p>

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

    <article v-if="!loading && tickets.length===0" class="glass" style="padding:1rem;">No tickets yet.</article>
  </section>
</template>
