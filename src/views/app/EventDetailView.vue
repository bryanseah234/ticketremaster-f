<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/api/client'
import { mockEvents } from '@/data/mockEvents'
import { useToast } from '@/composables/useToast'

interface Seat {
  seat_id: string
  row_number: string
  seat_number: string
  status: 'AVAILABLE' | 'HELD' | 'SOLD' | 'CHECKED_IN'
  category: string
  price: number
}

const route = useRoute()
const loading = ref(false)
const notFound = ref(false)
const eventData = ref<any>(null)
const toast = useToast()

const visibleSeats = computed(() => (eventData.value?.seats || []).slice(0, 80) as Seat[])
const color = (status: Seat['status']) => {
  if (status === 'AVAILABLE') return 'var(--success)'
  if (status === 'HELD') return 'var(--warning)'
  return 'var(--disabled)'
}

const load = async () => {
  loading.value = true
  notFound.value = false
  toast.push('Loading event details...', 'info', 1600)
  try {
    const { data } = await api.get(`/events/${route.params.eventId}`)
    eventData.value = data?.data
  } catch (e: any) {
    if (e?.response?.status === 404) {
      notFound.value = true
    } else {
      const fallback = mockEvents.find((event) => event.event_id === route.params.eventId) || mockEvents[0]
      const seats = Array.from({ length: 80 }).map((_, index) => ({
        seat_id: `demo-${index + 1}`,
        row_number: String.fromCharCode(65 + Math.floor(index / 10)),
        seat_number: (index % 10) + 1,
        status: index % 9 === 0 ? 'HELD' : index % 7 === 0 ? 'SOLD' : 'AVAILABLE',
        category: fallback.pricing_tiers[0]?.category || 'GA',
        price: fallback.pricing_tiers[0]?.price || 59,
      }))
      eventData.value = { ...fallback, seats }
      toast.push('Demo data active for this event.', 'info', 3200)
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
      <article class="glass" style="padding:1rem;margin-bottom:1rem;display:grid;gap:.5rem;">
        <h1>{{ eventData.name }}</h1>
        <p class="small">{{ eventData.event_date }} · {{ eventData.venue?.name }} · {{ eventData.venue?.hall_name }}</p>
        <div class="row">
          <span v-for="tier in eventData.pricing_tiers || []" :key="tier.category" class="badge">{{ tier.category }} · ${{ tier.price }}</span>
        </div>
      </article>

      <article class="glass" style="padding:1rem;">
        <h2 class="section-title" style="font-size:1.2rem">Seat Availability Preview</h2>
        <p class="section-subtitle">Green = available · Yellow = held · Grey = sold/checked-in</p>
        <div class="grid-4">
          <div v-for="seat in visibleSeats" :key="seat.seat_id" class="glass" :style="{ padding:'.55rem', borderColor: color(seat.status) }">
            <strong>{{ seat.row_number }}-{{ seat.seat_number }}</strong>
            <p class="small">{{ seat.status }} · {{ seat.category }}</p>
          </div>
        </div>
        <RouterLink :to="`/events/${route.params.eventId}/seats`"><button style="margin-top:1rem;">Select Seats</button></RouterLink>
      </article>
    </template>
  </section>
</template>
