<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/client'
import { mockEvents } from '@/data/mockEvents'
import { useToast } from '@/composables/useToast'
import { isDemoMode, mockServices } from '@/services/mockData'

interface VenueItem {
  venueId: string
  name: string
  address: string
  capacity?: number
  coordinates?: string
  postalCode?: string
  events: number
}

const router = useRouter()
const toast = useToast()
const venues = ref<VenueItem[]>([])
const loading = ref(false)

const buildFromFallback = () => {
  const map = new Map<string, VenueItem>()
  mockEvents.forEach((event: any) => {
    const venue = event?.venue
    if (!venue?.name) return
    const venueId = venue.venueId || `${venue.name}-${venue.address || ''}`.toLowerCase()
    const current = map.get(venueId)
    if (current) current.events += 1
    else {
      map.set(venueId, {
        venueId,
        name: venue.name,
        address: venue.address || 'Address details unavailable',
        events: 1,
      })
    }
  })
  venues.value = Array.from(map.values())
}

const load = async () => {
  loading.value = true
  toast.push('Loading venues...', 'info', 1400)
  try {
    if (isDemoMode() || import.meta.env.DEV) {
      const venueData = await mockServices.getVenues()
      const eventMap = new Map<string, number>()
      mockEvents.forEach((event: any) => {
        const venueId = event?.venue?.venueId || event?.venueId
        if (!venueId) return
        eventMap.set(venueId, (eventMap.get(venueId) || 0) + 1)
      })
      venues.value = venueData.venues.map((venue: any) => ({
        venueId: venue.venueId,
        name: venue.name,
        address: venue.address,
        capacity: venue.capacity,
        coordinates: venue.coordinates,
        postalCode: venue.postalCode,
        events: eventMap.get(venue.venueId) || 0,
      }))
      return
    }
    const [{ data: venueData }, { data: eventData }] = await Promise.all([
      api.get('/venues'),
      api.get('/events', { params: { limit: 100 } }),
    ])

    const eventMap = new Map<string, number>()
    const events = eventData?.data?.events || eventData?.data || []
    events.forEach((event: any) => {
      const venueId = event?.venue?.venueId || event?.venueId
      if (!venueId) return
      eventMap.set(venueId, (eventMap.get(venueId) || 0) + 1)
    })

    const list = venueData?.venues || []
    venues.value = list.map((venue: any) => ({
      venueId: venue.venueId,
      name: venue.name,
      address: venue.address,
      capacity: venue.capacity,
      coordinates: venue.coordinates,
      postalCode: venue.postalCode,
      events: eventMap.get(venue.venueId) || 0,
    }))
  } catch {
    buildFromFallback()
    toast.push('Showing fallback venues while the backend is unavailable.', 'info', 2800)
  } finally {
    loading.value = false
  }
}

const featuredVenue = computed(() => venues.value[0] || null)
const venueCards = computed(() => venues.value.slice(featuredVenue.value ? 1 : 0))

onMounted(load)
</script>

<template>
  <section class="venues-page">
    <header class="hero panel">
      <span class="eyebrow">Partner Spaces</span>
      <h1>Explore venues powered by TicketRemaster.</h1>
      <p>From arenas to intimate halls, discover the rooms behind the events and resale inventory.</p>
    </header>

    <article v-if="featuredVenue" class="featured-venue panel">
      <div>
        <span class="meta-label">Featured Venue</span>
        <h2>{{ featuredVenue.name }}</h2>
        <p>{{ featuredVenue.address }}</p>
      </div>
      <div class="stats">
        <div><span class="meta-label">Capacity</span><strong>{{ featuredVenue.capacity || 'N/A' }}</strong></div>
        <div><span class="meta-label">Upcoming Events</span><strong>{{ featuredVenue.events }}</strong></div>
        <div><span class="meta-label">Postal Code</span><strong>{{ featuredVenue.postalCode || 'N/A' }}</strong></div>
      </div>
    </article>

    <div v-if="loading" class="state-shell panel">Loading venues…</div>

    <section v-else-if="venues.length" class="venue-grid">
      <article v-for="venue in venueCards" :key="venue.venueId" class="venue-card panel">
        <div class="venue-head">
          <h3>{{ venue.name }}</h3>
          <span class="venue-pill">{{ venue.events }} events</span>
        </div>
        <p>{{ venue.address }}</p>
        <div class="venue-meta">
          <div><span class="meta-label">Capacity</span><strong>{{ venue.capacity || 'N/A' }}</strong></div>
          <div><span class="meta-label">Postal</span><strong>{{ venue.postalCode || 'N/A' }}</strong></div>
        </div>
        <button class="secondary" @click="router.push('/events')">See Events</button>
      </article>
    </section>

    <article v-else class="state-shell panel">No venues available yet.</article>
  </section>
</template>

<style scoped>
.venues-page, .hero { display: grid; gap: 1rem; }
.eyebrow, .meta-label {
  font-size: .7rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase;
}
.eyebrow { color: var(--primary); }
.meta-label { color: var(--text-dim); display: block; margin-bottom: .35rem; }
.hero h1 {
  margin: 0; font-family: var(--font-display); font-size: clamp(2.6rem, 5vw, 4.6rem); line-height: .95; letter-spacing: -.05em;
}
.hero p, .featured-venue p, .venue-card p { margin: 0; color: var(--text-muted); line-height: 1.75; }
.featured-venue { display: grid; grid-template-columns: minmax(0,1.1fr) minmax(0,.9fr); gap: 1rem; align-items: center; }
.featured-venue h2 { margin: .2rem 0 .5rem; font-size: 2rem; }
.stats, .venue-meta { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 1rem; }
.stats strong, .venue-meta strong { display: block; }
.venue-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1rem; }
.venue-card { display: grid; gap: .85rem; }
.venue-head { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
.venue-head h3 { margin: 0; font-size: 1.3rem; }
.venue-pill {
  width: fit-content; padding: .45rem .75rem; border-radius: 999px; background: rgba(249,115,22,.14);
  color: var(--primary); font-size: .68rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
}
.state-shell { padding: 1.4rem; text-align: center; color: var(--text-muted); }
@media (max-width: 980px) {
  .featured-venue, .stats, .venue-meta, .venue-grid { grid-template-columns: 1fr; }
}
</style>
