<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { isDemoMode, mockServices } from '@/services/mockData'
import type { EventSummary, EventType } from '@/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const EVENT_TYPES: Array<{ value: EventType | 'all'; label: string }> = [
  { value: 'all', label: 'All Categories' },
  { value: 'concert', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'theater', label: 'Theater' },
  { value: 'conference', label: 'Conference' },
  { value: 'festival', label: 'Festival' },
  { value: 'other', label: 'Other' },
]

const loading = ref(false)
const events = ref<EventSummary[]>([])
const page = ref(1)
const totalPages = ref(1)
const search = ref((route.query.search as string) || '')
const typeFilter = ref<EventType | 'all'>((route.query.type as EventType | 'all') || 'all')
const activeTab = ref<'all' | 'upcoming' | 'favorites'>('all')
const favoriteIds = ref<string[]>(JSON.parse(localStorage.getItem('favoriteEvents') || '[]'))

watch(favoriteIds, () => localStorage.setItem('favoriteEvents', JSON.stringify(favoriteIds.value)), { deep: true })

const buildCacheKey = () => `events_list:${page.value}:${typeFilter.value}`

const mapEvent = (event: any): EventSummary => ({
  eventId: event.eventId || event.event_id,
  name: event.name,
  date: event.date || event.eventDate || event.event_date,
  venueId: event.venueId || event.venue_id || '',
  price: Number(event.price || 0),
  type: (event.type || 'other') as EventType,
  image: event.image,
  seatsAvailable: event.seatsAvailable,
  venue: event.venue ? { venueId: event.venue.venueId || '', name: event.venue.name, address: event.venue.address } : undefined,
})

const load = async () => {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value, limit: 10 }
    if (typeFilter.value !== 'all') params.type = typeFilter.value

    if (isDemoMode() || import.meta.env.DEV) {
      const result = await mockServices.getEvents({ page: page.value, limit: 10, type: typeFilter.value !== 'all' ? typeFilter.value : undefined })
      events.value = result.events
      totalPages.value = Math.max(1, Math.ceil(result.pagination.total / 10))
      return
    }

    const { data } = await api.get('/events', { params })
    const raw = data?.data?.events || data?.data || []
    events.value = raw.map(mapEvent)
    const pagination = data?.data?.pagination || data?.pagination || {}
    const total = pagination.total || events.value.length
    const limit = pagination.limit || 10
    totalPages.value = pagination.totalPages || pagination.total_pages || Math.max(1, Math.ceil(total / limit))
    localStorage.setItem(buildCacheKey(), JSON.stringify({ items: events.value, totalPages: totalPages.value }))
  } catch {
    const cached = localStorage.getItem(buildCacheKey())
    if (cached) {
      const parsed = JSON.parse(cached)
      events.value = parsed.items || []
      totalPages.value = parsed.totalPages || 1
      toast.push('Showing cached events.', 'info', 3200)
    } else {
      try {
        const result = await mockServices.getEvents({ page: page.value, limit: 10, type: typeFilter.value !== 'all' ? typeFilter.value : undefined })
        events.value = result.events
        totalPages.value = Math.max(1, Math.ceil(result.pagination.total / 10))
        toast.push('Backend unavailable. Showing demo events.', 'info', 3200)
      } catch {
        events.value = []
        totalPages.value = 1
        toast.push('Could not load events.', 'error', 3200)
      }
    }
  } finally {
    loading.value = false
  }
}

const filteredEvents = computed(() => {
  const needle = search.value.trim().toLowerCase()
  const today = new Date().toISOString().slice(0, 10)
  return events.value.filter((event) => {
    const text = `${event.name} ${event.venue?.name || ''}`.toLowerCase()
    if (needle && !text.includes(needle)) return false
    if (activeTab.value === 'upcoming' && (event.date?.slice(0, 10) || '') < today) return false
    if (activeTab.value === 'favorites' && !favoriteIds.value.includes(event.eventId)) return false
    return true
  })
})

const heroEvent = computed(() => filteredEvents.value[0] || null)
const gridEvents = computed(() => filteredEvents.value.slice(heroEvent.value ? 1 : 0))

const toggleFavorite = (eventId: string) => {
  favoriteIds.value = favoriteIds.value.includes(eventId)
    ? favoriteIds.value.filter((id) => id !== eventId)
    : [...favoriteIds.value, eventId]
}

const setType = (value: EventType | 'all') => {
  typeFilter.value = value
  router.replace({ query: { ...route.query, type: value === 'all' ? undefined : value } })
  page.value = 1
  load()
}

const formatDate = (value?: string) => {
  if (!value) return 'Date TBA'
  return new Date(value).toLocaleDateString('en-SG', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(load)
</script>

<template>
  <section class="events-page">
    <header class="events-header">
      <span class="eyebrow">Curated Experiences</span>
      <h1>Browse the next unforgettable room.</h1>
      <p>Search live events, filter by category, and pin favorites before seats move.</p>

      <div class="toolbar panel">
        <label class="search-wrap">
          <span>Search</span>
          <input v-model="search" placeholder="Search events, artists, or venues" />
        </label>

        <div class="tab-row">
          <button :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">All</button>
          <button :class="{ active: activeTab === 'upcoming' }" @click="activeTab = 'upcoming'">Upcoming</button>
          <button :class="{ active: activeTab === 'favorites' }" @click="activeTab = 'favorites'">Favorites</button>
        </div>
      </div>

      <div class="filter-row">
        <button v-for="type in EVENT_TYPES" :key="type.value" class="chip" :class="{ active: typeFilter === type.value }" type="button" @click="setType(type.value)">
          {{ type.label }}
        </button>
      </div>
    </header>

    <div v-if="loading" class="loading-grid">
      <article v-for="n in 5" :key="n" class="skeleton-card panel"></article>
    </div>

    <template v-else>
      <div v-if="heroEvent" class="hero-card">
        <img v-if="heroEvent.image" :src="heroEvent.image" :alt="heroEvent.name" />
        <div class="overlay"></div>
        <div class="hero-card-content">
          <div class="hero-meta">
            <span class="hero-badge">Featured</span>
            <span>{{ formatDate(heroEvent.date) }}</span>
          </div>
          <h2>{{ heroEvent.name }}</h2>
          <p>{{ heroEvent.venue?.name || 'Featured venue' }}</p>
          <div class="hero-actions">
            <button @click="router.push(`/events/${heroEvent.eventId}`)">Get Tickets</button>
            <button class="secondary" @click="toggleFavorite(heroEvent.eventId)">
              {{ favoriteIds.includes(heroEvent.eventId) ? 'Favorited' : 'Save Event' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredEvents.length === 0" class="empty-state panel">
        <h2>No events found.</h2>
        <p>Try another search or switch to a different category.</p>
      </div>

      <div v-else class="cards-grid">
        <article v-for="event in gridEvents" :key="event.eventId" class="event-card panel">
          <div class="event-media" @click="router.push(`/events/${event.eventId}`)">
            <img v-if="event.image" :src="event.image" :alt="event.name" />
            <div class="overlay"></div>
            <button class="favorite-toggle" type="button" @click.stop="toggleFavorite(event.eventId)">
              {{ favoriteIds.includes(event.eventId) ? '♥' : '♡' }}
            </button>
            <span class="event-badge">{{ event.type }}</span>
          </div>

          <div class="event-copy">
            <h3>{{ event.name }}</h3>
            <p>{{ event.venue?.name || 'Venue TBA' }}</p>
            <div class="event-footer">
              <span>SGD {{ event.price.toFixed(2) }}</span>
              <button class="secondary" @click="router.push(`/events/${event.eventId}`)">View</button>
            </div>
          </div>
        </article>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button class="secondary" :disabled="page <= 1" @click="page--; load()">Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button class="secondary" :disabled="page >= totalPages" @click="page++; load()">Next</button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.events-page, .events-header { display: grid; gap: 1rem; }
.eyebrow { color: var(--primary); font-size: .72rem; font-weight: 800; letter-spacing: .22em; text-transform: uppercase; }
.events-header h1 {
  margin: 0; font-family: var(--font-display); font-size: clamp(2.8rem, 6vw, 4.8rem);
  line-height: .95; letter-spacing: -.05em;
}
.events-header p { margin: 0; max-width: 42rem; color: var(--text-muted); line-height: 1.7; }
.toolbar { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 1rem; align-items: end; padding: 1rem; }
.search-wrap { display: grid; gap: .4rem; }
.search-wrap span { color: var(--text-dim); font-size: .7rem; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
.tab-row, .filter-row, .hero-actions, .pagination { display: flex; gap: .75rem; flex-wrap: wrap; align-items: center; }
.tab-row button, .chip {
  padding: .8rem 1rem; border-radius: 999px; border: 1px solid rgba(255,255,255,.06);
  background: rgba(255,255,255,.03); color: var(--text-dim); font-size: .75rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
}
.tab-row button.active, .chip.active { border-color: rgba(249,115,22,.5); background: rgba(249,115,22,.16); color: var(--primary); }
.hero-card { position: relative; overflow: hidden; min-height: 26rem; border-radius: var(--radius-lg); border: 1px solid rgba(255,255,255,.06); }
.hero-card > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.06), rgba(0,0,0,.84)); }
.hero-card-content { position: absolute; inset-inline: 1.5rem; bottom: 1.5rem; z-index: 1; display: grid; gap: .6rem; }
.hero-meta { display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; color: rgba(255,255,255,.76); font-size: .78rem; font-weight: 700; }
.hero-badge, .event-badge {
  width: fit-content; padding: .45rem .7rem; border-radius: 999px; background: rgba(249,115,22,.92);
  color: #1e0f08; font-size: .65rem; font-weight: 900; letter-spacing: .15em; text-transform: uppercase;
}
.hero-card h2 { margin: 0; font-family: var(--font-display); font-size: clamp(2.2rem, 5vw, 4rem); line-height: .96; letter-spacing: -.05em; }
.hero-card p { margin: 0; color: rgba(255,255,255,.72); }
.cards-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 1rem; }
.event-card { overflow: hidden; padding: 0; }
.event-media { position: relative; aspect-ratio: 1 / 1; cursor: pointer; }
.event-media img { width: 100%; height: 100%; object-fit: cover; }
.favorite-toggle {
  position: absolute; top: .85rem; right: .85rem; z-index: 1; width: 2.4rem; height: 2.4rem; border-radius: 999px;
  border: 1px solid rgba(255,255,255,.16); background: rgba(12,12,12,.5); color: white;
}
.event-badge { position: absolute; left: .85rem; bottom: .85rem; z-index: 1; }
.event-copy { display: grid; gap: .55rem; padding: 1rem; }
.event-copy h3 { margin: 0; font-size: 1.2rem; line-height: 1.2; }
.event-copy p { margin: 0; color: var(--text-muted); }
.event-footer { display: flex; justify-content: space-between; align-items: center; gap: .75rem; padding-top: .2rem; }
.event-footer span { color: var(--primary); font-size: 1rem; font-weight: 800; }
.loading-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 1rem; }
.skeleton-card { min-height: 18rem; }
.empty-state { display: grid; gap: .5rem; padding: 2rem; text-align: center; }
.empty-state h2, .empty-state p { margin: 0; }
.empty-state p { color: var(--text-muted); }
.pagination { justify-content: flex-end; color: var(--text-muted); }
@media (max-width: 980px) {
  .cards-grid, .loading-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
}
@media (max-width: 720px) {
  .toolbar, .cards-grid, .loading-grid { grid-template-columns: 1fr; }
}
</style>
