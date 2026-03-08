<script setup lang="ts">
import { onMounted, ref } from 'vue'
import api from '@/api/client'

const balance = ref(0)
const amount = ref(100)
const loading = ref(false)
const result = ref('')

const loadBalance = async () => {
  try {
    const { data } = await api.get('/credits/balance')
    balance.value = data?.data?.credit_balance || 0
  } catch {
    result.value = 'Could not load credit balance.'
  }
}

const createTopUp = async () => {
  loading.value = true
  result.value = ''
  try {
    const { data } = await api.post('/credits/topup', { amount: amount.value })
    result.value = data?.data?.client_secret ? 'Payment intent created. Continue with Stripe card confirmation.' : 'No client secret returned.'
  } catch {
    result.value = 'Amount invalid or payment initiation failed.'
  } finally {
    loading.value = false
  }
}

onMounted(loadBalance)
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
      <button :disabled="loading" @click="createTopUp">{{ loading ? 'Creating...' : 'Create Payment' }}</button>
      <p class="small" style="color:#fdba74">{{ result }}</p>
    </article>
  </section>
</template>
