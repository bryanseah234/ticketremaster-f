<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'

const tickets = ref<any[]>([])
const loading = ref(false)
const toast = useToast()

const fallbackTickets = [
  { ticketId: 'demo-101', status: 'active', event: { name: 'Neon Skyline Festival', eventDate: '2026-04-12T20:00:00Z' }, rowNumber: 'B', seatNumber: 18, price: 120, createdAt: '2026-03-02T19:30:00Z' },
  { ticketId: 'demo-102', status: 'active', event: { name: 'Midnight Bass District', eventDate: '2026-05-03T19:30:00Z' }, rowNumber: 'D', seatNumber: 9, price: 85, createdAt: '2026-02-18T14:20:00Z' },
]

const load = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/qr/tickets')
    tickets.value = data?.data?.tickets || data?.data || []
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
  if (status === 'listed') return 'Listed'
  if (status === 'pending_transfer') return 'In Transfer'
  if (status === 'transferred') return 'Transferred'
  return s || 'Active'
}

const formatEventDate = (d?: string) => {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const formatEventTime = (d?: string) => {
  if (!d) return null
  return new Date(d).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
}

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
      <article v-for="t in tickets" :key="t.ticketId" class="ticket-card glass">

        <!-- Colour strip -->
        <div :class="['ticket-strip', statusColor(t.status)]" />

        <div class="ticket-body">
          <!-- Top row: event name + status -->
          <div class="ticket-top">
            <div class="ticket-title-wrap">
              <h3 class="ticket-name">{{ t.event?.name || 'Event' }}</h3>
              <span :class="['status-pill', statusColor(t.status)]">{{ statusLabel(t.status) }}</span>
            </div>
          </div>

          <!-- Event meta -->
          <div class="ticket-meta">
            <div v-if="t.event?.eventDate" class="meta-item">
              <svg viewBox="0 0 24 24" class="meta-icon"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              <span>{{ formatEventDate(t.event.eventDate) }}</span>
            </div>
            <div v-if="t.event?.eventDate" class="meta-item">
              <svg viewBox="0 0 24 24" class="meta-icon"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span>{{ formatEventTime(t.event.eventDate) }}</span>
            </div>
            <div v-if="t.seatRow || t.seatNumber" class="meta-item">
              <svg viewBox="0 0 24 24" class="meta-icon"><path d="M20 9V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z"/></svg>
              <span>Row {{ t.seatRow }} · Seat {{ t.seatNumber }}</span>
            </div>
          </div>

          <!-- Divider (perforated look) -->
          <div class="ticket-divider">
            <div class="notch notch-left" />
            <div class="dashes" />
            <div class="notch notch-right" />
          </div>

          <!-- Bottom row: price + action -->
          <div class="ticket-footer">
            <div>
              <p class="footer-label">Paid</p>
              <p class="footer-price">${{ t.price ?? '—' }}</p>
            </div>
            <RouterLink :to="`/tickets/${t.ticketId}`">
              <button :disabled="t.status === 'used' || t.status === 'transferred'" class="qr-btn">
                <svg viewBox="0 0 24 24" class="qr-icon"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3"/></svg>
                Show QR
              </button>
            </RouterLink>
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
  margin-bottom: 1.5rem;
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

/* Card */
.ticket-card {
  display: flex;
  overflow: hidden;
  border-radius: 1rem;
  padding: 0;
  transition: transform .2s ease, box-shadow .2s ease;
}
.ticket-card:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0,0,0,.35); }

/* Left colour strip */
.ticket-strip { width: 5px; flex-shrink: 0; }
.status-active  { background: #22c55e; }
.status-used    { background: #6b7280; }
.status-listed  { background: #f59e0b; }
.status-transfer { background: #3b82f6; }
.status-default { background: var(--accent); }

/* Body */
.ticket-body { flex: 1; padding: 1.1rem 1.2rem; display: grid; gap: .75rem; min-width: 0; }

.ticket-top { display: grid; gap: .35rem; }
.ticket-title-wrap { display: flex; align-items: flex-start; justify-content: space-between; gap: .5rem; }
.ticket-name { font-size: 1rem; font-weight: 700; line-height: 1.3; margin: 0; flex: 1; min-width: 0; }

/* Status pill */
.status-pill {
  font-size: .7rem;
  font-weight: 600;
  padding: .2rem .6rem;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
  border: 1px solid transparent;
}
.status-pill.status-active  { background: rgba(34,197,94,.15);  color: #4ade80; border-color: rgba(34,197,94,.3); }
.status-pill.status-used    { background: rgba(107,114,128,.15); color: #9ca3af; border-color: rgba(107,114,128,.3); }
.status-pill.status-listed  { background: rgba(245,158,11,.15);  color: #fbbf24; border-color: rgba(245,158,11,.3); }
.status-pill.status-transfer { background: rgba(59,130,246,.15); color: #60a5fa; border-color: rgba(59,130,246,.3); }
.status-pill.status-default { background: rgba(249,115,22,.15);  color: #fb923c; border-color: rgba(249,115,22,.3); }

/* Meta */
.ticket-meta { display: grid; gap: .35rem; }
.meta-item { display: flex; align-items: center; gap: .45rem; font-size: .82rem; color: var(--muted); }
.meta-icon { width: .9rem; height: .9rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; flex-shrink: 0; }

/* Perforated divider */
.ticket-divider {
  display: flex;
  align-items: center;
  margin: .1rem -.05rem;
  position: relative;
}
.notch {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--bg);
  flex-shrink: 0;
  margin: 0 -5px;
}
.dashes {
  flex: 1;
  border-top: 1.5px dashed var(--border);
  margin: 0 4px;
}

/* Footer */
.ticket-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.footer-label { font-size: .72rem; color: var(--muted); margin-bottom: .1rem; }
.footer-price { font-size: 1.1rem; font-weight: 700; }

.qr-btn {
  display: flex;
  align-items: center;
  gap: .4rem;
  padding: .45rem 1rem;
  font-size: .85rem;
  font-weight: 600;
  border-radius: .5rem;
}
.qr-btn:disabled { opacity: .4; cursor: default; }
.qr-icon { width: .95rem; height: .95rem; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }

@media (max-width: 640px) {
  .ticket-grid { grid-template-columns: 1fr; }
}
</style>
