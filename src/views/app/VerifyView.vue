<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const auth = useAuthStore()
const userId = ref(localStorage.getItem('pendingUserId') || '')
const otp = ref('')
const loading = ref(false)
const toast = useToast()

const otpDigits = computed(() => otp.value.padEnd(6, ' ').slice(0, 6).split(''))

const submit = async () => {
  if (!userId.value || otp.value.length < 6) {
    toast.push('Please enter user ID and a valid 6-digit OTP code.', 'error', 3200)
    return
  }
  loading.value = true
  try {
    const { data } = await api.post('/auth/verify-registration', { userId: userId.value, otpCode: otp.value })
    const d = data.data
    auth.setSession({
      access_token: d.token,
      refresh_token: d.token, // backend issues single token; no separate refresh token
      user: {
        userId: d.user.userId,
        email: d.user.email,
        role: d.user.role,
      },
    })
    localStorage.removeItem('pendingUserId')
    router.push('/events')
  } catch (e: any) {
    const code = e?.response?.data?.error?.code || e?.response?.data?.error_code
    if (code === 'NO_PENDING_VERIFICATION') toast.push('No pending verification found. Please register again.', 'error', 3200)
    else if (code === 'OTP_INVALID') toast.push('Invalid OTP code. Please try again.', 'error', 3200)
    else if (code === 'USER_NOT_FOUND') toast.push('User not found.', 'error', 3200)
    else if (code === 'VALIDATION_ERROR') toast.push('Please enter your user ID and a valid 6-digit OTP.', 'error', 3200)
    else toast.push('Verification failed. Please try again.', 'error', 3200)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="page verify-page">
    <article class="glass verify-card">
      <span class="badge">Step 2 of 2 · Phone Verification</span>
      <h1 class="section-title">Verify your account</h1>
      <p class="small">Enter the 6-digit SMS OTP sent to your registered number to activate your account.</p>

      <div class="otp-preview">
        <span v-for="(digit, idx) in otpDigits" :key="idx" class="cell">{{ digit }}</span>
      </div>

      <div>
        <label>User ID</label>
        <input v-model="userId" placeholder="USR-..." />
      </div>
      <div>
        <label>OTP code</label>
        <input v-model="otp" maxlength="6" inputmode="numeric" placeholder="123456" />
      </div>
      <button :disabled="loading" @click="submit">{{ loading ? 'Verifying...' : 'Verify & continue' }}</button>
    </article>
  </section>
</template>

<style scoped>
.verify-page{max-width:620px}
.verify-card{padding:1rem;display:grid;gap:.75rem}
.otp-preview{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:.45rem}
.cell{display:grid;place-items:center;height:2.4rem;border-radius:.7rem;background:var(--surface-2);border:1px solid var(--border);font-weight:700}
</style>
