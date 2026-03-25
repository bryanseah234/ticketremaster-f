<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const form = ref({ email: '', phone: '', password: '', confirm: '' })
const loading = ref(false)
const toast = useToast()

const extractError = (e: any) => {
  const status = e?.response?.status
  const code = e?.response?.data?.error_code || e?.response?.data?.error?.code
  const fieldErrors = e?.response?.data?.errors
  if (status === 409 || code === 'EMAIL_ALREADY_EXISTS') return 'This email is already registered.'
  if (status === 400 || code === 'VALIDATION_ERROR') {
    if (fieldErrors && typeof fieldErrors === 'object') {
      const firstKey = Object.keys(fieldErrors)[0]
      const firstValue = Array.isArray(fieldErrors[firstKey]) ? fieldErrors[firstKey][0] : fieldErrors[firstKey]
      return firstValue || 'Please check your registration details.'
    }
    return 'Please check your registration details.'
  }
  return 'Registration failed.'
}

const submit = async () => {
  if (form.value.password !== form.value.confirm) {
    toast.push('Passwords do not match.', 'error', 3200)
    return
  }
  loading.value = true
  try {
    const { data } = await api.post('/auth/register', { email: form.value.email, phoneNumber: form.value.phone, password: form.value.password })
    const pendingUserId = data?.data?.userId || data?.data?.user_id
    if (pendingUserId) localStorage.setItem('pendingUserId', pendingUserId)
    router.push('/verify')
  } catch (e: any) {
    toast.push(extractError(e), 'error', 3200)
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
      <button :disabled="loading" @click="submit">{{ loading ? 'Creating...' : 'Create Account' }}</button>
      <p class="small">Already have an account? <RouterLink to="/login" style="color:#fdba74">Sign in</RouterLink></p>
    </article>
  </section>
</template>
