<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'

const tickets = ref<any[]>([])
const loading = ref(false)
const toast = useToast()

const fallbackTickets = [
  { ticketId: 'demo-101', status: 'SOLD', event: { name: 'Neon Skyline Festival', eventDate: '2026-04-12T20:00:00Z' }, rowNumber: 'B', seatNumber: 18, price: 120, createdAt: '2026-03-02T19:30:00Z' },
  { ticketId: 'demo-102', status: 'SOLD', event: { name: 'Midnight Bass District', eventDate: '2026-05-03T19:30:00Z' }, rowNumber: 'D', seatNumber: 9, price: 85, createdAt: '2026-02-18T14:20:00Z' },
]

const formatDate = (value?: string) => {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

const load = async () => {
  loading.value = true
  toast.push('Loading tickets...', 'info', 1600)
  try {
    const { data } = await api.get('/qr/tickets')
    tickets.value = data?.data?.tickets || data?.data || []
  } catch {
    tickets.value = fallbackTickets
    toast.push('Backend unavailable. Showing limited demo data. Actions are limited.', 'info', 3200)
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
      <article v-for="t in tickets" :key="t.ticketId" class="glass" style="padding:1rem;display:grid;gap:.45rem;">
        <span class="badge">{{ t.status || 'ACTIVE' }}</span>
        <h3>{{ t.event?.name }}</h3>
        <p class="small">{{ t.event?.eventDate ? new Date(t.event.eventDate).toLocaleString() : 'Date TBA' }}</p>
        <p class="small">Paid ${{ t.price ?? '—' }} · Purchased {{ formatDate(t.createdAt) }}</p>
        <div class="row">
          <RouterLink :to="`/tickets/${t.ticketId}`"><button>Show QR</button></RouterLink>
        </div>
      </article>
    </div>

  </section>
</template>
