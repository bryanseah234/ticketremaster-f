<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { isDemoMode, mockServices } from '@/services/mockData'
import { useAuthStore } from '@/stores/auth'
import AccountSidebar from '@/components/account/AccountSidebar.vue'
import type { Ticket } from '@/types'

const tickets = ref<Ticket[]>([])
const loading = ref(false)
const toast = useToast()
const auth = useAuthStore()
const listingTicketId = ref<string | null>(null)
const listingPrice = ref<number>(0)
const listingLoading = ref(false)
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
        image: ticket.event.image || undefined,
        venue: ticket.venue ? { venueId: ticket.venue.venueId, name: ticket.venue.name } : undefined,
      }
    : undefined,
  seat: ticket.seat,
  venue: ticket.venue ? { venueId: ticket.venue.venueId, name: ticket.venue.name } : undefined,
})

const load = async () => {
  loading.value = true
  try {
    if (isDemoMode()) {
      const result = await mockServices.getMyTickets()
      tickets.value = result.tickets
    } else {
      const { data } = await api.get('/tickets')
      const raw = data?.data?.tickets || data?.data || []
      tickets.value = raw.map(mapTicket)
    }
  } catch {
    try {
      const result = await mockServices.getMyTickets()
      tickets.value = result.tickets
      toast.push('Backend unavailable. Showing demo data.', 'info', 3200)
    } catch {
      tickets.value = []
    }
  } finally {
    loading.value = false
  }
}

const activeTickets = computed(() => tickets.value.filter((ticket) => ticket.status === 'active' || ticket.status === 'listed'))
const archiveTickets = computed(() => tickets.value.filter((ticket) => ticket.status !== 'active' && ticket.status !== 'listed'))

const formatDate = (value?: string) => {
  if (!value) return 'Date TBA'
  return new Date(value).toLocaleDateString('en-SG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const startListing = (ticketId: string, price?: number) => {
  listingTicketId.value = ticketId
  listingPrice.value = price || 0
}

const cancelListing = () => {
  listingTicketId.value = null
  listingPrice.value = 0
}

const submitListing = async (ticketId: string) => {
  if (!listingPrice.value || listingPrice.value <= 0) {
    toast.push('Enter a valid price.', 'error', 3000)
    return
  }

  listingLoading.value = true
  try {
    if (isDemoMode()) {
      tickets.value = tickets.value.map((ticket) =>
        ticket.ticketId === ticketId ? { ...ticket, status: 'listed', price: listingPrice.value } : ticket,
      )
      toast.push('Ticket listed on marketplace.', 'success', 3000)
      listingTicketId.value = null
      return
    }

    await api.post('/marketplace/list', { ticketId, price: listingPrice.value })
    toast.push('Ticket listed on marketplace.', 'success', 3000)
    listingTicketId.value = null
    await load()
  } catch (error: any) {
    toast.push(error?.response?.data?.error?.message || 'Could not list ticket.', 'error', 3000)
  } finally {
    listingLoading.value = false
  }
}

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
                <img v-if="ticket.event?.image" :src="ticket.event.image" :alt="ticket.event.name" />
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
                    <RouterLink :to="`/ticket-qr/${ticket.qrHash || ticket.ticketId}`"><button>View QR</button></RouterLink>
                    <RouterLink v-if="ticket.status === 'active'" :to="`/transfer/initiate?ticketId=${ticket.ticketId}`">
                      <button class="secondary">Transfer</button>
                    </RouterLink>

                    <template v-if="ticket.status === 'active'">
                      <div v-if="listingTicketId === ticket.ticketId" class="action-inline">
                        <input v-model.number="listingPrice" type="number" min="1" placeholder="Set price" />
                        <button :disabled="listingLoading" @click="submitListing(ticket.ticketId)">{{ listingLoading ? 'Listing...' : 'Confirm' }}</button>
                        <button class="secondary" @click="cancelListing">Cancel</button>
                      </div>
                      <button v-else class="secondary" @click="startListing(ticket.ticketId, ticket.price)">List Ticket</button>
                    </template>

                    <template v-else-if="ticket.status === 'listed'">
                      <div v-if="unlistingTicketId === ticket.ticketId" class="action-inline">
                        <button :disabled="unlistingLoading" @click="confirmUnlist(ticket.ticketId)">
                          {{ unlistingLoading ? 'Removing...' : 'Confirm Unlist' }}
                        </button>
                        <button class="secondary" @click="cancelUnlisting">Cancel</button>
                      </div>
                      <button v-else class="secondary" @click="startUnlisting(ticket.ticketId)">Unlist</button>
                    </template>
                  </div>
                </div>
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
              <span>Status</span>
            </div>

            <div v-for="ticket in archiveTickets" :key="ticket.ticketId" class="archive-row">
              <div>
                <strong>{{ ticket.event?.name || 'Archived Ticket' }}</strong>
                <p>{{ ticket.seat ? `Row ${ticket.seat.rowNumber}, Seat ${ticket.seat.seatNumber}` : 'Seat archived' }}</p>
              </div>
              <span>{{ formatDate(ticket.event?.date) }}</span>
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
}

.ticket-card {
  display: grid;
  grid-template-columns: 14rem minmax(0, 1fr);
  overflow: hidden;
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

.action-inline input {
  min-width: 8rem;
}

.archive-shell {
  overflow: hidden;
}

.archive-row {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) 10rem 8rem;
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

.archive-pill.used {
  color: #a5afbe;
}

.archive-pill.cancelled {
  color: #ff8f84;
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
