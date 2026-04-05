<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { isDemoMode, mockServices } from '@/services/mockData'
import type { Ticket } from '@/types'

const tickets = ref<Ticket[]>([])
const loading = ref(false)
const toast = useToast()
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
  return new Date(value).toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
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
      <span class="eyebrow">Ticket Wallet</span>
      <h1>My Tickets</h1>
    </header>

    <div class="tickets-layout">
      <aside class="sidebar panel">
        <RouterLink to="/profile" class="side-link">Profile</RouterLink>
        <RouterLink to="/credits/topup" class="side-link">Credits</RouterLink>
        <span class="side-link active">Tickets</span>
      </aside>

      <div class="tickets-content">
        <section class="passes-section">
          <div class="section-row">
            <h2>My Passes</h2>
            <span class="section-kicker">{{ activeTickets.length }} active tickets</span>
          </div>

          <div v-if="loading" class="ticket-stack">
            <article v-for="n in 2" :key="n" class="ticket-card panel skeleton"></article>
          </div>

          <div v-else-if="activeTickets.length === 0" class="empty-state panel">
            <h3>No active tickets.</h3>
            <p>When you complete a purchase, your passes will appear here.</p>
            <RouterLink to="/events"><button>Browse Events</button></RouterLink>
          </div>

          <div v-else class="ticket-stack">
            <article v-for="ticket in activeTickets" :key="ticket.ticketId" class="ticket-card panel">
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
                        <button :disabled="unlistingLoading" @click="confirmUnlist(ticket.ticketId)">{{ unlistingLoading ? 'Removing...' : 'Confirm Unlist' }}</button>
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
          <div class="archive-table panel">
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
.tickets-page, .tickets-header, .tickets-content, .passes-section, .archive-section { display: grid; gap: 1rem; }
.tickets-header h1 { margin: 0; font-family: var(--font-display); font-size: clamp(2.8rem, 6vw, 4.8rem); line-height: .95; letter-spacing: -.05em; }
.eyebrow { color: var(--primary); font-size: .72rem; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; }
.tickets-layout { display: grid; grid-template-columns: 16rem minmax(0,1fr); gap: 1.25rem; align-items: start; }
.sidebar { display: grid; gap: .5rem; position: sticky; top: 7rem; padding: .8rem; }
.side-link { padding: .9rem 1rem; border-radius: 1rem; color: var(--text-muted); }
.side-link.active { background: rgba(249,115,22,.12); border: 1px solid rgba(249,115,22,.16); color: var(--primary); font-weight: 700; }
.section-row { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
.section-row h2, .archive-section h2 { margin: 0; font-size: 1.5rem; }
.section-kicker { color: var(--primary); font-size: .72rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
.ticket-stack { display: grid; gap: 1rem; }
.ticket-card { display: grid; grid-template-columns: 14rem minmax(0,1fr); overflow: hidden; padding: 0; }
.ticket-media { min-height: 14rem; background: var(--surface-2); }
.ticket-media img { width: 100%; height: 100%; object-fit: cover; }
.ticket-copy { display: grid; gap: .75rem; padding: 1.4rem; }
.ticket-topline {
  display: flex; justify-content: space-between; gap: 1rem; color: var(--primary);
  font-size: .72rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase;
}
.ticket-topline small { color: var(--text-dim); letter-spacing: .08em; }
.ticket-copy h3 { margin: 0; font-size: 1.6rem; }
.ticket-copy p { margin: 0; color: var(--text-muted); }
.ticket-bottom { display: flex; justify-content: space-between; gap: 1rem; align-items: end; flex-wrap: wrap; margin-top: auto; }
.ticket-status { display: flex; align-items: center; gap: .55rem; }
.dot { width: .65rem; height: .65rem; border-radius: 999px; background: var(--text-dim); }
.dot.active { background: #32d27a; }
.dot.listed { background: #f6a94d; }
.ticket-actions, .action-inline { display: flex; gap: .6rem; flex-wrap: wrap; }
.action-inline input { min-width: 8rem; }
.archive-table { overflow: hidden; padding: 0; }
.archive-row {
  display: grid; grid-template-columns: minmax(0,1.6fr) 10rem 8rem; gap: 1rem; padding: 1rem 1.2rem;
  align-items: center; border-top: 1px solid rgba(255,255,255,.05);
}
.archive-row.header { border-top: 0; color: var(--text-dim); font-size: .72rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
.archive-row strong { display: block; margin-bottom: .2rem; }
.archive-row p { margin: 0; color: var(--text-muted); }
.archive-pill {
  width: fit-content; padding: .45rem .75rem; border-radius: 999px; background: rgba(255,255,255,.05);
  color: var(--text-muted); font-size: .68rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase;
}
.archive-pill.used { color: #a5afbe; }
.archive-pill.cancelled { color: #ff8f84; }
.empty-state, .skeleton { min-height: 16rem; place-items: center; align-content: center; text-align: center; }
.empty-state h3, .empty-state p { margin: 0; }
.empty-state p { color: var(--text-muted); }
@media (max-width: 980px) {
  .tickets-layout, .ticket-card, .archive-row { grid-template-columns: 1fr; }
  .sidebar { position: static; }
}
</style>
