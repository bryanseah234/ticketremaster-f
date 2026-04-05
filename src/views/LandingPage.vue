<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/client'
import { isDemoMode, mockServices } from '@/services/mockData'
import type { EventSummary } from '@/types'

const router = useRouter()

const loading = ref(false)
const featuredEvents = ref<EventSummary[]>([])
const search = ref('')

const categoryCards = [
  { label: 'Concerts', blurb: 'Big-room shows, club nights, and stadium moments.', query: 'concert' },
  { label: 'Sports', blurb: 'Verified inventory for rivalry fixtures and finals.', query: 'sports' },
  { label: 'Theater', blurb: 'Premieres, matinees, and evenings worth dressing for.', query: 'theater' },
]

const heroEvent = computed(() => featuredEvents.value[0] ?? null)
const stackedEvents = computed(() => featuredEvents.value.slice(1, 3))
const galleryEvents = computed(() => featuredEvents.value.slice(3, 6))

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
    if (isDemoMode() || import.meta.env.DEV) {
      const result = await mockServices.getUpcomingEvents({ page: 1, limit: 6 })
      featuredEvents.value = result.events
      return
    }
    const { data } = await api.get('/events', { params: { page: 1, limit: 6 } })
    const raw = data?.data?.events || data?.data || []
    featuredEvents.value = raw.map(mapEvent)
  } catch {
    const result = await mockServices.getUpcomingEvents({ page: 1, limit: 6 })
    featuredEvents.value = result.events
  } finally {
    loading.value = false
  }
}

const submitSearch = () => {
  const query = search.value.trim()
  router.push(query ? `/events?search=${encodeURIComponent(query)}` : '/events')
}

const openFilteredEvents = (query: string) => {
  router.push(`/events?search=${encodeURIComponent(query)}`)
}

const openType = (type: string) => {
  router.push(`/events?type=${encodeURIComponent(type)}`)
}

const formatDate = (value?: string) => {
  if (!value) return 'Date TBA'
  return new Date(value).toLocaleDateString('en-SG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

onMounted(loadFeaturedEvents)
</script>

<template>
  <main class="landing-page">
    <section class="hero-section">
      <div class="hero-copy">
        <span class="eyebrow">Premium Experience Curator</span>
        <h1>
          Sell, Buy, Enjoy
          <span>Live Events Your Way</span>
        </h1>

        <form class="search-shell" @submit.prevent="submitSearch">
          <div class="search-input-wrap">
            <span class="search-icon" aria-hidden="true">⌕</span>
            <input v-model="search" placeholder="Search concerts, artists, or venues..." />
          </div>
          <button type="submit">Find Tickets</button>
        </form>

        <div class="popular-row">
          <button class="popular-chip" type="button" @click="openFilteredEvents('Madison Square Garden')">
            Popular: Madison Square Garden
          </button>
          <button class="popular-chip" type="button" @click="openFilteredEvents('Coachella')">
            Coachella 2024
          </button>
          <button class="popular-chip" type="button" @click="openFilteredEvents('Wembley Stadium')">
            Wembley Stadium
          </button>
        </div>
      </div>
    </section>

    <section class="featured-section">
      <div class="section-header">
        <div>
          <h2>Featured Events</h2>
          <p>Hand-picked experiences from our Velvet Curator collection.</p>
        </div>
      </div>

      <div v-if="loading" class="featured-grid loading-grid">
        <div class="loading-card hero-loading"></div>
        <div class="loading-stack">
          <div class="loading-card"></div>
          <div class="loading-card"></div>
        </div>
      </div>

      <div v-else class="featured-grid">
        <article v-if="heroEvent" class="featured-card featured-card-large">
          <img v-if="heroEvent.image" :src="heroEvent.image" :alt="heroEvent.name" />
          <div class="image-overlay"></div>
          <div class="featured-content">
            <span class="event-pill event-pill-primary">{{ heroEvent.type }}</span>
            <h3>{{ heroEvent.name }}</h3>
            <p>{{ heroEvent.venue?.name || 'Featured venue' }} • Starting from SGD {{ heroEvent.price.toFixed(2) }}</p>
            <button class="ghost-button" type="button" @click="router.push(`/events/${heroEvent.eventId}`)">Get Tickets</button>
          </div>
        </article>

        <div class="featured-stack">
          <article v-for="event in stackedEvents" :key="event.eventId" class="featured-card featured-card-small">
            <img v-if="event.image" :src="event.image" :alt="event.name" />
            <div class="image-overlay subtle-overlay"></div>
            <div class="featured-content compact">
              <span class="event-pill">{{ event.type }}</span>
              <h3>{{ event.name }}</h3>
              <p>{{ event.venue?.name || 'Curated venue' }} • {{ formatDate(event.date) }}</p>
            </div>
            <button class="card-link" type="button" @click="router.push(`/events/${event.eventId}`)">View Event</button>
          </article>
        </div>
      </div>
    </section>

    <section class="category-section">
      <div class="category-copy">
        <h2>
          Explore by
          <span>Passion</span>
        </h2>
        <p>
          Whether it’s the roar of the crowd or the silence before the curtain rises, find your next unforgettable moment.
        </p>

        <div class="category-list">
          <button
            v-for="category in categoryCards"
            :key="category.label"
            class="category-row"
            type="button"
            @click="openType(category.query)"
          >
            <span>{{ category.label }}</span>
            <strong>→</strong>
          </button>
        </div>
      </div>

      <div class="category-gallery">
        <article
          v-for="event in galleryEvents"
          :key="event.eventId"
          class="gallery-card"
          :class="{ featured: event === galleryEvents[0] }"
        >
          <img v-if="event.image" :src="event.image" :alt="event.name" />
          <div class="image-overlay"></div>
          <div class="gallery-copy">
            <span>{{ event.type }}</span>
            <h3>{{ event.name }}</h3>
          </div>
          <button class="card-link" type="button" @click="router.push(`/events/${event.eventId}`)">Open</button>
        </article>
      </div>
    </section>
  </main>
</template>

<style scoped>
.landing-page {
  display: grid;
  gap: 4.5rem;
  width: min(100% - 3rem, 96rem);
  margin: 0 auto;
  padding: 7.5rem 0 5rem;
}

.hero-section {
  position: relative;
  overflow: hidden;
  padding: 3.5rem 0 0;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: -10rem;
  left: 50%;
  width: min(76rem, 120vw);
  height: 36rem;
  transform: translateX(-50%);
  border-radius: 999px;
  background: radial-gradient(circle at center, rgba(249, 115, 22, 0.16) 0%, rgba(249, 115, 22, 0.05) 22%, rgba(14, 14, 14, 0) 70%);
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 62rem;
  margin: 0 auto;
  display: grid;
  justify-items: center;
  text-align: center;
}

.eyebrow {
  margin-bottom: 1.5rem;
  color: var(--primary);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.hero-copy h1,
.featured-section h2,
.category-copy h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(3.6rem, 9vw, 7.2rem);
  font-weight: 900;
  line-height: 0.92;
  letter-spacing: -0.07em;
}

.hero-copy h1 span,
.category-copy h2 span {
  display: block;
  background: linear-gradient(120deg, var(--primary) 0%, #ffba20 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.search-shell {
  width: min(100%, 42rem);
  margin-top: 2.5rem;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  padding: 0.6rem;
  border-radius: 999px;
  background: rgba(32, 31, 31, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45), 0 0 80px rgba(249, 115, 22, 0.08);
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-width: 0;
  padding: 0 1.3rem;
}

.search-icon {
  color: var(--primary);
  font-size: 1.2rem;
  line-height: 1;
}

.search-input-wrap input {
  border: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.search-shell button {
  min-width: 11rem;
  border-radius: 999px;
}

.popular-row {
  display: flex;
  gap: 0.85rem;
  margin-top: 2rem;
  max-width: 100%;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  scrollbar-width: none;
}

.popular-row::-webkit-scrollbar {
  display: none;
}

.popular-chip {
  flex: 0 0 auto;
  padding: 0.8rem 1.2rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(38, 38, 38, 0.4);
  backdrop-filter: blur(12px);
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  white-space: nowrap;
}

.featured-section,
.category-section {
  display: grid;
  gap: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 1rem;
}

.section-header h2 {
  font-size: clamp(2.4rem, 4vw, 3.3rem);
}

.section-header p,
.category-copy p {
  margin: 0.5rem 0 0;
  color: var(--text-muted);
  max-width: 34rem;
}

.featured-grid {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
  gap: 1.5rem;
  min-height: 37rem;
}

.featured-stack,
.loading-stack {
  display: grid;
  gap: 1.5rem;
}

.featured-card,
.gallery-card,
.loading-card {
  position: relative;
  overflow: hidden;
  border-radius: 1.6rem;
  background: rgba(19, 19, 19, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
  min-height: 16rem;
}

.featured-card-large {
  min-height: 37rem;
}

.hero-loading {
  min-height: 37rem;
}

.featured-card img,
.gallery-card img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.45s ease;
}

.featured-card:hover img,
.gallery-card:hover img {
  transform: scale(1.04);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.86));
}

.subtle-overlay {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.78));
}

.featured-content,
.gallery-copy {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  display: grid;
  gap: 0.55rem;
  padding: 1.6rem;
}

.featured-content.compact {
  padding: 1.35rem;
}

.event-pill {
  width: fit-content;
  padding: 0.38rem 0.75rem;
  border-radius: 999px;
  background: rgba(38, 38, 38, 0.86);
  color: var(--primary);
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.event-pill-primary {
  background: rgba(249, 115, 22, 0.96);
  color: #210d02;
}

.featured-content h3,
.gallery-copy h3 {
  margin: 0;
  font-family: var(--font-display);
  line-height: 0.98;
  letter-spacing: -0.05em;
}

.featured-card-large h3 {
  font-size: clamp(2rem, 4vw, 3rem);
}

.featured-card-small h3,
.gallery-copy h3 {
  font-size: 1.6rem;
}

.featured-content p {
  margin: 0;
  color: rgba(255, 255, 255, 0.74);
}

.ghost-button {
  width: fit-content;
  padding-inline: 1.5rem;
  background: rgba(38, 38, 38, 0.46);
  border-color: rgba(255, 255, 255, 0.18);
}

.card-link {
  position: absolute;
  inset: 0;
  color: transparent;
}

.category-section {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
  gap: 2rem;
  align-items: center;
  padding: 1rem 0 0;
}

.category-copy h2 {
  font-size: clamp(2.8rem, 6vw, 4.6rem);
}

.category-list {
  display: grid;
  gap: 0.9rem;
  margin-top: 2rem;
}

.category-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.05rem 1.15rem;
  border-radius: 1.35rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(19, 19, 19, 0.52);
  text-align: left;
}

.category-row span {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 800;
}

.category-row strong {
  color: var(--primary);
  font-size: 1.15rem;
}

.category-gallery {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  grid-template-rows: repeat(2, minmax(12rem, 1fr));
  gap: 1rem;
  min-height: 30rem;
}

.gallery-card.featured {
  grid-row: 1 / span 2;
}

.gallery-copy span {
  color: var(--primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.loading-grid .loading-card {
  background: linear-gradient(90deg, rgba(32, 31, 31, 0.7), rgba(44, 44, 44, 0.9), rgba(32, 31, 31, 0.7));
}

@media (max-width: 1080px) {
  .featured-grid,
  .category-section,
  .category-gallery {
    grid-template-columns: 1fr;
  }

  .featured-card-large,
  .hero-loading {
    min-height: 28rem;
  }

  .category-gallery {
    grid-template-rows: repeat(3, minmax(15rem, 1fr));
  }

  .gallery-card.featured {
    grid-row: auto;
  }
}

@media (max-width: 720px) {
  .landing-page {
    gap: 3rem;
    width: min(100% - 1rem, 96rem);
    padding-top: 6.5rem;
  }

  .hero-section {
    padding-top: 2rem;
  }

  .search-shell {
    grid-template-columns: 1fr;
    border-radius: 1.4rem;
  }

  .search-shell button {
    width: 100%;
  }

  .section-header {
    align-items: start;
  }
}
</style>
