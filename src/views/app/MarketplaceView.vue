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
}

const auth = useAuthStore()
const isLoggedIn = computed(() => auth.isLoggedIn.value)
const toast = useToast()

const loading = ref(false)
const listings = ref<Listing[]>([])

const fallbackListings: Listing[] = [
  { listing_id: 'R-1001', seat_id: 'seat-101', asking_price: 180, status: 'ACTIVE', created_at: '2026-02-10T10:25:00Z' },
  { listing_id: 'R-1002', seat_id: 'seat-204', asking_price: 120, status: 'ACTIVE', created_at: '2026-02-12T08:40:00Z' },
  { listing_id: 'R-1003', seat_id: 'seat-318', asking_price: 220, status: 'ACTIVE', created_at: '2026-02-15T15:10:00Z' },
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
      <p v-if="!isLoggedIn" class="small">Login to view seller details and purchase options.</p>
      <div class="grid-3">
        <article v-for="listing in listings" :key="listing.listing_id" class="glass" style="padding:1rem;display:grid;gap:.4rem;">
          <span class="badge">Listing {{ listing.listing_id }} · {{ listing.status }}</span>
          <h3>Seat {{ listing.seat_id }}</h3>
          <p class="small">Asking price: ${{ listing.asking_price }}</p>
          <p v-if="listing.created_at" class="small">Listed {{ new Date(listing.created_at).toLocaleString() }}</p>
          <p v-else class="small">Listing time unavailable.</p>
          <p v-if="!isLoggedIn" class="small">Login to view seller details and purchase options.</p>
          <RouterLink v-if="!isLoggedIn" to="/login"><button class="secondary">Login to view</button></RouterLink>
          <button v-else class="secondary">Review Listing</button>
        </article>
      </div>
    </section>
  </section>
</template>
