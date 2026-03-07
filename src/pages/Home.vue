<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-overlay">
        <div class="container-lg">
          <div class="hero-content">
            <h1 class="hero-title">Your next best-night-ever is waiting</h1>
            <p class="hero-subtitle">Discover live events in your area and get the best deals on tickets</p>
            
            <!-- CTA Button -->
            <div class="hero-cta mt-5">
              <router-link to="/events" class="btn btn-danger btn-lg">
                Browse Events
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Events -->
    <section class="featured-section py-5">
      <div class="container-lg">
        <h2 class="section-title mb-4">Featured Events</h2>
        
        <!-- Loading State -->
        <div v-if="isLoading" class="text-center py-5">
          <div class="spinner-border text-danger" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-3">Loading featured events...</p>
        </div>

        <!-- Events Grid -->
        <div v-else-if="featuredEvents.length > 0" class="row g-4">
          <div v-for="event in featuredEvents" :key="event.event_id" class="col-lg-3 col-md-6">
            <div class="event-card">
              <div class="event-image">
                <span class="event-image-placeholder">{{ getEventEmoji(event.name) }}</span>
              </div>
              <div class="event-body">
                <h5 class="event-title">{{ event.name }}</h5>
                <p class="event-date">
                  📅 {{ formatDate(event.event_date) }}
                </p>
                <p class="event-venue">
                  📍 {{ event.venue?.name || 'TBD' }}
                </p>
                <div class="d-flex justify-content-between align-items-center mt-3">
                  <span class="event-price">From ${{ getMinPrice(event.pricing_tiers) }}</span>
                  <router-link :to="`/events/${event.event_id}`" class="btn btn-sm btn-outline-danger">
                    View
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-5">
          <p class="text-muted">No featured events available at the moment.</p>
          <router-link to="/events" class="btn btn-primary mt-3">Browse All Events</router-link>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section py-5 bg-light">
      <div class="container-lg text-center">
        <h2 class="section-title mb-3">Don't Miss Out</h2>
        <p class="mb-4 text-muted">Browse thousands of events and secure your tickets today</p>
        <router-link to="/events" class="btn btn-danger btn-lg">
          Explore All Events
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const KONG_GATEWAY = 'http://localhost:8000'

const isLoading = ref(false)
const error = ref(null)
const featuredEvents = ref([])

// Load featured events from API
const loadFeaturedEvents = async () => {
  isLoading.value = true
  error.value = null

  try {
    const response = await axios.get(`${KONG_GATEWAY}/api/events`, {
      params: {
        per_page: 4
      }
    })

    // API returns events in response.data.data array
    featuredEvents.value = response.data.data || []
  } catch (err) {
    console.error('Failed to load featured events:', err)
    error.value = err.message
    featuredEvents.value = []
  } finally {
    isLoading.value = false
  }
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
  if (!pricingTiers || pricingTiers.length === 0) {
    return '0.00'
  }
  const prices = pricingTiers.map(tier => tier.price || 0)
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
  loadFeaturedEvents()
})
</script>

<style scoped>
.home {
  background: #fff;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), 
              url('/hero-concert.jpeg') center/cover no-repeat;
  color: white;
  padding: 120px 20px;
  position: relative;
  overflow: hidden;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.hero-overlay {
  position: relative;
  z-index: 1;
}

.hero-content {
  text-align: center;
  max-width: 900px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  margin-bottom: 15px;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 1.3rem;
  opacity: 0.95;
  margin: 0;
  font-weight: 300;
}

.hero-cta {
  display: flex;
  justify-content: center;
}

.hero-cta .btn {
  background-color: #ff3b30;
  border: none;
  font-weight: 600;
  transition: background-color 0.3s;
  padding: 15px 40px;
}

.hero-cta .btn:hover {
  background-color: #e60e00;
}

/* Featured Section */
.featured-section {
  background: white;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 2rem;
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

.event-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  line-height: 1.3;
}

.event-date,
.event-venue {
  color: #666;
  font-size: 0.95rem;
  margin: 6px 0;
}

.event-price {
  font-size: 1.3rem;
  font-weight: 700;
  color: #ff3b30;
}

/* CTA Section */
.cta-section {
  background: #f8f9fa;
}

.cta-section .btn {
  background-color: #ff3b30;
  border: none;
  font-weight: 600;
  transition: background-color 0.3s;
}

.cta-section .btn:hover {
  background-color: #e60e00;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .section-title {
    font-size: 1.5rem;
  }
}
</style>
