<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const payload = ref('')
const countdown = ref(60)
const toast = useToast()
let refreshTimer: number | undefined
let secondTimer: number | undefined

const fetchQr = async (notify = false) => {
  if (notify) toast.push('Loading ticket QR...', 'info', 1400)
  try {
    const { data } = await api.get(`/tickets/${route.params.seatId}/qr`)
    payload.value = data?.data?.qr_payload || ''
    countdown.value = data?.data?.ttl_seconds || 60
  } catch (e: any) {
    if (!e?.response) {
      payload.value = `DEMO-QR-${route.params.seatId}`
      countdown.value = 60
      toast.push('Demo QR is shown while the backend is unavailable.', 'info', 3200)
    } else {
      const code = e?.response?.data?.error_code
      const status = e?.response?.status
      const message = code === 'NOT_SEAT_OWNER' || status === 403 ? "You don't own this ticket." :
        code === 'SEAT_NOT_FOUND' ? 'Ticket not found.' :
          code === 'SEAT_UNAVAILABLE' ? 'Ticket is not active.' :
            'Unable to load QR ticket.'
      toast.push(message, 'error', 3200)
    }
  }
}

onMounted(() => {
  fetchQr(true)
  refreshTimer = window.setInterval(() => fetchQr(false), 50000)
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
      <p class="small">QR refreshes in {{ countdown }}s</p>
      <div class="glass" style="padding:1rem;display:grid;place-items:center;min-height:240px;">
        <VueQrcode v-if="payload" :value="payload" :options="{ width: 220 }" />
      </div>
    </article>
  </section>
</template>
