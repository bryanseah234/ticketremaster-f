<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
    if (isDemoMode() || eventId.startsWith('demo-')) {
      eventData.value = await mockServices.getEvent(eventId)
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
    const cached = localStorage.getItem(cacheKey())
    if (cached) {
      eventData.value = JSON.parse(cached)
      toast.push('Showing cached event details.', 'info', 3200)
    } else {
      try {
        eventData.value = await mockServices.getEvent(route.params.eventId as string)
        toast.push('Showing fallback event details.', 'info', 3200)
      } catch {
        if (e?.response?.status === 404) {
          notFound.value = true
        } else {
          notFound.value = true
        }
      }
    }
  } finally {
    loading.value = false
  }
}

const goToSeats = () => router.push(`/events/${route.params.eventId}/seats`)

onMounted(load)
</script>

<template>
  <section class="page event-page">
    <article v-if="notFound" class="glass fallback-card">
      <span class="badge">Unavailable</span>
      <h1 class="section-title">We couldn’t find that event.</h1>
      <p class="section-subtitle">The event may have been removed, sold out, or the link may be outdated.</p>
      <button class="secondary" @click="$router.push('/events')">Back to Events</button>
    </article>

    <template v-else-if="loading">
      <div class="hero-skeleton"></div>
      <article class="glass info-skeleton">
        <div class="line wide"></div>
        <div class="line mid"></div>
        <div class="line short"></div>
      </article>
    </template>

    <template v-else-if="eventData">
      <article class="detail-hero">
        <div class="hero-image-wrap">
          <img v-if="eventData.image" :src="eventData.image" :alt="eventData.name" class="hero-image" />
          <div v-else class="hero-image placeholder"></div>
          <div class="hero-glow"></div>
          <div class="hero-content">
            <div class="hero-tags">
              <span class="badge">Event Details</span>
              <StatusBadge :label="eventData.type" />
            </div>
            <h1 class="section-title">{{ eventData.name }}</h1>
            <p class="hero-meta">{{ formatDate(eventData.date) }}</p>
            <p v-if="eventData.venue?.name" class="hero-meta">
              {{ eventData.venue.name }}<span v-if="eventData.venue.address"> · {{ eventData.venue.address }}</span>
            </p>
          </div>
        </div>
      </article>

      <div class="detail-grid">
        <article class="glass copy-card">
          <span class="badge">About this event</span>
          <p class="body-copy">{{ eventData.description || 'Premium live experiences with verified ticketing, protected resale, and smooth entry-day flows.' }}</p>
        </article>

        <article class="glass booking-card">
          <span class="badge">Booking</span>
          <div class="metric">
            <small>Starting from</small>
            <strong>SGD {{ eventData.price.toFixed(2) }}</strong>
          </div>
          <div class="metric" v-if="eventData.seatsAvailable !== undefined">
            <small>Seats available</small>
            <strong>{{ eventData.seatsAvailable }}</strong>
          </div>
          <button @click="goToSeats">Select Seats</button>
        </article>
      </div>
    </template>
  </section>
</template>

<style scoped>
.event-page { display: grid; gap: 1.25rem; }
.detail-hero { position: relative; }
.hero-image-wrap {
  position: relative;
  min-height: 440px;
  border-radius: var(--radius-xl);
  overflow: hidden;
  background: var(--surfaceLow);
}
.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  min-height: 440px;
}
.hero-image.placeholder { background: linear-gradient(135deg, rgba(249,115,22,.12), rgba(232,167,92,.08)); }
.hero-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(25,18,16,.12) 0%, rgba(25,18,16,.86) 84%);
}
.hero-content {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1.5rem;
  display: grid;
  gap: 0.8rem;
}
.hero-tags { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.hero-meta { color: var(--textMuted); }
.detail-grid { display: grid; grid-template-columns: 1.5fr 0.9fr; gap: 1rem; }
.copy-card, .booking-card, .fallback-card, .info-skeleton {
  padding: 1.5rem;
  display: grid;
  gap: 0.9rem;
}
.body-copy { line-height: 1.8; color: var(--textMuted); }
.metric { display: grid; gap: 0.2rem; }
.metric small { color: var(--textMuted); text-transform: uppercase; letter-spacing: 0.05em; }
.metric strong { font-family: "Plus Jakarta Sans", Inter, sans-serif; font-size: 1.75rem; color: var(--primarySoft); }
.hero-skeleton {
  min-height: 440px;
  border-radius: var(--radius-xl);
  background: rgba(60,51,49,.42);
}
.line { height: 0.95rem; border-radius: 999px; background: rgba(60,51,49,.55); }
.line.wide { width: 70%; }
.line.mid { width: 48%; }
.line.short { width: 34%; }
@media (max-width: 860px) {
  .detail-grid { grid-template-columns: 1fr; }
  .hero-image-wrap, .hero-image { min-height: 360px; }
}
</style>
