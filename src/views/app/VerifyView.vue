<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BoltIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useApiOffline } from '@/composables/useApiOffline'
import { isDemoMode } from '@/services/mockData'
import {
  readPendingRegistration,
  clearPendingRegistration,
  saveVerificationSuccessMeta,
} from '@/utils/registrationState'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const apiOffline = useApiOffline()

const userId = ref('')
const otp = ref('')
const loading = ref(false)
const otpInput = ref<HTMLInputElement | null>(null)
const demoOnly = computed(() => isDemoMode() || apiOffline.value)
const otpDigits = computed(() => otp.value.padEnd(6, ' ').slice(0, 6).split(''))
const activeDigitIndex = computed(() => Math.min(otp.value.length, 5))

// Check for pending registration on mount
onMounted(() => {
  const pending = readPendingRegistration()
  if (pending) {
    userId.value = pending.userId
  } else {
    // No valid pending registration
    const hasLegacyUserId = localStorage.getItem('pendingUserId')
    if (hasLegacyUserId) {
      // Clear legacy and show message
      clearPendingRegistration()
      toast.push('Your registration session has expired. Please register again.', 'warning', 4000)
    }
  }
})

const focusOtpInput = () => {
  otpInput.value?.focus()
}

const handleOtpInput = (event: Event) => {
  otp.value = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6)
}

const openDemoMode = () => {
  router.push('/demo-login')
}

const submit = async () => {
  if (demoOnly.value) {
    toast.info('Registration verification is unavailable while offline. Use one of the seeded demo personas instead.', 3600)
    openDemoMode()
    return
  }

  if (!userId.value || otp.value.length < 6) {
    toast.push('Please enter your user ID and the 6-digit OTP.', 'error', 3200)
    return
  }

  loading.value = true
  try {
    const { data } = await api.post('/auth/verify-registration', {
      userId: userId.value,
      otpCode: otp.value,
    })
    const d = data.data
    
    // Save verification success metadata
    saveVerificationSuccessMeta({
      userId: d.user.userId,
      email: d.user.email,
      phoneNumber: d.user.phoneNumber || '',
      verifiedAt: new Date().toISOString(),
    })
    
    auth.setSession({
      access_token: d.token,
      refresh_token: d.token,
      user: {
        userId: d.user.userId,
        email: d.user.email,
        fullName: d.user.fullName || d.user.name,
        phoneNumber: d.user.phoneNumber,
        role: d.user.role,
      },
    })
    
    // Clear pending registration
    clearPendingRegistration()
    
    router.push('/verify/success')
  } catch (e: any) {
    const code = e?.response?.data?.error?.code || e?.response?.data?.error_code
    if (code === 'NO_PENDING_VERIFICATION') toast.push('No pending verification found. Please register again.', 'error', 3200)
    else if (code === 'OTP_INVALID') toast.push('Invalid OTP code. Please try again.', 'error', 3200)
    else toast.push('Verification failed. Please try again.', 'error', 3200)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="page verify-page">
    <header class="verify-header">
      <h1>Verify <span>Account</span></h1>
    </header>

    <div class="verify-shell">
      <article class="glass verify-card">
        <p class="verify-copy">
          {{ demoOnly ? 'Live registration is unavailable right now. Continue with one of the three seeded demo personas instead.' : 'To protect your access, enter the 6-digit security code sent to your registered mobile device.' }}
        </p>

        <div class="otp-grid" @click="focusOtpInput">
          <input
            ref="otpInput"
            class="otp-hidden-input"
            :value="otp"
            maxlength="6"
            inputmode="numeric"
            autocomplete="one-time-code"
            :disabled="demoOnly"
            @input="handleOtpInput"
            @keyup.enter="submit"
          />
          <span
            v-for="(digit, index) in otpDigits"
            :key="index"
            class="otp-box"
            :class="{ active: index === activeDigitIndex }"
          >{{ digit }}</span>
        </div>

        <div class="field-stack">
          <label for="verify-user-id">User ID</label>
          <input id="verify-user-id" v-model="userId" placeholder="USR-..." :readonly="demoOnly" />
        </div>

        <button class="verify-button" :disabled="loading" @click="submit">
          {{ demoOnly ? 'Open Demo Personas' : loading ? 'Verifying...' : 'Verify & Continue' }}
        </button>

        <div class="resend-block">
          <p>{{ demoOnly ? 'Need offline access instead?' : 'Didn’t receive the code?' }}</p>
          <button class="resend-link" type="button" @click="demoOnly ? openDemoMode() : toast.info('Use the latest SMS code from your registration flow.', 2600)">
            {{ demoOnly ? 'Go to Demo Login' : 'Need a new code?' }}
          </button>
        </div>
      </article>

      <div class="trust-grid">
        <article class="glass trust-card">
          <div class="trust-icon">
            <ShieldCheckIcon class="mini-icon" />
          </div>
          <div>
            <span>Protected</span>
            <strong>Identity stays bound to your verified device</strong>
          </div>
        </article>

        <article class="glass trust-card">
          <div class="trust-icon">
            <BoltIcon class="mini-icon" />
          </div>
          <div>
            <span>Fast Access</span>
            <strong>Move directly into your event vault once confirmed</strong>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.verify-page {
  display: grid;
  gap: 1.5rem;
}

.verify-header {
  text-align: center;
}

.verify-header h1 {
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: clamp(2.8rem, 7vw, 4.5rem);
  font-weight: 800;
  letter-spacing: -0.08em;
}

.verify-header span {
  color: var(--primary);
}

.verify-shell {
  display: grid;
  gap: 1.25rem;
  justify-items: center;
}

.verify-card,
.trust-card {
  border-radius: 1.55rem;
  background: rgba(34, 31, 30, 0.84);
  border-color: rgba(255, 255, 255, 0.06);
}

.verify-card {
  width: min(100%, 33rem);
  display: grid;
  gap: 1rem;
  padding: 1.8rem 1.6rem;
  text-align: center;
}

.verify-copy {
  color: var(--textMuted);
  font-size: 0.9rem;
  line-height: 1.6;
}

.otp-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.7rem;
  width: 100%;
  max-width: 27rem;
  margin-inline: auto;
  isolation: isolate;
}

.otp-hidden-input {
  position: absolute;
  inset: 0;
  width: 100%;
  margin: 0;
  padding: 0;
  color: transparent;
  caret-color: var(--primary);
  cursor: pointer;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-appearance: none;
  appearance: none;
  opacity: 0;
  outline: none;
  font-size: 1.5rem;
  letter-spacing: 0.65rem;
  z-index: 2;
}

.otp-box {
  display: grid;
  place-items: center;
  min-height: 4.35rem;
  border-radius: 0.95rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)),
    rgba(19, 16, 15, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 8px 20px rgba(0, 0, 0, 0.18);
  color: #f59a52;
  font-size: 1.55rem;
  font-weight: 800;
  line-height: 1;
  text-shadow: none;
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
  position: relative;
  z-index: 1;
}

.otp-box.active {
  border-color: rgba(249, 115, 22, 0.68);
  background:
    linear-gradient(180deg, rgba(249, 115, 22, 0.14), rgba(249, 115, 22, 0.05)),
    rgba(24, 18, 16, 0.98);
  box-shadow:
    inset 0 0 0 1px rgba(249, 115, 22, 0.22),
    0 0 0 2px rgba(249, 115, 22, 0.12);
  transform: translateY(-1px);
}

.field-stack {
  display: grid;
  gap: 0.45rem;
  text-align: left;
}

.verify-button {
  width: 100%;
  border-radius: 999px;
  padding-block: 0.95rem;
}

.resend-block {
  display: grid;
  gap: 0.2rem;
  justify-items: center;
}

.resend-block p {
  color: var(--textMuted);
  font-size: 0.84rem;
}

.resend-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--primary);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.resend-link:hover {
  transform: none;
  filter: none;
}

.trust-grid {
  width: min(100%, 33rem);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.trust-card {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
}

.trust-icon {
  color: var(--primary);
}

.mini-icon {
  width: 1rem;
  height: 1rem;
}

.trust-card span {
  display: block;
  color: var(--textMuted);
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.trust-card strong {
  font-size: 0.92rem;
}

@media (max-width: 720px) {
  .trust-grid {
    grid-template-columns: 1fr;
  }
}
</style>
