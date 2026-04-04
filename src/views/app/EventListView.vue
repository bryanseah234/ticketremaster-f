<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { isDemoMode, mockServices } from '@/services/mockData'
import EventCard from '@/components/ui/EventCard.vue'
import type { EventSummary, EventType } from '@/types'

const EVENT_TYPES: Array<{ value: EventType | 'all'; label: string }> = [
  { value: 'all', label: 'All Types' },
  { value: 'concert', label: 'Concert' },
  { value: 'sports', label: 'Sports' },
  { value: 'theater', label: 'Theater' },
  { value: 'conference', label: 'Conference' },
  { value: 'festival', label: 'Festival' },
  { value: 'other', label: 'Other' },
]

const route = useRoute()
const toast = useToast()

const loading = ref(false)
const events = ref<EventSummary[]>([])
const page = ref(1)
const totalPages = ref(1)

const search = ref((route.query.search as string) || '')
const dateFrom = ref('')
const dateTo = ref('')
const typeFilter = ref<EventType | 'all'>('all')
const activeTab = ref<'all' | 'upcoming' | 'favorites'>('all')
const viewMode = ref<'grid' | 'list'>('grid')
const favoriteIds = ref<string[]>(JSON.parse(localStorage.getItem('favoriteEvents') || '[]'))

watch(favoriteIds, () => localStorage.setItem('favoriteEvents', JSON.stringify(favoriteIds.value)), { deep: true })

const toggleFavorite = (eventId: string, e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  if (favoriteIds.value.includes(eventId)) {
    favoriteIds.value = favoriteIds.value.filter((id) => id !== eventId)
  } else {
    favoriteIds.value = [...favoriteIds.value, eventId]
  }
}

const buildCacheKey = () => `events_list:${page.value}:${typeFilter.value}`

const mapEvent = (e: any): EventSummary => ({
  eventId: e.eventId || e.event_id,
  name: e.name,
  date: e.date || e.eventDate || e.event_date,
  venueId: e.venueId || e.venue_id || '',
  price: e.price ?? 0,
  type: e.type as EventType,
  image: e.image,
  venue: e.venue ? { venueId: e.venue.venueId || '', name: e.venue.name, address: e.venue.address } : undefined,
  seatsAvailable: e.seatsAvailable,
})

const load = async () => {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: page.value, limit: 10 }
    if (typeFilter.value !== 'all') params.type = typeFilter.value

    if (isDemoMode()) {
      const result = await mockServices.getEvents({ page: page.value, limit: 10, type: typeFilter.value !== 'all' ? typeFilter.value : undefined })
      events.value = result.events
      const total = result.pagination.total
      totalPages.value = Math.max(1, Math.ceil(total / 10))
    } else {
      const { data } = await api.get('/events', { params })
      const raw: any[] = data?.data?.events || data?.data || []
      events.value = raw.map(mapEvent)
      const pagination = data?.data?.pagination || data?.pagination || {}
      const total = pagination.total || 0
      const limit = pagination.limit || 10
      totalPages.value = pagination.totalPages || pagination.total_pages || Math.max(1, Math.ceil(total / limit))
      localStorage.setItem(buildCacheKey(), JSON.stringify({ items: events.value, totalPages: totalPages.value }))
    }
  } catch {
    const cached = localStorage.getItem(buildCacheKey())
    if (cached) {
      const parsed = JSON.parse(cached)
      events.value = parsed.items || []
      totalPages.value = parsed.totalPages || 1
      toast.push('Showing cached events.', 'info', 3200)
    } else {
      toast.push('Backend unavailable. No events could be loaded.', 'error', 3200)
      events.value = []
      totalPages.value = 1
    }
  } finally {
    loading.value = false
  }
}

const filteredEvents = computed(() => {
  const needle = search.value.trim().toLowerCase()
  const today = new Date().toISOString().slice(0, 10)
  return events.value.filter((e) => {
    const text = `${e.name} ${e.venue?.name || ''}`.toLowerCase()
    if (needle && !text.includes(needle)) return false
    const d = e.date?.slice(0, 10) || ''
    if (dateFrom.value && d < dateFrom.value) return false
    if (dateTo.value && d > dateTo.value) return false
    if (activeTab.value === 'upcoming' && d < today) return false
    if (activeTab.value === 'favorites' && !favoriteIds.value.includes(e.eventId)) return false
    return true
  })
})

const dateRangeLabel = computed(() => {
  if (!dateFrom.value && !dateTo.value) return null
  const fmt = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' })
  if (dateFrom.value && dateTo.value) return `${fmt(dateFrom.value)} ~ ${fmt(dateTo.value)}`
  if (dateFrom.value) return `From ${fmt(dateFrom.value)}`
  return `Until ${fmt(dateTo.value)}`
})

const onTypeChange = () => {
  page.value = 1
  load()
}

onMounted(load)
</script>

<template>
  <section class="page events-page">

    <!-- Top toolbar -->
    <div class="toolbar">
      <div class="tabs">
        <button :class="['tab', activeTab === 'all' && 'tab-active']" @click="activeTab = 'all'">All</button>
        <button :class="['tab', activeTab === 'upcoming' && 'tab-active']" @click="activeTab = 'upcoming'">Upcoming</button>
        <button :class="['tab', activeTab === 'favorites' && 'tab-active']" @click="activeTab = 'favorites'">Favourites</button>
      </div>

      <div class="toolbar-right">
        <!-- Type filter -->
        <select v-model="typeFilter" class="type-select" @change="onTypeChange" aria-label="Filter by event type">
          <option v-for="t in EVENT_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>

        <div class="search-wrap">
          <svg viewBox="0 0 24 24" class="search-icon"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input v-model="search" placeholder="Search events…" class="search-input" />
        </div>

        <div class="date-range-wrap">
          <svg viewBox="0 0 24 24" class="cal-icon"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <input v-model="dateFrom" type="date" class="date-input" title="From" />
          <span class="date-sep">–</span>
          <input v-model="dateTo" type="date" class="date-input" title="To" />
        </div>

        <div class="view-toggle">
          <button :class="['view-btn', viewMode === 'grid' && 'view-btn-active']" @click="viewMode = 'grid'" aria-label="Grid view">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
          <button :class="['view-btn', viewMode === 'list' && 'view-btn-active']" @click="viewMode = 'list'" aria-label="List view">
            <svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Active date range label -->
    <div v-if="dateRangeLabel" class="date-range-bar">
      <svg viewBox="0 0 24 24" class="cal-icon-sm"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
      {{ dateRangeLabel }}
      <button class="clear-date" @click="dateFrom=''; dateTo=''">✕</button>
    </div>

    <!-- Loading skeletons -->
    <div v-if="loading" class="events-grid">
      <EventCard v-for="n in 6" :key="n" />
    </div>

    <!-- Empty -->
    <p v-else-if="filteredEvents.length === 0" class="muted small" style="padding:2rem 0;">No events found.</p>

    <!-- Grid view -->
    <div v-else-if="viewMode === 'grid'" class="events-grid">
      <div v-for="event in filteredEvents" :key="event.eventId" class="event-card-wrap">
        <EventCard :event="event" />
        <button
          class="fav-btn"
          :class="{ 'fav-active': favoriteIds.includes(event.eventId) }"
          @click="toggleFavorite(event.eventId, $event)"
          aria-label="Toggle favourite"
        >
          <svg viewBox="0 0 24 24"><path d="M12 20.5l-1.45-1.32C5.4 14.36 2 11.28 2 7.8 2 5.2 4.1 3 6.7 3c1.5 0 2.98.7 3.86 1.8C11.32 3.7 12.8 3 14.3 3 16.9 3 19 5.2 19 7.8c0 3.48-3.4 6.56-8.55 11.38L12 20.5z"/></svg>
        </button>
      </div>
    </div>

    <!-- List view -->
    <div v-else class="events-list">
      <div
        v-for="event in filteredEvents"
        :key="event.eventId"
        class="list-row"
        role="button"
        tabindex="0"
        @click="$router.push(`/events/${event.eventId}`)"
        @keydown.enter="$router.push(`/events/${event.eventId}`)"
      >
        <EventCard :event="event" compact class="list-card" />
        <button
          class="fav-btn fav-btn-list"
          :class="{ 'fav-active': favoriteIds.includes(event.eventId) }"
          @click.stop="toggleFavorite(event.eventId, $event)"
          aria-label="Toggle favourite"
        >
          <svg viewBox="0 0 24 24"><path d="M12 20.5l-1.45-1.32C5.4 14.36 2 11.28 2 7.8 2 5.2 4.1 3 6.7 3c1.5 0 2.98.7 3.86 1.8C11.32 3.7 12.8 3 14.3 3 16.9 3 19 5.2 19 7.8c0 3.48-3.4 6.56-8.55 11.38L12 20.5z"/></svg>
        </button>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="secondary" :disabled="page <= 1" @click="page--; load()">Previous</button>
      <span class="small muted">Page {{ page }} of {{ totalPages }}</span>
      <button class="secondary" :disabled="page >= totalPages" @click="page++; load()">Next</button>
    </div>

  </section>
</template>

<style scoped>
.events-page { max-width: 1100px; }

/* ── Toolbar ── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: .85rem;
  flex-wrap: wrap;
}

.tabs { display: flex; gap: .35rem; }
.tab {
  padding: .38rem 1.1rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  font-size: .85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background .15s, border-color .15s, color .15s;
}
.tab:hover { background: rgba(255,255,255,.06); color: var(--text); }
.tab-active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-ink, #fff);
}

.toolbar-right { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; }

/* Type select */
.type-select {
  width: auto;
  padding: .38rem 2.4rem .38rem .75rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: .85rem;
  cursor: pointer;
}

.search-wrap { position: relative; display: flex; align-items: center; }
.search-icon {
  width: 1rem; height: 1rem;
  position: absolute; left: .65rem;
  stroke: var(--muted); fill: none; stroke-width: 2; stroke-linecap: round;
  pointer-events: none;
}
.search-input {
  padding: .42rem .9rem .42rem 2.1rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: .85rem;
  width: 200px;
  transition: border-color .15s;
}
.search-input:focus { outline: none; border-color: var(--accent); }
.search-input::placeholder { color: var(--muted); }

.date-range-wrap {
  display: flex; align-items: center; gap: .3rem;
  padding: .38rem .75rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
}
.cal-icon { width: 1rem; height: 1rem; fill: none; stroke: var(--muted); stroke-width: 2; stroke-linecap: round; }
.date-input {
  background: transparent; border: none;
  color: var(--text); font-size: .8rem; width: 110px;
  color-scheme: dark; cursor: pointer; padding: 0;
}
.date-input::-webkit-calendar-picker-indicator { filter: invert(.6); cursor: pointer; }
.date-sep { color: var(--muted); font-size: .85rem; }

.view-toggle {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 999px;
  overflow: hidden;
  background: var(--surface);
}
.view-btn {
  padding: .42rem .6rem;
  border: none; background: transparent;
  color: var(--muted); cursor: pointer;
  display: grid; place-items: center;
  transition: background .15s, color .15s;
}
.view-btn svg { width: 1rem; height: 1rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.view-btn:hover { background: rgba(255,255,255,.06); color: var(--text); }
.view-btn-active { background: rgba(249,115,22,.18); color: var(--accent); }

/* ── Date range bar ── */
.date-range-bar {
  display: flex; align-items: center; gap: .5rem;
  padding: .45rem .85rem;
  border: 1px solid var(--border);
  border-radius: .75rem;
  background: var(--surface);
  font-size: .82rem; color: var(--muted);
  margin-bottom: .75rem;
}
.cal-icon-sm { width: .9rem; height: .9rem; fill: none; stroke: var(--muted); stroke-width: 2; stroke-linecap: round; flex-shrink: 0; }
.clear-date { margin-left: auto; background: none; border: none; color: var(--muted); cursor: pointer; font-size: .85rem; padding: 0 .2rem; }
.clear-date:hover { color: var(--text); }

/* ── Grid ── */
.events-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem 1.25rem;
  margin-bottom: 1.5rem;
}

.event-card-wrap {
  position: relative;
}

/* Favourite button */
.fav-btn {
  position: absolute;
  top: .8rem;
  right: .8rem;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: background .15s, transform .15s;
  z-index: 2;
  padding: 0;
}
.fav-btn:hover { background: rgba(0,0,0,.7); transform: scale(1.1); }
.fav-btn svg { width: 1.2rem; height: 1.2rem; fill: rgba(255,255,255,.5); transition: fill .15s; }
.fav-btn.fav-active svg { fill: var(--accent, #f97316); }

/* ── List view ── */
.events-list { display: grid; gap: .75rem; margin-bottom: 1.5rem; }
.list-row {
  position: relative;
  cursor: pointer;
}
.list-card {
  pointer-events: none;
}
.fav-btn-list {
  top: .6rem;
  right: .6rem;
}

/* ── Misc ── */
.pagination { display: flex; align-items: center; justify-content: flex-end; gap: .75rem; margin-top: .5rem; }

@media (max-width: 900px) {
  .events-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .search-input { width: 140px; }
}
@media (max-width: 580px) {
  .events-grid { grid-template-columns: 1fr; }
  .toolbar { flex-direction: column; align-items: flex-start; }
}
</style>
