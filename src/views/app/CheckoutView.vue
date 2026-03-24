<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const toast = useToast()

const balance = ref(0)
const order = ref<any>(null)
const statusMessage = ref('')
const loading = ref(false)
const usingFallback = ref(false)

// OTP state
const otpStep = ref(false)
const otp = ref('')
const otpLoading = ref(false)
const otpSent = ref(false)

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
    usingFallback.value = false
  } catch {
    balance.value = 250
    usingFallback.value = true
    statusMessage.value = 'DEMO_MODE'
    toast.push('Backend unavailable. Showing limited demo data. Actions are limited.', 'info', 3200)
  }
}

const requestOtp = async () => {
  if (usingFallback.value) {
    toast.push('Payments are disabled in demo mode.', 'error', 3200)
    return
  }
  loading.value = true
  try {
    await api.post('/purchase/otp/send', {
      inventoryId: order.value?.inventory_id || route.params.orderId,
    })
    otpStep.value = true
    otpSent.value = true
    toast.push('OTP sent to your registered phone number.', 'info', 3200)
  } catch {
    toast.push('Failed to send OTP. Please try again.', 'error', 3200)
  } finally {
    loading.value = false
  }
}

const pay = async () => {
  if (!otp.value.trim()) {
    toast.push('Please enter the OTP.', 'error', 3200)
    return
  }
  otpLoading.value = true
  statusMessage.value = ''
  try {
    const inventoryId = order.value?.inventory_id || route.params.orderId
    const { data } = await api.post(`/purchase/confirm/${inventoryId}`, {
      holdToken: order.value?.hold_token || '',
      eventId: order.value?.event_id || '',
      otp: otp.value.trim(),
    })
    statusMessage.value = data?.data?.status || 'CONFIRMED'
    localStorage.removeItem('pending_order')
    toast.push('Payment confirmed. Ticket is ready.', 'success', 3200)
  } catch (e: any) {
    const errorCode = e?.response?.data?.error?.code || e?.response?.data?.error_code
    const status = e?.response?.status
    if (errorCode === 'OTP_INVALID' || errorCode === 'OTP_EXPIRED') {
      toast.push('Invalid or expired OTP. Please try again.', 'error', 3200)
    } else if (errorCode === 'INSUFFICIENT_CREDITS' || status === 402) {
      statusMessage.value = 'INSUFFICIENT_CREDITS'
      toast.push('Not enough credits to complete this order.', 'error', 3200)
    } else if (errorCode === 'HOLD_EXPIRED' || status === 410) {
      statusMessage.value = 'HOLD_EXPIRED'
      toast.push('Seat hold expired. Please reserve again.', 'error', 3200)
    } else if (errorCode === 'SEAT_NOT_HELD' || status === 409) {
      statusMessage.value = 'SEAT_NOT_HELD'
      toast.push('Seat is no longer held. Please reserve again.', 'error', 3200)
    } else {
      statusMessage.value = 'PAYMENT_FAILED'
      toast.push('Payment failed. Please try again.', 'error', 3200)
    }
  } finally {
    otpLoading.value = false
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

      <!-- Step 1: Request OTP -->
      <template v-if="!otpStep">
        <button :disabled="loading || usingFallback" @click="requestOtp">
          {{ loading ? 'Sending OTP...' : 'Pay with Credits' }}
        </button>
      </template>

      <!-- Step 2: Enter OTP -->
      <template v-else>
        <div>
          <label>Enter OTP sent to your phone</label>
          <input v-model="otp" placeholder="6-digit code" maxlength="6" />
        </div>
        <div class="row">
          <button :disabled="otpLoading" @click="pay">
            {{ otpLoading ? 'Confirming...' : 'Confirm Payment' }}
          </button>
          <button class="secondary" :disabled="loading" @click="requestOtp">
            {{ loading ? 'Resending...' : 'Resend OTP' }}
          </button>
        </div>
      </template>

      <RouterLink v-if="statusMessage==='CONFIRMED'" to="/tickets"><button>View Tickets</button></RouterLink>
      <RouterLink v-if="statusMessage==='INSUFFICIENT_CREDITS'" to="/credits/topup"><button class="secondary">Top Up Credits</button></RouterLink>
    </article>
  </section>
</template>
