<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/api/client'
import type { Event, Ticket, Venue } from '@/types'
import { isDemoMode, mockTickets } from '@/services/mockData'

const route = useRoute()
const qrHash = computed(() => route.params.qrHash as string)

const ticket = ref<Ticket | null>(null)
const event = ref<Event | null>(null)
const venue = ref<Venue | null>(null)
const loading = ref(false)
const expiresIn = ref(60)
let countdownInterval: number | undefined

const formattedExpires = computed(() => (expiresIn.value > 0 ? `${expiresIn.value}s` : 'Expired'))
const formattedDate = computed(() => {
  if (!event.value?.date) return 'Date TBA'
  return new Date(event.value.date).toLocaleDateString('en-SG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
})
const formattedTime = computed(() => {
  if (!event.value?.date) return 'Time TBA'
  return new Date(event.value.date).toLocaleTimeString('en-SG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
})
const qrCells = computed(() =>
  Array.from({ length: 81 }, (_, index) => {
    const code = qrHash.value.charCodeAt(index % qrHash.value.length) || 0
    return ((code + index * 7) % 3) === 0
  }),
)

onMounted(async () => {
  countdownInterval = window.setInterval(() => {
    if (expiresIn.value > 0) expiresIn.value--
  }, 1000)

  loading.value = true
  try {
    if (isDemoMode()) {
      const fallback = mockTickets.find((item) => item.qrHash === qrHash.value || item.ticketId === qrHash.value) || null
      if (fallback) {
        ticket.value = fallback
        event.value = fallback.event as Event
        venue.value = fallback.venue as Venue
      }
      return
    }
    const { data } = await api.get(`/tickets/${qrHash.value}/qr`)
    const ticketData = data?.data
    if (ticketData) {
      ticket.value = ticketData
      event.value = ticketData.event || null
      venue.value = ticketData.venue || null
    }
  } catch (error) {
    const fallback = mockTickets.find((item) => item.qrHash === qrHash.value || item.ticketId === qrHash.value) || null
    if (fallback) {
      ticket.value = fallback
      event.value = fallback.event as Event
      venue.value = fallback.venue as Venue
    } else {
      console.error('Failed to load ticket:', error)
    }
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<template>
  <section class="qr-page">
    <div class="crumb"><RouterLink to="/tickets">Back to My Tickets</RouterLink></div>

    <article class="ticket-shell panel">
      <div class="qr-column">
        <div class="qr-paper">
          <div class="qr-grid">
            <span v-for="(filled, index) in qrCells" :key="index" :class="{ filled }"></span>
          </div>
        </div>
        <p class="qr-timer">Refreshes in <span :class="{ expiring: expiresIn < 10 }">{{ formattedExpires }}</span></p>
        <p class="qr-reference">REF: {{ qrHash.slice(0, 14).toUpperCase() }}</p>
      </div>

      <div class="details-column">
        <div class="details-head">
          <div>
            <p class="eyebrow">Electronic Ticket</p>
            <h1>{{ event?.name || (loading ? 'Loading ticket...' : 'Ticket unavailable') }}</h1>
            <p class="muted">{{ venue?.name || 'Venue TBA' }}</p>
          </div>
          <span class="status-pill">{{ ticket?.status || 'active' }}</span>
        </div>

        <div class="detail-grid">
          <div>
            <span class="meta-label">Section</span>
            <strong>{{ ticket?.seat?.section || 'GA' }}</strong>
          </div>
          <div>
            <span class="meta-label">Row</span>
            <strong>{{ ticket?.seat?.rowNumber || '--' }}</strong>
          </div>
          <div>
            <span class="meta-label">Seat</span>
            <strong>{{ ticket?.seat?.seatNumber || '--' }}</strong>
          </div>
          <div>
            <span class="meta-label">Ticket ID</span>
            <strong>{{ ticket?.ticketId || qrHash }}</strong>
          </div>
        </div>

        <div class="detail-list">
          <div><span>{{ formattedDate }}</span></div>
          <div><span>{{ formattedTime }}</span></div>
          <div><span>{{ venue?.address || 'Present this code to venue staff for entry verification.' }}</span></div>
        </div>

        <div class="actions">
          <button>Add to Wallet</button>
          <RouterLink :to="`/transfer/initiate?ticketId=${ticket?.ticketId || ''}`">
            <button class="secondary">Transfer Ticket</button>
          </RouterLink>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.qr-page { display: grid; gap: 1rem; max-width: 70rem; margin: 0 auto; }
.crumb a { color: var(--text-muted); }
.ticket-shell {
  display: grid; grid-template-columns: minmax(18rem, 24rem) minmax(0, 1fr); overflow: hidden; padding: 0;
  box-shadow: 0 1.5rem 5rem rgba(249,115,22,.08);
}
.qr-column {
  display: grid; place-items: center; align-content: center; gap: 1rem; padding: 2rem;
  background: #f6f3ee; color: #111; border-right: 1px dashed rgba(0,0,0,.18);
}
.qr-paper {
  padding: 1rem; border-radius: 1rem; background: white; border: 2px dashed rgba(0,0,0,.12); box-shadow: inset 0 .2rem .7rem rgba(0,0,0,.05);
}
.qr-grid {
  display: grid; grid-template-columns: repeat(9, 1fr); gap: .35rem; width: 14rem; height: 14rem;
}
.qr-grid span { border-radius: .18rem; background: rgba(0,0,0,.06); }
.qr-grid span.filled { background: #111; }
.qr-timer, .qr-reference {
  margin: 0; font-family: 'Courier New', Courier, monospace; font-weight: 700; letter-spacing: .08em;
}
.qr-timer span { color: #f97316; }
.qr-timer span.expiring { color: #dc2626; }
.qr-reference { color: rgba(0,0,0,.5); font-size: .75rem; }
.details-column { display: grid; gap: 1.25rem; padding: 2rem; }
.details-head { display: flex; justify-content: space-between; gap: 1rem; align-items: start; }
.eyebrow, .meta-label {
  display: block; font-size: .7rem; font-weight: 800; letter-spacing: .18em; text-transform: uppercase;
}
.eyebrow { color: var(--primary); margin: 0 0 .5rem; }
.meta-label { color: var(--text-dim); margin-bottom: .3rem; }
.details-head h1 {
  margin: 0 0 .25rem; font-family: var(--font-display); font-size: clamp(2rem, 4vw, 3.2rem); line-height: .95; letter-spacing: -.04em;
}
.muted { margin: 0; color: var(--text-muted); }
.status-pill {
  padding: .45rem .75rem; border-radius: 999px; background: rgba(249,115,22,.14); color: var(--primary);
  font-size: .7rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase;
}
.detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 1rem; padding: 1rem 0; border-block: 1px solid rgba(255,255,255,.06); }
.detail-grid strong { display: block; }
.detail-list { display: grid; gap: .75rem; color: var(--text-muted); }
.actions { display: flex; gap: .75rem; flex-wrap: wrap; }
@media (max-width: 860px) {
  .ticket-shell, .detail-grid { grid-template-columns: 1fr; }
  .qr-column { border-right: 0; border-bottom: 1px dashed rgba(0,0,0,.18); }
}
</style>
