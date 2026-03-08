<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const submit = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await api.post('/auth/login', { email: email.value, password: password.value })
    auth.setSession(data.data)
    router.push('/events')
  } catch (e: any) {
    if (e?.response?.status === 401) error.value = 'Invalid email or password'
    else if (e?.response?.status === 403) {
      error.value = 'Please verify your phone number.'
      router.push('/verify')
    } else error.value = 'Login failed'
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
      <p v-if="error" class="small" style="color:#fca5a5">{{ error }}</p>
      <button :disabled="loading" @click="submit">{{ loading ? 'Signing in...' : 'Sign In' }}</button>
      <p class="small">New here? <RouterLink to="/register" style="color:#fdba74">Create account</RouterLink></p>
    </article>
  </section>
</template>
