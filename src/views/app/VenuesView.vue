<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import api from '@/api/client'
import { mockEvents } from '@/data/mockEvents'
import { useToast } from '@/composables/useToast'

interface VenueItem {
  id: string
  name: string
  address: string
  city?: string
  events: number
}

const toast = useToast()
const venues = ref<VenueItem[]>([])
const loading = ref(false)

const buildVenues = (events: any[]) => {
  const map = new Map<string, VenueItem>()
  events.forEach((event) => {
    const venue = event?.venue
    if (!venue?.name) return
    const id = venue.venue_id || `${venue.name}-${venue.address || venue.city || ''}`.toLowerCase()
    const current = map.get(id)
    if (current) {
      current.events += 1
    } else {
      map.set(id, {
        id,
        name: venue.name,
        address: venue.address || venue.city || 'Address details unavailable',
        city: venue.city,
        events: 1,
      })
    }
  })
  venues.value = Array.from(map.values()).sort((a, b) => b.events - a.events)
}

const load = async () => {
  loading.value = true
  toast.push('Loading venues...', 'info', 1600)
  try {
    const { data } = await api.get('/events', { params: { per_page: 50 } })
    buildVenues(data?.data || [])
  } catch {
    buildVenues(mockEvents)
    toast.push('Showing demo venues while the backend is unavailable.', 'info', 3200)
  } finally {
    loading.value = false
  }
}

const empty = computed(() => !loading.value && venues.value.length === 0)
onMounted(load)
</script>

<template>
  <section class="page venues">
    <article class="glass hero">
      <span class="badge">Venues</span>
      <h1 class="section-title">Explore venues powered by TicketRemaster.</h1>
      <p class="section-subtitle">From arenas to intimate halls, we partner with venues across global cities.</p>
    </article>

    <section class="grid-3 venue-grid">
      <article v-for="venue in venues" :key="venue.id" class="glass venue-card">
        <h3>{{ venue.name }}</h3>
        <p class="small">{{ venue.address }}</p>
        <p class="small">{{ venue.events }} upcoming events</p>
      </article>
    </section>

    <article v-if="empty" class="glass" style="padding:1rem;">No venues available yet.</article>

    <article class="glass info">
      <h2 class="section-title" style="font-size:1.2rem;">Venue Support</h2>
      <p class="small">We provide seating maps, ticket validation, and resale management for partner venues.</p>
      <p class="small">Want to list your venue? Contact our partnerships team for onboarding and pricing.</p>
    </article>
  </section>
</template>

<style scoped>
.venues{display:grid;gap:1rem}
.hero{padding:1.2rem;display:grid;gap:.5rem}
.venue-grid{margin-top:.2rem}
.venue-card{padding:1rem;display:grid;gap:.4rem}
.info{padding:1rem;display:grid;gap:.4rem}
</style>
