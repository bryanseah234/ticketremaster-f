<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { isDemoMode } from '@/services/mockData'

const route = useRoute()
const toast = useToast()
const auth = useAuthStore()

const transfer = ref<any>(null)
const otp = ref('')
const loading = ref(false)
const resendLoading = ref(false)
const showSuccessBanner = ref(false)
const otpError = ref('')
const otpAttempts = ref(0)
const rateLimited = ref(false)
const rateLimitCountdown = ref(0)

const status = computed(() => transfer.value?.status || 'pending_seller_acceptance')
const isSeller = computed(() => (auth.state.user ? transfer.value?.sellerId === auth.state.user.userId : false))
const role = computed(() => (isSeller.value ? 'seller' : 'buyer'))
const countdownFormatted = computed(() => `${String(Math.floor(rateLimitCountdown.value / 60)).padStart(2, '0')}:${String(rateLimitCountdown.value % 60).padStart(2, '0')}`)

const steps = computed(() =>
  isSeller.value
    ? [
        { key: 'pending_seller_acceptance', label: 'Accept request' },
        { key: 'pending_buyer_otp', label: 'Buyer verifies' },
        { key: 'pending_seller_otp', label: 'Your OTP' },
        { key: 'completed', label: 'Complete' },
      ]
    : [
        { key: 'pending_seller_acceptance', label: 'Request sent' },
        { key: 'pending_buyer_otp', label: 'Your OTP' },
        { key: 'pending_seller_otp', label: 'Seller verifies' },
        { key: 'completed', label: 'Complete' },
      ],
)

const stepIndex = computed(() => {
  const index = steps.value.findIndex((step) => step.key === status.value)
  return index === -1 ? 0 : index
})

const loadTransfer = async () => {
  if (isDemoMode()) {
    transfer.value = {
      status: 'pending_seller_acceptance',
      transferId: route.params.transferId,
      creditAmount: 180,
      eventName: 'Afterlight: Echoes of Eternity',
      eventDate: '2026-04-13T20:00:00Z',
      seatRow: 'A',
      seatNumber: 2,
      venueName: 'Singapore Indoor Stadium',
    }
    return
  }
  try {
    const { data } = await api.get(`/transfer/${route.params.transferId}`)
    const raw = data?.data || data || null
    if (raw) {
      transfer.value = {
        ...raw,
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
        status: 'pending_seller_acceptance',
        transferId: route.params.transferId,
        creditAmount: 180,
        eventName: 'Afterlight: Echoes of Eternity',
        eventDate: '2026-04-13T20:00:00Z',
        seatRow: 'A',
        seatNumber: 2,
        venueName: 'Singapore Indoor Stadium',
      }
    }
  }
}

const handleRateLimit = () => {
  rateLimited.value = true
  rateLimitCountdown.value = 900
}

const acceptTransfer = async () => {
  loading.value = true
  try {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      transfer.value = { ...transfer.value, status: 'pending_buyer_otp' }
      toast.push('Request accepted. OTP sent to buyer.', 'success', 3200)
      return
    }
    const { data } = await api.post(`/transfer/${route.params.transferId}/seller-accept`)
    transfer.value = { ...transfer.value, ...(data?.data || {}), status: data?.data?.status || 'pending_buyer_otp' }
    toast.push('Request accepted. OTP sent to buyer.', 'success', 3200)
  } catch (error: any) {
    toast.push(error?.response?.data?.error?.message || 'Could not accept transfer.', 'error', 3200)
  } finally {
    loading.value = false
  }
}

const rejectTransfer = async () => {
  loading.value = true
  try {
    await api.post(`/transfer/${route.params.transferId}/seller-reject`)
    transfer.value = { ...transfer.value, status: 'cancelled' }
    toast.push('Transfer rejected.', 'info', 3200)
  } catch (error: any) {
    toast.push(error?.response?.data?.error?.message || 'Could not reject transfer.', 'error', 3200)
  } finally {
    loading.value = false
  }
}

const verifyOtp = async (mode: 'buyer' | 'seller') => {
  if (rateLimited.value) return
  loading.value = true
  otpError.value = ''
  try {
    if (isDemoMode()) {
      if (otp.value.length < 6) {
        otpError.value = 'Enter a 6-digit OTP.'
        return
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
      transfer.value =
        mode === 'buyer'
          ? { ...transfer.value, status: 'pending_seller_otp' }
          : { ...transfer.value, status: 'completed', completedAt: new Date().toISOString() }
      otp.value = ''
      otpAttempts.value = 0
      showSuccessBanner.value = mode === 'seller'
      toast.push(mode === 'buyer' ? 'OTP verified. Waiting for seller.' : 'Transfer complete!', 'success', 3200)
      return
    }

    const endpoint = mode === 'buyer' ? 'buyer-verify' : 'seller-verify'
    const { data } = await api.post(`/transfer/${route.params.transferId}/${endpoint}`, { otp: otp.value })
    transfer.value =
      mode === 'buyer'
        ? { ...transfer.value, ...(data?.data || {}), status: data?.data?.status || 'pending_seller_otp' }
        : { ...transfer.value, ...(data?.data || {}), status: 'completed', completedAt: data?.data?.completedAt || new Date().toISOString() }
    otp.value = ''
    otpAttempts.value = 0
    showSuccessBanner.value = mode === 'seller'
    toast.push(mode === 'buyer' ? 'OTP verified. Waiting for seller.' : 'Transfer complete!', 'success', 3200)
  } catch (error: any) {
    if (error?.response?.status === 429) {
      handleRateLimit()
      otpError.value = 'Too many attempts. Please wait 15 minutes before trying again.'
    } else {
      otpAttempts.value++
      otp.value = ''
      otpError.value = error?.response?.data?.error?.message || 'Incorrect OTP. Please try again.'
    }
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
let countdownTimer: number | undefined

onMounted(async () => {
  await loadTransfer()
  pollTimer = window.setInterval(async () => {
    if (['completed', 'failed', 'cancelled', 'expired'].includes(status.value)) {
      clearInterval(pollTimer)
      return
    }
    await loadTransfer()
  }, 5000)

  countdownTimer = window.setInterval(() => {
    if (rateLimited.value && rateLimitCountdown.value > 0) {
      rateLimitCountdown.value--
    } else if (rateLimited.value && rateLimitCountdown.value <= 0) {
      rateLimited.value = false
    }
  }, 1000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
  clearInterval(countdownTimer)
})
</script>

<template>
  <section class="transfer-page">
    <div v-if="showSuccessBanner" class="success-banner">
      <span>Ticket successfully transferred.</span>
      <RouterLink to="/tickets"><button>View Tickets</button></RouterLink>
    </div>

    <header class="transfer-header">
      <span class="eyebrow">Transfer Ledger</span>
      <h1>Incoming Transfer</h1>
    </header>

    <div class="transfer-layout">
      <article class="preview-card panel">
        <div class="preview-image"></div>
        <div class="preview-copy">
          <span class="preview-badge">VIP Access</span>
          <h2>{{ transfer?.eventName || 'Afterlight: Echoes of Eternity' }}</h2>
          <div class="preview-grid">
            <div><span class="meta-label">Role</span><strong>{{ role }}</strong></div>
            <div><span class="meta-label">Date</span><strong>{{ transfer?.eventDate ? new Date(transfer.eventDate).toLocaleDateString('en-SG') : 'TBA' }}</strong></div>
            <div><span class="meta-label">Venue</span><strong>{{ transfer?.venueName || 'Venue TBA' }}</strong></div>
            <div><span class="meta-label">Seat</span><strong>{{ transfer?.seatRow && transfer?.seatNumber ? `Row ${transfer.seatRow} • Seat ${transfer.seatNumber}` : 'Assigned' }}</strong></div>
          </div>
        </div>
      </article>

      <article class="action-card panel">
        <div class="step-row">
          <div v-for="(step, index) in steps" :key="step.key" class="step-item">
            <span class="step-dot" :class="{ active: stepIndex === index, done: stepIndex > index }">{{ stepIndex > index ? '✓' : index + 1 }}</span>
            <small>{{ step.label }}</small>
          </div>
        </div>

        <template v-if="status === 'pending_seller_acceptance' && isSeller">
          <h3>Review the transfer request.</h3>
          <p class="muted">This transfer is irreversible once accepted and verified by both parties.</p>
          <div class="actions">
            <button :disabled="loading" @click="acceptTransfer">{{ loading ? 'Processing...' : 'Accept Transfer' }}</button>
            <button class="secondary" :disabled="loading" @click="rejectTransfer">Decline</button>
          </div>
        </template>

        <template v-else-if="status === 'pending_seller_acceptance'">
          <h3>Request sent to seller.</h3>
          <p class="muted">We’ll update this page as soon as the seller accepts the transfer.</p>
        </template>

        <template v-else-if="status === 'pending_buyer_otp' || status === 'pending_seller_otp'">
          <h3>Verify transfer</h3>
          <p class="muted">Enter the 6-digit security code sent to your registered device.</p>

          <div v-if="rateLimited" class="warning-box">Too many attempts. Try again in <strong>{{ countdownFormatted }}</strong>.</div>

          <div v-else class="otp-shell">
            <input v-model="otp" maxlength="6" inputmode="numeric" placeholder="123456" @keyup.enter="verifyOtp(status === 'pending_buyer_otp' ? 'buyer' : 'seller')" />
            <button :disabled="loading || otp.length < 6" @click="verifyOtp(status === 'pending_buyer_otp' ? 'buyer' : 'seller')">
              {{ loading ? 'Verifying...' : 'Verify & Complete' }}
            </button>
          </div>

          <p v-if="otpError" class="error-text">{{ otpError }}</p>
          <button v-if="!rateLimited" class="secondary" :disabled="resendLoading" @click="resendOtp">
            {{ resendLoading ? 'Sending...' : 'Resend Code' }}
          </button>
        </template>

        <template v-else-if="status === 'completed'">
          <h3>Transfer complete.</h3>
          <p class="muted">The transfer has been verified and settled successfully.</p>
          <div class="summary-box">
            <div><span class="meta-label">Credits</span><strong>SGD {{ transfer?.creditAmount ?? '0.00' }}</strong></div>
            <div><span class="meta-label">Transfer ID</span><strong>{{ route.params.transferId }}</strong></div>
          </div>
          <RouterLink :to="isSeller ? '/marketplace' : '/tickets'"><button>{{ isSeller ? 'Back to Marketplace' : 'View Tickets' }}</button></RouterLink>
        </template>

        <template v-else>
          <h3>Transfer {{ status }}.</h3>
          <p class="muted">This transfer is no longer active.</p>
          <RouterLink to="/marketplace"><button class="secondary">Back to Marketplace</button></RouterLink>
        </template>
      </article>
    </div>
  </section>
</template>

<style scoped>
.transfer-page, .transfer-header { display: grid; gap: 1rem; }
.transfer-header h1 {
  margin: 0; font-family: var(--font-display); font-size: clamp(2.8rem, 6vw, 4.8rem); line-height: .95; letter-spacing: -.05em;
}
.eyebrow, .meta-label {
  font-size: .7rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase;
}
.eyebrow { color: var(--primary); }
.meta-label { color: var(--text-dim); display: block; margin-bottom: .35rem; }
.transfer-layout { display: grid; grid-template-columns: minmax(0,1fr) minmax(21rem,.95fr); gap: 1.25rem; }
.preview-card, .action-card { display: grid; gap: 1rem; overflow: hidden; }
.preview-image {
  min-height: 18rem; border-radius: 1.25rem;
  background: linear-gradient(180deg, rgba(249,115,22,.18), rgba(0,0,0,.3)), url('https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80') center/cover;
}
.preview-copy h2 {
  margin: 0; font-family: var(--font-display); font-size: clamp(2rem, 4vw, 3.1rem); line-height: .96; letter-spacing: -.04em;
}
.preview-badge, .status-pill {
  width: fit-content; padding: .45rem .75rem; border-radius: 999px; background: rgba(249,115,22,.14);
  color: var(--primary); font-size: .68rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
}
.preview-grid, .summary-box { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1rem; }
.preview-grid strong, .summary-box strong { display: block; }
.step-row { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: .75rem; }
.step-item { display: grid; gap: .45rem; justify-items: center; text-align: center; }
.step-item small { color: var(--text-muted); font-size: .74rem; }
.step-dot {
  width: 2rem; height: 2rem; display: grid; place-items: center; border-radius: 999px;
  border: 1px solid rgba(255,255,255,.08); color: var(--text-muted); background: rgba(255,255,255,.03); font-weight: 700;
}
.step-dot.active { border-color: rgba(249,115,22,.5); color: var(--primary); background: rgba(249,115,22,.12); }
.step-dot.done { border-color: rgba(249,115,22,.5); color: #111; background: var(--primary); }
.action-card h3 { margin: 0; font-size: 1.5rem; }
.muted { margin: 0; color: var(--text-muted); line-height: 1.7; }
.actions, .otp-shell { display: flex; gap: .75rem; flex-wrap: wrap; }
.otp-shell input { flex: 1 1 12rem; letter-spacing: .2em; text-align: center; font-size: 1.2rem; }
.warning-box, .summary-box {
  padding: 1rem; border-radius: 1rem; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.05);
}
.warning-box { color: #f6a94d; }
.error-text { margin: 0; color: #ff8f84; }
.success-banner {
  position: fixed; right: 1.5rem; bottom: 1.5rem; z-index: 20; display: flex; gap: .75rem; align-items: center;
  padding: .9rem 1rem; border-radius: 1rem; background: rgba(50,210,122,.16); border: 1px solid rgba(50,210,122,.22);
}
@media (max-width: 900px) {
  .transfer-layout, .preview-grid, .summary-box, .step-row { grid-template-columns: 1fr; }
}
</style>
