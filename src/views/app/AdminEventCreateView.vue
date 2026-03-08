<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import api from '@/api/client'

const form = reactive({
  name: '',
  venueName: '',
  venueAddress: '',
  totalHalls: 1,
  hallId: 'HALL-1',
  eventDate: '',
  totalSeats: 200,
  cat1Price: 100,
})

const loading = ref(false)
const created = ref<{ eventId: string; seatsCreated: number } | null>(null)
const estimatedRevenue = computed(() => Number(form.totalSeats || 0) * Number(form.cat1Price || 0))

const submit = async () => {
  loading.value = true
  created.value = null
  try {
    const payload = {
      name: form.name,
      venue: { name: form.venueName, address: form.venueAddress, total_halls: Number(form.totalHalls) },
      hall_id: form.hallId,
      event_date: form.eventDate,
      total_seats: Number(form.totalSeats),
      pricing_tiers: { CAT1: Number(form.cat1Price) },
    }
    const { data } = await api.post('/admin/events', payload)
    created.value = { eventId: data?.data?.event_id, seatsCreated: data?.data?.seats_created }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="page admin-create">
    <article class="glass panel-form">
      <div class="row" style="justify-content:space-between;align-items:flex-start;">
        <div>
          <span class="badge">Admin Tools</span>
          <h1 class="section-title">Create Event & Provision Seats</h1>
          <p class="small">This form maps directly to <code>POST /admin/events</code>.</p>
        </div>
        <article class="panel summary">
          <p class="small">Estimated gross</p>
          <h3>${{ estimatedRevenue.toLocaleString() }}</h3>
        </article>
      </div>

      <div class="grid-2">
        <div><label>Event name</label><input v-model="form.name" placeholder="Neon Skyline Festival" /></div>
        <div><label>Event date</label><input v-model="form.eventDate" type="datetime-local" /></div>
      </div>
      <div class="grid-2">
        <div><label>Venue name</label><input v-model="form.venueName" placeholder="Marina Bay Arena" /></div>
        <div><label>Venue address</label><input v-model="form.venueAddress" placeholder="123 Bayfront Ave" /></div>
      </div>
      <div class="grid-3">
        <div><label>Total halls</label><input v-model="form.totalHalls" type="number" min="1" /></div>
        <div><label>Hall ID</label><input v-model="form.hallId" /></div>
        <div><label>Total seats</label><input v-model="form.totalSeats" type="number" min="1" /></div>
      </div>
      <div style="max-width:220px;"><label>CAT1 price</label><input v-model="form.cat1Price" type="number" min="1" /></div>

      <div class="row" style="justify-content:flex-end;">
        <button :disabled="loading" @click="submit">{{ loading ? 'Creating...' : 'Create event' }}</button>
      </div>
      <p v-if="created" class="small success">Created {{ created.eventId }} with {{ created.seatsCreated }} seats.</p>
    </article>
  </section>
</template>

<style scoped>
.admin-create{max-width:960px}
.panel-form{padding:1rem;display:grid;gap:.8rem}
.summary{padding:.7rem .85rem;min-width:180px}
.summary h3{margin-top:.2rem}
.success{color:#86efac}
code{font-family:ui-monospace, SFMono-Regular, Menlo, monospace;color:#fed7aa}
</style>
