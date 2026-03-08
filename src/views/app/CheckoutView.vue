<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const balance = ref(0)
const statusMessage = ref('')
const otpRequired = ref(false)
const otp = ref('')
const loading = ref(false)

const loadBalance = async () => {
  try {
    const { data } = await api.get('/credits/balance')
    balance.value = data?.data?.credit_balance || 0
  } catch {
    statusMessage.value = 'Could not load credit balance.'
  }
}

const pay = async () => {
  loading.value = true
  statusMessage.value = ''
  try {
    const { data } = await api.post('/pay', { order_id: route.params.orderId })
    statusMessage.value = data?.data?.status || 'CONFIRMED'
    otpRequired.value = false
  } catch (e: any) {
    const code = e?.response?.status
    if (code === 428) {
      otpRequired.value = true
      statusMessage.value = 'OTP_REQUIRED'
    } else if (code === 402) {
      statusMessage.value = 'INSUFFICIENT_CREDITS'
    } else if (code === 410) {
      statusMessage.value = 'HOLD_EXPIRED'
    } else {
      statusMessage.value = 'PAYMENT_FAILED'
    }
  } finally {
    loading.value = false
  }
}

const verifyOtp = async () => {
  if (!auth.state.user || otp.value.length < 6) return
  try {
    await api.post('/verify-otp', { user_id: auth.state.user.user_id, otp_code: otp.value, context: 'purchase', reference_id: route.params.orderId })
    await pay()
  } catch {
    statusMessage.value = 'OTP_INVALID'
  }
}

onMounted(loadBalance)
</script>

<template>
  <section class="page" style="max-width:760px;">
    <article class="glass" style="padding:1rem;display:grid;gap:.8rem;">
      <h1 class="section-title">Checkout</h1>
      <span class="badge">Order: {{ route.params.orderId }}</span>
      <p class="small">Credits balance: {{ balance }}</p>
      <button :disabled="loading" @click="pay">{{ loading ? 'Processing...' : 'Pay with Credits' }}</button>

      <div v-if="otpRequired" class="glass" style="padding:.8rem;display:grid;gap:.6rem;">
        <label>OTP Verification</label>
        <input v-model="otp" maxlength="6" placeholder="Enter 6-digit code" />
        <button @click="verifyOtp">Verify OTP</button>
      </div>

      <p class="small" style="color:#fdba74">{{ statusMessage }}</p>
      <RouterLink v-if="statusMessage==='CONFIRMED'" to="/tickets"><button>View Tickets</button></RouterLink>
      <RouterLink v-if="statusMessage==='INSUFFICIENT_CREDITS'" to="/credits/topup"><button class="secondary">Top Up Credits</button></RouterLink>
    </article>
  </section>
</template>
