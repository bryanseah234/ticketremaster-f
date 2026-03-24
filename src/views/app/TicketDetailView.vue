<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import VueQrcode from '@chenfengyuan/vue-qrcode'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const ticketId = route.params.ticketId as string
const qrData = ref<any>(null)
const countdown = ref(60)
const toast = useToast()
let refreshTimer: number | undefined
let secondTimer: number | undefined

const fetchQr = async (notify = false) => {
  if (notify) toast.push('Loading ticket QR...', 'info', 1400)
  try {
    const { data } = await api.get(`/qr/tickets/${ticketId}/qr`)
    qrData.value = data?.data
    if (qrData.value?.expiresAt) {
      countdown.value = Math.max(0, Math.floor((new Date(qrData.value.expiresAt).getTime() - Date.now()) / 1000))
    } else {
      countdown.value = 60
    }
  } catch (e: any) {
    if (!e?.response) {
      qrData.value = { qrHash: `DEMO-QR-${ticketId}` }
      countdown.value = 60
      toast.push('Demo QR shown while backend is unavailable.', 'info', 3200)
    } else {
      const code = e?.response?.data?.error?.code
      const status = e?.response?.status
      const message =
        code === 'AUTH_FORBIDDEN' || status === 403 ? "You don't own this ticket." :
        code === 'TICKET_NOT_FOUND' || status === 404 ? 'Ticket not found.' :
        code === 'QR_INVALID' ? 'Ticket is not active (may be listed or transferred).' :
        'Unable to load QR.'
      toast.push(message, 'error', 3200)
    }
  }
}

const refreshQr = () => {
  fetchQr(false)
  countdown.value = 60
}

onMounted(() => {
  fetchQr(true)
  refreshTimer = window.setInterval(refreshQr, 55000)
  secondTimer = window.setInterval(() => {
    countdown.value = Math.max(0, countdown.value - 1)
    if (countdown.value === 0) refreshQr()
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

      <template v-if="qrData">
        <div style="display:grid;gap:.3rem;">
          <p v-if="qrData.event?.name"><strong>{{ qrData.event.name }}</strong></p>
          <p v-if="qrData.event?.date" class="small">{{ new Date(qrData.event.date).toLocaleString() }}</p>
          <p v-if="qrData.venue?.name" class="small">{{ qrData.venue.name }}</p>
        </div>

        <div class="glass" style="padding:1rem;display:grid;place-items:center;min-height:240px;">
          <VueQrcode :value="qrData.qrHash" :options="{ width: 220 }" />
        </div>

        <p class="small" :style="{ color: countdown < 10 ? '#f97316' : 'inherit' }">
          QR expires in {{ countdown }}s — auto-refreshes
        </p>
      </template>

      <div v-else class="glass" style="padding:1rem;display:grid;place-items:center;min-height:240px;">
        <p class="small">Loading QR...</p>
      </div>
    </article>
  </section>
</template>
