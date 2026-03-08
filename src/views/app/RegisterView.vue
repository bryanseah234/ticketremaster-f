<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/api/client'

const router = useRouter()
const form = ref({ email: '', phone: '', password: '', confirm: '' })
const loading = ref(false)
const error = ref('')

const submit = async () => {
  error.value = ''
  if (form.value.password !== form.value.confirm) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    const { data } = await api.post('/auth/register', { email: form.value.email, phone: form.value.phone, password: form.value.password })
    const pendingUserId = data?.data?.user_id
    if (pendingUserId) localStorage.setItem('pending_user_id', pendingUserId)
    router.push('/verify')
  } catch (e: any) {
    if (e?.response?.status === 409) error.value = 'This email is already registered.'
    else error.value = 'Registration failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="page" style="max-width:640px;">
    <article class="glass" style="padding:1rem;display:grid;gap:.7rem;">
      <h1 class="section-title">Register</h1>
      <div class="grid-2">
        <div><label>Email</label><input v-model="form.email" placeholder="you@email.com" /></div>
        <div><label>Phone</label><input v-model="form.phone" placeholder="+65..." /></div>
      </div>
      <div class="grid-2">
        <div><label>Password</label><input v-model="form.password" type="password" /></div>
        <div><label>Confirm Password</label><input v-model="form.confirm" type="password" /></div>
      </div>
      <p v-if="error" class="small" style="color:#fca5a5">{{ error }}</p>
      <button :disabled="loading" @click="submit">{{ loading ? 'Creating...' : 'Create Account' }}</button>
      <p class="small">Already have an account? <RouterLink to="/login" style="color:#fdba74">Sign in</RouterLink></p>
    </article>
  </section>
</template>
