<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  BoltIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { isDemoMode } from '@/services/mockData'
import AccountSidebar from '@/components/account/AccountSidebar.vue'

const FALLBACK_TRANSFER_IMAGE =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=1400&auto=format&fit=crop'

const route = useRoute()
const toast = useToast()
const auth = useAuthStore()

const transfer = ref<any>(null)
const otp = ref('')
const loading = ref(false)
const resendLoading = ref(false)
const otpError = ref('')
const rateLimited = ref(false)
const rateLimitCountdown = ref(0)
const otpInput = ref<HTMLInputElement | null>(null)

const status = computed(() => transfer.value?.status || 'pending_seller_acceptance')
const isSeller = computed(() => (auth.state.user ? transfer.value?.sellerId === auth.state.user.userId : false))
const isOtpStage = computed(() => status.value === 'pending_buyer_otp' || status.value === 'pending_seller_otp')
const verifyMode = computed<'buyer' | 'seller'>(() => (status.value === 'pending_seller_otp' ? 'seller' : 'buyer'))
const countdownFormatted = computed(
  () =>
    `${String(Math.floor(rateLimitCountdown.value / 60)).padStart(2, '0')}:${String(rateLimitCountdown.value % 60).padStart(2, '0')}`,
)
const otpDigits = computed(() => otp.value.padEnd(6, ' ').slice(0, 6).split(''))
const eventPoster = computed(() => transfer.value?.eventImage || transfer.value?.image || FALLBACK_TRANSFER_IMAGE)

const verifyCopy = computed(() =>
  verifyMode.value === 'buyer'
    ? 'To protect your assets, please enter the 6-digit security code sent to your registered mobile device.'
    : 'The buyer has confirmed. Enter your 6-digit seller code to finalize the transfer and settle the ledger.',
)
const canCancelTransfer = computed(() => {
  if (!auth.isLoggedIn) return false
  if (status.value === 'pending_seller_acceptance') return !isSeller.value
  return status.value === 'pending_buyer_otp' || status.value === 'pending_seller_otp'
})

const loadTransfer = async () => {
  if (isDemoMode()) {
    const baseTransfer = {
      transferId: route.params.transferId,
      status: 'pending_seller_acceptance',
      creditAmount: 180,
      sellerId: 'demo-seller-001',
      sellerName: 'Julian Vane',
      buyerId: auth.state.user?.userId ?? 'demo-user-001',
      eventName: 'Afterlife: Echoes of Eternity',
      eventDate: '2026-10-24T22:00:00Z',
      venueName: 'The Obsidian Dome',
      seatRow: '12',
      seatNumber: 'GA Floor',
      location: 'The Obsidian Dome',
      eventImage: FALLBACK_TRANSFER_IMAGE,
    }
    transfer.value = {
      ...baseTransfer,
      ...(transfer.value || {}),
      status: transfer.value?.status || baseTransfer.status,
      completedAt: transfer.value?.completedAt,
    }
    return
  }

  try {
    const { data } = await api.get(`/transfer/${route.params.transferId}`)
    const raw = data?.data || data || null
    if (!raw) return

    transfer.value = {
      ...raw,
      sellerId: raw.sellerId || raw.seller_id,
      buyerId: raw.buyerId || raw.buyer_id,
      sellerName: raw.sellerName || raw.seller_name || 'Seller',
      creditAmount: raw.creditAmount || raw.credit_amount,
      completedAt: raw.completedAt || raw.completed_at,
      eventName: raw.eventName || raw.event_name,
      eventDate: raw.eventDate || raw.event_date,
      venueName: raw.venueName || raw.venue_name,
      seatRow: raw.seatRow || raw.seat_row,
      seatNumber: raw.seatNumber || raw.seat_number,
      location: raw.location || raw.venueName || raw.venue_name,
      eventImage: raw.eventImage || raw.event_image || raw.image,
    }
  } catch {
    if (!transfer.value) {
      transfer.value = {
        transferId: route.params.transferId,
        status: 'pending_seller_acceptance',
        creditAmount: 180,
        sellerId: 'demo-seller-001',
        sellerName: 'Julian Vane',
        buyerId: auth.state.user?.userId ?? 'demo-user-001',
        eventName: 'Afterlife: Echoes of Eternity',
        eventDate: '2026-10-24T22:00:00Z',
        venueName: 'The Obsidian Dome',
        seatRow: '12',
        seatNumber: 'GA Floor',
        location: 'The Obsidian Dome',
        eventImage: FALLBACK_TRANSFER_IMAGE,
      }
    }
  }
}

const acceptTransfer = async () => {
  loading.value = true
  try {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 900))
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
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      transfer.value = { ...transfer.value, status: 'cancelled' }
      toast.push('Transfer rejected.', 'info', 3200)
      return
    }

    await api.post(`/transfer/${route.params.transferId}/seller-reject`)
    transfer.value = { ...transfer.value, status: 'cancelled' }
    toast.push('Transfer rejected.', 'info', 3200)
  } catch (error: any) {
    toast.push(error?.response?.data?.error?.message || 'Could not reject transfer.', 'error', 3200)
  } finally {
    loading.value = false
  }
}

const handleRateLimit = () => {
  rateLimited.value = true
  rateLimitCountdown.value = 900
}

const handleOtpInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6)
  otp.value = value
}

const focusOtpInput = () => {
  otpInput.value?.focus()
}

const verifyOtp = async () => {
  if (rateLimited.value) return

  loading.value = true
  otpError.value = ''
  try {
    if (otp.value.length < 6) {
      otpError.value = 'Enter a 6-digit OTP.'
      return
    }

    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 900))
      transfer.value =
        verifyMode.value === 'buyer'
          ? { ...transfer.value, status: 'pending_seller_otp' }
          : { ...transfer.value, status: 'completed', completedAt: new Date().toISOString() }
      otp.value = ''
      toast.push(verifyMode.value === 'buyer' ? 'OTP verified. Waiting for seller.' : 'Transfer complete!', 'success', 3200)
      return
    }

    const endpoint = verifyMode.value === 'buyer' ? 'buyer-verify' : 'seller-verify'
    const { data } = await api.post(`/transfer/${route.params.transferId}/${endpoint}`, { otp: otp.value })
    transfer.value =
      verifyMode.value === 'buyer'
        ? { ...transfer.value, ...(data?.data || {}), status: data?.data?.status || 'pending_seller_otp' }
        : { ...transfer.value, ...(data?.data || {}), status: 'completed', completedAt: data?.data?.completedAt || new Date().toISOString() }
    otp.value = ''
    toast.push(verifyMode.value === 'buyer' ? 'OTP verified. Waiting for seller.' : 'Transfer complete!', 'success', 3200)
  } catch (error: any) {
    if (error?.response?.status === 429) {
      handleRateLimit()
      otpError.value = 'Too many attempts. Please wait 15 minutes before trying again.'
    } else {
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
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.push('A new demo code is ready.', 'success', 2800)
      return
    }

    await api.post(`/transfer/${route.params.transferId}/resend-otp`)
    toast.push('New OTP sent to your phone.', 'success', 3200)
  } catch {
    toast.push('Could not resend OTP.', 'error', 3200)
  } finally {
    resendLoading.value = false
  }
}

const cancelTransfer = async () => {
  loading.value = true
  otpError.value = ''
  try {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      transfer.value = { ...transfer.value, status: 'cancelled' }
      toast.push('Transfer cancelled.', 'info', 3200)
      return
    }

    await api.post(`/transfer/${route.params.transferId}/cancel`)
    transfer.value = { ...transfer.value, status: 'cancelled' }
    toast.push('Transfer cancelled.', 'info', 3200)
  } catch (error: any) {
    otpError.value = error?.response?.data?.error?.message || 'Could not cancel transfer.'
    toast.push(otpError.value, 'error', 3200)
  } finally {
    loading.value = false
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
  <section class="page transfer-page">
    <header class="transfer-header">
      <h1 v-if="isOtpStage">Ticket <span>Transfer</span></h1>
      <h1 v-else>Incoming Transfer</h1>
    </header>

    <div v-if="isOtpStage" class="otp-layout">
      <AccountSidebar active-key="tickets" />

      <div class="otp-main">
        <article class="glass otp-card">
          <p class="otp-copy">{{ verifyCopy }}</p>

          <div v-if="rateLimited" class="warning-box">
            Too many attempts. Try again in <strong>{{ countdownFormatted }}</strong>.
          </div>

          <div v-else class="otp-grid" @click="focusOtpInput">
            <input
              ref="otpInput"
              class="otp-hidden-input"
              :value="otp"
              maxlength="6"
              inputmode="numeric"
              autocomplete="one-time-code"
              @input="handleOtpInput"
              @keyup.enter="verifyOtp"
            />
            <span v-for="(digit, index) in otpDigits" :key="index" class="otp-box">{{ digit }}</span>
          </div>

          <button class="otp-submit" :disabled="loading || otp.length < 6 || rateLimited" @click="verifyOtp">
            {{ loading ? 'Verifying...' : 'Verify & Complete' }}
          </button>

          <p v-if="otpError" class="error-text">{{ otpError }}</p>

          <div class="resend-block">
            <p>Didn’t receive the code?</p>
            <button class="resend-link" type="button" :disabled="resendLoading || rateLimited" @click="resendOtp">
              {{ resendLoading ? 'Sending...' : 'Resend Code' }}
            </button>
          </div>

          <button v-if="canCancelTransfer" class="secondary cancel-transfer-button" type="button" :disabled="loading" @click="cancelTransfer">
            {{ loading ? 'Cancelling...' : 'Cancel Transfer' }}
          </button>
        </article>

        <div class="trust-grid">
          <article class="glass trust-card">
            <div class="trust-icon">
              <ShieldCheckIcon class="mini-icon" />
            </div>
            <div>
              <span>Encrypted</span>
              <strong>End-to-end secure transfer</strong>
            </div>
          </article>

          <article class="glass trust-card">
            <div class="trust-icon">
              <BoltIcon class="mini-icon" />
            </div>
            <div>
              <span>Instant</span>
              <strong>Tickets delivered immediately</strong>
            </div>
          </article>
        </div>
      </div>
    </div>

    <div v-else class="accept-layout">
      <article class="glass accept-card">
        <div class="accept-media" :style="{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.65)), url(${eventPoster})` }">
          <div class="accept-overlay">
            <span class="accept-badge">VIP Access</span>
            <h2>{{ transfer?.eventName || 'Afterlife: Echoes of Eternity' }}</h2>
          </div>
        </div>

        <div class="accept-body">
          <div class="info-grid">
            <div>
              <span>Sender</span>
              <strong>{{ transfer?.sellerName || 'Julian Vane' }}</strong>
            </div>
            <div>
              <span>Date &amp; Time</span>
              <strong>{{ transfer?.eventDate ? new Date(transfer.eventDate).toLocaleString('en-SG', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'TBA' }}</strong>
            </div>
            <div>
              <span>Location</span>
              <strong>{{ transfer?.location || transfer?.venueName || 'The Obsidian Dome' }}</strong>
            </div>
            <div>
              <span>Section / Row</span>
              <strong>{{ transfer?.seatNumber && transfer?.seatRow ? `${transfer.seatNumber} • Row ${transfer.seatRow}` : 'Assigned' }}</strong>
            </div>
          </div>

          <div class="authenticity-box">
            <ShieldCheckIcon class="mini-icon" />
            <div>
              <strong>Authenticity Guaranteed</strong>
              <p>This ticket has been digitally verified via the Remaster Ledger. Transfer is irreversible once accepted.</p>
            </div>
          </div>

          <template v-if="status === 'pending_seller_acceptance' && isSeller">
            <button class="accept-button" :disabled="loading" @click="acceptTransfer">
              {{ loading ? 'Processing...' : 'Accept Transfer' }}
            </button>
            <button class="decline-button" :disabled="loading" type="button" @click="rejectTransfer">Decline Transfer</button>
          </template>

          <template v-else-if="status === 'pending_seller_acceptance'">
            <p class="accept-note">The request has been submitted. We’ll update this page the moment the seller accepts the transfer.</p>
            <button v-if="canCancelTransfer" class="secondary" :disabled="loading" type="button" @click="cancelTransfer">
              {{ loading ? 'Cancelling...' : 'Cancel Request' }}
            </button>
          </template>

          <template v-else-if="status === 'completed'">
            <div class="completion-box">
              <strong>Transfer complete.</strong>
              <p>The transfer has been verified and settled successfully.</p>
              <div class="completion-grid">
                <div>
                  <span>Credits</span>
                  <strong>${{ Number(transfer?.creditAmount || 0).toFixed(2) }}</strong>
                </div>
                <div>
                  <span>Transfer ID</span>
                  <strong>{{ route.params.transferId }}</strong>
                </div>
              </div>
            </div>
            <RouterLink :to="isSeller ? '/marketplace' : '/tickets'">
              <button type="button">{{ isSeller ? 'Back to Marketplace' : 'View Tickets' }}</button>
            </RouterLink>
          </template>

          <template v-else>
            <div class="completion-box">
              <strong>Transfer {{ status }}.</strong>
              <p>This transfer is no longer active.</p>
            </div>
            <RouterLink to="/marketplace">
              <button class="secondary" type="button">Back to Marketplace</button>
            </RouterLink>
          </template>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.transfer-page {
  display: grid;
  gap: 1.5rem;
}

.transfer-header {
  text-align: center;
}

.transfer-header h1 {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: clamp(2.8rem, 8vw, 4.8rem);
  font-weight: 800;
  letter-spacing: -0.08em;
}

.transfer-header span {
  color: var(--primary);
}

.otp-layout {
  display: grid;
  grid-template-columns: var(--account-sidebar-width) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.otp-main {
  display: grid;
  gap: 1.4rem;
  justify-items: center;
}

.otp-card,
.trust-card,
.accept-card {
  border-radius: 1.55rem;
  background: rgba(34, 31, 30, 0.84);
  border-color: rgba(255, 255, 255, 0.06);
}

.otp-card {
  width: min(100%, 33rem);
  display: grid;
  gap: 1rem;
  padding: 1.8rem 1.6rem;
  text-align: center;
}

.otp-copy {
  color: var(--textMuted);
  font-size: 0.9rem;
  line-height: 1.6;
}

.otp-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.65rem;
}

.otp-hidden-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.otp-box {
  display: grid;
  place-items: center;
  height: 4.5rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--primary);
  font-size: 1.5rem;
  font-weight: 800;
}

.otp-submit {
  width: 100%;
  border-radius: 999px;
  padding-block: 0.95rem;
}

.cancel-transfer-button {
  width: 100%;
}

.warning-box,
.completion-box {
  padding: 1rem 1.05rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.warning-box {
  color: #f6b15d;
}

.error-text {
  margin: 0;
  color: #ff8f84;
}

.resend-block {
  display: grid;
  gap: 0.2rem;
  justify-items: center;
}

.resend-block p {
  color: var(--textMuted);
  font-size: 0.84rem;
}

.resend-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--primary);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.resend-link:hover {
  transform: none;
  filter: none;
}

.trust-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  width: min(100%, 33rem);
}

.trust-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem 1.1rem;
}

.trust-icon,
.authenticity-box .mini-icon {
  color: var(--primary);
}

.trust-card span {
  display: block;
  color: var(--textMuted);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.trust-card strong {
  font-size: 0.92rem;
}

.mini-icon {
  width: 1rem;
  height: 1rem;
}

.accept-layout {
  display: grid;
  justify-content: center;
}

.accept-card {
  width: min(100%, 33rem);
  overflow: hidden;
}

.accept-media {
  min-height: 17rem;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
}

.accept-overlay {
  width: 100%;
  padding: 1.35rem 1.3rem;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.72));
}

.accept-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.32rem 0.65rem;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.18);
  color: var(--primarySoft);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.accept-overlay h2 {
  margin-top: 0.75rem;
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: clamp(2rem, 5vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.06em;
}

.accept-body {
  display: grid;
  gap: 1rem;
  padding: 1.35rem 1.3rem 1.45rem;
}

.info-grid,
.completion-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.info-grid span,
.completion-grid span {
  display: block;
  color: rgba(255, 255, 255, 0.52);
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.info-grid strong,
.completion-grid strong {
  display: block;
  margin-top: 0.3rem;
  font-size: 0.95rem;
}

.authenticity-box {
  display: flex;
  gap: 0.85rem;
  padding: 1rem;
  border-radius: 1rem;
  background: rgba(0, 0, 0, 0.36);
}

.authenticity-box strong {
  display: block;
  margin-bottom: 0.25rem;
}

.authenticity-box p,
.accept-note,
.completion-box p {
  margin: 0;
  color: var(--textMuted);
  font-size: 0.82rem;
  line-height: 1.55;
}

.accept-button {
  width: 100%;
  border-radius: 0.9rem;
  padding-block: 0.95rem;
}

.decline-button {
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.83rem;
  font-weight: 500;
}

.decline-button:hover {
  transform: none;
  filter: none;
  color: #fff;
}

@media (max-width: 980px) {
  .otp-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .trust-grid,
  .info-grid,
  .completion-grid {
    grid-template-columns: 1fr;
  }
}
</style>
