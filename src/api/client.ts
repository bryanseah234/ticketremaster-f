import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({ baseURL })

let isRefreshing = false
let queued: Array<(token: string | null) => void> = []

const flushQueue = (token: string | null) => {
  queued.forEach((cb) => cb(token))
  queued = []
}

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.state.accessToken) {
    config.headers.Authorization = `Bearer ${auth.state.accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const toast = useToast()
    const status = error?.response?.status
    const original = error.config || {}

    if (status === 401 && !original._retry) {
      const auth = useAuthStore()
      if (!auth.state.refreshToken) {
        auth.clearSession()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queued.push((token) => {
            if (!token) return reject(error)
            original.headers = original.headers || {}
            original.headers.Authorization = `Bearer ${token}`
            resolve(api.request(original))
          })
        })
      }

      original._retry = true
      isRefreshing = true
      try {
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${auth.state.refreshToken}` },
        })
        const nextAccessToken = refreshResponse?.data?.data?.access_token
        if (!nextAccessToken) throw new Error('Refresh token failed')
        auth.setSession({
          access_token: nextAccessToken,
          refresh_token: auth.state.refreshToken,
          user: auth.state.user!,
        })
        flushQueue(nextAccessToken)
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${nextAccessToken}`
        return api.request(original)
      } catch (refreshErr) {
        flushQueue(null)
        auth.clearSession()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    if (status && status >= 400) {
      const message =
        status === 429 ? 'You are doing that too fast. Please wait a moment before trying again.' :
        status === 403 && !error?.response?.data?.error_code ? 'Access denied. Unusual activity detected.' :
        status === 401 ? 'Please login to continue.' :
        status === 402 ? 'Not enough credits for this action.' :
        status === 404 ? 'Requested data was not found.' :
        status === 409 ? 'This action conflicts with current state.' :
        status === 410 ? 'This action has expired.' :
        'Something went wrong. Please try again.'
      toast.push(message, 'error')
    }
    return Promise.reject(error)
  },
)

export default api
