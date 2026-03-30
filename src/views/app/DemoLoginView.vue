<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { mockServices, setDemoMode, mockUser, mockAdminUser, mockStaffUser } from '@/services/mockData'
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

export const mockStaffUser: AuthUser = {
  userId: 'demo-staff-001',
  email: 'staff@ticketremaster.com',
  role: 'staff',
  isFlagged: false,
  isAdmin: false,
}

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

const handleRegularLogin = async () => {
  // This would call the real API
  // For now, just show an error since backend might be down
  toast.error('Backend is unavailable. Please use demo login for UI testing.')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Demo Login
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          Test the UI without a backend connection
        </p>
      </div>

      <!-- Demo Mode Banner -->
      <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              <span class="font-medium">Demo Mode:</span>
              Real actions like purchases and transfers are disabled. Use this mode for UI development and testing.
            </p>
          </div>
        </div>
      </div>

      <!-- Demo Account Quick Select -->
      <div class="mt-6">
        <h3 class="text-sm font-medium text-gray-700 mb-3">Quick Select Demo Account:</h3>
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="account in demoAccounts"
            :key="account.email"
            @click="useDemoAccount(account.email)"
            :disabled="loading"
            class="w-full flex items-center justify-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span class="mr-2">👤</span>
            {{ account.label }}
          </button>
        </div>
      </div>

      <!-- Manual Login Form -->
      <form class="mt-8 space-y-6" @submit.prevent="handleDemoLogin">
        <div class="rounded-md shadow-sm -space-y-px">
          <div>
            <label for="email" class="sr-only">Email address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="appearance-none rounded-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="appearance-none rounded-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
          </div>
        </div>

        <div v-if="error" class="text-red-600 text-sm text-center">
          {{ error }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
              <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            {{ loading ? 'Logging in...' : 'Demo Login' }}
          </button>
        </div>
      </form>

      <!-- Info Section -->
      <div class="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 class="text-sm font-medium text-gray-900 mb-2">What you can do in Demo Mode:</h4>
        <ul class="text-sm text-gray-600 space-y-1">
          <li>• Browse events and venues</li>
          <li>• View seat maps and select seats</li>
          <li>• See the admin dashboard (with demo admin account)</li>
          <li>• Test UI interactions and layouts</li>
        </ul>
        <h4 class="text-sm font-medium text-gray-900 mt-4 mb-2">What's disabled:</h4>
        <ul class="text-sm text-gray-600 space-y-1">
          <li>• Real purchases and payments</li>
          <li>• Ticket transfers</li>
          <li>• Account registration</li>
          <li>• Real-time updates</li>
        </ul>
      </div>

      <!-- Back to regular login -->
      <div class="text-center">
        <a href="/login" class="text-sm text-indigo-600 hover:text-indigo-500">
          Try regular login →
        </a>
      </div>
    </div>
  </div>
</template>
