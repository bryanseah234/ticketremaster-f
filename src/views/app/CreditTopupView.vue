<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { loadStripe, type Stripe, type StripeCardElement, type StripeElements } from '@stripe/stripe-js'
import { CreditCardIcon } from '@heroicons/vue/24/outline'
import api from '@/api/client'
import { isDemoMode } from '@/services/mockData'
import { useAuthStore } from '@/stores/auth'
import AccountSidebar from '@/components/account/AccountSidebar.vue'

const router = useRouter()
const balance = ref(0)
const amount = ref(100)
const loading = ref(false)
const result = ref('')
const resultIsError = ref(false)
const transactions = ref<any[]>([])

const pendingCheckoutId = (() => {
  try {
    const raw = localStorage.getItem('pendingOrder')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const heldUntil = parsed?.heldUntil
    if (!heldUntil) return null
    const secsLeft = Math.floor((new Date(heldUntil).getTime() - Date.now()) / 1000)
    return secsLeft > 0 ? (parsed?.orderId || null) : null
  } catch { return null }
})()

const redirectBackToCheckout = () => {
  if (pendingCheckoutId) {
    router.push(`/checkout/${pendingCheckoutId}`)
  }
}
const stripe = ref<Stripe | null>(null)
const elements = ref<StripeElements | null>(null)
const card = ref<StripeCardElement | null>(null)
const cardMount = ref<HTMLDivElement | null>(null)
const stripeReady = ref(false)
const demoMode = computed(() => isDemoMode())
const auth = useAuthStore()

const cardholderName = ref('ALEX VANCE')

const quickAmounts = [25, 50, 100]

const formattedBalance = computed(() => `$${balance.value.toFixed(2)}`)

const loadBalance = async () => {
  if (demoMode.value) {
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

const mapLedgerItem = (item: any) => {
  const rawAmount = typeof item.delta === 'number' ? item.delta : typeof item.amount === 'number' ? item.amount : 0
  const positive = rawAmount >= 0
  const title =
    item.title ||
    (item.reason === 'topup'
      ? 'Top-up Successful'
      : item.reason === 'ticket_purchase'
      ? `Ticket Purchase${item.eventName ? `: ${item.eventName}` : ''}`
      : 'Account Activity')
  const meta =
    item.meta ||
    (item.createdAt
      ? new Date(item.createdAt).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Ledger entry')

  return {
    id: item.id || item.transactionId || title,
    title,
    meta,
    positive,
    amountLabel: `${positive ? '+' : '-'}$${Math.abs(rawAmount).toFixed(2)}`,
  }
}

const loadTransactions = async () => {
  if (demoMode.value) {
    transactions.value = [
      mapLedgerItem({ id: 'demo-ledger-001', title: 'Top-up Successful', meta: 'Visa •••• 4242', delta: 100 }),
      mapLedgerItem({ id: 'demo-ledger-002', title: 'Ticket Purchase: Neo-Tokyo Live', meta: 'Dec 20, 2023 • Event ID #8841', delta: -450 }),
    ]
    return
  }

  try {
    const { data } = await api.get('/credits/transactions', { params: { page: 1, limit: 5 } })
    const items = data?.data?.transactions || data?.data || []
    transactions.value = items.map(mapLedgerItem)
  } catch {
    transactions.value = []
  }
}

const initStripe = async () => {
  if (demoMode.value) return

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

const pushDemoLedger = () => {
  transactions.value.unshift(
    mapLedgerItem({
      id: `demo-ledger-${Date.now()}`,
      title: 'Top-up Successful',
      meta: 'Simulated wallet top-up',
      delta: amount.value,
    }),
  )
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
  await new Promise((resolve) => setTimeout(resolve, 900))

  const current = parseFloat(sessionStorage.getItem('demo_balance') || '500')
  const newBalance = current + amount.value
  sessionStorage.setItem('demo_balance', String(newBalance))
  balance.value = newBalance
  pushDemoLedger()
  result.value = `${amount.value.toFixed(2)} credits added. New balance: $${newBalance.toFixed(2)}`
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

    const confirmation = await stripe.value.confirmCardPayment(clientSecret, {
      payment_method: {
        card: card.value,
        billing_details: {
          name: cardholderName.value,
        },
      },
    })

    if (confirmation.error) {
      result.value = confirmation.error.message || 'Card payment failed.'
      resultIsError.value = true
      return
    }

    if (confirmation.paymentIntent?.status === 'succeeded') {
      await api.post('/credits/topup/confirm', { paymentIntentId })
      result.value = `Top-up of $${amount.value.toFixed(2)} succeeded.`
      await Promise.all([loadBalance(), loadTransactions()])
      redirectBackToCheckout()
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

onMounted(async () => {
  await Promise.all([loadBalance(), loadTransactions()])
  void initStripe()
})

onUnmounted(() => {
  if (card.value) card.value.unmount()
})
</script>

<template>
  <section class="page credits-page">
    <header class="credits-header">
      <h1>Account <span>Credits</span></h1>
    </header>

    <div class="credits-layout">
      <AccountSidebar active-key="credits" />

      <div class="credits-content">
        <article class="glass balance-card">
          <div>
            <span class="card-label">Current Balance</span>
            <div
              class="balance-value"
              style="background: linear-gradient(135deg, #f97316, #ff7a23); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text"
            >{{ formattedBalance }}</div>
          </div>

          <div class="balance-meta">
            <span class="last-active">Last active {{ demoMode ? 'in demo mode' : 'moments ago' }}</span>
            <div class="status-pill">
              <span class="dot"></span>
              <span>{{ demoMode ? 'Offline Demo Wallet' : 'Secured Obsidian Vault' }}</span>
            </div>
          </div>
        </article>

        <section class="credits-section">
          <h2>Select Top-up Amount</h2>

          <div class="quick-grid">
            <button
              v-for="quickAmount in quickAmounts"
              :key="quickAmount"
              class="amount-card"
              :class="{ active: amount === quickAmount }"
              style="border-radius: 12px"
              @click="amount = quickAmount"
            >
              <span>${{ quickAmount }}</span>
            </button>

            <label class="amount-card custom-card" style="border-radius: 12px">
              <span class="custom-label">Custom</span>
              <div class="custom-input">
                <strong>$</strong>
                <input v-model.number="amount" type="number" min="1" placeholder="0.00" />
              </div>
            </label>
          </div>
        </section>

        <section class="glass payment-card">
          <div class="payment-heading">
            <CreditCardIcon class="heading-icon" />
            <h2>Payment Method</h2>
          </div>

          <div class="payment-grid">
            <div class="field-stack">
              <label>Cardholder Name</label>
              <input v-model="cardholderName" placeholder="ALEXANDER VANCE" :readonly="demoMode" />
            </div>

            <div class="field-stack">
              <label>Secure Card Entry</label>
              <div v-if="demoMode" class="card-field-demo">
                <input value="•••• •••• •••• 4242" disabled class="card-field-input" />
                <span class="visa-badge">VISA</span>
              </div>
              <div v-else ref="cardMount" class="card-mount"></div>
            </div>

          </div>

          <p class="secure-note">
            {{ demoMode ? 'Use the simulated flow to test wallet updates and seeded balances.' : 'Payments are encrypted and processed securely via the live credit pipeline.' }}
          </p>

          <button
            class="complete-button"
            style="background: linear-gradient(135deg, #f97316 0%, #ff7a23 100%); border-radius: 999px; width: min(100%, 20rem); justify-self: center; padding-block: 0.95rem; box-shadow: 0 10px 30px rgba(249,115,22,0.3); border: 0; color: #fff; font-weight: 800"
            :disabled="loading || amount <= 0 || (!demoMode && !stripeReady)"
            @click="demoMode ? simulateTopUp() : createTopUp()"
          >
            {{ loading ? 'Processing...' : demoMode ? 'Simulate Top-up' : 'Complete Top-up' }}
          </button>

          <p class="compliance-note">PCI-DSS compliant infrastructure</p>

          <p v-if="result" class="result-msg" :class="{ error: resultIsError, success: !resultIsError }">{{ result }}</p>
        </section>

        <section class="ledger-card">
          <div class="ledger-head">
            <h2>Recent Ledger</h2>
            <button class="activity-link" type="button">View All Activity</button>
          </div>

          <div v-if="transactions.length === 0" class="ledger-empty">No ledger activity yet.</div>

          <article v-for="item in transactions" v-else :key="item.id" class="ledger-row" style="transition: background-color 0.2s; cursor: default">
            <div class="ledger-icon" :class="{ positive: item.positive, negative: !item.positive }">
              <span>{{ item.positive ? '+' : '−' }}</span>
            </div>

            <div class="ledger-copy">
              <strong>{{ item.title }}</strong>
              <span>{{ item.meta }}</span>
            </div>

            <span class="ledger-amount" :class="{ positive: item.positive, negative: !item.positive }">{{ item.amountLabel }}</span>
          </article>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.credits-page {
  display: grid;
  gap: 1.5rem;
}

.credits-header {
  text-align: center;
}

.credits-header h1 {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: clamp(2.9rem, 7vw, 4.6rem);
  font-weight: 800;
  letter-spacing: -0.08em;
}

.credits-header span {
  color: var(--primary);
}

.credits-layout {
  display: grid;
  grid-template-columns: var(--account-sidebar-width) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.credits-content {
  display: grid;
  gap: 1.5rem;
}

.balance-card,
.payment-card {
  padding: 1.5rem;
  border-radius: 1.5rem;
  background: rgba(34, 31, 30, 0.84);
  border-color: rgba(255, 255, 255, 0.06);
}

.balance-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  overflow: hidden;
  background:
    radial-gradient(circle at right top, rgba(249, 115, 22, 0.16), transparent 34%),
    rgba(34, 31, 30, 0.84);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.24);
}

.card-label {
  color: rgba(255, 255, 255, 0.58);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.balance-value {
  margin-top: 0.45rem;
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: clamp(2.6rem, 6vw, 4.3rem);
  font-weight: 800;
  letter-spacing: -0.08em;
  background: linear-gradient(135deg, #f97316, #ff7a23);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.balance-meta {
  display: grid;
  gap: 0.5rem;
  justify-items: end;
}

.last-active {
  color: rgba(255, 255, 255, 0.54);
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: #37d080;
  box-shadow: 0 0 12px rgba(55, 208, 128, 0.65);
}

.credits-section {
  display: grid;
  gap: 0.95rem;
}

.credits-section h2,
.payment-heading h2,
.ledger-head h2 {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.8rem;
}

.amount-card {
  min-height: 6rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--text);
}

.amount-card span {
  font-size: 1.2rem;
}

.amount-card.active {
  border-color: rgba(249, 115, 22, 0.34);
  background: rgba(249, 115, 22, 0.12);
  box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.18), 0 0 24px rgba(249, 115, 22, 0.12);
}

.custom-card {
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 0.2rem;
  padding-inline: 0.9rem;
}

.custom-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.54rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.custom-input {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  max-width: 7rem;
}

.custom-input strong {
  color: var(--primary);
  font-size: 1rem;
}

.custom-input input {
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  font-size: 1.2rem;
  font-weight: 800;
}

.payment-card {
  display: grid;
  gap: 1.2rem;
}

.payment-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.heading-icon {
  width: 1.1rem;
  height: 1.1rem;
  color: var(--textMuted);
}

.payment-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.field-stack {
  display: grid;
  gap: 0.45rem;
}

.field-stack input,
.card-placeholder,
.card-mount {
  border-radius: 0.95rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.card-placeholder,
.card-mount {
  min-height: 3.35rem;
  display: grid;
  align-items: center;
  padding: 0.9rem 1rem;
  color: var(--textMuted);
}

.card-field-demo {
  position: relative;
}

.card-field-input {
  width: 100%;
  border-radius: 0.95rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 0.9rem 1rem;
  color: var(--textMuted);
}

.visa-badge {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.5);
}

.secure-note {
  color: var(--textMuted);
  font-size: 0.8rem;
  line-height: 1.5;
  max-width: 30rem;
}

.complete-button {
  width: min(100%, 20rem);
  justify-self: center;
  border-radius: 999px;
  padding-block: 0.95rem;
  background: linear-gradient(135deg, #f97316 0%, #ff7a23 100%);
  box-shadow: 0 10px 30px rgba(249, 115, 22, 0.3);
  border: 0;
  color: #fff;
  font-weight: 800;
}

.compliance-note {
  justify-self: center;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.result-msg {
  margin: 0;
  padding: 0.85rem 1rem;
  border-radius: 1rem;
}

.result-msg.success {
  color: #37d080;
  background: rgba(55, 208, 128, 0.08);
  border: 1px solid rgba(55, 208, 128, 0.16);
}

.result-msg.error {
  color: #ff8f84;
  background: rgba(255, 143, 132, 0.08);
  border: 1px solid rgba(255, 143, 132, 0.16);
}

.ledger-card {
  display: grid;
  gap: 1rem;
}

.ledger-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.activity-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--primarySoft);
  font-size: 0.8rem;
  font-weight: 700;
}

.activity-link:hover {
  transform: none;
  filter: none;
}

.ledger-empty,
.ledger-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem 1.1rem;
  border-radius: 1.15rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.ledger-row {
  transition: background-color 0.2s;
  cursor: default;
}

.ledger-row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.ledger-empty {
  grid-template-columns: 1fr;
  color: var(--textMuted);
}

.ledger-icon {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  font-weight: 800;
}

.ledger-icon.positive {
  background: rgba(55, 208, 128, 0.12);
  color: #37d080;
}

.ledger-icon.negative {
  background: rgba(255, 95, 95, 0.12);
  color: #ff5f5f;
}

.ledger-copy strong {
  display: block;
  font-size: 0.92rem;
}

.ledger-copy span {
  color: var(--textMuted);
  font-size: 0.78rem;
}

.ledger-amount {
  font-weight: 800;
}

.ledger-amount.positive {
  color: #37d080;
}

.ledger-amount.negative {
  color: var(--text);
}

@media (max-width: 980px) {
  .credits-layout {
    grid-template-columns: 1fr;
  }

  .quick-grid,
  .payment-grid {
    grid-template-columns: 1fr;
  }

  .balance-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .balance-meta {
    justify-items: start;
  }
}

@media (max-width: 640px) {
  .ledger-row {
    grid-template-columns: auto 1fr;
  }

  .ledger-amount {
    grid-column: 2;
  }
}
</style>


