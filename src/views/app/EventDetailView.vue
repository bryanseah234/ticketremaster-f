<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CalendarDays, MapPin, Tag, Users, ArrowRight } from 'lucide-vue-next'
import api from '@/api/client'
import { isDemoMode, mockServices } from '@/services/mockData'
import { useToast } from '@/composables/useToast'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import type { Event } from '@/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const notFound = ref(false)
const eventData = ref<Event | null>(null)

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-SG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const cacheKey = () => `event_detail:${route.params.eventId}`

const mapEvent = (raw: any): Event => ({
  eventId: raw.eventId,
  venueId: raw.venueId || raw.venue?.venueId || '',
  name: raw.name,
  date: raw.date || raw.eventDate || '',
  description: raw.description,
  type: raw.type,
  image: raw.image,
  price: raw.price ?? 0,
  createdAt: raw.createdAt || '',
  updatedAt: raw.updatedAt,
  cancelledAt: raw.cancelledAt,
  seatsAvailable: raw.seatsAvailable,
  venue: raw.venue
    ? {
        venueId: raw.venue.venueId || '',
        name: raw.venue.name || '',
        address: raw.venue.address,
        createdAt: raw.venue.createdAt || '',
      }
    : undefined,
})

const load = async () => {
  loading.value = true
  notFound.value = false
  try {
    const eventId = route.params.eventId as string

    if (isDemoMode()) {
      const raw = await mockServices.getEvent(eventId)
      eventData.value = raw
    } else {
      const { data } = await api.get(`/events/${eventId}`)
      const raw = data?.data
      if (!raw) {
        notFound.value = true
        return
      }
      eventData.value = mapEvent(raw)
      localStorage.setItem(cacheKey(), JSON.stringify(eventData.value))
    }
  } catch (e: any) {
    if (e?.response?.status === 404) {
      notFound.value = true
    } else {
      const cached = localStorage.getItem(cacheKey())
      if (cached) {
        eventData.value = JSON.parse(cached)
        toast.push('Offline mode: showing cached event details.', 'info', 3200)
      } else {
        try {
          const eventId = route.params.eventId as string
          const raw = await mockServices.getEvent(eventId)
          eventData.value = raw
          toast.push('Backend unavailable. Showing demo event.', 'info', 3200)
        } catch {
          toast.push('Could not load event details.', 'error', 3200)
        }
      }
    }
  } finally {
    loading.value = false
  }
}

const goToSeats = () => {
  router.push(`/events/${route.params.eventId}/seats`)
}

onMounted(load)
</script>

<template>
  <section class="page event-detail-page">

    <!-- Not found -->
    <article v-if="notFound" class="glass not-found">
      <Tag :size="40" class="not-found-icon" />
      <h2>Event not found</h2>
      <p class="small">This event may have been removed or the link is incorrect.</p>
      <button class="secondary" @click="$router.push('/events')">Browse Events</button>
    </article>

    <!-- Loading skeleton -->
    <template v-else-if="loading">
      <div class="hero-skeleton" />
      <div class="detail-body">
        <div class="skeleton-line wide" />
        <div class="skeleton-line medium" />
        <div class="skeleton-line narrow" />
      </div>
    </template>

    <!-- Event detail -->
    <template v-else-if="eventData">
      <!-- Hero image -->
      <div class="hero-wrap">
        <img
          v-if="eventData.image"
          :src="eventData.image"
          :alt="eventData.name"
          class="hero-img"
        />
        <div v-else class="hero-placeholder">
          <Tag :size="48" />
        </div>
        <div class="hero-overlay" />
        <div class="hero-badge">
          <StatusBadge :label="eventData.type" />
        </div>
      </div>

      <!-- Detail body -->
      <div class="detail-body glass">
        <h1 class="event-name">{{ eventData.name }}</h1>

        <div class="meta-row">
          <span class="meta-item">
            <CalendarDays :size="15" />
            {{ formatDate(eventData.date) }}
          </span>
          <span v-if="eventData.venue?.name" class="meta-item">
            <MapPin :size="15" />
            {{ eventData.venue.name }}
            <span v-if="eventData.venue.address" class="meta-address">· {{ eventData.venue.address }}</span>
          </span>
          <span v-if="eventData.seatsAvailable !== undefined" class="meta-item">
            <Users :size="15" />
            {{ eventData.seatsAvailable }} seats available
          </span>
        </div>

        <p v-if="eventData.description" class="description">{{ eventData.description }}</p>

        <div class="price-row">
          <span class="price-label">From</span>
          <span class="price-value">SGD {{ eventData.price.toFixed(2) }}</span>
        </div>

        <button class="select-seats-btn" @click="goToSeats">
          Select Seats
          <ArrowRight :size="16" />
        </button>
      </div>
    </template>

  </section>
</template>

<style scoped>
.event-detail-page {
  max-width: 860px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Not found */
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 2rem;
  text-align: center;
}
.not-found-icon { color: var(--muted); }
.not-found h2 { font-size: 1.4rem; }
.not-found p { color: var(--muted); }

/* Hero */
.hero-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 21 / 9;
  overflow: hidden;
  border-radius: 1rem 1rem 0 0;
  background: var(--surface-2);
}

.hero-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  background: var(--surface-2);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%);
  pointer-events: none;
}

.hero-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

/* Skeleton */
.hero-skeleton {
  width: 100%;
  aspect-ratio: 21 / 9;
  border-radius: 1rem 1rem 0 0;
  background: var(--surface-2);
  animation: shimmer 1.4s infinite;
}

.skeleton-line {
  height: 1rem;
  border-radius: .4rem;
  background: var(--surface-2);
  animation: shimmer 1.4s infinite;
  margin-bottom: .75rem;
}
.skeleton-line.wide { width: 70%; }
.skeleton-line.medium { width: 45%; }
.skeleton-line.narrow { width: 25%; }

@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* Detail body */
.detail-body {
  border-radius: 0 0 1rem 1rem;
  padding: 1.75rem 2rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-name {
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -.02em;
}

.meta-row {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: .4rem;
  font-size: .88rem;
  color: var(--muted);
}

.meta-address {
  color: var(--muted);
  opacity: .75;
}

.description {
  font-size: .95rem;
  color: var(--muted);
  line-height: 1.65;
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: .5rem;
}

.price-label {
  font-size: .82rem;
  color: var(--muted);
}

.price-value {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--accent);
}

.select-seats-btn {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  align-self: flex-start;
  padding: .75rem 1.5rem;
  font-size: 1rem;
  font-weight: 700;
  border-radius: .75rem;
}

@media (max-width: 600px) {
  .detail-body { padding: 1.25rem 1rem 1.5rem; }
  .hero-wrap { aspect-ratio: 16 / 9; }
}
</style>
