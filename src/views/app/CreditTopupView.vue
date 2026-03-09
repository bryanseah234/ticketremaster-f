<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { loadStripe, type Stripe, type StripeElements, type StripeCardElement } from '@stripe/stripe-js'
import api from '@/api/client'

const balance = ref(0)
const amount = ref(100)
const loading = ref(false)
const result = ref('')
const stripe = ref<Stripe | null>(null)
const elements = ref<StripeElements | null>(null)
const card = ref<StripeCardElement | null>(null)
const cardMount = ref<HTMLDivElement | null>(null)
const stripeReady = ref(false)

const loadBalance = async () => {
  try {
    const { data } = await api.get('/credits/balance')
    balance.value = data?.data?.credit_balance || 0
  } catch {
    result.value = 'Could not load credit balance.'
  }
}

const initStripe = async () => {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || ''
  if (!publishableKey) {
    result.value = 'Stripe public key is missing.'
    return
  }
  stripe.value = await loadStripe(publishableKey)
  if (!stripe.value) {
    result.value = 'Unable to initialize Stripe.'
    return
  }
  elements.value = stripe.value.elements()
  card.value = elements.value.create('card')
  if (cardMount.value) {
    card.value.mount(cardMount.value)
    stripeReady.value = true
  }
}

const createTopUp = async () => {
  loading.value = true
  result.value = ''
  try {
    const { data } = await api.post('/credits/topup', { amount: amount.value })
    const clientSecret = data?.data?.client_secret
    if (!clientSecret) {
      result.value = 'No client secret returned.'
      return
    }
    if (!stripe.value || !card.value) {
      result.value = 'Stripe is not ready.'
      return
    }
    const confirmation = await stripe.value.confirmCardPayment(clientSecret, { payment_method: { card: card.value } })
    if (confirmation.error) {
      result.value = confirmation.error.message || 'Card payment failed.'
      return
    }
    if (confirmation.paymentIntent?.status === 'succeeded') {
      result.value = 'Top up succeeded.'
      setTimeout(loadBalance, 2000)
    } else {
      result.value = `Payment status: ${confirmation.paymentIntent?.status || 'unknown'}`
    }
  } catch (e: any) {
    const code = e?.response?.data?.error_code
    if (code === 'VALIDATION_ERROR') result.value = 'Amount must be positive.'
    else result.value = 'Payment initiation failed.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBalance()
  initStripe()
})

onUnmounted(() => {
  if (card.value) card.value.unmount()
})
</script>

<template>
  <section class="page" style="max-width:760px;">
    <article class="glass" style="padding:1rem;display:grid;gap:.8rem;">
      <h1 class="section-title">Credit Top Up</h1>
      <p class="small">Current balance: {{ balance }}</p>
      <div class="row">
        <button class="secondary" @click="amount=50">$50</button>
        <button class="secondary" @click="amount=100">$100</button>
        <button class="secondary" @click="amount=200">$200</button>
      </div>
      <div>
        <label>Custom Amount</label>
        <input v-model.number="amount" min="1" type="number" />
      </div>
      <div>
        <label>Card Details</label>
        <div ref="cardMount" class="glass" style="padding:.6rem;"></div>
      </div>
      <button :disabled="loading || !stripeReady" @click="createTopUp">{{ loading ? 'Processing...' : 'Pay with Card' }}</button>
      <p class="small" style="color:#fdba74">{{ result }}</p>
    </article>
  </section>
</template>
