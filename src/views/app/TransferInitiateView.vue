<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const buyerId = ref('')
const credits = ref(100)
const loading = ref(false)
const message = ref('')

const startTransfer = async () => {
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
</script>

<template>
  <section class="page" style="max-width:760px;">
    <article class="glass" style="padding:1rem;display:grid;gap:.8rem;">
      <h1 class="section-title">Transfer Ticket</h1>
      <span class="badge">Seat: {{ route.params.seatId }}</span>
      <div>
        <label>Buyer Email / User ID</label>
        <input v-model="buyerId" placeholder="buyer@email.com or user-id" />
      </div>
      <div>
        <label>Credit Amount</label>
        <input v-model.number="credits" type="number" min="1" />
      </div>
      <button :disabled="loading" @click="startTransfer">{{ loading ? 'Starting...' : 'Start Transfer' }}</button>
      <p class="small" style="color:#fdba74">{{ message }}</p>
    </article>
  </section>
</template>
