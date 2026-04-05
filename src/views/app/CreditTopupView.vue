<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { loadStripe, type Stripe, type StripeElements, type StripeCardElement } from '@stripe/stripe-js'
import { RouterLink } from 'vue-router'
import api from '@/api/client'
import { isDemoMode } from '@/services/mockData'

const balance = ref(0)
const amount = ref(100)
const loading = ref(false)
const result = ref('')
const resultIsError = ref(false)

const stripe = ref<Stripe | null>(null)
const elements = ref<StripeElements | null>(null)
const card = ref<StripeCardElement | null>(null)
const cardMount = ref<HTMLDivElement | null>(null)
const stripeReady = ref(false)

const demo = isDemoMode()
const QUICK_AMOUNTS = [25, 50, 100, 250]
const ledgerItems = computed(() => [
  { title: 'Top-up Successful', meta: 'Visa •••• 4242', amount: '+100.00', positive: true },
  { title: 'Ticket Purchase', meta: 'Neo-Tokyo Live', amount: '-450.00', positive: false },
])

const formattedBalance = (value: number) => `SGD ${value.toFixed(2)}`

const loadBalance = async () => {
  if (demo) {
    const stored = sessionStorage.getItem('demo_balance')
    balance.value = stored !== null ? parseFloat(stored) : 500
    return
  }
  try {
    const { data } = await api.get('/credits/balance')
    balance.value = data?.data?.creditBalance || 0
  } catch {
    result.value = 'Could not load credit balance.'
    resultIsError.value = true
  }
}

const initStripe = async () => {
  if (demo) return
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || ''
  if (!publishableKey) {
    result.value = 'Stripe public key is missing.'
    resultIsError.value = true
    return
  }
  stripe.value = await loadStripe(publishableKey)
  if (!stripe.value) {
    result.value = 'Unable to initialize Stripe.'
    resultIsError.value = true
    return
  }
  elements.value = stripe.value.elements()
  card.value = elements.value.create('card', {
    style: {
      base: {
        color: '#f6f6f7',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        fontSize: '15px',
        '::placeholder': { color: '#8e8e96' },
      },
    },
  })
  if (cardMount.value) {
    card.value.mount(cardMount.value)
    stripeReady.value = true
  }
}

const simulateTopUp = async () => {
  if (amount.value <= 0) {
    result.value = 'Amount must be positive.'
    resultIsError.value = true
    return
  }
  loading.value = true
  result.value = ''
  resultIsError.value = false
  await new Promise((resolve) => setTimeout(resolve, 1000))
  const current = parseFloat(sessionStorage.getItem('demo_balance') || '500')
  const newBalance = current + amount.value
  sessionStorage.setItem('demo_balance', String(newBalance))
  balance.value = newBalance
  result.value = `SGD ${amount.value.toFixed(2)} added. New balance: ${formattedBalance(newBalance)}`
  loading.value = false
}

const createTopUp = async () => {
  if (amount.value <= 0) {
    result.value = 'Amount must be positive.'
    resultIsError.value = true
    return
  }
  loading.value = true
  result.value = ''
  resultIsError.value = false
  try {
    const { data } = await api.post('/credits/topup/initiate', { amount: amount.value })
    const clientSecret = data?.data?.clientSecret
    const paymentIntentId = data?.data?.paymentIntentId
    if (!clientSecret) {
      result.value = 'No client secret returned.'
      resultIsError.value = true
      return
    }
    if (!stripe.value || !card.value) {
      result.value = 'Stripe is not ready.'
      resultIsError.value = true
      return
    }
    const confirmation = await stripe.value.confirmCardPayment(clientSecret, { payment_method: { card: card.value } })
    if (confirmation.error) {
      result.value = confirmation.error.message || 'Card payment failed.'
      resultIsError.value = true
      return
    }
    if (confirmation.paymentIntent?.status === 'succeeded') {
      await api.post('/credits/topup/confirm', { paymentIntentId })
      result.value = `Top up of SGD ${amount.value.toFixed(2)} succeeded.`
      await loadBalance()
    } else {
      result.value = `Payment status: ${confirmation.paymentIntent?.status || 'unknown'}`
      resultIsError.value = true
    }
  } catch {
    result.value = 'Payment initiation failed.'
    resultIsError.value = true
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
  <section class="credits-page">
    <header class="credits-header">
      <span class="eyebrow">Account Credits</span>
      <h1>Top up your balance.</h1>
    </header>

    <div class="credits-layout">
      <aside class="sidebar panel">
        <RouterLink to="/profile" class="side-link">Profile</RouterLink>
        <span class="side-link active">Credits</span>
        <RouterLink to="/tickets" class="side-link">Tickets</RouterLink>
      </aside>

      <div class="credits-content">
        <article class="balance-card panel">
          <span class="meta-label">Current Balance</span>
          <h2>{{ formattedBalance(balance) }}</h2>
          <p>{{ demo ? 'Demo mode enabled. No real charges will be made.' : 'Payments are encrypted and processed securely.' }}</p>
        </article>

        <section class="topup-section panel">
          <h3>Select Top-up Amount</h3>

          <div class="quick-grid">
            <button v-for="quickAmount in QUICK_AMOUNTS" :key="quickAmount" class="amount-card" :class="{ active: amount === quickAmount }" @click="amount = quickAmount">
              SGD {{ quickAmount }}
            </button>
            <label class="amount-card custom-card">
              <span>Custom</span>
              <input v-model.number="amount" type="number" min="1" placeholder="0.00" />
            </label>
          </div>

          <div class="payment-shell">
            <template v-if="demo">
              <p class="muted">Use the simulated top-up flow to test wallet updates and post-purchase balances.</p>
              <button :disabled="loading || amount <= 0" @click="simulateTopUp">{{ loading ? 'Processing...' : `Simulate Top Up — SGD ${amount}` }}</button>
            </template>

            <template v-else>
              <label>
                <span class="meta-label">Card Details</span>
                <div ref="cardMount" class="card-mount"></div>
              </label>
              <button :disabled="loading || !stripeReady || amount <= 0" @click="createTopUp">{{ loading ? 'Processing...' : `Pay SGD ${amount}` }}</button>
            </template>
          </div>

          <p v-if="result" class="result-msg" :class="{ 'result-error': resultIsError, 'result-success': !resultIsError }">{{ result }}</p>
        </section>

        <section class="ledger-section panel">
          <div class="section-row">
            <h3>Recent Ledger</h3>
            <button class="secondary">View All Activity</button>
          </div>

          <div class="ledger-list">
            <article v-for="item in ledgerItems" :key="item.title" class="ledger-item">
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.meta }}</p>
              </div>
              <span :class="{ positive: item.positive, negative: !item.positive }">{{ item.amount }}</span>
            </article>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.credits-page, .credits-header, .credits-content { display: grid; gap: 1rem; }
.credits-header h1 {
  margin: 0; font-family: var(--font-display); font-size: clamp(2.8rem, 6vw, 4.8rem); line-height: .95; letter-spacing: -.05em;
}
.eyebrow, .meta-label {
  color: var(--primary); font-size: .72rem; font-weight: 800; letter-spacing: .2em; text-transform: uppercase;
}
.credits-layout { display: grid; grid-template-columns: 16rem minmax(0,1fr); gap: 1.25rem; align-items: start; }
.sidebar { display: grid; gap: .5rem; position: sticky; top: 7rem; padding: .8rem; }
.side-link { padding: .9rem 1rem; border-radius: 1rem; color: var(--text-muted); }
.side-link.active { background: rgba(249,115,22,.12); border: 1px solid rgba(249,115,22,.16); color: var(--primary); font-weight: 700; }
.balance-card { padding: 1.4rem; background: radial-gradient(circle at right top, rgba(249,115,22,.12), transparent 35%), rgba(18,18,18,.88); }
.balance-card h2 {
  margin: .3rem 0; font-family: var(--font-display); font-size: clamp(2.5rem, 6vw, 4.6rem); line-height: .95; letter-spacing: -.05em;
}
.balance-card p, .muted { margin: 0; color: var(--text-muted); line-height: 1.7; }
.topup-section, .ledger-section, .payment-shell, .ledger-list { display: grid; gap: 1rem; }
.topup-section h3, .ledger-section h3 { margin: 0; font-size: 1.4rem; }
.quick-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: .75rem; }
.amount-card {
  display: grid; place-items: center; min-height: 6.5rem; padding: 1rem; border-radius: 1rem;
  border: 1px solid rgba(255,255,255,.05); background: rgba(255,255,255,.03); font-size: 1.1rem; font-weight: 800;
}
.amount-card.active { border-color: rgba(249,115,22,.4); background: rgba(249,115,22,.12); color: var(--primary); }
.custom-card { text-align: center; gap: .35rem; }
.custom-card span { color: var(--text-dim); font-size: .7rem; letter-spacing: .14em; text-transform: uppercase; }
.custom-card input { text-align: center; font-size: 1.1rem; font-weight: 800; }
.payment-shell { padding-top: .5rem; }
.card-mount {
  padding: .75rem .85rem; border: 1px solid rgba(255,255,255,.07); border-radius: .9rem; background: rgba(255,255,255,.03);
}
.result-msg { margin: 0; padding: .75rem .9rem; border-radius: .8rem; }
.result-success { color: #32d27a; background: rgba(50,210,122,.08); border: 1px solid rgba(50,210,122,.18); }
.result-error { color: #ff8f84; background: rgba(255,143,132,.08); border: 1px solid rgba(255,143,132,.18); }
.section-row { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
.ledger-item {
  display: flex; justify-content: space-between; gap: 1rem; align-items: center; padding: 1rem; border-radius: 1rem;
  background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.05);
}
.ledger-item strong { display: block; margin-bottom: .25rem; }
.ledger-item p { margin: 0; color: var(--text-muted); }
.positive { color: #32d27a; font-weight: 800; }
.negative { color: var(--text); font-weight: 800; }
@media (max-width: 980px) {
  .credits-layout, .quick-grid { grid-template-columns: 1fr; }
  .sidebar { position: static; }
}
</style>
