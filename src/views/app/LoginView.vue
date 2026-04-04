<script setup lang="ts">
import { reactive, ref } from 'vue'
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
const errors = reactive({ email: '', password: '' })

const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const validate = () => {
  errors.email = ''
  errors.password = ''
  let valid = true

  if (!email.value.trim()) {
    errors.email = 'Email is required'
    valid = false
  } else if (!validateEmail(email.value)) {
    errors.email = 'Must be a valid email'
    valid = false
  }

  if (!password.value) {
    errors.password = 'Password is required'
    valid = false
  }

  return valid
}

const extractError = (e: any) => {
  const status = e?.response?.status
  const code = e?.response?.data?.error_code || e?.response?.data?.error?.code
  if (code === 'VALIDATION_ERROR') return 'Please check your email and password.'
  if (status === 429) return 'Too many login attempts. Please wait a moment.'
  if (status === 401 || code === 'UNAUTHORIZED') return 'Invalid email or password.'
  if (status === 403 || code === 'UNVERIFIED_ACCOUNT') return 'Please verify your phone number.'
  return 'Login failed.'
}

const submit = async () => {
  if (!validate()) return
  loading.value = true
  try {
    const { data } = await api.post('/auth/login', { email: email.value, password: password.value })
    const d = data.data
    auth.setSession({
      access_token: d.token,
      refresh_token: d.token,
      user: {
        userId: d.user.userId,
        email: d.user.email,
        role: d.user.role,
      },
    })
    router.push('/events')
  } catch (e: any) {
    toast.push(extractError(e), 'error', 3200)
    if (e?.response?.status === 403 || e?.response?.data?.error_code === 'UNVERIFIED_ACCOUNT') {
      router.push('/verify')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="page">
    <div class="auth-shell">
      <article class="glass auth-card">
        <span class="badge">Sign In</span>
        <div>
          <h1 class="section-title">Welcome back to TicketRemaster.</h1>
          <p class="section-subtitle">Sign in to manage purchases, transfers, notifications, and event-day access.</p>
        </div>

        <form class="auth-form" @submit.prevent="submit">
          <div>
            <label>Email</label>
            <input v-model="email" placeholder="you@email.com" />
            <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
          </div>

          <div>
            <label>Password</label>
            <input v-model="password" type="password" placeholder="••••••••" />
            <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
          </div>

          <button :disabled="loading" type="submit">{{ loading ? 'Signing in...' : 'Sign In' }}</button>
        </form>

        <div class="divider"><span>or</span></div>

        <div class="auth-links">
          <RouterLink to="/register">Create account</RouterLink>
          <RouterLink to="/demo-login">Try demo mode</RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--textMuted);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--outlineSoft);
}

.auth-links {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.auth-links a {
  color: var(--primarySoft);
  font-size: 0.92rem;
}
</style>
