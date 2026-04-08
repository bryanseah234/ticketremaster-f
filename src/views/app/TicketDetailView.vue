<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import { CalendarDaysIcon, MapPinIcon } from '@heroicons/vue/24/outline'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { isDemoMode, mockServices } from '@/services/mockData'
import type { Ticket } from '@/types'

const route = useRoute()
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
const locationLabel = computed(() => ticket.value?.venue?.name || ticket.value?.event?.venue?.name || 'Venue TBA')
const confirmedLabel = computed(() => (isActive.value ? 'CONFIRMED' : (ticketStatus.value || 'STATUS').toUpperCase()))
const seatSection = computed(() => ticket.value?.seat?.section || 'GA')
const seatRow = computed(() => ticket.value?.seat?.rowNumber || '--')
const seatNumber = computed(() => ticket.value?.seat?.seatNumber || '--')
const seatGate = computed(() => (ticket.value?.seat as any)?.gate || '--')

const normalizeSeat = (payload: any) => {
  const rawSeat = payload?.seat && typeof payload.seat === 'object' ? payload.seat : {}
  const seat = {
    ...(ticket.value?.seat || {}),
    ...(rawSeat || {}),
    seatId: rawSeat?.seatId || payload?.seatId || ticket.value?.seat?.seatId || '',
    venueId: rawSeat?.venueId || payload?.venueId || ticket.value?.seat?.venueId || '',
    section: rawSeat?.section || payload?.seatSection || payload?.seat_section || payload?.section || ticket.value?.seat?.section,
    rowNumber: rawSeat?.rowNumber || rawSeat?.row || payload?.seatRow || payload?.seat_row || payload?.rowNumber || ticket.value?.seat?.rowNumber,
    seatNumber: rawSeat?.seatNumber || rawSeat?.seat || payload?.seatNumber || payload?.seat_number || ticket.value?.seat?.seatNumber,
  }
  const gate = rawSeat?.gate || payload?.seatGate || payload?.seat_gate || payload?.gate || (ticket.value?.seat as any)?.gate

  if (!seat.section && !seat.rowNumber && !seat.seatNumber && !gate) return ticket.value?.seat
  return gate ? { ...seat, gate } : seat
}

const applyTicketContext = (payload: any) => {
  if (!payload) return
  const normalizedSeat = normalizeSeat(payload)
  const rawEvent = payload?.event && typeof payload.event === 'object' ? payload.event : {}
  const rawVenue = payload?.venue && typeof payload.venue === 'object' ? payload.venue : {}

  ticket.value = {
    ...(ticket.value || {}),
    ...payload,
    ticketId: payload?.ticketId || ticket.value?.ticketId || ticketId,
    eventId: payload?.eventId || rawEvent?.eventId || ticket.value?.eventId || '',
    seatId: payload?.seatId || normalizedSeat?.seatId || ticket.value?.seatId || '',
    ownerId: payload?.ownerId || ticket.value?.ownerId || '',
    status: (payload?.status || ticket.value?.status || 'active') as Ticket['status'],
    price: payload?.price ?? ticket.value?.price,
    qrHash: payload?.qrHash || ticket.value?.qrHash,
    purchasedAt: payload?.createdAt || payload?.purchasedAt || ticket.value?.purchasedAt || '',
    seat: normalizedSeat,
    event: {
      ...(ticket.value?.event || {}),
      ...(rawEvent || {}),
      eventId: rawEvent?.eventId || payload?.eventId || ticket.value?.event?.eventId || '',
      name: rawEvent?.name || payload?.eventName || payload?.event_name || ticket.value?.event?.name || '',
      date: rawEvent?.date || rawEvent?.eventDate || payload?.eventDate || payload?.date || ticket.value?.event?.date || '',
      venueId: rawEvent?.venueId || rawVenue?.venueId || payload?.venueId || ticket.value?.event?.venueId || '',
      price: Number(rawEvent?.price ?? payload?.price ?? ticket.value?.event?.price ?? ticket.value?.price ?? 0),
      type: rawEvent?.type || ticket.value?.event?.type || 'other',
      venue: rawVenue?.name
        ? {
            venueId: rawVenue?.venueId || payload?.venueId || ticket.value?.event?.venue?.venueId || '',
            name: rawVenue.name,
            address: rawVenue.address || payload?.venueAddress || ticket.value?.event?.venue?.address,
          }
        : ticket.value?.event?.venue,
    },
    venue: rawVenue?.name || payload?.venueName || payload?.venue_name || payload?.location
      ? {
          venueId: rawVenue?.venueId || payload?.venueId || ticket.value?.venue?.venueId || '',
          name: rawVenue?.name || payload?.venueName || payload?.venue_name || payload?.location || ticket.value?.venue?.name || '',
          address: rawVenue?.address || payload?.venueAddress || payload?.address || ticket.value?.venue?.address,
        }
      : ticket.value?.venue,
  }
}

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
    applyTicketContext(data?.data)
    if (qrData.value?.qrHash) {
      try {
        const contextResponse = await api.get(`/tickets/qr/${qrData.value.qrHash}`)
        applyTicketContext(contextResponse?.data?.data)
      } catch {
        // Keep the base QR response if the context lookup fails.
      }
    }
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

    <article class="ticket-shell panel">
      <aside class="ticket-left">
        <span class="status-pill">{{ confirmedLabel }}</span>
        <div v-if="qrData" class="qr-shell">
          <VueQrcode :value="`${origin}/ticket-qr/${qrData.qrHash}`" :options="{ width: 220 }" />
          <p class="countdown" :class="{ urgent: countdown < 10 }">Refreshes in {{ countdown }}s</p>
        </div>
        <div v-else-if="blockMessage" class="blocked-shell">
          <p>{{ blockMessage }}</p>
        </div>
        <div v-else class="blocked-shell">
          <p>Loading QR...</p>
        </div>
      </aside>

      <div class="ticket-right">
        <span class="eyebrow">Electronic Ticket</span>
        <h1 class="ticket-title">{{ ticket?.event?.name || 'Ticket Details' }}</h1>
        <p class="series-name">{{ locationLabel }}</p>

        <div class="seat-grid">
          <div>
            <span class="meta-label">Section</span>
            <strong>{{ seatSection }}</strong>
          </div>
          <div>
            <span class="meta-label">Row</span>
            <strong>{{ seatRow }}</strong>
          </div>
          <div>
            <span class="meta-label">Seat</span>
            <strong>{{ seatNumber }}</strong>
          </div>
          <div>
            <span class="meta-label">Gate</span>
            <strong>{{ seatGate }}</strong>
          </div>
        </div>

        <div class="meta-row">
          <CalendarDaysIcon class="meta-icon" />
          <div>
            <span class="meta-label">Date</span>
            <strong>{{ formatDate(ticket?.event?.date) }}</strong>
          </div>
        </div>

        <div class="meta-row">
          <MapPinIcon class="meta-icon" />
          <div>
            <span class="meta-label">Location</span>
            <strong>{{ locationLabel }}</strong>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.ticket-detail-page { 
  display: grid; 
  gap: 1rem; 
  max-width: 74rem; 
  margin: 0 auto; 
  padding-top: 8.25rem;
  padding-inline: 1.25rem;
}
.crumb a { color: var(--textMuted); }

.ticket-shell {
  display: grid;
  grid-template-columns: minmax(18rem, 24rem) minmax(0, 1fr);
  gap: 1.4rem;
  padding: 1.2rem;
  border-radius: 1.4rem;
  background: rgba(17, 16, 16, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.ticket-left {
  position: relative;
  border-radius: 1.1rem;
  padding: 1.2rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.06);
  min-height: 24rem;
  display: grid;
  place-items: center;
}

.ticket-right {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.eyebrow,
.meta-label {
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.eyebrow { color: var(--primary); }
.meta-label { color: rgba(255, 255, 255, 0.5); display: block; margin-bottom: 0.35rem; }

.ticket-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2rem, 4.2vw, 3.1rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
}

.series-name {
  margin: 0;
  color: var(--textMuted);
  font-size: 0.94rem;
}

.status-pill {
  position: absolute;
  top: 0.9rem;
  right: 0.9rem;
  width: fit-content;
  padding: 0.38rem 0.65rem;
  border-radius: 999px;
  background: rgba(61, 186, 124, 0.16);
  border: 1px solid rgba(61, 186, 124, 0.36);
  color: #7de3ab;
  font-size: 0.64rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
  padding: 0.95rem 0;
  border-block: 1px solid rgba(255, 255, 255, 0.07);
}

.seat-grid strong {
  display: block;
  font-size: 1.05rem;
}

.meta-row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.7rem;
  align-items: center;
  padding: 0.45rem 0;
}

.meta-row strong {
  display: block;
}

.meta-icon {
  width: 1rem;
  height: 1rem;
  color: var(--primary);
}

.qr-shell,
.blocked-shell {
  width: 100%;
  min-height: 19rem;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.9rem;
  text-align: center;
}

.countdown { margin: 0; color: var(--textMuted); font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; font-size: 0.68rem; }
.countdown.urgent { color: #f6a94d; }
.blocked-shell p { margin: 0; text-align: center; color: var(--textMuted); }

@media (max-width: 900px) {
  .ticket-shell,
  .seat-grid {
    grid-template-columns: 1fr;
  }

  .ticket-detail-page {
    padding-top: 7.2rem;
  }
}
</style>
