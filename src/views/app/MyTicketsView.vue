<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { isDemoMode, mockServices } from '@/services/mockData'
import { useAuthStore } from '@/stores/auth'
import AccountSidebar from '@/components/account/AccountSidebar.vue'
import { resolveEventImage } from '@/utils/eventMedia'
import type { Ticket } from '@/types'

const tickets = ref<Ticket[]>([])
const transferHistory = ref<Ticket[]>([])
const loading = ref(false)
const toast = useToast()
const auth = useAuthStore()
const unlistingTicketId = ref<string | null>(null)
const unlistingLoading = ref(false)

const mapTicket = (ticket: any): Ticket => ({
  ticketId: ticket.ticketId,
  eventId: ticket.event?.eventId || ticket.eventId || '',
  seatId: ticket.seatId || '',
  ownerId: ticket.ownerId || '',
  status: ticket.status as Ticket['status'],
  price: ticket.price,
  purchasedAt: ticket.createdAt || ticket.purchasedAt || '',
  event: ticket.event
    ? {
        eventId: ticket.event.eventId || '',
        name: ticket.event.name || '',
        date: ticket.event.date || ticket.event.eventDate || '',
        venueId: ticket.venue?.venueId || ticket.event.venueId || '',
        price: ticket.price || 0,
        type: ticket.event.type || 'other',
        image: resolveEventImage({
          image: ticket.event.image,
          eventId: ticket.event.eventId || ticket.eventId,
          type: ticket.event.type || 'other',
          context: 'ticket',
        }),
        venue: ticket.venue ? { venueId: ticket.venue.venueId, name: ticket.venue.name } : undefined,
      }
    : undefined,
  seat: ticket.seat,
  venue: ticket.venue ? { venueId: ticket.venue.venueId, name: ticket.venue.name } : undefined,
})

const mapTransferredTicket = (transfer: any): Ticket => ({
  ticketId: transfer.ticketId || transfer.transferId,
  eventId: transfer.event?.eventId || transfer.eventId || '',
  seatId: transfer.seat?.seatId || transfer.seatId || '',
  ownerId: transfer.sellerId || '',
  status: 'transferred',
  price: transfer.creditAmount || transfer.price || 0,
  purchasedAt: transfer.createdAt || '',
  transferredAt: transfer.completedAt || transfer.createdAt || '',
  event: transfer.event
    ? {
        eventId: transfer.event.eventId || transfer.event.id || '',
        name: transfer.event.name || '',
        date: transfer.event.date || '',
        venueId: transfer.event.venue?.venueId || transfer.venue?.venueId || '',
        price: transfer.creditAmount || transfer.price || 0,
        type: transfer.event.type || 'other',
        image: resolveEventImage({
          image: transfer.event.image || transfer.eventImage,
          eventId: transfer.event.eventId || transfer.event.id,
          type: transfer.event.type || 'other',
          context: 'ticket',
        }),
        venue: transfer.event.venue
          ? { venueId: transfer.event.venue.venueId, name: transfer.event.venue.name }
          : undefined,
      }
    : undefined,
  seat: transfer.seat
    ? {
        seatId: transfer.seat.seatId || '',
        rowNumber: transfer.seat.rowNumber || transfer.seat.row || '',
        seatNumber: transfer.seat.seatNumber || transfer.seat.seat || '',
        venueId: transfer.venue?.venueId || transfer.event?.venue?.venueId || '',
        section: transfer.seat.section,
      }
    : undefined,
  venue: transfer.venue ? { venueId: transfer.venue.venueId, name: transfer.venue.name, address: transfer.venue.address } : undefined,
})

const load = async () => {
  loading.value = true
  try {
    if (isDemoMode()) {
      const [ticketResult, transferResult] = await Promise.all([
        mockServices.getMyTickets(),
        mockServices.getTransfers(),
      ])
      tickets.value = ticketResult.tickets
      transferHistory.value = (transferResult.transfers || [])
        .filter((transfer: any) => transfer.status === 'completed' && transfer.fromUserId === auth.state.user?.userId)
        .map(mapTransferredTicket)
    } else {
      const [{ data: ticketsData }, { data: historyData }] = await Promise.all([
        api.get('/tickets'),
        api.get('/transfer/history'),
      ])
      const raw = ticketsData?.data?.tickets || ticketsData?.data || []
      const transferRaw = historyData?.data?.transfers || historyData?.data || []
      tickets.value = raw.map(mapTicket)
      transferHistory.value = transferRaw.map(mapTransferredTicket)
    }
  } catch {
    try {
      const [ticketResult, transferResult] = await Promise.all([
        mockServices.getMyTickets(),
        mockServices.getTransfers(),
      ])
      tickets.value = ticketResult.tickets
      transferHistory.value = (transferResult.transfers || [])
        .filter((transfer: any) => transfer.status === 'completed' && transfer.fromUserId === auth.state.user?.userId)
        .map(mapTransferredTicket)
      toast.push('Backend unavailable. Showing demo data.', 'info', 3200)
    } catch {
      tickets.value = []
      transferHistory.value = []
    }
  } finally {
    loading.value = false
  }
}

const activeTickets = computed(() => tickets.value.filter((ticket) => ticket.status === 'active' || ticket.status === 'listed'))
const archiveTickets = computed(() => {
  const ownedArchive = tickets.value.filter((ticket) => ticket.status !== 'active' && ticket.status !== 'listed')
  const merged = [...transferHistory.value, ...ownedArchive]
  return Array.from(new Map(merged.map((ticket) => [ticket.ticketId, ticket])).values())
})

const formatDate = (value?: string) => {
  if (!value) return 'Date TBA'
  return new Date(value).toLocaleDateString('en-SG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const archiveActionLabel = (ticket: Ticket) => (ticket.transferredAt || ticket.status === 'transferred' ? 'Transferred' : 'Purchased')
const ticketImage = (ticket: Ticket) =>
  ticket.status === 'listed'
    ? resolveEventImage({
        eventId: ticket.eventId,
        type: ticket.event?.type,
        context: 'marketplace',
      }) ||
      ticket.event?.image ||
      resolveEventImage({ eventId: ticket.eventId, type: ticket.event?.type, context: 'ticket' })
    : ticket.event?.image || resolveEventImage({ eventId: ticket.eventId, type: ticket.event?.type, context: 'ticket' })
const hasUnlistAction = (ticket: Ticket) => ticket.status === 'listed'

const startUnlisting = (ticketId: string) => {
  unlistingTicketId.value = ticketId
}

const cancelUnlisting = () => {
  unlistingTicketId.value = null
}

const confirmUnlist = async (ticketId: string) => {
  unlistingLoading.value = true
  try {
    if (isDemoMode()) {
      tickets.value = tickets.value.map((ticket) =>
        ticket.ticketId === ticketId ? { ...ticket, status: 'active' } : ticket,
      )
      toast.push('Ticket removed from marketplace.', 'success', 3000)
      unlistingTicketId.value = null
      return
    }

    const ticket = tickets.value.find((item: any) => item.ticketId === ticketId) as any
    if (!ticket?.listingId) {
      toast.push('Could not find listing information.', 'error', 3000)
      return
    }
    await api.delete(`/marketplace/${ticket.listingId}`)
    toast.push('Ticket removed from marketplace.', 'success', 3000)
    unlistingTicketId.value = null
    await load()
  } catch (error: any) {
    toast.push(error?.response?.data?.error?.message || 'Could not unlist ticket.', 'error', 3000)
  } finally {
    unlistingLoading.value = false
  }
}

onMounted(load)

watch([loading, tickets], ([isLoading, items]) => {
  if (!isLoading && items.length === 0) toast.push('No tickets yet.', 'info', 2400)
})
</script>

<template>
  <section class="tickets-page">
    <header class="tickets-header">
      <h1>My <span>Tickets</span></h1>
    </header>

    <div class="tickets-layout">
      <AccountSidebar active-key="tickets" />

      <div class="tickets-content">
        <section class="passes-section">
          <div class="section-row">
            <h2>My Passes</h2>
            <span class="section-kicker">{{ activeTickets.length }} active tickets</span>
          </div>

          <div v-if="loading" class="ticket-stack">
            <article v-for="n in 2" :key="n" class="ticket-card skeleton-card"></article>
          </div>

          <div v-else-if="activeTickets.length === 0" class="empty-state">
            <h3>No active tickets.</h3>
            <p>When you complete a purchase, your passes will appear here.</p>
            <RouterLink to="/events"><button>Browse Events</button></RouterLink>
          </div>

          <div v-else class="ticket-stack">
            <article v-for="ticket in activeTickets" :key="ticket.ticketId" class="ticket-card">
              <div class="ticket-media">
                <img v-if="ticketImage(ticket)" :src="ticketImage(ticket)" :alt="ticket.event?.name || 'Ticketed event'" />
              </div>

              <div class="ticket-copy">
                <div class="ticket-topline">
                  <span>{{ ticket.status === 'listed' ? 'Marketplace Listing' : 'Mainstage Access' }}</span>
                  <small>#{{ ticket.ticketId }}</small>
                </div>

                <h3>{{ ticket.event?.name || 'Ticketed Event' }}</h3>
                <p>{{ ticket.venue?.name || ticket.event?.venue?.name || 'Venue TBA' }} • {{ formatDate(ticket.event?.date) }}</p>

                <div class="ticket-bottom">
                  <div class="ticket-status">
                    <span class="dot" :class="ticket.status"></span>
                    <strong>{{ ticket.status === 'listed' ? 'Listed on marketplace' : 'Ready for scan' }}</strong>
                  </div>

                  <div class="ticket-actions">
                    <RouterLink v-if="ticket.status !== 'listed'" :to="`/ticket-qr/${ticket.qrHash || ticket.ticketId}`">
                      <button class="ticket-primary-action">View QR</button>
                    </RouterLink>
                    <button
                      v-else-if="unlistingTicketId !== ticket.ticketId"
                      class="secondary ticket-primary-action"
                      type="button"
                      @click="startUnlisting(ticket.ticketId)"
                    >
                      Unlist
                    </button>
                  </div>
                </div>

                <div class="ticket-link-actions">
                  <RouterLink v-if="ticket.status === 'listed'" :to="`/ticket-qr/${ticket.qrHash || ticket.ticketId}`">View QR</RouterLink>

                  <button
                    v-if="hasUnlistAction(ticket) && unlistingTicketId !== ticket.ticketId"
                    class="ticket-link-button"
                    type="button"
                    @click="startUnlisting(ticket.ticketId)"
                  >
                    Unlist
                  </button>
                </div>

                <template v-if="unlistingTicketId === ticket.ticketId">
                  <div class="action-inline">
                    <button :disabled="unlistingLoading" @click="confirmUnlist(ticket.ticketId)">
                      {{ unlistingLoading ? 'Removing...' : 'Confirm Unlist' }}
                    </button>
                    <button class="secondary" @click="cancelUnlisting">Cancel</button>
                  </div>
                </template>
              </div>
            </article>
          </div>
        </section>

        <section class="archive-section">
          <h2>Past &amp; Transferred</h2>

          <div class="archive-shell">
            <div class="archive-row header">
              <span>Event</span>
              <span>Date</span>
              <span>Action</span>
              <span>Status</span>
            </div>

            <div v-for="ticket in archiveTickets" :key="ticket.ticketId" class="archive-row">
              <div>
                <strong>{{ ticket.event?.name || 'Archived Ticket' }}</strong>
                <p>{{ ticket.seat ? `Row ${ticket.seat.rowNumber}, Seat ${ticket.seat.seatNumber}` : 'Seat archived' }}</p>
              </div>
              <span>{{ formatDate(ticket.event?.date) }}</span>
              <span class="archive-action" :class="{ transferred: Boolean(ticket.transferredAt) }">{{ archiveActionLabel(ticket) }}</span>
              <span class="archive-pill" :class="ticket.status">{{ ticket.status }}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tickets-page {
  width: min(100% - 3rem, 84rem);
  margin: 0 auto;
  padding: 7.5rem 0 4.5rem;
  display: grid;
  gap: 2rem;
}

.tickets-header {
  text-align: center;
}

.tickets-header h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(3rem, 7vw, 5.8rem);
  font-weight: 900;
  line-height: 0.94;
  letter-spacing: -0.07em;
}

.tickets-header h1 span {
  color: var(--primary);
}

.tickets-layout {
  display: grid;
  grid-template-columns: var(--account-sidebar-width) minmax(0, 1fr);
  gap: 2rem;
  align-items: start;
}

.tickets-content,
.passes-section,
.archive-section {
  display: grid;
  gap: 1rem;
}

.section-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.section-row h2,
.archive-section h2 {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.section-kicker {
  color: var(--primary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.ticket-stack {
  display: grid;
  gap: 1rem;
}

.ticket-card,
.archive-shell,
.empty-state {
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(38, 38, 38, 0.4);
  backdrop-filter: blur(16px);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.16);
}

.ticket-card {
  display: grid;
  grid-template-columns: 14rem minmax(0, 1fr);
  overflow: hidden;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}

.ticket-card:hover {
  border-color: rgba(249, 115, 22, 0.18);
  box-shadow: 0 20px 60px rgba(249, 115, 22, 0.1);
  transform: translateY(-2px);
}

.ticket-media {
  min-height: 14rem;
  background: rgba(19, 19, 19, 0.82);
}

.ticket-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.ticket-card:hover .ticket-media img {
  transform: scale(1.04);
}

.ticket-copy {
  display: grid;
  gap: 0.85rem;
  padding: 1.6rem;
}

.ticket-topline {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: var(--primary);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.ticket-topline small {
  color: rgba(255, 255, 255, 0.38);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.ticket-copy h3 {
  margin: 0;
  font-size: 1.7rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.02;
}

.ticket-copy p,
.archive-row p,
.empty-state p {
  margin: 0;
  color: var(--text-muted);
}

.ticket-bottom {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: end;
  flex-wrap: wrap;
  margin-top: auto;
}

.ticket-status {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.dot {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.26);
}

.dot.active {
  background: #10b981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.45);
}

.dot.listed {
  background: #f6a94d;
}

.ticket-actions,
.action-inline {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.ticket-primary-action {
  min-width: 7.25rem;
}

.ticket-link-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.ticket-link-actions a,
.ticket-link-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 700;
}

.ticket-link-button:hover,
.ticket-link-actions a:hover {
  color: var(--text);
  transform: none;
  filter: none;
}

.action-inline input {
  min-width: 8rem;
}

.archive-shell {
  overflow: hidden;
  background: rgba(38, 38, 38, 0.46);
}

.archive-row {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) 10rem 8rem 8rem;
  gap: 1rem;
  align-items: center;
  padding: 1rem 1.2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.archive-row.header {
  border-top: 0;
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.archive-row strong {
  display: block;
  margin-bottom: 0.2rem;
  font-size: 1rem;
}

.archive-pill {
  width: fit-content;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.archive-action {
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.archive-action.transferred {
  color: var(--primary);
}

.archive-pill.used {
  color: #a5afbe;
}

.archive-pill.cancelled {
  color: #ff8f84;
}

.archive-pill.transferred {
  color: var(--primary);
}

.empty-state,
.skeleton-card {
  display: grid;
  gap: 0.75rem;
  justify-items: center;
  align-content: center;
  min-height: 16rem;
  text-align: center;
  padding: 2rem;
}

.skeleton-card {
  background: linear-gradient(90deg, rgba(32, 31, 31, 0.7), rgba(44, 44, 44, 0.9), rgba(32, 31, 31, 0.7));
}

@media (max-width: 980px) {
  .tickets-layout,
  .ticket-card,
  .archive-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .tickets-page {
    width: min(100% - 1rem, 84rem);
    padding-top: 6.5rem;
  }
}
</style>
