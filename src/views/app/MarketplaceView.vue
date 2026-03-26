<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

interface Listing {
  listingId: string
  seatId: string
  price: number
  status: string
  sellerId?: string
  sellerName?: string
  createdAt?: string
  eventName?: string
  eventDate?: string
  rowNumber?: string
  seatNumber?: number
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


const seatLabel = (listing: Listing) => {
  if (listing.rowNumber && listing.seatNumber) {
    return `Row ${listing.rowNumber} · Seat ${listing.seatNumber}`
  }
  return `Seat ${listing.seatId}`
}

const filteredListings = computed(() => {
  const needle = search.value.trim().toLowerCase()
  let result = listings.value.filter((l) => {
    const text = `${l.eventName} ${l.listingId} ${l.seatId}`.toLowerCase()
    const matched = !needle || text.includes(needle)
    const dateMatched = !dateFilter.value || (l.eventDate && l.eventDate.slice(0, 10) === dateFilter.value)
    return matched && dateMatched
  })
  if (priceSort.value === 'asc') result = [...result].sort((a, b) => a.price - b.price)
  if (priceSort.value === 'desc') result = [...result].sort((a, b) => b.price - a.price)
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
    listings.value = items.map((item: any) => ({
      listingId: item.listingId || item.listing_id || item.id,
      seatId: item.ticketId || item.ticket_id || '-',
      price: Number(item.price || 0),
      status: (item.status || 'ACTIVE').toUpperCase(),
      sellerId: item.sellerId || item.seller_id,
      sellerName: item.sellerName || item.seller_name || null,
      createdAt: item.createdAt || item.created_at,
      eventName: item.event?.name || item.eventName,
      eventDate: item.event?.date || item.event?.eventDate || item.eventDate,
      rowNumber: item.rowNumber || item.seat?.rowNumber,
      seatNumber: item.seatNumber || item.seat?.seatNumber,
      image: item.event?.image || item.image,
    }))
  } catch {
    listings.value = []
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
    const { data } = await api.post('/marketplace/list', { ticketId: listTicketId.value, price: listPrice.value })
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
        l.listingId === listingId ? { ...l, status: 'PENDING_TRANSFER' } : l
      )
    }
  } catch (e: any) {
    const msg = e?.response?.data?.error?.message || e?.response?.data?.message || 'Unable to buy listing.'
    toast.push(msg, 'error', 3200)
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
        v-for="listing in filteredListings"
        :key="listing.listingId"
        class="listing-card glass"
      >
        <div class="card-img-wrap">
          <img
            class="card-img"
            :src="listing.image || ''"
            :alt="listing.eventName || 'Event'"
          />
          <div class="img-overlay" />
          <span class="price-pill">${{ listing.price }}</span>
        </div>
        <div class="card-body">
          <p class="event-date small">{{ listing.eventDate ? new Date(listing.eventDate).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBA' }}</p>
          <h3 class="event-name">{{ listing.eventName || 'Event' }}</h3>
          <p class="seat-label small">{{ seatLabel(listing) }}</p>
          <p v-if="listing.sellerName" class="seller-label small">
            <svg viewBox="0 0 24 24" class="seller-icon"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/></svg>
            Listed by {{ listing.sellerName }}
          </p>
          <div class="card-footer">
            <span :class="['status-dot', listing.status === 'ACTIVE' ? 'active' : 'inactive']" />
            <span class="small status-text">{{ listing.status }}</span>
            <button
              class="buy-btn"
              :disabled="listing.status !== 'ACTIVE' || buyLoadingIds[listing.listingId]"
              @click="buyListing(listing.listingId)"
            >
              {{ buyLoadingIds[listing.listingId] ? 'Buying...' : 'Buy Now' }}
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
.seller-label { color: var(--muted); display: flex; align-items: center; gap: .3rem; }
.seller-icon { width: .85rem; height: .85rem; fill: none; stroke: var(--muted); stroke-width: 2; stroke-linecap: round; flex-shrink: 0; }

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
