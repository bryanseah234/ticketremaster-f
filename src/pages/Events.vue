<template>
  <div class="events-page">
    <!-- Search & Filter -->
    <section class="search-section py-4 bg-light sticky-top">
      <div class="container-lg">
        <div class="row g-3 align-items-end">
          <div class="col-md-5">
            <label class="form-label fw-500">Search</label>
            <input
              v-model="filterQuery"
              type="text"
              class="form-control"
              placeholder="Event name, artist or team..."
            />
          </div>
          <div class="col-md-3">
            <label class="form-label fw-500">Date</label>
            <input v-model="dateFilter" type="date" class="form-control" />
          </div>
          <div class="col-md-2">
            <div class="d-flex gap-2">
              <button class="btn btn-primary w-100" @click="loadEvents">
                Search
              </button>
              <button class="btn btn-outline-secondary w-100" @click="resetFilters">
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Events Grid -->
    <section class="events-list py-5">
      <div class="container-lg">
        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border text-danger" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-3">Loading events...</p>
        </div>

        <div v-else>
          <div v-if="filteredEvents.length > 0" class="row g-4">
            <div
              v-for="event in filteredEvents"
              :key="event.event_id"
              class="col-lg-3 col-md-6"
            >
              <div class="event-card">
                <div class="event-image">
                  <span class="event-image-placeholder">{{ getEventEmoji(event.name) }}</span>
                </div>
                <div class="event-body">
                  <h5 class="event-title">{{ event.name }}</h5>
                  <p class="event-date">📅 {{ formatDate(event.event_date) }}</p>
                  <p class="event-venue">📍 {{ event.venue?.name || 'TBD' }}</p>
                  <div class="d-flex justify-content-between align-items-center mt-3">
                    <span class="event-price">
                      From ${{ getMinPrice(event.pricing_tiers) }}
                    </span>
                    <router-link
                      :to="`/events/${event.event_id}`"
                      class="btn btn-sm btn-outline-danger"
                    >
                      View
                    </router-link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-5">
            <p class="text-muted">No events found matching your criteria.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Pagination -->
    <section class="pagination-section py-3">
      <div class="container-lg text-center">
        <nav v-if="totalPages > 1">
          <ul class="pagination justify-content-center">
            <li class="page-item" :class="{ disabled: page === 1 }">
              <a class="page-link" href="#" @click.prevent="changePage(page - 1)">Previous</a>
            </li>
            <li
              class="page-item"
              v-for="p in totalPages"
              :key="p"
              :class="{ active: page === p }"
            >
              <a class="page-link" href="#" @click.prevent="changePage(p)">{{ p }}</a>
            </li>
            <li class="page-item" :class="{ disabled: page === totalPages }">
              <a class="page-link" href="#" @click.prevent="changePage(page + 1)">Next</a>
            </li>
          </ul>
        </nav>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const KONG_GATEWAY = 'http://localhost:8000'

// sample events for demonstration/fallback
const sampleEvents = [
  {
    event_id: 'evt1',
    name: 'Rock Concert Extravaganza',
    event_date: '2026-05-21T20:00:00Z',
    venue: { name: 'Madison Square Garden' },
    pricing_tiers: [{ price: 75 }, { price: 120 }]
  },
  {
    event_id: 'evt2',
    name: 'Championship Football Game',
    event_date: '2026-06-15T18:00:00Z',
    venue: { name: 'MetLife Stadium' },
    pricing_tiers: [{ price: 95 }, { price: 150 }]
  },
  {
    event_id: 'evt3',
    name: 'Broadway Musical: The Awakening',
    event_date: '2026-04-10T19:30:00Z',
    venue: { name: 'Majestic Theatre' },
    pricing_tiers: [{ price: 60 }, { price: 85 }]
  }
]

const events = ref([...sampleEvents])
const isLoading = ref(false)
const error = ref(null)
const filterQuery = ref('')
const dateFilter = ref('')
const page = ref(1)
const perPage = ref(20)
const totalPages = ref(1)

const loadEvents = async () => {
  isLoading.value = true
  error.value = null

  try {
    const response = await axios.get(`${KONG_GATEWAY}/api/events`, {
      params: {
        page: page.value,
        per_page: perPage.value
      }
    })
    const data = response.data
    events.value = (data.data && data.data.length > 0) ? data.data : [...sampleEvents]
    totalPages.value = data.pagination?.total_pages || 1
  } catch (err) {
    console.error('Failed to load events:', err)
    error.value = err.message
    // show sample events when backend is unreachable or returns an error
    events.value = [...sampleEvents]
  } finally {
    isLoading.value = false
  }
}

const filteredEvents = computed(() => {
  return events.value.filter((evt) => {
    const matchesQuery = filterQuery.value
      ? evt.name.toLowerCase().includes(filterQuery.value.toLowerCase())
      : true
    const matchesDate = dateFilter.value
      ? evt.event_date.startsWith(dateFilter.value)
      : true
    return matchesQuery && matchesDate
  })
})

const changePage = (p) => {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  loadEvents()
}

const resetFilters = () => {
  filterQuery.value = ''
  dateFilter.value = ''
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  }).format(date)
}

const getMinPrice = (pricingTiers) => {
  if (!pricingTiers || pricingTiers.length === 0) return '0.00'
  const prices = pricingTiers.map((tier) => tier.price || 0)
  return Math.min(...prices).toFixed(2)
}

const getEventEmoji = (eventName) => {
  const name = eventName?.toLowerCase() || ''
  if (name.includes('concert') || name.includes('music')) return '🎸'
  if (name.includes('sport') || name.includes('football') || name.includes('basketball')) return '⚽'
  if (name.includes('theater') || name.includes('musical') || name.includes('play')) return '🎭'
  if (name.includes('comedy')) return '😂'
  return '🎫'
}

onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
/* reuse card styles from Home.vue so events page matches */
.events-page {
  background: #fff;
}

.event-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.event-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}

.event-image {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.event-image-placeholder {
  font-size: 80px;
  z-index: 1;
}

.event-body {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
