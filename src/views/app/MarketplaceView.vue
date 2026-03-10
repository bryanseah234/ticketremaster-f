<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { RouterLink } from 'vue-router'

interface Listing {
  listing_id: string
  event_name: string
  event_date: string
  row_number: string
  seat_number: string
  price: number
}

const auth = useAuthStore()
const isLoggedIn = computed(() => auth.isLoggedIn.value)

const loading = ref(false)
const error = ref('')
const listings = ref<Listing[]>([])
const usingFallback = ref(false)

const fallbackListings: Listing[] = [
  { listing_id: 'R-1001', event_name: 'Neon Skyline Festival', event_date: '2026-09-14T19:00:00Z', row_number: 'A', seat_number: '12', price: 180 },
  { listing_id: 'R-1002', event_name: 'Midnight Pulse', event_date: '2026-10-02T20:30:00Z', row_number: 'C', seat_number: '8', price: 120 },
  { listing_id: 'R-1003', event_name: 'Stadium Anthems World Tour', event_date: '2026-07-09T19:00:00Z', row_number: 'B', seat_number: '20', price: 220 },
]

const loadListings = async () => {
  loading.value = true
  error.value = ''
  usingFallback.value = false
  try {
    const { data } = await api.get('/marketplace/listings')
    const items = data?.data || []
    listings.value = items.length ? items.map((item: any) => ({
      listing_id: item.listing_id || item.seat_id || item.id,
      event_name: item.event?.name || item.event_name || 'Ticket Listing',
      event_date: item.event?.event_date || item.event_date || '',
      row_number: item.row_number || item.seat?.row_number || '-',
      seat_number: item.seat_number || item.seat?.seat_number || '-',
      price: Number(item.price || item.asking_price || 0),
    })) : fallbackListings
  } catch {
    listings.value = fallbackListings
    usingFallback.value = true
    error.value = 'Backend unavailable. Showing demo listings.'
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

    <section class="grid-2" style="margin-top:1rem;">
      <article class="glass" style="padding:1rem;display:grid;gap:.6rem;">
        <h2 class="section-title" style="font-size:1.2rem">Why Buy From Our Marketplace?</h2>
        <ul class="small" style="display:grid;gap:.25rem;">
          <li>Verified Sellers & Ratings</li>
          <li>100% Buyer Protection</li>
          <li>Mobile Tickets Instant Delivery</li>
          <li>Best Price Guarantee</li>
          <li>No Hidden Fees</li>
          <li>24/7 Customer Support</li>
        </ul>
      </article>
      <article class="glass" style="padding:1rem;display:grid;gap:.5rem;align-content:start;">
        <span class="badge">Buy Confidence</span>
        <h3>Every ticket is verified and protected.</h3>
        <p class="small">If your ticket is not delivered or invalid, we will make it right.</p>
      </article>
    </section>

    <article class="glass" style="padding:1rem;margin-top:1rem;display:grid;gap:.6rem;">
      <h2 class="section-title" style="font-size:1.2rem">How the Resale Marketplace Works</h2>
      <div class="grid-3">
        <div class="panel" style="padding:.75rem;">
          <p class="small">1. Browse Listings</p>
          <p>Explore verified tickets from other fans.</p>
        </div>
        <div class="panel" style="padding:.75rem;">
          <p class="small">2. Review Details</p>
          <p>Check seat, price, and event information.</p>
        </div>
        <div class="panel" style="padding:.75rem;">
          <p class="small">3. Purchase Safely</p>
          <p>Pay securely with guaranteed delivery.</p>
        </div>
      </div>
    </article>

    <section style="margin-top:1rem;">
      <h2 class="section-title">Resale Listings</h2>
      <p v-if="!isLoggedIn" class="small">Login to view exact seat, price, and seller details.</p>
      <p v-if="usingFallback" class="small">Demo listings are shown while the backend is unavailable.</p>
      <p v-if="loading" class="small">Loading listings...</p>
      <p v-if="error" class="small" style="color:#fca5a5">{{ error }}</p>
      <div class="grid-3">
        <article v-for="listing in listings" :key="listing.listing_id" class="glass" style="padding:1rem;display:grid;gap:.4rem;">
          <span class="badge">Listing {{ listing.listing_id }}</span>
          <h3>{{ listing.event_name }}</h3>
          <p class="small">{{ listing.event_date ? new Date(listing.event_date).toLocaleString() : 'Date TBA' }}</p>
          <p v-if="isLoggedIn" class="small">Row {{ listing.row_number }} · Seat {{ listing.seat_number }}</p>
          <p v-else class="small">Seat details available after login.</p>
          <p v-if="isLoggedIn" class="small">Asking price: ${{ listing.price }}</p>
          <p v-else class="small">Login to view price.</p>
          <RouterLink v-if="!isLoggedIn" to="/login"><button class="secondary">Login to view</button></RouterLink>
          <button v-else class="secondary">Review Listing</button>
        </article>
      </div>
    </section>
  </section>
</template>
