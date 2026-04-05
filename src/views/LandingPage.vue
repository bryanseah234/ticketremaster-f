<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/api/client'
import { isDemoMode, mockServices } from '@/services/mockData'
import type { EventSummary } from '@/types'

const router = useRouter()
const loading = ref(false)
const featuredEvents = ref<EventSummary[]>([])
const search = ref('')

const categoryCards = [
  { label: 'Concerts', blurb: 'Big-room shows, club nights, and stadium moments.', type: 'concert' },
  { label: 'Sports', blurb: 'High-voltage fixtures with verified seating and resale.', type: 'sports' },
  { label: 'Theater & Arts', blurb: 'Curated performances, premieres, and gallery nights.', type: 'theater' },
]

const heroEvent = computed(() => featuredEvents.value[0] ?? null)
const supportingEvents = computed(() => featuredEvents.value.slice(1, 5))

const mapEvent = (event: any): EventSummary => ({
  eventId: event.eventId || event.event_id,
  name: event.name,
  date: event.date || event.eventDate || event.event_date,
  venueId: event.venueId || event.venue_id || event.venue?.venueId || '',
  price: Number(event.price || 0),
  type: event.type || 'other',
  image: event.image,
  seatsAvailable: event.seatsAvailable,
  venue: event.venue
    ? { venueId: event.venue.venueId || '', name: event.venue.name, address: event.venue.address }
    : undefined,
})

const loadFeaturedEvents = async () => {
  loading.value = true
  try {
    if (isDemoMode()) {
      const result = await mockServices.getUpcomingEvents({ page: 1, limit: 5 })
      featuredEvents.value = result.events
      return
    }
    const { data } = await api.get('/events', { params: { page: 1, limit: 5 } })
    const raw = data?.data?.events || data?.data || []
    featuredEvents.value = raw.map(mapEvent)
  } catch {
    const result = await mockServices.getUpcomingEvents({ page: 1, limit: 5 })
    featuredEvents.value = result.events
  } finally {
    loading.value = false
  }
}

const submitSearch = () => {
  const query = search.value.trim()
  router.push(query ? `/events?search=${encodeURIComponent(query)}` : '/events')
}

const formatDate = (value?: string) => {
  if (!value) return 'TBA'
  return new Date(value).toLocaleDateString('en-SG', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(loadFeaturedEvents)
</script>

<template>
  <main class="landing-page">
    <section class="hero panel">
      <div class="hero-copy">
        <span class="eyebrow">Premium Experience Curator</span>
        <h1>Sell, buy, enjoy <span>live events your way</span></h1>
        <p>
          Verified tickets, editorial discovery, and a resale experience that feels sharp on desktop and frictionless on mobile.
        </p>

        <form class="search-shell" @submit.prevent="submitSearch">
          <label class="search-field">
            <span>Search</span>
            <input v-model="search" placeholder="Search concerts, artists, or venues" />
          </label>
          <button type="submit">Find Tickets</button>
        </form>

        <div class="hero-tags">
          <button class="chip" type="button" @click="router.push('/events?search=Madison%20Square%20Garden')">Popular: Madison Square Garden</button>
          <button class="chip" type="button" @click="router.push('/events?search=Festival')">Popular: Festival Nights</button>
          <button class="chip" type="button" @click="router.push('/marketplace')">Explore Resale</button>
        </div>
      </div>

      <div class="hero-visual">
        <article v-if="heroEvent" class="feature-card feature-card-large">
          <img v-if="heroEvent.image" :src="heroEvent.image" :alt="heroEvent.name" />
          <div class="overlay"></div>
          <div class="feature-content">
            <span class="feature-badge">{{ heroEvent.type }}</span>
            <h2>{{ heroEvent.name }}</h2>
            <p>{{ heroEvent.venue?.name || 'Featured venue' }} • From SGD {{ heroEvent.price.toFixed(2) }}</p>
            <RouterLink :to="`/events/${heroEvent.eventId}`"><button class="ghost-button">Get Tickets</button></RouterLink>
          </div>
        </article>

        <div class="feature-stack">
          <article v-for="event in supportingEvents" :key="event.eventId" class="feature-card feature-card-small">
            <img v-if="event.image" :src="event.image" :alt="event.name" />
            <div class="overlay"></div>
            <div class="feature-content">
              <span class="feature-badge subtle">{{ event.type }}</span>
              <h3>{{ event.name }}</h3>
              <p>{{ event.venue?.name || 'Curated venue' }} • {{ formatDate(event.date) }}</p>
            </div>
            <RouterLink class="feature-link" :to="`/events/${event.eventId}`">View Event</RouterLink>
          </article>
        </div>
      </div>
    </section>

    <section class="category-band">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Explore by Passion</span>
          <h2>Curated lanes for every kind of crowd.</h2>
        </div>
        <RouterLink to="/events" class="text-link">Browse everything</RouterLink>
      </div>

      <div class="category-grid">
        <button v-for="category in categoryCards" :key="category.label" class="category-card" type="button" @click="router.push(`/events?type=${category.type}`)">
          <span>{{ category.label }}</span>
          <p>{{ category.blurb }}</p>
        </button>
      </div>
    </section>

    <section class="cta panel">
      <div>
        <span class="eyebrow">Seller Spotlight</span>
        <h2>Got tickets to sell?</h2>
        <p>Join the verified marketplace, price confidently, and move inventory without sacrificing trust.</p>
      </div>
      <div class="cta-actions">
        <RouterLink to="/tickets"><button>List Your Ticket</button></RouterLink>
        <RouterLink to="/resale-guarantees"><button class="secondary">How It Works</button></RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.landing-page { display: grid; gap: 2rem; }
.hero, .cta { position: relative; overflow: hidden; padding: clamp(1.5rem, 4vw, 3rem); }
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: 1.5rem;
  min-height: 42rem;
  background: radial-gradient(circle at top left, rgba(249,115,22,.16), transparent 40%), linear-gradient(180deg, rgba(255,255,255,.02), transparent 35%);
}
.hero-copy, .hero-visual { position: relative; z-index: 1; }
.hero-copy { display: grid; align-content: center; gap: 1.1rem; max-width: 40rem; }
.eyebrow { color: var(--primary); font-size: .72rem; font-weight: 800; letter-spacing: .24em; text-transform: uppercase; }
.hero h1, .cta h2, .section-heading h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.9rem, 7vw, 5.6rem);
  line-height: .94;
  letter-spacing: -.06em;
}
.hero h1 span { display: block; background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.hero p, .cta p, .section-heading p { margin: 0; max-width: 34rem; color: var(--text-muted); font-size: 1rem; line-height: 1.7; }
.search-shell {
  display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: .75rem; align-items: end; padding: .75rem;
  border-radius: 999px; background: rgba(20,20,20,.86); border: 1px solid rgba(255,255,255,.05); box-shadow: 0 1.5rem 4rem rgba(0,0,0,.35);
}
.search-field { display: grid; gap: .4rem; padding-inline: 1rem; }
.search-field span { font-size: .68rem; letter-spacing: .16em; text-transform: uppercase; color: var(--text-dim); }
.search-field input { padding: 0; border: 0; background: transparent; box-shadow: none; }
.search-shell button { min-width: 10rem; }
.hero-tags, .cta-actions { display: flex; flex-wrap: wrap; gap: .75rem; }
.chip {
  padding: .8rem 1rem; border-radius: 999px; border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.03); color: var(--text-dim); font-size: .72rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase;
}
.hero-visual { display: grid; grid-template-columns: minmax(0,1.45fr) minmax(0,1fr); gap: 1rem; }
.feature-stack { display: grid; gap: 1rem; }
.feature-card {
  position: relative; overflow: hidden; min-height: 16rem; border-radius: var(--radius-lg); background: var(--surface-2);
  border: 1px solid rgba(255,255,255,.05);
}
.feature-card-large { min-height: 100%; }
.feature-card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.04), rgba(0,0,0,.82)); }
.feature-content { position: absolute; inset-inline: 1.25rem; bottom: 1.25rem; z-index: 1; display: grid; gap: .45rem; }
.feature-badge {
  width: fit-content; padding: .4rem .7rem; border-radius: 999px; background: rgba(249,115,22,.92); color: #1e0f08;
  font-size: .65rem; font-weight: 900; letter-spacing: .16em; text-transform: uppercase;
}
.feature-badge.subtle { background: rgba(18,18,18,.72); color: var(--primary); }
.feature-card h2, .feature-card h3 { margin: 0; font-family: var(--font-display); line-height: 1; letter-spacing: -.04em; }
.feature-card h2 { font-size: clamp(2rem, 3.8vw, 3rem); }
.feature-card h3 { font-size: 1.45rem; }
.feature-card p { margin: 0; color: rgba(255,255,255,.75); }
.ghost-button { background: rgba(20,20,20,.45); color: white; border-color: rgba(255,255,255,.16); }
.feature-link { position: absolute; inset: 0; color: transparent; }
.category-band {
  display: grid; gap: 1.25rem; padding: clamp(1.5rem,4vw,2rem); border-radius: var(--radius-lg);
  background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(10,10,10,.36)); border: 1px solid rgba(255,255,255,.04);
}
.section-heading { display: flex; justify-content: space-between; gap: 1rem; align-items: end; }
.section-heading h2 { font-size: clamp(2rem, 4vw, 3.3rem); }
.text-link { color: var(--primary); font-weight: 700; }
.category-grid { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 1rem; }
.category-card {
  display: grid; gap: .6rem; padding: 1.35rem; text-align: left; border-radius: var(--radius-md);
  border: 1px solid rgba(255,255,255,.05); background: linear-gradient(180deg, rgba(255,255,255,.02), transparent), rgba(20,20,20,.6);
}
.category-card span { font-size: 1.25rem; font-weight: 800; }
.category-card p { margin: 0; color: var(--text-muted); line-height: 1.65; }
.cta {
  display: flex; justify-content: space-between; gap: 1.5rem; align-items: center;
  background: radial-gradient(circle at top center, rgba(249,115,22,.12), transparent 40%), rgba(18,18,18,.9);
}
.cta h2 { font-size: clamp(2.4rem, 4vw, 4rem); }
@media (max-width: 1100px) {
  .hero, .hero-visual, .category-grid { grid-template-columns: 1fr; }
  .feature-card-large { min-height: 22rem; }
  .cta { flex-direction: column; align-items: stretch; }
}
@media (max-width: 720px) {
  .search-shell, .section-heading { grid-template-columns: 1fr; }
  .search-shell { border-radius: var(--radius-md); }
  .search-shell button { width: 100%; }
}
</style>
