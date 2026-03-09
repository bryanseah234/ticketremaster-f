<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const balance = ref(0)
const order = ref<any>(null)
const statusMessage = ref('')
const otpRequired = ref(false)
const otp = ref('')
const loading = ref(false)

const loadOrder = () => {
  const raw = localStorage.getItem('pending_order')
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.order_id === route.params.orderId) {
      order.value = parsed
    }
  } catch {
    order.value = null
  }
}

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
    if (statusMessage.value === 'CONFIRMED') localStorage.removeItem('pending_order')
  } catch (e: any) {
    const errorCode = e?.response?.data?.error_code
    const status = e?.response?.status
    if (errorCode === 'OTP_REQUIRED' || status === 428) {
      otpRequired.value = true
      statusMessage.value = 'OTP_REQUIRED'
    } else if (errorCode === 'INSUFFICIENT_CREDITS' || status === 402) {
      statusMessage.value = 'INSUFFICIENT_CREDITS'
    } else if (errorCode === 'HOLD_EXPIRED' || status === 410) {
      statusMessage.value = 'HOLD_EXPIRED'
    } else if (errorCode === 'ORDER_NOT_FOUND') {
      statusMessage.value = 'ORDER_NOT_FOUND'
    } else if (errorCode === 'ORDER_ALREADY_CONFIRMED') {
      statusMessage.value = 'ORDER_ALREADY_CONFIRMED'
    } else if (errorCode === 'SEAT_NOT_HELD') {
      statusMessage.value = 'SEAT_NOT_HELD'
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
  } catch (e: any) {
    const errorCode = e?.response?.data?.error_code
    if (errorCode === 'OTP_EXPIRED') statusMessage.value = 'OTP_EXPIRED'
    else if (errorCode === 'OTP_MAX_RETRIES') statusMessage.value = 'OTP_MAX_RETRIES'
    else statusMessage.value = 'OTP_INVALID'
  }
}

onMounted(() => {
  loadBalance()
  loadOrder()
})
</script>

<template>
  <section class="page" style="max-width:760px;">
    <article class="glass" style="padding:1rem;display:grid;gap:.8rem;">
      <h1 class="section-title">Checkout</h1>
      <span class="badge">Order: {{ route.params.orderId }}</span>
      <article class="panel" style="padding:.8rem;display:grid;gap:.45rem;">
        <p class="small">Order Summary</p>
        <p v-if="order?.event?.name">{{ order.event.name }}</p>
        <p v-if="order?.event?.event_date" class="small">{{ new Date(order.event.event_date).toLocaleString() }}</p>
        <p v-if="order?.seat" class="small">Seat {{ order.seat.row_number }}-{{ order.seat.seat_number }} · {{ order.seat.category }}</p>
        <p v-if="order?.seat?.price" class="small">Price: ${{ order.seat.price }}</p>
        <p v-if="!order" class="small">Seat details available after reserve.</p>
      </article>
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
