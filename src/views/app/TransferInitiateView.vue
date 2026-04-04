<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { isDemoMode, mockListings } from '@/services/mockData'
import type { MarketplaceListing } from '@/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// listingId can come from query param or manual input
const listingIdInput = ref((route.query.listingId as string) || '')
const loading = ref(false)
const errorMsg = ref('')

// Listing details (shown when listingId is pre-filled via query param)
const listingDetails = ref<MarketplaceListing | null>(null)
const detailsLoading = ref(false)

const fetchListingDetails = async (id: string) => {
  if (!id) return
  detailsLoading.value = true
  try {
    if (isDemoMode()) {
      const found = mockListings.find(l => l.listingId === id) ?? null
      listingDetails.value = found
      return
    }
    const res = await api.get('/marketplace', { params: { page: 1, limit: 100 } })
    const items: MarketplaceListing[] = res.data?.data?.listings ?? []
    listingDetails.value = items.find(l => l.listingId === id) ?? null
  } catch {
    listingDetails.value = null
  } finally {
    detailsLoading.value = false
  }
}

const initiateTransfer = async () => {
  const id = listingIdInput.value.trim()
  if (!id) {
    errorMsg.value = 'Please enter a listing ID.'
    return
  }
  errorMsg.value = ''
  loading.value = true

  try {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.push('Transfer initiated (demo mode).', 'success', 3200)
      router.push(`/transfer/demo-transfer-001`)
      return
    }

    const { data } = await api.post('/transfer/initiate', { listingId: id })
    const transferId = data?.data?.transferId
    toast.push('Transfer initiated. Waiting for seller to accept.', 'success', 3200)
    if (transferId) {
      router.push(`/transfer/${transferId}`)
    }
  } catch (e: any) {
    const code = e?.response?.data?.error?.code || e?.response?.data?.error_code
    const status = e?.response?.status
    if (status === 404 || code === 'LISTING_NOT_FOUND') {
      errorMsg.value = 'Listing not found or no longer available.'
    } else if (status === 402 || code === 'INSUFFICIENT_CREDITS') {
      errorMsg.value = 'Insufficient credits. Please top up your balance.'
    } else if (status === 403 || code === 'AUTH_FORBIDDEN') {
      errorMsg.value = "You can't purchase your own listing."
    } else {
      errorMsg.value = e?.response?.data?.error?.message || 'Transfer initiation failed.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const qId = route.query.listingId as string
  if (qId) fetchListingDetails(qId)
})
</script>

<template>
  <section class="page" style="max-width:560px;">
    <article class="glass initiate-card">
      <h1 class="section-title">Buy Ticket</h1>
      <p class="section-subtitle">Initiate a transfer from a marketplace listing.</p>

      <!-- Listing details preview (when listingId provided via query) -->
      <div v-if="detailsLoading" class="detail-skeleton small muted">Loading listing details...</div>
      <div v-else-if="listingDetails" class="listing-preview glass-inner">
        <div class="preview-row">
          <span class="preview-label">Event</span>
          <span>{{ listingDetails.event?.name || '—' }}</span>
        </div>
        <div class="preview-row">
          <span class="preview-label">Date</span>
          <span>{{ listingDetails.event?.date ? new Date(listingDetails.event.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }}</span>
        </div>
        <div class="preview-row">
          <span class="preview-label">Price</span>
          <span class="price-highlight">${{ listingDetails.price }}</span>
        </div>
        <div class="preview-row">
          <span class="preview-label">Seller</span>
          <span>{{ listingDetails.sellerName || listingDetails.sellerId.slice(0, 8) + '...' }}</span>
        </div>
        <div class="preview-row">
          <span class="preview-label">Status</span>
          <span :class="['status-pill', listingDetails.status === 'active' ? 'active' : 'inactive']">{{ listingDetails.status }}</span>
        </div>
      </div>

      <!-- Listing ID input -->
      <div>
        <label>Listing ID</label>
        <input
          v-model="listingIdInput"
          placeholder="e.g. lst_001"
          :disabled="loading"
          @keyup.enter="initiateTransfer"
        />
      </div>

      <!-- Error message -->
      <p v-if="errorMsg" class="error-msg small">{{ errorMsg }}</p>

      <button :disabled="loading || !listingIdInput.trim()" @click="initiateTransfer">
        {{ loading ? 'Initiating...' : 'Buy Now' }}
      </button>

      <p class="small muted hint">
        Credits will be held until the seller accepts and both parties verify via OTP.
      </p>
    </article>
  </section>
</template>

<style scoped>
.initiate-card { padding: 1.5rem; display: grid; gap: 1rem; }

.listing-preview {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: .85rem;
  padding: 1rem;
  display: grid;
  gap: .5rem;
}
.preview-row { display: flex; justify-content: space-between; align-items: center; font-size: .9rem; padding: .3rem 0; border-bottom: 1px solid var(--border); }
.preview-row:last-child { border-bottom: none; }
.preview-label { color: var(--muted); font-size: .82rem; }
.price-highlight { font-weight: 700; color: var(--accent); font-size: 1rem; }

.status-pill { font-size: .78rem; padding: .2rem .55rem; border-radius: 999px; font-weight: 600; }
.status-pill.active { background: rgba(34,197,94,.12); color: var(--success); }
.status-pill.inactive { background: rgba(113,113,122,.12); color: var(--disabled); }

.error-msg { color: #f87171; margin: 0; }
.hint { margin: 0; }
.detail-skeleton { padding: .5rem 0; }
</style>
