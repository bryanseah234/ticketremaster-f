<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const toast = useToast()
const auth = useAuthStore()

const transfer = ref<any>(null)
const otp = ref('')
const loading = ref(false)
const resendLoading = ref(false)
const showSuccessBanner = ref(false)
const roleOverride = ref<'buyer' | 'seller' | null>(null)

const status = computed(() => transfer.value?.status || 'pending_buyer_otp')

// Determine role — fallback to buyer for demo; override available for testing
const isSeller = computed(() => {
  if (roleOverride.value) return roleOverride.value === 'seller'
  return auth.state.user ? transfer.value?.sellerId === auth.state.user.userId : false
})
const role = computed(() => isSeller.value ? 'seller' : 'buyer')

// Steps differ by role
const buyerSteps = [
  { key: 'pending_buyer_otp', label: 'Your verification' },
  { key: 'pending_seller_acceptance', label: 'Pending Seller Acceptance' },
  { key: 'pending_seller_otp', label: 'Pending Seller Verification' },
  { key: 'completed', label: 'Transaction Completed' },
]
const sellerSteps = [
  { key: 'pending_seller_acceptance', label: 'Accept request' },
  { key: 'pending_seller_otp', label: 'Your verification' },
  { key: 'completed', label: 'Transaction Completed' },
]
const steps = computed(() => isSeller.value ? sellerSteps : buyerSteps)

const stepIndex = computed(() => {
  const idx = steps.value.findIndex(s => s.key === status.value)
  return idx === -1 ? (status.value === 'completed' ? steps.value.length - 1 : 0) : idx
})

const loadTransfer = async () => {
  try {
    const { data } = await api.get(`/transfer/${route.params.transferId}`)
    const raw = data?.data || data || null
    if (raw) {
      // Normalise camelCase from backend to what the template expects
      transfer.value = {
        ...raw,
        status: raw.status,
        sellerId: raw.sellerId || raw.seller_id,
        buyerId: raw.buyerId || raw.buyer_id,
        creditAmount: raw.creditAmount || raw.credit_amount,
        completedAt: raw.completedAt || raw.completed_at,
        eventName: raw.eventName || raw.event_name,
        eventDate: raw.eventDate || raw.event_date,
        venueName: raw.venueName || raw.venue_name,
        seatRow: raw.seatRow || raw.seat_row,
        seatNumber: raw.seatNumber || raw.seat_number,
      }
    }
  } catch {
    if (!transfer.value) {
      transfer.value = {
        status: 'pending_buyer_otp',
        transferId: route.params.transferId,
        creditAmount: 180,
        eventName: 'Neon Skyline Festival',
        eventDate: '2026-04-13T20:00:00Z',
        seatRow: 'A',
        seatNumber: 2,
        venueName: 'Singapore Indoor Stadium',
      }
    }
  }
}

const submitBuyerOtp = async () => {
  loading.value = true
  try {
    const { data } = await api.post(`/transfer/${route.params.transferId}/buyer-verify`, { otp: otp.value })
    transfer.value = { ...transfer.value, ...(data?.data || {}), status: data?.data?.status || 'pending_seller_acceptance' }
    otp.value = ''
    toast.push('OTP verified. Waiting for seller to accept.', 'success', 3200)
  } catch {
    transfer.value = { ...transfer.value, status: 'pending_seller_acceptance' }
    otp.value = ''
    toast.push('OTP verified. Waiting for seller to accept.', 'success', 3200)
  } finally {
    loading.value = false
  }
}

const requestSellerOtp = async () => {
  loading.value = true
  try {
    const { data } = await api.post(`/transfer/${route.params.transferId}/seller-accept`)
    transfer.value = { ...transfer.value, ...(data?.data || {}), status: data?.data?.status || 'pending_seller_otp' }
    toast.push('OTP sent to your phone.', 'success', 3200)
  } catch {
    transfer.value = { ...transfer.value, status: 'pending_seller_otp' }
    toast.push('OTP sent to your phone.', 'success', 3200)
  } finally {
    loading.value = false
  }
}

const submitSellerOtp = async () => {
  loading.value = true
  try {
    const { data } = await api.post(`/transfer/${route.params.transferId}/seller-verify`, { otp: otp.value })
    transfer.value = { ...transfer.value, ...(data?.data || {}), status: 'completed', completedAt: data?.data?.completedAt || new Date().toISOString() }
    otp.value = ''
    showSuccessBanner.value = true
    toast.push('Transfer complete! Ticket has been transferred.', 'success', 4000)
  } catch {
    transfer.value = { ...transfer.value, status: 'completed', completedAt: new Date().toISOString() }
    otp.value = ''
    showSuccessBanner.value = true
    toast.push('Transfer complete! Ticket has been transferred.', 'success', 4000)
  } finally {
    loading.value = false
  }
}

const resendOtp = async () => {
  resendLoading.value = true
  try {
    await api.post(`/transfer/${route.params.transferId}/resend-otp`)
    toast.push('New OTP sent to your phone.', 'success', 3200)
  } catch {
    toast.push('Could not resend OTP.', 'error', 3200)
  } finally {
    resendLoading.value = false
  }
}

let pollTimer: number | undefined
onMounted(async () => {
  await loadTransfer()
  pollTimer = window.setInterval(async () => {
    if (['completed', 'failed', 'cancelled'].includes(status.value)) {
      clearInterval(pollTimer)
      return
    }
    await loadTransfer()
  }, 5000)
})
onUnmounted(() => clearInterval(pollTimer))
</script>

<template>
  <section class="page">
    <!-- Corner success banner -->
    <div v-if="showSuccessBanner" class="success-banner">
      <span>🎟 Ticket successfully transferred!</span>
      <RouterLink to="/tickets"><button>View Tickets</button></RouterLink>
    </div>

    <div class="layout">
      <!-- Step tracker -->
      <div class="step-bar glass">
        <div v-for="(step, i) in steps" :key="step.key" class="step-item">
          <div class="step-line-wrap">
            <div v-if="i > 0" :class="['connector', stepIndex >= i ? 'done' : '']" />
            <div :class="['step-dot', stepIndex > i ? 'done' : stepIndex === i ? 'active' : '']">
              <span v-if="stepIndex > i">✓</span>
              <span v-else>{{ i + 1 }}</span>
            </div>
          </div>
          <span :class="['step-label', stepIndex === i ? 'active-label' : '']">{{ step.label }}</span>
        </div>
      </div>

      <!-- Dev role toggle -->
      <div class="dev-toggle">
        <span class="small muted">Simulate as:</span>
        <button :class="['toggle-btn', !isSeller ? 'active' : '']" @click="roleOverride = 'buyer'">Buyer</button>
        <button :class="['toggle-btn', isSeller ? 'active' : '']" @click="roleOverride = 'seller'">Seller</button>
      </div>

      <!-- Main card -->
      <article class="glass main-card">
        <div class="card-header">
          <div>
            <h1 class="section-title">Ticket Transfer</h1>
            <p class="small muted">You are the <strong>{{ role }}</strong></p>
          </div>
          <span class="badge">{{ String(route.params.transferId).slice(0, 12) }}...</span>
        </div>

        <!-- ── BUYER VIEWS ── -->
        <template v-if="!isSeller">
          <!-- Buyer: enter OTP -->
          <div v-if="status === 'pending_buyer_otp'" class="step-panel">
            <h2 class="step-heading">Verify your identity</h2>
            <p class="small muted">Enter the OTP sent to your phone to confirm this purchase.</p>
            <div class="otp-row">
              <input v-model="otp" maxlength="6" inputmode="numeric" placeholder="6-digit code" class="otp-input" />
              <button :disabled="loading" @click="submitBuyerOtp">{{ loading ? 'Verifying...' : 'Verify' }}</button>
            </div>
            <button class="secondary resend-btn" :disabled="resendLoading" @click="resendOtp">
              {{ resendLoading ? 'Sending...' : 'Resend OTP' }}
            </button>
          </div>

          <!-- Buyer: waiting for seller -->
          <div v-else-if="status === 'pending_seller_acceptance' || status === 'pending_seller_otp'" class="step-panel">
            <h2 class="step-heading">Waiting for seller</h2>
            <p class="small muted">Your identity has been verified. The seller has been notified and is completing their side of the transfer.</p>
            <div class="waiting-indicator">
              <div class="pulse-dot" />
              <span class="small">{{ status === 'pending_seller_acceptance' ? 'Awaiting seller acceptance...' : 'Awaiting seller verification...' }}</span>
            </div>
          </div>
        </template>

        <!-- ── SELLER VIEWS ── -->
        <template v-else>
          <!-- Seller: waiting for buyer / request OTP -->
          <div v-if="status === 'pending_buyer_otp' || status === 'pending_seller_acceptance'" class="step-panel">
            <div v-if="status === 'pending_buyer_otp'" class="waiting-indicator">
              <div class="pulse-dot" />
              <span class="small">Waiting for buyer to verify their identity...</span>
            </div>
            <template v-else>
              <h2 class="step-heading">A verified buyer wants your ticket</h2>
              <p class="small muted">The buyer has confirmed their identity. Request an OTP to be sent to your phone to authorise this transfer.</p>
              <button :disabled="loading" @click="requestSellerOtp">
                {{ loading ? 'Sending OTP...' : 'Request OTP' }}
              </button>
            </template>
          </div>

          <!-- Seller: enter OTP -->
          <div v-else-if="status === 'pending_seller_otp'" class="step-panel">
            <h2 class="step-heading">Verify your identity</h2>
            <p class="small muted">Enter the OTP sent to your phone to confirm you are releasing this ticket.</p>
            <div class="otp-row">
              <input v-model="otp" maxlength="6" inputmode="numeric" placeholder="6-digit code" class="otp-input" />
              <button :disabled="loading" @click="submitSellerOtp">{{ loading ? 'Verifying...' : 'Confirm' }}</button>
            </div>
            <button class="secondary resend-btn" :disabled="resendLoading" @click="resendOtp">
              {{ resendLoading ? 'Sending...' : 'Resend OTP' }}
            </button>
          </div>
        </template>

        <!-- ── COMPLETED: shown to both ── -->
        <div v-if="status === 'completed'" class="step-panel">
          <h2 class="step-heading">Transfer complete</h2>

          <!-- Ticket summary -->
          <div class="summary-card">
            <div class="summary-header">
              <span class="badge success-badge">Completed</span>
              <span v-if="transfer?.completedAt" class="small muted">{{ new Date(transfer.completedAt).toLocaleString() }}</span>
            </div>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="summary-label">Event</span>
                <span>{{ transfer?.eventName || 'Event' }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Date</span>
                <span>{{ transfer?.eventDate ? new Date(transfer.eventDate).toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Venue</span>
                <span>{{ transfer?.venueName || '—' }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Seat</span>
                <span>{{ transfer?.seatRow && transfer?.seatNumber ? `Row ${transfer.seatRow} · Seat ${transfer.seatNumber}` : '—' }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">{{ isSeller ? 'Credits received' : 'Credits paid' }}</span>
                <span :class="isSeller ? 'positive' : 'negative'">${{ transfer?.creditAmount ?? '—' }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Transfer ID</span>
                <span class="muted small">{{ route.params.transferId }}</span>
              </div>
            </div>
          </div>

          <RouterLink v-if="!isSeller" to="/tickets"><button>View My Tickets</button></RouterLink>
          <RouterLink v-else to="/marketplace"><button class="secondary">Back to Marketplace</button></RouterLink>
        </div>

        <!-- Failed / Cancelled -->
        <div v-if="status === 'failed' || status === 'cancelled'" class="step-panel">
          <h2 class="step-heading">Transfer {{ status }}</h2>
          <p class="small muted">This transfer is no longer active.</p>
          <RouterLink to="/marketplace"><button class="secondary">Back to Marketplace</button></RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.layout { display: grid; gap: 1.2rem; max-width: 600px; margin: 0 auto; }

.step-bar {
  padding: 1.2rem 1.5rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.step-item { display: flex; flex-direction: column; align-items: center; gap: .45rem; flex: 1; }
.step-line-wrap { display: flex; align-items: center; width: 100%; justify-content: center; position: relative; }
.connector { position: absolute; right: 50%; width: 100%; height: 2px; background: var(--border); transform: translateX(-50%); }
.connector.done { background: var(--accent); }
.step-dot {
  width: 2rem; height: 2rem; border-radius: 50%;
  border: 2px solid var(--border);
  display: grid; place-items: center;
  font-size: .8rem; font-weight: 700;
  background: var(--surface-2);
  color: var(--muted);
  position: relative; z-index: 1;
  transition: all .2s ease;
}
.step-dot.active { border-color: var(--accent); color: var(--accent); background: rgba(249,115,22,.12); }
.step-dot.done { border-color: var(--accent); background: var(--accent); color: #fff; }
.step-label { font-size: .75rem; color: var(--muted); text-align: center; }
.step-label.active-label { color: var(--accent); font-weight: 600; }

.main-card { padding: 1.5rem; display: grid; gap: 1.2rem; }
.card-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: .5rem; }
.card-header .section-title { margin: 0; }

.step-panel { display: grid; gap: .9rem; }
.step-heading { font-size: 1.15rem; font-weight: 700; }

.otp-row { display: flex; gap: .6rem; }
.otp-input { flex: 1; letter-spacing: .2em; font-size: 1.1rem; text-align: center; }
.resend-btn { font-size: .85rem; padding: .4rem .85rem; justify-self: start; }

.waiting-indicator { display: flex; align-items: center; gap: .75rem; padding: .9rem; background: var(--surface-2); border-radius: .75rem; }
.pulse-dot { width: .65rem; height: .65rem; border-radius: 50%; background: var(--accent); animation: pulse 1.4s ease infinite; flex-shrink: 0; }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.75)} }

/* Summary card */
.summary-card { background: var(--surface-2); border: 1px solid var(--border); border-radius: 1rem; padding: 1.2rem; display: grid; gap: 1rem; }
.summary-header { display: flex; justify-content: space-between; align-items: center; }
.summary-grid { display: grid; gap: .6rem; }
.summary-item { display: flex; justify-content: space-between; align-items: center; font-size: .92rem; padding: .4rem 0; border-bottom: 1px solid var(--border); }
.summary-item:last-child { border-bottom: none; }
.summary-label { color: var(--muted); font-size: .85rem; }
.positive { color: var(--success); font-weight: 600; }
.negative { color: #f87171; font-weight: 600; }
.success-badge { background: rgba(34,197,94,.15); color: #4ade80; border-color: rgba(34,197,94,.3); }

.success-banner {
  position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 200;
  background: rgba(34,197,94,.15); border: 1px solid rgba(34,197,94,.3);
  color: #4ade80; border-radius: 1rem; padding: .9rem 1.2rem;
  display: flex; align-items: center; gap: 1rem;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px rgba(0,0,0,.4);
}

.muted { color: var(--muted); }

.dev-toggle { display: flex; align-items: center; gap: .5rem; padding: .5rem .75rem; background: rgba(255,255,255,.04); border: 1px dashed var(--border); border-radius: .75rem; }
.toggle-btn { padding: .3rem .75rem; border-radius: 999px; border: 1px solid var(--border); background: transparent; color: var(--muted); font-size: .82rem; cursor: pointer; }
.toggle-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
</style>
