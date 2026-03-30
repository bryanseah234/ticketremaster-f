<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed, onMounted, ref } from 'vue'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import type { Ticket, Event, Venue } from '@/types'

const route = useRoute()
const auth = useAuthStore()
const qrHash = computed(() => route.params.qrHash as string)

const ticket = ref<Ticket | null>(null)
const event = ref<Event | null>(null)
const venue = ref<Venue | null>(null)
const loading = ref(false)
const expiresIn = ref(60)
let countdownInterval: number | undefined

const formattedExpires = computed(() => {
  const secs = expiresIn.value
  return secs > 0 ? `${secs}s` : 'Expired'
})

const formattedDate = computed(() => {
  if (!event.value?.date) return '—'
  return new Date(event.value.date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
})

const formattedTime = computed(() => {
  if (!event.value?.date) return '—'
  return new Date(event.value.date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
})

onMounted(async () => {
  // Start countdown timer
  countdownInterval = window.setInterval(() => {
    if (expiresIn.value > 0) {
      expiresIn.value--
    }
  }, 1000)

  // Load ticket data
  loading.value = true
  try {
    const { data } = await api.get(`/tickets/${qrHash.value}/qr`)
    const ticketData = data?.data
    if (ticketData) {
      ticket.value = ticketData
      event.value = ticketData.event || null
      venue.value = ticketData.venue || null
    }
  } catch (err) {
    console.error('Failed to load ticket:', err)
  } finally {
    loading.value = false
  }
})

// Cleanup on unmount
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>

<template>
  <section class="qr-page">
    <!-- Physical Ticket Stub Container -->
    <div class="ticket-stub">
      <!-- Main Ticket Body -->
      <div class="ticket-body">
        <!-- Left Perforation Notch -->
        <div class="perforation perforation-left">
          <div class="notch"></div>
        </div>

        <!-- Ticket Content -->
        <div class="ticket-content">
          <!-- Header with Logo -->
          <div class="ticket-header">
            <div class="logo-row">
              <svg viewBox="0 0 24 24" class="logo-icon">
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
              </svg>
              <span class="logo-text">TicketRemaster</span>
            </div>
            <div class="verified-badge">
              <svg viewBox="0 0 24 24" class="badge-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Verified
            </div>
          </div>

          <!-- Event Info -->
          <div class="event-section">
            <h1 class="event-name">{{ event?.name || 'Loading...' }}</h1>
            <div class="event-meta">
              <span class="meta-item">
                <svg viewBox="0 0 24 24" class="meta-icon"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                {{ formattedDate }}
              </span>
              <span class="meta-item">
                <svg viewBox="0 0 24 24" class="meta-icon"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                {{ formattedTime }}
              </span>
            </div>
            <p class="venue-name" v-if="venue">{{ venue.name }}</p>
            <p class="venue-address small muted" v-if="venue?.address">{{ venue.address }}</p>
          </div>

          <!-- Divider with perforation effect -->
          <div class="ticket-divider">
            <div class="divider-line"></div>
            <div class="divider-teeth">
              <span></span><span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          </div>

          <!-- QR Code Section -->
          <div class="qr-section">
            <div class="qr-container">
              <!-- Paper texture overlay -->
              <div class="paper-texture"></div>
              <!-- QR Code (placeholder - would be generated dynamically) -->
              <div class="qr-code">
                <svg viewBox="0 0 200 200" class="qr-svg">
                  <!-- Simplified QR pattern placeholder -->
                  <rect x="0" y="0" width="200" height="200" fill="#fff"/>
                  <g fill="#111">
                    <!-- Position patterns -->
                    <rect x="10" y="10" width="50" height="50"/>
                    <rect x="140" y="10" width="50" height="50"/>
                    <rect x="10" y="140" width="50" height="50"/>
                    <rect x="20" y="20" width="30" height="30" fill="#fff"/>
                    <rect x="150" y="20" width="30" height="30" fill="#fff"/>
                    <rect x="20" y="150" width="30" height="30" fill="#fff"/>
                    <rect x="28" y="28" width="14" height="14"/>
                    <rect x="158" y="28" width="14" height="14"/>
                    <rect x="28" y="158" width="14" height="14"/>
                    <!-- Data pattern (simplified) -->
                    <rect x="70" y="10" width="10" height="10"/>
                    <rect x="90" y="10" width="10" height="10"/>
                    <rect x="110" y="10" width="10" height="10"/>
                    <rect x="70" y="30" width="10" height="10"/>
                    <rect x="100" y="30" width="10" height="10"/>
                    <rect x="120" y="30" width="10" height="10"/>
                    <rect x="80" y="50" width="10" height="10"/>
                    <rect x="100" y="50" width="10" height="10"/>
                    <rect x="10" y="70" width="10" height="10"/>
                    <rect x="30" y="70" width="10" height="10"/>
                    <rect x="50" y="70" width="10" height="10"/>
                    <rect x="70" y="70" width="10" height="10"/>
                    <rect x="90" y="70" width="10" height="10"/>
                    <rect x="110" y="70" width="10" height="10"/>
                    <rect x="130" y="70" width="10" height="10"/>
                    <rect x="150" y="70" width="10" height="10"/>
                    <rect x="170" y="70" width="10" height="10"/>
                    <rect x="190" y="70" width="10" height="10"/>
                    <rect x="10" y="90" width="10" height="10"/>
                    <rect x="50" y="90" width="10" height="10"/>
                    <rect x="70" y="90" width="10" height="10"/>
                    <rect x="100" y="90" width="10" height="10"/>
                    <rect x="130" y="90" width="10" height="10"/>
                    <rect x="170" y="90" width="10" height="10"/>
                    <rect x="10" y="110" width="10" height="10"/>
                    <rect x="30" y="110" width="10" height="10"/>
                    <rect x="70" y="110" width="10" height="10"/>
                    <rect x="90" y="110" width="10" height="10"/>
                    <rect x="110" y="110" width="10" height="10"/>
                    <rect x="150" y="110" width="10" height="10"/>
                    <rect x="190" y="110" width="10" height="10"/>
                    <!-- More data patterns -->
                    <rect x="70" y="130" width="10" height="10"/>
                    <rect x="90" y="130" width="10" height="10"/>
                    <rect x="110" y="130" width="10" height="10"/>
                    <rect x="130" y="130" width="10" height="10"/>
                    <rect x="150" y="130" width="10" height="10"/>
                    <rect x="170" y="130" width="10" height="10"/>
                    <rect x="190" y="130" width="10" height="10"/>
                    <rect x="70" y="150" width="10" height="10"/>
                    <rect x="100" y="150" width="10" height="10"/>
                    <rect x="130" y="150" width="10" height="10"/>
                    <rect x="170" y="150" width="10" height="10"/>
                    <rect x="70" y="170" width="10" height="10"/>
                    <rect x="90" y="170" width="10" height="10"/>
                    <rect x="110" y="170" width="10" height="10"/>
                    <rect x="130" y="170" width="10" height="10"/>
                    <rect x="150" y="170" width="10" height="10"/>
                    <rect x="170" y="170" width="10" height="10"/>
                    <rect x="190" y="170" width="10" height="10"/>
                    <rect x="70" y="190" width="10" height="10"/>
                    <rect x="100" y="190" width="10" height="10"/>
                    <rect x="130" y="190" width="10" height="10"/>
                    <rect x="150" y="190" width="10" height="10"/>
                    <rect x="190" y="190" width="10" height="10"/>
                  </g>
                </svg>
              </div>
            </div>
            
            <!-- Expiry Timer -->
            <p class="qr-timer">
              QR expires in <span :class="{ 'expiring': expiresIn < 10 }">{{ formattedExpires }}</span>
            </p>
            
            <!-- Ticket Reference -->
            <p class="ticket-ref">
              REF: {{ qrHash.slice(0, 12).toUpperCase() }}
            </p>
          </div>

          <!-- Instructions -->
          <p class="instruction">Present this ticket to venue staff at the gate for entry verification.</p>

          <!-- Bottom Logo -->
          <div class="bottom-logo">
            <svg viewBox="0 0 24 24" class="bottom-logo-icon">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
            </svg>
            <span>TicketRemaster</span>
          </div>
        </div>

        <!-- Right Perforation Notch -->
        <div class="perforation perforation-right">
          <div class="notch"></div>
        </div>
      </div>

      <!-- Rough cut edge effects (top and bottom) -->
      <div class="rough-edge rough-edge-top"></div>
      <div class="rough-edge rough-edge-bottom"></div>
    </div>
  </section>
</template>

<style scoped>
.qr-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem 1rem;
  background: var(--bg);
}

/* Ticket Stub Container */
.ticket-stub {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: #faf8f5;
  border-radius: 16px;
  overflow: visible;
  box-shadow: 
    0 4px 6px rgba(0,0,0,0.1),
    0 10px 20px rgba(0,0,0,0.15),
    inset 0 1px 0 rgba(255,255,255,0.8);
}

/* Paper texture overlay */
.ticket-stub::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.01) 2px,
      rgba(0,0,0,0.01) 4px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.008) 2px,
      rgba(0,0,0,0.008) 4px
    );
  pointer-events: none;
  z-index: 1;
  border-radius: 16px;
}

.ticket-body {
  display: flex;
  position: relative;
  z-index: 2;
}

/* Perforation Notches */
.perforation {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 80px;
  z-index: 3;
}

.perforation-left {
  left: -15px;
}

.perforation-right {
  right: -15px;
}

.notch {
  width: 100%;
  height: 100%;
  background: var(--bg);
  border-radius: 50%;
  box-shadow: 
    inset 2px 0 4px rgba(0,0,0,0.1),
    0 0 0 2px rgba(0,0,0,0.05);
}

/* Ticket Content */
.ticket-content {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Header */
.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.logo-icon {
  width: 1.2rem;
  height: 1.2rem;
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
}

.logo-text {
  font-size: 0.85rem;
  font-weight: 800;
  color: #333;
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  font-weight: 700;
  color: #4ade80;
  background: rgba(34,197,94,.15);
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
}

.badge-icon {
  width: 0.7rem;
  height: 0.7rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
}

/* Event Section */
.event-section {
  text-align: center;
  padding: 0.5rem 0;
}

.event-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #111;
  margin: 0 0 0.4rem 0;
  line-height: 1.3;
}

.event-meta {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.3rem;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: #666;
}

.meta-icon {
  width: 0.8rem;
  height: 0.8rem;
  fill: none;
  stroke: #999;
  stroke-width: 1.5;
}

.venue-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #444;
  margin: 0.2rem 0;
}

.venue-address {
  font-size: 0.75rem;
  color: #999;
  margin: 0;
}

/* Divider */
.ticket-divider {
  position: relative;
  margin: 0.3rem 0;
}

.divider-line {
  border-top: 2px dashed #ddd;
}

.divider-teeth {
  display: flex;
  justify-content: space-between;
  position: absolute;
  top: -4px;
  left: 0;
  right: 0;
}

.divider-teeth span {
  width: 8px;
  height: 8px;
  background: var(--bg);
  border-radius: 50%;
}

/* QR Section */
.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem;
  background: rgba(255,255,255,0.5);
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.05);
}

.qr-container {
  position: relative;
  width: 160px;
  height: 160px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 
    inset 0 2px 4px rgba(0,0,0,0.08),
    0 2px 4px rgba(0,0,0,0.06);
}

/* Paper texture on QR */
.paper-texture {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 1px,
      rgba(0,0,0,0.02) 1px,
      rgba(0,0,0,0.02) 2px
    );
  pointer-events: none;
  z-index: 1;
}

.qr-code {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  padding: 10px;
  box-sizing: border-box;
}

.qr-svg {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

/* QR Timer - Orange monospace */
.qr-timer {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.85rem;
  font-weight: 700;
  color: #FF8000;
  margin: 0;
  letter-spacing: 0.05em;
}

.qr-timer span {
  font-weight: 700;
}

.qr-timer span.expiring {
  color: #ef4444;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Ticket Reference */
.ticket-ref {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.65rem;
  color: #999;
  margin: 0;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* Instruction */
.instruction {
  font-size: 0.75rem;
  color: #999;
  text-align: center;
  line-height: 1.5;
  margin: 0;
}

/* Bottom Logo */
.bottom-logo {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3rem;
  font-size: 0.65rem;
  font-weight: 700;
  color: #ccc;
  padding-top: 0.3rem;
  border-top: 1px solid rgba(0,0,0,0.05);
}

.bottom-logo-icon {
  width: 0.8rem;
  height: 0.8rem;
  fill: none;
  stroke: #ddd;
  stroke-width: 2;
}

/* Rough Edge Effects */
.rough-edge {
  position: absolute;
  left: 0;
  right: 0;
  height: 8px;
  z-index: 4;
  background: var(--bg);
}

.rough-edge-top {
  top: -4px;
  border-radius: 16px 16px 0 0;
  clip-path: polygon(
    0% 0%, 100% 0%, 100% 100%,
    97% 60%, 94% 100%, 91% 40%, 88% 100%, 85% 50%, 82% 100%,
    79% 40%, 76% 100%, 73% 50%, 70% 100%, 67% 40%, 64% 100%,
    61% 50%, 58% 100%, 55% 40%, 52% 100%, 49% 50%, 46% 100%,
    43% 40%, 40% 100%, 37% 50%, 34% 100%, 31% 40%, 28% 100%,
    25% 50%, 22% 100%, 19% 40%, 16% 100%, 13% 50%, 10% 100%,
    7% 40%, 4% 100%, 0% 60%
  );
}

.rough-edge-bottom {
  bottom: -4px;
  border-radius: 0 0 16px 16px;
  clip-path: polygon(
    0% 0%, 100% 0%, 100% 100%, 0% 100%,
    3% 40%, 6% 100%, 9% 50%, 12% 100%, 15% 40%, 18% 100%,
    21% 50%, 24% 100%, 27% 40%, 30% 100%, 33% 50%, 36% 100%,
    39% 40%, 42% 100%, 45% 50%, 48% 100%, 51% 40%, 54% 100%,
    57% 50%, 60% 100%, 63% 40%, 66% 100%, 69% 50%, 72% 100%,
    75% 40%, 78% 100%, 81% 50%, 84% 100%, 87% 40%, 90% 100%,
    93% 50%, 96% 100%
  );
}

.muted { color: #999; }
.small { font-size: 0.75rem; }

/* Responsive */
@media (max-width: 480px) {
  .ticket-content {
    padding: 1.2rem 1rem;
  }
  
  .event-name {
    font-size: 1rem;
  }
  
  .qr-container {
    width: 140px;
    height: 140px;
  }
  
  .perforation {
    width: 20px;
    height: 60px;
  }
  
  .perforation-left { left: -10px; }
  .perforation-right { right: -10px; }
}
</style>
