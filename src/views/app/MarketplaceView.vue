<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

interface Listing {
  listing_id: string
  seat_id: string
  asking_price: number
  status: string
  seller_user_id?: string
  created_at?: string
  event_name?: string
  event_date?: string
  row_number?: string
  seat_number?: number
  image?: string
}

const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

const loading = ref(false)
const listings = ref<Listing[]>([])
const listTicketId = ref('')
const listPrice = ref(120)
const listLoading = ref(false)
const showListForm = ref(false)
const myTickets = ref<{ ticketId: string; label: string }[]>([])
const buyLoadingIds = ref<Record<string, boolean>>({})
const search = ref('')
const dateFilter = ref('')
const priceSort = ref<'asc' | 'desc' | null>(null)

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

const filteredListings = computed(() => {
  const needle = search.value.trim().toLowerCase()
  let result = listings.value.filter((l) => {
    const text = `${l.event_name} ${l.listing_id} ${l.seat_id}`.toLowerCase()
    const matched = !needle || text.includes(needle)
    const dateMatched = !dateFilter.value || (l.event_date && l.event_date.slice(0, 10) === dateFilter.value)
    return matched && dateMatched
  })
  if (priceSort.value === 'asc') result = [...result].sort((a, b) => a.asking_price - b.asking_price)
  if (priceSort.value === 'desc') result = [...result].sort((a, b) => b.asking_price - a.asking_price)
  return result
})

const togglePriceSort = () => {
  if (!priceSort.value) priceSort.value = 'asc'
  else if (priceSort.value === 'asc') priceSort.value = 'desc'
  else priceSort.value = null
}

const loadListings = async () => {
  loading.value = true
  try {
    const res = await api.get('/marketplace')
    const items = res.data?.data?.listings || res.data?.data || (Array.isArray(res.data) ? res.data : [])
    listings.value = items.length ? items.map((item: any) => ({
      listing_id: item.listingId || item.listing_id || item.id,
      seat_id: item.ticketId || item.ticket_id || '-',
      asking_price: Number(item.price || item.asking_price || 0),
      status: item.status || 'ACTIVE',
      seller_user_id: item.sellerId || item.seller_id,
      created_at: item.createdAt || item.created_at,
      event_name: item.event?.name || item.event_name,
      event_date: item.event?.date || item.event?.event_date || item.event_date,
      row_number: item.row_number || item.seat?.row_number,
      seat_number: item.seat_number || item.seat?.seat_number,
      image: item.event?.image || item.image,
    })) : fallbackListings
  } catch {
    listings.value = fallbackListings
    toast.push('Showing demo listings.', 'info', 2400)
  } finally {
    loading.value = false
  }
}

const loadMyTickets = async () => {
  try {
    const { data } = await api.get('/qr/tickets')
    myTickets.value = (data?.data?.tickets || data?.data || [])
      .filter((t: any) => t.status === 'active')
      .map((t: any) => ({
        ticketId: t.ticketId,
        label: `${t.event?.name || 'Ticket'} — ${t.ticketId.slice(0, 8)}`,
      }))
    if (myTickets.value.length) listTicketId.value = myTickets.value[0].ticketId
  } catch {
    myTickets.value = []
  }
}

const listTicket = async () => {
  if (!listTicketId.value || listPrice.value <= 0) {
    toast.push('Enter a ticket ID and a valid price.', 'error', 3200)
    return
  }
  listLoading.value = true
  try {
    const { data } = await api.post('/marketplace/list', { ticketId: listTicketId.value })
    toast.push(data?.data?.message || 'Listing created.', 'success', 3200)
    listTicketId.value = ''
    listPrice.value = 120
    showListForm.value = false
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
    const { data } = await api.post('/transfer/initiate', { listingId })
    const transferId = data?.data?.transferId || data?.data?.transfer_id || data?.transferId
    toast.push('Purchase initiated.', 'success', 3200)
    if (transferId) {
      router.push(`/transfer/${transferId}`)
    } else {
      listings.value = listings.value.map((l) =>
        l.listing_id === listingId ? { ...l, status: 'PENDING_TRANSFER' } : l
      )
    }
  } catch (e: any) {
    toast.push(e?.response?.data?.message || 'Unable to buy listing.', 'error', 3200)
  } finally {
    buyLoadingIds.value = { ...buyLoadingIds.value, [listingId]: false }
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

    <!-- List a ticket button -->
    <div style="margin-top:1.5rem;">
      <button v-if="auth.state.accessToken" class="secondary" @click="showListForm = !showListForm; if (showListForm) loadMyTickets()">
        {{ showListForm ? 'Cancel' : '+ List a Ticket' }}
      </button>
      <p v-else class="small muted"><RouterLink to="/login" style="color:var(--accent)">Log in</RouterLink> to list a ticket for resale.</p>
    </div>

    <!-- List ticket form (collapsible) -->
    <transition name="slide">
      <article v-if="showListForm" class="glass list-form">
        <h3>List your ticket</h3>
        <div class="grid-2">
          <div>
            <label>Ticket</label>
            <select v-if="myTickets.length" v-model="listTicketId">
              <option v-for="t in myTickets" :key="t.ticketId" :value="t.ticketId">{{ t.label }}</option>
            </select>
            <p v-else class="small">No active tickets to list.</p>
          </div>
          <div><label>Asking Price ($)</label><input v-model.number="listPrice" type="number" min="1" /></div>
        </div>
        <button :disabled="listLoading" @click="listTicket">{{ listLoading ? 'Creating...' : 'Create Listing' }}</button>
      </article>
    </transition>

    <!-- Filter bar -->
    <article class="glass filter-bar" style="margin-top:1.5rem;">
      <input v-model="search" placeholder="Search by event name or listing ID" class="search-col" />
      <input v-model="dateFilter" type="date" class="date-col" />
      <button class="filter-btn" :class="{ active: priceSort }" @click="togglePriceSort">
        Price
        <span v-if="priceSort === 'asc'">↑</span>
        <span v-else-if="priceSort === 'desc'">↓</span>
      </button>
      <button class="secondary" @click="search = ''; dateFilter = ''; priceSort = null">Reset</button>
      <button class="secondary icon-btn" :disabled="loading" @click="loadListings">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
      </button>
    </article>

    <!-- Count -->
    <p class="count-label small">{{ filteredListings.length }} listing{{ filteredListings.length !== 1 ? 's' : '' }}</p>

    <!-- Grid -->
    <div v-if="loading" class="empty-state">Loading listings...</div>
    <div v-else-if="filteredListings.length === 0" class="empty-state">No listings found.</div>
    <div v-else class="listings-grid">
      <article
        v-for="(listing, i) in filteredListings"
        :key="listing.listing_id"
        class="listing-card glass"
      >
        <div class="card-img-wrap">
          <img
            class="card-img"
            :src="listing.image || fallbackListings[i % fallbackListings.length].image"
            :alt="listing.event_name || 'Event'"
          />
          <div class="img-overlay" />
          <span class="price-pill">${{ listing.asking_price }}</span>
        </div>
        <div class="card-body">
          <p class="event-date small">{{ listing.event_date ? new Date(listing.event_date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBA' }}</p>
          <h3 class="event-name">{{ listing.event_name || 'Event' }}</h3>
          <p class="seat-label small">{{ seatLabel(listing) }}</p>
          <div class="card-footer">
            <span :class="['status-dot', listing.status === 'ACTIVE' ? 'active' : 'inactive']" />
            <span class="small status-text">{{ listing.status }}</span>
            <button
              class="buy-btn"
              :disabled="listing.status !== 'ACTIVE' || buyLoadingIds[listing.listing_id]"
              @click="buyListing(listing.listing_id)"
            >
              {{ buyLoadingIds[listing.listing_id] ? 'Buying...' : 'Buy Now' }}
            </button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.marketplace-hero { padding-bottom: 0.5rem; }
.filter-bar { padding: .8rem; display: grid; grid-template-columns: 2fr 1fr auto auto auto auto; gap: .55rem; align-items: center; }
.search-col { min-width: 0; }
.date-col { min-width: 0; color-scheme: dark; }

.login-prompt { margin-bottom: 1.2rem; display: flex; align-items: center; gap: .6rem; color: var(--muted); font-size: 0.9rem; }

.listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.2rem; }

.listing-card { overflow: hidden; padding: 0; border-radius: 1.2rem; transition: transform .2s ease, box-shadow .2s ease; }
.listing-card:hover { transform: translateY(-4px); box-shadow: 0 24px 48px rgba(0,0,0,.5); }

.card-img-wrap { position: relative; height: 160px; }
.card-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.img-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(9,9,11,0) 40%, rgba(9,9,11,.7) 100%); }
.price-pill { position: absolute; top: .75rem; right: .75rem; background: var(--accent); color: #fff; font-weight: 700; font-size: .85rem; padding: .25rem .65rem; border-radius: 999px; }

.card-body { padding: 1rem; display: grid; gap: .4rem; }
.event-date { color: var(--muted); }
.event-name { font-size: 1rem; font-weight: 700; line-height: 1.3; }
.seat-label { color: var(--muted); }

.card-footer { display: flex; align-items: center; gap: .5rem; margin-top: .5rem; }
.status-dot { width: .5rem; height: .5rem; border-radius: 50%; flex-shrink: 0; }
.status-dot.active { background: var(--success); }
.status-dot.inactive { background: var(--disabled); }
.status-text { color: var(--muted); flex: 1; }
.buy-btn { padding: .4rem 1rem; border-radius: 999px; background: var(--accent); color: #fff; border: none; font-weight: 600; font-size: .85rem; cursor: pointer; transition: opacity .15s; }
.buy-btn:disabled { opacity: .4; cursor: not-allowed; }
.buy-btn:not(:disabled):hover { opacity: .85; }

@media (max-width: 640px) {
  .listings-grid { grid-template-columns: 1fr 1fr; gap: .8rem; }
  .hero { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 420px) {
  .listings-grid { grid-template-columns: 1fr; }
}
</style>
