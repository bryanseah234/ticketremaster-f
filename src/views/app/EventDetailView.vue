<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/client'
import { mockEvents } from '@/data/mockEvents'
import { useToast } from '@/composables/useToast'
import EventDatePicker from '@/components/EventDatePicker/EventDatePicker.vue'


const route = useRoute()
const loading = ref(false)
const notFound = ref(false)
const eventData = ref<any>(null)
const toast = useToast()

const pickerEvent = computed(() => {
  if (!eventData.value) return null
  const firstPrice = Object.values(eventData.value.pricingTiers || {})[0] as number || 0
  // Build available dates: use event date if present, otherwise generate next 10 days as demo
  const eventDateStr = eventData.value.eventDate?.slice(0, 10)
  const isFuture = eventDateStr && eventDateStr > new Date().toISOString().slice(0, 10)
  const availableDates = isFuture
    ? [eventDateStr]
    : Array.from({ length: 10 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i + 1)
        return d.toISOString().slice(0, 10)
      })
  return {
    eventId: eventData.value.eventId || String(route.params.eventId),
    name: eventData.value.name,
    venue: eventData.value.venue?.name || 'Venue TBA',
    venueAddress: eventData.value.venue?.address || '',
    type: eventData.value.type || 'Event',
    price: firstPrice,
    image: eventData.value.image || null,
    availableDates,
  }
})


const cacheKey = () => `event_detail:${route.params.eventId}`

const load = async () => {
  loading.value = true
  notFound.value = false
  toast.push('Loading event details...', 'info', 1600)
  try {
    const { data } = await api.get(`/events/${route.params.eventId}`)
    eventData.value = data?.data
    if (eventData.value) {
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
        const fallback = mockEvents.find((event) => event.eventId === route.params.eventId) || mockEvents[0]
        const seats = Array.from({ length: 80 }).map((_, index) => ({
          seatId: `demo-${index + 1}`,
          rowNumber: String.fromCharCode(65 + Math.floor(index / 10)),
          seatNumber: (index % 10) + 1,
          status: index % 9 === 0 ? 'HELD' : index % 7 === 0 ? 'SOLD' : 'AVAILABLE',
          category: fallback.pricingTiers[0]?.category || 'GA',
          price: fallback.pricingTiers[0]?.price || 59,
        }))
        eventData.value = { ...fallback, seats }
        toast.push('Backend unavailable. Showing limited demo data. Actions are limited.', 'info', 3200)
      }
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="page">
    <article v-if="notFound" class="glass" style="padding:1rem;">Event not found.</article>

    <template v-else-if="eventData">
      <div class="content-col">
        <article class="glass" style="padding:1rem;display:grid;gap:.5rem;">
          <h1>{{ eventData.name }}</h1>
          <p class="small">{{ eventData.eventDate }} · {{ eventData.venue?.name }}</p>
          <div class="row">
            <span v-for="[cat, price] in Object.entries(eventData.pricingTiers || {})" :key="cat" class="badge">{{ cat }} · ${{ price }}</span>
          </div>
        </article>

        <EventDatePicker
          v-if="pickerEvent"
          :event="pickerEvent"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
.content-col {
  display: grid;
  gap: 1rem;
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
}
</style>
