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
  seller_user_id?: string
  created_at?: string
  updated_at?: string
  event_name?: string
  event_date?: string
  row_number?: string
  seat_number?: number
  image?: string
}

const auth = useAuthStore()
const isLoggedIn = computed(() => auth.isLoggedIn.value)
const toast = useToast()

const loading = ref(false)
const listings = ref<Listing[]>([])
const listSeatId = ref('')
const listPrice = ref(120)
const listLoading = ref(false)
const approveListingId = ref('')
const approveOtp = ref('')
const approveLoading = ref(false)
const buyLoadingIds = ref<Record<string, boolean>>({})

const fallbackListings: Listing[] = [
  { listing_id: 'R-1001', seat_id: 'seat-101', asking_price: 180, status: 'ACTIVE', created_at: '2026-02-10T10:25:00Z', event_name: 'Underground Rap Session', event_date: '2026-03-20T19:30:00Z', row_number: 'B', seat_number: 12, image: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?q=80&w=1400' },
  { listing_id: 'R-1002', seat_id: 'seat-204', asking_price: 120, status: 'ACTIVE', created_at: '2026-02-12T08:40:00Z', event_name: 'Midnight Pulse', event_date: '2026-05-08T20:00:00Z', row_number: 'D', seat_number: 6, image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1400' },
  { listing_id: 'R-1003', seat_id: 'seat-318', asking_price: 220, status: 'ACTIVE', created_at: '2026-02-15T15:10:00Z', event_name: 'Neon Skyline Festival', event_date: '2026-04-13T20:00:00Z', row_number: 'A', seat_number: 2, image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1400' },
]

const seatLabel = (listing: Listing) => {
  if (listing.row_number && listing.seat_number) {
    return `Row ${listing.row_number} · Seat ${listing.seat_number}`
  }
  return `Seat ${listing.seat_id}`
}

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
      seller_user_id: item.seller_user_id,
      created_at: item.created_at,
      updated_at: item.updated_at,
      event_name: item.event?.name || item.event_name,
      event_date: item.event?.event_date || item.event_date,
      row_number: item.row_number || item.seat?.row_number,
      seat_number: item.seat_number || item.seat?.seat_number,
      image: item.event?.image || item.image,
    })) : fallbackListings
  } catch {
    listings.value = fallbackListings
    toast.push('Demo listings are shown while the backend is unavailable.', 'info', 3200)
  } finally {
    loading.value = false
  }
}

const listTicket = async () => {
  if (!listSeatId.value || listPrice.value <= 0) {
    toast.push('Enter a seat ID and a valid price.', 'error', 3200)
    return
  }
  listLoading.value = true
  try {
    const { data } = await api.post('/marketplace/list', { seat_id: listSeatId.value, asking_price: listPrice.value })
    toast.push(data?.data?.message || 'Listing created.', 'success', 3200)
    listSeatId.value = ''
    listPrice.value = 120
    loadListings()
  } catch (e: any) {
    toast.push(e?.response?.data?.message || 'Unable to list ticket.', 'error', 3200)
  } finally {
    listLoading.value = false
  }
}

const buyListing = async (listingId: string) => {
  if (!listingId) return
  buyLoadingIds.value = { ...buyLoadingIds.value, [listingId]: true }
  try {
    const { data } = await api.post('/marketplace/buy', { listing_id: listingId })
    toast.push(data?.data?.message || 'Purchase initiated.', 'success', 3200)
    listings.value = listings.value.map((listing) => listing.listing_id === listingId ? { ...listing, status: data?.data?.status || 'PENDING_TRANSFER' } : listing)
  } catch (e: any) {
    toast.push(e?.response?.data?.message || 'Unable to buy listing.', 'error', 3200)
  } finally {
    buyLoadingIds.value = { ...buyLoadingIds.value, [listingId]: false }
  }
}

const approveSale = async () => {
  if (!approveListingId.value || approveOtp.value.length < 6) {
    toast.push('Enter a listing ID and 6-digit OTP.', 'error', 3200)
    return
  }
  approveLoading.value = true
  try {
    const { data } = await api.post('/marketplace/approve', { listing_id: approveListingId.value, otp_code: approveOtp.value })
    toast.push(data?.data?.message || 'Sale approved.', 'success', 3200)
    approveListingId.value = ''
    approveOtp.value = ''
    loadListings()
  } catch (e: any) {
    toast.push(e?.response?.data?.message || 'Unable to approve sale.', 'error', 3200)
  } finally {
    approveLoading.value = false
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

    <section style="margin-top:1rem;display:grid;gap:1rem;">
      <article class="glass" style="padding:1rem;display:grid;gap:.8rem;">
        <h2 class="section-title">Why Buy From Our Marketplace</h2>
        <div class="marketplace-why">
          <ul class="why-list">
            <li>Verified Sellers & Ratings</li>
            <li>100% Buyer Protection</li>
            <li>Mobile Tickets Instant Delivery</li>
            <li>Best Price Guarantee</li>
            <li>No Hidden Fees</li>
            <li>24/7 Customer Support</li>
          </ul>
          <aside class="glass side-panel">
            <h3>Buy Confidence</h3>
            <p class="small">Every resale ticket is protected with instant delivery and verified ownership checks.</p>
          </aside>
        </div>
      </article>

      <article class="glass" style="padding:1rem;">
        <h2 class="section-title">How it Works</h2>
        <div class="grid-3" style="margin-top:.7rem;">
          <div class="glass step-card">
            <h3>Browse Listings</h3>
            <p class="small">Explore verified resale listings with clear pricing and seat details.</p>
          </div>
          <div class="glass step-card">
            <h3>Review Details</h3>
            <p class="small">Compare pricing, seat location, and seller status before buying.</p>
          </div>
          <div class="glass step-card">
            <h3>Purchase Safely</h3>
            <p class="small">Confirm the transfer and receive tickets securely in your account.</p>
          </div>
        </div>
      </article>
    </section>

    <section v-if="isLoggedIn" class="marketplace-actions">
      <article class="glass action-card">
        <h3>List a Ticket</h3>
        <div class="grid-2">
          <div><label>Seat ID</label><input v-model="listSeatId" placeholder="seat-id" /></div>
          <div><label>Asking Price</label><input v-model.number="listPrice" type="number" min="1" /></div>
        </div>
        <button :disabled="listLoading" @click="listTicket">{{ listLoading ? 'Listing...' : 'Create Listing' }}</button>
      </article>
      <article class="glass action-card">
        <h3>Approve Sale</h3>
        <div class="grid-2">
          <div><label>Listing ID</label><input v-model="approveListingId" placeholder="listing-id" /></div>
          <div><label>OTP Code</label><input v-model="approveOtp" maxlength="6" placeholder="123456" /></div>
        </div>
        <button :disabled="approveLoading" @click="approveSale">{{ approveLoading ? 'Approving...' : 'Approve Sale' }}</button>
      </article>
    </section>

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
              <span class="badge">{{ seatLabel(listing) }}</span>
              <span class="badge">${{ listing.asking_price }}</span>
              <span class="badge">{{ listing.status }}</span>
            </div>
            <div class="row" style="gap:.5rem;">
              <RouterLink v-if="!isLoggedIn" to="/login"><button class="secondary">Login to buy</button></RouterLink>
              <button v-else :disabled="listing.status !== 'ACTIVE' || buyLoadingIds[listing.listing_id]" @click="buyListing(listing.listing_id)">
                {{ buyLoadingIds[listing.listing_id] ? 'Buying...' : 'Buy' }}
              </button>
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
.step-card{padding:.9rem;display:grid;gap:.35rem;min-height:120px}
.marketplace-why{display:grid;grid-template-columns:2fr 1fr;gap:1rem}
.why-list{list-style:none;margin:0;padding:0;display:grid;gap:.45rem}
.why-list li{padding:.4rem .6rem;border-radius:.6rem;background:rgba(255,255,255,.06);border:1px solid var(--border);font-weight:600}
.side-panel{padding:1rem;background:rgba(249,115,22,.12);border:1px solid rgba(249,115,22,.35)}
.marketplace-actions{margin-top:1rem;display:grid;gap:1rem}
.action-card{padding:1rem;display:grid;gap:.7rem}
@media (max-width:860px){
  .marketplace-why{grid-template-columns:1fr}
}
</style>
