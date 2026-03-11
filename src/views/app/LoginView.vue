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
    auth.setSession(data.data)
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
    <article class="glass" style="padding:1rem;display:grid;gap:.7rem;">
      <h1 class="section-title">Login</h1>
      <div>
        <label>Email</label>
        <input v-model="email" placeholder="you@email.com" />
      </div>
      <div>
        <label>Password</label>
        <input v-model="password" type="password" placeholder="••••••••" />
      </div>
      <button :disabled="loading" @click="submit">{{ loading ? 'Signing in...' : 'Sign In' }}</button>
      <p class="small">New here? <RouterLink to="/register" style="color:#fdba74">Create account</RouterLink></p>
    </article>
  </section>
</template>
