<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ArrowRightIcon,
  BoltIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { isDemoMode } from '@/services/mockData'
import { resolveEventImage } from '@/utils/eventMedia'

const FALLBACK_TRANSFER_IMAGE =
  '/stitch-media/transfer/accept-card.jpg'
const TRANSFER_CONTEXT_KEY_PREFIX = 'transfer_context:'
const SILENT_BACKGROUND_REQUEST = { suppressErrorToast: true, suppressErrorLog: true } as any

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

const status = computed(() => transfer.value?.status || 'pending_buyer_otp')
const isBuyer = computed(() => (auth.state.user ? transfer.value?.buyerId === auth.state.user.userId : false))
const isSeller = computed(() => (auth.state.user ? transfer.value?.sellerId === auth.state.user.userId : false))
const isBuyerOtpExplicitlyBlocked = computed(
  () =>
    status.value === 'pending_buyer_otp' &&
    transfer.value?.buyerVerificationSid === null,
)
const isBuyerOtpReady = computed(
  () =>
    status.value === 'pending_buyer_otp' &&
    !isBuyerOtpExplicitlyBlocked.value,
)
const isSellerOtpExplicitlyBlocked = computed(
  () =>
    status.value === 'pending_seller_otp' &&
    (transfer.value?.buyerOtpVerified === false || transfer.value?.sellerVerificationSid === null),
)
const isSellerOtpReady = computed(
  () =>
    status.value === 'pending_seller_otp' &&
    !isSellerOtpExplicitlyBlocked.value,
)
const isSellerOtpTurn = computed(() => isSellerOtpReady.value && isSeller.value)
const isBuyerOtpTurn = computed(() => isBuyerOtpReady.value && isBuyer.value)
const isOtpStage = computed(() => isSellerOtpTurn.value || isBuyerOtpTurn.value)
const verifyMode = computed<'buyer' | 'seller'>(() => (isSellerOtpTurn.value ? 'seller' : 'buyer'))
const isWaitingForCounterparty = computed(
  () =>
    (status.value === 'pending_seller_otp' && !isSellerOtpTurn.value) ||
    (status.value === 'pending_buyer_otp' && !isBuyerOtpTurn.value),
)
const countdownFormatted = computed(
  () =>
    `${String(Math.floor(rateLimitCountdown.value / 60)).padStart(2, '0')}:${String(rateLimitCountdown.value % 60).padStart(2, '0')}`,
)
const otpDigits = computed(() => otp.value.padEnd(6, ' ').slice(0, 6).split(''))
const activeDigitIndex = computed(() => Math.min(otp.value.length, 5))
const eventPoster = computed(() =>
  resolveEventImage({
    image: transfer.value?.eventImage,
    eventId: transfer.value?.eventId,
    type: transfer.value?.eventType,
    context: 'ticket',
  }) || FALLBACK_TRANSFER_IMAGE,
)
const displayEventName = computed(() => transfer.value?.eventName || 'Transfer request')
const displaySellerName = computed(() => transfer.value?.sellerName || 'Pending seller')
const displayLocation = computed(() => transfer.value?.location || transfer.value?.venueName || 'Location unavailable')
const displaySeatLabel = computed(() => {
  if (transfer.value?.seatSection && transfer.value?.seatRow && transfer.value?.seatNumber) {
    return `${transfer.value.seatSection} • Row ${transfer.value.seatRow} • Seat ${transfer.value.seatNumber}`
  }
  if (transfer.value?.seatRow && transfer.value?.seatNumber) {
    return `Seat ${transfer.value.seatNumber} • Row ${transfer.value.seatRow}`
  }
  if (transfer.value?.seatSection) return transfer.value.seatSection
  return 'Seat unavailable'
})

const verifyCopy = computed(() =>
  verifyMode.value === 'buyer'
    ? 'Enter the 6-digit buyer code sent to your phone to confirm the transfer. The seller will be notified after you verify.'
    : 'The buyer has finished verification. Enter your 6-digit seller code to complete this transfer.',
)
const waitingState = computed(() => {
  if (status.value === 'pending_buyer_otp') {
    if (!isBuyerOtpReady.value) {
      return {
        title: 'Preparing buyer verification.',
        body: 'We are still getting the buyer OTP ready for this transfer.',
      }
    }
    return {
      title: 'Waiting for buyer verification.',
      body: 'The buyer still needs to enter their OTP before the seller step can begin.',
    }
  }
  if (status.value === 'pending_seller_otp') {
    if (!isSellerOtpReady.value) {
      return {
        title: 'Waiting for buyer verification.',
        body: 'The buyer must finish OTP verification before seller confirmation becomes available.',
      }
    }
    return {
      title: 'Waiting for seller verification.',
      body: 'The buyer is verified. The seller now needs to enter their OTP to complete the transfer.',
    }
  }
  return {
    title: 'Transfer in progress.',
    body: 'We are waiting for the next verification step.',
  }
})
const verifyButtonLabel = computed(() => (verifyMode.value === 'seller' ? 'Verify & Continue' : 'Verify & Complete'))
const canCancelTransfer = computed(() => {
  if (!auth.isLoggedIn) return false
  if (status.value === 'pending_seller_acceptance') return !isSeller.value
  return status.value === 'pending_buyer_otp' || status.value === 'pending_seller_otp'
})

const transferHeading = computed(() => {
  if (isOtpStage.value || isWaitingForCounterparty.value) return { lead: 'Ticket', accent: 'Transfer' }
  if (status.value === 'pending_seller_acceptance' && isSeller.value) return { lead: 'Incoming Transfer', accent: '' }
  if (status.value === 'pending_seller_acceptance') return { lead: 'Transfer', accent: 'Request' }
  if (status.value === 'completed') return { lead: 'Transfer', accent: 'Complete' }
  return { lead: 'Transfer', accent: 'Status' }
})

const currentTransferId = () => String(route.params.transferId || '')
const transferContextKey = (transferId: string) => `${TRANSFER_CONTEXT_KEY_PREFIX}${transferId}`

const readCachedTransferContext = (transferId: string) => {
  try {
    const raw = sessionStorage.getItem(transferContextKey(transferId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const writeCachedTransferContext = (payload: any) => {
  const transferId = String(payload?.transferId || payload?.transfer_id || currentTransferId())
  if (!transferId) return
  try {
    sessionStorage.setItem(transferContextKey(transferId), JSON.stringify(payload))
  } catch {
    // ignore storage quota/session errors
  }
}

const readTransfers = (responseData: any): any[] => {
  if (Array.isArray(responseData?.data?.transfers)) return responseData.data.transfers
  if (Array.isArray(responseData?.data)) return responseData.data
  if (Array.isArray(responseData?.transfers)) return responseData.transfers
  if (Array.isArray(responseData)) return responseData
  return []
}

const hasTransferVisualContext = (raw: any) =>
  Boolean(
    raw?.event?.name ||
      raw?.eventName ||
      raw?.event_name ||
      raw?.event?.image ||
      raw?.eventImage ||
      raw?.event_image ||
      raw?.event?.date ||
      raw?.eventDate ||
      raw?.event_date ||
      raw?.event?.venue?.name ||
      raw?.venue?.name ||
      raw?.location ||
      raw?.venueName ||
      raw?.venue_name ||
      raw?.seat?.section ||
      raw?.seatSection ||
      raw?.seat_section ||
      raw?.seat?.rowNumber ||
      raw?.seat?.row ||
      raw?.seatRow ||
      raw?.seat_row ||
      raw?.seat?.seatNumber ||
      raw?.seat?.seat ||
      raw?.seatNumber ||
      raw?.seat_number,
  )

const normalizeTransfer = (raw: any) => {
  const existing = transfer.value || {}
  return {
    ...existing,
    ...raw,
    transferId: raw?.transferId || raw?.transfer_id || existing.transferId || currentTransferId(),
    status: raw?.status || existing.status || 'pending_buyer_otp',
    sellerId: raw?.sellerId || raw?.seller_id || existing.sellerId,
    buyerId: raw?.buyerId || raw?.buyer_id || existing.buyerId,
    sellerName: raw?.sellerName || raw?.seller_name || existing.sellerName,
    creditAmount: raw?.creditAmount ?? raw?.credit_amount ?? existing.creditAmount,
    sellerOtpVerified:
      typeof raw?.sellerOtpVerified === 'boolean' ? raw.sellerOtpVerified : existing.sellerOtpVerified,
    buyerOtpVerified:
      typeof raw?.buyerOtpVerified === 'boolean' ? raw.buyerOtpVerified : existing.buyerOtpVerified,
    buyerVerificationSid:
      raw?.buyerVerificationSid !== undefined ? raw.buyerVerificationSid : existing.buyerVerificationSid,
    sellerVerificationSid:
      raw?.sellerVerificationSid !== undefined ? raw.sellerVerificationSid : existing.sellerVerificationSid,
    completedAt: raw?.completedAt || raw?.completed_at || existing.completedAt,
    eventId: raw?.event?.eventId || raw?.event?.id || raw?.eventId || raw?.event_id || existing.eventId,
    eventType: raw?.event?.type || raw?.eventType || raw?.event_type || existing.eventType,
    eventName: raw?.event?.name || raw?.eventName || raw?.event_name || existing.eventName,
    eventDate: raw?.event?.date || raw?.eventDate || raw?.event_date || existing.eventDate,
    eventImage: raw?.event?.image || raw?.eventImage || raw?.event_image || existing.eventImage,
    venueName:
      raw?.event?.venue?.name || raw?.venue?.name || raw?.venueName || raw?.venue_name || existing.venueName,
    location:
      raw?.event?.venue?.name ||
      raw?.venue?.name ||
      raw?.location ||
      raw?.venueName ||
      raw?.venue_name ||
      existing.location,
    seatRow:
      raw?.seat?.rowNumber || raw?.seat?.row || raw?.seat_row || raw?.seatRow || existing.seatRow,
    seatNumber:
      raw?.seat?.seatNumber || raw?.seat?.seat || raw?.seat_number || raw?.seatNumber || existing.seatNumber,
    seatSection:
      raw?.seat?.section || raw?.seatSection || raw?.seat_section || existing.seatSection,
    seatGate:
      raw?.seat?.gate || raw?.seatGate || raw?.seat_gate || existing.seatGate,
  }
}

const applyTransferData = (raw: any) => {
  if (!raw) return
  const normalized = normalizeTransfer(raw)
  transfer.value = normalized
  writeCachedTransferContext(normalized)
}

const fetchTransferFromCollections = async (transferId: string) => {
  const endpoints = ['/transfer/pending', '/transfer/my-pending', '/transfer/history']

  for (const endpoint of endpoints) {
    try {
      const { data } = await api.get(endpoint, SILENT_BACKGROUND_REQUEST)
      const match = readTransfers(data).find((item: any) => {
        const itemId = item?.transferId || item?.transfer_id || item?.id
        return String(itemId || '') === transferId
      })
      if (match) return match
    } catch {
      // continue checking alternate transfer collections
    }
  }

  return null
}

const enrichTransferFromResources = async (raw: any) => {
  let listing = raw?.listing || null
  let ticket = raw?.ticket || null
  let event = raw?.event || null
  let venue = raw?.venue || raw?.event?.venue || null

  try {
    const listingId = raw?.listingId || raw?.listing_id || listing?.listingId
    if (!listing && listingId) {
      const { data } = await api.get(`/marketplace/${listingId}`, SILENT_BACKGROUND_REQUEST)
      listing = data?.data || data || null
    }
  } catch {
    // non-blocking enrichment
  }

  try {
    const ticketId = raw?.ticketId || raw?.ticket_id || ticket?.ticketId || listing?.ticketId
    if (!ticket && ticketId) {
      const { data } = await api.get(`/tickets/${ticketId}`, SILENT_BACKGROUND_REQUEST)
      ticket = data?.data || data || null
    }
  } catch {
    // non-blocking enrichment
  }

  try {
    const eventId =
      raw?.eventId ||
      raw?.event_id ||
      event?.eventId ||
      event?.id ||
      ticket?.event?.eventId ||
      ticket?.eventId ||
      listing?.event?.eventId ||
      listing?.eventId
    if (!event && eventId) {
      const { data } = await api.get(`/events/${eventId}`, SILENT_BACKGROUND_REQUEST)
      event = data?.data || data || null
    }
  } catch {
    // non-blocking enrichment
  }

  try {
    const venueId =
      venue?.venueId ||
      event?.venue?.venueId ||
      event?.venueId ||
      ticket?.venue?.venueId ||
      ticket?.venueId ||
      raw?.venueId ||
      raw?.venue_id
    if (!venue && venueId) {
      const { data } = await api.get(`/venues/${venueId}`, SILENT_BACKGROUND_REQUEST)
      venue = data?.data || data || null
    }
  } catch {
    // non-blocking enrichment
  }

  const mergedEvent = event
    ? {
        ...event,
        venue: event?.venue || venue || ticket?.venue || listing?.event?.venue,
      }
    : listing?.event || ticket?.event || null

  const mergedVenue = mergedEvent?.venue || venue || ticket?.venue || raw?.venue || null
  const mergedSeat = raw?.seat || ticket?.seat || null

  if (!mergedEvent && !mergedVenue && !mergedSeat) return null

  return {
    ...raw,
    event: mergedEvent || raw?.event,
    venue: mergedVenue || raw?.venue,
    seat: mergedSeat || raw?.seat,
    eventId:
      raw?.eventId ||
      raw?.event_id ||
      mergedEvent?.eventId ||
      mergedEvent?.id ||
      listing?.eventId ||
      ticket?.eventId,
    eventType: raw?.eventType || raw?.event_type || mergedEvent?.type || listing?.event?.type || ticket?.event?.type,
    eventName: raw?.eventName || raw?.event_name || mergedEvent?.name,
    eventDate: raw?.eventDate || raw?.event_date || mergedEvent?.date || mergedEvent?.eventDate,
    eventImage: raw?.eventImage || raw?.event_image || mergedEvent?.image || listing?.event?.image || ticket?.event?.image,
    venueName: raw?.venueName || raw?.venue_name || mergedVenue?.name,
    location: raw?.location || mergedVenue?.name,
    seatSection: raw?.seatSection || raw?.seat_section || mergedSeat?.section,
    seatRow: raw?.seatRow || raw?.seat_row || mergedSeat?.rowNumber || mergedSeat?.row,
    seatNumber: raw?.seatNumber || raw?.seat_number || mergedSeat?.seatNumber || mergedSeat?.seat,
    seatGate: raw?.seatGate || raw?.seat_gate || mergedSeat?.gate,
  }
}

const hydrateTransferContext = async (transferId: string, raw: any) => {
  const collectionMatch = await fetchTransferFromCollections(transferId)
  if (collectionMatch && hasTransferVisualContext(collectionMatch)) {
    return collectionMatch
  }

  return enrichTransferFromResources({
    ...raw,
    ...(collectionMatch || {}),
  })
}

const loadTransfer = async () => {
  const transferId = currentTransferId()
  if (isDemoMode()) {
    const baseTransfer = {
      transferId,
      status: 'pending_buyer_otp',
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
    applyTransferData({
      ...baseTransfer,
      ...(transfer.value || {}),
      status: transfer.value?.status || baseTransfer.status,
      completedAt: transfer.value?.completedAt,
    })
    return
  }

  const cachedTransfer = readCachedTransferContext(transferId)
  if (cachedTransfer) applyTransferData(cachedTransfer)

  try {
    const { data } = await api.get(`/transfer/${transferId}`)
    const raw = data?.data || data || null
    if (!raw) return

    applyTransferData(raw)
    if (!hasTransferVisualContext(raw)) {
      const hydrated = await hydrateTransferContext(transferId, raw)
      if (hydrated) applyTransferData(hydrated)
    }
  } catch {
    const hydrated = await hydrateTransferContext(transferId, transfer.value)
    if (hydrated) {
      applyTransferData(hydrated)
      return
    }

    if (!transfer.value) {
      applyTransferData({
        transferId,
        status: 'pending_buyer_otp',
        buyerId: auth.state.user?.userId ?? null,
      })
    }
  }
}

const acceptTransfer = async () => {
  loading.value = true
  try {
    if (isDemoMode()) {
      await new Promise((resolve) => setTimeout(resolve, 900))
      transfer.value = { ...transfer.value, status: 'pending_seller_otp' }
      toast.push('Request accepted. OTP sent to seller.', 'success', 3200)
      return
    }

    const { data } = await api.post(`/transfer/${route.params.transferId}/seller-accept`)
    applyTransferData({ ...(data?.data || {}), status: data?.data?.status || 'pending_seller_otp' })
    toast.push('Request accepted. OTP sent to seller.', 'success', 3200)
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
      applyTransferData({ status: 'cancelled' })
      toast.push('Transfer rejected.', 'info', 3200)
      return
    }

    await api.post(`/transfer/${route.params.transferId}/seller-reject`)
    applyTransferData({ status: 'cancelled' })
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
      applyTransferData(
        verifyMode.value === 'buyer'
          ? { ...transfer.value, buyerOtpVerified: true, status: 'pending_seller_otp' }
          : { ...transfer.value, sellerOtpVerified: true, status: 'completed', completedAt: new Date().toISOString() },
      )
      otp.value = ''
      toast.push(verifyMode.value === 'buyer' ? 'Buyer verified. Waiting for seller.' : 'Transfer complete!', 'success', 3200)
      return
    }

    const endpoint = verifyMode.value === 'seller' ? 'seller-verify' : 'buyer-verify'
    const { data } = await api.post(`/transfer/${route.params.transferId}/${endpoint}`, { otp: otp.value })
    applyTransferData(
      verifyMode.value === 'buyer'
        ? { ...transfer.value, ...(data?.data || {}), status: data?.data?.status || 'pending_seller_otp' }
        : { ...transfer.value, ...(data?.data || {}), status: 'completed', completedAt: data?.data?.completedAt || new Date().toISOString() },
    )
    otp.value = ''
    toast.push(verifyMode.value === 'buyer' ? 'Buyer verified. Waiting for seller.' : 'Transfer complete!', 'success', 3200)
  } catch (error: any) {
    if (error?.response?.status === 429) {
      handleRateLimit()
      otpError.value = 'Too many attempts. Please wait 15 minutes before trying again.'
    } else if (error?.response?.status === 403) {
      otpError.value = 'You are not authorised to verify this transfer. Make sure you are logged in with the correct account.'
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
      applyTransferData({ status: 'cancelled' })
      toast.push('Transfer cancelled.', 'info', 3200)
      return
    }

    await api.post(`/transfer/${route.params.transferId}/cancel`)
    applyTransferData({ status: 'cancelled' })
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
      <h1>
        <span>{{ transferHeading.lead }}</span>
        <span v-if="transferHeading.accent" class="transfer-heading-accent">{{ transferHeading.accent }}</span>
      </h1>
    </header>

    <div v-if="isOtpStage" class="otp-layout">
      <div class="otp-main">
        <article class="glass otp-card">
          <div class="otp-glow" aria-hidden="true"></div>

          <!-- Event context for OTP stage -->
          <div v-if="transfer?.eventName" class="otp-event-context">
            <span class="otp-event-name">{{ transfer.eventName }}</span>
            <span v-if="transfer.seatRow || transfer.seatNumber" class="otp-seat">
              Row {{ transfer.seatRow }} · Seat {{ transfer.seatNumber }}
            </span>
          </div>

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
            <template v-for="(digit, index) in otpDigits" :key="index">
              <span class="otp-box" :class="{ active: index === activeDigitIndex }">{{ digit }}</span>
              <span v-if="index === 2" class="otp-divider" aria-hidden="true">-</span>
            </template>
          </div>

          <button class="otp-submit" :disabled="loading || otp.length < 6 || rateLimited" @click="verifyOtp">
            {{ loading ? 'Verifying...' : verifyButtonLabel }}
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
              <div class="icon-avatar-shell">
                <ShieldCheckIcon class="mini-icon" />
              </div>
            </div>
            <div>
              <span>Encrypted</span>
              <strong>End-to-end secure transfer</strong>
            </div>
          </article>

          <article class="glass trust-card">
            <div class="trust-icon">
              <div class="icon-avatar-shell">
                <BoltIcon class="mini-icon" />
              </div>
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
            <h2>{{ displayEventName }}</h2>
          </div>
        </div>

        <div class="accept-body">
          <div class="info-grid">
            <div>
              <span>Sender</span>
              <strong>{{ displaySellerName }}</strong>
            </div>
            <div>
              <span>Date &amp; Time</span>
              <strong>{{ transfer?.eventDate ? new Date(transfer.eventDate).toLocaleString('en-SG', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'TBA' }}</strong>
            </div>
            <div>
              <span>Location</span>
              <strong>{{ displayLocation }}</strong>
            </div>
            <div>
              <span>Section / Row</span>
              <strong>{{ displaySeatLabel }}</strong>
            </div>
          </div>

          <template v-if="status === 'pending_seller_acceptance' && isSeller">
            <button class="accept-button" style="background: linear-gradient(135deg, #f97316 0%, #ff7a23 100%)" :disabled="loading" @click="acceptTransfer">
              <span>{{ loading ? 'Processing...' : 'Accept Transfer' }}</span>
              <ArrowRightIcon class="btn-arrow-icon" />
            </button>
            <button class="decline-button" style="border: 0; background: transparent;" :disabled="loading" type="button" @click="rejectTransfer">Decline Transfer</button>
          </template>

          <template v-else-if="status === 'pending_seller_acceptance'">
            <div class="completion-box pending-box">
              <strong>Request submitted.</strong>
              <p>The seller still needs to accept this transfer before the seller verification step can begin.</p>
            </div>
            <button v-if="canCancelTransfer" class="secondary accept-secondary-button" :disabled="loading" type="button" @click="cancelTransfer">
              {{ loading ? 'Cancelling...' : 'Cancel Request' }}
            </button>
          </template>

          <template v-else-if="isWaitingForCounterparty">
            <div class="completion-box pending-box">
              <strong>{{ waitingState.title }}</strong>
              <p>{{ waitingState.body }}</p>
            </div>
            <button v-if="canCancelTransfer" class="secondary accept-secondary-button" :disabled="loading" type="button" @click="cancelTransfer">
              {{ loading ? 'Cancelling...' : 'Cancel Transfer' }}
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
  gap: 1.15rem;
}

.transfer-header {
  text-align: center;
}

.transfer-header h1 {
  display: inline-grid;
  gap: 0.1em;
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: clamp(3rem, 7vw, 4.8rem);
  font-weight: 800;
  letter-spacing: -0.07em;
  line-height: 0.94;
}

.transfer-heading-accent {
  color: var(--primary);
}

.otp-layout {
  display: grid;
  justify-items: center;
}

.otp-main {
  display: grid;
  gap: 1.4rem;
  justify-items: center;
  width: 100%;
}

.otp-card,
.trust-card,
.accept-card {
  border-radius: 1.7rem;
  background: rgba(34, 31, 30, 0.84);
  border-color: rgba(255, 255, 255, 0.06);
}

.otp-card {
  width: min(100%, 33rem);
  display: grid;
  gap: 1rem;
  padding: 1.8rem 1.6rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.otp-glow {
  position: absolute;
  top: -6rem;
  right: -6rem;
  width: 12rem;
  height: 12rem;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.10);
  filter: blur(100px);
  pointer-events: none;
}

.otp-event-context {
  display: grid;
  gap: 0.2rem;
  padding: 0.8rem 1rem;
  border-radius: 0.85rem;
  background: rgba(249, 115, 22, 0.06);
  border: 1px solid rgba(249, 115, 22, 0.14);
  text-align: left;
}

.otp-event-name {
  font-weight: 700;
  font-size: 0.95rem;
}

.otp-seat {
  color: var(--textMuted);
  font-size: 0.78rem;
}

.otp-copy {
  color: var(--textMuted);
  font-size: 0.9rem;
  line-height: 1.6;
}

.otp-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  align-items: center;
  width: 100%;
  max-width: 27rem;
  margin-inline: auto;
  isolation: isolate;
}

.otp-hidden-input {
  position: absolute;
  inset: 0;
  width: 100%;
  margin: 0;
  padding: 0;
  color: transparent;
  caret-color: var(--primary);
  cursor: pointer;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-appearance: none;
  appearance: none;
  opacity: 0;
  outline: none;
  font-size: 1.5rem;
  letter-spacing: 0.65rem;
  z-index: 2;
}

.otp-box {
  display: grid;
  place-items: center;
  min-height: 4.35rem;
  border-radius: 0.95rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
    rgba(19, 16, 15, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 8px 20px rgba(0, 0, 0, 0.18);
  color: #f59a52;
  font-size: 1.55rem;
  font-weight: 800;
  line-height: 1;
  text-shadow: none;
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  position: relative;
  z-index: 1;
}

.otp-box.active {
  border-color: rgba(249, 115, 22, 0.68);
  background:
    linear-gradient(180deg, rgba(249, 115, 22, 0.14), rgba(249, 115, 22, 0.05)),
    rgba(24, 18, 16, 0.98);
  box-shadow:
    inset 0 0 0 1px rgba(249, 115, 22, 0.22),
    0 0 0 2px rgba(249, 115, 22, 0.12);
  transform: translateY(-1px);
}

.otp-divider {
  color: rgba(255, 255, 255, 0.26);
  font-size: 1.2rem;
  font-weight: 700;
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
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.trust-icon {
  color: var(--primary);
}

.icon-avatar-shell {
  width: 3rem;
  height: 3rem;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.10);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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
  justify-items: center;
}

.accept-card {
  width: min(100%, 30.5rem);
  overflow: hidden;
}

.accept-media {
  min-height: 14.6rem;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: flex-end;
}

.accept-overlay {
  width: 100%;
  padding: 1.1rem 1.1rem;
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
  margin-top: 0.65rem;
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: clamp(1.8rem, 4.3vw, 2.1rem);
  font-weight: 800;
  letter-spacing: -0.06em;
}

.accept-body {
  display: grid;
  gap: 0.95rem;
  padding: 1.2rem 1.1rem 1.3rem;
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

.accept-note,
.completion-box p {
  margin: 0;
  color: var(--textMuted);
  font-size: 0.82rem;
  line-height: 1.55;
}

.accept-button {
  width: 100%;
  border-radius: 999px;
  padding-block: 1rem;
  background: linear-gradient(135deg, #f97316 0%, #ff7a23 100%);
  box-shadow: 0 10px 30px rgba(249, 115, 22, 0.3);
  border: 0;
  color: #fff;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-arrow-icon {
  width: 1.1rem;
  height: 1.1rem;
  flex-shrink: 0;
}

.decline-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.83rem;
  font-weight: 500;
  text-align: center;
}

.accept-secondary-button {
  width: 100%;
  border-radius: 0.7rem;
}

.pending-box {
  gap: 0.3rem;
}

.pending-box strong {
  display: block;
}

.decline-button:hover {
  transform: none;
  filter: none;
  color: #fff;
}

@media (max-width: 720px) {
  .trust-grid,
  .info-grid,
  .completion-grid {
    grid-template-columns: 1fr;
  }
}
</style>
