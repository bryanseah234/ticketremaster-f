<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import api from '@/api/client'
import { isDemoMode, mockVenues } from '@/services/mockData'

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
    if (isDemoMode()) {
      venues.value = mockVenues
      return
    }
    const { data } = await api.get('/venues')
    venues.value = data?.venues || data?.data?.venues || []
  } catch (e) {
    venues.value = mockVenues
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
    if (isDemoMode()) {
      created.value = {
        eventId: 'demo-event-created',
        seatsCreated: Number(form.totalSeats),
      }
      return
    }
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
    created.value = {
      eventId: data?.data?.eventId || data?.data?.event_id,
      seatsCreated: data?.data?.seatsCreated ?? data?.data?.seats_created,
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="page admin-page">
    <div class="admin-layout">
      <aside class="glass admin-sidebar">
        <span class="badge">Admin</span>
        <h1>Create an event and provision inventory.</h1>
        <p class="small muted">Set event details, venue metadata, dates, and initial pricing in one flow.</p>
      </aside>

      <article class="glass admin-form">
        <div class="admin-head">
          <div>
            <span class="badge">Unified Sidebar</span>
            <h2 class="section-title">Admin Event Create</h2>
          </div>
          <span v-if="created" class="badge">Created</span>
        </div>

        <div class="grid-2">
          <div>
            <label>Event Name</label>
            <input v-model="form.name" placeholder="Neon Skyline Festival" />
          </div>
          <div>
            <label>Event Type</label>
            <select v-model="form.type">
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
          <textarea v-model="form.description" rows="3" placeholder="Write a short description for this event."></textarea>
        </div>

        <div class="grid-2">
          <div>
            <label>Start Date</label>
            <input v-model="form.startDate" type="datetime-local" />
          </div>
          <div>
            <label>End Date</label>
            <input v-model="form.endDate" type="datetime-local" />
          </div>
        </div>

        <div class="grid-2">
          <div>
            <label>Venue</label>
            <select v-model="form.venueId">
              <option disabled value="">Select a venue...</option>
              <option v-for="venue in venues" :key="venue.venueId" :value="venue.venueId">{{ venue.name }}</option>
            </select>
          </div>
          <div>
            <label>Total Seats</label>
            <input v-model="form.totalSeats" type="number" min="1" />
          </div>
        </div>

        <div class="grid-2">
          <div>
            <label>Venue Name</label>
            <input v-model="form.venueName" placeholder="Venue name" />
          </div>
          <div>
            <label>Ticket Price</label>
            <input v-model="form.cat1Price" type="number" min="1" />
          </div>
        </div>

        <div>
          <label>Venue Address</label>
          <input v-model="form.venueAddress" placeholder="Venue address" />
        </div>

        <div class="admin-actions">
          <p v-if="created" class="small status-success">Created {{ created.eventId }} with {{ created.seatsCreated }} seats.</p>
          <button :disabled="loading" @click="submit">{{ loading ? 'Creating...' : 'Create Event' }}</button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.admin-layout { display: grid; grid-template-columns: 0.8fr 1.5fr; gap: 1rem; }
.admin-sidebar, .admin-form { padding: 1.4rem; display: grid; gap: 1rem; }
.admin-sidebar h1 {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: 1.75rem;
  line-height: 1.15;
}
.admin-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  flex-wrap: wrap;
}
.admin-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
@media (max-width: 920px) {
  .admin-layout { grid-template-columns: 1fr; }
}
</style>
