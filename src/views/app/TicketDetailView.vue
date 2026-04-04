<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { isDemoMode, mockServices } from '@/services/mockData'
import type { Ticket } from '@/types'

const route = useRoute()
const router = useRouter()
const ticketId = route.params.ticketId as string
const origin = window.location.origin

const ticket = ref<Ticket | null>(null)
const qrData = ref<{ qrHash: string; expiresAt?: string; event?: { name: string; date: string } | null; venue?: { name: string; address?: string } | null } | null>(null)
const blockMessage = ref<string | null>(null)
const countdown = ref(60)
const toast = useToast()
let refreshTimer: number | undefined
let secondTimer: number | undefined

// Derive ticket status from loaded ticket or route query fallback
const ticketStatus = computed(() => ticket.value?.status || (route.query.status as string) || '')

const isActive = computed(() => ticketStatus.value === 'active')

const formatDate = (d?: string) => {
  if (!d) return null
  return new Date(d).toLocaleString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Load ticket details from the tickets list endpoint
const loadTicket = async () => {
  try {
    if (isDemoMode()) {
      const result = await mockServices.getMyTickets()
      ticket.value = result.tickets.find(t => t.ticketId === ticketId) || null
    } else {
      const { data } = await api.get('/tickets')
      const raw: any[] = data?.data?.tickets || data?.data || []
      const found = raw.find((t: any) => t.ticketId === ticketId)
      if (found) {
        ticket.value = {
          ticketId: found.ticketId,
          eventId: found.event?.eventId || found.eventId || '',
          seatId: found.seatId || '',
          ownerId: found.ownerId || '',
          status: found.status,
          price: found.price,
          purchasedAt: found.createdAt || found.purchasedAt || '',
          event: found.event ? {
            eventId: found.event.eventId || '',
            name: found.event.name || '',
            date: found.event.date || found.event.eventDate || '',
            venueId: found.venue?.venueId || '',
            price: found.price || 0,
            type: found.event.type || 'other',
            venue: found.venue ? { venueId: found.venue.venueId, name: found.venue.name } : undefined,
          } : undefined,
          seat: found.seat,
          venue: found.venue ? { venueId: found.venue.venueId, name: found.venue.name } : undefined,
        }
      }
    }
  } catch {
    // Non-fatal — ticket details are supplementary; QR fetch may still work
  }
}

const fetchQr = async (notify = false) => {
  if (blockMessage.value) return
  if (notify) toast.push('Loading ticket QR...', 'info', 1400)

  // Demo mode: show mock QR without calling API
  if (isDemoMode()) {
    qrData.value = { qrHash: `DEMO-QR-${ticketId}` }
    countdown.value = 60
    return
  }

  try {
    const { data } = await api.get(`/tickets/${ticketId}/qr`)
    qrData.value = data?.data
    if (qrData.value?.expiresAt) {
      countdown.value = Math.max(0, Math.floor((new Date(qrData.value.expiresAt).getTime() - Date.now()) / 1000))
    } else {
      countdown.value = 60
    }
    // Enrich ticket from QR response if not already loaded
    if (!ticket.value && qrData.value) {
      const qr = qrData.value as any
      if (qr.event || qr.venue) {
        ticket.value = {
          ticketId,
          eventId: '',
          seatId: '',
          ownerId: '',
          status: 'active',
          purchasedAt: '',
          event: qr.event ? {
            eventId: '',
            name: qr.event.name || '',
            date: qr.event.date || '',
            venueId: '',
            price: 0,
            type: 'other',
          } : undefined,
          venue: qr.venue ? { venueId: '', name: qr.venue.name } : undefined,
        }
      }
    }
  } catch (e: any) {
    if (!e?.response) {
      // Network error — show demo QR
      qrData.value = { qrHash: `DEMO-QR-${ticketId}` }
      countdown.value = 60
      toast.push('Demo QR shown while backend is unavailable.', 'info', 3200)
    } else {
      const code = e?.response?.data?.error?.code
      const status = e?.response?.status
      if (code === 'QR_INVALID') {
        blockMessage.value = 'This ticket is not available for QR (may be listed or transferred).'
      } else {
        const message =
          code === 'AUTH_FORBIDDEN' || status === 403 ? "You don't own this ticket." :
          code === 'TICKET_NOT_FOUND' || status === 404 ? 'Ticket not found.' :
          'Unable to load QR.'
        toast.push(message, 'error', 3200)
      }
    }
  }
}

const refreshQr = () => {
  fetchQr(false)
  countdown.value = 60
}

const goToTransfer = () => {
  router.push(`/transfer/initiate?ticketId=${ticketId}`)
}

const goToList = () => {
  router.push(`/transfer/initiate?ticketId=${ticketId}`)
}

onMounted(async () => {
  // Set block message from route query for immediate feedback
  const qs = (route.query.status as string) || ''
  if (qs === 'listed') blockMessage.value = 'This ticket is listed on the marketplace.'
  else if (qs === 'used') blockMessage.value = 'This ticket has already been used.'
  else if (qs === 'cancelled') blockMessage.value = 'This ticket has been cancelled.'

  await loadTicket()
  await fetchQr(true)

  refreshTimer = window.setInterval(refreshQr, 55000)
  secondTimer = window.setInterval(() => {
    countdown.value = Math.max(0, countdown.value - 1)
    if (countdown.value === 0) refreshQr()
  }, 1000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (secondTimer) clearInterval(secondTimer)
})
</script>

<template>
  <section class="page detail-page">
    <article class="glass detail-card">

      <!-- Ticket Details Header -->
      <div class="detail-header">
        <div class="detail-title-row">
          <h1 class="section-title">{{ ticket?.event?.name || 'Ticket Details' }}</h1>
          <StatusBadge v-if="ticketStatus" :label="ticketStatus" />
        </div>
        <div v-if="ticket?.event?.date" class="detail-meta">
          <svg viewBox="0 0 24 24" class="meta-icon"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <span>{{ formatDate(ticket.event.date) }}</span>
        </div>
        <div v-if="ticket?.venue?.name" class="detail-meta">
          <svg viewBox="0 0 24 24" class="meta-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>{{ ticket.venue.name }}</span>
        </div>
      </div>

      <!-- Ticket Info Grid -->
      <div v-if="ticket" class="info-grid">
        <div v-if="ticket.seat" class="info-cell">
          <span class="info-label">Seat</span>
          <span class="info-value">Row {{ ticket.seat.rowNumber }} · {{ ticket.seat.seatNumber }}</span>
        </div>
        <div v-if="ticket.seat?.section" class="info-cell">
          <span class="info-label">Section</span>
          <span class="info-value">{{ ticket.seat.section }}</span>
        </div>
        <div v-if="ticket.price != null" class="info-cell">
          <span class="info-label">Price Paid</span>
          <span class="info-value price">${{ ticket.price }}</span>
        </div>
        <div class="info-cell">
          <span class="info-label">Ticket ID</span>
          <span class="info-value ticket-id">{{ ticket.ticketId }}</span>
        </div>
      </div>

      <!-- QR Code Area -->
      <div class="qr-section glass">
        <template v-if="qrData">
          <VueQrcode :value="`${origin}/ticket-qr/${qrData.qrHash}`" :options="{ width: 220 }" />
          <p class="small countdown" :class="{ urgent: countdown < 10 }">
            QR expires in {{ countdown }}s — auto-refreshes
          </p>
        </template>
        <template v-else-if="blockMessage">
          <svg viewBox="0 0 24 24" class="block-icon"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></svg>
          <p class="small muted block-msg">{{ blockMessage }}</p>
        </template>
        <p v-else class="small muted">Loading QR...</p>
      </div>

      <!-- Action Buttons — only for active tickets -->
      <div v-if="isActive" class="action-row">
        <button class="btn-action btn-list" @click="goToList">
          <svg viewBox="0 0 24 24" class="btn-icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          List on Marketplace
        </button>
        <button class="btn-action btn-transfer" @click="goToTransfer">
          <svg viewBox="0 0 24 24" class="btn-icon"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Transfer Ticket
        </button>
      </div>

    </article>
  </section>
</template>

<style scoped>
.detail-page { max-width: 760px; }

.detail-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Header */
.detail-header { display: flex; flex-direction: column; gap: .5rem; }

.detail-title-row {
  display: flex;
  align-items: center;
  gap: .75rem;
  flex-wrap: wrap;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: .4rem;
  font-size: .88rem;
  color: var(--muted);
}
.meta-icon {
  width: .9rem;
  height: .9rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  flex-shrink: 0;
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: .75rem 1.25rem;
  padding: 1rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: .75rem;
}
.info-cell { display: flex; flex-direction: column; gap: .2rem; }
.info-label { font-size: .7rem; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.info-value { font-size: .92rem; font-weight: 600; color: var(--text); }
.info-value.price { color: var(--accent); font-size: 1.1rem; font-weight: 800; }
.info-value.ticket-id { font-size: .72rem; font-family: monospace; font-weight: 400; color: var(--muted); word-break: break-all; }

/* QR section */
.qr-section {
  padding: 1.5rem;
  display: grid;
  place-items: center;
  gap: .75rem;
  min-height: 280px;
}

.countdown { color: var(--muted); }
.countdown.urgent { color: var(--accent); }

.block-icon {
  width: 2.5rem;
  height: 2.5rem;
  fill: none;
  stroke: var(--muted);
  stroke-width: 1.5;
  stroke-linecap: round;
  opacity: .5;
}
.block-msg { text-align: center; color: var(--muted); }

/* Action buttons */
.action-row {
  display: flex;
  gap: .75rem;
  flex-wrap: wrap;
}

.btn-action {
  flex: 1;
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: .7rem 1.1rem;
  font-size: .9rem;
  font-weight: 600;
  border-radius: .75rem;
  cursor: pointer;
  transition: opacity .15s, transform .1s;
}
.btn-action:active { transform: scale(.98); }

.btn-list {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}
.btn-list:hover { background: var(--surface-2); }

.btn-transfer {
  background: var(--accent);
  color: #fff;
  border: none;
}
.btn-transfer:hover { opacity: .88; }

.btn-icon {
  width: .95rem;
  height: .95rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .action-row { flex-direction: column; }
  .btn-action { min-width: unset; }
}
</style>
