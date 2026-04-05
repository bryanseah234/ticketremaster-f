<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CalendarDaysIcon, MapPinIcon, TicketIcon } from '@heroicons/vue/24/outline'
import api from '@/api/client'
import { isDemoMode, mockServices } from '@/services/mockData'
import { useToast } from '@/composables/useToast'
import type { Event } from '@/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loading = ref(false)
const notFound = ref(false)
const eventData = ref<Event | null>(null)

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
        if (e?.response?.status === 404) notFound.value = true
        else notFound.value = true
      }
    }
  } finally {
    loading.value = false
  }
}

const formattedDate = computed(() => {
  if (!eventData.value?.date) return 'Date TBA'
  return new Date(eventData.value.date).toLocaleDateString('en-SG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const venueLine = computed(() => {
  if (!eventData.value?.venue?.name) return 'Venue to be announced'
  if (eventData.value.venue.address) return `${eventData.value.venue.name}, ${eventData.value.venue.address}`
  return eventData.value.venue.name
})

const goToSeats = () => router.push(`/events/${route.params.eventId}/seats`)

onMounted(load)
</script>

<template>
  <section class="event-page">
    <article v-if="notFound" class="state-card">
      <span class="detail-pill">Unavailable</span>
      <h1>We couldn’t find that event.</h1>
      <p>The event may have been removed, sold out, or the link may be outdated.</p>
      <button class="secondary" type="button" @click="router.push('/events')">Back to Events</button>
    </article>

    <template v-else-if="loading">
      <section class="hero-shell loading-shell">
        <div class="hero-background"></div>
      </section>
    </template>

    <template v-else-if="eventData">
      <section class="hero-shell">
        <div class="hero-background" :style="eventData.image ? { backgroundImage: `url(${eventData.image})` } : undefined"></div>
        <div class="hero-glow"></div>

        <div class="hero-copy">
          <span class="detail-pill">Exclusive Event</span>
          <h1>{{ eventData.name }}</h1>

          <div class="hero-meta">
            <span class="hero-meta-item">
              <MapPinIcon class="hero-meta-icon" />
              <span>{{ venueLine }}</span>
            </span>
            <span class="meta-separator"></span>
            <span class="hero-meta-item">
              <CalendarDaysIcon class="hero-meta-icon" />
              <span>{{ formattedDate }}</span>
            </span>
          </div>

          <button class="hero-cta" type="button" @click="goToSeats">
            <span>Select Seats</span>
            <TicketIcon class="hero-cta-icon" />
          </button>
        </div>
      </section>

      <section class="detail-panels">
        <article class="detail-card">
          <span class="panel-label">About</span>
          <p>
            {{
              eventData.description ||
              'Premium live experiences with verified ticketing, protected resale, and smooth entry-day flows.'
            }}
          </p>
        </article>

        <article class="detail-card detail-card-compact">
          <span class="panel-label">Booking</span>
          <div class="metric">
            <small>Starting from</small>
            <strong>SGD {{ eventData.price.toFixed(2) }}</strong>
          </div>
          <div class="metric" v-if="eventData.seatsAvailable !== undefined">
            <small>Seats available</small>
            <strong>{{ eventData.seatsAvailable }}</strong>
          </div>
        </article>
      </section>
    </template>
  </section>
</template>

<style scoped>
.event-page {
  display: grid;
  gap: 2rem;
  width: min(100% - 3rem, 84rem);
  margin: 0 auto;
  padding: 7.5rem 0 4.5rem;
}

.hero-shell,
.state-card {
  position: relative;
  overflow: hidden;
  border-radius: 2rem;
  background: rgba(14, 14, 14, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.hero-shell {
  min-height: 34rem;
}

.hero-background {
  position: absolute;
  inset: 0;
  background-position: center;
  background-size: cover;
  opacity: 0.22;
}

.hero-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at center, rgba(255, 145, 83, 0.16) 0%, transparent 56%),
    linear-gradient(180deg, rgba(14, 14, 14, 0.1), rgba(14, 14, 14, 0.94));
}

.hero-copy {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  align-content: center;
  min-height: 34rem;
  padding: 3rem 1.5rem;
  text-align: center;
}

.detail-pill {
  width: fit-content;
  padding: 0.5rem 0.95rem;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.12);
  border: 1px solid rgba(249, 115, 22, 0.18);
  color: var(--primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.panel-label {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0.38rem 0.8rem;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.14);
  color: var(--primary);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero-copy h1,
.state-card h1 {
  margin: 1.25rem 0 0;
  max-width: 58rem;
  font-family: var(--font-display);
  font-size: clamp(3.4rem, 9vw, 6.8rem);
  font-weight: 900;
  line-height: 0.92;
  letter-spacing: -0.07em;
}

.hero-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: clamp(1rem, 2.6vw, 1.2rem);
  font-weight: 500;
}

.hero-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
}

.hero-meta-icon {
  width: 1.1rem;
  height: 1.1rem;
  color: var(--primary);
  flex-shrink: 0;
}

.meta-separator {
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.2);
}

.hero-cta {
  margin-top: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-width: 14rem;
  padding-inline: 2rem;
  border-radius: 999px;
  box-shadow: 0 20px 50px rgba(255, 145, 83, 0.24);
}

.hero-cta-icon {
  width: 1.15rem;
  height: 1.15rem;
}

.detail-panels {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 0.8fr);
  gap: 1.25rem;
}

.detail-card,
.state-card {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
}

.detail-card {
  border-radius: 1.6rem;
  background: rgba(19, 19, 19, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-card p,
.state-card p {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.8;
}

.detail-card-compact {
  align-content: start;
}

.metric {
  display: grid;
  gap: 0.25rem;
}

.metric small {
  color: rgba(255, 255, 255, 0.56);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.metric strong {
  font-family: var(--font-display);
  font-size: 2.1rem;
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.04em;
}

.loading-shell .hero-background {
  opacity: 1;
  background: linear-gradient(90deg, rgba(32, 31, 31, 0.7), rgba(44, 44, 44, 0.9), rgba(32, 31, 31, 0.7));
}

@media (max-width: 860px) {
  .event-page {
    width: min(100% - 1rem, 84rem);
    padding-top: 6.5rem;
  }

  .hero-shell,
  .hero-copy {
    min-height: 28rem;
  }

  .detail-panels {
    grid-template-columns: 1fr;
  }

  .hero-meta {
    gap: 0.6rem;
    font-size: 0.98rem;
  }

  .meta-separator {
    display: none;
  }
}
</style>
