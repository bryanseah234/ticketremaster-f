<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
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

const ticketStatus = computed(() => ticket.value?.status || (route.query.status as string) || '')
const isActive = computed(() => ticketStatus.value === 'active')

const formatDate = (value?: string) => {
  if (!value) return 'Date TBA'
  return new Date(value).toLocaleString('en-SG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const loadTicket = async () => {
  try {
    if (isDemoMode()) {
      const result = await mockServices.getMyTickets()
      ticket.value = result.tickets.find((item) => item.ticketId === ticketId) || null
    } else {
      const { data } = await api.get('/tickets')
      const raw: any[] = data?.data?.tickets || data?.data || []
      const found = raw.find((item: any) => item.ticketId === ticketId)
      if (found) {
        ticket.value = {
          ticketId: found.ticketId,
          eventId: found.event?.eventId || found.eventId || '',
          seatId: found.seatId || '',
          ownerId: found.ownerId || '',
          status: found.status,
          price: found.price,
          purchasedAt: found.createdAt || found.purchasedAt || '',
          event: found.event
            ? {
                eventId: found.event.eventId || '',
                name: found.event.name || '',
                date: found.event.date || found.event.eventDate || '',
                venueId: found.venue?.venueId || '',
                price: found.price || 0,
                type: found.event.type || 'other',
                venue: found.venue ? { venueId: found.venue.venueId, name: found.venue.name } : undefined,
              }
            : undefined,
          seat: found.seat,
          venue: found.venue ? { venueId: found.venue.venueId, name: found.venue.name } : undefined,
        }
      }
    }
  } catch {
    // non-fatal
  }
}

const fetchQr = async (notify = false) => {
  if (blockMessage.value) return
  if (notify) toast.push('Loading ticket QR...', 'info', 1400)

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
  } catch (error: any) {
    if (!error?.response) {
      qrData.value = { qrHash: `DEMO-QR-${ticketId}` }
      countdown.value = 60
      toast.push('Demo QR shown while backend is unavailable.', 'info', 3200)
    } else {
      const code = error?.response?.data?.error?.code
      const status = error?.response?.status
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

onMounted(async () => {
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
  <section class="ticket-detail-page">
    <div class="crumb"><RouterLink to="/tickets">Back to My Tickets</RouterLink></div>

    <article class="detail-shell panel">
      <div class="detail-copy">
        <span class="eyebrow">Electronic Ticket</span>
        <div class="headline-row">
          <h1>{{ ticket?.event?.name || 'Ticket Details' }}</h1>
          <span class="status-pill">{{ ticketStatus || 'active' }}</span>
        </div>
        <p class="muted">{{ ticket?.venue?.name || ticket?.event?.venue?.name || 'Venue TBA' }}</p>

        <div class="info-grid">
          <div><span class="meta-label">Date</span><strong>{{ formatDate(ticket?.event?.date) }}</strong></div>
          <div><span class="meta-label">Section</span><strong>{{ ticket?.seat?.section || 'GA' }}</strong></div>
          <div><span class="meta-label">Row</span><strong>{{ ticket?.seat?.rowNumber || '--' }}</strong></div>
          <div><span class="meta-label">Seat</span><strong>{{ ticket?.seat?.seatNumber || '--' }}</strong></div>
          <div><span class="meta-label">Price Paid</span><strong>SGD {{ Number(ticket?.price || 0).toFixed(2) }}</strong></div>
          <div><span class="meta-label">Ticket ID</span><strong>{{ ticket?.ticketId || ticketId }}</strong></div>
        </div>

        <div class="action-row" v-if="isActive">
          <RouterLink :to="`/ticket-qr/${qrData?.qrHash || ticket?.ticketId || ticketId}`"><button>Open Full QR</button></RouterLink>
        </div>
      </div>

      <div class="qr-column">
        <div v-if="qrData" class="qr-shell">
          <VueQrcode :value="`${origin}/ticket-qr/${qrData.qrHash}`" :options="{ width: 220 }" />
          <p class="countdown" :class="{ urgent: countdown < 10 }">Refreshes in {{ countdown }}s</p>
        </div>
        <div v-else-if="blockMessage" class="blocked-shell">
          <p>{{ blockMessage }}</p>
        </div>
        <div v-else class="blocked-shell">
          <p>Loading QR…</p>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.ticket-detail-page { display: grid; gap: 1rem; max-width: 70rem; margin: 0 auto; }
.crumb a { color: var(--text-muted); }
.detail-shell { display: grid; grid-template-columns: minmax(0,1.2fr) minmax(20rem,.8fr); gap: 1.25rem; }
.detail-copy, .qr-column { display: grid; gap: 1rem; }
.eyebrow, .meta-label {
  font-size: .7rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase;
}
.eyebrow { color: var(--primary); }
.meta-label { color: var(--text-dim); display: block; margin-bottom: .35rem; }
.headline-row { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
.headline-row h1 {
  margin: 0; font-family: var(--font-display); font-size: clamp(2.4rem, 5vw, 4rem); line-height: .95; letter-spacing: -.05em;
}
.status-pill {
  width: fit-content; padding: .45rem .75rem; border-radius: 999px; background: rgba(249,115,22,.14);
  color: var(--primary); font-size: .68rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
}
.muted { margin: 0; color: var(--text-muted); }
.info-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 1rem; padding: 1rem 0; border-block: 1px solid rgba(255,255,255,.06); }
.info-grid strong { display: block; }
.action-row { display: flex; gap: .75rem; flex-wrap: wrap; }
.qr-shell, .blocked-shell {
  min-height: 22rem; display: grid; place-items: center; align-content: center; gap: 1rem; padding: 1.25rem;
  border-radius: 1.25rem; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.05);
}
.countdown { margin: 0; color: var(--text-muted); }
.countdown.urgent { color: #f6a94d; }
.blocked-shell p { margin: 0; text-align: center; color: var(--text-muted); }
@media (max-width: 900px) {
  .detail-shell, .info-grid { grid-template-columns: 1fr; }
}
</style>
