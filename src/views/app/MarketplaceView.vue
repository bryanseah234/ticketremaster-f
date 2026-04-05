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
const averagePrice = computed(() =>
  filteredListings.value.length
    ? filteredListings.value.reduce((sum, listing) => sum + Number(listing.price || 0), 0) / filteredListings.value.length
    : 0,
)
const demandIndex = computed(() => {
  if (filteredListings.value.length >= 8) return 'High'
  if (filteredListings.value.length >= 4) return 'Medium'
  return 'Emerging'
})

const eventNames = computed(() => {
  const names = new Set<string>()
  listings.value.forEach((listing) => {
    if (listing.event?.name) names.add(listing.event.name)
  })
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
      event: (item.event || item.eventName)
        ? {
            eventId: item.event?.eventId ?? item.eventId ?? '',
            name: item.event?.name ?? item.eventName ?? '',
            date: item.event?.date ?? item.eventDate ?? '',
            venueId: '',
            price: 0,
            type: 'other',
            image: item.event?.image ?? undefined,
          }
        : undefined,
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
  <section class="marketplace-page">
    <header class="marketplace-header">
      <span class="eyebrow">Marketplace</span>
      <h1><span>Authentic</span> Access.</h1>

      <div class="header-controls">
        <label class="search-shell">
          <span class="search-icon" aria-hidden="true">⌕</span>
          <input v-model="search" placeholder="Search events, artists, or venues..." type="text" />
        </label>

        <div class="chip-row">
          <button class="filter-chip" :class="{ active: !eventFilter }" @click="eventFilter = ''">All Categories</button>
          <button
            v-for="name in eventNames.slice(0, 3)"
            :key="name"
            class="filter-chip"
            :class="{ active: eventFilter === name }"
            @click="eventFilter = eventFilter === name ? '' : name"
          >
            {{ name }}
          </button>
          <button class="filter-chip" :class="{ active: priceSort !== null }" @click="togglePriceSort">
            Price
            <span v-if="priceSort === 'asc'">↑</span>
            <span v-else-if="priceSort === 'desc'">↓</span>
          </button>
        </div>
      </div>
    </header>

    <div class="marketplace-layout">
      <div class="listings-column">
        <div v-if="loading" class="listings-grid">
          <article v-for="n in 4" :key="n" class="listing-card skeleton-card"></article>
        </div>

        <article v-else-if="filteredListings.length === 0" class="empty-card">
          <strong>No listings available right now.</strong>
          <p>Verified resale inventory will appear here once sellers publish active marketplace offers.</p>
          <div class="empty-actions">
            <RouterLink to="/events"><button type="button">Browse Events</button></RouterLink>
            <button
              v-if="auth.state.accessToken"
              class="secondary"
              type="button"
              @click="showListForm = true; loadMyTickets()"
            >
              Start Listing
            </button>
          </div>
        </article>

        <div v-else class="listings-grid">
          <article v-for="listing in filteredListings" :key="listing.listingId" class="listing-card">
            <div class="listing-media">
              <img v-if="listing.event?.image" :src="listing.event.image" :alt="listing.event?.name || 'Listing image'" />
              <span class="verified-pill">Verified Seller</span>
            </div>

            <div class="listing-copy">
              <div class="listing-topline">
                <h3>{{ listing.event?.name || 'Event' }}</h3>
                <span class="listing-price">SGD {{ Number(listing.price).toFixed(0) }}</span>
              </div>

              <p>{{ listing.event?.date ? new Date(listing.event.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' }) : 'Date TBA' }}</p>
              <p v-if="listing.sellerName" class="muted-line">Listed by {{ listing.sellerName }}</p>
              <p class="seat-line">{{ listing.ticketId.slice(0, 8).toUpperCase() }}</p>

              <button
                :disabled="listing.status !== 'active' || buyLoadingIds[listing.listingId]"
                @click="buyListing(listing.listingId)"
              >
                {{ buyLoadingIds[listing.listingId] ? 'Buying...' : 'Buy Ticket' }}
              </button>
            </div>
          </article>
        </div>

        <div v-if="totalPages > 1" class="pagination">
          <button class="secondary" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Prev</button>
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          <button class="secondary" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">Next</button>
        </div>
      </div>

      <aside class="sidebar-column">
        <article class="seller-card">
          <h3>Got extra tickets?</h3>
          <p>List your tickets in minutes. We verify your purchase automatically for a secure sale.</p>

          <ul class="seller-list">
            <li>Automatic Transfer</li>
            <li>Zero-Fraud Policy</li>
            <li>Instant Payouts</li>
          </ul>

          <button
            v-if="auth.state.accessToken"
            class="secondary"
            @click="showListForm = !showListForm; if (showListForm) loadMyTickets()"
          >
            {{ showListForm ? 'Close Listing Form' : 'Start Listing' }}
          </button>
        </article>

        <article v-if="showListForm" class="seller-card list-form">
          <h3>New Listing</h3>

          <div>
            <label>Ticket</label>
            <select v-if="myTickets.length" v-model="listTicketId">
              <option v-for="ticket in myTickets" :key="ticket.ticketId" :value="ticket.ticketId">{{ ticket.label }}</option>
            </select>
            <p v-else class="muted-line">No active tickets available to list.</p>
          </div>

          <div>
            <label>Asking Price</label>
            <input v-model.number="listPrice" type="number" min="1" />
          </div>

          <button :disabled="listLoading" @click="listTicket">{{ listLoading ? 'Creating...' : 'Create Listing' }}</button>
        </article>

        <article class="stats-card">
          <h4>Market Insights</h4>
          <div class="stat-row"><span>Total Listings</span><strong>{{ filteredListings.length }}</strong></div>
          <div class="stat-row"><span>Avg. Resale Price</span><strong>SGD {{ averagePrice.toFixed(2) }}</strong></div>
          <div class="stat-row"><span>Demand Index</span><strong class="accent">{{ demandIndex }}</strong></div>
        </article>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.marketplace-page {
  width: min(100% - 3rem, 84rem);
  margin: 0 auto;
  padding: 7.5rem 0 4.5rem;
  display: grid;
  gap: 2rem;
}

.marketplace-header {
  display: grid;
  gap: 1.5rem;
  justify-items: center;
  text-align: center;
}

.eyebrow {
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.marketplace-header h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(3.3rem, 7vw, 5.8rem);
  font-weight: 900;
  line-height: 0.92;
  letter-spacing: -0.07em;
}

.marketplace-header h1 span {
  color: var(--primary);
}

.header-controls {
  display: grid;
  gap: 1rem;
  width: min(100%, 58rem);
}

.search-shell {
  position: relative;
  width: min(100%, 32rem);
  justify-self: center;
}

.search-shell input {
  padding-left: 3rem;
  border-radius: 999px;
  background: rgba(38, 38, 38, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 1rem;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.45);
  font-size: 1.1rem;
}

.chip-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.filter-chip {
  padding: 0.82rem 1.2rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(38, 38, 38, 0.82);
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.82rem;
  font-weight: 600;
}

.filter-chip.active {
  background: rgba(249, 115, 22, 0.14);
  color: var(--primary);
  border-color: rgba(249, 115, 22, 0.2);
}

.marketplace-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(19rem, 0.8fr);
  gap: 1.5rem;
}

.listings-column,
.sidebar-column {
  display: grid;
  gap: 1rem;
}

.listings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.listing-card,
.seller-card,
.stats-card,
.empty-card {
  border-radius: 1.45rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(26, 25, 25, 0.9);
  overflow: hidden;
}

.listing-card {
  display: grid;
}

.listing-media {
  position: relative;
  height: 12rem;
  background: rgba(19, 19, 19, 0.82);
}

.listing-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.45s ease;
}

.listing-card:hover .listing-media img {
  transform: scale(1.04);
}

.verified-pill {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(249, 115, 22, 0.28);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.listing-copy,
.seller-card,
.stats-card {
  display: grid;
  gap: 1rem;
  padding: 1.4rem;
}

.listing-topline {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
}

.listing-topline h3,
.seller-card h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.listing-price {
  color: var(--primary);
  font-size: 1.3rem;
  font-weight: 800;
}

.listing-copy p,
.seller-card p,
.muted-line,
.pagination,
.stat-row span {
  margin: 0;
  color: var(--text-muted);
}

.seat-line {
  color: rgba(255, 255, 255, 0.56);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.seller-list {
  display: grid;
  gap: 0.8rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.seller-list li {
  position: relative;
  padding-left: 1.2rem;
  font-size: 0.92rem;
  font-weight: 600;
}

.seller-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--primary);
}

.list-form label {
  margin-bottom: 0.45rem;
}

.stats-card h4 {
  margin: 0;
  color: rgba(255, 255, 255, 0.42);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.stat-row,
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.stat-row strong {
  font-weight: 800;
}

.accent {
  color: var(--primary);
}

.empty-card {
  display: grid;
  gap: 0.85rem;
  justify-items: start;
  align-content: start;
  min-height: 19rem;
  padding: 1.8rem;
}

.empty-card strong {
  font-size: 1.4rem;
  letter-spacing: -0.03em;
}

.empty-card p {
  margin: 0;
  color: var(--textMuted);
  line-height: 1.6;
}

.empty-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.skeleton-card {
  min-height: 21rem;
  background: linear-gradient(90deg, rgba(32, 31, 31, 0.7), rgba(44, 44, 44, 0.9), rgba(32, 31, 31, 0.7));
}

@media (max-width: 980px) {
  .marketplace-layout,
  .listings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .marketplace-page {
    width: min(100% - 1rem, 84rem);
    padding-top: 6.5rem;
  }
}
</style>
