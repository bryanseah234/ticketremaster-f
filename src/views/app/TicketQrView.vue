<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeftIcon, CalendarDaysIcon, MapPinIcon, WalletIcon } from '@heroicons/vue/24/outline'
import QRCode from 'qrcode'
import api from '@/api/client'
import type { Event, Ticket, Venue } from '@/types'
import { isDemoMode, mockTickets } from '@/services/mockData'

const route = useRoute()
const qrHash = computed(() => route.params.qrHash as string)
const isQrHashToken = computed(() => /^[a-f0-9]{64}$/i.test(qrHash.value))

const ticket = ref<Ticket | null>(null)
const event = ref<Event | null>(null)
const venue = ref<Venue | null>(null)
const loading = ref(false)
const expiresIn = ref(60)
const qrCanvas = ref<HTMLCanvasElement | null>(null)
let countdownInterval: number | undefined

const renderQr = async (value: string) => {
  if (!qrCanvas.value || !value) return
  await QRCode.toCanvas(qrCanvas.value, value, {
    width: 224,
    margin: 1,
    color: { dark: '#111111', light: '#f5f5f5' },
    errorCorrectionLevel: 'M',
  })
}

watch(qrHash, (val) => { if (val) renderQr(val) })

const formattedExpires = computed(() => (expiresIn.value > 0 ? `${expiresIn.value}s` : 'Expired'))
const formattedDate = computed(() => {
  if (!event.value?.date) return 'Date TBA'
  return new Date(event.value.date).toLocaleDateString('en-SG', {
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
const ticketStatusLabel = computed(() => (ticket.value?.status === 'active' ? 'confirmed' : ticket.value?.status || 'confirmed'))
const displayEventName = computed(() => event.value?.name || (loading.value ? 'Loading ticket...' : 'Ticket details unavailable'))
const displayVenueName = computed(() => venue.value?.name || 'Venue unavailable')
const displaySection = computed(() => ticket.value?.seat?.section || '--')
const displayRow = computed(() => ticket.value?.seat?.rowNumber || '--')
const displaySeat = computed(() => ticket.value?.seat?.seatNumber || '--')
const displayGate = computed(() => (ticket.value?.seat as any)?.gate || '--')

const applyTicketContext = (payload: any) => {
  if (!payload) return
  ticket.value = {
    ...(ticket.value || {}),
    ...payload,
    qrHash: payload.qrHash || ticket.value?.qrHash || qrHash.value,
    seat: payload.seat || ticket.value?.seat,
  } as Ticket
  event.value = payload.event || event.value
  venue.value = payload.venue || venue.value
}

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
    const endpoint = isQrHashToken.value ? `/tickets/qr/${qrHash.value}` : `/tickets/${qrHash.value}/qr`
    const { data } = await api.get(endpoint)
    const ticketData = data?.data
    if (ticketData) {
      applyTicketContext(ticketData)
    }
  } catch (error) {
    const fallback = mockTickets.find((item) => item.qrHash === qrHash.value || item.ticketId === qrHash.value) || null
    if (fallback) {
      applyTicketContext({
        ...fallback,
        event: fallback.event as Event,
        venue: fallback.venue as Venue,
      })
    } else {
      console.error('Failed to load ticket:', error)
    }
  } finally {
    loading.value = false
    await renderQr(ticket.value?.qrHash || qrHash.value)
  }
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
})
</script>

<template>
  <section class="qr-page">
    <div class="crumb">
      <RouterLink to="/tickets">
        <ArrowLeftIcon class="crumb-icon" />
        <span>Back to My Tickets</span>
      </RouterLink>
    </div>

    <header class="qr-header">
      <h2><span>Your</span> Ticket</h2>
    </header>

    <article class="ticket-shell">
      <div class="qr-column">
        <div class="qr-paper">
          <canvas ref="qrCanvas"></canvas>
        </div>

        <div class="qr-timer">
          <span class="timer-icon">↻</span>
          <span>Refreshes in {{ formattedExpires }}</span>
        </div>
      </div>

      <div class="details-column">
        <div class="details-head">
          <div>
            <p class="eyebrow">Electronic Ticket</p>
            <h1>{{ displayEventName }}</h1>
            <p class="subhead">{{ displayVenueName }}</p>
          </div>
          <span class="status-pill">{{ ticketStatusLabel }}</span>
        </div>

        <div class="detail-grid">
          <div>
            <label>Section</label>
            <p>{{ displaySection }}</p>
          </div>
          <div>
            <label>Row</label>
            <p>{{ displayRow }}</p>
          </div>
          <div>
            <label>Seat</label>
            <p>{{ displaySeat }}</p>
          </div>
          <div>
            <label>Gate</label>
            <p>{{ displayGate }}</p>
          </div>
        </div>

        <div class="detail-list">
          <div>
            <CalendarDaysIcon class="detail-icon" />
            <span>{{ formattedDate }} • {{ formattedTime }}</span>
          </div>
          <div>
            <MapPinIcon class="detail-icon" />
            <span>{{ venue?.address || 'Present this code to venue staff for entry verification.' }}</span>
          </div>
        </div>

        <div class="actions">
          <button>
            <WalletIcon class="wallet-icon" />
            <span>Add to Apple Wallet</span>
          </button>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.qr-page {
  width: min(100% - 3rem, 68rem);
  margin: 0 auto;
  padding: 7.5rem 0 4.5rem;
  display: grid;
  gap: 1.5rem;
}

.crumb a {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: rgba(255, 255, 255, 0.62);
  transition: color 0.18s ease, transform 0.18s ease;
}

.crumb a:hover {
  color: var(--text);
}

.crumb-icon {
  width: 0.95rem;
  height: 0.95rem;
}

.qr-header {
  text-align: center;
}

.qr-header h2 {
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(2.6rem, 5.3vw, 4.2rem);
  font-weight: 900;
  letter-spacing: -0.06em;
}

.qr-header h2 span {
  color: var(--primary);
}

.ticket-shell {
  display: grid;
  grid-template-columns: minmax(18rem, 0.7fr) minmax(0, 1fr);
  overflow: hidden;
  border-radius: 1.6rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(38, 38, 38, 0.7);
  box-shadow: 0 24px 80px rgba(249, 115, 22, 0.12);
  backdrop-filter: blur(20px);
}

.qr-column {
  position: relative;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 1rem;
  padding: 2.5rem;
  background: #fff;
  color: #101010;
  border-right: 1px dashed rgba(0, 0, 0, 0.18);
}

.qr-column::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -1rem;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: var(--background);
  transform: translateY(-50%);
}

.qr-paper {
  padding: 1rem;
  border-radius: 1rem;
  background: #f5f5f5;
  border: 2px dashed rgba(0, 0, 0, 0.12);
}


.qr-timer {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: rgba(0, 0, 0, 0.58);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.timer-icon {
  font-size: 0.85rem;
}

.details-column {
  display: grid;
  gap: 1.5rem;
  padding: 1.75rem 1.9rem;
  background: rgba(32, 31, 31, 0.32);
}

.details-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: start;
}

.eyebrow,
.detail-grid label {
  display: block;
  margin-bottom: 0.3rem;
  color: var(--primary);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.details-head h1 {
  margin: 0 0 0.35rem;
  font-family: var(--font-display);
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 900;
  line-height: 0.96;
  letter-spacing: -0.05em;
}

.subhead {
  margin: 0;
  color: var(--text-muted);
}

.status-pill {
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.12);
  border: 1px solid rgba(249, 115, 22, 0.18);
  color: var(--primary);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1.25rem;
  padding: 1.25rem 0;
  border-block: 1px solid rgba(255, 255, 255, 0.06);
}

.detail-grid p,
.detail-list span {
  margin: 0;
  color: #fff;
  font-weight: 700;
}

.detail-list {
  display: grid;
  gap: 0.75rem;
}

.detail-list div {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.detail-icon {
  width: 1rem;
  height: 1rem;
  color: var(--primary);
  flex-shrink: 0;
}

.detail-list span {
  color: var(--text-muted);
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.wallet-icon {
  width: 1rem;
  height: 1rem;
}

@media (max-width: 860px) {
  .ticket-shell,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .qr-column {
    border-right: 0;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.18);
  }

  .qr-column::after {
    display: none;
  }
}

@media (max-width: 720px) {
  .qr-page {
    width: min(100% - 1rem, 74rem);
    padding-top: 6.5rem;
  }
}
</style>
