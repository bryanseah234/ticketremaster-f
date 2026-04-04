<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { isDemoMode, mockServices } from '@/services/mockData'
import type { MarketplaceListing } from '@/types'

const router = useRouter()
const toast = useToast()
const auth = useAuthStore()

const loading = ref(false)
const listings = ref<MarketplaceListing[]>([])
const listTicketId = ref('')
const listPrice = ref(120)
const listLoading = ref(false)
const showListForm = ref(false)
const myTickets = ref<{ ticketId: string; label: string }[]>([])
const buyLoadingIds = ref<Record<string, boolean>>({})
const search = ref('')
const priceSort = ref<'asc' | 'desc' | null>(null)
const eventFilter = ref('')

// Pagination
const currentPage = ref(1)
const pageSize = 10
const totalListings = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(totalListings.value / pageSize)))

// Unique event names for the filter dropdown
const eventNames = computed(() => {
  const names = new Set<string>()
  listings.value.forEach(l => { if (l.event?.name) names.add(l.event.name) })
  return Array.from(names).sort()
})

const filteredListings = computed(() => {
  const needle = search.value.trim().toLowerCase()
  let result = listings.value.filter((l) => {
    const text = `${l.event?.name ?? ''} ${l.listingId}`.toLowerCase()
    const matched = !needle || text.includes(needle)
    const eventMatched = !eventFilter.value || l.event?.name === eventFilter.value
    return matched && eventMatched
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

const loadListings = async (page = currentPage.value) => {
  loading.value = true
  try {
    if (isDemoMode()) {
      const res = await mockServices.getMarketplaceListings({ page, limit: pageSize })
      listings.value = res.listings
      totalListings.value = res.pagination.total
      currentPage.value = page
      return
    }
    const res = await api.get('/marketplace', { params: { page, limit: pageSize } })
    const data = res.data?.data
    const items: any[] = data?.listings ?? []
    listings.value = items.map((item: any): MarketplaceListing => ({
      listingId: item.listingId,
      ticketId: item.ticketId,
      sellerId: item.sellerId,
      sellerName: item.sellerName ?? undefined,
      eventId: item.event?.eventId ?? '',
      price: Number(item.price ?? 0),
      status: item.status as MarketplaceListing['status'],
      createdAt: item.createdAt,
      event: item.event ? {
        eventId: item.event.eventId,
        name: item.event.name,
        date: item.event.date,
        venueId: '',
        price: 0,
        type: 'other',
      } : undefined,
    }))
    totalListings.value = data?.pagination?.total ?? listings.value.length
    currentPage.value = page
  } catch {
    listings.value = []
  } finally {
    loading.value = false
  }
}

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  loadListings(page)
}

const loadMyTickets = async () => {
  try {
    const { data } = await api.get('/tickets')
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
    loadListings(1)
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
        l.listingId === listingId ? { ...l, status: 'sold' } : l
      )
    }
  } catch (e: any) {
    const msg = e?.response?.data?.error?.message || e?.response?.data?.message || 'Unable to buy listing.'
    toast.push(msg, 'error', 3200)
  } finally {
    buyLoadingIds.value = { ...buyLoadingIds.value, [listingId]: false }
  }
}

onMounted(() => loadListings(1))
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
      <select v-model="eventFilter" class="event-col">
        <option value="">All Events</option>
        <option v-for="name in eventNames" :key="name" :value="name">{{ name }}</option>
      </select>
      <button class="filter-btn" :class="{ active: priceSort }" @click="togglePriceSort">
        Price
        <span v-if="priceSort === 'asc'">↑</span>
        <span v-else-if="priceSort === 'desc'">↓</span>
      </button>
      <button class="secondary" @click="search = ''; eventFilter = ''; priceSort = null">Reset</button>
      <button class="secondary icon-btn" :disabled="loading" @click="loadListings(currentPage)">
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
        <div class="card-body">
          <p class="event-date small">{{ listing.event?.date ? new Date(listing.event.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBA' }}</p>
          <h3 class="event-name">{{ listing.event?.name || 'Event' }}</h3>
          <p class="price-label">${{ listing.price }}</p>
          <p v-if="listing.sellerName" class="seller-label small">
            <svg viewBox="0 0 24 24" class="seller-icon"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/></svg>
            Listed by {{ listing.sellerName }}
          </p>
          <div class="card-footer">
            <span :class="['status-dot', listing.status === 'active' ? 'active' : 'inactive']" />
            <span class="small status-text">{{ listing.status }}</span>
            <button
              class="buy-btn"
              :disabled="listing.status !== 'active' || buyLoadingIds[listing.listingId]"
              @click="buyListing(listing.listingId)"
            >
              {{ buyLoadingIds[listing.listingId] ? 'Buying...' : 'Buy Now' }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="pagination">
      <button class="secondary" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">← Prev</button>
      <span class="small">Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="secondary" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">Next →</button>
    </div>
  </section>
</template>

<style scoped>
.marketplace-hero { padding-bottom: 0.5rem; }
.filter-bar { padding: .8rem; display: grid; grid-template-columns: 2fr 1.5fr auto auto auto; gap: .55rem; align-items: center; }
.search-col { min-width: 0; }
.event-col { min-width: 0; }

.listings-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.2rem; }

.listing-card { overflow: hidden; border-radius: 1.2rem; transition: transform .2s ease, box-shadow .2s ease; }
.listing-card:hover { transform: translateY(-4px); box-shadow: 0 24px 48px rgba(0,0,0,.5); }

.card-body { padding: 1rem; display: grid; gap: .4rem; }
.event-date { color: var(--muted); }
.event-name { font-size: 1rem; font-weight: 700; line-height: 1.3; }
.price-label { font-size: 1.25rem; font-weight: 800; color: var(--accent); }
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

.pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem; }

.count-label { margin: .75rem 0 .5rem; }

@media (max-width: 640px) {
  .listings-grid { grid-template-columns: 1fr 1fr; gap: .8rem; }
  .filter-bar { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 420px) {
  .listings-grid { grid-template-columns: 1fr; }
}
</style>
