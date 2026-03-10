<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import api from '@/api/client'

const route = useRoute()
const payload = ref('')
const countdown = ref(60)
const error = ref('')
const usingFallback = ref(false)
let refreshTimer: number | undefined
let secondTimer: number | undefined

const fetchQr = async () => {
  error.value = ''
  usingFallback.value = false
  try {
    const { data } = await api.get(`/tickets/${route.params.seatId}/qr`)
    payload.value = data?.data?.qr_payload || ''
    countdown.value = data?.data?.ttl_seconds || 60
  } catch (e: any) {
    if (!e?.response) {
      usingFallback.value = true
      payload.value = `DEMO-QR-${route.params.seatId}`
      countdown.value = 60
      error.value = 'Backend unavailable. Showing demo QR.'
    } else {
      const code = e?.response?.data?.error_code
      const status = e?.response?.status
      if (code === 'NOT_SEAT_OWNER' || status === 403) error.value = "You don't own this ticket."
      else if (code === 'SEAT_NOT_FOUND') error.value = 'Ticket not found.'
      else if (code === 'SEAT_UNAVAILABLE') error.value = 'Ticket is not active.'
      else error.value = 'Unable to load QR ticket.'
    }
  }
}

onMounted(() => {
  fetchQr()
  refreshTimer = window.setInterval(fetchQr, 50000)
  secondTimer = window.setInterval(() => {
    countdown.value = Math.max(0, countdown.value - 1)
  }, 1000)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (secondTimer) clearInterval(secondTimer)
})
</script>

<template>
  <section class="page" style="max-width:760px;">
    <article class="glass" style="padding:1rem;display:grid;gap:.8rem;">
      <h1 class="section-title">Ticket QR</h1>
      <span class="badge">Seat: {{ route.params.seatId }}</span>
      <p v-if="usingFallback" class="small">Demo QR active while backend is unavailable.</p>
      <p class="small">QR refreshes in {{ countdown }}s</p>
      <div class="glass" style="padding:1rem;display:grid;place-items:center;min-height:240px;">
        <VueQrcode v-if="payload" :value="payload" :options="{ width: 220 }" />
        <p v-else class="small">Fetching QR payload...</p>
      </div>
      <p v-if="error" class="small" style="color:#fca5a5">{{ error }}</p>
    </article>
  </section>
</template>
