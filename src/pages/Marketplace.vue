<template>
  <div class="marketplace">
    <!-- Header Section -->
    <section class="marketplace-header">
      <div class="container-lg">
        <h1 class="header-title">Resale Marketplace</h1>
        <p class="header-subtitle">Browse available tickets from other fans. Buy direct and save!</p>
      </div>
    </section>

    <!-- Search & Filter Section -->
    <section class="search-filter-section py-4 bg-light sticky-top">
      <div class="container-lg">
        <div class="row g-3 align-items-end">
          <div class="col-md-5">
            <label class="form-label fw-500">Search</label>
            <input 
              v-model="filterQuery" 
              type="text" 
              class="form-control"
              placeholder="Event name, artist, or team..."
            >
          </div>
          <div class="col-md-3">
            <label class="form-label fw-500">Price Range</label>
            <select v-model="priceFilter" class="form-select">
              <option value="all">All Prices</option>
              <option value="0-50">$0 - $50</option>
              <option value="50-100">$50 - $100</option>
              <option value="100-200">$100 - $200</option>
              <option value="200+">$200+</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label fw-500">Sort By</label>
            <select v-model="sortBy" class="form-select">
              <option value="newest">Newest Listings</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
          <div class="col-md-1">
            <button class="btn btn-outline-secondary w-100" @click="resetFilters">
              Reset
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Active Filters Display -->
    <section v-if="activeFiltersCount > 0" class="py-2 bg-white">
      <div class="container-lg">
        <small class="text-muted">
          Active Filters: {{ activeFiltersCount }} | 
          <a href="#" @click.prevent="resetFilters" class="text-danger">Clear All</a>
        </small>
      </div>
    </section>

    <!-- Listings Grid -->
    <section class="listings-section py-5">
      <div class="container-lg">
        <div class="listings-info mb-4">
          <p class="text-muted">
            Showing <strong>{{ filteredListings.length }}</strong> available listings
          </p>
        </div>

        <div v-if="filteredListings.length > 0" class="row g-4">
          <div v-for="listing in filteredListings" :key="listing.id" class="col-lg-4 col-md-6">
            <div class="listing-card">
              <!-- Listing Image -->
              <div class="listing-image">
                <span class="event-emoji">{{ listing.eventType === 'concert' ? '🎸' : listing.eventType === 'sports' ? '⚽' : '🎭' }}</span>
                <span class="condition-badge" :class="listing.condition">{{ listing.condition }}</span>
              </div>

              <!-- Listing Body -->
              <div class="listing-body">
                <!-- Event Info -->
                <div class="event-section">
                  <h5 class="event-title">{{ listing.eventName }}</h5>
                  <p class="event-date">📅 {{ formatDate(listing.eventDate) }}</p>
                  <p class="event-venue">📍 {{ listing.venue }}</p>
                </div>

                <!-- Ticket Details -->
                <div class="ticket-details">
                  <div class="detail-row">
                    <span class="detail-label">Seats:</span>
                    <span class="detail-value">{{ listing.seats }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Section:</span>
                    <span class="detail-value">{{ listing.section }}</span>
                  </div>
                  <div v-if="listing.notes" class="detail-row">
                    <span class="detail-label">Notes:</span>
                    <span class="detail-value text-muted">{{ listing.notes }}</span>
                  </div>
                </div>

                <!-- Seller Info -->
                <div class="seller-section">
                  <div class="seller-info">
                    <span class="seller-avatar">👤</span>
                    <div class="seller-details">
                      <small class="seller-name">{{ listing.sellerName }}</small>
                      <small class="seller-rating">
                        ⭐ {{ listing.sellerRating }} ({{ listing.sellerReviews }} reviews)
                      </small>
                    </div>
                  </div>
                </div>

                <!-- Price & Action -->
                <div class="price-action">
                  <div class="price-info">
                    <small class="text-muted">Per ticket</small>
                    <div class="listing-price">${{ listing.price }}</div>
                  </div>
                  <button class="btn btn-danger w-100">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state text-center py-5">
          <div class="empty-icon">🎫</div>
          <h5>No listings found</h5>
          <p class="text-muted">Try adjusting your filters or search terms</p>
          <button class="btn btn-primary" @click="resetFilters">Clear Filters</button>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works py-5 bg-light">
      <div class="container-lg">
        <h2 class="section-title mb-5 text-center">How the Resale Marketplace Works</h2>
        <div class="row g-4">
          <div class="col-md-4 text-center">
            <div class="step-icon">1️⃣</div>
            <h5>Browse Listings</h5>
            <p class="text-muted">Search and filter available tickets from verified sellers in your area</p>
          </div>
          <div class="col-md-4 text-center">
            <div class="step-icon">2️⃣</div>
            <h5>Review Details</h5>
            <p class="text-muted">Check seat location, seller ratings, and any special seat features</p>
          </div>
          <div class="col-md-4 text-center">
            <div class="step-icon">3️⃣</div>
            <h5>Purchase Safely</h5>
            <p class="text-muted">Complete your purchase with buyer protection and instant delivery</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Trust & Safety Section -->
    <section class="trust-section py-5">
      <div class="container-lg">
        <div class="row align-items-center">
          <div class="col-lg-6">
            <h2 class="section-title">Why Buy From Our Marketplace?</h2>
            <ul class="benefits-list">
              <li>✅ Verified Sellers & Ratings</li>
              <li>✅ 100% Buyer Protection</li>
              <li>✅ Mobile Tickets Instant Delivery</li>
              <li>✅ Best Price Guarantee</li>
              <li>✅ No Hidden Fees</li>
              <li>✅ 24/7 Customer Support</li>
            </ul>
          </div>
          <div class="col-lg-6">
            <div class="trust-callout">
              <h5>Buy Confidence</h5>
              <p>Every transaction on our marketplace is protected with our Buyer Guarantee. If something goes wrong, we're here to help.</p>
              <router-link to="#" class="link-primary text-decoration-none">
                Learn more about buyer protection →
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const filterQuery = ref('')
const priceFilter = ref('all')
const sortBy = ref('newest')

// Sample resale listings data
const listings = ref([
  {
    id: 1,
    eventName: 'Taylor Swift - The Eras Tour',
    eventType: 'concert',
    eventDate: new Date(2026, 3, 15),
    venue: 'MetLife Stadium, NJ',
    seats: '107, 108',
    section: 'Lower Bowl',
    price: 450,
    condition: 'like-new',
    notes: 'Great view, padded seats',
    sellerName: 'Sarah M.',
    sellerRating: 4.9,
    sellerReviews: 34
  },
  {
    id: 2,
    eventName: 'Lakers vs Celtics - NBA Finals',
    eventType: 'sports',
    eventDate: new Date(2026, 5, 10),
    venue: 'Crypto.com Arena, LA',
    seats: '201, 202',
    section: 'Club Level',
    price: 280,
    condition: 'excellent',
    notes: 'Club access included',
    sellerName: 'John D.',
    sellerRating: 4.8,
    sellerReviews: 28
  },
  {
    id: 3,
    eventName: 'Hamilton - The Musical',
    eventType: 'theater',
    eventDate: new Date(2026, 2, 20),
    venue: 'Richard Rodgers Theatre, NYC',
    seats: '313',
    section: 'Orchestra',
    price: 180,
    condition: 'excellent',
    notes: 'Center orchestra, perfect view',
    sellerName: 'Emma T.',
    sellerRating: 5.0,
    sellerReviews: 52
  },
  {
    id: 4,
    eventName: 'BTS World Tour',
    eventType: 'concert',
    eventDate: new Date(2026, 4, 8),
    venue: 'Madison Square Garden, NYC',
    seats: '405, 406, 407',
    section: 'Upper Mezzanine',
    price: 320,
    condition: 'like-new',
    notes: '',
    sellerName: 'Lisa K.',
    sellerRating: 4.7,
    sellerReviews: 19
  },
  {
    id: 5,
    eventName: 'Ed Sheeran - Subtract Tour',
    eventType: 'concert',
    eventDate: new Date(2026, 6, 22),
    venue: 'Petco Park, San Diego',
    seats: '12, 13, 14, 15',
    section: 'Lower Reserved',
    price: 175,
    condition: 'good',
    notes: 'Side stage view',
    sellerName: 'Michael R.',
    sellerRating: 4.6,
    sellerReviews: 41
  },
  {
    id: 6,
    eventName: 'Washington Commanders vs Dallas Cowboys',
    eventType: 'sports',
    eventDate: new Date(2026, 8, 12),
    venue: 'LumenField, DC',
    seats: '125, 126',
    section: 'Lower Bowl',
    price: 225,
    condition: 'excellent',
    notes: 'Great sightline, new condition',
    sellerName: 'Alex W.',
    sellerRating: 4.9,
    sellerReviews: 67
  },
])

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  }).format(date)
}

const getPriceRange = (price) => {
  if (price < 50) return '0-50'
  if (price < 100) return '50-100'
  if (price < 200) return '100-200'
  return '200+'
}

const filteredListings = computed(() => {
  let filtered = listings.value

  // Filter by search query
  if (filterQuery.value) {
    const query = filterQuery.value.toLowerCase()
    filtered = filtered.filter(l => 
      l.eventName.toLowerCase().includes(query) ||
      l.venue.toLowerCase().includes(query)
    )
  }

  // Filter by price
  if (priceFilter.value !== 'all') {
    filtered = filtered.filter(l => {
      if (priceFilter.value === '0-50') return l.price < 50
      if (priceFilter.value === '50-100') return l.price >= 50 && l.price < 100
      if (priceFilter.value === '100-200') return l.price >= 100 && l.price < 200
      if (priceFilter.value === '200+') return l.price >= 200
      return true
    })
  }

  // Sort
  if (sortBy.value === 'price-low') {
    filtered.sort((a, b) => a.price - b.price)
  } else if (sortBy.value === 'price-high') {
    filtered.sort((a, b) => b.price - a.price)
  } else if (sortBy.value === 'popular') {
    filtered.sort((a, b) => b.sellerReviews - a.sellerReviews)
  }

  return filtered
})

const activeFiltersCount = computed(() => {
  let count = 0
  if (filterQuery.value) count++
  if (priceFilter.value !== 'all') count++
  if (sortBy.value !== 'newest') count++
  return count
})

const resetFilters = () => {
  filterQuery.value = ''
  priceFilter.value = 'all'
  sortBy.value = 'newest'
}
</script>

<style scoped>
.marketplace {
  background: #fff;
}

/* Header Section */
.marketplace-header {
  /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */

  background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), 
              url('/resell.jpg') center/cover no-repeat;

  color: white;
  padding: 120px 20px;
  text-align: center;
}

.header-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 15px;
}

.header-subtitle {
  font-size: 1.2rem;
  opacity: 0.95;
  margin: 0;
}

/* Search & Filter */
.search-filter-section {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.form-label.fw-500 {
  font-weight: 500;
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 6px;
}

.form-control,
.form-select {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 0.95rem;
}

.form-control:focus,
.form-select:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* Listings Grid */
.listings-section {
  background: #f8f9fa;
}

.listings-info {
  font-size: 0.95rem;
}

.listing-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.listing-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-4px);
}

.listing-image {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.event-emoji {
  font-size: 60px;
  z-index: 1;
  position: relative;
}

.condition-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  z-index: 2;
}

.condition-badge.excellent {
  color: #28a745;
  background: #e8f5e9;
}

.condition-badge.like-new {
  color: #17a2b8;
  background: #e0f7fa;
}

.condition-badge.good {
  color: #ff9800;
  background: #fff3e0;
}

.listing-body {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.event-section {
  margin-bottom: 16px;
}

.event-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 10px 0;
  line-height: 1.3;
}

.event-date,
.event-venue {
  font-size: 0.9rem;
  color: #666;
  margin: 6px 0;
}

/* Ticket Details */
.ticket-details {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 500;
  color: #555;
}

.detail-value {
  color: #333;
  text-align: right;
}

/* Seller Info */
.seller-section {
  border-top: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
  padding: 12px 0;
  margin-bottom: 12px;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.seller-avatar {
  font-size: 28px;
}

.seller-details {
  display: flex;
  flex-direction: column;
}

.seller-name {
  font-weight: 600;
  color: #2c3e50;
  display: block;
}

.seller-rating {
  color: #666;
  display: block;
  margin-top: 2px;
}

/* Price & Action */
.price-action {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

.price-info {
  text-align: center;
  margin-bottom: 12px;
}

.price-info small {
  display: block;
  font-size: 0.85rem;
}

.listing-price {
  font-size: 1.8rem;
  font-weight: 700;
  color: #ff3b30;
  margin-top: 4px;
}

.price-action .btn {
  font-weight: 600;
  padding: 10px;
}

/* Empty State */
.empty-state {
  color: #999;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
  opacity: 0.7;
}

.empty-state h5 {
  color: #666;
  margin-bottom: 10px;
}

/* How It Works */
.how-it-works {
  background: #f8f9fa;
}

.step-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.how-it-works h5 {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 10px;
}

/* Trust Section */
.trust-section {
  background: white;
}

.section-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 2rem 0;
}

.benefits-list li {
  padding: 12px 0;
  font-size: 1.05rem;
  color: #333;
  font-weight: 500;
}

.trust-callout {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  border-radius: 12px;
}

.trust-callout h5 {
  font-size: 1.5rem;
  margin-bottom: 15px;
  font-weight: 700;
}

.trust-callout p {
  font-size: 1rem;
  margin-bottom: 20px;
  opacity: 0.95;
}

.trust-callout .link-primary {
  color: white !important;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .header-title {
    font-size: 1.8rem;
  }

  .search-filter-section {
    position: static;
  }

  .listing-price {
    font-size: 1.5rem;
  }

  .section-title {
    font-size: 1.5rem;
  }
}
</style>
