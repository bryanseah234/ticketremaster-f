<script setup lang="ts">
import { ref, reactive } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const form = ref({ email: '', phone: '', password: '', confirm: '' })
const loading = ref(false)
const toast = useToast()
const errors = reactive({ email: '', phone: '', password: '', confirm: '' })

const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const validatePhone = (v: string) => /^\+?\d{7,15}$/.test(v.replace(/[\s\-()]/g, ''))

const validate = (): boolean => {
  errors.email = ''
  errors.phone = ''
  errors.password = ''
  errors.confirm = ''
  let valid = true
  if (!form.value.email.trim()) {
    errors.email = 'Email is required'
    valid = false
  } else if (!validateEmail(form.value.email)) {
    errors.email = 'Must be a valid email'
    valid = false
  }
  if (!form.value.password) {
    errors.password = 'Password is required'
    valid = false
  } else if (form.value.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    valid = false
  }
  if (form.value.password && form.value.confirm !== form.value.password) {
    errors.confirm = 'Passwords do not match'
    valid = false
  }
  if (form.value.phone && !validatePhone(form.value.phone)) {
    errors.phone = 'Invalid phone number'
    valid = false
  }
  return valid
}

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
  if (!validate()) return
  loading.value = true
  try {
    await api.post('/auth/register', { email: form.value.email, phoneNumber: form.value.phone, password: form.value.password })
    toast.push('Account created! Please log in.', 'success', 3000)
    router.push('/login')
  } catch (e: any) {
    toast.push(extractError(e), 'error', 3200)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="page" style="max-width:640px;">
    <article class="glass" style="padding:1.5rem;display:grid;gap:1rem;">
      <div>
        <h1 class="section-title">Create Account</h1>
        <p class="section-subtitle">Join TicketRemaster to get started.</p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div class="grid-2">
          <div>
            <label>Email</label>
            <input v-model="form.email" placeholder="you@email.com" autocomplete="off" />
            <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
          </div>
          <div>
            <label>Phone</label>
            <input v-model="form.phone" placeholder="+65..." autocomplete="off" />
            <p v-if="errors.phone" class="field-error">{{ errors.phone }}</p>
          </div>
        </div>
        <div class="grid-2">
          <div>
            <label>Password</label>
            <input v-model="form.password" type="password" autocomplete="new-password" />
            <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
          </div>
          <div>
            <label>Confirm Password</label>
            <input v-model="form.confirm" type="password" autocomplete="new-password" />
            <p v-if="errors.confirm" class="field-error">{{ errors.confirm }}</p>
          </div>
        </div>

        <button :disabled="loading" type="submit" style="width:100%;">
          {{ loading ? 'Creating...' : 'Create Account' }}
        </button>

        <p class="small text-center">
          Already have an account? <RouterLink to="/login" style="color:var(--accent);">Sign in</RouterLink>
        </p>
      </form>
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
.field-error {
  color: #ef4444;
  font-size: 0.82rem;
  margin: 0.25rem 0 0;
}
</style>
