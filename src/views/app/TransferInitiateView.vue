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

const listingIdInput = ref((route.query.listingId as string) || '')
const loading = ref(false)
const errorMsg = ref('')
const listingDetails = ref<MarketplaceListing | null>(null)
const detailsLoading = ref(false)

const fetchListingDetails = async (id: string) => {
  if (!id) return
  detailsLoading.value = true
  try {
    if (isDemoMode()) {
      listingDetails.value = mockListings.find(listing => listing.listingId === id) ?? null
      return
    }
    const response = await api.get('/marketplace', { params: { page: 1, limit: 100 } })
    const items: MarketplaceListing[] = response.data?.data?.listings ?? []
    listingDetails.value = items.find(listing => listing.listingId === id) ?? null
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
      router.push('/transfer/demo-transfer-001')
      return
    }
    const { data } = await api.post('/transfer/initiate', { listingId: id })
    const transferId = data?.data?.transferId
    toast.push('Transfer initiated. Waiting for seller to accept.', 'success', 3200)
    if (transferId) router.push(`/transfer/${transferId}`)
  } catch (e: any) {
    const code = e?.response?.data?.error?.code || e?.response?.data?.error_code
    const status = e?.response?.status
    if (status === 404 || code === 'LISTING_NOT_FOUND') errorMsg.value = 'Listing not found or no longer available.'
    else if (status === 402 || code === 'INSUFFICIENT_CREDITS') errorMsg.value = 'Insufficient credits. Please top up your balance.'
    else if (status === 403 || code === 'AUTH_FORBIDDEN') errorMsg.value = "You can't purchase your own listing."
    else errorMsg.value = e?.response?.data?.error?.message || 'Transfer initiation failed.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const id = route.query.listingId as string
  if (id) fetchListingDetails(id)
})
</script>

<template>
  <section class="page">
    <div class="auth-shell transfer-shell">
      <article class="glass auth-card">
        <span class="badge">Transfer Initiation</span>
        <div>
          <h1 class="section-title">Start a protected purchase transfer.</h1>
          <p class="section-subtitle">Confirm the listing you want to buy, then we’ll notify the seller and begin the OTP flow.</p>
        </div>

        <div v-if="detailsLoading" class="small muted">Loading listing details...</div>
        <article v-else-if="listingDetails" class="panel preview-card">
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
            <strong class="price-highlight">${{ listingDetails.price }}</strong>
          </div>
          <div class="preview-row">
            <span class="preview-label">Status</span>
            <span class="badge">{{ listingDetails.status }}</span>
          </div>
        </article>

        <form class="auth-form" @submit.prevent="initiateTransfer">
          <div>
            <label>Listing ID</label>
            <input v-model="listingIdInput" placeholder="e.g. lst_001" />
          </div>

          <p v-if="errorMsg" class="field-error">{{ errorMsg }}</p>

          <button :disabled="loading || !listingIdInput.trim()" type="submit">
            {{ loading ? 'Initiating...' : 'Continue' }}
          </button>
        </form>

        <p class="small muted">Credits stay protected until the seller accepts and both sides complete OTP verification.</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.transfer-shell {
  width: min(640px, 100%);
}

.preview-card {
  padding: 1rem;
  display: grid;
  gap: 0.45rem;
}

.preview-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.25rem 0;
}

.preview-label {
  color: var(--textMuted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.price-highlight {
  color: var(--primarySoft);
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
}
</style>
