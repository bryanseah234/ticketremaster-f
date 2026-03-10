<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { RouterLink } from 'vue-router'
import { useToast } from '@/composables/useToast'

interface Listing {
  listing_id: string
  seat_id: string
  asking_price: number
  status: string
  created_at?: string
  updated_at?: string
  event_name?: string
  event_date?: string
  image?: string
}

const auth = useAuthStore()
const isLoggedIn = computed(() => auth.isLoggedIn.value)
const toast = useToast()

const loading = ref(false)
const listings = ref<Listing[]>([])

const fallbackListings: Listing[] = [
  { listing_id: 'R-1001', seat_id: 'seat-101', asking_price: 180, status: 'ACTIVE', created_at: '2026-02-10T10:25:00Z', event_name: 'Underground Rap Session', event_date: '2026-03-20T19:30:00Z', image: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?q=80&w=1400' },
  { listing_id: 'R-1002', seat_id: 'seat-204', asking_price: 120, status: 'ACTIVE', created_at: '2026-02-12T08:40:00Z', event_name: 'Midnight Pulse', event_date: '2026-05-08T20:00:00Z', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1400' },
  { listing_id: 'R-1003', seat_id: 'seat-318', asking_price: 220, status: 'ACTIVE', created_at: '2026-02-15T15:10:00Z', event_name: 'Neon Skyline Festival', event_date: '2026-04-13T20:00:00Z', image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1400' },
]

const loadListings = async () => {
  loading.value = true
  toast.push('Loading listings...', 'info', 1600)
  try {
    const { data } = await api.get('/marketplace/listings', { params: { status: 'ACTIVE' } })
    const items = data?.data || []
    listings.value = items.length ? items.map((item: any) => ({
      listing_id: item.listing_id || item.seat_id || item.id,
      seat_id: item.seat_id || item.seat?.seat_id || '-',
      asking_price: Number(item.asking_price || item.price || 0),
      status: item.status || 'ACTIVE',
      created_at: item.created_at,
      updated_at: item.updated_at,
      event_name: item.event?.name || item.event_name,
      event_date: item.event?.event_date || item.event_date,
      image: item.event?.image || item.image,
    })) : fallbackListings
  } catch {
    listings.value = fallbackListings
    toast.push('Demo listings are shown while the backend is unavailable.', 'info', 3200)
  } finally {
    loading.value = false
  }
}

onMounted(loadListings)
</script>

<template>
  <section class="page">
    <article class="glass" style="padding:1.2rem;display:grid;gap:.6rem;">
      <h1 class="section-title">Marketplace</h1>
      <p class="section-subtitle">A trusted resale marketplace for verified tickets.</p>
    </article>

    <section style="margin-top:1rem;">
      <h2 class="section-title">Resale Listings</h2>
      <p v-if="!isLoggedIn" class="small">Login to view seller details and purchase options.</p>
      <div class="grid-3">
        <article v-for="(listing, i) in listings" :key="listing.listing_id" class="glass listing-card">
          <img class="listing-img" :src="listing.image || fallbackListings[i % fallbackListings.length].image" :alt="listing.event_name || 'Resale listing'" />
          <div class="listing-cover"></div>
          <div class="listing-content">
            <p class="small">{{ listing.event_date ? new Date(listing.event_date).toLocaleDateString() : 'Date TBA' }}</p>
            <h3>{{ listing.event_name || 'Event name unavailable' }}</h3>
            <div class="row" style="gap:.4rem;flex-wrap:wrap;">
              <span class="badge">Seat {{ listing.seat_id }}</span>
              <span class="badge">From ${{ listing.asking_price }}</span>
            </div>
            <div class="row" style="gap:.5rem;">
              <RouterLink v-if="!isLoggedIn" to="/login"><button class="secondary">Login to view</button></RouterLink>
              <button v-else>View</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<style scoped>
.listing-card{position:relative;overflow:hidden;min-height:280px;padding:0}
.listing-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.listing-cover{position:absolute;inset:0;background:linear-gradient(180deg,rgba(9,9,11,.12),rgba(9,9,11,.9))}
.listing-content{position:relative;padding:1rem;display:grid;gap:.55rem;align-content:end;height:100%}
.listing-content h3{color:#fff}
.listing-content .small{color:#e4e4e7}
</style>
