import { computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import type { AuthUser, UserRole } from '@/types'
import { mockUser, mockAdminUser, mockStaffUser, setDemoMode } from '@/services/mockData'

const DEMO_TOKEN_KEY = 'demo_access_token'
const DEMO_USER_KEY = 'demo_user'
const DEMO_CONTEXT_KEY = 'demo_context'

type DemoContext = 'manual' | 'offline'

const readDemoContext = (): DemoContext | null => {
  const context = sessionStorage.getItem(DEMO_CONTEXT_KEY)
  return context === 'manual' || context === 'offline' ? context : null
}

const clearRealStorage = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

const clearDemoStorage = () => {
  sessionStorage.removeItem(DEMO_TOKEN_KEY)
  sessionStorage.removeItem(DEMO_USER_KEY)
  sessionStorage.removeItem(DEMO_CONTEXT_KEY)
}

const buildDemoUser = (role: UserRole): AuthUser => {
  const sourceUser = role === 'admin' ? mockAdminUser : role === 'staff' ? mockStaffUser : mockUser
  return {
    userId: sourceUser.userId,
    email: sourceUser.email,
    phoneNumber: sourceUser.phoneNumber,
    role: sourceUser.role,
    isFlagged: sourceUser.isFlagged,
    isAdmin: sourceUser.role === 'admin',
  }
}

export const useAuthStore = defineStore('auth', () => {
  const demoToken = sessionStorage.getItem(DEMO_TOKEN_KEY)
  const demoUser = sessionStorage.getItem(DEMO_USER_KEY)

  const state = reactive({
    accessToken: demoToken || localStorage.getItem('access_token') || '',
    refreshToken: localStorage.getItem('refresh_token') || '',
    user: (demoUser ? JSON.parse(demoUser) : JSON.parse(localStorage.getItem('user') || 'null')) as AuthUser | null,
    demoContext: readDemoContext() as DemoContext | null,
  })

  const isLoggedIn = computed(() => Boolean(state.accessToken))
  const isAdmin = computed(() => state.user?.role === 'admin' || Boolean(state.user?.isAdmin))
  const isStaff = computed(() => state.user?.role === 'staff')
  const isDemoSession = computed(() => state.demoContext !== null)
  const isOfflineFallbackDemo = computed(() => state.demoContext === 'offline')

  const setSession = (payload: {
    access_token: string
    refresh_token: string
    user: AuthUser
  }) => {
    clearDemoStorage()
    setDemoMode(false)
    state.accessToken = payload.access_token
    state.refreshToken = payload.refresh_token
    state.user = payload.user
    state.demoContext = null
    localStorage.setItem('access_token', payload.access_token)
    localStorage.setItem('refresh_token', payload.refresh_token)
    localStorage.setItem('user', JSON.stringify(payload.user))
  }

  const clearSession = () => {
    state.accessToken = ''
    state.refreshToken = ''
    state.user = null
    state.demoContext = null
    clearRealStorage()
    clearDemoStorage()
    setDemoMode(false)
  }

  const demoLogin = (role: UserRole, context: DemoContext = 'manual') => {
    const authUser = buildDemoUser(role)
    const token = `demo-${role}-token`

    clearRealStorage()
    setDemoMode(true)

    state.accessToken = token
    state.refreshToken = ''
    state.user = authUser
    state.demoContext = context

    sessionStorage.setItem(DEMO_TOKEN_KEY, token)
    sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(authUser))
    sessionStorage.setItem(DEMO_CONTEXT_KEY, context)
  }

  const downgradeToDemo = () => {
    const role: UserRole =
      state.user?.role === 'admin' || state.user?.isAdmin
        ? 'admin'
        : state.user?.role === 'staff'
        ? 'staff'
        : 'user'

    demoLogin(role, 'offline')
  }

  const restoreFromOfflineFallback = () => {
    if (state.demoContext !== 'offline') return false
    clearSession()
    return true
  }

  return {
    state,
    isLoggedIn,
    isAdmin,
    isStaff,
    isDemoSession,
    isOfflineFallbackDemo,
    setSession,
    clearSession,
    demoLogin,
    downgradeToDemo,
    restoreFromOfflineFallback,
  }
})
