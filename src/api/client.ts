import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

// API base URL from env, with local fallback for development
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({ baseURL })
const apiKey = import.meta.env.VITE_KONG_API_KEY || ''

let isRefreshing = false
// Queue callbacks for requests waiting on a refreshed access token
let queued: Array<(token: string | null) => void> = []
let offlineNotified = false
;(window as any).__apiOffline = false

const flushQueue = (token: string | null) => {
  queued.forEach((cb) => cb(token))
  queued = []
}

const resolveUrl = (config: any) => {
  const url = config?.url || ''
  if (!url) return baseURL
  if (url.startsWith('http')) return url
  const base = config?.baseURL || baseURL
  return `${String(base).replace(/\/$/, '')}/${String(url).replace(/^\//, '')}`
}

const emitOffline = (message: string) => {
  if (offlineNotified) return
  offlineNotified = true
  ;(window as any).__apiOffline = true
  window.dispatchEvent(new CustomEvent('api:offline', { detail: { message } }))
}

const emitOnline = () => {
  if (!offlineNotified) return
  offlineNotified = false
  ;(window as any).__apiOffline = false
  window.dispatchEvent(new Event('api:online'))
}

const logApiError = (error: any) => {
  const config = error?.config || {}
  const headers = { ...(config?.headers || {}) }
  if (headers.Authorization) delete headers.Authorization
  const status = error?.response?.status
  const errorCode = error?.response?.data?.error_code
  const message = error?.response?.data?.message || error?.message
  const details = {
    method: String(config?.method || 'GET').toUpperCase(),
    url: resolveUrl(config),
    status,
    errorCode,
    message,
    params: config?.params,
    data: config?.data,
    headers,
    response: error?.response?.data,
  }
  console.error('API error', details)
}

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.state.accessToken) {
    config.headers.Authorization = `Bearer ${auth.state.accessToken}`
  }
  if (apiKey && !config.headers.apikey) {
    config.headers.apikey = apiKey
  }
  return config
})

api.interceptors.response.use(
  (response) => {
    emitOnline()
    return response
  },
  async (error) => {
    logApiError(error)
    const toast = useToast()
    const status = error?.response?.status
    const errorCode = error?.response?.data?.error?.code || error?.response?.data?.error_code
    const errorMessage = error?.response?.data?.error?.message || error?.response?.data?.message
    const original = error.config || {}
    const isNetworkError = !error?.response || error?.code === 'ERR_NETWORK'
    if (isNetworkError || status === 502 || status === 503 || status === 504) {
      emitOffline('Backend unavailable. Showing limited demo data.')
    }

    // Refresh the access token once, then retry failed requests
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
        logApiError(refreshErr)
        flushQueue(null)
        auth.clearSession()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    // Map common HTTP errors to user-facing messages
    if (status && status >= 400) {
      const codeMessage = errorCode === 'SEAT_UNAVAILABLE' ? 'Seat is currently unavailable.' :
        errorCode === 'SEAT_ALREADY_SOLD' ? 'Seat has already been sold.' :
        errorCode === 'SEAT_NOT_FOUND' ? 'Seat not found.' :
        errorCode === 'EVENT_NOT_FOUND' ? 'Event not found.' :
        errorCode === 'EVENT_ENDED' ? 'Event has ended.' :
        errorCode === 'HOLD_EXPIRED' ? 'Your seat hold expired.' :
        errorCode === 'INSUFFICIENT_CREDITS' ? 'Not enough credits for this action.' :
        errorCode === 'OTP_REQUIRED' ? 'OTP verification required.' :
        errorCode === 'OTP_INVALID' ? 'OTP code is incorrect.' :
        errorCode === 'OTP_EXPIRED' ? 'OTP code has expired.' :
        errorCode === 'OTP_MAX_RETRIES' ? 'Too many OTP attempts.' :
        errorCode === 'TRANSFER_IN_PROGRESS' ? 'A transfer is already pending.' :
        errorCode === 'TRANSFER_INVALID_STATE' ? 'Transfer is not in the expected state.' :
        errorCode === 'TRANSFER_NOT_FOUND' ? 'Transfer not found.' :
        errorCode === 'NOT_SEAT_OWNER' ? 'You do not own this ticket.' :
        errorCode === 'SELF_TRANSFER' ? 'You cannot transfer to yourself.' :
        errorCode === 'EMAIL_ALREADY_EXISTS' ? 'This email is already registered.' :
        errorCode === 'UNVERIFIED_ACCOUNT' ? 'Please verify your phone number.' :
        errorCode === 'VALIDATION_ERROR' ? 'Please check your input.' :
        ''
      const message = errorMessage || codeMessage ||
        (status === 429 ? 'You are doing that too fast. Please wait a moment before trying again.' :
          status === 403 && !error?.response?.data?.error_code ? 'Access denied. Unusual activity detected.' :
          status === 401 ? 'Please login to continue.' :
          status === 402 ? 'Not enough credits for this action.' :
          status === 404 ? 'Requested data was not found.' :
          status === 409 ? 'This action conflicts with current state.' :
          status === 410 ? 'This action has expired.' :
          'Something went wrong. Please try again.')
      if (message) toast.push(message, 'error')
    }
    return Promise.reject(error)
  },
)

export default api
