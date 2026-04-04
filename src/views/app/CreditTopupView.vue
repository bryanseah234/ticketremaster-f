<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { loadStripe, type Stripe, type StripeElements, type StripeCardElement } from '@stripe/stripe-js'
import api from '@/api/client'
import { isDemoMode } from '@/services/mockData'

const balance = ref(0)
const amount = ref(100)
const loading = ref(false)
const result = ref('')
const resultIsError = ref(false)

// Stripe refs (live mode only)
const stripe = ref<Stripe | null>(null)
const elements = ref<StripeElements | null>(null)
const card = ref<StripeCardElement | null>(null)
const cardMount = ref<HTMLDivElement | null>(null)
const stripeReady = ref(false)

const demo = isDemoMode()

const QUICK_AMOUNTS = [50, 100, 200, 500]

const formattedBalance = (val: number) => `SGD ${val.toFixed(2)}`

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
        fontFamily: 'Inter, -apple-system, sans-serif',
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

// Demo mode: simulate top-up
const simulateTopUp = async () => {
  if (amount.value <= 0) {
    result.value = 'Amount must be positive.'
    resultIsError.value = true
    return
  }
  loading.value = true
  result.value = ''
  resultIsError.value = false
  await new Promise(resolve => setTimeout(resolve, 1000))
  const current = parseFloat(sessionStorage.getItem('demo_balance') || '500')
  const newBalance = current + amount.value
  sessionStorage.setItem('demo_balance', String(newBalance))
  balance.value = newBalance
  result.value = `SGD ${amount.value.toFixed(2)} added. New balance: ${formattedBalance(newBalance)}`
  resultIsError.value = false
  loading.value = false
}

// Live mode: Stripe top-up
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
    const confirmation = await stripe.value.confirmCardPayment(clientSecret, {
      payment_method: { card: card.value },
    })
    if (confirmation.error) {
      result.value = confirmation.error.message || 'Card payment failed.'
      resultIsError.value = true
      return
    }
    if (confirmation.paymentIntent?.status === 'succeeded') {
      await api.post('/credits/topup/confirm', { paymentIntentId })
      result.value = `Top up of SGD ${amount.value.toFixed(2)} succeeded.`
      resultIsError.value = false
      await loadBalance()
    } else {
      result.value = `Payment status: ${confirmation.paymentIntent?.status || 'unknown'}`
      resultIsError.value = true
    }
  } catch (e: any) {
    const code = e?.response?.data?.error?.code || e?.response?.data?.error_code
    if (code === 'VALIDATION_ERROR') {
      result.value = 'Amount must be positive.'
    } else {
      result.value = 'Payment initiation failed.'
    }
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
  <section class="page" style="max-width:760px;">
    <article class="glass" style="padding:1.2rem;display:grid;gap:.9rem;">
      <h1 class="section-title">Credit Top Up</h1>

      <!-- Balance -->
      <article class="panel" style="padding:.8rem;display:grid;gap:.3rem;">
        <p class="small">Current Balance</p>
        <p style="font-size:1.4rem;font-weight:700;">{{ formattedBalance(balance) }}</p>
      </article>

      <!-- Demo mode badge -->
      <div v-if="demo" class="demo-pill small">
        🎭 Demo Mode — no real charges
      </div>

      <!-- Quick amount buttons -->
      <div>
        <label>Quick Select</label>
        <div class="row">
          <button
            v-for="q in QUICK_AMOUNTS"
            :key="q"
            class="secondary"
            :class="{ 'amount-active': amount === q }"
            @click="amount = q"
          >
            SGD {{ q }}
          </button>
        </div>
      </div>

      <!-- Custom amount -->
      <div>
        <label>Custom Amount (SGD)</label>
        <input v-model.number="amount" min="1" type="number" placeholder="Enter amount" />
      </div>

      <!-- Demo: Simulate Top Up button -->
      <template v-if="demo">
        <button :disabled="loading || amount <= 0" @click="simulateTopUp">
          {{ loading ? 'Processing...' : `Simulate Top Up — SGD ${amount}` }}
        </button>
      </template>

      <!-- Live: Stripe card element + pay button -->
      <template v-else>
        <div>
          <label>Card Details</label>
          <div
            ref="cardMount"
            class="card-mount"
          ></div>
        </div>
        <button :disabled="loading || !stripeReady || amount <= 0" @click="createTopUp">
          {{ loading ? 'Processing...' : `Pay SGD ${amount} with Card` }}
        </button>
      </template>

      <!-- Result message -->
      <p
        v-if="result"
        class="small result-msg"
        :class="{ 'result-error': resultIsError, 'result-success': !resultIsError }"
      >
        {{ result }}
      </p>
    </article>
  </section>
</template>

<style scoped>
.demo-pill {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  padding: .3rem .75rem;
  border-radius: 999px;
  background: rgba(249, 115, 22, 0.12);
  border: 1px solid rgba(249, 115, 22, 0.3);
  color: var(--accent-2);
  width: fit-content;
}

.card-mount {
  padding: .65rem .85rem;
  border: 1px solid var(--border);
  border-radius: .75rem;
  background: var(--surface-2);
  transition: border-color 0.2s ease;
}

.card-mount:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.15);
}

.amount-active {
  border-color: var(--accent) !important;
  color: var(--accent) !important;
}

.result-msg {
  padding: .5rem .75rem;
  border-radius: .6rem;
}

.result-success {
  color: var(--success);
  background: rgba(34, 197, 94, 0.08);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.result-error {
  color: var(--accent);
  background: rgba(249, 115, 22, 0.08);
  border: 1px solid rgba(249, 115, 22, 0.2);
}
</style>
