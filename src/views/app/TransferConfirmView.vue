<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/api/client'

const route = useRoute()
const sellerOtp = ref('')
const buyerOtp = ref('')
const status = ref('PENDING_OTP')
const message = ref('')
const loading = ref(false)

const confirm = async () => {
  loading.value = true
  message.value = ''
  try {
    const { data } = await api.post('/transfer/confirm', {
      transfer_id: route.params.transferId,
      seller_otp: sellerOtp.value,
      buyer_otp: buyerOtp.value,
    })
    status.value = data?.data?.status || 'COMPLETED'
    message.value = `Transfer complete. New owner: ${data?.data?.new_owner_user_id || 'updated'}`
  } catch (e: any) {
    status.value = 'FAILED'
    message.value = e?.response?.data?.error?.code || 'Transfer confirmation failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="page" style="max-width:760px;">
    <article class="glass" style="padding:1rem;display:grid;gap:.8rem;">
      <h1 class="section-title">Confirm Transfer</h1>
      <span class="badge">Transfer: {{ route.params.transferId }}</span>
      <div class="grid-2">
        <div><label>Seller OTP</label><input v-model="sellerOtp" maxlength="6" /></div>
        <div><label>Buyer OTP</label><input v-model="buyerOtp" maxlength="6" /></div>
      </div>
      <button :disabled="loading" @click="confirm">{{ loading ? 'Confirming...' : 'Confirm Transfer' }}</button>
      <p class="small" style="color:#fdba74">{{ message || status }}</p>
      <RouterLink v-if="status==='COMPLETED'" to="/tickets"><button class="secondary">Back to My Tickets</button></RouterLink>
    </article>
  </section>
</template>
