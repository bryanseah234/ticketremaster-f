<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const userId = ref(localStorage.getItem('pendingUserId') || '')
const otp = ref('')
const loading = ref(false)

const otpDigits = computed(() => otp.value.padEnd(6, ' ').slice(0, 6).split(''))

const submit = async () => {
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
    auth.setSession({
      access_token: d.token,
      refresh_token: d.token,
      user: {
        userId: d.user.userId,
        email: d.user.email,
        role: d.user.role,
      },
    })
    localStorage.removeItem('pendingUserId')
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
  <section class="page">
    <div class="auth-shell">
      <article class="glass auth-card">
        <span class="badge">Step 2 of 2</span>
        <div>
          <h1 class="section-title">Verify your account.</h1>
          <p class="section-subtitle">Enter the SMS code sent to your phone number to activate your account.</p>
        </div>

        <div class="otp-preview">
          <span v-for="(digit, index) in otpDigits" :key="index" class="otp-cell">{{ digit }}</span>
        </div>

        <form class="auth-form" @submit.prevent="submit">
          <div>
            <label>User ID</label>
            <input v-model="userId" placeholder="USR-..." />
          </div>
          <div>
            <label>OTP Code</label>
            <input v-model="otp" maxlength="6" inputmode="numeric" placeholder="123456" />
          </div>
          <button :disabled="loading" type="submit">{{ loading ? 'Verifying...' : 'Verify & Continue' }}</button>
        </form>
      </article>
    </div>
  </section>
</template>

<style scoped>
.otp-preview {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.55rem;
}

.otp-cell {
  display: grid;
  place-items: center;
  height: 3rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--outlineSoft);
  background: rgba(60, 51, 49, 0.5);
  font-family: "Plus Jakarta Sans", Inter, sans-serif;
  font-size: 1.05rem;
  font-weight: 700;
}
</style>
