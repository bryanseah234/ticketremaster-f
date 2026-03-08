<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const balance = ref(0)
const message = ref('')

const load = async () => {
  try {
    const { data } = await api.get('/credits/balance')
    balance.value = data?.data?.credit_balance || 0
  } catch {
    message.value = 'Unable to fetch profile balance.'
  }
}

const logout = async () => {
  try {
    await api.post('/auth/logout')
  } catch {
    // no-op
  }
  auth.clearSession()
  router.push('/login')
}

onMounted(load)
</script>

<template>
  <section class="page" style="max-width:760px;">
    <article class="glass" style="padding:1rem;display:grid;gap:.75rem;">
      <h1 class="section-title">Profile</h1>
      <span class="badge">Read-only account details</span>
      <p class="small">Email: {{ auth.state.user?.email || '—' }}</p>
      <p class="small">Phone: {{ auth.state.user?.phone || '—' }}</p>
      <p class="small">Credit Balance: {{ balance }}</p>
      <p class="small">Flagged: {{ auth.state.user?.flagged ? 'Yes' : 'No' }}</p>
      <button class="secondary" @click="logout">Logout</button>
      <p v-if="message" class="small" style="color:#fca5a5">{{ message }}</p>
    </article>
  </section>
</template>
