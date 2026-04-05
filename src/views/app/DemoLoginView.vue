<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { mockServices, setDemoMode } from '@/services/mockData'
import type { AuthUser } from '@/types'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const email = ref('demo@ticketremaster.com')
const password = ref('demo1234')
const loading = ref(false)
const error = ref('')

const demoAccounts = [
  { email: 'demo@ticketremaster.com', role: 'user', label: 'Demo User', caption: 'Marketplace & ticket wallet access' },
  { email: 'admin@ticketremaster.com', role: 'admin', label: 'Demo Admin', caption: 'Global oversight & editorial control' },
  { email: 'staff@ticketremaster.com', role: 'staff', label: 'Demo Staff', caption: 'Operations & hospitality terminal' },
]

const useDemoAccount = async (accountEmail: string) => {
  email.value = accountEmail
  password.value = 'demo1234'
  await handleDemoLogin()
}

const handleDemoLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    setDemoMode(true)
    const result = await mockServices.login(email.value, password.value)
    const role = email.value.includes('admin') ? 'admin' : email.value.includes('staff') ? 'staff' : 'user'
    const authUser: AuthUser = {
      userId: result.user.userId,
      email: result.user.email,
      role: role as AuthUser['role'],
      isFlagged: result.user.isFlagged,
      isAdmin: result.user.isAdmin,
    }
    auth.setSession({ access_token: result.token, refresh_token: 'demo-refresh-token', user: authUser })
    toast.success('Demo login successful! You are now in demo mode.')

    if (role === 'admin') router.push('/admin/events')
    else if (role === 'staff') router.push('/staff/scan')
    else router.push('/events')
  } catch {
    error.value = 'Invalid demo credentials. Try demo@ticketremaster.com / demo1234'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="demo-page">
    <article class="demo-shell panel">
      <div class="hero-copy">
        <span class="eyebrow">Obsidian Hearth</span>
        <h1>Select your persona.</h1>
        <p>Choose an identity to explore the product with seeded data and safe, non-destructive flows.</p>
      </div>

      <div class="persona-stack">
        <button v-for="account in demoAccounts" :key="account.email" class="persona-card" :disabled="loading" @click="useDemoAccount(account.email)">
          <div>
            <strong>{{ account.label }}</strong>
            <p>{{ account.caption }}</p>
          </div>
          <span>›</span>
        </button>
      </div>

      <form class="manual-form" @submit.prevent="handleDemoLogin">
        <label>
          <span>Email</span>
          <input v-model="email" type="email" required placeholder="demo@ticketremaster.com" />
        </label>
        <label>
          <span>Password</span>
          <input v-model="password" type="password" required placeholder="demo1234" />
        </label>

        <p v-if="error" class="error-text">{{ error }}</p>

        <div class="actions">
          <button type="submit" :disabled="loading">{{ loading ? 'Logging in...' : 'Demo Login' }}</button>
          <RouterLink to="/login"><button class="secondary" type="button">Regular Login</button></RouterLink>
        </div>
      </form>
    </article>
  </section>
</template>

<style scoped>
.demo-page { display: grid; place-items: center; min-height: calc(100vh - 10rem); }
.demo-shell {
  width: min(100%, 34rem); display: grid; gap: 1.25rem; padding: clamp(1.5rem, 4vw, 2.25rem);
  background: radial-gradient(circle at center, rgba(249,115,22,.1), transparent 45%), rgba(18,18,18,.88);
}
.eyebrow {
  color: var(--primary); font-size: .72rem; font-weight: 800; letter-spacing: .2em; text-transform: uppercase;
}
.hero-copy { display: grid; gap: .8rem; text-align: center; }
.hero-copy h1 {
  margin: 0; font-family: var(--font-display); font-size: clamp(2.4rem, 6vw, 3.5rem); line-height: .95; letter-spacing: -.05em;
}
.hero-copy p { margin: 0; color: var(--text-muted); line-height: 1.7; }
.persona-stack, .manual-form { display: grid; gap: .8rem; }
.persona-card {
  display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding: 1rem 1.1rem;
  border-radius: 1rem; border: 1px solid rgba(255,255,255,.05); background: rgba(255,255,255,.03); text-align: left;
}
.persona-card strong { display: block; margin-bottom: .25rem; font-size: 1.05rem; }
.persona-card p { margin: 0; color: var(--text-muted); }
.persona-card span { color: var(--primary); font-size: 1.5rem; line-height: 1; }
.manual-form label { display: grid; gap: .35rem; }
.manual-form span { color: var(--text-dim); font-size: .72rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
.actions { display: flex; gap: .75rem; flex-wrap: wrap; }
.error-text { margin: 0; color: #ff8f84; }
</style>
