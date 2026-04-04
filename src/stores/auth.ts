import { computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import type { AuthUser, UserRole } from '@/types'
import { mockUser, mockAdminUser, mockStaffUser } from '@/services/mockData'

const DEMO_TOKEN_KEY = 'demo_access_token'
const DEMO_USER_KEY = 'demo_user'

export const useAuthStore = defineStore('auth', () => {
  // Restore from sessionStorage (demo) or localStorage (real session)
  const demoToken = sessionStorage.getItem(DEMO_TOKEN_KEY)
  const demoUser = sessionStorage.getItem(DEMO_USER_KEY)

  const state = reactive({
    accessToken: demoToken || localStorage.getItem('access_token') || '',
    refreshToken: localStorage.getItem('refresh_token') || '',
    user: (demoUser ? JSON.parse(demoUser) : JSON.parse(localStorage.getItem('user') || 'null')) as AuthUser | null,
  })

  const isLoggedIn = computed(() => Boolean(state.accessToken))
  const isAdmin = computed(() => state.user?.role === 'admin')
  const isStaff = computed(() => state.user?.role === 'staff')

  const setSession = (payload: {
    access_token: string
    refresh_token: string
    user: AuthUser
  }) => {
    state.accessToken = payload.access_token
    state.refreshToken = payload.refresh_token
    state.user = payload.user
    localStorage.setItem('access_token', payload.access_token)
    localStorage.setItem('refresh_token', payload.refresh_token)
    localStorage.setItem('user', JSON.stringify(payload.user))
  }

  const clearSession = () => {
    state.accessToken = ''
    state.refreshToken = ''
    state.user = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    sessionStorage.removeItem(DEMO_TOKEN_KEY)
    sessionStorage.removeItem(DEMO_USER_KEY)
  }

  const demoLogin = (role: UserRole) => {
    const sourceUser = role === 'admin' ? mockAdminUser : role === 'staff' ? mockStaffUser : mockUser
    const authUser: AuthUser = {
      userId: sourceUser.userId,
      email: sourceUser.email,
      phoneNumber: sourceUser.phoneNumber,
      role: sourceUser.role,
      isFlagged: sourceUser.isFlagged,
      isAdmin: sourceUser.role === 'admin',
    }
    const token = `demo-${role}-token`
    state.accessToken = token
    state.refreshToken = ''
    state.user = authUser
    sessionStorage.setItem(DEMO_TOKEN_KEY, token)
    sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(authUser))
  }

  return { state, isLoggedIn, isAdmin, isStaff, setSession, clearSession, demoLogin }
})
