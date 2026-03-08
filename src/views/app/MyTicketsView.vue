<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/api/client'

const tickets = ref<any[]>([])
const loading = ref(false)
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.get('/tickets')
    tickets.value = data?.data || []
  } catch {
    error.value = 'Could not load your tickets.'
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
