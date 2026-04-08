<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { TagIcon } from '@heroicons/vue/24/outline'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { isDemoMode, mockTickets } from '@/services/mockData'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Seller listing flow (Transfer Ticket button passes ticketId)
const ticketId = computed(() => (route.query.ticketId as string) || '')
const price = ref<number | ''>('')
const loading = ref(false)
const errorMsg = ref('')
const ticketInfo = ref<any>(null)

const loadTicket = async () => {
  if (!ticketId.value) return
  if (isDemoMode()) {
    ticketInfo.value = mockTickets.find(t => t.ticketId === ticketId.value) || null
    return
  }
  try {
    const { data } = await api.get(`/tickets/${ticketId.value}`)
    ticketInfo.value = data?.data || null
  } catch {
    ticketInfo.value = null
  }
}

const confirmListing = async () => {
  if (!price.value || Number(price.value) <= 0) {
    errorMsg.value = 'Please enter a valid listing price.'
    return
  }
  errorMsg.value = ''
  loading.value = true
  try {
    if (isDemoMode()) {
      await new Promise(resolve => setTimeout(resolve, 900))
      toast.push('Ticket listed on the marketplace.', 'success', 3200)
      router.push('/tickets')
      return
    }
    await api.post('/marketplace/list', { ticketId: ticketId.value, price: Number(price.value) })
    toast.push('Ticket listed on the marketplace.', 'success', 3200)
    router.push('/tickets')
  } catch (e: any) {
    const code = e?.response?.data?.error?.code
    const status = e?.response?.status
    if (status === 409 || code === 'ALREADY_LISTED') errorMsg.value = 'This ticket is already listed.'
    else if (status === 403) errorMsg.value = 'You do not own this ticket.'
    else errorMsg.value = e?.response?.data?.error?.message || 'Could not list ticket. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(loadTicket)
</script>

<template>
  <section class="page">
    <div class="listing-shell">
      <article class="glass listing-card">

        <div class="card-eyebrow">
          <TagIcon class="eyebrow-icon" />
          <span>List Ticket for Sale</span>
        </div>

        <div class="card-copy">
          <h1>Set your listing price.</h1>
          <p class="muted">Your ticket will appear on the marketplace. Credits are held in escrow until both sides complete OTP verification.</p>
        </div>

        <!-- Ticket context -->
        <div v-if="ticketInfo" class="ticket-preview">
          <div class="preview-row">
            <span class="preview-label">Event</span>
            <span>{{ ticketInfo.event?.name || '—' }}</span>
          </div>
          <div v-if="ticketInfo.event?.date" class="preview-row">
            <span class="preview-label">Date</span>
            <span>{{ new Date(ticketInfo.event.date).toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
          </div>
          <div v-if="ticketInfo.seat" class="preview-row">
            <span class="preview-label">Seat</span>
            <span>{{ ticketInfo.seat.section ? `${ticketInfo.seat.section} · ` : '' }}Row {{ ticketInfo.seat.rowNumber }} · Seat {{ ticketInfo.seat.seatNumber }}</span>
          </div>
          <div class="preview-row">
            <span class="preview-label">Original price</span>
            <span>${{ ticketInfo.price ?? '—' }}</span>
          </div>
        </div>

        <!-- Price input -->
        <div class="price-field">
          <label>Listing Price (SGD)</label>
          <div class="price-input-wrap">
            <span class="price-prefix">$</span>
            <input
              v-model.number="price"
              type="number"
              min="1"
              step="0.01"
              placeholder="0.00"
              class="price-input"
              @input="errorMsg = ''"
            />
          </div>
        </div>

        <p v-if="errorMsg" class="field-error">{{ errorMsg }}</p>

        <button
          class="confirm-btn"
          :disabled="loading || !price || Number(price) <= 0"
          @click="confirmListing"
        >
          {{ loading ? 'Listing...' : 'Confirm Listing' }}
        </button>

        <RouterLink to="/tickets" class="cancel-link">Cancel</RouterLink>

      </article>
    </div>
  </section>
</template>

<style scoped>
.listing-shell {
  width: min(560px, 100%);
  margin: 0 auto;
}

.listing-card {
  padding: 1.75rem;
  display: grid;
  gap: 1.25rem;
}

.card-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.2);
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  width: fit-content;
}

.eyebrow-icon {
  width: 0.85rem;
  height: 0.85rem;
}

.card-copy h1 {
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  margin: 0 0 0.4rem;
}

.card-copy p {
  margin: 0;
  line-height: 1.6;
  font-size: 0.9rem;
}

.ticket-preview {
  display: grid;
  gap: 0.3rem;
  padding: 1rem;
  border-radius: 0.9rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
}

.preview-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  font-size: 0.88rem;
  padding: 0.2rem 0;
}

.preview-label {
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.price-field {
  display: grid;
  gap: 0.5rem;
}

.price-field label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
}

.price-input-wrap {
  display: flex;
  align-items: center;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  padding: 0 1rem;
  transition: border-color 0.15s;
}

.price-input-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.12);
}

.price-prefix {
  color: var(--accent);
  font-weight: 700;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.price-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.9rem 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.price-input:focus {
  outline: none;
  box-shadow: none;
}

.confirm-btn {
  width: 100%;
  padding-block: 0.95rem;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--accent) 0%, #ff7a23 100%);
  border: none;
  color: #fff;
  font-weight: 800;
  font-size: 1rem;
  box-shadow: 0 10px 28px rgba(249, 115, 22, 0.25);
  transition: opacity 0.15s, transform 0.15s;
}

.confirm-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.cancel-link {
  text-align: center;
  font-size: 0.85rem;
  color: var(--muted);
  text-decoration: none;
}

.cancel-link:hover {
  color: var(--text);
}

.field-error {
  color: #f87171;
  font-size: 0.85rem;
  margin: 0;
}

.muted { color: var(--muted); }
</style>
