<script setup lang="ts">
import { computed, reactive, ref, onMounted, watch } from 'vue'
import api from '@/api/client'

const form = reactive({
  name: '',
  description: '',
  type: 'concert',
  venueId: '',
  venueName: '',
  venueAddress: '',
  startDate: '',
  endDate: '',
  totalSeats: 200,
  cat1Price: 100,
})

const loading = ref(false)
const created = ref<{ eventId: string; seatsCreated: number } | null>(null)
const venues = ref<any[]>([])

onMounted(async () => {
  try {
    const { data } = await api.get('/venues')
    venues.value = data?.venues || []
  } catch (e) {
    console.error('Failed to load venues', e)
  }
})

watch(() => form.venueId, (newId) => {
  const venue = venues.value.find(v => v.venueId === newId)
  if (venue) {
    form.venueName = venue.name
    form.venueAddress = venue.address || ''
    form.totalSeats = venue.capacity || 200
  }
})

const submit = async () => {
  loading.value = true
  created.value = null
  try {
    const payload = {
      name: form.name,
      description: form.description,
      type: form.type,
      venue_id: form.venueId,
      venue: { name: form.venueName, address: form.venueAddress },
      event_date: form.startDate,
      end_date: form.endDate,
      total_seats: Number(form.totalSeats),
      pricing_tiers: { CAT1: Number(form.cat1Price) },
    }
    const { data } = await api.post('/admin/events', payload)
    created.value = { eventId: data?.data?.eventId || data?.data?.event_id, seatsCreated: data?.data?.seatsCreated ?? data?.data?.seats_created }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="page admin-create">
    
     <h1 class="section-title">Create Event & Provision Seats</h1>
    <article class="glass panel-form">
      <div class="row" style="justify-content:space-between;align-items:flex-start;">
        <div>
          <!-- <span class="badge">Admin Tools</span> -->
         
          <!-- <p class="small">This form maps directly to <code>POST /admin/events</code>.</p> -->
        </div>
       
      </div>

      <div class="grid-2">
        <div><label>Event name</label><input v-model="form.name" placeholder="Neon Skyline Festival" /></div>
        <div>
          <label>Event type</label>
          <select v-model="form.type" class="native-select">
            <option value="festival">Festival</option>
            <option value="concert">Concert</option>
            <option value="theatre">Theatre</option>
            <option value="sports">Sports</option>
            <option value="classical">Classical</option>
          </select>
        </div>
      </div>
      
      <div>
        <label>Description</label>
        <textarea v-model="form.description" rows="2" placeholder="Write a short description about this event..."></textarea>
      </div>

      <div class="grid-2">
        <div><label>Start date</label><input v-model="form.startDate" type="datetime-local" /></div>
        <div><label>End date</label><input v-model="form.endDate" type="datetime-local" /></div>
      </div>
      <div class="grid-2">
        <div>
          <label>Venue Selection</label>
          <select v-model="form.venueId" class="native-select">
            <option disabled value="">Select a venue...</option>
            <option v-for="v in venues" :key="v.venueId" :value="v.venueId">
              {{ v.name }}
            </option>
          </select>
        </div>
      </div>
      <div style="max-width:220px;"><label>Total seats</label><input v-model="form.totalSeats" type="number" min="1" /></div>
      <div style="max-width:220px;"><label>Ticket price</label><input v-model="form.cat1Price" type="number" min="1" /></div>

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

.native-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  font-family: inherit;
  font-size: 0.95rem;
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.5)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1.2rem;
}
.native-select:focus { border-color: #fb923c; outline: none; }
textarea { width: 100%; resize: vertical; }
</style>
