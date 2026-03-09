<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const userId = ref(localStorage.getItem('pending_user_id') || '')
const otp = ref('')
const loading = ref(false)
const error = ref('')

const otpDigits = computed(() => otp.value.padEnd(6, ' ').slice(0, 6).split(''))

const submit = async () => {
  error.value = ''
  if (!userId.value || otp.value.length < 6) {
    error.value = 'Please enter user ID and a valid 6-digit OTP code.'
    return
  }
  loading.value = true
  try {
    const { data } = await api.post('/auth/verify-registration', { user_id: userId.value, otp_code: otp.value })
    auth.setSession(data.data)
    localStorage.removeItem('pending_user_id')
    router.push('/events')
  } catch (e: any) {
    const code = e?.response?.data?.error_code
    if (code === 'BAD_REQUEST') error.value = 'Invalid OTP code or no pending verification found.'
    else if (code === 'NOT_FOUND') error.value = 'User not found.'
    else if (code === 'VALIDATION_ERROR') error.value = 'Please check the user ID and OTP code.'
    else error.value = 'Verification failed.'
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
      <p v-if="error" class="small error-text">{{ error }}</p>
      <button :disabled="loading" @click="submit">{{ loading ? 'Verifying...' : 'Verify & continue' }}</button>
    </article>
  </section>
</template>

<style scoped>
.verify-page{max-width:620px}
.verify-card{padding:1rem;display:grid;gap:.75rem}
.otp-preview{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:.45rem}
.cell{display:grid;place-items:center;height:2.4rem;border-radius:.7rem;background:var(--surface-2);border:1px solid var(--border);font-weight:700}
.error-text{color:#fca5a5}
</style>
