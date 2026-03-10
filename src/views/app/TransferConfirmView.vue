<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const toast = useToast()
const sellerOtp = ref('')
const buyerOtp = ref('')
const status = ref('PENDING_OTP')
const message = ref('')
const loading = ref(false)
const isOffline = ref(Boolean((window as any).__apiOffline))

const handleOffline = () => {
  isOffline.value = true
}

const handleOnline = () => {
  isOffline.value = false
}

const confirm = async () => {
  if (isOffline.value) {
    message.value = 'Transfer confirmation is disabled while the backend is unavailable.'
    toast.push(message.value, 'error', 3200)
    return
  }
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
    const code = e?.response?.data?.error_code
    if (code === 'OTP_INVALID') message.value = 'One or both OTP codes are wrong.'
    else if (code === 'OTP_EXPIRED') message.value = 'OTP expired. Re-initiate the transfer.'
    else if (code === 'OTP_MAX_RETRIES') message.value = 'Too many attempts. Transfer cancelled.'
    else if (code === 'TRANSFER_INVALID_STATE') message.value = 'This transfer is no longer active.'
    else if (code === 'TRANSFER_NOT_FOUND') message.value = 'Transfer not found.'
    else message.value = 'Transfer confirmation failed.'
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
      <h1 class="section-title">Confirm Transfer</h1>
      <span class="badge">Transfer: {{ route.params.transferId }}</span>
      <div class="grid-2">
        <div><label>Seller OTP</label><input v-model="sellerOtp" maxlength="6" :disabled="isOffline" /></div>
        <div><label>Buyer OTP</label><input v-model="buyerOtp" maxlength="6" :disabled="isOffline" /></div>
      </div>
      <button :disabled="loading || isOffline" @click="confirm">{{ loading ? 'Confirming...' : 'Confirm Transfer' }}</button>
      <p class="small" style="color:#fdba74">{{ message || status }}</p>
      <RouterLink v-if="status==='COMPLETED'" to="/tickets"><button class="secondary">Back to My Tickets</button></RouterLink>
    </article>
  </section>
</template>
