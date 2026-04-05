<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  AtSymbolIcon,
  DevicePhoneMobileIcon,
  LockClosedIcon,
  UserIcon,
} from '@heroicons/vue/24/outline'
import api from '@/api/client'
import { useToast } from '@/composables/useToast'
import { useApiOffline } from '@/composables/useApiOffline'
import { isDemoMode } from '@/services/mockData'

const router = useRouter()
const toast = useToast()
const loading = ref(false)
const apiOffline = useApiOffline()
const demoOnly = computed(() => isDemoMode())
const formDisabled = computed(() => demoOnly.value || apiOffline.value || loading.value)
const demoPanelOffline = computed(() => demoOnly.value || apiOffline.value)

const countryCodes = ['+65', '+1', '+44', '+61']

const form = ref({
  fullName: '',
  email: '',
  countryCode: '+65',
  phoneLocal: '',
  password: '',
})

const errors = reactive({
  fullName: '',
  email: '',
  phone: '',
  password: '',
})

const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const normalizePhone = () => form.value.phoneLocal.replace(/[^\d]/g, '')

const validate = () => {
  errors.fullName = ''
  errors.email = ''
  errors.phone = ''
  errors.password = ''
  let valid = true

  if (!form.value.fullName.trim()) {
    errors.fullName = 'Full name is required'
    valid = false
  }

  if (!form.value.email.trim()) {
    errors.email = 'Email is required'
    valid = false
  } else if (!validateEmail(form.value.email)) {
    errors.email = 'Must be a valid email'
    valid = false
  }

  const phone = normalizePhone()
  if (!phone) {
    errors.phone = 'Phone is required'
    valid = false
  } else if (phone.length < 7 || phone.length > 15) {
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

  return valid
}

const extractError = (e: any) => {
  const status = e?.response?.status
  const code = e?.response?.data?.error_code || e?.response?.data?.error?.code
  if (status === 409 || code === 'EMAIL_ALREADY_EXISTS') return 'This email is already registered.'
  if (status === 400 || code === 'VALIDATION_ERROR') return 'Please check your registration details.'
  return 'Registration failed.'
}

const openDemoMode = () => {
  router.push('/demo-login')
}

const submit = async () => {
  if (demoOnly.value) {
    toast.push('Registration is unavailable while offline. Use one of the seeded demo personas instead.', 'info', 3600)
    openDemoMode()
    return
  }

  if (!validate()) return

  loading.value = true
  try {
    const phoneNumber = `${form.value.countryCode}${normalizePhone()}`
    const response = await api.post('/auth/register', {
      email: form.value.email.trim(),
      phoneNumber,
      password: form.value.password,
    })
    const userId = response.data?.data?.userId
    if (userId) localStorage.setItem('pendingUserId', userId)
    sessionStorage.setItem(
      'verification_success_meta',
      JSON.stringify({
        fullName: form.value.fullName.trim(),
        email: form.value.email.trim(),
        phoneNumber,
      }),
    )
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
  <section class="page register-page">
    <div class="register-shell">
      <article class="glass register-card">
        <div class="register-copy">
          <h1>Create Account</h1>
          <p>Join the curated marketplace for high-end events.</p>
        </div>

        <form class="register-form" @submit.prevent="submit">
          <div class="field-group">
            <label for="register-name">Full Name</label>
            <div class="field-shell" :class="{ invalid: errors.fullName }">
              <UserIcon class="field-icon" />
              <input
                id="register-name"
                v-model="form.fullName"
                type="text"
                placeholder="Enter your name"
                autocomplete="name"
                :disabled="formDisabled"
              />
            </div>
            <p v-if="errors.fullName" class="field-error">{{ errors.fullName }}</p>
          </div>

          <div class="field-group">
            <label for="register-email">Email Address</label>
            <div class="field-shell" :class="{ invalid: errors.email }">
              <AtSymbolIcon class="field-icon" />
              <input
                id="register-email"
                v-model="form.email"
                type="email"
                placeholder="name@example.com"
                autocomplete="email"
                :disabled="formDisabled"
              />
            </div>
            <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
          </div>

          <div class="field-group">
            <label for="register-phone">Phone Number</label>
            <div class="phone-row">
              <div class="select-shell">
                <select v-model="form.countryCode" aria-label="Country code" :disabled="formDisabled">
                  <option v-for="code in countryCodes" :key="code" :value="code">{{ code }}</option>
                </select>
              </div>

              <div class="field-shell phone-shell" :class="{ invalid: errors.phone }">
                <DevicePhoneMobileIcon class="field-icon" />
                <input
                  id="register-phone"
                  v-model="form.phoneLocal"
                  type="tel"
                  placeholder="Phone number"
                  autocomplete="tel-national"
                  :disabled="formDisabled"
                />
              </div>
            </div>
            <p v-if="errors.phone" class="field-error">{{ errors.phone }}</p>
          </div>

          <div class="field-group">
            <label for="register-password">Password</label>
            <div class="field-shell" :class="{ invalid: errors.password }">
              <LockClosedIcon class="field-icon" />
              <input
                id="register-password"
                v-model="form.password"
                type="password"
                placeholder="••••••••"
                autocomplete="new-password"
                :disabled="formDisabled"
              />
            </div>
            <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
          </div>

          <button class="submit-button" :disabled="formDisabled" type="submit">
            {{ loading ? 'Registering...' : 'Register Account' }}
          </button>
        </form>

        <p class="register-footer">
          Already have an account?
          <RouterLink to="/login">Log In</RouterLink>
        </p>

        <div class="demo-panel" :class="{ offline: demoPanelOffline }">
          <div>
            <strong>{{ demoPanelOffline ? 'Offline Demo Mode' : 'Need a fast preview?' }}</strong>
            <p>{{ demoPanelOffline ? 'Live registration is paused, but the three seeded demo personas are still available.' : 'Preview the online layouts with curated demo identities.' }}</p>
          </div>
          <button class="demo-button" type="button" @click="openDemoMode">
            {{ demoPanelOffline ? 'Open Demo Users' : 'Preview Demo' }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.register-page {
  min-height: calc(100vh - 12rem);
  display: grid;
  place-items: center;
}

.register-shell {
  width: min(100%, 30rem);
}

.register-card {
  display: grid;
  gap: 1.35rem;
  padding: clamp(1.6rem, 4vw, 2.15rem);
  border-radius: 1.7rem;
  background: rgba(34, 31, 30, 0.84);
  border-color: rgba(255, 255, 255, 0.06);
}

.register-copy {
  display: grid;
  gap: 0.45rem;
  text-align: center;
}

.register-copy h1 {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: clamp(2rem, 5vw, 2.45rem);
  font-weight: 800;
  letter-spacing: -0.05em;
}

.register-copy p {
  color: var(--textMuted);
  font-size: 0.92rem;
  line-height: 1.6;
}

.register-form {
  display: grid;
  gap: 1rem;
}

.field-group {
  display: grid;
  gap: 0.4rem;
}

.field-shell {
  position: relative;
}

.field-shell input {
  padding-left: 2.85rem;
  border-radius: 0.82rem;
  background: rgba(255, 255, 255, 0.035);
  border-color: rgba(255, 255, 255, 0.06);
}

.field-shell.invalid input,
.phone-shell.invalid input,
.select-shell.invalid select {
  border-color: rgba(255, 140, 122, 0.34);
}

.field-icon {
  position: absolute;
  top: 50%;
  left: 0.95rem;
  width: 1rem;
  height: 1rem;
  color: rgba(255, 255, 255, 0.42);
  transform: translateY(-50%);
  pointer-events: none;
}

.phone-row {
  display: grid;
  grid-template-columns: 6.25rem minmax(0, 1fr);
  gap: 0.55rem;
}

.select-shell select {
  border-radius: 0.82rem;
  background: rgba(255, 255, 255, 0.035);
  border-color: rgba(255, 255, 255, 0.06);
  padding-block: 0.96rem;
  padding-left: 0.95rem;
}

.phone-shell input {
  padding-left: 2.85rem;
}

.submit-button {
  width: 100%;
  margin-top: 0.2rem;
  border-radius: 0.8rem;
  padding-block: 0.98rem;
}

.register-footer {
  color: var(--textMuted);
  text-align: center;
  font-size: 0.84rem;
}

.register-footer a {
  color: var(--primarySoft);
  font-weight: 700;
}

.demo-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.05rem;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 1rem;
  background: rgba(18, 18, 18, 0.45);
}

.demo-panel.offline {
  border-color: rgba(249, 115, 22, 0.16);
  background: rgba(249, 115, 22, 0.08);
}

.demo-panel strong {
  display: block;
  font-size: 0.84rem;
}

.demo-panel p {
  margin-top: 0.2rem;
  color: var(--textMuted);
  font-size: 0.76rem;
  line-height: 1.45;
}

.demo-button {
  flex-shrink: 0;
  padding: 0.58rem 1rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text);
}

@media (max-width: 640px) {
  .phone-row {
    grid-template-columns: 1fr;
  }

  .demo-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .demo-button {
    width: 100%;
  }
}
</style>
