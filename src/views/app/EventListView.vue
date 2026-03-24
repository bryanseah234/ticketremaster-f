<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/api/client'
import { mockEvents } from '@/data/mockEvents'
import { useToast } from '@/composables/useToast'

interface EventItem {
  event_id: string
  name: string
  event_date: string
  venue?: { name?: string; city?: string }
  pricing_tiers?: { category: string; price: number }[]
  image?: string
}

const loading = ref(false)
const events = ref<EventItem[]>([])
const page = ref(1)
const totalPages = ref(1)
const usingFallback = ref(false)

const search = ref('')
const dateFilter = ref('')
const onlyFavorites = ref(false)
const favoriteIds = ref<string[]>(JSON.parse(localStorage.getItem('favorite_events') || '[]'))
const toast = useToast()

const saveFavorites = () => localStorage.setItem('favorite_events', JSON.stringify(favoriteIds.value))
watch(favoriteIds, saveFavorites, { deep: true })

const toggleFavorite = (eventId: string) => {
  if (favoriteIds.value.includes(eventId)) {
    favoriteIds.value = favoriteIds.value.filter((id) => id !== eventId)
  } else {
    favoriteIds.value = [...favoriteIds.value, eventId]
  }
}

const buildCacheKey = () => `events_list:${page.value}:${dateFilter.value || 'all'}`

const load = async () => {
  loading.value = true
  usingFallback.value = false
  toast.push('Loading events...', 'info', 1600)
  try {
    const { data } = await api.get('/events', { params: { page: page.value, limit: 20, date: dateFilter.value || undefined } })
    const raw = data?.data?.events || data?.data || []
    const items = raw.map((e: any) => ({
      event_id: e.eventId || e.event_id,
      name: e.name,
      event_date: e.date || e.event_date || e.eventDate,
      image: e.image,
      venue: e.venue ? { name: e.venue.name, city: e.venue.city || e.venue.address } : undefined,
      pricing_tiers: e.pricingTiers || e.pricing_tiers || (e.price != null ? [{ category: 'GA', price: e.price }] : []),
    }))
    events.value = items
    const pagination = data?.data?.pagination || data?.pagination || {}
    totalPages.value = pagination.totalPages || pagination.total_pages || 1
    localStorage.setItem(buildCacheKey(), JSON.stringify({ items, totalPages: totalPages.value }))
  } catch {
    const cached = localStorage.getItem(buildCacheKey())
    if (cached) {
      const parsed = JSON.parse(cached)
      events.value = parsed.items || []
      totalPages.value = parsed.totalPages || 1
      usingFallback.value = true
      toast.push('Offline mode: showing cached events.', 'info', 3200)
    } else {
      usingFallback.value = true
      toast.push('Backend unavailable. Showing limited demo data. Actions are limited.', 'info', 3200)
      events.value = mockEvents.slice(0, 20)
      totalPages.value = 1
    }
  } finally {
    loading.value = false
  }
}

const filteredEvents = computed(() => {
  const needle = search.value.trim().toLowerCase()
  return events.value.filter((event) => {
    const text = `${event.name} ${event.venue?.name || ''} ${event.venue?.city || ''}`.toLowerCase()
    const matched = !needle || text.includes(needle)
    const dateMatched = !dateFilter.value || event.event_date.slice(0, 10) === dateFilter.value
    const favMatched = !onlyFavorites.value || favoriteIds.value.includes(event.event_id)
    return matched && dateMatched && favMatched
  })
})

const empty = computed(() => !loading.value && filteredEvents.value.length === 0)
watch(empty, (value) => {
  if (value) toast.push('No matching events found.', 'info', 2400)
})
onMounted(load)
</script>

<template>
  <section class="page">
    <h1 class="section-title">Discover Events</h1>
    <p class="section-subtitle">Search by artist/event/venue, filter by date, and manage favorites.</p>

    <article class="glass filter-bar">
      <input v-model="search" placeholder="Search artist, event or venue" class="search-col" />
      <input v-model="dateFilter" type="date" class="date-col" />

      <button class="toggle" :class="{ active: onlyFavorites }" @click="onlyFavorites = !onlyFavorites" :aria-label="onlyFavorites ? 'show all events' : 'show favorite events'">
        <svg class="toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 20.5l-1.45-1.32C5.4 14.36 2 11.28 2 7.8 2 5.2 4.1 3 6.7 3c1.5 0 2.98.7 3.86 1.8C11.32 3.7 12.8 3 14.3 3 16.9 3 19 5.2 19 7.8c0 3.48-3.4 6.56-8.55 11.38L12 20.5z"></path>
        </svg>
        <span class="knob"></span>
      </button>

      <button @click="page=1; load()">Apply</button>
      <button class="secondary" @click="search=''; dateFilter=''; onlyFavorites=false; page=1; load()">Reset</button>
    </article>

    <div class="events-grid">
      <RouterLink v-for="event in filteredEvents" :key="event.event_id" :to="`/events/${event.event_id}`" class="event-card-link">
        <article class="glass event-card">
          <img class="cover-img" :src="event.image || 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1200'" :alt="event.name" />
          <div class="cover"></div>
          <div class="content">
            <button class="ghost heart-action" :class="{ active: favoriteIds.includes(event.event_id) }" :aria-label="`toggle favorite ${event.name}`" @click.prevent="toggleFavorite(event.event_id)">
              <svg class="heart-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20.5l-1.45-1.32C5.4 14.36 2 11.28 2 7.8 2 5.2 4.1 3 6.7 3c1.5 0 2.98.7 3.86 1.8C11.32 3.7 12.8 3 14.3 3 16.9 3 19 5.2 19 7.8c0 3.48-3.4 6.56-8.55 11.38L12 20.5z"></path>
              </svg>
            </button>

            <div class="venue-badge">
              <svg class="location-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>{{ event.venue?.name || 'Venue TBA' }}</span>
            </div>

            <div class="event-info">
              <h3>{{ event.name }}</h3>
              <p class="small">{{ new Date(event.event_date).toLocaleDateString() }}</p>

              <div class="row" style="gap:.35rem;">
                <template v-if="Array.isArray(event.pricing_tiers)">
                  <span v-for="tier in event.pricing_tiers.slice(0, 2)" :key="tier.category" class="badge">{{ tier.category }} ${{ tier.price }}</span>
                </template>
                <template v-else>
                  <span v-for="[cat, price] in Object.entries(event.pricing_tiers || {}).slice(0, 2)" :key="cat" class="badge">{{ cat }} ${{ price }}</span>
                </template>
              </div>
            </div>
          </div>
        </article>
      </RouterLink>
    </div>

    <div class="row" style="justify-content:flex-end;margin-top:1rem;">
      <button class="secondary" :disabled="page<=1 || usingFallback" @click="page--; load()">Previous</button>
      <span class="small">Page {{ page }} of {{ totalPages }}</span>
      <button class="secondary" :disabled="page>=totalPages || usingFallback" @click="page++; load()">Next</button>
    </div>
  </section>
</template>

<style scoped>
.filter-bar{padding:.8rem;display:grid;grid-template-columns:3fr 1.3fr auto auto auto;gap:.55rem;align-items:center;margin-bottom:1rem}
.search-col{min-width:0}
.date-col{min-width:0;color-scheme:dark}
.date-col::-webkit-calendar-picker-indicator{filter:invert(1);opacity:.75}
.date-col::-webkit-inner-spin-button{opacity:0}
.toggle{position:relative;height:2.5rem;width:3.9rem;padding:.22rem;border-radius:999px;border:1px solid var(--border);background:rgba(255,255,255,.06)}
.toggle .knob{display:block;width:1.8rem;height:1.8rem;border-radius:999px;background:#fff;transition:transform .18s ease}
.toggle-icon{width:1.1rem;height:1.1rem;fill:#f8d4c2;position:absolute;left:.5rem;top:.7rem;opacity:.7;transition:opacity .18s ease}
.toggle.active{background:rgba(249,115,22,.25)}
.toggle.active .knob{transform:translateX(1.25rem);background:#ffedd5}
.toggle.active .toggle-icon{opacity:1}

.events-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1rem}
.event-card{position:relative;overflow:hidden;min-height:280px;transition:transform .2s ease,box-shadow .2s ease}
.event-card-link:hover .event-card{transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,.4); filter: brightness(1.9);}
.cover-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.cover{position:absolute;inset:0;background:linear-gradient(180deg,rgba(9,9,11,.15),rgba(9,9,11,.88))}
.content{position:relative;padding:1rem;display:flex;flex-direction:column;gap:.55rem;height:100%}
.event-info{position:absolute;top:11rem;left:1rem;display:grid;gap:.55rem}
.venue-badge{position:absolute;top:.8rem;left:.8rem;display:flex;align-items:center;gap:.35rem;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);padding:.35rem .6rem;border-radius:999px}
.venue-badge span{color:#fff;font-size:.8rem}
.location-icon{width:1rem;height:1rem;fill:#fff;opacity:.9}
.event-card-link{text-decoration:none;color:inherit;display:block}
.heart-action{position:absolute;top:.8rem;right:.8rem;height:2.9rem;width:2.9rem;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.1)}
.heart-icon{width:1.45rem;height:1.45rem;fill:rgba(255,255,255,.7);transition:transform .18s ease, fill .18s ease;display:block}
.heart-action.active .heart-icon{fill:rgba(255,186,126,.95)}
.heart-action:hover{background:rgba(0,0,0,.6)}
h3{color:#fff}
.small{color:#d4d4d8}
.heart-icon{width:1.45rem;height:1.45rem;fill:rgba(255,255,255,.7);transition:transform .18s ease, fill .18s ease;display:block}
.heart-action.active .heart-icon{fill:rgba(255,186,126,.95)}
.actions{justify-content:flex-start;align-items:center;gap:.6rem}
.heart-action{height:2.9rem;width:2.9rem;border-radius:.8rem;display:grid;place-items:center}

@media (max-width:1100px){
  .events-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .filter-bar{grid-template-columns:2fr 1fr auto auto auto}
}
@media (max-width:720px){
  .events-grid{grid-template-columns:1fr}
  .filter-bar{grid-template-columns:1fr 1fr auto;}
  .filter-bar button.secondary{grid-column:2/span 1}
}
</style>
