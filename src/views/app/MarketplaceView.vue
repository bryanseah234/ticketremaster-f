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
const isLoggedIn = computed(() => auth.isLoggedIn)
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
  { listing_id: 'R-1004', seat_id: 'seat-401', asking_price: 95, status: 'ACTIVE', created_at: '2026-02-16T09:00:00Z', event_name: 'Acoustic Evenings', event_date: '2026-03-25T18:00:00Z', row_number: 'E', seat_number: 14, image: 'https://images.unsplash.com/photo-1514525253361-bee8d48800d5?q=80&w=1400' },
  { listing_id: 'R-1005', seat_id: 'seat-522', asking_price: 310, status: 'ACTIVE', created_at: '2026-02-18T11:20:00Z', event_name: 'Global Bass Arena', event_date: '2026-06-01T19:00:00Z', row_number: 'A', seat_number: 1, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1400' },
  { listing_id: 'R-1006', seat_id: 'seat-608', asking_price: 145, status: 'ACTIVE', created_at: '2026-02-19T14:45:00Z', event_name: 'Jazz in the Park', event_date: '2026-05-15T17:30:00Z', row_number: 'C', seat_number: 8, image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1400' },
  { listing_id: 'R-1007', seat_id: 'seat-711', asking_price: 260, status: 'ACTIVE', created_at: '2026-02-20T16:30:00Z', event_name: 'Indie Rock Shadows', event_date: '2026-04-30T20:30:00Z', row_number: 'B', seat_number: 22, image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1400' },
  { listing_id: 'R-1008', seat_id: 'seat-805', asking_price: 80, status: 'ACTIVE', created_at: '2026-02-21T10:15:00Z', event_name: 'City Lights Piano', event_date: '2026-03-15T19:00:00Z', row_number: 'F', seat_number: 3, image: 'https://images.unsplash.com/photo-1520527057852-44c0e5c43dc4?q=80&w=1400' },
  { listing_id: 'R-1009', seat_id: 'seat-920', asking_price: 450, status: 'ACTIVE', created_at: '2026-02-22T12:00:00Z', event_name: 'Platinum Night Out', event_date: '2026-07-20T21:00:00Z', row_number: 'A', seat_number: 10, image: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?q=80&w=1400' },
  { listing_id: 'R-1010', seat_id: 'seat-104', asking_price: 130, status: 'ACTIVE', created_at: '2026-02-23T08:50:00Z', event_name: 'Reggae Roots', event_date: '2026-04-05T16:00:00Z', row_number: 'C', seat_number: 4, image: 'https://images.unsplash.com/photo-1514525253361-bee8d48800d5?q=80&w=1400' },
  { listing_id: 'R-1011', seat_id: 'seat-215', asking_price: 210, status: 'ACTIVE', created_at: '2026-02-24T14:20:00Z', event_name: 'Drum & Bass Night', event_date: '2026-05-20T22:00:00Z', row_number: 'D', seat_number: 15, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1400' },
  { listing_id: 'R-1012', seat_id: 'seat-302', asking_price: 175, status: 'ACTIVE', created_at: '2026-02-25T11:40:00Z', event_name: 'Synthwave Sunset', event_date: '2026-04-10T18:30:00Z', row_number: 'B', seat_number: 5, image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=1400' },
  { listing_id: 'R-1013', seat_id: 'seat-440', asking_price: 110, status: 'ACTIVE', created_at: '2026-02-26T17:10:00Z', event_name: 'Folk & Harmony', event_date: '2026-03-29T19:00:00Z', row_number: 'G', seat_number: 1, image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=1400' },
  { listing_id: 'R-1014', seat_id: 'seat-511', asking_price: 280, status: 'ACTIVE', created_at: '2026-02-27T09:30:00Z', event_name: 'Electric Vibes', event_date: '2026-06-15T20:00:00Z', row_number: 'A', seat_number: 3, image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1400' },
  { listing_id: 'R-1015', seat_id: 'seat-618', asking_price: 90, status: 'ACTIVE', created_at: '2026-02-28T13:50:00Z', event_name: 'Underground Rap Session', event_date: '2026-03-20T19:30:00Z', row_number: 'H', seat_number: 18, image: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?q=80&w=1400' },
  { listing_id: 'R-1016', seat_id: 'seat-725', asking_price: 155, status: 'ACTIVE', created_at: '2026-03-01T15:20:00Z', event_name: 'Summer Melodies', event_date: '2026-07-05T17:00:00Z', row_number: 'C', seat_number: 25, image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1400' },
  { listing_id: 'R-1017', seat_id: 'seat-830', asking_price: 350, status: 'ACTIVE', created_at: '2026-03-02T10:00:00Z', event_name: 'VIP Opera Night', event_date: '2026-05-25T19:30:00Z', row_number: 'A', seat_number: 8, image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=1400' },
  { listing_id: 'R-1018', seat_id: 'seat-912', asking_price: 125, status: 'ACTIVE', created_at: '2026-03-03T11:15:00Z', event_name: 'Indie Rock Shadows', event_date: '2026-04-30T20:30:00Z', row_number: 'D', seat_number: 12, image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1400' },
]

const seatLabel = (listing: Listing) => {
  if (listing.row_number && listing.seat_number) {
    return `Row ${listing.row_number} · Seat ${listing.seat_number}`
  }
  return `Seat ${listing.seat_id}`
}

const search = ref('')
const dateFilter = ref('')

const filteredListings = computed(() => {
  const needle = search.value.trim().toLowerCase()
  return listings.value.filter((l) => {
    const text = `${l.event_name} ${l.listing_id} ${l.seat_id}`.toLowerCase()
    const matched = !needle || text.includes(needle)
    const dateMatched = !dateFilter.value || (l.event_date && l.event_date.slice(0, 10) === dateFilter.value)
    return matched && dateMatched
  })
})

const loadListings = async () => {
  loading.value = true
  // ... existing toast push ...
  toast.push('Loading listings...', 'info', 1600)
  try {
    const res = await api.get('/marketplace/listings', { params: { status: 'ACTIVE' } })
    const items = res.data?.data || (Array.isArray(res.data) ? res.data : [])
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
    toast.push('Backend unavailable. Showing limited demo data. Actions are limited.', 'info', 3200)
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
    <header class="marketplace-hero">
      <h1 class="section-title">Discover Listings</h1>
      <p class="section-subtitle">A trusted resale marketplace for verified tickets.</p>
    </header>

    <article class="glass filter-bar" style="margin-top:1.5rem;">
      <input v-model="search" placeholder="Search by event name or listing ID" class="search-col" />
      <input v-model="dateFilter" type="date" class="date-col" />
      <button @click="loadListings()">Refresh</button>
      <button class="secondary" @click="search=''; dateFilter=''">Reset</button>
    </article>

    <section v-if="isLoggedIn" class="marketplace-actions" style="margin-top:1.5rem;">
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
      <div class="listings-grid">
        <article v-for="(listing, i) in filteredListings" :key="listing.listing_id" class="glass listing-card">
          <img class="listing-img" :src="listing.image || fallbackListings[i % fallbackListings.length].image" :alt="listing.event_name || 'Resale listing'" />
          <div class="listing-cover"></div>
          <div class="listing-content">
            <p class="small">{{ listing.event_date ? new Date(listing.event_date).toLocaleDateString() : 'Date TBA' }}</p>
            <h3>{{ listing.event_name || 'Event name unavailable' }}</h3>
            <div class="row" style="gap:.4rem;flex-wrap:wrap;">
              <span class="badge">{{ seatLabel(listing) }}</span>
              <span class="badge">${{ listing.asking_price }}</span>
              <span class="badge" :class="listing.status">{{ listing.status }}</span>
            </div>
            <div class="row actions-row">
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
.marketplace-hero { padding-bottom: 0.5rem; }
.filter-bar { padding: .8rem; display: grid; grid-template-columns: 2fr 1fr auto auto auto; gap: .55rem; align-items: center; }
.search-col { min-width: 0; }
.date-col { min-width: 0; color-scheme: dark; }

.login-prompt { margin-bottom: 1.2rem; display: flex; align-items: center; gap: .6rem; color: var(--muted); font-size: 0.9rem; }

.listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
.listing-card { position: relative; overflow: hidden; min-height: 300px; padding: 0; border-radius: 1.2rem; transition: transform 0.2s ease; }
.listing-card:hover { transform: translateY(-4px); }
.listing-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.listing-cover { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(9,9,11,0.1) 0%, rgba(9,9,11,0.95) 90%); }
.listing-content { position: relative; padding: 1.25rem; display: grid; gap: .6rem; align-content: end; height: 100%; }
.listing-content h3 { color: #fff; font-size: 1.25rem; margin: 0; }
.listing-content .small { color: rgba(255,255,255,0.8); }

.badge.ACTIVE { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }

.actions-row { margin-top: .4rem; }
.marketplace-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1.2rem; }
.action-card { padding: 1.2rem; display: grid; gap: .8rem; }

@media (max-width: 860px) {
  .marketplace-actions { grid-template-columns: 1fr; }
  .filter-bar { grid-template-columns: 1fr; }
}
</style>
