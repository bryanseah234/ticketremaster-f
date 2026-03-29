<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'

const tickets = ref<any[]>([])
const loading = ref(false)
const toast = useToast()
const listingTicketId = ref<string | null>(null)
const listingPrice = ref<number>(0)
const listingLoading = ref(false)

const startListing = (ticketId: string, price: number) => {
  listingTicketId.value = ticketId
  listingPrice.value = price || 0
}

const cancelListing = () => {
  listingTicketId.value = null
  listingPrice.value = 0
}

const unlistingTicketId = ref<string | null>(null)
const unlistingLoading = ref(false)

const startUnlisting = (ticketId: string) => {
  unlistingTicketId.value = ticketId
}

const cancelUnlisting = () => {
  unlistingTicketId.value = null
}

const confirmUnlist = async (ticketId: string) => {
  unlistingLoading.value = true
  try {
    const ticket = tickets.value.find(t => t.ticketId === ticketId)
    if (!ticket?.listingId) {
      toast.push('Could not find listing information.', 'error', 3000)
      return
    }
    await api.delete(`/marketplace/${ticket.listingId}`)
    toast.push('Ticket removed from marketplace.', 'success', 3000)
    unlistingTicketId.value = null
    await load()
  } catch (e: any) {
    toast.push(e?.response?.data?.error?.message || 'Could not unlist ticket.', 'error', 3000)
  } finally {
    unlistingLoading.value = false
  }
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
  } catch (e: any) {
    toast.push(e?.response?.data?.error?.message || 'Could not list ticket.', 'error', 3000)
  } finally {
    listingLoading.value = false
  }
}

const fallbackTickets = [
  { ticketId: 'demo-101', status: 'active', event: { name: 'Neon Skyline Festival', eventDate: '2026-04-12T20:00:00Z', image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=800' }, rowNumber: 'B', seatNumber: 18, price: 120, createdAt: '2026-03-02T19:30:00Z' },
  { ticketId: 'demo-102', status: 'active', event: { name: 'Midnight Bass District', eventDate: '2026-05-03T19:30:00Z', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800' }, rowNumber: 'D', seatNumber: 9, price: 85, createdAt: '2026-02-18T14:20:00Z' },
  { ticketId: 'demo-103', status: 'listed', event: { name: 'Jazz at Capitol', eventDate: '2026-06-08T19:00:00Z', image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=800' }, rowNumber: 'A', seatNumber: 5, price: 110, createdAt: '2026-02-20T10:00:00Z' },
]

const load = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/qr/tickets')
    const raw = data?.data?.tickets || data?.data || []
    tickets.value = raw.map((t: any) => ({
      ...t,
      event: t.event ? {
        ...t.event,
        eventDate: t.event.eventDate || t.event.date,
        image: t.event.image || null,
      } : null,
    }))
  } catch {
    tickets.value = fallbackTickets
    toast.push('Backend unavailable. Showing limited demo data.', 'info', 3200)
  } finally {
    loading.value = false
  }
}

const statusColor = (s: string) => {
  const status = (s || '').toLowerCase()
  if (status === 'active') return 'status-active'
  if (status === 'used') return 'status-used'
  if (status === 'listed') return 'status-listed'
  if (status === 'pending_transfer' || status === 'transferred') return 'status-transfer'
  return 'status-default'
}

const statusLabel = (s: string) => {
  const status = (s || '').toLowerCase()
  if (status === 'active') return 'Active'
  if (status === 'used') return 'Used'
  if (status === 'listed') return 'Listed on Marketplace'
  if (status === 'pending_transfer') return 'In Transfer'
  if (status === 'transferred') return 'Transferred'
  return s || 'Active'
}

const accentColor = (s: string) => {
  const status = (s || '').toLowerCase()
  if (status === 'active') return '#22c55e'
  if (status === 'used') return '#6b7280'
  if (status === 'listed') return '#f59e0b'
  if (status === 'pending_transfer' || status === 'transferred') return '#3b82f6'
  return 'var(--accent-rgb, 249,115,22)'
}

const formatDate = (d?: string) => {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const formatTime = (d?: string) => {
  if (!d) return null
  return new Date(d).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
}

const canShowQR = (t: any) => t.status !== 'used' && t.status !== 'transferred'
const canList = (t: any) => t.status === 'active'

onMounted(load)
watch([loading, tickets], ([isLoading, items]) => {
  if (!isLoading && items.length === 0) toast.push('No tickets yet.', 'info', 2400)
})
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="section-title">My Tickets</h1>
        <p class="section-subtitle">Your upcoming events and entry passes.</p>
      </div>
      <span v-if="tickets.length" class="ticket-count">{{ tickets.length }} ticket{{ tickets.length !== 1 ? 's' : '' }}</span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-row">
      <div class="spinner" />
      <span class="small muted">Loading tickets…</span>
    </div>

    <!-- Empty -->
    <div v-else-if="tickets.length === 0" class="empty-state glass">
      <svg viewBox="0 0 24 24" class="empty-icon"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/></svg>
      <p class="muted">No tickets yet.</p>
      <RouterLink to="/events"><button>Browse Events</button></RouterLink>
    </div>

    <!-- Ticket grid -->
    <div v-else class="ticket-grid">
      <article v-for="t in tickets" :key="t.ticketId" class="ticket-card">

        <!-- Header with image/gradient -->
        <div
          class="ticket-header"
          :style="{
            backgroundImage: t.event?.image
              ? `linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.75) 100%), url(${t.event.image})`
              : `linear-gradient(135deg, rgba(${accentColor(t.status)},0.25) 0%, rgba(0,0,0,0.6) 100%)`
          }"
        >
          <span :class="['status-pill', statusColor(t.status)]">{{ statusLabel(t.status) }}</span>
          <h3 class="ticket-name">{{ t.event?.name || 'Event' }}</h3>
          <div v-if="t.event?.eventDate" class="header-date">
            <svg viewBox="0 0 24 24" class="hd-icon"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            <span>{{ formatDate(t.event.eventDate) }} · {{ formatTime(t.event.eventDate) }}</span>
          </div>
        </div>

        <!-- Tear line -->
        <div class="tear-line">
          <div class="notch notch-l" />
          <div class="dashes" />
          <div class="notch notch-r" />
        </div>

        <!-- Body -->
        <div class="ticket-body">
          <div class="info-row">
            <!-- Seat -->
            <div v-if="t.rowNumber || t.seatNumber" class="info-block">
              <span class="info-label">Seat</span>
              <span class="info-value">Row {{ t.rowNumber || '—' }} · {{ t.seatNumber || '—' }}</span>
            </div>
            <div v-else class="info-block">
              <span class="info-label">Seat</span>
              <span class="info-value">—</span>
            </div>
            <!-- Price -->
            <div class="info-block text-right">
              <span class="info-label">Paid</span>
              <span class="info-value price">${{ t.price ?? '—' }}</span>
            </div>
          </div>
          <!-- Ticket ID -->
          <div class="info-block">
            <span class="info-label">Ticket ID</span>
            <span class="info-value ticket-id">{{ t.ticketId }}</span>
          </div>

          <!-- Actions -->
          <div class="actions">
            <RouterLink :to="{ path: `/tickets/${t.ticketId}`, query: { status: t.status } }" class="action-link">
              <button :disabled="!canShowQR(t)" class="btn-primary full-btn">
                <svg viewBox="0 0 24 24" class="btn-icon"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3"/></svg>
                Show QR Code
              </button>
            </RouterLink>
            <template v-if="canList(t)">
              <div v-if="listingTicketId === t.ticketId" class="list-inline">
                <input v-model.number="listingPrice" type="number" min="1" placeholder="Set price ($)" class="price-input" />
                <div class="list-inline-btns">
                  <button :disabled="listingLoading" class="btn-primary full-btn" @click="submitListing(t.ticketId)">
                    {{ listingLoading ? 'Listing...' : 'Confirm' }}
                  </button>
                  <button class="btn-secondary full-btn" @click="cancelListing">Cancel</button>
                </div>
              </div>
              <button v-else class="btn-secondary full-btn" @click="startListing(t.ticketId, t.price)">
                <svg viewBox="0 0 24 24" class="btn-icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                List on Marketplace
              </button>
            </template>
            <template v-else-if="t.status === 'listed'">
              <div v-if="unlistingTicketId === t.ticketId" class="list-inline">
                <p class="small muted">Remove this ticket from the marketplace?</p>
                <div class="list-inline-btns">
                  <button :disabled="unlistingLoading" class="btn-danger full-btn" @click="confirmUnlist(t.ticketId)">
                    {{ unlistingLoading ? 'Unlisting...' : 'Confirm Unlist' }}
                  </button>
                  <button class="btn-secondary full-btn" @click="cancelUnlisting">Cancel</button>
                </div>
              </div>
              <button v-else class="btn-secondary full-btn" @click="startUnlisting(t.ticketId)">
                <svg viewBox="0 0 24 24" class="btn-icon"><path d="M18 6L6 18M6 6l12 12"/></svg>
                Unlist from Marketplace
              </button>
            </template>
          </div>
        </div>

      </article>
    </div>
  </section>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
  gap: .5rem;
}
.ticket-count {
  font-size: .82rem;
  color: var(--muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
  padding: .25rem .75rem;
  border-radius: 999px;
}

/* Loading */
.loading-row { display: flex; align-items: center; gap: .75rem; padding: 3rem 0; }
.spinner { width: 1.5rem; height: 1.5rem; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Empty */
.empty-state {
  display: grid;
  place-items: center;
  gap: 1rem;
  padding: 3rem;
  text-align: center;
  max-width: 340px;
  margin: 2rem auto;
}
.empty-icon { width: 2.5rem; height: 2.5rem; fill: none; stroke: var(--muted); stroke-width: 1.5; stroke-linecap: round; opacity: .5; }

/* Grid */
.ticket-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* Card */
.ticket-card {
  border-radius: 1.2rem;
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface-1);
  transition: transform .2s ease, box-shadow .2s ease;
  display: flex;
  flex-direction: column;
}
.ticket-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,.4); }

/* Header */
.ticket-header {
  position: relative;
  height: 140px;
  background-size: cover;
  background-position: center;
  padding: 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: .35rem;
}

.ticket-name {
  font-size: 1.15rem;
  font-weight: 800;
  color: #fff;
  margin: 0;
  line-height: 1.25;
  text-shadow: 0 1px 4px rgba(0,0,0,.5);
}

.header-date {
  display: flex;
  align-items: center;
  gap: .4rem;
  font-size: .78rem;
  color: rgba(255,255,255,.85);
}
.hd-icon { width: .8rem; height: .8rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; flex-shrink: 0; }

/* Status pill — positioned top-right in header */
.status-pill {
  position: absolute;
  top: .85rem;
  right: .85rem;
  font-size: .7rem;
  font-weight: 700;
  padding: .25rem .65rem;
  border-radius: 999px;
  border: 1px solid transparent;
  backdrop-filter: blur(8px);
}
.status-active   { background: rgba(34,197,94,.25);  color: #4ade80; border-color: rgba(34,197,94,.5); }
.status-used     { background: rgba(107,114,128,.25); color: #d1d5db; border-color: rgba(107,114,128,.5); }
.status-listed   { background: rgba(245,158,11,.25);  color: #fcd34d; border-color: rgba(245,158,11,.5); }
.status-transfer { background: rgba(59,130,246,.25);  color: #93c5fd; border-color: rgba(59,130,246,.5); }
.status-default  { background: rgba(249,115,22,.25);  color: #fdba74; border-color: rgba(249,115,22,.5); }

/* Tear line */
.tear-line {
  display: flex;
  align-items: center;
  background: var(--surface-1);
  position: relative;
}
.notch {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--bg);
  flex-shrink: 0;
  margin: 0 -7px;
  border: 1px solid var(--border);
}
.dashes {
  flex: 1;
  border-top: 2px dashed var(--border);
  margin: 0 4px;
}

/* Body */
.ticket-body {
  padding: 1rem 1.2rem 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.info-block { display: flex; flex-direction: column; gap: .15rem; }
.text-right { align-items: flex-end; }
.info-label { font-size: .72rem; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
.info-value { font-size: .95rem; font-weight: 600; color: var(--text); }
.info-value.ticket-id { font-size: .72rem; font-family: monospace; font-weight: 400; color: var(--muted); word-break: break-all; }
.info-value.price { font-size: 1.2rem; font-weight: 800; color: var(--accent); }

/* Actions */
.actions { display: flex; flex-direction: column; gap: .55rem; }
.action-link { display: block; }
.list-inline { display: flex; flex-direction: column; gap: .45rem; }
.list-inline-btns { display: flex; gap: .45rem; }
.list-inline-btns .full-btn { flex: 1; }
.price-input { width: 100%; padding: .5rem .75rem; border-radius: .65rem; border: 1px solid var(--border); background: var(--surface-2); color: var(--text); font-size: .88rem; }

.full-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: .6rem 1rem;
  font-size: .88rem;
  font-weight: 600;
  border-radius: .65rem;
  cursor: pointer;
  transition: opacity .15s, transform .1s;
}
.full-btn:active { transform: scale(.98); }
.full-btn:disabled { opacity: .35; cursor: default; }

.btn-primary { background: var(--accent); color: #fff; border: none; }
.btn-primary:hover:not(:disabled) { opacity: .88; }

.btn-secondary {
  background: transparent;
  color: var(--muted);
  border: 1px solid var(--border);
}
.btn-secondary:hover { background: var(--surface-2); color: var(--text); }

.btn-danger {
  background: #ef4444;
  color: #fff;
  border: none;
}
.btn-danger:hover:not(:disabled) { opacity: .88; }

.btn-icon { width: .95rem; height: .95rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; flex-shrink: 0; }

@media (max-width: 640px) {
  .ticket-grid { grid-template-columns: 1fr; }
}
</style>
