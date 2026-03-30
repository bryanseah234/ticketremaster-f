<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)

const extractError = (e: any) => {
  const status = e?.response?.status
  const code = e?.response?.data?.error_code || e?.response?.data?.error?.code
  if (code === 'VALIDATION_ERROR') return 'Please check your email and password.'
  if (status === 401) return 'Invalid email or password'
  if (status === 403) return 'Please verify your phone number.'
  if (status === 400) return 'Please check your email and password.'
  if (code === 'UNAUTHORIZED') return 'Invalid email or password'
  if (code === 'UNVERIFIED_ACCOUNT') return 'Please verify your phone number.'
  return 'Login failed'
}

const submit = async () => {
  loading.value = true
  try {
    const { data } = await api.post('/auth/login', { email: email.value, password: password.value })
    const d = data.data
    auth.setSession({
      access_token: d.token,
      refresh_token: d.token, // backend issues single token
      user: {
        userId: d.user.userId,
        email: d.user.email,
        role: d.user.role,
      },
    })
    router.push('/events')
  } catch (e: any) {
    if (!e?.response) {
      toast.push('Backend unavailable. Login is disabled in demo mode.', 'error', 3200)
    } else {
      toast.push(extractError(e), 'error', 3200)
    }
    if (e?.response?.status === 403 || e?.response?.data?.error_code === 'UNVERIFIED_ACCOUNT') {
      router.push('/verify')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="page" style="max-width:560px;">
    <article class="glass" style="padding:1.5rem;display:grid;gap:1rem;">
      <div>
        <h1 class="section-title">Sign In</h1>
        <p class="section-subtitle">Welcome back! Please sign in to continue.</p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label>Email</label>
          <input v-model="email" placeholder="you@email.com" />
        </div>
        <div>
          <label>Password</label>
          <input v-model="password" type="password" placeholder="••••••••" />
        </div>

        <button :disabled="loading" type="submit" style="width:100%;">
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>

        <p class="small text-center">
          New here? <RouterLink to="/register" style="color:var(--accent);">Create account</RouterLink>
        </p>
      </form>

      <div class="divider">
        <span class="small">or</span>
      </div>

      <div class="text-center">
        <RouterLink to="/demo-login" class="small" style="color:var(--accent);">
          Try demo mode →
        </RouterLink>
      </div>
    </article>
  </section>
</template>

<style scoped>
.space-y-4 {
  display: grid;
  gap: 1rem;
}
.text-center {
  text-align: center;
}
.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--muted);
}
.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}
</style>
