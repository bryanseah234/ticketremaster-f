/**
 * Shared registration state helper
 * Manages pending registration and verification success metadata with TTL enforcement
 */

const PENDING_REGISTRATION_KEY = 'pending_registration'
const VERIFICATION_SUCCESS_KEY = 'verification_success_meta'
const RESUME_WINDOW_MS = 30 * 60 * 1000 // 30 minutes

export interface PendingRegistrationState {
  userId: string
  fullName: string
  email: string
  phoneNumber: string
  createdAt: string
  expiresAt: string
}

export interface VerificationSuccessMeta {
  userId: string
  fullName?: string
  email: string
  phoneNumber: string
  verifiedAt?: string
}

/**
 * Save pending registration state to localStorage
 */
export function savePendingRegistration(state: Omit<PendingRegistrationState, 'createdAt' | 'expiresAt'>): void {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + RESUME_WINDOW_MS)
  
  const fullState: PendingRegistrationState = {
    ...state,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }
  
  localStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(fullState))
}

/**
 * Read pending registration state from localStorage
 * Returns null if expired or not found
 */
export function readPendingRegistration(): PendingRegistrationState | null {
  const raw = localStorage.getItem(PENDING_REGISTRATION_KEY)
  if (!raw) return null
  
  try {
    const state = JSON.parse(raw) as PendingRegistrationState
    const now = new Date()
    const expiresAt = new Date(state.expiresAt)
    
    // Check if expired
    if (now > expiresAt) {
      clearPendingRegistration()
      return null
    }
    
    return state
  } catch {
    clearPendingRegistration()
    return null
  }
}

/**
 * Clear pending registration state from localStorage
 */
export function clearPendingRegistration(): void {
  localStorage.removeItem(PENDING_REGISTRATION_KEY)
  // Also clear legacy keys for backward compatibility
  localStorage.removeItem('pendingUserId')
}

/**
 * Save verification success metadata to sessionStorage
 */
export function saveVerificationSuccessMeta(meta: VerificationSuccessMeta): void {
  sessionStorage.setItem(VERIFICATION_SUCCESS_KEY, JSON.stringify(meta))
}

/**
 * Read verification success metadata from sessionStorage
 * Returns null if not found or malformed
 */
export function readVerificationSuccessMeta(): VerificationSuccessMeta | null {
  const raw = sessionStorage.getItem(VERIFICATION_SUCCESS_KEY)
  if (!raw) return null
  
  try {
    return JSON.parse(raw) as VerificationSuccessMeta
  } catch {
    clearVerificationSuccessMeta()
    return null
  }
}

/**
 * Clear verification success metadata from sessionStorage
 */
export function clearVerificationSuccessMeta(): void {
  sessionStorage.removeItem(VERIFICATION_SUCCESS_KEY)
}
