import { reactive, computed } from 'vue'

export interface AuthUser {
  user_id: string
  email: string
  phone?: string
  flagged?: boolean
  is_admin?: boolean
}

const state = reactive({
  accessToken: localStorage.getItem('access_token') || '',
  refreshToken: localStorage.getItem('refresh_token') || '',
  user: JSON.parse(localStorage.getItem('user') || 'null') as null | AuthUser,
})

const isLoggedIn = computed(() => Boolean(state.accessToken))
const isAdmin = computed(() => Boolean(state.user?.is_admin))

function setSession(payload: { access_token: string; refresh_token: string; user: AuthUser }) {
  state.accessToken = payload.access_token
  state.refreshToken = payload.refresh_token
  state.user = payload.user
  localStorage.setItem('access_token', payload.access_token)
  localStorage.setItem('refresh_token', payload.refresh_token)
  localStorage.setItem('user', JSON.stringify(payload.user))
}

function clearSession() {
  state.accessToken = ''
  state.refreshToken = ''
  state.user = null
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

export function useAuthStore() {
  return { state, isLoggedIn, isAdmin, setSession, clearSession }
}
