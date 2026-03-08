<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/client'

const route = useRoute()
const payload = ref('')
const countdown = ref(50)
const error = ref('')
let refreshTimer: number | undefined
let secondTimer: number | undefined

const fetchQr = async () => {
  error.value = ''
  try {
    const { data } = await api.get(`/tickets/${route.params.seatId}/qr`)
    payload.value = data?.data?.qr_payload || ''
    countdown.value = data?.data?.ttl_seconds || 50
  } catch (e: any) {
    error.value = e?.response?.status === 403 ? "You don't own this ticket." : 'Unable to load QR ticket.'
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
      <p class="small">QR refreshes in {{ countdown }}s</p>
      <div class="glass" style="padding:1rem;font-family:ui-monospace, SFMono-Regular, Menlo, monospace;word-break:break-word;">
        {{ payload || 'Fetching QR payload...' }}
      </div>
      <p v-if="error" class="small" style="color:#fca5a5">{{ error }}</p>
    </article>
  </section>
</template>
