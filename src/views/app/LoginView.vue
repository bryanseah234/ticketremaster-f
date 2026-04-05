<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { AtSymbolIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { isDemoMode } from '@/services/mockData'

const auth = useAuthStore()
const router = useRouter()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
const demoOnly = computed(() => isDemoMode())
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

const openDemoMode = () => {
  router.push('/demo-login')
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
  <section class="page auth-page">
    <div class="auth-shell stitch-auth-shell">
      <article class="glass stitch-auth-card">
        <div class="auth-copy">
          <h1>Welcome Back</h1>
          <p>Sign in to access your digital vault.</p>
        </div>

        <form class="stitch-form" @submit.prevent="submit">
          <div class="field-group">
            <label for="login-email">Email Address</label>
            <div class="field-shell" :class="{ invalid: errors.email }">
              <AtSymbolIcon class="field-icon" />
              <input
                id="login-email"
                v-model="email"
                type="email"
                placeholder="name@example.com"
                autocomplete="email"
                :disabled="demoOnly || loading"
              />
            </div>
            <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
          </div>

          <div class="field-group">
            <div class="field-row">
              <label for="login-password">Password</label>
              <button class="forgot-button" type="button">Forgot Password?</button>
            </div>
            <div class="field-shell" :class="{ invalid: errors.password }">
              <LockClosedIcon class="field-icon" />
              <input
                id="login-password"
                v-model="password"
                type="password"
                placeholder="••••••••"
                autocomplete="current-password"
                :disabled="demoOnly || loading"
              />
            </div>
            <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
          </div>

          <button class="submit-button" :disabled="demoOnly || loading" type="submit">
            {{ loading ? 'Signing In...' : 'Sign In' }}
          </button>
        </form>

        <p class="auth-footer-copy">
          Don’t have an account?
          <RouterLink to="/register">Create an Account</RouterLink>
        </p>

        <div class="demo-launch">
          <div>
            <strong>Experience Demo Mode</strong>
            <p>Instant access to marketplace</p>
          </div>
          <button class="launch-button" type="button" @click="openDemoMode">
            Launch
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 12rem);
  display: grid;
  place-items: center;
}

.stitch-auth-shell {
  width: min(100%, 32rem);
}

.stitch-auth-card {
  display: grid;
  gap: 1.3rem;
  padding: clamp(1.55rem, 4vw, 2.1rem);
  border-radius: 1.55rem;
  background: rgba(34, 31, 30, 0.84);
  border-color: rgba(255, 255, 255, 0.06);
}

.auth-copy {
  text-align: center;
}

.auth-copy h1 {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: clamp(2rem, 5vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.05em;
}

.auth-copy p {
  margin-top: 0.45rem;
  color: var(--textMuted);
  font-size: 0.94rem;
}

.stitch-form {
  display: grid;
  gap: 1rem;
}

.field-group {
  display: grid;
  gap: 0.4rem;
}

.field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.field-shell {
  position: relative;
}

.field-shell input {
  padding-left: 2.85rem;
  border-radius: 0.8rem;
  background: rgba(255, 255, 255, 0.035);
  border-color: rgba(255, 255, 255, 0.06);
}

.field-shell input:disabled {
  color: rgba(255, 255, 255, 0.52);
  background: rgba(255, 255, 255, 0.02);
  border-color: rgba(255, 255, 255, 0.04);
  cursor: not-allowed;
}

.field-shell.invalid input {
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

.forgot-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--textMuted);
  font-size: 0.72rem;
  font-weight: 600;
}

.forgot-button:hover {
  transform: none;
  color: var(--text);
  filter: none;
}

.submit-button {
  width: 100%;
  margin-top: 0.15rem;
  border-radius: 0.8rem;
  padding-block: 0.95rem;
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
  filter: saturate(0.75);
}

.auth-footer-copy {
  color: var(--textMuted);
  text-align: center;
  font-size: 0.86rem;
}

.auth-footer-copy a {
  color: var(--primarySoft);
  font-weight: 700;
}

.demo-launch {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.05rem;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(18, 18, 18, 0.45);
  border-radius: 0.95rem;
}

.demo-launch strong {
  display: block;
  font-size: 0.84rem;
}

.demo-launch p {
  margin-top: 0.2rem;
  color: var(--textMuted);
  font-size: 0.76rem;
  line-height: 1.45;
}

.launch-button {
  flex-shrink: 0;
  padding: 0.58rem 1rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text);
}

@media (max-width: 640px) {
  .demo-launch {
    flex-direction: column;
    align-items: stretch;
  }

  .launch-button {
    width: 100%;
  }
}
</style>
