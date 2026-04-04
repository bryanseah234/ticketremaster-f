<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const toast = useToast()
const loading = ref(false)
const form = ref({ email: '', phone: '', password: '', confirm: '' })
const errors = reactive({ email: '', phone: '', password: '', confirm: '' })

const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const validatePhone = (value: string) => /^\+?\d{7,15}$/.test(value.replace(/[\s\-()]/g, ''))

const validate = () => {
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

  if (!form.value.phone.trim()) {
    errors.phone = 'Phone is required'
    valid = false
  } else if (!validatePhone(form.value.phone)) {
    errors.phone = 'Invalid phone number'
    valid = false
  }

  if (!form.value.password) {
    errors.password = 'Password is required'
    valid = false
  } else if (form.value.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    valid = false
  }

  if (form.value.confirm !== form.value.password) {
    errors.confirm = 'Passwords do not match'
    valid = false
  }

  return valid
}

const extractError = (e: any) => {
  const status = e?.response?.status
  const code = e?.response?.data?.error_code || e?.response?.data?.error?.code
  if (status === 409 || code === 'EMAIL_ALREADY_EXISTS') return 'This email is already registered.'
  if (status === 400 || code === 'VALIDATION_ERROR') return 'Please check your registration details.'
  return 'Registration failed.'
}

const submit = async () => {
  if (!validate()) return
  loading.value = true
  try {
    const response = await api.post('/auth/register', {
      email: form.value.email,
      phoneNumber: form.value.phone,
      password: form.value.password,
    })
    const userId = response.data?.data?.userId
    if (userId) localStorage.setItem('pendingUserId', userId)
    toast.push('Account created. Verify your phone number to continue.', 'success', 3200)
    router.push('/verify')
  } catch (e: any) {
    toast.push(extractError(e), 'error', 3200)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="page">
    <div class="auth-shell register-shell">
      <article class="glass auth-card">
        <span class="badge">Create Account</span>
        <div>
          <h1 class="section-title">Create your verified TicketRemaster account.</h1>
          <p class="section-subtitle">Register once, verify your number, and manage tickets and transfers in one place.</p>
        </div>

        <form class="auth-form" @submit.prevent="submit">
          <div class="grid-2">
            <div>
              <label>Email</label>
              <input v-model="form.email" placeholder="you@email.com" autocomplete="off" />
              <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
            </div>
            <div>
              <label>Phone Number</label>
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

          <button :disabled="loading" type="submit">{{ loading ? 'Creating...' : 'Create Account' }}</button>
        </form>

        <p class="small muted">
          Already have an account?
          <RouterLink to="/login" class="link-inline">Sign in</RouterLink>
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.register-shell {
  width: min(760px, 100%);
}

.link-inline {
  color: var(--primarySoft);
}
</style>
