<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { mockServices, setDemoMode } from '@/services/mockData'
import type { AuthUser } from '@/types'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const email = ref('demo@ticketremaster.com')
const password = ref('demo1234')
const loading = ref(false)
const error = ref('')

const demoAccounts = [
  { email: 'demo@ticketremaster.com', role: 'user', label: 'Demo User' },
  { email: 'admin@ticketremaster.com', role: 'admin', label: 'Demo Admin' },
  { email: 'staff@ticketremaster.com', role: 'staff', label: 'Demo Staff' },
]

const useDemoAccount = async (accountEmail: string) => {
  email.value = accountEmail
  password.value = 'demo1234'
  await handleDemoLogin()
}

const handleDemoLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    // Enable demo mode
    setDemoMode(true)

    // Use mock auth service
    const result = await mockServices.login(email.value, password.value)

    // Map role to AuthUser
    const role = email.value.includes('admin') ? 'admin' : email.value.includes('staff') ? 'staff' : 'user'
    const authUser: AuthUser = {
      userId: result.user.userId,
      email: result.user.email,
      role: role as AuthUser['role'],
      isFlagged: result.user.isFlagged,
      isAdmin: result.user.isAdmin,
    }

    // Set session
    auth.setSession({
      access_token: result.token,
      refresh_token: 'demo-refresh-token',
      user: authUser,
    })

    toast.success('Demo login successful! You are now in demo mode.')

    // Redirect based on role
    if (role === 'admin') {
      router.push('/admin/events')
    } else if (role === 'staff') {
      router.push('/staff/scan')
    } else {
      router.push('/events')
    }
  } catch (err) {
    error.value = 'Invalid demo credentials. Try demo@ticketremaster.com / demo1234'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <section class="page" style="max-width:640px;">
    <article class="glass" style="padding:1.5rem;display:grid;gap:1rem;">
      <div>
        <h1 class="section-title">Demo Login</h1>
        <p class="section-subtitle">Test the UI without a backend connection</p>
      </div>

      <!-- Demo Mode Banner -->
      <div class="warning-banner">
        <div class="warning-icon">
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </div>
        <div>
          <p class="small" style="margin:0;">
            <strong>Demo Mode:</strong>
            Real actions like purchases and transfers are disabled. Use this mode for UI development and testing.
          </p>
        </div>
      </div>

      <!-- Demo Account Quick Select -->
      <div>
        <h3 class="small" style="margin-bottom:.75rem;">Quick Select Demo Account:</h3>
        <div class="grid-2">
          <button
            v-for="account in demoAccounts"
            :key="account.email"
            @click="useDemoAccount(account.email)"
            :disabled="loading"
            class="demo-account-btn"
          >
            <span class="demo-icon">👤</span>
            {{ account.label }}
          </button>
        </div>
      </div>

      <!-- Manual Login Form -->
      <form class="space-y-4" @submit.prevent="handleDemoLogin">
        <div>
          <label>Email address</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="Email address"
          />
        </div>
        <div>
          <label>Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="Password"
          />
        </div>

        <div v-if="error" class="error-text">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          style="width:100%;"
        >
          {{ loading ? 'Logging in...' : 'Demo Login' }}
        </button>
      </form>

      <!-- Info Section -->
      <div class="info-section">
        <div>
          <h4 class="small" style="margin-bottom:.5rem;"><strong>What you can do in Demo Mode:</strong></h4>
          <ul class="small" style="margin:0;padding-left:1.2rem;">
            <li>Browse events and venues</li>
            <li>View seat maps and select seats</li>
            <li>See the admin dashboard (with demo admin account)</li>
            <li>Test UI interactions and layouts</li>
          </ul>
        </div>
        <div style="margin-top:1rem;">
          <h4 class="small" style="margin-bottom:.5rem;"><strong>What's disabled:</strong></h4>
          <ul class="small" style="margin:0;padding-left:1.2rem;">
            <li>Real purchases and payments</li>
            <li>Ticket transfers</li>
            <li>Account registration</li>
            <li>Real-time updates</li>
          </ul>
        </div>
      </div>

      <!-- Back to regular login -->
      <div class="text-center">
        <a href="/login" class="small" style="color:var(--accent);">Try regular login →</a>
      </div>
    </article>
  </section>
</template>

<style scoped>
.warning-banner {
  display: flex;
  gap: .75rem;
  padding: 1rem;
  background: rgba(250, 204, 21, 0.08);
  border: 1px solid rgba(250, 204, 21, 0.2);
  border-radius: 0.75rem;
  border-left: 4px solid var(--warning);
}
.warning-icon {
  flex-shrink: 0;
  color: var(--warning);
}
.warning-icon svg {
  height: 1.25rem;
  width: 1.25rem;
}
.demo-account-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}
.demo-account-btn:hover:not(:disabled) {
  border-color: var(--accent);
  background: rgba(249, 115, 22, 0.08);
  transform: translateY(-1px);
}
.demo-account-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.demo-icon {
  font-size: 1.1rem;
}
.info-section {
  padding: 1rem;
  background: var(--surface-2);
  border-radius: 0.75rem;
  border: 1px solid var(--border);
}
.error-text {
  color: #ef4444;
  font-size: 0.9rem;
  text-align: center;
}
.text-center {
  text-align: center;
}
.space-y-4 {
  display: grid;
  gap: 1rem;
}
</style>
