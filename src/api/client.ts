import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const api = axios.create()
const apiKey = import.meta.env.VITE_KONG_API_KEY || ''

let offlineNotified = false;
(window as any).__apiOffline = false

const emitOffline = (message: string) => {
  if (offlineNotified) return
  offlineNotified = true;
  (window as any).__apiOffline = true
  window.dispatchEvent(new CustomEvent('api:offline', { detail: { message } }))
}

const emitOnline = () => {
  if (!offlineNotified) return
  offlineNotified = false;
  (window as any).__apiOffline = false
  window.dispatchEvent(new Event('api:online'))
}

const resolveUrl = (config: any) => {
  const url = config?.url || ''
  if (url.startsWith('http')) return url
  const base = config?.baseURL || ''
  return `${String(base).replace(/\/$/, '')}/${String(url).replace(/^\//, '')}`
}

const logApiError = (error: any) => {
  const config = error?.config || {}
  const headers = { ...(config?.headers || {}) }
  if (headers.Authorization) delete headers.Authorization
  const status = error?.response?.status
  const errorCode = error?.response?.data?.error_code || error?.response?.data?.error?.code
  const message = error?.response?.data?.message || error?.response?.data?.error?.message || error?.message
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

// Request Interceptor: Dynamically route requests to the correct Orchestrator
api.interceptors.request.use((config) => {
  const url = config.url || '';
  
  if (url.startsWith('/auth')) {
    config.baseURL = import.meta.env.VITE_AUTH_ORCHESTRATOR_URL;
  }
  else if (url.startsWith('/events')) {
    config.baseURL = import.meta.env.VITE_EVENT_ORCHESTRATOR_URL;
  }
  else if (url.startsWith('/credits')) config.baseURL = import.meta.env.VITE_CREDIT_ORCHESTRATOR_URL;
  else if (url.startsWith('/tickets/purchase') || url.startsWith('/purchase')) config.baseURL = import.meta.env.VITE_TICKET_PURCHASE_ORCHESTRATOR_URL;
  else if (url.startsWith('/qr') || url.startsWith('/verify-qr')) config.baseURL = import.meta.env.VITE_QR_ORCHESTRATOR_URL;
  else if (url.startsWith('/marketplace')) config.baseURL = import.meta.env.VITE_MARKETPLACE_ORCHESTRATOR_URL;
  else if (url.startsWith('/transfer')) config.baseURL = import.meta.env.VITE_TRANSFER_ORCHESTRATOR_URL;
  else if (url.startsWith('/verify-ticket')) config.baseURL = import.meta.env.VITE_TICKET_VERIFICATION_ORCHESTRATOR_URL;
  else config.baseURL = import.meta.env.VITE_EVENT_ORCHESTRATOR_URL; // fallback for /events, /venues, /tickets

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
    return response;
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

    // Since backend has no refresh tokens, we simply clear session and bounce to login
    // Skip this for auth/login itself — wrong password returns 401 and should be handled in LoginView
    const isLoginRequest = error?.config?.url?.includes('/auth/login')
    if (status === 401 && !isLoginRequest) {
      const auth = useAuthStore()
      auth.clearSession()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // If the current user's own record returns 404, their account no longer exists — force logout
    if (status === 404) {
      const auth = useAuthStore()
      const userId = auth.state.user?.userId
      const url = resolveUrl(error.config)
      if (userId && url.includes(`/users/${userId}`)) {
        auth.clearSession()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    // Map common HTTP errors to user-facing messages
    const isScanRoute = resolveUrl(error.config).includes('/scan/verify/')
    if (status && status >= 400 && !isScanRoute) {
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
          status === 403 && !errorCode ? 'Access denied. Unusual activity detected.' :
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
