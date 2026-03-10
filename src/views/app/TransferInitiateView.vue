<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const buyerId = ref('')
const credits = ref(100)
const loading = ref(false)
const message = ref('')
const isOffline = ref(Boolean((window as any).__apiOffline))

const handleOffline = () => {
  isOffline.value = true
}

const handleOnline = () => {
  isOffline.value = false
}

const startTransfer = async () => {
  if (isOffline.value) {
    message.value = 'Transfers are disabled while the backend is unavailable.'
    toast.push(message.value, 'error', 3200)
    return
  }
  if (!auth.state.user) return
  loading.value = true
  message.value = ''
  try {
    const { data } = await api.post('/transfer/initiate', {
      seat_id: route.params.seatId,
      seller_user_id: auth.state.user.user_id,
      buyer_user_id: buyerId.value,
      credits_amount: credits.value,
    })
    router.push(`/transfer/${data?.data?.transfer_id}`)
  } catch (e: any) {
    const code = e?.response?.data?.error_code
    if (code === 'NOT_SEAT_OWNER') message.value = "You don't own this ticket."
    else if (code === 'INSUFFICIENT_CREDITS') message.value = 'Buyer does not have enough credits.'
    else if (code === 'TRANSFER_IN_PROGRESS') message.value = 'A transfer is already pending for this ticket.'
    else if (code === 'SELF_TRANSFER') message.value = 'You cannot transfer to yourself.'
    else if (code === 'SEAT_UNAVAILABLE') message.value = 'Seat is not eligible for transfer.'
    else if (code === 'USER_NOT_FOUND') message.value = 'Buyer not found.'
    else if (code === 'SEAT_NOT_FOUND') message.value = 'Seat not found.'
    else message.value = 'Transfer initiation failed.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.addEventListener('api:offline', handleOffline)
  window.addEventListener('api:online', handleOnline)
})

onUnmounted(() => {
  window.removeEventListener('api:offline', handleOffline)
  window.removeEventListener('api:online', handleOnline)
})
</script>

<template>
  <section class="page" style="max-width:760px;">
    <article class="glass" style="padding:1rem;display:grid;gap:.8rem;">
      <h1 class="section-title">Transfer Ticket</h1>
      <span class="badge">Seat: {{ route.params.seatId }}</span>
      <div>
        <label>Buyer Email / User ID</label>
        <input v-model="buyerId" placeholder="buyer@email.com or user-id" :disabled="isOffline" />
      </div>
      <div>
        <label>Credit Amount</label>
        <input v-model.number="credits" type="number" min="1" :disabled="isOffline" />
      </div>
      <button :disabled="loading || isOffline" @click="startTransfer">{{ loading ? 'Starting...' : 'Start Transfer' }}</button>
      <p class="small" style="color:#fdba74">{{ message }}</p>
    </article>
  </section>
</template>
