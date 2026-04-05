<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
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
const search = ref('')
const priceSort = ref<'asc' | 'desc' | null>(null)
const eventFilter = ref('')
const currentPage = ref(1)
const pageSize = 10
const totalListings = ref(0)

const listTicketId = ref('')
const listPrice = ref(120)
const listLoading = ref(false)
const showListForm = ref(false)
const myTickets = ref<{ ticketId: string; label: string }[]>([])
const buyLoadingIds = ref<Record<string, boolean>>({})

const totalPages = computed(() => Math.max(1, Math.ceil(totalListings.value / pageSize)))

const eventNames = computed(() => {
  const names = new Set<string>()
  listings.value.forEach(listing => { if (listing.event?.name) names.add(listing.event.name) })
  return Array.from(names).sort()
})

const filteredListings = computed(() => {
  const needle = search.value.trim().toLowerCase()
  let result = listings.value.filter((listing) => {
    const text = `${listing.event?.name ?? ''} ${listing.listingId}`.toLowerCase()
    const matched = !needle || text.includes(needle)
    const eventMatched = !eventFilter.value || listing.event?.name === eventFilter.value
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
      const response = await mockServices.getMarketplaceListings({ page, limit: pageSize })
      listings.value = response.listings
      totalListings.value = response.pagination.total
      currentPage.value = page
      return
    }

    const response = await api.get('/marketplace', { params: { page, limit: pageSize } })
    const data = response.data?.data
    const items: any[] = data?.listings ?? []
    listings.value = items.map((item: any): MarketplaceListing => ({
      listingId: item.listingId,
      ticketId: item.ticketId,
      sellerId: item.sellerId,
      sellerName: item.sellerName ?? undefined,
      eventId: item.event?.eventId ?? item.eventId ?? '',
      price: Number(item.price ?? 0),
      status: (item.status?.toLowerCase() ?? 'active') as MarketplaceListing['status'],
      createdAt: item.createdAt,
      event: (item.event || item.eventName) ? {
        eventId: item.event?.eventId ?? item.eventId ?? '',
        name: item.event?.name ?? item.eventName ?? '',
        date: item.event?.date ?? item.eventDate ?? '',
        venueId: '',
        price: 0,
        type: 'other',
      } : undefined,
    }))
    totalListings.value = data?.pagination?.total ?? listings.value.length
    currentPage.value = page
  } catch {
    try {
      const response = await mockServices.getMarketplaceListings({ page, limit: pageSize })
      listings.value = response.listings
      totalListings.value = response.pagination.total
      currentPage.value = page
      toast.push('Backend unavailable. Showing demo listings.', 'info', 3200)
    } catch {
      listings.value = []
    }
  } finally {
    loading.value = false
  }
}

const loadMyTickets = async () => {
  try {
    const { data } = await api.get('/tickets')
    myTickets.value = (data?.data?.tickets || data?.data || [])
      .filter((ticket: any) => ticket.status === 'active')
      .map((ticket: any) => ({
        ticketId: ticket.ticketId,
        label: `${ticket.event?.name || 'Ticket'} — ${ticket.ticketId.slice(0, 8)}`,
      }))
    if (myTickets.value.length) listTicketId.value = myTickets.value[0].ticketId
  } catch {
    myTickets.value = []
  }
}

const listTicket = async () => {
  if (!listTicketId.value || listPrice.value <= 0) {
    toast.push('Enter a ticket and a valid price.', 'error', 3200)
    return
  }
  listLoading.value = true
  try {
    await api.post('/marketplace/list', { ticketId: listTicketId.value, price: listPrice.value })
    toast.push('Listing created.', 'success', 3200)
    showListForm.value = false
    await loadListings(1)
  } catch (e: any) {
    toast.push(e?.response?.data?.message || 'Unable to list ticket.', 'error', 3200)
  } finally {
    listLoading.value = false
  }
}

const buyListing = async (listingId: string) => {
  buyLoadingIds.value = { ...buyLoadingIds.value, [listingId]: true }
  try {
    const { data } = await api.post('/transfer/initiate', { listingId })
    const transferId = data?.data?.transferId || data?.data?.transfer_id || data?.transferId
    toast.push('Transfer initiated.', 'success', 3200)
    if (transferId) router.push(`/transfer/${transferId}`)
  } catch (e: any) {
    const msg = e?.response?.data?.error?.message || e?.response?.data?.message || 'Unable to buy listing.'
    toast.push(msg, 'error', 3200)
  } finally {
    buyLoadingIds.value = { ...buyLoadingIds.value, [listingId]: false }
  }
}

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  loadListings(page)
}

onMounted(() => {
  loadListings(1)
})
</script>

<template>
  <section class="page marketplace-page">
    <header class="marketplace-hero glass">
      <div class="hero-copy">
        <span class="badge">Marketplace</span>
        <h1 class="section-title">Verified resale listings from real ticket holders.</h1>
        <p class="section-subtitle">Browse resale inventory, compare prices, and initiate protected transfers with confidence.</p>
      </div>
      <div class="hero-actions">
        <button v-if="auth.state.accessToken" class="secondary" @click="showListForm = !showListForm; if (showListForm) loadMyTickets()">
          {{ showListForm ? 'Close listing form' : 'List a Ticket' }}
        </button>
      </div>
    </header>

    <transition name="fade">
      <article v-if="showListForm" class="glass list-form">
        <div>
          <span class="badge">New Listing</span>
          <h2>List your ticket</h2>
        </div>
        <div class="grid-2">
          <div>
            <label>Ticket</label>
            <select v-if="myTickets.length" v-model="listTicketId">
              <option v-for="ticket in myTickets" :key="ticket.ticketId" :value="ticket.ticketId">{{ ticket.label }}</option>
            </select>
            <p v-else class="small muted">No active tickets available to list.</p>
          </div>
          <div>
            <label>Asking Price</label>
            <input v-model.number="listPrice" type="number" min="1" />
          </div>
        </div>
        <div class="list-actions">
          <button :disabled="listLoading" @click="listTicket">{{ listLoading ? 'Creating...' : 'Create Listing' }}</button>
        </div>
      </article>
    </transition>

    <article class="glass filter-bar">
      <input v-model="search" placeholder="Search by event name or listing ID" class="search-col" />
      <select v-model="eventFilter" class="event-col">
        <option value="">All Events</option>
        <option v-for="name in eventNames" :key="name" :value="name">{{ name }}</option>
      </select>
      <button class="secondary sort-btn" @click="togglePriceSort">
        Price
        <span v-if="priceSort === 'asc'">↑</span>
        <span v-else-if="priceSort === 'desc'">↓</span>
      </button>
      <button class="ghost reset-btn" @click="search = ''; eventFilter = ''; priceSort = null">Reset</button>
    </article>

    <p class="small muted">{{ filteredListings.length }} listing{{ filteredListings.length !== 1 ? 's' : '' }}</p>

    <div v-if="loading" class="glass empty-state">Loading listings...</div>
    <div v-else-if="filteredListings.length === 0" class="glass empty-state">No listings found.</div>
    <div v-else class="listings-grid">
      <article v-for="listing in filteredListings" :key="listing.listingId" class="glass listing-card">
        <div class="listing-copy">
          <span class="badge">Live Listing</span>
          <p class="small muted">{{ listing.event?.date ? new Date(listing.event.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBA' }}</p>
          <h3>{{ listing.event?.name || 'Event' }}</h3>
          <p class="price">${{ listing.price }}</p>
          <p v-if="listing.sellerName" class="small muted">Listed by {{ listing.sellerName }}</p>
        </div>
        <div class="listing-footer">
          <span :class="['status-pill', listing.status === 'active' ? 'active' : 'inactive']">{{ listing.status }}</span>
          <button
            :disabled="listing.status !== 'active' || buyLoadingIds[listing.listingId]"
            @click="buyListing(listing.listingId)"
          >
            {{ buyLoadingIds[listing.listingId] ? 'Buying...' : 'Buy Now' }}
          </button>
        </div>
      </article>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button class="secondary" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Prev</button>
      <span class="small muted">Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="secondary" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">Next</button>
    </div>
  </section>
</template>

<style scoped>
.marketplace-page {
  display: grid;
  gap: 1rem;
}

.marketplace-hero,
.list-form,
.filter-bar,
.listing-card,
.empty-state {
  padding: 1.25rem;
}

.marketplace-hero {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.hero-copy {
  display: grid;
  gap: 0.75rem;
}

.list-form,
.listing-copy {
  display: grid;
  gap: 0.8rem;
}

.list-form h2,
.listing-copy h3 {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
}

.filter-bar {
  display: grid;
  grid-template-columns: 2fr 1.3fr auto auto;
  gap: 0.6rem;
  align-items: center;
}

.listings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

.listing-card {
  display: grid;
  gap: 1rem;
}

.price {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--primarySoft);
}

.listing-footer,
.list-actions,
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-pill.active {
  background: rgba(82, 209, 140, 0.14);
  color: var(--success);
}

.status-pill.inactive {
  background: rgba(109, 93, 87, 0.22);
  color: var(--textMuted);
}

.empty-state {
  text-align: center;
}

@media (max-width: 760px) {
  .filter-bar {
    grid-template-columns: 1fr;
  }
}
</style>
