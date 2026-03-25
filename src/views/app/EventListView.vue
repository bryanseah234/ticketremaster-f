<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'

const EVENT_TYPE_IMAGES: Record<string, string> = {
  concert:   'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1200',
  sports:    'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?q=80&w=1200',
  orchestra: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=1200',
  classical: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=1200',
  theatre:   'https://images.unsplash.com/photo-1503095396549-807759245b35?q=80&w=1200',
  festival:  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1200',
  default:   'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200',
}

const getEventImage = (type?: string, image?: string): string => {
  // Only use the backend image if it's a real URL (not the example.com placeholders)
  if (image && !image.includes('example.com')) return image
  return EVENT_TYPE_IMAGES[type?.toLowerCase() ?? ''] ?? EVENT_TYPE_IMAGES.default
}

interface EventItem {
  eventId: string
  name: string
  eventDate: string
  venue?: { name?: string; city?: string }
  pricingTiers?: { category: string; price: number }[]
  image?: string
}

const route = useRoute()

const loading = ref(false)
const events = ref<EventItem[]>([])
const page = ref(1)
const totalPages = ref(1)
const usingFallback = ref(false)

const search = ref((route.query.search as string) || '')
const dateFrom = ref('')
const dateTo = ref('')
const activeTab = ref<'all' | 'upcoming' | 'favorites'>('all')
const viewMode = ref<'grid' | 'list'>('grid')
const favoriteIds = ref<string[]>(JSON.parse(localStorage.getItem('favoriteEvents') || '[]'))
const toast = useToast()

watch(favoriteIds, () => localStorage.setItem('favoriteEvents', JSON.stringify(favoriteIds.value)), { deep: true })

const toggleFavorite = (eventId: string, e: Event) => {
  e.preventDefault()
  if (favoriteIds.value.includes(eventId)) {
    favoriteIds.value = favoriteIds.value.filter((id) => id !== eventId)
  } else {
    favoriteIds.value = [...favoriteIds.value, eventId]
  }
}

const buildCacheKey = () => `events_list:${page.value}`

const load = async () => {
  loading.value = true
  usingFallback.value = false
  try {
    const { data } = await api.get('/events', { params: { page: page.value, limit: 20 } })
    const raw = data?.data?.events || data?.data || []
    events.value = raw.map((e: any) => ({
      eventId: e.eventId || e.event_id,
      name: e.name,
      eventDate: e.date || e.eventDate || e.event_date,
      image: getEventImage(e.type, e.image),
      venue: e.venue ? { name: e.venue.name, city: e.venue.city || e.venue.address } : undefined,
      pricingTiers: e.pricingTiers || e.pricing_tiers || (e.price != null ? [{ category: 'GA', price: e.price }] : []),
    }))
    const pagination = data?.data?.pagination || data?.pagination || {}
    totalPages.value = pagination.totalPages || pagination.total_pages || 1
    localStorage.setItem(buildCacheKey(), JSON.stringify({ items: events.value, totalPages: totalPages.value }))
  } catch {
    const cached = localStorage.getItem(buildCacheKey())
    if (cached) {
      const parsed = JSON.parse(cached)
      events.value = parsed.items || []
      totalPages.value = parsed.totalPages || 1
      usingFallback.value = true
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
    const d = e.eventDate?.slice(0, 10) || ''
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

const formatDate = (d: string) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short' })
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

    <!-- Loading -->
    <div v-if="loading" class="loading-row">
      <div class="spinner" />
      <span class="small muted">Loading events…</span>
    </div>

    <!-- Empty -->
    <p v-else-if="filteredEvents.length === 0" class="muted small" style="padding:2rem 0;">No events found.</p>

    <!-- Grid view -->
    <div v-else-if="viewMode === 'grid'" class="events-grid">
      <RouterLink
        v-for="event in filteredEvents"
        :key="event.eventId"
        :to="`/events/${event.eventId}`"
        class="event-card-link"
      >
        <article class="event-card">
          <div class="img-wrap">
            <img
              class="event-img"
              :src="event.image || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800'"
              :alt="event.name"
              @error="(e: any) => e.target.src = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=800'"
            />
            <div class="img-overlay" />
            <button
              class="fav-btn"
              :class="{ 'fav-active': favoriteIds.includes(event.eventId) }"
              @click="toggleFavorite(event.eventId, $event)"
              aria-label="Toggle favourite"
            >
              <svg viewBox="0 0 24 24"><path d="M12 20.5l-1.45-1.32C5.4 14.36 2 11.28 2 7.8 2 5.2 4.1 3 6.7 3c1.5 0 2.98.7 3.86 1.8C11.32 3.7 12.8 3 14.3 3 16.9 3 19 5.2 19 7.8c0 3.48-3.4 6.56-8.55 11.38L12 20.5z"/></svg>
            </button>
          </div>
          <div class="card-body">
            <p class="card-date">{{ formatDate(event.eventDate) }}</p>
            <p class="card-name">{{ event.name }}</p>
            <p v-if="event.venue?.name" class="card-venue">{{ event.venue.name }}</p>
            <div class="card-tiers">
              <template v-if="Array.isArray(event.pricingTiers)">
                <span v-for="tier in event.pricingTiers.slice(0, 2)" :key="tier.category" class="tier-badge">{{ tier.category }} · ${{ tier.price }}</span>
              </template>
            </div>
          </div>
        </article>
      </RouterLink>
    </div>

    <!-- List view -->
    <div v-else class="events-list">
      <RouterLink
        v-for="event in filteredEvents"
        :key="event.eventId"
        :to="`/events/${event.eventId}`"
        class="list-row"
      >
        <img
          class="list-img"
          :src="event.image || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=400'"
          :alt="event.name"
          @error="(e: any) => e.target.src = 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=400'"
        />
        <div class="list-info">
          <p class="card-date">{{ formatDate(event.eventDate) }}</p>
          <p class="card-name">{{ event.name }}</p>
          <p v-if="event.venue?.name" class="card-venue">{{ event.venue.name }}</p>
        </div>
        <div class="list-tiers">
          <template v-if="Array.isArray(event.pricingTiers)">
            <span v-for="tier in event.pricingTiers.slice(0, 2)" :key="tier.category" class="tier-badge">{{ tier.category }} · ${{ tier.price }}</span>
          </template>
        </div>
      </RouterLink>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="secondary" :disabled="page <= 1 || usingFallback" @click="page--; load()">Previous</button>
      <span class="small muted">Page {{ page }} of {{ totalPages }}</span>
      <button class="secondary" :disabled="page >= totalPages || usingFallback" @click="page++; load()">Next</button>
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

/* Tabs — pill style with orange accent */
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

/* Search + date + view toggle */
.toolbar-right { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; }

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

/* Glass card */
.event-card-link { text-decoration: none; color: inherit; display: block; height: 100%; }
.event-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 1.1rem;
  border: 1px solid var(--border);
  background: var(--surface);
  backdrop-filter: blur(12px);
  overflow: hidden;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
}
.event-card-link:hover .event-card {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,.35);
  border-color: var(--accent);
}

/* Image with overlay gradient */
.img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  flex-shrink: 0;
}
.event-img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform .3s ease;
  display: block;
}
.event-card-link:hover .event-img { transform: scale(1.06); }

/* Overlay: dark gradient at bottom of image */
.img-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.1) 55%, transparent 100%);
  pointer-events: none;
}

/* Favourite button */
.fav-btn {
  position: absolute; top: .8rem; right: .8rem;
  width: 3rem; height: 3rem;
  border-radius: 50%; border: none;
  background: rgba(0,0,0,.45);
  backdrop-filter: blur(6px);
  display: grid; place-items: center;
  cursor: pointer;
  transition: background .15s, transform .15s;
}
.fav-btn:hover { background: rgba(0,0,0,.7); transform: scale(1.1); }
.fav-btn svg { width: 2rem; height: 2rem; fill: rgba(255,255,255,.5); transition: fill .15s; }
.fav-btn.fav-active svg { fill: var(--accent, #f97316); }

/* Card body */
.card-body {
  padding: .85rem 1rem .9rem;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.card-date {
  font-size: .73rem;
  color: var(--accent);
  font-weight: 600;
  letter-spacing: .045em;
  text-transform: uppercase;
  margin-bottom: .3rem;
}
.card-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
  margin-bottom: .3rem;
}
.card-venue {
  font-size: .78rem;
  color: var(--muted);
  margin-bottom: .8rem;
  display: flex; align-items: center; gap: .25rem;
}
.card-tiers { margin-top: auto; display: flex; flex-wrap: wrap; gap: .3rem; }
.tier-badge {
  font-size: .7rem;
  padding: .18rem .6rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  color: var(--muted);
  background: rgba(255,255,255,.05);
}

/* ── List view ── */
.events-list { display: grid; gap: 0; margin-bottom: 1.5rem; border-top: 1px solid var(--border); }
.list-row {
  display: flex; align-items: center; gap: 1rem;
  padding: .9rem 0;
  border-bottom: 1px solid var(--border);
  text-decoration: none; color: inherit;
  transition: background .15s;
}
.list-row:hover { background: rgba(255,255,255,.03); }
.list-img {
  width: 90px; height: 64px;
  object-fit: cover;
  border-radius: .75rem;
  flex-shrink: 0;
  border: 1px solid var(--border);
}
.list-info { flex: 1; min-width: 0; }
.list-tiers { display: flex; flex-wrap: wrap; gap: .3rem; flex-shrink: 0; }

/* ── Misc ── */
.loading-row { display: flex; align-items: center; gap: .75rem; padding: 2.5rem 0; color: var(--muted); }
.spinner {
  width: 1.6rem; height: 1.6rem;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

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
